import { Modal, App } from 'obsidian';
import { StatisticsManager } from './StatisticsManager';
import { StatisticsTab } from './types';
import { t } from '../../i18n/locale';

/**
 * Modal window for displaying command usage statistics
 */
export class StatisticsModal extends Modal {
	private manager: StatisticsManager;
	private currentTab: StatisticsTab;
	private tabContentEl: HTMLElement;
	private scrollPositions: Map<StatisticsTab, number> = new Map();
	private filterStates: Map<StatisticsTab, any> = new Map();

	constructor(app: App, manager: StatisticsManager, initialTab?: StatisticsTab) {
		super(app);
		this.manager = manager;
		this.currentTab = initialTab || 'overview';
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		contentEl.empty();
		contentEl.addClass('statistics-modal');

		// Force fixed dimensions on the modal
		if (modalEl) {
			modalEl.style.width = '900px';
			modalEl.style.maxWidth = '95vw';
			modalEl.style.height = '700px';
			modalEl.style.maxHeight = '90vh';
			modalEl.style.minHeight = '600px';
		}

		// Set modal title
		this.titleEl.setText(t('statistics'));

		// Create tab navigation
		this.createTabNavigation();

		// Create content container
		this.tabContentEl = contentEl.createDiv('statistics-content');

		// Render initial tab
		this.renderCurrentTab();
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}

	/**
	 * Create tab navigation
	 */
	private createTabNavigation(): void {
		const tabNav = this.contentEl.createDiv('statistics-tab-nav');

		const tabs: Array<{ id: StatisticsTab; label: string }> = [
			{ id: 'overview', label: t('overview') },
			{ id: 'commands', label: t('commands') },
			{ id: 'efficiency', label: t('efficiency') },
			{ id: 'trends', label: t('trends') }
		];

		tabs.forEach(tab => {
			const tabButton = tabNav.createEl('button', {
				text: tab.label,
				cls: 'statistics-tab-button'
			});

			if (tab.id === this.currentTab) {
				tabButton.addClass('active');
			}

			tabButton.addEventListener('click', () => {
				this.switchTab(tab.id);
			});
		});
	}

	/**
	 * Switch to a different tab
	 */
	private switchTab(tab: StatisticsTab): void {
		// Save current scroll position
		this.scrollPositions.set(this.currentTab, this.tabContentEl.scrollTop);

		// Switch tab
		this.currentTab = tab;

		// Update active tab button
		const tabButtons = this.contentEl.querySelectorAll('.statistics-tab-button');
		tabButtons.forEach((button, index) => {
			if (index === ['overview', 'commands', 'efficiency', 'trends'].indexOf(tab)) {
				button.addClass('active');
			} else {
				button.removeClass('active');
			}
		});

		// Render new tab content
		this.renderCurrentTab();

		// Restore scroll position
		const savedScroll = this.scrollPositions.get(tab);
		if (savedScroll !== undefined) {
			this.tabContentEl.scrollTop = savedScroll;
		}
	}

	/**
	 * Get the current active tab
	 */
	getCurrentTab(): StatisticsTab {
		return this.currentTab;
	}

	/**
	 * Set filter state for current tab
	 */
	protected setFilterState(state: any): void {
		this.filterStates.set(this.currentTab, state);
	}

	/**
	 * Get filter state for current tab
	 */
	protected getFilterState(): any {
		return this.filterStates.get(this.currentTab);
	}

	/**
	 * Render the current tab
	 */
	private renderCurrentTab(): void {
		this.tabContentEl.empty();

		switch (this.currentTab) {
			case 'overview':
				this.renderOverviewTab();
				break;
			case 'commands':
				this.renderCommandsTab();
				break;
			case 'efficiency':
				this.renderEfficiencyTab();
				break;
			case 'trends':
				this.renderTrendsTab();
				break;
		}
	}

