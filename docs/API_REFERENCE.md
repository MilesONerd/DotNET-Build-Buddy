# API Reference

Technical reference for DotNET Build Buddy extension components.

## Classes

### DotNetProjectManager

Main class for managing .NET project files.

#### Methods

##### `generateSolutionFile(): Promise<void>`

Generates a solution file (`Solution.sln`) containing all discovered projects.

**Returns**: Promise that resolves when solution file is generated

**Throws**: Error if workspace folder not found or generation fails

##### `updateAllProjectFiles(): Promise<void>`

Updates all project files based on current source files in the workspace.

**Process:**
1. Finds all source files (.cs, .fs, .vb)
2. Groups files by directory and type
3. Creates/updates appropriate project files
4. Checks NuGet compatibility
5. Updates inline diagnostics

**Returns**: Promise that resolves when all projects are updated

##### `refreshAllFiles(): Promise<void>`

Updates both project files and solution file.

**Returns**: Promise that resolves when both operations complete

### NuGetCompatibilityChecker

Class for checking NuGet package compatibility.

#### Methods

##### `checkCompatibility(packageName: string, packageVersion: string | undefined, targetFramework: string): Promise<CompatibilityIssue | null>`

Checks if a package is compatible with a target framework.

**Parameters:**
- `packageName`: Name of the NuGet package
- `packageVersion`: Version of the package (optional)
- `targetFramework`: Target framework (e.g., "net8.0")

**Returns**: Promise resolving to compatibility issue or null if compatible

##### `checkProjectCompatibility(packageReferences: Array<{ Include: string; Version?: string }>, targetFramework: string): Promise<CompatibilityIssue[]>`

Checks compatibility for all packages in a project.

**Parameters:**
- `packageReferences`: Array of package references
- `targetFramework`: Target framework

**Returns**: Promise resolving to array of compatibility issues

##### `checkProjectCompatibilityEnhanced(...): Promise<EnhancedCompatibilityIssue[]>`

Enhanced compatibility check with suggestions.

**Returns**: Promise resolving to enhanced issues with suggestions

##### `suggestFrameworkUpgrade(targetFramework: string, packageReferences: Array<{ Include: string; Version?: string }>): Promise<{ suggestedFramework: string; reason: string; packagesSupporting: string[] } | null>`

Suggests framework upgrade if appropriate.

**Returns**: Promise resolving to upgrade suggestion or null

##### `clearCache(): void`

Clears the compatibility check cache.

### NuGetDiagnosticProvider

Class for providing inline diagnostics in VS Code.

#### Methods

##### `updateDiagnostics(projectFile: string, issues: EnhancedCompatibilityIssue[]): Promise<void>`

Updates inline diagnostics for a project file.

**Parameters:**
- `projectFile`: Path to the project file
- `issues`: Array of enhanced compatibility issues

**Returns**: Promise that resolves when diagnostics are updated

##### `clearDiagnostics(): void`

Clears all diagnostics.

##### `dispose(): void`

Disposes the diagnostic collection.

### FileWatcher

Class for monitoring file system changes.

#### Methods

##### `dispose(): void`

Disposes all file watchers and timers.

## Interfaces

### CompatibilityIssue

```typescript
interface CompatibilityIssue {
    packageName: string;
    packageVersion?: string;
    targetFramework: string;
    issueType: 'incompatible' | 'version_mismatch' | 'deprecated';
    message: string;
    recommendation?: string;
}
```

### EnhancedCompatibilityIssue

```typescript
interface EnhancedCompatibilityIssue extends CompatibilityIssue {
    suggestedVersion?: string;
    alternativePackage?: {
        name: string;
        version?: string;
        reason?: string;
    };
    transitiveIssues?: Array<{
        packageName: string;
        version?: string;
        message: string;
    }>;
}
```

### ProjectInfo

```typescript
interface ProjectInfo {
    targetFramework?: string;
    targetFrameworks?: string[];
    nullable?: string;
    rootNamespace?: string;
    sdk?: string;
    customProperties?: Record<string, string>;
    packageReferences?: Array<{ Include: string; Version?: string }>;
}
```

### DotNetVersionInfo

```typescript
interface DotNetVersionInfo {
    type: 'net' | 'netcoreapp' | 'netframework' | 'netstandard';
    version?: string;
    fullTargetFramework: string;
}
```

## VS Code Commands

### `dotnetBuildBuddy.generateSolution`

Manually generate a solution file.

**Usage**: Command Palette → "DotNET Build Buddy: Generate Solution File"

### `dotnetBuildBuddy.updateProjects`

Manually update all project files.

**Usage**: Command Palette → "DotNET Build Buddy: Update Project Files"

### `dotnetBuildBuddy.refreshAll`

Refresh both projects and solution.

**Usage**: Command Palette → "DotNET Build Buddy: Refresh All .NET Files"

## Events

### File System Watchers

The extension monitors:
- Source file changes (`.cs`, `.fs`, `.vb`)
- Project file changes (`.csproj`, `.fsproj`, `.vbproj`)
- Solution file changes (`.sln`)

### Activation Events

Extension activates when workspace contains:
- `**/*.cs` files
- `**/*.fs` files
- `**/*.vb` files
- `**/*.csproj` files
- `**/*.fsproj` files
- `**/*.vbproj` files
- `**/*.sln` files

## Configuration API

All settings are accessed via VS Code's configuration API:

```typescript
const config = vscode.workspace.getConfiguration('dotnetBuildBuddy');
const autoUpdate = config.get<boolean>('autoUpdate', true);
```

## Diagnostic API

Diagnostics are provided via VS Code's DiagnosticCollection:

```typescript
const collection = vscode.languages.createDiagnosticCollection('dotnetBuildBuddy');
collection.set(document.uri, diagnostics);
```

## NuGet API Integration

The extension integrates with NuGet.org API:

- **Base URL**: `https://api.nuget.org/v3-flatcontainer/`
- **Package Index**: `/{packageId}/index.json`
- **Package Metadata**: `/{packageId}/{version}/{packageId}.nuspec`

## Extension Points

### Commands

Registered in `package.json`:
- `dotnetBuildBuddy.generateSolution`
- `dotnetBuildBuddy.updateProjects`
- `dotnetBuildBuddy.refreshAll`

### Configuration

Defined in `package.json`:
- All `dotnetBuildBuddy.*` settings

### Activation Events

Defined in `package.json`:
- File pattern-based activation

## Error Handling

All methods include error handling:
- Network errors: Falls back to local rules
- Parse errors: Logged and reported to user
- File system errors: Logged with warnings
- API errors: Gracefully handled with fallback

## Performance Considerations

### Caching

- Compatibility checks are cached
- Cache expiry is configurable
- Cache key: `{package}|{version}|{framework}`

### Debouncing

- File changes are debounced (1 second default)
- Prevents excessive updates
- Improves performance

### Async Operations

- All operations are asynchronous
- Non-blocking UI updates
- Concurrent processing where possible

## Logging

Extension logs to VS Code console:
- Activation messages
- File change detections
- Compatibility check results
- Errors and warnings

Access via: View → Output → Select "DotNET Build Buddy"

