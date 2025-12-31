/**
 * @fileoverview RED Tests - Tighter Palm Cone Arming Gate
 *
 * SPEC FROM USER NOTES (2025-12-30):
 * - Palm cone arming is TOO LOOSE - needs to be much harder
 * - User must point palm DIRECTLY toward camera to arm
 * - Threshold should be cos(32°) ≈ 0.85 (was 0.7 = cos(45°))
 * - Palm facing away = disarm = pointercancel event
 * - Palm orientation is for arming sequence AND commit gesture
 *
 * @module gesture/palm-orientation-gate.test
 * @hive V (Validate)
 * @tdd RED
 */

import * as fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

// ============================================================================
// CONSTANTS - Palm Cone Thresholds
// ============================================================================

/**
 * TIGHT palm cone threshold
 * cos(32°) ≈ 0.848 - palm must be almost directly facing camera
 * This is TIGHTER than the previous cos(45°) ≈ 0.707
 */
const PALM_CONE_THRESHOLD_TIGHT = 0.85;

/**
 * Disarm threshold - when palm faces away
 * cos(60°) = 0.5 - give some hysteresis
 */
const PALM_CONE_DISARM_THRESHOLD = 0.5;

// ============================================================================
// SCHEMAS
// ============================================================================

/** 3D vector for palm normal */
const Vector3 = z.object({
	x: z.number(),
	y: z.number(),
	z: z.number(),
});
type Vector3 = z.infer<typeof Vector3>;

/** Palm orientation state */
const PalmOrientationState = z.object({
	/** Is palm facing camera (dot product > threshold)? */
	isFacing: z.boolean(),
	/** Raw dot product with camera direction */
	dotProduct: z.number().min(-1).max(1),
	/** Angle from camera axis in radians */
	angleRad: z.number().min(0).max(Math.PI),
	/** Angle from camera axis in degrees */
	angleDeg: z.number().min(0).max(180),
	/** Palm normal vector */
	palmNormal: Vector3,
});
type PalmOrientationState = z.infer<typeof PalmOrientationState>;

/** Arming gate output */
const ArmingGateOutput = z.object({
	/** Can transition to ARMED state? */
	canArm: z.boolean(),
	/** Should disarm (palm away)? */
	shouldDisarm: z.boolean(),
	/** Duration palm has been facing (ms) */
	facingDurationMs: z.number().nonnegative(),
	/** Emit pointercancel? */
	emitPointerCancel: z.boolean(),
});
type ArmingGateOutput = z.infer<typeof ArmingGateOutput>;

// ============================================================================
// PORT INTERFACES - Hexagonal CDD
// ============================================================================

/**
 * PORT: Palm Normal Calculator
 * Calculates palm plane normal from landmarks
 */
interface PalmNormalCalculatorPort {
	/** Calculate palm normal from wrist and MCP landmarks */
	calculate(landmarks: {
		wrist: Vector3;
		indexMCP: Vector3;
		middleMCP: Vector3;
		pinkyMCP: Vector3;
	}): Vector3;
	/** Normalize vector to unit length */
	normalize(v: Vector3): Vector3;
}

/**
 * PORT: Palm Orientation Detector
 * Determines if palm is facing camera with tight threshold
 */
interface PalmOrientationDetectorPort {
	/** Update with new landmarks */
	update(palmNormal: Vector3, timestampMs: number): PalmOrientationState;
	/** Get current state */
	getState(): PalmOrientationState;
	/** Configure arm threshold */
	setArmThreshold(threshold: number): void;
	/** Configure disarm threshold */
	setDisarmThreshold(threshold: number): void;
	/** Reset state */
	reset(): void;
}

/**
 * PORT: Arming Gate
 * Controls ARMED state transitions based on palm orientation
 */
