import { Editor, Notice } from "obsidian";
import LemonToolkitPlugin from "../../main";
import { t } from "../../i18n/legacy";

export interface ContentBlock {
	type: "heading" | "code" | "table" | "list" | "paragraph";
	startLine: number;
	endLine: number;
	content: string;
	title?: string; // For headings
	level?: number; // For headings
	language?: string; // For code blocks
}

export class SmartCopyManager {
	private plugin: LemonToolkitPlugin;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Copy current heading section (including all content under it)
	 */
	async copyCurrentHeading(editor: Editor): Promise<void> {
		const cursor = editor.getCursor();
		const content = editor.getValue();
		const lines = content.split("\n");

		const headingBlock = this.findCurrentHeadingBlock(lines, cursor.line);

		if (!headingBlock) {
			new Notice(t('noHeadingFoundAtCursor'));
			return;
		}

		await this.copyToClipboard(headingBlock.content);
		new Notice(t('copiedHeadingWithLines', { 
			title: headingBlock.title || '', 
			count: (headingBlock.endLine - headingBlock.startLine + 1).toString() 
		}));
	}

	/**
	 * Copy current code block
	 */
	async copyCurrentCodeBlock(editor: Editor): Promise<void> {
		const cursor = editor.getCursor();
		const content = editor.getValue();
		const lines = content.split("\n");

		const codeBlock = this.findCurrentCodeBlock(lines, cursor.line);

		if (!codeBlock) {
			new Notice(t('noCodeBlockFoundAtCursor'));
			return;
		}

		await this.copyToClipboard(codeBlock.content);
		const lang = codeBlock.language || "code";
		new Notice(t('copiedCodeBlockWithLines', { 
			lang: lang, 
			count: (codeBlock.endLine - codeBlock.startLine + 1).toString() 
		}));
	}

	/**
	 * Copy current table
	 */
	async copyCurrentTable(editor: Editor): Promise<void> {
		const cursor = editor.getCursor();
		const content = editor.getValue();
		const lines = content.split("\n");

		const tableBlock = this.findCurrentTable(lines, cursor.line);

		if (!tableBlock) {
			new Notice(t('noTableFoundAtCursor'));
			return;
		}

		await this.copyToClipboard(tableBlock.content);
		new Notice(t('copiedTableWithRows', { 
			count: (tableBlock.endLine - tableBlock.startLine + 1).toString() 
		}));
	}

	/**
	 * Open table row selector
	 */
	async selectTableRows(editor: Editor): Promise<void> {
		const cursor = editor.getCursor();
		const content = editor.getValue();
		const lines = content.split("\n");

		const tableBlock = this.findCurrentTable(lines, cursor.line);

		if (!tableBlock) {
			new Notice(t('noTableFoundAtCursor'));
			return;
		}

		const { TableRowSelectorModal } = require("./TableRowSelectorModal");
		const modal = new TableRowSelectorModal(this.plugin.app, tableBlock.content);
		modal.open();
	}

	/**
	 * Open code line selector
	 */
	async selectCodeLines(editor: Editor): Promise<void> {
		const cursor = editor.getCursor();
		const content = editor.getValue();
		const lines = content.split("\n");

		const codeBlock = this.findCurrentCodeBlock(lines, cursor.line);

		if (!codeBlock) {
			new Notice(t('noCodeBlockFoundAtCursor'));
			return;
		}

		const { CodeLineSelectorModal } = require("./CodeLineSelectorModal");
		const modal = new CodeLineSelectorModal(
			this.plugin.app, 
			codeBlock.content, 
			codeBlock.language || ""
		);
		modal.open();
	}

	/**
	 * Open code block selector (select multiple code blocks from document)
	 */
	async selectCodeBlocks(editor: Editor): Promise<void> {
		const content = editor.getValue();
		const lines = content.split("\n");

		const codeBlocks = this.findAllCodeBlocks(lines);

		if (codeBlocks.length === 0) {
			new Notice(t('noCodeBlocksFoundInDocument'));
			return;
		}

		const { CodeBlockSelectorModal } = require("./CodeBlockSelectorModal");
		const modal = new CodeBlockSelectorModal(this.plugin.app, codeBlocks);
		modal.open();
	}

	/**
	 * Get all content blocks for selection modal
	 */
	getAllBlocks(editor: Editor): ContentBlock[] {
		const content = editor.getValue();
		const lines = content.split("\n");
		const blocks: ContentBlock[] = [];

		// Find all headings
		const headings = this.findAllHeadings(lines);
		blocks.push(...headings);

		// Find all code blocks
		const codeBlocks = this.findAllCodeBlocks(lines);
		blocks.push(...codeBlocks);

		// Find all tables
		const tables = this.findAllTables(lines);
		blocks.push(...tables);

		// Sort by line number
		blocks.sort((a, b) => a.startLine - b.startLine);

		return blocks;
	}

