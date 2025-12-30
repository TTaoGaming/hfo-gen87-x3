import { defineConfig } from 'vitest/config';

/**
 * Test Bucket Organization for HIVE/8 Workflow
 *
 * Buckets are organized by role/function for easier AI agent workflow:
 * - Bucket 1: CONTRACTS - Zod schemas, W3C compliance, observability
 * - Bucket 2: ADAPTERS - UI shells, emulators, FSM, overlays
 * - Bucket 3: SMOOTHERS - 1€ filter, physics, prediction, pipeline
 * - Bucket 4: PHASE1 - Core MVP cursor pipeline, multi-hand
 * - Bucket 5: GESTURE - Commit gestures, arming, evolutionary tuner
 *
 * Run specific bucket: npm test -- --project=contracts
 * Run all: npm test
 */
export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.{test,spec}.{ts,tsx}', 'sandbox/src/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],

		// Define test projects (buckets) for targeted execution
		typecheck: {
			enabled: false,
		},

		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			reportsDirectory: './coverage',
			thresholds: {
				statements: 80,
				branches: 80,
				functions: 80,
				lines: 80,
			},
			exclude: [
				'node_modules/**',
				'dist/**',
				'sandbox/**',
				'e2e/**',
				'**/*.d.ts',
				'**/*.config.*',
				'**/types/**',
			],
		},
		// Fail fast on first error in CI
		bail: process.env.CI ? 1 : 0,
		// Watch mode respects git
		watchExclude: ['**/node_modules/**', '**/dist/**', '**/sandbox/**'],
		// Reporter
		reporters: process.env.CI ? ['verbose', 'json'] : ['verbose'],
		outputFile: {
			json: './test-results/results.json',
		},
	},
});
