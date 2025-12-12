import { App, FuzzySuggestModal, FuzzyMatch, setIcon } from "obsidian";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/legacy";

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
		const config = this.plugin.globalCommandPaletteConfigManager.getConfig();
		const columns = config.columns;
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
		const config = this.plugin.globalCommandPaletteConfigManager.getConfig();
		const columns = config.columns;
		
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
		
		const config = this.plugin.globalCommandPaletteConfigManager.getConfig();
		const columns = config.columns;
		
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
		
		// Show loading indicator
		const loadingEl = resultsContainer.createDiv();
		loadingEl.textContent = 'Loading commands...';
		loadingEl.style.padding = '20px';
		loadingEl.style.textAlign = 'center';
		loadingEl.style.color = 'var(--text-muted)';
		
		// Defer heavy work to next frame
		setTimeout(() => {
			loadingEl.remove();
			this.loadAndRenderColumns(resultsContainer, searchInput, columns);
		}, 0);
		
		// Focus search input
		searchInput.focus();
	}
	
	private loadAndRenderColumns(
		resultsContainer: HTMLElement,
		searchInput: HTMLInputElement,
		columns: number
	): void {
		// Get all commands organized by columns
		const allCommands = this.getItems();
		const commandsPerColumn = Math.ceil(allCommands.length / columns);
		
		// Get column configurations
		const config = this.plugin.globalCommandPaletteConfigManager.getConfig();
		let columnSorts: string[];
		let columnPinned: string[][];
		
		if (columns === 1) {
			columnSorts = [config.singleColumn.sortBy];
			columnPinned = [config.singleColumn.pinnedCommands];
		} else if (columns === 2) {
			columnSorts = config.twoColumns.columnSorts;
			columnPinned = config.twoColumns.columnPinned;
		} else {
			columnSorts = config.threeColumns.columnSorts;
			columnPinned = config.threeColumns.columnPinned;
		}
		
		// Store column data
		const columnData: Array<{
			container: HTMLElement;
			commands: GlobalCommandItem[];
		}> = [];
		
		// Create columns
		for (let col = 0; col < columns; col++) {
			const columnWrapper = resultsContainer.createDiv();
			columnWrapper.style.flex = '1';
			columnWrapper.style.display = 'flex';
			columnWrapper.style.flexDirection = 'column';
			columnWrapper.style.minWidth = '0';
			
			// Column header
			const header = columnWrapper.createDiv();
			header.style.padding = '8px 12px';
			header.style.borderBottom = '1px solid var(--background-modifier-border)';
			header.style.backgroundColor = 'var(--background-secondary)';
			header.style.fontWeight = '500';
			header.style.fontSize = '13px';
			header.style.display = 'flex';
			header.style.justifyContent = 'space-between';
			header.style.alignItems = 'center';
			
			// Sort type label
			const sortLabel = this.getSortLabel(columnSorts[col]);
			const pinnedCount = columnPinned[col]?.length || 0;
			
			const titleSpan = header.createSpan();
			titleSpan.textContent = `${t('columnTab', { column: (col + 1).toString() })}: ${sortLabel}`;
			
			if (pinnedCount > 0) {
				const pinnedSpan = header.createSpan();
				pinnedSpan.style.fontSize = '12px';
				pinnedSpan.style.color = 'var(--text-muted)';
				pinnedSpan.style.display = 'flex';
				pinnedSpan.style.alignItems = 'center';
				pinnedSpan.style.gap = '4px';
				
				const pinIcon = pinnedSpan.createSpan();
				setIcon(pinIcon, 'pin');
				pinIcon.style.width = '14px';
				pinIcon.style.height = '14px';
				
				const countText = pinnedSpan.createSpan();
				countText.textContent = pinnedCount.toString();
			}
			
			// Column content
			const columnEl = columnWrapper.createDiv();
			columnEl.style.flex = '1';
			columnEl.style.overflowY = 'auto';
			columnEl.style.padding = '8px';
			
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
		
		// Virtual scrolling: only render visible items + buffer
		const ITEM_HEIGHT = 60; // Approximate height per item
		const INITIAL_BATCH = 30; // Render first 30 items immediately
		const BATCH_SIZE = 20; // Load 20 more when scrolling
		
		let renderedCount = 0;
		
		// Render initial batch
		const renderBatch = (startIdx: number, endIdx: number) => {
			for (let i = startIdx; i < Math.min(endIdx, filteredCommands.length); i++) {
				const cmd = filteredCommands[i];
				this.renderCommandItem(container, cmd);
			}
		};
		
		// Render first batch immediately
		renderBatch(0, INITIAL_BATCH);
		renderedCount = INITIAL_BATCH;
		
		// Lazy load remaining items on scroll
		if (filteredCommands.length > INITIAL_BATCH) {
			const loadMore = () => {
				if (renderedCount >= filteredCommands.length) return;
				
				const scrollTop = container.scrollTop;
				const scrollHeight = container.scrollHeight;
				const clientHeight = container.clientHeight;
				
				// Load more when scrolled 70% down
				if (scrollTop + clientHeight > scrollHeight * 0.7) {
					const nextBatch = Math.min(renderedCount + BATCH_SIZE, filteredCommands.length);
					renderBatch(renderedCount, nextBatch);
					renderedCount = nextBatch;
				}
			};
			
			container.addEventListener('scroll', loadMore);
		}
	}
	
	private renderCommandItem(container: HTMLElement, cmd: GlobalCommandItem): void {
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
			pinIcon.style.flexShrink = '0';
			pinIcon.style.display = 'flex';
			pinIcon.style.alignItems = 'center';
			setIcon(pinIcon, 'pin');
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
			countSpan.textContent = `(${cmd.useCount})`;
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
		
		item.addEventListener('click', async () => {
			try {
				// Execute the command (global listener will track it)
				if (cmd.callback) {
					await cmd.callback();
				}
				this.close();
			} catch (e) {
				console.error('Error executing command:', e);
			}
		});
	}

	getItems(): GlobalCommandItem[] {
		// Get cached commands for fast loading
		const cachedCommands = this.plugin.globalCommandCacheManager.getCommands();
		const allCommandsList: GlobalCommandItem[] = [];

		// Get actual command objects for callbacks
		const allCommands = (this.plugin.app as any).commands.commands;

		// Use cached data if available
		if (cachedCommands.length > 0) {
			cachedCommands.forEach((cachedCmd) => {
				const command = allCommands[cachedCmd.id];
				if (!command) return; // Command no longer exists

				const history = this.plugin.commandTracker.getGlobalCommandStorage().getHistory(cachedCmd.id) || {
					lastUsed: 0,
					useCount: 0,
				};

				// Use Obsidian's native command execution
				const executeCommand = () => {
					(this.plugin.app as any).commands.executeCommandById(cachedCmd.id);
				};

				allCommandsList.push({
					id: cachedCmd.id,
					name: cachedCmd.name,
					pluginName: cachedCmd.pluginName,
					callback: executeCommand,
					isPinned: false, // Will be set per column
					lastUsed: history.lastUsed,
					useCount: history.useCount,
				});
			});
		} else {
			// Fallback: if cache is empty, load synchronously (first time only)
			Object.keys(allCommands).forEach((commandId) => {
				const command = allCommands[commandId];
				const history = this.plugin.commandTracker.getGlobalCommandStorage().getHistory(commandId) || {
					lastUsed: 0,
					useCount: 0,
				};

				let pluginName = "Obsidian";
				if (commandId.includes(":")) {
					const pluginId = commandId.split(":")[0];
					pluginName = this.getPluginDisplayName(pluginId);
				}

				// Use Obsidian's native command execution
				const executeCommand = () => {
					(this.plugin.app as any).commands.executeCommandById(commandId);
				};

				allCommandsList.push({
					id: commandId,
					name: command.name,
					pluginName,
					callback: executeCommand,
					isPinned: false,
					lastUsed: history.lastUsed,
					useCount: history.useCount,
				});
			});
		}

		// If multi-column, organize by column sorts
		const config = this.plugin.globalCommandPaletteConfigManager.getConfig();
		const columns = config.columns;
		if (columns === 1) {
			// Single column: use 1-column config
			const singleConfig = config.singleColumn;
			const pinnedCommands = allCommandsList.filter(cmd => 
				singleConfig.pinnedCommands.includes(cmd.id)
			).map(cmd => ({ ...cmd, isPinned: true }));
			const unpinnedCommands = allCommandsList.filter(cmd => 
				!singleConfig.pinnedCommands.includes(cmd.id)
			);
			this.commands = [...pinnedCommands, ...this.sortCommands(unpinnedCommands, singleConfig.sortBy)];
		} else if (columns === 2) {
			// 2 columns: use 2-column config
			this.commands = this.organizeByColumns(allCommandsList, 2, 
				config.twoColumns.columnSorts,
				config.twoColumns.columnPinned
			);
		} else {
			// 3 columns: use 3-column config
			this.commands = this.organizeByColumns(allCommandsList, 3,
				config.threeColumns.columnSorts,
				config.threeColumns.columnPinned
			);
		}

		return this.commands;
	}

	private getSortLabel(sortType: string): string {
		switch (sortType) {
			case 'recent':
				return t('sortByRecent');
			case 'frequent':
				return t('sortByFrequent');
			case 'alphabetical':
				return t('sortByAlphabetical');
			case 'plugin':
				return t('sortByPlugin');
			default:
				return sortType;
		}
	}

	private organizeByColumns(
		allCommandsList: GlobalCommandItem[],
		columns: number,
		columnSorts: Array<"recent" | "frequent" | "alphabetical" | "plugin">,
		columnPinned: Array<string[]>
	): GlobalCommandItem[] {
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

	private sortCommands(commands: GlobalCommandItem[], sortType: string, timeRange: number = 720): GlobalCommandItem[] {
		return commands.sort((a, b) => {
			switch (sortType) {
				case 'frequent':
					// Use precise time range counting
					const aCount = this.plugin.commandTracker.getGlobalCommandStorage().getCountInTimeRange(a.id, timeRange);
					const bCount = this.plugin.commandTracker.getGlobalCommandStorage().getCountInTimeRange(b.id, timeRange);
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
			setIcon(pinIcon, 'pin');
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

	async onChooseItem(item: GlobalCommandItem): Promise<void> {
		try {
			// Execute the command (global listener will track it)
			if (item.callback) {
				item.callback();
			}
		} catch (e) {
			console.error('Error executing command:', e);
		}
	}
}
