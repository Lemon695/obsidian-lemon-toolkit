import { App, Modal, Editor } from "obsidian";
import { HeadingItem } from "../commands/outline";
import { t } from "../i18n/locale";

export class OutlineModal extends Modal {
	headings: HeadingItem[];
	editor: Editor;

	constructor(app: App, headings: HeadingItem[], editor: Editor) {
		super(app);
		this.headings = headings;
		this.editor = editor;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass("lemon-outline-modal");

		const title = contentEl.createDiv({ cls: "lemon-outline-title" });
		title.setText(t("outlineTitle"));

		const listContainer = contentEl.createDiv({ cls: "lemon-outline-list" });

		if (this.headings.length === 0) {
			const empty = listContainer.createDiv({ cls: "lemon-outline-empty" });
			empty.setText(t("outlineEmpty"));
		} else {
			this.headings.forEach((heading) => {
				const item = listContainer.createDiv({ cls: "lemon-outline-item" });
				item.setAttribute("data-level", heading.level.toString());
				item.style.paddingLeft = `${(heading.level - 1) * 20}px`;

				const bullet = item.createSpan({ cls: "lemon-outline-bullet" });
				bullet.setText("•");

				const text = item.createSpan({ cls: "lemon-outline-text" });
				text.setText(heading.text);

				item.addEventListener("click", () => {
					this.editor.setCursor({ line: heading.line, ch: 0 });
					this.editor.scrollIntoView(
						{
							from: { line: heading.line, ch: 0 },
							to: { line: heading.line, ch: 0 },
						},
						true
					);
					this.close();
				});
			});
		}

		const footer = contentEl.createDiv({ cls: "lemon-outline-footer" });
		const copyBtn = footer.createEl("button", {
			cls: "lemon-outline-copy-btn",
			text: t("outlineCopy"),
		});

		copyBtn.addEventListener("click", () => {
			const outlineText = this.headings
				.map((h) => `${"\t".repeat(h.level - 1)}- ${h.text}`)
				.join("\n");
			navigator.clipboard.writeText(outlineText);
			copyBtn.setText(t("outlineCopied"));
			setTimeout(() => {
				copyBtn.setText(t("outlineCopy"));
			}, 2000);
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
