import { App, Modal, Notice } from "obsidian";
import { t } from "../../i18n/legacy";

export class TableRowSelectorModal extends Modal {
	private tableContent: string;
	private selectedRows: Set<number> = new Set();
	private rows: string[];
	private listContainer: HTMLElement;

	constructor(app: App, tableContent: string) {
		super(app);
		this.tableContent = tableContent;
		this.rows = tableContent.split("\n").filter(line => line.trim());
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lemon-table-row-selector-modal");

		// Header
		const header = contentEl.createDiv({ cls: "lemon-modal-header" });
		header.createEl("h2", { text: t('selectTableRowsToCopy') });

		const desc = contentEl.createDiv({ cls: "lemon-modal-desc" });
		desc.textContent = t('selectTableRowsDesc');

		// Rows list
		this.listContainer = contentEl.createDiv({ cls: "lemon-table-rows-list" });
		this.renderRowsList();

		// Footer
		const footer = contentEl.createDiv({ cls: "lemon-modal-footer" });

		// Left side
		const leftActions = footer.createDiv({ cls: "lemon-footer-left" });

		const selectAllBtn = leftActions.createEl("button", { text: t('selectAll') });
		selectAllBtn.addEventListener("click", () => {
			this.rows.forEach((_, index) => this.selectedRows.add(index));
			this.renderRowsList();
		});

		const selectNoneBtn = leftActions.createEl("button", { text: t('deselectAll') });
		selectNoneBtn.addEventListener("click", () => {
			this.selectedRows.clear();
			this.renderRowsList();
		});

		// Right side
		const rightActions = footer.createDiv({ cls: "lemon-footer-right" });

		const cancelBtn = rightActions.createEl("button", { text: t('cancel') });
		cancelBtn.addEventListener("click", () => this.close());

		const copyBtn = rightActions.createEl("button", { text: t('copySelected'), cls: "mod-cta" });
		copyBtn.addEventListener("click", async () => {
			await this.copySelected();
		});
	}

	private renderRowsList(): void {
		this.listContainer.empty();

		this.rows.forEach((row, index) => {
			const item = this.listContainer.createDiv({ cls: "lemon-table-row-item" });
			
			if (this.selectedRows.has(index)) {
				item.addClass("lemon-row-selected");
			}

			// Checkbox
			const checkbox = item.createEl("input", { 
				type: "checkbox",
				cls: "lemon-row-checkbox"
			});
			checkbox.checked = this.selectedRows.has(index);
			checkbox.addEventListener("change", () => {
				if (checkbox.checked) {
					this.selectedRows.add(index);
				} else {
					this.selectedRows.delete(index);
				}
				this.renderRowsList();
			});

			// Row number
			const rowNum = item.createDiv({ cls: "lemon-row-number" });
			rowNum.textContent = `Row ${index + 1}`;

			// Detect if it's header separator
			const isHeaderSep = row.trim().match(/^\|[\s:-]+\|/);
			if (isHeaderSep) {
				rowNum.textContent += " (separator)";
				rowNum.style.color = "var(--text-muted)";
			}

			// Row content preview
			const content = item.createDiv({ cls: "lemon-row-content" });
			content.textContent = row;

			// Click to toggle
			item.addEventListener("click", (e) => {
				if (e.target !== checkbox) {
					checkbox.checked = !checkbox.checked;
					if (checkbox.checked) {
						this.selectedRows.add(index);
					} else {
						this.selectedRows.delete(index);
					}
					this.renderRowsList();
				}
			});
		});

		// Summary
		const summary = this.listContainer.createDiv({ cls: "lemon-row-summary" });
		summary.innerHTML = `<span class="lemon-stat-highlight">${this.selectedRows.size}</span> of <span class="lemon-stat-highlight">${this.rows.length}</span> rows selected`;
	}

	private async copySelected(): Promise<void> {
		if (this.selectedRows.size === 0) {
			new Notice(t('noRowsSelected'));
			return;
		}

		// Get selected rows in order
		const selectedIndices = Array.from(this.selectedRows).sort((a, b) => a - b);
		const selectedContent = selectedIndices.map(index => this.rows[index]);

		// Combine rows
		const combined = selectedContent.join("\n");

		// Copy to clipboard
		await navigator.clipboard.writeText(combined);

		new Notice(t('copiedRowsToClipboard', { 
			count: this.selectedRows.size.toString(), 
			s: this.selectedRows.size > 1 ? "s" : "" 
		}));
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
