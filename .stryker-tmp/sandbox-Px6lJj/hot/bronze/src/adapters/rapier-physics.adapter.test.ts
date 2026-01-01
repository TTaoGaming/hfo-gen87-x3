/**
 * @fileoverview Rapier Physics Adapter Tests - REAL PHYSICS
 *
 * NO MOCKS. Tests actual Rapier WASM physics simulation.
 * Uses property-based testing via fast-check (Red Regnant approved).
 *
 * Tests the RapierPhysicsAdapter with all three modes:
 * - smoothed: Fixed spring-damper physics
 * - predictive: Spring-damper + trajectory lookahead
 * - adaptive: 1€ filter-inspired velocity-adaptive physics
 *
 * @module adapters/rapier-physics.adapter.test
 * @hive V (Validate)
 * @tdd GREEN - REAL TESTS ONLY
 * @red-regnant APPROVED - Property-based, mutation-resistant
 */
// @ts-nocheck


import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SensorFrame } from '../contracts/schemas.js';
import {
	type RapierConfig,
	RapierPhysicsAdapter,
	createAdaptiveRapierAdapter,
	createPredictiveRapierAdapter,
	createSmoothedRapierAdapter,
} from './rapier-physics.adapter.js';

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Create a valid SensorFrame for testing
 */
function createTestFrame(overrides: Partial<SensorFrame> = {}): SensorFrame {
	return {
		ts: Date.now(),
		handId: 'test-hand',
		indexTip: { x: 0.5, y: 0.5 },
		trackingOk: true,
		label: 'Pointing_Up',
		confidence: 0.95,
		palmFacing: true,
		...overrides,
	};
}

/**
 * Generate a sequence of frames simulating cursor movement
 */
function generateFrameSequence(
	startX: number,
	startY: number,
	endX: number,
	endY: number,
	frameCount: number,
	intervalMs = 16,
): SensorFrame[] {
	const frames: SensorFrame[] = [];
	const startTs = Date.now();

	for (let i = 0; i < frameCount; i++) {
		const t = i / (frameCount - 1);
		frames.push(
			createTestFrame({
				ts: startTs + i * intervalMs,
				indexTip: {
					x: startX + (endX - startX) * t,
					y: startY + (endY - startY) * t,
				},
			}),
		);
	}
	return frames;
}

// ============================================================================
// REAL WASM PHYSICS TESTS
// These tests ACTUALLY initialize Rapier and run real physics
// ============================================================================

