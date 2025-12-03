import LemonToolkitPlugin from "../main";

/**
 * Open the plugin settings tab
 */
export function openSettings(plugin: LemonToolkitPlugin): void {
	// @ts-ignore - setting is available
	const settingTab = plugin.app.setting;
	
	// Open settings
	settingTab.open();
	
	// Navigate to this plugin's settings
	settingTab.openTabById(plugin.manifest.id);
}
