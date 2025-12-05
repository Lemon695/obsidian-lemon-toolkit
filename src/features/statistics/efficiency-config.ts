/**
 * Efficiency configuration for command time savings
 *
 * This module defines how much time each command saves compared to manual operations.
 * Time estimates are based on typical user workflows and can be customized.
 */

import { EfficiencyEstimate } from './types';
import { t } from '../../i18n/locale';

/**
 * Default efficiency estimates for all commands
 *
 * Each estimate includes:
 * - commandId: Unique identifier for the command
 * - manualTimeSeconds: Estimated time to perform the task manually
 * - commandTimeSeconds: Time it takes to execute the command
 * - descriptionKey: i18n key for description
 * - categoryKey: i18n key for category
 */
export interface EfficiencyConfig extends EfficiencyEstimate {
	descriptionKey: string;
	categoryKey: string;
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
		// 手动操作：Obsidian 原生有 Cmd+P → "duplicate"，自动添加 " 1" 后缀
		// 本插件增加：自定义命名（时间戳/UUID）
		// 实际价值：避免复制后手动重命名
		// 节省：2-3 秒思考 + 输入自定义名称的时间
		commandTimeSeconds: 1,
		descriptionKey: 'efficiencyDescDuplicateFile',
		categoryKey: 'efficiencyCategoryFileOps'
	},
	'move-file-to-folder': {
		commandId: 'move-file-to-folder',
		manualTimeSeconds: 5,
		// 手动操作：Obsidian 原生有移动文件命令
		// 本插件增加：最近文件夹、智能排序（按使用频率）
		// 实际价值：更快找到目标文件夹（无需滚动完整列表）
		// 节省：3-4 秒在排序列表中定位文件夹
		commandTimeSeconds: 1.5,
		descriptionKey: 'efficiencyDescMoveFile',
		categoryKey: 'efficiencyCategoryFileOps'
	},
	'delete-file-permanently': {
		commandId: 'delete-file-permanently',
		manualTimeSeconds: 2,
		// 手动操作：Obsidian 原生有删除功能
		// 本插件：提供快速访问方式
		// 节省：1.5 秒（在自定义面板中快速访问的便捷性）
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescDeletePermanently',
		categoryKey: 'efficiencyCategoryFileOps'
	},
	'delete-file-to-trash': {
		commandId: 'delete-file-to-trash',
		manualTimeSeconds: 2,
		// 手动操作：Obsidian 原生有移动到回收站功能
		// 本插件：提供快速访问方式
		// 节省：1.5 秒（在自定义面板中快速访问的便捷性）
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescDeleteToTrash',
		categoryKey: 'efficiencyCategoryFileOps'
	},

	// Path Operations
	'copy-relative-path': {
		commandId: 'copy-relative-path',
		manualTimeSeconds: 8,
		// 手动操作：Obsidian 原生没有此功能
		// 替代方案：查看面包屑 (1秒) → 手动输入路径 (5秒) → 验证 (2秒) = 8秒
		// 或者：查看文件树位置，心算构建路径
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescCopyRelativePath',
		categoryKey: 'efficiencyCategoryPathOps'
	},
	'copy-absolute-path': {
		commandId: 'copy-absolute-path',
		manualTimeSeconds: 10,
		// 手动操作：Obsidian 原生没有此功能
		// 替代方案：右键 → 在系统资源管理器中显示 (2秒) → 在 Finder 中右键 (1秒)
		// → 获取简介 (2秒) → 找到路径 (2秒) → 选择并复制 (2秒) → 返回 Obsidian (1秒) = 10秒
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescCopyAbsolutePath',
		categoryKey: 'efficiencyCategoryPathOps'
	},
	'copy-file-name': {
		commandId: 'copy-file-name',
		manualTimeSeconds: 3,
		// 手动操作：Obsidian 原生没有此功能
		// 替代方案：查看标题栏 (0.5秒) → 手动输入文件名 (2秒) → 验证扩展名 (0.5秒) = 3秒
		// 或者：在文件树中右键复制名称
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescCopyFileName',
		categoryKey: 'efficiencyCategoryPathOps'
	},
	'copy-file-name-without-ext': {
		commandId: 'copy-file-name-without-ext',
		manualTimeSeconds: 4,
		// 手动操作：Obsidian 原生没有此功能
		// 替代方案：复制文件名 (3秒) → 手动删除扩展名 (1秒) = 4秒
		// 或者：手动输入文件名（不含扩展名）
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescCopyFileNameNoExt',
		categoryKey: 'efficiencyCategoryPathOps'
	},

	// Content Operations
	'add-heading-numbering': {
		commandId: 'add-heading-numbering',
		manualTimeSeconds: 60,
		// 手动操作：Obsidian 没有自动标题编号功能
		// 对于 10 个标题：在每个标题前输入 "1. " (每个 2秒) = 20秒
		// + 插入/删除标题时更新所有编号 (30秒)
		// + 检查层级一致性 (10秒) = 60秒
		// 这是核心功能 - 巨大的时间节省
		commandTimeSeconds: 1,
		descriptionKey: 'efficiencyDescAddHeadingNumbering',
		categoryKey: 'efficiencyCategoryContentOps'
	},
	'remove-heading-numbering': {
		commandId: 'remove-heading-numbering',
		manualTimeSeconds: 30,
		// 手动操作：Obsidian 没有批量移除编号功能
		// 对于 10 个标题：手动删除每个编号 (每个 3秒) = 30秒
		// 本插件：一键移除所有编号
		commandTimeSeconds: 1,
		descriptionKey: 'efficiencyDescRemoveHeadingNumbering',
		categoryKey: 'efficiencyCategoryContentOps'
	},
	'copy-current-heading': {
		commandId: 'copy-current-heading',
		manualTimeSeconds: 5,
		// 手动操作：Obsidian 没有复制整个标题段落的功能
		// 替代方案：找到标题开始 (1秒) → 选择到下一个标题前 (3秒) → 复制 (1秒) = 5秒
		// 本插件：光标在标题内，一键复制整个段落
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescCopyHeading',
		categoryKey: 'efficiencyCategoryContentOps'
	},
	'copy-current-code-block': {
		commandId: 'copy-current-code-block',
		manualTimeSeconds: 4,
		// 手动操作：Obsidian 有代码块复制按钮（需要鼠标移动到右上角）
		// 本插件：光标在代码块内，快捷键直接复制
		// 节省：3.5 秒（无需鼠标移动和点击）
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescCopyCodeBlock',
		categoryKey: 'efficiencyCategoryContentOps'
	},
	'copy-current-table': {
		commandId: 'copy-current-table',
		manualTimeSeconds: 6,
		// 手动操作：Obsidian 没有复制整个表格的快捷方式
		// 替代方案：找到表格开始 (1秒) → 选择到表格结束 (4秒) → 复制 (1秒) = 6秒
		// 本插件：光标在表格内，一键复制整个表格
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescCopyTable',
		categoryKey: 'efficiencyCategoryContentOps'
	},
	'smart-copy-selector': {
		commandId: 'smart-copy-selector',
		manualTimeSeconds: 10,
		// 手动操作：Obsidian 没有多选复制功能
		// 替代方案：复制第一个块 (3秒) → 粘贴到临时位置 (1秒) → 复制第二个块 (3秒) → 粘贴 (1秒) → 复制合并内容 (2秒) = 10秒
		// 本插件：可视化多选，一次性复制多个非连续块
		commandTimeSeconds: 2,
		descriptionKey: 'efficiencyDescSmartCopySelector',
		categoryKey: 'efficiencyCategoryContentOps'
	},
	'select-table-rows': {
		commandId: 'select-table-rows',
		manualTimeSeconds: 8,
		// 手动操作：Obsidian 没有选择特定表格行的功能
		// 替代方案：手动选择第一行 (2秒) → 复制 (1秒) → 选择第二行 (2秒) → 复制 (1秒) → 合并 (2秒) = 8秒
		// 本插件：可视化选择多行，一次性复制
		commandTimeSeconds: 1.5,
		descriptionKey: 'efficiencyDescSelectTableRows',
		categoryKey: 'efficiencyCategoryContentOps'
	},
	'select-code-lines': {
		commandId: 'select-code-lines',
		manualTimeSeconds: 6,
		// 手动操作：Obsidian 没有选择代码块特定行的功能
		// 替代方案：手动选择行 (4秒) → 复制 (1秒) → 验证 (1秒) = 6秒
		// 本插件：可视化选择代码行，一次性复制
		commandTimeSeconds: 1,
		descriptionKey: 'efficiencyDescSelectCodeLines',
		categoryKey: 'efficiencyCategoryContentOps'
	},
	'select-code-blocks': {
		commandId: 'select-code-blocks',
		manualTimeSeconds: 8,
		// 手动操作：Obsidian 没有多选代码块的功能
		// 替代方案：复制第一个代码块 (2秒) → 粘贴 (1秒) → 复制第二个 (2秒) → 粘贴 (1秒) → 合并 (2秒) = 8秒
		// 本插件：可视化多选代码块，一次性复制
		commandTimeSeconds: 1.5,
		descriptionKey: 'efficiencyDescSelectCodeBlocks',
		categoryKey: 'efficiencyCategoryContentOps'
	},
	'smart-paste': {
		commandId: 'smart-paste',
		manualTimeSeconds: 8,
		// 手动操作：Obsidian 有 Cmd+V
		// 本插件：粘贴时应用正则规则（如移除微博图片链接）
		// 不用插件：粘贴 → 发现问题 → 撤销 → 手动查找替换不需要的内容 (8秒)
		// 用插件：粘贴时自动应用规则 = 1秒
		commandTimeSeconds: 1,
		descriptionKey: 'efficiencyDescSmartPaste',
		categoryKey: 'efficiencyCategoryContentOps'
	},

	// Link Operations
	'convert-wiki-to-markdown-file': {
		commandId: 'convert-wiki-to-markdown-file',
		manualTimeSeconds: 30,
		// 手动操作：Obsidian 没有批量链接转换功能
		// 对于 10 个链接：手动编辑每个 [[link]] 为 [link](./link.md) = 每个 3秒 = 30秒
		// 本插件：一次性转换整个文件的所有链接，支持预览和选择
		commandTimeSeconds: 2,
		descriptionKey: 'efficiencyDescConvertWikiToMdFile',
		categoryKey: 'efficiencyCategoryLinkOps'
	},
	'convert-markdown-to-wiki-file': {
		commandId: 'convert-markdown-to-wiki-file',
		manualTimeSeconds: 30,
		// 手动操作：Obsidian 没有批量链接转换功能
		// 对于 10 个链接：手动编辑每个 [link](./link.md) 为 [[link]] = 每个 3秒 = 30秒
		// 本插件：一次性转换整个文件的所有链接，支持预览和选择
		commandTimeSeconds: 2,
		descriptionKey: 'efficiencyDescConvertMdToWikiFile',
		categoryKey: 'efficiencyCategoryLinkOps'
	},
	'convert-wiki-to-markdown-selection': {
		commandId: 'convert-wiki-to-markdown-selection',
		manualTimeSeconds: 15,
		// 手动操作：Obsidian 没有批量链接转换功能
		// 对于选中的 5 个链接：手动编辑每个 = 每个 3秒 = 15秒
		// 本插件：一次性转换选中区域的所有链接
		commandTimeSeconds: 1,
		descriptionKey: 'efficiencyDescConvertWikiToMdSelection',
		categoryKey: 'efficiencyCategoryLinkOps'
	},
	'convert-markdown-to-wiki-selection': {
		commandId: 'convert-markdown-to-wiki-selection',
		manualTimeSeconds: 15,
		// 手动操作：Obsidian 没有批量链接转换功能
		// 对于选中的 5 个链接：手动编辑每个 = 每个 3秒 = 15秒
		// 本插件：一次性转换选中区域的所有链接
		commandTimeSeconds: 1,
		descriptionKey: 'efficiencyDescConvertMdToWikiSelection',
		categoryKey: 'efficiencyCategoryLinkOps'
	},

	// Navigation
	'open-recent-files': {
		commandId: 'open-recent-files',
		manualTimeSeconds: 3,
		// 手动操作：Obsidian 有 Cmd+O（快速切换器）
		// 本插件：按编辑/查看/创建时间智能排序，支持固定常用文件
		// 节省：当你想找"刚用过的那个文件"时，不用输入名称搜索，省 2秒
		commandTimeSeconds: 1,
		descriptionKey: 'efficiencyDescOpenRecentFiles',
		categoryKey: 'efficiencyCategoryNavigation'
	},
	'open-command-palette': {
		commandId: 'open-command-palette',
		manualTimeSeconds: 2,
		// 手动操作：Obsidian 有 Cmd+P
		// 本插件：只显示本插件命令，支持固定常用命令到顶部
		// 节省：高频命令不用输入搜索，省 1.5秒
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescOpenCommandPalette',
		categoryKey: 'efficiencyCategoryNavigation'
	},
	'open-settings': {
		commandId: 'open-settings',
		manualTimeSeconds: 3,
		// 手动操作：Cmd+, → 滚动到插件设置 (2秒) → 找到本插件 (1秒) = 3秒
		// 本插件：一键直达本插件设置页面
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescOpenSettings',
		categoryKey: 'efficiencyCategoryNavigation'
	},
	'open-file-info': {
		commandId: 'open-file-info',
		manualTimeSeconds: 5,
		// 手动操作：Obsidian 没有文件信息面板
		// 替代方案：查看属性面板 (1秒) + 查看文件树 (1秒) + 查看反向链接 (1秒) + 手动计算字数 (2秒) = 5秒
		// 本插件：一键打开侧边栏，显示所有文件信息（路径、大小、字数、阅读时间、标签、链接等）
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescOpenFileInfo',
		categoryKey: 'efficiencyCategoryNavigation'
	},

	// Frontmatter
	'edit-frontmatter': {
		commandId: 'edit-frontmatter',
		manualTimeSeconds: 12,
		// 手动操作：滚动到顶部 (1秒) → 直接编辑 YAML (3秒)
		// → 修复 YAML 语法错误 (5秒) → 滚动回原位 (1秒) → 验证 (2秒) = 12秒
		// 本插件：可视化编辑器，类型选择，自动验证，无语法错误
		commandTimeSeconds: 3,
		descriptionKey: 'efficiencyDescEditFrontmatter',
		categoryKey: 'efficiencyCategoryFrontmatter'
	},

	// Tags
	'view-current-tags': {
		commandId: 'view-current-tags',
		manualTimeSeconds: 4,
		// 手动操作：Obsidian 没有查看当前文件所有标签的功能
		// 替代方案：滚动整个文档查找所有 #tag (3秒) → 记录 (1秒) = 4秒
		// 本插件：一键显示所有标签，点击可复制
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescViewTags',
		categoryKey: 'efficiencyCategoryTags'
	},
	'insert-tags': {
		commandId: 'insert-tags',
		manualTimeSeconds: 5,
		// 手动操作：直接输入 #tag (2秒) → 检查是否拼写错误 (1秒) → 可能需要修正 (2秒) = 5秒
		// 本插件：从已有标签列表选择（按使用频率排序），防止拼写错误，支持多选
		commandTimeSeconds: 1.5,
		descriptionKey: 'efficiencyDescInsertTags',
		categoryKey: 'efficiencyCategoryTags'
	},

	// Logging
	'insert-moment': {
		commandId: 'insert-moment',
		manualTimeSeconds: 6,
		// 手动操作：手动输入时间戳 "2024-12-05 14:30:00"
		// 步骤：看时间 (1秒) → 输入日期 (2秒) → 输入时间 (2秒) → 格式检查 (1秒) = 6秒
		// 本插件：自动插入格式化时间戳，智能追加到现有时间线
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescInsertMoment',
		categoryKey: 'efficiencyCategoryLogging'
	},
	'insert-moment-at-cursor': {
		commandId: 'insert-moment-at-cursor',
		manualTimeSeconds: 6,
		// 手动操作：手动输入时间戳 "2024-12-05 14:30:00"
		// 步骤：看时间 (1秒) → 输入日期 (2秒) → 输入时间 (2秒) → 格式检查 (1秒) = 6秒
		// 本插件：自动插入格式化时间戳到光标位置（手动模式）
		commandTimeSeconds: 0.5,
		descriptionKey: 'efficiencyDescInsertMomentAtCursor',
		categoryKey: 'efficiencyCategoryLogging'
	},

	// Text Selection
	'text-selection-actions': {
		commandId: 'text-selection-actions',
		manualTimeSeconds: 8,
		// 手动操作：Obsidian 没有选中文本快速操作菜单
		// 替代方案：选中文本 → 复制 → 打开命令面板 → 搜索操作 → 执行 = 8秒
		// 本插件：选中文本后一键打开操作菜单（创建笔记、搜索、包裹为链接、添加标签、复制为引用、发送到其他文件等）
		commandTimeSeconds: 2,
		descriptionKey: 'efficiencyDescTextSelectionActions',
		categoryKey: 'efficiencyCategoryTextSelection'
	},

	// Table Editor
	'edit-table': {
		commandId: 'edit-table',
		manualTimeSeconds: 120,
		// 手动操作：Obsidian 原生表格编辑体验差
		// 对于 10x5 表格的编辑任务：
		// - 调整列宽：手动修改每个单元格的空格 (20秒)
		// - 插入/删除行列：手动编辑 Markdown (30秒)
		// - 排序：手动复制粘贴重排 (40秒)
		// - 对齐：手动修改分隔符 (20秒)
		// - 查找替换：手动逐个查找 (10秒) = 120秒
		// 本插件：Excel 风格的可视化编辑器，拖拽排序，一键操作
		commandTimeSeconds: 10,
		descriptionKey: 'efficiencyDescEditTable',
		categoryKey: 'efficiencyCategoryTableEditor'
	},
	'create-table': {
		commandId: 'create-table',
		manualTimeSeconds: 30,
		// 手动操作：Obsidian 没有表格创建向导
		// 替代方案：手动输入 Markdown 表格语法
		// 对于 3x3 表格：输入表头 (5秒) → 输入分隔符 (5秒) → 输入数据行 (15秒) → 调整对齐 (5秒) = 30秒
		// 本插件：可视化创建表格，预设行列数，自动生成 Markdown
		commandTimeSeconds: 5,
		descriptionKey: 'efficiencyDescCreateTable',
		categoryKey: 'efficiencyCategoryTableEditor'
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
		const category = t(config.categoryKey as any);
		if (!grouped[category]) {
			grouped[category] = [];
		}
		grouped[category].push(config);
	});

	return grouped;
}

