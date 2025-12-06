import { Plugin, WorkspaceLeaf } from "obsidian";
import { registerCommands } from "./commands";
import { LemonToolkitSettings, DEFAULT_SETTINGS } from "./settings";
import { LemonToolkitSettingTab } from "./ui/SettingTab";
import { FileInfoView, FILE_INFO_VIEW_TYPE } from "./views/FileInfoView";
import { RecentFilesView, RECENT_FILES_VIEW_TYPE } from "./views/RecentFilesView";
import { ExternalAppManager } from "./features/external-apps/ExternalAppManager";
import { StatisticsManager } from "./features/statistics/StatisticsManager";
import { RenameHistoryManager } from "./features/rename/RenameHistoryManager";
import { FolderMoveHistoryManager } from "./features/move/FolderMoveHistoryManager";
import { TagUsageHistoryManager } from "./features/tags/TagUsageHistoryManager";
import { CommandHistoryManager } from "./features/commands/CommandHistoryManager";
import { RecentFilesManager } from "./features/recent-files/RecentFilesManager";
import { ClipboardRulesManager } from "./features/smart-paste/ClipboardRulesManager";
import { PluginMetadataManager } from "./features/plugin-usage/PluginMetadataManager";
import {t} from "./i18n/locale";

export default class LemonToolkitPlugin extends Plugin {
	settings: LemonToolkitSettings;
	private fileTagsCache: Map<string, Set<string>> = new Map();
	private externalAppManager: ExternalAppManager;
	statisticsManager: StatisticsManager;
	renameHistoryManager: RenameHistoryManager;
	folderMoveHistoryManager: FolderMoveHistoryManager;
	tagUsageHistoryManager: TagUsageHistoryManager;
	commandHistoryManager: CommandHistoryManager;
	recentFilesManager: RecentFilesManager;
	clipboardRulesManager: ClipboardRulesManager;
	pluginMetadataManager: PluginMetadataManager;
	private saveTimeout: NodeJS.Timeout | null = null;
	private recentCommands: Map<string, number> = new Map(); // For deduplication

	async onload() {
		console.log(t('loadingPlugin') + this.manifest.version);

		// 调试语言设置
		//debugLocale();

		await this.loadSettings();
		
		// Initialize external app manager
		this.externalAppManager = new ExternalAppManager(this);
		
		// Initialize statistics manager
		this.statisticsManager = new StatisticsManager(
			this,
			this.app,
			this.settings.statistics
		);
		await this.statisticsManager.initialize();
		
		// Initialize rename history manager
		this.renameHistoryManager = new RenameHistoryManager(this);
		await this.renameHistoryManager.load();
		
		// Initialize folder move history manager
		this.folderMoveHistoryManager = new FolderMoveHistoryManager(this);
		await this.folderMoveHistoryManager.load();
		
		// Initialize tag usage history manager
		this.tagUsageHistoryManager = new TagUsageHistoryManager(this);
		await this.tagUsageHistoryManager.load();
		
		// Initialize command history manager
		this.commandHistoryManager = new CommandHistoryManager(this);
		await this.commandHistoryManager.load();
		
		// Initialize recent files manager
		this.recentFilesManager = new RecentFilesManager(this);
		await this.recentFilesManager.load();
		
		// Initialize clipboard rules manager
		this.clipboardRulesManager = new ClipboardRulesManager(this);
		await this.clipboardRulesManager.load();
		
		// Initialize plugin metadata manager
		this.pluginMetadataManager = new PluginMetadataManager(this);
		await this.pluginMetadataManager.load();
		this.pluginMetadataManager.startPeriodicScan();
		
		// Register views
		this.registerView(
			FILE_INFO_VIEW_TYPE,
			(leaf) => new FileInfoView(leaf, this)
		);
		
		this.registerView(
			RECENT_FILES_VIEW_TYPE,
			(leaf) => new RecentFilesView(leaf, this)
		);

		// Add ribbon icon
		this.addRibbonIcon("info", "Open File Info", () => {
			this.activateFileInfoView();
		});

		registerCommands(this);
		this.externalAppManager.registerCommands();
		
		// Register statistics command
		this.addCommand({
			id: 'show-statistics',
			name: t('showStatistics'),
			callback: () => {
				this.statisticsManager.openModal();
			}
		});
		
		// Hook into global command execution to track all plugin commands
		this.registerGlobalCommandListener();
		
		this.addSettingTab(new LemonToolkitSettingTab(this.app, this));
		this.registerEventListeners();
	}

	reloadExternalAppCommands(): void {
		// Note: Obsidian doesn't provide a way to unregister commands
		// So we need to reload the plugin for changes to take effect
		// Or we can just inform the user to reload
		this.externalAppManager.registerCommands();
	}

	private registerEventListeners(): void {
		// Listen for file rename/move events
		this.registerEvent(
			this.app.vault.on("rename", async (file, oldPath) => {
				// Check if it's a file (not a folder) and if the parent folder changed
				if (file.parent) {
					const oldParentPath = oldPath.substring(0, oldPath.lastIndexOf("/"));
					const newParentPath = file.parent.path;

					// If parent folder changed, record the move
					if (oldParentPath !== newParentPath) {
						await this.recordFolderMove(newParentPath);
					}
				}
			})
		);

		// Listen for file modifications to track tag usage
		this.registerEvent(
			this.app.metadataCache.on("changed", async (file) => {
				const cache = this.app.metadataCache.getFileCache(file);
				if (!cache) return;

				const currentTags: string[] = [];

				// Get inline tags
				if (cache.tags) {
					currentTags.push(...cache.tags.map((t) => t.tag));
				}

				// Get frontmatter tags
				if (cache.frontmatter?.tags) {
					const frontmatterTags = cache.frontmatter.tags;
					const tagList = Array.isArray(frontmatterTags) ? frontmatterTags : [frontmatterTags];
					currentTags.push(...tagList.map((t) => (t.startsWith("#") ? t : `#${t}`)));
				}

				// Check if tags have changed
				const currentTagSet = new Set(currentTags);
				const previousTagSet = this.fileTagsCache.get(file.path) || new Set();

				// Find new tags (tags that weren't in the previous set)
				const newTags = currentTags.filter((tag) => !previousTagSet.has(tag));

				// Update cache
				this.fileTagsCache.set(file.path, currentTagSet);

				// Record only new tags with lastUsed update
				if (newTags.length > 0) {
					await this.recordTagUsage(newTags, true);
				}
			})
		);
	}

