import { Editor, Notice } from "obsidian";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/locale";

/**
 * Rename file based on the first H1 heading
 */
export async function syncHeadingWithFilename(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice(t('noActiveFile'));
		return;
	}

	const content = editor.getValue();
	const lines = content.split('\n');

	let inCodeBlock = false;
	let headingText = '';

	// Find first H1 heading (skip code blocks)
	for (const line of lines) {
		const trimmed = line.trim();
		
		if (trimmed.startsWith('```')) {
			inCodeBlock = !inCodeBlock;
			continue;
		}

		if (!inCodeBlock && trimmed.startsWith('# ')) {
			headingText = trimmed.substring(2).trim();
			break;
		}
	}

	if (!headingText) {
		new Notice(t('noH1HeadingFound'));
		return;
	}

	// Sanitize filename (remove invalid characters)
	const newFileName = headingText.replace(/[\\/:*?"<>|]/g, '');
	
	if (newFileName === file.basename) {
		new Notice(t('filenameAlreadySynced'));
		return;
	}

	// Rename file
	const newPath = file.parent ? `${file.parent.path}/${newFileName}.md` : `${newFileName}.md`;
	
	try {
		await plugin.app.fileManager.renameFile(file, newPath);
		new Notice(t('fileRenamedToHeading', { name: newFileName }));
	} catch (error) {
		new Notice(t('fileRenameFailed'));
		console.error('Rename failed:', error);
	}
}
