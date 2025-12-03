import { CommandPaletteModal } from "../ui/CommandPaletteModal";
import LemonToolkitPlugin from "../main";

/**
 * Open the Lemon Toolkit command palette
 */
export function openCommandPalette(plugin: LemonToolkitPlugin): void {
	new CommandPaletteModal(plugin).open();
}
