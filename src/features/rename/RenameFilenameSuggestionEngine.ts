import { TFile, App } from "obsidian";
import { RenameSuggestion } from "./RenameHistoryManager";

export interface SuggestionStrategy {
	name: string;
	priority: number;
	generate(file: TFile, app: App, context: SuggestionContext): Promise<RenameSuggestion[]>;
}

export interface SuggestionContext {
	currentFilename: string;
	h1Title?: string;
	historicalPatterns: HistoricalPattern[];
	existingFilenames: Set<string>;
}

export interface HistoricalPattern {
	type: 'suffix' | 'prefix';
	value: string;
	frequency: number;
	lastUsed: number;
	acceptRate: number;
}

export class RenameFilenameSuggestionEngine {
	private strategies: SuggestionStrategy[] = [];
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	registerStrategy(strategy: SuggestionStrategy): void {
		this.strategies.push(strategy);
		this.strategies.sort((a, b) => b.priority - a.priority);
	}

	async generateSuggestions(
		file: TFile,
		historicalPatterns: HistoricalPattern[],
		maxSuggestions: number = 10
	): Promise<RenameSuggestion[]> {
		const h1Title = await this.extractH1Title(file);
		const existingFilenames = this.getExistingFilenames();

		const context: SuggestionContext = {
			currentFilename: file.basename,
			h1Title,
			historicalPatterns,
			existingFilenames,
		};

		const allSuggestions: RenameSuggestion[] = [];

		for (const strategy of this.strategies) {
			const suggestions = await strategy.generate(file, this.app, context);
			allSuggestions.push(...suggestions);
		}

		return this.deduplicateAndRank(allSuggestions, maxSuggestions);
	}

	private async extractH1Title(file: TFile): Promise<string | undefined> {
		const content = await this.app.vault.read(file);
		const lines = content.split("\n");
		let inCodeBlock = false;

		for (const line of lines) {
			if (line.trim().startsWith("```")) {
				inCodeBlock = !inCodeBlock;
				continue;
			}
			if (inCodeBlock) continue;

			const match = line.match(/^#\s+(.+)$/);
			if (match) {
				return match[1].trim();
			}
		}

		return undefined;
	}

	private getExistingFilenames(): Set<string> {
		const filenames = new Set<string>();
		this.app.vault.getMarkdownFiles().forEach((file) => {
			filenames.add(file.basename);
		});
		return filenames;
	}

	private deduplicateAndRank(
		suggestions: RenameSuggestion[],
		maxSuggestions: number
	): RenameSuggestion[] {
		const seen = new Map<string, RenameSuggestion>();

		for (const suggestion of suggestions) {
			const existing = seen.get(suggestion.value);
			if (!existing || suggestion.score > existing.score) {
				seen.set(suggestion.value, suggestion);
			}
		}

		return Array.from(seen.values())
			.sort((a, b) => b.score - a.score)
			.slice(0, maxSuggestions);
	}
}
