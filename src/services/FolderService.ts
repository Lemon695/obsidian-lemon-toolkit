import { App, TFolder, TFile, Notice } from 'obsidian';
import { t } from '../i18n/legacy';

/**
 * Folder item interface for tree structure
 */
export interface FolderItem {
	path: string;
	name: string;
	level: number;
	hasChildren: boolean;
	isNewlyCreated: boolean;
	parent?: string;
	fileCount?: number;
}

/**
 * Folder tree state management
 */
export interface FolderTreeState {
	folders: FolderItem[];
	newlyCreatedFolders: Set<string>;
	currentFolder?: string;
}

/**
 * Service for folder operations and management
 */
export class FolderService {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Get all folders in the vault
	 */
	getAllFolders(): TFolder[] {
		return this.app.vault.getAllLoadedFiles()
			.filter((file) => file instanceof TFolder) as TFolder[];
	}

	/**
	 * Build folder tree structure with hierarchy
	 */
	getFolderTree(): FolderItem[] {
		const folders = this.getAllFolders();
		const folderItems: FolderItem[] = [];

		// Sort folders by path to ensure proper hierarchy
		folders.sort((a, b) => a.path.localeCompare(b.path));

		for (const folder of folders) {
			const pathParts = folder.path.split('/');
			const level = pathParts.length;
			const name = pathParts[pathParts.length - 1];
			const parent = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : undefined;

			// Check if folder has children
			const hasChildren = folders.some(f => 
				f.path !== folder.path && f.path.startsWith(folder.path + '/')
			);

			// Count files in this folder (direct children only)
			const fileCount = this.getFileCountInFolder(folder.path);

			folderItems.push({
				path: folder.path,
				name: name,
				level: level,
				hasChildren: hasChildren,
				isNewlyCreated: false,
				parent: parent,
				fileCount: fileCount
			});
		}

		return folderItems;
	}

	/**
	 * Get file count in a specific folder (direct children only)
	 */
	getFileCountInFolder(folderPath: string): number {
		const allFiles = this.app.vault.getAllLoadedFiles();
		return allFiles.filter(file => {
			if (file instanceof TFolder) return false; // Don't count subfolders
			
			const fileParentPath = file.parent?.path || '';
			return fileParentPath === folderPath;
		}).length;
	}

	/**
	 * Create a new folder at the specified path
	 */
	async createFolder(parentPath: string, folderName: string): Promise<TFolder> {
		const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;

		// Validate folder name
		if (!this.validateFolderName(folderName)) {
			throw new Error(t('invalidFolderName'));
		}

		// Check if folder already exists
		const existingFolder = this.app.vault.getAbstractFileByPath(fullPath);
		if (existingFolder) {
			throw new Error(t('folderExists'));
		}

		try {
			const newFolder = await this.app.vault.createFolder(fullPath);
			new Notice(t('folderCreated'));
			return newFolder;
		} catch (error) {
			console.error('Failed to create folder:', error);
			throw new Error(t('folderCreationFailed'));
		}
	}

	/**
	 * Navigate to folder in file explorer
	 */
	navigateToFolder(folderPath: string): void {
		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		if (folder instanceof TFolder) {
			// Reveal folder in file explorer
			(this.app as any).fileManager?.revealInFolder?.(folder);
		}
	}

	/**
	 * Get current file's folder path
	 */
	getCurrentFolderPath(): string | undefined {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			return activeFile.parent?.path || '';
		}
		return undefined;
	}

	/**
	 * Validate folder name
	 */
	validateFolderName(name: string): boolean {
		if (!name || name.trim().length === 0) {
			return false;
		}

		// Check for invalid characters
		const invalidChars = /[<>:"/\\|?*]/;
		if (invalidChars.test(name)) {
			return false;
		}

		// Check for reserved names (Windows)
		const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
		if (reservedNames.includes(name.toUpperCase())) {
			return false;
		}

		// Check length (reasonable limit)
		if (name.length > 255) {
			return false;
		}

		return true;
	}

	/**
	 * Get folder statistics
	 */
	getFolderStats(): { totalFolders: number; maxDepth: number } {
		const folders = this.getAllFolders();
		const maxDepth = Math.max(...folders.map(f => f.path.split('/').length), 0);
		
		return {
			totalFolders: folders.length,
			maxDepth: maxDepth
		};
	}
}