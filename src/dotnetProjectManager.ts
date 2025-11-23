/*
 * Copyright 2025 DotNET Build Buddy Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as xml2js from 'xml2js';
import { NuGetCompatibilityChecker } from './nugetCompatibilityChecker';
import { NuGetDiagnosticProvider } from './nugetDiagnosticProvider';

interface ProjectInfo {
    targetFramework?: string;
    targetFrameworks?: string[];
    nullable?: string;
    rootNamespace?: string;
    sdk?: string;
    customProperties?: Record<string, string>;
    packageReferences?: Array<{ Include: string; Version?: string }>;
    customItemGroups?: string[];
}

interface DotNetVersionInfo {
    type: 'net' | 'netcoreapp' | 'netframework' | 'netstandard';
    version?: string;
    fullTargetFramework: string;
}

export class DotNetProjectManager {
    private workspaceRoot: string;
    private parser: xml2js.Parser;
    private builder: xml2js.Builder;
    private compatibilityChecker: NuGetCompatibilityChecker;
    private diagnosticProvider: NuGetDiagnosticProvider;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        this.parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
        this.builder = new xml2js.Builder({ headless: true, renderOpts: { pretty: true, indent: '  ' } });
        this.compatibilityChecker = new NuGetCompatibilityChecker();
        this.diagnosticProvider = new NuGetDiagnosticProvider();
    }

    public async generateSolutionFile(): Promise<void> {
        if (!this.workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        try {
            const projectFiles = await this.findProjectFiles();
            if (projectFiles.length === 0) {
                vscode.window.showInformationMessage('No .NET project files found in workspace');
                return;
            }

            const solutionContent = this.generateSolutionContent(projectFiles);
            const solutionPath = path.join(this.workspaceRoot, 'Solution.sln');
            
            fs.writeFileSync(solutionPath, solutionContent);
            vscode.window.showInformationMessage(`Solution file generated: ${solutionPath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating solution file: ${error}`);
        }
    }

    public async updateAllProjectFiles(): Promise<void> {
        if (!this.workspaceRoot) {
            return;
        }

        try {
            const sourceFiles = await this.findSourceFiles();
            // Improved grouping: group by directory structure, not just file type
            const projectsByDirectory = this.groupSourceFilesByDirectory(sourceFiles);

            // Check all existing projects for compatibility issues
            await this.checkAllProjectCompatibility();

            for (const [projectKey, files] of Object.entries(projectsByDirectory)) {
                if (files.length > 0) {
                    const [projectType, projectDir] = projectKey.split('|');
                    await this.updateOrCreateProjectFile(projectType, files, projectDir);
                }
            }

            vscode.window.showInformationMessage('Project files updated successfully');
        } catch (error) {
            vscode.window.showErrorMessage(`Error updating project files: ${error}`);
        }
    }

    private async checkAllProjectCompatibility(): Promise<void> {
        try {
            const projectFiles = await this.findProjectFiles();
            
            for (const projectFile of projectFiles) {
                try {
                    const projectInfo = await this.readProjectFile(projectFile);
                    const targetFramework = projectInfo.targetFramework || 
                                          projectInfo.targetFrameworks?.[0] ||
                                          'net8.0';

                    if (projectInfo.packageReferences && projectInfo.packageReferences.length > 0) {
                        // Use enhanced compatibility check with suggestions
                        const compatibilityIssues = await this.compatibilityChecker.checkProjectCompatibilityEnhanced(
                            projectInfo.packageReferences,
                            targetFramework
                        );

                        // Update inline diagnostics
                        await this.diagnosticProvider.updateDiagnostics(projectFile, compatibilityIssues);

                        if (compatibilityIssues.length > 0) {
                            // Include project file name in the report
                            const projectName = path.basename(projectFile);
                            console.warn(`Compatibility issues found in ${projectName}:`, compatibilityIssues);
                            
                            // Report will be shown by reportCompatibilityIssues
                            await this.compatibilityChecker.reportCompatibilityIssues(compatibilityIssues);
                        }

                        // Suggest framework upgrade
                        const upgradeSuggestion = await this.compatibilityChecker.suggestFrameworkUpgrade(
                            targetFramework,
                            projectInfo.packageReferences
                        );

                        if (upgradeSuggestion) {
                            const projectName = path.basename(projectFile);
                            vscode.window.showInformationMessage(
                                `💡 ${projectName}: Consider upgrading from ${targetFramework} to ${upgradeSuggestion.suggestedFramework}. ${upgradeSuggestion.reason}`,
                                'Learn More'
                            ).then(selection => {
                                if (selection === 'Learn More') {
                                    vscode.env.openExternal(vscode.Uri.parse(
                                        `https://docs.microsoft.com/en-us/dotnet/core/migration/`
                                    ));
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`Could not check compatibility for ${projectFile}:`, error);
                }
            }
        } catch (error) {
            console.warn('Error checking project compatibility:', error);
        }
    }

    public async refreshAllFiles(): Promise<void> {
        await this.updateAllProjectFiles();
        await this.generateSolutionFile();
    }

    private async findProjectFiles(): Promise<string[]> {
        const patterns = ['**/*.csproj', '**/*.fsproj', '**/*.vbproj'];
        const excludePatterns = ['**/bin/**', '**/obj/**', '**/node_modules/**'];
        
        let allFiles: string[] = [];
        for (const pattern of patterns) {
            try {
                const files = await glob(pattern, {
                    cwd: this.workspaceRoot,
                    ignore: excludePatterns
                });
                allFiles = allFiles.concat(files.map((f: string) => path.join(this.workspaceRoot, f)));
            } catch (err) {
                console.error(`Error searching for pattern ${pattern}:`, err);
            }
        }
        
        return allFiles;
    }

    private async findSourceFiles(): Promise<string[]> {
        const patterns = ['**/*.cs', '**/*.fs', '**/*.vb'];
        const excludePatterns = ['**/bin/**', '**/obj/**', '**/node_modules/**'];
        
        let allFiles: string[] = [];
        for (const pattern of patterns) {
            try {
                const files = await glob(pattern, {
                    cwd: this.workspaceRoot,
                    ignore: excludePatterns
                });
                allFiles = allFiles.concat(files.map((f: string) => path.join(this.workspaceRoot, f)));
            } catch (err) {
                console.error(`Error searching for pattern ${pattern}:`, err);
            }
        }
        
        return allFiles;
    }

    private groupSourceFilesByDirectory(sourceFiles: string[]): Record<string, string[]> {
        const groups: Record<string, string[]> = {};

        for (const file of sourceFiles) {
            const ext = path.extname(file).toLowerCase();
            const projectType = this.getProjectTypeFromExtension(ext);
            const fileDir = path.dirname(file);
            
            // Group by project type and directory
            // Files in the same directory with the same type go to the same project
            // Files in different directories get separate projects
            const key = `${projectType}|${fileDir}`;
            
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(file);
        }

        return groups;
    }

    private getProjectTypeFromExtension(ext: string): string {
        switch (ext.toLowerCase()) {
            case '.cs':
                return 'csharp';
            case '.fs':
                return 'fsharp';
            case '.vb':
                return 'vbnet';
            default:
                return 'csharp';
        }
    }

    private async updateOrCreateProjectFile(projectType: string, sourceFiles: string[], projectDir: string): Promise<void> {
        const projectFileName = this.getProjectFileName(projectType, projectDir);
        const projectPath = path.join(projectDir, projectFileName);

        // Try to read existing project file to preserve settings
        let existingProjectInfo: ProjectInfo | null = null;
        if (fs.existsSync(projectPath)) {
            try {
                existingProjectInfo = await this.readProjectFile(projectPath);
            } catch (error) {
                console.warn(`Could not read existing project file ${projectPath}:`, error);
            }
        }

        // Determine target framework from existing project or detect from workspace
        const targetFramework = existingProjectInfo?.targetFramework || 
                               existingProjectInfo?.targetFrameworks?.[0] ||
                               await this.detectTargetFramework() ||
                               'net8.0';

        // Check NuGet package compatibility if there are package references
        if (existingProjectInfo?.packageReferences && existingProjectInfo.packageReferences.length > 0) {
            try {
                // Use enhanced compatibility check with suggestions
                const compatibilityIssues = await this.compatibilityChecker.checkProjectCompatibilityEnhanced(
                    existingProjectInfo.packageReferences,
                    targetFramework
                );
                
                // Update inline diagnostics
                await this.diagnosticProvider.updateDiagnostics(projectPath, compatibilityIssues);
                
                // Report issues
                if (compatibilityIssues.length > 0) {
                    await this.compatibilityChecker.reportCompatibilityIssues(compatibilityIssues);
                }

                // Suggest framework upgrade if applicable
                const upgradeSuggestion = await this.compatibilityChecker.suggestFrameworkUpgrade(
                    targetFramework,
                    existingProjectInfo.packageReferences
                );

                if (upgradeSuggestion) {
                    vscode.window.showInformationMessage(
                        `💡 Framework Upgrade Suggestion: Consider upgrading from ${targetFramework} to ${upgradeSuggestion.suggestedFramework}. ${upgradeSuggestion.reason}`,
                        'Learn More'
                    ).then(selection => {
                        if (selection === 'Learn More') {
                            vscode.env.openExternal(vscode.Uri.parse(
                                `https://docs.microsoft.com/en-us/dotnet/core/migration/`
                            ));
                        }
                    });
                }
            } catch (error) {
                console.warn('Error checking package compatibility:', error);
            }
        }

        const projectContent = this.generateProjectContent(
            projectType, 
            sourceFiles, 
            projectDir, 
            existingProjectInfo,
            targetFramework
        );
        
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(projectPath, projectContent);
    }

    private async readProjectFile(projectPath: string): Promise<ProjectInfo> {
        try {
            const content = fs.readFileSync(projectPath, 'utf-8');
            const parsed = await this.parser.parseStringPromise(content);
            const project = parsed.Project || parsed.Project;
            
            const info: ProjectInfo = {};
            const propertyGroup = Array.isArray(project.PropertyGroup) 
                ? project.PropertyGroup[0] 
                : project.PropertyGroup;

            if (propertyGroup) {
                info.targetFramework = propertyGroup.TargetFramework || propertyGroup.TargetFramework?.[0];
                if (propertyGroup.TargetFrameworks) {
                    const tfms = propertyGroup.TargetFrameworks;
                    info.targetFrameworks = Array.isArray(tfms) ? tfms : [tfms];
                }
                info.nullable = propertyGroup.Nullable || propertyGroup.Nullable?.[0];
                info.rootNamespace = propertyGroup.RootNamespace || propertyGroup.RootNamespace?.[0];
                
                // Preserve other custom properties
                info.customProperties = {};
                for (const key in propertyGroup) {
                    if (!['TargetFramework', 'TargetFrameworks', 'Nullable', 'RootNamespace'].includes(key)) {
                        info.customProperties[key] = propertyGroup[key];
                    }
                }
            }

            info.sdk = project.$.Sdk || project.$.sdk;

            // Preserve PackageReference items
            if (project.ItemGroup) {
                const itemGroups = Array.isArray(project.ItemGroup) ? project.ItemGroup : [project.ItemGroup];
                for (const itemGroup of itemGroups) {
                    if (itemGroup.PackageReference) {
                        const refs = Array.isArray(itemGroup.PackageReference) 
                            ? itemGroup.PackageReference 
                            : [itemGroup.PackageReference];
                        info.packageReferences = refs.map((ref: any) => ({
                            Include: ref.$.Include || ref.$.include,
                            Version: ref.$.Version || ref.$.version
                        }));
                    }
                }
            }

            return info;
        } catch (error) {
            console.error(`Error parsing project file ${projectPath}:`, error);
            return {};
        }
    }

    private parseTargetFramework(targetFramework: string): DotNetVersionInfo {
        const lower = targetFramework.toLowerCase();
        let type: 'net' | 'netcoreapp' | 'netframework' | 'netstandard';
        let version: string | undefined;

        if (lower.startsWith('netframework') || lower.startsWith('net')) {
            if (lower.startsWith('netframework')) {
                type = 'netframework';
                version = lower.replace('netframework', '').replace(/^(\d)/, '$1.');
            } else if (lower.startsWith('netcoreapp')) {
                type = 'netcoreapp';
                version = lower.replace('netcoreapp', '').replace(/^(\d)/, '$1.');
            } else if (lower.startsWith('netstandard')) {
                type = 'netstandard';
                version = lower.replace('netstandard', '').replace(/^(\d)/, '$1.');
            } else {
                // Modern .NET (net8.0, net7.0, etc.)
                type = 'net';
                const match = lower.match(/net(\d+(?:\.\d+)?)/);
                version = match ? match[1] : undefined;
            }
        } else {
            type = 'net';
            version = undefined;
        }

        return {
            type,
            version,
            fullTargetFramework: targetFramework
        };
    }

    private async detectTargetFramework(): Promise<string | null> {
        // Try to detect from existing projects in workspace
        const existingProjects = await this.findProjectFiles();
        
        for (const projectFile of existingProjects) {
            try {
                const info = await this.readProjectFile(projectFile);
                if (info.targetFramework) {
                    return info.targetFramework;
                }
                if (info.targetFrameworks && info.targetFrameworks.length > 0) {
                    return info.targetFrameworks[0];
                }
            } catch (error) {
                // Continue to next project
            }
        }

        // Default to .NET 8.0
        return 'net8.0';
    }

    private getProjectFileName(projectType: string, projectDir: string): string {
        const dirName = path.basename(projectDir);
        switch (projectType) {
            case 'csharp':
                return `${dirName}.csproj`;
            case 'fsharp':
                return `${dirName}.fsproj`;
            case 'vbnet':
                return `${dirName}.vbproj`;
            default:
                return `${dirName}.csproj`;
        }
    }

    private generateProjectContent(
        projectType: string, 
        sourceFiles: string[], 
        projectDir: string,
        existingInfo: ProjectInfo | null,
        targetFramework: string
    ): string {
        const relativeFiles = sourceFiles.map(f => path.relative(projectDir, f));
        const versionInfo = this.parseTargetFramework(targetFramework);
        
        switch (projectType) {
            case 'csharp':
                return this.generateCSharpProject(relativeFiles, existingInfo, versionInfo);
            case 'fsharp':
                return this.generateFSharpProject(relativeFiles, existingInfo, versionInfo);
            case 'vbnet':
                return this.generateVBNetProject(relativeFiles, existingInfo, versionInfo);
            default:
                return this.generateCSharpProject(relativeFiles, existingInfo, versionInfo);
        }
    }

    private generateCSharpProject(
        sourceFiles: string[], 
        existingInfo: ProjectInfo | null,
        versionInfo: DotNetVersionInfo
    ): string {
        const hasSubdirectories = sourceFiles.some(f => f.includes(path.sep) || f.includes('/'));
        
        // Use existing target framework or detected one
        const targetFramework = existingInfo?.targetFramework || versionInfo.fullTargetFramework;
        const nullable = existingInfo?.nullable || 'enable';
        
        let includes = '';
        if (hasSubdirectories) {
            const includesList = sourceFiles.map(f => `    <Compile Include="${f}" />`).join('\n');
            includes = `\n  <ItemGroup>\n${includesList}\n  </ItemGroup>`;
        }

        // Preserve custom properties
        let customProps = '';
        if (existingInfo?.customProperties) {
            for (const [key, value] of Object.entries(existingInfo.customProperties)) {
                customProps += `\n    <${key}>${value}</${key}>`;
            }
        }

        // Preserve PackageReferences
        let packageRefs = '';
        if (existingInfo?.packageReferences && existingInfo.packageReferences.length > 0) {
            const refs = existingInfo.packageReferences.map(ref => {
                const version = ref.Version ? ` Version="${ref.Version}"` : '';
                return `    <PackageReference Include="${ref.Include}"${version} />`;
            }).join('\n');
            packageRefs = `\n  <ItemGroup>\n${refs}\n  </ItemGroup>`;
        }

        return `<Project Sdk="${existingInfo?.sdk || 'Microsoft.NET.Sdk'}">

  <PropertyGroup>
    <TargetFramework>${targetFramework}</TargetFramework>
    <Nullable>${nullable}</Nullable>${customProps}
  </PropertyGroup>${includes}${packageRefs}

</Project>`;
    }

    private generateFSharpProject(
        sourceFiles: string[], 
        existingInfo: ProjectInfo | null,
        versionInfo: DotNetVersionInfo
    ): string {
        const hasSubdirectories = sourceFiles.some(f => f.includes(path.sep) || f.includes('/'));
        
        const targetFramework = existingInfo?.targetFramework || versionInfo.fullTargetFramework;
        
        let includes = '';
        if (hasSubdirectories) {
            const includesList = sourceFiles.map(f => `    <Compile Include="${f}" />`).join('\n');
            includes = `\n  <ItemGroup>\n${includesList}\n  </ItemGroup>`;
        }

        let customProps = '';
        if (existingInfo?.customProperties) {
            for (const [key, value] of Object.entries(existingInfo.customProperties)) {
                customProps += `\n    <${key}>${value}</${key}>`;
            }
        }

        let packageRefs = '';
        if (existingInfo?.packageReferences && existingInfo.packageReferences.length > 0) {
            const refs = existingInfo.packageReferences.map(ref => {
                const version = ref.Version ? ` Version="${ref.Version}"` : '';
                return `    <PackageReference Include="${ref.Include}"${version} />`;
            }).join('\n');
            packageRefs = `\n  <ItemGroup>\n${refs}\n  </ItemGroup>`;
        }

        return `<Project Sdk="${existingInfo?.sdk || 'Microsoft.NET.Sdk'}">

  <PropertyGroup>
    <TargetFramework>${targetFramework}</TargetFramework>${customProps}
  </PropertyGroup>${includes}${packageRefs}

</Project>`;
    }

    private generateVBNetProject(
        sourceFiles: string[], 
        existingInfo: ProjectInfo | null,
        versionInfo: DotNetVersionInfo
    ): string {
        const hasSubdirectories = sourceFiles.some(f => f.includes(path.sep) || f.includes('/'));
        
        const targetFramework = existingInfo?.targetFramework || versionInfo.fullTargetFramework;
        const rootNamespace = existingInfo?.rootNamespace || '';
        
        let includes = '';
        if (hasSubdirectories) {
            const includesList = sourceFiles.map(f => `    <Compile Include="${f}" />`).join('\n');
            includes = `\n  <ItemGroup>\n${includesList}\n  </ItemGroup>`;
        }

        let customProps = '';
        if (existingInfo?.customProperties) {
            for (const [key, value] of Object.entries(existingInfo.customProperties)) {
                customProps += `\n    <${key}>${value}</${key}>`;
            }
        }

        let packageRefs = '';
        if (existingInfo?.packageReferences && existingInfo.packageReferences.length > 0) {
            const refs = existingInfo.packageReferences.map(ref => {
                const version = ref.Version ? ` Version="${ref.Version}"` : '';
                return `    <PackageReference Include="${ref.Include}"${version} />`;
            }).join('\n');
            packageRefs = `\n  <ItemGroup>\n${refs}\n  </ItemGroup>`;
        }

        return `<Project Sdk="${existingInfo?.sdk || 'Microsoft.NET.Sdk'}">

  <PropertyGroup>
    <TargetFramework>${targetFramework}</TargetFramework>
    <RootNamespace>${rootNamespace}</RootNamespace>${customProps}
  </PropertyGroup>${includes}${packageRefs}

</Project>`;
    }

    private generateSolutionContent(projectFiles: string[]): string {
        const solutionGuid = this.generateGuid();
        let content = `
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
`;

        const projectEntries: string[] = [];
        const configEntries: string[] = [];

        for (const projectFile of projectFiles) {
            const projectGuid = this.generateGuid();
            const relativePath = path.relative(this.workspaceRoot, projectFile);
            const projectName = path.basename(projectFile, path.extname(projectFile));
            
            const projectTypeGuid = this.getProjectTypeGuid(path.extname(projectFile));
            
            projectEntries.push(`Project("${projectTypeGuid}") = "${projectName}", "${relativePath}", "{${projectGuid}}"`);
            projectEntries.push('EndProject');
            
            configEntries.push(`\t\t{${projectGuid}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU`);
            configEntries.push(`\t\t{${projectGuid}}.Debug|Any CPU.Build.0 = Debug|Any CPU`);
            configEntries.push(`\t\t{${projectGuid}}.Release|Any CPU.ActiveCfg = Release|Any CPU`);
            configEntries.push(`\t\t{${projectGuid}}.Release|Any CPU.Build.0 = Release|Any CPU`);
        }

        content += projectEntries.join('\n') + '\n';
        content += `Global
\tGlobalSection(SolutionConfigurationPlatforms) = preSolution
\t\tDebug|Any CPU = Debug|Any CPU
\t\tRelease|Any CPU = Release|Any CPU
\tEndGlobalSection
\tGlobalSection(ProjectConfigurationPlatforms) = postSolution
`;
        content += configEntries.join('\n') + '\n';
        content += `\tEndGlobalSection
\tGlobalSection(SolutionProperties) = preSolution
\t\tHideSolutionNode = FALSE
\tEndGlobalSection
\tGlobalSection(ExtensibilityGlobals) = postSolution
\t\tSolutionGuid = {${solutionGuid}}
\tEndGlobalSection
EndGlobal
`;

        return content;
    }

    private getProjectTypeGuid(extension: string): string {
        switch (extension.toLowerCase()) {
            case '.csproj':
                return '9A19103F-16F7-4668-BE54-9A1E7A4F7556';
            case '.fsproj':
                return '6EC3EE1D-3C4E-46DD-8F32-0CC8E7565705';
            case '.vbproj':
                return 'F184B08F-C81C-45F6-A57F-5ABD9991F28F';
            default:
                return '9A19103F-16F7-4668-BE54-9A1E7A4F7556';
        }
    }

    private generateGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16).toUpperCase();
        });
    }
}
