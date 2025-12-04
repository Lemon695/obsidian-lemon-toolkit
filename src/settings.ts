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
};
