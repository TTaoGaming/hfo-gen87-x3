import * as fs from 'node:fs';
import * as path from 'node:path';
/**
 * Demo Contract Enforcement Tests
 *
 * Gen87.X3 | Port 5 DEFEND | Contract Validation
 *
 * These tests ensure demos use CORRECT adapter APIs.
 * Run with: npx vitest run src/constraints/demo-contract.constraint.test.ts
 *
 * ENFORCEMENT: Tests fail if demos use wrong API signatures.
 */
import { describe, expect, it } from 'vitest';

// ============================================================================
// FORBIDDEN PATTERNS (Reward-hacking signatures)
// ============================================================================

const FORBIDDEN_PATTERNS = [
	{
		pattern: /\.smooth\s*\(\s*\{\s*value\s*:/,
		description: 'smooth({value, ...}) - WRONG! Use smooth(SensorFrame)',
		violation: 'IR-0008',
	},
	{
		pattern: /\.smooth\s*\(\s*\{\s*timestamp\s*:/,
		description: 'smooth({timestamp, ...}) - WRONG! Use smooth(SensorFrame)',
		violation: 'IR-0008',
	},
	{
		pattern: /\.filter\s*\(\s*[^)]+,\s*[^)]+\s*\)/,
		description: '.filter(value, timestamp) - WRONG! OneEuroExemplarAdapter has no filter() method',
		violation: 'IR-0008',
	},
	{
		pattern: /new\s+SimpleOneEuro/,
		description: 'SimpleOneEuroFilter - THEATER CODE! Use real OneEuroExemplarAdapter',
		violation: 'IR-0006',
	},
	{
		pattern: /class\s+.*OneEuro.*\{/,
		description: 'Inline OneEuro class - THEATER CODE! Use real OneEuroExemplarAdapter',
		violation: 'IR-0006',
	},
	{
		pattern: /SenseAdapter\.sense\s*\(/,
		description: 'SenseAdapter.sense() - WRONG! Method does not exist',
		violation: 'IR-0006',
	},
	{
		pattern: /createPalmConeGate\s*\(\s*\)\.process/,
		description: 'createPalmConeGate().process() - WRONG! Use updatePalmConeGate()',
		violation: 'IR-0006',
	},
];

// ============================================================================
// REQUIRED PATTERNS (Correct API signatures)
// ============================================================================

const REQUIRED_PATTERNS = [
	{
		pattern: /createSensorFrameFromMouse\s*\(/,
		description: 'Should use createSensorFrameFromMouse() for mouse input',
		applies_to: ['smoother', 'sensor'],
	},
	{
		pattern: /\.smooth\s*\(\s*\w+\s*\)/,
		description: 'Should call smooth(sensorFrame) with a variable, not inline object',
		applies_to: ['smoother'],
	},
];

// ============================================================================
// TEST UTILITIES
// ============================================================================

function getDemoFiles(): string[] {
	// Resolve from project root, not from this file's location
	const projectRoot = path.resolve(__dirname, '../../../../');
	const demosDir = path.join(projectRoot, 'demos');
	const files: string[] = [];

	if (!fs.existsSync(demosDir)) {
		console.warn(`Demos directory not found at ${demosDir}`);
		return files;
	}

	// Check src/ directory for TypeScript demos
	const srcDir = path.join(demosDir, 'src');
	if (fs.existsSync(srcDir)) {
		fs.readdirSync(srcDir)
			.filter((f) => f.endsWith('.ts'))
			.forEach((f) => files.push(path.join(srcDir, f)));
	}

	// Check root for HTML demos (legacy)
	fs.readdirSync(demosDir)
		.filter((f) => f.endsWith('.html') && !f.includes('index'))
		.forEach((f) => files.push(path.join(demosDir, f)));

	return files;
}

function readFileContent(filePath: string): string {
	return fs.readFileSync(filePath, 'utf-8');
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('CONSTRAINT: Demo Contract Enforcement', () => {
	const demoFiles = getDemoFiles();

	describe('Forbidden Pattern Detection', () => {
		for (const forbidden of FORBIDDEN_PATTERNS) {
			it(`should NOT contain: ${forbidden.description}`, () => {
				const violations: Array<{ file: string; line: number; content: string }> = [];

				for (const file of demoFiles) {
					const content = readFileContent(file);
					const lines = content.split('\n');

					lines.forEach((line, idx) => {
						if (forbidden.pattern.test(line)) {
							violations.push({
								file: path.basename(file),
								line: idx + 1,
								content: line.trim().substring(0, 80),
							});
						}
					});
				}

				if (violations.length > 0) {
					const msg = violations.map((v) => `  ${v.file}:${v.line}: ${v.content}`).join('\n');
					expect.fail(
						`VIOLATION ${forbidden.violation}: ${forbidden.description}\n` + `Found in:\n${msg}`,
					);
				}
			});
		}
	});

	describe('TypeScript Demo Existence', () => {
		it('should have TypeScript demos in demos/src/', () => {
			const projectRoot = path.resolve(__dirname, '../../../../');
			const srcDir = path.join(projectRoot, 'demos/src');
			expect(fs.existsSync(srcDir), 'demos/src/ directory should exist').toBe(true);

			const tsFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith('.ts'));
			expect(tsFiles.length, 'Should have at least one TypeScript demo').toBeGreaterThan(0);
		});

		it('TypeScript demos should import from real adapter modules', () => {
			const projectRoot = path.resolve(__dirname, '../../../../');
			const srcDir = path.join(projectRoot, 'demos/src');
			if (!fs.existsSync(srcDir)) return;

			// Exclude index.ts (navigation page, not a demo)
			const tsFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts');

			for (const file of tsFiles) {
				const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');

				// Should import from the real module, not inline definitions
				const hasRealImport =
					content.includes("from '../../hot/bronze/src") ||
					content.includes('from "../../hot/bronze/src') ||
					content.includes("from '../lib/hfo") ||
					content.includes('from "../lib/hfo');

				expect(hasRealImport, `${file} should import from real adapter module`).toBe(true);
			}
		});
	});

	describe('Type Safety Enforcement', () => {
		it('TypeScript demos that process sensor data should have explicit type annotations', () => {
			const projectRoot = path.resolve(__dirname, '../../../../');
			const srcDir = path.join(projectRoot, 'demos/src');
			if (!fs.existsSync(srcDir)) return;

			// Only check demos that should process sensor frames
			// Exclude: index.ts (nav), port-3-injector (pointer events), showcase-goldenlayout (UI shell)
			const sensorDemos = fs.readdirSync(srcDir).filter((f) => {
				if (!f.endsWith('.ts')) return false;
				// Include files that deal with smoothing or sensors
				return (
					f.includes('smoother') ||
					f.includes('observer') ||
					f.includes('shaper') ||
					f.includes('sensor') ||
					f.includes('port-0') ||
					f.includes('port-2')
				);
			});

			for (const file of sensorDemos) {
				const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');

				// Should have type imports (for demos that process sensor data)
				const hasTypeImport =
					content.includes('type SensorFrame') ||
					content.includes('type SmoothedFrame') ||
					content.includes(': SensorFrame') ||
					content.includes(': SmoothedFrame');

				expect(
					hasTypeImport,
					`${file} should use type annotations for SensorFrame/SmoothedFrame`,
				).toBe(true);
			}
		});
	});
});

describe('AUDIT: Demo Contract Compliance Summary', () => {
	it('should list all demos and their compliance status', () => {
		const demoFiles = getDemoFiles();

		console.log('\n📊 DEMO CONTRACT COMPLIANCE REPORT');
		console.log('═'.repeat(60));

		for (const file of demoFiles) {
			const content = readFileContent(file);
			const filename = path.basename(file);
			const isTypeScript = file.endsWith('.ts');

			const violations: string[] = [];
			for (const forbidden of FORBIDDEN_PATTERNS) {
				if (forbidden.pattern.test(content)) {
					violations.push(forbidden.violation);
				}
			}

			const status = violations.length === 0 ? '✅' : '❌';
			const type = isTypeScript ? '[TS]' : '[JS]';
			const violationStr = violations.length > 0 ? ` (${violations.join(', ')})` : '';

			console.log(`${status} ${type} ${filename}${violationStr}`);
		}

		console.log('═'.repeat(60));
		console.log('TypeScript demos get compile-time enforcement');
		console.log('HTML/JS demos only get runtime pattern detection');
		console.log('');

		// Always pass - this is informational
		expect(true).toBe(true);
	});
});
