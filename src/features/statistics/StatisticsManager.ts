import { Plugin, App } from 'obsidian';
import {
	StatisticsData,
	UsageEvent,
	CommandStats,
	AggregatedStats,
	EfficiencyData,
	TimePeriod,
	EfficiencyEstimate,
	StatisticsSettings,
	DEFAULT_STATISTICS_SETTINGS
} from './types';
import { StatisticsModal } from './StatisticsModal';
import { getAllEfficiencyEstimates, getEfficiencyEstimate } from './efficiency-config';

const STORAGE_KEY = 'statistics-data';
const PLUGIN_VERSION = '1.0.0';

/**
 * Manages command usage statistics tracking and data persistence
 */
export class StatisticsManager {
	private plugin: Plugin;
	private app: App;
	private data: StatisticsData;
	private settings: StatisticsSettings;
	private eventBuffer: UsageEvent[] = [];
	private saveTimeout: NodeJS.Timeout | null = null;
	private readonly BUFFER_SIZE = 10;
	private readonly SAVE_DELAY_MS = 5000;

	constructor(plugin: Plugin, app: App, settings: StatisticsSettings) {
		this.plugin = plugin;
		this.app = app;
		this.settings = settings;
		this.data = this.createEmptyData();
	}

	/**
	 * Initialize the manager and load existing data
	 */
	async initialize(): Promise<void> {
		await this.loadData();
	}

	/**
	 * Create an empty statistics data structure
	 */
	private createEmptyData(): StatisticsData {
		return {
			events: [],
			efficiencyEstimates: this.getDefaultEfficiencyEstimates(),
			settings: {
				enabled: this.settings.enabled,
				retentionDays: this.settings.retentionDays
			},
			metadata: {
				version: PLUGIN_VERSION,
				firstUse: Date.now()
			}
		};
	}

	/**
	 * Get default efficiency estimates for common commands
	 */
	private getDefaultEfficiencyEstimates(): Record<string, EfficiencyEstimate> {
		const allEstimates = getAllEfficiencyEstimates();
		const result: Record<string, EfficiencyEstimate> = {};
		
		// Convert EfficiencyConfig to EfficiencyEstimate (remove description and category)
		Object.entries(allEstimates).forEach(([key, config]) => {
			result[key] = {
				commandId: config.commandId,
				manualTimeSeconds: config.manualTimeSeconds,
				commandTimeSeconds: config.commandTimeSeconds
			};
		});
		
		return result;
	}

	/**
	 * Load statistics data from storage
	 */
	async loadData(): Promise<void> {
		try {
			const fileData = await this.app.vault.adapter.read(
				`${(this.plugin as any).manifest.dir}/statistics-data.json`
			).catch(() => '{}');
			const stored = JSON.parse(fileData);
			
			if (stored && stored.data) {
				this.data = stored.data;
				
				// Validate and migrate data if needed
				if (!this.data.metadata) {
					this.data.metadata = {
						version: PLUGIN_VERSION,
						firstUse: this.data.events[0]?.timestamp || Date.now()
					};
				}
				
				// Merge default efficiency estimates with stored ones
				this.data.efficiencyEstimates = {
					...this.getDefaultEfficiencyEstimates(),
					...this.data.efficiencyEstimates
				};
			} else {
				this.data = this.createEmptyData();
			}
		} catch (error) {
			console.error('Failed to load statistics data:', error);
			this.data = this.createEmptyData();
		}
	}

	/**
	 * Save statistics data to storage
	 */
	async saveData(): Promise<void> {
		try {
			const fileData = JSON.stringify({ data: this.data }, null, 2);
			await this.app.vault.adapter.write(
				`${(this.plugin as any).manifest.dir}/statistics-data.json`,
				fileData
			);
		} catch (error) {
			console.error('Failed to save statistics data:', error);
		}
	}

	/**
	 * Get the current statistics data
	 */
	getData(): StatisticsData {
		return this.data;
	}

	/**
	 * Update settings
	 */
	updateSettings(settings: StatisticsSettings): void {
		this.settings = settings;
		this.data.settings.enabled = settings.enabled;
		this.data.settings.retentionDays = settings.retentionDays;
		this.data.efficiencyEstimates = {
			...this.data.efficiencyEstimates,
			...settings.efficiencyEstimates
		};
	}

