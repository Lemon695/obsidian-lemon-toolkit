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
	pinnedCommands: string[];
	commandPaletteSortBy: "recent" | "frequent";
	commandPaletteTimeRange: 24 | 168 | 720 | 0; // hours: 24h, 7d, 30d, all time
	commandPaletteColumns: 1 | 2 | 3; // Number of columns in command palette
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
	momentLoggerFormat: string;
}

export const DEFAULT_SETTINGS: LemonToolkitSettings = {
	duplicateFileSuffixType: "timestamp",
	folderSortType: "recent",
	tagSortType: "recent",
	pinnedCommands: [],
	commandPaletteSortBy: "recent",
	commandPaletteTimeRange: 720, // 30 days
	commandPaletteColumns: 1, // Default to single column
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
	momentLoggerFormat: "YYYY-MM-DD HH:mm:ss",
};
