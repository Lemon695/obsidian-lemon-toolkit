import { App, FuzzySuggestModal, FuzzyMatch, MarkdownView, setIcon } from "obsidian";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/locale";

interface CommandItem {
	id: string;
	name: string;
	callback: () => void;
	isPinned: boolean;
	lastUsed: number;
	useCount: number;
}

export class CommandPaletteModal extends FuzzySuggestModal<CommandItem> {
	private plugin: LemonToolkitPlugin;
	private commands: CommandItem[];

	constructor(plugin: LemonToolkitPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.commands = [];

		this.setPlaceholder(t('placeholderFilterCommands'));
		this.setInstructions([
			{ command: "↑↓", purpose: "to navigate" },
			{ command: "↵", purpose: "to execute" },
			{ command: "esc", purpose: "to dismiss" },
		]);
		
		// Apply multi-column layout
		this.applyColumnLayout();
	}
	
	private applyColumnLayout(): void {
		const columns = this.plugin.settings.commandPaletteColumns;
		const modalEl = this.modalEl;
		
		// Set modal width for multi-column layouts only
		if (columns > 1) {
			const widthMap = {
				2: '1000px',
				3: '1400px'
			};
			modalEl.style.width = widthMap[columns as 2 | 3];
			modalEl.style.maxWidth = '90vw'; // Don't exceed 90% of viewport width
		}
		
		// Add custom CSS for multi-column layout
		const style = modalEl.createEl("style");
		style.textContent = `
			.lemon-command-palette-${columns}-col .prompt-results {
				display: grid;
				grid-template-columns: repeat(${columns}, 1fr);
				gap: 4px;
				padding: 4px;
			}
			.lemon-command-palette-${columns}-col .suggestion-item {
				margin: 0;
			}
			.lemon-command-palette-${columns}-col .suggestion-content {
				padding: 6px 8px;
			}
		`;
		
		modalEl.addClass(`lemon-command-palette-${columns}-col`);
	}

	getItems(): CommandItem[] {
		// Get all registered commands from the plugin
		const allCommands = (this.plugin.app as any).commands.commands;
		this.commands = [];

		// Filter only Lemon Toolkit commands
		Object.keys(allCommands).forEach((commandId) => {
			if (commandId.startsWith("lemon-toolkit:")) {
				const command = allCommands[commandId];
				const history = this.plugin.commandTracker.getPluginCommandStorage().getHistory(commandId) || {
					lastUsed: 0,
					useCount: 0,
				};
				const isPinned = this.plugin.settings.pinnedCommands.includes(commandId);

				this.commands.push({
					id: commandId,
					name: command.name,
					callback: command.callback || command.editorCallback,
					isPinned,
					lastUsed: history.lastUsed,
					useCount: history.useCount,
				});
			}
		});

		// Sort: pinned first, then by configured sort method
		this.commands.sort((a, b) => {
			// Pinned commands always come first
			if (a.isPinned && !b.isPinned) return -1;
			if (!a.isPinned && b.isPinned) return 1;

			const sortBy = this.plugin.settings.commandPaletteSortBy;
			const timeRange = this.plugin.settings.commandPaletteTimeRange;

			if (sortBy === 'frequent') {
				// Use precise time range counting
				const aCount = this.plugin.commandTracker.getPluginCommandStorage().getCountInTimeRange(a.id, timeRange);
				const bCount = this.plugin.commandTracker.getPluginCommandStorage().getCountInTimeRange(b.id, timeRange);
				
				// Sort by use count (descending)
				if (bCount !== aCount) {
					return bCount - aCount;
				}
				
				// If use count is the same, sort by last used
				return b.lastUsed - a.lastUsed;
			} else {
				// Sort by last used (recent)
				return b.lastUsed - a.lastUsed;
			}
		});

		return this.commands;
	}

	getItemText(item: CommandItem): string {
		return item.name;
	}

	renderSuggestion(value: FuzzyMatch<CommandItem>, el: HTMLElement): void {
		const item = value.item;
		const container = el.createDiv({ cls: "lemon-command-item" });
		container.style.display = "flex";
		container.style.alignItems = "center";
		container.style.gap = "8px";

		// Pin icon
		if (item.isPinned) {
			const pinIcon = container.createSpan({ cls: "lemon-pin-icon" });
			setIcon(pinIcon, 'pin');
			pinIcon.style.fontSize = "0.9em";
		}

		// Command name
		const nameSpan = container.createSpan({ cls: "lemon-command-name" });
		nameSpan.textContent = item.name;
		nameSpan.style.flex = "1";

		// Use count (if > 0)
		if (item.useCount > 0) {
			const countSpan = container.createSpan({ cls: "lemon-command-count" });
			countSpan.textContent = `(${item.useCount})`;
			countSpan.style.color = "var(--text-muted)";
			countSpan.style.fontSize = "0.9em";
		}
	}

	async onChooseItem(item: CommandItem): Promise<void> {
		// Execute the command (global listener will track it)
		if (item.callback) {
			// Check if it's an editor callback
			const command = (this.plugin.app as any).commands.commands[item.id];
			if (command.editorCallback) {
				const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (activeView) {
					command.editorCallback(activeView.editor, activeView);
				}
			} else {
				item.callback();
			}
		}
	}
}
