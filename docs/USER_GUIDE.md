# User Guide

## Getting Started

DotNET Build Buddy automatically manages your .NET project files. This guide will help you get the most out of the extension.

## Basic Usage

### Automatic Project Generation

1. **Create Source Files**: Start by creating your .NET source files (.cs, .fs, .vb)
2. **Auto-Detection**: The extension automatically detects files and creates project files
3. **Solution Generation**: Run the command "Generate Solution File" to create a solution

### Manual Commands

Access commands via Command Palette (`Ctrl+Shift+P`):

- **Generate Solution File**: Creates/updates `Solution.sln` with all projects
- **Update Project Files**: Updates all project files based on current source files
- **Refresh All .NET Files**: Updates both projects and solution

## Working with Projects

### Adding New Files

1. Create a new `.cs`, `.fs`, or `.vb` file in your workspace
2. The extension automatically:
   - Detects the new file
   - Updates the appropriate project file
   - Includes the file in the project

### Organizing Files

The extension groups files by:
- **Directory Structure**: Files in the same directory are grouped together
- **File Type**: C#, F#, and VB.NET files are separated into different projects
- **Language**: Each language gets its own project file

### Project File Structure

Project files are created in the directory containing the source files:
- `src/MyProject.cs` → `src/MyProject.csproj`
- `src/Calculator.fs` → `src/Calculator.fsproj`
- `src/Helper.vb` → `src/Helper.vbproj`

## NuGet Package Management

### Compatibility Checking

The extension automatically checks NuGet package compatibility:

1. **Automatic Checks**: When you open a project file, compatibility is checked
2. **Inline Diagnostics**: Problems appear as underlines in the editor
3. **Tooltips**: Hover over problematic packages for detailed information

### Understanding Diagnostics

- **Red Underline**: Incompatible package (error)
- **Yellow Underline**: Version mismatch or deprecated (warning)
- **Tooltip**: Hover to see details and suggestions

### Using Suggestions

When you see suggestions:

1. **Version Suggestions**: Update your package version to the suggested one
2. **Alternative Packages**: Consider switching to the suggested alternative
3. **Framework Upgrades**: Evaluate upgrading your target framework

### Example: Fixing Incompatibility

**Before:**
```xml
<PackageReference Include="EntityFramework" Version="6.4.4" />
<!-- Red underline appears -->
```

**After:**
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
<!-- Compatibility check passes -->
```

## Configuration

### Basic Configuration

Open Settings (`Ctrl+,`) and search for "dotnetBuildBuddy":

- **Auto Update**: Enable/disable automatic file updates
- **Watch Patterns**: Customize which files to monitor
- **Exclude Patterns**: Specify directories to ignore

### NuGet Configuration

- **Enable Checks**: Turn NuGet compatibility checking on/off
- **API Integration**: Enable/disable real-time package lookups
- **Caching**: Control cache behavior for performance
- **Ignore Packages**: Skip compatibility checks for specific packages

See [Configuration Reference](./CONFIGURATION.md) for details.

## Advanced Features

### Framework Detection

The extension automatically:
- Detects your project's target framework
- Suggests compatible package versions
- Recommends framework upgrades when appropriate

### Dependency Analysis

The extension checks:
- Direct package dependencies
- Transitive dependencies (dependencies of dependencies)
- Framework compatibility at all levels

### Smart Suggestions

The extension provides:
- Version corrections for incompatible packages
- Alternative package recommendations
- Framework upgrade suggestions based on package support

## Best Practices

### 1. Organize Your Files

- Group related files in the same directory
- Use consistent naming conventions
- Keep project files in source directories

### 2. Keep Packages Updated

- Review compatibility warnings regularly
- Follow version suggestions when safe
- Consider framework upgrades for better compatibility

### 3. Use Configuration Wisely

- Ignore packages only when necessary
- Keep API integration enabled for best results
- Use caching to improve performance

### 4. Review Suggestions

- Always review upgrade suggestions before applying
- Test alternative packages before switching
- Verify transitive dependency issues

## Common Workflows

### Starting a New Project

1. Create your source files
2. Let the extension generate project files automatically
3. Add NuGet packages as needed
4. Review compatibility suggestions
5. Generate solution file when ready

### Updating Existing Projects

1. Add new source files
2. Extension auto-updates project files
3. Check for compatibility issues
4. Address any warnings or errors

### Migrating Frameworks

1. Review framework upgrade suggestions
2. Check package compatibility
3. Update target framework in project file
4. Verify all packages are compatible
5. Test your application

## Troubleshooting

For detailed troubleshooting, see [Troubleshooting Guide](./TROUBLESHOOTING.md).

### Quick Fixes

- **Extension not working**: Restart VS Code
- **Files not detected**: Check exclude patterns
- **Compatibility errors**: Review suggestions and update packages
- **Performance issues**: Enable caching and adjust timeout settings


