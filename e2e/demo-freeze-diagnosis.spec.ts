/**
 * E2E Freeze Diagnosis Test
 *
 * Purpose: Diagnose why the pipeline demo freezes/resets
 * Uses Playwright with headed mode to capture behavior over time
 */
import { expect, test } from '@playwright/test';

test.describe('Pipeline Demo Freeze Diagnosis', () => {
	test.setTimeout(30_000); // 30 second timeout

	test('should run without freezing for 10 seconds', async ({ page }) => {
		const errors: string[] = [];
		const consoleMessages: string[] = [];

		// Capture all console messages
		page.on('console', (msg) => {
			consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
			if (msg.type() === 'error') {
				errors.push(msg.text());
			}
		});

		// Capture page errors
		page.on('pageerror', (err) => {
			errors.push(`PAGE ERROR: ${err.message}`);
		});

		// Navigate to the demo
		await page.goto('http://localhost:5173/demos/11-e2e-pipeline-variant-b.html');

		// Wait for loading to complete
		await page.waitForFunction(
			() => {
				const overlay = document.getElementById('loadingOverlay');
				return overlay?.style.display === 'none';
			},
			{ timeout: 10_000 },
		);

		console.log('✅ Demo loaded');

		// Get initial FSM state
		const initialState = await page.locator('#fsmStateText').textContent();
		console.log(`Initial FSM state: ${initialState}`);

		// Move mouse into target area to trigger ARMING
		const targetArea = page.locator('#targetArea');
		await targetArea.hover();

		// Wait for ARMING
		await page.waitForTimeout(100);
		const state = await page.locator('#fsmStateText').textContent();
		console.log(`After hover: ${state}`);

		// Track state changes over 10 seconds
		const stateHistory: { time: number; state: string }[] = [];
		const startTime = Date.now();

		for (let i = 0; i < 50; i++) {
			const currentState = await page.locator('#fsmStateText').textContent();
			stateHistory.push({ time: Date.now() - startTime, state: currentState || 'unknown' });

			// Move mouse slightly to keep activity
			const box = await targetArea.boundingBox();
			if (box) {
				const x = box.x + box.width * (0.3 + 0.4 * Math.sin(i * 0.1));
				const y = box.y + box.height * (0.3 + 0.4 * Math.cos(i * 0.1));
				await page.mouse.move(x, y);
			}

			await page.waitForTimeout(200);
		}

		// Count state transitions
		let disarmedCount = 0;
		let armingCount = 0;
		let armedCount = 0;
		let unexpectedResets = 0;
		let lastState = stateHistory[0]?.state;

		for (const entry of stateHistory) {
			if (entry.state === 'DISARMED') disarmedCount++;
			if (entry.state === 'ARMING') armingCount++;
			if (entry.state === 'ARMED') armedCount++;

			// Count unexpected resets (ARMED → DISARMED without leaving area)
			if (lastState === 'ARMED' && entry.state === 'DISARMED') {
				unexpectedResets++;
				console.log(`⚠️ Unexpected reset at ${entry.time}ms`);
			}
			lastState = entry.state;
		}

		console.log('\n📊 State Distribution:');
		console.log(`  DISARMED: ${disarmedCount}`);
		console.log(`  ARMING: ${armingCount}`);
		console.log(`  ARMED: ${armedCount}`);
		console.log(`  Unexpected resets: ${unexpectedResets}`);

		console.log('\n📋 Console errors:');
		errors.forEach((e) => console.log(`  ❌ ${e}`));

		console.log('\n📋 Last 20 console messages:');
		consoleMessages.slice(-20).forEach((m) => console.log(`  ${m}`));

		// The test fails if there are unexpected resets
		expect(unexpectedResets, 'Should not have unexpected ARMED→DISARMED resets').toBeLessThan(5);
		expect(errors.length, 'Should not have console errors').toBe(0);
	});

	test('check for smoother initialization issues', async ({ page }) => {
		const consoleLog: string[] = [];

		page.on('console', (msg) => {
			consoleLog.push(`[${msg.type()}] ${msg.text()}`);
		});

		await page.goto('http://localhost:5173/demos/11-e2e-pipeline-variant-b.html');

		// Wait for loading
		await page.waitForFunction(
			() => {
				const overlay = document.getElementById('loadingOverlay');
				return overlay?.style.display === 'none';
			},
			{ timeout: 10_000 },
		);

		// Check if smoothers initialized correctly
		const smootherLogs = consoleLog.filter(
			(l) => l.includes('Adapter') || l.includes('initialized') || l.includes('error'),
		);

		console.log('Smoother initialization logs:');
		smootherLogs.forEach((l) => console.log(`  ${l}`));

		// Verify all 3 smoothers initialized
		expect(consoleLog.some((l) => l.includes('OneEuroExemplarAdapter initialized'))).toBe(true);
		expect(consoleLog.some((l) => l.includes('RapierPhysicsAdapter initialized'))).toBe(true);
		expect(consoleLog.some((l) => l.includes('DoubleExponentialPredictor initialized'))).toBe(true);
	});

	test('measure FSM responsiveness', async ({ page }) => {
		await page.goto('http://localhost:5173/demos/11-e2e-pipeline-variant-b.html');

		await page.waitForFunction(
			() => {
				const overlay = document.getElementById('loadingOverlay');
				return overlay?.style.display === 'none';
			},
			{ timeout: 10_000 },
		);

		const targetArea = page.locator('#targetArea');
		const box = await targetArea.boundingBox();

		if (!box) {
			throw new Error('Target area not found');
		}

		// Time how long it takes to go from DISARMED → ARMED
		const startTime = Date.now();

		// Move to center
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

		// Wait for ARMED state
		await page
			.waitForFunction(() => document.getElementById('fsmStateText')?.textContent === 'ARMED', {
				timeout: 5_000,
			})
			.catch(() => {});

		const armTime = Date.now() - startTime;
		console.log(`Time to ARM: ${armTime}ms`);

		// Should arm within ARM_STABLE_MS (200ms) + some overhead
		expect(armTime).toBeLessThan(500);

		// Move mouse down to trigger DOWN_COMMIT
		await page.mouse.down();
		await page.waitForTimeout(50);

		const downState = await page.locator('#fsmStateText').textContent();
		console.log(`After mousedown: ${downState}`);
		expect(downState).toBe('DOWN_COMMIT');

		// Release
		await page.mouse.up();
		await page.waitForTimeout(50);

		const upState = await page.locator('#fsmStateText').textContent();
		console.log(`After mouseup: ${upState}`);
		expect(upState).toBe('ARMED');
	});
});
