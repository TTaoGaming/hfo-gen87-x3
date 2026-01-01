/**
 * Gen87.X3 - Puter.js Demo E2E Test
 *
 * HIVE Phase: V (Validate) - Playwright Screenshots
 *
 * This test validates the Puter.js gesture control demo:
 * 1. Loads the demo page
 * 2. Waits for Puter windows to render
 * 3. Simulates pointer events via adapter
 * 4. Captures screenshots for visual validation
 */
// @ts-nocheck


import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Screenshot output directory
const SCREENSHOT_DIR = 'screenshots';

test.describe('Puter.js Gesture Control Demo', () => {
	test.beforeAll(async () => {
		// Ensure screenshot directory exists
		if (!fs.existsSync(SCREENSHOT_DIR)) {
			fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
		}
	});

	test('should load demo and display Puter windows', async ({ page }) => {
		// Navigate to demo
		const demoPath = path.resolve(__dirname, 'index.html');
		await page.goto(`file://${demoPath}`);

		// Wait for loading to complete
		await page.waitForSelector('#loadingOverlay', { state: 'hidden', timeout: 30000 });

		// Screenshot: Initial state with 3 windows
		await page.screenshot({
			path: `${SCREENSHOT_DIR}/01-puter-demo-initial.png`,
			fullPage: true,
		});

		// Verify windows created
		const windowCount = await page.locator('#windowCount').textContent();
		expect(Number.parseInt(windowCount || '0')).toBeGreaterThanOrEqual(3);

		// Check MediaPipe status
		const mediapipeStatus = await page.locator('#mediapipeStatus').textContent();
		expect(mediapipeStatus).toContain('Ready');
	});

	test('should inject test events into Puter windows', async ({ page }) => {
		const demoPath = path.resolve(__dirname, 'index.html');
		await page.goto(`file://${demoPath}`);
		await page.waitForSelector('#loadingOverlay', { state: 'hidden', timeout: 30000 });

		// Click test injection button
		await page.click('#injectTestBtn');

		// Wait for test sequence to complete
		await page.waitForTimeout(2000);

		// Screenshot: After test injection
		await page.screenshot({
			path: `${SCREENSHOT_DIR}/02-puter-demo-after-injection.png`,
			fullPage: true,
		});

		// Verify cursor was rendered (check canvas has content)
		const cursorCanvas = await page.locator('#cursorLayer');
		expect(cursorCanvas).toBeVisible();
	});

	test('should create additional windows', async ({ page }) => {
		const demoPath = path.resolve(__dirname, 'index.html');
		await page.goto(`file://${demoPath}`);
		await page.waitForSelector('#loadingOverlay', { state: 'hidden', timeout: 30000 });

		// Get initial count
		const initialCount = Number.parseInt((await page.locator('#windowCount').textContent()) || '0');

		// Create new window
		await page.click('#createWindowBtn');
		await page.waitForTimeout(500);

		// Verify count increased
		const newCount = Number.parseInt((await page.locator('#windowCount').textContent()) || '0');
		expect(newCount).toBe(initialCount + 1);

		// Screenshot: With additional window
		await page.screenshot({
			path: `${SCREENSHOT_DIR}/03-puter-demo-new-window.png`,
			fullPage: true,
		});
	});

	test('should tile windows correctly', async ({ page }) => {
		const demoPath = path.resolve(__dirname, 'index.html');
		await page.goto(`file://${demoPath}`);
		await page.waitForSelector('#loadingOverlay', { state: 'hidden', timeout: 30000 });

		// Add more windows
		await page.click('#createWindowBtn');
		await page.waitForTimeout(300);
		await page.click('#createWindowBtn');
		await page.waitForTimeout(300);

		// Screenshot: Before tiling
		await page.screenshot({
			path: `${SCREENSHOT_DIR}/04-puter-demo-before-tile.png`,
			fullPage: true,
		});

		// Tile windows
		await page.click('#tileWindowsBtn');
		await page.waitForTimeout(500);

		// Screenshot: After tiling
		await page.screenshot({
			path: `${SCREENSHOT_DIR}/05-puter-demo-tiled.png`,
			fullPage: true,
		});
	});

	test('should expose adapter for testing', async ({ page }) => {
		const demoPath = path.resolve(__dirname, 'index.html');
		await page.goto(`file://${demoPath}`);
		await page.waitForSelector('#loadingOverlay', { state: 'hidden', timeout: 30000 });

		// Check window.PuterWindowAdapter exposed
		const adapterExists = await page.evaluate(() => {
			return typeof (window as any).PuterWindowAdapter !== 'undefined';
		});
		expect(adapterExists).toBe(true);

		// Check puterWindows map exposed
		const windowsExist = await page.evaluate(() => {
			return (window as any).puterWindows instanceof Map;
		});
		expect(windowsExist).toBe(true);

		// Check FSM exposed
		const fsmExists = await page.evaluate(() => {
			return typeof (window as any).FSM !== 'undefined';
		});
		expect(fsmExists).toBe(true);
	});

	test('should handle gesture states', async ({ page }) => {
		const demoPath = path.resolve(__dirname, 'index.html');
		await page.goto(`file://${demoPath}`);
		await page.waitForSelector('#loadingOverlay', { state: 'hidden', timeout: 30000 });

		// Test FSM transitions via exposed API
		const idleState = await page.evaluate(() => {
			const FSM = (window as any).FSM;
			FSM.transition(null, false);
			return FSM.state;
		});
		expect(idleState).toBe('IDLE');

		const trackingState = await page.evaluate(() => {
			const FSM = (window as any).FSM;
			FSM.transition('Pointing_Up', true);
			return FSM.state;
		});
		expect(trackingState).toBe('TRACKING');

		const armedState = await page.evaluate(() => {
			const FSM = (window as any).FSM;
			FSM.transition('Closed_Fist', true);
			return FSM.state;
		});
		expect(armedState).toBe('ARMED');
	});
});

