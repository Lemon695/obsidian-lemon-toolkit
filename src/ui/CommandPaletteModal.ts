import { App, FuzzySuggestModal, FuzzyMatch, MarkdownView } from "obsidian";
import LemonToolkitPlugin from "../main";

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

		this.setPlaceholder("Type to filter Lemon Toolkit commands...");
		this.setInstructions([
			{ command: "↑↓", purpose: "to navigate" },
			{ command: "↵", purpose: "to execute" },
			{ command: "esc", purpose: "to dismiss" },
		]);
	}

	getItems(): CommandItem[] {
		// Get all registered commands from the plugin
		const allCommands = (this.plugin.app as any).commands.commands;
		this.commands = [];

		// Filter only Lemon Toolkit commands
		Object.keys(allCommands).forEach((commandId) => {
			if (commandId.startsWith("lemon-toolkit:")) {
				const command = allCommands[commandId];
				const history = this.plugin.settings.commandHistory[commandId] || {
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

		// Sort: pinned first, then by last used
		this.commands.sort((a, b) => {
			// Pinned commands always come first
			if (a.isPinned && !b.isPinned) return -1;
			if (!a.isPinned && b.isPinned) return 1;

			// Among pinned or unpinned, sort by last used
			return b.lastUsed - a.lastUsed;
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
			pinIcon.textContent = "📌";
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
		// Record command usage
		await this.plugin.recordCommandUsage(item.id);

		// Execute the command
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
