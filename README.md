# JetBrains Toolbox Search Provider

## Description

![screenshot.png](https://github.com/user-attachments/assets/1cff1c9f-e9b4-4f55-b27d-8641a9874617)

JetBrains Toolbox Search Provider is a GNOME Shell extension that integrates JetBrains IDEs' recent projects into GNOME Shell search, allowing you to quickly open your projects directly from the activities overview.

**This extension is based on [VSCode Search Provider](https://github.com/MrMarble/vscode-search-provider) by MrMarble.**

## Features

- ✅ Supports GNOME Shell 46-49 (Fedora 41-43 and similar)
- 🔍 Search and open recent JetBrains IDE projects from GNOME Shell search
- 🚀 Direct integration with JetBrains Toolbox
- 🎨 Shows IDE-specific icons for each project
- ⚙️ Configurable display options
- 📊 Automatically detects all installed JetBrains IDEs via Toolbox

## Supported IDEs

All JetBrains IDEs installed through Toolbox are supported, including:

- IntelliJ IDEA (Ultimate & Community)
- PyCharm (Professional & Community)
- WebStorm
- PhpStorm
- RubyMine
- CLion
- GoLand
- DataGrip
- Rider
- Android Studio
- RustRover
- Aqua
- DataSpell

## Requirements

- GNOME Shell 46 or later
- **JetBrains Toolbox** installed and configured
- At least one JetBrains IDE installed via Toolbox
- Node.js and npm (for building from source)

## Installation

### Installation from GitHub repository

The latest development version.

You may need to install `git` and `node`.

Navigate to the directory you want to download the source code and execute the following commands in the terminal:

#### GNOME 46+

```bash
git clone https://github.com/branrgx/jetbrains-search-provider.git
cd jetbrains-search-provider
npm install && npm run setup
```

### Enabling the extension

After installation you need to enable the extension:

1. First restart GNOME Shell:
    - On **X11**: Press `Alt` + `F2`, type `r`, press `Enter`
    - On **Wayland**: Log out and log back in
2. Open the **Extensions** application (or GNOME Tweaks)
3. Find **JetBrains Toolbox Search Provider** and enable it

## Usage

1. Press `Super` (Windows key) to open Activities
2. Start typing the name of your project
3. Your JetBrains projects will appear with format: `IDE: project-name`
4. Press `Enter` to open the project in the corresponding IDE

### Example

Searching for "jetbrains-search" will show:
- **WebStorm: jetbrains-search-provider**
- Description: `/home/user/path/jetbrains-search-provider`
- Icon: WebStorm logo

## Configuration

Access preferences from GNOME Extensions application:

### Available Settings

- **Override Results Order** (default: off)
    - Place JetBrains projects directly underneath applications in search results
    - Requires disabling and re-enabling the extension to take effect

- **Show IDE Name** (default: off)
    - Display format: `PhpStorm: my-project`
    - When disabled: `my-project`

- **Maximum Projects per IDE** (default: 20, range: 5-50)
    - Limits the number of recent projects shown for each IDE
    - Projects are sorted by last opened date

## How It Works

The extension reads project information from two sources:

1. **JetBrains Toolbox state** (`~/.local/share/JetBrains/Toolbox/state.json`)
    - List of installed IDEs
    - Launch commands for each IDE
    - Version information

2. **Recent projects** from each IDE (`~/.config/JetBrains/*/options/recentProjects.xml`)
    - Project paths
    - Last opened timestamps
    - Project metadata

## Troubleshooting

### No projects appear

1. Verify JetBrains Toolbox is installed:
   ```bash
   ls ~/.local/share/JetBrains/Toolbox/state.json
   ```

2. Check that IDEs are installed:
   ```bash
   cat ~/.local/share/JetBrains/Toolbox/state.json
   ```

3. Verify recent projects files exist:
   ```bash
   ls ~/.config/JetBrains/*/options/recentProjects.xml
   ```

### Extension won't enable

1. Compile the schema:
   ```bash
   cd ~/.local/share/gnome-shell/extensions/jetbrains-search-provider@branrgx.github.io/schemas
   glib-compile-schemas .
   ```

2. Check GNOME Shell logs:
   ```bash
   journalctl -f -o cat /usr/bin/gnome-shell | grep -i jetbrains
   ```

### Projects don't open

1. Test the launch command manually:
   ```bash
   cat ~/.local/share/JetBrains/Toolbox/state.json | grep launchCommand
   ~/.local/share/JetBrains/Toolbox/apps/phpstorm/bin/phpstorm ~/your/project
   ```

2. Ensure projects exist at the specified paths

### Icons don't show correctly

The extension searches for `.desktop` files in `~/.local/share/applications/` that match the pattern `jetbrains-IDENAME-*.desktop`. Toolbox should create these automatically.

## Development

### Building

```bash
npm run build        # Compile TypeScript
npm run watch        # Watch mode for development
```

### Linting

```bash
npm run lint         # Check for linting errors
npm run lint:fix     # Fix linting errors automatically
```

### Formatting

```bash
npm run format       # Check formatting
npm run format:fix   # Fix formatting
```

### Testing

```bash
npm test             # Run tests
```

### Packaging

```bash
npm run pack         # Create distribution zip file
```

## Project Structure

```
jetbrains-search-provider/
├── src/
│   ├── extension.ts      # Main extension class
│   ├── provider.ts       # Search provider logic
│   ├── prefs.ts         # Preferences UI
│   └── util.ts          # Utility functions
├── schemas/
│   └── org.gnome.shell.extensions.jetbrains-search-provider.gschema.xml
├── metadata.json         # Extension metadata
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure your code:
- Passes all linting checks (`npm run lint`)
- Follows the existing code style
- Includes appropriate documentation

## Credits

This extension is based on [VSCode Search Provider](https://github.com/MrMarble/vscode-search-provider) by [MrMarble](https://github.com/MrMarble).


## Support

If you encounter any issues or have suggestions:

- 🐛 [Report a bug](https://github.com/branrgx/jetbrains-search-provider/issues)
- 💡 [Request a feature](https://github.com/branrgx/jetbrains-search-provider/issues)
- ⭐ Star the repository if you find it useful!

## Links

- GitHub: https://github.com/branrgx/jetbrains-search-provider
- Issues: https://github.com/branrgx/jetbrains-search-provider/issues
