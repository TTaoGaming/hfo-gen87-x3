// @ts-nocheck
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
		baseURL: 'http://127.0.0.1:9095',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npx http-server sandbox/demos/main -p 9095 -c-1 --cors',
		url: 'http://127.0.0.1:9095/index.html',
		reuseExistingServer: true,
		timeout: 30000,
	},
});