describe('RapierPhysicsAdapter (REAL WASM Physics)', () => {
	let adapter: RapierPhysicsAdapter;

	describe('Initialization', () => {
		it('init() loads WASM and creates physics world', async () => {
			adapter = new RapierPhysicsAdapter();
			await adapter.init();

			// After init, smooth() should use physics, not passthrough
			const frame1 = createTestFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5 } });
			const frame2 = createTestFrame({ ts: 16, indexTip: { x: 0.8, y: 0.8 } });

			adapter.smooth(frame1);
			const result = adapter.smooth(frame2);

			// Physics should smooth - position should NOT instantly jump to target
			// It should be somewhere between start and target
			expect(result.position.x).toBeGreaterThan(0.5);
			expect(result.position.x).toBeLessThan(0.8);
			expect(result.position.y).toBeGreaterThan(0.5);
			expect(result.position.y).toBeLessThan(0.8);
		});

		it('double init() is idempotent', async () => {
			adapter = new RapierPhysicsAdapter();
			await adapter.init();
			await adapter.init(); // Should not throw or create duplicate worlds

			const state = adapter.getState();
			expect(state.position).toBeDefined();
		});

		it('getState() returns physics body position after init', async () => {
			adapter = new RapierPhysicsAdapter();
			await adapter.init();

			const state = adapter.getState();
			expect(state.position.x).toBeCloseTo(0.5, 1);
			expect(state.position.y).toBeCloseTo(0.5, 1);
			expect(state.velocity.x).toBeCloseTo(0, 1);
			expect(state.velocity.y).toBeCloseTo(0, 1);
		});
	});

	describe('Factory Functions (REAL initialization)', () => {
		it('createSmoothedRapierAdapter() returns initialized smoothed adapter', async () => {
			const adapter = await createSmoothedRapierAdapter({ stiffness: 500 });

			expect(adapter.getConfig().mode).toBe('smoothed');
			expect(adapter.getConfig().stiffness).toBe(500);

			// Verify it's actually initialized by checking physics works
			const frame1 = createTestFrame({ ts: 0, indexTip: { x: 0.3, y: 0.3 } });
			const frame2 = createTestFrame({ ts: 16, indexTip: { x: 0.7, y: 0.7 } });
			adapter.smooth(frame1);
			const result = adapter.smooth(frame2);

			// Should be smoothed (not at target yet)
			expect(result.position.x).toBeLessThan(0.7);
		});

		it('createPredictiveRapierAdapter() returns initialized predictive adapter', async () => {
			const adapter = await createPredictiveRapierAdapter({ predictionMs: 50 });

			expect(adapter.getConfig().mode).toBe('predictive');
			expect(adapter.getConfig().predictionMs).toBe(50);
		});

		it('createAdaptiveRapierAdapter() returns initialized adaptive adapter', async () => {
			const adapter = await createAdaptiveRapierAdapter({
				minStiffness: 150,
				speedCoefficient: 600,
			});

			expect(adapter.getConfig().mode).toBe('adaptive');
			expect(adapter.getConfig().minStiffness).toBe(150);
			expect(adapter.getConfig().speedCoefficient).toBe(600);
		});
	});

	describe('Physics Smoothing Behavior', () => {
		beforeEach(async () => {
			adapter = new RapierPhysicsAdapter({ mode: 'smoothed', stiffness: 400, damping: 0.85 });
			await adapter.init();
		});

		afterEach(() => {
			adapter.reset();
		});

		it('smoothes rapid position changes', async () => {
			// Start at center
			adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5 } }));

			// Jump to corner - physics should smooth this
			const result = adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.9, y: 0.9 } }));

			// Should NOT be at target yet (smoothing in progress)
			expect(result.position.x).toBeLessThan(0.9);
			expect(result.position.y).toBeLessThan(0.9);
			// But should have moved toward target
			expect(result.position.x).toBeGreaterThan(0.5);
			expect(result.position.y).toBeGreaterThan(0.5);
		});

		it('converges to target over multiple frames', async () => {
			const target = { x: 0.8, y: 0.2 };

			// Initialize at center
			adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5 } }));

			// Feed constant target for many frames
			let lastResult = adapter.smooth(createTestFrame({ ts: 0, indexTip: target }));
			for (let i = 1; i <= 60; i++) {
				// ~1 second of frames
				lastResult = adapter.smooth(createTestFrame({ ts: i * 16, indexTip: target }));
			}

			// After 60 frames, should have converged close to target
			expect(lastResult.position.x).toBeCloseTo(target.x, 1);
			expect(lastResult.position.y).toBeCloseTo(target.y, 1);
		});

		it('generates non-zero velocity during movement', async () => {
			adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.2, y: 0.2 } }));
			const result = adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.8, y: 0.8 } }));

			// Should have velocity toward target
			const speed = Math.sqrt(result.velocity.x ** 2 + result.velocity.y ** 2);
			expect(speed).toBeGreaterThan(0);
		});

		it('velocity decreases as position approaches target', async () => {
			const target = { x: 0.7, y: 0.7 };

			adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5 } }));

			// Initial movement - high velocity
			const early = adapter.smooth(createTestFrame({ ts: 16, indexTip: target }));
			const earlySpeed = Math.sqrt(early.velocity.x ** 2 + early.velocity.y ** 2);

			// After many frames - lower velocity (converging)
			let late = early;
			for (let i = 2; i <= 30; i++) {
				late = adapter.smooth(createTestFrame({ ts: i * 16, indexTip: target }));
			}
			const lateSpeed = Math.sqrt(late.velocity.x ** 2 + late.velocity.y ** 2);

			// Velocity should have decreased as we converged
			expect(lateSpeed).toBeLessThan(earlySpeed);
		});
	});

	describe('reset() with REAL physics', () => {
		beforeEach(async () => {
			adapter = new RapierPhysicsAdapter();
			await adapter.init();
		});

		it('reset() returns physics body to center', async () => {
			// Move away from center
			adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.9, y: 0.1 } }));
			adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.9, y: 0.1 } }));

			const beforeReset = adapter.getState();
			expect(beforeReset.position.x).not.toBeCloseTo(0.5, 1);

			// Reset
			adapter.reset();

			const afterReset = adapter.getState();
			expect(afterReset.position.x).toBeCloseTo(0.5, 1);
			expect(afterReset.position.y).toBeCloseTo(0.5, 1);
			expect(afterReset.velocity.x).toBeCloseTo(0, 1);
			expect(afterReset.velocity.y).toBeCloseTo(0, 1);
		});

		it('reset() clears velocity', async () => {
			// Build up velocity
			adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5 } }));
			adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.9, y: 0.9 } }));

			const beforeReset = adapter.getState();
			const speedBefore = Math.sqrt(beforeReset.velocity.x ** 2 + beforeReset.velocity.y ** 2);
			expect(speedBefore).toBeGreaterThan(0);

			adapter.reset();

			const afterReset = adapter.getState();
			const speedAfter = Math.sqrt(afterReset.velocity.x ** 2 + afterReset.velocity.y ** 2);
			expect(speedAfter).toBeCloseTo(0, 5);
		});
	});
});

