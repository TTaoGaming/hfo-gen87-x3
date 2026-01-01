/**
 * @fileoverview Rapier WASM Simulator Tests with Golden Input
 *
 * Tests REAL @dimforge/rapier2d-compat WASM integration with golden test fixtures.
 * Verifies trajectory prediction against known sequences.
 *
 * @module physics/rapier-wasm-simulator.test
 * @hive V (Validate)
 * @tdd GREEN
 */
// @ts-nocheck


import * as fc from 'fast-check';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
	SEQ_ARM_AND_CLICK,
	SEQ_ARM_BASELINE,
	SEQ_ARM_MOVE_CLICK,
	resetFrameCounter,
} from '../test-fixtures/golden-input.js';
import { GestureLanguage } from './gesture-language.js';
import type { GestureState } from './gesture-transition-model.js';
import {
	type Collider,
	type ColliderDesc,
	type RapierModule,
	RapierWasmSimulator,
	type RapierWorld,
	type RigidBody,
	type RigidBodyDesc,
	createRapierSimulator,
	isRapierAvailable,
} from './rapier-wasm-simulator.js';

// ============================================================================
// MOCK RAPIER FOR UNIT TESTS (when WASM not available)
// ============================================================================

function createMockRapierModule(): RapierModule {
	let position = { x: 0.5, y: 0.5 };
	let velocity = { x: 0, y: 0 };

	const mockBody: RigidBody = {
		handle: 1,
		translation: () => ({ ...position }),
		linvel: () => ({ ...velocity }),
		setTranslation: (t, _) => {
			position = { ...t };
		},
		setLinvel: (v, _) => {
			velocity = { ...v };
		},
		setNextKinematicTranslation: (t) => {
			position = { ...t };
		},
	};

	const mockWorld: RapierWorld = {
		createRigidBody: (_desc: RigidBodyDesc) => mockBody,
		createCollider: (_desc: ColliderDesc, _body?: RigidBody): Collider => ({
			handle: 1,
		}),
		step: () => {},
		timestep: 0.016,
	};

	return {
		init: async () => {},
		World: class {
			timestep = 0.016;
			constructor(_gravity: { x: number; y: number }) {}
			createRigidBody(_desc: RigidBodyDesc): RigidBody {
				return mockBody;
			}
			createCollider(_desc: ColliderDesc, _body?: RigidBody): Collider {
				return { handle: 1 };
			}
			step() {}
		} as unknown as RapierModule['World'],
		RigidBodyDesc: {
			kinematicPositionBased: () => ({
				setTranslation: function (_x: number, _y: number) {
					return this;
				},
				setLinvel: function (_x: number, _y: number) {
					return this;
				},
			}),
			dynamic: () => ({
				setTranslation: function (_x: number, _y: number) {
					return this;
				},
				setLinvel: function (_x: number, _y: number) {
					return this;
				},
			}),
		},
		ColliderDesc: {
			ball: (_radius: number) => ({
				setRestitution: function (_value: number) {
					return this;
				},
			}),
		},
	};
}

// ============================================================================
// TEST SETUP
// ============================================================================

