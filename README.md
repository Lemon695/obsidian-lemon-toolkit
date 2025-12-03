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
├── commands/
│   ├── index.ts         # Command registration
│   └── copyPath.ts      # Copy path feature implementation
└── utils/
    └── clipboard.ts     # Clipboard utility
```

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/yourusername/lemon-toolkit/issues) on GitHub.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with the [Obsidian API](https://docs.obsidian.md).
