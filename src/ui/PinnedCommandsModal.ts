import { App, Modal } from "obsidian";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/locale";

interface CommandInfo {
	id: string;
	name: string;
	isPinned: boolean;
}

export class PinnedCommandsModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private commands: CommandInfo[];
	private pinnedCommands: string[];
	private pinnedListContainer: HTMLElement;

	constructor(app: App, plugin: LemonToolkitPlugin) {
		super(app);
		this.plugin = plugin;
		this.commands = [];
		this.pinnedCommands = [...this.plugin.settings.pinnedCommands];
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: t('managePinnedCommands') });

		const description = contentEl.createDiv({ cls: "lemon-pinned-desc" });
		description.style.marginTop = "8px";
		description.style.marginBottom = "16px";
		description.style.color = "var(--text-muted)";
		description.innerHTML = t('pinnedCommandsModalDesc');

		// Get all Lemon Toolkit commands
		this.loadCommands();

		// Create two sections: pinned and available
		const sectionsContainer = contentEl.createDiv({ cls: "lemon-sections-container" });
		sectionsContainer.style.display = "flex";
		sectionsContainer.style.gap = "16px";
		sectionsContainer.style.marginTop = "16px";

		// Pinned commands section
		const pinnedSection = sectionsContainer.createDiv({ cls: "lemon-pinned-section" });
		pinnedSection.style.flex = "1";

		const pinnedTitle = pinnedSection.createEl("h3", { text: t('pinnedCommands') });
		pinnedTitle.style.fontSize = "1em";
		pinnedTitle.style.marginBottom = "8px";

		this.pinnedListContainer = pinnedSection.createDiv({ cls: "lemon-pinned-list" });
		this.pinnedListContainer.style.minHeight = "200px";
		this.pinnedListContainer.style.maxHeight = "400px";
		this.pinnedListContainer.style.overflowY = "auto";
		this.pinnedListContainer.style.border = "1px solid var(--background-modifier-border)";
		this.pinnedListContainer.style.borderRadius = "4px";
		this.pinnedListContainer.style.padding = "8px";

		// Available commands section
		const availableSection = sectionsContainer.createDiv({ cls: "lemon-available-section" });
		availableSection.style.flex = "1";

		const availableTitle = availableSection.createEl("h3", { text: t('availableCommands') });
		availableTitle.style.fontSize = "1em";
		availableTitle.style.marginBottom = "8px";

		const availableListContainer = availableSection.createDiv({ cls: "lemon-available-list" });
		availableListContainer.style.minHeight = "200px";
		availableListContainer.style.maxHeight = "400px";
		availableListContainer.style.overflowY = "auto";
		availableListContainer.style.border = "1px solid var(--background-modifier-border)";
		availableListContainer.style.borderRadius = "4px";
		availableListContainer.style.padding = "8px";

		// Render both lists
		this.renderPinnedList();
		this.renderAvailableList(availableListContainer);

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: "lemon-button-container" });
		buttonContainer.style.marginTop = "16px";
		buttonContainer.style.display = "flex";
		buttonContainer.style.justifyContent = "flex-end";
		buttonContainer.style.gap = "8px";

		const cancelButton = buttonContainer.createEl("button", { text: t('cancel') });
		cancelButton.addEventListener("click", () => this.close());

		const saveButton = buttonContainer.createEl("button", {
			text: t('save'),
			cls: "mod-cta",
		});
		saveButton.addEventListener("click", () => this.savePinnedCommands());
	}

	private loadCommands(): void {
		const allCommands = (this.plugin.app as any).commands.commands;

		Object.keys(allCommands).forEach((commandId) => {
			if (commandId.startsWith("lemon-toolkit:")) {
				const command = allCommands[commandId];
				this.commands.push({
					id: commandId,
					name: command.name,
					isPinned: this.pinnedCommands.includes(commandId),
				});
			}
		});

		// Sort alphabetically
		this.commands.sort((a, b) => a.name.localeCompare(b.name));
	}

	private renderPinnedList(): void {
		this.pinnedListContainer.empty();

		if (this.pinnedCommands.length === 0) {
			const emptyMsg = this.pinnedListContainer.createDiv();
			emptyMsg.style.padding = "16px";
			emptyMsg.style.textAlign = "center";
			emptyMsg.style.color = "var(--text-muted)";
			emptyMsg.textContent = t('noPinnedCommands');
			return;
		}

		this.pinnedCommands.forEach((commandId, index) => {
			const command = this.commands.find((c) => c.id === commandId);
			if (!command) return;

			const item = this.pinnedListContainer.createDiv({ cls: "lemon-pinned-item" });
			item.style.padding = "8px 12px";
			item.style.marginBottom = "4px";
			item.style.backgroundColor = "var(--background-secondary)";
			item.style.borderRadius = "4px";
			item.style.cursor = "move";
			item.style.display = "flex";
			item.style.alignItems = "center";
			item.style.gap = "8px";
			item.draggable = true;

			// Drag handle
			const dragHandle = item.createSpan({ cls: "lemon-drag-handle" });
			dragHandle.textContent = t('dragHandle');
			dragHandle.style.color = "var(--text-muted)";
			dragHandle.style.cursor = "move";

			// Command name
			const nameSpan = item.createSpan();
			nameSpan.textContent = command.name;
			nameSpan.style.flex = "1";

			// Remove button
			const removeBtn = item.createEl("button", { text: t('removeCommand') });
			removeBtn.style.background = "none";
			removeBtn.style.border = "none";
			removeBtn.style.color = "var(--text-muted)";
			removeBtn.style.cursor = "pointer";
			removeBtn.style.fontSize = "1.5em";
			removeBtn.style.padding = "0 4px";
			removeBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this.unpinCommand(commandId);
			});

			// Drag events
			item.addEventListener("dragstart", (e) => {
				e.dataTransfer?.setData("text/plain", index.toString());
				item.style.opacity = "0.5";
			});

			item.addEventListener("dragend", () => {
				item.style.opacity = "1";
			});

			item.addEventListener("dragover", (e) => {
				e.preventDefault();
				item.style.borderTop = "2px solid var(--interactive-accent)";
			});

			item.addEventListener("dragleave", () => {
				item.style.borderTop = "";
			});

			item.addEventListener("drop", (e) => {
				e.preventDefault();
				item.style.borderTop = "";
				const fromIndex = parseInt(e.dataTransfer?.getData("text/plain") || "");
				if (!isNaN(fromIndex) && fromIndex !== index) {
					this.reorderPinnedCommands(fromIndex, index);
				}
			});
		});
	}

	private renderAvailableList(container: HTMLElement): void {
		const availableCommands = this.commands.filter(
			(cmd) => !this.pinnedCommands.includes(cmd.id)
		);

		if (availableCommands.length === 0) {
			const emptyMsg = container.createDiv();
			emptyMsg.style.padding = "16px";
			emptyMsg.style.textAlign = "center";
			emptyMsg.style.color = "var(--text-muted)";
			emptyMsg.textContent = t('allCommandsPinned');
			return;
		}

		availableCommands.forEach((command) => {
			const item = container.createDiv({ cls: "lemon-available-item" });
			item.style.padding = "8px 12px";
			item.style.marginBottom = "4px";
			item.style.backgroundColor = "var(--background-secondary)";
			item.style.borderRadius = "4px";
			item.style.cursor = "pointer";
			item.style.display = "flex";
			item.style.alignItems = "center";
			item.style.gap = "8px";

			const nameSpan = item.createSpan();
			nameSpan.textContent = command.name;
			nameSpan.style.flex = "1";

			const addBtn = item.createEl("button", { text: t('addCommand') });
			addBtn.style.background = "none";
			addBtn.style.border = "none";
			addBtn.style.color = "var(--text-muted)";
			addBtn.style.cursor = "pointer";
			addBtn.style.fontSize = "1.2em";
			addBtn.style.padding = "0 4px";

			const pinCommand = () => {
				this.pinCommand(command.id);
			};

			addBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				pinCommand();
			});

			item.addEventListener("click", pinCommand);
		});
	}

	private pinCommand(commandId: string): void {
		if (!this.pinnedCommands.includes(commandId)) {
			this.pinnedCommands.push(commandId);
			this.onOpen(); // Re-render
		}
	}

	private unpinCommand(commandId: string): void {
		const index = this.pinnedCommands.indexOf(commandId);
		if (index > -1) {
			this.pinnedCommands.splice(index, 1);
			this.onOpen(); // Re-render
		}
	}

	private reorderPinnedCommands(fromIndex: number, toIndex: number): void {
		const [movedItem] = this.pinnedCommands.splice(fromIndex, 1);
		this.pinnedCommands.splice(toIndex, 0, movedItem);
		this.renderPinnedList();
	}

	private async savePinnedCommands(): Promise<void> {
		this.plugin.settings.pinnedCommands = this.pinnedCommands;
		await this.plugin.saveSettings();
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