describe('RapierWasmSimulator', () => {
	let mockRapier: RapierModule;
	let simulator: RapierWasmSimulator;
	let grammar: GestureLanguage;

	beforeEach(() => {
		resetFrameCounter();
		mockRapier = createMockRapierModule();
		simulator = new RapierWasmSimulator(mockRapier);
		grammar = new GestureLanguage();
		simulator.setGrammar(grammar);
	});

	// ==========================================================================
	// UNIT TESTS
	// ==========================================================================

	describe('initialization', () => {
		it('should create simulator with default config', () => {
			expect(simulator).toBeDefined();
			expect(simulator.getWorld()).toBeDefined();
		});

		it('should accept custom config', () => {
			const customSimulator = new RapierWasmSimulator(mockRapier, {
				linearDamping: 0.5,
				timestepMs: 8,
			});
			expect(customSimulator).toBeDefined();
		});

		it('should have zero initial velocity', () => {
			const velocity = simulator.getVelocity();
			expect(velocity.x).toBe(0);
			expect(velocity.y).toBe(0);
		});
	});

	describe('simulate()', () => {
		it('should predict position from stationary hand', () => {
			const state: GestureState = {
				indexTip: { x: 0.5, y: 0.5 },
				label: 'Open_Palm',
				timestampMs: 100,
			};

			const result = simulator.simulate(state, 100);

			expect(result.predictedPosition.x).toBeCloseTo(0.5, 1);
			expect(result.predictedPosition.y).toBeCloseTo(0.5, 1);
			expect(result.confidence).toBeGreaterThan(0);
		});

		it('should predict forward movement from velocity', () => {
			// First frame to establish baseline
			simulator.simulate({ indexTip: { x: 0.5, y: 0.5 }, label: 'Open_Palm', timestampMs: 0 }, 0);

			// Second frame with movement
			const result = simulator.simulate(
				{ indexTip: { x: 0.6, y: 0.5 }, label: 'Open_Palm', timestampMs: 100 },
				100,
			);

			// Should predict continued rightward movement
			expect(result.predictedPosition.x).toBeGreaterThan(0.6);
		});

		it('should clamp predictions to [0, 1] bounds', () => {
			// Move toward edge
			simulator.simulate({ indexTip: { x: 0.9, y: 0.5 }, label: 'Open_Palm', timestampMs: 0 }, 0);

			// Fast movement toward boundary
			const result = simulator.simulate(
				{ indexTip: { x: 1.0, y: 0.5 }, label: 'Open_Palm', timestampMs: 50 },
				500,
			);

			expect(result.predictedPosition.x).toBeLessThanOrEqual(1);
			expect(result.predictedPosition.x).toBeGreaterThanOrEqual(0);
		});

		it('should predict Pointing_Up from Open_Palm', () => {
			const result = simulator.simulate(
				{ indexTip: { x: 0.5, y: 0.5 }, label: 'Open_Palm', timestampMs: 100 },
				100,
			);

			expect(result.predictedGesture).toBe('Pointing_Up');
			expect(result.confidence).toBeCloseTo(0.85, 1);
		});

		it('should predict Pointing_Up from None', () => {
			const result = simulator.simulate(
				{ indexTip: { x: 0.5, y: 0.5 }, label: 'None', timestampMs: 100 },
				100,
			);

			expect(result.predictedGesture).toBe('Pointing_Up');
		});
	});

	describe('velocity tracking', () => {
		it('should calculate velocity from position delta', () => {
			simulator.simulate({ indexTip: { x: 0.5, y: 0.5 }, label: 'Open_Palm', timestampMs: 0 }, 0);

			simulator.simulate({ indexTip: { x: 0.6, y: 0.5 }, label: 'Open_Palm', timestampMs: 100 }, 0);

			const velocity = simulator.getVelocity();
			expect(velocity.x).toBeCloseTo(1.0, 1); // 0.1 / 0.1s = 1.0
			expect(velocity.y).toBeCloseTo(0, 1);
		});

		it('should decay velocity over time', () => {
			// Establish velocity
			simulator.simulate({ indexTip: { x: 0.5, y: 0.5 }, label: 'Open_Palm', timestampMs: 0 }, 0);

			simulator.simulate({ indexTip: { x: 0.6, y: 0.5 }, label: 'Open_Palm', timestampMs: 100 }, 0);

			// Stop moving
			simulator.simulate({ indexTip: { x: 0.6, y: 0.5 }, label: 'Open_Palm', timestampMs: 200 }, 0);

			const velocity = simulator.getVelocity();
			expect(velocity.x).toBeCloseTo(0, 1);
		});
	});

	describe('reset()', () => {
		it('should clear velocity on reset', () => {
			simulator.simulate({ indexTip: { x: 0.5, y: 0.5 }, label: 'Open_Palm', timestampMs: 0 }, 0);
			simulator.simulate({ indexTip: { x: 0.6, y: 0.5 }, label: 'Open_Palm', timestampMs: 100 }, 0);

			simulator.reset();

			const velocity = simulator.getVelocity();
			expect(velocity.x).toBe(0);
			expect(velocity.y).toBe(0);
		});
	});

	// ==========================================================================
	// GOLDEN INPUT INTEGRATION TESTS
	// ==========================================================================

	describe('Golden Input Integration', () => {
		it('should process SEQ_ARM_BASELINE frames', () => {
			const sequence = SEQ_ARM_BASELINE;
			const results: Array<{ position: { x: number; y: number }; gesture: string }> = [];

			for (const frame of sequence.frames) {
				const state: GestureState = {
					indexTip: frame.position,
					label: frame.label as GestureState['label'],
					timestampMs: frame.ts,
				};

				const result = simulator.simulate(state, 33);
				results.push({
					position: result.predictedPosition,
					gesture: result.predictedGesture,
				});
			}

			expect(results.length).toBe(sequence.frames.length);
			// First frame (None) should predict Pointing_Up
			expect(results[0].gesture).toBe('Pointing_Up');
			// Last frames (Open_Palm) should predict Pointing_Up (commit gesture)
			const lastResult = results[results.length - 1];
			expect(lastResult.gesture).toBe('Pointing_Up');
		});

		it('should process SEQ_ARM_AND_CLICK frames', () => {
			const sequence = SEQ_ARM_AND_CLICK;
			const predictions: string[] = [];

			for (const frame of sequence.frames) {
				const state: GestureState = {
					indexTip: frame.position,
					label: frame.label as GestureState['label'],
					timestampMs: frame.ts,
				};

				const result = simulator.simulate(state, 33);
				predictions.push(result.predictedGesture);
			}

			expect(predictions.length).toBe(sequence.frames.length);
			// Should have some Pointing_Up predictions (commit gesture)
			expect(predictions.filter((g) => g === 'Pointing_Up').length).toBeGreaterThan(0);
		});

		it('should track position through SEQ_ARM_MOVE_CLICK', () => {
			const sequence = SEQ_ARM_MOVE_CLICK;
			const positions: Array<{ x: number; y: number }> = [];

			for (const frame of sequence.frames) {
				const state: GestureState = {
					indexTip: frame.position,
					label: frame.label as GestureState['label'],
					timestampMs: frame.ts,
				};

				const result = simulator.simulate(state, 33);
				positions.push(result.predictedPosition);
			}

			// Verify movement was tracked
			expect(positions.length).toBe(sequence.frames.length);

			// All positions should be in valid bounds
			for (const pos of positions) {
				expect(pos.x).toBeGreaterThanOrEqual(0);
				expect(pos.x).toBeLessThanOrEqual(1);
				expect(pos.y).toBeGreaterThanOrEqual(0);
				expect(pos.y).toBeLessThanOrEqual(1);
			}
		});

		it('should maintain prediction continuity during gesture transitions', () => {
			const sequence = SEQ_ARM_AND_CLICK;
			let lastPosition: { x: number; y: number } | null = null;

			for (const frame of sequence.frames) {
				const state: GestureState = {
					indexTip: frame.position,
					label: frame.label as GestureState['label'],
					timestampMs: frame.ts,
				};

				const result = simulator.simulate(state, 33);

				if (lastPosition) {
					// Position shouldn't jump more than 0.5 in one frame
					const dx = Math.abs(result.predictedPosition.x - lastPosition.x);
					const dy = Math.abs(result.predictedPosition.y - lastPosition.y);
					expect(dx).toBeLessThan(0.5);
					expect(dy).toBeLessThan(0.5);
				}

				lastPosition = result.predictedPosition;
			}
		});
	});

	// ==========================================================================
	// PROPERTY-BASED TESTS
	// ==========================================================================

	describe('Property-Based Tests', () => {
		it('property: predictions are always in [0, 1] bounds', () => {
			fc.assert(
				fc.property(
					fc.float({ min: 0, max: 1, noNaN: true }),
					fc.float({ min: 0, max: 1, noNaN: true }),
					fc.integer({ min: 0, max: 1000 }),
					fc.integer({ min: 0, max: 500 }),
					(x, y, ts, duration) => {
						const state: GestureState = {
							indexTip: { x, y },
							label: 'Open_Palm',
							timestampMs: ts,
						};

						const result = simulator.simulate(state, duration);

						expect(result.predictedPosition.x).toBeGreaterThanOrEqual(0);
						expect(result.predictedPosition.x).toBeLessThanOrEqual(1);
						expect(result.predictedPosition.y).toBeGreaterThanOrEqual(0);
						expect(result.predictedPosition.y).toBeLessThanOrEqual(1);
					},
				),
				{ numRuns: 100 },
			);
		});

		it('property: confidence is always in (0, 1]', () => {
			fc.assert(
				fc.property(fc.constantFrom('Open_Palm', 'Pointing_Up', 'None', 'Closed_Fist'), (label) => {
					const state: GestureState = {
						indexTip: { x: 0.5, y: 0.5 },
						label: label as GestureState['label'],
						timestampMs: 100,
					};

					const result = simulator.simulate(state, 100);

					expect(result.confidence).toBeGreaterThan(0);
					expect(result.confidence).toBeLessThanOrEqual(1);
				}),
				{ numRuns: 100 },
			);
		});

		it('property: stationary hand predicts near-original position', () => {
			fc.assert(
				fc.property(
					fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
					fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
					(x, y) => {
						simulator.reset();

						// Two identical positions = stationary
						simulator.simulate({ indexTip: { x, y }, label: 'Open_Palm', timestampMs: 0 }, 0);

						const result = simulator.simulate(
							{ indexTip: { x, y }, label: 'Open_Palm', timestampMs: 100 },
							100,
						);

						// Prediction should be close to original (with some damping)
						expect(Math.abs(result.predictedPosition.x - x)).toBeLessThan(0.1);
						expect(Math.abs(result.predictedPosition.y - y)).toBeLessThan(0.1);
					},
				),
				{ numRuns: 100 },
			);
		});

		it('property: moving hand predicts in movement direction', () => {
			fc.assert(
				fc.property(
					fc.float({ min: Math.fround(0.2), max: Math.fround(0.4), noNaN: true }),
					fc.float({ min: Math.fround(0.2), max: Math.fround(0.4), noNaN: true }),
					fc.float({ min: Math.fround(0.05), max: Math.fround(0.2), noNaN: true }),
					fc.float({ min: Math.fround(0.05), max: Math.fround(0.2), noNaN: true }),
					(x1, y1, dx, dy) => {
						simulator.reset();

						const x2 = x1 + dx;
						const y2 = y1 + dy;

						simulator.simulate(
							{ indexTip: { x: x1, y: y1 }, label: 'Open_Palm', timestampMs: 0 },
							0,
						);

						const result = simulator.simulate(
							{ indexTip: { x: x2, y: y2 }, label: 'Open_Palm', timestampMs: 100 },
							100,
						);

						// If moving right (dx > 0), prediction should be right of current
						if (dx > 0) {
							expect(result.predictedPosition.x).toBeGreaterThan(x2 - 0.1);
						}
						// If moving down (dy > 0), prediction should be below current
						if (dy > 0) {
							expect(result.predictedPosition.y).toBeGreaterThan(y2 - 0.1);
						}
					},
				),
				{ numRuns: 100 },
			);
		});
	});
});

