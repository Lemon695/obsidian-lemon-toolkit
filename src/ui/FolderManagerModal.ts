import { App, Modal } from 'obsidian';
import { FolderService, FolderItem, FolderTreeState } from '../services/FolderService';
import { CreateFolderModal } from './CreateFolderModal';
import { t } from '../i18n/legacy';

/**
 * Main folder manager modal window
 */
export class FolderManagerModal extends Modal {
	private folderService: FolderService;
	private treeState: FolderTreeState;
	private treeContainer: HTMLElement;
	private searchInput: HTMLInputElement;
	private filteredFolders: FolderItem[];

	constructor(app: App) {
		super(app);
		this.folderService = new FolderService(app);
		this.treeState = {
			folders: [],
			newlyCreatedFolders: new Set(),
			currentFolder: undefined
		};
		this.filteredFolders = [];
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		contentEl.empty();
		contentEl.addClass('lemon-folder-manager-modal');

		// Set modal dimensions
		if (modalEl) {
			modalEl.style.width = '800px';
			modalEl.style.maxWidth = '95vw';
			modalEl.style.height = '700px';
			modalEl.style.maxHeight = '90vh';
			modalEl.style.minHeight = '600px';
		}

		// Set modal title
		this.titleEl.setText(t('folderManagerTitle'));

		// Create header with stats
		this.createHeader();

		// Create search bar
		this.createSearchBar();

		// Create folder tree container
		this.treeContainer = contentEl.createDiv({ cls: 'lemon-folder-tree' });

		// Initialize and render folder tree
		this.initializeFolderTree();
		this.renderFolderTree();

		// Setup keyboard navigation
		this.setupKeyboardNavigation();
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
		// Clear newly created folders state when modal closes
		this.treeState.newlyCreatedFolders.clear();
	}

	/**
	 * Create header with folder statistics
	 */
	private createHeader(): void {
		const header = this.contentEl.createDiv({ cls: 'lemon-folder-manager-header' });
		
		const stats = this.folderService.getFolderStats();
		const statsText = header.createDiv({ cls: 'lemon-folder-stats' });
		statsText.setText(t('folderStats', { 
			total: stats.totalFolders.toString(), 
			depth: stats.maxDepth.toString() 
		}));
	}

