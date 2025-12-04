import { Editor, Notice } from "obsidian";
import LemonToolkitPlugin from "../../main";
import { t } from "../../i18n/locale";

export class SmartPasteManager {
	private plugin: LemonToolkitPlugin;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Paste clipboard content with smart rules applied
	 */
	async pasteWithRules(editor: Editor): Promise<void> {
		try {
			// Try to read HTML from clipboard first (richer format)
			let content = await this.readClipboardContent();

			if (!content) {
				new Notice(t('clipboardIsEmpty'));
				return;
			}

			// Apply rules to transform the content
			const transformedText = this.applyRules(content);

			// Insert at cursor position
			editor.replaceSelection(transformedText);

			// Show notification if content was modified
			if (transformedText !== content) {
				const enabledRules = this.plugin.settings.clipboardRules.filter(r => r.enabled);
				new Notice(t('pastedWithRulesApplied', { count: enabledRules.length.toString(), s: enabledRules.length > 1 ? "s" : "" }));
			}
		} catch (error) {
			console.error("Smart paste error:", error);
			new Notice(t('failedToReadClipboard'));
		}
	}

	/**
	 * Read clipboard content, preferring HTML format if available
	 */
	private async readClipboardContent(): Promise<string> {
		try {
			// Try to read clipboard items (supports multiple formats)
			const clipboardItems = await navigator.clipboard.read();
			
			for (const item of clipboardItems) {
				// Check if HTML format is available
				if (item.types.includes("text/html")) {
					const htmlBlob = await item.getType("text/html");
					const htmlText = await htmlBlob.text();
					
					// Convert HTML to Markdown
					const markdown = this.htmlToMarkdown(htmlText);
					if (markdown) {
						return markdown;
					}
				}
			}
		} catch (error) {
			// Fallback to plain text if HTML reading fails
			console.log("HTML clipboard read failed, falling back to plain text:", error);
		}

		// Fallback: read plain text
		return await navigator.clipboard.readText();
	}

	/**
	 * Convert HTML to Markdown
	 */
	private htmlToMarkdown(html: string): string {
		// Create a temporary div to parse HTML
		const temp = document.createElement("div");
		temp.innerHTML = html;

		// Convert the HTML to Markdown
		return this.processNode(temp);
	}

	/**
	 * Process HTML node and convert to Markdown
	 */
	private processNode(node: Node): string {
		let result = "";

		node.childNodes.forEach((child) => {
			if (child.nodeType === Node.TEXT_NODE) {
				result += child.textContent || "";
			} else if (child.nodeType === Node.ELEMENT_NODE) {
				const element = child as HTMLElement;
				const tagName = element.tagName.toLowerCase();

				switch (tagName) {
					case "a":
						const href = element.getAttribute("href") || "";
						const linkText = this.processNode(element);
						result += `[${linkText}](${href})`;
						break;

					case "img":
						const src = element.getAttribute("src") || "";
						const alt = element.getAttribute("alt") || "";
						result += `![${alt}](${src})`;
						break;

					case "strong":
					case "b":
						result += `**${this.processNode(element)}**`;
						break;

					case "em":
					case "i":
						result += `*${this.processNode(element)}*`;
						break;

					case "code":
						result += `\`${this.processNode(element)}\``;
						break;

					case "pre":
						result += `\n\`\`\`\n${this.processNode(element)}\n\`\`\`\n`;
						break;

					case "h1":
						result += `\n# ${this.processNode(element)}\n`;
						break;

					case "h2":
						result += `\n## ${this.processNode(element)}\n`;
						break;

					case "h3":
						result += `\n### ${this.processNode(element)}\n`;
						break;

					case "h4":
						result += `\n#### ${this.processNode(element)}\n`;
						break;

					case "h5":
						result += `\n##### ${this.processNode(element)}\n`;
						break;

					case "h6":
						result += `\n###### ${this.processNode(element)}\n`;
						break;

					case "p":
					case "div":
						result += this.processNode(element) + "\n\n";
						break;

					case "br":
						result += "\n";
						break;

					case "ul":
					case "ol":
						result += "\n" + this.processList(element, tagName === "ol") + "\n";
						break;

					case "blockquote":
						const lines = this.processNode(element).split("\n");
						result += lines.map(line => `> ${line}`).join("\n") + "\n";
						break;

					default:
						// For other tags, just process children
						result += this.processNode(element);
						break;
				}
			}
		});

		return result;
	}

	/**
	 * Process list elements
	 */
	private processList(element: HTMLElement, ordered: boolean): string {
		let result = "";
		let index = 1;

		element.childNodes.forEach((child) => {
			if (child.nodeType === Node.ELEMENT_NODE) {
				const li = child as HTMLElement;
				if (li.tagName.toLowerCase() === "li") {
					const prefix = ordered ? `${index}. ` : "- ";
					result += prefix + this.processNode(li).trim() + "\n";
					index++;
				}
			}
		});

		return result;
	}

	/**
	 * Apply all enabled rules to the text
	 */
	private applyRules(text: string): string {
		let result = text;

		// Get enabled rules
		const enabledRules = this.plugin.settings.clipboardRules.filter(rule => rule.enabled);

		// Apply each rule in order
		enabledRules.forEach(rule => {
			try {
				// Create regex from pattern
				const regex = new RegExp(rule.pattern, "g");
				
				// Apply replacement
				result = result.replace(regex, rule.replacement);
			} catch (error) {
				console.error(`Error applying rule "${rule.name}":`, error);
			}
		});

		return result;
	}

	/**
	 * Test a rule against sample text
	 */
	testRule(pattern: string, replacement: string, sampleText: string): { success: boolean; result?: string; error?: string } {
		try {
			const regex = new RegExp(pattern, "g");
			const result = sampleText.replace(regex, replacement);
			return { success: true, result };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	}
}
