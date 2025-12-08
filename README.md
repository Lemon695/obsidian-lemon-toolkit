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

- **Open command palette** - Open a dedicated command palette showing only Lemon Toolkit commands. Commands can be sorted by most recently used or most frequently used, with pinned commands always at the top. Includes fuzzy search and usage statistics
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

### Recent Files View

- **Open recent files** - Open a smart sidebar view to manage your recent files:
  - **Three tabs**: Recently Edited, Recently Viewed, Recently Created
  - **Pin files** - Pin frequently used files to the top for quick access
  - **Time display** - See when each file was last accessed (e.g., "2h ago", "3d ago")
  - **Right-click menu** - Quick actions: pin/unpin, open in new tab, reveal in navigation, move, or delete
  - **Auto-tracking** - Automatically tracks file edits, views, and creations
  - **Clean interface** - Modern, organized UI with clear visual hierarchy

### Link Converter

Convert between Wiki links and Markdown links with preview and selection:

- **Convert wiki links to markdown (file)** - Convert all `[[wiki links]]` to `[markdown](links)` in the entire file
- **Convert markdown links to wiki (file)** - Convert all `[markdown](links)` to `[[wiki links]]` in the entire file
- **Convert wiki links to markdown (selection)** - Convert only selected wiki links
- **Convert markdown links to wiki (selection)** - Convert only selected markdown links

**Features**:
- Preview before converting with checkbox selection
- Preserves aliases: `[[link|alias]]` → `[alias](./link.md)`
- Smart image handling: Images keep original extensions (`.png`, `.jpg`, etc.)
- Typora-compatible paths: Uses relative paths like `./folder/file.md` or `../_resources/image.png`
- Automatic path resolution: Finds files in vault and calculates correct relative paths
- Type filters: Quickly select/deselect all images, videos, or documents
- Skips external links (http/https) when converting to wiki links
- Shows line numbers and before/after comparison

### Smart Paste

Paste clipboard content with automatic transformations based on configurable rules:

- **Smart paste with rules** - Paste clipboard content at cursor with rules applied

**Features**:
- **Smart format detection**: Automatically reads HTML format from clipboard (if available), preserving links and formatting
- **HTML to Markdown conversion**: Automatically converts rich text to Markdown format
- Configure multiple transformation rules with regex patterns
- Enable/disable rules individually
- Test rules with sample text before applying
- Reorder rules to control application sequence
- Built-in rule for removing Weibo timeline images
- Supports capture groups for advanced replacements

**Supported HTML elements**:
- Links (`<a>`) → `[text](url)`
- Images (`<img>`) → `![alt](src)`
- Bold/Italic (`<strong>`, `<em>`) → `**text**`, `*text*`
- Headings (`<h1>`-`<h6>`) → `# text`
- Lists (`<ul>`, `<ol>`) → `- item`, `1. item`
- Code (`<code>`, `<pre>`) → `` `code` ``, ` ```code``` `
- Blockquotes (`<blockquote>`) → `> text`

**Example use cases**:
- Copy content with links from web/apps, automatically convert to Markdown
- Remove unwanted images from copied web content
- Clean up formatting from external sources
- Transform URLs or links automatically
- Strip tracking parameters
- Normalize whitespace or line breaks

### Moment Logger

Quick timestamp logging for daily journals and time tracking:

- **Insert moment (auto)** - Smart insertion: appends to existing moment block or inserts at cursor
- **Insert moment (at cursor)** - Always insert at cursor position (manual mode)

**Features**:
- **Smart detection**: Automatically finds existing moment blocks in your document
- **Auto-append**: New moments are added to the end of existing timeline
- **Manual override**: Use "at cursor" command to insert anywhere in the document
- **Customizable format**: Configure timestamp format in settings (default: `YYYY-MM-DD HH:mm:ss`)
- **Ready to type**: Cursor positioned after timestamp for immediate description entry

