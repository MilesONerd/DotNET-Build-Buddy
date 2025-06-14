# DotNET Build Buddy - Testing Guide

## Test Results Summary

### ✅ Unit Tests Completed
- **Project File Generation**: All project file generation functions tested and working
  - C# (.csproj) generation: ✅ PASSED
  - F# (.fsproj) generation: ✅ PASSED  
  - VB.NET (.vbproj) generation: ✅ PASSED
- **TypeScript Compilation**: ✅ PASSED (no errors)
- **Extension Packaging**: ✅ PASSED (VSIX created successfully)

### 🔄 Integration Tests (Manual Testing Required)

To complete testing, install the packaged extension in VS Code and verify:

#### Test Case 1: File Change Detection
1. Open a workspace with .NET source files (.cs, .fs, .vb)
2. Create a new .cs file
3. **Expected**: Extension should detect the change and update project files
4. **Verify**: Check console output for "DotNET Build Buddy: Detected change" messages

#### Test Case 2: Project File Generation
1. In a workspace with mixed .NET files, run command: "DotNET Build Buddy: Update Project Files"
2. **Expected**: 
   - .csproj file created for C# files
   - .fsproj file created for F# files  
   - .vbproj file created for VB.NET files
3. **Verify**: Project files contain correct `<Compile Include="...">` entries

#### Test Case 3: Solution File Generation
1. Run command: "DotNET Build Buddy: Generate Solution File"
2. **Expected**: Solution.sln file created with all project references
3. **Verify**: Solution file contains proper project GUIDs and configurations

#### Test Case 4: Automatic Updates
1. With auto-update enabled, add/remove/modify .NET source files
2. **Expected**: Project files automatically updated after 1-second debounce
3. **Verify**: Project files reflect current source file structure

#### Test Case 5: Configuration Options
1. Test disabling auto-update in settings
2. Test custom watch patterns
3. Test exclude patterns (bin/, obj/ folders)
4. **Expected**: Extension respects all configuration settings

## Installation Instructions

1. Install the packaged extension:
   ```bash
   code --install-extension dotnet-build-buddy-1.0.0.vsix
   ```

2. Open a workspace containing .NET source files

3. The extension should activate automatically when .NET files are detected

## Test Workspace Structure

Use the included test-workspace/ directory which contains:
- `src/Program.cs` - C# source file
- `src/Calculator.fs` - F# source file  
- `src/Helper.vb` - VB.NET source file

## Expected Behavior

When working correctly, the extension will:
- Monitor file changes in real-time
- Generate appropriate project files based on source file types
- Create solution files that reference all projects
- Provide user feedback through VS Code notifications
- Log detailed information to the console for debugging

## Troubleshooting

If the extension doesn't work as expected:
1. Check the VS Code Developer Console (Help > Toggle Developer Tools)
2. Look for "DotNET Build Buddy" log messages
3. Verify the extension is activated (check Extensions panel)
4. Ensure workspace contains .NET source files for activation
