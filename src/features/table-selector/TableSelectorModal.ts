import { App, Modal, Notice } from "obsidian";
import { TableInfo } from "./TableScanner";
import { TablePreview } from "./TablePreview";
import { t } from "../../i18n/legacy";

/**
 * Modal for selecting a table from the document
 */
export class TableSelectorModal extends Modal {
	private tables: TableInfo[];
	private onSelect: (table: TableInfo) => Promise<void>;
	private selectedIndex: number = 0;
	private filteredTables: TableInfo[] = [];
	private searchInput: HTMLInputElement;
	private tableList: HTMLElement;
	
	constructor(
		app: App,
		tables: TableInfo[],
		onSelect: (table: TableInfo) => Promise<void>
	) {
		super(app);
		this.tables = tables;
		this.onSelect = onSelect;
		this.filteredTables = [...tables];
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('table-selector-modal');
		
		// Title
		contentEl.createEl('h2', { text: t('selectTableToEdit') });
		
		// Search and controls container
		const controlsContainer = contentEl.createDiv('controls-container');
		
		// Search input
		const searchContainer = controlsContainer.createDiv('search-container');
		this.searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: t('searchTables'),
			cls: 'search-input'
		});
		
		this.searchInput.addEventListener('input', () => {
			this.filterTables();
		});
		
		// Close button
		const closeButton = controlsContainer.createEl('button', {
			text: t('close'),
			cls: 'close-button'
		});
		closeButton.addEventListener('click', () => {
			this.close();
		});
		
		// Table list container
		this.tableList = contentEl.createDiv('table-list');
		
		// Render initial list
		this.renderTableList();
		
		// Add keyboard navigation
		this.setupKeyboardNavigation();
		
		// Add styles
		this.addStyles();
		
		// Focus search input
		this.searchInput.focus();
	}
	
	private filterTables() {
		const query = this.searchInput.value.toLowerCase();
		
		if (!query) {
			this.filteredTables = [...this.tables];
		} else {
			this.filteredTables = this.tables.filter(table => {
				// Search in headers and data rows content
				const searchText = [
					...table.headers,
					...table.dataRows.flat() // Flatten all data rows into a single array
				].join(' ').toLowerCase();
				
				return searchText.includes(query);
			});
		}
		
		this.selectedIndex = 0;
		this.renderTableList();
	}
	
	private renderTableList() {
		this.tableList.empty();
		
		if (this.filteredTables.length === 0) {
			const noResults = this.tableList.createDiv('no-results');
			noResults.textContent = t('noTablesFound');
			return;
		}
		
		this.filteredTables.forEach((table, index) => {
			const tableItem = this.tableList.createDiv('table-item');
			
			if (index === this.selectedIndex) {
				tableItem.addClass('selected');
			}
			
			// Table header
			const header = tableItem.createDiv('table-header');
			header.textContent = t('tableNumber', { number: (table.index + 1).toString() });
			
			// Table preview
			const previewContainer = tableItem.createDiv('table-preview-container');
			const preview = new TablePreview(table);
			preview.render(previewContainer);
			
			// Click handler
			tableItem.addEventListener('click', () => {
				this.selectTable(index);
			});
			
			// Double-click to select immediately
			tableItem.addEventListener('dblclick', () => {
				this.confirmSelection();
			});
		});
	}
	
	private selectTable(index: number) {
		this.selectedIndex = index;
		this.renderTableList();
	}
	
	private async confirmSelection() {
		if (this.filteredTables.length === 0) return;
		
		const selectedTable = this.filteredTables[this.selectedIndex];
		
		try {
			// Don't close the selector modal - keep it open as primary window
			await this.onSelect(selectedTable);
		} catch (error) {
			new Notice(t('errorOpeningTable'));
			console.error('Error opening table:', error);
		}
	}
	
	private setupKeyboardNavigation() {
		this.scope.register([], 'ArrowUp', () => {
			if (this.selectedIndex > 0) {
				this.selectedIndex--;
				this.renderTableList();
				this.scrollToSelected();
			}
		});
		
		this.scope.register([], 'ArrowDown', () => {
			if (this.selectedIndex < this.filteredTables.length - 1) {
				this.selectedIndex++;
				this.renderTableList();
				this.scrollToSelected();
			}
		});
		
		this.scope.register([], 'Enter', () => {
			this.confirmSelection();
		});
		
		this.scope.register([], 'Escape', () => {
			this.close();
		});
	}
	
	private scrollToSelected() {
		const selectedItem = this.tableList.querySelector('.table-item.selected') as HTMLElement;
		if (selectedItem) {
			selectedItem.scrollIntoView({ block: 'nearest' });
		}
	}
	
	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.table-selector-modal {
				width: 800px;
				height: 600px;
				max-width: 95vw;
				max-height: 90vh;
			}
			
			.table-selector-modal .modal-content {
				display: flex;
				flex-direction: column;
				height: 100%;
				padding: 20px;
			}
			
			.table-selector-modal h2 {
				margin: 0 0 16px 0;
				flex-shrink: 0;
			}
			
			.controls-container {
				display: flex;
				gap: 12px;
				align-items: center;
				margin-bottom: 16px;
				flex-shrink: 0;
			}
			
			.search-container {
				flex: 1;
			}
			
			.close-button {
				padding: 8px 16px;
				border-radius: 4px;
				border: 1px solid var(--background-modifier-border);
				background: var(--background-primary);
				color: var(--text-normal);
				cursor: pointer;
				font-size: 14px;
				white-space: nowrap;
			}
			
			.close-button:hover {
				background: var(--background-modifier-hover);
			}
			
			.search-input {
				width: 100%;
				padding: 8px 12px;
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				background: var(--background-primary);
				color: var(--text-normal);
				font-size: 14px;
			}
			
			.search-input:focus {
				outline: 2px solid var(--interactive-accent);
				outline-offset: -2px;
			}
			
			.table-list {
				flex: 1;
				overflow-y: auto;
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				background: var(--background-primary);
			}
			
			.table-item {
				padding: 12px;
				border-bottom: 1px solid var(--background-modifier-border);
				cursor: pointer;
				transition: background-color 0.15s;
			}
			
			.table-item:last-child {
				border-bottom: none;
			}
			
			.table-item:hover {
				background: var(--background-modifier-hover);
			}
			
			.table-item.selected {
				background: var(--interactive-accent-hover);
				border-left: 3px solid var(--interactive-accent);
			}
			
			.table-header {
				font-weight: 600;
				color: var(--text-normal);
				margin-bottom: 8px;
				font-size: 14px;
			}
			
			.table-preview-container {
				background: var(--background-secondary);
				padding: 12px;
				border-radius: 6px;
				border: 1px solid var(--background-modifier-border);
			}
			
			.table-preview {
				font-size: 13px;
				line-height: 1.4;
			}
			
			.header-section,
			.data-section {
				margin-bottom: 8px;
			}
			
			.section-label {
				font-size: 11px;
				font-weight: 600;
				color: var(--text-accent);
				margin-bottom: 4px;
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}
			
			.header-content,
			.data-content {
				font-family: var(--font-monospace);
				font-size: 12px;
				color: var(--text-normal);
				background: var(--background-primary);
				padding: 6px 8px;
				border-radius: 4px;
				border: 1px solid var(--background-modifier-border);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			
			.meta-section {
				font-size: 11px;
				color: var(--text-muted);
				text-align: right;
				font-style: italic;
				margin-top: 8px;
				padding-top: 8px;
				border-top: 1px solid var(--background-modifier-border);
			}
			
			.more-rows {
				font-size: 11px;
				color: var(--text-faint);
				font-style: italic;
				text-align: center;
				margin-top: 6px;
				padding: 4px;
				background: var(--background-modifier-border);
				border-radius: 3px;
			}
			
			.no-results {
				padding: 40px;
				text-align: center;
				color: var(--text-muted);
				font-style: italic;
			}
		`;
		document.head.appendChild(style);
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}