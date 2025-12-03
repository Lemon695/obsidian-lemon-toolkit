import {
	copyRelativePath,
	copyAbsolutePath,
	copyFileName,
	copyFileNameWithoutExtension,
} from "./copyPath";
import {
	deleteFilePermanently,
	deleteFileToTrash,
} from "./deleteFile";
import { duplicateFile } from "./duplicateFile";
import { moveFileToFolder } from "./moveFile";
import { viewCurrentTags, insertTags } from "./tags";
import { openCommandPalette } from "./commandPalette";
import LemonToolkitPlugin from "../main";

/**
 * Register all plugin commands
 */
export function registerCommands(plugin: LemonToolkitPlugin): void {
	// Copy relative path
	plugin.addCommand({
		id: "copy-relative-path",
		name: "Copy relative path",
		callback: () => copyRelativePath(plugin),
	});

	// Copy absolute path
	plugin.addCommand({
		id: "copy-absolute-path",
		name: "Copy absolute path",
		callback: () => copyAbsolutePath(plugin),
	});

	// Copy file name
	plugin.addCommand({
		id: "copy-file-name",
		name: "Copy file name",
		callback: () => copyFileName(plugin),
	});

	// Copy file name without extension
	plugin.addCommand({
		id: "copy-file-name-without-ext",
		name: "Copy file name (no extension)",
		callback: () => copyFileNameWithoutExtension(plugin),
	});

	// Delete file permanently
	plugin.addCommand({
		id: "delete-file-permanently",
		name: "Delete file permanently",
		callback: () => deleteFilePermanently(plugin),
	});

	// Delete file to trash
	plugin.addCommand({
		id: "delete-file-to-trash",
		name: "Delete file to trash",
		callback: () => deleteFileToTrash(plugin),
	});

	// Duplicate file
	plugin.addCommand({
		id: "duplicate-file",
		name: "Duplicate file",
		callback: () => duplicateFile(plugin),
	});

	// Move file to folder
	plugin.addCommand({
		id: "move-file-to-folder",
		name: "Move file to folder",
		callback: () => moveFileToFolder(plugin),
	});

	// View current tags
	plugin.addCommand({
		id: "view-current-tags",
		name: "View current tags",
		callback: () => viewCurrentTags(plugin),
	});

	// Insert tags
	plugin.addCommand({
		id: "insert-tags",
		name: "Insert tags",
		editorCallback: (editor) => insertTags(plugin, editor),
	});

	// Open command palette
	plugin.addCommand({
		id: "open-command-palette",
		name: "Open command palette",
		callback: () => openCommandPalette(plugin),
	});
}
