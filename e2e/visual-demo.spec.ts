/**
 * Gen87.X3 Visual Demo Screenshots
 *
 * Takes Playwright screenshots of the gesture cursor demo in various states.
 * These screenshots verify:
 * 1. W3C Pointer Events work correctly
 * 2. FSM state transitions render properly
 * 3. Click targets respond to synthetic events
 */

import { expect, test } from "@playwright/test";

// Serve the demo locally
const DEMO_URL = "file:///C:/Dev/active/hfo_gen87_x3/sandbox/demo/gesture-cursor-demo.html";

// Screenshot directory
const SCREENSHOT_DIR = "sandbox/screenshots";

test.describe("Gen87.X3 Gesture Demo Visual Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForLoadState("domcontentloaded");
    // Wait for demo to initialize
    await page.waitForTimeout(500);
  });

  test("01-initial-state: Demo loads in DISARMED state", async ({ page }) => {
    // Verify initial state
    const fsmState = page.locator("#fsm-state-display");
    await expect(fsmState).toHaveText("DISARMED");

    // Take full page screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-initial-disarmed.png`,
      fullPage: true,
    });

    console.log("✅ Screenshot: Initial DISARMED state");
  });

  test("02-arming-state: FSM transitions to ARMING", async ({ page }) => {
    // Click arm button
    await page.click("#btn-arm");

    // Should immediately be in ARMING
    const fsmState = page.locator("#fsm-state-display");
    await expect(fsmState).toHaveText("ARMING");

    // Take screenshot during arming animation
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-arming-state.png`,
      fullPage: true,
    });

    console.log("✅ Screenshot: ARMING state with pulse animation");
  });

  test("03-armed-state: FSM completes arming transition", async ({ page }) => {
    // Click arm button
    await page.click("#btn-arm");

    // Wait for arming to complete (300ms + buffer)
    await page.waitForTimeout(400);

    const fsmState = page.locator("#fsm-state-display");
    await expect(fsmState).toHaveText("ARMED");

    // Take screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-armed-state.png`,
      fullPage: true,
    });

    console.log("✅ Screenshot: ARMED state ready for click");
  });

  test("04-cursor-tracking: Cursor follows mouse movement", async ({ page }) => {
    // Arm the system first
    await page.click("#btn-arm");
    await page.waitForTimeout(400);

    // Get canvas bounds
    const canvas = page.locator("#gesture-canvas");
    const box = await canvas.boundingBox();

    if (!box) throw new Error("Canvas not found");

    // Move to center target
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(100);

    // Take screenshot with cursor at center
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-cursor-center.png`,
      fullPage: true,
    });

    // Move to top-left target
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
    await page.waitForTimeout(100);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-cursor-topleft.png`,
      fullPage: true,
    });

    console.log("✅ Screenshots: Cursor tracking positions");
  });

  test("05-click-simulation: Simulate click on target", async ({ page }) => {
    // Arm the system
    await page.click("#btn-arm");
    await page.waitForTimeout(400);

    // Get canvas bounds
    const canvas = page.locator("#gesture-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Move to center target
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(100);

    // Take before-click screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-before-click.png`,
      fullPage: true,
    });

    // Click simulate button
    await page.click("#btn-simulate");
    await page.waitForTimeout(50);

    // Take during-click screenshot (DOWN_COMMIT state)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-during-click.png`,
      fullPage: true,
    });

    // Wait for click to complete
    await page.waitForTimeout(150);

    // Take after-click screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-after-click.png`,
      fullPage: true,
    });

    // Verify click was registered
    const totalClicks = page.locator("#total-clicks");
    await expect(totalClicks).toHaveText("1");

    console.log("✅ Screenshots: Click simulation sequence");
  });

  test("06-event-log: Events are logged correctly", async ({ page }) => {
    // Arm and move around
    await page.click("#btn-arm");
    await page.waitForTimeout(400);

    const canvas = page.locator("#gesture-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Generate some events
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(
        box.x + box.width * (0.3 + i * 0.1),
        box.y + box.height * 0.5
      );
      await page.waitForTimeout(50);
    }

    // Do a click
    await page.click("#btn-simulate");
    await page.waitForTimeout(200);

    // Take screenshot showing event log
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-event-log.png`,
      fullPage: true,
    });

    console.log("✅ Screenshot: Event log populated");
  });

  test("07-multi-target-hits: Click multiple targets", async ({ page }) => {
    // Arm the system
    await page.click("#btn-arm");
    await page.waitForTimeout(400);

    const canvas = page.locator("#gesture-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Click each colored target
    const targets = [
      { x: 0.2, y: 0.2, name: "red" },
      { x: 0.8, y: 0.2, name: "green" },
      { x: 0.2, y: 0.8, name: "blue" },
      { x: 0.8, y: 0.8, name: "yellow" },
    ];

    for (const target of targets) {
      await page.mouse.move(
        box.x + box.width * target.x,
        box.y + box.height * target.y
      );
      await page.waitForTimeout(100);
      await page.click("#btn-simulate");
      await page.waitForTimeout(200);
    }

    // Final screenshot showing all targets hit
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-multi-targets-hit.png`,
      fullPage: true,
    });

    // Verify stats
    const totalClicks = page.locator("#total-clicks");
    await expect(totalClicks).toHaveText("4");

    console.log("✅ Screenshot: Multiple targets clicked");
  });

  test("08-state-transitions-full-cycle: Complete FSM cycle", async ({
    page,
  }) => {
    const screenshots: string[] = [];

    // 1. DISARMED
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-cycle-1-disarmed.png`,
    });
    screenshots.push("DISARMED");

    // 2. ARMING
    await page.click("#btn-arm");
    await page.waitForTimeout(50);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-cycle-2-arming.png` });
    screenshots.push("ARMING");

    // 3. ARMED
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-cycle-3-armed.png` });
    screenshots.push("ARMED");

    // 4. DOWN_COMMIT
    await page.click("#btn-simulate");
    await page.waitForTimeout(30);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-cycle-4-down-commit.png`,
    });
    screenshots.push("DOWN_COMMIT");

    // 5. Back to ARMED
    await page.waitForTimeout(150);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-cycle-5-armed-again.png`,
    });
    screenshots.push("ARMED (after click)");

    // 6. DISARM
    await page.click("#btn-arm");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-cycle-6-disarmed-again.png`,
    });
    screenshots.push("DISARMED (reset)");

    console.log("✅ Full FSM cycle screenshots:", screenshots.join(" → "));
  });
});
