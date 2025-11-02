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
import { DotNetProjectManager } from './dotnetProjectManager';

export class FileWatcher implements vscode.Disposable {
    private watchers: vscode.FileSystemWatcher[] = [];
    private projectManager: DotNetProjectManager;
    private debounceTimer: NodeJS.Timeout | undefined;

    constructor(projectManager: DotNetProjectManager) {
        this.projectManager = projectManager;
        this.setupWatchers();
    }

    private setupWatchers(): void {
        const config = vscode.workspace.getConfiguration('dotnetBuildBuddy');
        const watchPatterns = config.get<string[]>('watchPatterns', ['**/*.cs', '**/*.fs', '**/*.vb']);
        const excludePatterns = config.get<string[]>('excludePatterns', ['**/bin/**', '**/obj/**', '**/node_modules/**']);

        console.log(`DotNET Build Buddy: Setting up file watchers for patterns: ${watchPatterns.join(', ')}`);
        console.log(`DotNET Build Buddy: Excluding patterns: ${excludePatterns.join(', ')}`);

        for (const pattern of watchPatterns) {
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);
            
            watcher.onDidCreate(this.onFileChange.bind(this));
            watcher.onDidChange(this.onFileChange.bind(this));
            watcher.onDidDelete(this.onFileChange.bind(this));

            this.watchers.push(watcher);
        }

        const projectWatcher = vscode.workspace.createFileSystemWatcher('**/*.{csproj,fsproj,vbproj,sln}');
        projectWatcher.onDidCreate(this.onProjectFileChange.bind(this));
        projectWatcher.onDidChange(this.onProjectFileChange.bind(this));
        projectWatcher.onDidDelete(this.onProjectFileChange.bind(this));
        
        this.watchers.push(projectWatcher);
        
        console.log(`DotNET Build Buddy: File watchers initialized successfully`);
    }

    private onFileChange(uri: vscode.Uri): void {
        const config = vscode.workspace.getConfiguration('dotnetBuildBuddy');
        const autoUpdate = config.get<boolean>('autoUpdate', true);
        
        if (!autoUpdate) {
            console.log(`DotNET Build Buddy: Auto-update disabled, ignoring change to ${uri.fsPath}`);
            return;
        }

        if (this.shouldIgnoreFile(uri.fsPath)) {
            console.log(`DotNET Build Buddy: Ignoring excluded file ${uri.fsPath}`);
            return;
        }

        console.log(`DotNET Build Buddy: Detected change in .NET source file: ${uri.fsPath}`);
        this.debounceUpdate();
    }

    private onProjectFileChange(uri: vscode.Uri): void {
        console.log(`DotNET Build Buddy: Project file changed: ${uri.fsPath}`);
        this.debounceUpdate();
    }

    private shouldIgnoreFile(filePath: string): boolean {
        const config = vscode.workspace.getConfiguration('dotnetBuildBuddy');
        const excludePatterns = config.get<string[]>('excludePatterns', ['**/bin/**', '**/obj/**', '**/node_modules/**']);
        
        return excludePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(filePath);
        });
    }

    private debounceUpdate(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(async () => {
            console.log('DotNET Build Buddy: Triggering project file update...');
            try {
                await this.projectManager.updateAllProjectFiles();
                // Also update the solution file to include any new projects
                await this.projectManager.generateSolutionFile();
                console.log('DotNET Build Buddy: Project files and solution updated successfully');
            } catch (error) {
                console.error('DotNET Build Buddy: Error updating project files:', error);
                vscode.window.showErrorMessage(`DotNET Build Buddy: Failed to update project files: ${error}`);
            }
        }, 1000);
    }

    public dispose(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        for (const watcher of this.watchers) {
            watcher.dispose();
        }
        this.watchers = [];
    }
}
