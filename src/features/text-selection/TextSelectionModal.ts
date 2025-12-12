import { App, Editor, FuzzySuggestModal, Notice, TFile } from "obsidian";
import LemonToolkitPlugin from "../../main";
import { t } from "../../i18n/legacy";

interface TextAction {
	id: string;
	name: string;
	icon: string;
	action: (text: string, editor: Editor) => Promise<void>;
}

export class TextSelectionModal extends FuzzySuggestModal<TextAction> {
	private plugin: LemonToolkitPlugin;
	private editor: Editor;
	private selectedText: string;

	constructor(plugin: LemonToolkitPlugin, editor: Editor, selectedText: string) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
		this.selectedText = selectedText;

		this.setPlaceholder(t('placeholderChooseActionForText'));
		this.setInstructions([
			{ command: "↑↓", purpose: "to navigate" },
			{ command: "↵", purpose: "to select" },
			{ command: "esc", purpose: "to dismiss" },
		]);
	}

	getItems(): TextAction[] {
		return [
			{
				id: "create-note",
				name: "Create new note",
				icon: "📝",
				action: async (text, editor) => {
					await this.createNoteFromText(text, editor);
				},
			},
			{
				id: "search-global",
				name: "Search globally",
				icon: "🔍",
				action: async (text) => {
					this.searchGlobally(text);
				},
			},
			{
				id: "wrap-link",
				name: "Wrap as [[link]]",
				icon: "🔗",
				action: async (text, editor) => {
					this.wrapAsLink(text, editor);
				},
			},
			{
				id: "wrap-callout",
				name: "Wrap as callout",
				icon: "💡",
				action: async (text, editor) => {
					await this.wrapAsCallout(text, editor);
				},
			},
			{
				id: "add-tag",
				name: "Add as tag",
				icon: "🏷️",
				action: async (text, editor) => {
					this.addAsTag(text, editor);
				},
			},
			{
				id: "copy-quote",
				name: "Copy as quote",
				icon: "💬",
				action: async (text) => {
					this.copyAsQuote(text);
				},
			},
			{
				id: "send-to-file",
				name: "Send to file",
				icon: "📤",
				action: async (text) => {
					await this.sendToFile(text);
				},
			},
		];
	}

	getItemText(item: TextAction): string {
		return item.name;
	}

	renderSuggestion(item: { item: TextAction }, el: HTMLElement): void {
		const container = el.createDiv({ cls: "lemon-text-action-item" });
		container.style.display = "flex";
		container.style.alignItems = "center";
		container.style.gap = "8px";

		const icon = container.createSpan({ text: item.item.icon });
		icon.style.fontSize = "1.2em";

		const name = container.createSpan({ text: item.item.name });
		name.style.flex = "1";
	}

	async onChooseItem(item: TextAction): Promise<void> {
		await item.action(this.selectedText, this.editor);
	}

	// Action implementations

	private async createNoteFromText(text: string, editor: Editor): Promise<void> {
		try {
			// Sanitize filename
			const filename = this.sanitizeFilename(text);
			const filepath = `${filename}.md`;

			// Check if file already exists
			let file = this.app.vault.getAbstractFileByPath(filepath);
			
			if (!file) {
				// Create new file
				file = await this.app.vault.create(filepath, `# ${text}\n\n`);
			}

			if (file instanceof TFile) {
				// Replace selected text with link
				editor.replaceSelection(`[[${filename}]]`);

				// Open the new note
				await this.app.workspace.getLeaf("tab").openFile(file);

				new Notice(t('createdNoteWithName', { name: filename }));
			}
		} catch (error) {
			new Notice(t('failedToCreateNote', { error: error.message }));
			console.error("Create note error:", error);
		}
	}

	private searchGlobally(text: string): void {
		// Escape special regex characters
		const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		
		// @ts-ignore - openGlobalSearch is available
		this.app.internalPlugins.getPluginById("global-search")?.instance.openGlobalSearch(escapedText);
	}

	private wrapAsLink(text: string, editor: Editor): void {
		// Check if already wrapped
		const selection = editor.getSelection();
		if (selection.startsWith("[[") && selection.endsWith("]]")) {
			// Remove link syntax
			const unwrapped = selection.slice(2, -2);
			editor.replaceSelection(unwrapped);
			new Notice(t('removedLinkSyntax'));
		} else {
			// Add link syntax
			editor.replaceSelection(`[[${text}]]`);
			new Notice(t('wrappedAsLink'));
		}
	}

	private async wrapAsCallout(text: string, editor: Editor): Promise<void> {
		// Show callout type selector
		const calloutTypes = [
			{ type: "note", name: "Note", icon: "📝" },
			{ type: "tip", name: "Tip", icon: "💡" },
			{ type: "warning", name: "Warning", icon: "⚠️" },
			{ type: "danger", name: "Danger", icon: "🚨" },
			{ type: "info", name: "Info", icon: "ℹ️" },
			{ type: "success", name: "Success", icon: "✅" },
			{ type: "question", name: "Question", icon: "❓" },
			{ type: "quote", name: "Quote", icon: "💬" },
		];

		const modal = new CalloutTypeModal(this.app, calloutTypes, (calloutType) => {
			const lines = text.split("\n");
			const calloutText = [
				`> [!${calloutType}]`,
				...lines.map((line) => `> ${line}`),
			].join("\n");

			editor.replaceSelection(calloutText);
			new Notice(t('wrappedAsCallout', { type: calloutType }));
		});

		modal.open();
	}

	private addAsTag(text: string, editor: Editor): void {
		// Sanitize tag
		let tag = text.trim();
		
		// Replace spaces with hyphens
		tag = tag.replace(/\s+/g, "-");
		
		// Remove invalid characters
		tag = tag.replace(/[^\w\-\/]/g, "");
		
		// Add # if not present
		if (!tag.startsWith("#")) {
			tag = `#${tag}`;
		}

		editor.replaceSelection(tag);
		new Notice(t('addedAsTag'));
	}

	private copyAsQuote(text: string): void {
		const lines = text.split("\n");
		const quotedText = lines.map((line) => `> ${line}`).join("\n");

		navigator.clipboard.writeText(quotedText);
		new Notice(t('copiedAsQuote'));
	}

	private async sendToFile(text: string): Promise<void> {
		const modal = new FilePickerModal(this.app, async (file) => {
			try {
				const content = await this.app.vault.read(file);
				const newContent = content + "\n\n" + text;
				await this.app.vault.modify(file, newContent);
				new Notice(t('sentToFile', { name: file.basename }));
			} catch (error) {
				new Notice(t('failedToSendToFile', { error: error.message }));
				console.error("Send to file error:", error);
			}
		});

		modal.open();
	}

	private sanitizeFilename(text: string): string {
		// Remove or replace invalid filename characters
		return text
			.replace(/[\\/:*?"<>|]/g, "-")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 100); // Limit length
	}
}

// Callout Type Selector Modal
class CalloutTypeModal extends FuzzySuggestModal<{ type: string; name: string; icon: string }> {
	private calloutTypes: { type: string; name: string; icon: string }[];
	private onSelect: (type: string) => void;

	constructor(
		app: App,
		calloutTypes: { type: string; name: string; icon: string }[],
		onSelect: (type: string) => void
	) {
		super(app);
		this.calloutTypes = calloutTypes;
		this.onSelect = onSelect;
		this.setPlaceholder(t('placeholderChooseCalloutType'));
	}

	getItems() {
		return this.calloutTypes;
	}

	getItemText(item: { type: string; name: string; icon: string }): string {
		return item.name;
	}

	renderSuggestion(
		item: { item: { type: string; name: string; icon: string } },
		el: HTMLElement
	): void {
		const container = el.createDiv();
		container.style.display = "flex";
		container.style.alignItems = "center";
		container.style.gap = "8px";

		const icon = container.createSpan({ text: item.item.icon });
		const name = container.createSpan({ text: item.item.name });
	}

	onChooseItem(item: { type: string; name: string; icon: string }): void {
		this.onSelect(item.type);
	}
}

// File Picker Modal
class FilePickerModal extends FuzzySuggestModal<TFile> {
	private onSelect: (file: TFile) => void;

	constructor(app: App, onSelect: (file: TFile) => void) {
		super(app);
		this.onSelect = onSelect;
		this.setPlaceholder(t('placeholderChooseFileToSend'));
	}

	getItems(): TFile[] {
		return this.app.vault.getMarkdownFiles();
	}

	getItemText(item: TFile): string {
		return item.path;
	}

	onChooseItem(item: TFile): void {
		this.onSelect(item);
	}
}
