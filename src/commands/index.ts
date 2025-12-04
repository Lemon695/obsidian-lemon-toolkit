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
import { openSettings } from "./openSettings";
import { editFrontmatter } from "./editFrontmatter";
import { openTextSelectionActions } from "./textSelection";
import { addHeadingNumbering, removeHeadingNumbering } from "./headingNumbering";
import { openRecentFilesView } from "./recentFiles";
import {
	convertWikiToMarkdownInFile,
	convertMarkdownToWikiInFile,
	convertWikiToMarkdownInSelection,
	convertMarkdownToWikiInSelection,
} from "./linkConverter";
import { smartPaste } from "./smartPaste";
import { insertMoment, insertMomentAtCursor } from "./momentLogger";
import {
	copyCurrentHeading,
	copyCurrentCodeBlock,
	copyCurrentTable,
	openSmartCopySelector,
	selectTableRows,
	selectCodeLines,
	selectCodeBlocks,
} from "./smartCopy";
import LemonToolkitPlugin from "../main";

/**
 * Wrap a callback to track command usage
 */
function trackCommand(plugin: LemonToolkitPlugin, commandId: string, commandName: string, callback: () => any) {
	return () => {
		plugin.statisticsManager?.recordUsage(commandId, commandName);
		return callback();
	};
}

/**
 * Wrap an editor callback to track command usage
 */
function trackEditorCommand(plugin: LemonToolkitPlugin, commandId: string, commandName: string, callback: (editor: any) => any) {
	return (editor: any) => {
		plugin.statisticsManager?.recordUsage(commandId, commandName);
		return callback(editor);
	};
}

/**
 * Register all plugin commands
 */
