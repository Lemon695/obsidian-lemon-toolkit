export interface FolderMoveHistory {
	count: number;
	lastMoved: number;
	timestamps: number[];
}

export interface TagUsageHistory {
	lastUsed: number;
	timestamps: number[];
}

export interface CommandHistory {
	lastUsed: number;
	useCount: number;
}

export interface ExternalApp {
	id: string;
	name: string;
	path: string;
	openFile: boolean;
	openFolder: boolean;
}

export interface ClipboardRule {
	id: string;
	name: string;
	enabled: boolean;
	pattern: string; // Regex pattern to match
	replacement: string; // Replacement string (can use $1, $2 for capture groups)
	description?: string;
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
	folderMoveHistory: Record<string, FolderMoveHistory>;
	tagSortType: "recent" | "day" | "week" | "month" | "alphabetical";
	tagUsageHistory: Record<string, TagUsageHistory>;
	commandHistory: Record<string, CommandHistory>;
	pinnedCommands: string[];
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
	clipboardRules: ClipboardRule[];
	momentLoggerFormat: string;
	statistics: StatisticsSettings;
}

export const DEFAULT_SETTINGS: LemonToolkitSettings = {
	duplicateFileSuffixType: "timestamp",
	folderSortType: "recent",
	folderMoveHistory: {},
	tagSortType: "recent",
	tagUsageHistory: {},
	commandHistory: {},
	pinnedCommands: [],
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
	clipboardRules: [
		{
			id: "remove-weibo-timeline-image",
			name: "Remove Weibo timeline image",
			enabled: true,
			pattern: "!\\[\\]\\(https://n\\.sinaimg\\.cn/photo/[^)]+/timeline_card_small[^)]+\\.png\\)",
			replacement: "",
			description: "Remove Weibo timeline card small images",
		},
	],
	momentLoggerFormat: "YYYY-MM-DD HH:mm:ss",
	statistics: {
		enabled: true,
		retentionDays: 365,
		efficiencyEstimates: {},
		showInStatusBar: false,
		lastActiveTab: 'overview'
	},
};
