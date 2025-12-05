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
		commandTimeSeconds: 1,
		description: 'Duplicate with custom naming format',
		category: 'File Operations'
	},
	'move-file-to-folder': {
		commandId: 'move-file-to-folder',
		manualTimeSeconds: 5,
		commandTimeSeconds: 1.5,
		description: 'Move file with smart folder suggestions',
		category: 'File Operations'
	},
	'delete-file-permanently': {
		commandId: 'delete-file-permanently',
		manualTimeSeconds: 2,
		commandTimeSeconds: 0.5,
		description: 'Delete file permanently',
		category: 'File Operations'
	},
	'delete-file-to-trash': {
		commandId: 'delete-file-to-trash',
		manualTimeSeconds: 2,
		commandTimeSeconds: 0.5,
		description: 'Move file to trash',
		category: 'File Operations'
	},

	// Path Operations
	'copy-relative-path': {
		commandId: 'copy-relative-path',
		manualTimeSeconds: 8,
		// 手动操作：Obsidian 原生没有此功能
		// 替代方案：查看面包屑 (1秒) → 手动输入路径 (5秒) → 验证 (2秒) = 8秒
		// 或者：查看文件树位置，心算构建路径
		commandTimeSeconds: 0.5,
		description: 'Copy relative path to clipboard',
		category: 'Path Operations'
	},
	'copy-absolute-path': {
		commandId: 'copy-absolute-path',
		manualTimeSeconds: 10,
		// 手动操作：Obsidian 原生没有此功能
		// 替代方案：右键 → 在系统资源管理器中显示 (2秒) → 在 Finder 中右键 (1秒)
		// → 获取简介 (2秒) → 找到路径 (2秒) → 选择并复制 (2秒) → 返回 Obsidian (1秒) = 10秒
		commandTimeSeconds: 0.5,
		description: 'Copy absolute path to clipboard',
		category: 'Path Operations'
	},

	// Content Operations
	'heading-numbering': {
		commandId: 'heading-numbering',
		manualTimeSeconds: 60,
		// 手动操作：Obsidian 没有自动标题编号功能
		// 对于 10 个标题：在每个标题前输入 "1. " (每个 2秒) = 20秒
		// + 插入/删除标题时更新所有编号 (30秒)
		// + 检查层级一致性 (10秒) = 60秒
		// 这是核心功能 - 巨大的时间节省
		commandTimeSeconds: 1,
		description: 'Auto-number headings (Obsidian has no native feature)',
		category: 'Content Operations'
	},
	'smart-copy': {
		commandId: 'smart-copy',
		manualTimeSeconds: 6,
		// 手动操作：Obsidian 有 Cmd+C
		// 本插件增加：基于规则的自动格式清理
		// 实际价值：从网页/其他应用复制时清理不需要的格式
		// 不用插件：粘贴 → 发现问题 → 撤销 → 纯文本粘贴 → 重新格式化 = 6秒
		// 用插件：复制时自动应用规则 = 1秒
		commandTimeSeconds: 1,
		description: 'Copy with auto-cleanup rules',
		category: 'Content Operations'
	},
	'smart-paste': {
		commandId: 'smart-paste',
		manualTimeSeconds: 8,
		// 手动操作：Obsidian 有 Cmd+V
		// 本插件：粘贴时应用正则规则（如移除微博图片链接）
		// 不用插件：粘贴 → 手动查找替换不需要的内容 (8秒)
		// 用插件：粘贴时自动应用规则 = 1秒
		commandTimeSeconds: 1,
		description: 'Paste with auto-cleanup rules',
		category: 'Content Operations'
	},

	// Link Operations
	'link-converter': {
		commandId: 'link-converter',
		manualTimeSeconds: 20,
		// 手动操作：Obsidian 没有批量链接转换功能
		// 对于 5 个链接：手动编辑每个 [[link]] 为 [link](link.md) = 每个 4秒 = 20秒
		// 本插件：一次性转换所有链接
		commandTimeSeconds: 1,
		description: 'Bulk convert wiki ↔ markdown links',
		category: 'Link Operations'
	},

	// Navigation
	'recent-files': {
		commandId: 'recent-files',
		manualTimeSeconds: 2,
		// 手动操作：Obsidian 有 Cmd+O（快速切换器）
		// 本插件：按使用情况智能排序显示最近文件
		// 节省：当你想找"刚用过的那个文件"时，不用输入名称搜索，省 1-2秒
		commandTimeSeconds: 1,
		description: 'Recent files with smart sorting',
		category: 'Navigation'
	},
	'command-palette': {
		commandId: 'command-palette',
		manualTimeSeconds: 2,
		// 手动操作：Obsidian 有 Cmd+P
		// 本插件：在顶部添加固定命令
		// 节省：高频命令不用输入搜索，省 1-2秒
		commandTimeSeconds: 1,
		description: 'Command palette with pinned favorites',
		category: 'Navigation'
	},

	// Frontmatter
	'edit-frontmatter': {
		commandId: 'edit-frontmatter',
		manualTimeSeconds: 12,
		// 手动操作：滚动到顶部 (1秒) → 直接编辑 YAML (3秒)
		// → 修复 YAML 语法错误 (5秒) → 滚动回原位 (1秒) → 验证 (2秒) = 12秒
		// 本插件：可视化编辑器，无语法错误
		commandTimeSeconds: 3,
		description: 'Visual frontmatter editor (prevents YAML errors)',
		category: 'Frontmatter'
	},

	// Tags
	'add-tag': {
		commandId: 'add-tag',
		manualTimeSeconds: 3,
		// 手动操作：直接输入 #tag (2秒) → 检查是否拼写错误 (1秒) = 3秒
		// 本插件：从已有标签自动补全（防止拼写错误）
		commandTimeSeconds: 1.5,
		description: 'Add tag with autocomplete',
		category: 'Tags'
	},
	'remove-tag': {
		commandId: 'remove-tag',
		manualTimeSeconds: 2,
		// 手动操作：找到标签 (1秒) → 选中并删除 (1秒) = 2秒
		// 本插件：从列表选择（无需搜索）
		commandTimeSeconds: 1.5,
		description: 'Remove tag from list',
		category: 'Tags'
	},

	// Logging
	'moment-logger': {
		commandId: 'moment-logger',
		manualTimeSeconds: 6,
		// 手动操作：手动输入时间戳 "2024-12-05 14:30:00"
		// 步骤：看时间 (1秒) → 输入日期 (2秒) → 输入时间 (2秒) → 格式检查 (1秒) = 6秒
		// 本插件：自动插入格式化时间戳
		commandTimeSeconds: 0.5,
		description: 'Auto-insert formatted timestamp',
		category: 'Logging'
	},

	// Text Selection
	'select-word': {
		commandId: 'select-word',
		manualTimeSeconds: 0.8,
		// 手动操作：双击 (0.8秒)
		// 本插件：快捷键 (0.3秒) - 小幅节省，便捷性
		commandTimeSeconds: 0.3,
		description: 'Quick word selection',
		category: 'Text Selection'
	},
	'select-line': {
		commandId: 'select-line',
		manualTimeSeconds: 0.8,
		// 手动操作：Cmd+L 或三击 (0.8秒)
		// 本插件：快捷键 (0.3秒)
		commandTimeSeconds: 0.3,
		description: 'Quick line selection',
		category: 'Text Selection'
	},
	'select-sentence': {
		commandId: 'select-sentence',
		manualTimeSeconds: 3,
		// 手动操作：Obsidian 没有句子选择功能
		// 必须手动点击开始 → Shift+点击结束 (3秒)
		commandTimeSeconds: 0.3,
		description: 'Select sentence (no native feature)',
		category: 'Text Selection'
	},
	'select-paragraph': {
		commandId: 'select-paragraph',
		manualTimeSeconds: 0.8,
		// 手动操作：三击 (0.8秒)
		// 本插件：快捷键 (0.3秒)
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
