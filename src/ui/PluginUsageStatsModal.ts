import { App, Modal, Setting } from "obsidian";
import LemonToolkitPlugin from "../main";
import { PluginUsageAnalyzer, TimeRange } from "../features/plugin-usage/PluginUsageAnalyzer";
import { t } from "../i18n/locale";

export class PluginUsageStatsModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private analyzer: PluginUsageAnalyzer;
	private currentTimeRange: TimeRange = 'all';
	private contentContainer: HTMLElement;

	constructor(app: App, plugin: LemonToolkitPlugin) {
		super(app);
		this.plugin = plugin;
		this.analyzer = new PluginUsageAnalyzer(plugin);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('plugin-usage-stats-modal');

		// Header with title and reset button
		const header = contentEl.createDiv({ cls: 'plugin-usage-header' });
		header.style.display = "flex";
		header.style.justifyContent = "space-between";
		header.style.alignItems = "center";
		header.style.marginBottom = "8px";

		header.createEl("h2", { text: t('pluginUsageStats') });

		// Reset button
		const resetButton = header.createEl("button", { text: t('resetPluginStats') });
		resetButton.style.padding = "6px 12px";
		resetButton.style.fontSize = "0.9em";
		resetButton.addEventListener('click', async () => {
			if (confirm(t('confirmResetPluginStats'))) {
				await this.analyzer.clearPluginUsageHistory();
				this.refreshStats();
			}
		});

		// Description
		const desc = contentEl.createDiv({ cls: 'plugin-usage-desc' });
		desc.textContent = t('pluginUsageStatsDesc');
		desc.style.marginBottom = "16px";
		desc.style.color = "var(--text-muted)";

		// Time range filter
		new Setting(contentEl)
			.setName(t('pluginStatsTimeRange'))
			.setDesc(t('selectTimeRangeForStats'))
			.addDropdown(dropdown => {
				dropdown
					.addOption('today', t('timeRangeToday'))
					.addOption('week', t('timeRangeThisWeek'))
					.addOption('month', t('timeRangeThisMonth'))
					.addOption('year', t('timeRangeThisYear'))
					.addOption('all', t('timeRangeAllTime'))
					.setValue(this.currentTimeRange)
					.onChange((value: TimeRange) => {
						this.currentTimeRange = value;
						this.refreshStats();
					});
			});

		// Content container
		this.contentContainer = contentEl.createDiv({ cls: 'plugin-usage-content' });
		
		// Initial render
		this.refreshStats();
	}

	private refreshStats() {
		this.contentContainer.empty();

		// Get stats
		const stats = this.analyzer.getPluginUsageStats(this.currentTimeRange);

		if (stats.length === 0) {
			const empty = this.contentContainer.createDiv({ cls: 'plugin-usage-empty' });
			empty.textContent = t('noPluginUsageDataForPeriod');
			empty.style.textAlign = "center";
			empty.style.padding = "32px";
			empty.style.color = "var(--text-muted)";
			return;
		}

		// Summary stats
		const summary = this.contentContainer.createDiv({ cls: 'plugin-usage-summary' });
		summary.style.display = "flex";
		summary.style.gap = "16px";
		summary.style.marginBottom = "16px";
		summary.style.padding = "12px";
		summary.style.backgroundColor = "var(--background-secondary)";
		summary.style.borderRadius = "4px";

		const totalPlugins = stats.length;
		const totalUsage = stats.reduce((sum, s) => sum + s.totalUsage, 0);
		const totalCommands = stats.reduce((sum, s) => sum + s.commandCount, 0);

		this.createSummaryItem(summary, t('pluginStatsTotal'), String(totalPlugins));
		this.createSummaryItem(summary, t('pluginStatsCommands'), String(totalCommands));
		this.createSummaryItem(summary, t('pluginStatsUsage'), String(totalUsage));

		// Stats list
		const container = this.contentContainer.createDiv({ cls: 'plugin-usage-list' });
		container.style.maxHeight = "400px";
		container.style.overflowY = "auto";

		stats.forEach((stat, index) => {
			const item = container.createDiv({ cls: 'plugin-usage-item' });
			item.style.display = "flex";
			item.style.alignItems = "center";
			item.style.padding = "12px";
			item.style.borderBottom = "1px solid var(--background-modifier-border)";
			item.style.cursor = "pointer";

			// Rank
			const rank = item.createDiv({ cls: 'plugin-rank' });
			rank.textContent = `${index + 1}`;
			rank.style.width = "32px";
			rank.style.fontWeight = "bold";
			rank.style.color = index < 3 ? "var(--text-accent)" : "var(--text-muted)";
			rank.style.fontSize = index < 3 ? "1.2em" : "1em";

			// Plugin info
			const info = item.createDiv({ cls: 'plugin-info' });
			info.style.flex = "1";
			info.style.marginLeft = "12px";

			const nameContainer = info.createDiv();
			nameContainer.style.display = "flex";
			nameContainer.style.alignItems = "center";
			nameContainer.style.gap = "8px";
			nameContainer.style.marginBottom = "4px";

			const name = nameContainer.createSpan({ cls: 'plugin-name' });
			name.textContent = stat.pluginName;
			name.style.fontWeight = "500";

			// Trend indicator
			if (this.currentTimeRange !== 'all' && stat.trend !== 0) {
				const trend = nameContainer.createSpan({ cls: 'plugin-trend' });
				const isPositive = stat.trend > 0;
				trend.textContent = `${isPositive ? '↑' : '↓'} ${Math.abs(stat.trend).toFixed(0)}%`;
				trend.style.fontSize = "0.85em";
				trend.style.color = isPositive ? "var(--color-green)" : "var(--color-red)";
				trend.style.fontWeight = "500";
			}

			const details = info.createDiv({ cls: 'plugin-details' });
			details.style.fontSize = "0.9em";
			details.style.color = "var(--text-muted)";
			details.textContent = t('pluginUsageDetails', {
				commands: String(stat.commandCount),
				usage: String(stat.totalUsage)
			});

			// Percentage bar
			const barContainer = info.createDiv({ cls: 'plugin-usage-bar' });
			barContainer.style.marginTop = "6px";
			barContainer.style.height = "4px";
			barContainer.style.backgroundColor = "var(--background-modifier-border)";
			barContainer.style.borderRadius = "2px";
			barContainer.style.overflow = "hidden";

			const bar = barContainer.createDiv();
			bar.style.height = "100%";
			bar.style.width = `${stat.usagePercentage}%`;
			bar.style.backgroundColor = "var(--interactive-accent)";
			bar.style.transition = "width 0.3s ease";

			// Usage count
			const usageContainer = item.createDiv({ cls: 'plugin-usage-count-container' });
			usageContainer.style.textAlign = "right";
			usageContainer.style.marginLeft = "16px";

			const usage = usageContainer.createDiv({ cls: 'plugin-usage-count' });
			usage.textContent = String(stat.totalUsage);
			usage.style.fontSize = "1.5em";
			usage.style.fontWeight = "bold";
			usage.style.color = "var(--text-accent)";

			const percentage = usageContainer.createDiv({ cls: 'plugin-usage-percentage' });
			percentage.textContent = `${stat.usagePercentage.toFixed(1)}%`;
			percentage.style.fontSize = "0.85em";
			percentage.style.color = "var(--text-muted)";

			// Hover effect
			item.addEventListener('mouseenter', () => {
				item.style.backgroundColor = "var(--background-modifier-hover)";
			});
			item.addEventListener('mouseleave', () => {
				item.style.backgroundColor = "";
			});

			// Click to open plugin settings
			item.addEventListener('click', () => {
				this.analyzer.openPluginSettings(stat.pluginId);
				this.close();
			});
		});

		// Footer
		const footer = this.contentContainer.createDiv({ cls: 'plugin-usage-footer' });
		footer.style.marginTop = "16px";
		footer.style.padding = "12px";
		footer.style.backgroundColor = "var(--background-secondary)";
		footer.style.borderRadius = "4px";
		footer.style.fontSize = "0.9em";
		footer.style.color = "var(--text-muted)";
		footer.textContent = t('pluginUsageFooter');
	}

	private createSummaryItem(container: HTMLElement, label: string, value: string) {
		const item = container.createDiv({ cls: 'summary-item' });
		item.style.flex = "1";
		item.style.textAlign = "center";

		const valueEl = item.createDiv();
		valueEl.textContent = value;
		valueEl.style.fontSize = "1.5em";
		valueEl.style.fontWeight = "bold";
		valueEl.style.color = "var(--text-accent)";

		const labelEl = item.createDiv();
		labelEl.textContent = label;
		labelEl.style.fontSize = "0.85em";
		labelEl.style.color = "var(--text-muted)";
		labelEl.style.marginTop = "4px";
	}
}
