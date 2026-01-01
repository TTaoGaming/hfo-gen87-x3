/**
 * @fileoverview RED Tests - Gesture Transition Modeling with Rapier Physics
 *
 * SPEC FROM USER NOTES (2025-12-30):
 * - MediaPipe gestures transition through "None" between gestures
 *   Example: Open_Palm → None → Pointing_Up (commit gesture)
 * - When user is constrained to a known gesture language, transitions are PREDICTABLE
 * - Model gesture transitions as lines/gradients in state space
 * - Rapier physics can simulate along these trajectories during "None" gap frames
 * - "Wrong" gestures like None are expected WAYPOINTS, not errors
 *
 * RAPIER ROLE #3: State Transition Modeling
 * - Predict user intent during the "None" gap frames
 * - Constrain predictions to known gesture language (grammar)
 * - Improve perceived responsiveness beyond raw 30fps input
 *
 * @module physics/gesture-transition-model.test
 * @hive V (Validate)
 * @tdd RED
 */
// @ts-nocheck


import * as fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

// ============================================================================
// SCHEMAS - Gesture Language Definition
// ============================================================================

/** MediaPipe gesture labels */
const GestureLabel = z.enum([
	'Open_Palm',
	'Pointing_Up',
	'Victory',
	'Thumb_Up',
	'Thumb_Down',
	'Closed_Fist',
	'ILoveYou',
	'None',
]);
type GestureLabel = z.infer<typeof GestureLabel>;

/** Gesture state with confidence and timestamp */
const GestureState = z.object({
	label: GestureLabel,
	confidence: z.number().min(0).max(1),
	timestampMs: z.number().nonnegative(),
	/** Palm orientation for arming */
	palmFacing: z.boolean(),
	/** Index finger tip position (cursor) */
	indexTip: z.object({
		x: z.number().min(0).max(1),
		y: z.number().min(0).max(1),
	}),
});
type GestureState = z.infer<typeof GestureState>;

/** Valid gesture transition (grammar rule) */
const GestureTransition = z.object({
	from: GestureLabel,
	to: GestureLabel,
	/** Expected None frames between gestures (0-n) */
	expectedNoneFrames: z.number().nonnegative(),
	/** Typical duration in ms */
	typicalDurationMs: z.number().positive(),
	/** Can go through None? */
	allowsNoneGap: z.boolean(),
});
type GestureTransition = z.infer<typeof GestureTransition>;

/** Prediction output from transition model */
const TransitionPrediction = z.object({
	/** Predicted next gesture */
	predictedGesture: GestureLabel,
	/** Confidence in prediction 0-1 */
	confidence: z.number().min(0).max(1),
	/** Predicted time to transition in ms */
	predictedTimeMs: z.number().nonnegative(),
	/** Is this during a None gap? */
	inNoneGap: z.boolean(),
	/** Trajectory interpolation 0-1 (how far along transition) */
	trajectoryProgress: z.number().min(0).max(1),
});
type TransitionPrediction = z.infer<typeof TransitionPrediction>;

// ============================================================================
// PORT INTERFACES - Hexagonal CDD
// ============================================================================

/**
 * PORT: Gesture Language Grammar
 * Defines valid transitions in the gesture language
 */
interface GestureLanguagePort {
	/** Get valid transitions from a gesture */
	getValidTransitions(from: GestureLabel): GestureTransition[];
	/** Is this transition valid in our grammar? */
	isValidTransition(from: GestureLabel, to: GestureLabel): boolean;
	/** Add custom transition rule */
	addTransition(transition: GestureTransition): void;
}

/**
 * PORT: Transition Model (Rapier-based)
 * Predicts gesture transitions as trajectories in state space
 */
interface GestureTransitionModelPort {
	/** Update model with new gesture state */
	update(state: GestureState): void;
	/** Get prediction for next gesture */
	predict(): TransitionPrediction | null;
	/** Get trajectory as line/gradient in state space */
	getTrajectory(): { from: GestureLabel; to: GestureLabel; progress: number } | null;
	/** Reset model state */
	reset(): void;
	/** Configure prediction lookahead */
	setLookaheadMs(ms: number): void;
}

