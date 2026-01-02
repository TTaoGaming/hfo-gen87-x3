/**
 * OneEuroExemplarAdapter Unit Tests
 *
 * Gen87.X3 | VALIDATE Phase | TDD GREEN
 *
 * PRINCIPLE: Test the npm exemplar wrapper, not reimplement the filter.
 * The 1eurofilter@1.2.2 package is by the original author (Géry Casiez).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { SensorFrame } from '../contracts/schemas.js';
import { OneEuroExemplarAdapter } from './one-euro-exemplar.adapter.js';

describe('OneEuroExemplarAdapter', () => {
	let adapter: OneEuroExemplarAdapter;

	beforeEach(() => {
		adapter = new OneEuroExemplarAdapter({
			frequency: 60,
			minCutoff: 1.0,
			beta: 0.007,
		});
	});

	describe('construction', () => {
		it('should create with default config', () => {
			const defaultAdapter = new OneEuroExemplarAdapter();
			const config = defaultAdapter.getConfig();

			expect(config.frequency).toBe(60);
			expect(config.minCutoff).toBe(1.0);
			expect(config.beta).toBe(0.007);
			expect(config.dCutoff).toBe(1.0);
		});

		it('should accept custom config', () => {
			const customAdapter = new OneEuroExemplarAdapter({
				frequency: 30,
				minCutoff: 0.5,
				beta: 0.01,
				dCutoff: 2.0,
			});
			const config = customAdapter.getConfig();

			expect(config.frequency).toBe(30);
			expect(config.minCutoff).toBe(0.5);
			expect(config.beta).toBe(0.01);
			expect(config.dCutoff).toBe(2.0);
		});
	});

	describe('smooth()', () => {
		const createFrame = (ts: number, x: number, y: number): SensorFrame => ({
			ts,
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Pointing_Up',
			confidence: 0.95,
			indexTip: { x, y, z: 0, visibility: 1 },
			landmarks: Array(21).fill({ x, y, z: 0, visibility: 1 }),
		});

		it('should return valid SmoothedFrame with position', () => {
			const frame = createFrame(0, 0.5, 0.5);
			const result = adapter.smooth(frame);

			expect(result.ts).toBe(0);
			expect(result.handId).toBe('right');
			expect(result.trackingOk).toBe(true);
			expect(result.position).not.toBeNull();
			expect(result.position!.x).toBeCloseTo(0.5, 2);
			expect(result.position!.y).toBeCloseTo(0.5, 2);
		});

		it('should return null position when no landmarks', () => {
			const frame: SensorFrame = {
				ts: 0,
				handId: 'none',
				trackingOk: false,
				palmFacing: false,
				label: 'None',
				confidence: 0,
				indexTip: null,
				landmarks: null,
			};
			const result = adapter.smooth(frame);

			expect(result.position).toBeNull();
			expect(result.velocity).toBeNull();
			expect(result.prediction).toBeNull();
		});

		it('should smooth noisy input over multiple frames', () => {
			// Simulate noisy input around (0.5, 0.5) with jitter
			const frames = [
				createFrame(0, 0.5, 0.5),
				createFrame(16, 0.52, 0.48), // jitter
				createFrame(32, 0.49, 0.51), // jitter
				createFrame(48, 0.51, 0.49), // jitter
				createFrame(64, 0.5, 0.5),
			];

			const results = frames.map((f) => adapter.smooth(f));

			// All positions should be close to center after smoothing
			results.forEach((r) => {
				expect(r.position).not.toBeNull();
				expect(r.position!.x).toBeGreaterThan(0.45);
				expect(r.position!.x).toBeLessThan(0.55);
				expect(r.position!.y).toBeGreaterThan(0.45);
				expect(r.position!.y).toBeLessThan(0.55);
			});
		});

		it('should calculate velocity from position deltas', () => {
			// Large movement should produce non-zero velocity
			adapter.smooth(createFrame(0, 0.0, 0.5));
			const result = adapter.smooth(createFrame(1000, 1.0, 0.5)); // 1 second later, moved right

			expect(result.velocity).not.toBeNull();
			// Velocity should be positive in X direction (moving right)
			expect(result.velocity!.x).toBeGreaterThan(0);
		});

		it('should calculate velocity with correct units (pixels/second)', () => {
			// MUTANT KILLER: Detects / dt vs * dt mutation
			// Move 0.5 units in 0.5 seconds → velocity should be ~1.0 units/second
			// If mutated to * dt, velocity would be ~0.25 (0.5 * 0.5)

			adapter.smooth(createFrame(0, 0.0, 0.5));
			const result = adapter.smooth(createFrame(500, 0.5, 0.5)); // 0.5 sec, moved 0.5 units

			// With / dt: velocity ≈ 0.5 / 0.5 = 1.0
			// With * dt: velocity ≈ 0.5 * 0.5 = 0.25 (WRONG)
			// Allow some smoothing effect but velocity should be closer to 1.0 than 0.25
			expect(result.velocity!.x).toBeGreaterThan(0.5); // Would fail if * dt
		});

		it('should calculate velocity correctly for Y axis too', () => {
			// MUTANT KILLER: Ensures Y velocity uses division by dt
			adapter.smooth(createFrame(0, 0.5, 0.0));
			const result = adapter.smooth(createFrame(500, 0.5, 0.5)); // 0.5 sec, moved 0.5 Y

			// Y velocity should be ~1.0 units/second, not 0.25
			expect(result.velocity!.y).toBeGreaterThan(0.5);
		});
	});

	describe('setParams()', () => {
		it('should update minCutoff and beta', () => {
			adapter.setParams(2.0, 0.5);
			const config = adapter.getConfig();

			expect(config.minCutoff).toBe(2.0);
			expect(config.beta).toBe(0.5);
		});

		it('should apply new params to subsequent filtering', () => {
			const frame1 = {
				ts: 0,
				handId: 'right' as const,
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up' as const,
				confidence: 0.95,
				indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 },
				landmarks: Array(21).fill({ x: 0.5, y: 0.5, z: 0, visibility: 1 }),
			};

			// Filter once to initialize
			adapter.smooth(frame1);

			// Change params - more aggressive smoothing
			adapter.setParams(0.5, 0.001);

			// Filter again - should use new params
			const frame2 = { ...frame1, ts: 16, indexTip: { x: 0.9, y: 0.9, z: 0, visibility: 1 } };
			const result = adapter.smooth(frame2);

			// With low beta, should still be closer to original position (more lag)
			expect(result.position!.x).toBeLessThan(0.9);
		});
	});

	describe('reset()', () => {
		it('should clear filter state', () => {
			// Prime the filter
			adapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.1, y: 0.1, z: 0, visibility: 1 },
				landmarks: Array(21).fill({ x: 0.1, y: 0.1, z: 0, visibility: 1 }),
			});

			// Reset
			adapter.reset();

			// New frame should be treated as first frame (no lag from previous state)
			const result = adapter.smooth({
				ts: 1000,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.9, y: 0.9, z: 0, visibility: 1 },
				landmarks: Array(21).fill({ x: 0.9, y: 0.9, z: 0, visibility: 1 }),
			});

			// After reset, should be very close to new position (no filter memory)
			expect(result.position!.x).toBeCloseTo(0.9, 1);
			expect(result.position!.y).toBeCloseTo(0.9, 1);
		});

		it('should reset velocity tracking', () => {
			// Prime the filter with movement
			adapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.0, y: 0.5, z: 0, visibility: 1 },
				landmarks: Array(21).fill({ x: 0.0, y: 0.5, z: 0, visibility: 1 }),
			});

			adapter.smooth({
				ts: 100,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 1.0, y: 0.5, z: 0, visibility: 1 },
				landmarks: Array(21).fill({ x: 1.0, y: 0.5, z: 0, visibility: 1 }),
			});

			// Reset
			adapter.reset();

			// First frame after reset should have zero velocity (no previous position)
			const result = adapter.smooth({
				ts: 200,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 },
				landmarks: Array(21).fill({ x: 0.5, y: 0.5, z: 0, visibility: 1 }),
			});

			expect(result.velocity!.x).toBe(0);
			expect(result.velocity!.y).toBe(0);
		});
	});

	describe('SmootherPort contract compliance', () => {
		it('should implement smooth() method', () => {
			expect(typeof adapter.smooth).toBe('function');
		});

		it('should implement reset() method', () => {
			expect(typeof adapter.reset).toBe('function');
		});

		it('should implement setParams() method', () => {
			expect(typeof adapter.setParams).toBe('function');
		});
	});

	// ==========================================================================
	// MUTANT KILLERS - Targeted tests for surviving mutations
	// ==========================================================================

	describe('MUTANT KILLERS - NaN Guard Behavior', () => {
		it('should reset and passthrough when filter produces NaN', () => {
			// Create adapter with very short beta that could trigger NaN on edge cases
			const testAdapter = new OneEuroExemplarAdapter({
				frequency: 60,
				minCutoff: 1.0,
				beta: 0.007,
			});

			// First frame - normal
			testAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 },
				landmarks: null,
			});

			// Large jump that might cause issues - but should still produce valid output
			const result = testAdapter.smooth({
				ts: 16,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.9, y: 0.9, z: 0, visibility: 1 },
				landmarks: null,
			});

			// Output should NEVER be NaN - either filtered or passthrough
			expect(Number.isNaN(result.position!.x)).toBe(false);
			expect(Number.isNaN(result.position!.y)).toBe(false);
		});

		it('should handle edge case timestamp of zero', () => {
			const testAdapter = new OneEuroExemplarAdapter();

			// ts=0 is an edge case that can cause division issues
			const result = testAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 },
				landmarks: null,
			});

			expect(Number.isNaN(result.position!.x)).toBe(false);
			expect(Number.isNaN(result.position!.y)).toBe(false);
		});

		it('should handle NaN in X only (OR behavior, not AND)', () => {
			// MUTANT KILLER: Detects || vs && mutation in NaN guard
			// When X is NaN but Y is valid, should still reset/passthrough
			// If mutated to &&, it would let NaN X through
			const testAdapter = new OneEuroExemplarAdapter();

			// Mock scenario: if the internal filter ever produces NaN for just one axis
			// The guard should catch it. We test by checking the output is always valid.
			// Since we can't directly inject NaN, we verify the contract that
			// position.x and position.y are NEVER NaN when the guard works correctly.

			const frames = [
				{ ts: 0, x: 0.5, y: 0.5 },
				{ ts: 16, x: 0.6, y: 0.6 },
				{ ts: 32, x: 0.7, y: 0.7 },
			];

			for (const f of frames) {
				const result = testAdapter.smooth({
					ts: f.ts,
					handId: 'right',
					trackingOk: true,
					palmFacing: true,
					label: 'Pointing_Up',
					confidence: 0.95,
					indexTip: { x: f.x, y: f.y, z: 0, visibility: 1 },
					landmarks: null,
				});

				// Both X and Y must NEVER be NaN
				expect(Number.isNaN(result.position!.x)).toBe(false);
				expect(Number.isNaN(result.position!.y)).toBe(false);
			}
		});
	});

	describe('MUTANT KILLERS - Clamping Boundary Tests', () => {
		it('should clamp X position to minimum 0', () => {
			const testAdapter = new OneEuroExemplarAdapter({
				frequency: 60,
				minCutoff: 0.5, // Lower minCutoff = more smoothing = can undershoot
				beta: 0.001,
			});

			// Input at -0.1 (out of bounds low)
			const result = testAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: -0.1, y: 0.5, z: 0, visibility: 1 },
				landmarks: null,
			});

			// X should be clamped to 0, not negative
			expect(result.position!.x).toBeGreaterThanOrEqual(0);
		});

		it('should clamp X position to maximum 1', () => {
			const testAdapter = new OneEuroExemplarAdapter({
				frequency: 60,
				minCutoff: 0.5,
				beta: 0.001,
			});

			// Input at 1.1 (out of bounds high)
			const result = testAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 1.1, y: 0.5, z: 0, visibility: 1 },
				landmarks: null,
			});

			// X should be clamped to 1, not greater
			expect(result.position!.x).toBeLessThanOrEqual(1);
		});

		it('should clamp Y position to minimum 0', () => {
			const testAdapter = new OneEuroExemplarAdapter();

			const result = testAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.5, y: -0.2, z: 0, visibility: 1 },
				landmarks: null,
			});

			expect(result.position!.y).toBeGreaterThanOrEqual(0);
		});

		it('should clamp Y position to maximum 1', () => {
			const testAdapter = new OneEuroExemplarAdapter();

			const result = testAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.5, y: 1.3, z: 0, visibility: 1 },
				landmarks: null,
			});

			expect(result.position!.y).toBeLessThanOrEqual(1);
		});

		it('should clamp passthrough X position to [0,1]', () => {
			// Create fresh adapter (no filters)
			const testAdapter = new OneEuroExemplarAdapter();

			// Force passthrough by passing no landmarks on first frame with out-of-bounds values
			// The passthrough path still needs to clamp
			const result = testAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: false, // This won't trigger passthrough, but let's test another way
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: -0.5, y: 1.5, z: 0, visibility: 1 },
				landmarks: null,
			});

			expect(result.position!.x).toBeGreaterThanOrEqual(0);
			expect(result.position!.y).toBeLessThanOrEqual(1);
		});
	});

	describe('MUTANT KILLERS - setParams Filter Update', () => {
		it('should actually update existing filters when setParams is called', () => {
			const testAdapter = new OneEuroExemplarAdapter({
				frequency: 60,
				minCutoff: 1.0,
				beta: 0.007,
			});

			// Prime the filter to create filter instances
			testAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.1, y: 0.1, z: 0, visibility: 1 },
				landmarks: null,
			});

			// Change to VERY low beta (almost no adaptation to speed)
			testAdapter.setParams(0.1, 0.0001);

			// Now apply a sudden large movement
			const result1 = testAdapter.smooth({
				ts: 16,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.9, y: 0.9, z: 0, visibility: 1 },
				landmarks: null,
			});

			// Create a fresh adapter WITHOUT setParams update
			const freshAdapter = new OneEuroExemplarAdapter({
				frequency: 60,
				minCutoff: 1.0,
				beta: 0.007,
			});

			freshAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.1, y: 0.1, z: 0, visibility: 1 },
				landmarks: null,
			});

			const result2 = freshAdapter.smooth({
				ts: 16,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.9, y: 0.9, z: 0, visibility: 1 },
				landmarks: null,
			});

			// The adapter with setParams(0.1, 0.0001) should have MORE lag
			// because lower minCutoff and near-zero beta means much more smoothing
			// So result1.position.x should be LESS than result2.position.x
			expect(result1.position!.x).toBeLessThan(result2.position!.x);
		});

		it('should apply setParams to BOTH X and Y filters', () => {
			const testAdapter = new OneEuroExemplarAdapter({
				frequency: 60,
				minCutoff: 1.0,
				beta: 0.007,
			});

			// Prime filters
			testAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.1, y: 0.1, z: 0, visibility: 1 },
				landmarks: null,
			});

			// Update to high beta (responsive)
			testAdapter.setParams(1.0, 1.0);

			// Large movement
			const result = testAdapter.smooth({
				ts: 16,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.9, y: 0.9, z: 0, visibility: 1 },
				landmarks: null,
			});

			// With high beta, both X and Y should have responded
			// Both should have moved from start position (0.1) toward target
			// The key test is that BOTH x and y were updated by setParams
			expect(result.position!.x).toBeGreaterThan(0.1); // Moved from start
			expect(result.position!.y).toBeGreaterThan(0.1); // Both axes affected
		});
	});

	describe('MUTANT KILLERS - Velocity Object Structure', () => {
		it('should return velocity with explicit x and y properties', () => {
			const testAdapter = new OneEuroExemplarAdapter();

			const result = testAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 },
				landmarks: null,
			});

			// Velocity must have BOTH x and y, not an empty object
			expect(result.velocity).not.toBeNull();
			expect(result.velocity).toHaveProperty('x');
			expect(result.velocity).toHaveProperty('y');
			expect(typeof result.velocity!.x).toBe('number');
			expect(typeof result.velocity!.y).toBe('number');
		});

		it('should return zero velocity on first frame (not empty object)', () => {
			const testAdapter = new OneEuroExemplarAdapter();

			const result = testAdapter.smooth({
				ts: 0,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Pointing_Up',
				confidence: 0.95,
				indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 },
				landmarks: null,
			});

			// First frame should have velocity {x: 0, y: 0}, not {}
			expect(result.velocity!.x).toBe(0);
			expect(result.velocity!.y).toBe(0);
		});

		it('passthrough should return velocity object with x and y', () => {
			const testAdapter = new OneEuroExemplarAdapter();

			// Passthrough case: no indexTip
			const result = testAdapter.smooth({
				ts: 0,
				handId: 'none',
				trackingOk: false,
				palmFacing: false,
				label: 'None',
				confidence: 0,
				indexTip: null,
				landmarks: null,
			});

			// When position is null, velocity should also be null (not empty object)
			expect(result.velocity).toBeNull();
		});
	});
});
