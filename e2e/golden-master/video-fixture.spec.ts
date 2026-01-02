/**
 * Golden Master Testing with Video Fixtures
 *
 * Gen87.X3 | Silver Layer E2E Testing
 *
 * Purpose: Deterministic gesture pipeline testing using pre-recorded video files.
 *
 * Architecture:
 * 1. Video file → HTMLVideoElement
 * 2. Canvas captures video frames
 * 3. Mock getUserMedia returns canvas stream
 * 4. Demo processes frames through MediaPipe pipeline
 * 5. Telemetry captured via console messages
 * 6. Output compared against .golden.json
 *
 * Test Fixtures:
 * - open-palm-pointer-up-open-palm.mp4: Gesture sequence test
 * - open-palm-side.mp4: Palm angle rejection test (should stay DISARMED)
 */

import { expect, test, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TelemetryFrame, TelemetrySession } from './telemetry-collector';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fixture paths relative to workspace
const FIXTURES_DIR = path.join(__dirname, '../../cold/silver');
const GOLDEN_DIR = path.join(__dirname, '../../cold/silver/golden');

interface VideoTestFixture {
	name: string;
	videoPath: string;
	goldenPath: string;
	description: string;
	expectedBehavior: {
		gestures: string[];
		shouldReachArmed: boolean;
		finalFsmState: string;
	};
}

const FIXTURES: VideoTestFixture[] = [
	{
		name: 'open-palm-pointer-up-open-palm',
		videoPath: path.join(FIXTURES_DIR, 'open-palm-pointer-up-open-palm.mp4'),
		goldenPath: path.join(GOLDEN_DIR, 'open-palm-pointer-up-open-palm.golden.json'),
		description: 'Gesture sequence: Open_Palm → Pointing_Up → Open_Palm',
		expectedBehavior: {
			gestures: ['Open_Palm', 'Pointing_Up'],
			shouldReachArmed: true,
			finalFsmState: 'ARMED',
		},
	},
	{
		name: 'open-palm-side',
		videoPath: path.join(FIXTURES_DIR, 'open-palm-side.mp4'),
		goldenPath: path.join(GOLDEN_DIR, 'open-palm-side.golden.json'),
		description: 'Palm facing sideways - should stay DISARMED (palm angle > 35°)',
		expectedBehavior: {
			gestures: ['Open_Palm'],
			shouldReachArmed: false,
			finalFsmState: 'DISARMED',
		},
	},
];

/**
 * Inject video file as fake camera stream into the demo page
 */