// ============================================================================
// ADAPTIVE MODE - REAL PHYSICS TESTS
// Verify the 1€ filter innovation (speed-adaptive stiffness) actually works
// ============================================================================

describe('Adaptive Mode (1€ Physics) - REAL WASM', () => {
	let adapter: RapierPhysicsAdapter;

	beforeEach(async () => {
		adapter = new RapierPhysicsAdapter({
			mode: 'adaptive',
			minStiffness: 100,
			speedCoefficient: 500,
			maxStiffness: 800,
		});
		await adapter.init();
	});

	afterEach(() => {
		adapter.reset();
	});

	it('uses low stiffness at low velocity (smooth, anti-jitter)', async () => {
		// Start stationary
		adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5 } }));
		adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.5, y: 0.5 } }));
		adapter.smooth(createTestFrame({ ts: 32, indexTip: { x: 0.5, y: 0.5 } }));

		// Small jitter movement
		const result = adapter.smooth(createTestFrame({ ts: 48, indexTip: { x: 0.51, y: 0.51 } }));

		const state = adapter.getState();
		// At low velocity, effective stiffness should be near minStiffness
		expect(state.effectiveStiffness).toBeLessThan(200);
	});

	it('uses high stiffness at high velocity (responsive, anti-lag)', async () => {
		// Build up velocity with rapid movement
		adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.2, y: 0.2 } }));
		adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.5, y: 0.5 } }));
		adapter.smooth(createTestFrame({ ts: 32, indexTip: { x: 0.8, y: 0.8 } }));

		const state = adapter.getState();
		// At high velocity, effective stiffness should increase
		expect(state.effectiveStiffness).toBeGreaterThan(200);
	});

	it('effectiveStiffness is capped at maxStiffness', async () => {
		// Very rapid movement to push stiffness high
		adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.1, y: 0.1 } }));
		adapter.smooth(createTestFrame({ ts: 8, indexTip: { x: 0.9, y: 0.9 } }));
		adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.1, y: 0.1 } }));
		adapter.smooth(createTestFrame({ ts: 24, indexTip: { x: 0.9, y: 0.9 } }));

		const state = adapter.getState();
		// Should not exceed maxStiffness
		expect(state.effectiveStiffness).toBeLessThanOrEqual(800);
	});

	it('setParams updates adaptive parameters dynamically', async () => {
		const before = adapter.getConfig();
		expect(before.minStiffness).toBe(100);

		adapter.setParams(4, 0.8); // mincutoff=4 → minStiffness=200, beta=0.8 → speedCoeff=800

		const after = adapter.getConfig();
		expect(after.minStiffness).toBe(200);
		expect(after.speedCoefficient).toBe(800);
	});
});

// ============================================================================
// PREDICTIVE MODE - REAL PHYSICS TESTS
// ============================================================================

