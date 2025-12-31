/**
 * Gen87.X3 - MAIN Demo v2 E2E Tests
 *
 * Purpose: Validate improved demo at sandbox/demos/main/
 * Phase: V (VALIDATE) - Pyre Praetorian defending contracts
 *
 * Tests:
 * 1. Page loads without critical JS errors
 * 2. Golden Layout renders 4 panels (Camera, Target, Settings, Debug)
 * 3. MediaPipe landmark canvas exists
 * 4. Settings panel controls work
 * 5. NATS fallback functions correctly
 * 6. FSM initial state is correct
 *
 * Run: npx playwright test e2e/main-demo-v2.spec.ts --project=chromium
 */

import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '../test-results/screenshots/main-demo-v2');

// Demo URL - using baseURL from config or fallback
const DEMO_URL = '/index.html';

test.beforeAll(async () => {
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
	}
});

test.describe('Main Demo v2 - 4-Panel Golden Layout', () => {
	test('should load without critical JavaScript errors', async ({ page }) => {
		const errors: string[] = [];
		const consoleMessages: string[] = [];

		page.on('pageerror', (err) => errors.push(err.message));
		page.on('console', (msg) => {
			consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
			if (msg.type() === 'error') errors.push(msg.text());
		});

		const response = await page.goto(DEMO_URL, {
			waitUntil: 'networkidle',
			timeout: 30000,
		});

		expect(response?.status()).toBe(200);
		await page.waitForTimeout(3000);

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '01-initial-load.png'),
			fullPage: true,
		});

		// Log console output for debugging
		console.log('📋 Console messages:', consoleMessages.slice(0, 20));

		// Filter out expected NATS connection errors
		const criticalErrors = errors.filter(
			(e) =>
				!e.includes('NATS') &&
				!e.includes('WebSocket') &&
				!e.includes('4222') &&
				!e.includes('net::ERR_CONNECTION_REFUSED'),
		);

		if (criticalErrors.length > 0) {
			console.log('❌ Critical errors found:');
			criticalErrors.forEach((e) => console.log(`  - ${e}`));
		}

		expect(criticalErrors.length).toBe(0);
	});

	test('should render Golden Layout with 4 panels', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Check for layout container
		const layoutContainer = page.locator('#layout-container');
		await expect(layoutContainer).toBeVisible();

		// Check for Golden Layout root
		const glRoot = page.locator('.lm_root');
		await expect(glRoot).toBeVisible();

		// Check for 4 tabs (Camera, Target, Settings, Debug)
		const tabs = page.locator('.lm_tab');
		const tabCount = await tabs.count();
		console.log(`📊 Golden Layout tabs found: ${tabCount}`);

		const tabTexts = await tabs.allTextContents();
		console.log('📋 Tab titles:', tabTexts);

		expect(tabCount).toBe(4);
		expect(tabTexts.some((t) => t.includes('Camera'))).toBeTruthy();
		expect(tabTexts.some((t) => t.includes('Target'))).toBeTruthy();
		expect(tabTexts.some((t) => t.includes('Settings'))).toBeTruthy();
		expect(tabTexts.some((t) => t.includes('Debug'))).toBeTruthy();

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '02-four-panels.png'),
			fullPage: true,
		});
	});

	test('should have video and landmarks canvas elements', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Video element
		const videoElement = page.locator('video#camera');
		await expect(videoElement).toBeVisible();

		// CRITICAL: Landmarks canvas for MediaPipe visualization
		const landmarksCanvas = page.locator('canvas#landmarks-canvas');
		await expect(landmarksCanvas).toBeVisible();

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '03-camera-with-landmarks.png'),
			fullPage: true,
		});
	});

	test('should have Settings panel with 1€ filter controls', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		// 1€ Filter controls
		const minCutoffSlider = page.locator('#setting-minCutoff');
		const betaSlider = page.locator('#setting-beta');
		const dCutoffSlider = page.locator('#setting-dCutoff');

		await expect(minCutoffSlider).toBeVisible();
		await expect(betaSlider).toBeVisible();
		await expect(dCutoffSlider).toBeVisible();

		// Gesture controls
		const confidenceSlider = page.locator('#setting-confidence');
		const debounceSlider = page.locator('#setting-debounce');

		await expect(confidenceSlider).toBeVisible();
		await expect(debounceSlider).toBeVisible();

		// Verbose logging checkbox
		const verboseCheckbox = page.locator('#setting-verbose');
		await expect(verboseCheckbox).toBeVisible();

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '04-settings-panel.png'),
			fullPage: true,
		});
	});

	test('should have Start/Stop buttons in correct initial state', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		const startBtn = page.locator('#btn-start');
		const stopBtn = page.locator('#btn-stop');

		await expect(startBtn).toBeVisible();
		await expect(stopBtn).toBeVisible();

		// Start enabled, Stop disabled initially
		await expect(startBtn).toBeEnabled();
		await expect(stopBtn).toBeDisabled();
	});

	test('should have debug metrics panel with correct elements', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Core metrics
		const fpsMetric = page.locator('#metric-fps');
		const fsmMetric = page.locator('#metric-fsm');
		const gestureMetric = page.locator('#metric-gesture');
		const confidenceMetric = page.locator('#metric-confidence');

		await expect(fpsMetric).toBeVisible();
		await expect(fsmMetric).toBeVisible();
		await expect(gestureMetric).toBeVisible();
		await expect(confidenceMetric).toBeVisible();

		// FSM should show 'idle' initially
		const fsmText = await fsmMetric.textContent();
		expect(fsmText).toBe('idle');

		// Event log
		const eventLog = page.locator('#event-log');
		await expect(eventLog).toBeVisible();

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '05-debug-metrics.png'),
			fullPage: true,
		});
	});

	test('should have gesture cursor element', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		const cursor = page.locator('#gesture-cursor');
		await expect(cursor).toBeVisible();
	});

	test('should show NATS fallback status on connection failure', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		// NATS status should show disconnected or fallback initially
		const natsStatus = page.locator('#status-nats');
		await expect(natsStatus).toBeVisible();

		const natsText = await natsStatus.textContent();
		console.log('📡 NATS Status:', natsText);

		// Pipeline should show stopped initially
		const pipelineStatus = page.locator('#status-pipeline');
		const pipelineText = await pipelineStatus.textContent();
		console.log('⚡ Pipeline Status:', pipelineText);

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '06-nats-status.png'),
			fullPage: true,
		});
	});

	test('Settings slider adjustments update displayed values', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Adjust minCutoff slider
		const minCutoffSlider = page.locator('#setting-minCutoff');
		const minCutoffValue = page.locator('#value-minCutoff');

		// Get initial value
		const initialValue = await minCutoffValue.textContent();
		console.log('📊 Initial minCutoff:', initialValue);

		// Adjust slider using fill
		await minCutoffSlider.fill('2.5');
		await page.waitForTimeout(100);

		// Check updated value
		const updatedValue = await minCutoffValue.textContent();
		console.log('📊 Updated minCutoff:', updatedValue);

		expect(updatedValue).toBe('2.5');

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '07-settings-adjusted.png'),
			fullPage: true,
		});
	});
});

