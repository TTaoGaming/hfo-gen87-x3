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
});
