/**
 * @vitest-environment jsdom
 * @fileoverview daedalOS Target Adapter Tests
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 * Port 5 (Pyre Praetorian/DEFEND)
 *
 * Tests the DaedalOSTargetAdapter against the AdapterPort interface contract
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PointerEventOut } from '../contracts/schemas.js';
import {
	DaedalOSTargetAdapter,
	createDaedalOSAdapter,
	generateInjectionScript,
} from './daedalos-target.adapter.js';

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Mock elementFromPoint since jsdom doesn't implement it
 * Maps x,y coordinates to elements based on their computed positions
 */
function mockElementFromPoint(root: HTMLElement) {
	const originalElementFromPoint = document.elementFromPoint;

	document.elementFromPoint = vi.fn((x: number, y: number): Element | null => {
		// Find all elements and check if point is inside
		const windows = root.querySelectorAll('.rnd-window');
		for (const win of windows) {
			const rect = win.getBoundingClientRect();
			if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
				// Check for children that might be more specific
				const content = win.querySelector('.window-content');
				if (content) {
					const contentRect = content.getBoundingClientRect();
					if (
						x >= contentRect.left &&
						x <= contentRect.right &&
						y >= contentRect.top &&
						y <= contentRect.bottom
					) {
						return content;
					}
				}
				return win;
			}
		}

		// Check desktop
		const desktop = root.querySelector('.StyledDesktop');
		if (desktop) {
			const rect = desktop.getBoundingClientRect();
			if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
				return desktop;
			}
		}

		return root.contains(document.documentElement) ? root : null;
	});

	return () => {
		document.elementFromPoint = originalElementFromPoint;
	};
}

/**
 * Mock event constructors to avoid jsdom's "view is not of type Window" bug.
 * jsdom's internal checks fail even when ownerDocument.defaultView is valid.
 * These mocks allow testing adapter logic; E2E should use Playwright.
 */
let OriginalPointerEvent: typeof PointerEvent;
let OriginalMouseEvent: typeof MouseEvent;

function mockEventConstructors() {
	OriginalPointerEvent = globalThis.PointerEvent;
	OriginalMouseEvent = globalThis.MouseEvent;

	globalThis.PointerEvent = class extends Event {
		readonly pointerId: number;
		readonly pointerType: string;
		readonly clientX: number;
		readonly clientY: number;
		readonly pressure: number;
		readonly button: number;
		readonly buttons: number;

		constructor(type: string, init?: PointerEventInit) {
			super(type, init);
			this.pointerId = init?.pointerId ?? 0;
			this.pointerType = init?.pointerType ?? 'mouse';
			this.clientX = init?.clientX ?? 0;
			this.clientY = init?.clientY ?? 0;
			this.pressure = init?.pressure ?? 0;
			this.button = init?.button ?? 0;
			this.buttons = init?.buttons ?? 0;
		}
	} as unknown as typeof PointerEvent;

	globalThis.MouseEvent = class extends Event {
		readonly clientX: number;
		readonly clientY: number;
		readonly button: number;
		readonly buttons: number;

		constructor(type: string, init?: MouseEventInit) {
			super(type, init);
			this.clientX = init?.clientX ?? 0;
			this.clientY = init?.clientY ?? 0;
			this.button = init?.button ?? 0;
			this.buttons = init?.buttons ?? 0;
		}
	} as unknown as typeof MouseEvent;
}

function restoreEventConstructors() {
	globalThis.PointerEvent = OriginalPointerEvent;
	globalThis.MouseEvent = OriginalMouseEvent;
}

/**
 * Create a mock DOM environment simulating daedalOS
 */