**Example usage**:
```markdown
- 2024-12-04 09:01:12 Started work
- 2024-12-04 10:30:45 Team meeting
- 2024-12-04 12:00:00 Lunch break
- 2024-12-04 14:15:30 Code review
- 2024-12-04 18:00:00 End of day
```

**How it works**:
1. First use: Creates new moment entry at cursor
2. Subsequent uses: Automatically appends to existing moment block
3. Need to insert elsewhere? Use "Insert moment (at cursor)" command

### Smart Copy

Intelligent content copying based on document structure:

- **Copy current heading section** - Copy the heading at cursor and all content under it
- **Copy current code block** - Copy the code block at cursor position
- **Copy current table** - Copy the table at cursor position
- **Smart copy selector** - Visual selector to choose and copy multiple blocks
- **Select code blocks to copy** - Select multiple code blocks from entire document
- **Select code lines to copy** - Select specific lines from current code block
- **Select table rows to copy** - Select specific rows from current table

**Features**:
- **Context-aware**: Automatically detects what content you're in (heading, code, table)
- **Multi-select**: Select multiple non-contiguous blocks to copy at once
- **Type filters**: Quickly select all headings, code blocks, or tables
- **Visual preview**: See content preview before copying
- **Smart combination**: Multiple selections are combined with proper spacing

**Supported content types**:
- **Headings**: Copy entire sections including all subsections
- **Code blocks**: Copy complete code blocks with language tags
- **Tables**: Copy entire tables with proper formatting
- **Lists**: Copy list structures (coming soon)

**Use cases**:
- Extract specific sections from long documents
- Copy multiple code examples at once
- Combine non-contiguous content for sharing
- Quick copy without precise text selection

**Example workflow**:
1. Place cursor in a heading
2. Run "Copy current heading section"
3. Entire section (including subsections) copied to clipboard

Or use the selector:
1. Run "Smart copy selector"
2. Check multiple headings and code blocks
3. Click "Copy Selected"
4. All selected content combined and copied

**API Documentation Example**:
```markdown
## Request
```json
{ "user": "john" }
```

## Response
```json
{ "status": "ok" }
```
```

Use "Select code blocks to copy":
1. Opens selector showing all code blocks
2. Check both JSON blocks
3. Copy both at once with blank line separator
4. Perfect for sharing API examples!

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

### External Applications

- **External app management** - Configure external applications to open files and folders:
  - Add custom applications in settings (name, path)
  - Configure whether app can open files/folders
  - Auto-generate commands for each app
  - Supports macOS, Windows, Linux
  - Add unlimited number of applications

### Heading Numbering

- **Add/update heading numbering** - Automatically add or update hierarchical numbering for all headings:
  - Supports multi-level numbering (1、1.1、1.2、1.2.1, etc.)
  - Preview changes before applying
  - Highlights modified headings
  - Preserves heading text
  - Smart detection of existing numbers
  - Skips code blocks automatically
  
- **Remove heading numbering** - Remove all numbering from headings in the document

- **Rename file from H1 heading** - Rename the file based on the first level-1 heading:
  - Automatically finds the first `# Heading` in the document
  - Renames the file to match the heading text
  - Skips headings inside code blocks
  - Sanitizes filename (removes invalid characters like `/:*?"<>|`)
  - Shows notification if filename already matches heading

- **Rename file** - Rename the current file with a modal dialog:
  - Shows current filename in an editable input field
  - **Smart suggestions** based on your rename history:
    - Analyzes recent rename patterns (last 30 days)
    - Detects suffix/prefix additions (e.g., "- DataviewJS", "Draft - ")
    - Ranks suggestions by frequency and recency
    - Shows usage count for each pattern
  - **Quick suggestions**:
    - Add timestamp: `filename-20250106`
    - Add date prefix: `20250106-filename`
    - Add Unix timestamp: `filename-1733456789`
    - Add short UUID: `filename-a1b2c3d4`
  - Click any suggestion to apply instantly
  - Automatically sanitizes invalid characters
  - History stored locally (max 500 records, 90-day retention)