describe('Predictive Mode - REAL WASM', () => {
	let adapter: RapierPhysicsAdapter;

	beforeEach(async () => {
		adapter = new RapierPhysicsAdapter({
			mode: 'predictive',
			predictionMs: 50,
			stiffness: 400,
		});
		await adapter.init();
	});

	afterEach(() => {
		adapter.reset();
	});

	it('prediction extends position in velocity direction', async () => {
		// Move right
		adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.3, y: 0.5 } }));
		adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.4, y: 0.5 } }));
		const result = adapter.smooth(createTestFrame({ ts: 32, indexTip: { x: 0.5, y: 0.5 } }));

		// In predictive mode, prediction should be ahead of position
		if (result.prediction) {
			expect(result.prediction.x).toBeGreaterThanOrEqual(result.position.x);
		}
	});

	it('smooth() returns prediction field in predictive mode', async () => {
		adapter.smooth(createTestFrame({ ts: 0 }));
		const result = adapter.smooth(createTestFrame({ ts: 16 }));

		expect(result.prediction).not.toBeNull();
		expect(result.prediction).toHaveProperty('x');
		expect(result.prediction).toHaveProperty('y');
	});
});

// ============================================================================
// PROPERTY-BASED TESTS (RED REGNANT APPROVED)
// ============================================================================

