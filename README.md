# DotNET Build Buddy

A VS Code extension that automatically generates and updates .sln, .csproj, .fsproj, and .vbproj files when .NET ecosystem changes are detected.

## Features

- **Automatic Project File Generation**: Creates appropriate project files (.csproj, .fsproj, .vbproj) based on source files in your workspace
- **Solution File Management**: Generates and maintains .sln files that include all discovered projects
- **Real-time Updates**: Monitors file changes and automatically updates project files when source files are added, modified, or deleted
- **Multi-language Support**: Supports C#, F#, and VB.NET projects
- **Configurable Watching**: Customize which file patterns to watch and which to exclude

## Commands

- `DotNET Build Buddy: Generate Solution File` - Manually generate a solution file for all projects in the workspace
- `DotNET Build Buddy: Update Project Files` - Manually update all project files based on current source files
- `DotNET Build Buddy: Refresh All .NET Files` - Update both project files and solution file

## Configuration

The extension can be configured through VS Code settings:

- `dotnetBuildBuddy.autoUpdate`: Enable/disable automatic updates when files change (default: true)
- `dotnetBuildBuddy.watchPatterns`: File patterns to watch for changes (default: `["**/*.cs", "**/*.fs", "**/*.vb"]`)
- `dotnetBuildBuddy.excludePatterns`: Patterns to exclude from watching (default: `["**/bin/**", "**/obj/**", "**/node_modules/**"]`)

## How It Works

1. The extension activates when it detects .NET-related files in your workspace
2. It monitors changes to source files (.cs, .fs, .vb) and project files
3. When changes are detected, it automatically updates the corresponding project files
4. Project files are organized based on the directory structure of your source files
5. Solution files are generated to include all discovered projects

## Requirements

- VS Code 1.74.0 or higher
- .NET ecosystem files in your workspace

## License

Licensed under the Apache License 2.0. See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
