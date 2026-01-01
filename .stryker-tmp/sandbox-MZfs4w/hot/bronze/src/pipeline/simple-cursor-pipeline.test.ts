/** * @vitest-environment jsdom
 */
// @ts-nocheck


/** * Simple Cursor Pipeline Integration Tests
 *
 * Gen87.X3 | HIVE Phase: INTERLOCK (I) | TDD RED
 *
 * Tests the integration of REAL adapters:
 * - OneEuroExemplarAdapter (npm 1eurofilter wrapper)
 * - XStateFSMAdapter (real XState v5 machine)
 * - W3CPointerEventFactory (W3C compliant events)
 *
 * NO THEATER - Uses production code only
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { SensorFrame } from '../contracts/schemas.js';
import { SimpleCursorPipeline } from './simple-cursor-pipeline.js';

describe('SimpleCursorPipeline', () => {
	let pipeline: SimpleCursorPipeline;

	beforeEach(() => {
		pipeline = new SimpleCursorPipeline({
			viewportWidth: 1920,
			viewportHeight: 1080,
		});
	});

	describe('Pipeline Construction', () => {
		it('should construct with default config', () => {
			const p = new SimpleCursorPipeline();
			expect(p).toBeDefined();
			expect(p.getConfig().viewportWidth).toBeGreaterThan(0);
		});

		it('should accept custom viewport dimensions', () => {
			const p = new SimpleCursorPipeline({ viewportWidth: 800, viewportHeight: 600 });
			const config = p.getConfig();
			expect(config.viewportWidth).toBe(800);
			expect(config.viewportHeight).toBe(600);
		});

		it('should have FSM starting in DISARMED state', () => {
			expect(pipeline.getFSMState()).toBe('DISARMED');
		});
	});

	describe('Full Pipeline Integration', () => {
		it('should process SensorFrame and return PointerEvents', () => {
			const frame = createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm' });
			const result = pipeline.process(frame);

			expect(result).toBeDefined();
			expect(result.events).toBeInstanceOf(Array);
			expect(result.fsmState).toBeDefined();
		});

		it('should emit pointermove when ARMED with Open_Palm', () => {
			// Get to ARMED state first (requires stable baseline)
			const frames = [
				createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: 0 }),
				createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: 100 }),
				createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: 200 }),
				createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: 300 }),
			];

			let lastResult: ReturnType<typeof pipeline.process> | null = null;
			for (const frame of frames) {
				lastResult = pipeline.process(frame);
			}

			// Should now be ARMED and emitting move events
			expect(pipeline.getFSMState()).toBe('ARMED');
			expect(lastResult?.events.some((e) => e.type === 'pointermove')).toBe(true);
		});

		it('should emit pointerdown when transitioning to DOWN_COMMIT', () => {
			// Get to ARMED state first
			for (let i = 0; i < 4; i++) {
				pipeline.process(createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: i * 100 }));
			}
			expect(pipeline.getFSMState()).toBe('ARMED');

			// Now do Pointing_Up within command window
			const result = pipeline.process(
				createTestFrame({
					x: 0.5,
					y: 0.5,
					label: 'Pointing_Up',
					ts: 350,
				}),
			);

			expect(pipeline.getFSMState()).toBe('DOWN_COMMIT');
			expect(result.events.some((e) => e.type === 'pointerdown')).toBe(true);
		});

		it('should emit pointerup when returning to ARMED from DOWN_COMMIT', () => {
			// Get to ARMED state
			for (let i = 0; i < 4; i++) {
				pipeline.process(createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: i * 100 }));
			}

			// Enter DOWN_COMMIT
			pipeline.process(createTestFrame({ x: 0.5, y: 0.5, label: 'Pointing_Up', ts: 350 }));
			expect(pipeline.getFSMState()).toBe('DOWN_COMMIT');

			// Return to Open_Palm
			const result = pipeline.process(
				createTestFrame({
					x: 0.5,
					y: 0.5,
					label: 'Open_Palm',
					ts: 400,
				}),
			);

			expect(pipeline.getFSMState()).toBe('ARMED');
			expect(result.events.some((e) => e.type === 'pointerup')).toBe(true);
		});
	});

	describe('1€ Filter Smoothing', () => {
		it('should smooth jittery input positions', () => {
			// Get to ARMED state first
			for (let i = 0; i < 4; i++) {
				pipeline.process(createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: i * 100 }));
			}

			// Send jittery frames
			const jitteryFrames = [
				createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: 400 }),
				createTestFrame({ x: 0.51, y: 0.52, label: 'Open_Palm', ts: 416 }), // +10px jitter
				createTestFrame({ x: 0.495, y: 0.505, label: 'Open_Palm', ts: 433 }), // -5px jitter
				createTestFrame({ x: 0.508, y: 0.515, label: 'Open_Palm', ts: 450 }), // +8px jitter
			];

			const positions: Array<{ x: number; y: number }> = [];
			for (const frame of jitteryFrames) {
				const result = pipeline.process(frame);
				const moveEvent = result.events.find((e) => e.type === 'pointermove');
				if (moveEvent && 'clientX' in moveEvent) {
					positions.push({ x: moveEvent.clientX, y: moveEvent.clientY });
				}
			}

			// Smoothed positions should vary less than raw input
			// This is a basic test - the filter should reduce high-frequency noise
			expect(positions.length).toBeGreaterThan(0);

			// Calculate variance of smoothed positions
			const xMean = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
			const xVariance =
				positions.reduce((sum, p) => sum + (p.x - xMean) ** 2, 0) / positions.length;

			// Should have some variation but be smoothed (filter is working)
			expect(xVariance).toBeLessThan(10000); // Viewport pixels squared
		});
	});

	describe('Viewport Coordinate Mapping', () => {
		it('should map normalized [0,1] to viewport pixels', () => {
			// Get to ARMED state
			for (let i = 0; i < 4; i++) {
				pipeline.process(createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: i * 100 }));
			}

			// Send frame at center
			const result = pipeline.process(
				createTestFrame({
					x: 0.5,
					y: 0.5,
					label: 'Open_Palm',
					ts: 400,
				}),
			);

			const moveEvent = result.events.find((e) => e.type === 'pointermove');
			expect(moveEvent).toBeDefined();

			if (moveEvent && 'clientX' in moveEvent) {
				// Center of 1920x1080 should be around 960,540
				expect(moveEvent.clientX).toBeCloseTo(960, -1); // ±10 px tolerance
				expect(moveEvent.clientY).toBeCloseTo(540, -1);
			}
		});

		it('should map corners correctly', () => {
			// Get to ARMED state
			for (let i = 0; i < 4; i++) {
				pipeline.process(createTestFrame({ x: 0.0, y: 0.0, label: 'Open_Palm', ts: i * 100 }));
			}

			// Top-left corner
			const topLeft = pipeline.process(
				createTestFrame({
					x: 0.0,
					y: 0.0,
					label: 'Open_Palm',
					ts: 400,
				}),
			);

			const moveEvent = topLeft.events.find((e) => e.type === 'pointermove');
			if (moveEvent && 'clientX' in moveEvent) {
				expect(moveEvent.clientX).toBeCloseTo(0, -1);
				expect(moveEvent.clientY).toBeCloseTo(0, -1);
			}
		});
	});

	describe('Reset and Cleanup', () => {
		it('should reset to DISARMED state', () => {
			// Get to ARMED state
			for (let i = 0; i < 4; i++) {
				pipeline.process(createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: i * 100 }));
			}
			expect(pipeline.getFSMState()).toBe('ARMED');

			// Reset
			pipeline.reset();
			expect(pipeline.getFSMState()).toBe('DISARMED');
		});

		it('should reset 1€ filter state', () => {
			// Process some frames
			for (let i = 0; i < 10; i++) {
				pipeline.process(createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: i * 100 }));
			}

			// Reset
			pipeline.reset();

			// After reset, filter should start fresh
			// (Internal state cleared - no way to directly verify, but shouldn't throw)
			expect(() => {
				pipeline.process(createTestFrame({ x: 0.5, y: 0.5, label: 'Open_Palm', ts: 0 }));
			}).not.toThrow();
		});

		it('should dispose cleanly', () => {
			expect(() => pipeline.dispose()).not.toThrow();
		});
	});
});

// ============================================================================
// Test Helpers
// ============================================================================

function createTestFrame(options: {
	x: number;
	y: number;
	label?: string;
	ts?: number;
	confidence?: number;
	palmFacing?: boolean;
}): SensorFrame {
	const { x, y, label = 'Open_Palm', ts = 0, confidence = 0.95, palmFacing = true } = options;

	return {
		ts,
		handId: 'right',
		trackingOk: true,
		palmFacing,
		label: label as any,
		confidence,
		indexTip: { x, y, z: 0, visibility: 1 },
		landmarks: Array(21).fill({ x, y, z: 0, visibility: 1 }),
	};
}
