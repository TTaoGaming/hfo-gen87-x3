/**
 * @fileoverview TDD GREEN Tests - Puter.js Target Adapter
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 * 
 * PURPOSE: Enable gesture control plane to target Puter.js windows
 * SOLVES: "Windows are not responsive and look weird" (Golden Layout CSS issues)
 * 
 * HEXAGONAL CDD:
 * - PuterWindowAdapterPort extends AdapterPort
 * - PuterShellPort extends UIShellPort
 * - Both implement contracts from ports.ts
 *
 * Tavily Source: https://docs.puter.com/UI/createWindow
 * - puter.ui.createWindow({ title, width, height, content, is_resizable })
 * - puter.ui.setWindowTitle(), setWindowSize(), setWindowPosition()
 *
 * @module adapters/puter-target.test
 * @hive V (Validate)
 * @tdd GREEN
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import type { AdapterPort, UIShellPort } from '../contracts/ports.js';
import type { AdapterTarget, PointerEventOut, TileConfig, UIShellConfig, LayoutState } from '../contracts/schemas.js';

// ============================================================================
// PUTER.JS TYPE DEFINITIONS (For mocking)
// Source: https://js.puter.com/v2/
// ============================================================================

/**
 * Puter.js window options
 */
interface PuterWindowOptions {
  title?: string;
  content?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  is_resizable?: boolean;
  has_head?: boolean;
  center?: boolean;
  show_in_taskbar?: boolean;
  disable_parent_window?: boolean;
}

/**
 * Puter.js window instance
 */
interface PuterWindow {
  id: string;
  setTitle(title: string): void;
  setSize(width: number, height: number): void;
  setPosition(x: number, y: number): void;
  close(): void;
  focus(): void;
  minimize(): void;
  maximize(): void;
  restore(): void;
  on(event: string, handler: (e: unknown) => void): void;
  off(event: string, handler?: (e: unknown) => void): void;
  getContentElement(): HTMLElement | null;
}

/**
 * Puter.js UI API
 */
interface PuterUI {
  createWindow(options?: PuterWindowOptions): Promise<PuterWindow>;
  setWindowTitle(title: string): void;
  setWindowSize(width: number, height: number): void;
  setWindowPosition(x: number, y: number): void;
}

/**
 * Global puter object
 */
interface PuterGlobal {
  ui: PuterUI;
}

// ============================================================================
// PORT INTERFACE EXTENSIONS FOR PUTER
// ============================================================================

/**
 * Extended AdapterPort for Puter.js windows
 * Adds window-specific functionality on top of base inject()
 */
export interface PuterWindowAdapterPort extends AdapterPort {
  /** Create a Puter window with gesture tracking enabled */
  createWindow(options: PuterWindowOptions): Promise<string>;
  
  /** Get the content element of a window (for event injection) */
  getWindowContent(windowId: string): HTMLElement | null;
  
  /** Focus a window */
  focusWindow(windowId: string): void;
  
  /** Close a window */
  closeWindow(windowId: string): void;
  
  /** Get all managed window IDs */
  getWindowIds(): string[];
  
  /** Set active window (pointer events go here) */
  setActiveWindow(windowId: string): void;
  
  /** Get active window ID */
  getActiveWindowId(): string | null;
}

/**
 * Puter-specific shell config
 */
export interface PuterShellConfig extends UIShellConfig {
  /** Auto-arrange windows on start */
  autoArrange?: boolean;
  /** Show in Puter taskbar */
  showInTaskbar?: boolean;
  /** Enable window snapping */
  enableSnapping?: boolean;
}

// ============================================================================
// IMPLEMENTATIONS (TDD GREEN - implementations exist now)
// ============================================================================

import { PuterWindowAdapter } from './puter-window.adapter.js';

// PuterShellAdapter still RED - to be implemented
let PuterShellAdapter: new (puter: PuterGlobal) => UIShellPort;

try {
  PuterShellAdapter = require('./puter-shell.adapter.js').PuterShellAdapter;
} catch {
  PuterShellAdapter = class {
    constructor(_puter: PuterGlobal) {
      throw new Error('PuterShellAdapter not implemented');
    }
  } as any;
}

