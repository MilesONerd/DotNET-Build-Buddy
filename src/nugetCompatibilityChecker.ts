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
import * as https from 'https';

export interface CompatibilityIssue {
    packageName: string;
    packageVersion?: string;
    targetFramework: string;
    issueType: 'incompatible' | 'version_mismatch' | 'deprecated';
    message: string;
    recommendation?: string;
}

export interface EnhancedCompatibilityIssue extends CompatibilityIssue {
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

interface PackageDependency {
    id: string;
    range?: string;
}

interface NuGetPackageMetadata {
    id: string;
    version: string;
    supportedFrameworks?: string[];
    dependencies?: PackageDependency[];
    deprecated?: boolean;
}

interface PackageCompatibilityRule {
    packageName?: string;
    packageNamePattern?: RegExp;
    minFramework?: string;
    maxFramework?: string;
    supportedFrameworks?: string[];
    versionRules?: {
        minVersion?: string;
        maxVersion?: string;
        frameworkVersions?: Record<string, { min?: string; max?: string }>;
    };
    deprecatedVersions?: string[];
}

interface CacheEntry {
    key: string;
    value: CompatibilityIssue | null;
    timestamp: number;
}

interface NuGetPackageInfo {
    packageId: string;
    versions: string[];
    supportedFrameworks?: string[];
    deprecated?: boolean;
}

interface NuGetPackageInfoExtended extends NuGetPackageInfo {
    dependencies?: PackageDependency[];
}

export class NuGetCompatibilityChecker {
    private compatibilityRules: PackageCompatibilityRule[];
    private cache: Map<string, CacheEntry>;
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.compatibilityRules = this.initializeCompatibilityRules();
        this.cache = new Map();
        this.config = vscode.workspace.getConfiguration('dotnetBuildBuddy');
    }

    public async checkCompatibility(
        packageName: string,
        packageVersion: string | undefined,
        targetFramework: string
    ): Promise<CompatibilityIssue | null> {
        // Check if checks are enabled
        if (!this.config.get<boolean>('nugetCheckEnabled', true)) {
            return null;
        }

        // Check if package is ignored
        if (this.isPackageIgnored(packageName)) {
            return null;
        }

        // Check cache first
        if (this.config.get<boolean>('nugetCacheEnabled', true)) {
            const cacheKey = `${packageName}|${packageVersion || 'latest'}|${targetFramework}`;
            const cached = this.getCachedResult(cacheKey);
            if (cached !== undefined) {
                return cached;
            }
        }

        // Try API lookup if enabled
        let issue: CompatibilityIssue | null | undefined = null;
        if (this.config.get<boolean>('nugetApiEnabled', true)) {
            issue = await this.checkCompatibilityViaAPI(packageName, packageVersion, targetFramework);
            if (issue !== undefined && issue !== null) {
                // Cache API result
                if (this.config.get<boolean>('nugetCacheEnabled', true)) {
                    const cacheKey = `${packageName}|${packageVersion || 'latest'}|${targetFramework}`;
                    this.setCachedResult(cacheKey, issue);
                }
                return issue;
            }
            // If API returned undefined, fall through to local rules
            if (issue === undefined) {
                issue = null;
            }
        }

        // Fall back to local rules
        issue = this.checkCompatibilityLocal(packageName, packageVersion, targetFramework);

        // Cache local result
        if (this.config.get<boolean>('nugetCacheEnabled', true) && issue !== null) {
            const cacheKey = `${packageName}|${packageVersion || 'latest'}|${targetFramework}`;
            this.setCachedResult(cacheKey, issue);
        }

        return issue;
    }

    private async checkCompatibilityViaAPI(
        packageName: string,
        packageVersion: string | undefined,
        targetFramework: string
    ): Promise<CompatibilityIssue | null | undefined> {
        try {
            const timeout = this.config.get<number>('nugetApiTimeout', 5000);
            const packageInfo = await this.fetchPackageInfo(packageName, timeout);
            
            if (!packageInfo) {
                return undefined; // API call failed, fall back to local rules
            }

            // Check if package is deprecated
            if (packageInfo.deprecated) {
                return {
                    packageName,
                    packageVersion,
                    targetFramework,
                    issueType: 'deprecated',
                    message: `Package ${packageName} is deprecated`,
                    recommendation: 'Consider using an alternative package'
                };
            }

            // Check framework compatibility
            if (packageInfo.supportedFrameworks && packageInfo.supportedFrameworks.length > 0) {
                const isCompatible = packageInfo.supportedFrameworks.some((fw: string) => 
                    this.matchesFramework(targetFramework, fw)
                );

                if (!isCompatible) {
                    return {
                        packageName,
                        packageVersion,
                        targetFramework,
                        issueType: 'incompatible',
                        message: `Package ${packageName} is not compatible with ${targetFramework}`,
                        recommendation: `This package supports: ${packageInfo.supportedFrameworks.join(', ')}`
                    };
                }
            }

            // If version is specified, check if it exists and is compatible
            if (packageVersion && packageInfo.versions) {
                const versionExists = packageInfo.versions.includes(packageVersion);
                if (!versionExists) {
                    const latestVersion = packageInfo.versions[packageInfo.versions.length - 1];
                    return {
                        packageName,
                        packageVersion,
                        targetFramework,
                        issueType: 'version_mismatch',
                        message: `Package ${packageName} version ${packageVersion} not found`,
                        recommendation: `Latest version is ${latestVersion}`
                    };
                }
            }

            return null; // Compatible
        } catch (error) {
            console.warn(`Failed to check compatibility via API for ${packageName}:`, error);
            return undefined; // API failed, use local rules
        }
    }

