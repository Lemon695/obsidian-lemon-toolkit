import { Notice, Plugin } from "obsidian";
import { DuplicateFileModal } from "../ui/DuplicateFileModal";

/**
 * Duplicate the active file with a modal to rename
 */
export async function duplicateFile(plugin: Plugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active file");
		return;
	}

	// Generate default name with timestamp
	const timestamp = new Date().getTime();
	const nameWithoutExt = file.basename;
	const extension = file.extension;
	const defaultNewName = `${nameWithoutExt}-${timestamp}.${extension}`;

	// Open modal for user to confirm or modify the name
	new DuplicateFileModal(plugin.app, file, defaultNewName, async (newName: string) => {
		try {
			// Read the content of the original file
			const content = await plugin.app.vault.read(file);
			
			// Get the directory path
			const folderPath = file.parent?.path || "";
			const newPath = folderPath ? `${folderPath}/${newName}` : newName;

			// Create the new file
			const newFile = await plugin.app.vault.create(newPath, content);
			
			new Notice(`File duplicated: ${newName}`);
			
			// Open the new file
			await plugin.app.workspace.getLeaf().openFile(newFile);
		} catch (error) {
			new Notice(`Failed to duplicate file: ${error.message}`);
			console.error("Duplicate file error:", error);
		}
	}).open();
}
