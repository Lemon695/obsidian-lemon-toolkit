import { Plugin } from "obsidian";
import {
	copyRelativePath,
	copyAbsolutePath,
	copyFileName,
	copyFileNameWithoutExtension,
} from "./copyPath";

/**
 * Register all plugin commands
 */
export function registerCommands(plugin: Plugin): void {
	// Copy relative path
	plugin.addCommand({
		id: "copy-relative-path",
		name: "Copy relative path",
		callback: () => copyRelativePath(plugin),
	});

	// Copy absolute path
	plugin.addCommand({
		id: "copy-absolute-path",
		name: "Copy absolute path",
		callback: () => copyAbsolutePath(plugin),
	});

	// Copy file name
	plugin.addCommand({
		id: "copy-file-name",
		name: "Copy file name",
		callback: () => copyFileName(plugin),
	});

	// Copy file name without extension
	plugin.addCommand({
		id: "copy-file-name-without-ext",
		name: "Copy file name (no extension)",
		callback: () => copyFileNameWithoutExtension(plugin),
	});
}
