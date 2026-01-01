#!/usr/bin/env npx ts-node
// @ts-nocheck
/**
 * Anti-Theater Gate — HARD ENFORCEMENT
 *
 * Gen87.X3 | Port 5 (Pyre Praetorian) | DEFEND
 *
 * This gate BLOCKS commits that contain hand-rolled exemplar code.
 * AI agents CANNOT be trusted to use adapters. We enforce structurally.
 *
 * BLOCKED PATTERNS:
 * 1. Inline 1€ filter implementation (must use npm 1eurofilter)
 * 2. Inline Rapier physics (must use adapter class)
 * 3. Inline XState machine definition in HTML (must use adapter)
 * 4. Direct RAPIER/OneEuroFilter instantiation in demos (must use adapter)
 *
 * EXIT CODES:
 * 0 = Clean (no theater detected)
 * 1 = Theater detected (commit blocked)
 */

import * as fs from 'fs';
import { glob } from 'glob';

// ============================================================================
// THEATER DETECTION PATTERNS
// ============================================================================

interface TheaterPattern {
	id: string;
	name: string;
	description: string;
	/** Regex to detect the violation */
	pattern: RegExp;
	/** Files to check (glob) */
	fileGlob: string;
	/** Files to EXCLUDE from check */
	excludeGlob?: string[];
	/** Severity: 'block' = fail gate, 'warn' = warning only */
	severity: 'block' | 'warn';
	/** Fix suggestion */
	fix: string;
}

