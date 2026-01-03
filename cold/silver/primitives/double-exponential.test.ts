/**
 * Double Exponential Smoothing Predictor - MUTATION TESTABLE Tests
 *
 * Gen87.X3 | cold/silver/primitives | Property-Based Testing
 *
 * These tests are designed to KILL MUTANTS.
 * Every assertion should fail if the algorithm changes.
 */

import * as fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    calculateTTI,
    clamp,
    createInitialState,
    DEFAULT_DESP_CONFIG,
    processDESP,
    resetState,
    validateAlpha,
    type DESPConfig,
    type DESPState,
} from './double-exponential.js';

// ============================================================================
// UNIT TESTS
// ============================================================================

describe('clamp()', () => {
	it('returns value when in range', () => {
		expect(clamp(0.5, 0, 1)).toBe(0.5);
	});

	it('clamps to min when below', () => {
		expect(clamp(-0.5, 0, 1)).toBe(0);
	});

	it('clamps to max when above', () => {
		expect(clamp(1.5, 0, 1)).toBe(1);
	});

	it('returns exact min at boundary', () => {
		expect(clamp(0, 0, 1)).toBe(0);
	});

	it('returns exact max at boundary', () => {
		expect(clamp(1, 0, 1)).toBe(1);
	});
});

describe('createInitialState()', () => {
	it('creates state with default center values', () => {
		const state = createInitialState();
		expect(state.Sp_x).toBe(0.5);
		expect(state.Sp_y).toBe(0.5);
		expect(state.Spp_x).toBe(0.5);
		expect(state.Spp_y).toBe(0.5);
	});

	it('creates state with zero velocity', () => {
		const state = createInitialState();
		expect(state.velocity.x).toBe(0);
		expect(state.velocity.y).toBe(0);
	});

	it('creates uninitialized state', () => {
		const state = createInitialState();
		expect(state.initialized).toBe(false);
		expect(state.lastTs).toBeNull();
	});
});

describe('validateAlpha()', () => {
	it('accepts alpha in valid range', () => {
		expect(() => validateAlpha(0.5)).not.toThrow();
		expect(() => validateAlpha(0.1)).not.toThrow();
		expect(() => validateAlpha(0.9)).not.toThrow();
	});

	it('throws for alpha <= 0', () => {
		expect(() => validateAlpha(0)).toThrow('alpha must be in (0,1)');
		expect(() => validateAlpha(-0.1)).toThrow('alpha must be in (0,1)');
	});

	it('throws for alpha >= 1', () => {
		expect(() => validateAlpha(1)).toThrow('alpha must be in (0,1)');
		expect(() => validateAlpha(1.1)).toThrow('alpha must be in (0,1)');
	});
});

describe('processDESP()', () => {
	let state: DESPState;
	let config: DESPConfig;

	beforeEach(() => {
		state = createInitialState();
		config = { ...DEFAULT_DESP_CONFIG };
	});

	it('initializes state on first observation', () => {
		const result = processDESP(0.3, 0.7, 1000, state, config);

		expect(state.initialized).toBe(true);
		expect(state.Sp_x).toBe(0.3);
		expect(state.Sp_y).toBe(0.7);
		expect(result.smoothed.x).toBe(0.3);
		expect(result.smoothed.y).toBe(0.7);
	});

	it('returns input as both smoothed and predicted on first frame', () => {
		const result = processDESP(0.4, 0.6, 1000, state, config);

		expect(result.smoothed.x).toBe(0.4);
		expect(result.predicted.x).toBe(0.4);
		expect(result.velocity.x).toBe(0);
	});

	it('applies exponential smoothing on subsequent frames', () => {
		// First frame
		processDESP(0.5, 0.5, 1000, state, config);

		// Second frame - move to 0.7
		const result = processDESP(0.7, 0.5, 1016, state, config);

		// With alpha=0.5, smoothed should be between 0.5 and 0.7
		expect(result.smoothed.x).toBeGreaterThan(0.5);
		expect(result.smoothed.x).toBeLessThan(0.7);
	});

	it('predicts ahead when moving', () => {
		// Initialize at center
		processDESP(0.5, 0.5, 1000, state, config);

		// Move right
		processDESP(0.6, 0.5, 1016, state, config);
		const result = processDESP(0.7, 0.5, 1032, state, config);

		// Predicted should be ahead of smoothed (to the right)
		expect(result.predicted.x).toBeGreaterThan(result.smoothed.x);
	});

	it('clamps output when configured', () => {
		config.clampOutput = true;
		processDESP(0.9, 0.5, 1000, state, config);
		processDESP(0.95, 0.5, 1016, state, config);
		const result = processDESP(1.0, 0.5, 1032, state, config);

		expect(result.smoothed.x).toBeLessThanOrEqual(1);
		expect(result.predicted.x).toBeLessThanOrEqual(1);
	});

	it('does not clamp when disabled', () => {
		config.clampOutput = false;
		// Force state to allow overshoot
		state.initialized = true;
		state.Sp_x = 1.1;
		state.Spp_x = 1.0;
		state.lastTs = 1000;

		const result = processDESP(1.2, 0.5, 1016, state, config);

		// Should allow values > 1
		expect(result.smoothed.x).toBeGreaterThan(1);
	});
});

