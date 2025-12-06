import { Notice, Platform } from "obsidian";
import { exec } from "child_process";
import { promisify } from "util";
import LemonToolkitPlugin from "../../main";
import { t } from "../../i18n/locale";
import { ExternalApp } from "../../settings";

const execAsync = promisify(exec);

export class ExternalAppManager {
	private plugin: LemonToolkitPlugin;
	private apps: ExternalApp[] = [];
	private filePath: string;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
		this.filePath = `${plugin.manifest.dir}/external-apps.json`;
	}

	async load(): Promise<void> {
		try {
			const data = await this.plugin.app.vault.adapter.read(this.filePath);
			const parsed = JSON.parse(data);
			this.apps = parsed.apps || [];
		} catch (e) {
			this.apps = [];
		}
	}

	async save(): Promise<void> {
		const data = JSON.stringify({ apps: this.apps }, null, 2);
		await this.plugin.app.vault.adapter.write(this.filePath, data);
	}

	getApps(): ExternalApp[] {
		return this.apps;
	}

	setApps(apps: ExternalApp[]): void {
		this.apps = apps;
	}

	/**
	 * Open file or folder with external application
	 */
	async openWith(appId: string, path: string, isFolder: boolean = false): Promise<void> {
		const app = this.apps.find((a) => a.id === appId);
		
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
		this.apps.forEach((app) => {
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
