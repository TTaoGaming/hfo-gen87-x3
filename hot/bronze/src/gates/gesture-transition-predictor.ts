/**
 * Gesture Transition Predictor - None as Timing Signal
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Port 0 (SENSE)
 *
 * KEY INSIGHT (TTao): MediaPipe transitions between gestures through None.
 * The sequence is: Open_Palm → None → Pointing_Up → None → Open_Palm (cyclic)
 *
 * This None is NOT an error - it's a ~50-100ms transition window where
 * MediaPipe confidence drops during finger movement.
 *
 * PREDICTIVE OPPORTUNITY:
 * - When gesture = None and lastValid = Open_Palm → likely transitioning TO Pointing_Up
 * - When gesture = None and lastValid = Pointing_Up → likely transitioning TO Open_Palm
 *
 * @source Memory: FSM_Correct_Design_20251231
 * @source TTao observation (empirical)
 */
import { z } from 'zod';
import type { GestureLabel } from '../contracts/schemas.js';

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

export const GestureTransitionConfigSchema = z.object({
	/** Ignore None gesture if held for less than this (transition noise) */
	noneDebounceMs: z.number().min(0).max(500).default(80),

	/** If None lasts longer than this, it's genuine disengagement */
	longNoneMs: z.number().min(50).max(1000).default(200),

	/** Typical None duration during gesture transitions */
	typicalNoneDurationMs: z.number().min(20).max(150).default(75),
});

export type GestureTransitionConfig = z.infer<typeof GestureTransitionConfigSchema>;

export const DEFAULT_GESTURE_TRANSITION_CONFIG: GestureTransitionConfig = {
	noneDebounceMs: 50, // Below this is transition noise (very short None)
	longNoneMs: 200, // Above this is genuine disengagement
	typicalNoneDurationMs: 75, // Sweet spot for gesture transitions
};

// ============================================================================
// PREDICTOR STATE
// ============================================================================

export interface GestureTransitionState {
	/** Last valid (non-None) gesture */
	lastValidGesture: GestureLabel;

	/** Timestamp when we entered None state (null if not in None) */
	noneEnteredAt: number | null;

	/** Timestamp of last valid gesture */
	lastValidGestureTs: number;

	/** Count of consecutive None frames */
	noneFrameCount: number;
}

export function createGestureTransitionState(): GestureTransitionState {
	return {
		lastValidGesture: 'None',
		noneEnteredAt: null,
		lastValidGestureTs: 0,
		noneFrameCount: 0,
	};
}

// ============================================================================
// PREDICTION RESULT
// ============================================================================

export interface GestureTransitionPrediction {
	/** The gesture we predict is coming next */
	likelyNext: GestureLabel;

	/** Confidence in prediction (0-1, higher as None duration approaches typical) */
	confidence: number;

	/** How long we've been in None state (ms) */
	msInNone: number;

	/** Is this a genuine disengagement (long None)? */
	isDisengagement: boolean;

	/** Should we debounce this None (too short)? */
	shouldDebounce: boolean;

	/** Updated state */
	state: GestureTransitionState;
}

// ============================================================================
// GESTURE CYCLE PREDICTION
// ============================================================================

/**
 * Predict next gesture based on cyclic pattern
 *
 * The primary cycle is: Open_Palm ↔ Pointing_Up
 * (Other gestures are secondary and not part of main prediction)
 *
 * @param lastValidGesture The last non-None gesture
 * @returns Predicted next gesture
 */
function predictNextGesture(lastValidGesture: GestureLabel): GestureLabel {
	switch (lastValidGesture) {
		case 'Open_Palm':
			// Open_Palm → None → Pointing_Up (starting a click)
			return 'Pointing_Up';

		case 'Pointing_Up':
			// Pointing_Up → None → Open_Palm (ending a click)
			return 'Open_Palm';

		case 'Victory':
			// Victory → None → Open_Palm (ending pan)
			return 'Open_Palm';

		case 'Thumb_Up':
		case 'Thumb_Down':
			// Zoom → None → Open_Palm (ending zoom)
			return 'Open_Palm';

		default:
			// Unknown or Closed_Fist → default to Open_Palm
			return 'Open_Palm';
	}
}

/**
 * Calculate prediction confidence based on None duration
 *
 * Confidence peaks at typicalNoneDuration and drops off for
 * very short (noise) or very long (disengagement) durations.
 *
 * @param msInNone Milliseconds spent in None state
 * @param config Configuration with timing thresholds
 * @returns Confidence 0-1
 */
