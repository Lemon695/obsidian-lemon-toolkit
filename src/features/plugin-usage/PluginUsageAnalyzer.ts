import LemonToolkitPlugin from "../../main";

export interface PluginUsageStats {
	pluginId: string;
	pluginName: string;
	totalUsage: number;
	commandCount: number;
	lastUsed: number;
	trend: number; // Percentage change compared to previous period
	usagePercentage: number; // Percentage of total usage
}

export type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

export class PluginUsageAnalyzer {
	private plugin: LemonToolkitPlugin;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Analyze plugin usage from command statistics with time range filter
	 */
	getPluginUsageStats(timeRange: TimeRange = 'all'): PluginUsageStats[] {
		const now = Date.now();
		const { startTime, previousStartTime } = this.getTimeRangeBounds(now, timeRange);

		const pluginMap = new Map<string, PluginUsageStats>();
		const previousPluginMap = new Map<string, number>();
		const commandHistory = this.plugin.settings.pluginUsageHistory; // Use pluginUsageHistory instead

		let totalUsage = 0;

		// Aggregate current period usage
		Object.keys(commandHistory).forEach(commandId => {
			const history = commandHistory[commandId];
			
			const colonIndex = commandId.indexOf(':');
			if (colonIndex === -1) return;

			const pluginId = commandId.substring(0, colonIndex);
			const pluginName = this.getPluginName(pluginId);
			if (!pluginName) return;

			// Count usage in current period
			const currentUsage = this.countUsageInPeriod(commandId, startTime, now);
			if (currentUsage === 0 && timeRange !== 'all') return;

			// Count usage in previous period (for trend calculation)
			const previousUsage = this.countUsageInPeriod(commandId, previousStartTime, startTime);

			totalUsage += currentUsage;

			const existing = pluginMap.get(pluginId);
			if (existing) {
				existing.totalUsage += currentUsage;
				existing.commandCount++;
				existing.lastUsed = Math.max(existing.lastUsed, history.lastUsed);
			} else {
				pluginMap.set(pluginId, {
					pluginId,
					pluginName,
					totalUsage: currentUsage,
					commandCount: 1,
					lastUsed: history.lastUsed,
					trend: 0,
					usagePercentage: 0
				});
			}

			// Track previous period usage
			const prevTotal = previousPluginMap.get(pluginId) || 0;
			previousPluginMap.set(pluginId, prevTotal + previousUsage);
		});

		// Calculate trends and percentages
		const stats = Array.from(pluginMap.values());
		stats.forEach(stat => {
			// Calculate percentage
			stat.usagePercentage = totalUsage > 0 ? (stat.totalUsage / totalUsage) * 100 : 0;

			// Calculate trend
			const previousUsage = previousPluginMap.get(stat.pluginId) || 0;
			if (previousUsage > 0) {
				stat.trend = ((stat.totalUsage - previousUsage) / previousUsage) * 100;
			} else if (stat.totalUsage > 0) {
				stat.trend = 100; // New usage
			}
		});

		return stats.sort((a, b) => b.totalUsage - a.totalUsage);
	}

	/**
	 * Get time range bounds
	 */
	private getTimeRangeBounds(now: number, timeRange: TimeRange): { startTime: number; previousStartTime: number } {
		const day = 24 * 60 * 60 * 1000;
		const today = new Date(now);
		today.setHours(0, 0, 0, 0);

		switch (timeRange) {
			case 'today':
				return {
					startTime: today.getTime(),
					previousStartTime: today.getTime() - day
				};

			case 'week': {
				const weekStart = new Date(today);
				weekStart.setDate(today.getDate() - today.getDay());
				return {
					startTime: weekStart.getTime(),
					previousStartTime: weekStart.getTime() - (7 * day)
				};
			}

			case 'month': {
				const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
				const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
				return {
					startTime: monthStart.getTime(),
					previousStartTime: prevMonthStart.getTime()
				};
			}

			case 'year': {
				const yearStart = new Date(today.getFullYear(), 0, 1);
				const prevYearStart = new Date(today.getFullYear() - 1, 0, 1);
				return {
					startTime: yearStart.getTime(),
					previousStartTime: prevYearStart.getTime()
				};
			}

			case 'all':
			default:
				return {
					startTime: 0,
					previousStartTime: 0
				};
		}
	}

	/**
	 * Count usage in a specific time period
	 */
	private countUsageInPeriod(commandId: string, startTime: number, endTime: number): number {
		const history = this.plugin.settings.pluginUsageHistory[commandId]; // Use pluginUsageHistory
		if (!history) return 0;

		// For 'all' time range, return total count
		if (startTime === 0) {
			return history.useCount;
		}

		// Simplified: if last used is in range, return use count
		// This is an approximation since we don't have detailed timestamp history
		if (history.lastUsed >= startTime && history.lastUsed < endTime) {
			return history.useCount;
		}

		return 0;
	}

	/**
	 * Get plugin name from plugin ID
	 */
	private getPluginName(pluginId: string): string | null {
		const plugins = (this.plugin.app as any).plugins;
		
		if (plugins.enabledPlugins?.has(pluginId)) {
			const manifest = plugins.manifests?.[pluginId];
			return manifest?.name || pluginId;
		}

		return null;
	}

	/**
	 * Open plugin settings
	 */
	openPluginSettings(pluginId: string): void {
		const setting = (this.plugin.app as any).setting;
		if (setting) {
			setting.open();
			setting.openTabById(pluginId);
		}
	}

	/**
	 * Clear plugin usage history (only affects plugin stats, not command palette sorting)
	 */
	async clearPluginUsageHistory(): Promise<void> {
		this.plugin.settings.pluginUsageHistory = {};
		await this.plugin.saveSettings();
	}
}
