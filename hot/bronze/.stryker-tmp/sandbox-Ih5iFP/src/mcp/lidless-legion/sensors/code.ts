/**
 * Code Sensor - Workspace File Search
 * Part of Lidless Legion Sensor Mesh
 *
 * Searches TypeScript/JavaScript files in workspace
 */
// @ts-nocheck


import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SenseResult, SensorAdapter } from '../contracts.js';
import { DEFAULT_CONFIG } from '../contracts.js';

export class CodeSensor implements SensorAdapter {
	name = 'code' as const;
	private workspaceRoot: string;

	constructor(workspaceRoot?: string) {
		this.workspaceRoot = workspaceRoot || DEFAULT_CONFIG.WORKSPACE_ROOT;
	}

	async sense(
		query: string,
		limit: number,
		options?: Record<string, unknown>,
	): Promise<SenseResult[]> {
		const pattern = (options?.codePattern as string) || '**/*.{ts,js,md}';
		const results: SenseResult[] = [];
		const searchTerms = query.toLowerCase().split(/\s+/);

		try {
			const files = await this.findFiles(this.workspaceRoot, pattern, limit * 10);

			for (const filepath of files) {
				if (results.length >= limit) break;

				try {
					const content = await fs.promises.readFile(filepath, 'utf-8');
					const lowerContent = content.toLowerCase();

					// Simple relevance scoring based on term frequency
					let score = 0;
					for (const term of searchTerms) {
						const matches = (lowerContent.match(new RegExp(term, 'g')) || []).length;
						score += matches;
					}

					if (score > 0) {
						// Extract snippet around first match
						const firstTerm = searchTerms[0];
						const matchIndex = lowerContent.indexOf(firstTerm);
						const start = Math.max(0, matchIndex - 100);
						const end = Math.min(content.length, matchIndex + 400);
						const snippet = content.substring(start, end);

						results.push({
							source: 'code',
							title: path.basename(filepath),
							content: snippet,
							filepath: path.relative(this.workspaceRoot, filepath),
							score: Math.min(1, score / 10),
							metadata: {
								fullPath: filepath,
								size: content.length,
							},
						});
					}
				} catch {
					// Skip files that can't be read
				}
			}

			// Sort by score descending
			results.sort((a, b) => b.score - a.score);
			return results.slice(0, limit);
		} catch (error) {
			console.error('[CodeSensor] Error:', error);
			return [];
		}
	}

	private async findFiles(dir: string, pattern: string, maxFiles: number): Promise<string[]> {
		const files: string[] = [];
		const extensions = this.extractExtensions(pattern);

		const walk = async (currentDir: string) => {
			if (files.length >= maxFiles) return;

			try {
				const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

				for (const entry of entries) {
					if (files.length >= maxFiles) return;

					const fullPath = path.join(currentDir, entry.name);

					// Skip node_modules, .git, dist
					if (entry.isDirectory()) {
						if (
							!['node_modules', '.git', 'dist', 'coverage', 'playwright-report'].includes(
								entry.name,
							)
						) {
							await walk(fullPath);
						}
					} else if (entry.isFile()) {
						const ext = path.extname(entry.name).toLowerCase();
						if (extensions.includes(ext)) {
							files.push(fullPath);
						}
					}
				}
			} catch {
				// Skip directories that can't be read
			}
		};

		await walk(dir);
		return files;
	}

	private extractExtensions(pattern: string): string[] {
		// Extract extensions from glob pattern like "**/*.{ts,js,md}"
		const match = pattern.match(/\*\.{([^}]+)}/);
		if (match) {
			return match[1].split(',').map((ext) => `.${ext.trim()}`);
		}
		// Default extensions
		return ['.ts', '.js', '.md'];
	}
}
