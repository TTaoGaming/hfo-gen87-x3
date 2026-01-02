import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	testMatch: [
		'fsm-showcase.spec.ts',
		'e2e-pipeline-variant-b.spec.ts'
	],
	fullyParallel: false, // Sequential to avoid port conflicts
	timeout: 60000,
	reporter: [['list'], ['html', { outputFolder: 'playwright-report-e2e' }]],
	use: {
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		baseURL: 'http://127.0.0.1:8088',
	},
	snapshotDir: './e2e/__snapshots__',
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npx http-server demos -p 8088 -c-1 --cors',
		url: 'http://127.0.0.1:8088/index.html',
		reuseExistingServer: true,
		timeout: 30000,
	},
});
