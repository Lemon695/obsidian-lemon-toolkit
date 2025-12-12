import { Notice, TFolder } from "obsidian";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/locale";

/**
 * Generate a date-UUID filename format: YYYY-MM-DD——UUID
 * @returns Formatted filename string
 */
function generateDateUuidFilename(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	
	// Generate 8-character UUID
	const uuid = "xxxxxxxx".replace(/x/g, () => {
		return Math.floor(Math.random() * 16).toString(16);
	});
	
	return `${year}-${month}-${day}——${uuid}`;
}

/**
 * Create a new file in the current folder with date-UUID naming format
 */
export async function createDatedUuidFileInCurrentFolder(plugin: LemonToolkitPlugin): Promise<void> {
	try {
		// Get current folder
		const activeFile = plugin.app.workspace.getActiveFile();
		let currentFolder: TFolder;
		
		if (activeFile && activeFile.parent) {
			currentFolder = activeFile.parent;
		} else {
			// If no active file or file is in root, use vault root
			currentFolder = plugin.app.vault.getRoot();
		}
		
		// Generate filename
		const baseFilename = generateDateUuidFilename();
		const filename = `${baseFilename}.md`;
		
		// Check if file already exists (very unlikely with UUID, but good practice)
		const fullPath = currentFolder.path === "/" ? filename : `${currentFolder.path}/${filename}`;
		const existingFile = plugin.app.vault.getAbstractFileByPath(fullPath);
		
		if (existingFile) {
			new Notice(t('fileAlreadyExists'));
			return;
		}
		
		// Create the new file with basic content
		const initialContent = `# ${baseFilename}\n\nCreated: ${new Date().toLocaleString()}\n\n`;
		
		const newFile = await plugin.app.vault.create(fullPath, initialContent);
		
		// Open the new file in the current leaf
		await plugin.app.workspace.getLeaf().openFile(newFile);
		
		// Show success notice
		new Notice(t('createdFileWithDateUuid', { name: filename }));
		
	} catch (error) {
		new Notice(t('failedToCreateFileWithDateUuid', { error: error.message }));
		console.error("Create file with date-UUID error:", error);
	}
}