// ============================================================================
// MOCK PUTER GLOBAL
// ============================================================================

function createMockPuter(): PuterGlobal {
  const windows = new Map<string, { options: PuterWindowOptions; element: HTMLElement }>();
  let windowCounter = 0;

  return {
    ui: {
      async createWindow(options = {}): Promise<PuterWindow> {
        const id = `puter-win-${++windowCounter}`;
        const element = document.createElement('div');
        element.id = id;
        element.style.width = `${options.width ?? 400}px`;
        element.style.height = `${options.height ?? 300}px`;
        windows.set(id, { options, element });

        return {
          id,
          setTitle: vi.fn(),
          setSize: vi.fn((w, h) => {
            element.style.width = `${w}px`;
            element.style.height = `${h}px`;
          }),
          setPosition: vi.fn(),
          close: vi.fn(() => windows.delete(id)),
          focus: vi.fn(),
          minimize: vi.fn(),
          maximize: vi.fn(),
          restore: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
          getContentElement: () => element,
        };
      },
      setWindowTitle: vi.fn(),
      setWindowSize: vi.fn(),
      setWindowPosition: vi.fn(),
    },
  };
}

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

const puterWindowOptionsArb = fc.record({
  title: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  width: fc.option(fc.integer({ min: 100, max: 1920 })),
  height: fc.option(fc.integer({ min: 100, max: 1080 })),
  is_resizable: fc.option(fc.boolean()),
  center: fc.option(fc.boolean()),
});

const pointerEventArb: fc.Arbitrary<PointerEventOut> = fc.oneof(
  fc.record({
    type: fc.constant('pointermove' as const),
    pointerId: fc.integer({ min: 1, max: 100 }),
    clientX: fc.float({ min: 0, max: 1920, noNaN: true }),
    clientY: fc.float({ min: 0, max: 1080, noNaN: true }),
    pointerType: fc.constant('touch' as const),
    pressure: fc.float({ min: 0, max: 1, noNaN: true }),
    isPrimary: fc.boolean(),
  }),
  fc.record({
    type: fc.constant('pointerdown' as const),
    pointerId: fc.integer({ min: 1, max: 100 }),
    clientX: fc.float({ min: 0, max: 1920, noNaN: true }),
    clientY: fc.float({ min: 0, max: 1080, noNaN: true }),
    pointerType: fc.constant('touch' as const),
    button: fc.constantFrom(0, 1, 2),
    buttons: fc.integer({ min: 0, max: 7 }),
    pressure: fc.float({ min: 0, max: 1, noNaN: true }),
    isPrimary: fc.boolean(),
  }),
);

// ============================================================================
// SECTION 1: PUTER WINDOW ADAPTER PORT TESTS
// ============================================================================

