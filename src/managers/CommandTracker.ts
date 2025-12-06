import { App } from "obsidian";
import LemonToolkitPlugin from "../main";

export interface CommandRecord {
	lastUsed: number;
	useCount: number;
	recentTimestamps?: number[];  // 最近 24 小时的精确时间戳
	dailyCount?: {
		[date: string]: number;    // 超过 24 小时的按天聚合 "2025-01-06": 45
	};
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
		const today = new Date(now).toISOString().split('T')[0];
		const oneDayAgo = now - 24 * 60 * 60 * 1000;
		
		if (!this.history[commandId]) {
			this.history[commandId] = { 
				lastUsed: now, 
				useCount: 0,
				recentTimestamps: [],
				dailyCount: {}
			};
		}
		
		const record = this.history[commandId];
		record.lastUsed = now;
		record.useCount++;
		
		// Initialize if needed
		if (!record.recentTimestamps) record.recentTimestamps = [];
		if (!record.dailyCount) record.dailyCount = {};
		
		// 1. Add to recent timestamps
		record.recentTimestamps.push(now);
		
		// 2. Aggregate timestamps older than 24 hours to dailyCount
		const oldTimestamps = record.recentTimestamps.filter(ts => ts < oneDayAgo);
		if (oldTimestamps.length > 0) {
			oldTimestamps.forEach(ts => {
				const date = new Date(ts).toISOString().split('T')[0];
				record.dailyCount![date] = (record.dailyCount![date] || 0) + 1;
			});
			
			// Keep only recent 24 hours
			record.recentTimestamps = record.recentTimestamps.filter(ts => ts >= oneDayAgo);
		}
		
		// 3. Clean up data older than 1 year
		const oneYearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
		Object.keys(record.dailyCount).forEach(date => {
			if (date < oneYearAgo) {
				delete record.dailyCount![date];
			}
		});
		
		this.debouncedSave();
	}

	getHistory(commandId: string): CommandRecord | null {
		return this.history[commandId] || null;
	}

	/**
	 * Get command usage count within a specific time range
	 */
	getCountInTimeRange(commandId: string, hours: number): number {
		const record = this.history[commandId];
		if (!record) return 0;
		
		const now = Date.now();
		
		// All time
		if (hours === 0) {
			return record.useCount;
		}
		
		// Within 24 hours: use precise timestamps
		if (hours <= 24) {
			const cutoff = now - hours * 60 * 60 * 1000;
			return (record.recentTimestamps || []).filter(ts => ts >= cutoff).length;
		}
		
		// Beyond 24 hours: use daily aggregation + recent timestamps
		const cutoffDate = new Date(now - hours * 60 * 60 * 1000).toISOString().split('T')[0];
		const dailySum = Object.entries(record.dailyCount || {})
			.filter(([date]) => date >= cutoffDate)
			.reduce((sum, [, count]) => sum + count, 0);
		
		return dailySum + (record.recentTimestamps || []).length;
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
 * Storage for plugin usage tracking (plugin-level, not command-level)
 */
export class PluginUsageStorage extends CommandHistoryStorage {
	constructor(plugin: LemonToolkitPlugin) {
		super(plugin, "plugin-usage.json");
	}

	/**
	 * Get usage for a plugin (by plugin ID)
	 */
	getPluginUsage(pluginId: string): CommandRecord | null {
		return this.getHistory(pluginId);
	}

	/**
	 * Get all plugin usage
	 */
	getAllPluginUsage(): CommandHistory {
		return this.getAllHistory();
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
