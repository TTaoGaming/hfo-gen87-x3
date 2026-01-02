import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['fsm-showcase.spec.ts'],
  fullyParallel: false,
  timeout: 30000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    baseURL: 'http://127.0.0.1:3333',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx serve demos -l 3333',
    url: 'http://127.0.0.1:3333/09-fsm-showcase.html',
    reuseExistingServer: true,
    timeout: 10000,
  },
});
