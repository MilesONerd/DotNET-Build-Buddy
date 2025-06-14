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

export class DotNetProjectManager {
    private workspaceRoot: string;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
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
            const projectsByType = this.groupSourceFilesByProjectType(sourceFiles);

            for (const [projectType, files] of Object.entries(projectsByType)) {
                if (files.length > 0) {
                    await this.updateOrCreateProjectFile(projectType, files);
                }
            }

            vscode.window.showInformationMessage('Project files updated successfully');
        } catch (error) {
            vscode.window.showErrorMessage(`Error updating project files: ${error}`);
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
            const files = await new Promise<string[]>((resolve, reject) => {
                glob(pattern, {
                    cwd: this.workspaceRoot,
                    ignore: excludePatterns
                }, (err, matches) => {
                    if (err) reject(err);
                    else resolve(matches);
                });
            });
            allFiles = allFiles.concat(files.map((f: string) => path.join(this.workspaceRoot, f)));
        }
        
        return allFiles;
    }

    private async findSourceFiles(): Promise<string[]> {
        const patterns = ['**/*.cs', '**/*.fs', '**/*.vb'];
        const excludePatterns = ['**/bin/**', '**/obj/**', '**/node_modules/**'];
        
        let allFiles: string[] = [];
        for (const pattern of patterns) {
            const files = await new Promise<string[]>((resolve, reject) => {
                glob(pattern, {
                    cwd: this.workspaceRoot,
                    ignore: excludePatterns
                }, (err, matches) => {
                    if (err) reject(err);
                    else resolve(matches);
                });
            });
            allFiles = allFiles.concat(files.map((f: string) => path.join(this.workspaceRoot, f)));
        }
        
        return allFiles;
    }

    private groupSourceFilesByProjectType(sourceFiles: string[]): Record<string, string[]> {
        const groups: Record<string, string[]> = {
            'csharp': [],
            'fsharp': [],
            'vbnet': []
        };

        for (const file of sourceFiles) {
            const ext = path.extname(file).toLowerCase();
            switch (ext) {
                case '.cs':
                    groups.csharp.push(file);
                    break;
                case '.fs':
                    groups.fsharp.push(file);
                    break;
                case '.vb':
                    groups.vbnet.push(file);
                    break;
            }
        }

        return groups;
    }

    private async updateOrCreateProjectFile(projectType: string, sourceFiles: string[]): Promise<void> {
        const projectDir = this.getProjectDirectory(sourceFiles);
        const projectFileName = this.getProjectFileName(projectType, projectDir);
        const projectPath = path.join(projectDir, projectFileName);

        const projectContent = this.generateProjectContent(projectType, sourceFiles, projectDir);
        
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(projectPath, projectContent);
    }

    private getProjectDirectory(sourceFiles: string[]): string {
        if (sourceFiles.length === 0) {
            return this.workspaceRoot;
        }

        const commonDir = this.findCommonDirectory(sourceFiles);
        return commonDir || this.workspaceRoot;
    }

    private findCommonDirectory(files: string[]): string {
        if (files.length === 0) {
            return this.workspaceRoot;
        }

        const dirs = files.map(f => path.dirname(f));
        let commonPath = dirs[0];

        for (let i = 1; i < dirs.length; i++) {
            commonPath = this.getCommonPath(commonPath, dirs[i]);
        }

        return commonPath;
    }

    private getCommonPath(path1: string, path2: string): string {
        const parts1 = path1.split(path.sep);
        const parts2 = path2.split(path.sep);
        const commonParts: string[] = [];

        for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
            if (parts1[i] === parts2[i]) {
                commonParts.push(parts1[i]);
            } else {
                break;
            }
        }

        return commonParts.join(path.sep);
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

    private generateProjectContent(projectType: string, sourceFiles: string[], projectDir: string): string {
        const relativeFiles = sourceFiles.map(f => path.relative(projectDir, f));
        
        switch (projectType) {
            case 'csharp':
                return this.generateCSharpProject(relativeFiles);
            case 'fsharp':
                return this.generateFSharpProject(relativeFiles);
            case 'vbnet':
                return this.generateVBNetProject(relativeFiles);
            default:
                return this.generateCSharpProject(relativeFiles);
        }
    }

    private generateCSharpProject(sourceFiles: string[]): string {
        const includes = sourceFiles.map(f => `    <Compile Include="${f}" />`).join('\n');
        
        return `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
${includes}
  </ItemGroup>

</Project>`;
    }

    private generateFSharpProject(sourceFiles: string[]): string {
        const includes = sourceFiles.map(f => `    <Compile Include="${f}" />`).join('\n');
        
        return `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
${includes}
  </ItemGroup>

</Project>`;
    }

    private generateVBNetProject(sourceFiles: string[]): string {
        const includes = sourceFiles.map(f => `    <Compile Include="${f}" />`).join('\n');
        
        return `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <RootNamespace></RootNamespace>
  </PropertyGroup>

  <ItemGroup>
${includes}
  </ItemGroup>

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
