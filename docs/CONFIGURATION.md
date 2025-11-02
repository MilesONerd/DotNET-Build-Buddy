# Configuration Reference

Complete reference for all DotNET Build Buddy configuration options.

## Settings Overview

All settings are prefixed with `dotnetBuildBuddy.` and can be configured in VS Code settings (`.vscode/settings.json` or User Settings).

## Basic Settings

### `dotnetBuildBuddy.autoUpdate`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Automatically update project files when changes are detected

```json
{
  "dotnetBuildBuddy.autoUpdate": true
}
```

### `dotnetBuildBuddy.watchPatterns`

- **Type**: `string[]`
- **Default**: `["**/*.cs", "**/*.fs", "**/*.vb"]`
- **Description**: File patterns to watch for changes

```json
{
  "dotnetBuildBuddy.watchPatterns": [
    "**/*.cs",
    "**/*.fs",
    "**/*.vb",
    "**/*.csx"
  ]
}
```

### `dotnetBuildBuddy.excludePatterns`

- **Type**: `string[]`
- **Default**: `["**/bin/**", "**/obj/**", "**/node_modules/**"]`
- **Description**: Patterns to exclude from watching and processing

```json
{
  "dotnetBuildBuddy.excludePatterns": [
    "**/bin/**",
    "**/obj/**",
    "**/node_modules/**",
    "**/TestResults/**"
  ]
}
```

## NuGet Compatibility Settings

### `dotnetBuildBuddy.nugetCheckEnabled`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable NuGet package compatibility checking

```json
{
  "dotnetBuildBuddy.nugetCheckEnabled": true
}
```

### `dotnetBuildBuddy.nugetApiEnabled`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable real-time NuGet API lookups for package information

When disabled, only local compatibility rules are used.

```json
{
  "dotnetBuildBuddy.nugetApiEnabled": true
}
```

### `dotnetBuildBuddy.nugetCacheEnabled`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable caching of NuGet compatibility checks

Caching improves performance by avoiding repeated API calls for the same packages.

```json
{
  "dotnetBuildBuddy.nugetCacheEnabled": true
}
```

### `dotnetBuildBuddy.nugetCacheExpiry`

- **Type**: `number`
- **Default**: `3600`
- **Description**: Cache expiry time in seconds (default: 1 hour)

```json
{
  "dotnetBuildBuddy.nugetCacheExpiry": 3600
}
```

### `dotnetBuildBuddy.nugetIgnoredPackages`

- **Type**: `string[]`
- **Default**: `[]`
- **Description**: List of NuGet package names or patterns to ignore during compatibility checks

Supports exact matches and wildcard patterns:
- `"MyCustomPackage"` - Exact match
- `"Internal.*"` - Pattern match (starts with "Internal.")
- `"*.Internal"` - Pattern match (ends with ".Internal")

```json
{
  "dotnetBuildBuddy.nugetIgnoredPackages": [
    "MyCustomPackage",
    "Internal.*",
    "Company.Experimental.*"
  ]
}
```

### `dotnetBuildBuddy.nugetApiTimeout`

- **Type**: `number`
- **Default**: `5000`
- **Description**: NuGet API request timeout in milliseconds

Increase for slower networks, decrease for faster response times.

```json
{
  "dotnetBuildBuddy.nugetApiTimeout": 5000
}
```

## Configuration Examples

### Minimal Configuration

Only essential settings:

```json
{
  "dotnetBuildBuddy.autoUpdate": true
}
```

### Full Configuration

All settings with custom values:

```json
{
  "dotnetBuildBuddy.autoUpdate": true,
  "dotnetBuildBuddy.watchPatterns": [
    "**/*.cs",
    "**/*.fs",
    "**/*.vb"
  ],
  "dotnetBuildBuddy.excludePatterns": [
    "**/bin/**",
    "**/obj/**",
    "**/node_modules/**",
    "**/TestResults/**"
  ],
  "dotnetBuildBuddy.nugetCheckEnabled": true,
  "dotnetBuildBuddy.nugetApiEnabled": true,
  "dotnetBuildBuddy.nugetCacheEnabled": true,
  "dotnetBuildBuddy.nugetCacheExpiry": 7200,
  "dotnetBuildBuddy.nugetIgnoredPackages": [],
  "dotnetBuildBuddy.nugetApiTimeout": 10000
}
```

### Offline Mode

Disable API calls, use only local rules:

```json
{
  "dotnetBuildBuddy.nugetCheckEnabled": true,
  "dotnetBuildBuddy.nugetApiEnabled": false,
  "dotnetBuildBuddy.nugetCacheEnabled": false
}
```

### Performance Optimized

Maximize caching and increase timeouts:

```json
{
  "dotnetBuildBuddy.nugetCacheEnabled": true,
  "dotnetBuildBuddy.nugetCacheExpiry": 86400,
  "dotnetBuildBuddy.nugetApiTimeout": 3000
}
```

### Development Environment

Ignore internal packages and disable auto-updates:

```json
{
  "dotnetBuildBuddy.autoUpdate": false,
  "dotnetBuildBuddy.nugetIgnoredPackages": [
    "Internal.*",
    "Company.Test.*"
  ]
}
```

## Workspace vs User Settings

### User Settings

Settings applied globally to all workspaces:
- Location: VS Code User Settings
- Access: `File > Preferences > Settings`

### Workspace Settings

Settings specific to the current workspace:
- Location: `.vscode/settings.json` in your workspace root
- Overrides user settings for that workspace

Example workspace settings file:

```json
{
  "dotnetBuildBuddy.excludePatterns": [
    "**/bin/**",
    "**/obj/**",
    "**/SpecificProjectFolder/**"
  ],
  "dotnetBuildBuddy.nugetIgnoredPackages": [
    "ProjectSpecificPackage"
  ]
}
```

## Environment-Specific Configuration

### Development

```json
{
  "dotnetBuildBuddy.autoUpdate": true,
  "dotnetBuildBuddy.nugetApiEnabled": true,
  "dotnetBuildBuddy.nugetCacheExpiry": 1800
}
```

### CI/CD Pipeline

```json
{
  "dotnetBuildBuddy.autoUpdate": false,
  "dotnetBuildBuddy.nugetApiEnabled": true,
  "dotnetBuildBuddy.nugetCacheEnabled": false
}
```

### Offline/Network Restricted

```json
{
  "dotnetBuildBuddy.nugetApiEnabled": false,
  "dotnetBuildBuddy.nugetCacheEnabled": true,
  "dotnetBuildBuddy.nugetCacheExpiry": 86400
}
```

## Troubleshooting Configuration

### Settings Not Applied

1. Check if settings are in the correct scope (User vs Workspace)
2. Reload VS Code window (`Ctrl+R` or `Cmd+R`)
3. Verify JSON syntax is valid
4. Check for typos in setting names

### Performance Issues

- Enable caching: `"dotnetBuildBuddy.nugetCacheEnabled": true`
- Increase cache expiry: `"dotnetBuildBuddy.nugetCacheExpiry": 86400`
- Disable API if not needed: `"dotnetBuildBuddy.nugetApiEnabled": false`

### Too Many Notifications

- Disable auto-update: `"dotnetBuildBuddy.autoUpdate": false`
- Ignore specific packages: Add to `dotnetBuildBuddy.nugetIgnoredPackages`
- Disable compatibility checking: `"dotnetBuildBuddy.nugetCheckEnabled": false`

