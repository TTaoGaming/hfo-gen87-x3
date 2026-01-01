/**
 * @fileoverview W3C Pointer Event Factory Tests
 *
 * Tests for Stage 4 (EMITTER) and Stage 5 (TARGET) implementations.
 *
 * @module phase1-w3c-cursor/w3c-pointer-factory.test
 * @hive V (Validate)
 * @tdd GREEN
 */
// @ts-nocheck


import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    CursorPipeline,
    DOMEventDispatcher,
    FSMActionSchema,
    PointerEventInitSchema,
    PointerEventTypeSchema,
    W3CPointerEventFactory,
    type FSMAction,
    type PointerEventInit,
} from './w3c-pointer-factory.js';

// ============================================================================
// TEST SETUP
// ============================================================================

// Setup JSDOM for PointerEvent support
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="target"></div></body></html>', {
	pretendToBeVisual: true,
});

// Polyfill PointerEvent if not available
if (typeof globalThis.PointerEvent === 'undefined') {
	globalThis.PointerEvent = class PointerEvent extends (dom.window.MouseEvent as typeof MouseEvent) {
		readonly pointerId: number;
		readonly width: number;
		readonly height: number;
		readonly pressure: number;
		readonly tangentialPressure: number;
		readonly tiltX: number;
		readonly tiltY: number;
		readonly twist: number;
		readonly pointerType: string;
		readonly isPrimary: boolean;

		constructor(type: string, init?: PointerEventInit & Record<string, unknown>) {
			super(type, init);
			this.pointerId = (init?.pointerId as number) ?? 0;
			this.width = (init?.width as number) ?? 1;
			this.height = (init?.height as number) ?? 1;
			this.pressure = (init?.pressure as number) ?? 0;
			this.tangentialPressure = (init?.tangentialPressure as number) ?? 0;
			this.tiltX = (init?.tiltX as number) ?? 0;
			this.tiltY = (init?.tiltY as number) ?? 0;
			this.twist = (init?.twist as number) ?? 0;
			this.pointerType = (init?.pointerType as string) ?? '';
			this.isPrimary = (init?.isPrimary as boolean) ?? false;
		}
	} as unknown as typeof PointerEvent;
}

// ============================================================================
// SCHEMA TESTS
// ============================================================================

describe('W3C Pointer Schemas', () => {
	describe('PointerEventTypeSchema', () => {
		it('should accept all valid pointer event types', () => {
			const validTypes = [
				'pointerdown',
				'pointerup',
				'pointermove',
				'pointerenter',
				'pointerleave',
				'pointerover',
				'pointerout',
				'pointercancel',
				'gotpointercapture',
				'lostpointercapture',
			];

			for (const type of validTypes) {
				expect(() => PointerEventTypeSchema.parse(type)).not.toThrow();
			}
		});

		it('should reject invalid event types', () => {
			expect(() => PointerEventTypeSchema.parse('click')).toThrow();
			expect(() => PointerEventTypeSchema.parse('mousedown')).toThrow();
		});
	});

	describe('PointerEventInitSchema', () => {
		it('should provide W3C-compliant defaults', () => {
			const init = PointerEventInitSchema.parse({});

			expect(init.clientX).toBe(0);
			expect(init.clientY).toBe(0);
			expect(init.pointerId).toBe(1);
			expect(init.pointerType).toBe('mouse');
			expect(init.isPrimary).toBe(true);
			expect(init.pressure).toBe(0.5);
			expect(init.bubbles).toBe(true);
			expect(init.cancelable).toBe(true);
		});

		it('should validate pressure bounds [0, 1]', () => {
			expect(() => PointerEventInitSchema.parse({ pressure: 0 })).not.toThrow();
			expect(() => PointerEventInitSchema.parse({ pressure: 1 })).not.toThrow();
			expect(() => PointerEventInitSchema.parse({ pressure: -0.1 })).toThrow();
			expect(() => PointerEventInitSchema.parse({ pressure: 1.1 })).toThrow();
		});

		it('should validate tilt bounds [-90, 90]', () => {
			expect(() => PointerEventInitSchema.parse({ tiltX: -90 })).not.toThrow();
			expect(() => PointerEventInitSchema.parse({ tiltX: 90 })).not.toThrow();
			expect(() => PointerEventInitSchema.parse({ tiltX: -91 })).toThrow();
			expect(() => PointerEventInitSchema.parse({ tiltX: 91 })).toThrow();
		});

		it('should validate twist bounds [0, 359]', () => {
			expect(() => PointerEventInitSchema.parse({ twist: 0 })).not.toThrow();
			expect(() => PointerEventInitSchema.parse({ twist: 359 })).not.toThrow();
			expect(() => PointerEventInitSchema.parse({ twist: -1 })).toThrow();
			expect(() => PointerEventInitSchema.parse({ twist: 360 })).toThrow();
		});
	});

	describe('FSMActionSchema', () => {
		it('should accept valid FSM actions', () => {
			const validActions: FSMAction[] = [
				{ type: 'MOVE', position: { x: 0.5, y: 0.5 }, state: 'armed' },
				{ type: 'CLICK', position: { x: 0, y: 0 }, state: 'clicking' },
				{ type: 'DOWN', position: { x: 1, y: 1 }, state: 'down' },
				{ type: 'UP', position: { x: 0.5, y: 0.5 }, state: 'up' },
				{ type: 'NONE', position: { x: 0.5, y: 0.5 }, state: 'idle' },
			];

			for (const action of validActions) {
				expect(() => FSMActionSchema.parse(action)).not.toThrow();
			}
		});

		it('should validate position bounds [0, 1]', () => {
			expect(() =>
				FSMActionSchema.parse({ type: 'MOVE', position: { x: 0.5, y: 0.5 }, state: 'a' })
			).not.toThrow();
			expect(() =>
				FSMActionSchema.parse({ type: 'MOVE', position: { x: -0.1, y: 0.5 }, state: 'a' })
			).toThrow();
			expect(() =>
				FSMActionSchema.parse({ type: 'MOVE', position: { x: 0.5, y: 1.1 }, state: 'a' })
			).toThrow();
		});
	});
});

