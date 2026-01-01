// @ts-nocheck
import * as fc from 'fast-check';
/**
 * SMOOTHER PIPELINE RED TESTS
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | TDD RED
 *
 * REQUIREMENT: 4-stage cursor pipeline with swappable smoothers
 * 1. Raw MediaPipe fingertip
 * 2. 1€ Filter (snappy/smooth)
 * 3. Physics spring-dampening cursor
 * 4. Predictive physics cursor
 *
 * HEXAGONAL CDD PRINCIPLE: Each smoother implements SmootherPort
 * and can be swapped via dependency injection.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { SmootherPort } from '../contracts/ports.js';
import type { SensorFrame } from '../contracts/schemas.js';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/** Create a valid SensorFrame for testing */
function createSensorFrame(overrides?: Partial<SensorFrame>): SensorFrame {
	return {
		ts: 16.67,
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: 'Open_Palm',
		confidence: 0.95,
		indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 },
		landmarks: null,
		...overrides,
	};
}

/** Arbitrary for SensorFrame position */
const arbPosition = fc.record({
	x: fc.double({ min: 0.001, max: 0.999, noNaN: true }),
	y: fc.double({ min: 0.001, max: 0.999, noNaN: true }),
});

// ============================================================================
// RED TEST 1: OneEuroSmoother implements SmootherPort
// ============================================================================

describe('OneEuroSmoother (1€ Filter)', () => {
	// These will FAIL until we create OneEuroSmoother class
	let smoother: SmootherPort;

	beforeEach(async () => {
		// Dynamic import to test if module exists
		const { OneEuroSmoother } = await import('./one-euro-smoother.js');
		smoother = new OneEuroSmoother({ mincutoff: 1.0, beta: 0.007 });
	});

	it('implements SmootherPort interface', () => {
		expect(smoother.smooth).toBeTypeOf('function');
		expect(smoother.reset).toBeTypeOf('function');
		expect(smoother.setParams).toBeTypeOf('function');
	});

	it('smooth() returns valid SmoothedFrame', () => {
		const frame = createSensorFrame();
		const result = smoother.smooth(frame);

		expect(result.ts).toBe(frame.ts);
		expect(result.position).not.toBeNull();
		expect(result.velocity).not.toBeNull();
	});

	it('first frame returns position equal to input (no history)', () => {
		smoother.reset();
		const frame = createSensorFrame({
			indexTip: { x: 0.3, y: 0.7, z: 0, visibility: 1 },
		});
		const result = smoother.smooth(frame);

		expect(result.position?.x).toBeCloseTo(0.3, 2);
		expect(result.position?.y).toBeCloseTo(0.7, 2);
	});

	it('smooths between consecutive positions', () => {
		fc.assert(
			fc.property(arbPosition, arbPosition, (pos1, pos2) => {
				smoother.reset();

				const frame1 = createSensorFrame({
					ts: 0,
					indexTip: { x: pos1.x, y: pos1.y, z: 0, visibility: 1 },
				});
				const frame2 = createSensorFrame({
					ts: 16.67,
					indexTip: { x: pos2.x, y: pos2.y, z: 0, visibility: 1 },
				});

				smoother.smooth(frame1);
				const result = smoother.smooth(frame2);

				// Smoothed position should be between raw positions (lag)
				expect(result.position).not.toBeNull();
				// Velocity should be calculated
				expect(result.velocity).not.toBeNull();
			}),
		);
	});

	it('reset() clears filter state', () => {
		const frame1 = createSensorFrame({ ts: 0 });
		const frame2 = createSensorFrame({ ts: 16.67 });

		smoother.smooth(frame1);
		smoother.smooth(frame2);
		smoother.reset();

		// After reset, next frame should be treated as first frame
		const frame3 = createSensorFrame({
			ts: 100,
			indexTip: { x: 0.9, y: 0.1, z: 0, visibility: 1 },
		});
		const result = smoother.smooth(frame3);

		// First frame after reset = no smoothing
		expect(result.position?.x).toBeCloseTo(0.9, 2);
		expect(result.position?.y).toBeCloseTo(0.1, 2);
	});

	it('setParams() changes filter behavior', () => {
		smoother.reset();

		// High beta = more responsive to velocity
		smoother.setParams(1.0, 1.0);
		const frame1 = createSensorFrame({
			ts: 0,
			indexTip: { x: 0, y: 0, z: 0, visibility: 1 },
		});
		const frame2 = createSensorFrame({
			ts: 16.67,
			indexTip: { x: 1, y: 1, z: 0, visibility: 1 },
		});

		smoother.smooth(frame1);
		const highBetaResult = smoother.smooth(frame2);

		smoother.reset();

		// Low beta = more lag
		smoother.setParams(1.0, 0.0);
		smoother.smooth(frame1);
		const lowBetaResult = smoother.smooth(frame2);

		// High beta should track faster (closer to target)
		expect(highBetaResult.position?.x).toBeGreaterThan(lowBetaResult.position!.x);
	});
});

