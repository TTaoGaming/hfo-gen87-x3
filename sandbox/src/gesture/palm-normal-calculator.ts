/**
 * @fileoverview Palm Normal Calculator Implementation
 *
 * Calculates palm plane normal from MediaPipe hand landmarks.
 * Uses wrist and MCP (metacarpophalangeal) joints to define the palm plane.
 *
 * @module gesture/palm-normal-calculator
 * @hive V (Validate)
 * @tdd GREEN
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

/** 3D vector */
export const Vector3Schema = z.object({
	x: z.number(),
	y: z.number(),
	z: z.number(),
});
export type Vector3 = z.infer<typeof Vector3Schema>;

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Palm Normal Calculator
 *
 * Calculates the palm plane normal using cross product of vectors
 * formed by wrist, index MCP, and pinky MCP landmarks.
 */
export class PalmNormalCalculator {
	/**
	 * Calculate palm normal from hand landmarks
	 *
	 * The palm plane is defined by:
	 * - Vector A: wrist → index MCP
	 * - Vector B: wrist → pinky MCP
	 * - Normal: A × B (cross product)
	 *
	 * @param landmarks - Wrist and MCP joint positions
	 * @returns Normalized palm normal vector
	 */
	calculate(landmarks: {
		wrist: Vector3;
		indexMCP: Vector3;
		middleMCP: Vector3;
		pinkyMCP: Vector3;
	}): Vector3 {
		const { wrist, indexMCP, pinkyMCP } = landmarks;

		// Vector A: wrist → index MCP
		const a: Vector3 = {
			x: indexMCP.x - wrist.x,
			y: indexMCP.y - wrist.y,
			z: indexMCP.z - wrist.z,
		};

		// Vector B: wrist → pinky MCP
		const b: Vector3 = {
			x: pinkyMCP.x - wrist.x,
			y: pinkyMCP.y - wrist.y,
			z: pinkyMCP.z - wrist.z,
		};

		// Cross product: A × B
		const cross: Vector3 = {
			x: a.y * b.z - a.z * b.y,
			y: a.z * b.x - a.x * b.z,
			z: a.x * b.y - a.y * b.x,
		};

		// Normalize to unit length
		return this.normalize(cross);
	}

	/**
	 * Normalize vector to unit length
	 */
	normalize(v: Vector3): Vector3 {
		const magnitude = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

		// Avoid division by zero
		if (magnitude === 0) {
			return { x: 0, y: 0, z: -1 }; // Default facing camera
		}

		return {
			x: v.x / magnitude,
			y: v.y / magnitude,
			z: v.z / magnitude,
		};
	}
}