	/**
	 * Create search bar
	 */
	private createSearchBar(): void {
		const searchContainer = this.contentEl.createDiv({ cls: 'lemon-folder-search-container' });
		
		this.searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: t('searchFolders'),
			cls: 'lemon-folder-search-input'
		});

		// Add search icon
		const searchIcon = searchContainer.createDiv({ cls: 'lemon-folder-search-icon' });
		searchIcon.setText('🔍');

		// Add clear button
		const clearBtn = searchContainer.createDiv({ cls: 'lemon-folder-search-clear' });
		clearBtn.setText('×');
		clearBtn.style.display = 'none';

		// Search input handler
		this.searchInput.addEventListener('input', () => {
			const query = this.searchInput.value.trim();
			
			if (query) {
				clearBtn.style.display = 'block';
				this.filterFolders(query);
			} else {
				clearBtn.style.display = 'none';
				this.filteredFolders = [];
				this.renderFolderTree();
			}
		});

		// Clear button handler
		clearBtn.addEventListener('click', () => {
			this.searchInput.value = '';
			clearBtn.style.display = 'none';
			this.filteredFolders = [];
			this.renderFolderTree();
			this.searchInput.focus();
		});

		// Keyboard shortcuts
		this.searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				if (this.searchInput.value) {
					this.searchInput.value = '';
					clearBtn.style.display = 'none';
					this.filteredFolders = [];
					this.renderFolderTree();
				} else {
					this.close();
				}
			}
		});
	}

	/**
	 * Initialize folder tree state
	 */
	private initializeFolderTree(): void {
		this.treeState.folders = this.folderService.getFolderTree();
		this.treeState.currentFolder = this.folderService.getCurrentFolderPath();

		// Mark newly created folders
		this.treeState.folders.forEach(folder => {
			folder.isNewlyCreated = this.treeState.newlyCreatedFolders.has(folder.path);
		});
	}

	/**
	 * Render the folder tree
	 */
	private renderFolderTree(): void {
		this.treeContainer.empty();

		const isSearching = this.searchInput && this.searchInput.value.trim().length > 0;
		
		// Determine which folders to show based on search state
		let foldersToShow: FolderItem[];
		if (isSearching) {
			// When searching, only show filtered results (could be empty)
			foldersToShow = this.filteredFolders;
		} else {
			// When not searching, show all folders
			foldersToShow = this.treeState.folders;
		}

		if (foldersToShow.length === 0) {
			const emptyState = this.treeContainer.createDiv({ cls: 'lemon-folder-empty' });
			emptyState.setText(isSearching ? t('noFoldersMatchSearch') : t('noFoldersFound'));
			return;
		}

		// Add root folder option (only when not searching or when search results include root-level folders)
		if (!isSearching) {
			this.renderRootFolder();
		} else {
			// When searching, show root folder if any results are at root level or have root-level parents
			const hasRootLevelResults = foldersToShow.some(folder => folder.level === 1);
			if (hasRootLevelResults) {
				this.renderRootFolder();
			}
		}

		// Render folders with proper hierarchy
		foldersToShow.forEach(folder => {
			this.renderFolderItem(folder, false); // Always use hierarchical display
		});

		// Show search results count
		if (isSearching) {
			const searchInfo = this.treeContainer.createDiv({ cls: 'lemon-folder-search-info' });
			searchInfo.setText(t('searchResults', { count: foldersToShow.length.toString() }));
		}
	}

	/**
	 * Render root folder item
	 */
	private renderRootFolder(): void {
		const item = this.treeContainer.createDiv({ cls: 'lemon-folder-item lemon-folder-root' });
		
		const nameContainer = item.createDiv({ cls: 'lemon-folder-name-container' });
		
		const bullet = nameContainer.createSpan({ cls: 'lemon-folder-bullet' });
		bullet.setText('📁');

		const name = nameContainer.createSpan({ cls: 'lemon-folder-name' });
		name.setText(t('rootFolder'));

		// Add create button for root
		const addBtn = item.createSpan({ cls: 'lemon-folder-add-btn' });
		addBtn.setText('+');
		addBtn.setAttribute('title', t('createSubfolder'));

		// Event handlers
		nameContainer.addEventListener('click', () => {
			this.handleFolderClick('');
		});

		addBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.handleCreateFolder('');
		});

		// Highlight if current folder
		if (this.treeState.currentFolder === '' || this.treeState.currentFolder === undefined) {
			item.addClass('lemon-folder-current');
		}
	}

	/**
	 * Render individual folder item
	 */
	private renderFolderItem(folder: FolderItem, isSearchResult: boolean = false): void {
		const item = this.treeContainer.createDiv({ cls: 'lemon-folder-item' });
		item.setAttribute('data-level', folder.level.toString());
		
		// Always use hierarchical padding based on folder level
		const paddingLeft = folder.level * 20;
		item.style.paddingLeft = `${paddingLeft}px`;

		// Add newly created class if applicable
		if (folder.isNewlyCreated) {
			item.addClass('lemon-folder-item-new');
		}

		const nameContainer = item.createDiv({ cls: 'lemon-folder-name-container' });
		
		const bullet = nameContainer.createSpan({ cls: 'lemon-folder-bullet' });
		bullet.setText('📁');

		const nameAndPath = nameContainer.createDiv({ cls: 'lemon-folder-name-section' });
		
		const name = nameAndPath.createSpan({ cls: 'lemon-folder-name' });
		name.setText(folder.name);

		// Add file count
		const fileCount = nameContainer.createSpan({ cls: 'lemon-folder-file-count' });
		const count = folder.fileCount || 0;
		fileCount.setText(`(${count})`);
		fileCount.setAttribute('title', t('fileCountTooltip', { count: count.toString() }));

		// Add create button
		const addBtn = item.createSpan({ cls: 'lemon-folder-add-btn' });
		addBtn.setText('+');
		addBtn.setAttribute('title', t('createSubfolder'));

		// Event handlers
		nameContainer.addEventListener('click', () => {
			this.handleFolderClick(folder.path);
		});

		addBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.handleCreateFolder(folder.path);
		});

		// Highlight if current folder
		if (this.treeState.currentFolder === folder.path) {
			item.addClass('lemon-folder-current');
		}

		// Add hover effects
		item.addEventListener('mouseenter', () => {
			item.addClass('lemon-folder-hover');
		});

		item.addEventListener('mouseleave', () => {
			item.removeClass('lemon-folder-hover');
		});
	}

	/**
	 * Handle folder click for navigation
	 */
	private handleFolderClick(folderPath: string): void {
		this.folderService.navigateToFolder(folderPath);
		this.close();
	}

	/**
	 * Handle create folder button click
	 */
	private handleCreateFolder(parentPath: string): void {
		const createModal = new CreateFolderModal(
			this.app,
			parentPath,
			(newFolderPath: string) => {
				// Add to newly created folders set
				this.treeState.newlyCreatedFolders.add(newFolderPath);
				// Refresh the tree
				this.refreshTree();
			}
		);
		createModal.open();
	}

	/**
	 * Refresh the folder tree display
	 */
	private refreshTree(): void {
		// Add a small delay to ensure the file system has been updated
		setTimeout(() => {
			this.initializeFolderTree();
			
			// If we're currently searching, reapply the search filter
			const isSearching = this.searchInput && this.searchInput.value.trim().length > 0;
			if (isSearching) {
				const query = this.searchInput.value.trim();
				this.filterFolders(query);
			} else {
				this.renderFolderTree();
			}
		}, 100);
	}

	/**
	 * Filter folders based on search query
	 */
	private filterFolders(query: string): void {
		const lowerQuery = query.toLowerCase();
		
		// Find all folders that match the search query
		const matchingFolders = this.treeState.folders.filter(folder => 
			folder.name.toLowerCase().includes(lowerQuery) ||
			folder.path.toLowerCase().includes(lowerQuery)
		);

		// Build a set of all folders that should be shown (matches + their parents)
		const foldersToShow = new Set<string>();
		
		// Add all matching folders and their parent paths
		matchingFolders.forEach(folder => {
			// Add the matching folder itself
			foldersToShow.add(folder.path);
			
			// Add all parent folders
			const pathParts = folder.path.split('/');
			for (let i = 1; i < pathParts.length; i++) {
				const parentPath = pathParts.slice(0, i).join('/');
				foldersToShow.add(parentPath);
			}
		});

		// Filter the original folder list to only include folders in our set
		this.filteredFolders = this.treeState.folders.filter(folder => 
			foldersToShow.has(folder.path)
		);

		// Sort to maintain proper hierarchy order
		this.filteredFolders.sort((a, b) => a.path.localeCompare(b.path));

		this.renderFolderTree();
	}

	/**
	 * Setup keyboard navigation
	 */
	private setupKeyboardNavigation(): void {
		this.scope.register([], 'Escape', () => {
			this.close();
		});

		// Add more keyboard shortcuts as needed
		this.scope.register(['Mod'], 'n', () => {
			// Create folder in current directory
			const currentPath = this.treeState.currentFolder || '';
			this.handleCreateFolder(currentPath);
		});

		// Focus search with Ctrl+F
		this.scope.register(['Mod'], 'f', () => {
			this.searchInput.focus();
		});
	}
}