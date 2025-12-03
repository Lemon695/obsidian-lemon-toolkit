import { App, Modal } from "obsidian";

export class ViewCurrentTagsModal extends Modal {
	private tags: string[];

	constructor(app: App, tags: string[]) {
		super(app);
		this.tags = tags;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Tags in current file" });

		const tagList = contentEl.createDiv({ cls: "lemon-tag-list" });
		tagList.style.marginTop = "16px";
		tagList.style.maxHeight = "400px";
		tagList.style.overflowY = "auto";

		this.tags.forEach((tag) => {
			const tagItem = tagList.createDiv({ cls: "lemon-tag-item" });
			tagItem.style.padding = "8px 12px";
			tagItem.style.marginBottom = "4px";
			tagItem.style.backgroundColor = "var(--background-secondary)";
			tagItem.style.borderRadius = "4px";
			tagItem.style.cursor = "pointer";
			tagItem.textContent = tag;

			// Copy tag on click
			tagItem.addEventListener("click", async () => {
				await navigator.clipboard.writeText(tag);
				tagItem.style.backgroundColor = "var(--interactive-accent)";
				setTimeout(() => {
					tagItem.style.backgroundColor = "var(--background-secondary)";
				}, 200);
			});
		});

		const hint = contentEl.createDiv({ cls: "lemon-tag-hint" });
		hint.style.marginTop = "16px";
		hint.style.fontSize = "0.9em";
		hint.style.color = "var(--text-muted)";
		hint.textContent = `Total: ${this.tags.length} tag(s). Click to copy.`;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