interface ArmingGatePort {
	/** Process palm orientation update */
	update(orientation: PalmOrientationState, timestampMs: number): ArmingGateOutput;
	/** Get current arming status */
	isArmed(): boolean;
	/** Force disarm */
	disarm(): void;
	/** Configure required facing duration for arming (ms) */
	setArmingDurationMs(ms: number): void;
}

// ============================================================================
// IMPORTS - Real implementations
// ============================================================================

import { ArmingGate } from './arming-gate.js';
import { PalmNormalCalculator } from './palm-normal-calculator.js';
import { PalmOrientationDetector } from './palm-orientation-detector.js';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/** Palm directly facing camera (z = -1) */
const PALM_FACING_CAMERA: Vector3 = { x: 0, y: 0, z: -1 };

/** Palm at 30° angle from camera (acceptable) */
const PALM_30_DEGREES: Vector3 = {
	x: Math.sin(Math.PI / 6), // ~0.5
	y: 0,
	z: -Math.cos(Math.PI / 6), // ~-0.866
};

/** Palm at 45° angle from camera (too loose - should fail) */
const PALM_45_DEGREES: Vector3 = {
	x: Math.sin(Math.PI / 4), // ~0.707
	y: 0,
	z: -Math.cos(Math.PI / 4), // ~-0.707
};

/** Palm at 60° angle - definitely facing away */
const PALM_60_DEGREES: Vector3 = {
	x: Math.sin(Math.PI / 3), // ~0.866
	y: 0,
	z: -Math.cos(Math.PI / 3), // ~-0.5
};

/** Palm facing away (z = +1) */
const PALM_FACING_AWAY: Vector3 = { x: 0, y: 0, z: 1 };

// ============================================================================
// RED TESTS: Palm Normal Calculator
// ============================================================================

describe('PalmNormalCalculator', () => {
	it('should calculate palm normal from MCP landmarks', () => {
		const calculator = new PalmNormalCalculator();

		const landmarks = {
			wrist: { x: 0.5, y: 0.7, z: 0 },
			indexMCP: { x: 0.6, y: 0.5, z: -0.1 },
			middleMCP: { x: 0.5, y: 0.45, z: -0.1 },
			pinkyMCP: { x: 0.35, y: 0.55, z: -0.05 },
		};

		const normal = calculator.calculate(landmarks);

		// Normal should be a unit vector (approximately)
		const magnitude = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
		expect(magnitude).toBeCloseTo(1, 2);
	});

	it('should normalize vectors correctly', () => {
		const calculator = new PalmNormalCalculator();

		const v = { x: 3, y: 4, z: 0 };
		const normalized = calculator.normalize(v);

		expect(normalized.x).toBeCloseTo(0.6, 5);
		expect(normalized.y).toBeCloseTo(0.8, 5);
		expect(normalized.z).toBeCloseTo(0, 5);
	});

	it('property: normalized vectors have magnitude ~1', () => {
		const calculator = new PalmNormalCalculator();

		fc.assert(
			fc.property(
				fc.double({ min: -10, max: 10, noNaN: true }),
				fc.double({ min: -10, max: 10, noNaN: true }),
				fc.double({ min: -10, max: 10, noNaN: true }),
				(x, y, z) => {
					// Skip zero vector
					if (x === 0 && y === 0 && z === 0) return true;

					const normalized = calculator.normalize({ x, y, z });
					const mag = Math.sqrt(normalized.x ** 2 + normalized.y ** 2 + normalized.z ** 2);
					return Math.abs(mag - 1) < 0.0001;
				},
			),
		);
	});
});

// ============================================================================
// RED TESTS: Palm Orientation Detector (TIGHT THRESHOLD)
// ============================================================================

