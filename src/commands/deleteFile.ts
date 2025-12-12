import { Notice, Plugin } from "obsidian";
import { t } from "../i18n/legacy";

/**
 * Delete the active file permanently
 */
export async function deleteFilePermanently(plugin: Plugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice(t('noActiveFile'));
		return;
	}

	const fileName = file.name;
	
	try {
		await plugin.app.vault.delete(file);
		new Notice(t('deleted', { name: fileName }));
	} catch (error) {
		new Notice(t('failedToDeleteFile', { error: error.message }));
		console.error("Delete file error:", error);
	}
}

/**
 * Move the active file to Obsidian's trash (.trash folder)
 */
export async function deleteFileToTrash(plugin: Plugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice(t('noActiveFile'));
		return;
	}

	const fileName = file.name;
	
	try {
		await plugin.app.vault.trash(file, true);
		new Notice(t('movedToTrash', { name: fileName }));
	} catch (error) {
		new Notice(t('failedToMoveToTrash', { error: error.message }));
		console.error("Move to trash error:", error);
	}
}
