import { Notice } from "obsidian";
import { FrontmatterEditorModal } from "../features/frontmatter-editor/FrontmatterEditorModal";
import LemonToolkitPlugin from "../main";

/**
 * Open the frontmatter editor for the active file
 */
export function editFrontmatter(plugin: LemonToolkitPlugin): void {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active file");
		return;
	}

	const modal = new FrontmatterEditorModal(plugin.app, plugin, file);
	modal.open();
}
