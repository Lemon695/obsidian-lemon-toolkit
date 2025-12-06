import { App, Modal, TFile } from "obsidian";
import { t } from "../i18n/locale";
import { RenameSuggestion } from "../features/rename/RenameHistoryManager";

export class RenameFileModal extends Modal {
	private file: TFile;
	private suggestions: RenameSuggestion[];
	private onSubmit: (newName: string, patternKey?: string) => void;
	private onReject?: (patternKey: string) => void;
	private inputEl: HTMLInputElement;
	private selectedPatternKey?: string;

	constructor(
		app: App, 
		file: TFile, 
		suggestions: RenameSuggestion[], 
		onSubmit: (newName: string, patternKey?: string) => void,
		onReject?: (patternKey: string) => void
	) {
		super(app);
		this.file = file;
		this.suggestions = suggestions;
		this.onSubmit = onSubmit;
		this.onReject = onReject;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('rename-file-modal');

		contentEl.createEl("h2", { text: t('renameFile') });

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

		if (this.suggestions.length > 0) {
			const suggestionsLabel = contentEl.createEl("div", { text: t('suggestions') });
			suggestionsLabel.style.marginBottom = "8px";
			suggestionsLabel.style.fontWeight = "500";

			const suggestionsContainer = contentEl.createDiv({ cls: 'rename-suggestions' });
			suggestionsContainer.style.maxHeight = "300px";
			suggestionsContainer.style.overflowY = "auto";
			suggestionsContainer.style.marginBottom = "16px";
			suggestionsContainer.style.border = "1px solid var(--background-modifier-border)";
			suggestionsContainer.style.borderRadius = "4px";

			this.suggestions.forEach(suggestion => {
				const item = suggestionsContainer.createDiv({ cls: 'suggestion-item' });
				item.style.padding = "10px 12px";
				item.style.cursor = "pointer";
				item.style.borderBottom = "1px solid var(--background-modifier-border)";

				item.addEventListener('mouseenter', () => {
					item.style.backgroundColor = "var(--background-modifier-hover)";
				});
				item.addEventListener('mouseleave', () => {
					item.style.backgroundColor = "";
				});

				const mainRow = item.createDiv();
				mainRow.style.display = "flex";
				mainRow.style.justifyContent = "space-between";
				mainRow.style.alignItems = "center";
				mainRow.style.marginBottom = suggestion.stats ? "6px" : "0";

				const leftPart = mainRow.createDiv();
				leftPart.style.display = "flex";
				leftPart.style.alignItems = "center";
				leftPart.style.gap = "8px";

				leftPart.createSpan({ text: suggestion.icon });
				leftPart.createSpan({ text: suggestion.label });

				const rightPart = mainRow.createDiv();
				rightPart.style.display = "flex";
				rightPart.style.gap = "6px";

				if (suggestion.type === 'smart' && suggestion.score > 0) {
					const scoreBadge = rightPart.createSpan({ 
						text: `${Math.round(suggestion.score)}`,
						cls: 'suggestion-badge'
					});
					scoreBadge.style.fontSize = "0.85em";
					scoreBadge.style.color = "var(--text-on-accent)";
					scoreBadge.style.backgroundColor = "var(--interactive-accent)";
					scoreBadge.style.padding = "2px 6px";
					scoreBadge.style.borderRadius = "3px";
					scoreBadge.style.fontWeight = "500";
				}

				if (suggestion.stats) {
					const statsRow = item.createDiv();
					statsRow.style.fontSize = "0.85em";
					statsRow.style.color = "var(--text-muted)";
					statsRow.style.display = "flex";
					statsRow.style.gap = "12px";
					statsRow.style.paddingLeft = "28px";

					if (suggestion.stats.acceptRate > 0) {
						statsRow.createSpan({ 
							text: `✓ ${Math.round(suggestion.stats.acceptRate * 100)}%`
						});
					}
					
					if (suggestion.stats.last24h > 0) {
						statsRow.createSpan({ text: `24h: ${suggestion.stats.last24h}` });
					}
					if (suggestion.stats.last7d > 0) {
						statsRow.createSpan({ text: `7d: ${suggestion.stats.last7d}` });
					}
					if (suggestion.stats.last30d > 0) {
						statsRow.createSpan({ text: `30d: ${suggestion.stats.last30d}` });
					}
				}

				item.addEventListener('click', () => {
					this.inputEl.value = suggestion.value;
					this.selectedPatternKey = suggestion.patternKey;
					this.inputEl.focus();
				});
			});
		}

		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.display = "flex";
		buttonContainer.style.justifyContent = "flex-end";
		buttonContainer.style.gap = "8px";

		const cancelButton = buttonContainer.createEl("button", { text: t('cancel') });
		cancelButton.addEventListener("click", () => {
			if (this.onReject && this.selectedPatternKey) {
				this.onReject(this.selectedPatternKey);
			}
			this.close();
		});

		const submitButton = buttonContainer.createEl("button", { 
			text: t('rename'),
			cls: "mod-cta"
		});

		const submit = () => {
			const newName = this.inputEl.value.trim();
			if (newName && newName !== this.file.basename) {
				this.onSubmit(newName, this.selectedPatternKey);
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

		this.inputEl.addEventListener("input", () => {
			const currentValue = this.inputEl.value;
			const matchedSuggestion = this.suggestions.find(s => s.value === currentValue);
			this.selectedPatternKey = matchedSuggestion?.patternKey;
		});
	}
}

