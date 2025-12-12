import LemonToolkitPlugin from '../main';
import { FolderManagerModal } from '../ui/FolderManagerModal';

/**
 * Open the folder manager modal
 */
export function openFolderManager(plugin: LemonToolkitPlugin): void {
	const modal = new FolderManagerModal(plugin.app);
	modal.open();
}