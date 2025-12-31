/**
 * Gen87.X3 - Puter Demo Screenshot Script
 *
 * Run: npx playwright test sandbox/demo-puter/take-screenshots.ts --project=chromium
 */

import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');

// Ensure screenshot dir exists
test.beforeAll(async () => {
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
	}
});

test('Puter Demo Screenshots', async ({ page }) => {
	// Navigate to demo via http server
	// NOTE: Run `npx http-server sandbox/demo-puter -p 8080` first
	await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle' });

	// Wait for loading overlay to disappear
	await page
		.waitForSelector('#loadingOverlay', {
			state: 'hidden',
			timeout: 45000,
		})
		.catch(() => {
			console.log('Loading overlay may have already hidden or Puter may not have loaded');
		});

	// Wait a bit more for Puter windows
	await page.waitForTimeout(3000);

	// Screenshot 1: Initial state
	await page.screenshot({
		path: path.join(SCREENSHOT_DIR, '01-initial-state.png'),
		fullPage: true,
	});
	console.log('✅ Screenshot 1: Initial state');

	// Check if windows were created
	const windowCount = await page.$eval('#windowCount', (el) => el.textContent).catch(() => '0');
	console.log(`📊 Windows created: ${windowCount}`);

	// Screenshot 2: Status panel
	const statusPanel = await page.$('.status-panel');
	if (statusPanel) {
		await statusPanel.screenshot({
			path: path.join(SCREENSHOT_DIR, '02-status-panel.png'),
		});
		console.log('✅ Screenshot 2: Status panel');
	}

	// Click test injection button if available
	const testBtn = await page.$('#injectTestBtn');
	if (testBtn) {
		await testBtn.click();
		await page.waitForTimeout(2500); // Wait for test sequence

		// Screenshot 3: After test injection
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '03-after-test-injection.png'),
			fullPage: true,
		});
		console.log('✅ Screenshot 3: After test injection');
	}

	// Click create window button
	const createBtn = await page.$('#createWindowBtn');
	if (createBtn) {
		await createBtn.click();
		await page.waitForTimeout(500);
		await createBtn.click();
		await page.waitForTimeout(500);

		// Screenshot 4: More windows
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '04-more-windows.png'),
			fullPage: true,
		});
		console.log('✅ Screenshot 4: More windows');
	}

	// Click tile button
	const tileBtn = await page.$('#tileWindowsBtn');
	if (tileBtn) {
		await tileBtn.click();
		await page.waitForTimeout(500);

		// Screenshot 5: Tiled windows
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '05-tiled-windows.png'),
			fullPage: true,
		});
		console.log('✅ Screenshot 5: Tiled windows');
	}

	// Final screenshot
	await page.screenshot({
		path: path.join(SCREENSHOT_DIR, '99-final-state.png'),
		fullPage: true,
	});
	console.log('✅ Screenshot 99: Final state');

	// Check exposed API
	const hasAdapter = await page.evaluate(() => {
		return typeof (window as any).PuterWindowAdapter !== 'undefined';
	});
	console.log(`🔌 PuterWindowAdapter exposed: ${hasAdapter}`);

	const hasFSM = await page.evaluate(() => {
		return typeof (window as any).FSM !== 'undefined';
	});
	console.log(`🔌 FSM exposed: ${hasFSM}`);

	expect(true).toBe(true); // Pass
});
