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
import { EnhancedCompatibilityIssue } from './nugetCompatibilityChecker';

export class NuGetDiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private workspaceRoot: string;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('dotnetBuildBuddy');
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }

    public async updateDiagnostics(
        projectFile: string,
        issues: EnhancedCompatibilityIssue[]
    ): Promise<void> {
        if (!fs.existsSync(projectFile)) {
            return;
        }

        const document = await vscode.workspace.openTextDocument(projectFile);
        const diagnostics: vscode.Diagnostic[] = [];
        const content = document.getText();

        for (const issue of issues) {
            const diagnostic = this.createDiagnostic(issue, content, document);
            if (diagnostic) {
                diagnostics.push(diagnostic);
            }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private createDiagnostic(
        issue: EnhancedCompatibilityIssue,
        content: string,
        document: vscode.TextDocument
    ): vscode.Diagnostic | null {
        // Find PackageReference line
        const packageRefPattern = new RegExp(
            `<PackageReference\\s+Include=["']${this.escapeRegex(issue.packageName)}["']`,
            'gi'
        );
        
        let match: RegExpMatchArray | null = null;
        let position = -1;
        while ((match = packageRefPattern.exec(content)) !== null) {
            if (match.index !== undefined) {
                position = match.index;
                break;
            }
        }

        if (position === -1) {
            return null;
        }

        // Find line number
        const beforeMatch = content.substring(0, position);
        const lineNumber = beforeMatch.split('\n').length - 1;
        const line = document.lineAt(lineNumber);
        
        // Find PackageReference attribute range
        const includePattern = new RegExp(
            `Include=["']${this.escapeRegex(issue.packageName)}["']`,
            'i'
        );
        const includeMatch = line.text.match(includePattern);
        
        if (!includeMatch || includeMatch.index === undefined) {
            return null;
        }

        const startPos = new vscode.Position(
            lineNumber,
            includeMatch.index
        );
        const endPos = new vscode.Position(
            lineNumber,
            includeMatch.index + includeMatch[0].length
        );
        const range = new vscode.Range(startPos, endPos);

        // Determine severity
        let severity: vscode.DiagnosticSeverity;
        if (issue.issueType === 'incompatible') {
            severity = vscode.DiagnosticSeverity.Error;
        } else {
            severity = vscode.DiagnosticSeverity.Warning;
        }

        // Build message with suggestions
        let message = issue.message;
        if (issue.suggestedVersion) {
            message += `\n\n💡 Suggested version: ${issue.suggestedVersion}`;
        }
        if (issue.alternativePackage) {
            message += `\n\n🔄 Alternative package: ${issue.alternativePackage.name}${issue.alternativePackage.version ? ` (${issue.alternativePackage.version})` : ''}`;
        }
        if (issue.recommendation) {
            message += `\n\n📝 ${issue.recommendation}`;
        }
        if (issue.transitiveIssues && issue.transitiveIssues.length > 0) {
            message += `\n\n⚠️ Transitive dependency issues:`;
            for (const transitiveIssue of issue.transitiveIssues) {
                message += `\n  • ${transitiveIssue.packageName}${transitiveIssue.version ? ` ${transitiveIssue.version}` : ''}: ${transitiveIssue.message}`;
            }
        }

        const diagnostic = new vscode.Diagnostic(range, message, severity);
        diagnostic.source = 'DotNET Build Buddy';
        diagnostic.code = issue.issueType;

        // Add code actions
        diagnostic.tags = [];
        if (issue.suggestedVersion) {
            diagnostic.relatedInformation = [
                new vscode.DiagnosticRelatedInformation(
                    new vscode.Location(
                        document.uri,
                        range
                    ),
                    `Quick fix: Update to version ${issue.suggestedVersion}`
                )
            ];
        }

        return diagnostic;
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    public clearDiagnostics(): void {
        this.diagnosticCollection.clear();
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}

