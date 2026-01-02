/**
 * Gesture Transition Predictor Tests
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD RED→GREEN
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
	DEFAULT_GESTURE_TRANSITION_CONFIG,
	createGestureTransitionPredictor,
	createGestureTransitionState,
	updateGestureTransitionPredictor,
} from './gesture-transition-predictor.js';

// ============================================================================
// TESTS: Prediction Logic
// ============================================================================

describe('Gesture Transition Prediction', () => {
	const config = DEFAULT_GESTURE_TRANSITION_CONFIG;

	describe('Open_Palm → None → Pointing_Up cycle', () => {
		it('predicts Pointing_Up when None follows Open_Palm', () => {
			const state = createGestureTransitionState();

			// First, establish Open_Palm as last valid
			const afterOpenPalm = updateGestureTransitionPredictor('Open_Palm', 100, state, config);
			expect(afterOpenPalm.state.lastValidGesture).toBe('Open_Palm');

			// Now enter None state
			const afterNone = updateGestureTransitionPredictor(
				'None',
				180, // 80ms later
				afterOpenPalm.state,
				config,
			);

			expect(afterNone.likelyNext).toBe('Pointing_Up');
		});

		it('predicts Open_Palm when None follows Pointing_Up', () => {
			const state = createGestureTransitionState();

			// Establish Pointing_Up as last valid
			const afterPointing = updateGestureTransitionPredictor('Pointing_Up', 100, state, config);

			// Enter None state
			const afterNone = updateGestureTransitionPredictor('None', 180, afterPointing.state, config);

			expect(afterNone.likelyNext).toBe('Open_Palm');
		});
	});

	describe('None Debouncing', () => {
		it('shouldDebounce=true when None < noneDebounceMs', () => {
			const state = createGestureTransitionState();

			const afterGesture = updateGestureTransitionPredictor('Open_Palm', 100, state, config);

			// Very short None (10ms)
			const afterShortNone = updateGestureTransitionPredictor(
				'None',
				110,
				afterGesture.state,
				config,
			);

			expect(afterShortNone.shouldDebounce).toBe(true);
			expect(afterShortNone.msInNone).toBe(10);
		});

		it('shouldDebounce=false when None >= noneDebounceMs', () => {
			const state = createGestureTransitionState();

			const afterGesture = updateGestureTransitionPredictor('Open_Palm', 100, state, config);

			// Longer None (100ms, above 80ms threshold)
			const afterLongNone = updateGestureTransitionPredictor(
				'None',
				200,
				afterGesture.state,
				config,
			);

			expect(afterLongNone.shouldDebounce).toBe(false);
			expect(afterLongNone.msInNone).toBe(100);
		});
	});

	describe('Long None Detection', () => {
		it('isDisengagement=true when None >= longNoneMs', () => {
			const state = createGestureTransitionState();

			const afterGesture = updateGestureTransitionPredictor('Open_Palm', 100, state, config);

			// Very long None (300ms, above 200ms threshold)
			const afterLongNone = updateGestureTransitionPredictor(
				'None',
				400,
				afterGesture.state,
				config,
			);

			expect(afterLongNone.isDisengagement).toBe(true);
			expect(afterLongNone.msInNone).toBe(300);
		});

		it('isDisengagement=false when None < longNoneMs', () => {
			const state = createGestureTransitionState();

			const afterGesture = updateGestureTransitionPredictor('Open_Palm', 100, state, config);

			// Normal None (100ms)
			const afterNone = updateGestureTransitionPredictor('None', 200, afterGesture.state, config);

			expect(afterNone.isDisengagement).toBe(false);
		});
	});

	describe('Confidence Calculation', () => {
		it('confidence is low for very short None (noise)', () => {
			const state = createGestureTransitionState();
			const afterGesture = updateGestureTransitionPredictor('Open_Palm', 100, state, config);

			const afterShortNone = updateGestureTransitionPredictor(
				'None',
				110, // 10ms
				afterGesture.state,
				config,
			);

			expect(afterShortNone.confidence).toBeLessThan(0.3);
		});

		it('confidence is high for typical None duration', () => {
			const state = createGestureTransitionState();
			const afterGesture = updateGestureTransitionPredictor('Open_Palm', 100, state, config);

			// Duration in the sweet spot: >= debounce (80), close to typical (75), < long (200)
			// Using 100ms which is above debounce and close to typical
			const afterTypicalNone = updateGestureTransitionPredictor(
				'None',
				200, // 100ms (above 80ms debounce, in sweet spot)
				afterGesture.state,
				config,
			);

			expect(afterTypicalNone.confidence).toBeGreaterThan(0.5);
		});

		it('confidence drops for very long None (disengagement)', () => {
			const state = createGestureTransitionState();
			const afterGesture = updateGestureTransitionPredictor('Open_Palm', 100, state, config);

			// Very long None (500ms)
			const afterLongNone = updateGestureTransitionPredictor(
				'None',
				600,
				afterGesture.state,
				config,
			);

			expect(afterLongNone.confidence).toBeLessThan(0.5);
		});
	});

	describe('Valid Gesture Handling', () => {
		it('resets None tracking when valid gesture detected', () => {
			const state = createGestureTransitionState();
			const afterGesture = updateGestureTransitionPredictor('Open_Palm', 100, state, config);
			const afterNone = updateGestureTransitionPredictor('None', 150, afterGesture.state, config);

			expect(afterNone.state.noneEnteredAt).not.toBeNull();

			// New valid gesture
			const afterPointing = updateGestureTransitionPredictor(
				'Pointing_Up',
				200,
				afterNone.state,
				config,
			);

			expect(afterPointing.state.noneEnteredAt).toBeNull();
			expect(afterPointing.state.lastValidGesture).toBe('Pointing_Up');
			expect(afterPointing.msInNone).toBe(0);
		});

		it('confidence is 1.0 for valid gestures', () => {
			const state = createGestureTransitionState();
			const result = updateGestureTransitionPredictor('Open_Palm', 100, state, config);

			expect(result.confidence).toBe(1.0);
		});
	});
});

// ============================================================================
// TESTS: Factory
// ============================================================================

describe('createGestureTransitionPredictor factory', () => {
	let predictor: ReturnType<typeof createGestureTransitionPredictor>;

	beforeEach(() => {
		predictor = createGestureTransitionPredictor();
	});

	it('creates predictor with default config', () => {
		const config = predictor.getConfig();
		expect(config.noneDebounceMs).toBe(50); // Below this is transition noise
		expect(config.longNoneMs).toBe(200); // Above this is disengagement
		expect(config.typicalNoneDurationMs).toBe(75); // Sweet spot for transitions
	});

	it('accepts custom config', () => {
		const custom = createGestureTransitionPredictor({ noneDebounceMs: 100 });
		const config = custom.getConfig();
		expect(config.noneDebounceMs).toBe(100);
	});

	it('process() updates state', () => {
		predictor.process('Open_Palm', 100);
		expect(predictor.getLastValidGesture()).toBe('Open_Palm');
	});

	it('tracks None state correctly', () => {
		predictor.process('Open_Palm', 100);
		expect(predictor.isInNone()).toBe(false);

		predictor.process('None', 150);
		expect(predictor.isInNone()).toBe(true);

		predictor.process('Pointing_Up', 200);
		expect(predictor.isInNone()).toBe(false);
	});

	it('reset() returns to initial state', () => {
		predictor.process('Open_Palm', 100);
		predictor.process('None', 150);

		predictor.reset();

		expect(predictor.isInNone()).toBe(false);
		expect(predictor.getLastValidGesture()).toBe('None');
	});

	describe('Full gesture cycle simulation', () => {
		it('simulates Open_Palm → None → Pointing_Up → None → Open_Palm', () => {
			// Open_Palm (arming)
			let result = predictor.process('Open_Palm', 0);
			expect(result.likelyNext).toBe('Open_Palm');

			// Continue Open_Palm
			result = predictor.process('Open_Palm', 100);
			result = predictor.process('Open_Palm', 200);

			// Transition to None (starting click)
			result = predictor.process('None', 300);
			expect(result.likelyNext).toBe('Pointing_Up'); // Predicts click coming

			// None continues (finger moving)
			result = predictor.process('None', 350);
			expect(result.shouldDebounce).toBe(false); // 50ms > threshold

			// Pointing_Up arrives (click!)
			result = predictor.process('Pointing_Up', 380);
			expect(result.likelyNext).toBe('Pointing_Up');

			// Continue Pointing_Up (dragging)
			result = predictor.process('Pointing_Up', 500);
			result = predictor.process('Pointing_Up', 600);

			// Transition to None (ending click)
			result = predictor.process('None', 700);
			expect(result.likelyNext).toBe('Open_Palm'); // Predicts release

			// Open_Palm returns (release complete)
			result = predictor.process('Open_Palm', 780);
			expect(result.likelyNext).toBe('Open_Palm');
		});
	});
});

// ============================================================================
// TESTS: Secondary Gestures
// ============================================================================

describe('Secondary Gesture Predictions', () => {
	const config = DEFAULT_GESTURE_TRANSITION_CONFIG;

	it('predicts Open_Palm after Victory (pan end)', () => {
		const state = createGestureTransitionState();
		const afterVictory = updateGestureTransitionPredictor('Victory', 100, state, config);
		const afterNone = updateGestureTransitionPredictor('None', 180, afterVictory.state, config);

		expect(afterNone.likelyNext).toBe('Open_Palm');
	});

	it('predicts Open_Palm after Thumb_Up (zoom end)', () => {
		const state = createGestureTransitionState();
		const afterThumb = updateGestureTransitionPredictor('Thumb_Up', 100, state, config);
		const afterNone = updateGestureTransitionPredictor('None', 180, afterThumb.state, config);

		expect(afterNone.likelyNext).toBe('Open_Palm');
	});

	it('predicts Open_Palm after Thumb_Down (zoom end)', () => {
		const state = createGestureTransitionState();
		const afterThumb = updateGestureTransitionPredictor('Thumb_Down', 100, state, config);
		const afterNone = updateGestureTransitionPredictor('None', 180, afterThumb.state, config);

		expect(afterNone.likelyNext).toBe('Open_Palm');
	});
});
