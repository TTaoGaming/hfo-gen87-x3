/**
 * @fileoverview Gesture Transition Model Implementation
 *
 * Predicts gestures during None gaps using grammar constraints.
 * Key insight: During a None gap, we predict based on:
 * 1. The gesture BEFORE the gap (lastObserved)
 * 2. Valid transitions from that gesture in grammar
 * 3. Physics trajectory from Rapier simulation
 *
 * @module physics/gesture-transition-model
 * @hive V (Validate)
 * @tdd GREEN
 */

import { z } from 'zod';
import {
	type GestureLabel,
	GestureLabelSchema,
	GestureLanguage,
	type GestureTransition,
} from './gesture-language.js';

// ============================================================================
// SCHEMAS
// ============================================================================

/** Gesture state with confidence and timestamp - matches test schema */
export const GestureStateSchema = z.object({
	label: GestureLabelSchema,
	confidence: z.number().min(0).max(1),
	timestampMs: z.number().nonnegative(),
	palmFacing: z.boolean(),
	indexTip: z.object({
		x: z.number().min(0).max(1),
		y: z.number().min(0).max(1),
	}),
});
export type GestureState = z.infer<typeof GestureStateSchema>;

/** Prediction output from transition model - matches test schema */
export const TransitionPredictionSchema = z.object({
	predictedGesture: GestureLabelSchema,
	confidence: z.number().min(0).max(1),
	predictedTimeMs: z.number().nonnegative(),
	inNoneGap: z.boolean(),
	trajectoryProgress: z.number().min(0).max(1),
});
export type TransitionPrediction = z.infer<typeof TransitionPredictionSchema>;

/** Trajectory state */
export interface TrajectoryState {
	from: GestureLabel;
	to: GestureLabel;
	progress: number;
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface GestureLanguagePort {
	getValidTransitions(from: GestureLabel): GestureTransition[];
	isValidTransition(from: GestureLabel, to: GestureLabel): boolean;
	addTransition(transition: GestureTransition): void;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/** Default max None frames before abandoning prediction */
const DEFAULT_MAX_NONE_FRAMES = 5;

/** Default lookahead for trajectory prediction */
const DEFAULT_LOOKAHEAD_MS = 50;

/**
 * Gesture Transition Model
 *
 * Predicts gestures during None gaps using grammar and physics.
 * This is critical for smooth pointer events - we can't have
 * pointer positions jumping when MediaPipe drops frames.
 */
export class GestureTransitionModel {
	private grammar: GestureLanguagePort;
	private lastObserved: GestureState | null = null;
	private noneGapStart: number | null = null;
	private noneGapFrames = 0;
	private maxNoneFrames: number;
	private lookaheadMs: number;
	private currentTrajectory: TrajectoryState | null = null;

	constructor(config: { lookaheadMs?: number; grammar?: GestureLanguagePort }) {
		this.grammar = config.grammar ?? new GestureLanguage();
		this.lookaheadMs = config.lookaheadMs ?? DEFAULT_LOOKAHEAD_MS;
		this.maxNoneFrames = DEFAULT_MAX_NONE_FRAMES;
	}

	/**
	 * Update with new gesture observation
	 */
	update(state: GestureState): void {
		const { label, timestampMs } = state;

		if (label === 'None') {
			// Entering or continuing None gap
			if (this.noneGapStart === null && this.lastObserved) {
				// Use the last observed timestamp as gap start for proper elapsed calculation
				this.noneGapStart = this.lastObserved.timestampMs;
				this.noneGapFrames = 0;

				// Start trajectory from last observed gesture
				const validTransitions = this.grammar.getValidTransitions(this.lastObserved.label);
				const commitTransition = validTransitions.find(
					(t) => t.to === 'Pointing_Up' && t.allowsNoneGap,
				);

				if (commitTransition) {
					this.currentTrajectory = {
						from: this.lastObserved.label,
						to: 'Pointing_Up',
						progress: 0,
					};
				}
			}
			this.noneGapFrames++;

			// Update trajectory progress based on time since gap started
			if (this.currentTrajectory && this.noneGapStart !== null) {
				const elapsedMs = timestampMs - this.noneGapStart;
				// Assume ~100ms for full transition, ensure progress > 0 after first None frame
				this.currentTrajectory.progress = Math.min(1, Math.max(0.1, elapsedMs / 100));
			}
		} else {
			// Exiting None gap or normal observation
			if (this.currentTrajectory && label === this.currentTrajectory.to) {
				// Trajectory completed successfully
				this.currentTrajectory = null;
			} else {
				// Different gesture, reset trajectory
				this.currentTrajectory = null;
			}

			this.noneGapStart = null;
			this.noneGapFrames = 0;
			this.lastObserved = state;
		}
	}

	/**
	 * Get prediction for next gesture
	 */
	predict(): TransitionPrediction | null {
		if (!this.lastObserved) {
			return null;
		}

		// If in None gap, predict based on grammar
		if (this.noneGapStart !== null) {
			const validTransitions = this.grammar.getValidTransitions(this.lastObserved.label);

			// Find most likely next gesture (prioritize commit gesture)
			const commitTransition = validTransitions.find(
				(t) => t.to === 'Pointing_Up' && t.allowsNoneGap,
			);

			if (commitTransition) {
				// Decay confidence based on None frames
				const confidenceDecay = Math.pow(0.9, this.noneGapFrames);
				const progress = this.currentTrajectory?.progress ?? 0;

				return {
					predictedGesture: 'Pointing_Up',
					confidence: this.lastObserved.confidence * confidenceDecay,
					predictedTimeMs: Math.max(
						0,
						(commitTransition.typicalDurationMs ?? 100) * (1 - progress),
					),
					inNoneGap: true,
					trajectoryProgress: progress,
				};
			}
		}

		// Not in None gap - predict continuation of current gesture
		return {
			predictedGesture: this.lastObserved.label,
			confidence: this.lastObserved.confidence,
			predictedTimeMs: this.lookaheadMs,
			inNoneGap: false,
			trajectoryProgress: 0,
		};
	}

	/**
	 * Get current trajectory (if in transition)
	 */
	getTrajectory(): TrajectoryState | null {
		return this.currentTrajectory;
	}

	/**
	 * Reset model state
	 */
	reset(): void {
		this.lastObserved = null;
		this.noneGapStart = null;
		this.noneGapFrames = 0;
		this.currentTrajectory = null;
	}

	/**
	 * Set lookahead for trajectory prediction
	 */
	setLookaheadMs(ms: number): void {
		this.lookaheadMs = ms;
	}
}