// ============================================================================
// W3C POINTER EVENT FACTORY TESTS
// ============================================================================

describe('W3CPointerEventFactory', () => {
	let factory: W3CPointerEventFactory;

	beforeEach(() => {
		factory = new W3CPointerEventFactory({
			viewportWidth: 1920,
			viewportHeight: 1080,
		});
	});

	describe('constructor', () => {
		it('should create factory with default config', () => {
			const defaultFactory = new W3CPointerEventFactory();
			const config = defaultFactory.getConfig();

			expect(config.viewportWidth).toBe(1920);
			expect(config.viewportHeight).toBe(1080);
			expect(config.pointerId).toBe(1);
			expect(config.pointerType).toBe('pen');
		});

		it('should accept custom config', () => {
			const customFactory = new W3CPointerEventFactory({
				viewportWidth: 1280,
				viewportHeight: 720,
				pointerId: 5,
				pointerType: 'touch',
			});
			const config = customFactory.getConfig();

			expect(config.viewportWidth).toBe(1280);
			expect(config.viewportHeight).toBe(720);
			expect(config.pointerId).toBe(5);
			expect(config.pointerType).toBe('touch');
		});
	});

	describe('normalizedToViewport', () => {
		it('should convert normalized [0,1] to viewport pixels', () => {
			expect(factory.normalizedToViewport({ x: 0, y: 0 })).toEqual({ clientX: 0, clientY: 0 });
			expect(factory.normalizedToViewport({ x: 1, y: 1 })).toEqual({
				clientX: 1920,
				clientY: 1080,
			});
			expect(factory.normalizedToViewport({ x: 0.5, y: 0.5 })).toEqual({
				clientX: 960,
				clientY: 540,
			});
		});

		it('should round to integers', () => {
			const result = factory.normalizedToViewport({ x: 0.333, y: 0.666 });
			expect(Number.isInteger(result.clientX)).toBe(true);
			expect(Number.isInteger(result.clientY)).toBe(true);
		});
	});

	describe('createMoveEvent', () => {
		it('should create pointermove event', () => {
			const event = factory.createMoveEvent({ x: 0.5, y: 0.5 });

			expect(event.type).toBe('pointermove');
			expect(event.clientX).toBe(960);
			expect(event.clientY).toBe(540);
			expect(event.button).toBe(-1);
			expect(event.buttons).toBe(0);
		});
	});

	describe('createDownEvent', () => {
		it('should create pointerdown event', () => {
			const event = factory.createDownEvent({ x: 0.25, y: 0.75 });

			expect(event.type).toBe('pointerdown');
			expect(event.clientX).toBe(480);
			expect(event.clientY).toBe(810);
			expect(event.button).toBe(0);
			expect(event.buttons).toBe(1);
		});

		it('should accept custom pressure', () => {
			const event = factory.createDownEvent({ x: 0.5, y: 0.5 }, 0.8);
			expect(event.pressure).toBe(0.8);
		});
	});

	describe('createUpEvent', () => {
		it('should create pointerup event', () => {
			const event = factory.createUpEvent({ x: 0.5, y: 0.5 });

			expect(event.type).toBe('pointerup');
			expect(event.button).toBe(0);
			expect(event.buttons).toBe(0);
			expect(event.pressure).toBe(0);
		});
	});

	describe('fromFSMAction', () => {
		it('should convert MOVE action to pointermove', () => {
			const events = factory.fromFSMAction({
				type: 'MOVE',
				position: { x: 0.5, y: 0.5 },
				state: 'armed',
			});

			expect(events).toHaveLength(1);
			expect(events[0].type).toBe('pointermove');
		});

		it('should convert DOWN action to pointerdown', () => {
			const events = factory.fromFSMAction({
				type: 'DOWN',
				position: { x: 0.5, y: 0.5 },
				state: 'clicking',
			});

			expect(events).toHaveLength(1);
			expect(events[0].type).toBe('pointerdown');
		});

		it('should convert UP action to pointerup', () => {
			const events = factory.fromFSMAction({
				type: 'UP',
				position: { x: 0.5, y: 0.5 },
				state: 'armed',
			});

			expect(events).toHaveLength(1);
			expect(events[0].type).toBe('pointerup');
		});

		it('should convert CLICK action to pointerdown + pointerup', () => {
			const events = factory.fromFSMAction({
				type: 'CLICK',
				position: { x: 0.5, y: 0.5 },
				state: 'clicking',
			});

			expect(events).toHaveLength(2);
			expect(events[0].type).toBe('pointerdown');
			expect(events[1].type).toBe('pointerup');
		});

		it('should convert CANCEL action to pointercancel', () => {
			const events = factory.fromFSMAction({
				type: 'CANCEL',
				position: { x: 0.5, y: 0.5 },
				state: 'idle',
			});

			expect(events).toHaveLength(1);
			expect(events[0].type).toBe('pointercancel');
		});

		it('should return empty array for NONE action', () => {
			const events = factory.fromFSMAction({
				type: 'NONE',
				position: { x: 0.5, y: 0.5 },
				state: 'idle',
			});

			expect(events).toHaveLength(0);
		});
	});

	describe('setViewport', () => {
		it('should update viewport dimensions', () => {
			factory.setViewport(1280, 720);
			const config = factory.getConfig();

			expect(config.viewportWidth).toBe(1280);
			expect(config.viewportHeight).toBe(720);
		});

		it('should affect coordinate conversion', () => {
			factory.setViewport(1280, 720);
			const result = factory.normalizedToViewport({ x: 1, y: 1 });

			expect(result.clientX).toBe(1280);
			expect(result.clientY).toBe(720);
		});
	});
});

