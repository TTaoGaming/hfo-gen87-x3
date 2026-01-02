import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Golden Video Verification Test
 *
 * Gen87.X3 | VALIDATE Phase
 *
 * Purpose:
 * 1. Verify real MediaPipeAdapter processes golden master videos
 * 2. Verify FSM transitions to DOWN_COMMIT for Video A
 * 3. Verify FSM stays DISARMED for Video B
 */
import { type Page, expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, '../cold/silver');
const BASE_URL = 'http://localhost:8081';
const DEMO_PAGE = 'showcase-webcam.html';

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
						video.addEventListener(
							'loadedmetadata',
							() => {
								canvas.width = video.videoWidth || 640;
								canvas.height = video.videoHeight || 480;
								resolve();
							},
							{ once: true },
						);
						video.load();
					});

					try {
						await video.play();
						isPlaying = true;
						console.log('[VIDEO_FIXTURE] Video playback started');
					} catch (e) {
						console.error('[VIDEO_FIXTURE] Play failed:', e);
					}

					video.addEventListener(
						'ended',
						() => {
							videoEnded = true;
							console.log('[VIDEO_FIXTURE] Video playback ended');
							window.dispatchEvent(new CustomEvent('video-fixture-ended'));
						},
						{ once: true },
					);

					function drawFrame() {
						if (!videoEnded && isPlaying && ctx) {
							requestAnimationFrame(drawFrame);
						}
					}
					drawFrame();

					const stream = canvas.captureStream(30);
					return stream;
				}
				return originalGetUserMedia(constraints);
			};
		},
		{ videoDataUrl },
	);
}

test.describe('Golden Video Verification', () => {
	test('Video A (open-palm-pointer-up-open-palm) should reach DOWN_COMMIT', async ({ page }) => {
		const videoPath = path.join(FIXTURES_DIR, 'open-palm-pointer-up-open-palm.mp4');

		if (!fs.existsSync(videoPath)) {
			test.skip(true, `Video not found: ${videoPath}`);
			return;
		}

		await injectVideoAsCamera(page, videoPath);

		await page.goto(`${BASE_URL}/${DEMO_PAGE}`);

		// Click start to trigger initialization
		await page.click('#startBtn');

		// Wait for MediaPipe to initialize
		await page.waitForSelector('.status.ready', { timeout: 30000 });

		console.log('Pipeline started. Waiting for DOWN_COMMIT...');

		// Monitor FSM state
		const stateEl = page.locator('#fsm-state');

		// We expect it to reach DOWN_COMMIT within the video duration (approx 10-15s)
		await expect(stateEl).toHaveText('DOWN_COMMIT', { timeout: 25000 });

		console.log('✅ DOWN_COMMIT reached!');
	});

	test('Video B (open-palm-side) should stay DISARMED', async ({ page }) => {
		const videoPath = path.join(FIXTURES_DIR, 'open-palm-side.mp4');

		if (!fs.existsSync(videoPath)) {
			test.skip(true, `Video not found: ${videoPath}`);
			return;
		}

		await injectVideoAsCamera(page, videoPath);

		await page.goto(`${BASE_URL}/${DEMO_PAGE}`);

		// Click start to trigger initialization
		await page.click('#startBtn');

		// Wait for MediaPipe to initialize
		await page.waitForSelector('.status.ready', { timeout: 30000 });

		console.log('Pipeline started. Monitoring state...');

		// Wait for 10 seconds and ensure it doesn't reach DOWN_COMMIT
		await page.waitForTimeout(10000);

		const stateText = await page.locator('#fsm-state').textContent();
		console.log(`Final state: ${stateText}`);

		expect(stateText).not.toBe('DOWN_COMMIT');
		expect(stateText).toBe('DISARMED'); // open-palm-side should not even ARM
	});
});
