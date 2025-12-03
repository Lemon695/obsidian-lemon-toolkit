import { Plugin } from "obsidian";
import { registerCommands } from "./commands";
import { LemonToolkitSettings, DEFAULT_SETTINGS } from "./settings";
import { LemonToolkitSettingTab } from "./ui/SettingTab";

export default class LemonToolkitPlugin extends Plugin {
	settings: LemonToolkitSettings;

	async onload() {
		await this.loadSettings();
		registerCommands(this);
		this.addSettingTab(new LemonToolkitSettingTab(this.app, this));
		this.registerEventListeners();
	}

	private registerEventListeners(): void {
		// Listen for file rename/move events
		this.registerEvent(
			this.app.vault.on("rename", async (file, oldPath) => {
				// Check if it's a file (not a folder) and if the parent folder changed
				if (file.parent) {
					const oldParentPath = oldPath.substring(0, oldPath.lastIndexOf("/"));
					const newParentPath = file.parent.path;

					// If parent folder changed, record the move
					if (oldParentPath !== newParentPath) {
						await this.recordFolderMove(newParentPath);
					}
				}
			})
		);

		// Listen for file modifications to track tag usage
		this.registerEvent(
			this.app.metadataCache.on("changed", async (file) => {
				const cache = this.app.metadataCache.getFileCache(file);
				if (!cache) return;

				const tags: string[] = [];

				// Get inline tags
				if (cache.tags) {
					tags.push(...cache.tags.map((t) => t.tag));
				}

				// Get frontmatter tags
				if (cache.frontmatter?.tags) {
					const frontmatterTags = cache.frontmatter.tags;
					const tagList = Array.isArray(frontmatterTags) ? frontmatterTags : [frontmatterTags];
					tags.push(...tagList.map((t) => (t.startsWith("#") ? t : `#${t}`)));
				}

				// Record tag usage (but don't update lastUsed, only count)
				if (tags.length > 0) {
					await this.recordTagUsage(tags, false);
				}
			})
		);
	}

	async recordFolderMove(folderPath: string): Promise<void> {
		const now = Date.now();
		const history = this.settings.folderMoveHistory[folderPath] || {
			count: 0,
			lastMoved: 0,
			timestamps: [],
		};

		history.count++;
		history.lastMoved = now;
		history.timestamps.push(now);

		// Keep only last 100 timestamps
		if (history.timestamps.length > 100) {
			history.timestamps = history.timestamps.slice(-100);
		}

		this.settings.folderMoveHistory[folderPath] = history;
		await this.saveSettings();
	}

	async recordTagUsage(tags: string[], updateLastUsed: boolean = true): Promise<void> {
		const now = Date.now();

		tags.forEach((tag) => {
			const history = this.settings.tagUsageHistory[tag] || {
				lastUsed: 0,
				timestamps: [],
			};

			if (updateLastUsed) {
				history.lastUsed = now;
			}
			history.timestamps.push(now);

			// Keep only last 100 timestamps
			if (history.timestamps.length > 100) {
				history.timestamps = history.timestamps.slice(-100);
			}

			this.settings.tagUsageHistory[tag] = history;
		});

		await this.saveSettings();
	}

	onunload() {
		// Cleanup handled automatically by Obsidian
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