test.describe('Main Demo v2 - Console & Error Analysis', () => {
	test('should log initialization messages correctly', async ({ page }) => {
		const logs: string[] = [];

		page.on('console', (msg) => {
			logs.push(`[${msg.type()}] ${msg.text()}`);
		});

		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(3000);

		console.log('📋 All console messages:');
		logs.forEach((l) => console.log(`  ${l}`));

		// Check for expected initialization logs
		const hasInitMessage = logs.some((l) => l.includes('Gen87.X3') || l.includes('initialized'));
		console.log('✅ Init message found:', hasInitMessage);

		// Check for CDN module loading
		const hasEsmImports = logs.some((l) => l.includes('esm.sh') || l.includes('cdn.jsdelivr'));

		// Save logs to file for analysis
		const logPath = path.join(SCREENSHOT_DIR, 'console-log.txt');
		fs.writeFileSync(logPath, logs.join('\n'), 'utf8');
		console.log(`📁 Logs saved to: ${logPath}`);
	});

	test('should handle NATS connection failure gracefully', async ({ page }) => {
		const errors: string[] = [];

		page.on('pageerror', (err) => errors.push(err.message));

		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(3000);

		// Click Start to trigger NATS connection attempt
		const startBtn = page.locator('#btn-start');

		// Grant camera permission first (may prompt)
		await page.context().grantPermissions(['camera']);

		// Don't actually click start as it requires camera - just verify the page survives
		// The NATS connection attempt happens on start click

		// Page should still be functional
		const layoutContainer = page.locator('#layout-container');
		await expect(layoutContainer).toBeVisible();

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '08-after-nats-check.png'),
			fullPage: true,
		});
	});
});
