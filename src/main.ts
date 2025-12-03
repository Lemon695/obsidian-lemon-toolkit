import { Plugin } from "obsidian";
import { registerCommands } from "./commands";
import { LemonToolkitSettings, DEFAULT_SETTINGS } from "./settings";
import { LemonToolkitSettingTab } from "./ui/SettingTab";

export default class LemonToolkitPlugin extends Plugin {
	settings: LemonToolkitSettings;

	async onload() {
		await this.loadSettings();
		registerCommands(this);
		this.addSettingTab(new LemonToolkitSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup handled automatically by Obsidian
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
