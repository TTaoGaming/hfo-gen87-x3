/**
 * Visual Screenshot Test for All Demos
 *
 * Takes screenshots of each port demo to visually verify they work
 */
import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

const DEMOS = [
	{ name: 'index', path: '/', description: 'Demo Index' },
	{
		name: 'port-0-observer',
		path: '/port-0-observer.html',
		description: 'Port 0 Observer - MediaPipe',
	},
	{
		name: 'port-1-bridger',
		path: '/port-1-bridger.html',
		description: 'Port 1 Bridger - Schema Validation',
	},
	{ name: 'port-2-shaper', path: '/port-2-shaper.html', description: 'Port 2 Shaper - Smoothing' },
	{
		name: 'port-3-injector',
		path: '/port-3-injector.html',
		description: 'Port 3 Injector - Events',
	},
	{
		name: 'primitives-visual',
		path: '/primitives-visual.html',
		description: 'Primitives Visual Demo',
	},
];

test.describe('Demo Visual Verification', () => {
	for (const demo of DEMOS) {
		test(`Screenshot: ${demo.description}`, async ({ page }) => {
			// Navigate to the demo
			const response = await page.goto(`${BASE_URL}${demo.path}`, {
				waitUntil: 'networkidle',
				timeout: 30000,
			});

			// Check page loaded successfully
			expect(response?.status()).toBeLessThan(400);

			// Wait for any animations/canvas to render
			await page.waitForTimeout(1000);

			// Check for console errors
			const errors: string[] = [];
			page.on('console', (msg) => {
				if (msg.type() === 'error') {
					errors.push(msg.text());
				}
			});

			// Take screenshot
			await page.screenshot({
				path: `screenshots/${demo.name}.png`,
				fullPage: true,
			});

			// Log any errors found
			if (errors.length > 0) {
				console.log(`Console errors on ${demo.name}:`, errors);
			}
		});
	}
});

test('Check for JavaScript errors on Port 2 Shaper', async ({ page }) => {
	const errors: string[] = [];

	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			errors.push(msg.text());
		}
	});

	page.on('pageerror', (error) => {
		errors.push(error.message);
	});

	await page.goto(`${BASE_URL}/port-2-shaper.html`, {
		waitUntil: 'networkidle',
		timeout: 30000,
	});

	// Wait for demo to initialize
	await page.waitForTimeout(2000);

	// Simulate mouse movement to trigger smoothing
	await page.mouse.move(400, 300);
	await page.waitForTimeout(500);
	await page.mouse.move(500, 400);
	await page.waitForTimeout(500);

	// Take screenshot
	await page.screenshot({
		path: 'screenshots/port-2-shaper-with-mouse.png',
		fullPage: true,
	});

	// Check for errors
	expect(errors, `Found JS errors: ${errors.join(', ')}`).toHaveLength(0);
});
