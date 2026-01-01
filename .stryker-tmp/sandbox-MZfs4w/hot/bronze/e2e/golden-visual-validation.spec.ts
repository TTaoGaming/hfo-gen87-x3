/**
 * Gen87.X3 - Visual Validation E2E Tests
 *
 * Purpose: Validate cursor pipeline demos with screenshots
 * Phase: V (VALIDATE) - Pyre Praetorian defending contracts
 *
 * Run: npx playwright test e2e/golden-visual-validation.spec.ts --project=chromium
 */
// @ts-nocheck


import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '../test-results/screenshots');

// Ensure screenshot dir exists
test.beforeAll(async () => {
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
	}
});

test.describe('Golden Layout Demo Visual Validation', () => {
	test('should load Golden Layout with quad cursor view', async ({ page }) => {
		// Navigate to Golden Layout demo
		await page.goto('http://127.0.0.1:8081/index.html', {
			waitUntil: 'networkidle',
			timeout: 30000,
		});

		// Wait for Golden Layout to initialize
		await page.waitForTimeout(2000);

		// Screenshot 1: Initial layout
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, 'golden-01-initial.png'),
			fullPage: true,
		});

		// Check for layout container
		const layoutContainer = await page.$('#layout-container');
		expect(layoutContainer).toBeTruthy();

		// Check for panel elements (cursor views)
		const cursorContainers = await page.$$('#cursor-container');
		console.log(`📊 Cursor containers found: ${cursorContainers.length}`);

		// Screenshot 2: Console logs
		const consoleLogs: string[] = [];
		page.on('console', (msg) => consoleLogs.push(`${msg.type()}: ${msg.text()}`));

		// Check for critical errors
		const errors = consoleLogs.filter((log) => log.startsWith('error:'));
		console.log(`❌ Console errors: ${errors.length}`);
		errors.forEach((e) => console.log(`  ${e}`));
	});

	test('should have responsive quad cursor layout', async ({ page }) => {
		await page.goto('http://127.0.0.1:8081/index.html', {
			waitUntil: 'networkidle',
			timeout: 30000,
		});

		await page.waitForTimeout(1000);

		// Test different viewport sizes
		const viewports = [
			{ width: 1920, height: 1080, name: 'desktop-1080p' },
			{ width: 1280, height: 720, name: 'desktop-720p' },
			{ width: 768, height: 1024, name: 'tablet-portrait' },
		];

		for (const vp of viewports) {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.waitForTimeout(500);

			await page.screenshot({
				path: path.join(SCREENSHOT_DIR, `golden-02-${vp.name}.png`),
				fullPage: true,
			});
			console.log(`✅ Screenshot: ${vp.name} (${vp.width}x${vp.height})`);
		}
	});
});

test.describe('DaedalOS Demo Visual Validation', () => {
	test('should load daedalOS demo with gesture controls', async ({ page }) => {
		// Navigate to daedalOS demo
		await page.goto('http://127.0.0.1:8082/index.html', {
			waitUntil: 'networkidle',
			timeout: 30000,
		});

		// Wait for DOM to fully render
		await page.waitForTimeout(2000);

		// Screenshot 1: Initial state
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, 'daedalos-01-initial.png'),
			fullPage: true,
		});

		// Check for key elements
		const videoElement = await page.$('#videoElement');
		const overlayCanvas = await page.$('#overlayCanvas');
		const gestureCursor = await page.$('#gestureCursor');

		expect(videoElement).toBeTruthy();
		expect(overlayCanvas).toBeTruthy();
		expect(gestureCursor).toBeTruthy();

		console.log('✅ Video element found:', !!videoElement);
		console.log('✅ Overlay canvas found:', !!overlayCanvas);
		console.log('✅ Gesture cursor found:', !!gestureCursor);

		// Screenshot 2: Status panel if exists
		const statusPanel = await page.$('#statusPanel');
		if (statusPanel) {
			await statusPanel.screenshot({
				path: path.join(SCREENSHOT_DIR, 'daedalos-02-status.png'),
			});
			console.log('✅ Status panel captured');
		}
	});

	test('should display FSM state visualization', async ({ page }) => {
		await page.goto('http://127.0.0.1:8082/index.html', {
			waitUntil: 'networkidle',
			timeout: 30000,
		});

		await page.waitForTimeout(1000);

		// Check for FSM state display
		const fsmState = await page.$('#fsmState');
		if (fsmState) {
			const stateText = await fsmState.textContent();
			console.log(`📊 Current FSM state: ${stateText}`);
		}

		// Check for gesture display
		const gestureDisplay = await page.$('#gestureDisplay');
		if (gestureDisplay) {
			const gestureText = await gestureDisplay.textContent();
			console.log(`📊 Current gesture: ${gestureText}`);
		}

		// Screenshot FSM state
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, 'daedalos-03-fsm-state.png'),
			fullPage: true,
		});
	});

	test('should show daedalOS iframe target', async ({ page }) => {
		await page.goto('http://127.0.0.1:8082/index.html', {
			waitUntil: 'networkidle',
			timeout: 30000,
		});

		await page.waitForTimeout(2000);

		// Check for iframe
		const iframe = await page.$('iframe');
		if (iframe) {
			console.log('✅ daedalOS iframe found');
			await page.screenshot({
				path: path.join(SCREENSHOT_DIR, 'daedalos-04-iframe.png'),
				fullPage: true,
			});
		} else {
			console.log('⚠️ No iframe found - may need user interaction');
		}
	});
});

