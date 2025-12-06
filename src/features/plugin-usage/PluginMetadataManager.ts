import { App, TFolder } from "obsidian";
import LemonToolkitPlugin from "../../main";

export interface PluginMetadata {
	id: string;
	name: string;
	version: string;
	author: string;
	enabled: boolean; // Whether the plugin is currently enabled
	updatedAt: number; // Last update time from file system
	scannedAt: number; // When we last scanned this plugin
}

export class PluginMetadataManager {
	private plugin: LemonToolkitPlugin;
	private app: App;
	private metadata: Record<string, PluginMetadata> = {};
	private scanInterval: number | null = null;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;
	}

	async load(): Promise<void> {
		try {
			const pluginId = this.plugin.manifest.id;
			const data = await this.app.vault.adapter.read(`.obsidian/plugins/${pluginId}/plugin-metadata.json`);
			this.metadata = JSON.parse(data);
		} catch (e) {
			// File doesn't exist yet, use empty metadata
			this.metadata = {};
		}
	}

	async save(): Promise<void> {
		const pluginId = this.plugin.manifest.id;
		const data = JSON.stringify(this.metadata, null, 2);
		await this.app.vault.adapter.write(`.obsidian/plugins/${pluginId}/plugin-metadata.json`, data);
	}

	/**
	 * Start periodic scanning (every 30 minutes)
	 */
	startPeriodicScan(): void {
		// Initial scan
		this.scanAllPlugins();

		// Scan every 30 minutes
		this.scanInterval = window.setInterval(() => {
			this.scanAllPlugins();
		}, 30 * 60 * 1000);
	}

	/**
	 * Stop periodic scanning
	 */
	stopPeriodicScan(): void {
		if (this.scanInterval) {
			window.clearInterval(this.scanInterval);
			this.scanInterval = null;
		}
	}

	/**
	 * Scan all plugins and update metadata
	 */
	async scanAllPlugins(): Promise<void> {
		const manifests = (this.app as any).plugins.manifests;
		const enabledPlugins = (this.app as any).plugins.enabledPlugins;
		if (!manifests) return;

		const adapter = this.app.vault.adapter as any;
		const basePath = adapter.basePath;
		
		// Skip file scanning on mobile or if basePath is not available
		if (!basePath) {
			// Still update basic metadata without file timestamps
			for (const pluginId of Object.keys(manifests)) {
				const manifest = manifests[pluginId];
				this.metadata[pluginId] = {
					id: pluginId,
					name: manifest.name || pluginId,
					version: manifest.version || 'Unknown',
					author: manifest.author || 'Unknown',
					enabled: enabledPlugins.has(pluginId),
					updatedAt: Date.now(), // Use current time as fallback
					scannedAt: Date.now()
				};
			}
			await this.save();
			return;
		}

		const pluginsFolder = basePath + '/.obsidian/plugins';
		
		for (const pluginId of Object.keys(manifests)) {
			try {
				const manifest = manifests[pluginId];
				const pluginPath = `${pluginsFolder}/${pluginId}`;
				
				// Get manifest.json file modification time
				const manifestPath = `${pluginPath}/manifest.json`;
				const stat = await this.getFileStat(manifestPath);
				
				if (stat) {
					this.metadata[pluginId] = {
						id: pluginId,
						name: manifest.name || pluginId,
						version: manifest.version || 'Unknown',
						author: manifest.author || 'Unknown',
						enabled: enabledPlugins.has(pluginId),
						updatedAt: stat.mtime,
						scannedAt: Date.now()
					};
				}
			} catch (error) {
				// Silently skip plugins that can't be scanned
				console.debug(`Failed to scan plugin ${pluginId}:`, error);
			}
		}

		await this.save();
	}

	/**
	 * Get file stat using Node.js fs (desktop only)
	 */
	private async getFileStat(path: string): Promise<{ mtime: number } | null> {
		try {
			// Use Obsidian's adapter to get file stats
			const adapter = this.app.vault.adapter;
			
			// Check if we're on desktop (has fs access)
			if ((adapter as any).fs) {
				const fs = (adapter as any).fs;
				const stats = await fs.promises.stat(path);
				return { mtime: stats.mtimeMs };
			}
			
			// Fallback: try to use adapter's stat method if available
			if ((adapter as any).stat) {
				const stats = await (adapter as any).stat(path);
				return { mtime: stats.mtime };
			}
		} catch (error) {
			// File doesn't exist or can't be accessed
		}
		
		return null;
	}

	/**
	 * Get metadata for a specific plugin
	 */
	getMetadata(pluginId: string): PluginMetadata | null {
		return this.metadata[pluginId] || null;
	}

	/**
	 * Get all metadata
	 */
	getAllMetadata(): Record<string, PluginMetadata> {
		return this.metadata;
	}

	/**
	 * Force refresh metadata for all plugins
	 */
	async refresh(): Promise<void> {
		await this.scanAllPlugins();
	}
}
