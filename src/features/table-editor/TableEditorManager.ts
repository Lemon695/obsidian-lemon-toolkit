import { Editor, EditorPosition, Notice } from "obsidian";
import LemonToolkitPlugin from "../../main";
import { TableEditorModal } from "./TableEditorModal";
import { t } from "../../i18n/locale";

interface TableCell {
	content: string;
	align?: 'left' | 'center' | 'right';
}

interface TableData {
	headers: TableCell[];
	rows: TableCell[][];
	startLine: number;
	endLine: number;
}

export class TableEditorManager {
	private plugin: LemonToolkitPlugin;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Open table editor at cursor position
	 */
	async openEditor(editor: Editor): Promise<void> {
		const cursor = editor.getCursor();
		const tableData = this.extractTableAtCursor(editor);
		
		if (!tableData) {
			new Notice(t('noTableFound'));
			return;
		}

		const modal = new TableEditorModal(
			this.plugin.app,
			tableData,
			async (updatedData: TableData) => {
				await this.applyTableChanges(editor, updatedData, cursor);
			}
		);

		modal.open();
	}

	/**
	 * Create new table at cursor position
	 */
	async createTable(editor: Editor): Promise<void> {
		const cursor = editor.getCursor();
		
		// Create empty table with 3 columns and 2 rows
		const emptyTable: TableData = {
			headers: [
				{ content: 'Header 1', align: 'left' },
				{ content: 'Header 2', align: 'left' },
				{ content: 'Header 3', align: 'left' }
			],
			rows: [
				[
					{ content: '', align: 'left' },
					{ content: '', align: 'left' },
					{ content: '', align: 'left' }
				],
				[
					{ content: '', align: 'left' },
					{ content: '', align: 'left' },
					{ content: '', align: 'left' }
				]
			],
			startLine: cursor.line,
			endLine: cursor.line
		};

		const modal = new TableEditorModal(
			this.plugin.app,
			emptyTable,
			async (tableData: TableData) => {
				await this.insertNewTable(editor, tableData, cursor);
			}
		);

		modal.open();
	}

	/**
	 * Extract table data at cursor position
	 */
	private extractTableAtCursor(editor: Editor): TableData | null {
		const cursor = editor.getCursor();
		const content = editor.getValue();
		const lines = content.split("\n");
		const currentLine = lines[cursor.line].trim();
		
		// STRICT CHECK: Cursor must be on a table line
		if (!this.isTableLine(currentLine)) {
			return null;
		}
		
		// Find table boundaries
		let startLine = -1;
		let endLine = -1;
		let inCodeBlock = false;

		// Check if current line is in a code block
		for (let i = 0; i < cursor.line; i++) {
			if (lines[i].trim().startsWith("```")) {
				inCodeBlock = !inCodeBlock;
			}
		}
		
		// If in code block, reject
		if (inCodeBlock) {
			return null;
		}

		// Search upward for table start
		for (let i = cursor.line; i >= 0; i--) {
			const line = lines[i].trim();
			
			if (line.startsWith("```")) {
				break; // Hit code block boundary
			}
			
			if (this.isTableLine(line)) {
				startLine = i;
			} else if (startLine !== -1) {
				break;
			}
		}

		if (startLine === -1) return null;

		// Search downward for table end
		for (let i = startLine; i < lines.length; i++) {
			const line = lines[i].trim();
			
			if (line.startsWith("```")) {
				break; // Hit code block boundary
			}
			
			if (this.isTableLine(line)) {
				endLine = i;
			} else {
				break;
			}
		}

		if (endLine === -1 || endLine - startLine < 2) return null;

		// Parse table
		return this.parseTable(lines.slice(startLine, endLine + 1), startLine);
	}

	/**
	 * Check if line is part of a table
	 */
	private isTableLine(line: string): boolean {
		return line.includes("|") && line.trim().length > 0;
	}

