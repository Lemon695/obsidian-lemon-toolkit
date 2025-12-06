import { App, Modal, TFile } from "obsidian";
import { t } from "../i18n/locale";

export class RenameFileModal extends Modal {
	private file: TFile;
	private onSubmit: (newName: string) => void;

	constructor(app: App, file: TFile, onSubmit: (newName: string) => void) {
		super(app);
		this.file = file;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: t('renameFile') });

		const inputContainer = contentEl.createDiv();
		
		const label = inputContainer.createEl("label", { text: t('newFileName') });
		label.style.display = "block";
		label.style.marginBottom = "8px";

		const input = inputContainer.createEl("input", {
			type: "text",
			value: this.file.basename,
		});
		input.style.width = "100%";
		input.style.padding = "8px";
		input.style.marginBottom = "16px";
		input.style.boxSizing = "border-box";

		input.select();
		input.focus();

		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.display = "flex";
		buttonContainer.style.justifyContent = "flex-end";
		buttonContainer.style.gap = "8px";

		const cancelButton = buttonContainer.createEl("button", { text: t('cancel') });
		cancelButton.addEventListener("click", () => this.close());

		const submitButton = buttonContainer.createEl("button", { 
			text: t('rename'),
			cls: "mod-cta"
		});

		const submit = () => {
			const newName = input.value.trim();
			if (newName && newName !== this.file.basename) {
				this.onSubmit(newName);
				this.close();
			} else {
				this.close();
			}
		};

		submitButton.addEventListener("click", submit);
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				submit();
			} else if (e.key === "Escape") {
				this.close();
			}
		});
	}
}