// ============================================================================
// DOM EVENT DISPATCHER TESTS
// Note: JSDOM's EventTarget.dispatchEvent requires native Event instances,
// so we test DOMEventDispatcher behavior using mocked targets.
// ============================================================================

describe('DOMEventDispatcher', () => {
	let factory: W3CPointerEventFactory;

	beforeEach(() => {
		factory = new W3CPointerEventFactory();
	});

	describe('dispatch', () => {
		it('should dispatch event to target', () => {
			// Create a mock target that tracks dispatchEvent calls
			const dispatchedEvents: PointerEvent[] = [];
			const mockTarget = {
				dispatchEvent: vi.fn((event: PointerEvent) => {
					dispatchedEvents.push(event);
					return true;
				}),
			} as unknown as EventTarget;

			const dispatcher = new DOMEventDispatcher({ target: mockTarget, capturePointer: false });
			const event = factory.createMoveEvent({ x: 0.5, y: 0.5 });
			dispatcher.dispatch(event);

			expect(mockTarget.dispatchEvent).toHaveBeenCalledTimes(1);
			expect(dispatchedEvents[0]).toBe(event);
		});

		it('should call onDispatch callback', () => {
			const onDispatch = vi.fn();
			const mockTarget = {
				dispatchEvent: vi.fn(() => true),
			} as unknown as EventTarget;

			const dispatcher = new DOMEventDispatcher({
				target: mockTarget,
				capturePointer: false,
				onDispatch,
			});

			const event = factory.createMoveEvent({ x: 0.5, y: 0.5 });
			dispatcher.dispatch(event);

			expect(onDispatch).toHaveBeenCalledWith(event);
		});

		it('should return dispatch result', () => {
			const mockTarget = {
				dispatchEvent: vi.fn(() => false), // Simulate cancelled event
			} as unknown as EventTarget;

			const dispatcher = new DOMEventDispatcher({ target: mockTarget, capturePointer: false });
			const result = dispatcher.dispatch(factory.createMoveEvent({ x: 0.5, y: 0.5 }));

			expect(result).toBe(false);
		});
	});

	describe('dispatchAll', () => {
		it('should dispatch multiple events in sequence', () => {
			const dispatchedEvents: PointerEvent[] = [];
			const mockTarget = {
				dispatchEvent: vi.fn((event: PointerEvent) => {
					dispatchedEvents.push(event);
					return true;
				}),
			} as unknown as EventTarget;

			const dispatcher = new DOMEventDispatcher({ target: mockTarget, capturePointer: false });
			const events = factory.fromFSMAction({
				type: 'CLICK',
				position: { x: 0.5, y: 0.5 },
				state: 'clicking',
			});

			dispatcher.dispatchAll(events);

			expect(mockTarget.dispatchEvent).toHaveBeenCalledTimes(2);
			expect(dispatchedEvents[0].type).toBe('pointerdown');
			expect(dispatchedEvents[1].type).toBe('pointerup');
		});
	});

	describe('setTarget', () => {
		it('should change target element', () => {
			const mockTarget1 = {
				dispatchEvent: vi.fn(() => true),
			} as unknown as EventTarget;
			const mockTarget2 = {
				dispatchEvent: vi.fn(() => true),
			} as unknown as EventTarget;

			const dispatcher = new DOMEventDispatcher({ target: mockTarget1, capturePointer: false });
			dispatcher.setTarget(mockTarget2);
			dispatcher.dispatch(factory.createMoveEvent({ x: 0.5, y: 0.5 }));

			expect(mockTarget1.dispatchEvent).not.toHaveBeenCalled();
			expect(mockTarget2.dispatchEvent).toHaveBeenCalledTimes(1);
		});
	});
});

