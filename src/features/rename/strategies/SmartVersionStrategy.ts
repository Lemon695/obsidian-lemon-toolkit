import { TFile, App } from "obsidian";
import { SuggestionStrategy, SuggestionContext } from "../RenameFilenameSuggestionEngine";
import { RenameSuggestion } from "../RenameHistoryManager";

export class SmartVersionStrategy implements SuggestionStrategy {
	name = "Smart Version";
	priority = 80;

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

		const hasVersionPattern = context.historicalPatterns.some(
			(p) => p.value.match(/v\d+/i) || p.value.match(/版本/i)
		);

		if (!hasVersionPattern) {
			return suggestions;
		}

		const similarFiles = this.findSimilarFiles(sanitized, context.existingFilenames);
		const nextVersion = this.calculateNextVersion(similarFiles);

		const versionSuffixes = [
			`-v${nextVersion}`,
			`-V${nextVersion}`,
			`-版本${nextVersion}`,
		];

		for (const suffix of versionSuffixes) {
			const newName = `${sanitized}${suffix}`;
			
			if (!context.existingFilenames.has(newName)) {
				suggestions.push({
					label: newName,
					value: newName,
					type: 'smart',
					score: 75,
					icon: '🔢',
					patternKey: `version:${suffix}`,
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

	private findSimilarFiles(baseName: string, existingFiles: Set<string>): string[] {
		const similar: string[] = [];
		const baseClean = baseName.toLowerCase().replace(/[-_\s]/g, '');

		for (const filename of existingFiles) {
			const fileClean = filename.toLowerCase().replace(/[-_\s]/g, '');
			if (fileClean.startsWith(baseClean)) {
				similar.push(filename);
			}
		}

		return similar;
	}

	private calculateNextVersion(similarFiles: string[]): number {
		let maxVersion = 0;

		for (const file of similarFiles) {
			const match = file.match(/v(\d+)/i);
			if (match) {
				const version = parseInt(match[1], 10);
				if (version > maxVersion) {
					maxVersion = version;
				}
			}
		}

		return maxVersion + 1;
	}
}
