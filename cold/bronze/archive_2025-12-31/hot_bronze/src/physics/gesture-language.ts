/**
 * @fileoverview Gesture Language Grammar Implementation
 *
 * Defines valid gesture transitions in the HFO gesture vocabulary.
 * Key insight: MediaPipe gestures transition through "None" between gestures.
 *
 * Example: Open_Palm → None → Pointing_Up (commit gesture)
 *
 * @module physics/gesture-language
 * @hive V (Validate)
 * @tdd GREEN
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

/** MediaPipe gesture labels */
export const GestureLabelSchema = z.enum([
	'Open_Palm',
	'Pointing_Up',
	'Victory',
	'Thumb_Up',
	'Thumb_Down',
	'Closed_Fist',
	'ILoveYou',
	'None',
]);
export type GestureLabel = z.infer<typeof GestureLabelSchema>;

/** Gesture transition definition */
export const GestureTransitionSchema = z.object({
	from: GestureLabelSchema,
	to: GestureLabelSchema,
	expectedNoneFrames: z.number().nonnegative(),
	typicalDurationMs: z.number().positive(),
	allowsNoneGap: z.boolean(),
});
export type GestureTransition = z.infer<typeof GestureTransitionSchema>;

// ============================================================================
// DEFAULT TRANSITIONS (HFO Gesture Language)
// ============================================================================

/**
 * Default HFO gesture transitions
 *
 * These define the valid gesture sequences in our vocabulary.
 * Key insight: Most transitions go through None for 1-3 frames.
 */
export const DEFAULT_TRANSITIONS: GestureTransition[] = [
	// Arming sequence: Open_Palm → Armed state
	{
		from: 'None',
		to: 'Open_Palm',
		expectedNoneFrames: 0,
		typicalDurationMs: 100,
		allowsNoneGap: false,
	},

	// Commit gesture: Open_Palm → None → Pointing_Up
	{
		from: 'Open_Palm',
		to: 'None',
		expectedNoneFrames: 0,
		typicalDurationMs: 50,
		allowsNoneGap: false,
	},
	{
		from: 'None',
		to: 'Pointing_Up',
		expectedNoneFrames: 0,
		typicalDurationMs: 100,
		allowsNoneGap: false,
	},
	{
		from: 'Open_Palm',
		to: 'Pointing_Up',
		expectedNoneFrames: 2, // Typically 2 None frames between
		typicalDurationMs: 150,
		allowsNoneGap: true,
	},

	// Release: Pointing_Up → None → Open_Palm
	{
		from: 'Pointing_Up',
		to: 'None',
		expectedNoneFrames: 0,
		typicalDurationMs: 50,
		allowsNoneGap: false,
	},
	{
		from: 'Pointing_Up',
		to: 'Open_Palm',
		expectedNoneFrames: 2,
		typicalDurationMs: 150,
		allowsNoneGap: true,
	},

	// Drag: Open_Palm → Closed_Fist
	{
		from: 'Open_Palm',
		to: 'Closed_Fist',
		expectedNoneFrames: 1,
		typicalDurationMs: 200,
		allowsNoneGap: true,
	},
	{
		from: 'Closed_Fist',
		to: 'Open_Palm',
		expectedNoneFrames: 1,
		typicalDurationMs: 200,
		allowsNoneGap: true,
	},

	// Scroll: Open_Palm → Victory (two fingers)
	{
		from: 'Open_Palm',
		to: 'Victory',
		expectedNoneFrames: 2,
		typicalDurationMs: 200,
		allowsNoneGap: true,
	},
	{
		from: 'Victory',
		to: 'Open_Palm',
		expectedNoneFrames: 2,
		typicalDurationMs: 200,
		allowsNoneGap: true,
	},

	// Common: Any → None (tracking loss)
	{
		from: 'Open_Palm',
		to: 'None',
		expectedNoneFrames: 0,
		typicalDurationMs: 33,
		allowsNoneGap: false,
	},
	{
		from: 'Closed_Fist',
		to: 'None',
		expectedNoneFrames: 0,
		typicalDurationMs: 33,
		allowsNoneGap: false,
	},
	{
		from: 'Victory',
		to: 'None',
		expectedNoneFrames: 0,
		typicalDurationMs: 33,
		allowsNoneGap: false,
	},

	// Self-transitions (staying in same gesture)
	{
		from: 'Open_Palm',
		to: 'Open_Palm',
		expectedNoneFrames: 0,
		typicalDurationMs: 33,
		allowsNoneGap: false,
	},
	{
		from: 'Pointing_Up',
		to: 'Pointing_Up',
		expectedNoneFrames: 0,
		typicalDurationMs: 33,
		allowsNoneGap: false,
	},
	{
		from: 'Closed_Fist',
		to: 'Closed_Fist',
		expectedNoneFrames: 0,
		typicalDurationMs: 33,
		allowsNoneGap: false,
	},
	{
		from: 'None',
		to: 'None',
		expectedNoneFrames: 0,
		typicalDurationMs: 33,
		allowsNoneGap: false,
	},
];

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Gesture Language Grammar
 *
 * Defines valid transitions between gestures in the HFO vocabulary.
 * Used to constrain predictions - we only predict gestures that are
 * valid next steps in our grammar.
 */
export class GestureLanguage {
	private transitions: Map<GestureLabel, GestureTransition[]>;

	constructor() {
		this.transitions = new Map();

		// Initialize with default transitions
		for (const t of DEFAULT_TRANSITIONS) {
			this.addTransition(t);
		}
	}

	/**
	 * Get valid transitions from a gesture
	 */
	getValidTransitions(from: GestureLabel): GestureTransition[] {
		return this.transitions.get(from) ?? [];
	}

	/**
	 * Check if transition is valid in grammar
	 */
	isValidTransition(from: GestureLabel, to: GestureLabel): boolean {
		const validTransitions = this.getValidTransitions(from);
		return validTransitions.some((t) => t.to === to);
	}

	/**
	 * Add custom transition rule
	 */
	addTransition(transition: GestureTransition): void {
		const existing = this.transitions.get(transition.from) ?? [];

		// Check if this exact transition already exists
		const exists = existing.some(
			(t) => t.to === transition.to && t.expectedNoneFrames === transition.expectedNoneFrames,
		);

		if (!exists) {
			existing.push(transition);
			this.transitions.set(transition.from, existing);
		}
	}

	/**
	 * Get all gestures
	 */
	getAllGestures(): GestureLabel[] {
		return GestureLabelSchema.options;
	}

	/**
	 * Get transition between two gestures (if valid)
	 */
	getTransition(from: GestureLabel, to: GestureLabel): GestureTransition | null {
		const transitions = this.getValidTransitions(from);
		return transitions.find((t) => t.to === to) ?? null;
	}
}