### Table Editor

- **Edit table** - Open a visual table editor with Excel-like experience:
  - **Visual editing**: Edit cells in a spreadsheet-like interface
  - **Keyboard navigation**: Tab/Enter to move between cells
  - **Drag & drop**: Reorder rows and columns by dragging
  - **Column resize**: Drag column edges to adjust width
  - **CSV import/export**: Import from or export to CSV files
  - **Find & replace**: Search and replace text across the table
  - **Batch fill**: Fill entire columns with a value
  - **Clear column**: Quickly clear all data in a column
  - **Insert/delete**: Add or remove rows and columns
  - **Alignment**: Set left/center/right alignment
  - **Sort**: Sort by column (ascending/descending)
  - **Smart detection**: Only activates when cursor is inside a table
  - **Position preservation**: Cursor stays in place after saving

### Command Statistics & Analytics

- **Show Statistics** - Open a comprehensive analytics dashboard to track your command usage and productivity:

**Features**:
- **Four analytical views**:
  - **Overview**: Key metrics at a glance with today's activity summary
  - **Commands**: Detailed statistics for each command with sortable table
  - **Efficiency**: Time savings analysis showing how much time you've saved
  - **Trends**: Visual charts and heatmaps of usage patterns

- **Smart tracking**:
  - Automatically tracks all command executions
  - Records timestamp for each usage
  - Calculates efficiency gains based on estimated manual operation time
  - Batched storage writes for optimal performance

- **Insightful metrics**:
  - Total commands executed (with comparison to previous period)
  - Most used commands with visual bars
  - Time saved per command and cumulative totals
  - Average uses per day for each command
  - Usage trends over last 30 days
  - Heatmap showing usage by day of week and hour

- **Data management**:
  - Export statistics as JSON for external analysis
  - Clear all data with confirmation
  - Configurable data retention periods
  - Privacy-focused: all data stored locally

- **Professional UI**:
  - Fixed-size modal window (900x700px) for consistent experience
  - Smooth tab switching without layout shifts
  - Material Design-inspired interface
  - Responsive charts and visualizations

**Example insights**:
- "You've executed 156 commands today, 23% more than yesterday"
- "Smart Copy is your most used feature with 45 uses this week"
- "You've saved 2.5 hours this month using automation commands"
- "Peak usage time: Weekdays 2-4 PM"

**Use cases**:
- Track which features you use most
- Quantify productivity improvements
- Identify workflow patterns
- Optimize your command usage
- Justify plugin value with time savings data

### Plugin Usage Statistics

- **Show Plugin Usage Stats** - View which plugins you use most frequently based on command usage:

**Features**:
- **Usage ranking**: Plugins sorted by total command usage
- **Detailed metrics**: Shows command count and total uses for each plugin
- **Quick access**: Click any plugin to open its settings
- **Smart aggregation**: Automatically extracts plugin data from command statistics

**Display information**:
- Plugin rank (top 3 highlighted)
- Plugin name
- Number of commands used
- Total usage count
- Visual ranking with color coding

**Use cases**:
- Discover which plugins you actually use
- Identify unused plugins for cleanup
- Optimize your plugin setup
- Quick access to frequently used plugin settings

### Plugin Manager

- **Open Plugin Manager** - Manage all your plugins in one place with advanced features:

**Features**:
- **Enable/Disable plugins**: Toggle plugins on/off with one click
- **Plugin information**: View name, version, author, description, and update time
- **Usage statistics**: See how often you use each plugin's commands
- **Smart filtering**: Filter by enabled/disabled status
- **Search**: Quickly find plugins by name, ID, or author
- **Multiple sort options**:
  - Usage Count: Sort by most used plugins
  - Name: Alphabetical order
  - Recently Used: Sort by last command usage
  - Recently Updated: Sort by plugin update time
