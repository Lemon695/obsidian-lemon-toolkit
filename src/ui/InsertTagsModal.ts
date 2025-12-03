import { App, Editor, Modal } from "obsidian";
import LemonToolkitPlugin from "../main";

interface TagItem {
	tag: string;
	count: number;
	lastUsed: number;
}

export class InsertTagsModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private editor: Editor;
	private selectedTags: Set<string>;
	private allTags: TagItem[];

	constructor(plugin: LemonToolkitPlugin, editor: Editor) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.selectedTags = new Set();
		this.allTags = [];
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Insert tags" });

		// Get all tags from vault
		this.loadAllTags();

		// Sort tags based on settings
		this.sortTags();

		// Create search input
		const searchContainer = contentEl.createDiv({ cls: "lemon-search-container" });
		searchContainer.style.marginTop = "16px";
		searchContainer.style.marginBottom = "8px";

		const searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: "Filter tags...",
		});
		searchInput.style.width = "100%";
		searchInput.style.padding = "8px";
		searchInput.style.boxSizing = "border-box";

		// Create tag list
		const tagListContainer = contentEl.createDiv({ cls: "lemon-insert-tags-container" });
		tagListContainer.style.marginTop = "8px";
		tagListContainer.style.maxHeight = "400px";
		tagListContainer.style.overflowY = "auto";

		// Function to render tags
		const renderTags = (filterText: string = "") => {
			tagListContainer.empty();
			const filter = filterText.toLowerCase();

			const filteredTags = this.allTags.filter((tagItem) =>
				tagItem.tag.toLowerCase().includes(filter)
			);

			if (filteredTags.length === 0) {
				const noResults = tagListContainer.createDiv();
				noResults.style.padding = "16px";
				noResults.style.textAlign = "center";
				noResults.style.color = "var(--text-muted)";
				noResults.textContent = "No tags found";
				return;
			}

			filteredTags.forEach((tagItem) => {
				const tagElement = tagListContainer.createDiv({ cls: "lemon-tag-checkbox-item" });
				tagElement.style.padding = "8px 12px";
				tagElement.style.marginBottom = "4px";
				tagElement.style.backgroundColor = this.selectedTags.has(tagItem.tag)
					? "var(--background-modifier-hover)"
					: "var(--background-secondary)";
				tagElement.style.borderRadius = "4px";
				tagElement.style.cursor = "pointer";
				tagElement.style.display = "flex";
				tagElement.style.alignItems = "center";
				tagElement.style.gap = "8px";

				const checkbox = tagElement.createEl("input", { type: "checkbox" });
				checkbox.checked = this.selectedTags.has(tagItem.tag);
				checkbox.style.cursor = "pointer";

				const label = tagElement.createEl("span");
				label.textContent = tagItem.tag;
				label.style.flex = "1";

				const count = tagElement.createEl("span");
				count.textContent = `(${tagItem.count})`;
				count.style.color = "var(--text-muted)";
				count.style.fontSize = "0.9em";

				// Toggle selection
				const toggleSelection = () => {
					if (this.selectedTags.has(tagItem.tag)) {
						this.selectedTags.delete(tagItem.tag);
						checkbox.checked = false;
						tagElement.style.backgroundColor = "var(--background-secondary)";
					} else {
						this.selectedTags.add(tagItem.tag);
						checkbox.checked = true;
						tagElement.style.backgroundColor = "var(--background-modifier-hover)";
					}
				};

				checkbox.addEventListener("change", toggleSelection);
				tagElement.addEventListener("click", (e) => {
					if (e.target !== checkbox) {
						toggleSelection();
					}
				});
			});
		};

		// Initial render
		renderTags();

		// Add search listener
		searchInput.addEventListener("input", () => {
			renderTags(searchInput.value);
		});

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: "lemon-button-container" });
		buttonContainer.style.marginTop = "16px";
		buttonContainer.style.display = "flex";
		buttonContainer.style.justifyContent = "flex-end";
		buttonContainer.style.gap = "8px";

		const cancelButton = buttonContainer.createEl("button", { text: "Cancel" });
		cancelButton.addEventListener("click", () => this.close());

		const insertButton = buttonContainer.createEl("button", {
			text: "Insert",
			cls: "mod-cta",
		});
		insertButton.addEventListener("click", () => this.insertSelectedTags());
	}

	private loadAllTags(): void {
		// Get all tags from vault metadata
		const allTagsMap = new Map<string, number>();
		
		// @ts-ignore - metadataCache.getTags() is available
		const metadataCache = this.app.metadataCache;
		const allFiles = this.app.vault.getMarkdownFiles();

		allFiles.forEach((file) => {
			const cache = metadataCache.getFileCache(file);
			if (!cache) return;

			// Get inline tags
			if (cache.tags) {
				cache.tags.forEach((tagCache) => {
					const tag = tagCache.tag;
					allTagsMap.set(tag, (allTagsMap.get(tag) || 0) + 1);
				});
			}

			// Get frontmatter tags
			if (cache.frontmatter?.tags) {
				const frontmatterTags = cache.frontmatter.tags;
				const tags = Array.isArray(frontmatterTags) ? frontmatterTags : [frontmatterTags];
				tags.forEach((tag) => {
					const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;
					allTagsMap.set(normalizedTag, (allTagsMap.get(normalizedTag) || 0) + 1);
				});
			}
		});

		// Convert to array with history data
		this.allTags = Array.from(allTagsMap.entries()).map(([tag, count]) => {
			const history = this.plugin.settings.tagUsageHistory[tag];
			return {
				tag,
				count,
				lastUsed: history?.lastUsed || 0,
			};
		});
	}

	private sortTags(): void {
		const sortType = this.plugin.settings.tagSortType;

		if (sortType === "recent") {
			// Sort by most recently used
			this.allTags.sort((a, b) => b.lastUsed - a.lastUsed);
		} else if (sortType === "alphabetical") {
			// Sort alphabetically
			this.allTags.sort((a, b) => a.tag.localeCompare(b.tag));
		} else {
			// Sort by frequency (count) in time period
			const now = Date.now();
			const timeWindow = this.getTimeWindow(sortType);

			this.allTags.sort((a, b) => {
				const aCount = this.getCountInWindow(a.tag, now, timeWindow);
				const bCount = this.getCountInWindow(b.tag, now, timeWindow);
				if (bCount !== aCount) return bCount - aCount;
				return b.count - a.count; // Fallback to total count
			});
		}
	}

	private getTimeWindow(sortType: string): number {
		switch (sortType) {
			case "day":
				return 24 * 60 * 60 * 1000;
			case "week":
				return 7 * 24 * 60 * 60 * 1000;
			case "month":
				return 30 * 24 * 60 * 60 * 1000;
			default:
				return 0;
		}
	}

	private getCountInWindow(tag: string, now: number, timeWindow: number): number {
		const history = this.plugin.settings.tagUsageHistory[tag];
		if (!history || !history.timestamps) return 0;

		if (timeWindow === 0) {
			return history.timestamps.length;
		}

		return history.timestamps.filter((ts) => now - ts < timeWindow).length;
	}

	private async insertSelectedTags(): Promise<void> {
		if (this.selectedTags.size === 0) {
			this.close();
			return;
		}

		const tagsArray = Array.from(this.selectedTags);
		const tagsText = tagsArray.join(" ");

		// Insert at cursor
		this.editor.replaceSelection(tagsText);

		// Update usage history (with lastUsed update)
		await this.plugin.recordTagUsage(tagsArray, true);

		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
