import LemonToolkitPlugin from "../main";
import { PluginUsageStatsModal } from "../ui/PluginUsageStatsModal";

export function showPluginUsageStats(plugin: LemonToolkitPlugin): void {
	new PluginUsageStatsModal(plugin.app, plugin).open();
}
