import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['**/node_modules/**', '**/dist/**', '**/sandbox/**', '**/e2e/**'],
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