- **Quick actions**: Open plugin settings directly from the manager
- **Auto-refresh**: Automatically scans plugin metadata every 30 minutes
- **Manual refresh**: Click refresh button to update plugin information immediately

**Display information**:
- Plugin rank (top 3 highlighted when sorted by usage)
- Plugin name and description
- Version, author, and last update time
- Enable/disable status badge
- Usage statistics (command count and total uses)
- Last used time

**Plugin metadata tracking**:
- Automatically tracks plugin update times from filesystem
- Stores metadata in separate `plugin-metadata.json` file
- Includes: ID, name, version, author, enabled status, update time

**Use cases**:
- Manage all plugins in one convenient interface
- Identify which plugins are actually being used
- Find recently updated plugins
- Quickly enable/disable plugins without going to settings
- Clean up unused plugins based on usage data

### Document Outline

- **Show document outline** - Display a navigable outline of the current document:

**Features**:
- **Smart extraction**: Automatically extracts all headings (H1-H6) from the document
- **Code block filtering**: Excludes headings inside code blocks (```java, ```dataviewjs, etc.)
- **Hierarchical display**: Shows heading levels with visual indentation
- **Click to navigate**: Click any heading to jump to that position in the document
- **One-click copy**: Copy entire outline to clipboard in list format
- **Empty state handling**: Friendly message when no headings are found

**Outline format**:
- Each heading level is indented with tabs
- Example:
  ```
  - Main Heading
  	- Subheading
  		- Sub-subheading
  	- Another Subheading
  - Another Main Heading
  ```

**Use cases**:
- Quick navigation in long documents
- Get an overview of document structure
- Copy outline for sharing or documentation
- Verify heading hierarchy

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
| `Lemon Toolkit: Add/update heading numbering` | Add or update hierarchical numbering for headings |
| `Lemon Toolkit: Remove heading numbering` | Remove all numbering from headings |
| `Lemon Toolkit: Rename file from H1 heading` | Rename file based on first level-1 heading |
| `Lemon Toolkit: Rename file` | Rename the current file with a modal dialog |
| `Lemon Toolkit: Edit table` | Open visual table editor with Excel-like features |
| `Lemon Toolkit: Create table` | Create new table at cursor position |
| `Lemon Toolkit: Show Statistics` | Open command usage analytics dashboard |
| `Lemon Toolkit: Show Plugin Usage Stats` | View plugin usage statistics based on command usage |
| `Lemon Toolkit: Show document outline` | Display document outline with clickable headings |

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

- **Sort by** - Choose how to sort commands in the command palette
  - Most recently used (default): Shows the most recently used commands first
  - Most frequently used: Sorts by usage count
  
- **Time range** (only for "Most frequently used" mode) - Only count command usage within this time range
  - Last 24 hours: Only count commands used in the last day
  - Last 7 days: Only count commands used in the last week
  - Last 30 days (default): Only count commands used in the last month
  - All time: Count all command usage since installation

- **Pinned commands** - Select commands to pin at the top of the command palette. Pinned commands will always appear first, followed by sorted commands

### File Info View

- **Show reading time** - Display estimated reading time based on word count (default: enabled)
- **Date time format** - Customize the format for displaying dates and times (default: YYYY-MM-DD HH:mm)

### Frontmatter Editor

- **Show type icons** - Display type icons next to field names (default: enabled)
- **Close after save** - Automatically close the editor after saving (default: disabled)
- **Date format** - Format for date fields (default: YYYY-MM-DD)

### External Applications

- **Manage external applications** - Configure external application list
  - Add application name and full path
  - Choose if app can open files
  - Choose if app can open folders
  - Auto-generate commands after saving

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

If you encounter any issues or have feature requests, please [open an issue](https://github.com/Lemon695/obsidian-lemon-toolkit/issues) on GitHub.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with the [Obsidian API](https://docs.obsidian.md).
