import { Notice } from "obsidian";

/**
 * Copy text to clipboard and show a success notice
 * @param text - The text to copy to clipboard
 */
import { t } from "../i18n/locale";

export async function copyToClipboard(text: string): Promise<void> {
	await navigator.clipboard.writeText(text);
	new Notice(t('copied', { text }));
}
