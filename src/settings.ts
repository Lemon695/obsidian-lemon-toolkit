export interface LemonToolkitSettings {
	duplicateFileSuffixType: "timestamp" | "uuid";
}

export const DEFAULT_SETTINGS: LemonToolkitSettings = {
	duplicateFileSuffixType: "timestamp",
};
