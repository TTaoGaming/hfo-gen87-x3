/**
 * Playwright Configuration for HFO Silver Demo
 *
 * Gen87.X3 | Silver Layer E2E Testing
 */
// @ts-nocheck

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './hot/silver/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html', { outputFolder: 'playwright-report/silver' }], ['list']],

	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
	],

	/* Web server for Silver demo - uses Vite */
	webServer: {
		command: 'npx vite hot/silver/demo --port 5173',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 30000,
	},

	/* Output directories */
	outputDir: 'test-results/silver',
});
