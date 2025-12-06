import { App, Modal, Notice, Setting } from "obsidian";
import LemonToolkitPlugin from "../main";
import { ExternalApp } from "../settings";
import { t } from "../i18n/locale";

export class ExternalAppsSettingModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private apps: ExternalApp[];
	private contentContainer: HTMLElement;

	constructor(app: App, plugin: LemonToolkitPlugin) {
		super(app);
		this.plugin = plugin;
		this.apps = [...plugin.externalAppManager.getApps()];
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lemon-external-apps-modal");

		// Header
		const header = contentEl.createDiv({ cls: "lemon-modal-header" });
		header.style.padding = "16px 24px";
		header.style.borderBottom = "1px solid var(--background-modifier-border)";

		const title = header.createEl("h2", { text: t('manageExternalApplications') });
		title.style.margin = "0";

		// Description
		const desc = contentEl.createDiv({ cls: "lemon-modal-desc" });
		desc.style.padding = "12px 24px";
		desc.style.color = "var(--text-muted)";
		desc.textContent = t('externalAppsModalDesc');

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

		const addBtn = addContainer.createEl("button", { text: t('addApplication') });
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

		const cancelBtn = footer.createEl("button", { text: t('cancel') });
		cancelBtn.addEventListener("click", () => this.close());

		const saveBtn = footer.createEl("button", { text: t('save'), cls: "mod-cta" });
		saveBtn.addEventListener("click", () => this.save());
	}

	private renderAppsList(): void {
		this.contentContainer.empty();

		if (this.apps.length === 0) {
			const emptyMsg = this.contentContainer.createDiv();
			emptyMsg.style.padding = "32px";
			emptyMsg.style.textAlign = "center";
			emptyMsg.style.color = "var(--text-muted)";
			emptyMsg.textContent = t('noExternalAppsConfigured');
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
			.setName(t('applicationName'))
			.addText((text) =>
				text
					.setPlaceholder(t('applicationNamePlaceholder'))
					.setValue(app.name)
					.onChange((value) => {
						app.name = value;
					})
			);

		// App path
		new Setting(item)
			.setName(t('applicationPath'))
			.setDesc(t('applicationPathDesc'))
			.addText((text) => {
				text
					.setPlaceholder(t('applicationPathPlaceholder'))
					.setValue(app.path)
					.onChange((value) => {
						app.path = value;
					});
				text.inputEl.style.width = "100%";
			});

		// Options
		new Setting(item)
			.setName(t('canOpenFiles'))
			.addToggle((toggle) =>
				toggle.setValue(app.openFile).onChange((value) => {
					app.openFile = value;
				})
			);

		new Setting(item)
			.setName(t('canOpenFolders'))
			.addToggle((toggle) =>
				toggle.setValue(app.openFolder).onChange((value) => {
					app.openFolder = value;
				})
			);

		// Delete button
		const deleteContainer = item.createDiv();
		deleteContainer.style.marginTop = "8px";
		deleteContainer.style.textAlign = "right";

		const deleteBtn = deleteContainer.createEl("button", { text: t('delete') });
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
				new Notice(t('fillAllAppFields'));
				return;
			}
		}

		// Save to external app manager
		this.plugin.externalAppManager.setApps(this.apps);
		await this.plugin.externalAppManager.save();

		// Re-register commands
		this.plugin.reloadExternalAppCommands();

		new Notice(t('externalAppsSaved'));
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
