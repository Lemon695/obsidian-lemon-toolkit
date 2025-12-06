import { App, Modal, Setting, Notice } from "obsidian";
import LemonToolkitPlugin from "../main";
import { PluginUsageAnalyzer } from "../features/plugin-usage/PluginUsageAnalyzer";
import { t } from "../i18n/locale";

interface PluginInfo {
	id: string;
	name: string;
	version: string;
	author: string;
	description: string;
	enabled: boolean;
	usageCount: number;
	commandCount: number;
	lastUsed: number;
	updatedAt?: number; // Plugin update timestamp
}

type FilterType = 'all' | 'enabled' | 'disabled';
type SortType = 'usage' | 'name' | 'recent' | 'updated';

export class PluginManagerModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private analyzer: PluginUsageAnalyzer;
	private plugins: PluginInfo[] = [];
	private filteredPlugins: PluginInfo[] = [];
	private currentFilter: FilterType = 'all';
	private currentSort: SortType = 'usage';
	private searchQuery: string = '';
	private contentContainer: HTMLElement;

	constructor(app: App, plugin: LemonToolkitPlugin) {
		super(app);
		this.plugin = plugin;
		this.analyzer = new PluginUsageAnalyzer(plugin);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('plugin-manager-modal');
		
		// Set fixed modal size
		this.modalEl.style.width = "900px";
		this.modalEl.style.maxWidth = "95vw";
		this.modalEl.style.height = "700px";
		this.modalEl.style.maxHeight = "90vh";

		// Header
		const header = contentEl.createDiv({ cls: 'plugin-manager-header' });
		header.style.display = "flex";
		header.style.justifyContent = "space-between";
		header.style.alignItems = "center";
		header.style.marginBottom = "16px";
		header.style.paddingBottom = "12px";
		header.style.borderBottom = "1px solid var(--background-modifier-border)";

		const title = header.createEl("h2", { text: t('pluginManager') });
		title.style.margin = "0";

		const refreshBtn = header.createEl("button", { text: t('refresh') });
		refreshBtn.style.padding = "6px 16px";
		refreshBtn.addEventListener('click', async () => {
			refreshBtn.disabled = true;
			refreshBtn.textContent = t('refreshing') || 'Refreshing...';
			try {
				await this.plugin.pluginMetadataManager.scanAllPlugins();
				this.loadPlugins();
			} finally {
				refreshBtn.disabled = false;
				refreshBtn.textContent = t('refresh');
			}
		});

		// Filters and search
		const controls = contentEl.createDiv({ cls: 'plugin-manager-controls' });
		controls.style.display = "grid";
		controls.style.gridTemplateColumns = "1fr auto auto";
		controls.style.gap = "12px";
		controls.style.marginBottom = "16px";
		controls.style.alignItems = "center";

		// Search
		const searchContainer = controls.createDiv();
		
		const searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: t('searchPlugins')
		});
		searchInput.style.width = "100%";
		searchInput.style.padding = "8px 12px";
		searchInput.style.border = "1px solid var(--background-modifier-border)";
		searchInput.style.borderRadius = "4px";
		searchInput.addEventListener('input', (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
			this.filterAndSort();
		});

		// Filter dropdown
		const filterContainer = controls.createDiv();
		filterContainer.style.display = "flex";
		filterContainer.style.alignItems = "center";
		filterContainer.style.gap = "8px";
		
		const filterLabel = filterContainer.createSpan({ text: t('pluginFilter') + ':' });
		filterLabel.style.fontSize = "0.9em";
		filterLabel.style.color = "var(--text-muted)";
		
		const filterSelect = filterContainer.createEl("select");
		filterSelect.style.padding = "6px 12px";
		filterSelect.style.border = "1px solid var(--background-modifier-border)";
		filterSelect.style.borderRadius = "4px";
		
		['all', 'enabled', 'disabled'].forEach(value => {
			const option = filterSelect.createEl("option", { value });
			option.textContent = t(value === 'all' ? 'filterAll' : value === 'enabled' ? 'filterEnabled' : 'filterDisabled');
		});
		
		filterSelect.value = this.currentFilter;
		filterSelect.addEventListener('change', (e) => {
			this.currentFilter = (e.target as HTMLSelectElement).value as FilterType;
			this.filterAndSort();
		});

		// Sort dropdown
		const sortContainer = controls.createDiv();
		sortContainer.style.display = "flex";
		sortContainer.style.alignItems = "center";
		sortContainer.style.gap = "8px";
		
		const sortLabel = sortContainer.createSpan({ text: t('sortBy') + ':' });
		sortLabel.style.fontSize = "0.9em";
		sortLabel.style.color = "var(--text-muted)";
		
		const sortSelect = sortContainer.createEl("select");
		sortSelect.style.padding = "6px 12px";
		sortSelect.style.border = "1px solid var(--background-modifier-border)";
		sortSelect.style.borderRadius = "4px";
		
		[
			{ value: 'usage', label: t('sortByUsage') },
			{ value: 'name', label: t('pluginSortByName') },
			{ value: 'recent', label: t('pluginSortByRecent') },
			{ value: 'updated', label: t('pluginSortByUpdated') }
		].forEach(({ value, label }) => {
			const option = sortSelect.createEl("option", { value });
			option.textContent = label;
		});
		
		sortSelect.value = this.currentSort;
		sortSelect.addEventListener('change', (e) => {
			this.currentSort = (e.target as HTMLSelectElement).value as SortType;
			this.filterAndSort();
		});

		// Content container with fixed height
		this.contentContainer = contentEl.createDiv({ cls: 'plugin-manager-content' });
		this.contentContainer.style.height = "520px";
		this.contentContainer.style.overflowY = "auto";
		this.contentContainer.style.border = "1px solid var(--background-modifier-border)";
		this.contentContainer.style.borderRadius = "4px";

		// Load plugins
		this.loadPlugins();
	}

	private loadPlugins() {
		this.plugins = [];
		const manifests = (this.app as any).plugins.manifests;
		const enabledPlugins = (this.app as any).plugins.enabledPlugins;
		const usageStats = this.analyzer.getPluginUsageStats('all');
		const usageMap = new Map(usageStats.map(s => [s.pluginId, s]));

		Object.keys(manifests).forEach(pluginId => {
			const manifest = manifests[pluginId];
			const usage = usageMap.get(pluginId);
			
			// Get update time from PluginMetadataManager
			const metadata = this.plugin.pluginMetadataManager.getMetadata(pluginId);
			const updatedAt = metadata?.updatedAt;

			this.plugins.push({
				id: pluginId,
				name: manifest.name || pluginId,
				version: manifest.version || 'Unknown',
				author: manifest.author || 'Unknown',
				description: manifest.description || '',
				enabled: enabledPlugins.has(pluginId),
				usageCount: usage?.totalUsage || 0,
				commandCount: usage?.commandCount || 0,
				lastUsed: usage?.lastUsed || 0,
				updatedAt
			});
		});

		this.filterAndSort();
	}

	private filterAndSort() {
		// Filter
		this.filteredPlugins = this.plugins.filter(plugin => {
			// Filter by status
			if (this.currentFilter === 'enabled' && !plugin.enabled) return false;
			if (this.currentFilter === 'disabled' && plugin.enabled) return false;

			// Filter by search
			if (this.searchQuery) {
				const query = this.searchQuery;
				return plugin.name.toLowerCase().includes(query) ||
					   plugin.id.toLowerCase().includes(query) ||
					   plugin.author.toLowerCase().includes(query);
			}

			return true;
		});

		// Sort
		this.filteredPlugins.sort((a, b) => {
			switch (this.currentSort) {
				case 'usage':
					return b.usageCount - a.usageCount;
				case 'name':
					return a.name.localeCompare(b.name);
				case 'recent':
					return b.lastUsed - a.lastUsed;
				case 'updated':
					return (b.updatedAt || 0) - (a.updatedAt || 0);
				default:
					return 0;
			}
		});

		this.render();
	}

	private render() {
		this.contentContainer.empty();

		if (this.filteredPlugins.length === 0) {
			const empty = this.contentContainer.createDiv();
			empty.textContent = t('noPluginsFound');
			empty.style.textAlign = "center";
			empty.style.padding = "32px";
			empty.style.color = "var(--text-muted)";
			return;
		}

		this.filteredPlugins.forEach((plugin, index) => {
			const item = this.contentContainer.createDiv({ cls: 'plugin-item' });
			item.style.padding = "20px";
			item.style.borderBottom = "1px solid var(--background-modifier-border)";
			item.style.backgroundColor = "var(--background-primary)";
			item.style.transition = "background-color 0.1s";
			
			item.addEventListener('mouseenter', () => {
				item.style.backgroundColor = "var(--background-primary-alt)";
			});
			item.addEventListener('mouseleave', () => {
				item.style.backgroundColor = "var(--background-primary)";
			});

			// Top row: Rank + Name + Status + Actions
			const topRow = item.createDiv();
			topRow.style.display = "flex";
			topRow.style.justifyContent = "space-between";
			topRow.style.alignItems = "center";
			topRow.style.marginBottom = "8px";

			// Left: Rank + Name
			const leftPart = topRow.createDiv();
			leftPart.style.display = "flex";
			leftPart.style.alignItems = "center";
			leftPart.style.gap = "12px";
			leftPart.style.flex = "1";

			// Rank
			if (this.currentSort === 'usage' && plugin.usageCount > 0) {
				const rank = leftPart.createSpan();
				rank.textContent = `${index + 1}`;
				rank.style.fontWeight = "bold";
				rank.style.color = index < 3 ? "var(--text-accent)" : "var(--text-muted)";
				rank.style.fontSize = index < 3 ? "1.3em" : "1em";
				rank.style.minWidth = "28px";
				rank.style.textAlign = "center";
			}

			// Name
			const nameContainer = leftPart.createDiv();
			nameContainer.style.flex = "1";
			
			const name = nameContainer.createDiv();
			name.textContent = plugin.name;
			name.style.fontWeight = "600";
			name.style.fontSize = "1.1em";
			name.style.marginBottom = "4px";

			// Version and author
			const meta = nameContainer.createDiv();
			meta.style.fontSize = "0.85em";
			meta.style.color = "var(--text-muted)";
			
			let metaText = `v${plugin.version} • ${plugin.author}`;
			if (plugin.updatedAt) {
				const updateTime = this.getTimeAgo(plugin.updatedAt);
				metaText += ` • ${t('updated')}: ${updateTime}`;
			}
			meta.textContent = metaText;

			// Right: Status badge + Actions
			const rightPart = topRow.createDiv();
			rightPart.style.display = "flex";
			rightPart.style.alignItems = "center";
			rightPart.style.gap = "12px";

			// Status badge
			const status = rightPart.createSpan();
			status.textContent = plugin.enabled ? t('pluginEnabled') : t('pluginDisabled');
			status.style.padding = "4px 12px";
			status.style.borderRadius = "12px";
			status.style.fontSize = "0.85em";
			status.style.fontWeight = "500";
			status.style.backgroundColor = plugin.enabled ? "var(--interactive-accent)" : "var(--background-modifier-border)";
			status.style.color = plugin.enabled ? "white" : "var(--text-muted)";

			// Actions
			const actions = rightPart.createDiv();
			actions.style.display = "flex";
			actions.style.gap = "8px";

			// Settings button
			if (plugin.enabled) {
				const settingsBtn = actions.createEl("button", { text: t('pluginSettings') });
				settingsBtn.style.padding = "6px 12px";
				settingsBtn.addEventListener('click', () => {
					this.analyzer.openPluginSettings(plugin.id);
					this.close();
				});
			}

			// Enable/Disable button
			const toggleBtn = actions.createEl("button", {
				text: plugin.enabled ? t('pluginDisable') : t('pluginEnable'),
				cls: plugin.enabled ? '' : 'mod-cta'
			});
			toggleBtn.style.padding = "6px 12px";
			toggleBtn.addEventListener('click', async () => {
				await this.togglePlugin(plugin);
			});

			// Usage stats
			if (plugin.usageCount > 0) {
				const stats = item.createDiv();
				stats.style.fontSize = "0.9em";
				stats.style.color = "var(--text-muted)";
				stats.style.marginBottom = "8px";
				stats.style.display = "flex";
				stats.style.gap = "16px";
				
				const timeAgo = this.getTimeAgo(plugin.lastUsed);
				
				const usageSpan = stats.createSpan();
				usageSpan.textContent = `📊 ${plugin.usageCount} ${t('uses')}`;
				
				const commandsSpan = stats.createSpan();
				commandsSpan.textContent = `⚡ ${plugin.commandCount} ${t('commands')}`;
				
				const timeSpan = stats.createSpan();
				timeSpan.textContent = `🕐 ${timeAgo}`;
			} else {
				const noUsage = item.createDiv();
				noUsage.style.fontSize = "0.9em";
				noUsage.style.color = "var(--text-faint)";
				noUsage.style.marginBottom = "8px";
				noUsage.textContent = `📊 ${t('pluginNeverUsed')}`;
			}

			// Description
			if (plugin.description) {
				const desc = item.createDiv();
				desc.style.fontSize = "0.9em";
				desc.style.color = "var(--text-muted)";
				desc.style.lineHeight = "1.5";
				desc.textContent = plugin.description;
			}
		});
	}

	private async togglePlugin(plugin: PluginInfo) {
		const plugins = (this.app as any).plugins;
		
		try {
			if (plugin.enabled) {
				await plugins.disablePlugin(plugin.id);
				plugin.enabled = false; // Update local state immediately
				new Notice(t('pluginDisabledNotice', { name: plugin.name }));
			} else {
				await plugins.enablePlugin(plugin.id);
				plugin.enabled = true; // Update local state immediately
				new Notice(t('pluginEnabledNotice', { name: plugin.name }));
			}
			
			// Re-render to update UI
			this.render();
		} catch (error) {
			new Notice(t('pluginToggleFailed'));
			console.error('Failed to toggle plugin:', error);
		}
	}

	private getTimeAgo(timestamp: number): string {
		if (!timestamp) return t('pluginNever');
		
		const now = Date.now();
		const diff = now - timestamp;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return t('pluginJustNow');
		if (minutes < 60) return t('pluginMinutesAgo', { count: String(minutes) });
		if (hours < 24) return t('pluginHoursAgo', { count: String(hours) });
		return t('pluginDaysAgo', { count: String(days) });
	}
}
