# Lemon Toolkit

A personal productivity toolkit plugin for Obsidian with useful utility features.

## Features

### Copy Path Commands

Quickly copy file paths in various formats with keyboard shortcuts:

- **Copy relative path** - Copy the file path relative to your vault root
- **Copy absolute path** - Copy the full system path (desktop only)
- **Copy file name** - Copy the filename with extension
- **Copy file name (no extension)** - Copy the filename without extension

All commands show a confirmation notice with the copied content.

### Delete File Commands

Manage file deletion with two options:

- **Delete file permanently** - Permanently delete the active file from your vault
- **Delete file to trash** - Move the active file to Obsidian's trash folder (.trash)

### File Management Commands

- **Duplicate file** - Duplicate the current file with a modal dialog to rename. The default name includes a suffix (timestamp or UUID, configurable in settings), which you can modify before confirming
- **Move file to folder** - Move the current file to a folder with smart history. The folder list shows recently used folders first, and you can filter by typing. The plugin automatically tracks all file moves (including drag-and-drop and native Obsidian moves)

### Tag Management Commands

- **View current tags** - Display all tags in the current file in a modal. Click any tag to copy it to clipboard
- **Insert tags** - Insert tags at cursor position with a multi-select modal. Tags are sorted by usage frequency or recency (configurable in settings). Includes a search filter to quickly find tags. The plugin automatically tracks tag usage when you manually type tags in your notes

### Command Palette

- **Open command palette** - Open a dedicated command palette showing only Lemon Toolkit commands. Commands are sorted by most recently used, with pinned commands always at the top. Includes fuzzy search and usage statistics
- **Open settings** - Quickly open the plugin settings page to modify configurations

### File Information View

- **Open file info** - Open a sidebar view displaying comprehensive information about the active file:
  - Basic information (name, path, dates, size, word count, reading time)
  - Frontmatter fields with formatted display
  - All tags (clickable to search)
  - Outgoing and incoming links (clickable to navigate)
  - File location breadcrumb
  - Auto-updates when switching files or modifying content
  - Click on file name/path to copy

### Frontmatter Editor

- **Edit frontmatter** - Open a modal dialog to edit frontmatter fields without entering edit mode:
  - View and edit all frontmatter fields
  - Add new fields with type selection
  - Delete existing fields
  - Search/filter fields
  - Quick actions for common operations
  - Type-aware editing (string, number, boolean, date, array)
  - Auto-save with validation

### Text Selection Actions

- **Text selection actions** - Quick actions for selected text (select text and run command):
  - Create new note from selection (replaces with link)
  - Search globally for selected text
  - Wrap as [[wiki-link]]
  - Wrap as callout (multiple types)
  - Add as tag
  - Copy as quote format
  - Send/append to another file

## Usage

1. Open any file in your vault
2. Open the command palette (Ctrl/Cmd + P)
3. Search for "Lemon Toolkit" commands
4. Select the copy command you need
5. The content will be copied to your clipboard with a confirmation notice

### Command List

| Command | Description |
|---------|-------------|
| `Lemon Toolkit: Copy relative path` | Copy file path relative to vault root |
| `Lemon Toolkit: Copy absolute path` | Copy full system path |
| `Lemon Toolkit: Copy file name` | Copy filename with extension |
| `Lemon Toolkit: Copy file name (no extension)` | Copy filename without extension |
| `Lemon Toolkit: Delete file permanently` | Permanently delete the active file |
| `Lemon Toolkit: Delete file to trash` | Move the active file to Obsidian's trash |
| `Lemon Toolkit: Duplicate file` | Duplicate the current file with a rename dialog |
| `Lemon Toolkit: Move file to folder` | Move the current file to a folder with smart history |
| `Lemon Toolkit: View current tags` | View all tags in the current file |
| `Lemon Toolkit: Insert tags` | Insert tags at cursor position |
| `Lemon Toolkit: Open command palette` | Open the Lemon Toolkit command palette |
| `Lemon Toolkit: Open settings` | Open the plugin settings page |
| `Lemon Toolkit: Open file info` | Open the file information sidebar |
| `Lemon Toolkit: Edit frontmatter` | Edit frontmatter fields in a modal dialog |
| `Lemon Toolkit: Text selection actions` | Quick actions for selected text |

