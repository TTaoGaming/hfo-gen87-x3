/**
 * @deprecated Use playwright-unified.config.ts instead
 * This config references stale paths and non-standard ports.
 * See config/playwright/README.md for guidance.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	testMatch: ['main-demo-v2.spec.ts'],
	fullyParallel: true,
	timeout: 60000,
	reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
	use: {
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		baseURL: 'http://127.0.0.1:8081',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npx http-server sandbox/demos/main -p 8081 -c-1 --cors',
		url: 'http://127.0.0.1:8081/index.html',
		reuseExistingServer: true,
		timeout: 30000,
	},
});