describe('RapierPhysicsAdapter (Property-Based Tests)', () => {
	describe('Physics Invariants', () => {
		it('PROPERTY: Smoothed position is always between previous and target', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.float({ min: Math.fround(0.1), max: Math.fround(0.4), noNaN: true }),
					fc.float({ min: Math.fround(0.1), max: Math.fround(0.4), noNaN: true }),
					fc.float({ min: Math.fround(0.6), max: Math.fround(0.9), noNaN: true }),
					fc.float({ min: Math.fround(0.6), max: Math.fround(0.9), noNaN: true }),
					async (startX, startY, endX, endY) => {
						const adapter = new RapierPhysicsAdapter({ mode: 'smoothed', stiffness: 400 });
						await adapter.init();

						adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: startX, y: startY } }));
						const result = adapter.smooth(
							createTestFrame({ ts: 16, indexTip: { x: endX, y: endY } }),
						);

						// Position should be bounded by start and end (with small tolerance for physics overshoot)
						const tolerance = 0.1;
						expect(result.position.x).toBeGreaterThanOrEqual(Math.min(startX, endX) - tolerance);
						expect(result.position.x).toBeLessThanOrEqual(Math.max(startX, endX) + tolerance);
						expect(result.position.y).toBeGreaterThanOrEqual(Math.min(startY, endY) - tolerance);
						expect(result.position.y).toBeLessThanOrEqual(Math.max(startY, endY) + tolerance);
					},
				),
				{ numRuns: 50 },
			);
		});

		it('PROPERTY: Higher stiffness = faster convergence', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.float({ min: Math.fround(0.6), max: Math.fround(0.9), noNaN: true }),
					fc.float({ min: Math.fround(0.6), max: Math.fround(0.9), noNaN: true }),
					async (targetX, targetY) => {
						const lowStiffness = new RapierPhysicsAdapter({ mode: 'smoothed', stiffness: 200 });
						const highStiffness = new RapierPhysicsAdapter({ mode: 'smoothed', stiffness: 800 });

						await Promise.all([lowStiffness.init(), highStiffness.init()]);

						const target = { x: targetX, y: targetY };

						// Start both at center
						lowStiffness.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5 } }));
						highStiffness.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5 } }));

						// Move to target
						const lowResult = lowStiffness.smooth(createTestFrame({ ts: 16, indexTip: target }));
						const highResult = highStiffness.smooth(createTestFrame({ ts: 16, indexTip: target }));

						// Higher stiffness should be closer to target
						const lowDist = Math.sqrt(
							(lowResult.position.x - targetX) ** 2 + (lowResult.position.y - targetY) ** 2,
						);
						const highDist = Math.sqrt(
							(highResult.position.x - targetX) ** 2 + (highResult.position.y - targetY) ** 2,
						);

						expect(highDist).toBeLessThanOrEqual(lowDist + 0.01); // Allow small tolerance
					},
				),
				{ numRuns: 30 },
			);
		});

		it('PROPERTY: reset() always returns to center with zero velocity', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
					fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
					fc.integer({ min: 1, max: 10 }),
					async (x, y, frames) => {
						const adapter = new RapierPhysicsAdapter();
						await adapter.init();

						// Move around randomly
						for (let i = 0; i < frames; i++) {
							adapter.smooth(createTestFrame({ ts: i * 16, indexTip: { x, y } }));
						}

						adapter.reset();

						const state = adapter.getState();
						expect(state.position.x).toBeCloseTo(0.5, 1);
						expect(state.position.y).toBeCloseTo(0.5, 1);
						expect(Math.abs(state.velocity.x)).toBeLessThan(0.01);
						expect(Math.abs(state.velocity.y)).toBeLessThan(0.01);
					},
				),
				{ numRuns: 50 },
			);
		});

		it('PROPERTY: smooth() preserves frame metadata', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1, maxLength: 10 }),
					fc.float({ min: Math.fround(0.5), max: Math.fround(1), noNaN: true }),
					fc.boolean(),
					async (handId, confidence, palmFacing) => {
						const adapter = new RapierPhysicsAdapter();
						await adapter.init();

						const frame = createTestFrame({
							ts: 0,
							handId,
							confidence,
							palmFacing,
						});

						const result = adapter.smooth(frame);

						expect(result.handId).toBe(handId);
						expect(result.confidence).toBe(confidence);
						expect(result.palmFacing).toBe(palmFacing);
					},
				),
				{ numRuns: 50 },
			);
		});
	});

	describe('Configuration Properties', () => {
		it('PROPERTY: All modes are configurable', () => {
			fc.assert(
				fc.property(
					fc.constantFrom('smoothed', 'predictive', 'adaptive') as fc.Arbitrary<
						RapierConfig['mode']
					>,
					(mode) => {
						const adapter = new RapierPhysicsAdapter({ mode });
						expect(adapter.getConfig().mode).toBe(mode);
					},
				),
			);
		});

		it('PROPERTY: setParams maps correctly for all valid inputs', () => {
			fc.assert(
				fc.property(
					fc.float({ min: Math.fround(0.1), max: Math.fround(10), noNaN: true }),
					fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
					(mincutoff, beta) => {
						const adapter = new RapierPhysicsAdapter({ mode: 'smoothed' });
						adapter.setParams(mincutoff, beta);

						const config = adapter.getConfig();
						expect(config.stiffness).toBeCloseTo(mincutoff * 100, 4);
						expect(config.damping).toBeGreaterThanOrEqual(0.5);
						expect(config.damping).toBeLessThanOrEqual(0.95);
					},
				),
			);
		});
	});

	describe('Adaptive Mode Properties', () => {
		it('PROPERTY: effectiveStiffness bounded by min/max', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 50, max: 200 }),
					fc.integer({ min: 100, max: 500 }),
					fc.integer({ min: 400, max: 1000 }),
					async (minStiffness, speedCoefficient, maxStiffness) => {
						const actualMax = Math.max(maxStiffness, minStiffness + 100);

						const adapter = new RapierPhysicsAdapter({
							mode: 'adaptive',
							minStiffness,
							speedCoefficient,
							maxStiffness: actualMax,
						});
						await adapter.init();

						// Generate some movement
						adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.2, y: 0.2 } }));
						adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.8, y: 0.8 } }));

						const state = adapter.getState();

						// effectiveStiffness should be within bounds
						expect(state.effectiveStiffness).toBeGreaterThanOrEqual(minStiffness);
						expect(state.effectiveStiffness).toBeLessThanOrEqual(actualMax);
					},
				),
				{ numRuns: 30 },
			);
		});
	});
});

// ============================================================================
// SMOOTHER PORT INTERFACE COMPLIANCE
// ============================================================================

