import { Notice } from "obsidian";
import LemonToolkitPlugin from "../main";
import { RenameFileModal } from "../ui/RenameFileModal";
import { t } from "../i18n/locale";

export async function renameFile(plugin: LemonToolkitPlugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice(t('noActiveFile'));
		return;
	}

	new RenameFileModal(plugin.app, file, async (newName: string) => {
		const sanitized = newName.replace(/[\\/:*?"<>|]/g, '');
		const newPath = file.parent ? `${file.parent.path}/${sanitized}.md` : `${sanitized}.md`;
		
		try {
			await plugin.app.fileManager.renameFile(file, newPath);
			new Notice(t('fileRenamedToHeading', { name: sanitized }));
		} catch (error) {
			new Notice(t('fileRenameFailed'));
			console.error('Rename failed:', error);
		}
	}).open();
}
