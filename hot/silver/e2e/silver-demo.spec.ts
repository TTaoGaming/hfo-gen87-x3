/**
 * HFO Silver Demo E2E Tests — REAL Architecture
 *
 * Gen87.X3 | Silver Layer | Playwright E2E with Screenshots
 *
 * Tests the REAL architecture demo using:
 * - GoldenLayoutShellAdapter (UIShellPort)
 * - HFOPortFactory (DI wiring)
 * - TileComposer (per-tile pipelines)
 * - Real npm packages: golden-layout, 1eurofilter, xstate
 *
 * NOT testing mock CSS Grid layout.
 */
import { expect, test } from '@playwright/test';
import { join } from 'path';

const SCREENSHOTS_DIR = 'test-results/screenshots/silver-demo';

test.describe('HFO Silver Demo — REAL Golden Layout Architecture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for Golden Layout (lm_goldenlayout class)
    await page.waitForSelector('.lm_goldenlayout, .header', { timeout: 15000 });
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/HFO Gen87\.X3 Silver Demo.*REAL/);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '01-initial-load.png'), fullPage: true });
  });

  test('header shows REAL architecture status indicators', async ({ page }) => {
    await expect(page.locator('.logo')).toContainText('HFO Gen87.X3');
    await expect(page.locator('.logo-sub')).toContainText('REAL Architecture');
    
    // Check real architecture status indicators (not mock)
    await expect(page.locator('#goldenLayoutStatus')).toBeVisible();
    await expect(page.locator('#factoryStatus')).toBeVisible();
    await expect(page.locator('#composerStatus')).toBeVisible();
  });

  test('Golden Layout container is present (NOT CSS Grid)', async ({ page }) => {
    // REAL architecture uses #layout-container with Golden Layout
    await expect(page.locator('#layout-container')).toBeVisible();
    
    // Golden Layout adds .lm_goldenlayout class when initialized
    // If init fails, this selector won't exist
    const glContainer = page.locator('.lm_goldenlayout');
    await expect(glContainer).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '02-golden-layout.png'), fullPage: true });
  });

  test('Golden Layout tiles are created via UIShellPort.addTile()', async ({ page }) => {
    // Golden Layout creates .lm_content for each tile
    const tiles = page.locator('.lm_content');
    
    // Wait for tiles to be created
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });
    
    // We add 6 tiles: camera, pipeline, smoother, fsm, debug, architecture
    const count = await tiles.count();
    expect(count).toBeGreaterThanOrEqual(1);
    
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '03-tiles.png'), fullPage: true });
  });

  test('Pipeline status shows real adapters', async ({ page }) => {
    // Find pipeline panel content
    const pipelinePanel = page.locator('.panel-content:has-text("Pipeline Status")');
    
    // Check REAL adapter names are displayed
    await expect(pipelinePanel).toContainText('MediaPipeAdapter');
    await expect(pipelinePanel).toContainText('OneEuroExemplarAdapter');
    await expect(pipelinePanel).toContainText('XStateFSMAdapter');
    await expect(pipelinePanel).toContainText('PointerEventAdapter');
    await expect(pipelinePanel).toContainText('GoldenLayoutShellAdapter');
  });

  test('Architecture panel confirms NO MOCKS', async ({ page }) => {
    // Find architecture panel
    const archPanel = page.locator('.panel-content:has-text("Real Architecture")');
    
    // Verify real adapter names
    await expect(archPanel).toContainText('GoldenLayoutShellAdapter');
    await expect(archPanel).toContainText('OneEuroExemplarAdapter');
    await expect(archPanel).toContainText('XStateFSMAdapter');
    await expect(archPanel).toContainText('HFOPortFactory');
    await expect(archPanel).toContainText('TileComposer');
    
    // Verify NO MOCKS message
    await expect(archPanel).toContainText('NO MOCKS');
    
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '04-architecture.png'), fullPage: true });
  });

  test('Smoother controls with REAL adapter types', async ({ page }) => {
    // Find smoother panel
    const smootherPanel = page.locator('.panel-content:has-text("Smoother Config")');
    
    // Check real smoother options
    await expect(smootherPanel.locator('[data-smoother="1euro"]')).toBeVisible();
    await expect(smootherPanel.locator('[data-smoother="rapier-smooth"]')).toBeVisible();
    await expect(smootherPanel.locator('[data-smoother="rapier-predict"]')).toBeVisible();
    
    // Verify npm package references
    await expect(smootherPanel).toContainText('1eurofilter@1.2.2');
    await expect(smootherPanel).toContainText('@dimforge/rapier2d-compat');
  });

  test('FSM state display (XStateFSMAdapter)', async ({ page }) => {
    // Find FSM panel
    const fsmPanel = page.locator('.panel-content:has-text("FSM State")');
    
    // Check initial state
    const stateDisplay = fsmPanel.locator('#fsm-state');
    await expect(stateDisplay).toBeVisible();
    await expect(stateDisplay).toHaveAttribute('data-state', 'IDLE');
    
    // Verify XState reference
    await expect(fsmPanel).toContainText('XStateFSMAdapter');
  });

  test('Debug console shows initialization messages', async ({ page }) => {
    // Find debug console
    const debugConsole = page.locator('#debug-console');
    await expect(debugConsole).toBeVisible();
    
    // Wait for init messages
    await page.waitForTimeout(2000);
    
    // Check for real architecture init messages
    await expect(debugConsole).toContainText('HFOPortFactory');
    await expect(debugConsole).toContainText('GoldenLayoutShellAdapter');
    
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '05-debug-console.png'), fullPage: true });
  });

  test('Cursor overlay responds to mouse (real SmootherPort)', async ({ page }) => {
    const cursorOverlay = page.locator('#cursor-overlay');
    
    // Initially hidden
    await expect(cursorOverlay).not.toHaveClass(/active/);
    
    // Move mouse to trigger real smoother
    await page.mouse.move(400, 300);
    await page.waitForTimeout(100);
    
    // Cursor should now be visible (driven by real OneEuroExemplarAdapter)
    await expect(cursorOverlay).toHaveClass(/active/);
    
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '06-cursor-overlay.png'), fullPage: true });
  });

  test('Smoother option selection works', async ({ page }) => {
    // Find smoother options
    const oneEuroOption = page.locator('[data-smoother="1euro"]');
    const rapierOption = page.locator('[data-smoother="rapier-smooth"]');
    
    // 1€ should be active by default
    await expect(oneEuroOption).toHaveClass(/active/);
    await expect(rapierOption).not.toHaveClass(/active/);
    
    // Click rapier option
    await rapierOption.click();
    
    // Rapier should now be active
    await expect(rapierOption).toHaveClass(/active/);
    await expect(oneEuroOption).not.toHaveClass(/active/);
  });

  test('Status indicators turn green on successful init', async ({ page }) => {
    // Wait for initialization
    await page.waitForTimeout(3000);
    
    // Check all three status indicators are ready (green)
    await expect(page.locator('#goldenLayoutStatus.ready')).toBeVisible();
    await expect(page.locator('#factoryStatus.ready')).toBeVisible();
    await expect(page.locator('#composerStatus.ready')).toBeVisible();
    
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '07-status-ready.png'), fullPage: true });
  });
});