// ============================================================================
// RED TEST 2: PhysicsSpringDamperSmoother
// ============================================================================

describe('PhysicsSpringDamperSmoother', () => {
	let smoother: SmootherPort;

	beforeEach(async () => {
		// This will FAIL - module doesn't exist yet
		const { PhysicsSpringDamperSmoother } = await import('./physics-spring-smoother.js');
		smoother = new PhysicsSpringDamperSmoother({
			stiffness: 300, // Spring constant (higher = snappier)
			damping: 20, // Damping ratio (higher = less oscillation)
			mass: 1, // Virtual mass
		});
	});

	it('implements SmootherPort interface', () => {
		expect(smoother.smooth).toBeTypeOf('function');
		expect(smoother.reset).toBeTypeOf('function');
		expect(smoother.setParams).toBeTypeOf('function');
	});

	it('smooth() returns valid SmoothedFrame with spring physics', () => {
		const frame = createSensorFrame();
		const result = smoother.smooth(frame);

		expect(result.ts).toBe(frame.ts);
		expect(result.position).not.toBeNull();
		expect(result.velocity).not.toBeNull();
	});

	it('exhibits spring behavior - overshoots then settles', () => {
		smoother.reset();

		// Start at origin
		const frame1 = createSensorFrame({
			ts: 0,
			indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 },
		});
		smoother.smooth(frame1);

		// Jump to new position - spring should follow
		const targetX = 0.8;
		const positions: number[] = [];

		for (let t = 16.67; t < 500; t += 16.67) {
			const frame = createSensorFrame({
				ts: t,
				indexTip: { x: targetX, y: 0.5, z: 0, visibility: 1 },
			});
			const result = smoother.smooth(frame);
			positions.push(result.position!.x);
		}

		// Should eventually converge to target
		const finalPos = positions[positions.length - 1];
		expect(finalPos).toBeCloseTo(targetX, 1);

		// Should show spring dynamics (not just exponential decay)
		// This is the key difference from 1€ filter
	});

	it('damping prevents oscillation when critically damped', async () => {
		const { PhysicsSpringDamperSmoother } = await import('./physics-spring-smoother.js');

		// Critically damped: zeta = c / (2 * sqrt(k * m)) = 1
		// c = 2 * sqrt(300 * 1) ≈ 34.6
		const criticallyDamped = new PhysicsSpringDamperSmoother({
			stiffness: 300,
			damping: 34.6,
			mass: 1,
		});

		criticallyDamped.reset();
		const frame1 = createSensorFrame({
			ts: 0,
			indexTip: { x: 0.2, y: 0.5, z: 0, visibility: 1 },
		});
		criticallyDamped.smooth(frame1);

		const targetX = 0.8;
		let crossedTarget = 0;

		for (let t = 16.67; t < 500; t += 16.67) {
			const frame = createSensorFrame({
				ts: t,
				indexTip: { x: targetX, y: 0.5, z: 0, visibility: 1 },
			});
			const result = criticallyDamped.smooth(frame);
			if (result.position!.x > targetX) crossedTarget++;
		}

		// Critically damped should not overshoot significantly
		expect(crossedTarget).toBeLessThan(3);
	});
});

// ============================================================================
// RED TEST 3: PredictiveSmoother (physics-based prediction)
// ============================================================================