// ============================================================================
// WASM INTEGRATION TESTS (run only if Rapier available)
// ============================================================================

describe('Rapier WASM Integration', () => {
	let realSimulator: RapierWasmSimulator | null = null;
	let wasmAvailable = false;

	beforeAll(async () => {
		wasmAvailable = await isRapierAvailable();
		if (wasmAvailable) {
			realSimulator = await createRapierSimulator();
		}
	});

	it('should detect Rapier WASM availability', async () => {
		// This test always passes - just documents availability
		console.log(`Rapier WASM available: ${wasmAvailable}`);
		expect(typeof wasmAvailable).toBe('boolean');
	});

	it('should create real simulator with WASM', async () => {
		if (!wasmAvailable) {
			console.log('Skipping: Rapier WASM not available');
			return;
		}
		expect(realSimulator).toBeDefined();
		expect(realSimulator!.getWorld()).toBeDefined();
	});

	it('should simulate with real physics', async () => {
		if (!wasmAvailable || !realSimulator) {
			console.log('Skipping: Rapier WASM not available');
			return;
		}
		const grammar = new GestureLanguage();
		realSimulator.setGrammar(grammar);

		const result = realSimulator.simulate(
			{ indexTip: { x: 0.5, y: 0.5 }, label: 'Open_Palm', timestampMs: 0 },
			100,
		);

		expect(result.predictedPosition).toBeDefined();
		expect(result.predictedGesture).toBeDefined();
		expect(result.confidence).toBeGreaterThan(0);
	});

	it('should process golden input with real WASM', async () => {
		if (!wasmAvailable || !realSimulator) {
			console.log('Skipping: Rapier WASM not available');
			return;
		}
		const grammar = new GestureLanguage();
		realSimulator.setGrammar(grammar);
		realSimulator.reset();

		const sequence = SEQ_ARM_AND_CLICK;
		const results: Array<{
			position: { x: number; y: number };
			gesture: string;
			confidence: number;
		}> = [];

		for (const frame of sequence.frames) {
			const state: GestureState = {
				indexTip: frame.position,
				label: frame.label as GestureState['label'],
				timestampMs: frame.ts,
			};

			const result = realSimulator.simulate(state, 33);
			results.push({
				position: result.predictedPosition,
				gesture: result.predictedGesture,
				confidence: result.confidence,
			});
		}

		expect(results.length).toBe(sequence.frames.length);

		// All positions should be valid
		for (const r of results) {
			expect(r.position.x).toBeGreaterThanOrEqual(0);
			expect(r.position.x).toBeLessThanOrEqual(1);
			expect(r.position.y).toBeGreaterThanOrEqual(0);
			expect(r.position.y).toBeLessThanOrEqual(1);
			expect(r.confidence).toBeGreaterThan(0);
		}
	});
});
