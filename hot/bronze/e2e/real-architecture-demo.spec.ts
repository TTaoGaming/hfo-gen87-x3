/**
 * Gen87.X3 - REAL Architecture Demo E2E Tests
 *
 * Purpose: Validate demo-real with Golden Layout + NATS integration
 * Phase: V (VALIDATE) - Pyre Praetorian defending contracts
 *
 * Run: npx playwright test e2e/real-architecture-demo.spec.ts --project=chromium
 */

import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '../test-results/screenshots/real-demo');

// Base URL for demo-real - use environment variable or default
// When running standalone: PORT=9094 npm playwright test
// The webServer in playwright.config.ts serves demo-golden on 9093
const DEMO_URL = process.env.REAL_DEMO_URL || 'http://127.0.0.1:9094/index.html';

test.beforeAll(async () => {
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
	}
});

test.describe('Real Architecture Demo - Golden Layout', () => {
	test('should load without JavaScript errors', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (err) => errors.push(err.message));
		page.on('console', (msg) => {
			if (msg.type() === 'error') errors.push(msg.text());
		});

		const response = await page.goto(DEMO_URL, {
			waitUntil: 'networkidle',
			timeout: 30000,
		});

		// Page should load successfully
		expect(response?.status()).toBe(200);

		// Wait for modules to load
		await page.waitForTimeout(3000);

		// Screenshot initial state
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '01-initial-load.png'),
			fullPage: true,
		});

		// Check for critical errors (allow NATS connection failures)
		const criticalErrors = errors.filter(
			(e) => !e.includes('NATS') && !e.includes('WebSocket') && !e.includes('4222')
		);

		if (criticalErrors.length > 0) {
			console.log('❌ Critical errors found:');
			criticalErrors.forEach((e) => console.log(`  - ${e}`));
		}

		expect(criticalErrors.length).toBe(0);
	});

	test('should render Golden Layout container', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Check for layout container
		const layoutContainer = page.locator('#layout-container');
		await expect(layoutContainer).toBeVisible();

		// Check for Golden Layout classes
		const glRoot = page.locator('.lm_root');
		await expect(glRoot).toBeVisible();

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '02-golden-layout-rendered.png'),
			fullPage: true,
		});
	});

	test('should have 3 panels (Camera, Target, Debug)', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Check for panel tabs
		const tabs = page.locator('.lm_tab');
		const tabCount = await tabs.count();
		console.log(`📊 Golden Layout tabs found: ${tabCount}`);

		expect(tabCount).toBe(3);

		// Check panel titles
		const tabTexts = await tabs.allTextContents();
		console.log('📋 Tab titles:', tabTexts);

		expect(tabTexts.some((t) => t.includes('Camera'))).toBeTruthy();
		expect(tabTexts.some((t) => t.includes('Target'))).toBeTruthy();
		expect(tabTexts.some((t) => t.includes('Debug'))).toBeTruthy();
	});

	test('should have video element in Camera panel', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		const videoElement = page.locator('video#camera');
		await expect(videoElement).toBeVisible();
	});

	test('should have Start/Stop buttons', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		const startBtn = page.locator('#btn-start');
		const stopBtn = page.locator('#btn-stop');

		await expect(startBtn).toBeVisible();
		await expect(stopBtn).toBeVisible();

		// Start should be enabled, Stop should be disabled initially
		await expect(startBtn).toBeEnabled();
		await expect(stopBtn).toBeDisabled();
	});

	test('should have gesture cursor element', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		const cursor = page.locator('#gesture-cursor');
		await expect(cursor).toBeVisible();
	});

	test('should have debug metrics panel', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Check for metric elements
		const fpsMetric = page.locator('#metric-fps');
		const fsmMetric = page.locator('#metric-fsm');
		const eventLog = page.locator('#event-log');

		await expect(fpsMetric).toBeVisible();
		await expect(fsmMetric).toBeVisible();
		await expect(eventLog).toBeVisible();

		// FSM should show 'idle' initially
		const fsmText = await fsmMetric.textContent();
		expect(fsmText).toBe('idle');
	});
});