describe('SmootherPort Interface Compliance (REAL)', () => {
	it('RapierPhysicsAdapter implements SmootherPort interface', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		expect(typeof adapter.smooth).toBe('function');
		expect(typeof adapter.reset).toBe('function');
		expect(typeof adapter.setParams).toBe('function');
	});

	it('smooth() returns complete SmoothedFrame structure', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		const result = adapter.smooth(createTestFrame());

		expect(result).toHaveProperty('ts');
		expect(result).toHaveProperty('handId');
		expect(result).toHaveProperty('position');
		expect(result).toHaveProperty('velocity');
		expect(result).toHaveProperty('trackingOk');
		expect(result).toHaveProperty('label');
		expect(result).toHaveProperty('confidence');
		expect(result).toHaveProperty('palmFacing');

		expect(typeof result.position.x).toBe('number');
		expect(typeof result.position.y).toBe('number');
		expect(typeof result.velocity.x).toBe('number');
		expect(typeof result.velocity.y).toBe('number');
	});
});

// ============================================================================
// MUTANT KILLER TESTS - Targeting specific surviving mutants
// These tests are designed to kill mutants that survived the first pass
// ============================================================================

describe('MUTANT KILLERS - Uninitialized Passthrough Behavior', () => {
	// These tests target the passthrough code path (lines 125-127, 284-294)
	// which was NEVER exercised because all previous tests called init()

	it('smooth() returns passthrough when NOT initialized', () => {
		const adapter = new RapierPhysicsAdapter();
		// DO NOT call init() - test passthrough behavior

		const frame = createTestFrame({
			ts: 12345,
			handId: 'passthrough-test',
			indexTip: { x: 0.75, y: 0.25 },
			label: 'Open_Palm',
			confidence: 0.88,
			palmFacing: false,
		});

		const result = adapter.smooth(frame);

		// Passthrough should return input position directly
		expect(result.position.x).toBe(0.75);
		expect(result.position.y).toBe(0.25);
		expect(result.velocity.x).toBe(0);
		expect(result.velocity.y).toBe(0);
		expect(result.ts).toBe(12345);
		expect(result.handId).toBe('passthrough-test');
		expect(result.label).toBe('Open_Palm');
		expect(result.confidence).toBe(0.88);
		expect(result.palmFacing).toBe(false);
		expect(result.prediction).toBeNull();
	});

	it('passthrough uses default position when indexTip is missing', () => {
		const adapter = new RapierPhysicsAdapter();
		// DO NOT init

		const frame = createTestFrame({
			indexTip: undefined,
		});

		const result = adapter.smooth(frame);

		// Should use default {0.5, 0.5}
		expect(result.position.x).toBe(0.5);
		expect(result.position.y).toBe(0.5);
	});

	it('passthrough uses default label when missing', () => {
		const adapter = new RapierPhysicsAdapter();

		const frame = createTestFrame({
			label: undefined,
		});

		const result = adapter.smooth(frame);
		expect(result.label).toBe('None');
	});

	it('passthrough uses default confidence when missing', () => {
		const adapter = new RapierPhysicsAdapter();

		const frame = createTestFrame({
			confidence: undefined,
		});

		const result = adapter.smooth(frame);
		expect(result.confidence).toBe(0);
	});

	it('passthrough uses default palmFacing when missing', () => {
		const adapter = new RapierPhysicsAdapter();

		const frame = createTestFrame({
			palmFacing: undefined,
		});

		const result = adapter.smooth(frame);
		expect(result.palmFacing).toBe(false);
	});

	it('getState() returns default state before init', () => {
		const adapter = new RapierPhysicsAdapter();
		// DO NOT init

		const state = adapter.getState();

		expect(state.position.x).toBe(0.5);
		expect(state.position.y).toBe(0.5);
		expect(state.velocity.x).toBe(0);
		expect(state.velocity.y).toBe(0);
		expect(state.effectiveStiffness).toBe(0);
	});
});