describe('PalmOrientationDetector (TIGHT THRESHOLD)', () => {
	let detector: PalmOrientationDetectorPort;

	beforeEach(() => {
		detector = new PalmOrientationDetector({
			armThreshold: PALM_CONE_THRESHOLD_TIGHT, // 0.85 = cos(32°)
			disarmThreshold: PALM_CONE_DISARM_THRESHOLD, // 0.5
		});
	});

	it('should detect palm directly facing camera', () => {
		const state = detector.update(PALM_FACING_CAMERA, 0);

		expect(state.isFacing).toBe(true);
		expect(state.dotProduct).toBeCloseTo(1, 2);
		expect(state.angleDeg).toBeCloseTo(0, 1);
	});

	it('should accept palm at 30° angle (within tight threshold)', () => {
		const state = detector.update(PALM_30_DEGREES, 0);

		// cos(30°) ≈ 0.866 > 0.85 threshold
		expect(state.isFacing).toBe(true);
		expect(state.dotProduct).toBeCloseTo(0.866, 2);
	});

	it('should REJECT palm at 45° angle (TOO LOOSE)', () => {
		const state = detector.update(PALM_45_DEGREES, 0);

		// cos(45°) ≈ 0.707 < 0.85 threshold
		// This is the KEY TEST - 45° should fail with tight threshold
		expect(state.isFacing).toBe(false);
		expect(state.dotProduct).toBeCloseTo(0.707, 2);
	});

	it('should trigger disarm when palm faces away', () => {
		// First face camera
		detector.update(PALM_FACING_CAMERA, 0);

		// Then face away
		const state = detector.update(PALM_FACING_AWAY, 100);

		expect(state.isFacing).toBe(false);
		expect(state.dotProduct).toBeLessThan(PALM_CONE_DISARM_THRESHOLD);
	});

	it('should provide angle in degrees for debugging', () => {
		const state = detector.update(PALM_30_DEGREES, 0);

		expect(state.angleDeg).toBeCloseTo(30, 1);
		expect(state.angleRad).toBeCloseTo(Math.PI / 6, 2);
	});

	it('should allow configurable thresholds', () => {
		detector.setArmThreshold(0.9); // Even tighter - ~26°

		// 30° should now fail
		const state = detector.update(PALM_30_DEGREES, 0);
		expect(state.isFacing).toBe(false);
	});

	it('property: dotProduct always in [-1, 1]', () => {
		fc.assert(
			fc.property(
				fc.double({ min: -1, max: 1, noNaN: true }),
				fc.double({ min: -1, max: 1, noNaN: true }),
				fc.double({ min: -1, max: 1, noNaN: true }),
				(x, y, z) => {
					// Normalize to unit vector
					const mag = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
					if (mag < 0.001) return true; // Skip near-zero

					const normal = { x: x / mag, y: y / mag, z: z / mag };
					detector.reset();
					const state = detector.update(normal, 0);

					return state.dotProduct >= -1 && state.dotProduct <= 1;
				},
			),
		);
	});
});

// ============================================================================
// RED TESTS: Arming Gate
// ============================================================================

