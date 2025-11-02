# Changelog

All notable changes to the DotNET Build Buddy extension will be documented in this file.

## [1.0.0] - 2025-01-XX

### Added

#### Core Features
- Automatic project file generation (.csproj, .fsproj, .vbproj)
- Automatic solution file generation (.sln)
- Real-time file monitoring and auto-updates
- Multi-language support (C#, F#, VB.NET)
- Smart file grouping by directory structure
- Configuration preservation when updating projects

#### NuGet Compatibility Checking
- Real-time package compatibility checking
- NuGet.org API integration for accurate package information
- Intelligent version suggestions
- Alternative package recommendations
- Transitive dependency checking
- Framework upgrade suggestions
- Inline diagnostics with tooltips

#### Smart Suggestions
- Automatic version suggestions for incompatible packages
- Alternative package recommendations for deprecated/incompatible packages
- Framework upgrade suggestions based on package compatibility
- Detailed tooltips with explanations and recommendations

#### Configuration
- Comprehensive configuration system
- Cache management for performance
- Package ignore patterns
- API timeout configuration
- Watch pattern customization
- Exclude pattern configuration

#### Documentation
- Complete documentation in `docs/` folder
- Installation guide
- User guide
- Configuration reference
- NuGet compatibility guide
- API reference
- Troubleshooting guide

### Technical Details

- Built with TypeScript
- Uses VS Code Extension API
- Integrates with NuGet.org API
- Implements VS Code Diagnostics API
- File system watchers for real-time updates
- XML parsing for project files
- Cache system for performance optimization

### Supported Frameworks

- .NET Framework (net40, net45, net451, net452, net46, net461, net462, net47, net471, net472, net48)
- .NET Core (netcoreapp2.0, netcoreapp2.1, netcoreapp2.2, netcoreapp3.0, netcoreapp3.1)
- .NET Standard (netstandard1.0 through netstandard2.1)
- .NET (net5.0, net6.0, net7.0, net8.0)

### Known Packages Supported

The extension includes compatibility rules for:
- ASP.NET Core packages
- ASP.NET (classic) packages
- Entity Framework
- Microsoft.Extensions packages
- Blazor packages
- SignalR packages
- gRPC packages
- JSON packages (Newtonsoft.Json, System.Text.Json)
- Testing frameworks (xunit, NUnit, Moq)
- Logging (Serilog)
- Validation (FluentValidation)
- And many more...

## [Unreleased]

### Planned Features
- Code actions for quick fixes
- Support for .NET 9 and future versions
- Enhanced package metadata parsing
- Bulk operations support
- Performance improvements

---

**Note**: This changelog follows [Keep a Changelog](https://keepachangelog.com/) principles.

