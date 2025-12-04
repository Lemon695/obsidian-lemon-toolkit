/**
 * Statistics feature type definitions
 */

/**
 * A single command usage event
 */
export interface UsageEvent {
	commandId: string;
	commandName: string;
	timestamp: number; // Unix timestamp in milliseconds
}

/**
 * Aggregated statistics for a specific command
 */
export interface CommandStats {
	commandId: string;
	commandName: string;
	totalUses: number;
	lastUsed: number;
	firstUsed: number;
}

/**
 * Time period types for statistics aggregation
 */
export type TimePeriod = 'day' | 'week' | 'month' | 'year';

/**
 * Aggregated statistics for a time period
 */
export interface AggregatedStats {
	period: TimePeriod;
	startDate: number;
	endDate: number;
	totalCommands: number;
	uniqueCommands: number;
	topCommands: Array<{
		commandId: string;
		commandName: string;
		count: number;
	}>;
	comparisonData?: {
		previousTotal: number;
		percentageChange: number;
	};
}

/**
 * Efficiency estimate for a command
 */
export interface EfficiencyEstimate {
	commandId: string;
	manualTimeSeconds: number;
	commandTimeSeconds: number;
}

/**
 * Efficiency data for a time period
 */
export interface EfficiencyData {
	period: TimePeriod;
	totalTimeSaved: number; // in seconds
	commandBreakdown: Array<{
		commandId: string;
		commandName: string;
		timeSaved: number;
		executionCount: number;
	}>;
	averagePerDay: number; // in seconds
}

/**
 * Complete statistics data structure for storage
 */
export interface StatisticsData {
	events: UsageEvent[];
	efficiencyEstimates: Record<string, EfficiencyEstimate>;
	settings: {
		enabled: boolean;
		retentionDays: number;
	};
	metadata: {
		version: string;
		firstUse: number;
	};
}

/**
 * Chart types for visualization
 */
export type ChartType = 'line' | 'bar' | 'heatmap';

/**
 * Tab types for the statistics modal
 */
export type StatisticsTab = 'overview' | 'commands' | 'efficiency' | 'trends';

/**
 * Settings for statistics feature
 */
export interface StatisticsSettings {
	enabled: boolean;
	retentionDays: number; // 30, 90, 365, -1 (forever)
	efficiencyEstimates: Record<string, EfficiencyEstimate>;
	showInStatusBar: boolean;
	lastActiveTab: StatisticsTab;
}

/**
 * Default statistics settings
 */
export const DEFAULT_STATISTICS_SETTINGS: StatisticsSettings = {
	enabled: true,
	retentionDays: 365,
	efficiencyEstimates: {},
	showInStatusBar: false,
	lastActiveTab: 'overview'
};
