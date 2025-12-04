import { App, Modal } from "obsidian";
import { ConversionType, LinkMatch, LinkType } from "./LinkConverterManager";

interface LinkMatchWithSelection extends LinkMatch {
	selected?: boolean;
}

export class LinkConverterPreviewModal extends Modal {
	private matches: LinkMatchWithSelection[];
	private type: ConversionType;
	private onConfirm: (matches: LinkMatch[]) => Promise<void>;
	private listContainer: HTMLElement;

	constructor(
		app: App,
		matches: LinkMatch[],
		type: ConversionType,
		onConfirm: (matches: LinkMatch[]) => Promise<void>
	) {
		super(app);
		this.matches = matches.map(m => ({ ...m, selected: true }));
		this.type = type;
		this.onConfirm = onConfirm;
	}

	private getTypeCounts(): { images: number; videos: number; documents: number } {
		return {
			images: this.matches.filter(m => m.linkType === "image").length,
			videos: this.matches.filter(m => m.linkType === "video").length,
			documents: this.matches.filter(m => m.linkType === "document").length,
		};
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lemon-link-converter-modal");

		// Header
		const header = contentEl.createDiv({ cls: "lemon-link-converter-header" });
		const title = this.type === "wiki-to-markdown" 
			? "Convert Wiki Links to Markdown Links"
			: "Convert Markdown Links to Wiki Links";
		header.createEl("h2", { text: title });

		// Description
		const desc = contentEl.createDiv({ cls: "lemon-link-converter-desc" });
		desc.innerHTML = `Select links to convert. <span class="lemon-highlight-text">${this.matches.length} link${this.matches.length > 1 ? "s" : ""} found</span>.`;

		// Links list
		this.listContainer = contentEl.createDiv({ cls: "lemon-link-converter-list" });
		this.renderLinksList();

		// Footer
		const footer = contentEl.createDiv({ cls: "lemon-link-converter-footer" });

		// Left side - Select all/none and type filters
		const leftActions = footer.createDiv({ cls: "lemon-footer-left" });

		const selectAllBtn = leftActions.createEl("button", { text: "All" });
		selectAllBtn.addEventListener("click", () => {
			this.matches.forEach(m => m.selected = true);
			this.renderLinksList();
		});

		const selectNoneBtn = leftActions.createEl("button", { text: "None" });
		selectNoneBtn.addEventListener("click", () => {
			this.matches.forEach(m => m.selected = false);
			this.renderLinksList();
		});

		// Type filter buttons
		const counts = this.getTypeCounts();

		if (counts.images > 0) {
			const imagesBtn = leftActions.createEl("button", { 
				text: `Images (${counts.images})`,
				cls: "lemon-type-filter-btn"
			});
			imagesBtn.addEventListener("click", () => {
				// Toggle images: if all images are selected, deselect them; otherwise select them
				const imageMatches = this.matches.filter(m => m.linkType === "image");
				const allSelected = imageMatches.every(m => m.selected);
				imageMatches.forEach(m => m.selected = !allSelected);
				this.renderLinksList();
			});
		}

		if (counts.videos > 0) {
			const videosBtn = leftActions.createEl("button", { 
				text: `Videos (${counts.videos})`,
				cls: "lemon-type-filter-btn"
			});
			videosBtn.addEventListener("click", () => {
				const videoMatches = this.matches.filter(m => m.linkType === "video");
				const allSelected = videoMatches.every(m => m.selected);
				videoMatches.forEach(m => m.selected = !allSelected);
				this.renderLinksList();
			});
		}

		if (counts.documents > 0) {
			const docsBtn = leftActions.createEl("button", { 
				text: `Docs (${counts.documents})`,
				cls: "lemon-type-filter-btn"
			});
			docsBtn.addEventListener("click", () => {
				const docMatches = this.matches.filter(m => m.linkType === "document");
				const allSelected = docMatches.every(m => m.selected);
				docMatches.forEach(m => m.selected = !allSelected);
				this.renderLinksList();
			});
		}

		// Right side - Cancel and Convert
		const rightActions = footer.createDiv({ cls: "lemon-footer-right" });

		const cancelBtn = rightActions.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const convertBtn = rightActions.createEl("button", { 
			text: "Convert Links", 
			cls: "mod-cta" 
		});
		convertBtn.addEventListener("click", async () => {
			const selectedMatches = this.matches.filter(m => m.selected);
			if (selectedMatches.length === 0) {
				return;
			}
			await this.onConfirm(selectedMatches);
			this.close();
		});
	}

	private renderLinksList(): void {
		this.listContainer.empty();

		this.matches.forEach((match, index) => {
			const item = this.listContainer.createDiv({ cls: "lemon-link-item" });
			
			// Add type class
			item.addClass(`lemon-link-type-${match.linkType}`);
			
			if (!match.selected) {
				item.addClass("lemon-link-item-unselected");
			}

			// Checkbox
			const checkbox = item.createEl("input", { 
				type: "checkbox",
				cls: "lemon-link-checkbox"
			});
			checkbox.checked = match.selected ?? true;
			checkbox.addEventListener("change", (e) => {
				e.stopPropagation();
				match.selected = checkbox.checked;
				this.renderLinksList();
			});

			// Content
			const content = item.createDiv({ cls: "lemon-link-content" });

			// Line number and type badge
			const header = content.createDiv({ cls: "lemon-link-header" });
			
			header.createSpan({ 
				text: `Line ${match.line + 1}`,
				cls: "lemon-link-line"
			});

			// Type badge
			const typeIcons = {
				image: "🖼️",
				video: "🎬",
				document: "📄"
			};
			const typeBadge = header.createSpan({ 
				text: `${typeIcons[match.linkType]} ${match.linkType}`,
				cls: `lemon-link-type-badge lemon-type-${match.linkType}`
			});

			// Conversion display
			const conversion = content.createDiv({ cls: "lemon-link-conversion" });
			
			const fromDiv = conversion.createDiv({ cls: "lemon-link-from" });
			fromDiv.createSpan({ text: "From: ", cls: "lemon-link-label" });
			fromDiv.createEl("code", { text: match.original, cls: "lemon-link-code" });

			const arrow = conversion.createDiv({ cls: "lemon-link-arrow" });
			arrow.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>`;

			const toDiv = conversion.createDiv({ cls: "lemon-link-to" });
			toDiv.createSpan({ text: "To: ", cls: "lemon-link-label" });
			toDiv.createEl("code", { text: match.converted, cls: "lemon-link-code lemon-link-code-new" });

			// Click to toggle
			item.addEventListener("click", (e) => {
				if (e.target !== checkbox) {
					checkbox.checked = !checkbox.checked;
					match.selected = checkbox.checked;
					this.renderLinksList();
				}
			});
		});

		// Summary
		const selectedCount = this.matches.filter(m => m.selected).length;
		const summary = this.listContainer.createDiv({ cls: "lemon-link-summary" });
		summary.innerHTML = `<span class="lemon-stat-highlight">${selectedCount}</span> of <span class="lemon-stat-highlight">${this.matches.length}</span> links selected`;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
