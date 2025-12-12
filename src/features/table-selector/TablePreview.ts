import { TableInfo } from "./TableScanner";
import { t } from "../../i18n/legacy";

/**
 * Component for rendering table previews in the selector
 */
export class TablePreview {
	private tableInfo: TableInfo;
	
	constructor(tableInfo: TableInfo) {
		this.tableInfo = tableInfo;
	}
	
	/**
	 * Render the table preview into the given container
	 */
	render(container: HTMLElement): void {
		container.empty();
		
		if (this.tableInfo.headers.length === 0) {
			this.renderEmptyTable(container);
			return;
		}
		
		this.renderTablePreview(container);
	}
	
	private renderEmptyTable(container: HTMLElement): void {
		const emptyMessage = container.createDiv('empty-table');
		emptyMessage.textContent = t('emptyTable');
	}
	
	private renderTablePreview(container: HTMLElement): void {
		const previewEl = container.createDiv('table-preview');
		
		// Header section - show table structure
		const headerSection = previewEl.createDiv('header-section');
		const headerLabel = headerSection.createDiv('section-label');
		headerLabel.textContent = t('tableHeaders');
		
		const headerContent = headerSection.createDiv('header-content');
		const headerText = this.tableInfo.headers.length > 0 
			? this.tableInfo.headers.map(h => h.trim() || '—').join(' | ')
			: t('noHeaders');
		headerContent.textContent = this.truncateText(headerText, 60);
		
		// Data section - show first few rows
		if (this.tableInfo.dataRows.length > 0) {
			const dataSection = previewEl.createDiv('data-section');
			const dataLabel = dataSection.createDiv('section-label');
			dataLabel.textContent = t('sampleData');
			
			// Show up to 2 rows in preview
			const previewRows = this.tableInfo.dataRows.slice(0, 2);
			previewRows.forEach((row, index) => {
				const dataContent = dataSection.createDiv('data-content');
				const dataText = row.map(cell => cell.trim() || '—').join(' | ');
				dataContent.textContent = this.truncateText(dataText, 60);
				
				if (index === 1 && this.tableInfo.dataRows.length > 2) {
					dataContent.style.opacity = '0.7';
				}
			});
			
			// Show "..." if there are more rows
			if (this.tableInfo.dataRows.length > 2) {
				const moreRows = dataSection.createDiv('more-rows');
				moreRows.textContent = `... ${t('andMoreRows', { count: (this.tableInfo.dataRows.length - 2).toString() })}`;
			}
		}
		
		// Table metadata
		const metaSection = previewEl.createDiv('meta-section');
		const columnCount = this.tableInfo.headers.length;
		const totalRows = this.tableInfo.dataRows.length + 1; // +1 for header
		metaSection.textContent = t('tableSize', { 
			columns: columnCount.toString(), 
			rows: totalRows.toString() 
		});
	}
	
	private truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) {
			return text;
		}
		return text.substring(0, maxLength - 3) + '...';
	}
}