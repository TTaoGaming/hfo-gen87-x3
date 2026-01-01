/**
 * SIMPLE STRYKER CONFIG FOR RED REGNANT MUTATION TESTING
 *
 * This config runs mutation testing without TypeScript checker
 * (because the codebase has TS errors that Vitest ignores - which is itself a RED FLAG)
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
	// Target source files for mutation
	mutate: [
		'sandbox/src/smoothers/**/*.ts',
		'!sandbox/src/**/*.test.ts',
		'!sandbox/src/**/*.spec.ts',
		'!sandbox/src/**/*.d.ts',
	],

	// Test runner - vitest
	testRunner: 'vitest',
	vitest: {
		configFile: 'vitest.config.ts',
	},

	// NO typescript checker - codebase has type errors
	checkers: [],

	// Run ALL tests for mutation coverage
	coverageAnalysis: 'all',

	// Reporters
	reporters: ['html', 'json', 'clear-text', 'progress'],
	htmlReporter: {
		fileName: 'reports/mutation/index.html',
	},
	jsonReporter: {
		fileName: 'reports/mutation/mutation-report.json',
	},

	// Thresholds
	thresholds: {
		high: 80,
		low: 60,
		break: 50,
	},

	// Single concurrency for debugging
	concurrency: 1,

	// Longer timeout
	timeoutMS: 60000,

	// Log level
	logLevel: 'info',
};
