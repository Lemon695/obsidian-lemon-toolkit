import LemonToolkitPlugin from "../../main";

export interface ClipboardRule {
	id: string;
	name: string;
	enabled: boolean;
	pattern: string;
	replacement: string;
	description?: string;
}

export class ClipboardRulesManager {
	private plugin: LemonToolkitPlugin;
	private rules: ClipboardRule[] = [];

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	async load(): Promise<void> {
		const data = await this.plugin.app.vault.adapter.read(
			`${this.plugin.manifest.dir}/clipboard-rules.json`
		).catch(() => '{"rules":[]}');
		const parsed = JSON.parse(data);
		this.rules = parsed.rules || [];
		
		// If no rules, set default
		if (this.rules.length === 0) {
			this.rules = [
				{
					id: "remove-weibo-timeline-image",
					name: "Remove Weibo timeline image",
					enabled: true,
					pattern: "!\\[\\]\\(https://n\\.sinaimg\\.cn/photo/[^)]+/timeline_card_small[^)]+\\.png\\)",
					replacement: "",
					description: "Remove Weibo timeline card small images",
				},
			];
		}
	}

	async save(): Promise<void> {
		const data = JSON.stringify({ rules: this.rules }, null, 2);
		await this.plugin.app.vault.adapter.write(
			`${this.plugin.manifest.dir}/clipboard-rules.json`,
			data
		);
	}

	getRules(): ClipboardRule[] {
		return this.rules;
	}

	setRules(rules: ClipboardRule[]): void {
		this.rules = rules;
	}
}