describe('ArmingGate (Palm-based Arming/Disarming)', () => {
	let detector: PalmOrientationDetectorPort;
	let gate: ArmingGatePort;

	beforeEach(() => {
		detector = new PalmOrientationDetector({
			armThreshold: PALM_CONE_THRESHOLD_TIGHT,
			disarmThreshold: PALM_CONE_DISARM_THRESHOLD,
		});
		gate = new ArmingGate({ armingDurationMs: 300 });
	});

	it('should arm after palm faces camera for 300ms', () => {
		// Palm facing for 300ms+ (need to exceed threshold)
		// At 30fps, 33ms per frame. Need 10 frames to exceed 300ms
		for (let t = 0; t <= 330; t += 33) {
			const orientation = detector.update(PALM_FACING_CAMERA, t);
			gate.update(orientation, t);
		}

		expect(gate.isArmed()).toBe(true);
	});

	it('should NOT arm if palm only faces for 200ms', () => {
		// Palm facing for only 200ms
		for (let t = 0; t < 200; t += 33) {
			const orientation = detector.update(PALM_FACING_CAMERA, t);
			gate.update(orientation, t);
		}

		expect(gate.isArmed()).toBe(false);
	});

	it('should emit pointercancel when disarming', () => {
		// First arm
		for (let t = 0; t <= 350; t += 33) {
			const orientation = detector.update(PALM_FACING_CAMERA, t);
			gate.update(orientation, t);
		}
		expect(gate.isArmed()).toBe(true);

		// Then face away
		const orientation = detector.update(PALM_FACING_AWAY, 400);
		const output = gate.update(orientation, 400);

		expect(output.shouldDisarm).toBe(true);
		expect(output.emitPointerCancel).toBe(true);
		expect(gate.isArmed()).toBe(false);
	});

	it('should maintain armed state through brief glitches', () => {
		// Arm
		for (let t = 0; t <= 350; t += 33) {
			const orientation = detector.update(PALM_FACING_CAMERA, t);
			gate.update(orientation, t);
		}
		expect(gate.isArmed()).toBe(true);

		// Brief glitch (45° - borderline)
		const glitchOrientation = detector.update(PALM_45_DEGREES, 400);
		gate.update(glitchOrientation, 400);

		// Should still be armed (hysteresis)
		expect(gate.isArmed()).toBe(true);
	});

	it('should track facing duration', () => {
		// Face for 150ms
		for (let t = 0; t <= 150; t += 33) {
			const orientation = detector.update(PALM_FACING_CAMERA, t);
			const output = gate.update(orientation, t);

			if (t >= 100) {
				expect(output.facingDurationMs).toBeGreaterThanOrEqual(100);
			}
		}
	});

	it('should reset facing duration when palm looks away', () => {
		// Face for 100ms
		for (let t = 0; t <= 100; t += 33) {
			const orientation = detector.update(PALM_FACING_CAMERA, t);
			gate.update(orientation, t);
		}

		// Look away
		const awayOrientation = detector.update(PALM_60_DEGREES, 133);
		const output = gate.update(awayOrientation, 133);

		expect(output.facingDurationMs).toBe(0);
	});

	it('should allow configurable arming duration', () => {
		gate.setArmingDurationMs(500);

		// 300ms should not be enough now
		for (let t = 0; t <= 350; t += 33) {
			const orientation = detector.update(PALM_FACING_CAMERA, t);
			gate.update(orientation, t);
		}

		expect(gate.isArmed()).toBe(false);
	});
});

// ============================================================================
// RED TESTS: Integration - Full Palm Arming Pipeline
// ============================================================================

describe('Palm Arming Integration', () => {
	it('should complete full arm → commit → disarm cycle', () => {
		const calculator = new PalmNormalCalculator();
		const detector = new PalmOrientationDetector({
			armThreshold: PALM_CONE_THRESHOLD_TIGHT,
			disarmThreshold: PALM_CONE_DISARM_THRESHOLD,
		});
		const gate = new ArmingGate({ armingDurationMs: 300 });

		// Simulate landmarks that produce palm facing camera
		const facingLandmarks = {
			wrist: { x: 0.5, y: 0.7, z: 0 },
			indexMCP: { x: 0.6, y: 0.5, z: -0.1 },
			middleMCP: { x: 0.5, y: 0.45, z: -0.1 },
			pinkyMCP: { x: 0.35, y: 0.55, z: -0.05 },
		};

		// 1. Arm (palm facing for 300ms)
		for (let t = 0; t <= 350; t += 33) {
			const normal = calculator.calculate(facingLandmarks);
			const orientation = detector.update(normal, t);
			gate.update(orientation, t);
		}
		expect(gate.isArmed()).toBe(true);

		// 2. User does commit gesture (still armed)
		expect(gate.isArmed()).toBe(true);

		// 3. Disarm (palm faces away)
		const awayNormal = PALM_FACING_AWAY;
		const disarmOrientation = detector.update(awayNormal, 500);
		const output = gate.update(disarmOrientation, 500);

		expect(output.emitPointerCancel).toBe(true);
		expect(gate.isArmed()).toBe(false);
	});
});
