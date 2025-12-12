import { App, Modal, Setting } from 'obsidian';
import { FolderService } from '../services/FolderService';
import { t } from '../i18n/legacy';

/**
 * Modal for creating new subfolders
 */
export class CreateFolderModal extends Modal {
	private folderService: FolderService;
	private parentPath: string;
	private onSuccess: (folderPath: string) => void;
	private inputEl: HTMLInputElement;

	constructor(app: App, parentPath: string, onSuccess: (folderPath: string) => void) {
		super(app);
		this.folderService = new FolderService(app);
		this.parentPath = parentPath;
		this.onSuccess = onSuccess;
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		contentEl.empty();
		contentEl.addClass('lemon-create-folder-modal');

		// Set modal dimensions
		if (modalEl) {
			modalEl.style.width = '400px';
			modalEl.style.maxWidth = '90vw';
		}

		// Set modal title
		this.titleEl.setText(t('createFolder'));

		// Show parent path info
		this.createParentPathInfo();

		// Create input form
		this.createInputForm();

		// Create action buttons
		this.createActionButtons();

		// Focus input
		setTimeout(() => {
			this.inputEl.focus();
		}, 100);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}

	/**
	 * Create parent path information display
	 */
	private createParentPathInfo(): void {
		const pathInfo = this.contentEl.createDiv({ cls: 'lemon-create-folder-path-info' });
		
		const label = pathInfo.createSpan({ cls: 'lemon-create-folder-path-label' });
		label.setText(t('parentFolder') + ': ');

		const path = pathInfo.createSpan({ cls: 'lemon-create-folder-path' });
		path.setText(this.parentPath || t('rootFolder'));
	}

	/**
	 * Create folder name input form
	 */
	private createInputForm(): void {
		const formContainer = this.contentEl.createDiv({ cls: 'lemon-create-folder-form' });

		new Setting(formContainer)
			.setName(t('folderName'))
			.setDesc(t('folderNameDesc'))
			.addText(text => {
				this.inputEl = text.inputEl;
				text.setPlaceholder(t('createFolderPlaceholder'))
					.onChange(value => {
						this.validateInput(value);
					});

				// Handle Enter key
				text.inputEl.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						this.handleCreate();
					}
				});

				return text;
			});

		// Create validation message container
		const validationContainer = formContainer.createDiv({ cls: 'lemon-create-folder-validation' });
		validationContainer.style.display = 'none';
	}

	/**
	 * Create action buttons
	 */
	private createActionButtons(): void {
		const buttonContainer = this.contentEl.createDiv({ cls: 'lemon-create-folder-buttons' });

		// Cancel button
		const cancelBtn = buttonContainer.createEl('button', {
			text: t('cancel'),
			cls: 'lemon-create-folder-btn lemon-create-folder-btn-cancel'
		});
		cancelBtn.addEventListener('click', () => {
			this.close();
		});

		// Create button
		const createBtn = buttonContainer.createEl('button', {
			text: t('createFolder'),
			cls: 'lemon-create-folder-btn lemon-create-folder-btn-create'
		});
		createBtn.addEventListener('click', () => {
			this.handleCreate();
		});

		// Make create button primary
		createBtn.addClass('mod-cta');
	}

	/**
	 * Validate folder name input
	 */
	private validateInput(value: string): void {
		const validationContainer = this.contentEl.querySelector('.lemon-create-folder-validation') as HTMLElement;
		const createBtn = this.contentEl.querySelector('.lemon-create-folder-btn-create') as HTMLButtonElement;

		if (!value || value.trim().length === 0) {
			this.showValidationMessage(validationContainer, '', false);
			createBtn.disabled = true;
			return;
		}

		const isValid = this.folderService.validateFolderName(value.trim());
		
		if (!isValid) {
			this.showValidationMessage(validationContainer, t('invalidFolderName'), true);
			createBtn.disabled = true;
		} else {
			// Check if folder already exists
			const fullPath = this.parentPath ? `${this.parentPath}/${value.trim()}` : value.trim();
			const existingFolder = this.app.vault.getAbstractFileByPath(fullPath);
			
			if (existingFolder) {
				this.showValidationMessage(validationContainer, t('folderExists'), true);
				createBtn.disabled = true;
			} else {
				this.showValidationMessage(validationContainer, '', false);
				createBtn.disabled = false;
			}
		}
	}

	/**
	 * Show validation message
	 */
	private showValidationMessage(container: HTMLElement, message: string, isError: boolean): void {
		if (!message) {
			container.style.display = 'none';
			return;
		}

		container.style.display = 'block';
		container.setText(message);
		container.className = 'lemon-create-folder-validation';
		
		if (isError) {
			container.addClass('lemon-create-folder-validation-error');
		} else {
			container.removeClass('lemon-create-folder-validation-error');
		}
	}

	/**
	 * Handle folder creation
	 */
	private async handleCreate(): Promise<void> {
		const folderName = this.inputEl.value.trim();
		
		if (!folderName) {
			return;
		}

		// Disable create button during creation
		const createBtn = this.contentEl.querySelector('.lemon-create-folder-btn-create') as HTMLButtonElement;
		const originalText = createBtn.textContent || t('createFolder');
		createBtn.disabled = true;
		createBtn.setText(t('creating') + '...');

		try {
			const newFolder = await this.folderService.createFolder(this.parentPath, folderName);
			
			// Call success callback
			this.onSuccess(newFolder.path);
			
			// Close modal
			this.close();
		} catch (error) {
			// Show error message
			const validationContainer = this.contentEl.querySelector('.lemon-create-folder-validation') as HTMLElement;
			this.showValidationMessage(validationContainer, error.message, true);
			
			// Re-enable create button
			createBtn.disabled = false;
			createBtn.setText(originalText);
		}
	}
}