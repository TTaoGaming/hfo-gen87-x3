/**
 * DOMAdapter Unit Tests (requires JSDOM environment)
 *
 * Gen87.X3 | VALIDATE Phase | TDD RED→GREEN
 *
 * MUTATION KILLER TESTS for DOMAdapter in pointer-event.adapter.ts
 * These tests run in jsdom environment to test real DOM injection.
 *
 * JSDOM QUIRK: PointerEvent requires view to be the JSDOM window,
 * but the adapter uses `window` which may reference the wrong object.
 * We test what we can and skip browser-specific PointerEvent creation.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PointerEventOut } from '../contracts/schemas.js';
import { DOMAdapter } from './pointer-event.adapter.js';

describe('DOMAdapter', () => {
	let element: HTMLDivElement;
	let adapter: DOMAdapter;

	beforeEach(() => {
		element = document.createElement('div');
		element.style.width = '800px';
		element.style.height = '600px';
		document.body.appendChild(element);
		adapter = new DOMAdapter(element);
	});

	afterEach(() => {
		document.body.removeChild(element);
	});

	describe('construction', () => {
		it('should create adapter with element', () => {
			const newAdapter = new DOMAdapter(element);
			expect(newAdapter).toBeDefined();
		});

		it('should accept custom pointerId', () => {
			const customAdapter = new DOMAdapter(element, 5);
			expect(customAdapter).toBeDefined();
		});
	});

	describe('inject()', () => {
		// NOTE: PointerEvent tests fail in JSDOM due to 'view' property quirk
		// We test WheelEvent which works correctly, and verify structure

		it('should dispatch wheel event with deltaY', () => {
			const eventHandler = vi.fn();
			element.addEventListener('wheel', eventHandler);

			const event: PointerEventOut = {
				type: 'wheel',
				deltaY: -120,
				deltaMode: 0,
				ctrlKey: false,
				clientX: 400,
				clientY: 300,
			};

			const result = adapter.inject(event);
			expect(result).toBe(true);
			expect(eventHandler).toHaveBeenCalledTimes(1);

			const dispatchedEvent = eventHandler.mock.calls[0][0] as WheelEvent;
			expect(dispatchedEvent.deltaY).toBe(-120);
		});

		it('should dispatch wheel event with positive deltaY for scroll down', () => {
			const eventHandler = vi.fn();
			element.addEventListener('wheel', eventHandler);

			const event: PointerEventOut = {
				type: 'wheel',
				deltaY: 120,
				deltaMode: 0,
				ctrlKey: false,
				clientX: 400,
				clientY: 300,
			};

			adapter.inject(event);
			const dispatchedEvent = eventHandler.mock.calls[0][0] as WheelEvent;
			expect(dispatchedEvent.deltaY).toBe(120);
		});

		it('should dispatch wheel event with ctrlKey for zoom', () => {
			const eventHandler = vi.fn();
			element.addEventListener('wheel', eventHandler);

			const event: PointerEventOut = {
				type: 'wheel',
				deltaY: -50,
				deltaMode: 0,
				ctrlKey: true,
				clientX: 400,
				clientY: 300,
			};

			adapter.inject(event);
			const dispatchedEvent = eventHandler.mock.calls[0][0] as WheelEvent;
			expect(dispatchedEvent.ctrlKey).toBe(true);
		});

		it('should dispatch wheel event with deltaMode=0 (pixel)', () => {
			const eventHandler = vi.fn();
			element.addEventListener('wheel', eventHandler);

			const event: PointerEventOut = {
				type: 'wheel',
				deltaY: -120,
				deltaMode: 0,
				ctrlKey: false,
				clientX: 400,
				clientY: 300,
			};

			adapter.inject(event);
			const dispatchedEvent = eventHandler.mock.calls[0][0] as WheelEvent;
			expect(dispatchedEvent.deltaMode).toBe(0);
		});

		it('should dispatch wheel event with clientX/clientY', () => {
			const eventHandler = vi.fn();
			element.addEventListener('wheel', eventHandler);

			const event: PointerEventOut = {
				type: 'wheel',
				deltaY: -120,
				deltaMode: 0,
				ctrlKey: false,
				clientX: 123,
				clientY: 456,
			};

			adapter.inject(event);
			const dispatchedEvent = eventHandler.mock.calls[0][0] as WheelEvent;
			expect(dispatchedEvent.clientX).toBe(123);
			expect(dispatchedEvent.clientY).toBe(456);
		});

		it('should set bubbles=true on wheel events', () => {
			const eventHandler = vi.fn();
			element.addEventListener('wheel', eventHandler);

			const event: PointerEventOut = {
				type: 'wheel',
				deltaY: -120,
				deltaMode: 0,
				ctrlKey: false,
				clientX: 100,
				clientY: 200,
			};

			adapter.inject(event);
			const dispatchedEvent = eventHandler.mock.calls[0][0] as WheelEvent;
			expect(dispatchedEvent.bubbles).toBe(true);
		});

		it('should set cancelable=true on wheel events', () => {
			const eventHandler = vi.fn();
			element.addEventListener('wheel', eventHandler);

			const event: PointerEventOut = {
				type: 'wheel',
				deltaY: -120,
				deltaMode: 0,
				ctrlKey: false,
				clientX: 100,
				clientY: 200,
			};

			adapter.inject(event);
			const dispatchedEvent = eventHandler.mock.calls[0][0] as WheelEvent;
			expect(dispatchedEvent.cancelable).toBe(true);
		});

		it('should return true when event dispatches', () => {
			const event: PointerEventOut = {
				type: 'wheel',
				deltaY: -120,
				deltaMode: 0,
				ctrlKey: false,
				clientX: 100,
				clientY: 200,
			};

			const result = adapter.inject(event);
			expect(result).toBe(true);
		});

		it('should dispatch to correct element', () => {
			const otherElement = document.createElement('div');
			document.body.appendChild(otherElement);
			const otherHandler = vi.fn();
			otherElement.addEventListener('wheel', otherHandler);

			const event: PointerEventOut = {
				type: 'wheel',
				deltaY: -120,
				deltaMode: 0,
				ctrlKey: false,
				clientX: 100,
				clientY: 200,
			};

			adapter.inject(event);
			expect(otherHandler).not.toHaveBeenCalled();
			document.body.removeChild(otherElement);
		});
	});

	describe('getBounds()', () => {
		it('should return element bounds', () => {
			// Mock getBoundingClientRect for jsdom
			element.getBoundingClientRect = vi.fn().mockReturnValue({
				width: 800,
				height: 600,
				left: 100,
				top: 50,
				right: 900,
				bottom: 650,
				x: 100,
				y: 50,
				toJSON: () => ({}),
			});

			const bounds = adapter.getBounds();
			expect(bounds.width).toBe(800);
			expect(bounds.height).toBe(600);
			expect(bounds.left).toBe(100);
			expect(bounds.top).toBe(50);
		});
	});

	describe('pointer capture', () => {
		it('should track capture state', () => {
			// Initially no capture
			expect(adapter.hasCapture()).toBe(false);
		});

		it('setCapture should call setPointerCapture on element', () => {
			// Mock setPointerCapture to verify it's called
			const mockSetCapture = vi.fn();
			element.setPointerCapture = mockSetCapture;

			adapter.setCapture();
			expect(mockSetCapture).toHaveBeenCalledWith(1); // Default pointerId is 1
		});

		it('setCapture should set hasCapture=true after success', () => {
			// Mock successful setPointerCapture
			element.setPointerCapture = vi.fn();
			// Mock hasPointerCapture to return true after capture
			element.hasPointerCapture = vi.fn().mockReturnValue(true);

			adapter.setCapture();

			// The hasCapture() method checks element.hasPointerCapture first
			// But we also need internal state to be true
			expect(adapter.hasCapture()).toBe(true);
		});

		it('setCapture should set internal _hasCapture=true', () => {
			// This tests the internal state assignment
			// When setPointerCapture succeeds, _hasCapture should be true
			element.setPointerCapture = vi.fn();
			// Mock hasPointerCapture to throw (so it falls back to internal state)
			element.hasPointerCapture = vi.fn().mockImplementation(() => {
				throw new Error('hasPointerCapture not supported');
			});

			adapter.setCapture();

			// Should fall back to internal state which should be true
			expect(adapter.hasCapture()).toBe(true);
		});

		it('setCapture should set _hasCapture=false on error', () => {
			// When setPointerCapture throws, _hasCapture should be false
			element.setPointerCapture = vi.fn().mockImplementation(() => {
				throw new Error('No active pointer');
			});
			element.hasPointerCapture = vi.fn().mockImplementation(() => {
				throw new Error('Not supported');
			});

			adapter.setCapture();

			// Should fall back to internal state which should be false (error case)
			expect(adapter.hasCapture()).toBe(false);
		});

		it('releaseCapture should call releasePointerCapture on element', () => {
			const mockReleaseCapture = vi.fn();
			element.releasePointerCapture = mockReleaseCapture;

			adapter.releaseCapture();
			expect(mockReleaseCapture).toHaveBeenCalledWith(1);
		});

		it('releaseCapture should set _hasCapture=false', () => {
			// First set capture
			element.setPointerCapture = vi.fn();
			element.releasePointerCapture = vi.fn();
			element.hasPointerCapture = vi.fn().mockImplementation(() => {
				throw new Error('Not supported');
			});

			adapter.setCapture();
			expect(adapter.hasCapture()).toBe(true);

			adapter.releaseCapture();
			expect(adapter.hasCapture()).toBe(false);
		});

		it('should handle setPointerCapture errors gracefully and set _hasCapture=false', () => {
			element.setPointerCapture = vi.fn().mockImplementation(() => {
				throw new Error('No active pointer');
			});
			element.hasPointerCapture = vi.fn().mockImplementation(() => {
				throw new Error('Error');
			});

			// Should NOT throw
			expect(() => adapter.setCapture()).not.toThrow();
			// And internal state should be FALSE
			expect(adapter.hasCapture()).toBe(false);
		});

		it('should handle releasePointerCapture errors gracefully', () => {
			element.releasePointerCapture = vi.fn().mockImplementation(() => {
				throw new Error('No capture');
			});

			expect(() => adapter.releaseCapture()).not.toThrow();
		});

		it('should handle hasPointerCapture errors gracefully', () => {
			element.hasPointerCapture = vi.fn().mockImplementation(() => {
				throw new Error('Error');
			});

			// Should fall back to internal state
			expect(() => adapter.hasCapture()).not.toThrow();
		});
	});
});