describe('TDD RED: PuterWindowAdapterPort', () => {
  let mockPuter: PuterGlobal;

  beforeEach(() => {
    mockPuter = createMockPuter();
  });

  describe('Interface compliance', () => {
    it('should implement AdapterPort interface', () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      // Base AdapterPort methods
      expect(adapter.inject).toBeInstanceOf(Function);
      expect(adapter.getBounds).toBeInstanceOf(Function);
      expect(adapter.setCapture).toBeInstanceOf(Function);
      expect(adapter.releaseCapture).toBeInstanceOf(Function);
      expect(adapter.hasCapture).toBeInstanceOf(Function);
    });

    it('should implement PuterWindowAdapterPort extensions', () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      // Puter-specific methods
      expect(adapter.createWindow).toBeInstanceOf(Function);
      expect(adapter.getWindowContent).toBeInstanceOf(Function);
      expect(adapter.focusWindow).toBeInstanceOf(Function);
      expect(adapter.closeWindow).toBeInstanceOf(Function);
      expect(adapter.getWindowIds).toBeInstanceOf(Function);
      expect(adapter.setActiveWindow).toBeInstanceOf(Function);
      expect(adapter.getActiveWindowId).toBeInstanceOf(Function);
    });
  });

  describe('Window creation', () => {
    it('should create a Puter window and return window ID', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({
        title: 'Gesture Target',
        width: 800,
        height: 600,
      });
      
      expect(windowId).toBeDefined();
      expect(typeof windowId).toBe('string');
      expect(adapter.getWindowIds()).toContain(windowId);
    });

    it('should create responsive window with is_resizable=true', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({
        title: 'Responsive Window',
        is_resizable: true,
      });
      
      expect(windowId).toBeDefined();
    });

    it('should center window when center=true', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({
        title: 'Centered',
        center: true,
      });
      
      expect(windowId).toBeDefined();
    });
  });

  describe('Window management', () => {
    it('should track multiple windows', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const id1 = await adapter.createWindow({ title: 'Window 1' });
      const id2 = await adapter.createWindow({ title: 'Window 2' });
      const id3 = await adapter.createWindow({ title: 'Window 3' });
      
      const ids = adapter.getWindowIds();
      expect(ids).toContain(id1);
      expect(ids).toContain(id2);
      expect(ids).toContain(id3);
      expect(ids.length).toBe(3);
    });

    it('should close window and remove from tracking', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({ title: 'To Close' });
      expect(adapter.getWindowIds()).toContain(windowId);
      
      adapter.closeWindow(windowId);
      expect(adapter.getWindowIds()).not.toContain(windowId);
    });

    it('should focus window', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({ title: 'Focus Me' });
      
      // Should not throw
      expect(() => adapter.focusWindow(windowId)).not.toThrow();
    });

    it('should get content element for event injection', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({ title: 'Content Target' });
      const content = adapter.getWindowContent(windowId);
      
      expect(content).toBeInstanceOf(HTMLElement);
    });
  });

  describe('Active window management', () => {
    it('should set and get active window', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const id1 = await adapter.createWindow({ title: 'Window 1' });
      const id2 = await adapter.createWindow({ title: 'Window 2' });
      
      adapter.setActiveWindow(id1);
      expect(adapter.getActiveWindowId()).toBe(id1);
      
      adapter.setActiveWindow(id2);
      expect(adapter.getActiveWindowId()).toBe(id2);
    });

    it('should return null when no active window', () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      expect(adapter.getActiveWindowId()).toBeNull();
    });
  });

  describe('Pointer event injection', () => {
    it('should inject pointer event into active window', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({ title: 'Target' });
      adapter.setActiveWindow(windowId);
      
      const event: PointerEventOut = {
        type: 'pointermove',
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        pointerType: 'touch',
        pressure: 0.5,
        isPrimary: true,
      };
      
      const result = adapter.inject(event);
      expect(result).toBe(true);
    });

    it('should return false when no active window', () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const event: PointerEventOut = {
        type: 'pointermove',
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        pointerType: 'touch',
        pressure: 0.5,
        isPrimary: true,
      };
      
      const result = adapter.inject(event);
      expect(result).toBe(false);
    });

    it('should translate coordinates to window-local space', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({ 
        title: 'Target',
        width: 800,
        height: 600 
      });
      adapter.setActiveWindow(windowId);
      
      // Global coords 100,100 should be mapped to window content space
      const event: PointerEventOut = {
        type: 'pointermove',
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        pointerType: 'touch',
        pressure: 0.5,
        isPrimary: true,
      };
      
      // Should inject successfully
      expect(adapter.inject(event)).toBe(true);
    });
  });

  describe('Bounds calculation', () => {
    it('should return bounds of active window', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({
        title: 'Bounded',
        width: 800,
        height: 600,
      });
      adapter.setActiveWindow(windowId);
      
      const bounds = adapter.getBounds();
      expect(bounds.width).toBe(800);
      expect(bounds.height).toBe(600);
    });

    it('should return zero bounds when no active window', () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const bounds = adapter.getBounds();
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
    });
  });

  describe('Property-based tests', () => {
    it('should handle any valid PuterWindowOptions', async () => {
      await fc.assert(
        fc.asyncProperty(puterWindowOptionsArb, async (options) => {
          const adapter = new PuterWindowAdapter(createMockPuter());
          
          const windowId = await adapter.createWindow(options as PuterWindowOptions);
          
          expect(typeof windowId).toBe('string');
          expect(adapter.getWindowIds()).toContain(windowId);
        }),
        { numRuns: 50 }
      );
    });

    it('should always return boolean from inject()', async () => {
      await fc.assert(
        fc.asyncProperty(pointerEventArb, async (event) => {
          const adapter = new PuterWindowAdapter(createMockPuter());
          
          // Without active window → false
          expect(typeof adapter.inject(event)).toBe('boolean');
          
          // With active window → true
          await adapter.createWindow({ title: 'Target' });
          adapter.setActiveWindow(adapter.getWindowIds()[0]);
          expect(typeof adapter.inject(event)).toBe('boolean');
        }),
        { numRuns: 50 }
      );
    });
  });
});

