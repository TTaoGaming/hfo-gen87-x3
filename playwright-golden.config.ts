/**
 * Playwright Config for Golden Master E2E Tests
 *
 * Gen87.X3 | Auto-starts Vite server, compiles TypeScript, runs tests
 *
 * ONE COMMAND: npx playwright test --config=playwright-golden.config.ts
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	testMatch: ['golden-master.spec.ts', 'ux-standards.spec.ts'],
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1,
	reporter: [['list']],
	timeout: 30000,
	use: {
		baseURL: 'http://localhost:8082',
		trace: 'off',
		screenshot: 'only-on-failure',
		video: 'off',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npx vite --config demos/vite.config.ts --port 8082',
		url: 'http://localhost:8082',
		reuseExistingServer: true,
		timeout: 30000,
		stdout: 'ignore',
		stderr: 'pipe',
	},
});
