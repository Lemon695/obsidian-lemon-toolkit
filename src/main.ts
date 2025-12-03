import { Plugin, WorkspaceLeaf } from "obsidian";
import { registerCommands } from "./commands";
import { LemonToolkitSettings, DEFAULT_SETTINGS } from "./settings";
import { LemonToolkitSettingTab } from "./ui/SettingTab";
import { FileInfoView, FILE_INFO_VIEW_TYPE } from "./views/FileInfoView";

export default class LemonToolkitPlugin extends Plugin {
	settings: LemonToolkitSettings;
	private fileTagsCache: Map<string, Set<string>> = new Map();

	async onload() {
		await this.loadSettings();
		
		// Register file info view
		this.registerView(
			FILE_INFO_VIEW_TYPE,
			(leaf) => new FileInfoView(leaf, this)
		);

		// Add ribbon icon
		this.addRibbonIcon("info", "Open File Info", () => {
			this.activateFileInfoView();
		});

		registerCommands(this);
		this.addSettingTab(new LemonToolkitSettingTab(this.app, this));
		this.registerEventListeners();
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
		const now = Date.now();
		const history = this.settings.folderMoveHistory[folderPath] || {
			count: 0,
			lastMoved: 0,
			timestamps: [],
		};

		history.count++;
		history.lastMoved = now;
		history.timestamps.push(now);

		// Keep only last 100 timestamps
		if (history.timestamps.length > 100) {
			history.timestamps = history.timestamps.slice(-100);
		}

		this.settings.folderMoveHistory[folderPath] = history;
		await this.saveSettings();
	}

	async recordTagUsage(tags: string[], updateLastUsed: boolean = true): Promise<void> {
		const now = Date.now();

		tags.forEach((tag) => {
			const history = this.settings.tagUsageHistory[tag] || {
				lastUsed: 0,
				timestamps: [],
			};

			if (updateLastUsed) {
				history.lastUsed = now;
			}
			history.timestamps.push(now);

			// Keep only last 100 timestamps
			if (history.timestamps.length > 100) {
				history.timestamps = history.timestamps.slice(-100);
			}

			this.settings.tagUsageHistory[tag] = history;
		});

		await this.saveSettings();
	}

	async recordCommandUsage(commandId: string): Promise<void> {
		const now = Date.now();
		const history = this.settings.commandHistory[commandId] || {
			lastUsed: 0,
			useCount: 0,
		};

		history.lastUsed = now;
		history.useCount++;

		this.settings.commandHistory[commandId] = history;
		await this.saveSettings();
	}

	onunload() {
		// Detach file info view
		this.app.workspace.detachLeavesOfType(FILE_INFO_VIEW_TYPE);
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