	/**
	 * Find current heading block based on cursor position
	 */
	private findCurrentHeadingBlock(lines: string[], cursorLine: number): ContentBlock | null {
		// Find the heading that contains the cursor
		let headingLine = -1;
		let headingLevel = 0;
		let headingText = "";

		// Search backwards for the nearest heading
		for (let i = cursorLine; i >= 0; i--) {
			const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
			if (match) {
				headingLine = i;
				headingLevel = match[1].length;
				headingText = match[2];
				break;
			}
		}

		if (headingLine === -1) {
			return null;
		}

		// Find the end of this heading section
		let endLine = lines.length - 1;
		for (let i = headingLine + 1; i < lines.length; i++) {
			const match = lines[i].match(/^(#{1,6})\s+/);
			if (match && match[1].length <= headingLevel) {
				endLine = i - 1;
				break;
			}
		}

		const content = lines.slice(headingLine, endLine + 1).join("\n");

		return {
			type: "heading",
			startLine: headingLine,
			endLine,
			content,
			title: headingText,
			level: headingLevel,
		};
	}

	/**
	 * Find current code block
	 */
	private findCurrentCodeBlock(lines: string[], cursorLine: number): ContentBlock | null {
		let startLine = -1;
		let endLine = -1;
		let language = "";

		// Search backwards for code block start
		for (let i = cursorLine; i >= 0; i--) {
			if (lines[i].startsWith("```")) {
				startLine = i;
				const match = lines[i].match(/^```(\w+)?/);
				language = match?.[1] || "";
				break;
			}
		}

		if (startLine === -1) {
			return null;
		}

		// Search forwards for code block end
		for (let i = startLine + 1; i < lines.length; i++) {
			if (lines[i].startsWith("```")) {
				endLine = i;
				break;
			}
		}

		if (endLine === -1) {
			return null;
		}

		// Check if cursor is within this block
		if (cursorLine < startLine || cursorLine > endLine) {
			return null;
		}

		const content = lines.slice(startLine, endLine + 1).join("\n");

		return {
			type: "code",
			startLine,
			endLine,
			content,
			language,
		};
	}

	/**
	 * Find current table
	 */
	private findCurrentTable(lines: string[], cursorLine: number): ContentBlock | null {
		// Check if current line is part of a table
		if (!lines[cursorLine].includes("|")) {
			return null;
		}

		let startLine = cursorLine;
		let endLine = cursorLine;

		// Search backwards for table start
		for (let i = cursorLine - 1; i >= 0; i--) {
			if (lines[i].includes("|")) {
				startLine = i;
			} else {
				break;
			}
		}

		// Search forwards for table end
		for (let i = cursorLine + 1; i < lines.length; i++) {
			if (lines[i].includes("|")) {
				endLine = i;
			} else {
				break;
			}
		}

		const content = lines.slice(startLine, endLine + 1).join("\n");

		return {
			type: "table",
			startLine,
			endLine,
			content,
		};
	}

	/**
	 * Find all headings in document
	 */
	private findAllHeadings(lines: string[]): ContentBlock[] {
		const headings: ContentBlock[] = [];
		const headingLines: Array<{ line: number; level: number; text: string }> = [];

		// First pass: find all heading lines
		lines.forEach((line, index) => {
			const match = line.match(/^(#{1,6})\s+(.+)$/);
			if (match) {
				headingLines.push({
					line: index,
					level: match[1].length,
					text: match[2],
				});
			}
		});

		// Second pass: determine content for each heading
		headingLines.forEach((heading, index) => {
			const startLine = heading.line;
			let endLine = lines.length - 1;

			// Find next heading of same or higher level
			for (let i = index + 1; i < headingLines.length; i++) {
				if (headingLines[i].level <= heading.level) {
					endLine = headingLines[i].line - 1;
					break;
				}
			}

			const content = lines.slice(startLine, endLine + 1).join("\n");

			headings.push({
				type: "heading",
				startLine,
				endLine,
				content,
				title: heading.text,
				level: heading.level,
			});
		});

		return headings;
	}

	/**
	 * Find all code blocks
	 */
	private findAllCodeBlocks(lines: string[]): ContentBlock[] {
		const blocks: ContentBlock[] = [];
		let inBlock = false;
		let startLine = -1;
		let language = "";

		lines.forEach((line, index) => {
			if (line.startsWith("```")) {
				if (!inBlock) {
					// Start of code block
					inBlock = true;
					startLine = index;
					const match = line.match(/^```(\w+)?/);
					language = match?.[1] || "";
				} else {
					// End of code block
					inBlock = false;
					const content = lines.slice(startLine, index + 1).join("\n");
					blocks.push({
						type: "code",
						startLine,
						endLine: index,
						content,
						language,
					});
				}
			}
		});

		return blocks;
	}

	/**
	 * Find all tables
	 */
	private findAllTables(lines: string[]): ContentBlock[] {
		const tables: ContentBlock[] = [];
		let inTable = false;
		let startLine = -1;

		lines.forEach((line, index) => {
			if (line.includes("|")) {
				if (!inTable) {
					inTable = true;
					startLine = index;
				}
			} else if (inTable) {
				// End of table
				const content = lines.slice(startLine, index).join("\n");
				tables.push({
					type: "table",
					startLine,
					endLine: index - 1,
					content,
				});
				inTable = false;
			}
		});

		// Handle table at end of document
		if (inTable) {
			const content = lines.slice(startLine).join("\n");
			tables.push({
				type: "table",
				startLine,
				endLine: lines.length - 1,
				content,
			});
		}

		return tables;
	}

	/**
	 * Copy text to clipboard
	 */
	private async copyToClipboard(text: string): Promise<void> {
		await navigator.clipboard.writeText(text);
	}
}