    private checkCompatibilityLocal(
        packageName: string,
        packageVersion: string | undefined,
        targetFramework: string
    ): CompatibilityIssue | null {
        const rule = this.findRuleForPackage(packageName);
        if (!rule) {
            // Unknown package - no rule to check
            return null;
        }

        // Check if deprecated version
        if (packageVersion && rule.deprecatedVersions?.includes(packageVersion)) {
            return {
                packageName,
                packageVersion,
                targetFramework,
                issueType: 'deprecated',
                message: `Package ${packageName} version ${packageVersion} is deprecated`,
                recommendation: 'Consider upgrading to a newer version'
            };
        }

        // Check framework compatibility
        const frameworkCompatible = this.isFrameworkCompatible(targetFramework, rule);
        if (!frameworkCompatible) {
            const supportedFrameworks = rule.supportedFrameworks || [];
            return {
                packageName,
                packageVersion,
                targetFramework,
                issueType: 'incompatible',
                message: `Package ${packageName} is not compatible with ${targetFramework}`,
                recommendation: supportedFrameworks.length > 0
                    ? `This package requires one of: ${supportedFrameworks.join(', ')}`
                    : 'Check package documentation for supported frameworks'
            };
        }

        // Check version-specific compatibility
        if (packageVersion && rule.versionRules) {
            const versionIssue = this.checkVersionCompatibility(
                packageName,
                packageVersion,
                targetFramework,
                rule
            );
            if (versionIssue) {
                return versionIssue;
            }
        }

        return null;
    }

    private async fetchPackageInfo(packageName: string, timeout: number): Promise<NuGetPackageInfoExtended | null> {
        return new Promise((resolve) => {
            const url = `https://api.nuget.org/v3-flatcontainer/${packageName.toLowerCase()}/index.json`;
            
            const request = https.get(url, (res) => {
                if (res.statusCode !== 200) {
                    resolve(null);
                    return;
                }

                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const versions = json.versions || [];
                        
                        resolve({
                            packageId: packageName,
                            versions: versions,
                            deprecated: false // Would need additional API call to check
                        } as NuGetPackageInfoExtended);
                    } catch (error) {
                        resolve(null);
                    }
                });
            });

            request.on('error', () => {
                resolve(null);
            });

