import { Editor } from "obsidian";
import { HeadingNumberingManager } from "../features/heading-numbering/HeadingNumberingManager";
import LemonToolkitPlugin from "../main";

/**
 * Add or update heading numbering
 */
export async function addHeadingNumbering(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new HeadingNumberingManager(plugin);
	await manager.processHeadings(editor);
}

/**
 * Remove heading numbering
 */
export async function removeHeadingNumbering(plugin: LemonToolkitPlugin, editor: Editor): Promise<void> {
	const manager = new HeadingNumberingManager(plugin);
	await manager.removeNumbering(editor);
}
