import LemonToolkitPlugin from "../main";
import { GlobalCommandPaletteModal } from "../ui/GlobalCommandPaletteModal";

export function openGlobalCommandPalette(plugin: LemonToolkitPlugin): void {
	new GlobalCommandPaletteModal(plugin).open();
}
