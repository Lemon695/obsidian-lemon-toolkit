import { Editor } from "obsidian";
import LemonToolkitPlugin from "../main";
import { OutlineModal } from "../ui/OutlineModal";

export interface HeadingItem {
	level: number;
	text: string;
	line: number;
}

export function extractHeadings(editor: Editor): HeadingItem[] {
	const content = editor.getValue();
	const lines = content.split("\n");
	const headings: HeadingItem[] = [];
	let inCodeBlock = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (line.trim().startsWith("```")) {
			inCodeBlock = !inCodeBlock;
			continue;
		}

		if (inCodeBlock) continue;

		const match = line.match(/^(#{1,6})\s+(.+)$/);
		if (match) {
			headings.push({
				level: match[1].length,
				text: match[2].trim(),
				line: i,
			});
		}
	}

	return headings;
}

export function showOutline(plugin: LemonToolkitPlugin, editor: Editor): void {
	const headings = extractHeadings(editor);
	new OutlineModal(plugin.app, headings, editor).open();
}
