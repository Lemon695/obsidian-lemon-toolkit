import { App, Modal, Notice, Setting } from "obsidian";
import LemonToolkitPlugin from "../main";
import { ExternalApp } from "../settings";

export class ExternalAppsSettingModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private apps: ExternalApp[];
	private contentContainer: HTMLElement;

	constructor(app: App, plugin: LemonToolkitPlugin) {
		super(app);
		this.plugin = plugin;
		this.apps = [...plugin.settings.externalApps];
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lemon-external-apps-modal");

		// Header
		const header = contentEl.createDiv({ cls: "lemon-modal-header" });
		header.style.padding = "16px 24px";
		header.style.borderBottom = "1px solid var(--background-modifier-border)";

		const title = header.createEl("h2", { text: "Manage External Applications" });
		title.style.margin = "0";

		// Description
		const desc = contentEl.createDiv({ cls: "lemon-modal-desc" });
		desc.style.padding = "12px 24px";
		desc.style.color = "var(--text-muted)";
		desc.textContent = "Configure external applications to open files and folders.";

		// Apps list
		this.contentContainer = contentEl.createDiv({ cls: "lemon-apps-list" });
		this.contentContainer.style.padding = "16px 24px";
		this.contentContainer.style.maxHeight = "400px";
		this.contentContainer.style.overflowY = "auto";

		this.renderAppsList();

		// Add button
		const addContainer = contentEl.createDiv({ cls: "lemon-add-app" });
		addContainer.style.padding = "8px 24px";
		addContainer.style.borderTop = "1px solid var(--background-modifier-border)";

		const addBtn = addContainer.createEl("button", { text: "+ Add Application" });
		addBtn.style.width = "100%";
		addBtn.style.padding = "8px";
		addBtn.style.cursor = "pointer";
		addBtn.addEventListener("click", () => this.addNewApp());

		// Footer
		const footer = contentEl.createDiv({ cls: "lemon-modal-footer" });
		footer.style.display = "flex";
		footer.style.justifyContent = "flex-end";
		footer.style.gap = "8px";
		footer.style.padding = "16px 24px";
		footer.style.borderTop = "1px solid var(--background-modifier-border)";

		const cancelBtn = footer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const saveBtn = footer.createEl("button", { text: "Save", cls: "mod-cta" });
		saveBtn.addEventListener("click", () => this.save());
	}

	private renderAppsList(): void {
		this.contentContainer.empty();

		if (this.apps.length === 0) {
			const emptyMsg = this.contentContainer.createDiv();
			emptyMsg.style.padding = "32px";
			emptyMsg.style.textAlign = "center";
			emptyMsg.style.color = "var(--text-muted)";
			emptyMsg.textContent = "No external applications configured. Click 'Add Application' to add one.";
			return;
		}

		this.apps.forEach((app, index) => {
			this.renderAppItem(app, index);
		});
	}

	private renderAppItem(app: ExternalApp, index: number): void {
		const item = this.contentContainer.createDiv({ cls: "lemon-app-item" });
		item.style.padding = "12px";
		item.style.marginBottom = "8px";
		item.style.backgroundColor = "var(--background-secondary)";
		item.style.borderRadius = "4px";

		// App name
		new Setting(item)
			.setName("Application name")
			.addText((text) =>
				text
					.setPlaceholder("e.g., VS Code")
					.setValue(app.name)
					.onChange((value) => {
						app.name = value;
					})
			);

		// App path
		new Setting(item)
			.setName("Application path")
			.setDesc("Full path to the application executable")
			.addText((text) => {
				text
					.setPlaceholder("e.g., /Applications/Visual Studio Code.app")
					.setValue(app.path)
					.onChange((value) => {
						app.path = value;
					});
				text.inputEl.style.width = "100%";
			});

		// Options
		new Setting(item)
			.setName("Can open files")
			.addToggle((toggle) =>
				toggle.setValue(app.openFile).onChange((value) => {
					app.openFile = value;
				})
			);

		new Setting(item)
			.setName("Can open folders")
			.addToggle((toggle) =>
				toggle.setValue(app.openFolder).onChange((value) => {
					app.openFolder = value;
				})
			);

		// Delete button
		const deleteContainer = item.createDiv();
		deleteContainer.style.marginTop = "8px";
		deleteContainer.style.textAlign = "right";

		const deleteBtn = deleteContainer.createEl("button", { text: "Delete" });
		deleteBtn.style.color = "var(--text-error)";
		deleteBtn.style.cursor = "pointer";
		deleteBtn.addEventListener("click", () => {
			this.apps.splice(index, 1);
			this.renderAppsList();
		});
	}

	private addNewApp(): void {
		const newApp: ExternalApp = {
			id: `app-${Date.now()}`,
			name: "",
			path: "",
			openFile: true,
			openFolder: false,
		};

		this.apps.push(newApp);
		this.renderAppsList();
	}

	private async save(): Promise<void> {
		// Validate apps
		for (const app of this.apps) {
			if (!app.name || !app.path) {
				new Notice("Please fill in all application names and paths");
				return;
			}
		}

		// Save to settings
		this.plugin.settings.externalApps = this.apps;
		await this.plugin.saveSettings();

		// Re-register commands
		this.plugin.reloadExternalAppCommands();

		new Notice("External applications saved");
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
