# NuGet Compatibility Guide

## Overview

DotNET Build Buddy provides comprehensive NuGet package compatibility checking with intelligent suggestions and warnings.

## How It Works

### Compatibility Checking Process

1. **Package Detection**: Extension scans project files for `PackageReference` entries
2. **Framework Analysis**: Determines target framework from project file
3. **Compatibility Verification**: Checks if package supports the target framework
4. **Suggestions Generation**: Provides version and alternative recommendations
5. **Transitive Analysis**: Checks dependencies of dependencies
6. **Visual Feedback**: Displays inline diagnostics with tooltips

## Types of Issues

### Incompatible Packages (Errors)

Packages that don't support your target framework at all.

**Example:**
```
❌ EntityFramework: Package is not compatible with net8.0
  🔄 Alternative: Microsoft.EntityFrameworkCore (8.0.0) - Modern Entity Framework Core
  📝 Recommendation: This package requires one of: net40, net45, ..., net48
```

**What to do:**
- Use the suggested alternative package
- Update your target framework if appropriate
- Consider package migration path

### Version Mismatches (Warnings)

Packages where the version doesn't match the framework requirements.

**Example:**
```
⚠️ Microsoft.AspNetCore.Mvc version 2.0.0: Package version is too old for net8.0
  💡 Suggested version: 8.0.0
  📝 Recommendation: Upgrade to at least version 8.0.0
```

**What to do:**
- Update to the suggested version
- Check release notes for breaking changes
- Test your application after updating

### Deprecated Versions (Warnings)

Packages using deprecated or unsupported versions.

**Example:**
```
⚠️ SomePackage version 1.0.0: Package version is deprecated
  💡 Suggested version: 2.0.0
  📝 Recommendation: Consider upgrading to a newer version
```

**What to do:**
- Upgrade to a supported version
- Review deprecation notices
- Plan migration timeline

## Smart Suggestions

### Version Suggestions

The extension automatically suggests the correct version when:
- Current version is too old for the framework
- Current version is too new for the framework
- Version doesn't exist

**How it works:**
1. Fetches available versions from NuGet API
2. Filters versions compatible with your framework
3. Suggests the latest compatible version

### Alternative Packages

The extension suggests modern alternatives for:
- Legacy packages incompatible with modern frameworks
- Deprecated packages
- Packages with better alternatives available

**Known Alternatives:**
- `EntityFramework` → `Microsoft.EntityFrameworkCore`
- `Microsoft.AspNet.Mvc` → `Microsoft.AspNetCore.Mvc`
- `Newtonsoft.Json` → `System.Text.Json`
- `System.Web.Mvc` → `Microsoft.AspNetCore.Mvc`

### Framework Upgrade Suggestions

The extension analyzes your packages and suggests framework upgrades when:
- All packages support a newer framework
- 80% or more packages support a newer framework

**Example:**
```
💡 Consider upgrading from netcoreapp3.1 to net8.0
   All packages support net8.0
```

## Transitive Dependencies

### What Are Transitive Dependencies?

Dependencies that your packages depend on. For example:
- Your project uses `PackageA`
- `PackageA` depends on `PackageB`
- `PackageB` is a transitive dependency

### Transitive Dependency Checking

The extension checks transitive dependencies to catch hidden compatibility issues.

**Example:**
```
⚠️ PackageA: Compatible
  ⚠️ Transitive dependency issues:
    • PackageB 2.0.0: Package is not compatible with net8.0
```

**What this means:**
- Even though `PackageA` is compatible
- One of its dependencies (`PackageB`) is not
- This may cause runtime errors

**What to do:**
- Update `PackageA` to a version with compatible dependencies
- Consider replacing `PackageA` if no compatible version exists
- Check if there's a way to exclude the problematic transitive dependency

## Understanding Diagnostics

### Inline Markers

When you open a `.csproj` file:

- **Red squiggly line**: Incompatible package (error)
- **Yellow squiggly line**: Version mismatch or deprecated (warning)

### Tooltips

Hover over a problematic package to see:
- Issue description
- Suggested version (if available)
- Alternative package (if available)
- Recommendation

### Diagnostic Panel

View all issues in the Problems panel:
1. Open Problems panel (`Ctrl+Shift+M`)
2. Filter by "DotNET Build Buddy"
3. See all compatibility issues at once

## Best Practices

### 1. Review Suggestions Promptly

- Don't ignore warnings indefinitely
- Address compatibility issues before they cause problems
- Keep packages updated regularly

### 2. Test After Updates

- Always test after updating package versions
- Check for breaking changes in release notes
- Update incrementally when possible

### 3. Use Alternative Packages Wisely

- Research alternatives before switching
- Check migration guides
- Consider project timeline and resources

### 4. Framework Upgrades

- Review upgrade suggestions carefully
- Check Microsoft migration guides
- Test thoroughly in development first
- Plan upgrade timeline appropriately

### 5. Transitive Dependencies

- Pay attention to transitive dependency warnings
- They may not cause immediate issues
- But can cause runtime errors later

## Common Scenarios

### Scenario 1: Using Old .NET Framework Package on .NET 8

**Problem:**
```
❌ EntityFramework: Package is not compatible with net8.0
```

**Solution:**
- Switch to `Microsoft.EntityFrameworkCore`
- Migrate code to EF Core
- Follow Microsoft migration guide

### Scenario 2: Package Version Too Old

**Problem:**
```
⚠️ Microsoft.AspNetCore.Mvc version 2.0.0: Too old for net8.0
  💡 Suggested version: 8.0.0
```

**Solution:**
- Update to version 8.0.0
- Review breaking changes between versions
- Test application thoroughly

### Scenario 3: All Packages Support Newer Framework

**Problem:**
```
💡 Consider upgrading from netcoreapp3.1 to net8.0
```

**Solution:**
- Evaluate framework upgrade
- Check migration guides
- Test in development environment
- Plan upgrade timeline

### Scenario 4: Transitive Dependency Issue

**Problem:**
```
⚠️ Transitive dependency issues:
  • ProblematicPackage: Incompatible with net8.0
```

**Solution:**
- Update parent package to newer version
- Check if newer version fixes the issue
- Consider alternative if no fix available

## Troubleshooting

### False Positives

If the extension reports an issue but the package works:

1. Check if package is in ignore list
2. Verify target framework is correct
3. Report issue if package metadata is incorrect
4. Consider adding package to ignore list temporarily

### Missing Suggestions

If suggestions don't appear:

1. Check if API is enabled: `dotnetBuildBuddy.nugetApiEnabled`
2. Verify internet connectivity
3. Check API timeout settings
4. Review cache settings

### Performance Issues

If compatibility checking is slow:

1. Enable caching: `dotnetBuildBuddy.nugetCacheEnabled: true`
2. Increase cache expiry time
3. Disable API if not needed (uses local rules only)

## Advanced Topics

### Package Ignore Patterns

Ignore specific packages from checking:

```json
{
  "dotnetBuildBuddy.nugetIgnoredPackages": [
    "MyCustomPackage",
    "Internal.*",
    "*.Internal"
  ]
}
```

### Custom Compatibility Rules

The extension uses built-in rules for common packages. For custom packages:
- Extension checks NuGet API for compatibility
- Falls back to local rules if API unavailable
- Reports unknown packages as potentially compatible

### Caching Strategy

Caching improves performance:
- First check: API call + cache storage
- Subsequent checks: Cached result (if not expired)
- Cache expiry: Configurable (default: 1 hour)

Clear cache by restarting VS Code or disabling/re-enabling the extension.