async function injectVideoAsCamera(page: Page, videoPath: string): Promise<void> {
	// Read video file as base64
	const videoBuffer = fs.readFileSync(videoPath);
	const videoBase64 = videoBuffer.toString('base64');
	const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;

	// Inject the video replacement script before page loads
	await page.addInitScript(
		({ videoDataUrl }) => {
			// Create a video element and canvas for frame capture
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

			// Track video state
			let isPlaying = false;
			let videoEnded = false;

			// Override getUserMedia to return video stream
			const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
			navigator.mediaDevices.getUserMedia = async (constraints) => {
				// If requesting video, return our fake stream
				if (constraints && (constraints as MediaStreamConstraints).video) {
					console.log('[VIDEO_FIXTURE] Injecting video as camera source');

					// Wait for video to be ready
					await new Promise<void>((resolve) => {
						video.addEventListener(
							'loadedmetadata',
							() => {
								canvas.width = video.videoWidth || 640;
								canvas.height = video.videoHeight || 480;
								resolve();
							},
							{ once: true }
						);

						video.addEventListener(
							'error',
							() => {
								console.error('[VIDEO_FIXTURE] Video load error');
								resolve();
							},
							{ once: true }
						);

						video.load();
					});

					// Start video playback
					try {
						await video.play();
						isPlaying = true;
						console.log('[VIDEO_FIXTURE] Video playback started');
					} catch (e) {
						console.error('[VIDEO_FIXTURE] Play failed:', e);
					}

					// Track video end
					video.addEventListener(
						'ended',
						() => {
							videoEnded = true;
							console.log('[VIDEO_FIXTURE] Video playback ended');
							// Dispatch custom event for test to detect
							window.dispatchEvent(new CustomEvent('video-fixture-ended'));
						},
						{ once: true }
					);

					// Draw frames to canvas
					function drawFrame() {
						if (!videoEnded && isPlaying) {
							ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
							requestAnimationFrame(drawFrame);
						}
					}
					drawFrame();

					// Return canvas stream as camera
					const stream = canvas.captureStream(30);
					console.log('[VIDEO_FIXTURE] Returning canvas stream as camera');
					return stream;
				}

				// For non-video requests, use original
				return originalGetUserMedia(constraints);
			};

			// Expose video control for tests
			// biome-ignore lint/suspicious/noExplicitAny: Browser window extension for test
			(window as unknown as Record<string, unknown>).__videoFixture = {
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

/**
 * Inject telemetry collector into the demo page
 */
async function injectTelemetryCollector(page: Page): Promise<void> {
	await page.addInitScript(() => {
		// Create telemetry collection
		// biome-ignore lint/suspicious/noExplicitAny: Browser runtime types
		const telemetryFrames: unknown[] = [];
		const transitions: unknown[] = [];
		const events: unknown[] = [];
		let frameIndex = 0;
		let lastFsmState = 'DISARMED';

		// Expose telemetry recorder
		// biome-ignore lint/suspicious/noExplicitAny: Browser window extension for test
		(window as unknown as Record<string, unknown>).__telemetry = {
			// biome-ignore lint/suspicious/noExplicitAny: Browser runtime types
			recordFrame: (frame: Record<string, unknown>) => {
				const telemetryFrame = {
					...frame,
					frameIndex: frameIndex++,
				};

				// Track transitions
				if (frame.fsm?.previous !== frame.fsm?.current) {
					transitions.push({
						frameIndex: telemetryFrame.frameIndex,
						from: frame.fsm?.previous,
						to: frame.fsm?.current,
						trigger: frame.fsm?.transition || 'unknown',
					});
				}

				// Track events
				if (frame.w3cEvent) {
					events.push({
						frameIndex: telemetryFrame.frameIndex,
						type: frame.w3cEvent.type,
					});
				}

				telemetryFrames.push(telemetryFrame);
				lastFsmState = frame.fsm?.current || lastFsmState;

				// Emit to console for Playwright capture
				console.log('[TELEMETRY]', JSON.stringify(telemetryFrame));
			},

			getSession: () => ({
				startTime: new Date().toISOString(),
				frameCount: telemetryFrames.length,
				transitions,
				events,
				frames: telemetryFrames,
			}),

			getSummary: () => {
				const gestures = new Set<string>();
				const states = new Set<string>();

				for (const frame of telemetryFrames) {
					if (frame.gesture?.label) gestures.add(frame.gesture.label);
					if (frame.fsm?.current) states.add(frame.fsm.current);
				}

				return {
					frameCount: telemetryFrames.length,
					transitionCount: transitions.length,
					eventCount: events.length,
					gesturesDetected: Array.from(gestures),
					fsmStatesVisited: Array.from(states),
				};
			},

			reset: () => {
				telemetryFrames.length = 0;
				transitions.length = 0;
				events.length = 0;
				frameIndex = 0;
				lastFsmState = 'DISARMED';
			},
		};

		console.log('[TELEMETRY] Collector installed');
	});
}

/**
 * Collect telemetry from console messages
 */
async function collectTelemetryFromConsole(page: Page): Promise<TelemetryFrame[]> {
	const frames: TelemetryFrame[] = [];

	page.on('console', (msg) => {
		const text = msg.text();
		if (text.startsWith('[TELEMETRY]')) {
			try {
				const jsonStr = text.replace('[TELEMETRY]', '').trim();
				const frame = JSON.parse(jsonStr);
				frames.push(frame);
			} catch (e) {
				// Ignore parse errors
			}
		}
	});

	return frames;
}

/**
 * Wait for video fixture to complete playback
 */
async function waitForVideoEnd(page: Page, _timeout = 30000): Promise<void> {
	await page.evaluate(() => {
		return new Promise<void>((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error('Video playback timeout')), 30000);

			// Check if already ended
			// biome-ignore lint/suspicious/noExplicitAny: Browser window extension
			if ((window as unknown as Record<string, { isEnded: () => boolean }>).__videoFixture?.isEnded()) {
				clearTimeout(timer);
				resolve();
				return;
			}

			// Wait for end event
			window.addEventListener(
				'video-fixture-ended',
				() => {
					clearTimeout(timer);
					resolve();
				},
				{ once: true }
			);
		});
	});
}

test.describe('Golden Master Video Fixture Tests', () => {
	test.describe.configure({ mode: 'serial' });

	for (const fixture of FIXTURES) {
		test(`Video Fixture: ${fixture.name}`, async ({ page }) => {
			// Check if video file exists
			if (!fs.existsSync(fixture.videoPath)) {
				test.skip(true, `Video fixture not found: ${fixture.videoPath}`);
				return;
			}

			// Inject video as camera and telemetry collector
			await injectVideoAsCamera(page, fixture.videoPath);
			await injectTelemetryCollector(page);

			// Collect telemetry from console
			const telemetryFrames: TelemetryFrame[] = [];
			page.on('console', (msg) => {
				const text = msg.text();
				if (text.startsWith('[TELEMETRY]')) {
					try {
						const jsonStr = text.replace('[TELEMETRY]', '').trim();
						telemetryFrames.push(JSON.parse(jsonStr));
					} catch (e) {
						/* ignore */
					}
				}
			});

			// Navigate to demo page
			await page.goto('/demos/11-e2e-pipeline-variant-b.html');

			// Wait for page to initialize
			await page.waitForFunction(() => {
				return (window as any).__telemetry !== undefined;
			});

			// Switch to camera mode to trigger getUserMedia
			const cameraBtn = page.locator('#btn-camera');
			if (await cameraBtn.isVisible()) {
				await cameraBtn.click();
			}

			// Wait for video playback to complete
			try {
				await waitForVideoEnd(page);
			} catch (e) {
				console.log('Video did not end naturally, continuing with collected frames');
			}

			// Give time for final frames to process
			await page.waitForTimeout(1000);

			// Get telemetry summary from page
			const summary = await page.evaluate(() => {
				return (window as any).__telemetry?.getSummary() || {
					frameCount: 0,
					transitionCount: 0,
					eventCount: 0,
					gesturesDetected: [],
					fsmStatesVisited: [],
				};
			});

			console.log(`\n📊 Telemetry Summary for ${fixture.name}:`);
			console.log(`   Frames: ${summary.frameCount}`);
			console.log(`   Transitions: ${summary.transitionCount}`);
			console.log(`   W3C Events: ${summary.eventCount}`);
			console.log(`   Gestures: ${summary.gesturesDetected.join(', ') || 'none'}`);
			console.log(`   FSM States: ${summary.fsmStatesVisited.join(', ') || 'none'}`);

			// Get full session from page
			const session: TelemetrySession = await page.evaluate(() => {
				return (window as any).__telemetry?.getSession() || {
					startTime: new Date().toISOString(),
					frameCount: 0,
					transitions: [],
					events: [],
					frames: [],
				};
			});

			// GENERATE_GOLDEN mode: save as golden master
			if (process.env.GENERATE_GOLDEN === 'true') {
				// Ensure golden directory exists
				if (!fs.existsSync(GOLDEN_DIR)) {
					fs.mkdirSync(GOLDEN_DIR, { recursive: true });
				}

				fs.writeFileSync(fixture.goldenPath, JSON.stringify(session, null, 2));
				console.log(`\n✅ Golden master saved: ${fixture.goldenPath}`);
				return;
			}

			// Compare against golden master
			if (fs.existsSync(fixture.goldenPath)) {
				const golden: TelemetrySession = JSON.parse(fs.readFileSync(fixture.goldenPath, 'utf-8'));

				// Compare transitions (most important)
				const goldenTransitions = golden.transitions.map((t) => `${t.from}→${t.to}`);
				const actualTransitions = session.transitions.map((t) => `${t.from}→${t.to}`);

				expect(actualTransitions).toEqual(goldenTransitions);

				// Compare event sequence
				const goldenEvents = golden.events.map((e) => e.type);
				const actualEvents = session.events.map((e) => e.type);

				expect(actualEvents).toEqual(goldenEvents);

				console.log(`\n✅ Telemetry matches golden master`);
			} else {
				console.log(`\n⚠️  No golden master found. Run with GENERATE_GOLDEN=true to create.`);

				// Still validate expected behavior
				if (fixture.expectedBehavior.shouldReachArmed) {
					expect(summary.fsmStatesVisited).toContain('ARMED');
				}

				// Check final state
				const lastFrame = session.frames[session.frames.length - 1];
				if (lastFrame) {
					expect(lastFrame.fsm?.current).toBe(fixture.expectedBehavior.finalFsmState);
				}
			}
		});
	}

	test('Expected Behavior: Palm facing sideways stays DISARMED', async ({ page }) => {
		const fixture = FIXTURES.find((f) => f.name === 'open-palm-side');
		if (!fixture || !fs.existsSync(fixture.videoPath)) {
			test.skip(true, 'Video fixture not found');
			return;
		}

		await injectVideoAsCamera(page, fixture.videoPath);
		await injectTelemetryCollector(page);

		await page.goto('/demos/11-e2e-pipeline-variant-b.html');

		// Switch to camera mode
		const cameraBtn = page.locator('#btn-camera');
		if (await cameraBtn.isVisible()) {
			await cameraBtn.click();
		}

		// Wait for some processing
		await page.waitForTimeout(3000);

		// Get summary
		const summary = await page.evaluate(() => (window as any).__telemetry?.getSummary());

		// Key assertion: Should NOT reach ARMED state because palm is sideways
		expect(summary.fsmStatesVisited).not.toContain('ARMED');
		expect(summary.fsmStatesVisited).toContain('DISARMED');

		console.log(`\n✅ Palm sideways correctly stayed DISARMED`);
		console.log(`   Palm angles detected should be > 35° (disarm threshold)`);
	});
});

test.describe('Demo Freeze Regression Test', () => {
	test('FSM should not reset unexpectedly during normal operation', async ({ page }) => {
		await page.goto('/demos/11-e2e-pipeline-variant-b.html');

		// Track FSM resets via console
		const fsmResets: { from: string; to: string; timestamp: number }[] = [];

		page.on('console', (msg) => {
			const text = msg.text();
			if (text.includes('ARMED') && text.includes('DISARMED')) {
				fsmResets.push({
					from: 'ARMED',
					to: 'DISARMED',
					timestamp: Date.now(),
				});
			}
		});

		// Use mouse mode for deterministic testing
		const mouseBtn = page.locator('#btn-mouse');
		if (await mouseBtn.isVisible()) {
			await mouseBtn.click();
		}

		// Move mouse in target area to trigger FSM transitions
		const targetArea = page.locator('#targetArea');
		await targetArea.hover();

		// Wait for ARMED state
		await page.waitForTimeout(500);

		// Move mouse around smoothly (should not cause resets)
		const box = await targetArea.boundingBox();
		if (box) {
			for (let i = 0; i < 10; i++) {
				await page.mouse.move(box.x + box.width * 0.3 + i * 20, box.y + box.height * 0.5);
				await page.waitForTimeout(50);
			}
		}

		// Count unexpected resets
		const unexpectedResets = fsmResets.length;

		// There should be no unexpected resets during smooth movement
		expect(unexpectedResets).toBeLessThanOrEqual(1); // Allow 1 for initial setup

		if (unexpectedResets > 1) {
			console.log(`\n❌ Detected ${unexpectedResets} unexpected FSM resets - FREEZE BUG!`);
			console.log(`   Resets:`, fsmResets);
		} else {
			console.log(`\n✅ No unexpected FSM resets detected`);
		}
	});
});
