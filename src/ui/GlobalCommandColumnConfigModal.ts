import { App, Modal, Setting } from "obsidian";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/locale";

export class GlobalCommandColumnConfigModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private columnSorts: Array<"recent" | "frequent" | "alphabetical" | "plugin">;
	private columnPinned: Array<string[]>;
	private columnTimeRanges: Array<24 | 168 | 240 | 720 | 2160 | 4380 | 8760 | 0>; // Time range for each column
	private allCommands: Array<{ id: string; name: string; pluginName: string }>;
	private currentColumn: number = 0;
	private searchQuery: string = "";
	private draggedElement: HTMLElement | null = null;
	private draggedIndex: number = -1;

	constructor(app: App, plugin: LemonToolkitPlugin) {
		super(app);
		this.plugin = plugin;
		
		const config = plugin.globalCommandPaletteConfigManager.getConfig();
		const columns = config.columns;
		if (columns === 1) {
			// Single column mode
			this.columnSorts = [config.singleColumn.sortBy];
			this.columnPinned = [config.singleColumn.pinnedCommands.slice()];
			this.columnTimeRanges = [720]; // Default time range for single column
		} else if (columns === 2) {
			this.columnSorts = [...config.twoColumns.columnSorts];
			this.columnPinned = config.twoColumns.columnPinned.map(arr => [...arr]);
			this.columnTimeRanges = config.twoColumns.columnTimeRanges || [720, 720];
		} else {
			this.columnSorts = [...config.threeColumns.columnSorts];
			this.columnPinned = config.threeColumns.columnPinned.map(arr => [...arr]);
			this.columnTimeRanges = config.threeColumns.columnTimeRanges || [720, 720, 720];
		}
		
		this.allCommands = [];
		
		// Set fixed modal size
		this.modalEl.style.width = "900px";
		this.modalEl.style.height = "600px";
	}

	onOpen(): void {
		const { contentEl } = this;
		
		// Get all commands
		const allCommands = (this.plugin.app as any).commands.commands;
		Object.keys(allCommands).forEach((commandId) => {
			const command = allCommands[commandId];
			let pluginName = "Obsidian";
			if (commandId.includes(":")) {
				const pluginId = commandId.split(":")[0];
				pluginName = this.getPluginDisplayName(pluginId);
			}
			this.allCommands.push({
				id: commandId,
				name: command.name,
				pluginName,
			});
		});

		this.allCommands.sort((a, b) => {
			if (a.pluginName !== b.pluginName) {
				return a.pluginName.localeCompare(b.pluginName);
			}
			return a.name.localeCompare(b.name);
		});

		this.render();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: t('configureGlobalCommandColumns') });

		const config = this.plugin.globalCommandPaletteConfigManager.getConfig();
		const columns = config.columns;
		
		// Column tabs
		if (columns > 1) {
			const tabContainer = contentEl.createDiv({ cls: "column-tabs" });
			tabContainer.style.display = "flex";
			tabContainer.style.gap = "8px";
			tabContainer.style.marginBottom = "16px";
			tabContainer.style.borderBottom = "1px solid var(--background-modifier-border)";
			tabContainer.style.paddingBottom = "8px";

			for (let i = 0; i < columns; i++) {
				const tab = tabContainer.createDiv({ cls: "column-tab" });
				tab.textContent = t('columnTab', { column: (i + 1).toString() });
				tab.style.padding = "8px 16px";
				tab.style.cursor = "pointer";
				tab.style.borderRadius = "4px";
				
				if (i === this.currentColumn) {
					tab.style.backgroundColor = "var(--interactive-accent)";
					tab.style.color = "var(--text-on-accent)";
				} else {
					tab.style.backgroundColor = "var(--background-secondary)";
				}

				tab.addEventListener("click", () => {
					this.currentColumn = i;
					this.searchQuery = "";
					this.render();
				});
			}
		}

		// Column sort setting
		new Setting(contentEl)
			.setName(t('columnSortSetting', { column: (this.currentColumn + 1).toString() }))
			.setDesc(t('columnSortSettingDesc'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("recent", t('sortByRecent'))
					.addOption("frequent", t('sortByFrequent'))
					.addOption("alphabetical", t('sortByAlphabetical'))
					.addOption("plugin", t('sortByPlugin'))
					.setValue(this.columnSorts[this.currentColumn] || "recent")
					.onChange((value: "recent" | "frequent" | "alphabetical" | "plugin") => {
						this.columnSorts[this.currentColumn] = value;
						this.render(); // Re-render to show/hide time range
					})
			);

		// Time range setting (only show when sort is frequent)
		if (this.columnSorts[this.currentColumn] === "frequent") {
			new Setting(contentEl)
				.setName(t('commandPaletteTimeRange'))
				.setDesc(t('commandPaletteTimeRangeDesc'))
				.addDropdown((dropdown) =>
					dropdown
						.addOption("24", t('timeRangeLast24Hours'))
						.addOption("168", t('timeRangeLast7Days'))
						.addOption("720", t('timeRangeLast30Days'))
						.addOption("240", t('timeRangeLast10Days'))
						.addOption("2160", t('timeRangeLast90Days'))
						.addOption("4380", t('timeRangeLast6Months'))
						.addOption("8760", t('timeRangeLast1Year'))
						.addOption("0", t('timeRangeAllTime'))
						.setValue(String(this.columnTimeRanges[this.currentColumn] || 720))
						.onChange((value: string) => {
							this.columnTimeRanges[this.currentColumn] = Number(value) as 24 | 168 | 240 | 720 | 2160 | 4380 | 8760 | 0;
						})
				);
		}

		// Pinned commands section
		contentEl.createEl("h3", { text: t('pinnedCommandsForColumn', { column: (this.currentColumn + 1).toString() }) });

		// Search box
		const searchContainer = contentEl.createDiv({ cls: "search-container" });
		searchContainer.style.marginBottom = "12px";
		
		const searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: t('searchCommands'),
			value: this.searchQuery,
		});
		searchInput.style.width = "100%";
		searchInput.style.padding = "8px";
		searchInput.style.border = "1px solid var(--background-modifier-border)";
		searchInput.style.borderRadius = "4px";
		
		searchInput.addEventListener("input", (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value;
			this.renderAvailableList();
		});

		// Two-column layout container
		const layoutContainer = contentEl.createDiv({ cls: "two-column-layout" });
		layoutContainer.style.display = "grid";
		layoutContainer.style.gridTemplateColumns = "1fr 1fr";
		layoutContainer.style.gap = "16px";
		layoutContainer.style.marginBottom = "20px";

		this.renderPinnedList(layoutContainer);
		this.renderAvailableList(layoutContainer);

		// Save button
		new Setting(contentEl)
			.addButton((button) =>
				button
					.setButtonText(t('save'))
					.setCta()
					.onClick(async () => {
						const config = this.plugin.globalCommandPaletteConfigManager.getConfig();
						const columns = config.columns;
						if (columns === 1) {
							this.plugin.globalCommandPaletteConfigManager.setSingleColumnConfig(
								this.columnPinned[0],
								this.columnSorts[0]
							);
						} else if (columns === 2) {
							this.plugin.globalCommandPaletteConfigManager.setTwoColumnsConfig(
								this.columnSorts as any,
								this.columnPinned as any,
								this.columnTimeRanges as any
							);
						} else {
							this.plugin.globalCommandPaletteConfigManager.setThreeColumnsConfig(
								this.columnSorts as any,
								this.columnPinned as any,
								this.columnTimeRanges as any
							);
						}
						await this.plugin.globalCommandPaletteConfigManager.save();
						this.close();
					})
			)
			.addButton((button) =>
				button
					.setButtonText(t('cancel'))
					.onClick(() => {
						this.close();
					})
			);
	}

	private renderPinnedList(container: HTMLElement): void {
		const existing = container.querySelector('.pinned-list');
		if (existing) existing.remove();

		const pinnedContainer = container.createDiv({ cls: "pinned-list" });
		pinnedContainer.style.minWidth = "0"; // Allow flex to work properly
		
		pinnedContainer.createEl("h4", { text: t('pinnedList') });
		
		const pinnedList = pinnedContainer.createDiv({ cls: "command-list" });
		pinnedList.style.height = "300px"; // Fixed height instead of maxHeight
		pinnedList.style.overflowY = "auto";
		pinnedList.style.border = "1px solid var(--background-modifier-border)";
		pinnedList.style.borderRadius = "4px";
		pinnedList.style.padding = "8px";

		const pinnedIds = this.columnPinned[this.currentColumn] || [];

		if (pinnedIds.length === 0) {
			const emptyMsg = pinnedList.createDiv({ cls: "empty-message" });
			emptyMsg.textContent = t('noPinnedInColumn');
			emptyMsg.style.color = "var(--text-muted)";
			emptyMsg.style.padding = "8px";
			emptyMsg.style.textAlign = "center";
		} else {
			pinnedIds.forEach((cmdId, index) => {
				const cmd = this.allCommands.find(c => c.id === cmdId);
				if (!cmd) return;

				const item = pinnedList.createDiv({ cls: "command-item" });
				item.style.padding = "6px 8px";
				item.style.cursor = "move";
				item.style.borderRadius = "4px";
				item.style.marginBottom = "4px";
				item.style.display = "flex";
				item.style.alignItems = "center";
				item.style.gap = "8px";
				item.draggable = true;

				// Drag handle
				const handle = item.createSpan({ text: "⋮⋮" });
				handle.style.cursor = "grab";
				handle.style.color = "var(--text-muted)";

				// Command info
				const infoContainer = item.createDiv();
				infoContainer.style.flex = "1";
				infoContainer.style.minWidth = "0";

				const nameEl = infoContainer.createDiv({ cls: "command-name" });
				nameEl.textContent = cmd.name;
				nameEl.style.fontWeight = "500";
				nameEl.style.overflow = "hidden";
				nameEl.style.textOverflow = "ellipsis";
				nameEl.style.whiteSpace = "nowrap";
				
				const pluginEl = infoContainer.createDiv({ cls: "command-plugin" });
				pluginEl.textContent = cmd.pluginName;
				pluginEl.style.fontSize = "0.85em";
				pluginEl.style.color = "var(--text-muted)";
				pluginEl.style.overflow = "hidden";
				pluginEl.style.textOverflow = "ellipsis";
				pluginEl.style.whiteSpace = "nowrap";

				// Remove button
				const removeBtn = item.createSpan({ text: "×" });
				removeBtn.style.cursor = "pointer";
				removeBtn.style.fontSize = "1.5em";
				removeBtn.style.color = "var(--text-muted)";
				removeBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					this.unpinCommand(cmdId);
				});

				// Drag events
				item.addEventListener("dragstart", (e) => {
					this.draggedElement = item;
					this.draggedIndex = index;
					item.style.opacity = "0.5";
				});

				item.addEventListener("dragend", () => {
					item.style.opacity = "1";
					this.draggedElement = null;
					this.draggedIndex = -1;
				});

				item.addEventListener("dragover", (e) => {
					e.preventDefault();
					if (this.draggedElement && this.draggedElement !== item) {
						item.style.borderTop = "2px solid var(--interactive-accent)";
					}
				});

				item.addEventListener("dragleave", () => {
					item.style.borderTop = "";
				});

				item.addEventListener("drop", (e) => {
					e.preventDefault();
					item.style.borderTop = "";
					if (this.draggedIndex !== -1 && this.draggedIndex !== index) {
						const [removed] = pinnedIds.splice(this.draggedIndex, 1);
						pinnedIds.splice(index, 0, removed);
						this.renderPinnedList(container.parentElement!);
					}
				});
			});
		}
	}

	private renderAvailableList(container?: HTMLElement): void {
		const parent = container || this.contentEl.querySelector('.two-column-layout');
		if (!parent) return;

		const existing = parent.querySelector('.available-list');
		if (existing) existing.remove();

		const availableContainer = parent.createDiv({ cls: "available-list" });
		availableContainer.style.minWidth = "0"; // Allow flex to work properly
		
		availableContainer.createEl("h4", { text: t('availableCommands') });
		
		const availableList = availableContainer.createDiv({ cls: "command-list" });
		availableList.style.height = "300px"; // Fixed height instead of maxHeight
		availableList.style.overflowY = "auto";
		availableList.style.border = "1px solid var(--background-modifier-border)";
		availableList.style.borderRadius = "4px";
		availableList.style.padding = "8px";

		const pinnedIds = this.columnPinned[this.currentColumn] || [];
		
		// Filter commands based on search
		const filteredCommands = this.allCommands.filter(cmd => {
			if (pinnedIds.includes(cmd.id)) return false;
			if (!this.searchQuery) return true;
			const query = this.searchQuery.toLowerCase();
			return cmd.name.toLowerCase().includes(query) || 
			       cmd.pluginName.toLowerCase().includes(query);
		});

		if (filteredCommands.length === 0) {
			const emptyMsg = availableList.createDiv({ cls: "empty-message" });
			emptyMsg.textContent = t('noCommandsFound');
			emptyMsg.style.color = "var(--text-muted)";
			emptyMsg.style.padding = "8px";
			emptyMsg.style.textAlign = "center";
		} else {
			filteredCommands.forEach(cmd => {
				const item = availableList.createDiv({ cls: "command-item" });
				item.style.padding = "6px 8px";
				item.style.cursor = "pointer";
				item.style.borderRadius = "4px";
				item.style.marginBottom = "4px";
				
				item.addEventListener("mouseenter", () => {
					item.style.backgroundColor = "var(--background-modifier-hover)";
				});
				item.addEventListener("mouseleave", () => {
					item.style.backgroundColor = "";
				});
				
				const nameEl = item.createDiv({ cls: "command-name" });
				nameEl.textContent = cmd.name;
				nameEl.style.fontWeight = "500";
				nameEl.style.overflow = "hidden";
				nameEl.style.textOverflow = "ellipsis";
				nameEl.style.whiteSpace = "nowrap";
				
				const pluginEl = item.createDiv({ cls: "command-plugin" });
				pluginEl.textContent = cmd.pluginName;
				pluginEl.style.fontSize = "0.85em";
				pluginEl.style.color = "var(--text-muted)";
				pluginEl.style.overflow = "hidden";
				pluginEl.style.textOverflow = "ellipsis";
				pluginEl.style.whiteSpace = "nowrap";
				
				item.addEventListener("click", () => {
					this.pinCommand(cmd.id);
				});
			});
		}
	}

	private pinCommand(commandId: string): void {
		if (!this.columnPinned[this.currentColumn]) {
			this.columnPinned[this.currentColumn] = [];
		}
		if (!this.columnPinned[this.currentColumn].includes(commandId)) {
			this.columnPinned[this.currentColumn].push(commandId);
			const container = this.contentEl.querySelector('.two-column-layout');
			if (container) {
				this.renderPinnedList(container as HTMLElement);
				this.renderAvailableList();
			}
		}
	}

	private unpinCommand(commandId: string): void {
		if (!this.columnPinned[this.currentColumn]) return;
		const index = this.columnPinned[this.currentColumn].indexOf(commandId);
		if (index > -1) {
			this.columnPinned[this.currentColumn].splice(index, 1);
			const container = this.contentEl.querySelector('.two-column-layout');
			if (container) {
				this.renderPinnedList(container as HTMLElement);
				this.renderAvailableList();
			}
		}
	}

	private getPluginDisplayName(pluginId: string): string {
		const nameMap: Record<string, string> = {
			'editor': 'Obsidian',
			'workspace': 'Obsidian',
			'file-explorer': 'Obsidian',
			'global-search': 'Obsidian',
			'switcher': 'Obsidian',
			'graph': 'Obsidian',
			'backlink': 'Obsidian',
			'outgoing-link': 'Obsidian',
			'tag-pane': 'Obsidian',
			'page-preview': 'Obsidian',
			'templates': 'Obsidian',
			'note-composer': 'Obsidian',
			'command-palette': 'Obsidian',
			'markdown-importer': 'Obsidian',
			'word-count': 'Obsidian',
			'open-with-default-app': 'Obsidian',
			'file-recovery': 'Obsidian',
		};

		if (nameMap[pluginId]) {
			return nameMap[pluginId];
		}

		const plugins = (this.plugin.app as any).plugins;
		if (plugins && plugins.manifests && plugins.manifests[pluginId]) {
			return plugins.manifests[pluginId].name;
		}

		return pluginId.split('-').map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
