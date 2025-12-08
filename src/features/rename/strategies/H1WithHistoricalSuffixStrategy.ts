import { TFile, App } from "obsidian";
import { SuggestionStrategy, SuggestionContext } from "../RenameFilenameSuggestionEngine";
import { RenameSuggestion } from "../RenameHistoryManager";

export class H1WithHistoricalSuffixStrategy implements SuggestionStrategy {
	name = "H1 + Historical Suffix";
	priority = 90;

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

		const suffixPatterns = context.historicalPatterns
			.filter((p) => p.type === 'suffix')
			.sort((a, b) => {
				const scoreA = a.frequency * a.acceptRate * 100;
				const scoreB = b.frequency * b.acceptRate * 100;
				return scoreB - scoreA;
			})
			.slice(0, 5);

		for (const pattern of suffixPatterns) {
			const newName = `${sanitized}${pattern.value}`;
			
			if (newName !== context.currentFilename) {
				const isDuplicate = context.existingFilenames.has(newName);
				const baseScore = pattern.frequency * pattern.acceptRate * 100;
				const score = isDuplicate ? baseScore * 0.5 : baseScore;

				suggestions.push({
					label: newName,
					value: newName,
					type: 'smart',
					score: Math.min(score, 95),
					icon: this.getIcon(pattern.value),
					patternKey: `h1-suffix:${pattern.value}`,
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

	private getIcon(suffix: string): string {
		if (suffix.includes('DataviewJS') || suffix.includes('dataview')) return '📊';
		if (suffix.match(/v\d+/i)) return '🔢';
		if (suffix.includes('Draft') || suffix.includes('草稿')) return '✏️';
		if (suffix.includes('Final') || suffix.includes('最终')) return '✅';
		return '🏷️';
	}
}