function calculateConfidence(msInNone: number, config: GestureTransitionConfig): number {
	if (msInNone < config.noneDebounceMs) {
		// Too short - likely noise, low confidence
		return (msInNone / config.noneDebounceMs) * 0.3;
	}

	if (msInNone >= config.longNoneMs) {
		// Too long - likely disengagement, confidence drops
		const overTime = msInNone - config.longNoneMs;
		const decay = Math.exp(-overTime / 200);
		return 0.3 * decay;
	}

	// In the sweet spot - confidence based on proximity to typical duration
	const distFromTypical = Math.abs(msInNone - config.typicalNoneDurationMs);
	const range = config.longNoneMs - config.noneDebounceMs;
	const normalizedDist = distFromTypical / range;

	// Gaussian-like curve peaking at typical duration
	return 0.5 + 0.5 * Math.exp(-2 * normalizedDist * normalizedDist);
}

// ============================================================================
// PREDICTOR FUNCTION
// ============================================================================

/**
 * Update gesture transition predictor with new frame
 *
 * @param currentGesture Current gesture from MediaPipe
 * @param currentTs Current timestamp in ms
 * @param currentState Previous predictor state
 * @param config Configuration
 * @returns Prediction result with updated state
 */
export function updateGestureTransitionPredictor(
	currentGesture: GestureLabel,
	currentTs: number,
	currentState: GestureTransitionState,
	config: GestureTransitionConfig,
): GestureTransitionPrediction {
	if (currentGesture === 'None') {
		// Entering or continuing None state
		// noneEnteredAt tracks when we FIRST entered None (after a valid gesture)
		// If we're just entering None, use the lastValidGestureTs as our reference point
		const noneEnteredAt = currentState.noneEnteredAt ?? currentState.lastValidGestureTs;
		const msInNone = currentTs - noneEnteredAt;

		const shouldDebounce = msInNone < config.noneDebounceMs;
		const isDisengagement = msInNone >= config.longNoneMs;

		const likelyNext = predictNextGesture(currentState.lastValidGesture);
		const confidence = calculateConfidence(msInNone, config);

		return {
			likelyNext,
			confidence,
			msInNone,
			isDisengagement,
			shouldDebounce,
			state: {
				lastValidGesture: currentState.lastValidGesture,
				noneEnteredAt,
				lastValidGestureTs: currentState.lastValidGestureTs,
				noneFrameCount: currentState.noneFrameCount + 1,
			},
		};
	} else {
		// Valid gesture - reset None tracking
		return {
			likelyNext: currentGesture,
			confidence: 1.0,
			msInNone: 0,
			isDisengagement: false,
			shouldDebounce: false,
			state: {
				lastValidGesture: currentGesture,
				noneEnteredAt: null,
				lastValidGestureTs: currentTs,
				noneFrameCount: 0,
			},
		};
	}
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a gesture transition predictor
 *
 * @param config Configuration (optional)
 * @returns Stateful predictor
 */
export function createGestureTransitionPredictor(config: Partial<GestureTransitionConfig> = {}) {
	const fullConfig = { ...DEFAULT_GESTURE_TRANSITION_CONFIG, ...config };
	let state = createGestureTransitionState();

	return {
		/**
		 * Process frame and get prediction
		 */
		process(gesture: GestureLabel, ts: number): GestureTransitionPrediction {
			const result = updateGestureTransitionPredictor(gesture, ts, state, fullConfig);
			state = result.state;
			return result;
		},

		/**
		 * Reset predictor to initial state
		 */
		reset(): void {
			state = createGestureTransitionState();
		},

		/**
		 * Get current state (for debugging)
		 */
		getState(): GestureTransitionState {
			return { ...state };
		},

		/**
		 * Get configuration (for debugging)
		 */
		getConfig(): GestureTransitionConfig {
			return { ...fullConfig };
		},

		/**
		 * Get the last valid gesture
		 */
		getLastValidGesture(): GestureLabel {
			return state.lastValidGesture;
		},

		/**
		 * Check if currently in None state
		 */
		isInNone(): boolean {
			return state.noneEnteredAt !== null;
		},
	};
}

export type GestureTransitionPredictor = ReturnType<typeof createGestureTransitionPredictor>;
