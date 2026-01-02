/**
 * Playwright Config for Golden Master E2E Tests
 *
 * Gen87.X3 | Uses existing demo server on port 8081
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e/golden-master',
	testMatch: ['**/*.spec.ts'],
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1, // Sequential for golden tests
	reporter: [
		['html', { outputFolder: 'playwright-report-golden' }],
		['list'],
	],
	use: {
		baseURL: 'http://localhost:8081',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	// No webServer - assumes demo server is already running on 8081
});