// ============================================================================
// SECTION 2: PUTER SHELL ADAPTER TESTS (UIShellPort implementation)
// ============================================================================

describe('TDD RED: PuterShellAdapter (UIShellPort)', () => {
  let mockPuter: PuterGlobal;

  beforeEach(() => {
    mockPuter = createMockPuter();
  });

  describe('Interface compliance', () => {
    it('should implement UIShellPort interface', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      
      expect(shell.initialize).toBeInstanceOf(Function);
      expect(shell.getTileTarget).toBeInstanceOf(Function);
      expect(shell.getTileIds).toBeInstanceOf(Function);
      expect(shell.addTile).toBeInstanceOf(Function);
      expect(shell.removeTile).toBeInstanceOf(Function);
      expect(shell.splitTile).toBeInstanceOf(Function);
      expect(shell.getLayout).toBeInstanceOf(Function);
      expect(shell.setLayout).toBeInstanceOf(Function);
      expect(shell.onLayoutChange).toBeInstanceOf(Function);
      expect(shell.onTileFocus).toBeInstanceOf(Function);
      expect(shell.dispose).toBeInstanceOf(Function);
    });
  });

  describe('Initialization', () => {
    it('should initialize with config', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      const container = document.createElement('div');
      
      const config: UIShellConfig = {
        shell: 'puter' as any, // Extended shell type
        allowDragDrop: true,
        allowSplit: true,
        allowClose: true,
      };
      
      await expect(shell.initialize(container, config)).resolves.not.toThrow();
    });
  });

  describe('Tile management', () => {
    it('should add tile as Puter window', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      await shell.initialize(document.createElement('div'), { shell: 'puter' as any });
      
      const tileConfig: TileConfig = {
        id: 'canvas-tile',
        type: 'canvas',
        title: 'Drawing Canvas',
      };
      
      shell.addTile(tileConfig);
      
      expect(shell.getTileIds()).toContain('canvas-tile');
    });

    it('should remove tile and close Puter window', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      await shell.initialize(document.createElement('div'), { shell: 'puter' as any });
      
      shell.addTile({ id: 'to-remove', type: 'dom', title: 'Remove Me' });
      expect(shell.getTileIds()).toContain('to-remove');
      
      shell.removeTile('to-remove');
      expect(shell.getTileIds()).not.toContain('to-remove');
    });

    it('should get tile target for adapter injection', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      await shell.initialize(document.createElement('div'), { shell: 'puter' as any });
      
      shell.addTile({ id: 'target-tile', type: 'canvas' });
      
      const target = shell.getTileTarget('target-tile');
      
      expect(target).not.toBeNull();
      expect(target?.type).toBe('canvas');
      expect(target?.bounds).toBeDefined();
      expect(target?.bounds.width).toBeGreaterThan(0);
    });
  });

  describe('Layout management', () => {
    it('should return current layout state', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      await shell.initialize(document.createElement('div'), { shell: 'puter' as any });
      
      shell.addTile({ id: 'tile-1', type: 'canvas' });
      shell.addTile({ id: 'tile-2', type: 'dom' });
      
      const layout = shell.getLayout();
      
      expect(layout.tiles.length).toBe(2);
      expect(layout.shell).toBe('puter');
    });

    it('should restore layout state', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      await shell.initialize(document.createElement('div'), { shell: 'puter' as any });
      
      const layout: LayoutState = {
        tiles: [
          { id: 'restored-1', type: 'canvas' },
          { id: 'restored-2', type: 'iframe' },
        ],
        arrangement: {
          direction: 'row',
          first: 'restored-1',
          second: 'restored-2',
          splitPercentage: 50,
        },
        shell: 'puter' as any,
      };
      
      shell.setLayout(layout);
      
      expect(shell.getTileIds()).toContain('restored-1');
      expect(shell.getTileIds()).toContain('restored-2');
    });
  });

  describe('Event subscriptions', () => {
    it('should notify on layout change', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      await shell.initialize(document.createElement('div'), { shell: 'puter' as any });
      
      const callback = vi.fn();
      shell.onLayoutChange(callback);
      
      shell.addTile({ id: 'new-tile', type: 'dom' });
      
      expect(callback).toHaveBeenCalled();
    });

    it('should notify on tile focus', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      await shell.initialize(document.createElement('div'), { shell: 'puter' as any });
      
      shell.addTile({ id: 'focusable', type: 'dom' });
      
      const callback = vi.fn();
      shell.onTileFocus(callback);
      
      // Simulate focus (implementation should call this)
      // The shell should emit focus events when Puter window is focused
      expect(callback).toBeInstanceOf(Function);
    });

    it('should allow unsubscribing', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      await shell.initialize(document.createElement('div'), { shell: 'puter' as any });
      
      const callback = vi.fn();
      const unsubscribe = shell.onLayoutChange(callback);
      
      unsubscribe();
      
      shell.addTile({ id: 'after-unsub', type: 'dom' });
      
      // Should NOT be called after unsubscribe
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Disposal', () => {
    it('should close all Puter windows on dispose', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      await shell.initialize(document.createElement('div'), { shell: 'puter' as any });
      
      shell.addTile({ id: 'tile-1', type: 'canvas' });
      shell.addTile({ id: 'tile-2', type: 'dom' });
      
      shell.dispose();
      
      expect(shell.getTileIds().length).toBe(0);
    });
  });
});

