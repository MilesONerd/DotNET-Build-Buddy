# Troubleshooting Guide

## Common Issues and Solutions

### Extension Not Activating

**Symptoms:**
- Extension doesn't activate when opening workspace
- No notification appears
- Commands not available

**Solutions:**

1. **Check Workspace Contains .NET Files**
   - Ensure workspace has `.cs`, `.fs`, `.vb` files or project files
   - Extension activates on detection of these files

2. **Verify Extension is Installed**
   - Check Extensions panel (`Ctrl+Shift+X`)
   - Search for "DotNET Build Buddy"
   - Ensure it's enabled

3. **Check VS Code Version**
   - Requires VS Code 1.74.0 or higher
   - Update VS Code if needed

4. **Review Output Panel**
   - Open Output panel (`Ctrl+Shift+U`)
   - Select "DotNET Build Buddy" from dropdown
   - Look for activation messages or errors

5. **Reload Window**
   - Press `Ctrl+R` (or `Cmd+R` on Mac)
   - Or: Command Palette → "Developer: Reload Window"

### Files Not Being Detected

**Symptoms:**
- New files not added to project files
- Project files not updating automatically

**Solutions:**

1. **Check Auto-Update Setting**
   ```json
   {
     "dotnetBuildBuddy.autoUpdate": true
   }
   ```

2. **Verify Watch Patterns**
   - Check `dotnetBuildBuddy.watchPatterns` includes your file types
   - Default: `["**/*.cs", "**/*.fs", "**/*.vb"]`

3. **Check Exclude Patterns**
   - Ensure files aren't in excluded directories
   - Default excludes: `bin/`, `obj/`, `node_modules/`

4. **Manual Update**
   - Use command: "DotNET Build Buddy: Update Project Files"
   - Forces immediate update

5. **File Location**
   - Files should be in workspace root or subdirectories
   - Check workspace folder is correctly opened

### Project Files Not Generated

**Symptoms:**
- No `.csproj`, `.fsproj`, `.vbproj` files created
- Commands complete but no files appear

**Solutions:**

1. **Check File Permissions**
   - Ensure write permissions on workspace directory
   - On Windows, may need to run VS Code as administrator

2. **Verify Source Files Exist**
   - Extension needs source files (`.cs`, `.fs`, `.vb`) to generate projects
   - Check files are not in excluded directories

3. **Check Output for Errors**
   - Review Output panel for error messages
   - Common: Permission errors, path issues

4. **Directory Structure**
   - Project files are created in directories containing source files
   - Check if expected directory structure matches reality

### NuGet Compatibility Not Working

**Symptoms:**
- No compatibility warnings appear
- Inline diagnostics not showing
- Suggestions not appearing

**Solutions:**

1. **Check Compatibility Checking is Enabled**
   ```json
   {
     "dotnetBuildBuddy.nugetCheckEnabled": true
   }
   ```

2. **Verify Packages Exist**
   - Check project file has `PackageReference` entries
   - Verify package names are correct

3. **Check API Integration**
   - If using API: `dotnetBuildBuddy.nugetApiEnabled: true`
   - Verify internet connectivity
   - Check API timeout settings

4. **Review Cache Settings**
   - Clear cache by disabling/enabling extension
   - Or set `dotnetBuildBuddy.nugetCacheEnabled: false` temporarily

5. **Check Ignore List**
   - Packages in `dotnetBuildBuddy.nugetIgnoredPackages` are skipped
   - Remove from list if you want them checked

### Inline Diagnostics Not Appearing

**Symptoms:**
- No squiggly lines under problematic packages
- Tooltips not showing

**Solutions:**

1. **Verify Project File is Open**
   - Diagnostics only appear when project file is open in editor
   - Open `.csproj`, `.fsproj`, or `.vbproj` file

2. **Check Problems Panel**
   - Open Problems panel (`Ctrl+Shift+M`)
   - Filter by "DotNET Build Buddy"
   - Issues may appear here even if not inline

3. **Reload Window**
   - Sometimes diagnostics need refresh
   - Reload VS Code window

4. **Verify Compatibility Issues Exist**
   - Run manual check via command
   - Check Output panel for compatibility results

### Performance Issues

**Symptoms:**
- Slow response to file changes
- Lag when opening project files
- High CPU usage

**Solutions:**

1. **Enable Caching**
   ```json
   {
     "dotnetBuildBuddy.nugetCacheEnabled": true,
     "dotnetBuildBuddy.nugetCacheExpiry": 86400
   }
   ```

2. **Disable API if Not Needed**
   ```json
   {
     "dotnetBuildBuddy.nugetApiEnabled": false
   }
   ```
   - Uses only local rules (faster but less accurate)

