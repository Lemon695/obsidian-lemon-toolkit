import { App, Modal, Notice } from "obsidian";
import { t } from "../../i18n/legacy";

interface TableCell {
	content: string;
	align?: 'left' | 'center' | 'right';
}

interface TableData {
	headers: TableCell[];
	rows: TableCell[][];
	startLine: number;
	endLine: number;
}

export class TableEditorModal extends Modal {
	private tableData: TableData;
	private onSave: (data: TableData) => Promise<void>;
	private selectedCell: { row: number; col: number } | null = null;
	private selectedRange: { startRow: number; startCol: number; endRow: number; endCol: number } | null = null;
	private tableEl: HTMLTableElement;
	private draggedRowIndex: number | null = null;
	private draggedColIndex: number | null = null;
	private resizingCol: number | null = null;
	private resizeStartX: number = 0;
	private resizeStartWidth: number = 0;
	private columnWidths: number[] = [];
	private freezeFirstRow: boolean = false;
	private freezeFirstColumn: boolean = false;

	constructor(
		app: App,
		tableData: TableData,
		onSave: (data: TableData) => Promise<void>
	) {
		super(app);
		this.tableData = JSON.parse(JSON.stringify(tableData)); // Deep copy
		this.onSave = onSave;
		this.columnWidths = new Array(tableData.headers.length).fill(150); // Default width
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('table-editor-modal');

		// Title
		contentEl.createEl('h2', { text: t('tableEditor') });

		// Toolbar (sticky top)
		const toolbar = contentEl.createDiv('table-editor-toolbar-sticky');
		this.createToolbar(toolbar);

		// Table container (scrollable)
		const tableContainer = contentEl.createDiv('table-editor-container');
		this.renderTable(tableContainer);

		// Buttons (sticky bottom)
		const buttonContainer = contentEl.createDiv('table-editor-buttons-sticky');
		this.createButtons(buttonContainer);

		// Add styles
		this.addStyles();
	}

	private createToolbar(container: HTMLElement) {
		const toolbar = container.createDiv('table-editor-toolbar');

		// Import/Export
		this.createButton(toolbar, `📥 ${t('importCSV')}`, () => this.importCSV());
		this.createButton(toolbar, `📤 ${t('exportCSV')}`, () => this.exportCSV());

		toolbar.createDiv('toolbar-separator');

		// Freeze
		this.createButton(toolbar, `❄️ ${t('freezeFirstRow')}`, () => this.toggleFreezeRow());
		this.createButton(toolbar, `❄️ ${t('freezeFirstColumn')}`, () => this.toggleFreezeColumn());

		toolbar.createDiv('toolbar-separator');

		// Edit operations
		this.createButton(toolbar, `🔍 ${t('findReplace')}`, () => this.findReplace());
		this.createButton(toolbar, `📝 ${t('batchFill')}`, () => this.batchFill());
		this.createButton(toolbar, `🧹 ${t('clearColumn')}`, () => this.clearColumn());

		toolbar.createDiv('toolbar-separator');

		// Row operations
		this.createButton(toolbar, t('insertRowAbove'), () => this.insertRow(true));
		this.createButton(toolbar, t('insertRowBelow'), () => this.insertRow(false));
		this.createButton(toolbar, t('deleteRow'), () => this.deleteRow());

		toolbar.createDiv('toolbar-separator');

		// Column operations
		this.createButton(toolbar, t('insertColumnLeft'), () => this.insertColumn(true));
		this.createButton(toolbar, t('insertColumnRight'), () => this.insertColumn(false));
		this.createButton(toolbar, t('deleteColumn'), () => this.deleteColumn());

		toolbar.createDiv('toolbar-separator');

		// Alignment
		this.createButton(toolbar, t('alignLeft'), () => this.setAlignment('left'));
		this.createButton(toolbar, t('alignCenter'), () => this.setAlignment('center'));
		this.createButton(toolbar, t('alignRight'), () => this.setAlignment('right'));

		toolbar.createDiv('toolbar-separator');

		// Sort
		this.createButton(toolbar, t('sortAscending'), () => this.sortColumn(true));
		this.createButton(toolbar, t('sortDescending'), () => this.sortColumn(false));
	}

	private createButton(container: HTMLElement, text: string, onClick: () => void) {
		const btn = container.createEl('button', { text, cls: 'table-editor-btn' });
		btn.addEventListener('click', onClick);
	}

