import { App } from "obsidian";
import LemonToolkitPlugin from "../main";

export interface GlobalCommandPaletteConfig {
	columns: 1 | 2 | 3;
	singleColumn: {
		pinnedCommands: string[];
		sortBy: "recent" | "frequent" | "alphabetical" | "plugin";
	};
	twoColumns: {
		columnSorts: ["recent" | "frequent" | "alphabetical" | "plugin", "recent" | "frequent" | "alphabetical" | "plugin"];
		columnPinned: [string[], string[]];
		columnTimeRanges: [24 | 168 | 240 | 720 | 2160 | 4380 | 8760 | 0, 24 | 168 | 240 | 720 | 2160 | 4380 | 8760 | 0];
	};
	threeColumns: {
		columnSorts: ["recent" | "frequent" | "alphabetical" | "plugin", "recent" | "frequent" | "alphabetical" | "plugin", "recent" | "frequent" | "alphabetical" | "plugin"];
		columnPinned: [string[], string[], string[]];
		columnTimeRanges: [24 | 168 | 240 | 720 | 2160 | 4380 | 8760 | 0, 24 | 168 | 240 | 720 | 2160 | 4380 | 8760 | 0, 24 | 168 | 240 | 720 | 2160 | 4380 | 8760 | 0];
	};
}

const DEFAULT_CONFIG: GlobalCommandPaletteConfig = {
	columns: 2,
	singleColumn: {
		pinnedCommands: [],
		sortBy: "recent"
	},
	twoColumns: {
		columnSorts: ["recent", "frequent"],
		columnPinned: [[], []],
		columnTimeRanges: [720, 720]
	},
	threeColumns: {
		columnSorts: ["recent", "frequent", "alphabetical"],
		columnPinned: [[], [], []],
		columnTimeRanges: [720, 720, 720]
	}
};

export class GlobalCommandPaletteConfigManager {
	private plugin: LemonToolkitPlugin;
	private config: GlobalCommandPaletteConfig;
	private configPath: string;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
		this.config = { ...DEFAULT_CONFIG };
		this.configPath = `${this.plugin.manifest.dir}/global-command-palette-config.json`;
	}

	async load(): Promise<void> {
		try {
			const data = await this.plugin.app.vault.adapter.read(this.configPath);
			const loaded = JSON.parse(data);
			this.config = {
				columns: loaded.columns || DEFAULT_CONFIG.columns,
				singleColumn: {
					pinnedCommands: loaded.singleColumn?.pinnedCommands || [],
					sortBy: loaded.singleColumn?.sortBy || DEFAULT_CONFIG.singleColumn.sortBy
				},
				twoColumns: {
					columnSorts: loaded.twoColumns?.columnSorts || DEFAULT_CONFIG.twoColumns.columnSorts,
					columnPinned: loaded.twoColumns?.columnPinned || [[], []],
					columnTimeRanges: loaded.twoColumns?.columnTimeRanges || [720, 720]
				},
				threeColumns: {
					columnSorts: loaded.threeColumns?.columnSorts || DEFAULT_CONFIG.threeColumns.columnSorts,
					columnPinned: loaded.threeColumns?.columnPinned || [[], [], []],
					columnTimeRanges: loaded.threeColumns?.columnTimeRanges || [720, 720, 720]
				}
			};
		} catch (e) {
			// File doesn't exist, use defaults
			this.config = { ...DEFAULT_CONFIG };
			await this.save();
		}
	}

	async save(): Promise<void> {
		await this.plugin.app.vault.adapter.write(
			this.configPath,
			JSON.stringify(this.config, null, 2)
		);
	}

	getConfig(): GlobalCommandPaletteConfig {
		return this.config;
	}

	setColumns(columns: 1 | 2 | 3): void {
		this.config.columns = columns;
	}

	setSingleColumnConfig(pinnedCommands: string[], sortBy: "recent" | "frequent" | "alphabetical" | "plugin"): void {
		this.config.singleColumn.pinnedCommands = pinnedCommands;
		this.config.singleColumn.sortBy = sortBy;
	}

	setTwoColumnsConfig(
		columnSorts: ["recent" | "frequent" | "alphabetical" | "plugin", "recent" | "frequent" | "alphabetical" | "plugin"],
		columnPinned: [string[], string[]],
		columnTimeRanges: [24 | 168 | 720 | 0, 24 | 168 | 720 | 0]
	): void {
		this.config.twoColumns.columnSorts = columnSorts;
		this.config.twoColumns.columnPinned = columnPinned;
		this.config.twoColumns.columnTimeRanges = columnTimeRanges;
	}

	setThreeColumnsConfig(
		columnSorts: ["recent" | "frequent" | "alphabetical" | "plugin", "recent" | "frequent" | "alphabetical" | "plugin", "recent" | "frequent" | "alphabetical" | "plugin"],
		columnPinned: [string[], string[], string[]],
		columnTimeRanges: [24 | 168 | 720 | 0, 24 | 168 | 720 | 0, 24 | 168 | 720 | 0]
	): void {
		this.config.threeColumns.columnSorts = columnSorts;
		this.config.threeColumns.columnPinned = columnPinned;
		this.config.threeColumns.columnTimeRanges = columnTimeRanges;
	}
}
