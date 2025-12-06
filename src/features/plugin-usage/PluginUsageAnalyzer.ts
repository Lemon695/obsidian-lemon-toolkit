import LemonToolkitPlugin from "../../main";

export interface PluginUsageStats {
	pluginId: string;
	pluginName: string;
	totalUsage: number;
	commandCount: number;
	lastUsed: number;
}

export class PluginUsageAnalyzer {
	private plugin: LemonToolkitPlugin;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Analyze plugin usage from command statistics
	 */
	getPluginUsageStats(): PluginUsageStats[] {
		const pluginMap = new Map<string, PluginUsageStats>();
		const commandHistory = this.plugin.settings.commandHistory;

		// Get all commands from Obsidian
		const allCommands = (this.plugin.app as any).commands.commands;

		// Aggregate usage by plugin
		Object.keys(commandHistory).forEach(commandId => {
			const history = commandHistory[commandId];
			
			// Extract plugin ID from command ID (format: pluginId:commandName)
			const colonIndex = commandId.indexOf(':');
			if (colonIndex === -1) return; // Skip core commands

			const pluginId = commandId.substring(0, colonIndex);
			
			// Get plugin name
			const pluginName = this.getPluginName(pluginId);
			if (!pluginName) return; // Plugin not found

			// Aggregate stats
			const existing = pluginMap.get(pluginId);
			if (existing) {
				existing.totalUsage += history.useCount;
				existing.commandCount++;
				existing.lastUsed = Math.max(existing.lastUsed, history.lastUsed);
			} else {
				pluginMap.set(pluginId, {
					pluginId,
					pluginName,
					totalUsage: history.useCount,
					commandCount: 1,
					lastUsed: history.lastUsed
				});
			}
		});

		// Convert to array and sort by usage
		return Array.from(pluginMap.values())
			.sort((a, b) => b.totalUsage - a.totalUsage);
	}

	/**
	 * Get plugin name from plugin ID
	 */
	private getPluginName(pluginId: string): string | null {
		const plugins = (this.plugin.app as any).plugins;
		
		// Check enabled plugins
		if (plugins.enabledPlugins?.has(pluginId)) {
			const manifest = plugins.manifests?.[pluginId];
			return manifest?.name || pluginId;
		}

		return null;
	}

	/**
	 * Open plugin settings
	 */
	openPluginSettings(pluginId: string): void {
		const setting = (this.plugin.app as any).setting;
		if (setting) {
			setting.open();
			setting.openTabById(pluginId);
		}
	}
}