/**
 * Calculate time saved for a single command execution
 * Returns non-negative value (minimum 0)
 */
export function calculateTimeSaved(commandId: string): number {
	const estimate = getEfficiencyEstimate(commandId);
	if (!estimate) {
		return 0;
	}
	const saved = estimate.manualTimeSeconds - estimate.commandTimeSeconds;
	return Math.max(0, saved); // Ensure non-negative
}

/**
 * Calculate total time saved for multiple executions
 * Returns non-negative value (minimum 0)
 */
export function calculateTotalTimeSaved(commandId: string, executionCount: number): number {
	const saved = calculateTimeSaved(commandId) * executionCount;
	return Math.max(0, saved); // Ensure non-negative
}

/**
 * Format time in seconds to human-readable string
 * Supports decimals (max 2 decimal places)
 */
export function formatTimeSaved(seconds: number): string {
	// Ensure non-negative
	seconds = Math.max(0, seconds);
	
	// Round to 2 decimal places
	const rounded = Math.round(seconds * 100) / 100;
	
	if (rounded < 60) {
		// Show decimals for values under 1 minute
		return rounded % 1 === 0 ? `${rounded}秒` : `${rounded.toFixed(2)}秒`;
	} else if (rounded < 3600) {
		const minutes = Math.floor(rounded / 60);
		const secs = Math.round((rounded % 60) * 100) / 100;
		if (secs === 0) {
			return `${minutes}分钟`;
		}
		// Show decimal seconds if present
		const secsStr = secs % 1 === 0 ? secs.toString() : secs.toFixed(2);
		return `${minutes}分${secsStr}秒`;
	} else if (rounded < 86400) {
		const hours = Math.floor(rounded / 3600);
		const minutes = Math.floor((rounded % 3600) / 60);
		if (minutes === 0) {
			return `${hours}小时`;
		}
		return `${hours}小时${minutes}分钟`;
	} else {
		const days = Math.floor(rounded / 86400);
		const hours = Math.floor((rounded % 86400) / 3600);
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
		description: t(estimate.descriptionKey as any),
		category: t(estimate.categoryKey as any),
		timeSavedPerUse: timeSaved,
		manualTime: estimate.manualTimeSeconds,
		commandTime: estimate.commandTimeSeconds,
		efficiencyRatio
	};
}
