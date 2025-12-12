import { TFile, App } from "obsidian";
import { SuggestionStrategy, SuggestionContext } from "../RenameFilenameSuggestionEngine";
import { RenameSuggestion } from "../RenameHistoryManager";

export class KeywordExtractionStrategy implements SuggestionStrategy {
	name = "Keyword Extraction";
	priority = 70;

	async generate(
		file: TFile,
		app: App,
		context: SuggestionContext
	): Promise<RenameSuggestion[]> {
		const suggestions: RenameSuggestion[] = [];

		if (context.h1Title) {
			return suggestions;
		}

		const content = await app.vault.read(file);
		const keywords = this.extractKeywords(content);

		if (keywords.length === 0) {
			return suggestions;
		}

		const patterns = [
			{ format: keywords.slice(0, 3).join('_'), icon: '🔑', score: 70 },
			{ format: keywords.slice(0, 2).join('-'), icon: '🔑', score: 68 },
			{ format: keywords[0], icon: '🔑', score: 65 },
		];

		for (const pattern of patterns) {
			if (pattern.format && pattern.format !== context.currentFilename && !context.existingFilenames.has(pattern.format)) {
				suggestions.push({
					label: pattern.format,
					value: pattern.format,
					type: 'smart',
					score: pattern.score,
					icon: pattern.icon,
					patternKey: 'keyword-extraction',
				});
			}
		}

		return suggestions;
	}

	private extractKeywords(content: string): string[] {
		const text = content
			.replace(/```[\s\S]*?```/g, '')
			.replace(/[#*`\[\]()]/g, ' ')
			.substring(0, 500);

		const words = text
			.split(/\s+/)
			.map(w => w.trim())
			.filter(w => w.length > 2 && w.length < 20)
			.filter(w => !/^\d+$/.test(w));

		const wordCount = new Map<string, number>();
		words.forEach(word => {
			const lower = word.toLowerCase();
			wordCount.set(lower, (wordCount.get(lower) || 0) + 1);
		});

		const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'car', 'let', 'put', 'say', 'she', 'too', 'use', '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没', '看', '好', '自己', '这个', '那个', '什么', '怎么']);

		return Array.from(wordCount.entries())
			.filter(([word]) => !stopWords.has(word))
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([word]) => word);
	}
}