3. **Increase API Timeout**
   ```json
   {
     "dotnetBuildBuddy.nugetApiTimeout": 10000
   }
   ```

4. **Disable Auto-Update**
   ```json
   {
     "dotnetBuildBuddy.autoUpdate": false
   }
   ```
   - Update manually when needed

5. **Reduce Watch Patterns**
   - Limit watched file patterns if workspace is very large
   - Exclude unnecessary directories

### False Compatibility Warnings

**Symptoms:**
- Package marked as incompatible but works fine
- Suggestions seem incorrect

**Solutions:**

1. **Package in Local Build**
   - Some packages work despite compatibility warnings
   - This is a limitation of metadata-based checking

2. **Add to Ignore List**
   ```json
   {
     "dotnetBuildBuddy.nugetIgnoredPackages": [
       "ProblematicPackage"
     ]
   }
   ```

3. **Verify Target Framework**
   - Check project file has correct `TargetFramework`
   - Extension uses this for compatibility checking

4. **Check Package Metadata**
   - Package metadata may be incorrect on NuGet
   - Report to package maintainer if issue persists

### Solution File Issues

**Symptoms:**
- Solution file not generated
- Projects not included in solution
- GUID errors

**Solutions:**

1. **Ensure Projects Exist**
   - Solution needs projects to reference
   - Generate/update projects first

2. **Check Project File Paths**
   - Verify project files are accessible
   - Relative paths must be correct

3. **Manual Generation**
   - Use command: "DotNET Build Buddy: Generate Solution File"
   - Check Output for errors

4. **Solution File Location**
   - Default: Workspace root (`Solution.sln`)
   - Ensure write permissions

### Configuration Not Applied

**Symptoms:**
- Settings changes not taking effect
- Extension ignoring configuration

**Solutions:**

1. **Verify JSON Syntax**
   - Check `settings.json` has valid JSON
   - Look for syntax errors (commas, quotes)

2. **Check Setting Scope**
   - User settings vs Workspace settings
   - Workspace settings override user settings

3. **Reload Window**
   - Configuration changes require reload
   - Press `Ctrl+R` to reload

4. **Verify Setting Names**
   - Must start with `dotnetBuildBuddy.`
   - Check for typos in setting names

## Debugging

### Enable Detailed Logging

1. Open Developer Console (`Ctrl+Shift+I` or `Cmd+Option+I`)
2. Look for "DotNET Build Buddy" messages
3. Check Console tab for errors

### Output Panel

View extension logs:
1. View → Output (`Ctrl+Shift+U`)
2. Select "DotNET Build Buddy" from dropdown
3. Review log messages

### Check Extension Status

1. Open Extensions panel (`Ctrl+Shift+X`)
2. Find "DotNET Build Buddy"
3. Check if enabled
4. Review extension details

## Getting Help

### Report Issues

If you encounter issues not covered here:

1. **Check Existing Issues**
   - Search GitHub issues
   - Check if issue is already reported

2. **Create New Issue**
   - Include VS Code version
   - Include extension version
   - Describe steps to reproduce
   - Attach relevant logs

3. **Include Information**
   - Output panel logs
   - Developer console errors
   - Configuration settings (remove sensitive data)
   - Workspace structure

### Community Support

- GitHub Discussions
- GitHub Issues
- Check documentation first

## Prevention

### Best Practices

1. **Keep Extension Updated**
   - Update to latest version regularly
   - Check for bug fixes and improvements

2. **Review Configuration**
   - Periodically review settings
   - Ensure configuration matches needs

3. **Monitor Logs**
   - Check Output panel occasionally
   - Watch for warnings or errors

4. **Test After Updates**
   - Test extension after VS Code updates
   - Verify compatibility with new versions

5. **Backup Before Changes**
   - Backup project files before major updates
   - Use version control (Git)

## Recovery

### Reset Extension

If extension becomes unresponsive:

1. **Reload Window**
   - `Ctrl+R` or Command Palette → "Developer: Reload Window"

2. **Disable/Enable Extension**
   - Extensions panel → Find extension → Disable → Enable

3. **Uninstall/Reinstall**
   - Uninstall extension
   - Restart VS Code
   - Reinstall extension

4. **Clear Cache**
   - Disable extension
   - Delete extension cache (if exists)
   - Re-enable extension

### Restore Project Files

If project files get corrupted:

1. **Use Version Control**
   - Revert to last known good commit
   - Restore from backup

2. **Regenerate Files**
   - Delete corrupted project files
   - Run "Update Project Files" command
   - Regenerate solution file

3. **Manual Recreation**
   - Create project files manually
   - Extension will update them automatically


