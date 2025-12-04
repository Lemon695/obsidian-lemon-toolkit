import { App, Modal, Notice, TFile, Setting } from "obsidian";
import LemonToolkitPlugin from "../../main";
import { FieldData, FieldType } from "./types";
import { inferFieldType, convertValueToType } from "./utils/typeInference";
import { replaceVariables } from "./utils/variableReplacer";
import { getTypeIconSVG, icons } from "./utils/icons";
import { t } from "../../i18n/locale";

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

		// Set modal size
		this.modalEl.style.width = "600px";
		this.modalEl.style.maxWidth = "90vw";

		// Load frontmatter
		await this.loadFrontmatter();

		// Render modal structure
		this.renderHeader();
		this.renderSearchBar();
		
		// Main content area (scrollable fields)
		this.contentContainer = contentEl.createDiv({ cls: "lemon-fm-content" });
		this.contentContainer.style.flex = "1";
		this.contentContainer.style.overflowY = "auto";
		this.contentContainer.style.minHeight = "0";
		this.renderFields();
		
		// Fixed bottom sections
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
		header.style.padding = "16px 16px 16px 24px";
		header.style.borderBottom = "1px solid var(--background-modifier-border)";

		const title = header.createEl("h2", { text: t('frontmatterEditor') });
		title.style.margin = "0";
		title.style.fontSize = "1.2em";
	}

	private renderSearchBar(): void {
		const searchContainer = this.contentEl.createDiv({ cls: "lemon-fm-search" });
		searchContainer.style.padding = "12px 16px";

		const searchWrapper = searchContainer.createDiv({ cls: "lemon-fm-search-wrapper" });
		searchWrapper.style.position = "relative";
		searchWrapper.style.display = "flex";
		searchWrapper.style.alignItems = "center";
		searchWrapper.style.width = "100%";

		const searchIcon = searchWrapper.createDiv({ cls: "lemon-fm-search-icon" });
		searchIcon.innerHTML = icons.search;
		searchIcon.style.position = "absolute";
		searchIcon.style.left = "12px";
		searchIcon.style.top = "50%";
		searchIcon.style.transform = "translateY(-50%)";
		searchIcon.style.display = "flex";
		searchIcon.style.alignItems = "center";
		searchIcon.style.color = "var(--text-muted)";
		searchIcon.style.pointerEvents = "none";
		searchIcon.style.zIndex = "1";

		const searchInput = searchWrapper.createEl("input", {
			type: "text",
			placeholder: t('searchFields'),
		});
		searchInput.style.width = "100%";
		searchInput.style.padding = "8px 12px 8px 36px";
		searchInput.style.border = "1px solid var(--background-modifier-border)";
		searchInput.style.borderRadius = "4px";
		searchInput.style.backgroundColor = "var(--background-primary)";
		searchInput.style.color = "var(--text-normal)";
		searchInput.style.boxSizing = "border-box";

		searchInput.addEventListener("input", () => {
			this.searchQuery = searchInput.value.toLowerCase();
			this.renderFields();
		});
	}

	private renderFields(): void {
		// Only clear the fields container, not the entire content
		const existingFieldsContainer = this.contentContainer.querySelector(".lemon-fm-fields");
		if (existingFieldsContainer) {
			existingFieldsContainer.remove();
		}

		const fieldsContainer = this.contentContainer.createDiv({ cls: "lemon-fm-fields" });
		fieldsContainer.style.maxHeight = "400px";
		fieldsContainer.style.overflowY = "auto";
		fieldsContainer.style.padding = "8px 16px";
		fieldsContainer.style.minHeight = "200px";

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
				? t('noFrontmatterFields')
				: t('noMatchingFields');
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
			const iconContainer = row.createDiv({ cls: "lemon-fm-icon" });
			iconContainer.innerHTML = getTypeIconSVG(field.type);
			iconContainer.style.display = "flex";
			iconContainer.style.alignItems = "center";
			iconContainer.style.color = "var(--text-muted)";
		}

		// Field key (editable on click)
		const keyEl = row.createEl("strong", { text: field.key });
		keyEl.style.minWidth = "120px";
		keyEl.style.color = "var(--text-muted)";
		keyEl.style.cursor = "pointer";
		keyEl.style.padding = "4px";
		keyEl.style.borderRadius = "3px";
		keyEl.setAttribute("title", "Click to edit field name");

		keyEl.addEventListener("click", () => {
			this.editFieldKey(field, keyEl);
		});

		keyEl.addEventListener("mouseenter", () => {
			keyEl.style.backgroundColor = "var(--background-modifier-hover)";
		});

		keyEl.addEventListener("mouseleave", () => {
			keyEl.style.backgroundColor = "";
		});

		// Field value (editable on click)
		const valueContainer = row.createDiv({ cls: "lemon-fm-value" });
		valueContainer.style.flex = "1";
		valueContainer.style.cursor = "pointer";
		valueContainer.style.padding = "4px";
		valueContainer.style.borderRadius = "3px";
		valueContainer.setAttribute("title", "Click to edit value");

		this.renderFieldValue(valueContainer, field);

		valueContainer.addEventListener("click", () => {
			this.editFieldInline(field, valueContainer);
		});

		valueContainer.addEventListener("mouseenter", () => {
			valueContainer.style.backgroundColor = "var(--background-modifier-hover)";
		});

		valueContainer.addEventListener("mouseleave", () => {
			valueContainer.style.backgroundColor = "";
		});

		// Delete button
		const deleteBtn = row.createEl("button", { cls: "lemon-fm-btn" });
		deleteBtn.innerHTML = icons.delete;
		deleteBtn.setAttribute("aria-label", "Delete");
		deleteBtn.style.padding = "4px";
		deleteBtn.style.display = "flex";
		deleteBtn.style.alignItems = "center";
		deleteBtn.style.cursor = "pointer";
		deleteBtn.style.border = "none";
		deleteBtn.style.background = "none";
		deleteBtn.style.color = "var(--text-muted)";
		deleteBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.deleteField(field);
		});
	}

	private renderFieldValue(container: HTMLElement, field: FieldData): void {
		container.empty();
		container.style.minHeight = "24px";
		container.style.display = "flex";
		container.style.alignItems = "center";

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
				tagsContainer.style.alignItems = "center";

				const items = Array.isArray(field.value) ? field.value : [];
				if (items.length === 0) {
					const emptyText = tagsContainer.createSpan({ text: t('emptyArray') });
					emptyText.style.color = "var(--text-muted)";
					emptyText.style.fontStyle = "italic";
				} else {
					items.forEach((item) => {
						const tag = tagsContainer.createEl("span", { text: String(item) });
						tag.style.padding = "2px 8px";
						tag.style.backgroundColor = "var(--background-modifier-border)";
						tag.style.borderRadius = "12px";
						tag.style.fontSize = "0.9em";
					});
				}
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
				const valueText = String(field.value);
				if (!valueText || valueText.trim() === "") {
					container.textContent = "empty";
					container.style.color = "var(--text-muted)";
					container.style.fontStyle = "italic";
				} else {
					container.textContent = valueText;
				}
				break;
		}
	}

	private editFieldKey(field: FieldData, keyEl: HTMLElement): void {
		const input = document.createElement("input");
		input.type = "text";
		input.value = field.key;
		input.style.width = "100%";
		input.style.padding = "4px";
		input.style.border = "1px solid var(--interactive-accent)";
		input.style.borderRadius = "3px";
		input.style.backgroundColor = "var(--background-primary)";
		input.style.color = "var(--text-normal)";

		const originalText = keyEl.textContent || "";
		keyEl.textContent = "";
		keyEl.appendChild(input);
		input.focus();
		input.select();

		const save = () => {
			const newKey = input.value.trim();
			if (!newKey) {
				new Notice(t('fieldNameEmpty'));
				keyEl.textContent = originalText;
				return;
			}

			if (newKey !== field.key && this.fields.has(newKey)) {
				new Notice(t('fieldAlreadyExists', { name: newKey }));
				keyEl.textContent = originalText;
				return;
			}

			if (newKey !== field.key) {
				this.fields.delete(field.key);
				field.key = newKey;
				this.fields.set(newKey, field);
				field.isModified = true;
				this.hasUnsavedChanges = true;
			}

			this.renderFields();
		};

		input.addEventListener("blur", save);
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				save();
			} else if (e.key === "Escape") {
				e.preventDefault();
				keyEl.textContent = originalText;
			}
		});
	}

	private editFieldInline(field: FieldData, valueContainer: HTMLElement): void {
		// For boolean, toggle directly
		if (field.type === "boolean") {
			field.value = !field.value;
			field.isModified = true;
			this.hasUnsavedChanges = true;
			this.renderFields();
			return;
		}

		// For other types, show inline editor
		const input = this.createInlineEditor(field);
		valueContainer.textContent = "";
		valueContainer.appendChild(input);
		input.focus();

		if (input instanceof HTMLInputElement) {
			input.select();
		}

		const save = () => {
			const newValue = this.getInputValue(input, field.type);
			if (this.validateValue(newValue, field.type)) {
				field.value = newValue;
				field.isModified = true;
				this.hasUnsavedChanges = true;
			}
			this.renderFields();
		};

		input.addEventListener("blur", save);
		input.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
				e.preventDefault();
				save();
			} else if (e.key === "Escape") {
				e.preventDefault();
				this.renderFields();
			}
		});
	}

	private createInlineEditor(field: FieldData): HTMLInputElement | HTMLTextAreaElement {
		switch (field.type) {
			case "number":
				const numInput = document.createElement("input");
				numInput.type = "number";
				numInput.value = String(field.value);
				numInput.style.width = "100%";
				numInput.style.padding = "4px";
				numInput.style.border = "1px solid var(--interactive-accent)";
				numInput.style.borderRadius = "3px";
				numInput.style.backgroundColor = "var(--background-primary)";
				numInput.style.color = "var(--text-normal)";
				return numInput;

			case "date":
				const dateInput = document.createElement("input");
				dateInput.type = "date";
				dateInput.value = String(field.value);
				dateInput.style.width = "100%";
				dateInput.style.padding = "4px";
				dateInput.style.border = "1px solid var(--interactive-accent)";
				dateInput.style.borderRadius = "3px";
				dateInput.style.backgroundColor = "var(--background-primary)";
				dateInput.style.color = "var(--text-normal)";
				return dateInput;

			case "array":
				const arrayInput = document.createElement("input");
				arrayInput.type = "text";
				const arrayValue = Array.isArray(field.value) ? field.value.join(", ") : String(field.value);
				arrayInput.value = arrayValue;
				arrayInput.placeholder = "Separate values with commas";
				arrayInput.style.width = "100%";
				arrayInput.style.padding = "4px";
				arrayInput.style.border = "1px solid var(--interactive-accent)";
				arrayInput.style.borderRadius = "3px";
				arrayInput.style.backgroundColor = "var(--background-primary)";
				arrayInput.style.color = "var(--text-normal)";
				return arrayInput;

			default:
				const textInput = document.createElement("input");
				textInput.type = "text";
				textInput.value = String(field.value);
				textInput.style.width = "100%";
				textInput.style.padding = "4px";
				textInput.style.border = "1px solid var(--interactive-accent)";
				textInput.style.borderRadius = "3px";
				textInput.style.backgroundColor = "var(--background-primary)";
				textInput.style.color = "var(--text-normal)";

				// Add autocomplete for existing field values
				this.addAutocomplete(textInput, field.key);

				return textInput;
		}
	}

	private addAutocomplete(input: HTMLInputElement, fieldKey: string): void {
		// Collect all values for this field from all files
		const allValues = new Set<string>();
		const allFiles = this.app.vault.getMarkdownFiles();

		allFiles.forEach((file) => {
			const cache = this.app.metadataCache.getFileCache(file);
			if (cache?.frontmatter && cache.frontmatter[fieldKey]) {
				const value = cache.frontmatter[fieldKey];
				if (typeof value === "string") {
					allValues.add(value);
				}
			}
		});

		if (allValues.size === 0) return;

		// Create datalist for autocomplete
		const datalistId = `datalist-${fieldKey}-${Date.now()}`;
		const datalist = document.createElement("datalist");
		datalist.id = datalistId;

		allValues.forEach((value) => {
			const option = document.createElement("option");
			option.value = value;
			datalist.appendChild(option);
		});

		input.setAttribute("list", datalistId);
		input.parentElement?.appendChild(datalist);
	}

	private getInputValue(input: HTMLInputElement | HTMLTextAreaElement, type: FieldType): any {
		const value = input.value;

		switch (type) {
			case "number":
				return parseFloat(value);
			case "array":
				return value.split(",").map((v) => v.trim()).filter((v) => v);
			default:
				return value;
		}
	}

	private validateValue(value: any, type: FieldType): boolean {
		switch (type) {
			case "number":
				if (isNaN(value)) {
					new Notice(t('invalidNumber'));
					return false;
				}
				return true;
			case "date":
				if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
					new Notice(t('invalidDateFormat'));
					return false;
				}
				return true;
			default:
				return true;
		}
	}

	private deleteField(field: FieldData): void {
		if (confirm(`Are you sure you want to delete field '${field.key}'?`)) {
			field.isDeleted = true;
			this.hasUnsavedChanges = true;
			this.renderFields();
		}
	}

	private renderAddFieldButton(): void {
		const btnContainer = this.contentEl.createDiv({ cls: "lemon-fm-add-field" });
		btnContainer.style.padding = "8px 16px";
		btnContainer.style.borderTop = "1px solid var(--background-modifier-border)";

		const addBtn = btnContainer.createEl("button", { text: t('addField') });
		addBtn.style.width = "100%";
		addBtn.style.padding = "8px";
		addBtn.style.cursor = "pointer";
		addBtn.addEventListener("click", () => this.addNewField());
	}

	private addNewField(): void {
		const modal = new AddFieldModal(this.app, (key, value, type) => {
			if (this.fields.has(key)) {
				new Notice(t('fieldAlreadyExists', { name: key }));
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

		const container = this.contentEl.createDiv({ cls: "lemon-fm-quick-actions" });
		container.style.padding = "8px 16px";
		container.style.borderTop = "1px solid var(--background-modifier-border)";

		const title = container.createEl("div", { text: t('quickActions') });
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
			btn.style.cursor = "pointer";
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

		const cancelBtn = footer.createEl("button", { text: t('cancel') });
		cancelBtn.addEventListener("click", () => this.tryClose());

		const saveBtn = footer.createEl("button", { text: t('save'), cls: "mod-cta" });
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

			new Notice(t('frontmatterSaved'));
			this.hasUnsavedChanges = false;

			// Always close after save (as requested)
			this.close();
		} catch (error) {
			new Notice(t('failedToSaveFrontmatter', { error: error.message }));
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

		contentEl.createEl("h3", { text: t('editField', { key: this.field.key }) });

		const setting = new Setting(contentEl).setName(t('fieldValue'));

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
						.setPlaceholder(t('placeholderEnterNumber'))
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
						.setPlaceholder(t('placeholderEnterValuesCommaSeparated'))
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
						.setPlaceholder(t('placeholderEnterValue'))
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

		const closeBtn = footer.createEl("button", { text: t('close'), cls: "mod-cta" });
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

		contentEl.createEl("h3", { text: t('addNewField') });

		let fieldKey = "";
		let fieldValue: any = "";
		let fieldType: FieldType = "string";

		new Setting(contentEl)
			.setName(t('fieldName'))
			.addText((text) =>
				text.setPlaceholder(t('placeholderEnterFieldName')).onChange((value) => {
					fieldKey = value;
				})
			);

		new Setting(contentEl)
			.setName(t('fieldType'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("string", t('fieldTypeString'))
					.addOption("number", t('fieldTypeNumber'))
					.addOption("boolean", t('fieldTypeBoolean'))
					.addOption("date", t('fieldTypeDate'))
					.addOption("array", t('fieldTypeArray'))
					.setValue("string")
					.onChange((value) => {
						fieldType = value as FieldType;
					})
			);

		new Setting(contentEl)
			.setName(t('fieldValue'))
			.addText((text) =>
				text.setPlaceholder(t('placeholderEnterValue')).onChange((value) => {
					fieldValue = convertValueToType(value, fieldType);
				})
			);

		const footer = contentEl.createDiv();
		footer.style.marginTop = "16px";
		footer.style.display = "flex";
		footer.style.justifyContent = "flex-end";
		footer.style.gap = "8px";

		const cancelBtn = footer.createEl("button", { text: t('cancel') });
		cancelBtn.addEventListener("click", () => this.close());

		const addBtn = footer.createEl("button", { text: t('add'), cls: "mod-cta" });
		addBtn.addEventListener("click", () => {
			if (!fieldKey) {
				new Notice(t('fieldNameRequired'));
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