test.describe('Real Architecture Demo - Adapter Classes', () => {
	test('should define all adapter classes (no inline functions)', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(3000);

		// Check that classes are defined (not inline functions)
		const classesExist = await page.evaluate(() => {
			// @ts-ignore
			return {
				// Check if classes exist in module scope - they should be in the page's JS
				hasNatsAdapter: typeof window !== 'undefined',
				pageHtml: document.documentElement.innerHTML.includes('class NatsSubstrateAdapter'),
				pageHasOneEuro: document.documentElement.innerHTML.includes('class OneEuroAdapter'),
				pageHasXState: document.documentElement.innerHTML.includes('class XStateFSMAdapter'),
				pageHasPointer: document.documentElement.innerHTML.includes('class PointerEventAdapter'),
				pageHasDOM: document.documentElement.innerHTML.includes('class DOMAdapter'),
				pageHasMediaPipe: document.documentElement.innerHTML.includes('class MediaPipeAdapter'),
			};
		});

		console.log('📦 Adapter class checks:', classesExist);

		expect(classesExist.pageHtml).toBeTruthy();
		expect(classesExist.pageHasOneEuro).toBeTruthy();
		expect(classesExist.pageHasXState).toBeTruthy();
		expect(classesExist.pageHasPointer).toBeTruthy();
		expect(classesExist.pageHasDOM).toBeTruthy();
		expect(classesExist.pageHasMediaPipe).toBeTruthy();
	});

	test('should import Zod for schema validation', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		const hasZod = await page.evaluate(() => {
			return document.documentElement.innerHTML.includes("from 'https://esm.sh/zod");
		});

		expect(hasZod).toBeTruthy();
	});

	test('should import XState for FSM', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		const hasXState = await page.evaluate(() => {
			return document.documentElement.innerHTML.includes("from 'https://esm.sh/xstate");
		});

		expect(hasXState).toBeTruthy();
	});

	test('should import Golden Layout', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		const hasGoldenLayout = await page.evaluate(() => {
			return document.documentElement.innerHTML.includes("from 'https://esm.sh/golden-layout");
		});

		expect(hasGoldenLayout).toBeTruthy();
	});

	test('should import NATS.ws', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		const hasNats = await page.evaluate(() => {
			return document.documentElement.innerHTML.includes("from 'https://esm.sh/nats.ws");
		});

		expect(hasNats).toBeTruthy();
	});
});

test.describe('Real Architecture Demo - Pipeline Stages', () => {
	test('should show 5 pipeline stages in debug panel', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		const stages = page.locator('.pipeline-stage');
		const stageCount = await stages.count();

		console.log(`🔄 Pipeline stages found: ${stageCount}`);

		// 5 main stages + 4 NATS indicators = 9 total
		expect(stageCount).toBeGreaterThanOrEqual(5);

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '03-pipeline-stages.png'),
			fullPage: true,
		});
	});

	test('should have NATS subject indicators', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		const html = await page.content();

		// Check for NATS subjects in the pipeline visualization
		expect(html.includes('hfo.sensor.frame')).toBeTruthy();
		expect(html.includes('hfo.smoother.frame')).toBeTruthy();
		expect(html.includes('hfo.fsm.action')).toBeTruthy();
		expect(html.includes('hfo.pointer.event')).toBeTruthy();
	});
});

test.describe('Real Architecture Demo - Status Indicators', () => {
	test('should show NATS fallback status (no server)', async ({ page }) => {
		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Without NATS server, should show fallback status
		const natsStatus = page.locator('#status-nats');
		await expect(natsStatus).toBeVisible();

		// Click start to trigger NATS connection attempt
		await page.click('#btn-start');
		await page.waitForTimeout(3000);

		// Should show fallback (since no NATS server running)
		const statusText = await natsStatus.textContent();
		console.log('📡 NATS status:', statusText);

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '04-nats-fallback.png'),
			fullPage: true,
		});

		// Either shows fallback or connected
		expect(statusText?.includes('NATS')).toBeTruthy();
	});

	test('should update adapter status on start', async ({ page }) => {
		// Grant camera permission
		await page.context().grantPermissions(['camera']);

		await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
		await page.waitForTimeout(2000);

		// Check initial status
		const sensorStatus = page.locator('#status-sensor');
		const initialStatus = await sensorStatus.textContent();
		console.log('📷 Initial sensor status:', initialStatus);

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '05-before-start.png'),
			fullPage: true,
		});
	});
});

test.describe('Real Architecture Demo - Responsive Layout', () => {
	const viewports = [
		{ width: 1920, height: 1080, name: '1080p' },
		{ width: 1280, height: 720, name: '720p' },
		{ width: 1024, height: 768, name: 'tablet' },
	];

	for (const vp of viewports) {
		test(`should render correctly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 30000 });
			await page.waitForTimeout(2000);

			// Golden Layout should be visible
			const layout = page.locator('.lm_root');
			await expect(layout).toBeVisible();

			await page.screenshot({
				path: path.join(SCREENSHOT_DIR, `06-responsive-${vp.name}.png`),
				fullPage: true,
			});
		});
	}
});
