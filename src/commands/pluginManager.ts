import LemonToolkitPlugin from "../main";
import { PluginManagerModal } from "../ui/PluginManagerModal";

export function openPluginManager(plugin: LemonToolkitPlugin): void {
	new PluginManagerModal(plugin.app, plugin).open();
}
