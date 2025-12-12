import { TFile, App } from "obsidian";
import { SuggestionStrategy, SuggestionContext } from "../RenameFilenameSuggestionEngine";
import { RenameSuggestion } from "../RenameHistoryManager";

export class H1TitleStrategy implements SuggestionStrategy {
	name = "H1 Title";
	priority = 100;

	async generate(
		file: TFile,
		app: App,
		context: SuggestionContext
	): Promise<RenameSuggestion[]> {
		const suggestions: RenameSuggestion[] = [];

		let title = context.h1Title;
		let level = 1;

		if (!title) {
			const result = await this.findFirstHeading(file, app);
			if (result) {
				title = result.title;
				level = result.level;
			}
		}

		if (!title) {
			return suggestions;
		}

		const sanitized = this.sanitizeFilename(title);
		
		if (sanitized && sanitized !== context.currentFilename) {
			const isDuplicate = context.existingFilenames.has(sanitized);
			
			const baseScore = level === 1 ? 100 : Math.max(95 - (level - 1) * 5, 80);
			
			suggestions.push({
				label: sanitized,
				value: sanitized,
				type: 'smart',
				score: isDuplicate ? baseScore * 0.5 : baseScore,
				icon: isDuplicate ? '⚠️' : level === 1 ? '📝' : `H${level}`,
				patternKey: `h${level}-title`,
			});
		}

		return suggestions;
	}

	private async findFirstHeading(file: TFile, app: App): Promise<{title: string, level: number} | null> {
		const content = await app.vault.read(file);
		const lines = content.split("\n");
		let inCodeBlock = false;

		for (const line of lines) {
			if (line.trim().startsWith("```")) {
				inCodeBlock = !inCodeBlock;
				continue;
			}
			if (inCodeBlock) continue;

			const match = line.match(/^(#{1,6})\s+(.+)$/);
			if (match) {
				return {
					title: match[2].trim(),
					level: match[1].length
				};
			}
		}

		return null;
	}

	private sanitizeFilename(name: string): string {
		return name
			.replace(/[\\/:*?"<>|]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}
}