            request.setTimeout(timeout, () => {
                request.destroy();
                resolve(null);
            });
        });
    }

    private isPackageIgnored(packageName: string): boolean {
        const ignoredPackages = this.config.get<string[]>('nugetIgnoredPackages', []);
        
        for (const pattern of ignoredPackages) {
            // Exact match
            if (pattern === packageName) {
                return true;
            }
            
            // Pattern match (simple wildcard support)
            const regexPattern = pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*');
            
            const regex = new RegExp(`^${regexPattern}$`, 'i');
            if (regex.test(packageName)) {
                return true;
            }
        }
        
        return false;
    }

    private getCachedResult(key: string): CompatibilityIssue | null | undefined {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }

        const expiry = this.config.get<number>('nugetCacheExpiry', 3600) * 1000;
        const now = Date.now();
        
        if (now - entry.timestamp > expiry) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value;
    }

    private setCachedResult(key: string, value: CompatibilityIssue | null): void {
        this.cache.set(key, {
            key,
            value,
            timestamp: Date.now()
        });
    }

    private findRuleForPackage(packageName: string): PackageCompatibilityRule | undefined {
        // First try exact match
        let rule = this.compatibilityRules.find(r => r.packageName === packageName);
        if (rule) {
            return rule;
        }

        // Then try pattern match
        rule = this.compatibilityRules.find(r => 
            r.packageNamePattern && r.packageNamePattern.test(packageName)
        );
        
        return rule;
    }

    private isFrameworkCompatible(
        targetFramework: string,
        rule: PackageCompatibilityRule
    ): boolean {
        if (rule.supportedFrameworks) {
            return rule.supportedFrameworks.some(framework => 
                this.matchesFramework(targetFramework, framework)
            );
        }

        if (rule.minFramework || rule.maxFramework) {
            const versionInfo = this.parseFrameworkVersion(targetFramework);
            if (!versionInfo) {
                return true; // Can't determine, assume compatible
            }

            if (rule.minFramework) {
                const minInfo = this.parseFrameworkVersion(rule.minFramework);
                if (minInfo && this.compareFrameworks(versionInfo, minInfo) < 0) {
                    return false;
                }
            }

            if (rule.maxFramework) {
                const maxInfo = this.parseFrameworkVersion(rule.maxFramework);
                if (maxInfo && this.compareFrameworks(versionInfo, maxInfo) > 0) {
                    return false;
                }
            }
        }

        return true; // No restrictions, assume compatible
    }

    private checkVersionCompatibility(
        packageName: string,
        packageVersion: string,
        targetFramework: string,
        rule: PackageCompatibilityRule
    ): CompatibilityIssue | null {
        if (!rule.versionRules) {
            return null;
        }

        const versionRules = rule.versionRules;
        const frameworkVersion = rule.versionRules.frameworkVersions?.[targetFramework];

        // Check framework-specific version rules
        if (frameworkVersion) {
            if (frameworkVersion.min && this.compareVersions(packageVersion, frameworkVersion.min) < 0) {
                return {
                    packageName,
                    packageVersion,
                    targetFramework,
                    issueType: 'version_mismatch',
                    message: `Package ${packageName} version ${packageVersion} is too old for ${targetFramework}`,
                    recommendation: `Upgrade to at least version ${frameworkVersion.min}`
                };
            }

            if (frameworkVersion.max && this.compareVersions(packageVersion, frameworkVersion.max) > 0) {
                return {
                    packageName,
                    packageVersion,
                    targetFramework,
                    issueType: 'version_mismatch',
                    message: `Package ${packageName} version ${packageVersion} is too new for ${targetFramework}`,
                    recommendation: `Use version ${frameworkVersion.max} or lower`
                };
            }
        }

        // Check global version rules
        if (versionRules.minVersion && this.compareVersions(packageVersion, versionRules.minVersion) < 0) {
            return {
                packageName,
                packageVersion,
                targetFramework,
                issueType: 'version_mismatch',
                message: `Package ${packageName} version ${packageVersion} is too old`,
                recommendation: `Upgrade to at least version ${versionRules.minVersion}`
            };
        }

        if (versionRules.maxVersion && this.compareVersions(packageVersion, versionRules.maxVersion) > 0) {
            return {
                packageName,
                packageVersion,
                targetFramework,
                issueType: 'version_mismatch',
                message: `Package ${packageName} version ${packageVersion} is too new`,
                recommendation: `Use version ${versionRules.maxVersion} or lower`
            };
        }

        return null;
    }

    private matchesFramework(framework1: string, framework2: string): boolean {
        // Exact match
        if (framework1.toLowerCase() === framework2.toLowerCase()) {
            return true;
        }

        // Check if framework types match (net, netcoreapp, netframework, etc.)
        const type1 = this.getFrameworkType(framework1);
        const type2 = this.getFrameworkType(framework2);
        
        if (type1 !== type2) {
            return false;
        }

        // For modern .NET, check if versions are compatible
        if (type1 === 'net' || type1 === 'netcoreapp') {
            const v1 = this.extractVersionNumber(framework1);
            const v2 = this.extractVersionNumber(framework2);
            if (v1 && v2) {
                // Allow minor version differences
                return Math.abs(parseFloat(v1) - parseFloat(v2)) < 1.0;
            }
        }

        return false;
    }

    private getFrameworkType(framework: string): string {
        const lower = framework.toLowerCase();
        if (lower.startsWith('netframework') || lower.match(/^net[1-4]\./)) {
            return 'netframework';
        }
        if (lower.startsWith('netcoreapp')) {
            return 'netcoreapp';
        }
        if (lower.startsWith('netstandard')) {
            return 'netstandard';
        }
        if (lower.startsWith('net')) {
            return 'net';
        }
        return 'unknown';
    }

    private extractVersionNumber(framework: string): string | null {
        const match = framework.match(/(\d+(?:\.\d+)?)/);
        return match ? match[1] : null;
    }

    private parseFrameworkVersion(framework: string): { type: string; version: number } | null {
        const type = this.getFrameworkType(framework);
        const versionStr = this.extractVersionNumber(framework);
        if (!versionStr) {
            return null;
        }
        return { type, version: parseFloat(versionStr) };
    }

    private compareFrameworks(
        fw1: { type: string; version: number },
        fw2: { type: string; version: number }
    ): number {
        if (fw1.type !== fw2.type) {
            return fw1.type.localeCompare(fw2.type);
        }
        return fw1.version - fw2.version;
    }

    private compareVersions(version1: string, version2: string): number {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);
        
        const maxLength = Math.max(v1Parts.length, v2Parts.length);
        
        for (let i = 0; i < maxLength; i++) {
            const v1Part = v1Parts[i] || 0;
            const v2Part = v2Parts[i] || 0;
            
            if (v1Part < v2Part) return -1;
            if (v1Part > v2Part) return 1;
        }
        
        return 0;
    }

    private initializeCompatibilityRules(): PackageCompatibilityRule[] {
        return [
            // ASP.NET Core
            {
                packageName: 'Microsoft.AspNetCore.App',
                supportedFrameworks: ['netcoreapp2.1', 'netcoreapp2.2', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                versionRules: {
                    frameworkVersions: {
                        'netcoreapp2.1': { min: '2.1.0', max: '2.1.x' },
                        'netcoreapp2.2': { min: '2.2.0', max: '2.2.x' },
                        'netcoreapp3.1': { min: '3.1.0', max: '3.1.x' },
                        'net5.0': { min: '5.0.0', max: '5.0.x' },
                        'net6.0': { min: '6.0.0', max: '6.0.x' },
                        'net7.0': { min: '7.0.0', max: '7.0.x' },
                        'net8.0': { min: '8.0.0' }
                    }
                }
            },
            {
                packageName: 'Microsoft.AspNetCore.Mvc',
                supportedFrameworks: ['netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp2.2', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                versionRules: {
                    frameworkVersions: {
                        'netcoreapp2.0': { min: '2.0.0', max: '2.0.x' },
                        'netcoreapp2.1': { min: '2.1.0', max: '2.1.x' },
                        'netcoreapp2.2': { min: '2.2.0', max: '2.2.x' },
                        'netcoreapp3.1': { min: '3.1.0', max: '3.1.x' },
                        'net5.0': { min: '5.0.0', max: '5.0.x' },
                        'net6.0': { min: '6.0.0', max: '6.0.x' },
                        'net7.0': { min: '7.0.0', max: '7.0.x' },
                        'net8.0': { min: '8.0.0' }
                    }
                }
            },
            {
                packageNamePattern: /^Microsoft\.AspNetCore\./,
                supportedFrameworks: ['netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp2.2', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netcoreapp2.0'
            },
            // ASP.NET (classic - only for .NET Framework)
            {
                packageName: 'Microsoft.AspNet.Mvc',
                supportedFrameworks: ['net40', 'net45', 'net451', 'net452', 'net46', 'net461', 'net462', 'net47', 'net471', 'net472', 'net48'],
                maxFramework: 'net48'
            },
            {
                packageName: 'System.Web.Mvc',
                supportedFrameworks: ['net40', 'net45', 'net451', 'net452', 'net46', 'net461', 'net462', 'net47', 'net471', 'net472', 'net48'],
                maxFramework: 'net48'
            },
            {
                packageName: 'Microsoft.AspNet.WebApi',
                supportedFrameworks: ['net40', 'net45', 'net451', 'net452', 'net46', 'net461', 'net462', 'net47', 'net471', 'net472', 'net48'],
                maxFramework: 'net48'
            },
            {
                packageName: 'System.Web.Http',
                supportedFrameworks: ['net40', 'net45', 'net451', 'net452', 'net46', 'net461', 'net462', 'net47', 'net471', 'net472', 'net48'],
                maxFramework: 'net48'
            },
            // Entity Framework
            {
                packageName: 'Microsoft.EntityFrameworkCore',
                supportedFrameworks: ['netstandard2.0', 'netstandard2.1', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard2.0'
            },
            {
                packageName: 'EntityFramework',
                supportedFrameworks: ['net40', 'net45', 'net451', 'net452', 'net46', 'net461', 'net462', 'net47', 'net471', 'net472', 'net48'],
                maxFramework: 'net48',
                versionRules: {
                    frameworkVersions: {
                        'net40': { max: '6.0.0' },
                        'net45': { max: '6.0.0' },
                        'net451': { max: '6.0.0' },
                        'net452': { max: '6.0.0' },
                        'net46': { max: '6.0.0' },
                        'net461': { max: '6.4.4' },
                        'net462': { max: '6.4.4' },
                        'net47': { max: '6.4.4' },
                        'net471': { max: '6.4.4' },
                        'net472': { max: '6.4.4' },
                        'net48': { max: '6.4.4' }
                    }
                }
            },
            {
                packageNamePattern: /^Microsoft\.EntityFrameworkCore\./,
                supportedFrameworks: ['netstandard2.0', 'netstandard2.1', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard2.0'
            },
            // Modern .NET packages (require .NET Core/.NET 5+)
            {
                packageName: 'Microsoft.Extensions.Hosting',
                supportedFrameworks: ['netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netcoreapp2.1'
            },
            {
                packageName: 'Microsoft.Extensions.DependencyInjection',
                supportedFrameworks: ['netstandard1.0', 'netstandard1.1', 'netstandard2.0', 'netcoreapp1.0', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard1.0'
            },
            {
                packageName: 'Microsoft.Extensions.Logging',
                supportedFrameworks: ['netstandard1.1', 'netstandard1.3', 'netstandard2.0', 'netcoreapp1.0', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard1.1'
            },
            {
                packageName: 'Microsoft.Extensions.Configuration',
                supportedFrameworks: ['netstandard1.1', 'netstandard1.3', 'netstandard2.0', 'netcoreapp1.0', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard1.1'
            },
            {
                packageNamePattern: /^Microsoft\.Extensions\./,
                supportedFrameworks: ['netstandard1.0', 'netstandard1.1', 'netstandard2.0', 'netcoreapp1.0', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard1.0'
            },
            // Blazor
            {
                packageName: 'Microsoft.AspNetCore.Components.Web',
                supportedFrameworks: ['netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netcoreapp3.1'
            },
            {
                packageName: 'Microsoft.AspNetCore.Components.WebAssembly',
                supportedFrameworks: ['netstandard2.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard2.1'
            },
            {
                packageNamePattern: /^Microsoft\.AspNetCore\.Components\./,
                supportedFrameworks: ['netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netcoreapp3.1'
            },
            // SignalR
            {
                packageName: 'Microsoft.AspNetCore.SignalR',
                supportedFrameworks: ['netcoreapp2.1', 'netcoreapp2.2', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netcoreapp2.1'
            },
            {
                packageName: 'Microsoft.AspNetCore.SignalR.Client',
                supportedFrameworks: ['netstandard2.0', 'netstandard2.1', 'netcoreapp2.1', 'netcoreapp2.2', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard2.0'
            },
            // gRPC
            {
                packageName: 'Grpc.Net.Client',
                supportedFrameworks: ['netstandard2.1', 'netcoreapp3.0', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard2.1'
            },
            {
                packageName: 'Grpc.AspNetCore',
                supportedFrameworks: ['netcoreapp3.0', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netcoreapp3.0'
            },
            {
                packageNamePattern: /^Grpc\./,
                supportedFrameworks: ['netstandard2.1', 'netcoreapp3.0', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard2.1'
            },
            // JSON
            {
                packageName: 'Newtonsoft.Json',
                supportedFrameworks: ['net20', 'net35', 'net40', 'net45', 'netstandard1.0', 'netstandard1.3', 'netstandard2.0', 'netcoreapp1.0', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'net20'
            },
            {
                packageName: 'System.Text.Json',
                supportedFrameworks: ['netstandard2.0', 'netcoreapp2.1', 'netcoreapp3.0', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard2.0'
            },
            // Testing
            {
                packageName: 'xunit',
                supportedFrameworks: ['netstandard1.1', 'netstandard1.3', 'netstandard2.0', 'netcoreapp1.0', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard1.1'
            },
            {
                packageName: 'NUnit',
                supportedFrameworks: ['netstandard1.6', 'netstandard2.0', 'netcoreapp1.0', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard1.6'
            },
            {
                packageName: 'Moq',
                supportedFrameworks: ['netstandard2.0', 'netstandard2.1', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard2.0'
            },
            // AutoMapper
            {
                packageName: 'AutoMapper',
                supportedFrameworks: ['netstandard2.0', 'netstandard2.1', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard2.0'
            },
            // Serilog
            {
                packageName: 'Serilog',
                supportedFrameworks: ['netstandard1.5', 'netstandard2.0', 'netcoreapp1.0', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard1.5'
            },
            {
                packageNamePattern: /^Serilog\./,
                supportedFrameworks: ['netstandard1.5', 'netstandard2.0', 'netcoreapp1.0', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard1.5'
            },
            // FluentValidation
            {
                packageName: 'FluentValidation',
                supportedFrameworks: ['netstandard2.0', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard2.0'
            },
            // MediatR
            {
                packageName: 'MediatR',
                supportedFrameworks: ['netstandard2.0', 'netstandard2.1', 'netcoreapp2.0', 'netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
                minFramework: 'netstandard2.0'
            },
            // .NET Standard packages (generally compatible)
            {
                packageNamePattern: /^System\./,
                minFramework: 'netstandard1.0'
            }
        ];
    }

    public async checkProjectCompatibility(
        packageReferences: Array<{ Include: string; Version?: string }>,
        targetFramework: string
    ): Promise<CompatibilityIssue[]> {
        const issues: CompatibilityIssue[] = [];

        for (const pkgRef of packageReferences) {
            const issue = await this.checkCompatibility(
                pkgRef.Include,
                pkgRef.Version,
                targetFramework
            );
            if (issue) {
                issues.push(issue);
            }
        }

        return issues;
    }

    public async checkProjectCompatibilityEnhanced(
        packageReferences: Array<{ Include: string; Version?: string }>,
        targetFramework: string
    ): Promise<EnhancedCompatibilityIssue[]> {
        const issues: EnhancedCompatibilityIssue[] = [];

        for (const pkgRef of packageReferences) {
            const baseIssue = await this.checkCompatibility(
                pkgRef.Include,
                pkgRef.Version,
                targetFramework
            );

            if (baseIssue) {
                const enhancedIssue = await this.enhanceIssue(
                    baseIssue,
                    pkgRef.Include,
                    pkgRef.Version,
                    targetFramework
                );
                issues.push(enhancedIssue);
            }
        }

        return issues;
    }

    private async enhanceIssue(
        baseIssue: CompatibilityIssue,
        packageName: string,
        packageVersion: string | undefined,
        targetFramework: string
    ): Promise<EnhancedCompatibilityIssue> {
        const enhanced: EnhancedCompatibilityIssue = {
            ...baseIssue,
            suggestedVersion: undefined,
            alternativePackage: undefined,
            transitiveIssues: []
        };

        // Suggest correct version
        enhanced.suggestedVersion = await this.suggestVersion(
            packageName,
            packageVersion,
            targetFramework
        );

        // Suggest alternative package if incompatible
        if (baseIssue.issueType === 'incompatible') {
            enhanced.alternativePackage = await this.suggestAlternative(
                packageName,
                targetFramework
            );
        }

        // Check transitive dependencies if API is enabled
        if (this.config.get<boolean>('nugetApiEnabled', true) && packageVersion) {
            enhanced.transitiveIssues = await this.checkTransitiveDependencies(
                packageName,
                packageVersion,
                targetFramework
            );
        }

        return enhanced;
    }

    private async suggestVersion(
        packageName: string,
        currentVersion: string | undefined,
        targetFramework: string
    ): Promise<string | undefined> {
        if (!this.config.get<boolean>('nugetApiEnabled', true)) {
            return undefined;
        }

        try {
            const timeout = this.config.get<number>('nugetApiTimeout', 5000);
            const packageInfo = await this.fetchPackageMetadata(packageName, timeout);
            
            if (!packageInfo || !packageInfo.versions || packageInfo.versions.length === 0) {
                return undefined;
            }

            // Get latest version that supports the target framework
            const compatibleVersions = packageInfo.versions.filter((version: string) => {
                // Try to determine if version supports framework
                return this.isVersionCompatibleWithFramework(packageName, version, targetFramework);
            });

            if (compatibleVersions.length > 0) {
                return compatibleVersions[compatibleVersions.length - 1]; // Latest compatible
            }

            // If no compatible version found, suggest latest
            return packageInfo.versions[packageInfo.versions.length - 1];
        } catch (error) {
            console.warn(`Failed to suggest version for ${packageName}:`, error);
            return undefined;
        }
    }

    private async suggestAlternative(
        packageName: string,
        targetFramework: string
    ): Promise<{ name: string; version?: string; reason?: string } | undefined> {
        // Known alternatives
        const alternatives: Record<string, { name: string; reason: string }[]> = {
            'Microsoft.AspNet.Mvc': [
                { name: 'Microsoft.AspNetCore.Mvc', reason: 'Modern ASP.NET Core MVC for .NET Core/.NET 5+' }
            ],
            'System.Web.Mvc': [
                { name: 'Microsoft.AspNetCore.Mvc', reason: 'Modern ASP.NET Core MVC for .NET Core/.NET 5+' }
            ],
            'EntityFramework': [
                { name: 'Microsoft.EntityFrameworkCore', reason: 'Modern Entity Framework Core for .NET Core/.NET 5+' }
            ],
            'Newtonsoft.Json': [
                { name: 'System.Text.Json', reason: 'Built-in JSON serialization in .NET Core/.NET 5+' }
            ]
        };

        const packageAlternatives = alternatives[packageName];
        if (packageAlternatives && packageAlternatives.length > 0) {
            const alternative = packageAlternatives[0];
            
            // Check if alternative is compatible
            const alternativeIssue = await this.checkCompatibility(
                alternative.name,
                undefined,
                targetFramework
            );

            if (!alternativeIssue || alternativeIssue.issueType !== 'incompatible') {
                // Get latest version of alternative
                if (this.config.get<boolean>('nugetApiEnabled', true)) {
                    try {
                        const timeout = this.config.get<number>('nugetApiTimeout', 5000);
                        const altInfo = await this.fetchPackageMetadata(alternative.name, timeout);
                        if (altInfo && altInfo.versions && altInfo.versions.length > 0) {
                            return {
                                name: alternative.name,
                                version: altInfo.versions[altInfo.versions.length - 1],
                                reason: alternative.reason
                            };
                        }
                    } catch (error) {
                        // Fall back to no version
                    }
                }

                return {
                    name: alternative.name,
                    reason: alternative.reason
                };
            }
        }

        return undefined;
    }

    private async checkTransitiveDependencies(
        packageName: string,
        packageVersion: string,
        targetFramework: string
    ): Promise<Array<{ packageName: string; version?: string; message: string }>> {
        const transitiveIssues: Array<{ packageName: string; version?: string; message: string }> = [];

        try {
            const timeout = this.config.get<number>('nugetApiTimeout', 5000);
            const packageMetadata = await this.fetchPackageMetadata(packageName, packageVersion, timeout);
            
            if (!packageMetadata) {
                return transitiveIssues;
            }

            // Check if we have dependencies in the metadata
            const dependencies = packageMetadata.dependencies || [];
            if (dependencies.length === 0) {
                return transitiveIssues;
            }

            for (const dependency of dependencies) {
                // Check if dependency is compatible
                const depVersion = this.extractVersionFromRange(dependency.range);
                const depIssue = await this.checkCompatibility(
                    dependency.id,
                    depVersion,
                    targetFramework
                );

                if (depIssue) {
                    transitiveIssues.push({
                        packageName: dependency.id,
                        version: depVersion,
                        message: depIssue.message
                    });
                }
            }
        } catch (error) {
            console.warn(`Failed to check transitive dependencies for ${packageName}:`, error);
        }

        return transitiveIssues;
    }

    private extractVersionFromRange(range: string | undefined): string | undefined {
        if (!range) {
            return undefined;
        }

        // Extract version from version range like "[1.0.0, 2.0.0)" or "1.0.0"
        const match = range.match(/[\d.]+/);
        return match ? match[0] : undefined;
    }

    private isVersionCompatibleWithFramework(
        packageName: string,
        version: string,
        targetFramework: string
    ): boolean {
        // This is a simplified check - in real implementation, would fetch package metadata
        // For now, we'll use local rules
        const rule = this.findRuleForPackage(packageName);
        if (!rule) {
            return true; // Unknown package, assume compatible
        }

        return this.isFrameworkCompatible(targetFramework, rule);
    }

    private async fetchPackageMetadata(
        packageName: string,
        versionOrTimeout?: string | number,
        timeout?: number
    ): Promise<NuGetPackageInfoExtended | null> {
        let version: string | undefined;
        let apiTimeout: number;

        if (typeof versionOrTimeout === 'number') {
            apiTimeout = versionOrTimeout;
        } else {
            version = versionOrTimeout;
            apiTimeout = timeout || this.config.get<number>('nugetApiTimeout', 5000);
        }

        return new Promise((resolve) => {
            const url = version
                ? `https://api.nuget.org/v3-flatcontainer/${packageName.toLowerCase()}/${version.toLowerCase()}/${packageName.toLowerCase()}.nuspec`
                : `https://api.nuget.org/v3-flatcontainer/${packageName.toLowerCase()}/index.json`;
            
            const request = https.get(url, (res) => {
                if (res.statusCode !== 200) {
                    resolve(null);
                    return;
                }

                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (version) {
                            // Parse NUSPEC XML
                            // Simplified - would need XML parsing
                            const dependencies: PackageDependency[] = [];
                            // Extract dependencies from XML would go here
                            resolve({
                                packageId: packageName,
                                version: version,
                                versions: [version],
                                dependencies: dependencies
                            } as NuGetPackageInfoExtended);
                        } else {
                            // Parse index.json
                            const json = JSON.parse(data);
                            const versions = json.versions || [];
                            
                            resolve({
                                packageId: packageName,
                                version: versions[versions.length - 1] || '',
                                versions: versions
                            } as NuGetPackageInfoExtended);
                        }
                    } catch (error) {
                        resolve(null);
                    }
                });
            });

            request.on('error', () => {
                resolve(null);
            });

            request.setTimeout(apiTimeout, () => {
                request.destroy();
                resolve(null);
            });
        });
    }

    public async reportCompatibilityIssues(issues: CompatibilityIssue[] | EnhancedCompatibilityIssue[]): Promise<void> {
        if (issues.length === 0) {
            return;
        }

        const errorMessages: string[] = [];
        const warningMessages: string[] = [];

        for (const issue of issues) {
            const versionInfo = issue.packageVersion ? ` version ${issue.packageVersion}` : '';
            let fullMessage = issue.message;
            
            // Add suggestions if available (EnhancedCompatibilityIssue)
            if ('suggestedVersion' in issue && issue.suggestedVersion) {
                fullMessage += `\n  💡 Suggested version: ${issue.suggestedVersion}`;
            }
            
            if ('alternativePackage' in issue && issue.alternativePackage) {
                const alt = issue.alternativePackage;
                fullMessage += `\n  🔄 Alternative: ${alt.name}${alt.version ? ` (${alt.version})` : ''}${alt.reason ? ` - ${alt.reason}` : ''}`;
            }
            
            if (issue.recommendation) {
                fullMessage += `\n  📝 Recommendation: ${issue.recommendation}`;
            }
            
            if ('transitiveIssues' in issue && issue.transitiveIssues && issue.transitiveIssues.length > 0) {
                fullMessage += `\n  ⚠️ Transitive dependency issues:`;
                for (const transitiveIssue of issue.transitiveIssues) {
                    fullMessage += `\n    • ${transitiveIssue.packageName}${transitiveIssue.version ? ` ${transitiveIssue.version}` : ''}: ${transitiveIssue.message}`;
                }
            }

            if (issue.issueType === 'incompatible') {
                errorMessages.push(`❌ ${issue.packageName}${versionInfo}: ${fullMessage}`);
            } else {
                warningMessages.push(`⚠️ ${issue.packageName}${versionInfo}: ${fullMessage}`);
            }
        }

        if (errorMessages.length > 0) {
            const errorMsg = `NuGet Compatibility Issues Found:\n\n${errorMessages.join('\n\n')}`;
            vscode.window.showErrorMessage(errorMsg, { modal: false });
            console.error('NuGet Compatibility Checker:', errorMessages);
        }

        if (warningMessages.length > 0) {
            const warningMsg = `NuGet Compatibility Warnings:\n\n${warningMessages.join('\n\n')}`;
            vscode.window.showWarningMessage(warningMsg, { modal: false });
            console.warn('NuGet Compatibility Checker:', warningMessages);
        }
    }

    public clearCache(): void {
        this.cache.clear();
    }

    public async suggestFrameworkUpgrade(
        targetFramework: string,
        packageReferences: Array<{ Include: string; Version?: string }>
    ): Promise<{ suggestedFramework: string; reason: string; packagesSupporting: string[] } | null> {
        // Framework upgrade paths
        const upgradePaths: Record<string, string[]> = {
            'netcoreapp2.0': ['netcoreapp2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
            'netcoreapp2.1': ['netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
            'netcoreapp2.2': ['netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
            'netcoreapp3.0': ['netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
            'netcoreapp3.1': ['net5.0', 'net6.0', 'net7.0', 'net8.0'],
            'net5.0': ['net6.0', 'net7.0', 'net8.0'],
            'net6.0': ['net7.0', 'net8.0'],
            'net7.0': ['net8.0'],
            'netstandard2.0': ['netstandard2.1', 'netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0'],
            'netstandard2.1': ['netcoreapp3.1', 'net5.0', 'net6.0', 'net7.0', 'net8.0']
        };

        const currentFrameworkType = this.getFrameworkType(targetFramework);
        const possibleUpgrades = upgradePaths[targetFramework.toLowerCase()];

        if (!possibleUpgrades || possibleUpgrades.length === 0) {
            return null; // No upgrade path available
        }

        // Check which packages support newer frameworks
        const frameworkSupport: Record<string, string[]> = {};
        for (const upgradeFramework of possibleUpgrades) {
            frameworkSupport[upgradeFramework] = [];
        }

        for (const pkgRef of packageReferences) {
            for (const upgradeFramework of possibleUpgrades) {
                const issue = await this.checkCompatibility(
                    pkgRef.Include,
                    pkgRef.Version,
                    upgradeFramework
                );

                if (!issue || issue.issueType !== 'incompatible') {
                    frameworkSupport[upgradeFramework].push(pkgRef.Include);
                }
            }
        }

        // Find the highest framework where all packages are compatible
        let bestFramework: string | null = null;
        let maxCompatibleCount = 0;

        // Check from highest to lowest framework
        const reversedUpgrades = [...possibleUpgrades].reverse();
        for (const upgradeFramework of reversedUpgrades) {
            const compatibleCount = frameworkSupport[upgradeFramework].length;
            if (compatibleCount === packageReferences.length) {
                bestFramework = upgradeFramework;
                break;
            }
            if (compatibleCount > maxCompatibleCount) {
                maxCompatibleCount = compatibleCount;
                bestFramework = upgradeFramework;
            }
        }

        if (!bestFramework) {
            return null;
        }

        const compatiblePackages = frameworkSupport[bestFramework];
        const compatiblePercentage = (compatiblePackages.length / packageReferences.length) * 100;

        if (compatiblePercentage >= 80) {
            return {
                suggestedFramework: bestFramework,
                reason: compatiblePercentage === 100
                    ? `All packages support ${bestFramework}`
                    : `${compatiblePackages.length} of ${packageReferences.length} packages support ${bestFramework}`,
                packagesSupporting: compatiblePackages
            };
        }

        return null;
    }
}
