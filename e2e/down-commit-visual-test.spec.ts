/**
 * DOWN_COMMIT Visual Verification Test
 * 
 * Gen87.X3 | VALIDATE Phase
 * 
 * Purpose: 
 * 1. Verify video playback triggers DOWN_COMMIT state
 * 2. Capture screenshot at DOWN_COMMIT moment
 * 3. Check layout correctness
 * 4. Verify cursor elements are rendered
 */
import { expect, test, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, '../cold/silver');
const SCREENSHOTS_DIR = path.join(__dirname, '../test-results/down-commit-screenshots');
const BASE_URL = 'http://localhost:8081';  // GoldenLayout demo server
const DEMO_PAGE = '12-golden-unified.html';  // Unified demo with visible video panel

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
	fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Inject video file as fake camera stream
 */
async function injectVideoAsCamera(page: Page, videoPath: string): Promise<void> {
	const videoBuffer = fs.readFileSync(videoPath);
	const videoBase64 = videoBuffer.toString('base64');
	const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;

	await page.addInitScript(
		({ videoDataUrl }) => {
			const video = document.createElement('video');
			video.src = videoDataUrl;
			video.muted = true;
			video.loop = false;
			video.crossOrigin = 'anonymous';

			const canvas = document.createElement('canvas');
			canvas.width = 640;
			canvas.height = 480;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Failed to get 2d context');

			let isPlaying = false;
			let videoEnded = false;

			const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
			navigator.mediaDevices.getUserMedia = async (constraints) => {
				if (constraints && (constraints as MediaStreamConstraints).video) {
					console.log('[VIDEO_FIXTURE] Injecting video as camera source');

					await new Promise<void>((resolve) => {
						video.addEventListener('loadedmetadata', () => {
							canvas.width = video.videoWidth || 640;
							canvas.height = video.videoHeight || 480;
							resolve();
						}, { once: true });
						video.load();
					});

					try {
						await video.play();
						isPlaying = true;
						console.log('[VIDEO_FIXTURE] Video playback started');
					} catch (e) {
						console.error('[VIDEO_FIXTURE] Play failed:', e);
					}

					video.addEventListener('ended', () => {
						videoEnded = true;
						console.log('[VIDEO_FIXTURE] Video playback ended');
						window.dispatchEvent(new CustomEvent('video-fixture-ended'));
					}, { once: true });

					function drawFrame() {
						if (!videoEnded && isPlaying) {
							ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
							requestAnimationFrame(drawFrame);
						}
					}
					drawFrame();

					const stream = canvas.captureStream(30);
					return stream;
				}
				return originalGetUserMedia(constraints);
			};

			(window as any).__videoFixture = {
				video,
				canvas,
				isEnded: () => videoEnded,
				getDuration: () => video.duration,
				getCurrentTime: () => video.currentTime,
			};

			console.log('[VIDEO_FIXTURE] Camera mock installed');
		},
		{ videoDataUrl }
	);
}

