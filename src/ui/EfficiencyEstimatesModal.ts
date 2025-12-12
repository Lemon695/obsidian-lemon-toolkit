import { App, Modal, Setting, Notice } from 'obsidian';
import LemonToolkitPlugin from '../main';
import { t } from "../i18n/legacy";
import { 
	getAllEfficiencyEstimates, 
	getEfficiencyEstimatesByCategory,
	formatTimeSaved,
	EfficiencyConfig 
} from '../features/statistics/efficiency-config';

/**
 * Modal for managing efficiency time estimates
 */
export class EfficiencyEstimatesModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private estimates: Record<string, EfficiencyConfig>;
	private modified: boolean = false;

	constructor(app: App, plugin: LemonToolkitPlugin) {
		super(app);
		this.plugin = plugin;
		this.estimates = getAllEfficiencyEstimates();
	}

	/**
	 * Get translated command name from command ID
	 */
	private getTranslatedCommandName(commandId: string): string {
		const idToKeyMap: Record<string, string> = {
			'copy-relative-path': 'copyRelativePath',
			'copy-absolute-path': 'copyAbsolutePath',
			'copy-file-name': 'copyFileName',
			'copy-file-name-without-ext': 'copyFileNameNoExt',
			'delete-file-permanently': 'deleteFilePermanently',
			'delete-file-to-trash': 'deleteFileToTrash',
			'duplicate-file': 'duplicateFile',
			'move-file-to-folder': 'moveFileToFolder',
			'view-current-tags': 'viewCurrentTags',
			'insert-tags': 'insertTags',
			'open-command-palette': 'openCommandPalette',
			'open-settings': 'openSettings',
			'open-file-info': 'openFileInfo',
			'edit-frontmatter': 'editFrontmatter',
			'text-selection-actions': 'textSelectionActions',
			'add-heading-numbering': 'addHeadingNumbering',
			'remove-heading-numbering': 'removeHeadingNumbering',
			'open-recent-files': 'openRecentFiles',
			'convert-wiki-to-markdown-file': 'convertWikiToMarkdownFile',
			'convert-markdown-to-wiki-file': 'convertMarkdownToWikiFile',
			'convert-wiki-to-markdown-selection': 'convertWikiToMarkdownSelection',
			'convert-markdown-to-wiki-selection': 'convertMarkdownToWikiSelection',
			'smart-paste': 'smartPaste',
			'insert-moment': 'insertMoment',
			'insert-moment-at-cursor': 'insertMomentAtCursor',
			'copy-current-heading': 'copyCurrentHeading',
			'copy-current-code-block': 'copyCurrentCodeBlock',
			'copy-current-table': 'copyCurrentTable',
			'smart-copy-selector': 'smartCopySelector',
			'select-table-rows': 'selectTableRows',
			'select-code-lines': 'selectCodeLines',
			'select-code-blocks': 'selectCodeBlocks',
			'edit-table': 'editTable',
			'create-table': 'createTable',
			'select-table-to-edit': 'selectTableToEdit',
			'open-global-command-palette': 'openGlobalCommandPalette',
			'sync-heading-with-filename': 'syncHeadingWithFilename',
			'rename-file': 'renameFile',
			'show-plugin-usage-stats': 'showPluginUsageStats',
			'open-plugin-manager': 'openPluginManager',
			'show-outline': 'showOutline',
			'copy-outline': 'copyOutline'
		};
		const i18nKey = idToKeyMap[commandId];
		return i18nKey ? t(i18nKey as any) : commandId;
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		contentEl.empty();
		contentEl.addClass('efficiency-estimates-modal');

		if (modalEl) {
			modalEl.style.width = '800px';
			modalEl.style.maxWidth = '95vw';
			modalEl.style.height = '700px';
			modalEl.style.maxHeight = '90vh';
		}

		this.titleEl.setText(t('efficiencyEstimates'));

		// Description
		const desc = contentEl.createDiv({ cls: 'modal-description' });
		desc.style.marginBottom = '20px';
		desc.style.color = 'var(--text-muted)';
		desc.textContent = t('efficiencyEstimatesDescription');

		// Group by category
		const categorized = getEfficiencyEstimatesByCategory();
		const scrollContainer = contentEl.createDiv({ cls: 'efficiency-scroll-container' });
		scrollContainer.style.maxHeight = '500px';
		scrollContainer.style.overflowY = 'auto';
		scrollContainer.style.marginBottom = '20px';

		Object.entries(categorized).forEach(([category, configs]) => {
			const categorySection = scrollContainer.createDiv({ cls: 'efficiency-category' });
			categorySection.style.marginBottom = '24px';

			const categoryHeader = categorySection.createEl('h3', { text: category });
			categoryHeader.style.marginBottom = '12px';
			categoryHeader.style.color = 'var(--text-accent)';

			configs.forEach(config => {
				this.renderEstimateRow(categorySection, config);
			});
		});

		// Action buttons
		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '8px';
		buttonContainer.style.marginTop = '16px';

		const resetButton = buttonContainer.createEl('button', { text: t('resetToDefaults') });
		resetButton.addEventListener('click', () => this.resetToDefaults());

		const saveButton = buttonContainer.createEl('button', { 
			text: t('save'),
			cls: 'mod-cta'
		});
		saveButton.addEventListener('click', () => this.save());

		const cancelButton = buttonContainer.createEl('button', { text: t('cancel') });
		cancelButton.addEventListener('click', () => this.close());
	}

	private renderEstimateRow(container: HTMLElement, config: EfficiencyConfig): void {
		const row = container.createDiv({ cls: 'efficiency-estimate-row' });
		row.style.padding = '12px';
		row.style.marginBottom = '8px';
		row.style.backgroundColor = 'var(--background-secondary)';
		row.style.borderRadius = '6px';

		// Command info
		const infoSection = row.createDiv({ cls: 'estimate-info' });
		infoSection.style.marginBottom = '8px';

		const commandName = infoSection.createEl('div', { cls: 'command-name' });
		commandName.style.fontWeight = '500';
		commandName.style.marginBottom = '4px';
		// Translate command name from ID
		commandName.textContent = this.getTranslatedCommandName(config.commandId);

		const description = infoSection.createEl('div', { cls: 'command-description' });
		description.style.fontSize = '0.9em';
		description.style.color = 'var(--text-muted)';
		// Translate description from key
		description.textContent = t(config.descriptionKey as any);

		// Time inputs
		const timeSection = row.createDiv({ cls: 'estimate-times' });
		timeSection.style.display = 'grid';
		timeSection.style.gridTemplateColumns = '1fr 1fr 1fr';
		timeSection.style.gap = '12px';
		timeSection.style.alignItems = 'center';

		// Manual time
		const manualGroup = timeSection.createDiv();
		manualGroup.createEl('label', { 
			text: t('manualTime'),
			cls: 'estimate-label'
		}).style.fontSize = '0.85em';
		
		const manualInput = manualGroup.createEl('input', {
			type: 'number',
			value: config.manualTimeSeconds.toString(),
			cls: 'estimate-input'
		});
		manualInput.style.width = '100%';
		manualInput.min = '0';
		manualInput.step = '0.5';
		
		manualInput.addEventListener('change', () => {
			const value = parseFloat(manualInput.value);
			if (value >= 0) {
				config.manualTimeSeconds = value;
				this.modified = true;
				this.updateTimeSaved(timeSavedDisplay, config);
			}
		});

		// Command time
		const commandGroup = timeSection.createDiv();
		commandGroup.createEl('label', { 
			text: t('commandTime'),
			cls: 'estimate-label'
		}).style.fontSize = '0.85em';
		
		const commandInput = commandGroup.createEl('input', {
			type: 'number',
			value: config.commandTimeSeconds.toString(),
			cls: 'estimate-input'
		});
		commandInput.style.width = '100%';
		commandInput.min = '0';
		commandInput.step = '0.5';
		
		commandInput.addEventListener('change', () => {
			const value = parseFloat(commandInput.value);
			if (value >= 0) {
				config.commandTimeSeconds = value;
				this.modified = true;
				this.updateTimeSaved(timeSavedDisplay, config);
			}
		});

		// Time saved display
		const savedGroup = timeSection.createDiv();
		savedGroup.createEl('label', { 
			text: t('timeSavedPerUse'),
			cls: 'estimate-label'
		}).style.fontSize = '0.85em';
		
		const timeSavedDisplay = savedGroup.createEl('div', { cls: 'time-saved-display' });
		timeSavedDisplay.style.fontWeight = '500';
		timeSavedDisplay.style.color = 'var(--text-accent)';
		timeSavedDisplay.style.padding = '4px 8px';
		timeSavedDisplay.style.backgroundColor = 'var(--background-primary)';
		timeSavedDisplay.style.borderRadius = '4px';
		timeSavedDisplay.style.textAlign = 'center';
		
		this.updateTimeSaved(timeSavedDisplay, config);
	}

	private updateTimeSaved(element: HTMLElement, config: EfficiencyConfig): void {
		const saved = config.manualTimeSeconds - config.commandTimeSeconds;
		if (saved > 0) {
			element.textContent = `+${formatTimeSaved(saved)}`;
			element.style.color = 'var(--text-accent)';
		} else if (saved < 0) {
			element.textContent = formatTimeSaved(Math.abs(saved));
			element.style.color = 'var(--text-error)';
		} else {
			element.textContent = '0s';
			element.style.color = 'var(--text-muted)';
		}
	}

	private resetToDefaults(): void {
		this.estimates = getAllEfficiencyEstimates();
		this.modified = true;
		this.onOpen(); // Re-render
		new Notice(t('resetToDefaultsSuccess'));
	}

	private async save(): Promise<void> {
		if (!this.modified) {
			this.close();
			return;
		}

		// Update plugin settings
		const efficiencyEstimates: Record<string, any> = {};
		Object.entries(this.estimates).forEach(([key, config]) => {
			efficiencyEstimates[key] = {
				commandId: config.commandId,
				manualTimeSeconds: config.manualTimeSeconds,
				commandTimeSeconds: config.commandTimeSeconds
			};
		});

		this.plugin.settings.statistics.efficiencyEstimates = efficiencyEstimates;
		this.plugin.statisticsManager?.updateSettings(this.plugin.settings.statistics);
		await this.plugin.saveSettings();

		new Notice(t('efficiencyEstimatesSaved'));
		this.close();
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
