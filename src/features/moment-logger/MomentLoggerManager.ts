import { Editor, Notice, moment } from "obsidian";
import LemonToolkitPlugin from "../../main";

interface MomentBlock {
	startLine: number;
	endLine: number;
	format: string; // Detected format pattern
}

export class MomentLoggerManager {
	private plugin: LemonToolkitPlugin;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Insert a moment log entry
	 * @param editor - The editor instance
	 * @param forceManual - If true, always insert at cursor (e.g., when Shift is pressed)
	 */
	async insertMoment(editor: Editor, forceManual: boolean = false): Promise<void> {
		const content = editor.getValue();
		const lines = content.split("\n");

		// Find existing moment blocks
		const momentBlock = this.findMomentBlock(lines);

		// Get timestamp
		const timestamp = moment().format(this.plugin.settings.momentLoggerFormat);

		if (!forceManual && momentBlock) {
			// Auto mode: append to existing block
			this.appendToBlock(editor, momentBlock, timestamp);
		} else {
			// Manual mode: insert at cursor
			this.insertAtCursor(editor, timestamp);
		}
	}

	/**
	 * Find existing moment block in the document
	 */
	private findMomentBlock(lines: string[]): MomentBlock | null {
		// Pattern to match moment entries: "- YYYY-MM-DD HH:mm:ss text"
		const momentPattern = /^-\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+.+$/;
		
		let blockStart = -1;
		let blockEnd = -1;
		let detectedFormat = "";

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			
			if (momentPattern.test(line)) {
				if (blockStart === -1) {
					blockStart = i;
					// Extract format from first line
					const match = line.match(/^-\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
					if (match) {
						detectedFormat = "YYYY-MM-DD HH:mm:ss";
					}
				}
				blockEnd = i;
			} else if (blockStart !== -1 && line !== "") {
				// Non-empty line after moment entries means block ended
				break;
			}
		}

		if (blockStart !== -1) {
			return {
				startLine: blockStart,
				endLine: blockEnd,
				format: detectedFormat || this.plugin.settings.momentLoggerFormat,
			};
		}

		return null;
	}

	/**
	 * Append moment entry to existing block
	 */
	private appendToBlock(editor: Editor, block: MomentBlock, timestamp: string): void {
		const content = editor.getValue();
		const lines = content.split("\n");

		// Insert after the last line of the block
		const insertLine = block.endLine + 1;
		const newEntry = `- ${timestamp} `;

		// Insert the new line
		lines.splice(insertLine, 0, newEntry);
		
		// Update editor
		editor.setValue(lines.join("\n"));

		// Move cursor to end of new entry (ready to type description)
		const newLineNumber = insertLine;
		const newLineLength = newEntry.length;
		editor.setCursor({ line: newLineNumber, ch: newLineLength });

		new Notice("Moment added to timeline");
	}

	/**
	 * Insert moment entry at cursor position
	 */
	private insertAtCursor(editor: Editor, timestamp: string): void {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);

		// Check if cursor is at the beginning of an empty line
		if (line.trim() === "" && cursor.ch === 0) {
			// Insert on current line
			const newEntry = `- ${timestamp} `;
			editor.replaceRange(newEntry, cursor);
			
			// Move cursor to end (ready to type description)
			editor.setCursor({ line: cursor.line, ch: newEntry.length });
		} else {
			// Insert on new line
			const newEntry = `\n- ${timestamp} `;
			editor.replaceRange(newEntry, cursor);
			
			// Move cursor to end of new entry
			editor.setCursor({ line: cursor.line + 1, ch: newEntry.length - 1 });
		}

		new Notice("Moment inserted at cursor");
	}

	/**
	 * Insert moment with custom text (for quick logging)
	 */
	async insertMomentWithText(editor: Editor, text: string, forceManual: boolean = false): Promise<void> {
		const content = editor.getValue();
		const lines = content.split("\n");
		const momentBlock = this.findMomentBlock(lines);
		const timestamp = moment().format(this.plugin.settings.momentLoggerFormat);
		const entry = `- ${timestamp} ${text}`;

		if (!forceManual && momentBlock) {
			// Auto mode: append to existing block
			const insertLine = momentBlock.endLine + 1;
			lines.splice(insertLine, 0, entry);
			editor.setValue(lines.join("\n"));
			
			// Move cursor to end of document
			editor.setCursor({ line: insertLine, ch: entry.length });
		} else {
			// Manual mode: insert at cursor
			const cursor = editor.getCursor();
			const line = editor.getLine(cursor.line);

			if (line.trim() === "" && cursor.ch === 0) {
				editor.replaceRange(entry, cursor);
				editor.setCursor({ line: cursor.line, ch: entry.length });
			} else {
				editor.replaceRange(`\n${entry}`, cursor);
				editor.setCursor({ line: cursor.line + 1, ch: entry.length });
			}
		}

		new Notice(`Logged: ${text}`);
	}
}
