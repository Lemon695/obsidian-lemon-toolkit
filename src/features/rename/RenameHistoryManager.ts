import LemonToolkitPlugin from "../../main";
import { moment } from "obsidian";
import { HistoricalPattern } from "./RenameFilenameSuggestionEngine";

interface RenameRecord {
	oldName: string;
	newName: string;
	recentTimestamps: number[];
	dailyCount: { [date: string]: number };
}

interface RenamePattern {
	type: 'suffix' | 'prefix';
	value: string;
	count: number;
	lastUsed: number;
}

interface SuggestionFeedback {
	pattern: string;
	recentTimestamps: number[];
	dailyCount: { [date: string]: number };
	accepted: number;
	rejected: number;
}

export interface RenameSuggestion {
	label: string;
	value: string;
	type: 'smart' | 'quick';
	score: number;
	icon: string;
	patternKey?: string;
	stats?: {
		usageCount: number;
		acceptRate: number;
		last24h: number;
		last7d: number;
		last30d: number;
	};
}

export class RenameHistoryManager {
	private plugin: LemonToolkitPlugin;
	private records: Map<string, RenameRecord> = new Map();
	private feedback: Map<string, SuggestionFeedback> = new Map();
	private readonly MAX_RECORDS = 1000;
	private readonly RETENTION_DAYS = 365;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	async load(): Promise<void> {
		const data = await this.plugin.app.vault.adapter.read(
			`${this.plugin.manifest.dir}/rename-history.json`
		).catch(() => '{"records":{},"feedback":{}}');
		const parsed = JSON.parse(data);
		
		this.records = new Map(Object.entries(parsed.records || {}));
		this.feedback = new Map(Object.entries(parsed.feedback || {}));
		this.cleanup();
	}

	async save(): Promise<void> {
		const data = {
			records: Object.fromEntries(this.records),
			feedback: Object.fromEntries(this.feedback)
		};
		await this.plugin.app.vault.adapter.write(
			`${this.plugin.manifest.dir}/rename-history.json`,
			JSON.stringify(data, null, 2)
		);
	}

	async recordRename(oldName: string, newName: string, usedSuggestion?: string): Promise<void> {
		const key = `${oldName}→${newName}`;
		const now = Date.now();
		
		const record = this.records.get(key) || {
			oldName,
			newName,
			recentTimestamps: [],
			dailyCount: {}
		};
		
		this.aggregateData(record, now);
		this.records.set(key, record);
		
		if (usedSuggestion) {
			this.recordFeedback(usedSuggestion, true, now);
		}
		
		if (this.records.size > this.MAX_RECORDS) {
			this.pruneOldest();
		}
		
		await this.save();
	}

	async recordSuggestionRejection(patternKey: string): Promise<void> {
		this.recordFeedback(patternKey, false, Date.now());
		await this.save();
	}

	private recordFeedback(patternKey: string, accepted: boolean, timestamp: number): void {
		const fb = this.feedback.get(patternKey) || {
			pattern: patternKey,
			recentTimestamps: [],
			dailyCount: {},
			accepted: 0,
			rejected: 0
		};
		
		this.aggregateData(fb, timestamp);
		
		if (accepted) {
			fb.accepted++;
		} else {
			fb.rejected++;
		}
		
		this.feedback.set(patternKey, fb);
	}

	private aggregateData(record: { recentTimestamps: number[]; dailyCount: { [date: string]: number } }, timestamp: number): void {
		const now = Date.now();
		const oneDayAgo = now - 24 * 60 * 60 * 1000;
		const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
		
		const toAggregate = record.recentTimestamps.filter(t => t < oneDayAgo);
		toAggregate.forEach(t => {
			const date = moment(t).format('YYYY-MM-DD');
			record.dailyCount[date] = (record.dailyCount[date] || 0) + 1;
		});
		
		record.recentTimestamps = record.recentTimestamps.filter(t => t >= oneDayAgo);
		record.recentTimestamps.push(timestamp);
		
		Object.keys(record.dailyCount).forEach(date => {
			const dateTs = moment(date).valueOf();
			if (dateTs < oneYearAgo) {
				delete record.dailyCount[date];
			}
		});
	}