	/**
	 * Render Overview tab
	 */
	private renderOverviewTab(): void {
		const container = this.tabContentEl.createDiv('overview-tab');

		// Get today's stats
		const todayStats = this.manager.getStats('day');
		const allCommandStats = this.manager.getAllCommandStats();
		const cumulativeTimeSaved = this.manager.getCumulativeTimeSaved();

		// Check if there's any data
		if (todayStats.totalCommands === 0 && allCommandStats.length === 0) {
			this.renderEmptyState(container);
			return;
		}

		// Metric cards section
		const metricsSection = container.createDiv('metrics-section');

		// Total commands card
		const mostUsedCommand = allCommandStats.length > 0 
			? allCommandStats.reduce((prev, current) => 
				current.totalUses > prev.totalUses ? current : prev
			)
			: null;

		this.renderMetricCard(
			metricsSection,
			t('totalCommands'),
			todayStats.totalCommands.toString(),
			todayStats.comparisonData?.percentageChange
		);

		this.renderMetricCard(
			metricsSection,
			t('mostUsed'),
			mostUsedCommand ? mostUsedCommand.commandName : 'N/A',
			undefined
		);

		this.renderMetricCard(
			metricsSection,
			t('timeSavedTotal'),
			this.formatTime(cumulativeTimeSaved),
			undefined
		);

		// Today's activity
		const activitySection = container.createDiv('activity-section');
		activitySection.createEl('h3', { text: t('todaysActivity') });

		const activitySummary = activitySection.createDiv('activity-summary');
		activitySummary.createEl('p', {
			text: t('todayActivitySummary', {
				count: todayStats.totalCommands.toString(),
				unique: todayStats.uniqueCommands.toString()
			})
		});

		// Top commands
		if (todayStats.topCommands.length > 0) {
			const topSection = container.createDiv('top-commands-section');
			topSection.createEl('h3', { text: t('topCommandsToday') });

			const topList = topSection.createDiv('top-commands-list');
			todayStats.topCommands.forEach(cmd => {
				const item = topList.createDiv('top-command-item');
				
				const nameEl = item.createDiv('command-name');
				nameEl.setText(cmd.commandName);

				const countEl = item.createDiv('command-count');
				countEl.setText(cmd.count.toString());

				// Visual bar
				const maxCount = todayStats.topCommands[0].count;
				const percentage = (cmd.count / maxCount) * 100;
				const bar = item.createDiv('command-bar');
				bar.style.width = `${percentage}%`;
			});
		}
	}

	/**
	 * Render empty state
	 */
	private renderEmptyState(container: HTMLElement): void {
		const emptyState = container.createDiv('empty-state');
		emptyState.createEl('h3', { text: t('noDataYet') });
		emptyState.createEl('p', {
			text: t('noDataMessage')
		});
	}

	/**
	 * Render a metric card
	 */
	private renderMetricCard(
		container: HTMLElement,
		title: string,
		value: string,
		change?: number
	): HTMLElement {
		const card = container.createDiv('metric-card');

		const titleEl = card.createDiv('metric-title');
		titleEl.setText(title);

		const valueEl = card.createDiv('metric-value');
		valueEl.setText(value);

		if (change !== undefined && change !== 0) {
			const changeEl = card.createDiv('metric-change');
			const arrow = change > 0 ? '↑' : '↓';
			const sign = change > 0 ? '+' : '';
			changeEl.setText(`${arrow} ${sign}${change.toFixed(1)}%`);
			changeEl.addClass(change > 0 ? 'positive' : 'negative');
		}

		return card;
	}