	private renderTable(container: HTMLElement) {
		container.empty();

		this.tableEl = container.createEl('table', { cls: 'table-editor-table' });

		// Render header
		const thead = this.tableEl.createEl('thead');
		const headerRow = thead.createEl('tr');
		
		// Add corner cell for row/column selection
		const cornerCell = headerRow.createEl('th', { cls: 'corner-cell' });
		cornerCell.addEventListener('click', () => this.selectAll());
		
		this.tableData.headers.forEach((header, colIdx) => {
			const th = headerRow.createEl('th');
			th.style.textAlign = header.align || 'left';
			th.style.width = `${Math.max(this.columnWidths[colIdx], 100)}px`;
			th.style.minWidth = `${Math.max(this.columnWidths[colIdx], 100)}px`;
			th.draggable = true;
			th.addClass('draggable-column');
			th.dataset.colIndex = colIdx.toString();
			
			// Apply frozen column style
			if (this.freezeFirstColumn && colIdx === 0) {
				th.addClass('frozen-column');
				th.style.left = '40px';
			}
			
			// Column number indicator
			const colNumber = th.createDiv('column-number');
			colNumber.textContent = String.fromCharCode(65 + colIdx); // A, B, C...
			colNumber.addEventListener('click', (e) => {
				e.stopPropagation();
				this.selectColumn(colIdx);
			});
			
			// Column drag handle (show on top edge hover)
			const dragHandle = th.createDiv('column-drag-handle');
			dragHandle.innerHTML = '⋮⋮⋮';
			
			// Resize handle
			const resizeHandle = th.createDiv('column-resize-handle');
			
			resizeHandle.addEventListener('mousedown', (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.resizingCol = colIdx;
				this.resizeStartX = e.clientX;
				this.resizeStartWidth = this.columnWidths[colIdx];
				document.body.style.cursor = 'col-resize';
				
				const onMouseMove = (e: MouseEvent) => {
					if (this.resizingCol !== null) {
						const diff = e.clientX - this.resizeStartX;
						const newWidth = Math.max(80, this.resizeStartWidth + diff);
						this.columnWidths[this.resizingCol] = newWidth;
						this.updateColumnWidths();
					}
				};
				
				const onMouseUp = () => {
					this.resizingCol = null;
					document.body.style.cursor = '';
					document.removeEventListener('mousemove', onMouseMove);
					document.removeEventListener('mouseup', onMouseUp);
				};
				
				document.addEventListener('mousemove', onMouseMove);
				document.addEventListener('mouseup', onMouseUp);
			});
			
			// Drag events for columns
			th.addEventListener('dragstart', (e) => {
				this.draggedColIndex = colIdx;
				th.addClass('dragging');
				e.dataTransfer!.effectAllowed = 'move';
			});
			
			th.addEventListener('dragend', () => {
				th.removeClass('dragging');
				this.draggedColIndex = null;
			});
			
			th.addEventListener('dragover', (e) => {
				e.preventDefault();
				e.dataTransfer!.dropEffect = 'move';
			});
			
			th.addEventListener('drop', (e) => {
				e.preventDefault();
				if (this.draggedColIndex !== null && this.draggedColIndex !== colIdx) {
					this.reorderColumn(this.draggedColIndex, colIdx);
				}
			});
			
			const input = th.createEl('input', {
				type: 'text',
				value: header.content,
				cls: 'table-cell-input'
			});

			input.addEventListener('input', (e) => {
				this.tableData.headers[colIdx].content = (e.target as HTMLInputElement).value;
			});

			input.addEventListener('focus', () => {
				this.selectedCell = { row: -1, col: colIdx };
				this.updateSelection();
			});

			// Tab navigation
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Tab') {
					e.preventDefault();
					this.navigateCell(e.shiftKey ? 'left' : 'right');
				} else if (e.key === 'Enter') {
					e.preventDefault();
					this.navigateCell('down');
				}
			});
		});

		// Render body
		const tbody = this.tableEl.createEl('tbody');
		
		this.tableData.rows.forEach((row, rowIdx) => {
			const tr = tbody.createEl('tr');
			tr.draggable = true;
			tr.addClass('draggable-row');
			tr.dataset.rowIndex = rowIdx.toString();
			
			// Row number cell
			const rowNumberCell = tr.createEl('td', { cls: 'row-number-cell' });
			rowNumberCell.textContent = (rowIdx + 1).toString();
			rowNumberCell.addEventListener('click', (e) => {
				e.stopPropagation();
				this.selectRow(rowIdx);
			});
			
			// Row drag handle (show on left edge hover) - should be inside the row number cell
			const dragHandle = rowNumberCell.createDiv('row-drag-handle');
			dragHandle.innerHTML = '⋮<br>⋮<br>⋮';
			
			// Drag events for rows
			tr.addEventListener('dragstart', (e) => {
				this.draggedRowIndex = rowIdx;
				tr.addClass('dragging');
				e.dataTransfer!.effectAllowed = 'move';
			});
			
			tr.addEventListener('dragend', () => {
				tr.removeClass('dragging');
				this.draggedRowIndex = null;
			});
			
			tr.addEventListener('dragover', (e) => {
				e.preventDefault();
				e.dataTransfer!.dropEffect = 'move';
			});
			
			tr.addEventListener('drop', (e) => {
				e.preventDefault();
				if (this.draggedRowIndex !== null && this.draggedRowIndex !== rowIdx) {
					this.reorderRow(this.draggedRowIndex, rowIdx);
				}
			});
			
			// Ensure we have the correct number of cells to match headers
			const cellsToRender = Math.max(row.length, this.tableData.headers.length);
			
			for (let colIdx = 0; colIdx < cellsToRender; colIdx++) {
				const cell = row[colIdx] || { content: '', align: 'left' };
				const td = tr.createEl('td');
				td.style.textAlign = cell.align || this.tableData.headers[colIdx]?.align || 'left';
				td.style.width = `${Math.max(this.columnWidths[colIdx] || 150, 100)}px`;
				td.style.minWidth = `${Math.max(this.columnWidths[colIdx] || 150, 100)}px`;
				
				// Apply frozen column style
				if (this.freezeFirstColumn && colIdx === 0) {
					td.addClass('frozen-column');
					td.style.left = '40px';
				}
				
				const input = td.createEl('input', {
					type: 'text',
					value: cell.content || '',
					cls: 'table-cell-input'
				});

				input.addEventListener('input', (e) => {
					// Ensure the row has enough cells
					while (this.tableData.rows[rowIdx].length <= colIdx) {
						this.tableData.rows[rowIdx].push({ content: '', align: 'left' });
					}
					this.tableData.rows[rowIdx][colIdx].content = (e.target as HTMLInputElement).value;
				});

				input.addEventListener('focus', () => {
					this.selectedCell = { row: rowIdx, col: colIdx };
					this.updateSelection();
				});

				input.addEventListener('keydown', (e) => {
					if (e.key === 'Tab') {
						e.preventDefault();
						this.navigateCell(e.shiftKey ? 'left' : 'right');
					} else if (e.key === 'Enter') {
						e.preventDefault();
						this.navigateCell('down');
					}
				});
			}
		});
	}

	private updateSelection() {
		// Remove previous selection
		this.tableEl.querySelectorAll('.selected').forEach(el => el.removeClass('selected'));

		if (!this.selectedCell) return;

		// Highlight selected cell
		const { row, col } = this.selectedCell;
		// +2 because: +1 for corner/row-number cell, +1 for 1-based nth-child
		const selector = row === -1 
			? `thead th:nth-child(${col + 2})`
			: `tbody tr:nth-child(${row + 1}) td:nth-child(${col + 2})`;
		
		const cell = this.tableEl.querySelector(selector);
		cell?.addClass('selected');
	}

	private navigateCell(direction: 'left' | 'right' | 'up' | 'down') {
		if (!this.selectedCell) return;

		let { row, col } = this.selectedCell;
		const colCount = this.tableData.headers.length;
		const rowCount = this.tableData.rows.length;

		switch (direction) {
			case 'left':
				col = col > 0 ? col - 1 : colCount - 1;
				if (col === colCount - 1 && row > -1) row--;
				break;
			case 'right':
				col = col < colCount - 1 ? col + 1 : 0;
				if (col === 0 && row < rowCount - 1) row++;
				break;
			case 'up':
				row = row > -1 ? row - 1 : rowCount - 1;
				break;
			case 'down':
				row = row < rowCount - 1 ? row + 1 : -1;
				break;
		}

		this.selectedCell = { row, col };
		this.focusCell(row, col);
	}

	private focusCell(row: number, col: number) {
		// +2 because: +1 for corner/row-number cell, +1 for 1-based nth-child
		const selector = row === -1
			? `thead th:nth-child(${col + 2}) input`
			: `tbody tr:nth-child(${row + 1}) td:nth-child(${col + 2}) input`;
		
		const input = this.tableEl.querySelector(selector) as HTMLInputElement;
		input?.focus();
	}

	private insertRow(above: boolean) {
		if (!this.selectedCell) {
			new Notice(t('selectCellFirst'));
			return;
		}

		const { row } = this.selectedCell;
		const insertIdx = above ? row : row + 1;
		const newRow = this.tableData.headers.map(h => ({ content: '', align: h.align }));
		
		this.tableData.rows.splice(insertIdx, 0, newRow);
		this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
		new Notice(t('rowInserted', { position: above ? t('above') : t('below') }));
	}

	private deleteRow() {
		if (!this.selectedCell || this.selectedCell.row === -1) {
			new Notice(t('selectDataRow'));
			return;
		}

		if (this.tableData.rows.length === 1) {
			new Notice(t('cannotDeleteLastRow'));
			return;
		}

		this.tableData.rows.splice(this.selectedCell.row, 1);
		this.selectedCell = null;
		this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
		new Notice(t('rowDeleted'));
	}

	private insertColumn(left: boolean) {
		if (!this.selectedCell) {
			new Notice(t('selectCellFirst'));
			return;
		}

		const { col } = this.selectedCell;
		const insertIdx = left ? col : col + 1;

		// Insert header
		this.tableData.headers.splice(insertIdx, 0, { content: '', align: 'left' });

		// Insert cells in all rows
		this.tableData.rows.forEach(row => {
			row.splice(insertIdx, 0, { content: '', align: 'left' });
		});

		this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
		new Notice(t('columnInserted', { position: left ? t('left') : t('right') }));
	}

	private deleteColumn() {
		if (!this.selectedCell) {
			new Notice(t('selectCellFirst'));
			return;
		}

		if (this.tableData.headers.length === 1) {
			new Notice(t('cannotDeleteLastColumn'));
			return;
		}

		const { col } = this.selectedCell;

		// Delete header
		this.tableData.headers.splice(col, 1);

		// Delete cells in all rows
		this.tableData.rows.forEach(row => {
			row.splice(col, 1);
		});

		this.selectedCell = null;
		this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
		new Notice(t('columnDeleted'));
	}

	private setAlignment(align: 'left' | 'center' | 'right') {
		if (!this.selectedCell && !this.selectedRange) {
			new Notice(t('selectCellFirst'));
			return;
		}

		if (this.selectedRange) {
			// Apply to range
			const { startRow, startCol, endRow, endCol } = this.selectedRange;
			
			// Apply to headers if column is fully selected
			if (startRow === 0 && endRow === this.tableData.rows.length - 1) {
				for (let col = startCol; col <= endCol; col++) {
					this.tableData.headers[col].align = align;
				}
			}
			
			// Apply to cells
			for (let row = startRow; row <= endRow; row++) {
				for (let col = startCol; col <= endCol; col++) {
					this.tableData.rows[row][col].align = align;
				}
			}
		} else if (this.selectedCell) {
			const { row, col } = this.selectedCell;

			if (row === -1) {
				// Header selected - apply to entire column
				this.tableData.headers[col].align = align;
				this.tableData.rows.forEach(r => r[col].align = align);
			} else {
				// Data cell selected
				this.tableData.rows[row][col].align = align;
			}
		}

		this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
		new Notice(t('alignmentSet', { align }));
	}

	private sortColumn(ascending: boolean) {
		if (!this.selectedCell) {
			new Notice(t('selectColumnFirst'));
			return;
		}

		const { col } = this.selectedCell;

		this.tableData.rows.sort((a, b) => {
			const aVal = a[col].content.toLowerCase();
			const bVal = b[col].content.toLowerCase();
			
			const result = aVal.localeCompare(bVal, undefined, { numeric: true });
			return ascending ? result : -result;
		});

		this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
		new Notice(t('sorted', { direction: ascending ? t('ascending') : t('descending') }));
	}

	private reorderRow(fromIndex: number, toIndex: number) {
		const [movedRow] = this.tableData.rows.splice(fromIndex, 1);
		this.tableData.rows.splice(toIndex, 0, movedRow);
		
		this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
		new Notice(t('rowReordered'));
	}

	private reorderColumn(fromIndex: number, toIndex: number) {
		// Reorder header
		const [movedHeader] = this.tableData.headers.splice(fromIndex, 1);
		this.tableData.headers.splice(toIndex, 0, movedHeader);
		
		// Reorder column widths
		const [movedWidth] = this.columnWidths.splice(fromIndex, 1);
		this.columnWidths.splice(toIndex, 0, movedWidth);
		
		// Reorder cells in all rows
		this.tableData.rows.forEach(row => {
			const [movedCell] = row.splice(fromIndex, 1);
			row.splice(toIndex, 0, movedCell);
		});
		
		this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
		new Notice(t('columnReordered'));
	}

	private updateColumnWidths() {
		// Update header widths (skip corner cell at index 0)
		const headers = this.tableEl.querySelectorAll('thead th');
		headers.forEach((th, idx) => {
			if (idx === 0) return; // Skip corner cell
			const colIdx = idx - 1; // Adjust for corner cell
			if (colIdx >= this.columnWidths.length) return;
			(th as HTMLElement).style.width = `${this.columnWidths[colIdx]}px`;
			(th as HTMLElement).style.minWidth = `${this.columnWidths[colIdx]}px`;
			(th as HTMLElement).style.maxWidth = `${this.columnWidths[colIdx]}px`;
		});
		
		// Update cell widths (skip row number cell at index 0)
		const rows = this.tableEl.querySelectorAll('tbody tr');
		rows.forEach(row => {
			const cells = row.querySelectorAll('td');
			cells.forEach((td, idx) => {
				if (idx === 0) return; // Skip row number cell
				const colIdx = idx - 1; // Adjust for row number cell
				if (colIdx >= this.columnWidths.length) return;
				(td as HTMLElement).style.width = `${this.columnWidths[colIdx]}px`;
				(td as HTMLElement).style.minWidth = `${this.columnWidths[colIdx]}px`;
				(td as HTMLElement).style.maxWidth = `${this.columnWidths[colIdx]}px`;
			});
		});
	}

	private importCSV() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.csv';
		
		input.addEventListener('change', async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			
			const text = await file.text();
			const lines = text.split('\n').filter(line => line.trim());
			
			if (lines.length < 2) {
				new Notice(t('csvMustHaveHeader'));
				return;
			}
			
			// Parse CSV (simple implementation, handles basic cases)
			const parseCSVLine = (line: string): string[] => {
				const result: string[] = [];
				let current = '';
				let inQuotes = false;
				
				for (let i = 0; i < line.length; i++) {
					const char = line[i];
					
					if (char === '"') {
						inQuotes = !inQuotes;
					} else if (char === ',' && !inQuotes) {
						result.push(current.trim());
						current = '';
					} else {
						current += char;
					}
				}
				result.push(current.trim());
				return result;
			};
			
			// Parse header
			const headerCells = parseCSVLine(lines[0]);
			this.tableData.headers = headerCells.map(content => ({
				content,
				align: 'left'
			}));
			
			// Parse rows
			this.tableData.rows = [];
			for (let i = 1; i < lines.length; i++) {
				const cells = parseCSVLine(lines[i]);
				// Pad or trim to match header length
				while (cells.length < headerCells.length) cells.push('');
				this.tableData.rows.push(cells.slice(0, headerCells.length).map(content => ({
					content,
					align: 'left'
				})));
			}
			
			// Reset column widths
			this.columnWidths = new Array(this.tableData.headers.length).fill(150);
			
			this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
			new Notice(t('csvImported', { count: this.tableData.rows.length.toString() }));
		});
		
		input.click();
	}

	private exportCSV() {
		// Generate CSV content
		const escapeCSV = (text: string): string => {
			if (text.includes(',') || text.includes('"') || text.includes('\n')) {
				return `"${text.replace(/"/g, '""')}"`;
			}
			return text;
		};
		
		const lines: string[] = [];
		
		// Header
		lines.push(this.tableData.headers.map(h => escapeCSV(h.content)).join(','));
		
		// Rows
		this.tableData.rows.forEach(row => {
			lines.push(row.map(cell => escapeCSV(cell.content)).join(','));
		});
		
		const csvContent = lines.join('\n');
		
		// Download
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'table.csv';
		link.click();
		URL.revokeObjectURL(url);
		
		new Notice(t('csvExported'));
	}

	private findReplace() {
		const modal = document.createElement('div');
		modal.className = 'find-replace-modal';
		modal.innerHTML = `
			<div style="padding: 16px; background: var(--background-primary); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
				<h3 style="margin-top: 0;">${t('findReplaceTitle')}</h3>
				<div style="margin-bottom: 12px;">
					<label style="display: block; margin-bottom: 4px;">${t('findLabel')}</label>
					<input type="text" id="find-input" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--background-modifier-border);">
				</div>
				<div style="margin-bottom: 12px;">
					<label style="display: block; margin-bottom: 4px;">${t('replaceLabel')}</label>
					<input type="text" id="replace-input" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--background-modifier-border);">
				</div>
				<div style="margin-bottom: 12px;">
					<label style="display: flex; align-items: center; gap: 8px;">
						<input type="checkbox" id="case-sensitive">
						<span>${t('caseSensitive')}</span>
					</label>
				</div>
				<div style="display: flex; gap: 8px; justify-content: flex-end;">
					<button id="replace-all-btn" class="mod-cta">${t('replaceAll')}</button>
					<button id="cancel-btn">${t('cancel')}</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		modal.style.position = 'fixed';
		modal.style.top = '50%';
		modal.style.left = '50%';
		modal.style.transform = 'translate(-50%, -50%)';
		modal.style.zIndex = '1000';
		
		const findInput = modal.querySelector('#find-input') as HTMLInputElement;
		const replaceInput = modal.querySelector('#replace-input') as HTMLInputElement;
		const caseSensitive = modal.querySelector('#case-sensitive') as HTMLInputElement;
		
		findInput.focus();
		
		modal.querySelector('#replace-all-btn')?.addEventListener('click', () => {
			const findText = findInput.value;
			const replaceText = replaceInput.value;
			
			if (!findText) {
				new Notice(t('enterTextToFind'));
				return;
			}
			
			let count = 0;
			const flags = caseSensitive.checked ? 'g' : 'gi';
			const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
			
			// Replace in headers
			this.tableData.headers.forEach(header => {
				const newContent = header.content.replace(regex, replaceText);
				if (newContent !== header.content) {
					header.content = newContent;
					count++;
				}
			});
			
			// Replace in rows
			this.tableData.rows.forEach(row => {
				row.forEach(cell => {
					const newContent = cell.content.replace(regex, replaceText);
					if (newContent !== cell.content) {
						cell.content = newContent;
						count++;
					}
				});
			});
			
			this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
			new Notice(t('replacedCount', { count: count.toString() }));
			modal.remove();
		});
		
		modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
			modal.remove();
		});
	}

	private batchFill() {
		if (!this.selectedCell) {
			new Notice(t('selectColumnFirst'));
			return;
		}
		
		const { col } = this.selectedCell;
		
		const modal = document.createElement('div');
		modal.className = 'batch-fill-modal';
		modal.innerHTML = `
			<div style="padding: 16px; background: var(--background-primary); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
				<h3 style="margin-top: 0;">${t('batchFillTitle')}</h3>
				<div style="margin-bottom: 12px;">
					<label style="display: block; margin-bottom: 4px;">${t('fillValueLabel')}</label>
					<input type="text" id="fill-value" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--background-modifier-border);">
				</div>
				<div style="margin-bottom: 12px;">
					<label style="display: flex; align-items: center; gap: 8px;">
						<input type="checkbox" id="skip-empty" checked>
						<span>${t('onlyFillEmpty')}</span>
					</label>
				</div>
				<div style="display: flex; gap: 8px; justify-content: flex-end;">
					<button id="fill-btn" class="mod-cta">${t('fill')}</button>
					<button id="cancel-btn">${t('cancel')}</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		modal.style.position = 'fixed';
		modal.style.top = '50%';
		modal.style.left = '50%';
		modal.style.transform = 'translate(-50%, -50%)';
		modal.style.zIndex = '1000';
		
		const fillInput = modal.querySelector('#fill-value') as HTMLInputElement;
		const skipEmpty = modal.querySelector('#skip-empty') as HTMLInputElement;
		
		fillInput.focus();
		
		modal.querySelector('#fill-btn')?.addEventListener('click', () => {
			const fillValue = fillInput.value;
			let count = 0;
			
			this.tableData.rows.forEach(row => {
				if (skipEmpty.checked && row[col].content.trim() !== '') {
					return;
				}
				row[col].content = fillValue;
				count++;
			});
			
			this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
			new Notice(t('filledCount', { count: count.toString() }));
			modal.remove();
		});
		
		modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
			modal.remove();
		});
	}

	private clearColumn() {
		if (!this.selectedCell) {
			new Notice(t('selectColumnFirst'));
			return;
		}
		
		const { col } = this.selectedCell;
		
		this.tableData.rows.forEach(row => {
			row[col].content = '';
		});
		
		this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
		new Notice(t('columnCleared'));
	}

	private selectRow(rowIdx: number) {
		this.selectedRange = {
			startRow: rowIdx,
			startCol: 0,
			endRow: rowIdx,
			endCol: this.tableData.headers.length - 1
		};
		this.updateRangeSelection();
	}

	private selectColumn(colIdx: number) {
		this.selectedRange = {
			startRow: 0,
			startCol: colIdx,
			endRow: this.tableData.rows.length - 1,
			endCol: colIdx
		};
		this.selectedCell = { row: -1, col: colIdx };
		this.updateRangeSelection();
	}

	private selectAll() {
		this.selectedRange = {
			startRow: 0,
			startCol: 0,
			endRow: this.tableData.rows.length - 1,
			endCol: this.tableData.headers.length - 1
		};
		this.updateRangeSelection();
	}

	private updateRangeSelection() {
		// Remove previous selection
		this.tableEl.querySelectorAll('.selected').forEach(el => el.removeClass('selected'));

		if (!this.selectedRange) return;

		const { startRow, startCol, endRow, endCol } = this.selectedRange;

		// Select headers if needed
		if (startRow === 0 && endRow === this.tableData.rows.length - 1) {
			for (let col = startCol; col <= endCol; col++) {
				const th = this.tableEl.querySelector(`thead th:nth-child(${col + 2})`) as HTMLElement;
				th?.addClass('selected');
			}
		}

		// Select cells
		for (let row = startRow; row <= endRow; row++) {
			for (let col = startCol; col <= endCol; col++) {
				const td = this.tableEl.querySelector(`tbody tr:nth-child(${row + 1}) td:nth-child(${col + 2})`) as HTMLElement;
				td?.addClass('selected');
			}
		}
	}

	private toggleFreezeRow() {
		this.freezeFirstRow = !this.freezeFirstRow;
		this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
		new Notice(this.freezeFirstRow ? t('firstRowFrozen') : t('firstRowUnfrozen'));
	}

	private toggleFreezeColumn() {
		this.freezeFirstColumn = !this.freezeFirstColumn;
		this.renderTable(this.contentEl.querySelector('.table-editor-container')!);
		new Notice(this.freezeFirstColumn ? t('firstColumnFrozen') : t('firstColumnUnfrozen'));
	}

	private createButtons(container: HTMLElement) {
		const btnContainer = container.createDiv('table-editor-buttons');

		const saveBtn = btnContainer.createEl('button', { text: t('save'), cls: 'mod-cta' });
		saveBtn.addEventListener('click', async () => {
			await this.onSave(this.tableData);
			new Notice(t('tableSaved'));
			this.close();
		});

		const cancelBtn = btnContainer.createEl('button', { text: t('cancel') });
		cancelBtn.addEventListener('click', () => this.close());
	}

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			/* Modal container */
			.table-editor-modal {
				width: 90vw;
				max-width: 1200px;
				height: 80vh;
			}
			
			/* Content area - flex layout for 3 sections */
			.table-editor-modal .modal-content {
				display: flex;
				flex-direction: column;
				height: 100%;
				padding: 0 !important;
			}
			
			/* Title */
			.table-editor-modal h2 {
				margin: 0;
				padding: 16px 16px 12px 16px;
				flex-shrink: 0;
			}
			
			/* TOP: Fixed toolbar */
			.table-editor-toolbar-sticky {
				flex-shrink: 0;
				padding: 0 16px 16px 16px;
				background: var(--background-primary);
				border-bottom: 2px solid var(--background-modifier-border);
			}
			.table-editor-toolbar {
				display: flex;
				gap: 8px;
				padding: 12px;
				background: var(--background-secondary);
				border-radius: 6px;
				flex-wrap: wrap;
			}
			.table-editor-btn {
				padding: 6px 12px;
				font-size: 13px;
				border-radius: 4px;
				cursor: pointer;
			}
			.toolbar-separator {
				width: 1px;
				background: var(--background-modifier-border);
				margin: 0 4px;
			}
			
			/* MIDDLE: Scrollable table area */
			.table-editor-container {
				flex: 1;
				overflow: auto;
				padding: 16px;
				background: var(--background-primary);
			}
			
			/* BOTTOM: Fixed buttons */
			.table-editor-buttons-sticky {
				flex-shrink: 0;
				padding: 16px;
				background: var(--background-primary);
				border-top: 2px solid var(--background-modifier-border);
			}
			.table-editor-buttons {
				display: flex;
				justify-content: flex-end;
				gap: 8px;
			}
			
			/* Table */
			.table-editor-table {
				border-collapse: collapse;
				width: 100%;
			}
			.table-editor-table th,
			.table-editor-table td {
				border: 1px solid var(--background-modifier-border);
				padding: 8px;
				position: relative;
				min-width: 100px;
			}
			
			/* Sticky header within scrollable container */
			.table-editor-table thead th {
				background: linear-gradient(180deg, var(--background-secondary) 0%, var(--background-secondary-alt) 100%);
				font-weight: 700;
				font-size: 14px;
				color: var(--text-normal);
				border-bottom: 3px solid var(--interactive-accent);
				position: sticky;
				top: 0;
				z-index: 10;
			}
			.table-editor-table tbody td {
				background: var(--background-primary);
			}
			
			/* Corner cell */
			.corner-cell {
				width: 40px !important;
				min-width: 40px !important;
				max-width: 40px !important;
				background: var(--background-modifier-border) !important;
				cursor: pointer;
				position: sticky;
				left: 0;
				z-index: 30 !important;
			}
			
			/* Row number cells */
			.row-number-cell {
				width: 40px !important;
				min-width: 40px !important;
				max-width: 40px !important;
				background: var(--background-secondary-alt) !important;
				text-align: center;
				font-weight: 600;
				color: var(--text-muted);
				cursor: pointer;
				user-select: none;
				position: sticky;
				left: 0;
				z-index: 5;
			}
			
			/* Column number */
			.column-number {
				position: absolute;
				top: 2px;
				left: 2px;
				font-size: 10px;
				color: var(--text-muted);
				cursor: pointer;
				padding: 2px 4px;
				border-radius: 3px;
				background: var(--background-primary-alt);
			}
			.column-number:hover {
				background: var(--interactive-hover);
			}
			
			/* Frozen first column */
			.table-editor-table thead th.frozen-column {
				position: sticky !important;
				left: 40px !important;
				z-index: 25 !important;
				box-shadow: 2px 0 4px rgba(0,0,0,0.1);
			}
			.table-editor-table tbody td.frozen-column {
				position: sticky !important;
				left: 40px !important;
				z-index: 15 !important;
				box-shadow: 2px 0 4px rgba(0,0,0,0.1);
				background: var(--background-primary) !important;
			}
			
			/* Drag handles */
			.row-drag-handle {
				position: absolute;
				left: -20px;
				top: 0;
				width: 18px;
				height: 100%;
				cursor: grab;
				opacity: 0;
				transition: opacity 0.15s, left 0.15s;
				user-select: none;
				color: var(--text-muted);
				font-size: 6px;
				line-height: 8px;
				display: flex;
				align-items: center;
				justify-content: center;
				background: var(--background-secondary-alt);
				border-radius: 4px 0 0 4px;
			}
			.table-editor-table tr:hover .row-drag-handle {
				opacity: 1;
				left: -18px;
			}
			.column-drag-handle {
				position: absolute;
				left: 0;
				top: -18px;
				width: 100%;
				height: 16px;
				cursor: grab;
				opacity: 0;
				transition: opacity 0.15s, top 0.15s;
				user-select: none;
				color: var(--text-muted);
				font-size: 8px;
				display: flex;
				align-items: center;
				justify-content: center;
				background: var(--background-secondary-alt);
				border-radius: 4px 4px 0 0;
			}
			.table-editor-table th:hover .column-drag-handle {
				opacity: 1;
				top: -16px;
			}
			.row-drag-handle:active, .column-drag-handle:active {
				cursor: grabbing;
			}
			
			/* Column resize */
			.column-resize-handle {
				position: absolute;
				top: 0;
				right: 0;
				width: 8px;
				height: 100%;
				cursor: col-resize;
				background: transparent;
				z-index: 10;
			}
			.column-resize-handle:hover {
				background: var(--interactive-accent);
				opacity: 0.3;
			}
			
			/* Drag states */
			.draggable-row:active, .draggable-column:active {
				cursor: grabbing;
			}
			.dragging {
				opacity: 0.5;
				background: var(--interactive-accent) !important;
			}
			.table-editor-table tr.draggable-row:hover {
				background: var(--background-modifier-hover);
			}
			
			/* Cell input */
			.table-cell-input {
				width: 100%;
				border: none;
				background: transparent;
				padding: 6px;
				font-size: 14px;
				text-align: inherit;
				color: var(--text-normal);
			}
			.table-cell-input:focus {
				outline: 2px solid var(--interactive-accent);
				outline-offset: -2px;
			}
			
			/* Selection */
			.table-editor-table .selected {
				background: var(--interactive-accent-hover) !important;
			}
		`;
		document.head.appendChild(style);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
