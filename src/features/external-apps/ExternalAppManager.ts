import { Notice, Platform } from "obsidian";
import { exec } from "child_process";
import { promisify } from "util";
import LemonToolkitPlugin from "../../main";
import { t } from "../../i18n/locale";

const execAsync = promisify(exec);

export class ExternalAppManager {
	private plugin: LemonToolkitPlugin;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Open file or folder with external application
	 */
	async openWith(appId: string, path: string, isFolder: boolean = false): Promise<void> {
		const app = this.plugin.settings.externalApps.find((a) => a.id === appId);
		
		if (!app) {
			new Notice(t('externalAppNotFound', { id: appId }));
			return;
		}

		if (isFolder && !app.openFolder) {
			new Notice(t('appNotConfiguredForFolders', { name: app.name }));
			return;
		}

		if (!isFolder && !app.openFile) {
			new Notice(t('appNotConfiguredForFiles', { name: app.name }));
			return;
		}

		try {
			await this.executeOpen(app.path, path);
			new Notice(t('openedWith', { name: app.name }));
		} catch (error) {
			new Notice(t('failedToOpenWith', { name: app.name, error: error.message }));
			console.error("External app error:", error);
		}
	}

	/**
	 * Execute the open command based on platform
	 */
	private async executeOpen(appPath: string, targetPath: string): Promise<void> {
		let command: string;

		if (Platform.isMacOS) {
			// macOS: use 'open' command
			command = `open -a "${appPath}" "${targetPath}"`;
		} else if (Platform.isWin) {
			// Windows: execute the app directly
			command = `"${appPath}" "${targetPath}"`;
		} else {
			// Linux: try xdg-open or direct execution
			command = `"${appPath}" "${targetPath}"`;
		}

		await execAsync(command);
	}

	/**
	 * Register commands for all configured external apps
	 */
	registerCommands(): void {
		this.plugin.settings.externalApps.forEach((app) => {
			// Register open file command
			if (app.openFile) {
				this.plugin.addCommand({
					id: `open-with-${app.id}-file`,
					name: t('openFileWith', { name: app.name }),
					callback: async () => {
						const file = this.plugin.app.workspace.getActiveFile();
						if (!file) {
							new Notice(t('noActiveFile'));
							return;
						}

						// @ts-ignore - basePath is available on FileSystemAdapter
						const basePath = this.plugin.app.vault.adapter.basePath || "";
						const fullPath = `${basePath}/${file.path}`;
						await this.openWith(app.id, fullPath, false);
					},
				});
			}

			// Register open folder command
			if (app.openFolder) {
				this.plugin.addCommand({
					id: `open-with-${app.id}-folder`,
					name: t('openFolderWith', { name: app.name }),
					callback: async () => {
						const file = this.plugin.app.workspace.getActiveFile();
						if (!file) {
							new Notice(t('noActiveFile'));
							return;
						}

						// @ts-ignore - basePath is available on FileSystemAdapter
						const basePath = this.plugin.app.vault.adapter.basePath || "";
						const folderPath = file.parent
							? `${basePath}/${file.parent.path}`
							: basePath;

						await this.openWith(app.id, folderPath, true);
					},
				});
			}
		});
	}
}
