import { Editor, Notice } from "obsidian";
import { LinkConverterPreviewModal } from "./LinkConverterPreviewModal";
import LemonToolkitPlugin from "../../main";
import { t } from "../../i18n/locale";

export type ConversionType = "wiki-to-markdown" | "markdown-to-wiki";
export type LinkType = "image" | "video" | "document";

export interface LinkMatch {
	original: string;
	converted: string;
	startIndex: number;
	endIndex: number;
	line: number;
	linkType: LinkType;
}

export class LinkConverterManager {
	private plugin: LemonToolkitPlugin;

	constructor(plugin: LemonToolkitPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Convert links in the entire file
	 */
	async convertInFile(editor: Editor, type: ConversionType): Promise<void> {
		const content = editor.getValue();
		
		// Get current file for relative path calculation
		const currentFile = this.plugin.app.workspace.getActiveFile();
		if (!currentFile) {
			new Notice(t('noActiveFile'));
			return;
		}
		
		const matches = this.findLinks(content, type, currentFile);

		if (matches.length === 0) {
			const linkType = type === "wiki-to-markdown" ? "wiki links" : "markdown links";
			new Notice(t('noLinksFoundInFile', { type: linkType }));
			return;
		}

		this.showPreviewModal(editor, matches, type, false);
	}

	/**
	 * Convert links in selected text
	 */
	async convertInSelection(editor: Editor, type: ConversionType): Promise<void> {
		const selection = editor.getSelection();
		
		if (!selection) {
			new Notice(t('noTextSelected'));
			return;
		}

		// Get current file for relative path calculation
		const currentFile = this.plugin.app.workspace.getActiveFile();
		if (!currentFile) {
			new Notice(t('noActiveFile'));
			return;
		}

		const matches = this.findLinks(selection, type, currentFile);

		if (matches.length === 0) {
			const linkType = type === "wiki-to-markdown" ? "wiki links" : "markdown links";
			new Notice(t('noLinksFoundInSelection', { type: linkType }));
			return;
		}

		this.showPreviewModal(editor, matches, type, true);
	}

	/**
	 * Determine link type based on file extension
	 */
	private getLinkType(link: string): LinkType {
		const lowerLink = link.toLowerCase();
		
		const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'];
		const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];
		
		if (imageExtensions.some(ext => lowerLink.endsWith(ext))) {
			return "image";
		}
		if (videoExtensions.some(ext => lowerLink.endsWith(ext))) {
			return "video";
		}
		return "document";
	}

	/**
	 * Calculate relative path from current file to target file
	 */
	private getRelativePath(currentFilePath: string, targetFilePath: string): string {
		const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf("/"));
		
		// If current file is in root, use ./
		if (!currentDir) {
			return `./${targetFilePath}`;
		}
		
		// Split paths into parts
		const currentParts = currentDir.split("/");
		const targetParts = targetFilePath.split("/");
		
		// Find common prefix
		let commonLength = 0;
		while (
			commonLength < currentParts.length &&
			commonLength < targetParts.length - 1 &&
			currentParts[commonLength] === targetParts[commonLength]
		) {
			commonLength++;
		}
		
		// Calculate how many levels to go up
		const levelsUp = currentParts.length - commonLength;
		
		// Build relative path
		const upPath = levelsUp > 0 ? "../".repeat(levelsUp) : "./";
		const downPath = targetParts.slice(commonLength).join("/");
		