	async recordFolderMove(folderPath: string): Promise<void> {
		await this.folderMoveHistoryManager.recordMove(folderPath);
	}

	async recordTagUsage(tags: string[], updateLastUsed: boolean = true): Promise<void> {
		await this.tagUsageHistoryManager.recordUsage(tags, updateLastUsed);
	}

	async recordCommandUsage(commandId: string): Promise<void> {
		const now = Date.now();
		
		// Deduplication: ignore if same command was recorded within 100ms
		const lastRecorded = this.recentCommands.get(commandId);
		if (lastRecorded && (now - lastRecorded) < 100) {
			console.log('Lemon Toolkit: Skipping duplicate command:', commandId);
			return;
		}
		this.recentCommands.set(commandId, now);
		
		// Record to commandHistory (for command palette sorting)
		await this.commandHistoryManager.recordUsage(commandId);
		
		// Record to pluginUsageHistory (for plugin usage statistics)
		const pluginHistory = this.settings.pluginUsageHistory[commandId] || {
			lastUsed: 0,
			useCount: 0,
		};
		pluginHistory.lastUsed = now;
		pluginHistory.useCount++;
		this.settings.pluginUsageHistory[commandId] = pluginHistory;
		
		// Debounce save to avoid too frequent writes
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}
		this.saveTimeout = setTimeout(() => {
			this.saveSettings();
		}, 1000);
	}

	/**
	 * Register global command listener to track all plugin commands
	 */
	private registerGlobalCommandListener(): void {
		const commands = (this.app as any).commands;
		if (!commands) {
			console.log('Lemon Toolkit: Commands object not found');
			return;
		}

		const self = this;

		// Hook 1: executeCommandById (for programmatic execution and buttons)
		const originalExecuteById = commands.executeCommandById?.bind(commands);
		if (originalExecuteById) {
			commands.executeCommandById = function(commandId: string, ...args: any[]) {
				console.log('Lemon Toolkit: executeCommandById:', commandId);
				
				if (commandId && commandId.includes(':')) {
					self.recordCommandUsage(commandId);
				}

				return originalExecuteById(commandId, ...args);
			};

			this.register(() => {
				commands.executeCommandById = originalExecuteById;
			});
		}

		// Hook 2: executeCommand (for command palette)
		const originalExecuteCommand = commands.executeCommand?.bind(commands);
		if (originalExecuteCommand) {
			commands.executeCommand = function(command: any) {
				const commandId = command?.id;
				console.log('Lemon Toolkit: executeCommand:', commandId);
				
				if (commandId && commandId.includes(':')) {
					self.recordCommandUsage(commandId);
				}

				return originalExecuteCommand(command);
			};

			this.register(() => {
				commands.executeCommand = originalExecuteCommand;
			});
		}

		// Hook 3: Try to hook into command objects directly
		const allCommands = commands.commands;
		if (allCommands) {
			Object.keys(allCommands).forEach(commandId => {
				if (!commandId.includes(':')) return; // Skip core commands
				
				const command = allCommands[commandId];
				if (!command) return;

				// Hook callback
				if (command.callback) {
					const originalCallback = command.callback.bind(command);
					command.callback = function(...args: any[]) {
						console.log('Lemon Toolkit: Direct callback:', commandId);
						self.recordCommandUsage(commandId);
						return originalCallback(...args);
					};
				}

				// Hook editorCallback
				if (command.editorCallback) {
					const originalEditorCallback = command.editorCallback.bind(command);
					command.editorCallback = function(...args: any[]) {
						console.log('Lemon Toolkit: Direct editorCallback:', commandId);
						self.recordCommandUsage(commandId);
						return originalEditorCallback(...args);
					};
				}

				// Note: We don't hook checkCallback and editorCheckCallback
				// because they are called to check if command is available,
				// not to execute the command. Hooking them would cause
				// false recordings when opening command palette.
			});
		}

		console.log('Lemon Toolkit: Global command listener registered');
	}

	/**
	 * Try to hook into command palette to track command executions
	 */
	private tryHookCommandPalette(): void {
		// This method is now integrated into registerGlobalCommandListener
	}

	onunload() {
		// Cleanup statistics manager
		if (this.statisticsManager) {
			this.statisticsManager.destroy();
		}
		
		// Stop plugin metadata scanning
		if (this.pluginMetadataManager) {
			this.pluginMetadataManager.stopPeriodicScan();
		}
		
		// Detach views
		this.app.workspace.detachLeavesOfType(FILE_INFO_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(RECENT_FILES_VIEW_TYPE);
	}

	async activateFileInfoView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(FILE_INFO_VIEW_TYPE);

		if (leaves.length > 0) {
			// View already exists, reveal it
			leaf = leaves[0];
		} else {
			// Create new view in right sidebar
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: FILE_INFO_VIEW_TYPE, active: true });
		}

		// Reveal the leaf
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