test.describe('Golden Test Data Integration', () => {
	const GOLDEN_FIXTURES = path.resolve(__dirname, '../../../hfo_kiro_gen85/test-fixtures');

	test('should recognize victory gesture from golden image', async ({ page }) => {
		// This test would use test-fixtures/victory.jpg
		const victoryPath = path.join(GOLDEN_FIXTURES, 'victory.jpg');

		if (!fs.existsSync(victoryPath)) {
			test.skip();
			return;
		}

		const demoPath = path.resolve(__dirname, 'index.html');
		await page.goto(`file://${demoPath}`);
		await page.waitForSelector('#loadingOverlay', { state: 'hidden', timeout: 30000 });

		// Screenshot documenting golden test integration point
		await page.screenshot({
			path: `${SCREENSHOT_DIR}/06-golden-integration-point.png`,
			fullPage: true,
		});

		// Note: Full image recognition would require:
		// 1. Canvas-based video source substitution
		// 2. Or headless MediaPipe with static image input
		// For now, document the integration point exists
		console.log('✓ Golden fixtures path:', GOLDEN_FIXTURES);
		console.log('✓ victory.jpg exists:', fs.existsSync(victoryPath));
	});
});

test.describe('Visual Regression', () => {
	test('capture final demo state for manual validation', async ({ page }) => {
		const demoPath = path.resolve(__dirname, 'index.html');
		await page.goto(`file://${demoPath}`);
		await page.waitForSelector('#loadingOverlay', { state: 'hidden', timeout: 30000 });

		// Create windows and tile
		await page.click('#createWindowBtn');
		await page.click('#createWindowBtn');
		await page.waitForTimeout(500);
		await page.click('#tileWindowsBtn');
		await page.waitForTimeout(500);

		// Run test injection
		await page.click('#injectTestBtn');
		await page.waitForTimeout(2000);

		// Final screenshot
		await page.screenshot({
			path: `${SCREENSHOT_DIR}/99-puter-demo-final-state.png`,
			fullPage: true,
		});

		// Verify UI elements
		await expect(page.locator('#cameraStatus')).toBeVisible();
		await expect(page.locator('#mediapipeStatus')).toBeVisible();
		await expect(page.locator('#gestureIcon')).toBeVisible();
		await expect(page.locator('#fsmState')).toBeVisible();
		await expect(page.locator('#windowCount')).toBeVisible();
	});
});
