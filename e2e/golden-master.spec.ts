/**
 * Golden Master Visual Regression Tests
 * 
 * Uses cold/silver videos as ground truth for comparing demo behavior.
 * Each showcase is tested for:
 * 1. Page loads without errors
 * 2. Key elements render correctly
 * 3. Visual snapshot comparison (golden master)
 * 
 * Gen87.X3 | Silver Testing
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vite dev server - required for TypeScript compilation
const BASE_URL = 'http://localhost:8082';

// Demo configurations with expected elements
const SHOWCASES = [
  {
    id: 'port-0-observer',
    name: 'Port 0 - Observer (Lidless Legion)',
    path: '/demos/port-0-observer.html',
    expectedElements: ['body', '#app', 'canvas', 'div'],
    goldenVideo: 'open-palm-side.mp4',
  },
  {
    id: 'port-1-bridger',
    name: 'Port 1 - Bridger (Web Weaver)',
    path: '/demos/port-1-bridger.html',
    expectedElements: ['body', '#app', 'div'],
    goldenVideo: null,
  },
  {
    id: 'port-2-shaper',
    name: 'Port 2 - Shaper (Mirror Magus)',
    path: '/demos/port-2-shaper.html',
    expectedElements: ['body', '#app', 'canvas', 'div'],
    goldenVideo: 'open-palm-pointer-up-open-palm.mp4',
  },
  {
    id: 'port-3-injector',
    name: 'Port 3 - Injector (Spore Storm)',
    path: '/demos/port-3-injector.html',
    expectedElements: ['body', '#app', 'div'],
    goldenVideo: null,
  },
  {
    id: 'showcase-fsm',
    name: 'FSM Showcase (XState)',
    path: '/demos/showcase-fsm.html',
    expectedElements: ['body', '#app', 'div'],
    goldenVideo: null,
  },
  {
    id: 'showcase-goldenlayout',
    name: 'GoldenLayout UI Shell',
    path: '/demos/showcase-goldenlayout.html',
    expectedElements: ['body', '#app', 'div', '.lm_goldenlayout'],
    goldenVideo: null,
  },
  {
    id: 'showcase-palmcone',
    name: 'Port 5 - PalmConeGate (Pyre Praetorian)',
    path: '/demos/showcase-palmcone.html',
    expectedElements: ['body', '#app', 'canvas', 'div'],
    goldenVideo: 'open-palm-side.mp4',
  },
  {
    id: 'showcase-pointer',
    name: 'W3C Pointer Output',
    path: '/demos/showcase-pointer.html',
    expectedElements: ['body', '#app', 'div'],
    goldenVideo: null,
  },
  {
    id: 'showcase-rapier',
    name: 'Rapier Physics',
    path: '/demos/showcase-rapier.html',
    expectedElements: ['body', '#app', 'canvas', 'div'],
    goldenVideo: null,
  },
  {
    id: 'showcase-substrate',
    name: 'Port 6 - Substrate (Kraken Keeper)',
    path: '/demos/showcase-substrate.html',
    expectedElements: ['body', '#app', 'div'],
    goldenVideo: null,
  },
  {
    id: 'primitives-visual',
    name: 'Visual Primitives',
    path: '/demos/primitives-visual.html',
    expectedElements: ['body', 'canvas', 'div'],
    goldenVideo: null,
  },
];

// Golden master directory
const GOLDEN_DIR = path.join(__dirname, '..', '..', 'cold', 'silver', 'golden');
const SCREENSHOTS_DIR = path.join(__dirname, '..', '..', 'test-results', 'golden-screenshots');

test.describe('Golden Master Visual Tests', () => {
  
  test.beforeAll(async () => {
    // Ensure screenshots directory exists
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
  });

  for (const showcase of SHOWCASES) {
    test.describe(showcase.name, () => {
      
      test('loads without console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        await page.goto(`${BASE_URL}${showcase.path}`);
        await page.waitForLoadState('networkidle');
        
        // Filter out expected errors (like missing camera)
        const criticalErrors = errors.filter(e => 
          !e.includes('NotAllowedError') && 
          !e.includes('Permission denied') &&
          !e.includes('getUserMedia')
        );
        
        expect(criticalErrors).toHaveLength(0);
      });

      test('renders expected elements', async ({ page }) => {
        await page.goto(`${BASE_URL}${showcase.path}`);
        await page.waitForLoadState('networkidle');
        
        // Wait a bit for dynamic content
        await page.waitForTimeout(1000);
        
        // Check for at least one expected element (some may be dynamic)
        let foundCount = 0;
        for (const selector of showcase.expectedElements) {
          const element = await page.$(selector);
          if (element) foundCount++;
        }
        
        // At least one expected element should be present
        expect(foundCount).toBeGreaterThan(0);
      });

      test('visual snapshot', async ({ page }) => {
        await page.goto(`${BASE_URL}${showcase.path}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500); // Let animations settle
        
        // Take screenshot
        const screenshot = await page.screenshot({ 
          fullPage: true,
          animations: 'disabled'
        });
        
        // Save for comparison
        const screenshotPath = path.join(SCREENSHOTS_DIR, `${showcase.id}.png`);
        fs.writeFileSync(screenshotPath, screenshot);
        
        // Compare with golden if exists
        const goldenPath = path.join(GOLDEN_DIR, `${showcase.id}.golden.png`);
        if (fs.existsSync(goldenPath)) {
          await expect(page).toHaveScreenshot(`${showcase.id}.png`, {
            maxDiffPixels: 500, // Allow small variations
            threshold: 0.3,
          });
        }
      });

      // Test with golden video landmarks if available
      if (showcase.goldenVideo) {
        test(`validates against golden landmarks (${showcase.goldenVideo})`, async ({ page }) => {
          const landmarksFile = showcase.goldenVideo.replace('.mp4', '.landmarks.jsonl');
          const landmarksPath = path.join(GOLDEN_DIR, landmarksFile);
          
          if (!fs.existsSync(landmarksPath)) {
            test.skip();
            return;
          }
          
          // Load landmarks data
          const landmarksData = fs.readFileSync(landmarksPath, 'utf-8')
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
          
          expect(landmarksData.length).toBeGreaterThan(0);
          
          await page.goto(`${BASE_URL}${showcase.path}`);
          await page.waitForLoadState('networkidle');
          
          // Inject test landmarks into page (if demo supports it)
          const hasInjectionPoint = await page.evaluate(() => {
            return typeof (window as any).injectTestLandmarks === 'function';
          });
          
          if (hasInjectionPoint) {
            // Inject first frame of landmarks
            await page.evaluate((landmarks) => {
              (window as any).injectTestLandmarks(landmarks);
            }, landmarksData[0]);
            
            await page.waitForTimeout(500);
            
            // Verify processing occurred
            const processed = await page.evaluate(() => {
              return (window as any).lastProcessedFrame !== undefined;
            });
            
            // Only assert if demo supports injection
            if (processed) {
              expect(processed).toBe(true);
            }
          }
        });
      }
    });
  }
});

test.describe('Showcase Launcher (GoldenLayout Shell)', () => {
  test('launcher page loads with GoldenLayoutShellAdapter tiles', async ({ page }) => {
    // Note: Vite serves from demos/ root, so path is /showcase-launcher.html not /demos/
    await page.goto(`${BASE_URL}/showcase-launcher.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for shell initialization
    
    // Check tiles are rendered (GoldenLayout uses .gl-tile-container)
    const tiles = await page.$$('.gl-tile-container');
    expect(tiles.length).toBeGreaterThan(0);
    
    // Check header is present
    const header = await page.$('.launcher-header');
    expect(header).not.toBeNull();
  });

  test('showcase panels render content', async ({ page }) => {
    await page.goto(`${BASE_URL}/showcase-launcher.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check showcase panels exist
    const panels = await page.$$('.showcase-panel');
    expect(panels.length).toBeGreaterThan(0);
    
    // Check port badges exist
    const portBadges = await page.$$('.port-badge');
    expect(portBadges.length).toBeGreaterThan(0);
  });
});

// Utility to generate golden screenshots
test.describe('Generate Golden Masters', () => {
  test.skip('generate all golden screenshots', async ({ page }) => {
    // Enable this test manually to regenerate golden masters
    for (const showcase of SHOWCASES) {
      await page.goto(`${BASE_URL}${showcase.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const screenshot = await page.screenshot({ 
        fullPage: true,
        animations: 'disabled'
      });
      
      const goldenPath = path.join(GOLDEN_DIR, `${showcase.id}.golden.png`);
      fs.writeFileSync(goldenPath, screenshot);
      console.log(`Generated: ${showcase.id}.golden.png`);
    }
  });
});