const THEATER_PATTERNS: TheaterPattern[] = [
	// =========================================================================
	// 1€ FILTER VIOLATIONS
	// =========================================================================
	{
		id: 'INLINE_1EURO_CLASS',
		name: 'Inline 1€ Filter Class',
		description: 'Hand-rolled OneEuroFilter class instead of npm package',
		pattern: /class\s+OneEuroFilter\s*\{/,
		fileGlob: 'sandbox/**/*.{ts,js,html}',
		excludeGlob: ['**/node_modules/**', '**/_legacy/**', '**/_archived/**', '**/_staging_for_removal/**', '**/dist/**', '**/adapters/**'],
		severity: 'block',
		fix: "import { OneEuroFilter } from '1eurofilter'",
	},
	{
		id: 'INLINE_1EURO_FUNCTION',
		name: 'Inline 1€ Filter Function',
		description: 'Hand-rolled oneEuroFilter function',
		pattern: /function\s+oneEuroFilter\s*\(/,
		fileGlob: 'sandbox/**/*.{ts,js,html}',
		excludeGlob: ['**/node_modules/**', '**/_legacy/**', '**/_archived/**', '**/_staging_for_removal/**', '**/dist/**', '**/adapters/**'],
		severity: 'block',
		fix: "import { OneEuroFilter } from '1eurofilter'",
	},
	{
		id: 'INLINE_1EURO_MATH',
		name: 'Inline 1€ Filter Math',
		description: 'Raw 1€ filter math (alpha, dcutoff) outside adapter',
		pattern: /const\s+(?:alpha|dcutoff|edcutoff)\s*=.*Math\./,
		fileGlob: 'sandbox/demos/**/*.html',
		excludeGlob: ['**/_legacy/**', '**/_archived/**', '**/_staging_for_removal/**'],
		severity: 'block',
		fix: "Use OneEuroExemplarAdapter from '../adapters'",
	},

	// =========================================================================
	// RAPIER VIOLATIONS
	// =========================================================================
	{
		id: 'INLINE_RAPIER_WORLD',
		name: 'Inline Rapier World Creation in Demo',
		description: 'Direct RAPIER.World creation in HTML demos',
		pattern: /new\s+RAPIER\.World\s*\(/,
		fileGlob: 'sandbox/demos/**/*.html',
		excludeGlob: ['**/_legacy/**', '**/_archived/**', '**/_staging_for_removal/**'],
		severity: 'block',
		fix: "Use RapierPhysicsAdapter from '../adapters'",
	},
	{
		id: 'INLINE_RAPIER_BODY',
		name: 'Inline Rapier Body Creation in Demo',
		description: 'Direct createRigidBody in HTML demos',
		pattern: /\.createRigidBody\s*\(/,
		fileGlob: 'sandbox/demos/**/*.html',
		excludeGlob: ['**/_legacy/**', '**/_archived/**', '**/_staging_for_removal/**'],
		severity: 'block',
		fix: "Use RapierPhysicsAdapter from '../adapters'",
	},
	{
		id: 'INLINE_SPRING_DAMPER',
		name: 'Inline Spring-Damper Math',
		description: 'Hand-rolled spring-damper physics',
		pattern: /(?:stiffness|springConstant|damping)\s*\*\s*(?:dx|dy|delta)/,
		fileGlob: 'sandbox/demos/**/*.html',
		excludeGlob: ['**/_legacy/**', '**/_archived/**', '**/_staging_for_removal/**'],
		severity: 'block',
		fix: "Use RapierPhysicsAdapter with mode='smoothed'",
	},

	// =========================================================================
	// XSTATE VIOLATIONS
	// =========================================================================
	{
		id: 'INLINE_XSTATE_MACHINE',
		name: 'Inline XState Machine in Demo',
		description: 'Direct createMachine/setup in HTML demos',
		pattern: /(?:createMachine|setup)\s*\(\s*\{[\s\S]*states\s*:/,
		fileGlob: 'sandbox/demos/**/*.html',
		excludeGlob: ['**/_legacy/**', '**/_archived/**', '**/_staging_for_removal/**'],
		severity: 'block',
		fix: "Use XStateFSMAdapter from '../adapters'",
	},
	{
		id: 'INLINE_STATE_SWITCH',
		name: 'Inline State Machine (switch)',
		description: 'Hand-rolled state machine with switch statement',
		pattern: /switch\s*\(\s*(?:state|currentState|gestureState)\s*\)/,
		fileGlob: 'sandbox/demos/**/*.html',
		excludeGlob: ['**/_legacy/**', '**/_archived/**', '**/_staging_for_removal/**'],
		severity: 'warn',
		fix: 'Consider using XStateFSMAdapter for proper FSM',
	},

	// =========================================================================
	// ADAPTER BYPASS VIOLATIONS
	// =========================================================================
	{
		id: 'DEMO_DIRECT_NPM_IMPORT',
		name: 'Demo Imports NPM Directly',
		description: 'Demo HTML imports npm package instead of adapter',
		pattern: /import\s+.*from\s+['"](?:1eurofilter|@dimforge\/rapier|xstate)['"]/,
		fileGlob: 'sandbox/demos/production/**/*.html',
		excludeGlob: ['**/_legacy/**', '**/_archived/**', '**/_staging_for_removal/**'],
		severity: 'block',
		fix: "Import from '../src/adapters' bundle instead",
	},
	{
		id: 'DEMO_CDN_DIRECT_USAGE',
		name: 'Demo Uses CDN Package Directly',
		description: 'Demo creates instances from CDN imports instead of adapters',
		pattern: /(?:new\s+OneEuroFilter|RAPIER\.init|createMachine)\s*\(/,
		fileGlob: 'sandbox/demos/production/**/*.html',
		excludeGlob: ['**/_legacy/**', '**/_archived/**', '**/_staging_for_removal/**'],
		severity: 'block',
		fix: 'Use pre-built adapter bundle that wraps npm packages',
	},

	// =========================================================================
	// MEDIAPIPE VIOLATIONS
	// =========================================================================
	{
		id: 'INLINE_MEDIAPIPE_PROCESSING',
		name: 'Inline MediaPipe Result Processing',
		description: 'Direct landmarks[8] access in demo instead of adapter',
		pattern: /(?:landmarks|handLandmarks)\s*\[\s*8\s*\]/,
		fileGlob: 'sandbox/demos/production/**/*.html',
		excludeGlob: [],
		severity: 'warn',
		fix: 'Use MediaPipeAdapter.getSensorFrame() instead',
	},
];

// ============================================================================
// DETECTION ENGINE
// ============================================================================

interface Violation {
	pattern: TheaterPattern;
	file: string;
	line: number;
	match: string;
}

async function detectTheater(): Promise<Violation[]> {
	const violations: Violation[] = [];

	for (const pattern of THEATER_PATTERNS) {
		const files = await glob(pattern.fileGlob, {
			cwd: process.cwd(),
			ignore: pattern.excludeGlob || [],
		});

		for (const file of files) {
			const content = fs.readFileSync(file, 'utf-8');
			const lines = content.split('\n');

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const match = line.match(pattern.pattern);
				if (match) {
					violations.push({
						pattern,
						file,
						line: i + 1,
						match: match[0],
					});
				}
			}
		}
	}

	return violations;
}

// ============================================================================
// REPORTING
// ============================================================================

function reportViolations(violations: Violation[]): void {
	const blockers = violations.filter((v) => v.pattern.severity === 'block');
	const warnings = violations.filter((v) => v.pattern.severity === 'warn');

	console.log('\n' + '═'.repeat(80));
	console.log('🎭 ANTI-THEATER GATE — Gen87.X3 Pyre Praetorian');
	console.log('═'.repeat(80));

	if (blockers.length > 0) {
		console.log('\n🔴 BLOCKING VIOLATIONS (commit will be rejected):\n');
		for (const v of blockers) {
			console.log(`  ❌ ${v.pattern.id}`);
			console.log(`     File: ${v.file}:${v.line}`);
			console.log(`     Match: "${v.match}"`);
			console.log(`     Fix: ${v.pattern.fix}`);
			console.log('');
		}
	}

	if (warnings.length > 0) {
		console.log('\n🟡 WARNINGS (consider fixing):\n');
		for (const v of warnings) {
			console.log(`  ⚠️  ${v.pattern.id}`);
			console.log(`     File: ${v.file}:${v.line}`);
			console.log(`     Match: "${v.match}"`);
			console.log(`     Fix: ${v.pattern.fix}`);
			console.log('');
		}
	}

	console.log('─'.repeat(80));
	console.log(
		`Summary: ${blockers.length} blockers, ${warnings.length} warnings`
	);

	if (blockers.length === 0 && warnings.length === 0) {
		console.log('✅ No theater detected. Code is honest.');
	}

	console.log('═'.repeat(80) + '\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
	const violations = await detectTheater();
	reportViolations(violations);

	const blockers = violations.filter((v) => v.pattern.severity === 'block');

	// JSON output for CI integration
	if (process.argv.includes('--json')) {
		console.log(JSON.stringify({ violations, blockers: blockers.length }, null, 2));
	}

	// Exit with error if blockers found
	if (blockers.length > 0) {
		process.exit(1);
	}
}

main().catch((err) => {
	console.error('Anti-theater gate error:', err);
	process.exit(1);
});
