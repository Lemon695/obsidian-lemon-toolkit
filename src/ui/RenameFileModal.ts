import { App, Modal, TFile } from "obsidian";
import { t } from "../i18n/legacy";
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
		const { contentEl, modalEl } = this;
		contentEl.empty();
		modalEl.addClass('lemon-rename-modal');

		const header = contentEl.createDiv({ cls: 'lemon-rename-header' });
		header.createEl("h2", { text: t('renameFile'), cls: 'lemon-rename-title' });
		
		const currentPath = header.createDiv({ cls: 'lemon-rename-current-path' });
		currentPath.createSpan({ text: '📄 ', cls: 'lemon-rename-path-icon' });
		currentPath.createSpan({ text: this.file.path, cls: 'lemon-rename-path-text' });

		const inputSection = contentEl.createDiv({ cls: 'lemon-rename-input-section' });
		
		const label = inputSection.createEl("label", { 
			text: t('newFileName'),
			cls: 'lemon-rename-label'
		});

		const inputWrapper = inputSection.createDiv({ cls: 'lemon-rename-input-wrapper' });
		this.inputEl = inputWrapper.createEl("input", {
			type: "text",
			value: this.file.basename,
			cls: 'lemon-rename-input'
		});

		this.inputEl.select();
		this.inputEl.focus();

		if (this.suggestions.length > 0) {
			const suggestionsSection = contentEl.createDiv({ cls: 'lemon-rename-suggestions-section' });
			
			const suggestionsHeader = suggestionsSection.createDiv({ cls: 'lemon-rename-suggestions-header' });
			suggestionsHeader.createSpan({ text: t('suggestions'), cls: 'lemon-rename-suggestions-title' });
			suggestionsHeader.createSpan({ 
				text: `${this.suggestions.length}`,
				cls: 'lemon-rename-suggestions-count'
			});

			const suggestionsContainer = suggestionsSection.createDiv({ cls: 'lemon-rename-suggestions-container' });

			const smartSuggestions = this.suggestions.filter(s => s.type === 'smart');
			const quickSuggestions = this.suggestions.filter(s => s.type === 'quick');

			if (smartSuggestions.length > 0) {
				this.renderSuggestionGroup(suggestionsContainer, `🎯 ${t('renameSmartSuggestions')}`, smartSuggestions);
			}

			if (quickSuggestions.length > 0) {
				this.renderSuggestionGroup(suggestionsContainer, `⚡ ${t('renameQuickActions')}`, quickSuggestions);
			}
		}

		const footer = contentEl.createDiv({ cls: 'lemon-rename-footer' });

		const cancelButton = footer.createEl("button", { 
			text: t('cancel'),
			cls: 'lemon-rename-btn lemon-rename-btn-cancel'
		});
		cancelButton.addEventListener("click", () => {
			if (this.onReject && this.selectedPatternKey) {
				this.onReject(this.selectedPatternKey);
			}
			this.close();
		});

		const submitButton = footer.createEl("button", { 
			text: t('rename'),
			cls: 'lemon-rename-btn lemon-rename-btn-primary'
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

	private renderSuggestionGroup(container: HTMLElement, title: string, suggestions: RenameSuggestion[]) {
		const group = container.createDiv({ cls: 'lemon-rename-suggestion-group' });
		
		const groupTitle = group.createDiv({ cls: 'lemon-rename-group-title' });
		groupTitle.setText(title);

		suggestions.forEach(suggestion => {
			const item = group.createDiv({ cls: 'lemon-rename-suggestion-item' });

			const mainRow = item.createDiv({ cls: 'lemon-rename-suggestion-main' });

			const leftPart = mainRow.createDiv({ cls: 'lemon-rename-suggestion-left' });
			leftPart.createSpan({ text: suggestion.icon, cls: 'lemon-rename-suggestion-icon' });
			leftPart.createSpan({ text: suggestion.label, cls: 'lemon-rename-suggestion-label' });

			const rightPart = mainRow.createDiv({ cls: 'lemon-rename-suggestion-right' });

			if (suggestion.type === 'smart' && suggestion.score > 0) {
				const scoreBadge = rightPart.createSpan({ 
					text: `${Math.round(suggestion.score)}`,
					cls: 'lemon-rename-score-badge'
				});
				
				const score = suggestion.score;
				if (score >= 90) {
					scoreBadge.addClass('lemon-rename-score-high');
				} else if (score >= 75) {
					scoreBadge.addClass('lemon-rename-score-medium');
				} else {
					scoreBadge.addClass('lemon-rename-score-low');
				}
			}

			if (suggestion.stats && (suggestion.stats.acceptRate > 0 || suggestion.stats.usageCount > 0)) {
				const statsRow = item.createDiv({ cls: 'lemon-rename-suggestion-stats' });

				if (suggestion.stats.acceptRate > 0) {
					const acceptRate = statsRow.createSpan({ cls: 'lemon-rename-stat-item' });
					acceptRate.createSpan({ text: '✓', cls: 'lemon-rename-stat-icon' });
					acceptRate.createSpan({ text: `${Math.round(suggestion.stats.acceptRate * 100)}%` });
				}
				
				if (suggestion.stats.usageCount > 0) {
					const usageCount = statsRow.createSpan({ cls: 'lemon-rename-stat-item' });
					usageCount.createSpan({ text: '🔄', cls: 'lemon-rename-stat-icon' });
					usageCount.createSpan({ text: `${suggestion.stats.usageCount}` });
				}

				const timeStats: string[] = [];
				if (suggestion.stats.last24h > 0) timeStats.push(`24h: ${suggestion.stats.last24h}`);
				if (suggestion.stats.last7d > 0) timeStats.push(`7d: ${suggestion.stats.last7d}`);
				if (suggestion.stats.last30d > 0) timeStats.push(`30d: ${suggestion.stats.last30d}`);
				
				if (timeStats.length > 0) {
					const timeInfo = statsRow.createSpan({ cls: 'lemon-rename-stat-item lemon-rename-stat-time' });
					timeInfo.setText(timeStats.join(' • '));
				}
			}

			item.addEventListener('click', () => {
				this.inputEl.value = suggestion.value;
				this.selectedPatternKey = suggestion.patternKey;
				this.inputEl.focus();
				
				document.querySelectorAll('.lemon-rename-suggestion-item').forEach(el => {
					el.removeClass('lemon-rename-suggestion-selected');
				});
				item.addClass('lemon-rename-suggestion-selected');
			});
		});
	}
}
