import { TFile, App } from "obsidian";
import { SuggestionStrategy, SuggestionContext } from "../RenameFilenameSuggestionEngine";
import { RenameSuggestion } from "../RenameHistoryManager";

export class PathContextStrategy implements SuggestionStrategy {
	name = "Path Context";
	priority = 88;

	async generate(
		file: TFile,
		app: App,
		context: SuggestionContext
	): Promise<RenameSuggestion[]> {
		const suggestions: RenameSuggestion[] = [];

		if (!context.h1Title || !file.parent) {
			return suggestions;
		}

		const siblingFiles = app.vault.getMarkdownFiles()
			.filter(f => f.parent?.path === file.parent?.path && f.path !== file.path);

		if (siblingFiles.length === 0) {
			return suggestions;
		}

		const patterns = this.detectNamingPatterns(siblingFiles);
		const sanitizedH1 = this.sanitizeFilename(context.h1Title);

		for (const pattern of patterns) {
			const newName = this.applyPattern(sanitizedH1, pattern);
			if (newName && newName !== context.currentFilename && !context.existingFilenames.has(newName)) {
				suggestions.push({
					label: newName,
					value: newName,
					type: 'smart',
					score: pattern.score,
					icon: pattern.icon,
					patternKey: `path-context:${pattern.type}`,
				});
			}
		}

		return suggestions;
	}

	private detectNamingPatterns(files: TFile[]): Array<{type: string, pattern: RegExp, format: string, score: number, icon: string}> {
		const patterns: Array<{type: string, pattern: RegExp, format: string, score: number, icon: string}> = [];
		const names = files.map(f => f.basename);

		const datePrefix = names.filter(n => /^\d{4}-\d{2}-\d{2}/.test(n)).length;
		if (datePrefix > files.length * 0.3) {
			patterns.push({
				type: 'date-prefix',
				pattern: /^\d{4}-\d{2}-\d{2}/,
				format: 'YYYY-MM-DD',
				score: 85,
				icon: '📅'
			});
		}

		const numberPrefix = names.filter(n => /^\d{2,4}-/.test(n)).length;
		if (numberPrefix > files.length * 0.3) {
			const maxNum = Math.max(...names
				.map(n => n.match(/^(\d{2,4})-/))
				.filter(m => m)
				.map(m => parseInt(m![1])));
			patterns.push({
				type: 'number-prefix',
				pattern: /^\d{2,4}-/,
				format: String(maxNum + 1).padStart(3, '0'),
				score: 80,
				icon: '🔢'
			});
		}

		const bracketPrefix = names.filter(n => /^\[.+?\]-/.test(n)).length;
		if (bracketPrefix > files.length * 0.3) {
			const match = names.find(n => /^\[.+?\]-/.test(n))?.match(/^\[(.+?)\]-/);
			if (match) {
				patterns.push({
					type: 'bracket-prefix',
					pattern: /^\[.+?\]-/,
					format: match[1],
					score: 82,
					icon: '📁'
				});
			}
		}

		return patterns;
	}

	private applyPattern(h1: string, pattern: {type: string, format: string}): string {
		const now = new Date();
		
		switch (pattern.type) {
			case 'date-prefix':
				const date = now.toISOString().split('T')[0];
				return `${date}-${h1}`;
			case 'number-prefix':
				return `${pattern.format}-${h1}`;
			case 'bracket-prefix':
				return `[${pattern.format}]-${h1}`;
			default:
				return h1;
		}
	}

	private sanitizeFilename(name: string): string {
		return name
			.replace(/[\\/:*?"<>|]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}
}
