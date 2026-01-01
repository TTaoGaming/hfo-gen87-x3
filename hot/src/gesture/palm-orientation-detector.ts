/**
 * @fileoverview Palm Orientation Detector Implementation
 *
 * Detects if palm is facing camera using TIGHT threshold.
 * SPEC: cos(32°) ≈ 0.85 for arming, cos(60°) ≈ 0.5 for disarm
 *
 * @module gesture/palm-orientation-detector
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
export type Vector3 = z.infer<typeof Vector3Schema>;

export const PalmOrientationStateSchema = z.object({
	isFacing: z.boolean(),
	dotProduct: z.number().min(-1).max(1),
	angleRad: z.number().min(0).max(Math.PI),
	angleDeg: z.number().min(0).max(180),
	palmNormal: Vector3Schema,
});
export type PalmOrientationState = z.infer<typeof PalmOrientationStateSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

/** Camera direction (looking into screen) */
const CAMERA_DIRECTION: Vector3 = { x: 0, y: 0, z: -1 };

/** Default tight threshold: cos(32°) ≈ 0.848 */
export const DEFAULT_ARM_THRESHOLD = 0.85;

/** Default disarm threshold: cos(60°) = 0.5 */
export const DEFAULT_DISARM_THRESHOLD = 0.5;

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export interface PalmOrientationDetectorConfig {
	armThreshold: number;
	disarmThreshold: number;
}

/**
 * Palm Orientation Detector
 *
 * Determines if palm is facing camera using dot product comparison.
 * Uses TIGHT threshold (cos 32°) to reduce false positives.
 */
export class PalmOrientationDetector {
	private armThreshold: number;
	private disarmThreshold: number;
	private currentState: PalmOrientationState;

	constructor(config: PalmOrientationDetectorConfig) {
		this.armThreshold = config.armThreshold;
		this.disarmThreshold = config.disarmThreshold;
		this.currentState = this.createDefaultState();
	}

	/**
	 * Update with new palm normal
	 */
	update(palmNormal: Vector3, _timestampMs: number): PalmOrientationState {
		// Dot product with camera direction
		// Camera looks into screen (0, 0, -1)
		// Palm facing camera has normal (0, 0, -1)
		// dot((0,0,-1), (0,0,-1)) = 1 (perfectly aligned)
		const dotProduct =
			palmNormal.x * CAMERA_DIRECTION.x +
			palmNormal.y * CAMERA_DIRECTION.y +
			palmNormal.z * CAMERA_DIRECTION.z;

		// Convert to angle (0 = aligned, π = opposite)
		const angleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
		const angleDeg = (angleRad * 180) / Math.PI;

		// Is facing camera if dot product exceeds threshold
		// Note: We compare with threshold for palm facing camera
		// Palm facing camera: normal ≈ (0, 0, -1), dot product ≈ 1
		const isFacing = dotProduct >= this.armThreshold;

		this.currentState = {
			isFacing,
			dotProduct,
			angleRad,
			angleDeg,
			palmNormal,
		};

		return this.currentState;
	}

	/**
	 * Get current state
	 */
	getState(): PalmOrientationState {
		return this.currentState;
	}

	/**
	 * Set arm threshold
	 */
	setArmThreshold(threshold: number): void {
		this.armThreshold = threshold;
	}

	/**
	 * Set disarm threshold
	 */
	setDisarmThreshold(threshold: number): void {
		this.disarmThreshold = threshold;
	}

	/**
	 * Check if below disarm threshold
	 */
	isBelowDisarmThreshold(): boolean {
		return this.currentState.dotProduct < this.disarmThreshold;
	}

	/**
	 * Reset state
	 */
	reset(): void {
		this.currentState = this.createDefaultState();
	}

	private createDefaultState(): PalmOrientationState {
		return {
			isFacing: false,
			dotProduct: 0,
			angleRad: Math.PI / 2,
			angleDeg: 90,
			palmNormal: { x: 0, y: 0, z: 0 },
		};
	}
}
