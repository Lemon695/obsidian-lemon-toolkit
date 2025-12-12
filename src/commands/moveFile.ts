import { Notice } from "obsidian";
import { MoveFileModal } from "../ui/MoveFileModal";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/legacy";

/**
 * Move the active file to a folder with history
 */
export async function moveFileToFolder(plugin: LemonToolkitPlugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice(t('noActiveFile'));
		return;
	}

	new MoveFileModal(plugin, file).open();
}
