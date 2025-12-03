export interface FolderMoveHistory {
	count: number;
	lastMoved: number;
	timestamps: number[];
}

export interface TagUsageHistory {
	lastUsed: number;
	timestamps: number[];
}

export interface LemonToolkitSettings {
	duplicateFileSuffixType: "timestamp" | "uuid";
	folderSortType: "recent" | "day" | "week" | "month";
	folderMoveHistory: Record<string, FolderMoveHistory>;
	tagSortType: "recent" | "day" | "week" | "month" | "alphabetical";
	tagUsageHistory: Record<string, TagUsageHistory>;
}

export const DEFAULT_SETTINGS: LemonToolkitSettings = {
	duplicateFileSuffixType: "timestamp",
	folderSortType: "recent",
	folderMoveHistory: {},
	tagSortType: "recent",
	tagUsageHistory: {},
};
