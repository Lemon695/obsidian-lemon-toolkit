import { App, Modal, Setting } from "obsidian";
import LemonToolkitPlugin from "../main";
import { t } from "../i18n/locale";

export class PinnedGlobalCommandsModal extends Modal {
	private plugin: LemonToolkitPlugin;
	private pinnedCommands: string[];
	private allCommands: Array<{ id: string; name: string; pluginName: string }>;

	constructor(app: App, plugin: LemonToolkitPlugin) {
		super(app);
		this.plugin = plugin;
		this.pinnedCommands = [...plugin.settings.pinnedGlobalCommands];
		this.allCommands = [];
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: t('managePinnedCommands') });

		// Get all commands
		const allCommands = (this.plugin.app as any).commands.commands;
		Object.keys(allCommands).forEach((commandId) => {
			const command = allCommands[commandId];
			let pluginName = "Obsidian";
			if (commandId.includes(":")) {
				const pluginId = commandId.split(":")[0];
				pluginName = this.getPluginDisplayName(pluginId);
			}
			this.allCommands.push({
				id: commandId,
				name: command.name,
				pluginName,
			});
		});

		// Sort by plugin name, then by command name
		this.allCommands.sort((a, b) => {
			if (a.pluginName !== b.pluginName) {
				return a.pluginName.localeCompare(b.pluginName);
			}
			return a.name.localeCompare(b.name);
		});

		// Create checkboxes for each command
		this.allCommands.forEach((cmd) => {
			new Setting(contentEl)
				.setName(cmd.name)
				.setDesc(`${cmd.pluginName} - ${cmd.id}`)
				.addToggle((toggle) =>
					toggle
						.setValue(this.pinnedCommands.includes(cmd.id))
						.onChange((value) => {
							if (value) {
								if (!this.pinnedCommands.includes(cmd.id)) {
									this.pinnedCommands.push(cmd.id);
								}
							} else {
								const index = this.pinnedCommands.indexOf(cmd.id);
								if (index > -1) {
									this.pinnedCommands.splice(index, 1);
								}
							}
						})
				);
		});

		// Save button
		new Setting(contentEl).addButton((button) =>
			button
				.setButtonText(t('save'))
				.setCta()
				.onClick(async () => {
					this.plugin.settings.pinnedGlobalCommands = this.pinnedCommands;
					await this.plugin.saveSettings();
					this.close();
				})
		);
	}

	private getPluginDisplayName(pluginId: string): string {
		const nameMap: Record<string, string> = {
			'editor': 'Obsidian',
			'workspace': 'Obsidian',
			'file-explorer': 'Obsidian',
			'global-search': 'Obsidian',
			'switcher': 'Obsidian',
			'graph': 'Obsidian',
			'backlink': 'Obsidian',
			'outgoing-link': 'Obsidian',
			'tag-pane': 'Obsidian',
			'page-preview': 'Obsidian',
			'templates': 'Obsidian',
			'note-composer': 'Obsidian',
			'command-palette': 'Obsidian',
			'markdown-importer': 'Obsidian',
			'word-count': 'Obsidian',
			'open-with-default-app': 'Obsidian',
			'file-recovery': 'Obsidian',
		};

		if (nameMap[pluginId]) {
			return nameMap[pluginId];
		}

		const plugins = (this.plugin.app as any).plugins;
		if (plugins && plugins.manifests && plugins.manifests[pluginId]) {
			return plugins.manifests[pluginId].name;
		}

		return pluginId.split('-').map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
