import { Plugin } from "obsidian";
import { registerCommands } from "./commands";

export default class LemonToolkitPlugin extends Plugin {
	async onload() {
		registerCommands(this);
	}

	onunload() {
		// Cleanup handled automatically by Obsidian
	}
}