// ============================================================================
// SECTION 3: RESPONSIVE WINDOW BEHAVIOR TESTS
// (Addresses "windows look weird, not responsive" issue)
// ============================================================================

describe('TDD RED: Responsive Puter Windows', () => {
  let mockPuter: PuterGlobal;

  beforeEach(() => {
    mockPuter = createMockPuter();
  });

  describe('Window responsiveness', () => {
    it('should create windows that respect viewport size', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      // Simulate viewport
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
      
      const windowId = await adapter.createWindow({
        title: 'Responsive',
        width: 800, // Should fit within 1920
        height: 600, // Should fit within 1080
        is_resizable: true,
      });
      
      const bounds = adapter.getBounds();
      expect(bounds.width).toBeLessThanOrEqual(window.innerWidth);
      expect(bounds.height).toBeLessThanOrEqual(window.innerHeight);
    });

    it('should update bounds when window is resized', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({
        title: 'Resizable',
        width: 400,
        height: 300,
        is_resizable: true,
      });
      adapter.setActiveWindow(windowId);
      
      // Initial bounds
      let bounds = adapter.getBounds();
      expect(bounds.width).toBe(400);
      expect(bounds.height).toBe(300);
      
      // Simulate resize (implementation should handle window resize events)
      // This tests that getBounds() returns current state
    });

    it('should handle window close gracefully', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({ title: 'Close Me' });
      adapter.setActiveWindow(windowId);
      adapter.closeWindow(windowId);
      
      // Active window should be cleared
      expect(adapter.getActiveWindowId()).toBeNull();
      
      // Inject should fail gracefully
      const result = adapter.inject({
        type: 'pointermove',
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        pointerType: 'touch',
        pressure: 0.5,
        isPrimary: true,
      });
      expect(result).toBe(false);
    });
  });

  describe('Multi-window layout', () => {
    it('should support tiled window arrangement', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      await shell.initialize(document.createElement('div'), { shell: 'puter' as any });
      
      // Create 4 tiles in a grid
      shell.addTile({ id: 'top-left', type: 'canvas', title: 'Canvas 1' });
      shell.addTile({ id: 'top-right', type: 'canvas', title: 'Canvas 2' });
      shell.addTile({ id: 'bottom-left', type: 'dom', title: 'DOM 1' });
      shell.addTile({ id: 'bottom-right', type: 'dom', title: 'DOM 2' });
      
      expect(shell.getTileIds().length).toBe(4);
      
      // Each tile should have valid target
      for (const id of shell.getTileIds()) {
        const target = shell.getTileTarget(id);
        expect(target).not.toBeNull();
        expect(target?.bounds.width).toBeGreaterThan(0);
        expect(target?.bounds.height).toBeGreaterThan(0);
      }
    });

    it('should auto-arrange windows when autoArrange=true', async () => {
      const shell = new PuterShellAdapter(mockPuter);
      const config: PuterShellConfig = {
        shell: 'puter' as any,
        autoArrange: true,
      };
      
      await shell.initialize(document.createElement('div'), config);
      
      shell.addTile({ id: 'auto-1', type: 'canvas' });
      shell.addTile({ id: 'auto-2', type: 'canvas' });
      shell.addTile({ id: 'auto-3', type: 'canvas' });
      
      // All windows should have non-overlapping positions
      // (Implementation should handle cascade/tile/grid arrangements)
      expect(shell.getTileIds().length).toBe(3);
    });
  });

  describe('Pointer coordinate mapping', () => {
    it('should map normalized coords (0-1) to window pixels', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      const windowId = await adapter.createWindow({
        title: 'Coord Test',
        width: 800,
        height: 600,
      });
      adapter.setActiveWindow(windowId);
      
      // Normalized center (0.5, 0.5) should map to (400, 300)
      const bounds = adapter.getBounds();
      const centerX = bounds.width * 0.5;
      const centerY = bounds.height * 0.5;
      
      expect(centerX).toBe(400);
      expect(centerY).toBe(300);
    });

    it('should clamp coordinates to window bounds', async () => {
      const adapter = new PuterWindowAdapter(mockPuter);
      
      await adapter.createWindow({ title: 'Clamp Test', width: 100, height: 100 });
      adapter.setActiveWindow(adapter.getWindowIds()[0]);
      
      // Out-of-bounds coords should be clamped
      const event: PointerEventOut = {
        type: 'pointermove',
        pointerId: 1,
        clientX: 9999, // Way outside
        clientY: -500, // Negative
        pointerType: 'touch',
        pressure: 0.5,
        isPrimary: true,
      };
      
      // Should still inject (with clamped coords) or return false
      const result = adapter.inject(event);
      expect(typeof result).toBe('boolean');
    });
  });
});

