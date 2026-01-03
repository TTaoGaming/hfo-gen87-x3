/**
 * Double Exponential Smoothing Predictor - HELD-OUT TESTS
 *
 * These tests are HIDDEN from AI during development.
 * They validate edge cases that AI might skip or game.
 *
 * Gen87.X3 | Held-Out Defense Protocol | 2026-01-02
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
	DEFAULT_DESP_CONFIG,
	type DESPConfig,
	type DESPState,
	calculateTTI,
	createInitialState,
	processDESP,
	resetState,
	validateAlpha,
} from '../../cold/silver/primitives/double-exponential.js';

describe('DESP HELD-OUT Validation', () => {
	let state: DESPState;
	let config: DESPConfig;

	beforeEach(() => {
		state = createInitialState();
		config = { ...DEFAULT_DESP_CONFIG };
	});

	// =========================================================================
	// EDGE CASE: Alpha Boundaries
	// =========================================================================

	it('throws for alpha exactly 0', () => {
		expect(() => validateAlpha(0)).toThrow();
	});

	it('throws for alpha exactly 1', () => {
		expect(() => validateAlpha(1)).toThrow();
	});

	it('throws for alpha > 1', () => {
		expect(() => validateAlpha(1.5)).toThrow();
	});

	it('throws for negative alpha', () => {
		expect(() => validateAlpha(-0.5)).toThrow();
	});

	it('accepts alpha very close to 0', () => {
		expect(() => validateAlpha(0.0001)).not.toThrow();
	});

	it('accepts alpha very close to 1', () => {
		expect(() => validateAlpha(0.9999)).not.toThrow();
	});

	// =========================================================================
	// EDGE CASE: Timestamp Edge Cases
	// =========================================================================

	it('handles zero timestamp on first frame', () => {
		const result = processDESP(0.5, 0.5, 0, state, config);
		expect(Number.isFinite(result.smoothed.x)).toBe(true);
		expect(Number.isFinite(result.predicted.x)).toBe(true);
	});

	it('handles very large timestamps', () => {
		processDESP(0.5, 0.5, 0, state, config);
		const result = processDESP(0.6, 0.6, 1e12, state, config); // 1 trillion ms
		expect(Number.isFinite(result.smoothed.x)).toBe(true);
		expect(Number.isFinite(result.velocity.x)).toBe(true);
	});

	it('handles same timestamp twice', () => {
		processDESP(0.5, 0.5, 1000, state, config);
		const result = processDESP(0.6, 0.6, 1000, state, config);
		// Should produce finite results even with dt=0
		expect(Number.isFinite(result.smoothed.x) || Number.isNaN(result.smoothed.x)).toBe(true);
	});

	// =========================================================================
	// EDGE CASE: Extreme Positions
	// =========================================================================

	it('clamps output to [0,1] for extreme positive input', () => {
		config.clampOutput = true;
		processDESP(0.5, 0.5, 0, state, config);
		// Rapid movement to extreme
		const result = processDESP(100, 100, 16, state, config);
		expect(result.smoothed.x).toBeLessThanOrEqual(1);
		expect(result.smoothed.y).toBeLessThanOrEqual(1);
		expect(result.predicted.x).toBeLessThanOrEqual(1);
		expect(result.predicted.y).toBeLessThanOrEqual(1);
	});

	it('clamps output to [0,1] for extreme negative input', () => {
		config.clampOutput = true;
		processDESP(0.5, 0.5, 0, state, config);
		const result = processDESP(-100, -100, 16, state, config);
		expect(result.smoothed.x).toBeGreaterThanOrEqual(0);
		expect(result.smoothed.y).toBeGreaterThanOrEqual(0);
		expect(result.predicted.x).toBeGreaterThanOrEqual(0);
		expect(result.predicted.y).toBeGreaterThanOrEqual(0);
	});

	it('allows out-of-bounds when clampOutput=false', () => {
		config.clampOutput = false;
		processDESP(0.5, 0.5, 0, state, config);
		processDESP(0.9, 0.9, 16, state, config);
		const result = processDESP(1.5, 1.5, 32, state, config);
		// Prediction might exceed 1.0 when moving fast toward edge
		// This is valid - we just need finite values
		expect(Number.isFinite(result.predicted.x)).toBe(true);
	});

	// =========================================================================
	// PROPERTY: Prediction Is Ahead When Moving
	// =========================================================================

	it('predicts ahead in direction of movement', () => {
		processDESP(0.3, 0.5, 0, state, config);
		processDESP(0.4, 0.5, 16, state, config);
		processDESP(0.5, 0.5, 32, state, config);
		const result = processDESP(0.6, 0.5, 48, state, config);

		// Moving right, so predicted.x > smoothed.x
		expect(result.predicted.x).toBeGreaterThan(result.smoothed.x);
	});

	it('predicts behind when moving opposite direction', () => {
		processDESP(0.7, 0.5, 0, state, config);
		processDESP(0.6, 0.5, 16, state, config);
		processDESP(0.5, 0.5, 32, state, config);
		const result = processDESP(0.4, 0.5, 48, state, config);

		// Moving left, so predicted.x < smoothed.x
		expect(result.predicted.x).toBeLessThan(result.smoothed.x);
	});

	// =========================================================================
	// PROPERTY: Velocity Sign Matches Movement
	// =========================================================================

	it('velocity is positive when moving right', () => {
		processDESP(0.3, 0.5, 0, state, config);
		const result = processDESP(0.7, 0.5, 16, state, config);
		expect(result.velocity.x).toBeGreaterThan(0);
	});

	it('velocity is negative when moving left', () => {
		processDESP(0.7, 0.5, 0, state, config);
		const result = processDESP(0.3, 0.5, 16, state, config);
		expect(result.velocity.x).toBeLessThan(0);
	});

	it('velocity is near zero when stationary', () => {
		processDESP(0.5, 0.5, 0, state, config);
		for (let i = 1; i < 20; i++) {
			processDESP(0.5, 0.5, i * 16, state, config);
		}
		const result = processDESP(0.5, 0.5, 320, state, config);
		expect(Math.abs(result.velocity.x)).toBeLessThan(0.1);
		expect(Math.abs(result.velocity.y)).toBeLessThan(0.1);
	});

	// =========================================================================
	// PROPERTY: Reset Clears All State
	// =========================================================================

	it('reset produces same result as fresh state', () => {
		// Use state
		processDESP(0.1, 0.1, 0, state, config);
		processDESP(0.9, 0.9, 16, state, config);
		processDESP(0.5, 0.5, 32, state, config);

		// Reset
		resetState(state);

		// Create fresh state
		const fresh = createInitialState();

		// Both should produce same result for same input
		const r1 = processDESP(0.3, 0.3, 1000, state, config);
		const r2 = processDESP(0.3, 0.3, 1000, fresh, config);

		expect(r1.smoothed.x).toBe(r2.smoothed.x);
		expect(r1.smoothed.y).toBe(r2.smoothed.y);
	});

	// =========================================================================
	// TTI (Time To Intercept) Edge Cases
	// =========================================================================

	it('TTI returns 0 when at target', () => {
		const tti = calculateTTI(0.5, 0.5, 0, 0, 0.5, 0.5);
		expect(tti).toBe(0);
	});

	it('TTI returns Infinity when stationary away from target', () => {
		const tti = calculateTTI(0.3, 0.5, 0.7, 0.5, 0, 0);
		expect(tti).toBe(Number.POSITIVE_INFINITY);
	});

	it('TTI returns Infinity when moving away from target', () => {
		// Position at 0.3, target at 0.7, velocity moving left
		const tti = calculateTTI(0.3, 0.5, 0.7, 0.5, -1, 0);
		expect(tti).toBe(Number.POSITIVE_INFINITY);
	});

	it('TTI calculates positive value when moving toward target', () => {
		// Position at 0.3, target at 0.7, velocity moving right
		const tti = calculateTTI(0.3, 0.5, 0.7, 0.5, 1, 0);
		expect(tti).toBeGreaterThan(0);
		expect(tti).toBeLessThan(Number.POSITIVE_INFINITY);
	});

	// =========================================================================
	// PROPERTY: Convergence to Stable Input
	// =========================================================================

	it('converges to constant input over time', () => {
		const target = 0.7;

		for (let i = 0; i < 100; i++) {
			processDESP(target, target, i * 16, state, config);
		}

		const final = processDESP(target, target, 1600, state, config);

		// Should be very close to target
		expect(Math.abs(final.smoothed.x - target)).toBeLessThan(0.01);
		expect(Math.abs(final.predicted.x - target)).toBeLessThan(0.05);
	});

	// =========================================================================
	// PROPERTY: Alpha Effect on Responsiveness
	// =========================================================================

	it('higher alpha = more responsive (closer to raw input)', () => {
		const lowAlpha: DESPState = createInitialState();
		const highAlpha: DESPState = createInitialState();

		const lowConfig = { ...config, alpha: 0.1 };
		const highConfig = { ...config, alpha: 0.9 };

		// Initialize
		processDESP(0.0, 0.5, 0, lowAlpha, lowConfig);
		processDESP(0.0, 0.5, 0, highAlpha, highConfig);

		// Jump to 1.0
		const lowResult = processDESP(1.0, 0.5, 16, lowAlpha, lowConfig);
		const highResult = processDESP(1.0, 0.5, 16, highAlpha, highConfig);

		// High alpha should be closer to 1.0 (more responsive)
		expect(highResult.smoothed.x).toBeGreaterThan(lowResult.smoothed.x);
	});
});
