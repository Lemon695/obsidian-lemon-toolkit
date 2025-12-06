import LemonToolkitPlugin from "../../main";

interface FolderMoveHistory {
	count: number;
	lastMoved: number;
	timestamps: number[];
}

export class FolderMoveHistoryManager {
	private plugin: LemonToolkitPlugin;
	private history: Record<string, FolderMoveHistory> = {};

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	async load(): Promise<void> {
		const data = await this.plugin.app.vault.adapter.read(
			`${this.plugin.manifest.dir}/folder-move-history.json`
		).catch(() => '{"history":{}}');
		const parsed = JSON.parse(data);
		this.history = parsed.history || {};
	}

	async save(): Promise<void> {
		const data = JSON.stringify({ history: this.history }, null, 2);
		await this.plugin.app.vault.adapter.write(
			`${this.plugin.manifest.dir}/folder-move-history.json`,
			data
		);
	}

	async recordMove(folderPath: string): Promise<void> {
		const now = Date.now();
		const history = this.history[folderPath] || {
			count: 0,
			lastMoved: 0,
			timestamps: [],
		};

		history.count++;
		history.lastMoved = now;
		history.timestamps.push(now);

		if (history.timestamps.length > 100) {
			history.timestamps = history.timestamps.slice(-100);
		}

		this.history[folderPath] = history;
		await this.save();
	}

	getHistory(folderPath: string): FolderMoveHistory | undefined {
		return this.history[folderPath];
	}

	getAllHistory(): Record<string, FolderMoveHistory> {
		return this.history;
	}
}