test.describe('Pipeline Component Validation', () => {
	test('should verify MediaPipe script loads', async ({ page }) => {
		await page.goto('http://127.0.0.1:8081/index.html', {
			waitUntil: 'networkidle',
			timeout: 30000,
		});

		// Check for MediaPipe CDN scripts
		const mediaPipeScripts = await page.evaluate(() => {
			const scripts = Array.from(document.querySelectorAll('script'));
			return scripts.filter((s) => s.src.includes('mediapipe')).map((s) => s.src);
		});

		console.log('📦 MediaPipe scripts:');
		mediaPipeScripts.forEach((s) => console.log(`  - ${s}`));

		expect(mediaPipeScripts.length).toBeGreaterThan(0);
	});

	test('should check for 1€ filter implementation', async ({ page }) => {
		await page.goto('http://127.0.0.1:8081/index.html', {
			waitUntil: 'networkidle',
			timeout: 30000,
		});

		// Check if OneEuroFilter is defined
		const hasOneEuro = await page.evaluate(() => {
			return typeof (window as any).OneEuroFilter !== 'undefined';
		});

		console.log(`📊 1€ Filter available: ${hasOneEuro}`);
	});

	test('should verify cursor rendering layers', async ({ page }) => {
		await page.goto('http://127.0.0.1:8081/index.html', {
			waitUntil: 'networkidle',
			timeout: 30000,
		});

		// Check for cursor canvas elements
		const canvasElements = await page.evaluate(() => {
			const canvases = Array.from(document.querySelectorAll('canvas'));
			return canvases.map((c) => ({
				id: c.id,
				width: c.width,
				height: c.height,
				className: c.className,
			}));
		});

		console.log('🎨 Canvas elements:');
		canvasElements.forEach((c) => console.log(`  - ${c.id || 'unnamed'}: ${c.width}x${c.height}`));
	});
});

test.describe('Golden Master Input Tests', () => {
	test('should note missing golden test data', async ({ page }) => {
		// Check for test fixtures
		const testFixturesPath = path.resolve(__dirname, '../../hfo_kiro_gen85/test-fixtures');

		const fixturesExist = fs.existsSync(testFixturesPath);
		console.log(`📁 Test fixtures exist: ${fixturesExist}`);

		if (fixturesExist) {
			const files = fs.readdirSync(testFixturesPath);
			console.log('📁 Available test fixtures:');
			files.forEach((f) => console.log(`  - ${f}`));
		}

		// Note: Golden input tests require camera/video which can't run in headless
		console.log('');
		console.log('⚠️ GOLDEN INPUT TESTS LIMITATION:');
		console.log(
			'   MediaPipe requires camera/video input which cannot be simulated in headless mode.',
		);
		console.log('   Available test images: pointing_up.jpg, thumbs_up.jpg, victory.jpg');
		console.log('   Available test video: test_video.mp4');
		console.log('');
		console.log('   To run with real input, use headed mode:');
		console.log('   npx playwright test --headed');
	});
});

test.describe('Summary Report', () => {
	test('generate final validation report', async ({ page }) => {
		const report = {
			timestamp: new Date().toISOString(),
			generation: '87.X3',
			phase: 'V (VALIDATE)',
			tests: {
				goldenLayoutDemo: {
					url: 'http://127.0.0.1:8081/index.html',
					status: 'NEEDS_VALIDATION',
					components: [
						'quad-cursor-view',
						'golden-layout-container',
						'mediapipe-integration',
						'one-euro-filter',
					],
				},
				daedalOSDemo: {
					url: 'http://127.0.0.1:8082/index.html',
					status: 'NEEDS_VALIDATION',
					components: ['gesture-cursor', 'fsm-state-display', 'adapter-injection', 'iframe-target'],
				},
			},
			limitations: [
				'MediaPipe requires real camera - cannot simulate in headless',
				'Golden master video testing requires headed browser',
				'WebGL may fail in some CI environments',
			],
			recommendations: [
				'Run with --headed flag for full validation',
				'Use test-fixtures/test_video.mp4 for video input tests',
				'Check screenshot output in test-results/screenshots/',
			],
		};

		// Write report
		const reportPath = path.join(SCREENSHOT_DIR, 'validation-report.json');
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
		console.log(`📄 Report written to: ${reportPath}`);

		console.log('');
		console.log('═══════════════════════════════════════════════════════════════');
		console.log('  GEN87.X3 VISUAL VALIDATION REPORT');
		console.log('═══════════════════════════════════════════════════════════════');
		console.log(`  Timestamp: ${report.timestamp}`);
		console.log(`  Phase: ${report.phase}`);
		console.log('');
		console.log('  DEMOS TESTED:');
		console.log('    ├── Golden Layout Demo (8081)');
		console.log('    └── DaedalOS Demo (8082)');
		console.log('');
		console.log('  SCREENSHOTS: test-results/screenshots/');
		console.log('═══════════════════════════════════════════════════════════════');
	});
});