/**
 * PORT: Physics Simulator for Trajectory
 * Uses Rapier to simulate gesture motion
 */
interface TrajectorySimulatorPort {
	/** Simulate gesture motion for given duration */
	simulate(
		currentState: GestureState,
		durationMs: number,
	): {
		predictedPosition: { x: number; y: number };
		predictedGesture: GestureLabel;
		confidence: number;
	};
	/** Set gesture language constraints */
	setGrammar(grammar: GestureLanguagePort): void;
}

// ============================================================================
// STUBS - Will throw until implemented
// ============================================================================

// Import real implementations
import { GestureLanguage as GestureLanguageImpl } from './gesture-language.js';
import { GestureTransitionModel as GestureTransitionModelImpl } from './gesture-transition-model.js';
import { RapierTrajectorySimulator as RapierTrajectorySimulatorImpl } from './rapier-trajectory-simulator.js';

const GestureLanguage = GestureLanguageImpl;
const GestureTransitionModel = GestureTransitionModelImpl;
const RapierTrajectorySimulator = RapierTrajectorySimulatorImpl;

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createGestureState(overrides?: Partial<GestureState>): GestureState {
	return {
		label: 'Open_Palm',
		confidence: 0.95,
		timestampMs: 0,
		palmFacing: true,
		indexTip: { x: 0.5, y: 0.5 },
		...overrides,
	};
}

const arbGestureLabel = fc.constantFrom(
	'Open_Palm',
	'Pointing_Up',
	'Victory',
	'Thumb_Up',
	'Closed_Fist',
	'None',
) as fc.Arbitrary<GestureLabel>;

// ============================================================================
// RED TESTS: Gesture Language Grammar
// ============================================================================

describe('GestureLanguage (Grammar Definition)', () => {
	it('should define Open_Palm → None → Pointing_Up as valid commit sequence', () => {
		const grammar = new GestureLanguage();

		// Open_Palm can transition to None (natural during gesture change)
		expect(grammar.isValidTransition('Open_Palm', 'None')).toBe(true);
		// None can transition to Pointing_Up (commit gesture)
		expect(grammar.isValidTransition('None', 'Pointing_Up')).toBe(true);
		// Direct transition should also be valid (fast transition)
		expect(grammar.isValidTransition('Open_Palm', 'Pointing_Up')).toBe(true);
	});

	it('should return valid transitions from Open_Palm (arming gesture)', () => {
		const grammar = new GestureLanguage();
		const transitions = grammar.getValidTransitions('Open_Palm');

		expect(transitions.length).toBeGreaterThan(0);
		expect(transitions.some((t) => t.to === 'Pointing_Up')).toBe(true);
		expect(transitions.some((t) => t.to === 'None')).toBe(true);
	});

	it('should include expectedNoneFrames metadata for transitions', () => {
		const grammar = new GestureLanguage();
		const transitions = grammar.getValidTransitions('Open_Palm');

		const toPointingUp = transitions.find((t) => t.to === 'Pointing_Up');
		expect(toPointingUp).toBeDefined();
		expect(toPointingUp!.allowsNoneGap).toBe(true);
		expect(toPointingUp!.expectedNoneFrames).toBeGreaterThanOrEqual(1);
	});

	it('should allow custom transition rules (adapter pattern)', () => {
		const grammar = new GestureLanguage();

		// Add custom transition for new gesture
		grammar.addTransition({
			from: 'Closed_Fist',
			to: 'Victory',
			expectedNoneFrames: 2,
			typicalDurationMs: 150,
			allowsNoneGap: true,
		});

		expect(grammar.isValidTransition('Closed_Fist', 'Victory')).toBe(true);
	});

	it('should reject invalid transitions not in grammar', () => {
		const grammar = new GestureLanguage();

		// These don't make ergonomic sense
		expect(grammar.isValidTransition('Thumb_Up', 'Closed_Fist')).toBe(false);
	});
});

