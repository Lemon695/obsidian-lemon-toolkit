import { Editor, Notice } from "obsidian";
import LemonToolkitPlugin from "../main";
import { TableSelectorModal } from "../features/table-selector/TableSelectorModal";
import { TableScanner } from "../features/table-selector/TableScanner";
import { TableEditorManager } from "../features/table-editor/TableEditorManager";
import { t } from "../i18n/legacy";

/**
 * Command to open table selector for editing any table in the document
 */
export async function openTableSelector(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const scanner = new TableScanner();
	const tables = scanner.scanDocument(editor);
	
	if (tables.length === 0) {
		new Notice(t('noTablesFound'));
		return;
	}
	
	const modal = new TableSelectorModal(
		plugin.app,
		tables,
		async (selectedTable) => {
			// Open the selected table in the table editor
			const manager = new TableEditorManager(plugin);
			await manager.openEditorForTable(editor, selectedTable, () => {
				// Callback when table editor closes - keep selector modal open
				// The selector modal will remain open for further table selections
			});
		}
	);
	
	modal.open();
}