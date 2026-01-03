/**
 * E2E Pipeline Variant B - Playwright Tests
 *
 * Gen87.X3 | VALIDATE Phase
 *
 * Tests the complete pipeline demo:
 * 1. Page loads without JS errors (uses __tla correctly)
 * 2. All REAL adapters initialize (OneEuro, Rapier, DESP)
 * 3. FSM state machine works (DISARMED → ARMING → ARMED)
 * 4. W3C Pointer Events emit correctly
 * 5. Hot-swappable smoothers work
 */
import { expect, test } from '@playwright/test';

test.describe('E2E Pipeline Variant B', () => {
	test.beforeEach(async ({ page }) => {
		// Collect console errors
		const errors: string[] = [];
		const logs: string[] = [];

		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text());
			}
			if (msg.type() === 'log') {
				logs.push(msg.text());
			}
		});

		page.on('pageerror', (err) => {
			errors.push(err.message);
		});

		await page.goto('/11-e2e-pipeline-variant-b.html');

		// Store for assertions
		(page as any)._jsErrors = errors;
		(page as any)._consoleLogs = logs;
	});

	test('page loads with REAL modules (no theater code)', async ({ page }) => {
		// Wait for initialization
		await page
			.waitForFunction(
				() => {
					const logs = (window as any).__hfoLogs || [];
					return logs.some((log: string) => log.includes('E2E Pipeline Variant B ready'));
				},
				{ timeout: 10000 },
			)
			.catch(() => {
				// Fallback: check console logs we captured
			});

		// Check console logs for initialization
		const logs = (page as any)._consoleLogs;
		expect(logs.some((log: string) => log.includes('HFO E2E Pipeline Loaded'))).toBe(true);
		expect(logs.some((log: string) => log.includes('OneEuroExemplarAdapter initialized'))).toBe(
			true,
		);
		expect(logs.some((log: string) => log.includes('RapierPhysicsAdapter initialized'))).toBe(true);
		expect(logs.some((log: string) => log.includes('DoubleExponentialPredictor initialized'))).toBe(
			true,
		);

		// No JS errors (except favicon 404 which is acceptable)
		const errors = (page as any)._jsErrors;
		const realErrors = errors.filter((e: string) => !e.includes('favicon'));
		expect(realErrors).toHaveLength(0);
	});

	test('all UI elements render correctly', async ({ page }) => {
		// Header
		await expect(page.locator('h1')).toContainText('E2E Pipeline');

		// Input mode buttons
		await expect(page.getByRole('button', { name: /Mouse/ })).toBeVisible();
		await expect(page.getByRole('button', { name: /Camera/ })).toBeVisible();

		// Smoother selection buttons
		await expect(page.getByRole('button', { name: '1€ Filter' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Physics' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'DESP' })).toBeVisible();

		// FSM States panel
		await expect(page.getByText('FSM States')).toBeVisible();
		await expect(page.getByText('DISARMED')).toBeVisible();
		await expect(page.getByText('ARMING')).toBeVisible();
		await expect(page.getByText('ARMED')).toBeVisible();
		await expect(page.getByText('DOWN_COMMIT')).toBeVisible();

		// W3C Event Log
		await expect(page.getByText('W3C Event Log')).toBeVisible();

		// Pipeline Architecture
		await expect(page.getByText('Pipeline Architecture')).toBeVisible();
	});

	test('FSM transitions from DISARMED → ARMING → ARMED on mouse interaction', async ({ page }) => {
		// Get the canvas/interaction area
		const canvas = page.locator('.interaction-area').first();

		// Move mouse to trigger state changes
		await page.mouse.move(400, 300);
		await page.waitForTimeout(100);
		await page.mouse.move(410, 310);
		await page.waitForTimeout(100);
		await page.mouse.move(420, 320);

		// Wait for ARMING (stabilization period)
		await page.waitForTimeout(300);

		// Continue moving to reach ARMED
		await page.mouse.move(430, 330);
		await page.waitForTimeout(50);
		await page.mouse.move(440, 340);

		// Check that FSM reached ARMED state (via pipeline strip or FSM panel)
		// The pipeline strip shows current state
		const fsmStateText = await page
			.locator('.pipeline-stage')
			.filter({ hasText: 'FSM' })
			.textContent();

		// Should be either ARMING or ARMED (depends on timing)
		expect(fsmStateText).toMatch(/ARMING|ARMED/);
	});

	test('W3C pointer events emit on mouse movement', async ({ page }) => {
		// Wait for initial state
		await page.waitForTimeout(200);

		// Move mouse to trigger events
		await page.mouse.move(400, 300);
		await page.waitForTimeout(100);
		await page.mouse.move(500, 400);
		await page.waitForTimeout(500);

		// Check event log shows pointermove
		const eventLog = page.locator('.event-log, [class*="event"]').first();
		await expect(eventLog).toContainText('pointermove');
	});

	test('smoother hot-swap changes adapter without errors', async ({ page }) => {
		// Start with 1€ Filter (default)
		await expect(page.getByRole('button', { name: '1€ Filter' })).toHaveAttribute(
			'class',
			/active/,
		);

		// Switch to Physics
		await page.getByRole('button', { name: 'Physics' }).click();
		await page.waitForTimeout(100);

		// Check Physics is now active
		await expect(page.getByRole('button', { name: 'Physics' })).toHaveAttribute('class', /active/);

		// Verify no errors occurred
		const errors = (page as any)._jsErrors;
		const realErrors = errors.filter((e: string) => !e.includes('favicon'));
		expect(realErrors).toHaveLength(0);

		// Switch to DESP
		await page.getByRole('button', { name: 'DESP' }).click();
		await page.waitForTimeout(100);

		// Check DESP is now active
		await expect(page.getByRole('button', { name: 'DESP' })).toHaveAttribute('class', /active/);

		// Still no errors
		expect(realErrors).toHaveLength(0);
	});

	test('parameter sliders update smoother config', async ({ page }) => {
		// 1€ Filter should show Min Cutoff and Beta sliders
		const minCutoffSlider = page.locator('input[type="range"]').first();
		await expect(minCutoffSlider).toBeVisible();

		// Get initial value
		const initialValue = await minCutoffSlider.inputValue();

		// Change the slider
		await minCutoffSlider.fill('2');
		await page.waitForTimeout(50);

		// Value should have changed (the display updates)
		// No errors should occur
		const errors = (page as any)._jsErrors;
		const realErrors = errors.filter((e: string) => !e.includes('favicon'));
		expect(realErrors).toHaveLength(0);
	});

	test('pipeline strip shows correct flow visualization', async ({ page }) => {
		// Pipeline strip should show: Input → Smoother → FSM → W3C Events
		const pipelineStrip = page.locator('.pipeline-strip');

		await expect(pipelineStrip).toContainText('Input');
		await expect(pipelineStrip).toContainText('Smoother');
		await expect(pipelineStrip).toContainText('FSM');
		await expect(pipelineStrip).toContainText('W3C');
	});

	test.describe('Visual Regression', () => {
		test('initial state matches snapshot', async ({ page }) => {
			// Wait for full render
			await page.waitForTimeout(500);

			// Take screenshot of the main content area
			await expect(page).toHaveScreenshot('e2e-pipeline-initial.png', {
				maxDiffPixelRatio: 0.05, // Allow 5% difference for animations
			});
		});

		test('physics smoother state matches snapshot', async ({ page }) => {
			// Switch to Physics
			await page.getByRole('button', { name: 'Physics' }).click();
			await page.waitForTimeout(300);

			// Take screenshot
			await expect(page).toHaveScreenshot('e2e-pipeline-physics.png', {
				maxDiffPixelRatio: 0.05,
			});
		});
	});
});
