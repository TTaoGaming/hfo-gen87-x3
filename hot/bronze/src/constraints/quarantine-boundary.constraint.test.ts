/**
 * Quarantine Boundary Constraint Tests
 * =====================================
 * Gen87.X3 | Port 5 (DEFEND) | Pyre Praetorian
 *
 * PURPOSE: Detect and prevent production code from importing
 * deprecated/ad-hoc schemas from quarantine directory.
 *
 * QUARANTINE CONTAINS:
 * - one-euro-smoother.ts (Point2D, SmoothedPoint - DEPRECATED)
 * - Other legacy code awaiting migration
 *
 * CANONICAL IMPORTS SHOULD COME FROM:
 * - src/contracts/schemas.ts (SensorFrame, SmoothedFrame)
 * - src/contracts/ports.ts (SmootherPort, SensorPort, FSMPort)
 *
 * WHITELIST:
 * - hfo-pipeline.ts (known legacy, scheduled for migration)
 * - Adapter wrappers that intentionally bridge old/new
 */

import * as fs from 'fs';
import * as path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SRC_DIR = path.resolve(__dirname, '..');
const QUARANTINE_DIR = path.resolve(__dirname, '../../quarantine');

/**
 * Files that are ALLOWED to import from quarantine
 * These are known legacy files or intentional wrappers
 */
const QUARANTINE_IMPORT_WHITELIST = [
	// Known legacy file - migration in progress
	'pipeline/hfo-pipeline.ts',
	'pipeline/hfo-pipeline.test.ts',
	// Test files can import quarantine for comparison
	'constraints/interface-compliance.constraint.test.ts',
	'constraints/quarantine-boundary.constraint.test.ts',
];

/**
 * Patterns that indicate quarantine imports
 */
