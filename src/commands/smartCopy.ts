import { Editor } from "obsidian";
import { SmartCopyManager } from "../features/smart-copy/SmartCopyManager";
import { SmartCopyModal } from "../features/smart-copy/SmartCopyModal";
import LemonToolkitPlugin from "../main";

/**
 * Copy current heading section
 */
export async function copyCurrentHeading(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new SmartCopyManager(plugin);
	await manager.copyCurrentHeading(editor);
}

/**
 * Copy current code block
 */
export async function copyCurrentCodeBlock(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new SmartCopyManager(plugin);
	await manager.copyCurrentCodeBlock(editor);
}

/**
 * Copy current table
 */
export async function copyCurrentTable(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new SmartCopyManager(plugin);
	await manager.copyCurrentTable(editor);
}

/**
 * Open smart copy selector
 */
export async function openSmartCopySelector(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new SmartCopyManager(plugin);
	const blocks = manager.getAllBlocks(editor);
	
	const modal = new SmartCopyModal(plugin.app, blocks);
	modal.open();
}

/**
 * Select table rows to copy
 */
export async function selectTableRows(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new SmartCopyManager(plugin);
	await manager.selectTableRows(editor);
}

/**
 * Select code lines to copy
 */
export async function selectCodeLines(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new SmartCopyManager(plugin);
	await manager.selectCodeLines(editor);
}

/**
 * Select multiple code blocks to copy
 */
export async function selectCodeBlocks(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new SmartCopyManager(plugin);
	await manager.selectCodeBlocks(editor);
}
