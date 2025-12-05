import { Editor, Notice } from "obsidian";
import { TableEditorManager } from "../features/table-editor/TableEditorManager";
import LemonToolkitPlugin from "../main";

/**
 * Open table editor at cursor position
 */
export async function openTableEditor(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new TableEditorManager(plugin);
	await manager.openEditor(editor);
}

/**
 * Create new table at cursor position
 */
export async function createTable(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new TableEditorManager(plugin);
	await manager.createTable(editor);
}
