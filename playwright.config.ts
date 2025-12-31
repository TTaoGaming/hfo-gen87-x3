import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './',
	testMatch: ['**/e2e/**/*.ts', '**/demo-puter/**/*.spec.ts'],
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [
		['html', { outputFolder: 'playwright-report' }],
		['json', { outputFile: 'test-results/e2e-results.json' }],
	],
	use: {
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npx http-server sandbox/demo-golden -p 9093 --cors -c-1',
		url: 'http://localhost:9093/simple-pipeline.html',
		reuseExistingServer: true,
		timeout: 10000,
	},
});
