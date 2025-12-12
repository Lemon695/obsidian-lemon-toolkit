import { Notice } from "obsidian";
import { FrontmatterEditorModal } from "../features/frontmatter-editor/FrontmatterEditorModal";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/legacy";

/**
 * Open the frontmatter editor for the active file
 */
export function editFrontmatter(plugin: LemonToolkitPlugin): void {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice(t('noActiveFile'));
		return;
	}

	const modal = new FrontmatterEditorModal(plugin.app, plugin, file);
	modal.open();
}