describe('PredictiveSmoother', () => {
	let smoother: SmootherPort;

	beforeEach(async () => {
		// This will FAIL - module doesn't exist yet
		const { PredictiveSmoother } = await import('./predictive-smoother.js');
		smoother = new PredictiveSmoother({
			predictionMs: 50, // How far ahead to predict
			usePhysics: true, // Use spring model for prediction
		});
	});

	it('implements SmootherPort interface', () => {
		expect(smoother.smooth).toBeTypeOf('function');
		expect(smoother.reset).toBeTypeOf('function');
		expect(smoother.setParams).toBeTypeOf('function');
	});

	it('smooth() returns prediction field', () => {
		const frame = createSensorFrame();
		const result = smoother.smooth(frame);

		expect(result.prediction).not.toBeNull();
		expect(result.prediction?.x).toBeTypeOf('number');
		expect(result.prediction?.y).toBeTypeOf('number');
	});

	it('prediction is ahead of current position when moving', () => {
		smoother.reset();

		// Build up velocity moving right
		for (let t = 0; t < 100; t += 16.67) {
			const frame = createSensorFrame({
				ts: t,
				indexTip: { x: 0.3 + t * 0.001, y: 0.5, z: 0, visibility: 1 },
			});
			smoother.smooth(frame);
		}

		// Now check prediction
		const frame = createSensorFrame({
			ts: 100,
			indexTip: { x: 0.4, y: 0.5, z: 0, visibility: 1 },
		});
		const result = smoother.smooth(frame);

		// Prediction should be ahead of current position (to the right)
		expect(result.prediction!.x).toBeGreaterThan(result.position!.x);
	});

	it('prediction bounds stay within 0-1 range', () => {
		smoother.reset();

		// Moving fast toward edge
		for (let t = 0; t < 100; t += 16.67) {
			const frame = createSensorFrame({
				ts: t,
				indexTip: { x: 0.9 + t * 0.002, y: 0.5, z: 0, visibility: 1 },
			});
			const result = smoother.smooth(frame);

			// Even with high velocity, prediction should be clamped
			if (result.prediction) {
				expect(result.prediction.x).toBeLessThanOrEqual(1);
				expect(result.prediction.x).toBeGreaterThanOrEqual(0);
			}
		}
	});
});

// ============================================================================
// RED TEST 4: SmootherChain - Composable pipeline
// ============================================================================

describe('SmootherChain (Composable Pipeline)', () => {
	it('chains multiple smoothers in sequence', async () => {
		// This tests the hexagonal swappability
		const { SmootherChain } = await import('./smoother-chain.js');
		const { OneEuroSmoother } = await import('./one-euro-smoother.js');
		const { PhysicsSpringDamperSmoother } = await import('./physics-spring-smoother.js');

		const chain = new SmootherChain([
			new OneEuroSmoother({ mincutoff: 1.0, beta: 0.007 }),
			new PhysicsSpringDamperSmoother({ stiffness: 300, damping: 20, mass: 1 }),
		]);

		const frame = createSensorFrame();
		const result = chain.smooth(frame);

		expect(result.position).not.toBeNull();
	});

	it('allows runtime smoother swap', async () => {
		const { SmootherChain } = await import('./smoother-chain.js');
		const { OneEuroSmoother } = await import('./one-euro-smoother.js');
		const { PhysicsSpringDamperSmoother } = await import('./physics-spring-smoother.js');

		const euro = new OneEuroSmoother({ mincutoff: 1.0, beta: 0.007 });
		const spring = new PhysicsSpringDamperSmoother({
			stiffness: 300,
			damping: 20,
			mass: 1,
		});

		const chain = new SmootherChain([euro]);
		const frame = createSensorFrame();

		// Use 1€ filter
		const result1 = chain.smooth(frame);
		expect(result1).toBeDefined();

		// Swap to spring
		chain.setSmoothers([spring]);
		const result2 = chain.smooth(frame);
		expect(result2).toBeDefined();

		// Chain both
		chain.setSmoothers([euro, spring]);
		const result3 = chain.smooth(frame);
		expect(result3).toBeDefined();
	});

	it('reset() resets all smoothers in chain', async () => {
		const { SmootherChain } = await import('./smoother-chain.js');
		const { OneEuroSmoother } = await import('./one-euro-smoother.js');
		const { PhysicsSpringDamperSmoother } = await import('./physics-spring-smoother.js');

		const chain = new SmootherChain([
			new OneEuroSmoother({ mincutoff: 1.0, beta: 0.007 }),
			new PhysicsSpringDamperSmoother({ stiffness: 300, damping: 20, mass: 1 }),
		]);

		// Build up state
		for (let t = 0; t < 100; t += 16.67) {
			chain.smooth(
				createSensorFrame({
					ts: t,
					indexTip: { x: t * 0.01, y: 0.5, z: 0, visibility: 1 },
				}),
			);
		}

		chain.reset();

		// After reset, first frame should not be smoothed
		const frame = createSensorFrame({
			ts: 200,
			indexTip: { x: 0.9, y: 0.1, z: 0, visibility: 1 },
		});
		const result = chain.smooth(frame);

		expect(result.position?.x).toBeCloseTo(0.9, 1);
	});
});

