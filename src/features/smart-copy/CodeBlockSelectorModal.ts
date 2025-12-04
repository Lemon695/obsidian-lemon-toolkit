import { App, Modal, Notice } from "obsidian";
import { ContentBlock } from "./SmartCopyManager";

export class CodeBlockSelectorModal extends Modal {
	private codeBlocks: ContentBlock[];
	private selectedBlocks: Set<number> = new Set();
	private listContainer: HTMLElement;

	constructor(app: App, codeBlocks: ContentBlock[]) {
		super(app);
		this.codeBlocks = codeBlocks;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lemon-code-block-selector-modal");

		// Header
		const header = contentEl.createDiv({ cls: "lemon-modal-header" });
		header.createEl("h2", { text: "Select Code Blocks to Copy" });

		const desc = contentEl.createDiv({ cls: "lemon-modal-desc" });
		desc.textContent = "Select one or more code blocks. They will be combined with blank lines between them.";

		// Code blocks list
		this.listContainer = contentEl.createDiv({ cls: "lemon-code-blocks-list" });
		this.renderBlocksList();

		// Footer
		const footer = contentEl.createDiv({ cls: "lemon-modal-footer" });

		// Left side - Select all/none and language filters
		const leftActions = footer.createDiv({ cls: "lemon-footer-left" });

		const selectAllBtn = leftActions.createEl("button", { text: "Select All" });
		selectAllBtn.addEventListener("click", () => {
			this.codeBlocks.forEach((_, index) => this.selectedBlocks.add(index));
			this.renderBlocksList();
		});

		const selectNoneBtn = leftActions.createEl("button", { text: "Deselect All" });
		selectNoneBtn.addEventListener("click", () => {
			this.selectedBlocks.clear();
			this.renderBlocksList();
		});

		// Language filters
		const languages = new Set(this.codeBlocks.map(b => b.language || "plain").filter(Boolean));
		
		languages.forEach(lang => {
			const langBtn = leftActions.createEl("button", { 
				text: `${lang} (${this.codeBlocks.filter(b => (b.language || "plain") === lang).length})`,
				cls: "lemon-type-filter-btn"
			});
			langBtn.addEventListener("click", () => this.toggleLanguage(lang));
		});

		// Right side - Cancel and Copy
		const rightActions = footer.createDiv({ cls: "lemon-footer-right" });

		const cancelBtn = rightActions.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const copyBtn = rightActions.createEl("button", { text: "Copy Selected", cls: "mod-cta" });
		copyBtn.addEventListener("click", async () => {
			await this.copySelected();
		});
	}

	private toggleLanguage(language: string): void {
		const langBlocks = this.codeBlocks
			.map((block, index) => ({ block, index }))
			.filter(({ block }) => (block.language || "plain") === language);

		const allSelected = langBlocks.every(({ index }) => this.selectedBlocks.has(index));

		langBlocks.forEach(({ index }) => {
			if (allSelected) {
				this.selectedBlocks.delete(index);
			} else {
				this.selectedBlocks.add(index);
			}
		});

		this.renderBlocksList();
	}

	private renderBlocksList(): void {
		this.listContainer.empty();

		if (this.codeBlocks.length === 0) {
			const empty = this.listContainer.createDiv({ cls: "lemon-empty-state" });
			empty.textContent = "No code blocks found in document";
			return;
		}

		this.codeBlocks.forEach((block, index) => {
			const item = this.listContainer.createDiv({ cls: "lemon-code-block-item" });
			
			if (this.selectedBlocks.has(index)) {
				item.addClass("lemon-code-block-selected");
			}

			// Checkbox
			const checkbox = item.createEl("input", { 
				type: "checkbox",
				cls: "lemon-code-block-checkbox"
			});
			checkbox.checked = this.selectedBlocks.has(index);
			checkbox.addEventListener("change", () => {
				if (checkbox.checked) {
					this.selectedBlocks.add(index);
				} else {
					this.selectedBlocks.delete(index);
				}
				this.renderBlocksList();
			});

			// Content
			const content = item.createDiv({ cls: "lemon-code-block-content" });

			// Header with language and line info
			const header = content.createDiv({ cls: "lemon-code-block-header" });
			
			const languageBadge = header.createSpan({ cls: "lemon-language-badge" });
			const displayLang = block.language || "plain";
			languageBadge.textContent = `💻 ${displayLang}`;

			const lineInfo = header.createSpan({ cls: "lemon-code-block-line-info" });
			const lineCount = block.endLine - block.startLine + 1;
			lineInfo.textContent = `Lines ${block.startLine + 1}-${block.endLine + 1} (${lineCount} lines)`;

			// Preview
			const preview = content.createDiv({ cls: "lemon-code-block-preview" });
			const previewText = this.getPreviewText(block);
			preview.createEl("pre").createEl("code", { text: previewText });

			// Click to toggle
			item.addEventListener("click", (e) => {
				if (e.target !== checkbox) {
					checkbox.checked = !checkbox.checked;
					if (checkbox.checked) {
						this.selectedBlocks.add(index);
					} else {
						this.selectedBlocks.delete(index);
					}
					this.renderBlocksList();
				}
			});
		});

		// Summary
		const summary = this.listContainer.createDiv({ cls: "lemon-code-block-summary" });
		summary.innerHTML = `<span class="lemon-stat-highlight">${this.selectedBlocks.size}</span> of <span class="lemon-stat-highlight">${this.codeBlocks.length}</span> code blocks selected`;
	}

	private getPreviewText(block: ContentBlock): string {
		const lines = block.content.split("\n");
		// Remove first line (```language) and last line (```)
		const codeLines = lines.slice(1, -1);
		
		// Show first 5 lines
		const previewLines = codeLines.slice(0, 5);
		let preview = previewLines.join("\n");
		
		if (codeLines.length > 5) {
			preview += "\n...";
		}
		
		return preview;
	}

	private async copySelected(): Promise<void> {
		if (this.selectedBlocks.size === 0) {
			new Notice("No code blocks selected");
			return;
		}

		// Get selected blocks in order
		const selectedIndices = Array.from(this.selectedBlocks).sort((a, b) => a - b);
		const selectedContent = selectedIndices.map(index => this.codeBlocks[index].content);

		// Combine with double newline separator (blank line between blocks)
		const combined = selectedContent.join("\n\n");

		// Copy to clipboard
		await navigator.clipboard.writeText(combined);

		new Notice(`Copied ${this.selectedBlocks.size} code block${this.selectedBlocks.size > 1 ? "s" : ""} to clipboard`);
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