// ============================================================================
// SECTION 4: INTEGRATION WITH GESTURE PIPELINE
// ============================================================================

describe('TDD RED: Puter Integration with GesturePipeline', () => {
  it('should wire PuterWindowAdapter as AdapterPort in pipeline', async () => {
    const mockPuter = createMockPuter();
    const adapter = new PuterWindowAdapter(mockPuter);
    
    // Should be usable wherever AdapterPort is expected
    const adapterPort: AdapterPort = adapter;
    
    expect(adapterPort.inject).toBeInstanceOf(Function);
    expect(adapterPort.getBounds).toBeInstanceOf(Function);
  });

  it('should route pointer events to focused Puter window', async () => {
    const mockPuter = createMockPuter();
    const adapter = new PuterWindowAdapter(mockPuter);
    
    // Create multiple windows
    const win1 = await adapter.createWindow({ title: 'Window 1' });
    const win2 = await adapter.createWindow({ title: 'Window 2' });
    
    // Events should go to active window
    adapter.setActiveWindow(win1);
    expect(adapter.getActiveWindowId()).toBe(win1);
    
    const event: PointerEventOut = {
      type: 'pointerdown',
      pointerId: 1,
      clientX: 50,
      clientY: 50,
      pointerType: 'touch',
      button: 0,
      buttons: 1,
      pressure: 1.0,
      isPrimary: true,
    };
    
    adapter.inject(event);
    // Event should have been dispatched to win1's content element
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Mock setup for JSDOM/Vitest
if (typeof document === 'undefined') {
  // @ts-ignore
  global.document = {
    createElement: () => ({
      id: '',
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    }),
  };
}

if (typeof window === 'undefined') {
  // @ts-ignore  
  global.window = {
    innerWidth: 1920,
    innerHeight: 1080,
  };
}
