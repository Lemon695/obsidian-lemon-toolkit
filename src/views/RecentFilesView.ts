import { ItemView, WorkspaceLeaf, TFile, Menu, Notice } from "obsidian";
import LemonToolkitPlugin from "../main";

export const RECENT_FILES_VIEW_TYPE = "lemon-recent-files-view";

interface FileRecord {
	path: string;
	timestamp: number;
	isPinned?: boolean;
}

interface RecentFilesData {
	edited: FileRecord[];
	viewed: FileRecord[];
	created: FileRecord[];
	pinned: string[];
}

type TabType = "edited" | "viewed" | "created";

export class RecentFilesView extends ItemView {
	private plugin: LemonToolkitPlugin;
	private data: RecentFilesData;
	private currentTab: TabType = "edited";
	private contentContainer: HTMLElement;

	constructor(leaf: WorkspaceLeaf, plugin: LemonToolkitPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.data = {
			edited: [],
			viewed: [],
			created: [],
			pinned: [],
		};
	}

	getViewType(): string {
		return RECENT_FILES_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Recent Files";
	}

	getIcon(): string {
		return "clock";
	}

	async onOpen(): Promise<void> {
		await this.loadData();
		this.render();
		this.registerEvents();
	}

	async onClose(): Promise<void> {
		await this.saveData();
	}

	private async loadData(): Promise<void> {
		const saved = await this.plugin.loadData();
		if (saved?.recentFiles) {
			this.data = saved.recentFiles;
		}
	}

	private async saveData(): Promise<void> {
		const pluginData = await this.plugin.loadData() || {};
		pluginData.recentFiles = this.data;
		await this.plugin.saveData(pluginData);
	}

