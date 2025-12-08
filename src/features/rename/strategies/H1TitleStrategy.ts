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

		if (!context.h1Title) {
			return suggestions;
		}

		const sanitized = this.sanitizeFilename(context.h1Title);
		
		if (sanitized && sanitized !== context.currentFilename) {
			const isDuplicate = context.existingFilenames.has(sanitized);
			
			suggestions.push({
				label: sanitized,
				value: sanitized,
				type: 'smart',
				score: isDuplicate ? 50 : 100,
				icon: isDuplicate ? '⚠️' : '📝',
				patternKey: 'h1-title',
			});
		}

		return suggestions;
	}

	private sanitizeFilename(name: string): string {
		return name
			.replace(/[\\/:*?"<>|]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}
}