// ============================================================================
// RED TESTS: Gesture Transition Model
// ============================================================================

describe('GestureTransitionModel (Trajectory Prediction)', () => {
	let grammar: GestureLanguagePort;
	let model: GestureTransitionModelPort;

	beforeEach(() => {
		grammar = new GestureLanguage();
		model = new GestureTransitionModel({ lookaheadMs: 50, grammar });
	});

	it('should detect None gap and predict next gesture', () => {
		// Sequence: Open_Palm → None → expecting Pointing_Up
		model.update(createGestureState({ label: 'Open_Palm', timestampMs: 0 }));
		model.update(createGestureState({ label: 'None', timestampMs: 33 }));

		const prediction = model.predict();
		expect(prediction).not.toBeNull();
		expect(prediction!.inNoneGap).toBe(true);
		expect(prediction!.predictedGesture).toBe('Pointing_Up'); // Most likely next
	});

	it('should return trajectory progress during transition', () => {
		model.update(createGestureState({ label: 'Open_Palm', timestampMs: 0 }));
		model.update(createGestureState({ label: 'None', timestampMs: 33 }));

		const trajectory = model.getTrajectory();
		expect(trajectory).not.toBeNull();
		expect(trajectory!.from).toBe('Open_Palm');
		expect(trajectory!.progress).toBeGreaterThan(0);
		expect(trajectory!.progress).toBeLessThan(1);
	});

	it('should complete trajectory when target gesture detected', () => {
		model.update(createGestureState({ label: 'Open_Palm', timestampMs: 0 }));
		model.update(createGestureState({ label: 'None', timestampMs: 33 }));
		model.update(createGestureState({ label: 'Pointing_Up', timestampMs: 66 }));

		const trajectory = model.getTrajectory();
		expect(trajectory).toBeNull(); // Completed

		const prediction = model.predict();
		expect(prediction!.inNoneGap).toBe(false);
	});

	it('should increase confidence when trajectory matches grammar', () => {
		model.update(createGestureState({ label: 'Open_Palm', timestampMs: 0 }));

		const pred1 = model.predict();
		const conf1 = pred1?.confidence || 0;

		model.update(createGestureState({ label: 'None', timestampMs: 33 }));

		const pred2 = model.predict();
		// Confidence should stay high because None is expected
		expect(pred2?.confidence).toBeGreaterThanOrEqual(conf1 * 0.8);
	});

	it('should handle configurable lookahead', () => {
		model.setLookaheadMs(100);
		model.update(createGestureState({ label: 'Open_Palm', timestampMs: 0 }));

		const prediction = model.predict();
		expect(prediction?.predictedTimeMs).toBeLessThanOrEqual(100);
	});

	it('property: prediction confidence is bounded [0,1]', () => {
		fc.assert(
			fc.property(arbGestureLabel, fc.nat(1000), (label, ts) => {
				model.reset();
				model.update(createGestureState({ label, timestampMs: ts }));
				const prediction = model.predict();
				if (prediction) {
					return prediction.confidence >= 0 && prediction.confidence <= 1;
				}
				return true;
			}),
		);
	});
});

// ============================================================================
// RED TESTS: Rapier Trajectory Simulator
// ============================================================================

