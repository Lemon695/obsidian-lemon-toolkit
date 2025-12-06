import { App, Modal } from "obsidian";
import LemonToolkitPlugin from "../main";
import { PluginUsageAnalyzer } from "../features/plugin-usage/PluginUsageAnalyzer";
import { t } from "../i18n/locale";

export class PluginUsageStatsModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private analyzer: PluginUsageAnalyzer;

	constructor(app: App, plugin: LemonToolkitPlugin) {
		super(app);
		this.plugin = plugin;
		this.analyzer = new PluginUsageAnalyzer(plugin);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('plugin-usage-stats-modal');

		// Title
		contentEl.createEl("h2", { text: t('pluginUsageStats') });

		// Description
		const desc = contentEl.createDiv({ cls: 'plugin-usage-desc' });
		desc.textContent = t('pluginUsageStatsDesc');
		desc.style.marginBottom = "16px";
		desc.style.color = "var(--text-muted)";

		// Get stats
		const stats = this.analyzer.getPluginUsageStats();

		if (stats.length === 0) {
			const empty = contentEl.createDiv({ cls: 'plugin-usage-empty' });
			empty.textContent = t('noPluginUsageData');
			empty.style.textAlign = "center";
			empty.style.padding = "32px";
			empty.style.color = "var(--text-muted)";
			return;
		}

		// Stats container
		const container = contentEl.createDiv({ cls: 'plugin-usage-list' });
		container.style.maxHeight = "500px";
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

			const name = info.createDiv({ cls: 'plugin-name' });
			name.textContent = stat.pluginName;
			name.style.fontWeight = "500";
			name.style.marginBottom = "4px";

			const details = info.createDiv({ cls: 'plugin-details' });
			details.style.fontSize = "0.9em";
			details.style.color = "var(--text-muted)";
			details.textContent = t('pluginUsageDetails', {
				commands: String(stat.commandCount),
				usage: String(stat.totalUsage)
			});

			// Usage count
			const usage = item.createDiv({ cls: 'plugin-usage-count' });
			usage.textContent = String(stat.totalUsage);
			usage.style.fontSize = "1.5em";
			usage.style.fontWeight = "bold";
			usage.style.color = "var(--text-accent)";
			usage.style.marginLeft = "16px";

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
		const footer = contentEl.createDiv({ cls: 'plugin-usage-footer' });
		footer.style.marginTop = "16px";
		footer.style.padding = "12px";
		footer.style.backgroundColor = "var(--background-secondary)";
		footer.style.borderRadius = "4px";
		footer.style.fontSize = "0.9em";
		footer.style.color = "var(--text-muted)";
		footer.textContent = t('pluginUsageFooter');
	}
}
