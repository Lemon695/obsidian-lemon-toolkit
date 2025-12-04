import { Editor, Notice } from "obsidian";
import { TextSelectionModal } from "../features/text-selection/TextSelectionModal";
import LemonToolkitPlugin from "../main";

/**
 * Open text selection actions menu
 */
export function openTextSelectionActions(plugin: LemonToolkitPlugin, editor: Editor): void {
	const selectedText = editor.getSelection();

	if (!selectedText || selectedText.trim() === "") {
		new Notice("Please select some text first");
		return;
	}

	const modal = new TextSelectionModal(plugin, editor, selectedText);
	modal.open();
}