export function registerCommands(plugin: LemonToolkitPlugin): void {
	// Copy relative path
	plugin.addCommand({
		id: "copy-relative-path",
		name: "Copy relative path",
		callback: trackCommand(plugin, "copy-relative-path", "Copy relative path", () => copyRelativePath(plugin)),
	});

	// Copy absolute path
	plugin.addCommand({
		id: "copy-absolute-path",
		name: "Copy absolute path",
		callback: trackCommand(plugin, "copy-absolute-path", "Copy absolute path", () => copyAbsolutePath(plugin)),
	});

	// Copy file name
	plugin.addCommand({
		id: "copy-file-name",
		name: "Copy file name",
		callback: trackCommand(plugin, "copy-file-name", "Copy file name", () => copyFileName(plugin)),
	});

	// Copy file name without extension
	plugin.addCommand({
		id: "copy-file-name-without-ext",
		name: "Copy file name (no extension)",
		callback: trackCommand(plugin, "copy-file-name-without-ext", "Copy file name (no extension)", () => copyFileNameWithoutExtension(plugin)),
	});

	// Delete file permanently
	plugin.addCommand({
		id: "delete-file-permanently",
		name: "Delete file permanently",
		callback: trackCommand(plugin, "delete-file-permanently", "Delete file permanently", () => deleteFilePermanently(plugin)),
	});

	// Delete file to trash
	plugin.addCommand({
		id: "delete-file-to-trash",
		name: "Delete file to trash",
		callback: trackCommand(plugin, "delete-file-to-trash", "Delete file to trash", () => deleteFileToTrash(plugin)),
	});

	// Duplicate file
	plugin.addCommand({
		id: "duplicate-file",
		name: "Duplicate file",
		callback: trackCommand(plugin, "duplicate-file", "Duplicate file", () => duplicateFile(plugin)),
	});

	// Move file to folder
	plugin.addCommand({
		id: "move-file-to-folder",
		name: "Move file to folder",
		callback: trackCommand(plugin, "move-file-to-folder", "Move file to folder", () => moveFileToFolder(plugin)),
	});

	// View current tags
	plugin.addCommand({
		id: "view-current-tags",
		name: "View current tags",
		callback: trackCommand(plugin, "view-current-tags", "View current tags", () => viewCurrentTags(plugin)),
	});

	// Insert tags
	plugin.addCommand({
		id: "insert-tags",
		name: "Insert tags",
		editorCallback: trackEditorCommand(plugin, "insert-tags", "Insert tags", (editor) => insertTags(plugin, editor)),
	});

	// Open command palette
	plugin.addCommand({
		id: "open-command-palette",
		name: "Open command palette",
		callback: trackCommand(plugin, "open-command-palette", "Open command palette", () => openCommandPalette(plugin)),
	});

	// Open settings
	plugin.addCommand({
		id: "open-settings",
		name: "Open settings",
		callback: trackCommand(plugin, "open-settings", "Open settings", () => openSettings(plugin)),
	});

	// Open file info view
	plugin.addCommand({
		id: "open-file-info",
		name: "Open file info",
		callback: trackCommand(plugin, "open-file-info", "Open file info", () => plugin.activateFileInfoView()),
	});

	// Edit frontmatter
	plugin.addCommand({
		id: "edit-frontmatter",
		name: "Edit frontmatter",
		callback: trackCommand(plugin, "edit-frontmatter", "Edit frontmatter", () => editFrontmatter(plugin)),
	});

	// Text selection actions
	plugin.addCommand({
		id: "text-selection-actions",
		name: "Text selection actions",
		editorCallback: trackEditorCommand(plugin, "text-selection-actions", "Text selection actions", (editor) => openTextSelectionActions(plugin, editor)),
	});

	// Heading numbering
	plugin.addCommand({
		id: "add-heading-numbering",
		name: "Add/update heading numbering",
		editorCallback: trackEditorCommand(plugin, "add-heading-numbering", "Add/update heading numbering", (editor) => addHeadingNumbering(plugin, editor)),
	});

	plugin.addCommand({
		id: "remove-heading-numbering",
		name: "Remove heading numbering",
		editorCallback: trackEditorCommand(plugin, "remove-heading-numbering", "Remove heading numbering", (editor) => removeHeadingNumbering(plugin, editor)),
	});

	// Recent files
	plugin.addCommand({
		id: "open-recent-files",
		name: "Open recent files",
		callback: trackCommand(plugin, "open-recent-files", "Open recent files", () => openRecentFilesView(plugin)),
	});

	// Link converter - File scope
	plugin.addCommand({
		id: "convert-wiki-to-markdown-file",
		name: "Convert wiki links to markdown (file)",
		editorCallback: trackEditorCommand(plugin, "convert-wiki-to-markdown-file", "Convert wiki links to markdown (file)", (editor) => convertWikiToMarkdownInFile(plugin, editor)),
	});

	plugin.addCommand({
		id: "convert-markdown-to-wiki-file",
		name: "Convert markdown links to wiki (file)",
		editorCallback: trackEditorCommand(plugin, "convert-markdown-to-wiki-file", "Convert markdown links to wiki (file)", (editor) => convertMarkdownToWikiInFile(plugin, editor)),
	});

	// Link converter - Selection scope
	plugin.addCommand({
		id: "convert-wiki-to-markdown-selection",
		name: "Convert wiki links to markdown (selection)",
		editorCallback: trackEditorCommand(plugin, "convert-wiki-to-markdown-selection", "Convert wiki links to markdown (selection)", (editor) => convertWikiToMarkdownInSelection(plugin, editor)),
	});

	plugin.addCommand({
		id: "convert-markdown-to-wiki-selection",
		name: "Convert markdown links to wiki (selection)",
		editorCallback: trackEditorCommand(plugin, "convert-markdown-to-wiki-selection", "Convert markdown links to wiki (selection)", (editor) => convertMarkdownToWikiInSelection(plugin, editor)),
	});

	// Smart paste
	plugin.addCommand({
		id: "smart-paste",
		name: "Smart paste with rules",
		editorCallback: trackEditorCommand(plugin, "smart-paste", "Smart paste with rules", (editor) => smartPaste(plugin, editor)),
	});

	// Moment logger
	plugin.addCommand({
		id: "insert-moment",
		name: "Insert moment (auto)",
		editorCallback: trackEditorCommand(plugin, "insert-moment", "Insert moment (auto)", (editor) => insertMoment(plugin, editor)),
	});

	plugin.addCommand({
		id: "insert-moment-at-cursor",
		name: "Insert moment (at cursor)",
		editorCallback: trackEditorCommand(plugin, "insert-moment-at-cursor", "Insert moment (at cursor)", (editor) => insertMomentAtCursor(plugin, editor)),
	});

	// Smart copy
	plugin.addCommand({
		id: "copy-current-heading",
		name: "Copy current heading section",
		editorCallback: trackEditorCommand(plugin, "copy-current-heading", "Copy current heading section", (editor) => copyCurrentHeading(plugin, editor)),
	});

	plugin.addCommand({
		id: "copy-current-code-block",
		name: "Copy current code block",
		editorCallback: trackEditorCommand(plugin, "copy-current-code-block", "Copy current code block", (editor) => copyCurrentCodeBlock(plugin, editor)),
	});

	plugin.addCommand({
		id: "copy-current-table",
		name: "Copy current table",
		editorCallback: trackEditorCommand(plugin, "copy-current-table", "Copy current table", (editor) => copyCurrentTable(plugin, editor)),
	});

	plugin.addCommand({
		id: "smart-copy-selector",
		name: "Smart copy selector",
		editorCallback: trackEditorCommand(plugin, "smart-copy-selector", "Smart copy selector", (editor) => openSmartCopySelector(plugin, editor)),
	});

	plugin.addCommand({
		id: "select-table-rows",
		name: "Select table rows to copy",
		editorCallback: trackEditorCommand(plugin, "select-table-rows", "Select table rows to copy", (editor) => selectTableRows(plugin, editor)),
	});

	plugin.addCommand({
		id: "select-code-lines",
		name: "Select code lines to copy",
		editorCallback: trackEditorCommand(plugin, "select-code-lines", "Select code lines to copy", (editor) => selectCodeLines(plugin, editor)),
	});

	plugin.addCommand({
		id: "select-code-blocks",
		name: "Select code blocks to copy",
		editorCallback: trackEditorCommand(plugin, "select-code-blocks", "Select code blocks to copy", (editor) => selectCodeBlocks(plugin, editor)),
	});
}
