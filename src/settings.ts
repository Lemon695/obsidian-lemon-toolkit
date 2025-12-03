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
};
