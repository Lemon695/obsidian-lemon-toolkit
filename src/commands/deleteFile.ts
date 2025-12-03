import { Notice, Plugin } from "obsidian";

/**
 * Delete the active file permanently
 */
export async function deleteFilePermanently(plugin: Plugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active file");
		return;
	}

	const fileName = file.name;
	
	try {
		await plugin.app.vault.delete(file);
		new Notice(`Deleted: ${fileName}`);
	} catch (error) {
		new Notice(`Failed to delete file: ${error.message}`);
		console.error("Delete file error:", error);
	}
}

/**
 * Move the active file to Obsidian's trash (.trash folder)
 */
export async function deleteFileToTrash(plugin: Plugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active file");
		return;
	}

	const fileName = file.name;
	
	try {
		await plugin.app.vault.trash(file, true);
		new Notice(`Moved to trash: ${fileName}`);
	} catch (error) {
		new Notice(`Failed to move file to trash: ${error.message}`);
		console.error("Move to trash error:", error);
	}
}