test.describe('DOWN_COMMIT Visual Verification', () => {
	test.describe.configure({ mode: 'serial' });

	test('Video A (open-palm-pointer-up-open-palm) should reach DOWN_COMMIT and show correct cursors', async ({ page }) => {
		const videoPath = path.join(FIXTURES_DIR, 'open-palm-pointer-up-open-palm.mp4');
		
		if (!fs.existsSync(videoPath)) {
			test.skip(true, `Video not found: ${videoPath}`);
			return;
		}

		// Inject video as camera
		await injectVideoAsCamera(page, videoPath);

		// Track FSM state changes and DOWN_COMMIT screenshots
		const fsmStates: { state: string; timestamp: number }[] = [];
		let screenshotTaken = false;

		page.on('console', (msg) => {
			const text = msg.text();
			// Log FSM state changes
			if (text.includes('FSM') || text.includes('state')) {
				console.log(`[CONSOLE] ${text}`);
			}
		});

		// Navigate to demo - 12-golden-unified.html has GoldenLayout with visible video panel
		await page.goto(`${BASE_URL}/${DEMO_PAGE}`);

		// Wait for GoldenLayout to initialize (target area is inside GoldenLayout panel)
		await page.waitForSelector('.lm_goldenlayout');
		await page.waitForSelector('#targetArea');
		await page.waitForTimeout(500);

		// Take screenshot of initial state
		await page.screenshot({
			path: path.join(SCREENSHOTS_DIR, 'initial-state.png'),
			fullPage: true,
		});
		console.log('📸 Initial state screenshot saved');

		// Switch to camera mode
		const cameraBtn = page.locator('#btn-camera');
		if (await cameraBtn.isVisible()) {
			await cameraBtn.click();
			console.log('📷 Switched to camera mode');
		} else {
			// Try alternative selector
			const cameraBtnAlt = page.locator('button[data-input="camera"]');
			if (await cameraBtnAlt.isVisible()) {
				await cameraBtnAlt.click();
				console.log('📷 Switched to camera mode (alt selector)');
			}
		}

		// Wait for video processing with periodic screenshots
		let downCommitDetected = false;
		const maxWaitTime = 15000; // 15 seconds max
		const checkInterval = 200; // Check every 200ms
		let elapsed = 0;

		while (elapsed < maxWaitTime && !downCommitDetected) {
			// Check FSM state - 12-golden-unified uses both #fsmStateText and .fsm-state.active
			const fsmStateText = await page.locator('#fsmStateText').textContent();
			const activeStateEl = page.locator('.fsm-state.active');
			const activeState = await activeStateEl.count() > 0 ? await activeStateEl.textContent() : null;
			
			const currentState = fsmStateText || activeState || 'UNKNOWN';
			
			fsmStates.push({ state: currentState, timestamp: elapsed });
			
			console.log(`[${elapsed}ms] FSM State: ${currentState}`);

			// If DOWN_COMMIT detected, take screenshot immediately
			if (currentState === 'DOWN_COMMIT') {
				downCommitDetected = true;
				console.log('🎯 DOWN_COMMIT DETECTED! Taking screenshot...');
				
				await page.screenshot({
					path: path.join(SCREENSHOTS_DIR, 'DOWN_COMMIT-moment.png'),
					fullPage: true,
				});
				
				// Also take a screenshot of just the target area
				const targetArea = page.locator('#targetArea');
				await targetArea.screenshot({
					path: path.join(SCREENSHOTS_DIR, 'DOWN_COMMIT-target-area.png'),
				});
				
				screenshotTaken = true;
				console.log('📸 DOWN_COMMIT screenshots saved!');
			}

			await page.waitForTimeout(checkInterval);
			elapsed += checkInterval;
		}

		// Take final state screenshot
		await page.screenshot({
			path: path.join(SCREENSHOTS_DIR, 'final-state.png'),
			fullPage: true,
		});
		console.log('📸 Final state screenshot saved');

		// Verify DOWN_COMMIT was reached
		console.log('\n📊 FSM State History:');
		const uniqueStates = [...new Set(fsmStates.map(s => s.state))];
		console.log(`   States visited: ${uniqueStates.join(' → ')}`);

		expect(downCommitDetected, 'Video A should trigger DOWN_COMMIT state').toBe(true);

		// Verify cursor elements exist in the page (12-golden-unified uses #cursorDot)
		console.log('\n🔍 Cursor Element Verification:');
		
		const cursorDot = page.locator('#cursorDot');
		const cursorDotVisible = await cursorDot.isVisible();
		console.log(`   Cursor dot visible: ${cursorDotVisible}`);
		
		const cursorDotClasses = await cursorDot.getAttribute('class');
		console.log(`   Cursor dot classes: ${cursorDotClasses}`);
		
		// Cursor should have 'pressing' class during DOWN_COMMIT
		const isPressing = cursorDotClasses?.includes('pressing') || false;
		console.log(`   Cursor pressing: ${isPressing}`);

		// Verify FSM state indicator shows DOWN_COMMIT
		const downCommitState = page.locator('#fsm-DOWN_COMMIT');
		const downCommitActive = await downCommitState.evaluate(el => el.classList.contains('active'));
		console.log(`   FSM DOWN_COMMIT active: ${downCommitActive}`);

		expect(cursorDotVisible, 'Cursor dot should be visible').toBe(true);
		expect(downCommitActive, 'DOWN_COMMIT state should be active').toBe(true);
	});

	test('Video B (open-palm-side) should stay DISARMED', async ({ page }) => {
		const videoPath = path.join(FIXTURES_DIR, 'open-palm-side.mp4');
		
		if (!fs.existsSync(videoPath)) {
			test.skip(true, `Video not found: ${videoPath}`);
			return;
		}

		await injectVideoAsCamera(page, videoPath);

		await page.goto(`${BASE_URL}/${DEMO_PAGE}`);
		await page.waitForSelector('.lm_goldenlayout');
		await page.waitForSelector('#targetArea');

		// Switch to camera mode
		const cameraBtn = page.locator('#btn-camera');
		if (await cameraBtn.isVisible()) {
			await cameraBtn.click();
		}

		// Wait for video processing
		await page.waitForTimeout(8000);

		// Check FSM state - should be DISARMED
		const fsmStateText = await page.locator('#fsmStateText').textContent();
		
		// Take screenshot of final state
		await page.screenshot({
			path: path.join(SCREENSHOTS_DIR, 'video-b-disarmed.png'),
			fullPage: true,
		});

		console.log(`\n📊 Video B Final State: ${fsmStateText}`);
		expect(fsmStateText).not.toBe('DOWN_COMMIT');
		expect(fsmStateText).not.toBe('ARMED');
	});

	test('Layout verification - Check GoldenLayout panels and cursor areas', async ({ page }) => {
		await page.goto(`${BASE_URL}/${DEMO_PAGE}`);
		await page.waitForSelector('.lm_goldenlayout');
		await page.waitForSelector('#targetArea');

		// Take screenshot of full layout
		await page.screenshot({
			path: path.join(SCREENSHOTS_DIR, 'layout-full.png'),
			fullPage: true,
		});

		// Verify GoldenLayout structure
		console.log('\n📐 GoldenLayout Panel Verification:');
		
		// GoldenLayout root should exist
		const goldenLayout = page.locator('.lm_goldenlayout');
		expect(await goldenLayout.isVisible()).toBe(true);
		console.log('   GoldenLayout container: ✅');

		// Main target area (Port 7)
		const targetArea = page.locator('#targetArea');
		const targetBox = await targetArea.boundingBox();
		console.log(`   Target area (P7): ${JSON.stringify(targetBox)}`);
		expect(targetBox).not.toBeNull();
		expect(targetBox!.width).toBeGreaterThan(100);
		expect(targetBox!.height).toBeGreaterThan(100);

		// Video panel (Port 0) - should be visible, not hidden
		const videoElement = page.locator('#videoEl');
		const videoBox = await videoElement.boundingBox();
		console.log(`   Video element (P0): ${JSON.stringify(videoBox)}`);
		// Video may not be visible until camera starts, but element should exist
		expect(await videoElement.count()).toBeGreaterThan(0);

		// FSM panel (Port 5) - check state indicators
		const fsmStates = page.locator('.fsm-state');
		const fsmCount = await fsmStates.count();
		console.log(`   FSM state elements (P5): ${fsmCount} states`);
		expect(fsmCount).toBe(4); // DISARMED, ARMING, ARMED, DOWN_COMMIT

		// Smoother panel (Port 2) - should show values
		const smootherValues = page.locator('#smoothX, #smoothY');
		console.log(`   Smoother values (P2): ${await smootherValues.count()} elements`);

		// Cursor dot (Port 7 target)
		const cursorDot = page.locator('#cursorDot');
		expect(await cursorDot.count()).toBeGreaterThan(0);
		console.log('   Cursor dot: ✅');

		// FSM state text in footer
		const fsmStateText = page.locator('#fsmStateText');
		expect(await fsmStateText.isVisible()).toBe(true);
		console.log('   FSM state text: ✅');

		console.log('✅ All GoldenLayout panels verified');
	});
});