	private getCountInTimeRange(record: { recentTimestamps: number[]; dailyCount: { [date: string]: number } }, hours: number): number {
		const now = Date.now();
		const cutoff = now - hours * 60 * 60 * 1000;
		
		if (hours <= 24) {
			return record.recentTimestamps.filter(t => t >= cutoff).length;
		}
		
		let count = record.recentTimestamps.length;
		const cutoffDate = moment(cutoff).format('YYYY-MM-DD');
		
		Object.entries(record.dailyCount).forEach(([date, cnt]) => {
			if (date >= cutoffDate) {
				count += cnt;
			}
		});
		
		return count;
	}

	private cleanup(): void {
		const cutoff = Date.now() - (this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
		
		for (const [key, record] of this.records) {
			const lastUsed = record.recentTimestamps[record.recentTimestamps.length - 1] || 0;
			if (lastUsed < cutoff) {
				this.records.delete(key);
			}
		}
	}

	private pruneOldest(): void {
		const sorted = Array.from(this.records.entries())
			.sort((a, b) => {
				const aLast = a[1].recentTimestamps[a[1].recentTimestamps.length - 1] || 0;
				const bLast = b[1].recentTimestamps[b[1].recentTimestamps.length - 1] || 0;
				return aLast - bLast;
			});
		
		const toRemove = sorted.slice(0, sorted.length - this.MAX_RECORDS);
		toRemove.forEach(([key]) => this.records.delete(key));
	}

	getSuggestions(currentName: string, maxSuggestions: number = 8): RenameSuggestion[] {
		const suggestions: RenameSuggestion[] = [];
		
		const patterns = this.extractPatterns();
		patterns.forEach(pattern => {
			const newName = this.applyPattern(currentName, pattern);
			if (newName !== currentName) {
				const patternKey = `${pattern.type}:${pattern.value}`;
				const fb = this.feedback.get(patternKey);
				const score = this.calculateScore(pattern, fb);
				
				const stats = this.getPatternStats(patternKey);
				
				suggestions.push({
					label: newName,
					value: newName,
					type: 'smart',
					score,
					icon: score > 10 ? '🔥' : score > 5 ? '⭐' : '💡',
					patternKey,
					stats
				});
			}
		});

		const now = moment();
		suggestions.push(
			{
				label: `${currentName}-${now.format('YYYYMMDD')}`,
				value: `${currentName}-${now.format('YYYYMMDD')}`,
				type: 'quick',
				score: 0,
				icon: '📅',
				patternKey: 'quick:date-suffix'
			},
			{
				label: `${now.format('YYYYMMDD')}-${currentName}`,
				value: `${now.format('YYYYMMDD')}-${currentName}`,
				type: 'quick',
				score: 0,
				icon: '📅',
				patternKey: 'quick:date-prefix'
			},
			{
				label: `${currentName}-${Date.now()}`,
				value: `${currentName}-${Date.now()}`,
				type: 'quick',
				score: 0,
				icon: '⏱️',
				patternKey: 'quick:timestamp'
			},
			{
				label: `${currentName}-${this.generateShortUUID()}`,
				value: `${currentName}-${this.generateShortUUID()}`,
				type: 'quick',
				score: 0,
				icon: '🎲',
				patternKey: 'quick:uuid'
			}
		);

		return suggestions
			.sort((a, b) => {
				if (a.type === 'smart' && b.type === 'smart') return b.score - a.score;
				if (a.type === 'smart') return -1;
				if (b.type === 'smart') return 1;
				return 0;
			})
			.slice(0, maxSuggestions);
	}

	private extractPatterns(): RenamePattern[] {
		const patternMap = new Map<string, RenamePattern>();
		const recentDays = 90;
		const cutoff = Date.now() - (recentDays * 24 * 60 * 60 * 1000);

		for (const record of this.records.values()) {
			const lastUsed = record.recentTimestamps[record.recentTimestamps.length - 1];
			if (lastUsed && lastUsed > cutoff) {
				const pattern = this.detectPattern(record.oldName, record.newName);
				if (pattern) {
					const key = `${pattern.type}:${pattern.value}`;
					const existing = patternMap.get(key);
					const count = this.getCountInTimeRange(record, recentDays * 24);
					
					if (existing) {
						existing.count += count;
						existing.lastUsed = Math.max(existing.lastUsed, lastUsed);
					} else {
						patternMap.set(key, { ...pattern, count, lastUsed });
					}
				}
			}
		}

		return Array.from(patternMap.values());
	}

	private detectPattern(oldName: string, newName: string): RenamePattern | null {
		if (newName.startsWith(oldName)) {
			const suffix = newName.substring(oldName.length);
			if (suffix && !suffix.match(/^\d+$/) && !suffix.match(/^-\d{13,}$/)) {
				return { type: 'suffix', value: suffix, count: 0, lastUsed: 0 };
			}
		}

		if (newName.endsWith(oldName)) {
			const prefix = newName.substring(0, newName.length - oldName.length);
			if (prefix && !prefix.match(/^\d+$/) && !prefix.match(/^\d{8}-$/)) {
				return { type: 'prefix', value: prefix, count: 0, lastUsed: 0 };
			}
		}

		return null;
	}

	private applyPattern(name: string, pattern: RenamePattern): string {
		return pattern.type === 'suffix' ? name + pattern.value : pattern.value + name;
	}

	private calculateScore(pattern: RenamePattern, feedback?: SuggestionFeedback): number {
		const daysSinceUse = (Date.now() - pattern.lastUsed) / (24 * 60 * 60 * 1000);
		const timeDecay = daysSinceUse < 7 ? 1.0 : daysSinceUse < 30 ? 0.5 : 0.1;
		
		let acceptRate = 1.0;
		if (feedback) {
			const total = feedback.accepted + feedback.rejected;
			if (total > 0) {
				acceptRate = feedback.accepted / total;
				acceptRate = Math.max(0.1, acceptRate);
			}
		}
		
		return pattern.count * timeDecay * acceptRate * 10;
	}

	private getPatternStats(patternKey: string): { usageCount: number; acceptRate: number; last24h: number; last7d: number; last30d: number } {
		const fb = this.feedback.get(patternKey);
		if (!fb) {
			return { usageCount: 0, acceptRate: 0, last24h: 0, last7d: 0, last30d: 0 };
		}
		
		const total = fb.accepted + fb.rejected;
		const acceptRate = total > 0 ? fb.accepted / total : 0;
		
		return {
			usageCount: fb.accepted,
			acceptRate,
			last24h: this.getCountInTimeRange(fb, 24),
			last7d: this.getCountInTimeRange(fb, 168),
			last30d: this.getCountInTimeRange(fb, 720)
		};
	}

	private generateShortUUID(): string {
		return Math.random().toString(36).substring(2, 10);
	}

	getHistoricalPatterns(): HistoricalPattern[] {
		const patterns = this.extractPatterns();
		
		return patterns.map(pattern => {
			const patternKey = `${pattern.type}:${pattern.value}`;
			const fb = this.feedback.get(patternKey);
			
			let acceptRate = 0.5;
			if (fb) {
				const total = fb.accepted + fb.rejected;
				if (total > 0) {
					acceptRate = fb.accepted / total;
				}
			}
			
			return {
				type: pattern.type,
				value: pattern.value,
				frequency: pattern.count,
				lastUsed: pattern.lastUsed,
				acceptRate
			};
		});
	}
}
