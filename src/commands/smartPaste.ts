import { Editor } from "obsidian";
import { SmartPasteManager } from "../features/smart-paste/SmartPasteManager";
import LemonToolkitPlugin from "../main";

/**
 * Paste clipboard content with smart rules applied
 */
export async function smartPaste(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new SmartPasteManager(plugin);
	await manager.pasteWithRules(editor);
}
