import { App, PluginSettingTab, Setting } from "obsidian";
import LemonToolkitPlugin from "../main";

export class LemonToolkitSettingTab extends PluginSettingTab {
	plugin: LemonToolkitPlugin;

	constructor(app: App, plugin: LemonToolkitPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Lemon Toolkit Settings" });

		new Setting(containerEl)
			.setName("Duplicate file suffix type")
			.setDesc("Choose the suffix format for duplicated file names")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("timestamp", "Timestamp (e.g., filename-1733234567890.md)")
					.addOption("uuid", "UUID (e.g., filename-a1b2c3d4.md)")
					.setValue(this.plugin.settings.duplicateFileSuffixType)
					.onChange(async (value: "timestamp" | "uuid") => {
						this.plugin.settings.duplicateFileSuffixType = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
