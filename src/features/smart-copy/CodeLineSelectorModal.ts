import { App, Modal, Notice } from "obsidian";
import { t } from "../../i18n/legacy";

export class CodeLineSelectorModal extends Modal {
	private codeContent: string;
	private language: string;
	private selectedLines: Set<number> = new Set();
	private lines: string[];
	private listContainer: HTMLElement;

	constructor(app: App, codeContent: string, language: string) {
		super(app);
		this.codeContent = codeContent;
		this.language = language;
		
		// Parse code block (remove ``` markers)
		const allLines = codeContent.split("\n");
		// Remove first line (```language) and last line (```)
		this.lines = allLines.slice(1, -1);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lemon-code-line-selector-modal");

		// Header
		const header = contentEl.createDiv({ cls: "lemon-modal-header" });
		header.createEl("h2", { text: t('selectCodeLinesToCopy') });

		const desc = contentEl.createDiv({ cls: "lemon-modal-desc" });
		desc.textContent = t('selectCodeLinesDesc');

		// Lines list
		this.listContainer = contentEl.createDiv({ cls: "lemon-code-lines-list" });
		this.renderLinesList();

		// Footer
		const footer = contentEl.createDiv({ cls: "lemon-modal-footer" });

		// Left side
		const leftActions = footer.createDiv({ cls: "lemon-footer-left" });

		const selectAllBtn = leftActions.createEl("button", { text: t('selectAll') });
		selectAllBtn.addEventListener("click", () => {
			this.lines.forEach((_, index) => this.selectedLines.add(index));
			this.renderLinesList();
		});

		const selectNoneBtn = leftActions.createEl("button", { text: t('deselectAll') });
		selectNoneBtn.addEventListener("click", () => {
			this.selectedLines.clear();
			this.renderLinesList();
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

	private renderLinesList(): void {
		this.listContainer.empty();

		this.lines.forEach((line, index) => {
			const item = this.listContainer.createDiv({ cls: "lemon-code-line-item" });
			
			if (this.selectedLines.has(index)) {
				item.addClass("lemon-line-selected");
			}

			// Checkbox
			const checkbox = item.createEl("input", { 
				type: "checkbox",
				cls: "lemon-line-checkbox"
			});
			checkbox.checked = this.selectedLines.has(index);
			checkbox.addEventListener("change", () => {
				if (checkbox.checked) {
					this.selectedLines.add(index);
				} else {
					this.selectedLines.delete(index);
				}
				this.renderLinesList();
			});

			// Line number
			const lineNum = item.createDiv({ cls: "lemon-line-number" });
			lineNum.textContent = `${index + 1}`;

			// Line content
			const content = item.createEl("code", { cls: "lemon-line-content" });
			content.textContent = line || " "; // Show space for empty lines

			// Click to toggle
			item.addEventListener("click", (e) => {
				if (e.target !== checkbox) {
					checkbox.checked = !checkbox.checked;
					if (checkbox.checked) {
						this.selectedLines.add(index);
					} else {
						this.selectedLines.delete(index);
					}
					this.renderLinesList();
				}
			});
		});

		// Summary
		const summary = this.listContainer.createDiv({ cls: "lemon-line-summary" });
		summary.innerHTML = `<span class="lemon-stat-highlight">${this.selectedLines.size}</span> of <span class="lemon-stat-highlight">${this.lines.length}</span> lines selected`;
	}

	private async copySelected(): Promise<void> {
		if (this.selectedLines.size === 0) {
			new Notice(t('noLinesSelected'));
			return;
		}

		// Get selected lines in order
		const selectedIndices = Array.from(this.selectedLines).sort((a, b) => a - b);
		const selectedContent = selectedIndices.map(index => this.lines[index]);

		// Wrap in code block if language is specified
		let combined: string;
		if (this.language) {
			combined = `\`\`\`${this.language}\n${selectedContent.join("\n")}\n\`\`\``;
		} else {
			combined = `\`\`\`\n${selectedContent.join("\n")}\n\`\`\``;
		}

		// Copy to clipboard
		await navigator.clipboard.writeText(combined);

		new Notice(t('copiedLinesToClipboard', { 
			count: this.selectedLines.size.toString(), 
			s: this.selectedLines.size > 1 ? "s" : "" 
		}));
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
