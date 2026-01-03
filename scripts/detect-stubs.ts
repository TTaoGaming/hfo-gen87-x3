#!/usr/bin/env npx ts-node
/**
 * STUB DETECTION SCRIPT
 *
 * Scans test files for stub patterns that masquerade as GREEN tests.
 * These are tests that pass by expecting `toThrow('Not implemented')`.
 *
 * This is a REWARD HACK pattern - AI creates tests that "pass" without
 * actually validating behavior.
 *
 * Usage:
 *   npx ts-node scripts/detect-stubs.ts
 *   npm run detect:stubs
 *
 * TRL Lineage: Custom enforcement tool for HIVE/8 V-phase gate
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StubMatch {
	file: string;
	line: number;
	content: string;
	pattern: 'toThrow-not-impl' | 'throw-not-impl' | 'todo' | 'skip';
}

interface StubReport {
	timestamp: string;
	totalStubs: number;
	byFile: Record<string, number>;
	byPattern: Record<string, number>;
	matches: StubMatch[];
}

const STUB_PATTERNS = [
	{ name: 'toThrow-not-impl', regex: /toThrow\s*\(\s*['"`].*[Nn]ot.?implemented/g },
	{ name: 'throw-not-impl', regex: /throw new Error\s*\(\s*['"`].*[Nn]ot.?implemented/g },
	{ name: 'todo', regex: /\.todo\s*\(/g },
	{ name: 'skip', regex: /\.(skip|only)\s*\(/g },
];

async function scanFile(filePath: string): Promise<StubMatch[]> {
	const matches: StubMatch[] = [];
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n');

	lines.forEach((line, index) => {
		for (const pattern of STUB_PATTERNS) {
			if (pattern.regex.test(line)) {
				matches.push({
					file: path.basename(filePath),
					line: index + 1,
					content: line.trim().substring(0, 100),
					pattern: pattern.name as StubMatch['pattern'],
				});
				// Reset regex lastIndex for global patterns
				pattern.regex.lastIndex = 0;
			}
		}
	});

	return matches;
}

async function findTestFiles(dir: string): Promise<string[]> {
	const files: string[] = [];

	function walk(currentDir: string) {
		const entries = fs.readdirSync(currentDir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name);

			if (entry.isDirectory() && !entry.name.includes('node_modules')) {
				walk(fullPath);
			} else if (
				entry.isFile() &&
				(entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts'))
			) {
				files.push(fullPath);
			}
		}
	}

	walk(dir);
	return files;
}

async function generateReport(searchDir: string): Promise<StubReport> {
	const testFiles = await findTestFiles(searchDir);
	const allMatches: StubMatch[] = [];
	const byFile: Record<string, number> = {};
	const byPattern: Record<string, number> = {
		'toThrow-not-impl': 0,
		'throw-not-impl': 0,
		todo: 0,
		skip: 0,
	};

	for (const file of testFiles) {
		const matches = await scanFile(file);
		if (matches.length > 0) {
			allMatches.push(...matches);
			byFile[path.basename(file)] = matches.length;

			for (const match of matches) {
				byPattern[match.pattern]++;
			}
		}
	}

	return {
		timestamp: new Date().toISOString(),
		totalStubs: allMatches.length,
		byFile,
		byPattern,
		matches: allMatches,
	};
}

function printReport(report: StubReport) {
	console.log('\n╔════════════════════════════════════════════════════════════╗');
	console.log('║              STUB DETECTION REPORT                         ║');
	console.log('║           HIVE/8 V-Phase Gate Check                        ║');
	console.log('╚════════════════════════════════════════════════════════════╝\n');

	console.log(`Timestamp: ${report.timestamp}`);
	console.log(`Total stub patterns detected: ${report.totalStubs}\n`);

	console.log('─── By Pattern ───');
	for (const [pattern, count] of Object.entries(report.byPattern)) {
		const status = count > 0 ? '🔴' : '✅';
		console.log(`  ${status} ${pattern}: ${count}`);
	}

	console.log('\n─── By File (Top 10) ───');
	const sortedFiles = Object.entries(report.byFile)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 10);

	for (const [file, count] of sortedFiles) {
		console.log(`  ${file}: ${count} stubs`);
	}

	if (report.totalStubs > 0) {
		console.log('\n⚠️  STUB MASQUERADE DETECTED');
		console.log('   These tests pass but do not validate behavior.');
		console.log('   Convert to it.todo() for honest RED status.\n');

		console.log('─── Recommended Actions ───');
		console.log('  1. Convert toThrow("Not implemented") to it.todo()');
		console.log('  2. Implement actual test assertions');
		console.log('  3. Run: npm run stubs:convert\n');

		// Exit with error code for CI/pre-commit
		process.exitCode = 1;
	} else {
		console.log('\n✅ No stub patterns detected. Tests are honest.\n');
	}
}

// Main execution
const searchDir = process.argv[2] || path.join(__dirname, '..', 'hot', 'bronze', 'src');

generateReport(searchDir).then((report) => {
	printReport(report);

	// Write JSON report for tooling
	const reportPath = path.join(__dirname, '..', 'hot', 'bronze', 'stub-report.json');
	fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
	console.log(`Full report written to: ${reportPath}`);
});
