import { App, Modal, Notice, TFile } from "obsidian";
import { t } from "../i18n/locale";

export class DuplicateFileModal extends Modal {
	private file: TFile;
	private defaultName: string;
	private onSubmit: (newName: string) => void;

	constructor(app: App, file: TFile, defaultName: string, onSubmit: (newName: string) => void) {
		super(app);
		this.file = file;
		this.defaultName = defaultName;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Duplicate file" });

		// Create input container
		const inputContainer = contentEl.createDiv({ cls: "duplicate-file-input-container" });
		
		const label = inputContainer.createEl("label", { text: "New file name:" });
		label.style.display = "block";
		label.style.marginBottom = "8px";

		const input = inputContainer.createEl("input", {
			type: "text",
			value: this.defaultName,
		});
		input.style.width = "100%";
		input.style.padding = "8px";
		input.style.marginBottom = "16px";
		input.style.boxSizing = "border-box";

		// Select the filename part (without timestamp and extension) for easy editing
		const nameWithoutExt = this.file.basename;
		input.setSelectionRange(0, nameWithoutExt.length);
		input.focus();

		// Create button container
		const buttonContainer = contentEl.createDiv({ cls: "duplicate-file-button-container" });
		buttonContainer.style.display = "flex";
		buttonContainer.style.justifyContent = "flex-end";
		buttonContainer.style.gap = "8px";

		// Cancel button
		const cancelButton = buttonContainer.createEl("button", { text: "Cancel" });
		cancelButton.addEventListener("click", () => {
			this.close();
		});

		// Confirm button
		const confirmButton = buttonContainer.createEl("button", {
			text: "Confirm",
			cls: "mod-cta",
		});
		confirmButton.addEventListener("click", () => {
			this.handleSubmit(input.value);
		});

		// Handle Enter key
		input.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				this.handleSubmit(input.value);
			} else if (e.key === "Escape") {
				e.preventDefault();
				this.close();
			}
		});
	}

	private handleSubmit(newName: string) {
		const trimmedName = newName.trim();
		
		if (!trimmedName) {
			new Notice(t('fileNameCannotBeEmpty'));
			return;
		}

		// Check if file already exists
		const folderPath = this.file.parent?.path || "";
		const newPath = folderPath ? `${folderPath}/${trimmedName}` : trimmedName;
		const existingFile = this.app.vault.getAbstractFileByPath(newPath);
		
		if (existingFile) {
			new Notice(t('fileAlreadyExists'));
			return;
		}

		this.close();
		this.onSubmit(trimmedName);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
