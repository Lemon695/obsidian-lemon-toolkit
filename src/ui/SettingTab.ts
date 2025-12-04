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

		// File info view settings
		containerEl.createEl("h3", { text: "File Info View" });

		new Setting(containerEl)
			.setName("Show reading time")
			.setDesc("Display estimated reading time in file info")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showReadingTime).onChange(async (value) => {
					this.plugin.settings.showReadingTime = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Date time format")
			.setDesc("Format for displaying dates and times (e.g., YYYY-MM-DD HH:mm)")
			.addText((text) =>
				text
					.setPlaceholder("YYYY-MM-DD HH:mm")
					.setValue(this.plugin.settings.dateTimeFormat)
					.onChange(async (value) => {
						this.plugin.settings.dateTimeFormat = value || "YYYY-MM-DD HH:mm";
						await this.plugin.saveSettings();
					})
			);

		// Frontmatter editor settings
		containerEl.createEl("h3", { text: "Frontmatter Editor" });

		new Setting(containerEl)
			.setName("Show type icons")
			.setDesc("Display type icons next to field names")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.frontmatterEditor.showTypeIcons)
					.onChange(async (value) => {
						this.plugin.settings.frontmatterEditor.showTypeIcons = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Close after save")
			.setDesc("Automatically close the editor after saving")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.frontmatterEditor.closeAfterSave)
					.onChange(async (value) => {
						this.plugin.settings.frontmatterEditor.closeAfterSave = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Date format")
			.setDesc("Format for date fields (e.g., YYYY-MM-DD)")
			.addText((text) =>
				text
					.setPlaceholder("YYYY-MM-DD")
					.setValue(this.plugin.settings.frontmatterEditor.dateFormat)
					.onChange(async (value) => {
						this.plugin.settings.frontmatterEditor.dateFormat = value || "YYYY-MM-DD";
						await this.plugin.saveSettings();
					})
			);

		// External apps settings
		containerEl.createEl("h3", { text: "External Applications" });

		new Setting(containerEl)
			.setName("Manage external applications")
			.setDesc("Configure external applications to open files and folders")
			.addButton((button) =>
				button.setButtonText("Manage applications").onClick(() => {
					this.showExternalAppsModal();
				})
			);

		// Smart paste settings
		containerEl.createEl("h3", { text: "Smart Paste" });

		new Setting(containerEl)
			.setName("Clipboard rules")
			.setDesc("Configure rules to automatically transform clipboard content when pasting")
			.addButton((button) =>
				button.setButtonText("Manage rules").onClick(() => {
					this.showClipboardRulesModal();
				})
			);

		const rulesCount = this.plugin.settings.clipboardRules.filter(r => r.enabled).length;
		const rulesInfo = containerEl.createDiv({ cls: "setting-item-description" });
		rulesInfo.style.marginTop = "-10px";
		rulesInfo.style.paddingLeft = "0";
		rulesInfo.textContent = `${rulesCount} active rule${rulesCount !== 1 ? "s" : ""}`;

		// Moment logger settings
		containerEl.createEl("h3", { text: "Moment Logger" });

		new Setting(containerEl)
			.setName("Timestamp format")
			.setDesc("Format for moment timestamps (e.g., YYYY-MM-DD HH:mm:ss)")
			.addText((text) =>
				text
					.setPlaceholder("YYYY-MM-DD HH:mm:ss")
					.setValue(this.plugin.settings.momentLoggerFormat)
					.onChange(async (value) => {
						this.plugin.settings.momentLoggerFormat = value || "YYYY-MM-DD HH:mm:ss";
						await this.plugin.saveSettings();
					})
			);

		const formatDesc = containerEl.createDiv({ cls: "setting-item-description" });
		formatDesc.style.marginTop = "-10px";
		formatDesc.style.paddingLeft = "0";
		formatDesc.innerHTML = `
			<strong>Format tokens:</strong><br>
			YYYY (year), MM (month), DD (day)<br>
			HH (hour 24h), mm (minute), ss (second)<br>
			<strong>Example:</strong> ${this.getMomentExample()}
		`;
	}

	private getMomentExample(): string {
		const { moment } = require("obsidian");
		return moment().format(this.plugin.settings.momentLoggerFormat);
	}

	private showExternalAppsModal(): void {
		const { ExternalAppsSettingModal } = require("./ExternalAppsSettingModal");
		const modal = new ExternalAppsSettingModal(this.app, this.plugin);
		modal.open();
	}

	private showPinnedCommandsModal(): void {
		const modal = new PinnedCommandsModal(this.app, this.plugin);
		modal.open();
	}

	private showClipboardRulesModal(): void {
		const { ClipboardRulesSettingModal } = require("./ClipboardRulesSettingModal");
		const modal = new ClipboardRulesSettingModal(
			this.app,
			this.plugin,
			this.plugin.settings.clipboardRules,
			async (rules: any) => {
				this.plugin.settings.clipboardRules = rules;
				await this.plugin.saveSettings();
				this.display(); // Refresh to update rules count
			}
		);
		modal.open();
	}
}
