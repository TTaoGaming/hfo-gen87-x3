/**
 * Unified Playwright Config - IR-0008 Port Race Fix
 *
 * Gen87.X3 | 2026-01-02
 *
 * SINGLE source of truth for E2E test server configuration.
 * Uses ONE port (8081) serving from project root.
 * Eliminates port race conditions from multiple conflicting configs.
 *
 * Usage:
 *   npx playwright test --config=playwright-unified.config.ts
 *
 * For VS Code Tasks: Use "Demo Server" task which runs:
 *   npx http-server . -p 8081 --cors -c-1
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	testMatch: ['**/*.spec.ts'],
	fullyParallel: false, // Sequential to avoid port race
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1, // Single worker to prevent parallel server conflicts
	reporter: [
		['html', { outputFolder: 'playwright-report' }],
		['list'],
	],
	timeout: 60000, // 60s for video frame processing
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
	webServer: {
		command: 'npx http-server . -p 8081 --cors -c-1',
		url: 'http://localhost:8081',
		reuseExistingServer: true, // CRITICAL: Don't kill existing server
		timeout: 30000,
	},
});
