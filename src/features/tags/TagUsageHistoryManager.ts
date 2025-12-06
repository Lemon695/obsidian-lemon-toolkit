import LemonToolkitPlugin from "../../main";

interface TagUsageHistory {
	lastUsed: number;
	timestamps: number[];
}

export class TagUsageHistoryManager {
	private plugin: LemonToolkitPlugin;
	private history: Record<string, TagUsageHistory> = {};

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	async load(): Promise<void> {
		const data = await this.plugin.app.vault.adapter.read(
			`${this.plugin.manifest.dir}/tag-usage-history.json`
		).catch(() => '{"history":{}}');
		const parsed = JSON.parse(data);
		this.history = parsed.history || {};
	}

	async save(): Promise<void> {
		const data = JSON.stringify({ history: this.history }, null, 2);
		await this.plugin.app.vault.adapter.write(
			`${this.plugin.manifest.dir}/tag-usage-history.json`,
			data
		);
	}

	async recordUsage(tags: string[], updateLastUsed: boolean = true): Promise<void> {
		const now = Date.now();

		tags.forEach((tag) => {
			const history = this.history[tag] || {
				lastUsed: 0,
				timestamps: [],
			};

			if (updateLastUsed) {
				history.lastUsed = now;
			}
			history.timestamps.push(now);

			if (history.timestamps.length > 100) {
				history.timestamps = history.timestamps.slice(-100);
			}

			this.history[tag] = history;
		});

		await this.save();
	}

	getHistory(tag: string): TagUsageHistory | undefined {
		return this.history[tag];
	}

	getAllHistory(): Record<string, TagUsageHistory> {
		return this.history;
	}
}
