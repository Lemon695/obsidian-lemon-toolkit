import LemonToolkitPlugin from "../../main";

interface CommandHistory {
	lastUsed: number;
	useCount: number;
}

export class CommandHistoryManager {
	private plugin: LemonToolkitPlugin;
	private history: Record<string, CommandHistory> = {};

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	async load(): Promise<void> {
		const data = await this.plugin.app.vault.adapter.read(
			`${this.plugin.manifest.dir}/command-history.json`
		).catch(() => '{"history":{}}');
		const parsed = JSON.parse(data);
		this.history = parsed.history || {};
	}

	async save(): Promise<void> {
		const data = JSON.stringify({ history: this.history }, null, 2);
		await this.plugin.app.vault.adapter.write(
			`${this.plugin.manifest.dir}/command-history.json`,
			data
		);
	}

	async recordUsage(commandId: string): Promise<void> {
		const now = Date.now();
		const history = this.history[commandId] || {
			lastUsed: 0,
			useCount: 0,
		};
		history.lastUsed = now;
		history.useCount++;
		this.history[commandId] = history;
		await this.save();
	}

	getHistory(commandId: string): CommandHistory | undefined {
		return this.history[commandId];
	}

	getAllHistory(): Record<string, CommandHistory> {
		return this.history;
	}
}