function createMockDaedalOSEnvironment(): HTMLElement {
	const root = document.createElement('div');
	root.setAttribute('data-testid', 'daedalos-root');

	// Create desktop element with proper bounds
	const desktop = document.createElement('div');
	desktop.className = 'StyledDesktop';
	desktop.setAttribute('data-testid', 'desktop');
	desktop.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    width: 1920px;
    height: 1080px;
  `;
	root.appendChild(desktop);

	// Create a few mock windows with explicit positions
	for (let i = 0; i < 3; i++) {
		const win = document.createElement('section');
		win.className = 'rnd-window';
		win.setAttribute('data-id', `window-${i}`);

		// Set fixed positions that can be queried
		const left = 100 + i * 150;
		const top = 100 + i * 100;
		win.style.cssText = `
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      width: 300px;
      height: 200px;
    `;

		// Mock getBoundingClientRect for this element
		vi.spyOn(win, 'getBoundingClientRect').mockReturnValue({
			x: left,
			y: top,
			left: left,
			top: top,
			right: left + 300,
			bottom: top + 200,
			width: 300,
			height: 200,
			toJSON: () => ({}),
		});

		const titlebar = document.createElement('div');
		titlebar.className = 'titlebar';
		const title = document.createElement('span');
		title.className = 'title';
		title.textContent = `Window ${i}`;
		titlebar.appendChild(title);
		win.appendChild(titlebar);

		const content = document.createElement('div');
		content.className = 'window-content';
		content.textContent = `Content ${i}`;

		// Mock getBoundingClientRect for content
		vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({
			x: left + 10,
			y: top + 30,
			left: left + 10,
			top: top + 30,
			right: left + 290,
			bottom: top + 190,
			width: 280,
			height: 160,
			toJSON: () => ({}),
		});
		win.appendChild(content);

		desktop.appendChild(win);
	}

	document.body.appendChild(root);
	return root;
}

// ============================================================================
// ADAPTER PORT INTERFACE TESTS
// ============================================================================

describe('DaedalOSTargetAdapter', () => {
	let root: HTMLElement;
	let adapter: DaedalOSTargetAdapter;
	let cleanupMock: () => void;

	beforeEach(() => {
		root = createMockDaedalOSEnvironment();
		cleanupMock = mockElementFromPoint(root);
		adapter = new DaedalOSTargetAdapter(root);
	});

	afterEach(() => {
		cleanupMock();
		root.remove();
	});

	describe('AdapterPort interface compliance', () => {
		it('should implement inject() method', () => {
			expect(typeof adapter.inject).toBe('function');
		});

		it('should implement getBounds() method', () => {
			expect(typeof adapter.getBounds).toBe('function');
		});

		it('should implement setCapture() method', () => {
			expect(typeof adapter.setCapture).toBe('function');
		});

		it('should implement releaseCapture() method', () => {
			expect(typeof adapter.releaseCapture).toBe('function');
		});

		it('should implement hasCapture() method', () => {
			expect(typeof adapter.hasCapture).toBe('function');
		});
	});

	describe('inject()', () => {
		// NOTE: jsdom has a bug where PointerEvent/MouseEvent constructor fails with
		// "view is not of type Window" even when ownerDocument.defaultView is valid.
		// These tests mock both event types to verify the adapter logic.
		// Full E2E testing with real events should use Playwright.

		it('should dispatch PointerEvent to element at position', () => {
			mockEventConstructors();

			const win = root.querySelector('.rnd-window')!;
			const content = win.querySelector('.window-content')!;
			const dispatchSpy = vi.spyOn(content, 'dispatchEvent').mockReturnValue(true);

			const rect = win.getBoundingClientRect();
			const event: PointerEventOut = {
				type: 'pointerdown',
				clientX: rect.x + 50, // Within content bounds
				clientY: rect.y + 50,
				pointerId: 1,
				pressure: 0.5,
				button: 0,
				buttons: 1,
			};

			const result = adapter.inject(event);

			expect(result).toBe(true);
			expect(dispatchSpy).toHaveBeenCalled();
			const firstCall = dispatchSpy.mock.calls[0][0];
			expect(firstCall.type).toBe('pointerdown');

			restoreEventConstructors();
		});

		it('should dispatch pointermove events', () => {
			mockEventConstructors();
			const win = root.querySelector('.rnd-window')!;
			const content = win.querySelector('.window-content')!;
			const dispatchSpy = vi.spyOn(content, 'dispatchEvent').mockReturnValue(true);

			const rect = win.getBoundingClientRect();
			adapter.inject({
				type: 'pointermove',
				clientX: rect.x + 50,
				clientY: rect.y + 50,
				pointerId: 1,
				pressure: 0.5,
				button: 0,
				buttons: 1,
			});

			expect(dispatchSpy).toHaveBeenCalled();
			expect(dispatchSpy.mock.calls[0][0].type).toBe('pointermove');

			restoreEventConstructors();
		});

		it('should dispatch pointerup events', () => {
			mockEventConstructors();

			const win = root.querySelector('.rnd-window')!;
			const content = win.querySelector('.window-content')!;
			const dispatchSpy = vi.spyOn(content, 'dispatchEvent').mockReturnValue(true);

			const rect = win.getBoundingClientRect();
			adapter.inject({
				type: 'pointerup',
				clientX: rect.x + 50,
				clientY: rect.y + 50,
				pointerId: 1,
				pressure: 0,
				button: 0,
				buttons: 0,
			});

			expect(dispatchSpy).toHaveBeenCalled();
			expect(dispatchSpy.mock.calls[0][0].type).toBe('pointerup');

			restoreEventConstructors();
		});

		it('should return false when no element at position', () => {
			// Mock elementFromPoint to return null
			const originalMethod = document.elementFromPoint;
			document.elementFromPoint = vi.fn().mockReturnValue(null);

			const event: PointerEventOut = {
				type: 'pointerdown',
				clientX: -1000,
				clientY: -1000,
				pointerId: 1,
				pressure: 0.5,
				button: 0,
				buttons: 1,
			};

			const result = adapter.inject(event);

			expect(result).toBe(false);

			document.elementFromPoint = originalMethod;
		});

		it('should also dispatch mouse events for compatibility', () => {
			mockEventConstructors();

			const win = root.querySelector('.rnd-window')!;
			const content = win.querySelector('.window-content')!;
			const dispatchSpy = vi.spyOn(content, 'dispatchEvent').mockReturnValue(true);

			const rect = win.getBoundingClientRect();
			adapter.inject({
				type: 'pointerdown',
				clientX: rect.x + 50,
				clientY: rect.y + 50,
				pointerId: 1,
				pressure: 0.5,
				button: 0,
				buttons: 1,
			});

			// Should have dispatched both PointerEvent and MouseEvent (2 calls)
			expect(dispatchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
			expect(dispatchSpy.mock.calls[0][0].type).toBe('pointerdown');
			expect(dispatchSpy.mock.calls[1][0].type).toBe('mousedown');

			restoreEventConstructors();
		});
	});

	describe('getBounds()', () => {
		it('should return bounds of root element', () => {
			const bounds = adapter.getBounds();

			expect(bounds).toHaveProperty('x');
			expect(bounds).toHaveProperty('y');
			expect(bounds).toHaveProperty('width');
			expect(bounds).toHaveProperty('height');
			expect(typeof bounds.x).toBe('number');
			expect(typeof bounds.y).toBe('number');
			expect(typeof bounds.width).toBe('number');
			expect(typeof bounds.height).toBe('number');
		});
	});

	describe('pointer capture', () => {
		it('should start without capture', () => {
			expect(adapter.hasCapture()).toBe(false);
		});

		it('should release capture', () => {
			adapter.releaseCapture();
			expect(adapter.hasCapture()).toBe(false);
		});
	});
});

// ============================================================================
// ENVIRONMENT DETECTION TESTS
// ============================================================================

describe('DaedalOSTargetAdapter environment detection', () => {
	let root: HTMLElement;
	let adapter: DaedalOSTargetAdapter;
	let cleanupMock: () => void;

	beforeEach(() => {
		root = createMockDaedalOSEnvironment();
		cleanupMock = mockElementFromPoint(root);
		adapter = new DaedalOSTargetAdapter(root);
	});

	afterEach(() => {
		cleanupMock();
		root.remove();
	});

	it('should detect daedalOS environment', () => {
		const env = adapter.detectEnvironment();

		expect(env.detected).toBe(true);
		expect(env.desktop).toBeDefined();
	});

	it('should find all windows', () => {
		const env = adapter.detectEnvironment();

		expect(env.windows.length).toBe(3);
	});

	it('should extract window metadata', () => {
		const env = adapter.detectEnvironment();
		const win = env.windows[0];

		expect(win.id).toBe('window-0');
		expect(win.title).toBe('Window 0');
		expect(win.element).toBeInstanceOf(HTMLElement);
	});

	it('should cache environment and allow refresh', () => {
		const env1 = adapter.environment;
		const env2 = adapter.environment;

		expect(env1).toBe(env2); // Same cached reference

		const env3 = adapter.refresh();
		expect(env3).not.toBe(env1); // New reference after refresh
	});

	it('should detect non-daedalOS environment', () => {
		const emptyRoot = document.createElement('div');
		const emptyAdapter = new DaedalOSTargetAdapter(emptyRoot);
		const env = emptyAdapter.detectEnvironment();

		expect(env.detected).toBe(false);
		expect(env.windows.length).toBe(0);
	});
});

// ============================================================================
// DAEDALOS-SPECIFIC METHODS TESTS
// ============================================================================

describe('DaedalOSTargetAdapter daedalOS methods', () => {
	let root: HTMLElement;
	let adapter: DaedalOSTargetAdapter;
	let cleanupMock: () => void;

	beforeEach(() => {
		root = createMockDaedalOSEnvironment();
		cleanupMock = mockElementFromPoint(root);
		adapter = new DaedalOSTargetAdapter(root);
	});

	afterEach(() => {
		cleanupMock();
		root.remove();
	});

	it('should get window at position', () => {
		const win = root.querySelector('.rnd-window')!;
		const rect = win.getBoundingClientRect();

		const found = adapter.getWindowAt(rect.x + 50, rect.y + 50);

		expect(found).not.toBeNull();
		expect(found?.id).toBe('window-0');
	});

	it('should return null for position outside windows', () => {
		const found = adapter.getWindowAt(-100, -100);
		expect(found).toBeNull();
	});

	it('should track last target after inject', () => {
		mockEventConstructors();

		expect(adapter.lastTarget).toBeNull();

		const win = root.querySelector('.rnd-window')!;
		vi.spyOn(win, 'dispatchEvent').mockReturnValue(true);
		const rect = win.getBoundingClientRect();

		adapter.inject({
			type: 'pointermove',
			clientX: rect.x + 50,
			clientY: rect.y + 50,
			pointerId: 1,
			pressure: 0.5,
			button: 0,
			buttons: 0,
		});

		// After inject, lastTarget should be set
		expect(adapter.lastTarget).not.toBeNull();

		restoreEventConstructors();
	});

	it('should allow setting pointerId', () => {
		expect(adapter.pointerId).toBe(1);
		adapter.pointerId = 42;
		expect(adapter.pointerId).toBe(42);
	});
});

// ============================================================================
// FACTORY AND UTILITY TESTS
// ============================================================================

describe('createDaedalOSAdapter factory', () => {
	it('should create adapter with default root', () => {
		const adapter = createDaedalOSAdapter();
		expect(adapter).toBeInstanceOf(DaedalOSTargetAdapter);
	});

	it('should create adapter with custom root', () => {
		const customRoot = document.createElement('div');
		const adapter = createDaedalOSAdapter(customRoot);
		expect(adapter).toBeInstanceOf(DaedalOSTargetAdapter);
	});
});

describe('generateInjectionScript', () => {
	it('should generate a non-empty script', () => {
		const script = generateInjectionScript();

		expect(typeof script).toBe('string');
		expect(script.length).toBeGreaterThan(100);
	});

	it('should contain gesture control API', () => {
		const script = generateInjectionScript();

		expect(script).toContain('gestureControl');
		expect(script).toContain('moveTo');
		expect(script).toContain('down');
		expect(script).toContain('up');
	});

	it('should contain cursor element creation', () => {
		const script = generateInjectionScript();

		expect(script).toContain('gesture-cursor');
		expect(script).toContain('createElement');
	});

	it('should contain PointerEvent dispatch', () => {
		const script = generateInjectionScript();

		expect(script).toContain('PointerEvent');
		expect(script).toContain('dispatchEvent');
	});

	it('should be self-contained IIFE', () => {
		const script = generateInjectionScript();

		expect(script.startsWith('(function()')).toBe(true);
		expect(script.endsWith('})();')).toBe(true);
	});
});

// ============================================================================
// POLYMORPHISM VALIDATION
// ============================================================================

describe('AdapterPort polymorphism', () => {
	it('should be usable as AdapterPort interface', () => {
		mockEventConstructors();

		const root = createMockDaedalOSEnvironment();
		const cleanupMock = mockElementFromPoint(root);
		const adapter: import('../contracts/ports.js').AdapterPort = new DaedalOSTargetAdapter(root);

		// All interface methods should be callable
		expect(() => adapter.getBounds()).not.toThrow();
		expect(() => adapter.hasCapture()).not.toThrow();
		expect(() => adapter.releaseCapture()).not.toThrow();

		// For inject(), spy on dispatchEvent
		const win = root.querySelector('.rnd-window')!;
		vi.spyOn(win, 'dispatchEvent').mockReturnValue(true);

		const rect = win.getBoundingClientRect();
		const result = adapter.inject({
			type: 'pointermove',
			clientX: rect.x + 50, // Within window bounds
			clientY: rect.y + 50,
			pointerId: 1,
			pressure: 0,
			button: 0,
			buttons: 0,
		});

		// Verify interface contract - inject returns boolean
		expect(typeof result).toBe('boolean');

		restoreEventConstructors();
		cleanupMock();
		root.remove();
	});
});
