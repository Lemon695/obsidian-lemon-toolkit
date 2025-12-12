import { TFile, App } from "obsidian";
import { SuggestionStrategy, SuggestionContext } from "../RenameFilenameSuggestionEngine";
import { RenameSuggestion } from "../RenameHistoryManager";

export class FolderNameStrategy implements SuggestionStrategy {
	name = "Folder Name";
	priority = 82;

	async generate(
		file: TFile,
		app: App,
		context: SuggestionContext
	): Promise<RenameSuggestion[]> {
		const suggestions: RenameSuggestion[] = [];

		if (!context.h1Title || !file.parent) {
			return suggestions;
		}

		const sanitizedH1 = this.sanitizeFilename(context.h1Title);
		const folderPath = file.parent.path.split('/');
		
		const relevantFolders = folderPath
			.filter(f => f && f !== '.' && f !== '..')
			.slice(-2);

		if (relevantFolders.length === 0) {
			return suggestions;
		}

		const patterns = [
			{ format: (f: string) => `${f}-${sanitizedH1}`, icon: '📁', score: 80 },
			{ format: (f: string) => `[${f}]-${sanitizedH1}`, icon: '📂', score: 78 },
			{ format: (f: string) => `${sanitizedH1}-${f}`, icon: '📁', score: 75 },
		];

		for (const folder of relevantFolders) {
			for (const pattern of patterns) {
				const newName = pattern.format(folder);
				if (newName !== context.currentFilename && !context.existingFilenames.has(newName)) {
					suggestions.push({
						label: newName,
						value: newName,
						type: 'smart',
						score: pattern.score,
						icon: pattern.icon,
						patternKey: `folder-name:${folder}`,
					});
				}
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
}