describe('resetState()', () => {
	it('resets all state values', () => {
		const state = createInitialState();
		state.Sp_x = 0.9;
		state.Sp_y = 0.1;
		state.initialized = true;
		state.lastTs = 5000;

		resetState(state);

		expect(state.Sp_x).toBe(0.5);
		expect(state.Sp_y).toBe(0.5);
		expect(state.initialized).toBe(false);
		expect(state.lastTs).toBeNull();
	});
});

describe('calculateTTI()', () => {
	it('returns 0 when at target', () => {
		const tti = calculateTTI(0.5, 0.5, 0, 0, 0.5, 0.5);
		expect(tti).toBe(0);
	});

	it('returns Infinity when not moving', () => {
		const tti = calculateTTI(0.3, 0.3, 0, 0, 0.7, 0.7);
		expect(tti).toBe(Number.POSITIVE_INFINITY);
	});

	it('returns Infinity when moving away', () => {
		// At 0.5, target at 0.7, but moving left (negative velocity)
		const tti = calculateTTI(0.5, 0.5, -1, 0, 0.7, 0.5);
		expect(tti).toBe(Number.POSITIVE_INFINITY);
	});

	it('calculates positive TTI when moving toward target', () => {
		// At 0.3, target at 0.8, moving right at 1 unit/sec
		const tti = calculateTTI(0.3, 0.5, 1, 0, 0.8, 0.5);
		expect(tti).toBeGreaterThan(0);
		expect(tti).toBeLessThan(Number.POSITIVE_INFINITY);
		// Distance is 0.5, speed is 1, so TTI should be ~500ms
		expect(tti).toBeCloseTo(500, 0);
	});
});

// ============================================================================
// PROPERTY-BASED TESTS (MUTATION KILLERS)
// ============================================================================

describe('PROPERTY: clamp invariants', () => {
	it('output is always within [min, max]', () => {
		fc.assert(
			fc.property(
				fc.float({ noNaN: true }),
				fc.float({ noNaN: true }),
				fc.float({ noNaN: true }),
				(value, min, max) => {
					if (min > max) [min, max] = [max, min];
					const result = clamp(value, min, max);
					return result >= min && result <= max;
				},
			),
			{ numRuns: 100 },
		);
	});
});

describe('PROPERTY: DESP convergence', () => {
	it('converges to constant input over time', () => {
		fc.assert(
			fc.property(
				fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
				fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
				fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
				(targetX, targetY, alpha) => {
					const state = createInitialState();
					const config: DESPConfig = {
						alpha,
						predictionMs: 50,
						clampOutput: true,
					};

					// Feed constant input 20 times
					let result;
					for (let i = 0; i < 20; i++) {
						result = processDESP(targetX, targetY, i * 16, state, config);
					}

					// Should converge close to input
					const tolerance = 0.01;
					return (
						Math.abs(result!.smoothed.x - targetX) < tolerance &&
						Math.abs(result!.smoothed.y - targetY) < tolerance
					);
				},
			),
			{ numRuns: 50 },
		);
	});
});

describe('PROPERTY: DESP velocity direction', () => {
	it('velocity sign matches movement direction', () => {
		fc.assert(
			fc.property(
				fc.float({ min: Math.fround(0.1), max: Math.fround(0.4), noNaN: true }),
				fc.float({ min: Math.fround(0.6), max: Math.fround(0.9), noNaN: true }),
				(start, end) => {
					const state = createInitialState();
					const config: DESPConfig = { ...DEFAULT_DESP_CONFIG };

					// Move from start to end
					processDESP(start, 0.5, 1000, state, config);
					processDESP((start + end) / 2, 0.5, 1016, state, config);
					const result = processDESP(end, 0.5, 1032, state, config);

					// Velocity X should be positive (moving right)
					return result.velocity.x > 0;
				},
			),
			{ numRuns: 50 },
		);
	});
});

describe('PROPERTY: prediction is ahead of smoothed when moving', () => {
	it('predicted position is further along movement direction', () => {
		fc.assert(
			fc.property(
				fc.float({ min: Math.fround(0.1), max: Math.fround(0.3), noNaN: true }),
				fc.float({ min: Math.fround(0.7), max: Math.fround(0.9), noNaN: true }),
				(start, end) => {
					const state = createInitialState();
					const config: DESPConfig = { ...DEFAULT_DESP_CONFIG };

					// Move right (start < end)
					processDESP(start, 0.5, 1000, state, config);
					processDESP((start + end) / 2, 0.5, 1016, state, config);
					const result = processDESP(end, 0.5, 1032, state, config);

					// Predicted X should be >= smoothed X (ahead in movement direction)
					return result.predicted.x >= result.smoothed.x;
				},
			),
			{ numRuns: 50 },
		);
	});
});

describe('PROPERTY: TTI decreases as we approach target', () => {
	it('TTI gets smaller as distance decreases', () => {
		const target = { x: 1, y: 0.5 };
		const velocity = { x: 1, y: 0 }; // Moving right at 1 unit/sec

		const tti1 = calculateTTI(0.2, 0.5, velocity.x, velocity.y, target.x, target.y);
		const tti2 = calculateTTI(0.5, 0.5, velocity.x, velocity.y, target.x, target.y);
		const tti3 = calculateTTI(0.8, 0.5, velocity.x, velocity.y, target.x, target.y);

		expect(tti1).toBeGreaterThan(tti2);
		expect(tti2).toBeGreaterThan(tti3);
	});
});
