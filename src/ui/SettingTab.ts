import { App, PluginSettingTab, Setting } from "obsidian";
import LemonToolkitPlugin from "../main";
import { PinnedCommandsModal } from "./PinnedCommandsModal";
import { t } from "../i18n/locale";

// TODO 管理时间估算-是否显示
const SHOW_EFFICIENCY_ESTIMATES_MANAGER = true;

export class LemonToolkitSettingTab extends PluginSettingTab {
	plugin: LemonToolkitPlugin;

	constructor(app: App, plugin: LemonToolkitPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: t('lemonToolkitSettings') });

		// Duplicate file settings
		containerEl.createEl("h3", { text: t('duplicateFileSettings') });

		new Setting(containerEl)
			.setName(t('duplicateFileSuffixType'))
			.setDesc(t('duplicateFileSuffixTypeDesc'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("timestamp", t('suffixTimestamp'))
					.addOption("uuid", t('suffixUUID'))
					.setValue(this.plugin.settings.duplicateFileSuffixType)
					.onChange(async (value: "timestamp" | "uuid") => {
						this.plugin.settings.duplicateFileSuffixType = value;
						await this.plugin.saveSettings();
					})
			);

		// Move file settings
		containerEl.createEl("h3", { text: t('moveFileSettings') });

		new Setting(containerEl)
			.setName(t('folderListSortOrder'))
			.setDesc(t('folderListSortOrderDesc'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("recent", t('sortMostRecentlyUsed'))
					.addOption("day", t('sortMostUsedLast24Hours'))
					.addOption("week", t('sortMostUsedLast7Days'))
					.addOption("month", t('sortMostUsedLast30Days'))
					.setValue(this.plugin.settings.folderSortType)
					.onChange(async (value: "recent" | "day" | "week" | "month") => {
						this.plugin.settings.folderSortType = value;
						await this.plugin.saveSettings();
					})
			);

		// Tag settings
		containerEl.createEl("h3", { text: t('tagsSettings') });

		new Setting(containerEl)
			.setName(t('tagListSortOrder'))
			.setDesc(t('tagListSortOrderDesc'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("recent", t('sortMostRecentlyUsed'))
					.addOption("day", t('sortMostUsedLast24Hours'))
					.addOption("week", t('sortMostUsedLast7Days'))
					.addOption("month", t('sortMostUsedLast30Days'))
					.addOption("alphabetical", t('sortAlphabetical'))
					.setValue(this.plugin.settings.tagSortType)
					.onChange(async (value: "recent" | "day" | "week" | "month" | "alphabetical") => {
						this.plugin.settings.tagSortType = value;
						await this.plugin.saveSettings();
					})
			);

		// Command palette settings
		containerEl.createEl("h3", { text: t('commandPaletteSettings') });

		new Setting(containerEl)
			.setName(t('pinnedCommandsSetting'))
			.setDesc(t('pinnedCommandsSettingDesc'))
			.addButton((button) =>
				button.setButtonText(t('manage')).onClick(() => {
					this.showPinnedCommandsModal();
				})
			);

		// File info view settings
		containerEl.createEl("h3", { text: t('fileInfoViewSettings') });

		new Setting(containerEl)
			.setName(t('showReadingTime'))
			.setDesc(t('showReadingTimeDesc'))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showReadingTime).onChange(async (value) => {
					this.plugin.settings.showReadingTime = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(t('dateTimeFormat'))
			.setDesc(t('dateTimeFormatDesc'))
			.addText((text) =>
				text
					.setPlaceholder(t('placeholderDateTime'))
					.setValue(this.plugin.settings.dateTimeFormat)
					.onChange(async (value) => {
						this.plugin.settings.dateTimeFormat = value || "YYYY-MM-DD HH:mm";
						await this.plugin.saveSettings();
					})
			);

		// Frontmatter editor settings
		containerEl.createEl("h3", { text: t('frontmatterEditorSettings') });

		new Setting(containerEl)
			.setName(t('showTypeIcons'))
			.setDesc(t('showTypeIconsDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.frontmatterEditor.showTypeIcons)
					.onChange(async (value) => {
						this.plugin.settings.frontmatterEditor.showTypeIcons = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t('closeAfterSave'))
			.setDesc(t('closeAfterSaveDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.frontmatterEditor.closeAfterSave)
					.onChange(async (value) => {
						this.plugin.settings.frontmatterEditor.closeAfterSave = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t('dateFormat'))
			.setDesc(t('dateFormatDesc'))
			.addText((text) =>
				text
					.setPlaceholder(t('placeholderDate'))
					.setValue(this.plugin.settings.frontmatterEditor.dateFormat)
					.onChange(async (value) => {
						this.plugin.settings.frontmatterEditor.dateFormat = value || "YYYY-MM-DD";
						await this.plugin.saveSettings();
					})
			);

		// External apps settings
		containerEl.createEl("h3", { text: t('externalApplicationsSettings') });

		new Setting(containerEl)
			.setName(t('manageExternalApps'))
			.setDesc(t('manageExternalAppsDesc'))
			.addButton((button) =>
				button.setButtonText(t('manage')).onClick(() => {
					this.showExternalAppsModal();
				})
			);

		// Smart paste settings
		containerEl.createEl("h3", { text: t('smartPasteSettings') });

		new Setting(containerEl)
			.setName(t('manageClipboardRules'))
			.setDesc(t('manageClipboardRulesDesc'))
			.addButton((button) =>
				button.setButtonText(t('manage')).onClick(() => {
					this.showClipboardRulesModal();
				})
			);

		const rulesCount = this.plugin.settings.clipboardRules.filter(r => r.enabled).length;
		const rulesInfo = containerEl.createDiv({ cls: "setting-item-description" });
		rulesInfo.style.marginTop = "-10px";
		rulesInfo.style.paddingLeft = "0";
		rulesInfo.textContent = t('activeRules', { count: rulesCount.toString(), s: rulesCount !== 1 ? "s" : "" });

		// Moment logger settings
		containerEl.createEl("h3", { text: t('momentLoggerSettings') });

		new Setting(containerEl)
			.setName(t('momentFormat'))
			.setDesc(t('momentFormatDesc'))
			.addText((text) =>
				text
					.setPlaceholder(t('placeholderMomentFormat'))
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

		// Statistics settings
		containerEl.createEl("h3", { text: t('statisticsSettings') });

		new Setting(containerEl)
			.setName(t('enableStatistics'))
			.setDesc(t('enableStatisticsDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.statistics.enabled)
					.onChange(async (value) => {
						this.plugin.settings.statistics.enabled = value;
						this.plugin.statisticsManager?.updateSettings(this.plugin.settings.statistics);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t('dataRetention'))
			.setDesc(t('dataRetentionDesc'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("30", t('retention30Days'))
					.addOption("90", t('retention90Days'))
					.addOption("365", t('retention365Days'))
					.addOption("-1", t('retentionForever'))
					.setValue(this.plugin.settings.statistics.retentionDays.toString())
					.onChange(async (value) => {
						this.plugin.settings.statistics.retentionDays = parseInt(value);
						this.plugin.statisticsManager?.updateSettings(this.plugin.settings.statistics);
						await this.plugin.saveSettings();
					})
			);

		// Efficiency Estimates Manager (can be hidden via feature flag)
		if (SHOW_EFFICIENCY_ESTIMATES_MANAGER) {
			new Setting(containerEl)
				.setName(t('manageEfficiencyEstimates'))
				.setDesc(t('manageEfficiencyEstimatesDesc'))
				.addButton((button) =>
					button.setButtonText(t('manage')).onClick(() => {
						this.showEfficiencyEstimatesModal();
					})
				);
		}

		// Show current time saved
		if (this.plugin.statisticsManager) {
			const totalTimeSaved = this.plugin.statisticsManager.getCumulativeTimeSaved();
			if (totalTimeSaved > 0) {
				const { formatTimeSaved } = require("../features/statistics/efficiency-config");
				const timeSavedInfo = containerEl.createDiv({ cls: "setting-item-description" });
				timeSavedInfo.style.marginTop = "-10px";
				timeSavedInfo.style.paddingLeft = "0";
				timeSavedInfo.style.color = "var(--text-accent)";
				timeSavedInfo.style.fontWeight = "500";
				timeSavedInfo.innerHTML = `⏱️ ${t('totalTimeSavedSoFar')}: <strong>${formatTimeSaved(totalTimeSaved)}</strong>`;
			}
		}
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

	private showEfficiencyEstimatesModal(): void {
		const { EfficiencyEstimatesModal } = require("./EfficiencyEstimatesModal");
		const modal = new EfficiencyEstimatesModal(this.app, this.plugin);
		modal.open();
	}
}
