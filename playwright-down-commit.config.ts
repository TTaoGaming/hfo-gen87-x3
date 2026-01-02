/**
 * @deprecated Use playwright-unified.config.ts instead
 * This config is for a specific test that could use unified config.
 * See config/playwright/README.md for guidance.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	testMatch: ['down-commit-visual-test.spec.ts'],
	fullyParallel: false,
	timeout: 60000,
	reporter: [['list'], ['html', { outputFolder: 'playwright-report/down-commit' }]],
	use: {
		trace: 'on-first-retry',
		screenshot: 'on',
		baseURL: 'http://127.0.0.1:8081',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npx http-server demos -p 8081 -c-1 --cors',
		url: 'http://127.0.0.1:8081/index.html',
		reuseExistingServer: true,
		timeout: 15000,
	},
});