describe('RapierTrajectorySimulator (Physics-based Prediction)', () => {
	let simulator: TrajectorySimulatorPort;
	let grammar: GestureLanguagePort;

	beforeEach(() => {
		simulator = new RapierTrajectorySimulator();
		grammar = new GestureLanguage();
		simulator.setGrammar(grammar);
	});

	it('should simulate gesture motion constrained to grammar', () => {
		const state = createGestureState({
			label: 'Open_Palm',
			indexTip: { x: 0.3, y: 0.5 },
		});

		const result = simulator.simulate(state, 50);

		// Prediction should be a valid gesture from grammar
		expect(GestureLabel.safeParse(result.predictedGesture).success).toBe(true);
		expect(result.confidence).toBeGreaterThan(0);
	});

	it('should predict position along trajectory line', () => {
		const state = createGestureState({
			label: 'Open_Palm',
			indexTip: { x: 0.3, y: 0.5 },
		});

		const result = simulator.simulate(state, 50);

		// Position should be within bounds
		expect(result.predictedPosition.x).toBeGreaterThanOrEqual(0);
		expect(result.predictedPosition.x).toBeLessThanOrEqual(1);
		expect(result.predictedPosition.y).toBeGreaterThanOrEqual(0);
		expect(result.predictedPosition.y).toBeLessThanOrEqual(1);
	});

	it('should reduce confidence for unexpected transitions', () => {
		// Start with valid sequence
		const validState = createGestureState({ label: 'Open_Palm' });
		const validResult = simulator.simulate(validState, 50);

		// Now an unexpected gesture
		const unexpectedState = createGestureState({ label: 'ILoveYou' });
		const unexpectedResult = simulator.simulate(unexpectedState, 50);

		// Confidence should be lower for unexpected gesture
		expect(unexpectedResult.confidence).toBeLessThan(validResult.confidence);
	});

	it('property: simulated position stays in [0,1] bounds', () => {
		fc.assert(
			fc.property(
				arbGestureLabel,
				fc.double({ min: 0, max: 1, noNaN: true }),
				fc.double({ min: 0, max: 1, noNaN: true }),
				fc.integer({ min: 16, max: 200 }),
				(label, x, y, durationMs) => {
					const state = createGestureState({
						label,
						indexTip: { x, y },
					});
					const result = simulator.simulate(state, durationMs);
					return (
						result.predictedPosition.x >= 0 &&
						result.predictedPosition.x <= 1 &&
						result.predictedPosition.y >= 0 &&
						result.predictedPosition.y <= 1
					);
				},
			),
		);
	});
});

// ============================================================================
// RED TESTS: Integration - Full Transition Prediction Pipeline
// ============================================================================

describe('Gesture Transition Integration (Full Pipeline)', () => {
	it('should predict commit gesture during Open_Palm → None gap', () => {
		const grammar = new GestureLanguage();
		const model = new GestureTransitionModel({ lookaheadMs: 50, grammar });
		const simulator = new RapierTrajectorySimulator();
		simulator.setGrammar(grammar);

		// User shows Open_Palm (arming)
		const armState = createGestureState({
			label: 'Open_Palm',
			palmFacing: true,
			timestampMs: 0,
		});
		model.update(armState);

		// Transition to None (natural gap)
		const noneState = createGestureState({
			label: 'None',
			timestampMs: 33,
		});
		model.update(noneState);

		// Get prediction
		const prediction = model.predict();
		expect(prediction).not.toBeNull();
		expect(prediction!.predictedGesture).toBe('Pointing_Up');

		// Simulate the trajectory
		const simResult = simulator.simulate(noneState, 33);
		expect(simResult.predictedGesture).toBe('Pointing_Up');
	});

	it('should handle rapid gesture changes gracefully', () => {
		const grammar = new GestureLanguage();
		const model = new GestureTransitionModel({ lookaheadMs: 30, grammar });

		// Rapid sequence
		model.update(createGestureState({ label: 'Open_Palm', timestampMs: 0 }));
		model.update(createGestureState({ label: 'None', timestampMs: 16 }));
		model.update(createGestureState({ label: 'Pointing_Up', timestampMs: 33 }));
		model.update(createGestureState({ label: 'None', timestampMs: 50 }));
		model.update(createGestureState({ label: 'Open_Palm', timestampMs: 66 }));

		// Should still produce valid prediction
		const prediction = model.predict();
		expect(prediction).not.toBeNull();
		expect(GestureLabel.safeParse(prediction!.predictedGesture).success).toBe(true);
	});
});