	private registerEvents(): void {
		// Track file modifications
		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (file instanceof TFile) {
					this.trackFileEdit(file);
				}
			})
		);

		// Track file creation
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				if (file instanceof TFile) {
					this.trackFileCreation(file);
				}
			})
		);

		// Track file opens (views)
		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				if (file) {
					this.trackFileView(file);
				}
			})
		);
	}

	private trackFileEdit(file: TFile): void {
		this.addOrUpdateRecord(this.data.edited, file.path);
		this.saveData();
		if (this.currentTab === "edited") {
			this.renderFileList();
		}
	}

	private trackFileView(file: TFile): void {
		this.addOrUpdateRecord(this.data.viewed, file.path);
		this.saveData();
		if (this.currentTab === "viewed") {
			this.renderFileList();
		}
	}

	private trackFileCreation(file: TFile): void {
		this.addOrUpdateRecord(this.data.created, file.path);
		this.saveData();
		if (this.currentTab === "created") {
			this.renderFileList();
		}
	}

	private addOrUpdateRecord(records: FileRecord[], path: string): void {
		const existingIndex = records.findIndex((r) => r.path === path);
		const record: FileRecord = {
			path,
			timestamp: Date.now(),
			isPinned: this.data.pinned.includes(path),
		};

		if (existingIndex >= 0) {
			records[existingIndex] = record;
		} else {
			records.unshift(record);
		}

		// Keep only last 50 records
		if (records.length > 50) {
			records.splice(50);
		}
	}

	private render(): void {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("lemon-recent-files-view");

		// Header
		const header = container.createDiv({ cls: "lemon-recent-header" });
		header.createEl("h4", { text: "Recent Files" });

		// Tabs
		const tabsContainer = container.createDiv({ cls: "lemon-recent-tabs" });
		this.renderTabs(tabsContainer);

		// Content
		this.contentContainer = container.createDiv({ cls: "lemon-recent-content" });
		this.renderFileList();
	}

	private renderTabs(container: HTMLElement): void {
		const tabs: { type: TabType; label: string; icon: string }[] = [
			{ type: "edited", label: "Recently Edited", icon: "pencil" },
			{ type: "viewed", label: "Recently Viewed", icon: "eye" },
			{ type: "created", label: "Recently Created", icon: "file-plus" },
		];

		tabs.forEach((tab) => {
			const tabEl = container.createDiv({ cls: "lemon-recent-tab" });
			if (this.currentTab === tab.type) {
				tabEl.addClass("lemon-recent-tab-active");
			}

			const icon = tabEl.createSpan({ cls: "lemon-tab-icon" });
			icon.innerHTML = this.getIconSvg(tab.icon);

			tabEl.createSpan({ text: tab.label, cls: "lemon-tab-label" });

			tabEl.addEventListener("click", () => {
				this.currentTab = tab.type;
				this.render();
			});
		});
	}

	private renderFileList(): void {
		this.contentContainer.empty();

		const records = this.getCurrentRecords();
		
		// Separate pinned and unpinned
		const pinnedRecords = records.filter((r) => this.data.pinned.includes(r.path));
		const unpinnedRecords = records.filter((r) => !this.data.pinned.includes(r.path));

		// Render pinned section
		if (pinnedRecords.length > 0) {
			const pinnedSection = this.contentContainer.createDiv({ cls: "lemon-recent-section" });
			pinnedSection.createDiv({ text: "Pinned", cls: "lemon-section-title" });
			pinnedRecords.forEach((record) => this.renderFileItem(pinnedSection, record, true));
		}

		// Render recent section
		if (unpinnedRecords.length > 0) {
			const recentSection = this.contentContainer.createDiv({ cls: "lemon-recent-section" });
			if (pinnedRecords.length > 0) {
				recentSection.createDiv({ text: "Recent", cls: "lemon-section-title" });
			}
			unpinnedRecords.forEach((record) => this.renderFileItem(recentSection, record, false));
		}

		// Empty state
		if (records.length === 0) {
			const empty = this.contentContainer.createDiv({ cls: "lemon-recent-empty" });
			empty.createDiv({ text: "No recent files", cls: "lemon-empty-title" });
			empty.createDiv({ 
				text: "Files you work with will appear here", 
				cls: "lemon-empty-desc" 
			});
		}
	}

	private renderFileItem(container: HTMLElement, record: FileRecord, isPinned: boolean): void {
		const file = this.app.vault.getAbstractFileByPath(record.path);
		if (!(file instanceof TFile)) return;

		const item = container.createDiv({ cls: "lemon-recent-item" });

		// Pin icon
		const pinIcon = item.createDiv({ cls: "lemon-pin-icon" });
		pinIcon.innerHTML = isPinned ? this.getIconSvg("pin") : "";
		if (isPinned) {
			pinIcon.addClass("lemon-pin-active");
		}

		// File info
		const info = item.createDiv({ cls: "lemon-file-info" });
		
		const nameEl = info.createDiv({ text: file.basename, cls: "lemon-file-name" });
		
		const meta = info.createDiv({ cls: "lemon-file-meta" });
		const timeStr = this.formatTime(record.timestamp);
		meta.createSpan({ text: timeStr, cls: "lemon-file-time" });
		
		if (file.parent && file.parent.path !== "/") {
			meta.createSpan({ text: " • ", cls: "lemon-separator" });
			meta.createSpan({ text: file.parent.path, cls: "lemon-file-path" });
		}

		// Click to open
		item.addEventListener("click", () => {
			this.app.workspace.getLeaf().openFile(file);
		});

		// Right-click menu
		item.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			this.showContextMenu(e, file, isPinned);
		});
	}

	private showContextMenu(e: MouseEvent, file: TFile, isPinned: boolean): void {
		const menu = new Menu();

		// Pin/Unpin
		menu.addItem((item) => {
			item
				.setTitle(isPinned ? "Unpin" : "Pin to top")
				.setIcon(isPinned ? "pin-off" : "pin")
				.onClick(() => {
					this.togglePin(file.path);
				});
		});

		menu.addSeparator();

		// Open in new tab
		menu.addItem((item) => {
			item
				.setTitle("Open in new tab")
				.setIcon("file-plus")
				.onClick(() => {
					this.app.workspace.getLeaf("tab").openFile(file);
				});
		});

		// Reveal in navigation
		menu.addItem((item) => {
			item
				.setTitle("Reveal in navigation")
				.setIcon("folder-open")
				.onClick(() => {
					this.app.workspace.trigger("reveal-active-file");
				});
		});

		menu.addSeparator();

		// Move file
		menu.addItem((item) => {
			item
				.setTitle("Move file")
				.setIcon("folder-input")
				.onClick(() => {
					// Trigger Obsidian's built-in move file modal
					(this.app as any).fileManager.promptForFileMove(file);
				});
		});

		// Delete file
		menu.addItem((item) => {
			item
				.setTitle("Delete")
				.setIcon("trash")
				.onClick(async () => {
					const confirmed = await this.confirmDelete(file);
					if (confirmed) {
						await this.app.vault.delete(file);
						this.removeFileFromRecords(file.path);
						this.renderFileList();
						new Notice(`Deleted ${file.basename}`);
					}
				});
		});

		menu.showAtMouseEvent(e);
	}

	private togglePin(path: string): void {
		const index = this.data.pinned.indexOf(path);
		if (index >= 0) {
			this.data.pinned.splice(index, 1);
		} else {
			this.data.pinned.push(path);
		}
		this.saveData();
		this.renderFileList();
	}

	private async confirmDelete(file: TFile): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new (this.app as any).ConfirmationModal(
				this.app,
				`Are you sure you want to delete "${file.basename}"?`,
				"Delete",
				(result: boolean) => resolve(result)
			);
			modal.open();
		});
	}

	private removeFileFromRecords(path: string): void {
		this.data.edited = this.data.edited.filter((r) => r.path !== path);
		this.data.viewed = this.data.viewed.filter((r) => r.path !== path);
		this.data.created = this.data.created.filter((r) => r.path !== path);
		this.data.pinned = this.data.pinned.filter((p) => p !== path);
		this.saveData();
	}

	private getCurrentRecords(): FileRecord[] {
		return this.data[this.currentTab] || [];
	}

	private formatTime(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return "Just now";
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		
		const date = new Date(timestamp);
		return date.toLocaleDateString();
	}

	private getIconSvg(icon: string): string {
		const icons: Record<string, string> = {
			pencil: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>',
			eye: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
			"file-plus": '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>',
			pin: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>',
		};
		return icons[icon] || "";
	}
}
