# Installation Guide

## Prerequisites

- Visual Studio Code 1.74.0 or higher
- A workspace with .NET source files (.cs, .fs, .vb) or project files (.csproj, .fsproj, .vbproj, .sln)

## Installation Methods

### Method 1: From VS Code Marketplace (Recommended)

1. Open Visual Studio Code
2. Click on the Extensions icon in the Activity Bar (or press `Ctrl+Shift+X`)
3. Search for "DotNET Build Buddy"
4. Click the Install button
5. Reload VS Code if prompted

### Method 2: Install from VSIX File

1. Download the `.vsix` file for the extension
2. Open VS Code
3. Go to Extensions (`Ctrl+Shift+X`)
4. Click the `...` menu at the top of the Extensions panel
5. Select "Install from VSIX..."
6. Navigate to and select the downloaded `.vsix` file
7. Reload VS Code

### Method 3: From Source (Development)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd DotNET-Build-Buddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Press `F5` in VS Code to open a new Extension Development Host window
5. The extension will be loaded in the development host

## Verification

After installation, verify the extension is working:

1. Open a workspace with .NET files
2. The extension should activate automatically
3. You should see a notification: "DotNET Build Buddy is ready to manage your .NET projects!"
4. Check the Output panel for extension logs (View > Output > Select "DotNET Build Buddy")

## Post-Installation

### First Run Configuration

The extension works out of the box with default settings, but you can customize:

1. Open VS Code Settings (`Ctrl+,`)
2. Search for "dotnetBuildBuddy"
3. Configure settings as needed (see [Configuration Reference](./CONFIGURATION.md))

### Verify Activation

The extension activates when it detects:
- Files with extensions: `.cs`, `.fs`, `.vb`
- Project files: `.csproj`, `.fsproj`, `.vbproj`
- Solution files: `.sln`

## Uninstallation

1. Open Extensions (`Ctrl+Shift+X`)
2. Find "DotNET Build Buddy"
3. Click the gear icon
4. Select "Uninstall"
5. Reload VS Code

## Troubleshooting Installation Issues

### Extension Not Activating

- Ensure you have .NET files in your workspace
- Check the Output panel for error messages
- Verify VS Code version is 1.74.0 or higher

### Compilation Errors After Update

1. Close all VS Code windows
2. Clear the extension cache:
   ```bash
   # Windows
   rm -r %USERPROFILE%\.vscode\extensions\dotnet-build-buddy-*
   
   # Linux/Mac
   rm -r ~/.vscode/extensions/dotnet-build-buddy-*
   ```
3. Reinstall the extension

### Permission Issues

If you encounter permission errors:
- Run VS Code as administrator (Windows)
- Check file permissions in your workspace
- Ensure you have write access to the workspace directory


