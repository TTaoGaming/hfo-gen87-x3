/**
 * Unified Playwright Config - IR-0008 Port Race Fix
 *
 * Gen87.X3 | 2026-01-02
 *
 * SINGLE source of truth for E2E test server configuration.
 * Uses Vite dev server for TypeScript compilation.
 * Eliminates port race conditions from multiple conflicting configs.
 *
 * Usage:
 *   npx playwright test --config=playwright-unified.config.ts
 *
 * CRITICAL: Uses Vite, not http-server, because demos need TypeScript compilation!
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	testMatch: ['**/*.spec.ts'],
	fullyParallel: false, // Sequential to avoid port race
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1, // Single worker to prevent parallel server conflicts
	reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
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
		// CRITICAL: Use Vite for TypeScript compilation, not http-server!
		command: 'npx vite --config demos/vite.config.ts --port 8081',
		url: 'http://localhost:8081',
		reuseExistingServer: true,
		timeout: 30000,
	},
});