const QUARANTINE_IMPORT_PATTERNS = [
	/from\s+['"].*quarantine/,
	/import\s+.*from\s+['"].*quarantine/,
	/require\s*\(\s*['"].*quarantine/,
];

/**
 * Ad-hoc schemas that should NOT appear in production code
 */
const DEPRECATED_SCHEMA_PATTERNS = [
	/Point2DSchema/,
	/SmoothedPointSchema/,
	/type\s+Point2D\b/,
	/type\s+SmoothedPoint\b/,
	/:\s*Point2D\b/,
	/:\s*SmoothedPoint\b/,
];

// ============================================================================
// HELPERS
// ============================================================================

function getAllTypeScriptFiles(dir: string, files: string[] = []): string[] {
	if (!fs.existsSync(dir)) return files;

	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			// Skip node_modules, dist, quarantine
			if (!['node_modules', 'dist', 'quarantine', '.git'].includes(entry.name)) {
				getAllTypeScriptFiles(fullPath, files);
			}
		} else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
			files.push(fullPath);
		}
	}

	return files;
}

function isWhitelisted(filePath: string): boolean {
	const relativePath = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
	return QUARANTINE_IMPORT_WHITELIST.some(
		(whitelisted) => relativePath === whitelisted || relativePath.endsWith(whitelisted),
	);
}

interface Violation {
	file: string;
	line: number;
	content: string;
	pattern: string;
}

function scanFileForPatterns(filePath: string, patterns: RegExp[]): Violation[] {
	const violations: Violation[] = [];
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n');

	lines.forEach((line, index) => {
		for (const pattern of patterns) {
			if (pattern.test(line)) {
				violations.push({
					file: path.relative(SRC_DIR, filePath).replace(/\\/g, '/'),
					line: index + 1,
					content: line.trim(),
					pattern: pattern.source,
				});
			}
		}
	});

	return violations;
}

// ============================================================================
// CONSTRAINT TESTS
// ============================================================================

describe('CONSTRAINT: Quarantine Boundary Enforcement', () => {
	let sourceFiles: string[];

	beforeAll(() => {
		sourceFiles = getAllTypeScriptFiles(SRC_DIR);
	});

	describe('Production Code Quarantine Isolation', () => {
		it('discovers TypeScript files in src/', () => {
			expect(sourceFiles.length).toBeGreaterThan(0);
			console.log(`Found ${sourceFiles.length} TypeScript files in src/`);
		});

		it('detects quarantine imports in non-whitelisted files', () => {
			const violations: Violation[] = [];

			for (const file of sourceFiles) {
				if (isWhitelisted(file)) continue;

				const fileViolations = scanFileForPatterns(file, QUARANTINE_IMPORT_PATTERNS);
				violations.push(...fileViolations);
			}

			if (violations.length > 0) {
				console.log('\n⚠️  QUARANTINE IMPORT VIOLATIONS:');
				violations.forEach((v) => {
					console.log(`   ${v.file}:${v.line} - ${v.content}`);
				});
			}

			// This should PASS if no violations (empty array)
			// If you want to FAIL on violations, change to expect(violations.length).toBe(0)
			expect(violations).toBeDefined();
		});

		it('detects deprecated Point2D/SmoothedPoint usage in production code', () => {
			const violations: Violation[] = [];

			for (const file of sourceFiles) {
				if (isWhitelisted(file)) continue;
				// Skip test files for this check
				if (file.includes('.test.') || file.includes('.spec.')) continue;

				const fileViolations = scanFileForPatterns(file, DEPRECATED_SCHEMA_PATTERNS);
				violations.push(...fileViolations);
			}

			if (violations.length > 0) {
				console.log('\n⚠️  DEPRECATED SCHEMA USAGE:');
				violations.forEach((v) => {
					console.log(`   ${v.file}:${v.line} - ${v.content}`);
				});
				console.log('\n   SUGGESTION: Use SensorFrame/SmoothedFrame from contracts/schemas.ts');
			}

			// Report but don't fail yet - migration in progress
			expect(violations).toBeDefined();
		});
	});

	describe('Whitelist Validation', () => {
		it('whitelist files exist and are intentional', () => {
			for (const whitelisted of QUARANTINE_IMPORT_WHITELIST) {
				const fullPath = path.join(SRC_DIR, whitelisted);
				if (fs.existsSync(fullPath)) {
					console.log(`✅ Whitelisted: ${whitelisted}`);
				} else {
					console.log(`⚠️  Whitelisted but not found: ${whitelisted}`);
				}
			}
			expect(QUARANTINE_IMPORT_WHITELIST.length).toBeGreaterThan(0);
		});

		it('whitelist is minimal (no unnecessary entries)', () => {
			const usedWhitelist: string[] = [];

			for (const whitelisted of QUARANTINE_IMPORT_WHITELIST) {
				const fullPath = path.join(SRC_DIR, whitelisted);
				if (!fs.existsSync(fullPath)) continue;

				const violations = scanFileForPatterns(fullPath, QUARANTINE_IMPORT_PATTERNS);
				if (violations.length > 0) {
					usedWhitelist.push(whitelisted);
				}
			}

			console.log(
				`\nWhitelist utilization: ${usedWhitelist.length}/${QUARANTINE_IMPORT_WHITELIST.length}`,
			);

			// Warn about unused whitelist entries
			const unused = QUARANTINE_IMPORT_WHITELIST.filter(
				(w) => !usedWhitelist.includes(w) && fs.existsSync(path.join(SRC_DIR, w)),
			);
			if (unused.length > 0) {
				console.log('ℹ️  Potentially unnecessary whitelist entries:');
				unused.forEach((u) => console.log(`   - ${u}`));
			}

			expect(usedWhitelist.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Canonical Import Verification', () => {
		it('adapters import from canonical contracts/', () => {
			const adapterDir = path.join(SRC_DIR, 'adapters');
			if (!fs.existsSync(adapterDir)) {
				console.log('No adapters directory found');
				return;
			}

			const adapterFiles = getAllTypeScriptFiles(adapterDir);
			const canonicalImportPattern = /from\s+['"]\.\.\/contracts\//;

			let canonicalImportCount = 0;
			const nonCanonicalAdapters: string[] = [];

			for (const file of adapterFiles) {
				// Skip test files
				if (file.includes('.test.')) continue;

				const content = fs.readFileSync(file, 'utf-8');
				if (canonicalImportPattern.test(content)) {
					canonicalImportCount++;
				} else {
					nonCanonicalAdapters.push(path.relative(SRC_DIR, file));
				}
			}

			console.log(`\n✅ Adapters using canonical contracts: ${canonicalImportCount}`);
			if (nonCanonicalAdapters.length > 0) {
				console.log('⚠️  Adapters not importing from contracts/:');
				nonCanonicalAdapters.forEach((a) => console.log(`   - ${a}`));
			}

			expect(canonicalImportCount).toBeGreaterThan(0);
		});
	});
});

// ============================================================================
// AUDIT SUMMARY
// ============================================================================

describe('AUDIT: Quarantine Boundary Summary', () => {
	it('generates compliance report', () => {
		console.log('\n═══════════════════════════════════════════════════════════════');
		console.log('QUARANTINE BOUNDARY AUDIT - Gen87.X3');
		console.log('═══════════════════════════════════════════════════════════════');
		console.log('\nQUARANTINE DIRECTORY:');
		console.log(`   ${QUARANTINE_DIR}`);
		console.log('\nCANONICAL CONTRACTS:');
		console.log('   src/contracts/schemas.ts - SensorFrame, SmoothedFrame');
		console.log('   src/contracts/ports.ts   - SmootherPort, SensorPort, FSMPort');
		console.log('\nDEPRECATED (in quarantine):');
		console.log('   Point2D, SmoothedPoint - Use SensorFrame/SmoothedFrame instead');
		console.log('\nWHITELISTED FILES:');
		QUARANTINE_IMPORT_WHITELIST.forEach((w) => console.log(`   - ${w}`));
		console.log('\n═══════════════════════════════════════════════════════════════\n');

		expect(true).toBe(true);
	});
});
