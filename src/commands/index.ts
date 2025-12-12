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
import { openGlobalCommandPalette } from "./openGlobalCommandPalette";
import { openSettings } from "./openSettings";
import { editFrontmatter } from "./editFrontmatter";
import { openTextSelectionActions } from "./textSelection";
import { addHeadingNumbering, removeHeadingNumbering } from "./headingNumbering";
import { syncHeadingWithFilename } from "./syncHeadingWithFilename";
import { renameFile } from "./renameFile";
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
import { openTableEditor, createTable } from "./tableEditor";
import { openTableSelector } from "./tableSelectorCommand";
import { showPluginUsageStats } from "./pluginUsageStats";
import { openPluginManager } from "./pluginManager";
import { showOutline, copyOutline } from "./outline";
import { createDatedUuidFileInCurrentFolder } from "./createDatedUuidFileInCurrentFolder";
import { openFolderManager } from "./folderManager";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/legacy";

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
		name: t('copyRelativePath'),
		callback: trackCommand(plugin, "copy-relative-path", t('copyRelativePath'), () => copyRelativePath(plugin)),
	});

	// Copy absolute path
	plugin.addCommand({
		id: "copy-absolute-path",
		name: t('copyAbsolutePath'),
		callback: trackCommand(plugin, "copy-absolute-path", t('copyAbsolutePath'), () => copyAbsolutePath(plugin)),
	});

	// Copy file name
	plugin.addCommand({
		id: "copy-file-name",
		name: t('copyFileName'),
		callback: trackCommand(plugin, "copy-file-name", t('copyFileName'), () => copyFileName(plugin)),
	});

	// Copy file name without extension
	plugin.addCommand({
		id: "copy-file-name-without-ext",
		name: t('copyFileNameNoExt'),
		callback: trackCommand(plugin, "copy-file-name-without-ext", t('copyFileNameNoExt'), () => copyFileNameWithoutExtension(plugin)),
	});

	// Delete file permanently
	plugin.addCommand({
		id: "delete-file-permanently",
		name: t('deleteFilePermanently'),
		callback: trackCommand(plugin, "delete-file-permanently", t('deleteFilePermanently'), () => deleteFilePermanently(plugin)),
	});

	// Delete file to trash
	plugin.addCommand({
		id: "delete-file-to-trash",
		name: t('deleteFileToTrash'),
		callback: trackCommand(plugin, "delete-file-to-trash", t('deleteFileToTrash'), () => deleteFileToTrash(plugin)),
	});

	// Duplicate file
	plugin.addCommand({
		id: "duplicate-file",
		name: t('duplicateFile'),
		callback: trackCommand(plugin, "duplicate-file", t('duplicateFile'), () => duplicateFile(plugin)),
	});

	// Move file to folder
	plugin.addCommand({
		id: "move-file-to-folder",
		name: t('moveFileToFolder'),
		callback: trackCommand(plugin, "move-file-to-folder", t('moveFileToFolder'), () => moveFileToFolder(plugin)),
	});

	// View current tags
	plugin.addCommand({
		id: "view-current-tags",
		name: t('viewCurrentTags'),
		callback: trackCommand(plugin, "view-current-tags", t('viewCurrentTags'), () => viewCurrentTags(plugin)),
	});

	// Insert tags
	plugin.addCommand({
		id: "insert-tags",
		name: t('insertTags'),
		editorCallback: trackEditorCommand(plugin, "insert-tags", t('insertTags'), (editor) => insertTags(plugin, editor)),
	});

	// Open command palette
	plugin.addCommand({
		id: "open-command-palette",
		name: t('openCommandPalette'),
		callback: trackCommand(plugin, "open-command-palette", t('openCommandPalette'), () => openCommandPalette(plugin)),
	});

	// Open global command palette
	plugin.addCommand({
		id: "open-global-command-palette",
		name: t('openGlobalCommandPalette'),
		callback: trackCommand(plugin, "open-global-command-palette", t('openGlobalCommandPalette'), () => openGlobalCommandPalette(plugin)),
	});

	// Open settings
	plugin.addCommand({
		id: "open-settings",
		name: t('openSettings'),
		callback: trackCommand(plugin, "open-settings", t('openSettings'), () => openSettings(plugin)),
	});

	// Open file info view
	plugin.addCommand({
		id: "open-file-info",
		name: t('openFileInfo'),
		callback: trackCommand(plugin, "open-file-info", t('openFileInfo'), () => plugin.activateFileInfoView()),
	});

	// Edit frontmatter
	plugin.addCommand({
		id: "edit-frontmatter",
		name: t('editFrontmatter'),
		callback: trackCommand(plugin, "edit-frontmatter", t('editFrontmatter'), () => editFrontmatter(plugin)),
	});

	// Text selection actions
	plugin.addCommand({
		id: "text-selection-actions",
		name: t('textSelectionActions'),
		editorCallback: trackEditorCommand(plugin, "text-selection-actions", t('textSelectionActions'), (editor) => openTextSelectionActions(plugin, editor)),
	});

	// Heading numbering
	plugin.addCommand({
		id: "add-heading-numbering",
		name: t('addHeadingNumbering'),
		editorCallback: trackEditorCommand(plugin, "add-heading-numbering", t('addHeadingNumbering'), (editor) => addHeadingNumbering(plugin, editor)),
	});

	plugin.addCommand({
		id: "remove-heading-numbering",
		name: t('removeHeadingNumbering'),
		editorCallback: trackEditorCommand(plugin, "remove-heading-numbering", t('removeHeadingNumbering'), (editor) => removeHeadingNumbering(plugin, editor)),
	});

	// Sync H1 heading with filename
	plugin.addCommand({
		id: "sync-heading-with-filename",
		name: t('syncHeadingWithFilename'),
		editorCallback: trackEditorCommand(plugin, "sync-heading-with-filename", t('syncHeadingWithFilename'), (editor) => syncHeadingWithFilename(plugin, editor)),
	});

	// Rename file
	plugin.addCommand({
		id: "rename-file",
		name: t('renameFile'),
		callback: trackCommand(plugin, "rename-file", t('renameFile'), () => renameFile(plugin)),
	});

	// Recent files
	plugin.addCommand({
		id: "open-recent-files",
		name: t('openRecentFiles'),
		callback: trackCommand(plugin, "open-recent-files", t('openRecentFiles'), () => openRecentFilesView(plugin)),
	});

	// Link converter - File scope
	plugin.addCommand({
		id: "convert-wiki-to-markdown-file",
		name: t('convertWikiToMarkdownFile'),
		editorCallback: trackEditorCommand(plugin, "convert-wiki-to-markdown-file", t('convertWikiToMarkdownFile'), (editor) => convertWikiToMarkdownInFile(plugin, editor)),
	});

	plugin.addCommand({
		id: "convert-markdown-to-wiki-file",
		name: t('convertMarkdownToWikiFile'),
		editorCallback: trackEditorCommand(plugin, "convert-markdown-to-wiki-file", t('convertMarkdownToWikiFile'), (editor) => convertMarkdownToWikiInFile(plugin, editor)),
	});

	// Link converter - Selection scope
	plugin.addCommand({
		id: "convert-wiki-to-markdown-selection",
		name: t('convertWikiToMarkdownSelection'),
		editorCallback: trackEditorCommand(plugin, "convert-wiki-to-markdown-selection", t('convertWikiToMarkdownSelection'), (editor) => convertWikiToMarkdownInSelection(plugin, editor)),
	});

	plugin.addCommand({
		id: "convert-markdown-to-wiki-selection",
		name: t('convertMarkdownToWikiSelection'),
		editorCallback: trackEditorCommand(plugin, "convert-markdown-to-wiki-selection", t('convertMarkdownToWikiSelection'), (editor) => convertMarkdownToWikiInSelection(plugin, editor)),
	});

	// Smart paste
	plugin.addCommand({
		id: "smart-paste",
		name: t('smartPaste'),
		editorCallback: trackEditorCommand(plugin, "smart-paste", t('smartPaste'), (editor) => smartPaste(plugin, editor)),
	});

	// Moment logger
	plugin.addCommand({
		id: "insert-moment",
		name: t('insertMoment'),
		editorCallback: trackEditorCommand(plugin, "insert-moment", t('insertMoment'), (editor) => insertMoment(plugin, editor)),
	});

	plugin.addCommand({
		id: "insert-moment-at-cursor",
		name: t('insertMomentAtCursor'),
		editorCallback: trackEditorCommand(plugin, "insert-moment-at-cursor", t('insertMomentAtCursor'), (editor) => insertMomentAtCursor(plugin, editor)),
	});

	// Smart copy
	plugin.addCommand({
		id: "copy-current-heading",
		name: t('copyCurrentHeading'),
		editorCallback: trackEditorCommand(plugin, "copy-current-heading", t('copyCurrentHeading'), (editor) => copyCurrentHeading(plugin, editor)),
	});

	plugin.addCommand({
		id: "copy-current-code-block",
		name: t('copyCurrentCodeBlock'),
		editorCallback: trackEditorCommand(plugin, "copy-current-code-block", t('copyCurrentCodeBlock'), (editor) => copyCurrentCodeBlock(plugin, editor)),
	});

	plugin.addCommand({
		id: "copy-current-table",
		name: t('copyCurrentTable'),
		editorCallback: trackEditorCommand(plugin, "copy-current-table", t('copyCurrentTable'), (editor) => copyCurrentTable(plugin, editor)),
	});

	plugin.addCommand({
		id: "smart-copy-selector",
		name: t('smartCopySelector'),
		editorCallback: trackEditorCommand(plugin, "smart-copy-selector", t('smartCopySelector'), (editor) => openSmartCopySelector(plugin, editor)),
	});

	plugin.addCommand({
		id: "select-table-rows",
		name: t('selectTableRows'),
		editorCallback: trackEditorCommand(plugin, "select-table-rows", t('selectTableRows'), (editor) => selectTableRows(plugin, editor)),
	});

	plugin.addCommand({
		id: "select-code-lines",
		name: t('selectCodeLines'),
		editorCallback: trackEditorCommand(plugin, "select-code-lines", t('selectCodeLines'), (editor) => selectCodeLines(plugin, editor)),
	});

	plugin.addCommand({
		id: "select-code-blocks",
		name: t('selectCodeBlocks'),
		editorCallback: trackEditorCommand(plugin, "select-code-blocks", t('selectCodeBlocks'), (editor) => selectCodeBlocks(plugin, editor)),
	});

	// Table editor
	plugin.addCommand({
		id: "edit-table",
		name: t('editTable'),
		editorCallback: trackEditorCommand(plugin, "edit-table", t('editTable'), (editor) => openTableEditor(plugin, editor)),
	});

	// Create table
	plugin.addCommand({
		id: "create-table",
		name: t('createTable'),
		editorCallback: trackEditorCommand(plugin, "create-table", t('createTable'), (editor) => createTable(plugin, editor)),
	});

	// Table selector
	plugin.addCommand({
		id: "select-table-to-edit",
		name: t('selectTableToEdit'),
		editorCallback: trackEditorCommand(plugin, "select-table-to-edit", t('selectTableToEdit'), (editor) => openTableSelector(plugin, editor)),
	});

	// Plugin usage stats
	plugin.addCommand({
		id: "show-plugin-usage-stats",
		name: t('showPluginUsageStats'),
		callback: trackCommand(plugin, "show-plugin-usage-stats", t('showPluginUsageStats'), () => showPluginUsageStats(plugin)),
	});

	// Plugin manager
	plugin.addCommand({
		id: "open-plugin-manager",
		name: t('openPluginManager'),
		callback: trackCommand(plugin, "open-plugin-manager", t('openPluginManager'), () => openPluginManager(plugin)),
	});

	// Show outline
	plugin.addCommand({
		id: "show-outline",
		name: t('showOutline'),
		editorCallback: trackEditorCommand(plugin, "show-outline", t('showOutline'), (editor) => showOutline(plugin, editor)),
	});

	// Copy outline
	plugin.addCommand({
		id: "copy-outline",
		name: t('copyOutline'),
		editorCallback: trackEditorCommand(plugin, "copy-outline", t('copyOutline'), (editor) => copyOutline(editor)),
	});

	// Create file with date-UUID
	plugin.addCommand({
		id: "create-file-with-date-uuid",
		name: t('createDatedUuidFileInCurrentFolder'),
		callback: trackCommand(plugin, "create-file-with-date-uuid", t('createDatedUuidFileInCurrentFolder'), () => createDatedUuidFileInCurrentFolder(plugin)),
	});

	// Folder manager
	plugin.addCommand({
		id: "open-folder-manager",
		name: t('openFolderManager'),
		callback: trackCommand(plugin, "open-folder-manager", t('openFolderManager'), () => openFolderManager(plugin)),
	});
}
