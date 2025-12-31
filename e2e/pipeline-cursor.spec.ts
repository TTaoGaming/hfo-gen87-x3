/**
 * Pipeline Quad-Cursor E2E Tests with Screenshots
 *
 * Gen87.X3 | Phase: VALIDATE (V)
 *
 * Tests the Golden Layout pipeline cursor demo:
 * - 4 cursors (Raw, 1€, Physics, Prediction)
 * - FSM state panel
 * - Data telemetry panel
 * - Parameter controls
 */

import { expect, test } from "@playwright/test";
import * as fs from "fs";

const DEMO_URL = "http://localhost:9093/simple-pipeline.html";
const SCREENSHOT_DIR = "test-results/pipeline-screenshots";

// Ensure screenshot directory exists
test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe("Pipeline Quad-Cursor Demo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForLoadState("networkidle");
    // Wait for Golden Layout to initialize
    await page.waitForTimeout(1000);
  });

  test("01-layout-panels: Verify all Golden Layout panels exist", async ({
    page,
  }) => {
    // Check for Golden Layout container
    const layoutContainer = page.locator("#layout-container");
    await expect(layoutContainer).toBeVisible();

    // Check for panel titles in tabs
    const cursorTab = page.locator('text="🎯 Quad Cursor View"');
    const dataTab = page.locator('text="📊 Data"');
    const fsmTab = page.locator('text="🔄 FSM State"');
    const paramsTab = page.locator('text="⚙️ Parameters"');
    const logTab = page.locator('text="📝 Event Log"');

    await expect(cursorTab).toBeVisible();
    await expect(dataTab).toBeVisible();
    await expect(fsmTab).toBeVisible();
    await expect(paramsTab).toBeVisible();
    await expect(logTab).toBeVisible();

    // Take full layout screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-golden-layout-panels.png`,
      fullPage: true,
    });

    console.log("✅ All Golden Layout panels visible");
  });

  test("02-quad-cursors: Verify 4 cursor elements exist", async ({ page }) => {
    // Check for cursor elements
    const cursorRaw = page.locator("#cursor-raw");
    const cursorEuro = page.locator("#cursor-euro");
    const cursorPhysics = page.locator("#cursor-physics");
    const cursorPrediction = page.locator("#cursor-prediction");

    await expect(cursorRaw).toBeVisible();
    await expect(cursorEuro).toBeVisible();
    await expect(cursorPhysics).toBeVisible();
    await expect(cursorPrediction).toBeVisible();

    // Check legend
    const legend = page.locator(".cursor-legend");
    await expect(legend).toBeVisible();
    await expect(page.locator("text=Raw (MediaPipe)")).toBeVisible();
    await expect(page.locator("text=1€ Filter")).toBeVisible();
    await expect(page.locator("text=Physics Smoothed")).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-quad-cursors-initial.png`,
      fullPage: true,
    });

    console.log("✅ All 4 quad cursors exist");
  });

  test("03-cursor-tracking: Move mouse and verify cursor positions update", async ({
    page,
  }) => {
    // Find cursor panel
    const cursorPanel = page.locator("#cursor-stage");
    const box = await cursorPanel.boundingBox();
    if (!box) throw new Error("Cursor panel not found");

    // Move to center
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);

    // Verify data panel updates
    const rawX = page.locator("#data-raw-x");
    const rawY = page.locator("#data-raw-y");

    // Values should be around 0.5 (center)
    const xVal = await rawX.textContent();
    const yVal = await rawY.textContent();

    expect(parseFloat(xVal || "0")).toBeGreaterThan(0.3);
    expect(parseFloat(xVal || "0")).toBeLessThan(0.7);
    expect(parseFloat(yVal || "0")).toBeGreaterThan(0.3);
    expect(parseFloat(yVal || "0")).toBeLessThan(0.7);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-cursor-center-position.png`,
      fullPage: true,
    });

    // Move to corner
    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.1);
    await page.waitForTimeout(200);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-cursor-corner-position.png`,
      fullPage: true,
    });

    console.log("✅ Cursor tracking works - telemetry shows position updates");
  });

  test("04-fsm-state-toggle: FSM state transitions work", async ({ page }) => {
    // Initial state should be DISARMED
    const fsmDisplay = page.locator("#fsm-display");
    await expect(fsmDisplay).toHaveText("DISARMED");
    await expect(fsmDisplay).toHaveClass(/DISARMED/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-fsm-state-disarmed.png`,
      fullPage: true,
    });

    // Click toggle button
    const toggleBtn = page.locator("#btn-arm");
    await toggleBtn.click();
    await page.waitForTimeout(100);

    // Should be ARMING
    await expect(fsmDisplay).toHaveText("ARMING");
    await expect(fsmDisplay).toHaveClass(/ARMING/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-fsm-state-arming.png`,
      fullPage: true,
    });

    // Click again -> ARMED
    await toggleBtn.click();
    await page.waitForTimeout(100);
    await expect(fsmDisplay).toHaveText("ARMED");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-fsm-state-armed.png`,
      fullPage: true,
    });

    // Click again -> DOWN_COMMIT
    await toggleBtn.click();
    await page.waitForTimeout(100);
    await expect(fsmDisplay).toHaveText("DOWN_COMMIT");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-fsm-state-down-commit.png`,
      fullPage: true,
    });

    console.log("✅ FSM state transitions: DISARMED → ARMING → ARMED → DOWN_COMMIT");
  });

  test("05-telemetry-data: Data panel shows all 4 pipeline stages", async ({
    page,
  }) => {
    // Move mouse to generate data
    const cursorPanel = page.locator("#cursor-stage");
    const box = await cursorPanel.boundingBox();
    if (!box) throw new Error("Cursor panel not found");

    // Move in a circle to generate velocity data
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const x = box.x + box.width / 2 + Math.cos(angle) * 100;
      const y = box.y + box.height / 2 + Math.sin(angle) * 100;
      await page.mouse.move(x, y);
      await page.waitForTimeout(50);
    }

    // Check all data sections exist
    await expect(page.locator("text=🔴 Raw Input")).toBeVisible();
    await expect(page.locator("text=🟡 1€ Filtered")).toBeVisible();
    await expect(page.locator("text=🟢 Physics Smoothed")).toBeVisible();
    await expect(page.locator("text=🔵 Prediction")).toBeVisible();

    // Check velocity data exists
    const velX = page.locator("#data-vel-x");
    const velY = page.locator("#data-vel-y");
    await expect(velX).toBeVisible();
    await expect(velY).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-telemetry-with-velocity.png`,
      fullPage: true,
    });

    console.log("✅ Telemetry shows all 4 pipeline stages with velocity data");
  });

  test("06-parameter-sliders: Filter parameters are adjustable", async ({
    page,
  }) => {
    // Check 1€ filter parameters
    const minCutoffSlider = page.locator("#param-mincutoff");
    const betaSlider = page.locator("#param-beta");

    await expect(minCutoffSlider).toBeVisible();
    await expect(betaSlider).toBeVisible();

    // Check physics parameters
    const stiffnessSlider = page.locator("#param-stiffness");
    const dampingSlider = page.locator("#param-damping");

    await expect(stiffnessSlider).toBeVisible();
    await expect(dampingSlider).toBeVisible();

    // Check prediction parameter
    const predictionSlider = page.locator("#param-prediction");
    await expect(predictionSlider).toBeVisible();

    // Adjust a slider
    await stiffnessSlider.fill("500");
    await page.waitForTimeout(100);

    const stiffnessVal = page.locator("#val-stiffness");
    await expect(stiffnessVal).toHaveText("500");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-parameters-panel.png`,
      fullPage: true,
    });

    console.log("✅ Parameter sliders are visible and adjustable");
  });

  test("07-full-demo-screenshot: Complete demo with all panels", async ({
    page,
  }) => {
    // Set up interesting state
    const cursorPanel = page.locator("#cursor-stage");
    const box = await cursorPanel.boundingBox();
    if (!box) throw new Error("Cursor panel not found");

    // Generate some movement
    for (let i = 0; i < 20; i++) {
      const x = box.x + box.width * (0.3 + Math.random() * 0.4);
      const y = box.y + box.height * (0.3 + Math.random() * 0.4);
      await page.mouse.move(x, y);
      await page.waitForTimeout(30);
    }

    // Set FSM to ARMED
    const toggleBtn = page.locator("#btn-arm");
    await toggleBtn.click(); // ARMING
    await toggleBtn.click(); // ARMED

    // Final screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-full-demo-armed.png`,
      fullPage: true,
    });

    console.log("✅ Full demo screenshot captured with ARMED state");
  });
});
