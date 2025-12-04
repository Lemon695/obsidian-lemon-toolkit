import { WorkspaceLeaf } from "obsidian";
import LemonToolkitPlugin from "../main";
import { RECENT_FILES_VIEW_TYPE, RecentFilesView } from "../views/RecentFilesView";

/**
 * Open Recent Files view in sidebar
 */
export async function openRecentFilesView(plugin: LemonToolkitPlugin): Promise<void> {
	const { workspace } = plugin.app;

	// Check if view is already open
	let leaf: WorkspaceLeaf | null = null;
	workspace.getLeavesOfType(RECENT_FILES_VIEW_TYPE).forEach((l) => {
		leaf = l;
	});

	if (!leaf) {
		// Open in right sidebar
		const rightLeaf = workspace.getRightLeaf(false);
		if (rightLeaf) {
			await rightLeaf.setViewState({
				type: RECENT_FILES_VIEW_TYPE,
				active: true,
			});
			leaf = rightLeaf;
		}
	}

	if (leaf) {
		workspace.revealLeaf(leaf);
	}
}
