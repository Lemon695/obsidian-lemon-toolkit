import LemonToolkitPlugin from "../../main";
import { moment } from "obsidian";

interface RenameRecord {
	timestamp: number;
	oldName: string;
	newName: string;
}

interface RenamePattern {
	type: 'suffix' | 'prefix';
	value: string;
	count: number;
	lastUsed: number;
}

export interface RenameSuggestion {
	label: string;
	value: string;
	type: 'smart' | 'quick';
	score: number;
	icon: string;
}

export class RenameHistoryManager {
	private plugin: LemonToolkitPlugin;
	private history: RenameRecord[] = [];
	private readonly MAX_HISTORY = 500;
	private readonly RETENTION_DAYS = 90;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	async load(): Promise<void> {
		const data = await this.plugin.loadData();
		this.history = data?.renameHistory || [];
		this.cleanup();
	}

	async save(): Promise<void> {
		const data = await this.plugin.loadData() || {};
		data.renameHistory = this.history;
		await this.plugin.saveData(data);
	}

	async recordRename(oldName: string, newName: string): Promise<void> {
		this.history.unshift({
			timestamp: Date.now(),
			oldName,
			newName
		});

		if (this.history.length > this.MAX_HISTORY) {
			this.history = this.history.slice(0, this.MAX_HISTORY);
		}

		await this.save();
	}

	private cleanup(): void {
		const cutoff = Date.now() - (this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
		this.history = this.history.filter(r => r.timestamp > cutoff);
	}

	getSuggestions(currentName: string): RenameSuggestion[] {
		const suggestions: RenameSuggestion[] = [];
		
		// Smart suggestions from history
		const patterns = this.extractPatterns();
		patterns.forEach(pattern => {
			const newName = this.applyPattern(currentName, pattern);
			if (newName !== currentName) {
				const score = this.calculateScore(pattern);
				suggestions.push({
					label: newName,
					value: newName,
					type: 'smart',
					score,
					icon: '🔥'
				});
			}
		});

		// Quick suggestions
		const now = moment();
		suggestions.push(
			{
				label: `${currentName}-${now.format('YYYYMMDD')}`,
				value: `${currentName}-${now.format('YYYYMMDD')}`,
				type: 'quick',
				score: 0,
				icon: '⚡'
			},
			{
				label: `${currentName}-${Date.now()}`,
				value: `${currentName}-${Date.now()}`,
				type: 'quick',
				score: 0,
				icon: '⚡'
			},
			{
				label: `${now.format('YYYYMMDD')}-${currentName}`,
				value: `${now.format('YYYYMMDD')}-${currentName}`,
				type: 'quick',
				score: 0,
				icon: '⚡'
			},
			{
				label: `${currentName}-${this.generateShortUUID()}`,
				value: `${currentName}-${this.generateShortUUID()}`,
				type: 'quick',
				score: 0,
				icon: '⚡'
			}
		);

		// Sort: smart by score desc, then quick
		return suggestions
			.sort((a, b) => {
				if (a.type === 'smart' && b.type === 'smart') return b.score - a.score;
				if (a.type === 'smart') return -1;
				if (b.type === 'smart') return 1;
				return 0;
			})
			.slice(0, 8);
	}

	private extractPatterns(): RenamePattern[] {
		const patternMap = new Map<string, RenamePattern>();
		const recentDays = 30;
		const cutoff = Date.now() - (recentDays * 24 * 60 * 60 * 1000);

		this.history
			.filter(r => r.timestamp > cutoff)
			.forEach(record => {
				const pattern = this.detectPattern(record.oldName, record.newName);
				if (pattern) {
					const key = `${pattern.type}:${pattern.value}`;
					const existing = patternMap.get(key);
					if (existing) {
						existing.count++;
						existing.lastUsed = Math.max(existing.lastUsed, record.timestamp);
					} else {
						patternMap.set(key, { ...pattern, count: 1, lastUsed: record.timestamp });
					}
				}
			});

		return Array.from(patternMap.values());
	}

	private detectPattern(oldName: string, newName: string): RenamePattern | null {
		// Suffix pattern
		if (newName.startsWith(oldName)) {
			const suffix = newName.substring(oldName.length);
			if (suffix && !suffix.match(/^\d+$/)) { // Ignore pure numbers
				return { type: 'suffix', value: suffix, count: 0, lastUsed: 0 };
			}
		}

		// Prefix pattern
		if (newName.endsWith(oldName)) {
			const prefix = newName.substring(0, newName.length - oldName.length);
			if (prefix && !prefix.match(/^\d+$/)) {
				return { type: 'prefix', value: prefix, count: 0, lastUsed: 0 };
			}
		}

		return null;
	}

	private applyPattern(name: string, pattern: RenamePattern): string {
		if (pattern.type === 'suffix') {
			return name + pattern.value;
		} else if (pattern.type === 'prefix') {
			return pattern.value + name;
		}
		return name;
	}

	private calculateScore(pattern: RenamePattern): number {
		const daysSinceUse = (Date.now() - pattern.lastUsed) / (24 * 60 * 60 * 1000);
		const timeDecay = daysSinceUse < 7 ? 1.0 : daysSinceUse < 30 ? 0.5 : 0.1;
		return pattern.count * timeDecay;
	}

	private generateShortUUID(): string {
		return Math.random().toString(36).substring(2, 10);
	}
}
