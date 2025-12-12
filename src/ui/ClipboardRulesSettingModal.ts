import { App, Modal, Setting, Notice } from "obsidian";
import { ClipboardRule } from "../settings";
import { SmartPasteManager } from "../features/smart-paste/SmartPasteManager";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/legacy";

export class ClipboardRulesSettingModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private rules: ClipboardRule[];
	private onSave: (rules: ClipboardRule[]) => void;

	constructor(app: App, plugin: LemonToolkitPlugin, rules: ClipboardRule[], onSave: (rules: ClipboardRule[]) => void) {
		super(app);
		this.plugin = plugin;
		this.rules = JSON.parse(JSON.stringify(rules)); // Deep copy
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lemon-clipboard-rules-modal");

		// Header
		const header = contentEl.createDiv({ cls: "lemon-modal-header" });
		header.createEl("h2", { text: t('clipboardRules') });

		const desc = contentEl.createDiv({ cls: "lemon-modal-desc" });
		desc.textContent = t('clipboardRulesModalDesc');

		// Rules list
		const rulesContainer = contentEl.createDiv({ cls: "lemon-rules-container" });
		this.renderRules(rulesContainer);

		// Add rule button
		const addButtonContainer = contentEl.createDiv({ cls: "lemon-add-rule-container" });
		const addButton = addButtonContainer.createEl("button", { text: t('addRule') });
		addButton.addEventListener("click", () => {
			this.addNewRule();
			this.renderRules(rulesContainer);
		});

		// Footer
		const footer = contentEl.createDiv({ cls: "lemon-modal-footer" });

		const cancelBtn = footer.createEl("button", { text: t('cancel') });
		cancelBtn.addEventListener("click", () => this.close());

		const saveBtn = footer.createEl("button", { text: t('save'), cls: "mod-cta" });
		saveBtn.addEventListener("click", () => {
			this.onSave(this.rules);
			new Notice(t('clipboardRulesSaved'));
			this.close();
		});
	}

	private addNewRule() {
		const newRule: ClipboardRule = {
			id: `rule-${Date.now()}`,
			name: t('newRule'),
			enabled: true,
			pattern: "",
			replacement: "",
			description: "",
		};
		this.rules.push(newRule);
	}

	private renderRules(container: HTMLElement) {
		container.empty();

		if (this.rules.length === 0) {
			const empty = container.createDiv({ cls: "lemon-rules-empty" });
			empty.textContent = t('noRulesConfigured');
			return;
		}

		this.rules.forEach((rule, index) => {
			const ruleEl = container.createDiv({ cls: "lemon-rule-item" });

			// Rule header
			const ruleHeader = ruleEl.createDiv({ cls: "lemon-rule-header" });

			// Enable toggle
			const toggle = ruleHeader.createEl("input", { type: "checkbox" });
			toggle.checked = rule.enabled;
			toggle.addEventListener("change", () => {
				rule.enabled = toggle.checked;
			});

			// Rule name
			const nameInput = ruleHeader.createEl("input", { 
				type: "text",
				value: rule.name,
				cls: "lemon-rule-name-input"
			});
			nameInput.addEventListener("input", () => {
				rule.name = nameInput.value;
			});

			// Move buttons
			const moveButtons = ruleHeader.createDiv({ cls: "lemon-rule-move-buttons" });
			
			if (index > 0) {
				const upBtn = moveButtons.createEl("button", { text: t('moveUp'), cls: "lemon-move-btn" });
				upBtn.addEventListener("click", () => {
					[this.rules[index - 1], this.rules[index]] = [this.rules[index], this.rules[index - 1]];
					this.renderRules(container);
				});
			}

			if (index < this.rules.length - 1) {
				const downBtn = moveButtons.createEl("button", { text: t('moveDown'), cls: "lemon-move-btn" });
				downBtn.addEventListener("click", () => {
					[this.rules[index], this.rules[index + 1]] = [this.rules[index + 1], this.rules[index]];
					this.renderRules(container);
				});
			}

			// Delete button
			const deleteBtn = ruleHeader.createEl("button", { text: t('deleteRule'), cls: "lemon-delete-btn" });
			deleteBtn.addEventListener("click", () => {
				this.rules.splice(index, 1);
				this.renderRules(container);
			});

			// Rule body
			const ruleBody = ruleEl.createDiv({ cls: "lemon-rule-body" });

			// Description
			new Setting(ruleBody)
				.setName(t('ruleDescription'))
				.addText(text => text
					.setPlaceholder(t('ruleDescriptionPlaceholder'))
					.setValue(rule.description || "")
					.onChange(value => {
						rule.description = value;
					}));

			// Pattern
			new Setting(ruleBody)
				.setName(t('rulePattern'))
				.setDesc(t('rulePatternDesc'))
				.addText(text => text
					.setPlaceholder(t('rulePatternPlaceholder'))
					.setValue(rule.pattern)
					.onChange(value => {
						rule.pattern = value;
					}));

			// Replacement
			new Setting(ruleBody)
				.setName(t('ruleReplacement'))
				.setDesc(t('ruleReplacementDesc'))
				.addText(text => text
					.setPlaceholder(t('ruleReplacementPlaceholder'))
					.setValue(rule.replacement)
					.onChange(value => {
						rule.replacement = value;
					}));

			// Test section
			const testSection = ruleBody.createDiv({ cls: "lemon-rule-test" });
			testSection.createEl("h4", { text: t('testRule') });

			const testInput = testSection.createEl("textarea", { 
				placeholder: "Paste sample text here to test...",
				cls: "lemon-test-input"
			});

			const testBtn = testSection.createEl("button", { text: t('test'), cls: "lemon-test-btn" });
			const testResult = testSection.createDiv({ cls: "lemon-test-result" });

			testBtn.addEventListener("click", () => {
				const manager = new SmartPasteManager(this.plugin);
				const result = manager.testRule(rule.pattern, rule.replacement, testInput.value);
				
				testResult.empty();
				if (result.success) {
					testResult.createEl("strong", { text: t('result') });
					testResult.createEl("pre", { text: result.result || "(empty)" });
				} else {
					testResult.createEl("strong", { text: t('error'), cls: "lemon-error" });
					testResult.createEl("div", { text: result.error, cls: "lemon-error" });
				}
			});
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