	/**
	 * Record a command usage event
	 */
	recordUsage(commandId: string, commandName: string): void {
		// Skip if tracking is disabled
		if (!this.settings.enabled) {
			return;
		}

		const event: UsageEvent = {
			commandId,
			commandName,
			timestamp: Date.now()
		};

		// Add to buffer
		this.eventBuffer.push(event);

		// Check if we should flush the buffer
		if (this.eventBuffer.length >= this.BUFFER_SIZE) {
			this.flushBuffer();
		} else {
			// Schedule a delayed save
			this.scheduleSave();
		}
	}

	/**
	 * Flush the event buffer to persistent storage
	 */
	private flushBuffer(): void {
		if (this.eventBuffer.length === 0) {
			return;
		}

		// Add buffered events to data
		this.data.events.push(...this.eventBuffer);
		this.eventBuffer = [];

		// Cancel any pending save
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
			this.saveTimeout = null;
		}

		// Save immediately
		this.saveData();
	}

	/**
	 * Schedule a delayed save
	 */
	private scheduleSave(): void {
		// Clear existing timeout
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}

		// Schedule new save
		this.saveTimeout = setTimeout(() => {
			this.flushBuffer();
		}, this.SAVE_DELAY_MS);
	}

	/**
	 * Get date range for a time period
	 */
	private getDateRange(period: TimePeriod, date: Date = new Date()): { start: number; end: number } {
		const end = new Date(date);
		end.setHours(23, 59, 59, 999);

		const start = new Date(date);
		start.setHours(0, 0, 0, 0);

		switch (period) {
			case 'day':
				// Already set to start of day
				break;
			case 'week':
				// Go to start of week (Sunday)
				const dayOfWeek = start.getDay();
				start.setDate(start.getDate() - dayOfWeek);
				break;
			case 'month':
				start.setDate(1);
				break;
			case 'year':
				start.setMonth(0, 1);
				break;
		}

		return {
			start: start.getTime(),
			end: end.getTime()
		};
	}

	/**
	 * Get statistics for a specific time period
	 */
	getStats(period: TimePeriod, date?: Date): AggregatedStats {
		const { start, end } = this.getDateRange(period, date);

		// Filter events within the period
		const periodEvents = this.data.events.filter(
			event => event.timestamp >= start && event.timestamp <= end
		);

		// Count commands
		const commandCounts = new Map<string, { name: string; count: number }>();
		periodEvents.forEach(event => {
			const existing = commandCounts.get(event.commandId);
			if (existing) {
				existing.count++;
			} else {
				commandCounts.set(event.commandId, {
					name: event.commandName,
					count: 1
				});
			}
		});

		// Get top 5 commands
		const topCommands = Array.from(commandCounts.entries())
			.map(([commandId, data]) => ({
				commandId,
				commandName: data.name,
				count: data.count
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		// Get previous period for comparison
		const previousPeriodDate = this.getPreviousPeriodDate(period, date || new Date());
		const previousRange = this.getDateRange(period, previousPeriodDate);
		const previousEvents = this.data.events.filter(
			event => event.timestamp >= previousRange.start && event.timestamp <= previousRange.end
		);

		return {
			period,
			startDate: start,
			endDate: end,
			totalCommands: periodEvents.length,
			uniqueCommands: commandCounts.size,
			topCommands,
			comparisonData: {
				previousTotal: previousEvents.length,
				percentageChange: this.calculatePercentageChange(previousEvents.length, periodEvents.length)
			}
		};
	}

	/**
	 * Get the date for the previous period
	 */
	private getPreviousPeriodDate(period: TimePeriod, currentDate: Date): Date {
		const previous = new Date(currentDate);

		switch (period) {
			case 'day':
				previous.setDate(previous.getDate() - 1);
				break;
			case 'week':
				previous.setDate(previous.getDate() - 7);
				break;
			case 'month':
				previous.setMonth(previous.getMonth() - 1);
				break;
			case 'year':
				previous.setFullYear(previous.getFullYear() - 1);
				break;
		}

		return previous;
	}

	/**
	 * Calculate percentage change between two values
	 */
	private calculatePercentageChange(previous: number, current: number): number {
		if (previous === 0) {
			return current > 0 ? 100 : 0;
		}
		return ((current - previous) / previous) * 100;
	}

	/**
	 * Get statistics for all commands
	 */
	getAllCommandStats(): CommandStats[] {
		const commandMap = new Map<string, CommandStats>();

		this.data.events.forEach(event => {
			const existing = commandMap.get(event.commandId);
			if (existing) {
				existing.totalUses++;
				existing.lastUsed = Math.max(existing.lastUsed, event.timestamp);
				existing.firstUsed = Math.min(existing.firstUsed, event.timestamp);
			} else {
				commandMap.set(event.commandId, {
					commandId: event.commandId,
					commandName: event.commandName,
					totalUses: 1,
					lastUsed: event.timestamp,
					firstUsed: event.timestamp
				});
			}
		});

		return Array.from(commandMap.values());
	}

	/**
	 * Get efficiency data for a time period
	 */
	getEfficiencyData(period: TimePeriod, date?: Date): EfficiencyData {
		const { start, end } = this.getDateRange(period, date);

		// Filter events within the period
		const periodEvents = this.data.events.filter(
			event => event.timestamp >= start && event.timestamp <= end
		);

		// Calculate time saved per command
		const commandBreakdown: EfficiencyData['commandBreakdown'] = [];
		const commandCounts = new Map<string, { name: string; count: number }>();

		periodEvents.forEach(event => {
			const existing = commandCounts.get(event.commandId);
			if (existing) {
				existing.count++;
			} else {
				commandCounts.set(event.commandId, {
					name: event.commandName,
					count: 1
				});
			}
		});

		let totalTimeSaved = 0;

		commandCounts.forEach((data, commandId) => {
			const estimate = this.data.efficiencyEstimates[commandId];
			if (estimate) {
				const timeSaved = (estimate.manualTimeSeconds - estimate.commandTimeSeconds) * data.count;
				totalTimeSaved += timeSaved;

				commandBreakdown.push({
					commandId,
					commandName: data.name,
					timeSaved,
					executionCount: data.count
				});
			}
		});

		// Sort by time saved descending
		commandBreakdown.sort((a, b) => b.timeSaved - a.timeSaved);

		// Calculate average per day
		const daysInPeriod = this.getDaysInPeriod(period);
		const averagePerDay = totalTimeSaved / daysInPeriod;

		return {
			period,
			totalTimeSaved,
			commandBreakdown,
			averagePerDay
		};
	}

	/**
	 * Get the number of days in a period
	 */
	private getDaysInPeriod(period: TimePeriod): number {
		switch (period) {
			case 'day':
				return 1;
			case 'week':
				return 7;
			case 'month':
				return 30; // Approximate
			case 'year':
				return 365;
		}
	}

	/**
	 * Get cumulative time saved since first use
	 */
	getCumulativeTimeSaved(): number {
		let total = 0;

		const commandCounts = new Map<string, number>();
		this.data.events.forEach(event => {
			commandCounts.set(event.commandId, (commandCounts.get(event.commandId) || 0) + 1);
		});

		commandCounts.forEach((count, commandId) => {
			const estimate = this.data.efficiencyEstimates[commandId];
			if (estimate) {
				total += (estimate.manualTimeSeconds - estimate.commandTimeSeconds) * count;
			}
		});

		return total;
	}

	/**
	 * Export statistics data as JSON string
	 */
	exportData(): string {
		const exportData = {
			...this.data,
			exportDate: Date.now(),
			exportVersion: PLUGIN_VERSION
		};
		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * Clear all statistics data
	 */
	async clearData(): Promise<void> {
		this.data = this.createEmptyData();
		this.eventBuffer = [];
		await this.saveData();
	}

	/**
	 * Import statistics data from JSON string
	 */
	importData(jsonString: string): boolean {
		try {
			const imported = JSON.parse(jsonString);
			
			// Validate structure
			if (!imported.events || !Array.isArray(imported.events)) {
				return false;
			}

			this.data = {
				events: imported.events,
				efficiencyEstimates: imported.efficiencyEstimates || this.getDefaultEfficiencyEstimates(),
				settings: imported.settings || {
					enabled: true,
					retentionDays: 365
				},
				metadata: imported.metadata || {
					version: PLUGIN_VERSION,
					firstUse: Date.now()
				}
			};

			return true;
		} catch (error) {
			console.error('Failed to import statistics data:', error);
			return false;
		}
	}

	/**
	 * Open the statistics modal
	 */
	openModal(): void {
		const modal = new StatisticsModal(this.app, this, this.settings.lastActiveTab);
		modal.open();
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		// Flush any remaining events
		this.flushBuffer();

		// Clear timeout
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
			this.saveTimeout = null;
		}
	}
}
