import { App, Modal } from "obsidian";

interface HeadingInfo {
	line: number;
	level: number;
	text: string;
	originalText: string;
	number: string;
	originalNumber: string;
	hasNumber: boolean;
	isModified: boolean;
	included: boolean;
}

export class HeadingNumberingPreviewModal extends Modal {
	private headings: HeadingInfo[];
	private onConfirm: (headings: HeadingInfo[]) => Promise<void>;
	private onRecalculate: (headings: HeadingInfo[]) => HeadingInfo[];
	private listContainer: HTMLElement;

	constructor(
		app: App, 
		headings: HeadingInfo[], 
		onConfirm: (headings: HeadingInfo[]) => Promise<void>,
		onRecalculate: (headings: HeadingInfo[]) => HeadingInfo[]
	) {
		super(app);
		this.headings = headings;
		this.onConfirm = onConfirm;
		this.onRecalculate = onRecalculate;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lemon-heading-preview-modal");

		// Header
		const header = contentEl.createDiv({ cls: "lemon-heading-modal-header" });
		const title = header.createEl("h2", { text: "Preview Heading Numbering" });

		// Description
		const desc = contentEl.createDiv({ cls: "lemon-heading-modal-desc" });
		desc.innerHTML = "Select headings to include in numbering. Uncheck to exclude a heading. <span class='lemon-highlight-text'>Modified headings</span> are highlighted.";

		// Headings list
		this.listContainer = contentEl.createDiv({ cls: "lemon-headings-list" });
		this.renderHeadingsList();

		// Footer
		const footer = contentEl.createDiv({ cls: "lemon-heading-modal-footer" });

		// Left side - Select all/none buttons
		const leftActions = footer.createDiv({ cls: "lemon-footer-left" });

		const selectAllBtn = leftActions.createEl("button", { text: "Select All" });
		selectAllBtn.addEventListener("click", () => {
			this.headings.forEach(h => h.included = true);
			this.recalculateAndRefresh();
		});

		const selectNoneBtn = leftActions.createEl("button", { text: "Deselect All" });
		selectNoneBtn.addEventListener("click", () => {
			this.headings.forEach(h => h.included = false);
			this.recalculateAndRefresh();
		});

		// Right side - Cancel and Apply buttons
		const rightActions = footer.createDiv({ cls: "lemon-footer-right" });

		const cancelBtn = rightActions.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const confirmBtn = rightActions.createEl("button", { text: "Apply Changes", cls: "mod-cta" });
		confirmBtn.addEventListener("click", async () => {
			await this.onConfirm(this.headings);
			this.close();
		});
	}

	private recalculateAndRefresh(): void {
		// Recalculate numbers based on current inclusion state
		this.headings = this.onRecalculate(this.headings);
		
		// Refresh the list
		this.listContainer.empty();
		this.renderHeadingsList();
	}

	private renderHeadingsList(): void {
		this.headings.forEach((heading) => {
			const item = this.listContainer.createDiv({ cls: "lemon-heading-item" });
			
			// Add state classes
			if (heading.isModified && heading.included) {
				item.addClass("lemon-heading-modified");
			}
			if (!heading.included) {
				item.addClass("lemon-heading-excluded");
			}

			// Checkbox
			const checkbox = item.createEl("input", { 
				type: "checkbox",
				cls: "lemon-heading-checkbox"
			});
			checkbox.checked = heading.included;
			checkbox.addEventListener("change", (e) => {
				e.stopPropagation();
				heading.included = checkbox.checked;
				this.recalculateAndRefresh();
			});

			// Content wrapper with indent
			const indent = (heading.level - 1) * 24;
			const contentWrapper = item.createDiv({ cls: "lemon-heading-content" });
			contentWrapper.style.marginLeft = `${indent}px`;

			// Level indicator
			const levelIndicator = contentWrapper.createSpan({ 
				text: `H${heading.level}`,
				cls: "lemon-heading-level"
			});

			// Number
			if (heading.included && heading.number) {
				const numberSpan = contentWrapper.createSpan({ 
					text: `${heading.number}、`,
					cls: "lemon-heading-number"
				});
				if (heading.isModified) {
					numberSpan.addClass("lemon-heading-number-modified");
				}
			} else {
				contentWrapper.createSpan({ 
					text: "—",
					cls: "lemon-heading-placeholder"
				});
			}

			// Text
			const textSpan = contentWrapper.createSpan({ 
				text: heading.text,
				cls: "lemon-heading-text"
			});

			// Modified badge
			if (heading.isModified && heading.included) {
				contentWrapper.createSpan({ 
					text: "Modified",
					cls: "lemon-heading-badge"
				});
			}

			// Click on item to toggle checkbox
			item.addEventListener("click", (e) => {
				if (e.target !== checkbox) {
					checkbox.checked = !checkbox.checked;
					heading.included = checkbox.checked;
					this.recalculateAndRefresh();
				}
			});
		});

		// Summary
		const includedCount = this.headings.filter((h) => h.included).length;
		const modifiedCount = this.headings.filter((h) => h.isModified && h.included).length;
		const summary = this.listContainer.createDiv({ cls: "lemon-heading-summary" });
		
		const leftStats = summary.createSpan();
		leftStats.innerHTML = `<span class="lemon-stat-highlight">${includedCount}</span> of <span class="lemon-stat-highlight">${this.headings.length}</span> headings selected`;
		
		const rightStats = summary.createSpan();
		rightStats.innerHTML = `<span class="lemon-stat-accent">${modifiedCount}</span> will be modified`;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
