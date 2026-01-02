/**\n * @deprecated Use playwright-unified.config.ts instead\n * \n * WARNING: This config references stale sandbox/ paths that no longer exist.\n * The webServer entries for sandbox/demo-golden and sandbox/demo-real are broken.\n * See config/playwright/README.md for guidance.\n */\nimport { defineConfig, devices } from '@playwright/test';

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
	webServer: [
		{
			command: 'npx http-server sandbox/demo-golden -p 9093 --cors -c-1',
			url: 'http://localhost:9093/index.html',
			reuseExistingServer: true,
			timeout: 30000,
		},
		{
			command: 'npx http-server sandbox/demo-real -p 9094 --cors -c-1',
			url: 'http://localhost:9094/index.html',
			reuseExistingServer: true,
			timeout: 30000,
		},
	],
});
