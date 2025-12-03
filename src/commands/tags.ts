import { Editor, Notice } from "obsidian";
import { ViewCurrentTagsModal } from "../ui/ViewCurrentTagsModal";
import { InsertTagsModal } from "../ui/InsertTagsModal";
import LemonToolkitPlugin from "../main";

/**
 * View all tags in the current file
 */
export function viewCurrentTags(plugin: LemonToolkitPlugin): void {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active file");
		return;
	}

	const cache = plugin.app.metadataCache.getFileCache(file);
	const tags: string[] = [];

	// Get tags from frontmatter
	if (cache?.frontmatter?.tags) {
		const frontmatterTags = cache.frontmatter.tags;
		if (Array.isArray(frontmatterTags)) {
			tags.push(...frontmatterTags.map((t) => (t.startsWith("#") ? t : `#${t}`)));
		} else if (typeof frontmatterTags === "string") {
			tags.push(frontmatterTags.startsWith("#") ? frontmatterTags : `#${frontmatterTags}`);
		}
	}

	// Get inline tags
	if (cache?.tags) {
		tags.push(...cache.tags.map((t) => t.tag));
	}

	// Remove duplicates
	const uniqueTags = [...new Set(tags)];

	if (uniqueTags.length === 0) {
		new Notice("No tags found in current file");
		return;
	}

	new ViewCurrentTagsModal(plugin.app, uniqueTags).open();
}

/**
 * Insert tags at cursor position
 */
export function insertTags(plugin: LemonToolkitPlugin, editor: Editor): void {
	new InsertTagsModal(plugin, editor).open();
}