// ============================================================================
// CURSOR PIPELINE TESTS
// Note: Uses mocked EventTarget for JSDOM compatibility
// ============================================================================

describe('CursorPipeline', () => {
	describe('processAction', () => {
		it('should convert FSM action to DOM events', () => {
			const dispatchedEvents: PointerEvent[] = [];
			const mockTarget = {
				dispatchEvent: vi.fn((event: PointerEvent) => {
					dispatchedEvents.push(event);
					return true;
				}),
			} as unknown as EventTarget;

			const pipeline = new CursorPipeline({
				viewportWidth: 1920,
				viewportHeight: 1080,
				target: mockTarget,
			});

			pipeline.processAction({
				type: 'MOVE',
				position: { x: 0.5, y: 0.5 },
				state: 'armed',
			});

			expect(mockTarget.dispatchEvent).toHaveBeenCalledTimes(1);
			expect(dispatchedEvents[0].type).toBe('pointermove');
		});

		it('should handle CLICK action end-to-end', () => {
			const dispatchedEvents: PointerEvent[] = [];
			const mockTarget = {
				dispatchEvent: vi.fn((event: PointerEvent) => {
					dispatchedEvents.push(event);
					return true;
				}),
			} as unknown as EventTarget;

			const pipeline = new CursorPipeline({
				viewportWidth: 1920,
				viewportHeight: 1080,
				target: mockTarget,
			});

			pipeline.processAction({
				type: 'CLICK',
				position: { x: 0.5, y: 0.5 },
				state: 'clicking',
			});

			expect(mockTarget.dispatchEvent).toHaveBeenCalledTimes(2);
			expect(dispatchedEvents[0].type).toBe('pointerdown');
			expect(dispatchedEvents[1].type).toBe('pointerup');
		});

		it('should return created events', () => {
			const mockTarget = {
				dispatchEvent: vi.fn(() => true),
			} as unknown as EventTarget;

			const pipeline = new CursorPipeline({
				viewportWidth: 1920,
				viewportHeight: 1080,
				target: mockTarget,
			});

			const events = pipeline.processAction({
				type: 'CLICK',
				position: { x: 0.5, y: 0.5 },
				state: 'clicking',
			});

			expect(events).toHaveLength(2);
			expect(events[0].type).toBe('pointerdown');
			expect(events[1].type).toBe('pointerup');
		});
	});

	describe('updateViewport', () => {
		it('should update factory viewport', () => {
			const mockTarget = {
				dispatchEvent: vi.fn(() => true),
			} as unknown as EventTarget;

			const pipeline = new CursorPipeline({
				viewportWidth: 1920,
				viewportHeight: 1080,
				target: mockTarget,
			});

			pipeline.updateViewport(1280, 720);
			const config = pipeline.getFactory().getConfig();

			expect(config.viewportWidth).toBe(1280);
			expect(config.viewportHeight).toBe(720);
		});
	});

	describe('setTarget', () => {
		it('should update dispatcher target', () => {
			const mockTarget1 = {
				dispatchEvent: vi.fn(() => true),
			} as unknown as EventTarget;
			const mockTarget2 = {
				dispatchEvent: vi.fn(() => true),
			} as unknown as EventTarget;

			const pipeline = new CursorPipeline({
				viewportWidth: 1920,
				viewportHeight: 1080,
				target: mockTarget1,
			});

			pipeline.setTarget(mockTarget2);
			pipeline.processAction({
				type: 'MOVE',
				position: { x: 0.5, y: 0.5 },
				state: 'armed',
			});

			expect(mockTarget1.dispatchEvent).not.toHaveBeenCalled();
			expect(mockTarget2.dispatchEvent).toHaveBeenCalledTimes(1);
		});
	});
});

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe('Property-Based Tests', () => {
	let factory: W3CPointerEventFactory;

	beforeEach(() => {
		factory = new W3CPointerEventFactory({
			viewportWidth: 1920,
			viewportHeight: 1080,
		});
	});

	it('property: normalized positions always produce valid viewport coordinates', () => {
		fc.assert(
			fc.property(
				fc.float({ min: 0, max: 1, noNaN: true }),
				fc.float({ min: 0, max: 1, noNaN: true }),
				(x, y) => {
					const result = factory.normalizedToViewport({ x, y });

					expect(result.clientX).toBeGreaterThanOrEqual(0);
					expect(result.clientX).toBeLessThanOrEqual(1920);
					expect(result.clientY).toBeGreaterThanOrEqual(0);
					expect(result.clientY).toBeLessThanOrEqual(1080);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('property: all FSM action types produce valid events', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('MOVE', 'CLICK', 'DOWN', 'UP', 'CANCEL', 'NONE'),
				fc.float({ min: 0, max: 1, noNaN: true }),
				fc.float({ min: 0, max: 1, noNaN: true }),
				(type, x, y) => {
					const events = factory.fromFSMAction({
						type: type as FSMAction['type'],
						position: { x, y },
						state: 'test',
					});

					// All events should be PointerEvents
					for (const event of events) {
						expect(event).toBeInstanceOf(PointerEvent);
					}

					// NONE should produce no events
					if (type === 'NONE') {
						expect(events).toHaveLength(0);
					}

					// CLICK should produce exactly 2 events
					if (type === 'CLICK') {
						expect(events).toHaveLength(2);
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	it('property: event coordinates match normalized input', () => {
		fc.assert(
			fc.property(
				fc.float({ min: 0, max: 1, noNaN: true }),
				fc.float({ min: 0, max: 1, noNaN: true }),
				(x, y) => {
					const event = factory.createMoveEvent({ x, y });
					const expected = factory.normalizedToViewport({ x, y });

					expect(event.clientX).toBe(expected.clientX);
					expect(event.clientY).toBe(expected.clientY);
				}
			),
			{ numRuns: 100 }
		);
	});
});
