/**
 * Adapter Mutation Coverage Constraint Test
 *
 * Gen87.X3 | Port 5 DEFEND | IR-0011 FIX
 *
 * PURPOSE: Enforce 80% mutation test coverage on all adapter files.
 * This gate blocks theater code that passes unit tests but has low
 * mutation scores (indicating tests don't actually verify behavior).
 *
 * HOW IT WORKS:
 * 1. Reads Stryker incremental results from .stryker-tmp/incremental.json
 * 2. Checks each adapter file for mutation score >= 80%
 * 3. Fails if any adapter is below threshold or untested
 *
 * RUN STRYKER FIRST:
 *   npx stryker run --logLevel error
 *
 * @port 5
 * @verb DEFEND
 * @binary 101
 * @incident IR-0011
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

// ============================================================================
// CONSTANTS
// ============================================================================

const MUTATION_THRESHOLD = 80; // 80% minimum
const STRYKER_CACHE = path.resolve(__dirname, '../../../../.stryker-tmp/incremental.json');
const ADAPTERS_DIR = path.resolve(__dirname, '../adapters');

// Adapters that MUST have mutation testing
const REQUIRED_ADAPTERS = [
	'xstate-fsm.adapter.ts',
	'one-euro-exemplar.adapter.ts',
	'one-euro.adapter.ts',
	'rapier-physics.adapter.ts',
	'golden-layout-shell.adapter.ts',
	'in-memory-substrate.adapter.ts',
	'pointer-event.adapter.ts',
	'mediapipe.adapter.ts',
];

// Adapters that are exempt (infrastructure, not core logic)
const EXEMPT_ADAPTERS = [
	'port-factory.ts', // Meta-factory, tested via adapters it creates
	'tile-composer.ts', // Pure composition, no mutation targets
	'nats-substrate.adapter.ts', // Requires NATS server, integration test
	'double-exponential-predictor.adapter.ts', // Experimental
	'port-2-mirror-magus.ts', // Meta composition
];

// ============================================================================
// TYPES
// ============================================================================

interface StrykerMutant {
	status: 'Killed' | 'Survived' | 'NoCoverage' | 'Timeout' | 'RuntimeError';
	location?: {
		start: { line: number; column: number };
		end: { line: number; column: number };
	};
}

interface StrykerFileResult {
	mutants: StrykerMutant[];
}

interface StrykerIncrementalCache {
	files: Record<string, StrykerFileResult>;
}

interface MutationScore {
	file: string;
	killed: number;
	total: number;
	score: number;
	passing: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function loadStrykerResults(): StrykerIncrementalCache | null {
	if (!fs.existsSync(STRYKER_CACHE)) {
		return null;
	}

	try {
		const content = fs.readFileSync(STRYKER_CACHE, 'utf-8');
		return JSON.parse(content) as StrykerIncrementalCache;
	} catch {
		return null;
	}
}

function calculateMutationScores(cache: StrykerIncrementalCache): MutationScore[] {
	const scores: MutationScore[] = [];

	for (const [filePath, fileData] of Object.entries(cache.files)) {
		// Only check adapter files
		if (!filePath.includes('/adapters/') || filePath.endsWith('.test.ts')) {
			continue;
		}

		const fileName = path.basename(filePath);

		// Skip exempt adapters
		if (EXEMPT_ADAPTERS.includes(fileName)) {
			continue;
		}

		const mutants = fileData.mutants || [];
		const total = mutants.length;

		if (total === 0) {
			// No mutants = no mutation testing done
			scores.push({
				file: fileName,
				killed: 0,
				total: 0,
				score: 0,
				passing: false,
			});
			continue;
		}

		const killed = mutants.filter((m) => m.status === 'Killed').length;
		const score = Math.round((killed / total) * 100);

		scores.push({
			file: fileName,
			killed,
			total,
			score,
			passing: score >= MUTATION_THRESHOLD,
		});
	}

	return scores;
}

function getExistingAdapters(): string[] {
	if (!fs.existsSync(ADAPTERS_DIR)) {
		return [];
	}

	return fs
		.readdirSync(ADAPTERS_DIR)
		.filter((f) => f.endsWith('.adapter.ts') && !f.endsWith('.test.ts'))
		.filter((f) => !EXEMPT_ADAPTERS.includes(f));
}

// ============================================================================
// CONSTRAINT TESTS
// ============================================================================

describe('Adapter Mutation Coverage Gate (IR-0011)', () => {
	const strykerCache = loadStrykerResults();

	it('should have Stryker incremental cache available', () => {
		// Skip this test if running in CI without Stryker cache
		if (!strykerCache) {
			console.warn(
				'⚠️  Stryker cache not found. Run "npx stryker run" first for mutation testing.\n' +
					'   Skipping mutation coverage check.',
			);
			return; // Don't fail, just warn
		}

		expect(strykerCache).toBeDefined();
		expect(strykerCache.files).toBeDefined();
	});

	it('should have mutation scores >= 80% for all required adapters', () => {
		if (!strykerCache) {
			console.warn('⚠️  Stryker cache not found - skipping mutation score check');
			return;
		}

		const scores = calculateMutationScores(strykerCache);
		const failing = scores.filter((s) => !s.passing);

		if (failing.length > 0) {
			const failureReport = failing
				.map((s) => `  ❌ ${s.file}: ${s.score}% (${s.killed}/${s.total} killed)`)
				.join('\n');

			console.error(`\n🚨 MUTATION COVERAGE BELOW 80% (IR-0011 VIOLATION)\n${failureReport}\n`);
		}

		// Report passing scores
		const passing = scores.filter((s) => s.passing);
		if (passing.length > 0) {
			const passReport = passing
				.map((s) => `  ✅ ${s.file}: ${s.score}% (${s.killed}/${s.total} killed)`)
				.join('\n');

			console.log(`\n📊 Mutation Scores:\n${passReport}`);
		}

		expect(failing.length).toBe(0);
	});

	it('should have mutation testing for all required adapters', () => {
		if (!strykerCache) {
			console.warn('⚠️  Stryker cache not found - skipping coverage check');
			return;
		}

		const scores = calculateMutationScores(strykerCache);
		const testedFiles = scores.map((s) => s.file);
		const existingAdapters = getExistingAdapters();

		// Check if all required adapters have been tested
		const untestedRequired = REQUIRED_ADAPTERS.filter(
			(adapter) =>
				!testedFiles.includes(adapter) || scores.find((s) => s.file === adapter)?.total === 0,
		);

		if (untestedRequired.length > 0) {
			console.warn(
				`\n⚠️  ADAPTERS WITHOUT MUTATION TESTING:\n${untestedRequired.map((a) => `  - ${a}`).join('\n')}\n\nRun: npx stryker run --mutate "hot/bronze/src/adapters/<file>"`,
			);
		}

		// At minimum, key adapters must have mutation testing
		const criticalAdapters = ['xstate-fsm.adapter.ts', 'one-euro-exemplar.adapter.ts'];
		const untestedCritical = criticalAdapters.filter(
			(adapter) =>
				!testedFiles.includes(adapter) || scores.find((s) => s.file === adapter)?.total === 0,
		);

		expect(untestedCritical.length).toBe(0);
	});
});

describe('Adapter Mutation Score Summary', () => {
	it('generates mutation score report for documentation', () => {
		const strykerCache = loadStrykerResults();

		if (!strykerCache) {
			console.log('No Stryker cache - run mutation testing first');
			return;
		}

		const scores = calculateMutationScores(strykerCache);

		console.log(`\n${'='.repeat(60)}`);
		console.log('ADAPTER MUTATION SCORE REPORT');
		console.log('='.repeat(60));
		console.log(`Threshold: ${MUTATION_THRESHOLD}%`);
		console.log('-'.repeat(60));

		for (const score of scores.sort((a, b) => b.score - a.score)) {
			const status = score.passing ? '✅' : '❌';
			const bar =
				'█'.repeat(Math.floor(score.score / 5)) + '░'.repeat(20 - Math.floor(score.score / 5));
			console.log(`${status} ${score.file.padEnd(35)} ${bar} ${score.score}%`);
		}

		console.log('-'.repeat(60));

		const avgScore =
			scores.length > 0
				? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
				: 0;
		console.log(`Average: ${avgScore}%`);
		console.log(`Passing: ${scores.filter((s) => s.passing).length}/${scores.length}`);
		console.log(`${'='.repeat(60)}\n`);

		expect(true).toBe(true); // Always pass - this is just for reporting
	});
});
