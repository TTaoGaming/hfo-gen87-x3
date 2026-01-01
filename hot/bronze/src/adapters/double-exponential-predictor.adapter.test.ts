/**
 * Double Exponential Predictor Tests (LaViola DESP)
 *
 * Gen87.X3 | TDD RED → GREEN | Proves prediction capability
 *
 * SOURCE: LaViola (2003) "Double Exponential Smoothing: An Alternative
 * to Kalman Filter-Based Predictive Tracking"
 *
 * KEY TEST: Unlike 1€ filter, DESP MUST provide prediction.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
	DoubleExponentialPredictor,
	createDoubleExponentialPredictor,
	createResponsivePredictor,
	createSmoothPredictor,
} from './double-exponential-predictor.adapter.js';
import type { SensorFrame } from '../contracts/schemas.js';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createSensorFrame(
	x: number,
	y: number,
	ts: number,
	partial: Partial<SensorFrame> = {},
): SensorFrame {
	return {
		ts,
		handId: 'right',
		trackingOk: true,
		palmFacing: false,
		label: 'Open_Palm',
		confidence: 0.9,
		indexTip: { x, y, z: 0, visibility: 1 },
		landmarks: null,
		...partial,
	};
}

// ============================================================================
// UNIT TESTS
// ============================================================================

describe('DoubleExponentialPredictor (LaViola DESP)', () => {
	let predictor: DoubleExponentialPredictor;

	beforeEach(() => {
		predictor = new DoubleExponentialPredictor({ alpha: 0.5, predictionMs: 50 });
	});

	describe('Construction', () => {
		it('creates with default config', () => {
			const p = new DoubleExponentialPredictor();
			const state = p.getState();
			expect(state.config.alpha).toBe(0.5);
			expect(state.config.predictionMs).toBe(50);
		});

		it('creates with custom config', () => {
			const p = new DoubleExponentialPredictor({ alpha: 0.7, predictionMs: 100 });
			const state = p.getState();
			expect(state.config.alpha).toBe(0.7);
			expect(state.config.predictionMs).toBe(100);
		});

		it('throws on invalid alpha <= 0', () => {
			expect(() => new DoubleExponentialPredictor({ alpha: 0 })).toThrow();
		});

		it('throws on invalid alpha >= 1', () => {
			expect(() => new DoubleExponentialPredictor({ alpha: 1 })).toThrow();
		});
	});

	describe('Smoothing Behavior', () => {
		it('returns smoothed position after multiple frames', () => {
			// Process several frames
			predictor.smooth(createSensorFrame(0.5, 0.5, 0));
			predictor.smooth(createSensorFrame(0.6, 0.5, 16));
			const result = predictor.smooth(createSensorFrame(0.7, 0.5, 32));

			// Smoothed position should lag behind raw input
			expect(result.position).not.toBeNull();
			expect(result.position!.x).toBeLessThan(0.7);
			expect(result.position!.x).toBeGreaterThan(0.5);
		});

		it('passthrough when no indexTip', () => {
			const frame = createSensorFrame(0.5, 0.5, 0);
			frame.indexTip = null;

			const result = predictor.smooth(frame);
			expect(result.position).toBeNull();
			expect(result.velocity).toBeNull();
			expect(result.prediction).toBeNull();
		});

		it('initializes on first frame', () => {
			const result = predictor.smooth(createSensorFrame(0.3, 0.7, 0));

			expect(result.position).toEqual({ x: 0.3, y: 0.7 });
			expect(result.prediction).toEqual({ x: 0.3, y: 0.7 }); // No motion yet
		});
	});

	describe('PREDICTION (Key Differentiator from 1€)', () => {
		it('MUST predict ahead in direction of motion', () => {
			// Move right consistently
			predictor.smooth(createSensorFrame(0.3, 0.5, 0));
			predictor.smooth(createSensorFrame(0.4, 0.5, 16));
			predictor.smooth(createSensorFrame(0.5, 0.5, 32));
			const result = predictor.smooth(createSensorFrame(0.6, 0.5, 48));

			// Prediction MUST be ahead of smoothed position
			expect(result.prediction).not.toBeNull();
			expect(result.position).not.toBeNull();
			expect(result.prediction!.x).toBeGreaterThan(result.position!.x);
		});

		it('predicts further with longer predictionMs', () => {
			const shortPredictor = createDoubleExponentialPredictor(0.5, 30);
			const longPredictor = createDoubleExponentialPredictor(0.5, 100);

			// Same motion sequence
			for (let i = 0; i < 5; i++) {
				shortPredictor.smooth(createSensorFrame(0.3 + i * 0.1, 0.5, i * 16));
				longPredictor.smooth(createSensorFrame(0.3 + i * 0.1, 0.5, i * 16));
			}

			const shortResult = shortPredictor.smooth(createSensorFrame(0.8, 0.5, 80));
			const longResult = longPredictor.smooth(createSensorFrame(0.8, 0.5, 80));

			// Longer prediction should be further ahead
			expect(longResult.prediction!.x).toBeGreaterThan(shortResult.prediction!.x);
		});

		it('clamps prediction to [0,1] by default', () => {
			// Move toward edge
			for (let i = 0; i < 10; i++) {
				predictor.smooth(createSensorFrame(0.7 + i * 0.05, 0.5, i * 16));
			}

			const result = predictor.smooth(createSensorFrame(0.99, 0.5, 160));
			expect(result.prediction!.x).toBeLessThanOrEqual(1);
		});
	});

	describe('Velocity Estimation', () => {
		it('estimates positive velocity when moving right', () => {
			predictor.smooth(createSensorFrame(0.3, 0.5, 0));
			predictor.smooth(createSensorFrame(0.4, 0.5, 16));
			const result = predictor.smooth(createSensorFrame(0.5, 0.5, 32));

			expect(result.velocity).not.toBeNull();
			expect(result.velocity!.x).toBeGreaterThan(0);
		});

		it('estimates negative velocity when moving left', () => {
			predictor.smooth(createSensorFrame(0.7, 0.5, 0));
			predictor.smooth(createSensorFrame(0.6, 0.5, 16));
			const result = predictor.smooth(createSensorFrame(0.5, 0.5, 32));

			expect(result.velocity).not.toBeNull();
			expect(result.velocity!.x).toBeLessThan(0);
		});
	});

	describe('Time-to-Impact (TTI)', () => {
		beforeEach(() => {
			// Establish motion toward right
			predictor.smooth(createSensorFrame(0.3, 0.5, 0));
			predictor.smooth(createSensorFrame(0.4, 0.5, 16));
			predictor.smooth(createSensorFrame(0.5, 0.5, 32));
		});

		it('calculates TTI for target ahead', () => {
			const tti = predictor.calculateTTI(0.8, 0.5);
			expect(tti).toBeGreaterThan(0);
			expect(tti).toBeLessThan(5000); // Within 5 seconds
		});

		it('returns 0 when already at target', () => {
			const state = predictor.getState();
			const posX = 2 * state.Sp.x - state.Spp.x;
			const posY = 2 * state.Sp.y - state.Spp.y;

			const tti = predictor.calculateTTI(posX, posY);
			expect(tti).toBe(0);
		});

		it('returns Infinity when moving away from target', () => {
			// Target is behind us (we're moving right, target is left)
			const tti = predictor.calculateTTI(0.1, 0.5);
			expect(tti).toBe(Number.POSITIVE_INFINITY);
		});
	});

	describe('Predicted Trajectory', () => {
		beforeEach(() => {
			// Establish motion
			predictor.smooth(createSensorFrame(0.3, 0.5, 0));
			predictor.smooth(createSensorFrame(0.4, 0.5, 16));
			predictor.smooth(createSensorFrame(0.5, 0.5, 32));
		});

		it('returns trajectory points', () => {
			const trajectory = predictor.getPredictedTrajectory(100, 5);

			expect(trajectory).toHaveLength(6); // 0-5 inclusive
			expect(trajectory[0].t).toBe(0);
			expect(trajectory[5].t).toBe(100);
		});

		it('trajectory extends in direction of motion', () => {
			const trajectory = predictor.getPredictedTrajectory(100, 3);

			// X should increase over time (moving right)
			for (let i = 1; i < trajectory.length; i++) {
				expect(trajectory[i].x).toBeGreaterThanOrEqual(trajectory[i - 1].x);
			}
		});
	});

	describe('reset()', () => {
		it('resets to initial state', () => {
			// Disturb state
			predictor.smooth(createSensorFrame(0.9, 0.1, 0));
			predictor.smooth(createSensorFrame(0.8, 0.2, 16));

			predictor.reset();
			const state = predictor.getState();

			expect(state.Sp).toEqual({ x: 0.5, y: 0.5 });
			expect(state.Spp).toEqual({ x: 0.5, y: 0.5 });
			expect(state.velocity).toEqual({ x: 0, y: 0 });
		});
	});

	describe('setParams() Compatibility', () => {
		it('maps 1€ params to DESP params', () => {
			predictor.setParams(5, 0.5);
			const state = predictor.getState();

			// mincutoff 5 → predictionMs 60
			expect(state.config.predictionMs).toBe(60);
			// beta 0.5 → alpha 0.5
			expect(state.config.alpha).toBe(0.5);
		});
	});
});

// ============================================================================
// FACTORY TESTS
// ============================================================================

describe('Factory Functions', () => {
	it('createDoubleExponentialPredictor() creates with params', () => {
		const p = createDoubleExponentialPredictor(0.6, 75);
		const state = p.getState();
		expect(state.config.alpha).toBe(0.6);
		expect(state.config.predictionMs).toBe(75);
	});

	it('createResponsivePredictor() is high-alpha, short-prediction', () => {
		const p = createResponsivePredictor();
		const state = p.getState();
		expect(state.config.alpha).toBe(0.7);
		expect(state.config.predictionMs).toBe(33);
	});

	it('createSmoothPredictor() is low-alpha, long-prediction', () => {
		const p = createSmoothPredictor();
		const state = p.getState();
		expect(state.config.alpha).toBe(0.3);
		expect(state.config.predictionMs).toBe(100);
	});
});

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe('Property-Based Tests', () => {
	it('PROPERTY: Any valid config creates functional predictor', () => {
		fc.assert(
			fc.property(
				fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
				fc.integer({ min: 10, max: 200 }),
				(alpha, predictionMs) => {
					const p = new DoubleExponentialPredictor({ alpha, predictionMs });
					const frame = createSensorFrame(0.5, 0.5, 0);
					const result = p.smooth(frame);

					expect(result.ts).toBe(0);
					expect(result.handId).toBe('right');
				},
			),
			{ numRuns: 100 },
		);
	});

	it('PROPERTY: Smoothed position always in [0,1]', () => {
		fc.assert(
			fc.property(
				fc.array(fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), {
					minLength: 3,
					maxLength: 20,
				}),
				(xValues) => {
					const p = new DoubleExponentialPredictor();

					for (let i = 0; i < xValues.length; i++) {
						const result = p.smooth(createSensorFrame(xValues[i], 0.5, i * 16));

						if (result.position) {
							expect(result.position.x).toBeGreaterThanOrEqual(0);
							expect(result.position.x).toBeLessThanOrEqual(1);
						}

						if (result.prediction) {
							expect(result.prediction.x).toBeGreaterThanOrEqual(0);
							expect(result.prediction.x).toBeLessThanOrEqual(1);
						}
					}
				},
			),
			{ numRuns: 100 },
		);
	});

	it('PROPERTY: Higher alpha = faster convergence to target', () => {
		fc.assert(
			fc.property(fc.float({ min: Math.fround(0.2), max: Math.fround(0.6), noNaN: true }), (baseAlpha) => {
				const lowAlpha = new DoubleExponentialPredictor({ alpha: baseAlpha * 0.5 });
				const highAlpha = new DoubleExponentialPredictor({ alpha: Math.min(0.9, baseAlpha * 1.5) });

				// Jump from 0.5 to 0.8
				lowAlpha.smooth(createSensorFrame(0.5, 0.5, 0));
				highAlpha.smooth(createSensorFrame(0.5, 0.5, 0));

				const lowResult = lowAlpha.smooth(createSensorFrame(0.8, 0.5, 16));
				const highResult = highAlpha.smooth(createSensorFrame(0.8, 0.5, 16));

				// Higher alpha should be closer to target
				expect(Math.abs(highResult.position!.x - 0.8)).toBeLessThanOrEqual(
					Math.abs(lowResult.position!.x - 0.8) + 0.001, // Tolerance for float
				);
			}),
			{ numRuns: 100 },
		);
	});
});

// ============================================================================
// SmootherPort INTERFACE COMPLIANCE
// ============================================================================

describe('SmootherPort Interface Compliance', () => {
	it('implements smooth() method', () => {
		const p = new DoubleExponentialPredictor();
		expect(typeof p.smooth).toBe('function');

		const result = p.smooth(createSensorFrame(0.5, 0.5, 0));
		expect(result).toHaveProperty('ts');
		expect(result).toHaveProperty('position');
		expect(result).toHaveProperty('velocity');
		expect(result).toHaveProperty('prediction');
	});

	it('implements reset() method', () => {
		const p = new DoubleExponentialPredictor();
		expect(typeof p.reset).toBe('function');

		p.smooth(createSensorFrame(0.9, 0.1, 0));
		p.reset();

		// Should not throw
		const result = p.smooth(createSensorFrame(0.5, 0.5, 0));
		expect(result.position).toEqual({ x: 0.5, y: 0.5 });
	});

	it('implements setParams() method', () => {
		const p = new DoubleExponentialPredictor();
		expect(typeof p.setParams).toBe('function');

		p.setParams(3, 0.7);
		// Should not throw
	});
});
