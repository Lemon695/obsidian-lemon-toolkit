import { Editor } from "obsidian";
import { MomentLoggerManager } from "../features/moment-logger/MomentLoggerManager";
import LemonToolkitPlugin from "../main";

/**
 * Insert a moment log entry (auto mode)
 */
export async function insertMoment(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new MomentLoggerManager(plugin);
	await manager.insertMoment(editor, false);
}

/**
 * Insert a moment log entry at cursor (manual mode)
 * Use this when you want to force insertion at cursor position
 */
export async function insertMomentAtCursor(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new MomentLoggerManager(plugin);
	await manager.insertMoment(editor, true);
}
