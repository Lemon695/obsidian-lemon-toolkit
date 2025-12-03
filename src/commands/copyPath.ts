import { Notice, Plugin, TFile } from "obsidian";
import { copyToClipboard } from "../utils/clipboard";

/**
 * Copy the relative path of the active file
 */
export async function copyRelativePath(plugin: Plugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active file");
		return;
	}
	await copyToClipboard(file.path);
}

/**
 * Copy the absolute path of the active file
 */
export async function copyAbsolutePath(plugin: Plugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active file");
		return;
	}

	// Get vault base path (desktop only)
	const adapter = plugin.app.vault.adapter;
	if ("basePath" in adapter) {
		const basePath = (adapter as any).basePath;
		const separator = basePath.includes("\\") ? "\\" : "/";
		const absolutePath = `${basePath}${separator}${file.path}`;
		await copyToClipboard(absolutePath);
	} else {
		// Mobile fallback - just copy relative path
		new Notice("Absolute path not available on mobile");
		await copyToClipboard(file.path);
	}
}

/**
 * Copy the file name with extension
 */
export async function copyFileName(plugin: Plugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active file");
		return;
	}
	await copyToClipboard(file.name);
}

/**
 * Copy the file name without extension
 */
export async function copyFileNameWithoutExtension(plugin: Plugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active file");
		return;
	}
	
	const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
	await copyToClipboard(nameWithoutExt);
}