## Installation

### From Obsidian Community Plugins

1. Open **Settings** → **Community plugins**
2. Select **Browse** and search for "Lemon Toolkit"
3. Select **Install**
4. Once installed, select **Enable**

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/yourusername/lemon-toolkit/releases) page
2. Extract the files to your vault's plugins folder: `<vault>/.obsidian/plugins/lemon-toolkit/`
3. Reload Obsidian
4. Enable the plugin in **Settings** → **Community plugins**

## Settings

Configure the plugin in **Settings** → **Lemon Toolkit**:

### Duplicate File

- **Duplicate file suffix type** - Choose the suffix format for duplicated file names
  - Timestamp (default): `filename-1733234567890.md`
  - UUID: `filename-a1b2c3d4.md`

### Move File

- **Folder list sort order** - Choose how to sort the folder list when moving files
  - Most recently used (default): Shows the most recently moved-to folder first
  - Most used in last 24 hours: Sorts by move frequency in the last day
  - Most used in last 7 days: Sorts by move frequency in the last week
  - Most used in last 30 days: Sorts by move frequency in the last month

Note: The plugin automatically tracks all file moves, including drag-and-drop, right-click moves, and native Obsidian file operations.

### Tags

- **Tag list sort order** - Choose how to sort the tag list when inserting tags
  - Most recently used (default): Shows the most recently used tags first
  - Most used in last 24 hours: Sorts by usage frequency in the last day
  - Most used in last 7 days: Sorts by usage frequency in the last week
  - Most used in last 30 days: Sorts by usage frequency in the last month
  - Alphabetical order: Sorts tags alphabetically

Note: The plugin automatically tracks tag usage when you manually type tags in your notes, not just when using the insert tags command.

### Command Palette

- **Pinned commands** - Select commands to pin at the top of the command palette. Pinned commands will always appear first, followed by recently used commands

### File Info View

- **Show reading time** - Display estimated reading time based on word count (default: enabled)
- **Date time format** - Customize the format for displaying dates and times (default: YYYY-MM-DD HH:mm)

### Frontmatter Editor

- **Show type icons** - Display type icons next to field names (default: enabled)
- **Close after save** - Automatically close the editor after saving (default: disabled)
- **Date format** - Format for date fields (default: YYYY-MM-DD)

## Compatibility

- Minimum Obsidian version: 1.0.0
- Works on desktop (Windows, macOS, Linux)
- Works on mobile (iOS, Android) with limited features
  - Note: Absolute path copying is not available on mobile devices

## Development

This plugin is built with TypeScript and uses a modular architecture for easy extensibility.

### Building the Plugin

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build
```

### Project Structure

```
src/
├── main.ts              # Plugin entry point
├── settings.ts          # Plugin settings interface
├── commands/
│   ├── index.ts         # Command registration
│   ├── copyPath.ts      # Copy path feature implementation
│   ├── deleteFile.ts    # Delete file feature implementation
│   ├── duplicateFile.ts # Duplicate file feature implementation
│   ├── moveFile.ts      # Move file feature implementation
│   ├── tags.ts          # Tag management feature implementation
│   ├── commandPalette.ts # Command palette feature implementation
│   └── openSettings.ts  # Open settings feature implementation
├── views/
│   └── FileInfoView.ts  # File information sidebar view
├── ui/
│   ├── DuplicateFileModal.ts # Modal for renaming duplicated file
│   ├── MoveFileModal.ts      # Modal for moving file with history
│   ├── ViewCurrentTagsModal.ts # Modal for viewing current tags
│   ├── InsertTagsModal.ts    # Modal for inserting tags
│   ├── CommandPaletteModal.ts # Modal for Lemon Toolkit command palette
│   ├── PinnedCommandsModal.ts # Modal for managing pinned commands
│   └── SettingTab.ts         # Plugin settings tab
└── utils/
    ├── clipboard.ts     # Clipboard utility
    └── suffix.ts        # Suffix generation utility
```

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/yourusername/lemon-toolkit/issues) on GitHub.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with the [Obsidian API](https://docs.obsidian.md).
