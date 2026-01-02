#!/usr/bin/env npx ts-node
/**
 * Pre-commit hook: Check for magic numbers without provenance
 *
 * RULES:
 * 1. Numeric literals (0.xxx) in production code MUST have @source JSDoc
 * 2. OR must be imported from magic-numbers.ts
 * 3. Test files are EXEMPT (test data doesn't need provenance)
 *
 * @source Internal HFO tooling
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

// Patterns to detect magic numbers
const MAGIC_NUMBER_PATTERNS = [
	// Decimal numbers like 0.007, 0.002, 0.125
	/(?<![\w.])0\.\d{2,}(?!\d)/g,
	// Small decimals that aren't 0.0 or 0.5
	/(?<![\w.])0\.[1-46-9]\d*(?!\d)/g,
];

// Files/patterns to skip
const SKIP_PATTERNS = [
	/\.test\.ts$/,
	/\.spec\.ts$/,
	/test\//,
	/tests\//,
	/__tests__\//,
	/magic-numbers\.ts$/, // The registry itself
	/MAGIC_NUMBERS_REGISTRY\.md$/,
	/node_modules/,
	/dist\//,
	/\.d\.ts$/,
];

// JSDoc tags that provide provenance
const PROVENANCE_TAGS = ['@source', '@citation', '@see'];

interface Violation {
	file: string;
	line: number;
	column: number;
	value: string;
	context: string;
}

function shouldSkipFile(filePath: string): boolean {
	return SKIP_PATTERNS.some((pattern) => pattern.test(filePath));
}

function hasProvenanceComment(content: string, matchIndex: number): boolean {
	// Look backwards for JSDoc comment
	const beforeMatch = content.substring(0, matchIndex);
	const lines = beforeMatch.split('\n');

	// Check last 10 lines for JSDoc with provenance
	const recentLines = lines.slice(-10).join('\n');

	return PROVENANCE_TAGS.some((tag) => recentLines.includes(tag));
}

function isInImportStatement(content: string, matchIndex: number): boolean {
	const beforeMatch = content.substring(0, matchIndex);
	const lastNewline = beforeMatch.lastIndexOf('\n');
	const line = beforeMatch.substring(lastNewline + 1);
	return line.includes('import ') || line.includes('from ');
}

function isInComment(content: string, matchIndex: number): boolean {
	const beforeMatch = content.substring(0, matchIndex);
	const lastNewline = beforeMatch.lastIndexOf('\n');
	const line = beforeMatch.substring(lastNewline + 1);

	// Single line comment
	if (line.includes('//')) {
		const commentStart = line.indexOf('//');
		const matchColumn = matchIndex - lastNewline - 1;
		if (commentStart < matchColumn) return true;
	}

	// Block comment (rough check)
	const blockCommentStart = beforeMatch.lastIndexOf('/*');
	const blockCommentEnd = beforeMatch.lastIndexOf('*/');
	if (blockCommentStart > blockCommentEnd) return true;

	return false;
}

function checkFile(filePath: string): Violation[] {
	const violations: Violation[] = [];
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n');

	for (const pattern of MAGIC_NUMBER_PATTERNS) {
		pattern.lastIndex = 0;
		let match = pattern.exec(content);

		while (match !== null) {
			const matchIndex = match.index;
			const value = match[0];

			// Skip if in import statement
			if (isInImportStatement(content, matchIndex)) {
				match = pattern.exec(content);
				continue;
			}

			// Skip if in comment
			if (isInComment(content, matchIndex)) {
				match = pattern.exec(content);
				continue;
			}

			// Skip if has provenance
			if (hasProvenanceComment(content, matchIndex)) {
				match = pattern.exec(content);
				continue;
			}

			// Calculate line and column
			const beforeMatch = content.substring(0, matchIndex);
			const lineNumber = beforeMatch.split('\n').length;
			const lastNewline = beforeMatch.lastIndexOf('\n');
			const column = matchIndex - lastNewline;

			// Get context line
			const contextLine = lines[lineNumber - 1] || '';

			violations.push({
				file: filePath,
				line: lineNumber,
				column,
				value,
				context: contextLine.trim(),
			});

			match = pattern.exec(content);
		}
	}

	return violations;
}

async function main(): Promise<void> {
	console.log('🔍 Checking for magic numbers without provenance...\n');

	const files = await glob('hot/**/src/**/*.ts', {
		ignore: ['**/node_modules/**', '**/dist/**'],
	});

	const allViolations: Violation[] = [];

	for (const file of files) {
		if (shouldSkipFile(file)) continue;

		const violations = checkFile(file);
		allViolations.push(...violations);
	}

	if (allViolations.length === 0) {
		console.log('✅ No magic numbers without provenance found!\n');
		process.exit(0);
	}

	console.log(`❌ Found ${allViolations.length} magic number(s) without provenance:\n`);

	for (const v of allViolations) {
		console.log(`  ${v.file}:${v.line}:${v.column}`);
		console.log(`    Value: ${v.value}`);
		console.log(`    Context: ${v.context}`);
		console.log('');
	}

	console.log('💡 To fix:');
	console.log('   1. Import from hot/bronze/src/constants/magic-numbers.ts');
	console.log('   2. OR add JSDoc with @source tag above the constant');
	console.log('   3. See MAGIC_NUMBERS_REGISTRY.md for documentation\n');

	process.exit(1);
}

main().catch(console.error);
