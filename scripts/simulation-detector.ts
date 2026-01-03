#!/usr/bin/env tsx
/**
 * Simulation Detector - Pre-commit Gate for Theater Code
 *
 * Gen87.X3 | Port 5 DEFEND | Anti-Theater Enforcement
 *
 * Detects and BLOCKS code that simulates architecture instead of using it.
 * This is a MACHINE ENFORCEABLE constraint per TTao's requirements.
 *
 * FORBIDDEN PATTERNS (IR-0006 PLACEHOLDER_CODE):
 * 1. Math.random() in showcase/demo files (fake data instead of real pipeline)
 * 2. Inline filter/smoother classes (bypass real adapters)
 * 3. Canvas animations without adapter connections
 * 4. Hardcoded coordinate values (bypass SensorFrame contract)
 *
 * @port 5
 * @verb DEFEND
 * @binary 101
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================================
// SIMULATION PATTERNS - These indicate THEATER CODE
// ============================================================================

interface SimulationPattern {
	name: string;
	pattern: RegExp;
	severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
	violation: string;
	description: string;
	fix: string;
}

const SIMULATION_PATTERNS: SimulationPattern[] = [
	// CRITICAL: Data simulation instead of real pipeline
	{
		name: 'RANDOM_DATA_SIMULATION',
		pattern: /Math\.random\s*\(\s*\)/,
		severity: 'CRITICAL',
		violation: 'IR-0006',
		description: 'Using Math.random() to simulate data instead of real sensor input',
		fix: 'Use MediaPipeAdapter.sense() or createSensorFrameFromMouse() for real data',
	},
	{
		name: 'HARDCODED_COORDINATES',
		pattern: /(?:x|y)\s*[:=]\s*(?:0\.\d+|150|100|200|300)\s*[+\-*]/,
		severity: 'CRITICAL',
		violation: 'IR-0006',
		description: 'Hardcoded coordinate arithmetic instead of SensorFrame',
		fix: 'Process data through SmootherPort.smooth(SensorFrame) pipeline',
	},

	// CRITICAL: Inline adapter bypass
	{
		name: 'INLINE_FILTER_CLASS',
		pattern: /class\s+\w*(?:Filter|Smoother|Euro)\w*\s*\{/,
		severity: 'CRITICAL',
		violation: 'IR-0006',
		description: 'Inline filter/smoother class bypasses real adapter',
		fix: 'Import and use OneEuroExemplarAdapter or RapierPhysicsAdapter from lib/hfo.js',
	},
	{
		name: 'INLINE_FSM_SWITCH',
		pattern: /switch\s*\(\s*(?:state|currentState|fsmState)\s*\)\s*\{/,
		severity: 'HIGH',
		violation: 'IR-0006',
		description: 'Inline FSM switch statement instead of XStateFSMAdapter',
		fix: 'Use XStateFSMAdapter for state machine logic',
	},

	// HIGH: Fake smoothing formulas
	{
		name: 'FAKE_SMOOTHING',
		pattern: /lastSmooth\s*[=+]\s*(?:\d+\.\d+|\w+)\s*\*\s*\(\s*(?:noise|value|input)/,
		severity: 'HIGH',
		violation: 'IR-0006',
		description: 'Inline smoothing formula instead of real adapter',
		fix: 'Use OneEuroExemplarAdapter.smooth(sensorFrame) for proper 1€ filtering',
	},
	{
		name: 'FAKE_LERP_SMOOTHING',
		pattern: /(?:lerp|interpolate)\s*\(\s*\w+\s*,\s*\w+\s*,\s*(?:0\.\d+|alpha|t)\s*\)/,
		severity: 'MEDIUM',
		violation: 'IR-0006',
		description: 'Basic lerp instead of proper smoothing algorithm',
		fix: 'Use OneEuroExemplarAdapter (adaptive) or RapierPhysicsAdapter (physics-based)',
	},

	// HIGH: Animation without adapter connection
	{
		name: 'ORPHAN_RAF_ANIMATION',
		pattern: /requestAnimationFrame\s*\(\s*(?:animate|draw|render|loop)\s*\)/,
		severity: 'CRITICAL',
		violation: 'IR-0008',
		description: 'Animation loop may not be connected to real adapter pipeline',
		fix: 'Ensure animation consumes SmoothedFrame from adapter pipeline',
	},

	// MEDIUM: Canvas drawing with magic numbers
	{
		name: 'CANVAS_MAGIC_NUMBERS',
		pattern: /ctx\.(?:arc|moveTo|lineTo)\s*\(\s*\d+\s*[+\-*]/,
		severity: 'MEDIUM',
		violation: 'IR-0006',
		description: 'Canvas drawing with hardcoded positions',
		fix: 'Use normalized [0,1] coordinates from SmoothedFrame',
	},

	// MEDIUM: setTimeout/setInterval for data (should use RxJS/adapters)
	{
		name: 'INTERVAL_DATA_SIMULATION',
		pattern: /setInterval\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*(?:x|y|value|data)\s*[=+]/,
		severity: 'MEDIUM',
		violation: 'IR-0006',
		description: 'setInterval generating fake data',
		fix: 'Use InMemorySubstrateAdapter for message bus, real sensor for data',
	},
];

// ============================================================================
// ALLOWLIST - Files/patterns that are ALLOWED to use simulation
// ============================================================================

const ALLOWLIST = [
	// Test files can use simulation for fixtures
	/\.test\.ts$/,
	/\.spec\.ts$/,
	// Benchmark files need controlled input
	/benchmark/i,
	// Archive is historical
	/archive/i,
	/cold\//,
	// Stryker sandbox
	/\.stryker-tmp/,
	// The detector itself
	/simulation-detector\.ts$/,
	// Constraint tests
	/\.constraint\.test\.ts$/,
	// Showcase launcher (visualization code, not simulation)
	// This file renders UI components, not fake data
	/showcase-launcher\.ts$/,
];

// ============================================================================
// DETECTION ENGINE
// ============================================================================

import { execSync } from 'node:child_process';

interface Violation {
	file: string;
	line: number;
	column: number;
	pattern: SimulationPattern;
	match: string;
}

function isAllowlisted(filePath: string): boolean {
	return ALLOWLIST.some((pattern) => pattern.test(filePath));
}

function detectSimulations(filePath: string, content: string): Violation[] {
	const violations: Violation[] = [];
	const lines = content.split('\n');

	// Skip allowlisted files
	if (isAllowlisted(filePath)) {
		return violations;
	}

	// Only check demo/showcase files
	const isDemoFile =
		/demos?\//i.test(filePath) || /showcase/i.test(filePath) || /exemplar/i.test(filePath);

	if (!isDemoFile) {
		return violations;
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Skip full comment lines
		if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
			continue;
		}

		// Strip inline comments before checking for patterns
		// Handle both Unix (\n) and Windows (\r\n) line endings
		const codeOnly = line
			.replace(/\/\/.*$/m, '')
			.replace(/\/\*.*?\*\//g, '')
			.replace(/\r$/, '');

		for (const pattern of SIMULATION_PATTERNS) {
			const match = codeOnly.match(pattern.pattern);
			if (match) {
				violations.push({
					file: filePath,
					line: i + 1,
					column: match.index || 0,
					pattern,
					match: match[0],
				});
			}
		}
	}

	return violations;
}

function scanDirectory(dir: string): Violation[] {
	const violations: Violation[] = [];

	if (!fs.existsSync(dir)) {
		return violations;
	}

	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			// Skip node_modules, dist, etc.
			if (['node_modules', 'dist', '.git', '.stryker-tmp'].includes(entry.name)) {
				continue;
			}
			violations.push(...scanDirectory(fullPath));
		} else if (entry.isFile() && /\.(ts|js|tsx|jsx)$/.test(entry.name)) {
			const content = fs.readFileSync(fullPath, 'utf-8');
			violations.push(...detectSimulations(fullPath, content));
		}
	}

	return violations;
}

function scanStagedFiles(): Violation[] {
	const violations: Violation[] = [];

	// Get staged files from git
	let stagedFiles: string[];

	try {
		const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
		stagedFiles = output.trim().split('\n').filter(Boolean);
	} catch {
		console.warn('Could not get staged files from git');
		return violations;
	}

	for (const file of stagedFiles) {
		if (!/\.(ts|js|tsx|jsx|html)$/.test(file)) continue;
		if (!fs.existsSync(file)) continue;

		const content = fs.readFileSync(file, 'utf-8');
		violations.push(...detectSimulations(file, content));
	}

	return violations;
}

// ============================================================================
// CLI
// ============================================================================

function printViolations(violations: Violation[], format: 'text' | 'json'): void {
	if (format === 'json') {
		console.log(JSON.stringify(violations, null, 2));
		return;
	}

	if (violations.length === 0) {
		console.log('✅ No simulation/theater code detected');
		return;
	}

	console.log('');
	console.log('🚫 SIMULATION/THEATER CODE DETECTED');
	console.log('═'.repeat(70));

	// Group by severity
	const bySeverity = {
		CRITICAL: violations.filter((v) => v.pattern.severity === 'CRITICAL'),
		HIGH: violations.filter((v) => v.pattern.severity === 'HIGH'),
		MEDIUM: violations.filter((v) => v.pattern.severity === 'MEDIUM'),
	};

	for (const [severity, group] of Object.entries(bySeverity)) {
		if (group.length === 0) continue;

		const icon = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : '🟡';
		console.log(`\n${icon} ${severity} (${group.length}):`);

		for (const v of group) {
			console.log(`  ${v.file}:${v.line}`);
			console.log(`    Pattern: ${v.pattern.name}`);
			console.log(`    Match: "${v.match}"`);
			console.log(`    Issue: ${v.pattern.description}`);
			console.log(`    Fix: ${v.pattern.fix}`);
			console.log('');
		}
	}

	console.log('═'.repeat(70));
	console.log(`Total: ${violations.length} violations`);
	console.log('CRITICAL violations BLOCK commit. HIGH/MEDIUM are warnings.');
}

// ============================================================================
// MAIN
// ============================================================================

const args = process.argv.slice(2);
const isJson = args.includes('--json');
const isStaged = args.includes('--staged');
const targetDir = args.find((a) => !a.startsWith('--')) || 'demos';

let violations: Violation[];

if (isStaged) {
	violations = scanStagedFiles();
} else {
	violations = scanDirectory(targetDir);
}

printViolations(violations, isJson ? 'json' : 'text');

// Exit code: 1 if CRITICAL violations exist
const criticalCount = violations.filter((v) => v.pattern.severity === 'CRITICAL').length;
if (criticalCount > 0) {
	console.log(`\n❌ BLOCKED: ${criticalCount} CRITICAL violation(s) found`);
	process.exit(1);
}

process.exit(0);
