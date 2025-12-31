/**
 * @fileoverview Arming Gate Implementation
 *
 * Controls ARMED state transitions based on palm orientation.
 * Emits pointercancel when palm faces away (disarm condition).
 *
 * SPEC: Palm must face camera for armingDurationMs before arming.
 * Once armed, stays armed (sticky) until disarm condition.
 *
 * @module gesture/arming-gate
 * @hive V (Validate)
 * @tdd GREEN
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

export const Vector3Schema = z.object({
	x: z.number(),
	y: z.number(),
	z: z.number(),
});

export const PalmOrientationStateSchema = z.object({
	isFacing: z.boolean(),
	dotProduct: z.number().min(-1).max(1),
	angleRad: z.number().min(0).max(Math.PI),
	angleDeg: z.number().min(0).max(180),
	palmNormal: Vector3Schema,
});
export type PalmOrientationState = z.infer<typeof PalmOrientationStateSchema>;

export const ArmingGateOutputSchema = z.object({
	canArm: z.boolean(),
	shouldDisarm: z.boolean(),
	facingDurationMs: z.number().nonnegative(),
	emitPointerCancel: z.boolean(),
});
export type ArmingGateOutput = z.infer<typeof ArmingGateOutputSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default arming duration: 300ms */
export const DEFAULT_ARMING_DURATION_MS = 300;

/** Default disarm threshold: cos(60°) = 0.5 */
export const DEFAULT_DISARM_THRESHOLD = 0.5;

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export interface ArmingGateConfig {
	armingDurationMs: number;
	disarmThreshold?: number;
}

/**
 * Arming Gate
 *
 * Manages the ARMED state for gesture commit sequence.
 * Palm must face camera for specified duration to arm.
 * Once armed, stays armed (sticky) until palm faces away.
 */
export class ArmingGate {
	private armingDurationMs: number;
	private disarmThreshold: number;
	private armed = false;
	private facingStartMs: number | null = null;
	private lastTimestampMs = 0;
	private wasArmed = false;

	constructor(config: ArmingGateConfig) {
		this.armingDurationMs = config.armingDurationMs;
		this.disarmThreshold = config.disarmThreshold ?? DEFAULT_DISARM_THRESHOLD;
	}

	/**
	 * Process palm orientation update
	 */
	update(orientation: PalmOrientationState, timestampMs: number): ArmingGateOutput {
		this.lastTimestampMs = timestampMs;
		this.wasArmed = this.armed;

		let canArm = false;
		let shouldDisarm = false;
		let emitPointerCancel = false;
		let facingDurationMs = 0;

		if (orientation.isFacing) {
			// Palm is facing camera
			if (this.facingStartMs === null) {
				this.facingStartMs = timestampMs;
			}

			facingDurationMs = timestampMs - this.facingStartMs;

			// Check if we can arm (duration met)
			if (facingDurationMs >= this.armingDurationMs) {
				canArm = true;
				this.armed = true;
			}
		} else {
			// Palm not facing camera directly (below arm threshold)
			this.facingStartMs = null;

			// Check if we should disarm (below disarm threshold)
			if (orientation.dotProduct < this.disarmThreshold) {
				if (this.armed) {
					shouldDisarm = true;
					emitPointerCancel = true;
					this.armed = false;
				}
			}
			// If between arm and disarm threshold, stay in current state (hysteresis)
		}

		return {
			canArm,
			shouldDisarm,
			facingDurationMs,
			emitPointerCancel,
		};
	}

	/**
	 * Check if currently armed
	 */
	isArmed(): boolean {
		return this.armed;
	}

	/**
	 * Check if state just changed from armed to disarmed
	 */
	justDisarmed(): boolean {
		return this.wasArmed && !this.armed;
	}

	/**
	 * Force disarm
	 */
	disarm(): void {
		this.armed = false;
		this.facingStartMs = null;
	}

	/**
	 * Configure arming duration
	 */
	setArmingDurationMs(ms: number): void {
		this.armingDurationMs = ms;
	}

	/**
	 * Configure disarm threshold
	 */
	setDisarmThreshold(threshold: number): void {
		this.disarmThreshold = threshold;
	}

	/**
	 * Reset to initial state
	 */
	reset(): void {
		this.armed = false;
		this.facingStartMs = null;
		this.wasArmed = false;
	}
}