	/**
	 * Format time in seconds to human-readable format
	 */
	private formatTime(seconds: number): string {
		if (seconds < 60) {
			return `${Math.round(seconds)}s`;
		} else if (seconds < 3600) {
			const minutes = Math.floor(seconds / 60);
			const secs = Math.round(seconds % 60);
			return `${minutes}m ${secs}s`;
		} else {
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);
			return `${hours}h ${minutes}m`;
		}
	}

	/**
	 * Render Commands tab
	 */
	private renderCommandsTab(): void {
		const container = this.tabContentEl.createDiv('commands-tab');

		const allCommandStats = this.manager.getAllCommandStats();

		if (allCommandStats.length === 0) {
			this.renderEmptyState(container);
			return;
		}

		// Search and controls
		const controlsSection = container.createDiv('commands-controls');
		
		const searchInput = controlsSection.createEl('input', {
			type: 'text',
			placeholder: t('searchCommands'),
			cls: 'commands-search'
		});

		// Sort controls
		const sortSection = controlsSection.createDiv('sort-controls');
		sortSection.createEl('span', { text: t('sortBy') });

		const sortSelect = sortSection.createEl('select', { cls: 'sort-select' });
		sortSelect.createEl('option', { text: t('mostUsedSort'), value: 'uses' });
		sortSelect.createEl('option', { text: t('nameSort'), value: 'name' });
		sortSelect.createEl('option', { text: t('lastUsedSort'), value: 'lastUsed' });

		// Commands table
		const tableContainer = container.createDiv('commands-table-container');
		
		const renderTable = (stats: typeof allCommandStats, sortBy: string = 'uses') => {
			tableContainer.empty();

			// Sort stats
			const sorted = [...stats].sort((a, b) => {
				switch (sortBy) {
					case 'name':
						return a.commandName.localeCompare(b.commandName);
					case 'lastUsed':
						return b.lastUsed - a.lastUsed;
					case 'uses':
					default:
						return b.totalUses - a.totalUses;
				}
			});

			const table = tableContainer.createEl('table', { cls: 'commands-table' });
			
			// Header
			const thead = table.createEl('thead');
			const headerRow = thead.createEl('tr');
			headerRow.createEl('th', { text: t('commandName') });
			headerRow.createEl('th', { text: t('totalUses') });
			headerRow.createEl('th', { text: t('lastUsed') });
			headerRow.createEl('th', { text: t('avgPerDay') });

			// Body
			const tbody = table.createEl('tbody');
			sorted.forEach(stat => {
				const row = tbody.createEl('tr');
				row.createEl('td', { text: stat.commandName });
				row.createEl('td', { text: stat.totalUses.toString() });
				row.createEl('td', { text: this.formatDate(stat.lastUsed) });
				
				// Calculate average per day
				const daysSinceFirst = Math.max(1, Math.floor((Date.now() - stat.firstUsed) / (1000 * 60 * 60 * 24)));
				const avgPerDay = (stat.totalUses / daysSinceFirst).toFixed(1);
				row.createEl('td', { text: avgPerDay });

				// Click to show details
				row.addEventListener('click', () => {
					this.showCommandDetails(stat);
				});
			});
		};

		// Initial render
		renderTable(allCommandStats);

		// Search handler
		searchInput.addEventListener('input', () => {
			const query = searchInput.value.toLowerCase();
			const filtered = allCommandStats.filter(stat =>
				stat.commandName.toLowerCase().includes(query) ||
				stat.commandId.toLowerCase().includes(query)
			);
			renderTable(filtered, sortSelect.value);
		});

		// Sort handler
		sortSelect.addEventListener('change', () => {
			const query = searchInput.value.toLowerCase();
			const filtered = query
				? allCommandStats.filter(stat =>
					stat.commandName.toLowerCase().includes(query) ||
					stat.commandId.toLowerCase().includes(query)
				)
				: allCommandStats;
			renderTable(filtered, sortSelect.value);
		});
	}

	/**
	 * Show detailed information for a command
	 */
	private showCommandDetails(stat: any): void {
		// For now, just show an alert
		// TODO: Implement a detailed view modal or panel
		const message = `
Command: ${stat.commandName}
Total Uses: ${stat.totalUses}
First Used: ${this.formatDate(stat.firstUsed)}
Last Used: ${this.formatDate(stat.lastUsed)}
		`.trim();
		
		alert(message);
	}

	/**
	 * Format a timestamp to a readable date
	 */
	private formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return t('today');
		} else if (diffDays === 1) {
			return t('yesterday');
		} else if (diffDays < 7) {
			return t('daysAgo', { days: diffDays.toString() });
		} else {
			return date.toLocaleDateString();
		}
	}

	/**
	 * Render Efficiency tab
	 */
	private renderEfficiencyTab(): void {
		const container = this.tabContentEl.createDiv('efficiency-tab');

		// Get saved period or default to 'week'
		const savedState = this.getFilterState();
		let selectedPeriod: 'day' | 'week' | 'month' | 'year' = savedState?.period || 'week';

		// Period selector
		const controlsSection = container.createDiv('efficiency-controls');
		controlsSection.createEl('span', { text: t('timePeriod') });

		const periodSelect = controlsSection.createEl('select', { cls: 'period-select' });
		periodSelect.createEl('option', { text: t('timePeriodToday'), value: 'day' });
		periodSelect.createEl('option', { text: t('timePeriodWeek'), value: 'week' });
		periodSelect.createEl('option', { text: t('timePeriodMonth'), value: 'month' });
		periodSelect.createEl('option', { text: t('timePeriodYear'), value: 'year' });
		periodSelect.value = selectedPeriod;

		// Content container
		const contentContainer = container.createDiv('efficiency-content');

		const renderEfficiency = (period: typeof selectedPeriod) => {
			contentContainer.empty();

			const efficiencyData = this.manager.getEfficiencyData(period);
			const cumulativeTimeSaved = this.manager.getCumulativeTimeSaved();

			// Large time saved display
			const mainMetric = contentContainer.createDiv('efficiency-main-metric');
			mainMetric.createEl('h2', { text: t('timeSaved') });
			const timeValue = mainMetric.createDiv('efficiency-time-value');
			timeValue.setText(this.formatTime(efficiencyData.totalTimeSaved));

			const periodLabel = {
				day: t('today_period'),
				week: t('thisWeek_period'),
				month: t('thisMonth_period'),
				year: t('thisYear_period')
			}[period];
			mainMetric.createEl('p', { text: t('youveSaved', { period: periodLabel }) });

			// Cumulative savings
			const cumulativeSection = contentContainer.createDiv('efficiency-cumulative');
			cumulativeSection.createEl('h3', { text: t('totalTimeSavedSinceFirstUse') });
			const cumulativeValue = cumulativeSection.createDiv('cumulative-value');
			cumulativeValue.setText(this.formatTime(cumulativeTimeSaved));

			// Average per day
			const avgSection = contentContainer.createDiv('efficiency-average');
			avgSection.createEl('h3', { text: t('averagePerDay') });
			const avgValue = avgSection.createDiv('average-value');
			avgValue.setText(this.formatTime(efficiencyData.averagePerDay));

			// Breakdown by command
			if (efficiencyData.commandBreakdown.length > 0) {
				const breakdownSection = contentContainer.createDiv('efficiency-breakdown');
				breakdownSection.createEl('h3', { text: t('timeSavedByCommand') });

				const breakdownList = breakdownSection.createDiv('breakdown-list');
				efficiencyData.commandBreakdown.forEach(item => {
					const row = breakdownList.createDiv('breakdown-item');
					
					const nameEl = row.createDiv('breakdown-name');
					nameEl.setText(item.commandName);

					const statsEl = row.createDiv('breakdown-stats');
					statsEl.setText(`${this.formatTime(item.timeSaved)} (${item.executionCount} ${t('uses')})`);

					// Visual bar
					const maxTime = efficiencyData.commandBreakdown[0].timeSaved;
					const percentage = (item.timeSaved / maxTime) * 100;
					const bar = row.createDiv('breakdown-bar');
					bar.style.width = `${percentage}%`;
				});
			} else {
				contentContainer.createEl('p', {
					text: t('noEfficiencyData')
				});
			}
		};

		// Initial render
		renderEfficiency(selectedPeriod);

		// Period change handler
		periodSelect.addEventListener('change', () => {
			selectedPeriod = periodSelect.value as typeof selectedPeriod;
			this.setFilterState({ period: selectedPeriod });
			renderEfficiency(selectedPeriod);
		});
	}

	/**
	 * Render Trends tab
	 */
	private renderTrendsTab(): void {
		const container = this.tabContentEl.createDiv('trends-tab');

		const allEvents = this.manager.getData().events;

		if (allEvents.length === 0) {
			this.renderEmptyState(container);
			return;
		}

		// Chart type selector
		const controlsSection = container.createDiv('trends-controls');
		controlsSection.createEl('span', { text: t('view') });

		const chartTypeSelect = controlsSection.createEl('select', { cls: 'chart-type-select' });
		chartTypeSelect.createEl('option', { text: t('usageOverTime'), value: 'line' });
		chartTypeSelect.createEl('option', { text: t('weeklyHeatmap'), value: 'heatmap' });

		// Chart container
		const chartContainer = container.createDiv('chart-container');

		const renderChart = (chartType: string) => {
			chartContainer.empty();

			if (chartType === 'line') {
				this.renderLineChart(chartContainer, allEvents);
			} else if (chartType === 'heatmap') {
				this.renderHeatmap(chartContainer, allEvents);
			}
		};

		// Initial render
		renderChart('line');

		// Chart type change handler
		chartTypeSelect.addEventListener('change', () => {
			renderChart(chartTypeSelect.value);
		});
	}

	/**
	 * Render a simple line chart showing usage over time
	 */
	private renderLineChart(container: HTMLElement, events: any[]): void {
		container.createEl('h3', { text: t('commandUsageOverLast30Days') });

		// Group events by day
		const dayGroups = new Map<string, number>();
		const now = Date.now();
		const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

		events.forEach(event => {
			if (event.timestamp >= thirtyDaysAgo) {
				const date = new Date(event.timestamp);
				const dayKey = date.toISOString().split('T')[0];
				dayGroups.set(dayKey, (dayGroups.get(dayKey) || 0) + 1);
			}
		});

		// Create simple bar chart
		const chartEl = container.createDiv('simple-chart');
		
		if (dayGroups.size === 0) {
			chartEl.createEl('p', { text: t('noDataInLast30Days') });
			return;
		}

		const maxCount = Math.max(...Array.from(dayGroups.values()));

		// Sort by date
		const sortedDays = Array.from(dayGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]));

		sortedDays.forEach(([day, count]) => {
			const barContainer = chartEl.createDiv('chart-bar-container');
			
			const label = barContainer.createDiv('chart-label');
			const date = new Date(day);
			label.setText(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

			const barWrapper = barContainer.createDiv('chart-bar-wrapper');
			const bar = barWrapper.createDiv('chart-bar');
			const percentage = (count / maxCount) * 100;
			bar.style.height = `${percentage}%`;
			bar.setAttribute('title', `${count} ${t('commands_count')}`);

			const countLabel = barContainer.createDiv('chart-count');
			countLabel.setText(count.toString());
		});
	}

	/**
	 * Render a heatmap showing usage by day of week and hour
	 */
	private renderHeatmap(container: HTMLElement, events: any[]): void {
		container.createEl('h3', { text: t('usageHeatmapDayHour') });

		// Group events by day of week and hour
		const heatmapData: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

		events.forEach(event => {
			const date = new Date(event.timestamp);
			const dayOfWeek = date.getDay(); // 0 = Sunday
			const hour = date.getHours();
			heatmapData[dayOfWeek][hour]++;
		});

		// Find max for normalization
		const maxCount = Math.max(...heatmapData.flat());

		if (maxCount === 0) {
			container.createEl('p', { text: t('noDataAvailable') });
			return;
		}

		// Create heatmap
		const heatmapEl = container.createDiv('heatmap');

		const days = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

		days.forEach((dayName, dayIndex) => {
			const row = heatmapEl.createDiv('heatmap-row');
			
			const dayLabel = row.createDiv('heatmap-day-label');
			dayLabel.setText(dayName);

			const cellsContainer = row.createDiv('heatmap-cells');

			for (let hour = 0; hour < 24; hour++) {
				const count = heatmapData[dayIndex][hour];
				const cell = cellsContainer.createDiv('heatmap-cell');
				
				// Calculate intensity (0-1)
				const intensity = count / maxCount;
				const opacity = Math.max(0.1, intensity);
				cell.style.opacity = opacity.toString();
				
				if (count > 0) {
					cell.setAttribute('title', `${dayName} ${hour}:00 - ${count} ${t('commands_count')}`);
				}
			}
		});

		// Add hour labels
		const hourLabels = heatmapEl.createDiv('heatmap-hour-labels');
		hourLabels.createDiv('heatmap-day-label'); // Spacer
		const labelsContainer = hourLabels.createDiv('heatmap-cells');
		for (let hour = 0; hour < 24; hour += 3) {
			const label = labelsContainer.createDiv('heatmap-hour-label');
			label.setText(`${hour}h`);
		}
	}
}
