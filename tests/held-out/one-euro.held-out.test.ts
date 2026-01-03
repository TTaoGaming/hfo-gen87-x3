/**
 * OneEuro Filter - HELD-OUT TESTS
 *
 * These tests are HIDDEN from AI during development.
 * They validate edge cases that AI might skip or game.
 *
 * Gen87.X3 | Held-Out Defense Protocol | 2026-01-02
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { OneEuroPrimitive } from '../../cold/silver/primitives/one-euro.js';

describe('OneEuro HELD-OUT Validation', () => {
	let filter: OneEuroPrimitive;

	beforeEach(() => {
		filter = new OneEuroPrimitive();
	});

	// =========================================================================
	// EDGE CASE: Zero/Near-Zero Delta Time
	// =========================================================================

	it('handles exact same timestamp without crashing', () => {
		const r1 = filter.filter(0.5, 0.5, 1000);
		const r2 = filter.filter(0.6, 0.6, 1000); // Same timestamp!
		// Should return NaN to signal error condition, not crash
		expect(Number.isNaN(r2.position.x) || Number.isFinite(r2.position.x)).toBe(true);
	});

	it('handles microsecond timestamp differences', () => {
		const r1 = filter.filter(0.5, 0.5, 1000);
		const r2 = filter.filter(0.6, 0.6, 1000.0001); // 0.0001ms difference
		// Should handle gracefully - either NaN or finite
		expect(Number.isNaN(r2.position.x) || Number.isFinite(r2.position.x)).toBe(true);
	});

	// =========================================================================
	// EDGE CASE: Timestamp Regression
	// =========================================================================

	it('handles timestamp going backwards', () => {
		filter.filter(0.5, 0.5, 1000);
		filter.filter(0.6, 0.6, 1016);
		// Timestamp goes backwards (clock skew, frame drop)
		const result = filter.filter(0.7, 0.7, 1010);
		// Should not crash or return Infinity
		expect(Number.isFinite(result.position.x) || Number.isNaN(result.position.x)).toBe(true);
		expect(result.position.x).not.toBe(Number.POSITIVE_INFINITY);
		expect(result.position.x).not.toBe(Number.NEGATIVE_INFINITY);
	});

	// =========================================================================
	// EDGE CASE: Extreme Input Values
	// =========================================================================

	it('handles zero coordinates', () => {
		const result = filter.filter(0, 0, 1000);
		expect(result.position.x).toBe(0);
		expect(result.position.y).toBe(0);
	});

	it('handles one coordinates', () => {
		const result = filter.filter(1, 1, 1000);
		expect(result.position.x).toBe(1);
		expect(result.position.y).toBe(1);
	});

	it('handles negative coordinates gracefully', () => {
		const result = filter.filter(-0.5, -0.5, 1000);
		expect(Number.isFinite(result.position.x)).toBe(true);
		expect(Number.isFinite(result.position.y)).toBe(true);
	});

	it('handles coordinates > 1 gracefully', () => {
		const result = filter.filter(1.5, 2.0, 1000);
		expect(Number.isFinite(result.position.x)).toBe(true);
		expect(Number.isFinite(result.position.y)).toBe(true);
	});

	// =========================================================================
	// EDGE CASE: Rapid Direction Changes
	// =========================================================================

	it('handles rapid oscillation without exploding velocity', () => {
		let lastVelocity = 0;
		for (let i = 0; i < 100; i++) {
			const x = i % 2 === 0 ? 0.3 : 0.7;
			const result = filter.filter(x, 0.5, 1000 + i * 16);
			// Velocity should stay bounded
			expect(Math.abs(result.velocity.x)).toBeLessThan(1000);
			lastVelocity = result.velocity.x;
		}
	});

	// =========================================================================
	// PROPERTY: Smoothing Always Reduces Jitter
	// =========================================================================

	it('reduces jitter compared to raw input', () => {
		const rawJitter: number[] = [];
		const smoothedJitter: number[] = [];
		const baseX = 0.5;

		// Generate jittery input
		for (let i = 0; i < 100; i++) {
			const noise = (Math.random() - 0.5) * 0.1; // ±5% jitter
			const x = baseX + noise;
			const result = filter.filter(x, 0.5, 1000 + i * 16);

			if (i > 0) {
				rawJitter.push(Math.abs(noise));
				smoothedJitter.push(Math.abs(result.position.x - baseX));
			}
		}

		// Calculate average jitter
		const avgRaw = rawJitter.reduce((a, b) => a + b, 0) / rawJitter.length;
		const avgSmoothed = smoothedJitter.reduce((a, b) => a + b, 0) / smoothedJitter.length;

		// Smoothed jitter should be less than raw
		expect(avgSmoothed).toBeLessThan(avgRaw);
	});

	// =========================================================================
	// PROPERTY: Reset Clears All State
	// =========================================================================

	it('reset produces same result as fresh filter', () => {
		// Use filter
		filter.filter(0.1, 0.1, 1000);
		filter.filter(0.9, 0.9, 1016);
		filter.filter(0.5, 0.5, 1032);

		// Reset
		filter.reset();

		// Create fresh filter
		const fresh = new OneEuroPrimitive();

		// Both should produce same result for same input
		const r1 = filter.filter(0.3, 0.3, 2000);
		const r2 = fresh.filter(0.3, 0.3, 2000);

		expect(r1.position.x).toBe(r2.position.x);
		expect(r1.position.y).toBe(r2.position.y);
	});

	// =========================================================================
	// PROPERTY: Convergence to Stable Input
	// =========================================================================

	it('converges to constant input over time', () => {
		const target = 0.7;
		let lastDiff = Number.POSITIVE_INFINITY;

		for (let i = 0; i < 100; i++) {
			const result = filter.filter(target, target, 1000 + i * 16);
			const diff = Math.abs(result.position.x - target);

			// Difference should be decreasing (convergence)
			if (i > 10) {
				expect(diff).toBeLessThan(lastDiff + 0.001); // Allow tiny float errors
			}
			lastDiff = diff;
		}

		// Should be very close to target after 100 frames
		expect(lastDiff).toBeLessThan(0.01);
	});

	// =========================================================================
	// PROPERTY: Beta Parameter Effect
	// =========================================================================

	it('higher beta = less lag at high speeds', () => {
		const lowBeta = new OneEuroPrimitive({ beta: 0.001 });
		const highBeta = new OneEuroPrimitive({ beta: 0.1 });

		// Fast movement
		lowBeta.filter(0.0, 0.5, 1000);
		highBeta.filter(0.0, 0.5, 1000);

		const lowResult = lowBeta.filter(1.0, 0.5, 1016); // Jump to 1.0
		const highResult = highBeta.filter(1.0, 0.5, 1016);

		// High beta should track faster (closer to 1.0)
		expect(highResult.position.x).toBeGreaterThan(lowResult.position.x);
	});

	// =========================================================================
	// PROPERTY: minCutoff Parameter Effect
	// =========================================================================

	it('lower minCutoff = more smoothing at low speeds', () => {
		const lowCutoff = new OneEuroPrimitive({ minCutoff: 0.1 });
		const highCutoff = new OneEuroPrimitive({ minCutoff: 5.0 });

		// Slow jittery movement
		for (let i = 0; i < 20; i++) {
			const jitter = (Math.random() - 0.5) * 0.02;
			lowCutoff.filter(0.5 + jitter, 0.5, 1000 + i * 16);
			highCutoff.filter(0.5 + jitter, 0.5, 1000 + i * 16);
		}

		// Add one more jitter
		const lowResult = lowCutoff.filter(0.52, 0.5, 1320);
		const highResult = highCutoff.filter(0.52, 0.5, 1320);

		// Low cutoff should be smoother (closer to 0.5)
		expect(Math.abs(lowResult.position.x - 0.5)).toBeLessThan(
			Math.abs(highResult.position.x - 0.5),
		);
	});
});
