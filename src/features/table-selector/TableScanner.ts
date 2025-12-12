import { Editor } from "obsidian";

export interface TableInfo {
	index: number;
	startLine: number;
	endLine: number;
	headers: string[];
	dataRows: string[][]; // Changed from firstRow to support multiple rows
	preview: string;
	rawContent: string;
}

/**
 * Scans document for tables and extracts table information
 */
export class TableScanner {
	/**
	 * Scan the current document for all tables
	 */
	scanDocument(editor: Editor): TableInfo[] {
		const content = editor.getValue();
		const lines = content.split("\n");
		const tables: TableInfo[] = [];
		let tableIndex = 0;
		
		let i = 0;
		while (i < lines.length) {
			const tableStart = this.findTableStart(lines, i);
			if (tableStart === -1) break;
			
			const tableEnd = this.findTableEnd(lines, tableStart);
			if (tableEnd === -1) break;
			
			// Skip if in code block
			if (this.isInCodeBlock(lines, tableStart)) {
				i = tableEnd + 1;
				continue;
			}
			
			const tableInfo = this.parseTableInfo(lines, tableStart, tableEnd, tableIndex);
			if (tableInfo) {
				tables.push(tableInfo);
				tableIndex++;
			}
			
			i = tableEnd + 1;
		}
		
		return tables;
	}
	
	/**
	 * Find the start of a table from the given line index
	 */
	private findTableStart(lines: string[], startIndex: number): number {
		for (let i = startIndex; i < lines.length; i++) {
			const line = lines[i].trim();
			if (this.isTableLine(line)) {
				return i;
			}
		}
		return -1;
	}
	
	/**
	 * Find the end of a table from the given start line
	 */
	private findTableEnd(lines: string[], startLine: number): number {
		let endLine = startLine;
		
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
		
		// A valid table needs at least 2 lines (header + separator)
		return endLine - startLine >= 1 ? endLine : -1;
	}
	
	/**
	 * Check if a line is part of a table
	 */
	private isTableLine(line: string): boolean {
		return line.includes("|") && line.trim().length > 0;
	}
	
	/**
	 * Check if the table is inside a code block
	 */
	private isInCodeBlock(lines: string[], tableStart: number): boolean {
		let inCodeBlock = false;
		
		for (let i = 0; i < tableStart; i++) {
			if (lines[i].trim().startsWith("```")) {
				inCodeBlock = !inCodeBlock;
			}
		}
		
		return inCodeBlock;
	}
	
	/**
	 * Parse table information from lines
	 */
	private parseTableInfo(lines: string[], startLine: number, endLine: number, index: number): TableInfo | null {
		const tableLines = lines.slice(startLine, endLine + 1);
		
		if (tableLines.length < 2) return null;
		
		// Parse header
		const headerLine = tableLines[0].trim();
		const headers = this.parseCells(headerLine);
		
		// Parse data rows (skip separator line, get up to 3 rows for preview)
		const dataRows: string[][] = [];
		const maxPreviewRows = 3;
		
		for (let i = 2; i < Math.min(tableLines.length, 2 + maxPreviewRows); i++) {
			const dataLine = tableLines[i].trim();
			if (dataLine) {
				dataRows.push(this.parseCells(dataLine));
			}
		}
		
		// Generate preview
		const preview = this.generatePreview(headers, dataRows);
		
		// Get raw content
		const rawContent = tableLines.join('\n');
		
		return {
			index,
			startLine,
			endLine,
			headers,
			dataRows,
			preview,
			rawContent
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
	 * Generate a preview string for the table
	 */
	private generatePreview(headers: string[], dataRows: string[][]): string {
		const maxLength = 30;
		
		// Truncate headers
		const truncatedHeaders = headers.map(h => 
			h.length > maxLength ? h.substring(0, maxLength) + '...' : h
		);
		
		// Create preview lines
		const headerPreview = `| ${truncatedHeaders.join(' | ')} |`;
		
		// Add data rows
		const dataPreview = dataRows.map(row => {
			const truncatedRow = row.map(cell => 
				cell.length > maxLength ? cell.substring(0, maxLength) + '...' : cell
			);
			return `| ${truncatedRow.join(' | ')} |`;
		}).join('\n');
		
		return dataPreview ? `${headerPreview}\n${dataPreview}` : headerPreview;
	}
}