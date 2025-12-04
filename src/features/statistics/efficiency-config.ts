/**
 * Efficiency configuration for command time savings
 * 
 * This module defines how much time each command saves compared to manual operations.
 * Time estimates are based on typical user workflows and can be customized.
 */

import { EfficiencyEstimate } from './types';

/**
 * Default efficiency estimates for all commands
 * 
 * Each estimate includes:
 * - commandId: Unique identifier for the command
 * - manualTimeSeconds: Estimated time to perform the task manually
 * - commandTimeSeconds: Time it takes to execute the command
 * - description: Human-readable description of what the command does
 */
export interface EfficiencyConfig extends EfficiencyEstimate {
	description: string;
	category?: string;
}

/**
 * Default efficiency configurations
 * 
 * IMPORTANT: These estimates reflect REAL VALUE, not just speed differences
 * 
 * Manual time = What you'd do WITHOUT this plugin feature
 * Command time = Using this plugin's feature
 * 
 * Key principles:
 * 1. If Obsidian has native feature: savings are small (convenience only)
 * 2. If plugin adds NEW capability: savings are significant (vs workaround)
 * 3. Conservative estimates - better to underestimate than overestimate
 * 4. Focus on FREQUENT tasks where small savings compound
 */
export const DEFAULT_EFFICIENCY_CONFIG: Record<string, EfficiencyConfig> = {
	// File Operations
	'duplicate-file': {
		commandId: 'duplicate-file',
		manualTimeSeconds: 3,
		// Manual: Obsidian has Cmd+P → "duplicate" → auto-names with " 1" suffix
		// This plugin adds custom naming (timestamp/UUID)
		// Real value: Avoiding manual rename after duplicate
		// Savings: 2-3 seconds of thinking + typing custom name
		commandTimeSeconds: 1,
		description: 'Duplicate with custom naming format',
		category: 'File Operations'
	},
	'move-file': {
		commandId: 'move-file',
		manualTimeSeconds: 2,
		// Manual: Obsidian has native move file command
		// This plugin adds: recent folders, smart sorting
		// Real value: Faster folder selection (no scrolling through full list)
		// Savings: 1-2 seconds finding folder in sorted list
		commandTimeSeconds: 1,
		description: 'Move file with smart folder suggestions',
		category: 'File Operations'
	},
	'delete-file': {
		commandId: 'delete-file',
		manualTimeSeconds: 1.5,
		// Manual: Obsidian has native delete
		// This plugin: Same speed, just alternative access
		// Minimal savings: 0.5s (convenience of having in custom palette)
		commandTimeSeconds: 1,
		description: 'Quick delete file',
		category: 'File Operations'
	},

	// Path Operations
	'copy-relative-path': {
		commandId: 'copy-relative-path',
		manualTimeSeconds: 8,
		// Manual: Obsidian doesn't have this feature natively
		// Workaround: Look at breadcrumb (1s) → Manually type path (5s) → Verify (2s) = 8s
		// Or: Check file explorer tree position and construct path mentally
		commandTimeSeconds: 0.5,
		description: 'Copy relative path to clipboard',
		category: 'Path Operations'
	},
	'copy-absolute-path': {
		commandId: 'copy-absolute-path',
		manualTimeSeconds: 10,
		// Manual: Obsidian doesn't have this
		// Workaround: Right-click → Show in system explorer (2s) → Right-click in Finder (1s)
		// → Get Info (2s) → Find path (2s) → Select and copy (2s) → Back to Obsidian (1s) = 10s
		commandTimeSeconds: 0.5,
		description: 'Copy absolute path to clipboard',
		category: 'Path Operations'
	},

	// Content Operations
	'heading-numbering': {
		commandId: 'heading-numbering',
		manualTimeSeconds: 60,
		// Manual: Obsidian has NO automatic heading numbering
		// For 10 headings: Type "1. " before each (2s each) = 20s
		// + Updating all numbers when inserting/removing headings (30s)
		// + Checking hierarchy consistency (10s) = 60s
		// This is THE killer feature - huge time saver
		commandTimeSeconds: 1,
		description: 'Auto-number headings (Obsidian has no native feature)',
		category: 'Content Operations'
	},
	'smart-copy': {
		commandId: 'smart-copy',
		manualTimeSeconds: 6,
		// Manual: Obsidian has Cmd+C
		// This plugin adds: automatic formatting cleanup based on rules
		// Real value: When copying from web/other apps with unwanted formatting
		// Without plugin: Paste → notice issues → undo → paste as plain text → reformat = 6s
		// With plugin: Copy with rules applied = 1s
		commandTimeSeconds: 1,
		description: 'Copy with auto-cleanup rules',
		category: 'Content Operations'
	},
	'smart-paste': {
		commandId: 'smart-paste',
		manualTimeSeconds: 8,
		// Manual: Obsidian has Cmd+V
		// This plugin: Applies regex rules on paste (e.g., remove Weibo image links)
		// Without plugin: Paste → manually find/replace unwanted patterns (8s)
		// With plugin: Paste with rules = 1s
		commandTimeSeconds: 1,
		description: 'Paste with auto-cleanup rules',
		category: 'Content Operations'
	},

	// Link Operations
	'link-converter': {
		commandId: 'link-converter',
		manualTimeSeconds: 20,
		// Manual: Obsidian has NO bulk link converter
		// For 5 links: Manually edit each [[link]] to [link](link.md) = 4s each = 20s
		// This plugin: Converts all at once
		commandTimeSeconds: 1,
		description: 'Bulk convert wiki ↔ markdown links',
		category: 'Link Operations'
	},

	// Navigation
	'recent-files': {
		commandId: 'recent-files',
		manualTimeSeconds: 2,
		// Manual: Obsidian has Cmd+O (Quick Switcher)
		// This plugin: Shows recent files sorted by usage
		// Savings: 1-2s when you want "that file I just used" vs typing name
		commandTimeSeconds: 1,
		description: 'Recent files with smart sorting',
		category: 'Navigation'
	},
	'command-palette': {
		commandId: 'command-palette',
		manualTimeSeconds: 2,
		// Manual: Obsidian has Cmd+P
		// This plugin: Adds pinned commands at top
		// Savings: 1-2s not having to type/search for frequent commands
		commandTimeSeconds: 1,
		description: 'Command palette with pinned favorites',
		category: 'Navigation'
	},

	// Frontmatter
	'edit-frontmatter': {
		commandId: 'edit-frontmatter',
		manualTimeSeconds: 12,
		// Manual: Scroll to top (1s) → Edit YAML directly (3s)
		// → Fix YAML syntax errors (5s) → Scroll back (1s) → Verify (2s) = 12s
		// This plugin: Visual editor, no syntax errors
		commandTimeSeconds: 3,
		description: 'Visual frontmatter editor (prevents YAML errors)',
		category: 'Frontmatter'
	},

	// Tags
	'add-tag': {
		commandId: 'add-tag',
		manualTimeSeconds: 3,
		// Manual: Type #tag directly (2s) → Check if typo (1s) = 3s
		// This plugin: Autocomplete from existing tags (prevents typos)
		commandTimeSeconds: 1.5,
		description: 'Add tag with autocomplete',
		category: 'Tags'
	},
	'remove-tag': {
		commandId: 'remove-tag',
		manualTimeSeconds: 2,
		// Manual: Find tag (1s) → Select and delete (1s) = 2s
		// This plugin: Select from list (no searching)
		commandTimeSeconds: 1.5,
		description: 'Remove tag from list',
		category: 'Tags'
	},

	// Logging
	'moment-logger': {
		commandId: 'moment-logger',
		manualTimeSeconds: 6,
		// Manual: Type timestamp manually "2024-12-05 14:30:00" (6s)
		// This plugin: Auto-insert formatted timestamp
		commandTimeSeconds: 0.5,
		description: 'Auto-insert formatted timestamp',
		category: 'Logging'
	},

	// Text Selection
	'select-word': {
		commandId: 'select-word',
		manualTimeSeconds: 0.8,
		// Manual: Double-click (0.8s)
		// This plugin: Hotkey (0.3s) - small savings, convenience
		commandTimeSeconds: 0.3,
		description: 'Quick word selection',
		category: 'Text Selection'
	},
	'select-line': {
		commandId: 'select-line',
		manualTimeSeconds: 0.8,
		// Manual: Cmd+L or triple-click (0.8s)
		// This plugin: Hotkey (0.3s)
		commandTimeSeconds: 0.3,
		description: 'Quick line selection',
		category: 'Text Selection'
	},
	'select-sentence': {
		commandId: 'select-sentence',
		manualTimeSeconds: 3,
		// Manual: Obsidian has NO sentence selection
		// Must manually click start → Shift+click end (3s)
		commandTimeSeconds: 0.3,
		description: 'Select sentence (no native feature)',
		category: 'Text Selection'
	},
	'select-paragraph': {
		commandId: 'select-paragraph',
		manualTimeSeconds: 0.8,
		// Manual: Triple-click (0.8s)
		// This plugin: Hotkey (0.3s)
		commandTimeSeconds: 0.3,
		description: 'Quick paragraph selection',
		category: 'Text Selection'
	}
};