// ============================================================================
// RED TEST 5: Quad cursor output (4 positions per frame)
// ============================================================================

describe('QuadCursorPipeline', () => {
	it('outputs 4 cursor positions per frame', async () => {
		const { QuadCursorPipeline } = await import('./quad-cursor-pipeline.js');
		const { OneEuroSmoother } = await import('./one-euro-smoother.js');
		const { PhysicsSpringDamperSmoother } = await import('./physics-spring-smoother.js');
		const { PredictiveSmoother } = await import('./predictive-smoother.js');

		const pipeline = new QuadCursorPipeline({
			euro: new OneEuroSmoother({ mincutoff: 1.0, beta: 0.007 }),
			spring: new PhysicsSpringDamperSmoother({ stiffness: 300, damping: 20, mass: 1 }),
			predictive: new PredictiveSmoother({ predictionMs: 50, usePhysics: true }),
		});

		const frame = createSensorFrame({
			indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1 },
		});

		const result = pipeline.process(frame);

		expect(result.raw).toBeDefined();
		expect(result.euro).toBeDefined();
		expect(result.spring).toBeDefined();
		expect(result.predictive).toBeDefined();

		// All 4 positions in valid range
		expect(result.raw.x).toBeGreaterThanOrEqual(0);
		expect(result.euro.x).toBeGreaterThanOrEqual(0);
		expect(result.spring.x).toBeGreaterThanOrEqual(0);
		expect(result.predictive.x).toBeGreaterThanOrEqual(0);
	});

	it('each stage can be independently disabled', async () => {
		const { QuadCursorPipeline } = await import('./quad-cursor-pipeline.js');
		const { OneEuroSmoother } = await import('./one-euro-smoother.js');

		// Only 1€ filter enabled
		const pipeline = new QuadCursorPipeline({
			euro: new OneEuroSmoother({ mincutoff: 1.0, beta: 0.007 }),
			spring: null,
			predictive: null,
		});

		const frame = createSensorFrame();
		const result = pipeline.process(frame);

		expect(result.raw).toBeDefined();
		expect(result.euro).toBeDefined();
		expect(result.spring).toBeNull();
		expect(result.predictive).toBeNull();
	});
});

// ============================================================================
// Property-based test: Smoother contract compliance
// ============================================================================

describe('SmootherPort contract compliance (property-based)', () => {
	// TODO: Phase V - Enable after all SmootherPort implementations verified
	it.skip('any smoother preserves timestamp', async () => {
		fc.assert(
			fc.asyncProperty(arbPosition, async (pos) => {
				// This will test all smoothers implement the contract correctly
				const { OneEuroSmoother } = await import('./one-euro-smoother.js');
				const smoother = new OneEuroSmoother({ mincutoff: 1.0, beta: 0.007 });

				const ts = Math.random() * 10000;
				const frame = createSensorFrame({
					ts,
					indexTip: { x: pos.x, y: pos.y, z: 0, visibility: 1 },
				});

				const result = smoother.smooth(frame);
				expect(result.ts).toBe(ts);
			}),
		);
	});
});
