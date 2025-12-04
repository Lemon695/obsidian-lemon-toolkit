import { App, Modal, Notice } from "obsidian";
import { ContentBlock } from "./SmartCopyManager";
import { t } from "../../i18n/locale";

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
		header.createEl("h2", { text: t('smartCopySelectContent') });

		const desc = contentEl.createDiv({ cls: "lemon-modal-desc" });
		desc.textContent = t('smartCopyModalDesc');

		// Blocks list
		this.listContainer = contentEl.createDiv({ cls: "lemon-smart-copy-list" });
		this.renderBlocksList();

		// Footer
		const footer = contentEl.createDiv({ cls: "lemon-modal-footer" });

		// Left side - Select all/none
		const leftActions = footer.createDiv({ cls: "lemon-footer-left" });

		const selectAllBtn = leftActions.createEl("button", { text: t('selectAll') });
		selectAllBtn.addEventListener("click", () => {
			this.blocks.forEach((_, index) => this.selectedBlocks.add(index));
			this.renderBlocksList();
		});

		const selectNoneBtn = leftActions.createEl("button", { text: t('deselectAll') });
		selectNoneBtn.addEventListener("click", () => {
			this.selectedBlocks.clear();
			this.renderBlocksList();
		});

		// Type filters
		const types = new Set(this.blocks.map(b => b.type));
		
		if (types.has("heading")) {
			const headingsBtn = leftActions.createEl("button", { 
				text: t('headingsCount', { count: this.blocks.filter(b => b.type === "heading").length.toString() }),
				cls: "lemon-type-filter-btn"
			});
			headingsBtn.addEventListener("click", () => this.toggleType("heading"));
		}

		if (types.has("code")) {
			const codeBtn = leftActions.createEl("button", { 
				text: t('codeCount', { count: this.blocks.filter(b => b.type === "code").length.toString() }),
				cls: "lemon-type-filter-btn"
			});
			codeBtn.addEventListener("click", () => this.toggleType("code"));
		}

		if (types.has("table")) {
			const tableBtn = leftActions.createEl("button", { 
				text: t('tablesCount', { count: this.blocks.filter(b => b.type === "table").length.toString() }),
				cls: "lemon-type-filter-btn"
			});
			tableBtn.addEventListener("click", () => this.toggleType("table"));
		}

		// Right side - Cancel and Copy
		const rightActions = footer.createDiv({ cls: "lemon-footer-right" });

		const cancelBtn = rightActions.createEl("button", { text: t('cancel') });
		cancelBtn.addEventListener("click", () => this.close());

		const copyBtn = rightActions.createEl("button", { text: t('copySelected'), cls: "mod-cta" });
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
			empty.textContent = t('noContentBlocksFound');
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
			meta.textContent = t('linesRange', { 
				start: (block.startLine + 1).toString(), 
				end: (block.endLine + 1).toString(), 
				count: lineCount.toString() 
			});

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
		const summaryText = t('blocksSelected', { 
			selected: this.selectedBlocks.size.toString(), 
			total: this.blocks.length.toString() 
		});
		summary.innerHTML = summaryText.replace(/(\d+)/g, '<span class="lemon-stat-highlight">$1</span>');
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
			heading: t('typeHeading'),
			code: t('typeCode'),
			table: t('typeTable'),
			list: t('typeList'),
			paragraph: t('typeParagraph'),
		};
		return names[type] || type;
	}

	private getBlockTitle(block: ContentBlock): string {
		if (block.type === "heading" && block.title) {
			return `${"#".repeat(block.level || 1)} ${block.title}`;
		}
		if (block.type === "code" && block.language) {
			return t('codeLanguage', { language: block.language });
		}
		if (block.type === "table") {
			return t('typeTable');
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
			new Notice(t('noBlocksSelected'));
			return;
		}

		// Get selected blocks in order
		const selectedIndices = Array.from(this.selectedBlocks).sort((a, b) => a - b);
		const selectedContent = selectedIndices.map(index => this.blocks[index].content);

		// Combine with double newline separator
		const combined = selectedContent.join("\n\n");

		// Copy to clipboard
		await navigator.clipboard.writeText(combined);

		new Notice(t('copiedBlocksToClipboard', { 
			count: this.selectedBlocks.size.toString(), 
			s: this.selectedBlocks.size > 1 ? "s" : "" 
		}));
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
