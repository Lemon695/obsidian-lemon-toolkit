import { App, PluginSettingTab, Setting } from "obsidian";
import LemonToolkitPlugin from "../main";
import { PinnedCommandsModal } from "./PinnedCommandsModal";

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

		// Duplicate file settings
		containerEl.createEl("h3", { text: "Duplicate File" });

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

		// Move file settings
		containerEl.createEl("h3", { text: "Move File" });

		new Setting(containerEl)
			.setName("Folder list sort order")
			.setDesc("Choose how to sort the folder list when moving files")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("recent", "Most recently used")
					.addOption("day", "Most used in last 24 hours")
					.addOption("week", "Most used in last 7 days")
					.addOption("month", "Most used in last 30 days")
					.setValue(this.plugin.settings.folderSortType)
					.onChange(async (value: "recent" | "day" | "week" | "month") => {
						this.plugin.settings.folderSortType = value;
						await this.plugin.saveSettings();
					})
			);

		// Tag settings
		containerEl.createEl("h3", { text: "Tags" });

		new Setting(containerEl)
			.setName("Tag list sort order")
			.setDesc("Choose how to sort the tag list when inserting tags")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("recent", "Most recently used")
					.addOption("day", "Most used in last 24 hours")
					.addOption("week", "Most used in last 7 days")
					.addOption("month", "Most used in last 30 days")
					.addOption("alphabetical", "Alphabetical order")
					.setValue(this.plugin.settings.tagSortType)
					.onChange(async (value: "recent" | "day" | "week" | "month" | "alphabetical") => {
						this.plugin.settings.tagSortType = value;
						await this.plugin.saveSettings();
					})
			);

		// Command palette settings
		containerEl.createEl("h3", { text: "Command Palette" });

		new Setting(containerEl)
			.setName("Pinned commands")
			.setDesc("Select commands to pin at the top of the command palette")
			.addButton((button) =>
				button.setButtonText("Manage pinned commands").onClick(() => {
					this.showPinnedCommandsModal();
				})
			);
	}

	private showPinnedCommandsModal(): void {
		const modal = new PinnedCommandsModal(this.app, this.plugin);
		modal.open();
	}
}
