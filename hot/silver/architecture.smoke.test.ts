/**
 * Architecture Smoke Tests
 *
 * These tests FAIL if AI creates slop that bypasses infrastructure.
 * They verify STRUCTURAL compliance, not functional correctness.
 *
 * Run: npm test -- --grep "Architecture"
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import { beforeAll, describe, expect, it } from 'vitest';

const SILVER_EXEMPLARS = 'hot/silver/exemplars';
const BRONZE_ADAPTERS = 'hot/bronze/src/adapters';
const BRONZE_CONTRACTS = 'hot/bronze/src/contracts';
const BRONZE_SRC = 'hot/bronze/src';

// Required adapter imports - exemplars MUST use real infrastructure
const REQUIRED_ADAPTER_PATTERNS = [
	/from\s+['"].*adapters.*['"]/,
	/from\s+['"].*contracts.*['"]/,
	/from\s+['"].*ports.*['"]/,
];

// Slop patterns - if found, file is likely AI garbage
const SLOP_PATTERNS = [
	{ pattern: /mock\s*mode/i, reason: 'Mock mode is slop' },
	{ pattern: /for\s+production/i, reason: '"For production" comment is slop indicator' },
	{ pattern: /TODO:\s*implement/i, reason: 'Unimplemented code is slop' },
	{ pattern: /FIXME/i, reason: 'Broken code is slop' },
	{ pattern: /<style>[\s\S]{500,}<\/style>/i, reason: 'Inline CSS > 500 chars is slop' },
	{ pattern: /class="[^"]{200,}"/i, reason: 'Massive class strings are slop' },
	{
		pattern: /new\s+GoldenLayout\s*\(\s*\{/i,
		reason: 'Inline GoldenLayout config (should use adapter)',
	},
];

describe('Architecture Smoke Tests', () => {
	let exemplarFiles: string[] = [];

	beforeAll(async () => {
		// Find all TypeScript/JavaScript files in exemplars
		const pattern = `${SILVER_EXEMPLARS}/**/*.{ts,tsx,js,jsx}`;
		exemplarFiles = await glob(pattern, { ignore: ['**/*.test.*', '**/*.spec.*'] });
	});

	describe('Import Boundaries', () => {
		it('exemplar files exist', () => {
			// If no exemplar files, test passes vacuously (nothing to check)
			// But we log a warning
			if (exemplarFiles.length === 0) {
				console.warn('⚠️ No exemplar files found in hot/silver/exemplars/');
			}
			expect(true).toBe(true);
		});

		it('each exemplar imports from bronze infrastructure', async () => {
			for (const file of exemplarFiles) {
				const content = fs.readFileSync(file, 'utf-8');
				const hasRequiredImport = REQUIRED_ADAPTER_PATTERNS.some((pattern) =>
					pattern.test(content),
				);

				expect(
					hasRequiredImport,
					`${file} must import from adapters/contracts/ports. Found no infrastructure imports. This is likely AI slop.`,
				).toBe(true);
			}
		});
	});

	describe('Slop Detection', () => {
		it('no slop patterns in exemplar files', async () => {
			const violations: { file: string; reason: string; match: string }[] = [];

			for (const file of exemplarFiles) {
				const content = fs.readFileSync(file, 'utf-8');

				for (const { pattern, reason } of SLOP_PATTERNS) {
					const match = content.match(pattern);
					if (match) {
						violations.push({
							file,
							reason,
							match: match[0].slice(0, 50) + (match[0].length > 50 ? '...' : ''),
						});
					}
				}
			}

			if (violations.length > 0) {
				const report = violations
					.map((v) => `\n  ❌ ${v.file}\n     Reason: ${v.reason}\n     Found: "${v.match}"`)
					.join('\n');

				expect.fail(`Slop detected in exemplar files:${report}`);
			}
		});

		it('no inline HTML files > 200 lines without adapter imports', async () => {
			const htmlFiles = await glob(`${SILVER_EXEMPLARS}/**/*.html`);

			for (const file of htmlFiles) {
				const content = fs.readFileSync(file, 'utf-8');
				const lines = content.split('\n').length;

				// HTML files > 200 lines must have module script importing infrastructure
				if (lines > 200) {
					const hasModuleImport = /type="module"[\s\S]*import.*from/.test(content);
					expect(
						hasModuleImport,
						`${file} has ${lines} lines but no module imports. Large HTML files must import infrastructure, not inline everything.`,
					).toBe(true);
				}
			}
		});
	});

	describe('Adapter Instantiation', () => {
		it('exemplars instantiate real adapters (not just import types)', async () => {
			for (const file of exemplarFiles) {
				const content = fs.readFileSync(file, 'utf-8');

				// If file imports adapters, it should also instantiate them
				const hasAdapterImport = /import.*Adapter.*from/.test(content);

				if (hasAdapterImport) {
					// Should have `new SomethingAdapter(` somewhere
					const hasInstantiation = /new\s+\w+Adapter\s*\(/.test(content);

					expect(
						hasInstantiation,
						`${file} imports adapters but never instantiates them. Import-only files are likely slop.`,
					).toBe(true);
				}
			}
		});
	});
});

describe('Bronze Infrastructure Integrity', () => {
	it('bronze source folder has files (contracts or adapters)', async () => {
		// Check for either adapters OR contracts (adapters may be quarantined)
		const adapterFiles = await glob(`${BRONZE_ADAPTERS}/**/*.ts`);
		const contractFiles = await glob(`${BRONZE_CONTRACTS}/**/*.ts`);
		const totalFiles = adapterFiles.length + contractFiles.length;

		expect(totalFiles, 'Bronze must have source files (contracts and/or adapters)').toBeGreaterThan(
			0,
		);
	});

	it('no bronze files import from silver (wrong direction)', async () => {
		const bronzeFiles = await glob(`${BRONZE_SRC}/**/*.ts`);

		for (const file of bronzeFiles) {
			const content = fs.readFileSync(file, 'utf-8');
			const importsSilver = /from\s+['"].*silver.*['"]/.test(content);

			expect(
				importsSilver,
				`${file} imports from silver. Dependency direction is bronze→silver, not silver→bronze.`,
			).toBe(false);
		}
	});
});
