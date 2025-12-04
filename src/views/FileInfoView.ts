import { ItemView, WorkspaceLeaf, TFile, Notice } from "obsidian";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/locale";

export const FILE_INFO_VIEW_TYPE = "lemon-toolkit-file-info";

export class FileInfoView extends ItemView {
	private plugin: LemonToolkitPlugin;
	private currentFile: TFile | null = null;
	private viewContentEl: HTMLElement;
	private refreshDebounceTimer: NodeJS.Timeout | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: LemonToolkitPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return FILE_INFO_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t('fileInfo');
	}

	getIcon(): string {
		return "info";
	}

	async onOpen(): Promise<void> {
		this.viewContentEl = this.containerEl.children[1] as HTMLElement;
		this.viewContentEl.empty();
		this.viewContentEl.addClass("lemon-file-info-view");

		// Register event listeners
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.updateView();
			})
		);

		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (file === this.currentFile) {
					this.debouncedRefresh();
				}
			})
		);

		// Initial render
		this.updateView();
	}

	async onClose(): Promise<void> {
		// Cleanup
		if (this.refreshDebounceTimer) {
			clearTimeout(this.refreshDebounceTimer);
		}
	}

	private debouncedRefresh(): void {
		if (this.refreshDebounceTimer) {
			clearTimeout(this.refreshDebounceTimer);
		}
		this.refreshDebounceTimer = setTimeout(() => {
			this.updateView();
		}, 500);
	}

	private async updateView(): Promise<void> {
		const file = this.app.workspace.getActiveFile();
		this.currentFile = file;

		this.viewContentEl.empty();

		if (!file) {
			this.renderEmptyState();
			return;
		}

		// Create header with refresh button
		this.renderHeader();

		// Render all sections
		await this.renderBasicInfo(file);
		await this.renderFrontmatter(file);
		await this.renderTags(file);
		await this.renderLinks(file);
		this.renderLocation(file);
	}

	private renderEmptyState(): void {
		const emptyState = this.viewContentEl.createDiv({ cls: "lemon-empty-state" });
		emptyState.style.padding = "32px 16px";
		emptyState.style.textAlign = "center";
		emptyState.style.color = "var(--text-muted)";
		emptyState.textContent = t('noActiveFile');
	}

	private renderHeader(): void {
		const header = this.viewContentEl.createDiv({ cls: "lemon-file-info-header" });
		header.style.display = "flex";
		header.style.justifyContent = "space-between";
		header.style.alignItems = "center";
		header.style.padding = "8px 16px";
		header.style.borderBottom = "1px solid var(--background-modifier-border)";

		const title = header.createEl("h4", { text: t('fileInformation') });
		title.style.margin = "0";

		const refreshBtn = header.createEl("button", { cls: "clickable-icon" });
		refreshBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;
		refreshBtn.setAttribute("aria-label", t('refresh'));
		refreshBtn.addEventListener("click", () => this.updateView());
	}

	private async renderBasicInfo(file: TFile): Promise<void> {
		const section = this.createSection(t('basicInformation'), "basic-info");
		const content = section.content;

		const stat = file.stat;
		const fileContent = await this.app.vault.read(file);

		// File name
		this.createInfoRow(content, t('fileName'), file.name, true);

		// File path
		this.createInfoRow(content, t('path'), file.path, true);

		// Created time
		const createdTime = this.formatDate(stat.ctime);
		this.createInfoRow(content, t('created'), createdTime);

		// Modified time
		const modifiedTime = this.formatDate(stat.mtime);
		this.createInfoRow(content, t('modified'), modifiedTime);

		// File size
		const fileSize = this.formatFileSize(stat.size);
		this.createInfoRow(content, t('size'), fileSize);

		// Statistics
		const stats = this.calculateStats(fileContent);
		this.createInfoRow(content, t('characters'), stats.characters.toString());
		this.createInfoRow(content, t('words'), stats.words.toString());
		this.createInfoRow(content, t('paragraphs'), stats.paragraphs.toString());

		if (this.plugin.settings.showReadingTime) {
			this.createInfoRow(content, t('readingTime'), stats.readingTime);
		}
	}

	private async renderFrontmatter(file: TFile): Promise<void> {
		const section = this.createSection(t('frontmatter'), "frontmatter");
		const content = section.content;

		const cache = this.app.metadataCache.getFileCache(file);
		const frontmatter = cache?.frontmatter;

		if (!frontmatter || Object.keys(frontmatter).length === 0) {
			const emptyMsg = content.createDiv({ cls: "lemon-empty-message" });
			emptyMsg.style.padding = "8px";
			emptyMsg.style.color = "var(--text-muted)";
			emptyMsg.style.fontStyle = "italic";
			emptyMsg.textContent = t('noFrontmatterInFile');
			return;
		}

		// Render frontmatter fields
		Object.entries(frontmatter).forEach(([key, value]) => {
			if (key === "position") return; // Skip internal field

			const row = content.createDiv({ cls: "lemon-info-row" });
			row.style.padding = "6px 8px";
			row.style.display = "flex";
			row.style.gap = "8px";

			const keyEl = row.createEl("strong");
			keyEl.textContent = key + ":";
			keyEl.style.minWidth = "100px";
			keyEl.style.color = "var(--text-muted)";

			const valueEl = row.createDiv({ cls: "lemon-frontmatter-value" });
			valueEl.style.flex = "1";
			this.renderFrontmatterValue(valueEl, value);
		});
	}

	private renderFrontmatterValue(container: HTMLElement, value: any): void {
		if (Array.isArray(value)) {
			const tagsContainer = container.createDiv({ cls: "lemon-tags-container" });
			tagsContainer.style.display = "flex";
			tagsContainer.style.flexWrap = "wrap";
			tagsContainer.style.gap = "4px";

			value.forEach((item) => {
				const tag = tagsContainer.createEl("span", { cls: "lemon-tag" });
				tag.textContent = String(item);
				tag.style.padding = "2px 8px";
				tag.style.backgroundColor = "var(--background-modifier-border)";
				tag.style.borderRadius = "12px";
				tag.style.fontSize = "0.9em";
			});
		} else if (typeof value === "object" && value !== null) {
			container.textContent = JSON.stringify(value, null, 2);
			container.style.fontFamily = "var(--font-monospace)";
			container.style.fontSize = "0.9em";
		} else {
			container.textContent = String(value);
		}
	}

	private async renderTags(file: TFile): Promise<void> {
		const section = this.createSection(t('tags'), "tags");
		const content = section.content;

		const cache = this.app.metadataCache.getFileCache(file);
		const tags: string[] = [];

		// Get inline tags
		if (cache?.tags) {
			tags.push(...cache.tags.map((t) => t.tag));
		}

		// Get frontmatter tags
		if (cache?.frontmatter?.tags) {
			const frontmatterTags = cache.frontmatter.tags;
			const tagList = Array.isArray(frontmatterTags) ? frontmatterTags : [frontmatterTags];
			tagList.forEach((tag) => {
				const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;
				if (!tags.includes(normalizedTag)) {
					tags.push(normalizedTag);
				}
			});
		}

		if (tags.length === 0) {
			const emptyMsg = content.createDiv({ cls: "lemon-empty-message" });
			emptyMsg.style.padding = "8px";
			emptyMsg.style.color = "var(--text-muted)";
			emptyMsg.style.fontStyle = "italic";
			emptyMsg.textContent = t('noTagsInFile');
			return;
		}

		const tagsContainer = content.createDiv({ cls: "lemon-tags-container" });
		tagsContainer.style.display = "flex";
		tagsContainer.style.flexWrap = "wrap";
		tagsContainer.style.gap = "6px";
		tagsContainer.style.padding = "8px";

		tags.forEach((tag) => {
			const tagEl = tagsContainer.createEl("a", { cls: "lemon-tag-pill" });
			tagEl.textContent = tag;
			tagEl.style.padding = "4px 12px";
			tagEl.style.backgroundColor = "var(--interactive-accent)";
			tagEl.style.color = "var(--text-on-accent)";
			tagEl.style.borderRadius = "12px";
			tagEl.style.fontSize = "0.9em";
			tagEl.style.cursor = "pointer";
			tagEl.style.textDecoration = "none";

			tagEl.addEventListener("click", () => {
				// @ts-ignore
				this.app.internalPlugins.getPluginById("global-search").instance.openGlobalSearch(tag);
			});
		});
	}

	private async renderLinks(file: TFile): Promise<void> {
		const section = this.createSection(t('links'), "links");
		const content = section.content;

		const cache = this.app.metadataCache.getFileCache(file);
		
		// Outgoing links
		const outgoingLinks = cache?.links || [];
		const outgoingSection = content.createDiv({ cls: "lemon-links-section" });
		outgoingSection.style.marginBottom = "12px";

		const outgoingHeader = outgoingSection.createDiv({ cls: "lemon-links-header" });
		outgoingHeader.style.display = "flex";
		outgoingHeader.style.justifyContent = "space-between";
		outgoingHeader.style.padding = "4px 8px";
		outgoingHeader.style.cursor = "pointer";
		outgoingHeader.style.fontWeight = "500";

		const outgoingTitle = outgoingHeader.createSpan();
		outgoingTitle.textContent = t('outgoingLinks', { count: outgoingLinks.length.toString() });

		const outgoingList = outgoingSection.createDiv({ cls: "lemon-links-list" });
		outgoingList.style.paddingLeft = "8px";

		const isOutgoingExpanded = this.plugin.settings.fileInfoCollapsedSections?.outgoingLinks !== false;
		outgoingList.style.display = isOutgoingExpanded ? "block" : "none";

		outgoingHeader.addEventListener("click", () => {
			const isExpanded = outgoingList.style.display !== "none";
			outgoingList.style.display = isExpanded ? "none" : "block";
			this.plugin.settings.fileInfoCollapsedSections = this.plugin.settings.fileInfoCollapsedSections || {};
			this.plugin.settings.fileInfoCollapsedSections.outgoingLinks = !isExpanded;
			this.plugin.saveSettings();
		});

		if (outgoingLinks.length > 0) {
			outgoingLinks.forEach((link) => {
				this.createLinkItem(outgoingList, link.link);
			});
		}

		// Incoming links (backlinks)
		// @ts-ignore - getBacklinksForFile is available but not in types
		const backlinks = this.app.metadataCache.getBacklinksForFile?.(file);
		const incomingLinks = backlinks?.data ? Object.keys(backlinks.data) : [];
		
		const incomingSection = content.createDiv({ cls: "lemon-links-section" });

		const incomingHeader = incomingSection.createDiv({ cls: "lemon-links-header" });
		incomingHeader.style.display = "flex";
		incomingHeader.style.justifyContent = "space-between";
		incomingHeader.style.padding = "4px 8px";
		incomingHeader.style.cursor = "pointer";
		incomingHeader.style.fontWeight = "500";

		const incomingTitle = incomingHeader.createSpan();
		incomingTitle.textContent = t('incomingLinks', { count: incomingLinks.length.toString() });

		const incomingList = incomingSection.createDiv({ cls: "lemon-links-list" });
		incomingList.style.paddingLeft = "8px";

		const isIncomingExpanded = this.plugin.settings.fileInfoCollapsedSections?.incomingLinks !== false;
		incomingList.style.display = isIncomingExpanded ? "block" : "none";

		incomingHeader.addEventListener("click", () => {
			const isExpanded = incomingList.style.display !== "none";
			incomingList.style.display = isExpanded ? "none" : "block";
			this.plugin.settings.fileInfoCollapsedSections = this.plugin.settings.fileInfoCollapsedSections || {};
			this.plugin.settings.fileInfoCollapsedSections.incomingLinks = !isExpanded;
			this.plugin.saveSettings();
		});

		if (incomingLinks.length > 0) {
			incomingLinks.forEach((linkPath) => {
				const linkedFile = this.app.vault.getAbstractFileByPath(linkPath);
				if (linkedFile instanceof TFile) {
					this.createLinkItem(incomingList, linkedFile.basename);
				}
			});
		}
	}

	private createLinkItem(container: HTMLElement, linkText: string): void {
		const linkItem = container.createEl("a", { cls: "lemon-link-item" });
		linkItem.textContent = linkText;
		linkItem.style.display = "block";
		linkItem.style.padding = "4px 8px";
		linkItem.style.color = "var(--link-color)";
		linkItem.style.cursor = "pointer";
		linkItem.style.textDecoration = "none";

		linkItem.addEventListener("click", async () => {
			const file = this.app.metadataCache.getFirstLinkpathDest(linkText, "");
			if (file) {
				await this.app.workspace.getLeaf().openFile(file);
			}
		});

		linkItem.addEventListener("mouseenter", () => {
			linkItem.style.backgroundColor = "var(--background-modifier-hover)";
		});

		linkItem.addEventListener("mouseleave", () => {
			linkItem.style.backgroundColor = "";
		});
	}

	private renderLocation(file: TFile): void {
		const section = this.createSection(t('location'), "location");
		const content = section.content;

		const pathParts = file.path.split("/");
		pathParts.pop(); // Remove filename

		if (pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === "")) {
			const rootMsg = content.createDiv();
			rootMsg.style.padding = "8px";
			rootMsg.textContent = "📁 " + t('root');
			return;
		}

		const breadcrumb = content.createDiv({ cls: "lemon-breadcrumb" });
		breadcrumb.style.padding = "8px";
		breadcrumb.style.display = "flex";
		breadcrumb.style.flexWrap = "wrap";
		breadcrumb.style.gap = "4px";
		breadcrumb.style.alignItems = "center";

		breadcrumb.createSpan({ text: "📁 " });

		pathParts.forEach((part, index) => {
			if (index > 0) {
				breadcrumb.createSpan({ text: " / ", cls: "lemon-breadcrumb-separator" });
			}

			const partEl = breadcrumb.createEl("a", { text: part, cls: "lemon-breadcrumb-part" });
			partEl.style.color = "var(--link-color)";
			partEl.style.cursor = "pointer";
			partEl.style.textDecoration = "none";

			partEl.addEventListener("click", () => {
				const folderPath = pathParts.slice(0, index + 1).join("/");
				// @ts-ignore
				this.app.internalPlugins.getPluginById("file-explorer").instance.revealInFolder(file);
			});
		});
	}

	private createSection(title: string, id: string): { container: HTMLElement; content: HTMLElement } {
		const container = this.viewContentEl.createDiv({ cls: `lemon-section lemon-section-${id}` });
		container.style.borderBottom = "1px solid var(--background-modifier-border)";
		container.style.padding = "12px 0";

		const header = container.createDiv({ cls: "lemon-section-header" });
		header.style.padding = "0 16px 8px 16px";
		header.style.fontWeight = "600";
		header.style.fontSize = "0.95em";
		header.style.color = "var(--text-normal)";
		header.textContent = title;

		const content = container.createDiv({ cls: "lemon-section-content" });
		content.style.padding = "0 16px";

		return { container, content };
	}

	private createInfoRow(container: HTMLElement, label: string, value: string, copyable: boolean = false): void {
		const row = container.createDiv({ cls: "lemon-info-row" });
		row.style.padding = "6px 0";
		row.style.display = "flex";
		row.style.justifyContent = "space-between";
		row.style.gap = "12px";

		const labelEl = row.createEl("span", { cls: "lemon-info-label" });
		labelEl.textContent = label;
		labelEl.style.color = "var(--text-muted)";
		labelEl.style.fontSize = "0.9em";
		labelEl.style.minWidth = "100px";

		const valueEl = row.createEl("span", { cls: "lemon-info-value" });
		valueEl.textContent = value;
		valueEl.style.flex = "1";
		valueEl.style.textAlign = "right";
		valueEl.style.fontSize = "0.9em";
		valueEl.style.wordBreak = "break-all";

		if (copyable) {
			valueEl.style.cursor = "pointer";
			valueEl.style.color = "var(--link-color)";
			valueEl.setAttribute("aria-label", t('clickToCopy'));

			valueEl.addEventListener("click", async () => {
				await navigator.clipboard.writeText(value);
				new Notice(t('copied', { text: value }));
			});

			valueEl.addEventListener("mouseenter", () => {
				valueEl.style.textDecoration = "underline";
			});

			valueEl.addEventListener("mouseleave", () => {
				valueEl.style.textDecoration = "none";
			});
		}
	}

	private formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		const format = this.plugin.settings.dateTimeFormat || "YYYY-MM-DD HH:mm";
		
		// Simple format implementation
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");

		return format
			.replace("YYYY", String(year))
			.replace("MM", month)
			.replace("DD", day)
			.replace("HH", hours)
			.replace("mm", minutes);
	}

	private formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
		return (bytes / (1024 * 1024)).toFixed(2) + " MB";
	}

	private calculateStats(content: string): {
		characters: number;
		words: number;
		paragraphs: number;
		readingTime: string;
	} {
		const characters = content.length;
		const words = content.trim().split(/\s+/).filter((w) => w.length > 0).length;
		const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0).length;
		
		// Estimate reading time (average 200 words per minute)
		const minutes = Math.ceil(words / 200);
		const readingTime = t('minutesCount', { count: minutes.toString(), s: minutes === 1 ? '' : 's' });

		return { characters, words, paragraphs, readingTime };
	}
}