	/**
	 * Parse table from lines
	 */
	private parseTable(lines: string[], startLine: number): TableData | null {
		if (lines.length < 2) return null;

		// Parse header
		const headerLine = lines[0].trim();
		const headers = this.parseCells(headerLine);

		// Parse alignment row
		const alignLine = lines[1].trim();
		const alignments = this.parseAlignments(alignLine);

		// Parse data rows
		const rows: TableCell[][] = [];
		for (let i = 2; i < lines.length; i++) {
			const cells = this.parseCells(lines[i].trim());
			rows.push(cells.map((content, idx) => ({
				content,
				align: alignments[idx] || 'left'
			})));
		}

		return {
			headers: headers.map((content, idx) => ({
				content,
				align: alignments[idx] || 'left'
			})),
			rows,
			startLine,
			endLine: startLine + lines.length - 1
		};
	}

	/**
	 * Parse cells from a table row
	 */
	private parseCells(line: string): string[] {
		// Remove leading/trailing pipes
		line = line.replace(/^\||\|$/g, '').trim();
		
		// Split by pipe and trim
		return line.split('|').map(cell => cell.trim());
	}

	/**
	 * Parse alignment from separator row
	 */
	private parseAlignments(line: string): ('left' | 'center' | 'right')[] {
		const cells = this.parseCells(line);
		
		return cells.map(cell => {
			const left = cell.startsWith(':');
			const right = cell.endsWith(':');
			
			if (left && right) return 'center';
			if (right) return 'right';
			return 'left';
		});
	}

	/**
	 * Apply table changes to editor
	 */
	private async applyTableChanges(editor: Editor, tableData: TableData, originalCursor: EditorPosition): Promise<void> {
		const lines: string[] = [];

		// Generate header row
		const headerCells = tableData.headers.map(h => h.content);
		lines.push(this.formatTableRow(headerCells));

		// Generate alignment row
		const alignRow = tableData.headers.map(h => {
			const align = h.align || 'left';
			if (align === 'center') return ':---:';
			if (align === 'right') return '---:';
			return '---';
		});
		lines.push(this.formatTableRow(alignRow));

		// Generate data rows
		tableData.rows.forEach(row => {
			const cells = row.map(cell => cell.content);
			lines.push(this.formatTableRow(cells));
		});

		// Replace table in editor
		const content = editor.getValue();
		const allLines = content.split("\n");
		
		const oldTableLineCount = tableData.endLine - tableData.startLine + 1;
		const newTableLineCount = lines.length;
		const lineDiff = newTableLineCount - oldTableLineCount;
		
		allLines.splice(
			tableData.startLine,
			oldTableLineCount,
			...lines
		);

		editor.setValue(allLines.join("\n"));
		
		// Restore cursor position (adjust for line count changes)
		const newCursorLine = originalCursor.line + lineDiff;
		const safeLine = Math.max(tableData.startLine, Math.min(newCursorLine, tableData.startLine + newTableLineCount - 1));
		
		editor.setCursor({
			line: safeLine,
			ch: originalCursor.ch
		});
	}

	/**
	 * Format a table row with proper spacing
	 */
	private formatTableRow(cells: string[]): string {
		return `| ${cells.join(' | ')} |`;
	}

	/**
	 * Insert new table at cursor position
	 */
	private async insertNewTable(editor: Editor, tableData: TableData, cursor: EditorPosition): Promise<void> {
		const lines: string[] = [];

		// Generate header row
		const headerCells = tableData.headers.map(h => h.content);
		lines.push(this.formatTableRow(headerCells));

		// Generate alignment row
		const alignRow = tableData.headers.map(h => {
			const align = h.align || 'left';
			if (align === 'center') return ':---:';
			if (align === 'right') return '---:';
			return '---';
		});
		lines.push(this.formatTableRow(alignRow));

		// Generate data rows
		tableData.rows.forEach(row => {
			const cells = row.map(cell => cell.content);
			lines.push(this.formatTableRow(cells));
		});

		// Insert table at cursor
		const content = editor.getValue();
		const allLines = content.split("\n");
		
		// Insert empty line before and after table if needed
		const insertLines: string[] = [];
		if (cursor.line > 0 && allLines[cursor.line - 1].trim() !== '') {
			insertLines.push('');
		}
		insertLines.push(...lines);
		insertLines.push('');
		
		allLines.splice(cursor.line, 0, ...insertLines);
		
		editor.setValue(allLines.join("\n"));
		
		// Move cursor to first cell
		editor.setCursor({
			line: cursor.line + (insertLines[0] === '' ? 1 : 0),
			ch: 2 // After "| "
		});
	}
}
