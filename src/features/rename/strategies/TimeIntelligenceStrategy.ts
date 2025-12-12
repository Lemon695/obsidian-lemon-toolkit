import { TFile, App } from "obsidian";
import { SuggestionStrategy, SuggestionContext } from "../RenameFilenameSuggestionEngine";
import { RenameSuggestion } from "../RenameHistoryManager";

export class TimeIntelligenceStrategy implements SuggestionStrategy {
	name = "Time Intelligence";
	priority = 87;

	async generate(
		file: TFile,
		app: App,
		context: SuggestionContext
	): Promise<RenameSuggestion[]> {
		const suggestions: RenameSuggestion[] = [];

		if (!context.h1Title) {
			return suggestions;
		}

		const sanitizedH1 = this.sanitizeFilename(context.h1Title);
		const now = new Date();
		const ctime = new Date(file.stat.ctime);

		const scenarios = this.detectScenario(context.h1Title, file);

		const formats = [
			{
				name: 'daily',
				format: this.formatDate(ctime, 'YYYY-MM-DD'),
				template: (d: string, h: string) => `${d}-${h}`,
				icon: '📅',
				score: 85,
				condition: scenarios.includes('daily')
			},
			{
				name: 'weekly',
				format: this.formatWeek(ctime),
				template: (d: string, h: string) => `${d}-${h}`,
				icon: '📆',
				score: 80,
				condition: scenarios.includes('weekly')
			},
			{
				name: 'monthly',
				format: this.formatDate(ctime, 'YYYY-MM'),
				template: (d: string, h: string) => `${d}-${h}`,
				icon: '📊',
				score: 78,
				condition: scenarios.includes('monthly')
			},
			{
				name: 'timestamp',
				format: this.formatDate(now, 'YYYYMMDDHHmm'),
				template: (d: string, h: string) => `${h}-${d}`,
				icon: '⏰',
				score: 70,
				condition: true
			}
		];

		for (const fmt of formats) {
			if (!fmt.condition) continue;
			
			const newName = fmt.template(fmt.format, sanitizedH1);
			if (newName !== context.currentFilename && !context.existingFilenames.has(newName)) {
				suggestions.push({
					label: newName,
					value: newName,
					type: 'smart',
					score: fmt.score,
					icon: fmt.icon,
					patternKey: `time-intelligence:${fmt.name}`,
				});
			}
		}

		return suggestions;
	}

	private detectScenario(h1: string, file: TFile): string[] {
		const scenarios: string[] = [];
		const h1Lower = h1.toLowerCase();

		const dailyKeywords = ['日记', '每日', 'daily', 'journal', '今天', 'today'];
		const weeklyKeywords = ['周报', '周记', 'weekly', 'week'];
		const monthlyKeywords = ['月报', '月度', 'monthly', 'month'];

		if (dailyKeywords.some(k => h1Lower.includes(k))) {
			scenarios.push('daily');
		}
		if (weeklyKeywords.some(k => h1Lower.includes(k))) {
			scenarios.push('weekly');
		}
		if (monthlyKeywords.some(k => h1Lower.includes(k))) {
			scenarios.push('monthly');
		}

		if (scenarios.length === 0 && file.parent?.name.match(/日记|journal|diary/i)) {
			scenarios.push('daily');
		}

		return scenarios;
	}

	private formatDate(date: Date, format: string): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hour = String(date.getHours()).padStart(2, '0');
		const minute = String(date.getMinutes()).padStart(2, '0');

		return format
			.replace('YYYY', String(year))
			.replace('MM', month)
			.replace('DD', day)
			.replace('HH', hour)
			.replace('mm', minute);
	}

	private formatWeek(date: Date): string {
		const year = date.getFullYear();
		const firstDay = new Date(year, 0, 1);
		const days = Math.floor((date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
		const week = Math.ceil((days + firstDay.getDay() + 1) / 7);
		return `${year}-W${String(week).padStart(2, '0')}`;
	}

	private sanitizeFilename(name: string): string {
		return name
			.replace(/[\\/:*?"<>|]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}
}
