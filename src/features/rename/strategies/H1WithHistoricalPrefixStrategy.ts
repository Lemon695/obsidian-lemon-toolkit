import { TFile, App } from "obsidian";
import { SuggestionStrategy, SuggestionContext } from "../RenameFilenameSuggestionEngine";
import { RenameSuggestion } from "../RenameHistoryManager";

export class H1WithHistoricalPrefixStrategy implements SuggestionStrategy {
	name = "H1 + Historical Prefix";
	priority = 85;

	async generate(
		file: TFile,
		app: App,
		context: SuggestionContext
	): Promise<RenameSuggestion[]> {
		const suggestions: RenameSuggestion[] = [];

		if (!context.h1Title) {
			return suggestions;
		}

		const sanitized = this.sanitizeFilename(context.h1Title);
		if (!sanitized) {
			return suggestions;
		}

		const prefixPatterns = context.historicalPatterns
			.filter((p) => p.type === 'prefix')
			.sort((a, b) => {
				const scoreA = a.frequency * a.acceptRate * 100;
				const scoreB = b.frequency * b.acceptRate * 100;
				return scoreB - scoreA;
			})
			.slice(0, 3);

		for (const pattern of prefixPatterns) {
			const newName = `${pattern.value}${sanitized}`;
			
			if (newName !== context.currentFilename) {
				const isDuplicate = context.existingFilenames.has(newName);
				const baseScore = pattern.frequency * pattern.acceptRate * 100;
				const score = isDuplicate ? baseScore * 0.5 : baseScore;

				suggestions.push({
					label: newName,
					value: newName,
					type: 'smart',
					score: Math.min(score, 90),
					icon: this.getIcon(pattern.value),
					patternKey: `h1-prefix:${pattern.value}`,
					stats: {
						usageCount: pattern.frequency,
						acceptRate: pattern.acceptRate,
						last24h: 0,
						last7d: 0,
						last30d: pattern.frequency,
					},
				});
			}
		}

		return suggestions;
	}

	private sanitizeFilename(name: string): string {
		return name
			.replace(/[\\/:*?"<>|]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}

	private getIcon(prefix: string): string {
		if (prefix.includes('Draft') || prefix.includes('草稿')) return '✏️';
		if (prefix.match(/\d{8}/)) return '📅';
		if (prefix.includes('[') || prefix.includes('【')) return '📁';
		return '🏷️';
	}
}
