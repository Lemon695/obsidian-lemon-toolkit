import { App, Modal, Notice, TFile, Setting } from "obsidian";
import LemonToolkitPlugin from "../../main";
import { FieldData, FieldType } from "./types";
import { inferFieldType, getTypeIcon, convertValueToType } from "./utils/typeInference";
import { replaceVariables } from "./utils/variableReplacer";

export class FrontmatterEditorModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private file: TFile;
	private fields: Map<string, FieldData>;
	private originalFrontmatter: Record<string, any>;
	private hasUnsavedChanges: boolean = false;
	private searchQuery: string = "";
	private contentContainer: HTMLElement;

	constructor(app: App, plugin: LemonToolkitPlugin, file: TFile) {
		super(app);
		this.plugin = plugin;
		this.file = file;
		this.fields = new Map();
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lemon-frontmatter-editor");

		// Load frontmatter
		await this.loadFrontmatter();

		// Render modal
		this.renderHeader();
		this.renderSearchBar();
		this.contentContainer = contentEl.createDiv({ cls: "lemon-fm-content" });
		this.renderFields();
		this.renderAddFieldButton();
		this.renderQuickActions();
		this.renderFooter();
	}

	private async loadFrontmatter(): Promise<void> {
		const cache = this.app.metadataCache.getFileCache(this.file);
		this.originalFrontmatter = cache?.frontmatter || {};

		// Convert to FieldData
		Object.entries(this.originalFrontmatter).forEach(([key, value]) => {
			if (key === "position") return; // Skip internal field

			this.fields.set(key, {
				key,
				value,
				type: inferFieldType(value),
				isModified: false,
				isDeleted: false,
				isNew: false,
			});
		});
	}

	private renderHeader(): void {
		const header = this.contentEl.createDiv({ cls: "lemon-fm-header" });
		header.style.display = "flex";
		header.style.justifyContent = "space-between";
		header.style.alignItems = "center";
		header.style.padding = "16px";
		header.style.borderBottom = "1px solid var(--background-modifier-border)";

		const title = header.createEl("h2", { text: "Frontmatter Editor" });
		title.style.margin = "0";

		const closeBtn = header.createEl("button", { cls: "modal-close-button" });
		closeBtn.innerHTML = "×";
		closeBtn.addEventListener("click", () => this.tryClose());
	}

	private renderSearchBar(): void {
		const searchContainer = this.contentEl.createDiv({ cls: "lemon-fm-search" });
		searchContainer.style.padding = "12px 16px";

		const searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: "🔍 Search fields...",
		});
		searchInput.style.width = "100%";
		searchInput.style.padding = "8px 12px";
		searchInput.style.border = "1px solid var(--background-modifier-border)";
		searchInput.style.borderRadius = "4px";

		searchInput.addEventListener("input", () => {
			this.searchQuery = searchInput.value.toLowerCase();
			this.renderFields();
		});
	}

	private renderFields(): void {
		this.contentContainer.empty();

		const fieldsContainer = this.contentContainer.createDiv({ cls: "lemon-fm-fields" });
		fieldsContainer.style.maxHeight = "400px";
		fieldsContainer.style.overflowY = "auto";
		fieldsContainer.style.padding = "8px 16px";

		const filteredFields = Array.from(this.fields.values()).filter((field) => {
			if (field.isDeleted) return false;
			if (!this.searchQuery) return true;
			return (
				field.key.toLowerCase().includes(this.searchQuery) ||
				String(field.value).toLowerCase().includes(this.searchQuery)
			);
		});

		if (filteredFields.length === 0) {
			const emptyMsg = fieldsContainer.createDiv({ cls: "lemon-fm-empty" });
			emptyMsg.style.padding = "32px";
			emptyMsg.style.textAlign = "center";
			emptyMsg.style.color = "var(--text-muted)";
			emptyMsg.textContent = this.fields.size === 0
				? "No frontmatter fields. Click 'Add Field' to create one."
				: "No matching fields found.";
			return;
		}

		filteredFields.forEach((field) => {
			this.renderFieldRow(fieldsContainer, field);
		});
	}

	private renderFieldRow(container: HTMLElement, field: FieldData): void {
		const row = container.createDiv({ cls: "lemon-fm-field-row" });
		row.style.display = "flex";
		row.style.alignItems = "center";
		row.style.gap = "12px";
		row.style.padding = "8px";
		row.style.marginBottom = "4px";
		row.style.backgroundColor = "var(--background-secondary)";
		row.style.borderRadius = "4px";

		if (field.isModified) {
			row.style.borderLeft = "3px solid var(--interactive-accent)";
		}

		// Type icon
		if (this.plugin.settings.frontmatterEditor.showTypeIcons) {
			const icon = row.createSpan({ text: getTypeIcon(field.type) });
			icon.style.fontSize = "1.2em";
		}

		// Field key
		const keyEl = row.createEl("strong", { text: field.key });
		keyEl.style.minWidth = "120px";
		keyEl.style.color = "var(--text-muted)";

		// Field value
		const valueContainer = row.createDiv({ cls: "lemon-fm-value" });
		valueContainer.style.flex = "1";
		this.renderFieldValue(valueContainer, field);

		// Actions
		const actions = row.createDiv({ cls: "lemon-fm-actions" });
		actions.style.display = "flex";
		actions.style.gap = "4px";

		// Edit button
		const editBtn = actions.createEl("button", { text: "✎", cls: "lemon-fm-btn" });
		editBtn.setAttribute("aria-label", "Edit");
		editBtn.addEventListener("click", () => this.editField(field));

		// Delete button
		const deleteBtn = actions.createEl("button", { text: "🗑", cls: "lemon-fm-btn" });
		deleteBtn.setAttribute("aria-label", "Delete");
		deleteBtn.addEventListener("click", () => this.deleteField(field));
	}

	private renderFieldValue(container: HTMLElement, field: FieldData): void {
		container.empty();

		switch (field.type) {
			case "boolean":
				const checkbox = container.createEl("input", { type: "checkbox" });
				checkbox.checked = field.value === true;
				checkbox.disabled = true;
				break;

			case "array":
				const tagsContainer = container.createDiv({ cls: "lemon-fm-tags" });
				tagsContainer.style.display = "flex";
				tagsContainer.style.flexWrap = "wrap";
				tagsContainer.style.gap = "4px";

				const items = Array.isArray(field.value) ? field.value : [];
				items.forEach((item) => {
					const tag = tagsContainer.createEl("span", { text: String(item) });
					tag.style.padding = "2px 8px";
					tag.style.backgroundColor = "var(--background-modifier-border)";
					tag.style.borderRadius = "12px";
					tag.style.fontSize = "0.9em";
				});
				break;

			case "object":
				container.textContent = JSON.stringify(field.value);
				container.style.fontFamily = "var(--font-monospace)";
				container.style.fontSize = "0.9em";
				break;

			case "null":
				container.textContent = "empty";
				container.style.color = "var(--text-muted)";
				container.style.fontStyle = "italic";
				break;

			default:
				container.textContent = String(field.value);
				break;
		}
	}

	private editField(field: FieldData): void {
		const modal = new EditFieldModal(this.app, field, (newValue) => {
			field.value = newValue;
			field.isModified = true;
			this.hasUnsavedChanges = true;
			this.renderFields();
		});
		modal.open();
	}

	private deleteField(field: FieldData): void {
		if (confirm(`Are you sure you want to delete field '${field.key}'?`)) {
			field.isDeleted = true;
			this.hasUnsavedChanges = true;
			this.renderFields();
		}
	}

	private renderAddFieldButton(): void {
		const btnContainer = this.contentContainer.createDiv({ cls: "lemon-fm-add-field" });
		btnContainer.style.padding = "8px 16px";

		const addBtn = btnContainer.createEl("button", { text: "+ Add Field" });
		addBtn.style.width = "100%";
		addBtn.style.padding = "8px";
		addBtn.addEventListener("click", () => this.addNewField());
	}

	private addNewField(): void {
		const modal = new AddFieldModal(this.app, (key, value, type) => {
			if (this.fields.has(key)) {
				new Notice(`Field '${key}' already exists`);
				return;
			}

			this.fields.set(key, {
				key,
				value,
				type,
				isModified: false,
				isDeleted: false,
				isNew: true,
			});

			this.hasUnsavedChanges = true;
			this.renderFields();
		});
		modal.open();
	}

	private renderQuickActions(): void {
		const quickActions = this.plugin.settings.frontmatterEditor.quickActions;
		if (quickActions.length === 0) return;

		const container = this.contentContainer.createDiv({ cls: "lemon-fm-quick-actions" });
		container.style.padding = "8px 16px";
		container.style.borderTop = "1px solid var(--background-modifier-border)";

		const title = container.createEl("div", { text: "Quick Actions" });
		title.style.fontSize = "0.9em";
		title.style.color = "var(--text-muted)";
		title.style.marginBottom = "8px";

		const buttonsContainer = container.createDiv();
		buttonsContainer.style.display = "flex";
		buttonsContainer.style.flexWrap = "wrap";
		buttonsContainer.style.gap = "6px";

		quickActions.forEach((action) => {
			const btn = buttonsContainer.createEl("button", { text: action.label });
			btn.style.padding = "4px 12px";
			btn.style.fontSize = "0.9em";
			btn.addEventListener("click", () => this.executeQuickAction(action));
		});
	}

	private executeQuickAction(action: any): void {
		switch (action.action) {
			case "set":
				const field = this.fields.get(action.field);
				if (field) {
					field.value = action.value;
					field.isModified = true;
				} else {
					this.fields.set(action.field, {
						key: action.field,
						value: action.value,
						type: inferFieldType(action.value),
						isModified: false,
						isDeleted: false,
						isNew: true,
					});
				}
				break;

			case "add":
				if (!this.fields.has(action.field)) {
					this.fields.set(action.field, {
						key: action.field,
						value: "",
						type: "string",
						isModified: false,
						isDeleted: false,
						isNew: true,
					});
				}
				break;

			case "toggle":
				const toggleField = this.fields.get(action.field);
				if (toggleField && toggleField.type === "boolean") {
					toggleField.value = !toggleField.value;
					toggleField.isModified = true;
				}
				break;
		}

		this.hasUnsavedChanges = true;
		this.renderFields();
	}

	private renderFooter(): void {
		const footer = this.contentEl.createDiv({ cls: "lemon-fm-footer" });
		footer.style.display = "flex";
		footer.style.justifyContent = "flex-end";
		footer.style.gap = "8px";
		footer.style.padding = "16px";
		footer.style.borderTop = "1px solid var(--background-modifier-border)";

		const cancelBtn = footer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.tryClose());

		const saveBtn = footer.createEl("button", { text: "Save", cls: "mod-cta" });
		saveBtn.addEventListener("click", () => this.save());
	}

	private async save(): Promise<void> {
		try {
			await this.app.fileManager.processFrontMatter(this.file, (frontmatter) => {
				// Remove deleted fields
				this.fields.forEach((field) => {
					if (field.isDeleted) {
						delete frontmatter[field.key];
					}
				});

				// Add/update fields
				this.fields.forEach((field) => {
					if (!field.isDeleted) {
						frontmatter[field.key] = field.value;
					}
				});
			});

			new Notice("Frontmatter saved successfully");
			this.hasUnsavedChanges = false;

			if (this.plugin.settings.frontmatterEditor.closeAfterSave) {
				this.close();
			}
		} catch (error) {
			new Notice(`Failed to save frontmatter: ${error.message}`);
			console.error("Save frontmatter error:", error);
		}
	}

	private tryClose(): void {
		if (this.hasUnsavedChanges) {
			if (confirm("You have unsaved changes. Are you sure you want to close?")) {
				this.close();
			}
		} else {
			this.close();
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Edit Field Modal
class EditFieldModal extends Modal {
	private field: FieldData;
	private onSave: (value: any) => void;

	constructor(app: App, field: FieldData, onSave: (value: any) => void) {
		super(app);
		this.field = field;
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h3", { text: `Edit: ${this.field.key}` });

		const setting = new Setting(contentEl).setName("Value");

		switch (this.field.type) {
			case "boolean":
				setting.addToggle((toggle) =>
					toggle.setValue(this.field.value).onChange((value) => {
						this.onSave(value);
						this.close();
					})
				);
				break;

			case "number":
				setting.addText((text) =>
					text
						.setValue(String(this.field.value))
						.setPlaceholder("Enter number")
						.onChange((value) => {
							const num = parseFloat(value);
							if (!isNaN(num)) {
								this.onSave(num);
							}
						})
				);
				break;

			case "array":
				setting.addTextArea((text) => {
					const arrayValue = Array.isArray(this.field.value)
						? this.field.value.join(", ")
						: String(this.field.value);
					text
						.setValue(arrayValue)
						.setPlaceholder("Enter values separated by commas")
						.onChange((value) => {
							const array = value.split(",").map((v) => v.trim()).filter((v) => v);
							this.onSave(array);
						});
				});
				break;

			default:
				setting.addText((text) =>
					text
						.setValue(String(this.field.value))
						.setPlaceholder("Enter value")
						.onChange((value) => {
							this.onSave(value);
						})
				);
				break;
		}

		const footer = contentEl.createDiv();
		footer.style.marginTop = "16px";
		footer.style.display = "flex";
		footer.style.justifyContent = "flex-end";

		const closeBtn = footer.createEl("button", { text: "Close", cls: "mod-cta" });
		closeBtn.addEventListener("click", () => this.close());
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Add Field Modal
class AddFieldModal extends Modal {
	private onAdd: (key: string, value: any, type: FieldType) => void;

	constructor(app: App, onAdd: (key: string, value: any, type: FieldType) => void) {
		super(app);
		this.onAdd = onAdd;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h3", { text: "Add New Field" });

		let fieldKey = "";
		let fieldValue: any = "";
		let fieldType: FieldType = "string";

		new Setting(contentEl)
			.setName("Field name")
			.addText((text) =>
				text.setPlaceholder("Enter field name").onChange((value) => {
					fieldKey = value;
				})
			);

		new Setting(contentEl)
			.setName("Field type")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("string", "String")
					.addOption("number", "Number")
					.addOption("boolean", "Boolean")
					.addOption("date", "Date")
					.addOption("array", "Array")
					.setValue("string")
					.onChange((value) => {
						fieldType = value as FieldType;
					})
			);

		new Setting(contentEl)
			.setName("Field value")
			.addText((text) =>
				text.setPlaceholder("Enter value").onChange((value) => {
					fieldValue = convertValueToType(value, fieldType);
				})
			);

		const footer = contentEl.createDiv();
		footer.style.marginTop = "16px";
		footer.style.display = "flex";
		footer.style.justifyContent = "flex-end";
		footer.style.gap = "8px";

		const cancelBtn = footer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const addBtn = footer.createEl("button", { text: "Add", cls: "mod-cta" });
		addBtn.addEventListener("click", () => {
			if (!fieldKey) {
				new Notice("Field name is required");
				return;
			}
			this.onAdd(fieldKey, fieldValue, fieldType);
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
