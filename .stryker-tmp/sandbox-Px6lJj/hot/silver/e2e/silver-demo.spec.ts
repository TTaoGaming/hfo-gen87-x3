// @ts-nocheck
import { join } from 'path';
/**
 * HFO Silver Demo E2E Tests
 *
 * Gen87.X3 | Silver Layer | Playwright E2E with Screenshots
 *
 * Tests the REAL architecture demo with CSS Grid layout:
 * - MediaPipe hand tracking (SensorPort)
 * - 1€ Filter / Rapier smoothing (SmootherPort)
 * - XState FSM (FSMPort)
 * - W3C PointerEvent emission (EmitterPort)
 */
import { expect, test } from '@playwright/test';

const SCREENSHOTS_DIR = 'test-results/screenshots/silver-demo';

test.describe('HFO Silver Demo - Real Architecture', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		// Wait for header (CSS Grid layout, not Golden Layout)
		await page.waitForSelector('.header', { timeout: 15000 });
	});

	test('page loads with correct title', async ({ page }) => {
		await expect(page).toHaveTitle(/HFO Gen87\.X3 Silver Demo/);
		await page.screenshot({ path: join(SCREENSHOTS_DIR, '01-initial-load.png'), fullPage: true });
	});

	test('header displays logo and status bar', async ({ page }) => {
		await expect(page.locator('.logo')).toContainText('HFO Gen87.X3');
		await expect(page.locator('.logo-sub')).toContainText('REAL Adapters');
		await expect(page.locator('#wasmStatus')).toBeVisible();
		await expect(page.locator('#cameraStatus')).toBeVisible();
		await expect(page.locator('#pipelineStatus')).toBeVisible();
	});

	test('all port panels are visible', async ({ page }) => {
		await expect(page.locator('.sensor-panel')).toBeVisible();
		await expect(page.locator('.smoother-panel')).toBeVisible();
		await expect(page.locator('.canvas-panel')).toBeVisible();
		await expect(page.locator('.fsm-panel')).toBeVisible();
		await expect(page.locator('.emitter-panel')).toBeVisible();
		await expect(page.locator('.pipeline-panel')).toBeVisible();
		await page.screenshot({ path: join(SCREENSHOTS_DIR, '02-all-panels.png'), fullPage: true });
	});

	test('sensor panel shows real NPM packages', async ({ page }) => {
		const info = page.locator('.sensor-panel .info-panel');
		await expect(info).toContainText('@mediapipe/tasks-vision');
		await expect(info).toContainText('1eurofilter');
		await expect(info).toContainText('@dimforge/rapier2d-compat');
		await expect(info).toContainText('xstate@5');
	});

	test('smoother panel has three options', async ({ page }) => {
		await expect(page.locator('[data-smoother="1euro"]')).toBeVisible();
		await expect(page.locator('[data-smoother="rapier-smooth"]')).toBeVisible();
		await expect(page.locator('[data-smoother="rapier-predict"]')).toBeVisible();
		// 1euro active by default
		await expect(page.locator('[data-smoother="1euro"]')).toHaveClass(/active/);
	});

	test('smoother selection changes', async ({ page }) => {
		await page.locator('[data-smoother="rapier-smooth"]').click();
		await expect(page.locator('[data-smoother="rapier-smooth"]')).toHaveClass(/active/);
		await expect(page.locator('[data-smoother="1euro"]')).not.toHaveClass(/active/);
		await page.screenshot({
			path: join(SCREENSHOTS_DIR, '03-rapier-selected.png'),
			fullPage: true,
		});
	});

	test('FSM panel shows all states', async ({ page }) => {
		const states = ['DISARMED', 'BASELINE', 'ARMED', 'COMMAND_CLICK', 'COMMAND_NAV'];
		for (const state of states) {
			await expect(page.locator(`[data-state="${state}"]`)).toBeVisible();
		}
		await expect(page.locator('[data-state="DISARMED"]')).toHaveClass(/active/);
	});

	test('pipeline controls exist', async ({ page }) => {
		await expect(page.locator('#startBtn')).toBeVisible();
		await expect(page.locator('#resetBtn')).toBeVisible();
		await expect(page.locator('#mockBtn')).toBeVisible();
		await expect(page.locator('#frameCount')).toBeVisible();
		await expect(page.locator('#eventCount')).toBeVisible();
	});

	test('mock data increments frame count', async ({ page }) => {
		await page.locator('#mockBtn').click();
		await page.waitForFunction(
			() => {
				const fc = document.getElementById('frameCount');
				return fc && Number.parseInt(fc.textContent || '0') > 0;
			},
			{ timeout: 5000 },
		);
		await page.screenshot({ path: join(SCREENSHOTS_DIR, '04-mock-running.png'), fullPage: true });
	});
});
