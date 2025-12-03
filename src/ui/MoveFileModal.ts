import { App, FuzzySuggestModal, Notice, TFile, TFolder } from "obsidian";
import LemonToolkitPlugin from "../main";

interface FolderItem {
	path: string;
	displayName: string;
	moveCount?: number;
	lastMoved?: number;
}

export class MoveFileModal extends FuzzySuggestModal<FolderItem> {
	private plugin: LemonToolkitPlugin;
	private file: TFile;
	private allFolders: FolderItem[];

	constructor(plugin: LemonToolkitPlugin, file: TFile) {
		super(plugin.app);
		this.plugin = plugin;
		this.file = file;
		this.allFolders = [];
		
		this.setPlaceholder("Type to filter folders...");
		this.setInstructions([
			{ command: "↑↓", purpose: "to navigate" },
			{ command: "↵", purpose: "to move file" },
			{ command: "esc", purpose: "to dismiss" },
		]);
	}

	getItems(): FolderItem[] {
		// Get all folders in vault
		const folders = this.app.vault.getAllLoadedFiles()
			.filter((f) => f instanceof TFolder) as TFolder[];

		// Build folder items with history data
		this.allFolders = folders.map((folder) => {
			const path = folder.path;
			const history = this.plugin.settings.folderMoveHistory[path];
			
			return {
				path: path,
				displayName: path || "(Root)",
				moveCount: history?.count || 0,
				lastMoved: history?.lastMoved || 0,
			};
		});

		// Add root folder
		this.allFolders.unshift({
			path: "",
			displayName: "(Root)",
			moveCount: this.plugin.settings.folderMoveHistory[""]?.count || 0,
			lastMoved: this.plugin.settings.folderMoveHistory[""]?.lastMoved || 0,
		});

		// Sort based on settings
		this.sortFolders();

		return this.allFolders;
	}

	private sortFolders(): void {
		const sortType = this.plugin.settings.folderSortType;

		if (sortType === "recent") {
			// Sort by most recently used
			this.allFolders.sort((a, b) => (b.lastMoved || 0) - (a.lastMoved || 0));
		} else {
			// Sort by frequency (count) in time period
			const now = Date.now();
			const timeWindow = this.getTimeWindow(sortType);

			this.allFolders.sort((a, b) => {
				const aCount = this.getCountInWindow(a.path, now, timeWindow);
				const bCount = this.getCountInWindow(b.path, now, timeWindow);
				return bCount - aCount;
			});
		}
	}

	private getTimeWindow(sortType: string): number {
		switch (sortType) {
			case "day":
				return 24 * 60 * 60 * 1000; // 1 day
			case "week":
				return 7 * 24 * 60 * 60 * 1000; // 1 week
			case "month":
				return 30 * 24 * 60 * 60 * 1000; // 30 days
			default:
				return 0;
		}
	}

	private getCountInWindow(path: string, now: number, timeWindow: number): number {
		const history = this.plugin.settings.folderMoveHistory[path];
		if (!history || !history.timestamps) return 0;

		if (timeWindow === 0) {
			return history.count || 0;
		}

		return history.timestamps.filter((ts) => now - ts < timeWindow).length;
	}

	getItemText(item: FolderItem): string {
		return item.displayName;
	}

	async onChooseItem(item: FolderItem): Promise<void> {
		try {
			const newPath = item.path ? `${item.path}/${this.file.name}` : this.file.name;
			
			// Check if file already exists
			const existingFile = this.app.vault.getAbstractFileByPath(newPath);
			if (existingFile) {
				new Notice(`File already exists in ${item.displayName}`);
				return;
			}

			// Move the file
			await this.app.fileManager.renameFile(this.file, newPath);
			
			// Update history (will be recorded by the event listener, but we update it here too for immediate feedback)
			await this.plugin.recordFolderMove(item.path);
			
			new Notice(`Moved to: ${item.displayName}`);
		} catch (error) {
			new Notice(`Failed to move file: ${error.message}`);
			console.error("Move file error:", error);
		}
	}
}