/**
 * Get efficiency estimate for a command
 */
export function getEfficiencyEstimate(commandId: string): EfficiencyConfig | undefined {
	return DEFAULT_EFFICIENCY_CONFIG[commandId];
}

/**
 * Get all efficiency estimates
 */
export function getAllEfficiencyEstimates(): Record<string, EfficiencyConfig> {
	return { ...DEFAULT_EFFICIENCY_CONFIG };
}

/**
 * Get efficiency estimates grouped by category
 */
export function getEfficiencyEstimatesByCategory(): Record<string, EfficiencyConfig[]> {
	const grouped: Record<string, EfficiencyConfig[]> = {};
	
	Object.values(DEFAULT_EFFICIENCY_CONFIG).forEach(config => {
		const category = config.category || 'Other';
		if (!grouped[category]) {
			grouped[category] = [];
		}
		grouped[category].push(config);
	});
	
	return grouped;
}

/**
 * Calculate time saved for a single command execution
 */
export function calculateTimeSaved(commandId: string): number {
	const estimate = getEfficiencyEstimate(commandId);
	if (!estimate) {
		return 0;
	}
	return estimate.manualTimeSeconds - estimate.commandTimeSeconds;
}

/**
 * Calculate total time saved for multiple executions
 */
export function calculateTotalTimeSaved(commandId: string, executionCount: number): number {
	return calculateTimeSaved(commandId) * executionCount;
}

