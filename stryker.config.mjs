/**
 * STRYKER MUTATION TESTING CONFIG - Gen87.X3
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  HOW TO USE STRYKER CORRECTLY (LESSONS LEARNED)                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  🚨 KNOWN FREEZE CAUSES (AVOID THESE):                                       ║
 * ║  1. coverageAnalysis: 'all' with large test suite (584+ tests)               ║
 * ║     → FREEZES: Runs ALL tests for EVERY mutant = N × 584 executions          ║
 * ║     → FIX: Use 'perTest' to only run tests that cover mutated code           ║
 * ║                                                                              ║
 * ║  2. No test filter when mutating a specific file                             ║
 * ║     → FREEZES: Stryker runs entire test suite even for 1 file mutation       ║
 * ║     → FIX: Use vitest.include to limit to relevant test files only           ║
 * ║                                                                              ║
 * ║  3. Mutating files with async I/O (NATS, HTTP, subprocess)                   ║
 * ║     → FREEZES: Mocks may not cover all mutation paths, real I/O hangs        ║
 * ║     → FIX: Only mutate PURE functions (Zod schemas, validation, math)        ║
 * ║                                                                              ║
 * ║  4. Long timeoutMS (60000ms+) hides frozen tests                             ║
 * ║     → FREEZES: You wait 60s per mutant before realizing it's stuck           ║
 * ║     → FIX: Use 10000ms timeout, increase only if needed                      ║
 * ║                                                                              ║
 * ║  5. Property-based tests with failing assertions                             ║
 * ║     → FREEZES: fast-check runs 1000+ iterations with console spam            ║
 * ║     → FIX: Ensure all property tests PASS before mutation testing            ║
 * ║                                                                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  ✅ CORRECT USAGE:                                                            ║
 * ║                                                                              ║
 * ║  1. First run: npx vitest run <your-test-file> --reporter=dot                ║
 * ║     → Confirm tests pass quickly (<2s) before mutation testing               ║
 * ║                                                                              ║
 * ║  2. Target PURE files only:                                                  ║
 * ║     mutate: ['path/to/pure-logic.ts']  // No I/O, no async                   ║
 * ║                                                                              ║
 * ║  3. Filter to relevant tests:                                                ║
 * ║     vitestConfigFile: 'vitest.config.ts',                                    ║
 * ║     // Tests filtered via vitest.config.ts include patterns                  ║
 * ║                                                                              ║
 * ║  4. Run with limited output:                                                 ║
 * ║     npx stryker run --logLevel error 2>&1 | Select-Object -Last 50           ║
 * ║                                                                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  📊 CURRENT TARGET: stigmergy.contract.ts (pure Zod validation)              ║
 * ║  📋 TEST FILE: stigmergy.contract.test.ts (34 tests, ~679ms)                 ║
 * ║  🎯 GOAL: >80% mutation score                                                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * To change mutation target:
 * 1. Update `mutate` array below
 * 2. Ensure corresponding test file exists and passes
 * 3. Run: npx vitest run <test-file> --reporter=dot  (should pass in <2s)
 * 4. Run: npx stryker run
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
	// Target PURE source files only (no I/O, no async)
	mutate: [
		'hot/bronze/src/pipeline/hfo-pipeline.ts',
		'hot/bronze/src/contracts/hfo-ports.ts',
		'hot/bronze/src/contracts/port-contracts.ts',
		'cold/silver/primitives/double-exponential.ts',
		// Exclude test utilities - not production code
		'!hot/bronze/src/pipeline/test-utils.ts',
		'!hot/bronze/src/**/*.test.ts',
		'!hot/bronze/src/**/*.spec.ts',
		'!hot/bronze/src/**/*.d.ts',
		// Exclude adapters with dynamic imports (mediapipe)
		'!hot/bronze/src/adapters/mediapipe.adapter.ts',
	],

	// Files to completely ignore (not even instrument for coverage)
	ignorePatterns: [
		'hot/bronze/src/adapters/mediapipe.adapter.ts', // Has dynamic imports that break when instrumented
	],

	// Test runner - vitest
	testRunner: 'vitest',
	vitestConfigFile: 'vitest.config.ts',

	// NO typescript checker - codebase has type errors that Vitest ignores
	// This is a RED FLAG but necessary for now
	checkers: [],

	// CRITICAL: Use perTest to only run tests that cover mutated code
	// 'all' = runs ALL tests for EVERY mutant (WILL FREEZE with large test suite)
	// 'perTest' = only runs tests that actually touch the mutated code
	coverageAnalysis: 'perTest',

	// Reporters - minimal for speed during development
	// Add 'html', 'json' for detailed reports when needed
	reporters: ['clear-text', 'progress'],

	// Optimization: Ignore static mutants to save ~70% execution time
	// Static mutants are those that are evaluated only once (e.g. at the top level of a module)
	ignoreStatic: true,

	// Thresholds - what mutation score is acceptable
	// ENFORCED: 80% minimum (break threshold)
	// Changed from 40% to 80% per Gen87.X3 enforcement requirements
	thresholds: {
		high: 90, // Green badge - excellent
		low: 80, // Yellow badge - acceptable minimum
		break: 80, // BLOCKING: Fail build/commit if below 80%
	},

	// High concurrency for 20-core machine
	concurrency: 12,

	// Short timeout to catch freezes fast
	timeoutMS: 10000,

	// Bail on first surviving mutant for faster feedback during strengthening
	disableBail: false,

	// Log level - use 'error' for clean output, 'info' for debugging
	logLevel: 'info',

	// Limit mutators to avoid noisy/unhelpful mutations
	mutator: {
		excludedMutations: [
			'StringLiteral', // Don't mutate strings (too noisy, low value)
			'ArrayDeclaration', // Don't mutate arrays (noisy)
		],
	},
};