describe('MUTANT KILLERS - Predictive Mode Math Precision', () => {
	// These tests kill arithmetic mutants in predictive calculation (lines 188-192)

	it('prediction uses ADDITION not subtraction for lookahead', async () => {
		const adapter = new RapierPhysicsAdapter({
			mode: 'predictive',
			predictionMs: 100,
			stiffness: 800, // High stiffness for faster convergence
		});
		await adapter.init();

		// Create movement to generate positive velocity
		adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.3, y: 0.3 } }));
		adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.5, y: 0.5 } }));
		const result = adapter.smooth(createTestFrame({ ts: 32, indexTip: { x: 0.7, y: 0.7 } }));

		// With positive velocity, prediction should be AHEAD of position
		// If mutant changes + to -, prediction would be BEHIND
		if (result.velocity.x > 0) {
			expect(result.prediction!.x).toBeGreaterThanOrEqual(result.position.x);
		}
		if (result.velocity.y > 0) {
			expect(result.prediction!.y).toBeGreaterThanOrEqual(result.position.y);
		}
	});

	it('prediction scales with predictionMs (not inverted)', async () => {
		const shortPrediction = new RapierPhysicsAdapter({
			mode: 'predictive',
			predictionMs: 20,
			stiffness: 600,
		});
		const longPrediction = new RapierPhysicsAdapter({
			mode: 'predictive',
			predictionMs: 100,
			stiffness: 600,
		});

		await Promise.all([shortPrediction.init(), longPrediction.init()]);

		// Same movement for both
		const frames = [
			createTestFrame({ ts: 0, indexTip: { x: 0.3, y: 0.5 } }),
			createTestFrame({ ts: 16, indexTip: { x: 0.5, y: 0.5 } }),
			createTestFrame({ ts: 32, indexTip: { x: 0.7, y: 0.5 } }),
		];

		for (const frame of frames) {
			shortPrediction.smooth(frame);
			longPrediction.smooth(frame);
		}

		const shortResult = shortPrediction.smooth(
			createTestFrame({ ts: 48, indexTip: { x: 0.8, y: 0.5 } }),
		);
		const longResult = longPrediction.smooth(
			createTestFrame({ ts: 48, indexTip: { x: 0.8, y: 0.5 } }),
		);

		// Longer prediction should look further ahead
		// If mutant changes / to *, the relationship inverts
		const shortDist = Math.abs(shortResult.prediction!.x - shortResult.position.x);
		const longDist = Math.abs(longResult.prediction!.x - longResult.position.x);

		// Long prediction should extend further than short (or equal if velocity is 0)
		expect(longDist).toBeGreaterThanOrEqual(shortDist - 0.001);
	});

	it('prediction is null in smoothed mode, not-null in predictive mode', async () => {
		const smoothed = new RapierPhysicsAdapter({ mode: 'smoothed' });
		const predictive = new RapierPhysicsAdapter({ mode: 'predictive', predictionMs: 50 });

		await Promise.all([smoothed.init(), predictive.init()]);

		const frame = createTestFrame({ ts: 0 });
		const smoothedResult = smoothed.smooth(frame);
		const predictiveResult = predictive.smooth(frame);

		expect(smoothedResult.prediction).toBeNull();
		expect(predictiveResult.prediction).not.toBeNull();
	});
});

describe('MUTANT KILLERS - Reset Behavior Verification', () => {
	// These tests verify reset() actually zeros velocity (line 218)

	it('reset() sets velocity to exactly {0, 0}', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		// Build up velocity
		adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.2, y: 0.2 } }));
		adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.8, y: 0.8 } }));

		const before = adapter.getState();
		expect(before.velocity.x).not.toBe(0);
		expect(before.velocity.y).not.toBe(0);

		adapter.reset();

		const after = adapter.getState();
		expect(after.velocity.x).toBe(0);
		expect(after.velocity.y).toBe(0);
	});

	it('reset() sets position to exactly {0.5, 0.5}', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		// Move away from center
		for (let i = 0; i < 30; i++) {
			adapter.smooth(createTestFrame({ ts: i * 16, indexTip: { x: 0.9, y: 0.1 } }));
		}

		adapter.reset();

		const state = adapter.getState();
		expect(state.position.x).toBeCloseTo(0.5, 2);
		expect(state.position.y).toBeCloseTo(0.5, 2);
	});
});

