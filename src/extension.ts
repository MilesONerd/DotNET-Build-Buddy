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
import { FileWatcher } from './fileWatcher';

let projectManager: DotNetProjectManager;
let fileWatcher: FileWatcher;

export function activate(context: vscode.ExtensionContext) {
    console.log('DotNET Build Buddy extension is now active!');

    projectManager = new DotNetProjectManager();
    fileWatcher = new FileWatcher(projectManager);

    const generateSolutionCommand = vscode.commands.registerCommand('dotnetBuildBuddy.generateSolution', () => {
        projectManager.generateSolutionFile();
    });

    const updateProjectsCommand = vscode.commands.registerCommand('dotnetBuildBuddy.updateProjects', () => {
        projectManager.updateAllProjectFiles();
    });

    const refreshAllCommand = vscode.commands.registerCommand('dotnetBuildBuddy.refreshAll', () => {
        projectManager.refreshAllFiles();
    });

    context.subscriptions.push(
        generateSolutionCommand,
        updateProjectsCommand,
        refreshAllCommand,
        fileWatcher
    );

    vscode.window.showInformationMessage('DotNET Build Buddy is ready to manage your .NET projects!');
}

export function deactivate() {
    if (fileWatcher) {
        fileWatcher.dispose();
    }
}
