import { Notice } from "obsidian";
import { MoveFileModal } from "../ui/MoveFileModal";
import LemonToolkitPlugin from "../main";

/**
 * Move the active file to a folder with history
 */
export async function moveFileToFolder(plugin: LemonToolkitPlugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active file");
		return;
	}

	new MoveFileModal(plugin, file).open();
}
