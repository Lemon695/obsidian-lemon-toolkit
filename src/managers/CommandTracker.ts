import { App } from "obsidian";
import LemonToolkitPlugin from "../main";

export interface CommandRecord {
	lastUsed: number;
	useCount: number;
}

export interface CommandHistory {
	[commandId: string]: CommandRecord;
}

/**
 * Base class for command history storage
 */
export abstract class CommandHistoryStorage {
	protected plugin: LemonToolkitPlugin;
	protected history: CommandHistory = {};
	protected filePath: string;
	protected saveTimeout: NodeJS.Timeout | null = null;

	constructor(plugin: LemonToolkitPlugin, fileName: string) {
		this.plugin = plugin;
		this.filePath = `${plugin.manifest.dir}/statistics-data/${fileName}`;
	}

	async load(): Promise<void> {
		try {
			const data = await this.plugin.app.vault.adapter.read(this.filePath);
			this.history = JSON.parse(data);
		} catch (e) {
			this.history = {};
			await this.ensureDirectory();
		}
	}

	async save(): Promise<void> {
		await this.ensureDirectory();
		await this.plugin.app.vault.adapter.write(
			this.filePath,
			JSON.stringify(this.history, null, 2)
		);
	}

	private async ensureDirectory(): Promise<void> {
		const dirPath = `${this.plugin.manifest.dir}/statistics-data`;
		try {
			await this.plugin.app.vault.adapter.mkdir(dirPath);
		} catch (e) {
			// Directory already exists
		}
	}

	recordUsage(commandId: string): void {
		const now = Date.now();
		if (!this.history[commandId]) {
			this.history[commandId] = { lastUsed: now, useCount: 0 };
		}
		this.history[commandId].lastUsed = now;
		this.history[commandId].useCount++;
		this.debouncedSave();
	}

	getHistory(commandId: string): CommandRecord | null {
		return this.history[commandId] || null;
	}

	getAllHistory(): CommandHistory {
		return this.history;
	}

	clearHistory(): void {
		this.history = {};
	}

	clearOldRecords(cutoffTime: number): void {
		Object.keys(this.history).forEach(commandId => {
			if (this.history[commandId].lastUsed < cutoffTime) {
				delete this.history[commandId];
			}
		});
	}

	private debouncedSave(): void {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}
		this.saveTimeout = setTimeout(() => {
			this.save();
		}, 1000);
	}
}

/**
 * Storage for plugin-specific commands (Lemon Toolkit commands)
 */
export class PluginCommandStorage extends CommandHistoryStorage {
	constructor(plugin: LemonToolkitPlugin) {
		super(plugin, "plugin-commands.json");
	}
}

/**
 * Storage for all global commands
 */
export class GlobalCommandStorage extends CommandHistoryStorage {
	constructor(plugin: LemonToolkitPlugin) {
		super(plugin, "global-commands.json");
	}
}

/**
 * Storage for statistics panel
 */
export class StatisticsCommandStorage extends CommandHistoryStorage {
	constructor(plugin: LemonToolkitPlugin) {
		super(plugin, "statistics-commands.json");
	}
}

/**
 * Storage for plugin usage tracking
 */
export class PluginUsageStorage extends CommandHistoryStorage {
	constructor(plugin: LemonToolkitPlugin) {
		super(plugin, "plugin-usage.json");
	}
}

/**
 * Central command tracker - dispatches command execution to all storages
 */
export class CommandTracker {
	private plugin: LemonToolkitPlugin;
	private pluginCommandStorage: PluginCommandStorage;
	private globalCommandStorage: GlobalCommandStorage;
	private statisticsCommandStorage: StatisticsCommandStorage;
	private pluginUsageStorage: PluginUsageStorage;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
		this.pluginCommandStorage = new PluginCommandStorage(plugin);
		this.globalCommandStorage = new GlobalCommandStorage(plugin);
		this.statisticsCommandStorage = new StatisticsCommandStorage(plugin);
		this.pluginUsageStorage = new PluginUsageStorage(plugin);
	}

	async load(): Promise<void> {
		await Promise.all([
			this.pluginCommandStorage.load(),
			this.globalCommandStorage.load(),
			this.statisticsCommandStorage.load(),
			this.pluginUsageStorage.load()
		]);
	}

	/**
	 * Track a command execution - updates all relevant storages
	 */
	trackCommand(commandId: string): void {
		// Always track in global commands
		this.globalCommandStorage.recordUsage(commandId);

		// Track in plugin commands if it's a Lemon Toolkit command
		if (commandId.startsWith("lemon-toolkit:")) {
			this.pluginCommandStorage.recordUsage(commandId);
			this.statisticsCommandStorage.recordUsage(commandId);
		}

		// Track plugin usage (extract plugin ID from command ID)
		if (commandId.includes(":")) {
			const pluginId = commandId.split(":")[0];
			this.pluginUsageStorage.recordUsage(pluginId);
		}
	}

	// Getters for each storage
	getPluginCommandStorage(): PluginCommandStorage {
		return this.pluginCommandStorage;
	}

	getGlobalCommandStorage(): GlobalCommandStorage {
		return this.globalCommandStorage;
	}

	getStatisticsCommandStorage(): StatisticsCommandStorage {
		return this.statisticsCommandStorage;
	}

	getPluginUsageStorage(): PluginUsageStorage {
		return this.pluginUsageStorage;
	}
}