		return upPath + downPath;
	}

	/**
	 * Find all links in text
	 */
	private findLinks(text: string, type: ConversionType, currentFile: any): LinkMatch[] {
		const matches: LinkMatch[] = [];
		const lines = text.split("\n");

		if (type === "wiki-to-markdown") {
			// Find wiki links: [[link]] or [[link|alias]]
			lines.forEach((line, lineIndex) => {
				const wikiLinkRegex = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g;
				let match;

				while ((match = wikiLinkRegex.exec(line)) !== null) {
					const fullMatch = match[0];
					const link = match[1];
					const alias = match[3];

					const converted = this.wikiToMarkdown(link, alias, currentFile);
					const linkType = this.getLinkType(link);

					matches.push({
						original: fullMatch,
						converted,
						startIndex: match.index,
						endIndex: match.index + fullMatch.length,
						line: lineIndex,
						linkType,
					});
				}
			});
		} else {
			// Find markdown links: [text](url)
			lines.forEach((line, lineIndex) => {
				const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
				let match;

				while ((match = markdownLinkRegex.exec(line)) !== null) {
					const fullMatch = match[0];
					const text = match[1];
					const url = match[2];

					// Skip external links (http/https)
					if (url.startsWith("http://") || url.startsWith("https://")) {
						continue;
					}

					const converted = this.markdownToWiki(url, text);
					const linkType = this.getLinkType(url);

					matches.push({
						original: fullMatch,
						converted,
						startIndex: match.index,
						endIndex: match.index + fullMatch.length,
						line: lineIndex,
						linkType,
					});
				}
			});
		}

		return matches;
	}

	/**
	 * Convert wiki link to markdown link
	 * Wiki links can be just filenames - we need to find the actual file path in the vault
	 */
	private wikiToMarkdown(link: string, alias: string | undefined, currentFile: any): string {
		// Clean the link
		const cleanLink = link.trim();
		
		// Check if it's a media file (image or video)
		const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'];
		const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];
		const isMedia = [...imageExtensions, ...videoExtensions].some(ext => 
			cleanLink.toLowerCase().endsWith(ext)
		);
		
		// Try to find the actual file in the vault
		let actualPath = cleanLink;
		
		// If the link doesn't contain a path separator, search for the file in the vault
		if (!cleanLink.includes("/")) {
			const file = this.plugin.app.vault.getAbstractFileByPath(cleanLink);
			if (!file) {
				// File not found by direct path, search all files
				const allFiles = this.plugin.app.vault.getFiles();
				const found = allFiles.find(f => f.name === cleanLink);
				if (found) {
					actualPath = found.path;
				}
			}
		}
		
		// For media files, don't add .md extension
		// For other files, add .md if not present
		let linkPath: string;
		if (isMedia) {
			linkPath = actualPath;
		} else {
			linkPath = actualPath.endsWith(".md") ? actualPath : `${actualPath}.md`;
		}
		
		// Calculate relative path from current file to target file
		const relativePath = this.getRelativePath(currentFile.path, linkPath);
		
		// Use alias if provided, otherwise use the filename without extension for media
		let displayText: string;
		if (alias) {
			displayText = alias.trim();
		} else if (isMedia) {
			// For media, use only the filename (without path) without extension as alt text
			const filename = actualPath.split("/").pop() || actualPath;
			displayText = filename.replace(/\.[^.]+$/, "");
		} else {
			// For documents, use only the filename (without path) without .md
			const filename = actualPath.split("/").pop() || actualPath;
			displayText = filename.replace(/\.md$/, "");
		}
		
		// Encode spaces and special characters in URL
		const encodedLink = relativePath.replace(/ /g, "%20");
		
		return `[${displayText}](${encodedLink})`;
	}

	/**
	 * Convert markdown link to wiki link
	 * Wiki links prefer just filenames (Obsidian will find the file automatically)
	 */
	private markdownToWiki(url: string, text: string): string {
		// Decode URL encoding
		let link = decodeURIComponent(url);
		
		// Remove leading ./ or ../ if present
		link = link.replace(/^\.\.?\//, "");
		
		// Check if it's a media file
		const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'];
		const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];
		const isMedia = [...imageExtensions, ...videoExtensions].some(ext => 
			link.toLowerCase().endsWith(ext)
		);
		
		// Only remove .md extension for non-media files
		if (!isMedia) {
			link = link.replace(/\.md$/, "");
		}
		
		// Extract filename from path - Wiki links prefer just the filename
		const filename = link.split("/").pop() || link;
		
		// Check if there are multiple files with the same name in the vault
		const allFiles = this.plugin.app.vault.getFiles();
		const filesWithSameName = allFiles.filter(f => f.name === filename);
		
		// If there are multiple files with the same name, keep the full path
		// Otherwise, use just the filename (Obsidian's default behavior)
		let wikiLink: string;
		if (filesWithSameName.length > 1) {
			// Multiple files with same name, use full path
			wikiLink = link;
		} else {
			// Single file, use just filename
			wikiLink = filename;
		}
		
		// For media, compare text with filename without extension
		const filenameWithoutExt = filename.replace(/\.[^.]+$/, "");
		
		// If text is different from filename, use alias syntax
		if (text !== filename && text !== wikiLink && text !== filenameWithoutExt) {
			return `[[${wikiLink}|${text}]]`;
		}
		
		return `[[${wikiLink}]]`;
	}

	/**
	 * Show preview modal
	 */
	private showPreviewModal(
		editor: Editor,
		matches: LinkMatch[],
		type: ConversionType,
		isSelection: boolean
	): void {
		const modal = new LinkConverterPreviewModal(
			this.plugin.app,
			matches,
			type,
			async (selectedMatches: LinkMatch[]) => {
				await this.applyConversion(editor, selectedMatches, isSelection);
			}
		);

		modal.open();
	}

	/**
	 * Apply conversion to editor
	 */
	private async applyConversion(
		editor: Editor,
		matches: LinkMatch[],
		isSelection: boolean
	): Promise<void> {
		if (isSelection) {
			// Convert in selection
			let selection = editor.getSelection();
			
			// Sort matches by position (reverse order to maintain indices)
			const sortedMatches = [...matches].sort((a, b) => {
				const aPos = selection.indexOf(a.original);
				const bPos = selection.indexOf(b.original);
				return bPos - aPos;
			});

			// Replace each match
			sortedMatches.forEach((match) => {
				selection = selection.replace(match.original, match.converted);
			});

			editor.replaceSelection(selection);
		} else {
			// Convert in entire file
			const content = editor.getValue();
			const lines = content.split("\n");

			// Group matches by line and sort by position (reverse)
			const matchesByLine = new Map<number, LinkMatch[]>();
			matches.forEach((match) => {
				if (!matchesByLine.has(match.line)) {
					matchesByLine.set(match.line, []);
				}
				matchesByLine.get(match.line)!.push(match);
			});

			// Process each line
			matchesByLine.forEach((lineMatches, lineIndex) => {
				// Sort by position (reverse) to maintain indices
				lineMatches.sort((a, b) => b.startIndex - a.startIndex);
				
				let line = lines[lineIndex];
				lineMatches.forEach((match) => {
					line = 
						line.substring(0, match.startIndex) +
						match.converted +
						line.substring(match.endIndex);
				});
				
				lines[lineIndex] = line;
			});

			editor.setValue(lines.join("\n"));
		}

		new Notice(t('convertedLinks', { count: matches.length.toString(), s: matches.length > 1 ? "s" : "" }));
	}
}
