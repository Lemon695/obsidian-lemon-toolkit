import { Editor } from "obsidian";
import { LinkConverterManager } from "../features/link-converter/LinkConverterManager";
import LemonToolkitPlugin from "../main";

/**
 * Convert wiki links to markdown links in entire file
 */
export async function convertWikiToMarkdownInFile(
	plugin: LemonToolkitPlugin,
	editor: Editor
): Promise<void> {
	const manager = new LinkConverterManager(plugin);
	await manager.convertInFile(editor, "wiki-to-markdown");
}

/**
 * Convert markdown links to wiki links in entire file
 */
export async function convertMarkdownToWikiInFile(
	plugin: LemonToolkitPlugin,
	editor: Editor
): Promise<void> {
	const manager = new LinkConverterManager(plugin);
	await manager.convertInFile(editor, "markdown-to-wiki");
}

/**
 * Convert wiki links to markdown links in selection
 */
export async function convertWikiToMarkdownInSelection(
	plugin: LemonToolkitPlugin,
	editor: Editor
): Promise<void> {
	const manager = new LinkConverterManager(plugin);
	await manager.convertInSelection(editor, "wiki-to-markdown");
}

/**
 * Convert markdown links to wiki links in selection
 */
export async function convertMarkdownToWikiInSelection(
	plugin: LemonToolkitPlugin,
	editor: Editor
): Promise<void> {
	const manager = new LinkConverterManager(plugin);
	await manager.convertInSelection(editor, "markdown-to-wiki");
}
