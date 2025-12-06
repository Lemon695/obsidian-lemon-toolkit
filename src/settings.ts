export interface ExternalApp {
	id: string;
	name: string;
	path: string;
	openFile: boolean;
	openFolder: boolean;
}

export interface StatisticsSettings {
	enabled: boolean;
	retentionDays: number;
	efficiencyEstimates: Record<string, {
		commandId: string;
		manualTimeSeconds: number;
		commandTimeSeconds: number;
	}>;
	showInStatusBar: boolean;
	lastActiveTab: 'overview' | 'commands' | 'efficiency' | 'trends';
}

export interface LemonToolkitSettings {
	duplicateFileSuffixType: "timestamp" | "uuid";
	folderSortType: "recent" | "day" | "week" | "month";
	tagSortType: "recent" | "day" | "week" | "month" | "alphabetical";
	pluginUsageHistory: Record<string, any>; // For plugin usage statistics
	pluginMetadata: Record<string, any>; // For plugin update times and metadata
	pinnedCommands: string[];
	commandPaletteSortBy: "recent" | "frequent";
	commandPaletteTimeRange: 24 | 168 | 720 | 0; // hours: 24h, 7d, 30d, all time
	commandPaletteColumns: 1 | 2 | 3; // Number of columns in command palette
	globalCommandPaletteSortBy: "recent" | "frequent";
	globalCommandPaletteTimeRange: 24 | 168 | 720 | 0;
	globalCommandPaletteColumns: 1 | 2 | 3;
	// Independent configurations for each column mode
	globalCommandPalette1Column: {
		pinnedCommands: string[];
		sortBy: "recent" | "frequent" | "alphabetical" | "plugin";
	};
	globalCommandPalette2Columns: {
		columnSorts: ["recent" | "frequent" | "alphabetical" | "plugin", "recent" | "frequent" | "alphabetical" | "plugin"];
		columnPinned: [string[], string[]];
		columnTimeRanges: [24 | 168 | 720 | 0, 24 | 168 | 720 | 0];
	};
	globalCommandPalette3Columns: {
		columnSorts: ["recent" | "frequent" | "alphabetical" | "plugin", "recent" | "frequent" | "alphabetical" | "plugin", "recent" | "frequent" | "alphabetical" | "plugin"];
		columnPinned: [string[], string[], string[]];
		columnTimeRanges: [24 | 168 | 720 | 0, 24 | 168 | 720 | 0, 24 | 168 | 720 | 0];
	};
	showReadingTime: boolean;
	dateTimeFormat: string;
	fileInfoCollapsedSections?: {
		outgoingLinks?: boolean;
		incomingLinks?: boolean;
	};
	frontmatterEditor: {
		templates: any[];
		quickActions: any[];
		dateFormat: string;
		closeAfterSave: boolean;
		showTypeIcons: boolean;
	};
	externalApps: ExternalApp[];
	momentLoggerFormat: string;
	statistics: StatisticsSettings;
}

export const DEFAULT_SETTINGS: LemonToolkitSettings = {
	duplicateFileSuffixType: "timestamp",
	folderSortType: "recent",
	tagSortType: "recent",
	pluginUsageHistory: {},
	pluginMetadata: {},
	pinnedCommands: [],
	commandPaletteSortBy: "recent",
	commandPaletteTimeRange: 720, // 30 days
	commandPaletteColumns: 1, // Default to single column
	globalCommandPaletteSortBy: "frequent",
	globalCommandPaletteTimeRange: 720,
	globalCommandPaletteColumns: 2, // Default to 2 columns for global
	globalCommandPalette1Column: {
		pinnedCommands: [],
		sortBy: "recent"
	},
	globalCommandPalette2Columns: {
		columnSorts: ["recent", "frequent"],
		columnPinned: [[], []],
		columnTimeRanges: [720, 720]
	},
	globalCommandPalette3Columns: {
		columnSorts: ["recent", "frequent", "alphabetical"],
		columnPinned: [[], [], []],
		columnTimeRanges: [720, 720, 720]
	},
	showReadingTime: true,
	dateTimeFormat: "YYYY-MM-DD HH:mm",
	fileInfoCollapsedSections: {
		outgoingLinks: true,
		incomingLinks: true,
	},
	frontmatterEditor: {
		templates: [],
		quickActions: [
			{ id: "status-done", label: "status:done", action: "set", field: "status", value: "done" },
			{ id: "add-rating", label: "+rating", action: "add", field: "rating", value: "" },
		],
		dateFormat: "YYYY-MM-DD",
		closeAfterSave: false,
		showTypeIcons: true,
	},
	externalApps: [],
	momentLoggerFormat: "YYYY-MM-DD HH:mm:ss",
	statistics: {
		enabled: true,
		retentionDays: 365,
		efficiencyEstimates: {},
		showInStatusBar: false,
		lastActiveTab: 'overview'
	},
};