/**
 * Format time in seconds to human-readable string
 */
export function formatTimeSaved(seconds: number): string {
	if (seconds < 60) {
		return `${Math.round(seconds)}秒`;
	} else if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		const secs = Math.round(seconds % 60);
		if (secs === 0) {
			return `${minutes}分钟`;
		}
		return `${minutes}分${secs}秒`;
	} else if (seconds < 86400) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (minutes === 0) {
			return `${hours}小时`;
		}
		return `${hours}小时${minutes}分钟`;
	} else {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		if (hours === 0) {
			return `${days}天`;
		}
		return `${days}天${hours}小时`;
	}
}

/**
 * Get efficiency summary for display
 */
export interface EfficiencySummary {
	commandId: string;
	commandName: string;
	description: string;
	category: string;
	timeSavedPerUse: number;
	manualTime: number;
	commandTime: number;
	efficiencyRatio: number; // How many times faster (e.g., 10x)
}

/**
 * Get efficiency summary for a command
 */
export function getEfficiencySummary(commandId: string, commandName: string): EfficiencySummary | null {
	const estimate = getEfficiencyEstimate(commandId);
	if (!estimate) {
		return null;
	}

	const timeSaved = estimate.manualTimeSeconds - estimate.commandTimeSeconds;
	const efficiencyRatio = estimate.manualTimeSeconds / estimate.commandTimeSeconds;

	return {
		commandId,
		commandName,
		description: estimate.description,
		category: estimate.category || 'Other',
		timeSavedPerUse: timeSaved,
		manualTime: estimate.manualTimeSeconds,
		commandTime: estimate.commandTimeSeconds,
		efficiencyRatio
	};
}
