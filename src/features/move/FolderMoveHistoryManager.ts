import LemonToolkitPlugin from "../../main";

interface FolderMoveHistory {
	count: number;
	lastMoved: number;
	recentTimestamps?: number[];  // 最近 24 小时的精确时间戳
	dailyCount?: {
		[date: string]: number;    // 按天聚合的历史数据
	};
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
		const today = new Date(now).toISOString().split('T')[0];
		const oneDayAgo = now - 24 * 60 * 60 * 1000;
		
		const history = this.history[folderPath] || {
			count: 0,
			lastMoved: 0,
			recentTimestamps: [],
			dailyCount: {},
		};

		history.count++;
		history.lastMoved = now;
		
		// Initialize if needed
		if (!history.recentTimestamps) history.recentTimestamps = [];
		if (!history.dailyCount) history.dailyCount = {};
		
		// 1. Add to recent timestamps
		history.recentTimestamps.push(now);
		
		// 2. Aggregate timestamps older than 24 hours
		const oldTimestamps = history.recentTimestamps.filter(ts => ts < oneDayAgo);
		if (oldTimestamps.length > 0) {
			oldTimestamps.forEach(ts => {
				const date = new Date(ts).toISOString().split('T')[0];
				history.dailyCount![date] = (history.dailyCount![date] || 0) + 1;
			});
			history.recentTimestamps = history.recentTimestamps.filter(ts => ts >= oneDayAgo);
		}
		
		// 3. Clean up data older than 1 year
		const oneYearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
		Object.keys(history.dailyCount).forEach(date => {
			if (date < oneYearAgo) {
				delete history.dailyCount![date];
			}
		});

		this.history[folderPath] = history;
		await this.save();
	}

	getHistory(folderPath: string): FolderMoveHistory | undefined {
		return this.history[folderPath];
	}

	getAllHistory(): Record<string, FolderMoveHistory> {
		return this.history;
	}

	/**
	 * Get move count within a specific time window (in milliseconds)
	 */
	getCountInWindow(folderPath: string, timeWindowMs: number): number {
		const history = this.history[folderPath];
		if (!history) return 0;
		
		const now = Date.now();
		
		// All time
		if (timeWindowMs === 0) {
			return history.count;
		}
		
		// Within 24 hours: use precise timestamps
		if (timeWindowMs <= 24 * 60 * 60 * 1000) {
			const cutoff = now - timeWindowMs;
			return (history.recentTimestamps || []).filter(ts => ts >= cutoff).length;
		}
		
		// Beyond 24 hours: use daily aggregation + recent timestamps
		const cutoffDate = new Date(now - timeWindowMs).toISOString().split('T')[0];
		const dailySum = Object.entries(history.dailyCount || {})
			.filter(([date]) => date >= cutoffDate)
			.reduce((sum, [, count]) => sum + count, 0);
		
		return dailySum + (history.recentTimestamps || []).length;
	}
}
