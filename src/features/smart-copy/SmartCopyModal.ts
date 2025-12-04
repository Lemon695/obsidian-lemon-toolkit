import { App, Modal, Notice } from "obsidian";
import { ContentBlock } from "./SmartCopyManager";

export class SmartCopyModal extends Modal {
	private blocks: ContentBlock[];
	private selectedBlocks: Set<number> = new Set();
	private listContainer: HTMLElement;

	constructor(app: App, blocks: ContentBlock[]) {
		super(app);
		this.blocks = blocks;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lemon-smart-copy-modal");

		// Header
		const header = contentEl.createDiv({ cls: "lemon-modal-header" });
		header.createEl("h2", { text: "Smart Copy - Select Content" });

		const desc = contentEl.createDiv({ cls: "lemon-modal-desc" });
		desc.textContent = "Select one or more blocks to copy. Multiple selections will be combined.";

		// Blocks list
		this.listContainer = contentEl.createDiv({ cls: "lemon-smart-copy-list" });
		this.renderBlocksList();

		// Footer
		const footer = contentEl.createDiv({ cls: "lemon-modal-footer" });

		// Left side - Select all/none
		const leftActions = footer.createDiv({ cls: "lemon-footer-left" });

		const selectAllBtn = leftActions.createEl("button", { text: "Select All" });
		selectAllBtn.addEventListener("click", () => {
			this.blocks.forEach((_, index) => this.selectedBlocks.add(index));
			this.renderBlocksList();
		});

		const selectNoneBtn = leftActions.createEl("button", { text: "Deselect All" });
		selectNoneBtn.addEventListener("click", () => {
			this.selectedBlocks.clear();
			this.renderBlocksList();
		});

		// Type filters
		const types = new Set(this.blocks.map(b => b.type));
		
		if (types.has("heading")) {
			const headingsBtn = leftActions.createEl("button", { 
				text: `Headings (${this.blocks.filter(b => b.type === "heading").length})`,
				cls: "lemon-type-filter-btn"
			});
			headingsBtn.addEventListener("click", () => this.toggleType("heading"));
		}

		if (types.has("code")) {
			const codeBtn = leftActions.createEl("button", { 
				text: `Code (${this.blocks.filter(b => b.type === "code").length})`,
				cls: "lemon-type-filter-btn"
			});
			codeBtn.addEventListener("click", () => this.toggleType("code"));
		}

		if (types.has("table")) {
			const tableBtn = leftActions.createEl("button", { 
				text: `Tables (${this.blocks.filter(b => b.type === "table").length})`,
				cls: "lemon-type-filter-btn"
			});
			tableBtn.addEventListener("click", () => this.toggleType("table"));
		}

		// Right side - Cancel and Copy
		const rightActions = footer.createDiv({ cls: "lemon-footer-right" });

		const cancelBtn = rightActions.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const copyBtn = rightActions.createEl("button", { text: "Copy Selected", cls: "mod-cta" });
		copyBtn.addEventListener("click", async () => {
			await this.copySelected();
		});
	}

	private toggleType(type: string): void {
		const typeBlocks = this.blocks
			.map((block, index) => ({ block, index }))
			.filter(({ block }) => block.type === type);

		const allSelected = typeBlocks.every(({ index }) => this.selectedBlocks.has(index));

		typeBlocks.forEach(({ index }) => {
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

		if (this.blocks.length === 0) {
			const empty = this.listContainer.createDiv({ cls: "lemon-empty-state" });
			empty.textContent = "No content blocks found in document";
			return;
		}

		this.blocks.forEach((block, index) => {
			const item = this.listContainer.createDiv({ cls: "lemon-copy-block-item" });
			
			if (this.selectedBlocks.has(index)) {
				item.addClass("lemon-block-selected");
			}

			// Checkbox
			const checkbox = item.createEl("input", { 
				type: "checkbox",
				cls: "lemon-block-checkbox"
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
			const content = item.createDiv({ cls: "lemon-block-content" });

			// Type badge and title
			const header = content.createDiv({ cls: "lemon-block-header" });
			
			const typeBadge = header.createSpan({ 
				cls: `lemon-block-type-badge lemon-type-${block.type}`
			});
			typeBadge.textContent = this.getTypeIcon(block.type) + " " + this.getTypeName(block.type);

			const title = header.createSpan({ cls: "lemon-block-title" });
			title.textContent = this.getBlockTitle(block);

			// Meta info
			const meta = content.createDiv({ cls: "lemon-block-meta" });
			const lineCount = block.endLine - block.startLine + 1;
			meta.textContent = `Lines ${block.startLine + 1}-${block.endLine + 1} (${lineCount} lines)`;

			// Preview
			const preview = content.createDiv({ cls: "lemon-block-preview" });
			const previewText = this.getPreviewText(block);
			preview.textContent = previewText;

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
		const summary = this.listContainer.createDiv({ cls: "lemon-copy-summary" });
		summary.innerHTML = `<span class="lemon-stat-highlight">${this.selectedBlocks.size}</span> of <span class="lemon-stat-highlight">${this.blocks.length}</span> blocks selected`;
	}

	private getTypeIcon(type: string): string {
		const icons: Record<string, string> = {
			heading: "📑",
			code: "💻",
			table: "📊",
			list: "📝",
			paragraph: "📄",
		};
		return icons[type] || "📄";
	}

	private getTypeName(type: string): string {
		const names: Record<string, string> = {
			heading: "Heading",
			code: "Code",
			table: "Table",
			list: "List",
			paragraph: "Paragraph",
		};
		return names[type] || type;
	}

	private getBlockTitle(block: ContentBlock): string {
		if (block.type === "heading" && block.title) {
			return `${"#".repeat(block.level || 1)} ${block.title}`;
		}
		if (block.type === "code" && block.language) {
			return `Code (${block.language})`;
		}
		if (block.type === "table") {
			return "Table";
		}
		return "Content";
	}

	private getPreviewText(block: ContentBlock): string {
		const lines = block.content.split("\n");
		const previewLines = lines.slice(0, 3);
		let preview = previewLines.join(" ").substring(0, 100);
		if (lines.length > 3 || preview.length >= 100) {
			preview += "...";
		}
		return preview;
	}

	private async copySelected(): Promise<void> {
		if (this.selectedBlocks.size === 0) {
			new Notice("No blocks selected");
			return;
		}

		// Get selected blocks in order
		const selectedIndices = Array.from(this.selectedBlocks).sort((a, b) => a - b);
		const selectedContent = selectedIndices.map(index => this.blocks[index].content);

		// Combine with double newline separator
		const combined = selectedContent.join("\n\n");

		// Copy to clipboard
		await navigator.clipboard.writeText(combined);

		new Notice(`Copied ${this.selectedBlocks.size} block${this.selectedBlocks.size > 1 ? "s" : ""} to clipboard`);
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
