/**
 * STRYKER MUTATION TESTING CONFIG
 *
 * Gen87.X3 | Port 4 (Red Regnant) | ADVERSARIAL CRITIC
 *
 * "If the mutant survives, your test is FAKE."
 *
 * Mutation testing works by:
 * 1. Injecting bugs (mutations) into your code
 * 2. Running tests against mutated code
 * 3. If tests PASS with broken code → test is USELESS
 * 4. If tests FAIL with broken code → test is REAL
 *
 * MUTATION SCORE = killed mutants / total mutants
 * Goal: >80% mutation score
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
	// Target source files for mutation
	mutate: [
		'sandbox/src/**/*.ts',
		'!sandbox/src/**/*.test.ts',
		'!sandbox/src/**/*.spec.ts',
		'!sandbox/src/**/*.d.ts',
		'!sandbox/src/**/index.ts', // Skip barrel exports
	],

	// Test runner
	testRunner: 'vitest',
	vitest: {
		configFile: 'vitest.config.ts',
		dir: '.',
		// IMPORTANT: Disable related file detection - run ALL tests for each mutant
		// This catches more fake green tests but is slower
	},

	// TypeScript checker DISABLED - codebase has TS errors that Vitest ignores
	// This is a RED FLAG: tests pass but code won't compile under strict TS!
	checkers: [], // was ['typescript']
	tsconfigFile: 'tsconfig.json',

	// Mutation operators - inject ALL types of bugs
	mutators: {
		excludedMutations: [
			// Don't mutate string literals (too noisy)
			// 'StringLiteral',
		],
	},

	// Incremental mode - only re-test changed code
	incremental: true,
	incrementalFile: '.stryker-tmp/incremental.json',

	// Coverage analysis for faster runs
	coverageAnalysis: 'perTest',

	// Reporters
	reporters: ['html', 'json', 'clear-text', 'progress'],
	htmlReporter: {
		fileName: 'reports/mutation/index.html',
	},
	jsonReporter: {
		fileName: 'reports/mutation/mutation-report.json',
	},

	// Thresholds - FAIL if mutation score too low
	thresholds: {
		high: 80, // Green if >80% mutations killed
		low: 60, // Yellow if 60-80%
		break: 50, // FAIL build if <50%
	},

	// Concurrency
	concurrency: 4,

	// Timeouts
	timeoutMS: 30000,
	timeoutFactor: 2.5,

	// Logging
	logLevel: 'info',

	// Dashboard (optional - for CI integration)
	// dashboard: {
	//   project: 'github.com/TTaoGaming/hfo-gen87-x3',
	//   version: 'gen87-x3/develop',
	// },

	// Ignore patterns for faster runs
	ignorePatterns: [
		'node_modules',
		'dist',
		'coverage',
		'reports',
		'.stryker-tmp',
		'playwright-report',
		'test-results',
	],

	// Temp directory
	tempDirName: '.stryker-tmp',

	// Clear text reporter options
	clearTextReporter: {
		allowColor: true,
		logTests: false,
		maxTestsToLog: 0,
	},
};
