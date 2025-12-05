import { Editor, Notice } from "obsidian";
import { HeadingNumberingPreviewModal } from "./HeadingNumberingPreviewModal";
import LemonToolkitPlugin from "../../main";
import { t } from "../../i18n/locale";

interface HeadingInfo {
	line: number;
	level: number;
	text: string;
	originalText: string;
	number: string;
	originalNumber: string; // Store the original number for comparison
	hasNumber: boolean;
	isModified: boolean;
	included: boolean; // Whether this heading should be included in numbering
}

export class HeadingNumberingManager {
	private plugin: LemonToolkitPlugin;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Process headings and show preview modal
	 */
	async processHeadings(editor: Editor): Promise<void> {
		const content = editor.getValue();
		const lines = content.split("\n");
		const headings = this.extractHeadings(lines);

		if (headings.length === 0) {
			new Notice(t('noHeadingsFound'));
			return;
		}

		// Calculate new numbers
		const numberedHeadings = this.calculateNumbers(headings);

		// Show preview modal
		const modal = new HeadingNumberingPreviewModal(
			this.plugin.app,
			numberedHeadings,
			async (finalHeadings: HeadingInfo[]) => {
				await this.applyNumbering(editor, finalHeadings);
			},
			(headings: HeadingInfo[]) => {
				return this.calculateNumbers(headings);
			}
		);

		modal.open();
	}

	/**
	 * Extract headings from document
	 */
	private extractHeadings(lines: string[]): HeadingInfo[] {
		const headings: HeadingInfo[] = [];
		const headingRegex = /^(#{1,6})\s+(.+)$/;
		let inCodeBlock = false;

		lines.forEach((line, index) => {
			// Toggle code block state
			if (line.trim().startsWith("```")) {
				inCodeBlock = !inCodeBlock;
				return;
			}

			// Skip lines inside code blocks
			if (inCodeBlock) {
				return;
			}

			const match = line.match(headingRegex);
			if (match) {
				const level = match[1].length;
				const text = match[2].trim();
				
				// Check if heading already has a number
				const numberMatch = text.match(/^(\d+(?:\.\d+)*)[、.]\s*(.+)$/);
				
				const originalNum = numberMatch ? numberMatch[1] : "";
				headings.push({
					line: index,
					level,
					text: numberMatch ? numberMatch[2] : text,
					originalText: text,
					number: originalNum,
					originalNumber: originalNum, // Store original for comparison
					hasNumber: !!numberMatch,
					isModified: false,
					included: true, // By default, all headings are included
				});
			}
		});

		return headings;
	}

	/**
	 * Calculate hierarchical numbers for headings
	 */
	private calculateNumbers(headings: HeadingInfo[]): HeadingInfo[] {
		const counters: number[] = [0, 0, 0, 0, 0, 0]; // Support up to 6 levels
		const numbered: HeadingInfo[] = [];

		headings.forEach((heading) => {
			// Skip excluded headings but keep them in the list
			if (!heading.included) {
				numbered.push({
					...heading,
					number: "",
					// Mark as modified if it originally had a number
					isModified: heading.originalNumber !== "",
				});
				return;
			}

			const level = heading.level - 1; // Convert to 0-based index

			// Increment current level counter
			counters[level]++;

			// Reset all deeper level counters
			for (let i = level + 1; i < counters.length; i++) {
				counters[i] = 0;
			}

			// Build number string (e.g., "1.2.3")
			const numberParts = counters.slice(0, level + 1).filter((n) => n > 0);
			const newNumber = numberParts.join(".");

			// Check if number changed compared to original
			const isModified = heading.originalNumber !== newNumber;

			numbered.push({
				...heading,
				number: newNumber,
				isModified,
			});
		});

		return numbered;
	}

	/**
	 * Apply numbering to document
	 */
	private async applyNumbering(editor: Editor, headings: HeadingInfo[]): Promise<void> {
		const content = editor.getValue();
		const lines = content.split("\n");

		// Apply changes from bottom to top to preserve line numbers
		for (let i = headings.length - 1; i >= 0; i--) {
			const heading = headings[i];
			const level = heading.level;
			const hashes = "#".repeat(level);
			
			// If heading is excluded or has no number, just use the text
			if (!heading.included || !heading.number) {
				const newLine = `${hashes} ${heading.text}`;
				lines[heading.line] = newLine;
			} else {
				// Use Chinese punctuation for better readability
				const newLine = `${hashes} ${heading.number}、${heading.text}`;
				lines[heading.line] = newLine;
			}
		}

		// Update editor content
		editor.setValue(lines.join("\n"));

		const includedCount = headings.filter(h => h.included).length;
		new Notice(t('updatedHeadingsCount', { count: includedCount.toString() }));
	}

	/**
	 * Remove all numbering from headings
	 */
	async removeNumbering(editor: Editor): Promise<void> {
		const content = editor.getValue();
		const lines = content.split("\n");
		const headingRegex = /^(#{1,6})\s+(.+)$/;
		let count = 0;
		let inCodeBlock = false;

		lines.forEach((line, index) => {
			// Toggle code block state
			if (line.trim().startsWith("```")) {
				inCodeBlock = !inCodeBlock;
				return;
			}

			// Skip lines inside code blocks
			if (inCodeBlock) {
				return;
			}

			const match = line.match(headingRegex);
			if (match) {
				const level = match[1].length;
				const text = match[2].trim();
				
				// Remove number if present
				const numberMatch = text.match(/^(\d+(?:\.\d+)*)[、.]\s*(.+)$/);
				if (numberMatch) {
					const hashes = "#".repeat(level);
					lines[index] = `${hashes} ${numberMatch[2]}`;
					count++;
				}
			}
		});

		if (count === 0) {
			new Notice(t('noNumberedHeadingsFound'));
			return;
		}

		editor.setValue(lines.join("\n"));
		new Notice(t('removedNumberingFromHeadings', { count: count.toString() }));
	}
}
