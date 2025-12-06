import { App, Modal, TFile } from "obsidian";
import { t } from "../i18n/locale";
import { RenameSuggestion } from "../features/rename/RenameHistoryManager";

export class RenameFileModal extends Modal {
	private file: TFile;
	private suggestions: RenameSuggestion[];
	private onSubmit: (newName: string) => void;
	private inputEl: HTMLInputElement;

	constructor(app: App, file: TFile, suggestions: RenameSuggestion[], onSubmit: (newName: string) => void) {
		super(app);
		this.file = file;
		this.suggestions = suggestions;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('rename-file-modal');

		contentEl.createEl("h2", { text: t('renameFile') });

		// Input section
		const inputContainer = contentEl.createDiv();
		
		const label = inputContainer.createEl("label", { text: t('newFileName') });
		label.style.display = "block";
		label.style.marginBottom = "8px";

		this.inputEl = inputContainer.createEl("input", {
			type: "text",
			value: this.file.basename,
		});
		this.inputEl.style.width = "100%";
		this.inputEl.style.padding = "8px";
		this.inputEl.style.marginBottom = "16px";
		this.inputEl.style.boxSizing = "border-box";

		this.inputEl.select();
		this.inputEl.focus();

		// Suggestions section
		if (this.suggestions.length > 0) {
			const suggestionsLabel = contentEl.createEl("div", { text: t('suggestions') });
			suggestionsLabel.style.marginBottom = "8px";
			suggestionsLabel.style.fontWeight = "500";

			const suggestionsContainer = contentEl.createDiv({ cls: 'rename-suggestions' });
			suggestionsContainer.style.maxHeight = "200px";
			suggestionsContainer.style.overflowY = "auto";
			suggestionsContainer.style.marginBottom = "16px";
			suggestionsContainer.style.border = "1px solid var(--background-modifier-border)";
			suggestionsContainer.style.borderRadius = "4px";

			this.suggestions.forEach(suggestion => {
				const item = suggestionsContainer.createDiv({ cls: 'suggestion-item' });
				item.style.padding = "8px 12px";
				item.style.cursor = "pointer";
				item.style.display = "flex";
				item.style.justifyContent = "space-between";
				item.style.alignItems = "center";

				item.addEventListener('mouseenter', () => {
					item.style.backgroundColor = "var(--background-modifier-hover)";
				});
				item.addEventListener('mouseleave', () => {
					item.style.backgroundColor = "";
				});

				const leftPart = item.createDiv();
				leftPart.style.display = "flex";
				leftPart.style.alignItems = "center";
				leftPart.style.gap = "8px";

				leftPart.createSpan({ text: suggestion.icon });
				leftPart.createSpan({ text: suggestion.label });

				if (suggestion.type === 'smart' && suggestion.score > 0) {
					const badge = item.createSpan({ 
						text: `${Math.round(suggestion.score)}×`,
						cls: 'suggestion-badge'
					});
					badge.style.fontSize = "0.85em";
					badge.style.color = "var(--text-muted)";
					badge.style.backgroundColor = "var(--background-modifier-border)";
					badge.style.padding = "2px 6px";
					badge.style.borderRadius = "3px";
				}

				item.addEventListener('click', () => {
					this.inputEl.value = suggestion.value;
					this.inputEl.focus();
				});
			});
		}

		// Button container
		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.display = "flex";
		buttonContainer.style.justifyContent = "flex-end";
		buttonContainer.style.gap = "8px";

		const cancelButton = buttonContainer.createEl("button", { text: t('cancel') });
		cancelButton.addEventListener("click", () => this.close());

		const submitButton = buttonContainer.createEl("button", { 
			text: t('rename'),
			cls: "mod-cta"
		});

		const submit = () => {
			const newName = this.inputEl.value.trim();
			if (newName && newName !== this.file.basename) {
				this.onSubmit(newName);
				this.close();
			} else {
				this.close();
			}
		};

		submitButton.addEventListener("click", submit);
		this.inputEl.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				submit();
			} else if (e.key === "Escape") {
				this.close();
			}
		});
	}
}

