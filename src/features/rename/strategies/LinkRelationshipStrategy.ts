import { TFile, App } from "obsidian";
import { SuggestionStrategy, SuggestionContext } from "../RenameFilenameSuggestionEngine";
import { RenameSuggestion } from "../RenameHistoryManager";

export class LinkRelationshipStrategy implements SuggestionStrategy {
	name = "Link Relationship";
	priority = 83;

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
		if (!cache?.links || cache.links.length === 0) {
			return suggestions;
		}

		const linkedFiles = cache.links
			.map(link => app.metadataCache.getFirstLinkpathDest(link.link, file.path))
			.filter(f => f !== null) as TFile[];

		if (linkedFiles.length === 0) {
			return suggestions;
		}

		const linkCounts = new Map<string, number>();
		linkedFiles.forEach(f => {
			const basename = f.basename;
			linkCounts.set(basename, (linkCounts.get(basename) || 0) + 1);
		});

		const topLinks = Array.from(linkCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3);

		const sanitizedH1 = this.sanitizeFilename(context.h1Title);

		for (const [linkName, count] of topLinks) {
			const patterns = [
				{ format: `${linkName}-${sanitizedH1}`, icon: '🔗', score: 78 },
				{ format: `${sanitizedH1}-${linkName}`, icon: '🔗', score: 75 },
			];

			for (const pattern of patterns) {
				if (pattern.format !== context.currentFilename && !context.existingFilenames.has(pattern.format)) {
					suggestions.push({
						label: pattern.format,
						value: pattern.format,
						type: 'smart',
						score: pattern.score + (count > 1 ? 5 : 0),
						icon: pattern.icon,
						patternKey: `link-relationship:${linkName}`,
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
