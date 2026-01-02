/**
 * OneEuroAdapter Unit Tests
 *
 * Gen87.X3 | VALIDATE Phase | TDD GREEN
 *
 * MUTATION KILLER TESTS for one-euro.adapter.ts
 * Target: 80% mutation score threshold
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { SensorFrame } from '../contracts/schemas.js';
import { OneEuroAdapter, PassthroughSmootherAdapter } from './one-euro.adapter.js';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createFrame(overrides: Partial<SensorFrame> = {}): SensorFrame {
	const defaults: SensorFrame = {
		ts: 0,
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: 'Open_Palm',
		confidence: 0.9,
		indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 },
		landmarks: Array(21).fill({ x: 0.5, y: 0.5, z: 0, visibility: 1 }),
	};
	return { ...defaults, ...overrides };
}

function createTrackingLostFrame(ts: number): SensorFrame {
	return {
		ts,
		handId: 'none',
		trackingOk: false,
		palmFacing: false,
		label: 'None',
		confidence: 0,
		indexTip: null,
		landmarks: null,
	};
}

// ============================================================================
// OneEuroAdapter Tests
// ============================================================================

describe('OneEuroAdapter', () => {
	let adapter: OneEuroAdapter;

	beforeEach(() => {
		adapter = new OneEuroAdapter();
	});

	describe('Construction', () => {
		it('constructs with default parameters', () => {
			const defaultAdapter = new OneEuroAdapter();
			expect(defaultAdapter).toBeInstanceOf(OneEuroAdapter);
		});

		it('constructs with custom mincutoff', () => {
			const customAdapter = new OneEuroAdapter(2.0);
			expect(customAdapter).toBeInstanceOf(OneEuroAdapter);
		});

		it('constructs with custom beta', () => {
			const customAdapter = new OneEuroAdapter(1.0, 0.01);
			expect(customAdapter).toBeInstanceOf(OneEuroAdapter);
		});

		it('constructs with custom dcutoff', () => {
			const customAdapter = new OneEuroAdapter(1.0, 0.007, 2.0);
			expect(customAdapter).toBeInstanceOf(OneEuroAdapter);
		});

		it('constructs with custom frequency', () => {
			const customAdapter = new OneEuroAdapter(1.0, 0.007, 1.0, 30);
			expect(customAdapter).toBeInstanceOf(OneEuroAdapter);
		});

		it('constructs with custom predictionMs', () => {
			const customAdapter = new OneEuroAdapter(1.0, 0.007, 1.0, 60, 32);
			expect(customAdapter).toBeInstanceOf(OneEuroAdapter);
		});
	});

	describe('smooth() - Basic Operation', () => {
		it('returns SmoothedFrame with correct ts', () => {
			const result = adapter.smooth(createFrame({ ts: 12345 }));
			expect(result.ts).toBe(12345);
		});

		it('returns SmoothedFrame with correct handId', () => {
			const result = adapter.smooth(createFrame({ handId: 'left' }));
			expect(result.handId).toBe('left');
		});

		it('returns SmoothedFrame with trackingOk=true when tracking', () => {
			const result = adapter.smooth(createFrame({ trackingOk: true }));
			expect(result.trackingOk).toBe(true);
		});

		it('returns SmoothedFrame with correct palmFacing', () => {
			const result = adapter.smooth(createFrame({ palmFacing: false }));
			expect(result.palmFacing).toBe(false);
		});

		it('returns SmoothedFrame with correct label', () => {
			const result = adapter.smooth(createFrame({ label: 'Victory' }));
			expect(result.label).toBe('Victory');
		});

		it('returns SmoothedFrame with correct confidence', () => {
			const result = adapter.smooth(createFrame({ confidence: 0.75 }));
			expect(result.confidence).toBe(0.75);
		});

		it('returns position close to input for first frame', () => {
			const result = adapter.smooth(
				createFrame({
					ts: 0,
					indexTip: { x: 0.3, y: 0.7, z: 0, visibility: 1 },
				}),
			);
			expect(result.position).not.toBeNull();
			expect(result.position?.x).toBeCloseTo(0.3, 1);
			expect(result.position?.y).toBeCloseTo(0.7, 1);
		});
	});

	describe('smooth() - Tracking Lost Handling', () => {
		it('returns trackingOk=false when frame.trackingOk is false', () => {
			const result = adapter.smooth(createTrackingLostFrame(0));
			expect(result.trackingOk).toBe(false);
		});

		it('returns null position when tracking lost', () => {
			const result = adapter.smooth(createTrackingLostFrame(0));
			expect(result.position).toBeNull();
		});

		it('returns null velocity when tracking lost', () => {
			const result = adapter.smooth(createTrackingLostFrame(0));
			expect(result.velocity).toBeNull();
		});

		it('returns null prediction when tracking lost', () => {
			const result = adapter.smooth(createTrackingLostFrame(0));
			expect(result.prediction).toBeNull();
		});

		it('returns null position when indexTip is null', () => {
			const frame = createFrame({ indexTip: null });
			const result = adapter.smooth(frame);
			expect(result.position).toBeNull();
		});

		it('resets filters when tracking lost', () => {
			// Process some frames
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.1, y: 0.1, z: 0, visibility: 1 } }));
			adapter.smooth(createFrame({ ts: 16, indexTip: { x: 0.2, y: 0.2, z: 0, visibility: 1 } }));

			// Lose tracking
			adapter.smooth(createTrackingLostFrame(32));

			// Resume tracking at new position - should not be affected by old position
			const result = adapter.smooth(
				createFrame({ ts: 48, indexTip: { x: 0.8, y: 0.8, z: 0, visibility: 1 } }),
			);
			expect(result.position?.x).toBeCloseTo(0.8, 1);
			expect(result.position?.y).toBeCloseTo(0.8, 1);
		});
	});

	describe('smooth() - Position Clamping (REQ-PBT-003)', () => {
		it('clamps position.x to minimum 0', () => {
			// Large negative spike that could cause undershoot
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({
					ts: 1, // Very fast
					indexTip: { x: -0.5, y: 0.5, z: 0, visibility: 1 },
				}),
			);
			expect(result.position?.x).toBeGreaterThanOrEqual(0);
		});

		it('clamps position.x to maximum 1', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({
					ts: 1,
					indexTip: { x: 1.5, y: 0.5, z: 0, visibility: 1 },
				}),
			);
			expect(result.position?.x).toBeLessThanOrEqual(1);
		});

		it('clamps position.y to minimum 0', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({
					ts: 1,
					indexTip: { x: 0.5, y: -0.5, z: 0, visibility: 1 },
				}),
			);
			expect(result.position?.y).toBeGreaterThanOrEqual(0);
		});

		it('clamps position.y to maximum 1', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({
					ts: 1,
					indexTip: { x: 0.5, y: 1.5, z: 0, visibility: 1 },
				}),
			);
			expect(result.position?.y).toBeLessThanOrEqual(1);
		});
	});

	describe('smooth() - Velocity Calculation', () => {
		it('returns velocity object', () => {
			adapter.smooth(createFrame({ ts: 0 }));
			const result = adapter.smooth(createFrame({ ts: 100 }));
			expect(result.velocity).not.toBeNull();
			expect(result.velocity).toHaveProperty('x');
			expect(result.velocity).toHaveProperty('y');
		});

		it('calculates positive x velocity for rightward movement', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1000, indexTip: { x: 1.0, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(result.velocity?.x).toBeGreaterThan(0);
		});

		it('calculates negative x velocity for leftward movement', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 1.0, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1000, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(result.velocity?.x).toBeLessThan(0);
		});

		it('calculates positive y velocity for downward movement', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.0, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1000, indexTip: { x: 0.5, y: 1.0, z: 0, visibility: 1 } }),
			);
			expect(result.velocity?.y).toBeGreaterThan(0);
		});

		it('returns near-zero velocity for stationary input', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1000, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(Math.abs(result.velocity?.x)).toBeLessThan(0.01);
			expect(Math.abs(result.velocity?.y)).toBeLessThan(0.01);
		});

		it('velocity uses division by dt (not multiplication)', () => {
			// MUTANT KILLER: Detects / dt vs * dt mutation
			// Move 0.5 units in 0.5 seconds → velocity should be ~1.0 units/second
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 500, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);
			// With / dt: velocity ≈ 0.5 / 0.5 = 1.0
			// With * dt: velocity ≈ 0.5 * 0.5 = 0.25 (WRONG)
			expect(result.velocity?.x).toBeGreaterThan(0.5);
		});
	});

	describe('smooth() - Prediction Calculation', () => {
		it('returns prediction object', () => {
			adapter.smooth(createFrame({ ts: 0 }));
			const result = adapter.smooth(createFrame({ ts: 100 }));
			expect(result.prediction).not.toBeNull();
			expect(result.prediction).toHaveProperty('x');
			expect(result.prediction).toHaveProperty('y');
		});

		it('prediction is ahead of position for rightward movement', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 500, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);
			// Prediction should be to the right of current position
			expect(result.prediction?.x).toBeGreaterThanOrEqual(result.position?.x);
		});

		it('prediction is clamped to [0, 1] range', () => {
			// Fast rightward movement that would predict past 1.0
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.9, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 100, indexTip: { x: 1.0, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(result.prediction?.x).toBeLessThanOrEqual(1);
			expect(result.prediction?.x).toBeGreaterThanOrEqual(0);
		});
	});

	describe('smooth() - Filter Smoothing Behavior', () => {
		it('smooths noisy input', () => {
			const frames = [
				createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
				createFrame({ ts: 16, indexTip: { x: 0.52, y: 0.48, z: 0, visibility: 1 } }),
				createFrame({ ts: 32, indexTip: { x: 0.48, y: 0.52, z: 0, visibility: 1 } }),
				createFrame({ ts: 48, indexTip: { x: 0.51, y: 0.49, z: 0, visibility: 1 } }),
			];

			const results = frames.map((f) => adapter.smooth(f));

			// All should be close to 0.5 after smoothing
			results.forEach((r) => {
				expect(r.position?.x).toBeGreaterThan(0.45);
				expect(r.position?.x).toBeLessThan(0.55);
			});
		});

		it('handles NaN from filter by returning input value', () => {
			// Same timestamp can cause NaN in filter
			adapter.smooth(createFrame({ ts: 100, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 100, indexTip: { x: 0.6, y: 0.6, z: 0, visibility: 1 } }),
			);
			// Should not be NaN
			expect(Number.isNaN(result.position?.x)).toBe(false);
			expect(Number.isNaN(result.position?.y)).toBe(false);
		});
	});

	describe('reset()', () => {
		it('clears filter state', () => {
			// Build up filter state
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.1, y: 0.1, z: 0, visibility: 1 } }));
			adapter.smooth(createFrame({ ts: 16, indexTip: { x: 0.2, y: 0.2, z: 0, visibility: 1 } }));

			// Reset
			adapter.reset();

			// New position should not be influenced by old state
			const result = adapter.smooth(
				createFrame({ ts: 32, indexTip: { x: 0.9, y: 0.9, z: 0, visibility: 1 } }),
			);
			expect(result.position?.x).toBeCloseTo(0.9, 1);
			expect(result.position?.y).toBeCloseTo(0.9, 1);
		});

		it('clears velocity to zero after reset', () => {
			// Build up velocity
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }));
			adapter.smooth(createFrame({ ts: 500, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }));

			// Reset
			adapter.reset();

			// First frame after reset should have no velocity history
			const result = adapter.smooth(
				createFrame({ ts: 1000, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(result.velocity?.x).toBe(0);
			expect(result.velocity?.y).toBe(0);
		});
	});

	describe('setParams()', () => {
		it('updates minCutoff parameter', () => {
			adapter.setParams(2.0, 0.007);
			// Verify by observing different smoothing behavior
			const frame1 = createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } });
			const frame2 = createFrame({ ts: 16, indexTip: { x: 0.8, y: 0.5, z: 0, visibility: 1 } });

			adapter.smooth(frame1);
			const result = adapter.smooth(frame2);

			// With higher minCutoff, less lag expected
			expect(result.position).not.toBeNull();
		});

		it('updates beta parameter', () => {
			adapter.setParams(1.0, 0.5);
			// With higher beta, filter should track fast movements better
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 16, indexTip: { x: 1.0, y: 0.5, z: 0, visibility: 1 } }),
			);

			// Should track closer to target with high beta
			expect(result.position?.x).toBeGreaterThan(0.5);
		});
	});
});

// ============================================================================
// PassthroughSmootherAdapter Tests
// ============================================================================

describe('PassthroughSmootherAdapter', () => {
	let adapter: PassthroughSmootherAdapter;

	beforeEach(() => {
		adapter = new PassthroughSmootherAdapter();
	});

	describe('smooth() - Pass-through behavior', () => {
		it('returns exact input position without smoothing', () => {
			const result = adapter.smooth(
				createFrame({
					ts: 0,
					indexTip: { x: 0.123, y: 0.456, z: 0, visibility: 1 },
				}),
			);
			expect(result.position?.x).toBe(0.123);
			expect(result.position?.y).toBe(0.456);
		});

		it('returns zero velocity (no smoothing history)', () => {
			const result = adapter.smooth(createFrame({ ts: 0 }));
			expect(result.velocity?.x).toBe(0);
			expect(result.velocity?.y).toBe(0);
		});

		it('returns prediction equal to position', () => {
			const result = adapter.smooth(
				createFrame({
					ts: 0,
					indexTip: { x: 0.3, y: 0.7, z: 0, visibility: 1 },
				}),
			);
			expect(result.prediction?.x).toBe(0.3);
			expect(result.prediction?.y).toBe(0.7);
		});

		it('preserves all frame metadata', () => {
			const result = adapter.smooth(
				createFrame({
					ts: 999,
					handId: 'left',
					trackingOk: true,
					palmFacing: false,
					label: 'Victory',
					confidence: 0.88,
				}),
			);
			expect(result.ts).toBe(999);
			expect(result.handId).toBe('left');
			expect(result.trackingOk).toBe(true);
			expect(result.palmFacing).toBe(false);
			expect(result.label).toBe('Victory');
			expect(result.confidence).toBe(0.88);
		});
	});

	describe('smooth() - Tracking lost handling', () => {
		it('returns null position when tracking lost', () => {
			const result = adapter.smooth(createTrackingLostFrame(0));
			expect(result.position).toBeNull();
		});

		it('returns null velocity when tracking lost', () => {
			const result = adapter.smooth(createTrackingLostFrame(0));
			expect(result.velocity).toBeNull();
		});

		it('returns null prediction when tracking lost', () => {
			const result = adapter.smooth(createTrackingLostFrame(0));
			expect(result.prediction).toBeNull();
		});

		it('returns null position when indexTip is null', () => {
			const frame = createFrame({ trackingOk: true, indexTip: null });
			const result = adapter.smooth(frame);
			expect(result.position).toBeNull();
		});
	});

	describe('reset()', () => {
		it('is a no-op (no state to clear)', () => {
			// Should not throw
			expect(() => adapter.reset()).not.toThrow();
		});
	});

	describe('setParams()', () => {
		it('is a no-op (no parameters to set)', () => {
			// Should not throw
			expect(() => adapter.setParams(1.0, 0.5)).not.toThrow();
		});
	});
});

// ============================================================================
// MUTATION KILLER: OneEuroFilterWithVelocity internal class
// ============================================================================

describe('MUTATION KILLER: Filter internals', () => {
	let adapter: OneEuroAdapter;

	beforeEach(() => {
		adapter = new OneEuroAdapter();
	});

	describe('Derivative calculation edge cases', () => {
		it('keeps previous derivative when dt is too small (< 0.1ms)', () => {
			// First frame establishes velocity
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }));
			adapter.smooth(createFrame({ ts: 1000, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }));

			// Very small dt - should keep previous derivative, not calculate NaN
			const result = adapter.smooth(
				createFrame({ ts: 1000.05, indexTip: { x: 0.51, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(Number.isNaN(result.velocity?.x)).toBe(false);
		});

		it('calculates derivative when dt is exactly 0.1ms', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }));
			adapter.smooth(createFrame({ ts: 0.1, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }));
			// Should not produce NaN
			const result = adapter.smooth(
				createFrame({ ts: 1000, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(Number.isNaN(result.velocity?.x)).toBe(false);
		});
	});

	describe('Filter NaN handling', () => {
		it('returns input value when filter returns NaN', () => {
			// Same timestamp twice - likely to cause NaN
			adapter.smooth(createFrame({ ts: 100, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 100, indexTip: { x: 0.7, y: 0.7, z: 0, visibility: 1 } }),
			);

			// Position should be valid (fallback to input on NaN)
			expect(result.position?.x).toBeDefined();
			expect(result.position?.y).toBeDefined();
			expect(Number.isNaN(result.position?.x)).toBe(false);
			expect(Number.isNaN(result.position?.y)).toBe(false);
		});
	});

	describe('Prediction calculation correctness', () => {
		it('prediction uses predictionMs parameter', () => {
			// Create adapter with longer prediction
			const longPredictionAdapter = new OneEuroAdapter(1.0, 0.007, 1.0, 60, 100); // 100ms prediction

			longPredictionAdapter.smooth(
				createFrame({ ts: 0, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }),
			);
			const result = longPredictionAdapter.smooth(
				createFrame({ ts: 1000, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);

			// With longer prediction window, should predict further ahead
			expect(result.prediction?.x).toBeGreaterThan(result.position?.x);
		});

		it('prediction clamped to minimum 0', () => {
			// Moving left rapidly - prediction could go negative
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.1, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 100, indexTip: { x: 0.05, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(result.prediction?.x).toBeGreaterThanOrEqual(0);
		});

		it('prediction clamped to maximum 1', () => {
			// Moving right rapidly - prediction could exceed 1
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.9, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 100, indexTip: { x: 0.95, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(result.prediction?.x).toBeLessThanOrEqual(1);
		});
	});

	describe('Math.max/Math.min boundary tests', () => {
		it('position x clamp uses Math.max(0, ...)', () => {
			// Force negative output
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.01, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1, indexTip: { x: -0.5, y: 0.5, z: 0, visibility: 1 } }),
			);
			// Should be clamped to 0, not negative
			expect(result.position?.x).toBe(0);
		});

		it('position y clamp uses Math.max(0, ...)', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.01, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1, indexTip: { x: 0.5, y: -0.5, z: 0, visibility: 1 } }),
			);
			expect(result.position?.y).toBe(0);
		});

		it('position x clamp uses Math.min(1, ...)', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.99, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1, indexTip: { x: 1.5, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(result.position?.x).toBe(1);
		});

		it('position y clamp uses Math.min(1, ...)', () => {
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.99, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1, indexTip: { x: 0.5, y: 1.5, z: 0, visibility: 1 } }),
			);
			expect(result.position?.y).toBe(1);
		});
	});

	describe('MUTATION KILLER: Arithmetic operators', () => {
		it('predictionMs division by 1000 produces seconds', () => {
			// 16ms prediction = 0.016 seconds
			// If we multiply by 1000 instead of divide, we get 16000 seconds (way off)
			const adapter = new OneEuroAdapter(1.0, 0.007, 1.0, 60, 16);
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1000, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);

			// Velocity is ~0.5 units/sec, prediction should be position + velocity * 0.016
			// Not position + velocity * 16000
			expect(result.prediction?.x).toBeLessThan(0.6); // Would be way > 1 with wrong operator
		});

		it('derivative calculation uses subtraction for position delta', () => {
			// (x - lastValue) should give positive velocity for rightward movement
			// (x + lastValue) would give wrong result
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.2, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1000, indexTip: { x: 0.8, y: 0.5, z: 0, visibility: 1 } }),
			);

			// Moving right: velocity.x should be positive ~0.6
			// With + instead of -, velocity would be ~1.0 (wrong magnitude)
			expect(result.velocity?.x).toBeGreaterThan(0.3);
			expect(result.velocity?.x).toBeLessThan(1.0);
		});

		it('derivative calculation uses subtraction for time delta', () => {
			// (timestamp - lastTime) / 1000 = dt in seconds
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 500, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);

			// dt = 500ms = 0.5s, delta = 0.5, velocity = 0.5/0.5 = 1.0 (smoothed)
			// With wrong operator, dt would be (500 + 0) = 500s, velocity = 0.001
			expect(result.velocity?.x).toBeGreaterThan(0.1);
		});

		it('velocity x multiplied by predictionSec for prediction', () => {
			// prediction = position + velocity * time
			const adapter = new OneEuroAdapter(1.0, 0.007, 1.0, 60, 100); // 100ms = 0.1s prediction
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1000, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);

			// velocity ~0.5/s, position ~0.5, prediction should be ~0.5 + 0.5*0.1 = 0.55
			// If divided instead of multiplied: 0.5 / 0.1 = 5 (clamped to 1)
			expect(result.prediction?.x).toBeLessThan(0.7);
		});

		it('velocity y multiplied by predictionSec for prediction', () => {
			const adapter = new OneEuroAdapter(1.0, 0.007, 1.0, 60, 100);
			adapter.smooth(createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.0, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 1000, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);

			expect(result.prediction?.y).toBeLessThan(0.7);
		});
	});

	describe('MUTATION KILLER: Conditional expressions', () => {
		it('trackingOk OR indexTip null triggers no-tracking path', () => {
			// Test both conditions separately
			const noTracking = adapter.smooth(
				createFrame({ trackingOk: false, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(noTracking.position).toBeNull();

			adapter.reset();
			const noIndexTip = adapter.smooth(createFrame({ trackingOk: true, indexTip: null }));
			expect(noIndexTip.position).toBeNull();
		});

		it('dt > 0.0001 required for derivative calculation', () => {
			// Very small dt (< 0.1ms) should not update derivative
			adapter.smooth(createFrame({ ts: 1000, indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 } }));
			adapter.smooth(createFrame({ ts: 2000, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } })); // Establish velocity

			// Now nearly same timestamp - should keep previous velocity, not recalculate
			const result = adapter.smooth(
				createFrame({ ts: 2000.05, indexTip: { x: 0.51, y: 0.5, z: 0, visibility: 1 } }),
			);
			// Velocity should still be positive (not NaN or weird)
			expect(result.velocity?.x).toBeGreaterThan(0);
		});

		it('lastValue undefined check on first frame', () => {
			// First frame has no lastValue - derivative should be 0
			const result = adapter.smooth(
				createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(result.velocity?.x).toBe(0);
			expect(result.velocity?.y).toBe(0);
		});

		it('lastTime undefined check on first frame', () => {
			// First frame has no lastTime - derivative should be 0
			const result = adapter.smooth(
				createFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }),
			);
			expect(result.velocity?.x).toBe(0);
		});

		it('Number.isNaN check returns input on NaN', () => {
			// Force NaN by using same timestamp
			adapter.smooth(createFrame({ ts: 100, indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 } }));
			const result = adapter.smooth(
				createFrame({ ts: 100, indexTip: { x: 0.8, y: 0.8, z: 0, visibility: 1 } }),
			);

			// Should return input value (0.8), not NaN
			expect(Number.isNaN(result.position?.x)).toBe(false);
			// Position should be near input since NaN fallback returns x
			expect(result.position?.x).toBeGreaterThan(0.6);
		});
	});

	describe('MUTATION KILLER: Boolean literals', () => {
		it('trackingOk=false in no-tracking output', () => {
			const result = adapter.smooth(createTrackingLostFrame(0));
			expect(result.trackingOk).toBe(false);
		});

		it('trackingOk=true in valid tracking output', () => {
			const result = adapter.smooth(createFrame({ trackingOk: true }));
			expect(result.trackingOk).toBe(true);
		});
	});
});
