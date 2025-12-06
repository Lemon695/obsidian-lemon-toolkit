import { App, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/locale";

interface GlobalCommandItem {
	id: string;
	name: string;
	pluginName: string;
	callback: () => void;
	isPinned: boolean;
	lastUsed: number;
	useCount: number;
}

export class GlobalCommandPaletteModal extends FuzzySuggestModal<GlobalCommandItem> {
	private plugin: LemonToolkitPlugin;
	private commands: GlobalCommandItem[];

	constructor(plugin: LemonToolkitPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.commands = [];

		this.setPlaceholder(t('placeholderFilterGlobalCommands'));
		this.setInstructions([
			{ command: "↑↓", purpose: "to navigate" },
			{ command: "↵", purpose: "to execute" },
			{ command: "esc", purpose: "to dismiss" },
		]);
		
		// Apply multi-column layout
		this.applyColumnLayout();
	}
	
	private applyColumnLayout(): void {
		const columns = this.plugin.settings.globalCommandPaletteColumns;
		const modalEl = this.modalEl;
		
		// Set modal width for multi-column layouts only
		if (columns > 1) {
			const widthMap = {
				2: '1000px',
				3: '1400px'
			};
			modalEl.style.width = widthMap[columns as 2 | 3];
			modalEl.style.maxWidth = '90vw';
		}
		
		// Add custom CSS for multi-column layout
		const style = modalEl.createEl("style");
		style.textContent = `
			.global-command-palette-${columns}-col .prompt-results {
				display: flex;
				gap: 8px;
				padding: 4px;
				max-height: 500px;
			}
			.global-command-palette-${columns}-col .prompt-results > * {
				flex: 1;
				min-width: 0;
				overflow-y: auto;
				display: flex;
				flex-direction: column;
			}
			.global-command-palette-${columns}-col .suggestion-item {
				margin: 0;
			}
			.global-command-palette-${columns}-col .suggestion-content {
				padding: 6px 8px;
			}
		`;
		
		modalEl.addClass(`global-command-palette-${columns}-col`);
	}
	
	onOpen(): void {
		const columns = this.plugin.settings.globalCommandPaletteColumns;
		
		if (columns === 1) {
			super.onOpen();
		} else {
			const contentEl = this.modalEl.createDiv({ cls: 'modal-content' });
			contentEl.style.padding = '20px';
			contentEl.style.height = '600px';
			contentEl.style.display = 'flex';
			contentEl.style.flexDirection = 'column';
			this.renderMultiColumn(contentEl);
		}
	}
	
	private renderMultiColumn(contentEl: HTMLElement): void {
		contentEl.empty();
		contentEl.style.padding = '10px';
		
		const columns = this.plugin.settings.globalCommandPaletteColumns;
		
		// Search input
		const searchInput = contentEl.createEl('input', {
			type: 'text',
			placeholder: t('searchCommands')
		});
		searchInput.style.width = '100%';
		searchInput.style.padding = '10px';
		searchInput.style.marginBottom = '12px';
		searchInput.style.boxSizing = 'border-box';
		searchInput.style.border = '1px solid var(--background-modifier-border)';
		searchInput.style.borderRadius = '4px';
		searchInput.style.fontSize = '14px';
		
		// Results container
		const resultsContainer = contentEl.createDiv();
		resultsContainer.style.display = 'flex';
		resultsContainer.style.gap = '12px';
		resultsContainer.style.height = '500px';
		
		// Get all commands organized by columns
		const allCommands = this.getItems();
		const commandsPerColumn = allCommands.length / columns;
		
		// Store column data
		const columnData: Array<{
			container: HTMLElement;
			commands: GlobalCommandItem[];
		}> = [];
		
		// Create columns
		for (let col = 0; col < columns; col++) {
			const columnEl = resultsContainer.createDiv();
			columnEl.style.flex = '1';
			columnEl.style.overflowY = 'auto';
			columnEl.style.border = '1px solid var(--background-modifier-border)';
			columnEl.style.borderRadius = '4px';
			columnEl.style.padding = '8px';
			columnEl.style.backgroundColor = 'var(--background-primary)';
			
			if (col > 0) {
				columnEl.style.borderLeft = '2px solid var(--background-modifier-border)';
			}
			
			// Get commands for this column
			const startIdx = col * commandsPerColumn;
			const endIdx = (col + 1) * commandsPerColumn;
			const columnCommands = allCommands.slice(startIdx, endIdx);
			
			columnData.push({
				container: columnEl,
				commands: columnCommands
			});
		}
		
		// Render all columns
		const renderAll = () => {
			const query = searchInput.value.toLowerCase();
			columnData.forEach((data, idx) => {
				this.renderColumn(data.container, data.commands, query, idx + 1);
			});
		};
		
		// Initial render
		renderAll();
		
		// Re-render on search
		searchInput.addEventListener('input', renderAll);
		
		// Focus search input
		searchInput.focus();
	}
	
	private renderColumn(
		container: HTMLElement,
		commands: GlobalCommandItem[],
		query: string,
		columnIndex: number
	): void {
		container.empty();
		
		const filteredCommands = query
			? commands.filter(cmd => 
				cmd.name.toLowerCase().includes(query) ||
				cmd.pluginName.toLowerCase().includes(query)
			)
			: commands;
		
		filteredCommands.forEach((cmd, idx) => {
			
			const item = container.createDiv();
			item.style.padding = '8px';
			item.style.cursor = 'pointer';
			item.style.marginBottom = '4px';
			item.style.borderRadius = '4px';
			item.style.display = 'flex';
			item.style.alignItems = 'center';
			item.style.gap = '8px';
			item.style.transition = 'background-color 0.1s';
			
			// Pin icon
			if (cmd.isPinned) {
				const pinIcon = item.createSpan();
				pinIcon.textContent = '📌';
				pinIcon.style.fontSize = '14px';
				pinIcon.style.flexShrink = '0';
			}
			
			// Command text container
			const textContainer = item.createDiv();
			textContainer.style.flex = '1';
			textContainer.style.minWidth = '0';
			
			// Command name
			const nameEl = textContainer.createDiv();
			nameEl.textContent = cmd.name;
			nameEl.style.overflow = 'hidden';
			nameEl.style.textOverflow = 'ellipsis';
			nameEl.style.whiteSpace = 'nowrap';
			nameEl.style.fontSize = '14px';
			
			// Plugin name
			const pluginEl = textContainer.createDiv();
			pluginEl.textContent = cmd.pluginName;
			pluginEl.style.fontSize = '12px';
			pluginEl.style.color = 'var(--text-muted)';
			pluginEl.style.overflow = 'hidden';
			pluginEl.style.textOverflow = 'ellipsis';
			pluginEl.style.whiteSpace = 'nowrap';
			
			// Use count
			if (cmd.useCount > 0) {
				const countSpan = item.createSpan();
				countSpan.textContent = `${cmd.useCount}`;
				countSpan.style.fontSize = '12px';
				countSpan.style.color = 'var(--text-muted)';
				countSpan.style.flexShrink = '0';
			}
			
			item.addEventListener('mouseenter', () => {
				item.style.backgroundColor = 'var(--background-modifier-hover)';
			});
			item.addEventListener('mouseleave', () => {
				item.style.backgroundColor = '';
			});
			
			item.addEventListener('click', () => {
				if (cmd.callback) {
					cmd.callback();
					this.close();
				}
			});
		});
	}

	getItems(): GlobalCommandItem[] {
		// Get all registered commands
		const allCommands = (this.plugin.app as any).commands.commands;
		const allCommandsList: GlobalCommandItem[] = [];

		// Get all commands from all plugins
		Object.keys(allCommands).forEach((commandId) => {
			const command = allCommands[commandId];
			const history = this.plugin.globalCommandHistoryManager.getHistory(commandId) || {
				lastUsed: 0,
				useCount: 0,
			};

			// Extract plugin name from command ID
			let pluginName = "Obsidian";
			if (commandId.includes(":")) {
				const pluginId = commandId.split(":")[0];
				pluginName = this.getPluginDisplayName(pluginId);
			}

			allCommandsList.push({
				id: commandId,
				name: command.name,
				pluginName,
				callback: command.callback || command.editorCallback,
				isPinned: false, // Will be set per column
				lastUsed: history.lastUsed,
				useCount: history.useCount,
			});
		});

		// If multi-column, organize by column sorts
		const columns = this.plugin.settings.globalCommandPaletteColumns;
		if (columns > 1) {
			this.commands = this.organizeByColumns(allCommandsList, columns);
		} else {
			// Single column: use global sort
			const sortBy = this.plugin.settings.globalCommandPaletteSortBy;
			const pinnedCommands = allCommandsList.filter(cmd => 
				this.plugin.settings.pinnedGlobalCommands.includes(cmd.id)
			).map(cmd => ({ ...cmd, isPinned: true }));
			const unpinnedCommands = allCommandsList.filter(cmd => 
				!this.plugin.settings.pinnedGlobalCommands.includes(cmd.id)
			);
			this.commands = [...pinnedCommands, ...this.sortCommands(unpinnedCommands, sortBy)];
		}

		return this.commands;
	}

	private organizeByColumns(
		allCommandsList: GlobalCommandItem[],
		columns: number
	): GlobalCommandItem[] {
		const columnSorts = this.plugin.settings.globalCommandPaletteColumnSorts;
		const columnPinned = this.plugin.settings.globalCommandPaletteColumnPinned || [[], [], []];
		const result: GlobalCommandItem[] = [];

		// Process each column - each column shows ALL commands
		for (let col = 0; col < columns; col++) {
			const sortType = columnSorts[col] || "recent";
			const pinnedIds = columnPinned[col] || [];
			
			// Get pinned commands for this column (in exact order)
			const pinnedCommands = pinnedIds
				.map(id => allCommandsList.find(cmd => cmd.id === id))
				.filter((cmd): cmd is GlobalCommandItem => cmd !== undefined)
				.map(cmd => ({ ...cmd, isPinned: true }));
			
			// Get unpinned commands (all commands not in this column's pinned list)
			const unpinnedCommands = allCommandsList.filter(cmd => !pinnedIds.includes(cmd.id));
			
			// Sort unpinned commands by THIS column's sort type
			const sortedUnpinned = this.sortCommands([...unpinnedCommands], sortType);
			
			// Add pinned first, then all unpinned (sorted)
			result.push(...pinnedCommands, ...sortedUnpinned);
		}

		return result;
	}

	private sortCommands(commands: GlobalCommandItem[], sortType: string): GlobalCommandItem[] {
		const timeRange = this.plugin.settings.globalCommandPaletteTimeRange;
		const now = Date.now();
		const cutoff = timeRange === 0 ? 0 : now - (timeRange * 60 * 60 * 1000);

		return commands.sort((a, b) => {
			switch (sortType) {
				case 'frequent':
					const aCount = a.lastUsed >= cutoff ? a.useCount : 0;
					const bCount = b.lastUsed >= cutoff ? b.useCount : 0;
					if (bCount !== aCount) return bCount - aCount;
					return b.lastUsed - a.lastUsed;
				
				case 'recent':
					return b.lastUsed - a.lastUsed;
				
				case 'alphabetical':
					return a.name.localeCompare(b.name);
				
				case 'plugin':
					if (a.pluginName !== b.pluginName) {
						return a.pluginName.localeCompare(b.pluginName);
					}
					return a.name.localeCompare(b.name);
				
				default:
					return b.lastUsed - a.lastUsed;
			}
		});
	}

	private getPluginDisplayName(pluginId: string): string {
		// Map common plugin IDs to display names
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

		// Try to get plugin manifest
		const plugins = (this.plugin.app as any).plugins;
		if (plugins && plugins.manifests && plugins.manifests[pluginId]) {
			return plugins.manifests[pluginId].name;
		}

		// Fallback: capitalize plugin ID
		return pluginId.split('-').map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	}

	getItemText(item: GlobalCommandItem): string {
		return `${item.name} [${item.pluginName}]`;
	}

	renderSuggestion(value: FuzzyMatch<GlobalCommandItem>, el: HTMLElement): void {
		const item = value.item;
		const container = el.createDiv({ cls: "global-command-item" });
		container.style.display = "flex";
		container.style.alignItems = "center";
		container.style.gap = "8px";

		// Pin icon
		if (item.isPinned) {
			const pinIcon = container.createSpan({ cls: "global-pin-icon" });
			pinIcon.textContent = "📌";
			pinIcon.style.fontSize = "0.9em";
		}

		// Command name and plugin
		const textContainer = container.createDiv({ cls: "global-command-text" });
		textContainer.style.flex = "1";
		textContainer.style.minWidth = "0";

		const nameSpan = textContainer.createDiv({ cls: "global-command-name" });
		nameSpan.textContent = item.name;
		nameSpan.style.overflow = "hidden";
		nameSpan.style.textOverflow = "ellipsis";
		nameSpan.style.whiteSpace = "nowrap";

		const pluginSpan = textContainer.createDiv({ cls: "global-command-plugin" });
		pluginSpan.textContent = item.pluginName;
		pluginSpan.style.fontSize = "0.85em";
		pluginSpan.style.color = "var(--text-muted)";
		pluginSpan.style.overflow = "hidden";
		pluginSpan.style.textOverflow = "ellipsis";
		pluginSpan.style.whiteSpace = "nowrap";

		// Use count
		if (item.useCount > 0) {
			const countSpan = container.createSpan({ cls: "global-command-count" });
			countSpan.textContent = `(${item.useCount})`;
			countSpan.style.color = "var(--text-muted)";
			countSpan.style.fontSize = "0.9em";
			countSpan.style.flexShrink = "0";
		}
	}

	onChooseItem(item: GlobalCommandItem): void {
		if (item.callback) {
			item.callback();
		}
	}
}
