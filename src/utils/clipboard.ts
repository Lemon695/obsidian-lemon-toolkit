import { Notice } from "obsidian";

/**
 * Copy text to clipboard and show a success notice
 * @param text - The text to copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
	await navigator.clipboard.writeText(text);
	new Notice(`Copied: ${text}`);
}