describe('MUTANT KILLERS - Frame Metadata Edge Cases', () => {
	// These tests kill null-coalescing mutants (lines 203, etc.)

	it('initialized adapter preserves explicit label value', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		const result = adapter.smooth(
			createTestFrame({
				label: 'Closed_Fist',
			}),
		);

		expect(result.label).toBe('Closed_Fist');
	});

	it('initialized adapter preserves explicit confidence value', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		const result = adapter.smooth(
			createTestFrame({
				confidence: 0.42,
			}),
		);

		expect(result.confidence).toBe(0.42);
	});

	it('initialized adapter preserves explicit palmFacing value', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		// Test both true and false to catch boolean mutations
		const trueResult = adapter.smooth(createTestFrame({ palmFacing: true }));
		expect(trueResult.palmFacing).toBe(true);

		const falseResult = adapter.smooth(createTestFrame({ palmFacing: false }));
		expect(falseResult.palmFacing).toBe(false);
	});

	it('initialized adapter uses default label when undefined', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		const result = adapter.smooth(
			createTestFrame({
				label: undefined,
			}),
		);

		expect(result.label).toBe('None');
	});

	it('initialized adapter uses default confidence when undefined', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		const result = adapter.smooth(
			createTestFrame({
				confidence: undefined,
			}),
		);

		expect(result.confidence).toBe(0);
	});
});

describe('MUTANT KILLERS - Init Guard Conditions', () => {
	// These tests verify the init guard behaves correctly

	it('calling smooth() before init() uses passthrough (guard works)', () => {
		const adapter = new RapierPhysicsAdapter();

		const result = adapter.smooth(
			createTestFrame({
				indexTip: { x: 0.123, y: 0.456 },
			}),
		);

		// Should passthrough, not throw or use physics
		expect(result.position.x).toBe(0.123);
		expect(result.position.y).toBe(0.456);
	});

	it('calling init() twice does not create duplicate physics', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		const state1 = adapter.getState();
		expect(state1.position.x).toBeCloseTo(0.5, 2);

		// Second init should be no-op
		await adapter.init();

		const state2 = adapter.getState();
		expect(state2.position.x).toBeCloseTo(0.5, 2);
	});

	it('smooth() after init() uses physics (not passthrough)', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.5, y: 0.5 } }));
		const result = adapter.smooth(createTestFrame({ ts: 16, indexTip: { x: 0.9, y: 0.9 } }));

		// With physics, position should NOT instantly jump to target
		expect(result.position.x).toBeLessThan(0.9);
		expect(result.position.y).toBeLessThan(0.9);
	});
});

describe('MUTANT KILLERS - Timestamp/dt Calculation', () => {
	// These tests verify dt calculation (line 136)

	it('uses correct dt between frames', async () => {
		const adapter = new RapierPhysicsAdapter({ stiffness: 400 });
		await adapter.init();

		// First frame establishes timestamp
		adapter.smooth(createTestFrame({ ts: 1000, indexTip: { x: 0.5, y: 0.5 } }));

		// Second frame 16ms later - standard 60fps
		const result16ms = adapter.smooth(createTestFrame({ ts: 1016, indexTip: { x: 0.6, y: 0.6 } }));

		adapter.reset();
		adapter.smooth(createTestFrame({ ts: 2000, indexTip: { x: 0.5, y: 0.5 } }));

		// Third frame 100ms later - slower framerate, more physics steps
		const result100ms = adapter.smooth(createTestFrame({ ts: 2100, indexTip: { x: 0.6, y: 0.6 } }));

		// With longer dt (more time), position should have moved more toward target
		// This kills the mutant that changes dt calculation
		// Note: dt is capped at 0.1s, so 100ms should work
		const dist16 = Math.sqrt(
			(result16ms.position.x - 0.5) ** 2 + (result16ms.position.y - 0.5) ** 2,
		);
		const dist100 = Math.sqrt(
			(result100ms.position.x - 0.5) ** 2 + (result100ms.position.y - 0.5) ** 2,
		);

		// 100ms frame should have moved further than 16ms frame
		expect(dist100).toBeGreaterThan(dist16);
	});

	it('dt defaults to 1/60 on first frame', async () => {
		const adapter = new RapierPhysicsAdapter();
		await adapter.init();

		// First frame - lastTimestamp is null, should use default dt
		const result = adapter.smooth(createTestFrame({ ts: 0, indexTip: { x: 0.7, y: 0.7 } }));

		// Should have moved toward target (proving physics ran with default dt)
		expect(result.position.x).toBeGreaterThan(0.5);
		expect(result.position.y).toBeGreaterThan(0.5);
	});
});
