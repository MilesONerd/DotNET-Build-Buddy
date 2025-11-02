# DotNET Build Buddy

A powerful VS Code extension that automatically generates and updates .NET project files (.sln, .csproj, .fsproj, .vbproj) and provides intelligent NuGet compatibility checking with smart suggestions.

## ✨ Features

### Core Functionality

- **Automatic Project File Generation**: Creates appropriate project files (.csproj, .fsproj, .vbproj) based on source files in your workspace
- **Solution File Management**: Generates and maintains .sln files that include all discovered projects
- **Real-time Updates**: Monitors file changes and automatically updates project files when source files are added, modified, or deleted
- **Multi-language Support**: Supports C#, F#, and VB.NET projects
- **Smart File Grouping**: Groups files by directory structure, creating separate projects when appropriate
- **Configuration Preservation**: Preserves existing project configurations when updating files

### NuGet Compatibility Checking

- **Real-time Compatibility Checks**: Verifies NuGet package compatibility with your target framework
- **API Integration**: Fetches package information from NuGet.org API for accurate compatibility data
- **Smart Suggestions**: Automatically suggests correct package versions and alternative packages
- **Transitive Dependency Checking**: Verifies compatibility of indirect dependencies (dependencies of dependencies)
- **Framework Upgrade Suggestions**: Recommends framework upgrades when all packages support newer versions
- **Inline Diagnostics**: Visual warnings and errors directly in project files with detailed tooltips

### Intelligent Alerts

- **Version Suggestions**: Suggests the correct version when you're using an incompatible one
- **Alternative Packages**: Recommends modern alternatives for deprecated or incompatible packages
- **Inline Messages**: Sublines problematic PackageReference entries with explanatory tooltips
- **Framework Migration**: Analyzes your packages and suggests framework upgrades when beneficial

## 🚀 Commands

- `DotNET Build Buddy: Generate Solution File` - Manually generate a solution file for all projects in the workspace
- `DotNET Build Buddy: Update Project Files` - Manually update all project files based on current source files
- `DotNET Build Buddy: Refresh All .NET Files` - Update both project files and solution file

## ⚙️ Configuration

The extension can be configured through VS Code settings:

### Basic Settings

- `dotnetBuildBuddy.autoUpdate`: Enable/disable automatic updates when files change (default: `true`)
- `dotnetBuildBuddy.watchPatterns`: File patterns to watch for changes (default: `["**/*.cs", "**/*.fs", "**/*.vb"]`)
- `dotnetBuildBuddy.excludePatterns`: Patterns to exclude from watching (default: `["**/bin/**", "**/obj/**", "**/node_modules/**"]`)

### NuGet Compatibility Settings

- `dotnetBuildBuddy.nugetCheckEnabled`: Enable NuGet package compatibility checking (default: `true`)
- `dotnetBuildBuddy.nugetApiEnabled`: Enable real-time NuGet API lookups for package information (default: `true`)
- `dotnetBuildBuddy.nugetCacheEnabled`: Enable caching of NuGet compatibility checks (default: `true`)
- `dotnetBuildBuddy.nugetCacheExpiry`: Cache expiry time in seconds (default: `3600` = 1 hour)
- `dotnetBuildBuddy.nugetIgnoredPackages`: List of NuGet package names or patterns to ignore during compatibility checks (default: `[]`)
- `dotnetBuildBuddy.nugetApiTimeout`: NuGet API request timeout in milliseconds (default: `5000`)

### Example Configuration

```json
{
  "dotnetBuildBuddy.autoUpdate": true,
  "dotnetBuildBuddy.watchPatterns": ["**/*.cs", "**/*.fs", "**/*.vb"],
  "dotnetBuildBuddy.excludePatterns": ["**/bin/**", "**/obj/**"],
  "dotnetBuildBuddy.nugetCheckEnabled": true,
  "dotnetBuildBuddy.nugetApiEnabled": true,
  "dotnetBuildBuddy.nugetCacheEnabled": true,
  "dotnetBuildBuddy.nugetIgnoredPackages": ["MyCustomPackage", "Internal.*"]
}
```

## 📖 How It Works

1. **Activation**: The extension activates when it detects .NET-related files in your workspace
2. **Monitoring**: It monitors changes to source files (.cs, .fs, .vb) and project files
3. **Auto-Update**: When changes are detected, it automatically updates the corresponding project files
4. **Organization**: Project files are organized based on the directory structure of your source files
5. **Solution Generation**: Solution files are generated to include all discovered projects
6. **Compatibility Checking**: NuGet packages are checked for compatibility and suggestions are provided

## 🎯 Use Cases

### Project Setup from Scratch
1. Create source files (.cs, .fs, .vb) in your workspace
2. The extension automatically creates appropriate project files
3. Solution file is generated with all projects

### Updating Existing Projects
1. Add new source files to your project
2. Extension automatically updates project files to include new files
3. Solution file is updated automatically

### NuGet Compatibility
1. Add or update NuGet packages in your project
2. Extension checks compatibility with your target framework
3. Suggestions appear inline with version and alternative recommendations
4. Framework upgrade suggestions appear when appropriate

## 🔍 Examples

### Inline Diagnostics

When you open a `.csproj` file with incompatible packages, you'll see:

- **Red squiggly lines** on incompatible packages (errors)
- **Yellow squiggly lines** on version mismatches (warnings)
- **Hover tooltips** with detailed information and suggestions

### Framework Upgrade Suggestion

```
💡 Project.csproj: Consider upgrading from netcoreapp3.1 to net8.0. 
   All packages support net8.0
```

### Package Suggestions

```
❌ EntityFramework: Package is not compatible with net8.0
  🔄 Alternative: Microsoft.EntityFrameworkCore (8.0.0) 
  📝 Recommendation: Modern Entity Framework Core for .NET Core/.NET 5+
```

## 📋 Requirements

- VS Code 1.74.0 or higher
- .NET ecosystem files in your workspace

## 🔧 Troubleshooting

If the extension doesn't work as expected:

1. Check the VS Code Developer Console (Help > Toggle Developer Tools)
2. Look for "DotNET Build Buddy" log messages
3. Verify the extension is activated (check Extensions panel)
4. Ensure workspace contains .NET source files for activation
5. Check configuration settings for any disabled features

## 📚 Documentation

Comprehensive documentation is available in the [docs/](./docs/) folder:

### Getting Started
- **[Installation Guide](./docs/INSTALLATION.md)** - How to install and set up the extension
- **[User Guide](./docs/USER_GUIDE.md)** - Complete guide for end users

### Configuration & Features
- **[Configuration Reference](./docs/CONFIGURATION.md)** - All settings explained in detail
- **[NuGet Compatibility Guide](./docs/NUGET_COMPATIBILITY.md)** - Understanding and using compatibility checking

### Reference
- **[API Reference](./docs/API_REFERENCE.md)** - Technical reference for developers
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

See [Documentation Index](./docs/README.md) for complete documentation overview.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

Licensed under the Apache License 2.0. See LICENSE file for details.
