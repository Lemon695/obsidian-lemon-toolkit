import LemonToolkitPlugin from "../../main";

interface FileRecord {
	path: string;
	timestamp: number;
	isPinned?: boolean;
}

export interface RecentFilesData {
	edited: FileRecord[];
	viewed: FileRecord[];
	created: FileRecord[];
	pinned: string[];
}

export class RecentFilesManager {
	private plugin: LemonToolkitPlugin;
	private data: RecentFilesData;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
		this.data = {
			edited: [],
			viewed: [],
			created: [],
			pinned: [],
		};
	}

	async load(): Promise<void> {
		const fileData = await this.plugin.app.vault.adapter.read(
			`${this.plugin.manifest.dir}/recent-files.json`
		).catch(() => '{"data":{"edited":[],"viewed":[],"created":[],"pinned":[]}}');
		const parsed = JSON.parse(fileData);
		this.data = parsed.data || {
			edited: [],
			viewed: [],
			created: [],
			pinned: [],
		};
	}

	async save(): Promise<void> {
		const fileData = JSON.stringify({ data: this.data }, null, 2);
		await this.plugin.app.vault.adapter.write(
			`${this.plugin.manifest.dir}/recent-files.json`,
			fileData
		);
	}

	getData(): RecentFilesData {
		return this.data;
	}

	setData(data: RecentFilesData): void {
		this.data = data;
	}
}
