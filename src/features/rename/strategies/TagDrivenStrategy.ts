import { TFile, App } from "obsidian";
import { SuggestionStrategy, SuggestionContext } from "../RenameFilenameSuggestionEngine";
import { RenameSuggestion } from "../RenameHistoryManager";

export class TagDrivenStrategy implements SuggestionStrategy {
	name = "Tag-Driven";
	priority = 95;

	async generate(
		file: TFile,
		app: App,
		context: SuggestionContext
	): Promise<RenameSuggestion[]> {
		const suggestions: RenameSuggestion[] = [];

		if (!context.h1Title) {
			return suggestions;
		}

		const cache = app.metadataCache.getFileCache(file);
		if (!cache?.frontmatter?.tags) {
			return suggestions;
		}

		const tags = this.extractTags(cache.frontmatter.tags);
		if (tags.length === 0) {
			return suggestions;
		}

		const sanitizedH1 = this.sanitizeFilename(context.h1Title);
		const category = cache.frontmatter.category || cache.frontmatter.type;

		const patterns = [
			{ format: (t: string[]) => `${t.slice(0, 2).join('_')}_${sanitizedH1}`, icon: '🏷️', score: 85 },
			{ format: (t: string[]) => `[${t[0]}]-${sanitizedH1}`, icon: '📁', score: 80 },
			{ format: (t: string[]) => `#${t[0]} ${sanitizedH1}`, icon: '🔖', score: 75 },
		];

		if (category) {
			patterns.unshift({
				format: () => `[${category}]-${tags[0]}-${sanitizedH1}`,
				icon: '📂',
				score: 90
			});
		}

		for (const pattern of patterns) {
			const newName = pattern.format(tags);
			if (newName !== context.currentFilename && !context.existingFilenames.has(newName)) {
				suggestions.push({
					label: newName,
					value: newName,
					type: 'smart',
					score: pattern.score,
					icon: pattern.icon,
					patternKey: `tag-driven:${pattern.icon}`,
				});
			}
		}

		return suggestions;
	}

	private extractTags(tags: any): string[] {
		const tagList: string[] = [];
		
		if (Array.isArray(tags)) {
			tagList.push(...tags.map(t => String(t).replace(/^#/, '')));
		} else if (typeof tags === 'string') {
			tagList.push(tags.replace(/^#/, ''));
		}

		return tagList.filter(t => t.length > 0);
	}

	private sanitizeFilename(name: string): string {
		return name
			.replace(/[\\/:*?"<>|]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}
}
