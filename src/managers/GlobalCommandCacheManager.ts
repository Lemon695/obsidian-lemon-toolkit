import { App } from "obsidian";
import LemonToolkitPlugin from "../main";

export interface CachedCommand {
	id: string;
	name: string;
	pluginId: string;
	pluginName: string;
}

export interface CommandCacheData {
	commands: CachedCommand[];
	lastUpdated: number;
	commandCount: number; // Track command count to detect changes
}

/**
 * Manages global command cache for faster loading
 */
export class GlobalCommandCacheManager {
	private plugin: LemonToolkitPlugin;
	private cache: CommandCacheData | null = null;
	private filePath: string;
	private updateInterval: NodeJS.Timeout | null = null;
	private commandExecutionCount: number = 0;
	
	// Configuration
	private readonly AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
	private readonly REFRESH_AFTER_COMMANDS = 50; // Refresh after 50 commands
	private readonly CACHE_VALIDITY = 10 * 60 * 1000; // Cache valid for 10 minutes

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
		this.filePath = `${plugin.manifest.dir}/cache/global-commands.json`;
	}

	async load(): Promise<void> {
		try {
			const data = await this.plugin.app.vault.adapter.read(this.filePath);
			this.cache = JSON.parse(data);
		} catch (e) {
			// Cache doesn't exist, will be created on first refresh
			this.cache = null;
		}
	}

	async save(): Promise<void> {
		if (!this.cache) return;
		
		await this.ensureCacheDirectory();
		await this.plugin.app.vault.adapter.write(
			this.filePath,
			JSON.stringify(this.cache, null, 2)
		);
	}

	private async ensureCacheDirectory(): Promise<void> {
		const dirPath = `${this.plugin.manifest.dir}/cache`;
		try {
			await this.plugin.app.vault.adapter.mkdir(dirPath);
		} catch (e) {
			// Directory already exists
		}
	}

	/**
	 * Start automatic refresh
	 */
	startAutoRefresh(): void {
		// Initial refresh
		this.refreshCache();

		// Auto refresh every 5 minutes
		this.updateInterval = setInterval(() => {
			this.refreshCache();
		}, this.AUTO_REFRESH_INTERVAL);
	}

	/**
	 * Stop automatic refresh
	 */
	stopAutoRefresh(): void {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
	}

	/**
	 * Track command execution and refresh if needed
	 */
	trackCommandExecution(): void {
		this.commandExecutionCount++;
		
		if (this.commandExecutionCount >= this.REFRESH_AFTER_COMMANDS) {
			this.commandExecutionCount = 0;
			this.refreshCache();
		}
	}

	/**
	 * Refresh command cache
	 */
	async refreshCache(): Promise<void> {
		const allCommands = (this.plugin.app as any).commands.commands;
		const commands: CachedCommand[] = [];

		Object.keys(allCommands).forEach((commandId) => {
			const command = allCommands[commandId];
			
			let pluginId = "obsidian";
			let pluginName = "Obsidian";
			
			if (commandId.includes(":")) {
				pluginId = commandId.split(":")[0];
				pluginName = this.getPluginDisplayName(pluginId);
			}

			commands.push({
				id: commandId,
				name: command.name,
				pluginId,
				pluginName
			});
		});

		this.cache = {
			commands,
			lastUpdated: Date.now(),
			commandCount: commands.length
		};

		await this.save();
	}

	/**
	 * Get cached commands (returns immediately, refreshes in background if stale)
	 */
	getCommands(): CachedCommand[] {
		// Check if cache needs refresh (do it in background)
		if (!this.cache || this.isCacheStale()) {
			// Refresh in background
			this.refreshCache();
			
			// Return empty array if no cache yet (first load)
			if (!this.cache) return [];
		}

		return this.cache.commands;
	}

	/**
	 * Check if cache is stale
	 */
	private isCacheStale(): boolean {
		if (!this.cache) return true;
		
		const now = Date.now();
		const age = now - this.cache.lastUpdated;
		
		// Cache is stale if older than validity period
		if (age > this.CACHE_VALIDITY) return true;
		
		// Check if command count changed (plugin enabled/disabled)
		const currentCommandCount = Object.keys((this.plugin.app as any).commands.commands).length;
		if (currentCommandCount !== this.cache.commandCount) return true;
		
		return false;
	}

	/**
	 * Force refresh cache
	 */
	async forceRefresh(): Promise<void> {
		await this.refreshCache();
	}

	/**
	 * Get plugin display name
	 */
	private getPluginDisplayName(pluginId: string): string {
		const nameMap: Record<string, string> = {
			'editor': 'Obsidian',
			'workspace': 'Obsidian',
			'file-explorer': 'Obsidian',
			'global-search': 'Obsidian',
			'switcher': 'Obsidian',
			'graph': 'Obsidian',
			'backlink': 'Obsidian',
			'outgoing-link': 'Obsidian',
			'tag-pane': 'Obsidian',
			'page-preview': 'Obsidian',
			'templates': 'Obsidian',
			'note-composer': 'Obsidian',
			'command-palette': 'Obsidian',
			'markdown-importer': 'Obsidian',
			'word-count': 'Obsidian',
			'open-with-default-app': 'Obsidian',
			'file-recovery': 'Obsidian',
		};

		if (nameMap[pluginId]) {
			return nameMap[pluginId];
		}

		const plugins = (this.plugin.app as any).plugins;
		if (plugins && plugins.manifests && plugins.manifests[pluginId]) {
			return plugins.manifests[pluginId].name;
		}

		return pluginId.split('-').map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	}
}
