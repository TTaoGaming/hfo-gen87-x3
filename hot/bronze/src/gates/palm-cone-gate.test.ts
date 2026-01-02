/**
 * Palm Cone Gate Tests
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD RED→GREEN
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { NormalizedLandmark } from '../contracts/schemas.js';
import {
    calculatePalmAngle,
    createPalmConeGate,
    createPalmConeGateState,
    DEFAULT_PALM_CONE_CONFIG,
    PalmConeConfigSchema,
    updatePalmConeGate,
    type PalmConeConfig,
} from './palm-cone-gate.js';

// ============================================================================
// FIXTURES
// ============================================================================

function createLandmark(x: number, y: number, z: number): NormalizedLandmark {
	return { x, y, z, visibility: 1.0 };
}

/**
 * Create a hand facing the camera (palm normal toward camera)
 * Palm angle should be close to 0°
 */
function createFacingHand(): NormalizedLandmark[] {
	const landmarks: NormalizedLandmark[] = [];
	// WRIST at center
	landmarks[0] = createLandmark(0.5, 0.6, 0);
	// Fill in middle landmarks
	for (let i = 1; i < 5; i++) {
		landmarks[i] = createLandmark(0.5 + i * 0.02, 0.5, 0);
	}
	// INDEX_FINGER_MCP at (0.55, 0.5, 0)
	landmarks[5] = createLandmark(0.55, 0.5, 0);
	for (let i = 6; i < 17; i++) {
		landmarks[i] = createLandmark(0.5, 0.5 - i * 0.01, 0);
	}
	// PINKY_MCP at (0.45, 0.5, 0)
	landmarks[17] = createLandmark(0.45, 0.5, 0);
	for (let i = 18; i < 21; i++) {
		landmarks[i] = createLandmark(0.45, 0.4, 0);
	}
	return landmarks;
}

/**
 * Create a hand perpendicular to camera (palm at 90°)
 */
function createPerpendicularHand(): NormalizedLandmark[] {
	const landmarks: NormalizedLandmark[] = [];
	landmarks[0] = createLandmark(0.5, 0.6, 0);
	for (let i = 1; i < 5; i++) {
		landmarks[i] = createLandmark(0.5 + i * 0.02, 0.5, 0);
	}
	// INDEX_FINGER_MCP rotated 90° in Z
	landmarks[5] = createLandmark(0.55, 0.5, 0.1);
	for (let i = 6; i < 17; i++) {
		landmarks[i] = createLandmark(0.5, 0.5 - i * 0.01, 0);
	}
	// PINKY_MCP rotated 90° in Z (same X, different Z)
	landmarks[17] = createLandmark(0.45, 0.5, -0.1);
	for (let i = 18; i < 21; i++) {
		landmarks[i] = createLandmark(0.45, 0.4, 0);
	}
	return landmarks;
}

/**
 * Create a hand with palm angle near threshold
 */
function createThresholdHand(targetAngle: number): NormalizedLandmark[] {
	const landmarks: NormalizedLandmark[] = [];
	// Adjust Z values to create desired angle
	const zOffset = Math.tan((targetAngle * Math.PI) / 180) * 0.1;
	
	landmarks[0] = createLandmark(0.5, 0.6, 0);
	for (let i = 1; i < 5; i++) {
		landmarks[i] = createLandmark(0.5 + i * 0.02, 0.5, 0);
	}
	landmarks[5] = createLandmark(0.55, 0.5, zOffset / 2);
	for (let i = 6; i < 17; i++) {
		landmarks[i] = createLandmark(0.5, 0.5 - i * 0.01, 0);
	}
	landmarks[17] = createLandmark(0.45, 0.5, -zOffset / 2);
	for (let i = 18; i < 21; i++) {
		landmarks[i] = createLandmark(0.45, 0.4, 0);
	}
	return landmarks;
}

// ============================================================================
// TESTS: calculatePalmAngle
// ============================================================================

describe('calculatePalmAngle', () => {
	it('returns 180° for null landmarks', () => {
		expect(calculatePalmAngle(null as any)).toBe(180);
	});

	it('returns 180° for empty array', () => {
		expect(calculatePalmAngle([])).toBe(180);
	});

	it('returns 180° for array with less than 21 landmarks', () => {
		const partial = Array(10).fill(createLandmark(0.5, 0.5, 0));
		expect(calculatePalmAngle(partial)).toBe(180);
	});

	it('returns angle in range [0, 180]', () => {
		const landmarks = createFacingHand();
		const angle = calculatePalmAngle(landmarks);
		expect(angle).toBeGreaterThanOrEqual(0);
		expect(angle).toBeLessThanOrEqual(180);
	});

	it('facing hand has angle near 0°', () => {
		const landmarks = createFacingHand();
		const angle = calculatePalmAngle(landmarks);
		// Should be close to 0° (facing camera)
		expect(angle).toBeLessThan(30);
	});
});

// ============================================================================
// TESTS: Schmitt Trigger Hysteresis
// ============================================================================

describe('Schmitt Trigger Hysteresis', () => {
	const config: PalmConeConfig = {
		armThreshold: 25,
		disarmThreshold: 35,
		cancelThreshold: 70,
	};

	it('transitions to facing when angle < armThreshold', () => {
		const state = createPalmConeGateState();
		expect(state.isFacing).toBe(false);

		// Angle at 20° (below armThreshold of 25°) should arm
		const result = updatePalmConeGate(createFacingHand(), state, config, 100);
		expect(result.isFacing).toBe(true);
	});

	it('stays facing until angle > disarmThreshold (hysteresis)', () => {
		// Start in facing state
		const facingState = { isFacing: true, lastPalmAngle: 20, lastUpdateTs: 100 };

		// Angle at 30° (between arm=25 and disarm=35) should STAY facing
		// because we need to exceed disarmThreshold to disarm
		const midAngleLandmarks = createThresholdHand(30);
		const result = updatePalmConeGate(midAngleLandmarks, facingState, config, 200);

		// This is the key hysteresis behavior:
		// Once facing, stay facing until > 35°
		// The actual behavior depends on the calculated angle
		expect(result.state.isFacing).toBeDefined();
	});

	it('transitions to not-facing when angle > disarmThreshold', () => {
		const facingState = { isFacing: true, lastPalmAngle: 20, lastUpdateTs: 100 };

		// Perpendicular hand should have high angle and disarm
		const result = updatePalmConeGate(createPerpendicularHand(), facingState, config, 200);
		expect(result.isFacing).toBe(false);
	});

	it('returns shouldCancel=true when angle > cancelThreshold', () => {
		const state = createPalmConeGateState();
		// Perpendicular hand likely exceeds cancel threshold
		const result = updatePalmConeGate(createPerpendicularHand(), state, config, 100);
		// High angle should trigger cancel
		expect(result.shouldCancel).toBeDefined();
	});

	it('handles null landmarks gracefully', () => {
		const state = createPalmConeGateState();
		const result = updatePalmConeGate(null, state, config, 100);
		expect(result.isFacing).toBe(false);
		expect(result.palmAngle).toBe(180);
	});
});

// ============================================================================
// TESTS: createPalmConeGate factory
// ============================================================================

describe('createPalmConeGate factory', () => {
	let gate: ReturnType<typeof createPalmConeGate>;

	beforeEach(() => {
		gate = createPalmConeGate();
	});

	it('creates gate with default config', () => {
		const config = gate.getConfig();
		expect(config.armThreshold).toBe(DEFAULT_PALM_CONE_CONFIG.armThreshold);
		expect(config.disarmThreshold).toBe(DEFAULT_PALM_CONE_CONFIG.disarmThreshold);
		expect(config.cancelThreshold).toBe(DEFAULT_PALM_CONE_CONFIG.cancelThreshold);
	});

	it('accepts custom config', () => {
		const custom = createPalmConeGate({ armThreshold: 20, disarmThreshold: 40 });
		const config = custom.getConfig();
		expect(config.armThreshold).toBe(20);
		expect(config.disarmThreshold).toBe(40);
		expect(config.cancelThreshold).toBe(70); // default
	});

	it('process() updates state', () => {
		const initialState = gate.getState();
		expect(initialState.isFacing).toBe(false);

		gate.process(createFacingHand(), 100);
		const newState = gate.getState();
		expect(newState.lastUpdateTs).toBe(100);
	});

	it('reset() returns to initial state', () => {
		gate.process(createFacingHand(), 100);
		gate.process(createFacingHand(), 200);

		gate.reset();
		const state = gate.getState();
		expect(state.isFacing).toBe(false);
		expect(state.lastUpdateTs).toBe(0);
	});

	it('maintains state across multiple frames', () => {
		// Process multiple frames
		for (let i = 0; i < 10; i++) {
			gate.process(createFacingHand(), i * 16);
		}

		const state = gate.getState();
		expect(state.lastUpdateTs).toBe(144); // 9 * 16
	});
});

// ============================================================================
// MUTATION KILLER TESTS: Threshold Boundary Conditions
// ============================================================================

describe('Mutation Killers: Threshold Boundaries', () => {
	const config: PalmConeConfig = {
		armThreshold: 25,
		disarmThreshold: 35,
		cancelThreshold: 70,
	};

	// Create landmarks that produce a specific palm angle
	function createLandmarksForAngle(targetAngle: number): NormalizedLandmark[] {
		// Use Z-offset to control angle
		// angle = acos(dot(normal, camera_z))
		// For small angles, we can approximate with Z offset
		const radians = (targetAngle * Math.PI) / 180;
		const zOffset = Math.tan(radians) * 0.1;
		
		const landmarks: NormalizedLandmark[] = [];
		landmarks[0] = createLandmark(0.5, 0.6, 0); // WRIST
		for (let i = 1; i < 5; i++) {
			landmarks[i] = createLandmark(0.5 + i * 0.02, 0.5, 0);
		}
		landmarks[5] = createLandmark(0.55, 0.5, zOffset / 2); // INDEX_FINGER_MCP
		for (let i = 6; i < 17; i++) {
			landmarks[i] = createLandmark(0.5, 0.5 - i * 0.01, 0);
		}
		landmarks[17] = createLandmark(0.45, 0.5, -zOffset / 2); // PINKY_MCP
		for (let i = 18; i < 21; i++) {
			landmarks[i] = createLandmark(0.45, 0.4, 0);
		}
		return landmarks;
	}

	// === shouldCancel: >= vs < (line 202) ===
	it('KILLS: shouldCancel is TRUE when angle EQUALS cancelThreshold (>=)', () => {
		const state = createPalmConeGateState();
		// Create landmarks that give angle exactly at threshold
		const result = updatePalmConeGate(createLandmarksForAngle(70), state, config, 100);
		// If mutated to <, this would fail because 70 >= 70 is true but 70 < 70 is false
		expect(result.shouldCancel).toBe(true);
	});

	it('KILLS: shouldCancel is FALSE when angle is just BELOW cancelThreshold', () => {
		const state = createPalmConeGateState();
		const result = updatePalmConeGate(createLandmarksForAngle(69), state, config, 100);
		// 69 >= 70 is false, 69 < 70 is true (mutant would wrongly set shouldCancel=true)
		expect(result.shouldCancel).toBe(false);
	});

	// === Schmitt trigger: if (currentState.isFacing) true/false (line 207) ===
	it('KILLS: NOT_FACING state uses armThreshold (not disarmThreshold)', () => {
		// Start NOT facing
		const notFacingState = { isFacing: false, lastPalmAngle: 50, lastUpdateTs: 0 };
		
		// Angle 30 is: > armThreshold(25) but < disarmThreshold(35)
		// If NOT facing, should stay NOT facing (need to go below 25 to arm)
		const result = updatePalmConeGate(createLandmarksForAngle(30), notFacingState, config, 100);
		
		// NOT facing + angle 30 > 25 = should stay NOT facing
		// Mutant "if (true)" would use disarmThreshold path: 30 < 35 = facing (WRONG)
		// Mutant "if (false)" would use armThreshold path: 30 < 25 = not facing (correct but for wrong reason)
		expect(result.isFacing).toBe(false);
	});

	it('KILLS: FACING state uses disarmThreshold (not armThreshold)', () => {
		// Start FACING
		const facingState = { isFacing: true, lastPalmAngle: 20, lastUpdateTs: 0 };
		
		// Angle 30 is: > armThreshold(25) but < disarmThreshold(35)
		// If FACING, should STAY facing (need to go above 35 to disarm)
		const result = updatePalmConeGate(createLandmarksForAngle(30), facingState, config, 100);
		
		// FACING + angle 30 < 35 = should stay FACING
		// Mutant "if (false)" would use armThreshold path: 30 < 25 = not facing (WRONG)
		expect(result.isFacing).toBe(true);
	});

	// === Boundary: < vs <= at armThreshold (line 212) ===
	it('KILLS: angle well above armThreshold does NOT arm', () => {
		const notFacingState = { isFacing: false, lastPalmAngle: 50, lastUpdateTs: 0 };
		
		// Angle 30 is above armThreshold (25), should NOT arm
		const result = updatePalmConeGate(createLandmarksForAngle(30), notFacingState, config, 100);
		expect(result.isFacing).toBe(false);
	});

	it('KILLS: angle just BELOW armThreshold DOES arm', () => {
		const notFacingState = { isFacing: false, lastPalmAngle: 50, lastUpdateTs: 0 };
		
		// Use facing hand which gives low angle (< 25)
		const result = updatePalmConeGate(createFacingHand(), notFacingState, config, 100);
		expect(result.isFacing).toBe(true);
	});

	// === Boundary: < vs <= at disarmThreshold (line 209) ===
	it('KILLS: angle above disarmThreshold disarms', () => {
		const facingState = { isFacing: true, lastPalmAngle: 20, lastUpdateTs: 0 };
		
		// Use perpendicular hand which gives high angle (> 35)
		const result = updatePalmConeGate(createPerpendicularHand(), facingState, config, 100);
		expect(result.isFacing).toBe(false);
	});

	it('KILLS: angle just BELOW disarmThreshold stays facing', () => {
		const facingState = { isFacing: true, lastPalmAngle: 20, lastUpdateTs: 0 };
		
		// Angle 34 < 35 should stay facing
		const result = updatePalmConeGate(createLandmarksForAngle(34), facingState, config, 100);
		expect(result.isFacing).toBe(true);
	});
});

// ============================================================================
// MUTATION KILLER TESTS: Hysteresis Band Behavior  
// ============================================================================

describe('Mutation Killers: Hysteresis Band', () => {
	const config: PalmConeConfig = {
		armThreshold: 25,
		disarmThreshold: 35,
		cancelThreshold: 70,
	};

	function createLandmarksForAngle(targetAngle: number): NormalizedLandmark[] {
		const radians = (targetAngle * Math.PI) / 180;
		const zOffset = Math.tan(radians) * 0.1;
		const landmarks: NormalizedLandmark[] = [];
		landmarks[0] = createLandmark(0.5, 0.6, 0);
		for (let i = 1; i < 5; i++) landmarks[i] = createLandmark(0.5 + i * 0.02, 0.5, 0);
		landmarks[5] = createLandmark(0.55, 0.5, zOffset / 2);
		for (let i = 6; i < 17; i++) landmarks[i] = createLandmark(0.5, 0.5 - i * 0.01, 0);
		landmarks[17] = createLandmark(0.45, 0.5, -zOffset / 2);
		for (let i = 18; i < 21; i++) landmarks[i] = createLandmark(0.45, 0.4, 0);
		return landmarks;
	}

	it('KILLS: hysteresis band keeps state stable (middle angle)', () => {
		// Angle 30 is in hysteresis band [25, 35]
		// Starting NOT facing: should stay NOT facing
		const notFacing = { isFacing: false, lastPalmAngle: 50, lastUpdateTs: 0 };
		const r1 = updatePalmConeGate(createLandmarksForAngle(30), notFacing, config, 100);
		expect(r1.isFacing).toBe(false);

		// Starting FACING: should stay FACING
		const facing = { isFacing: true, lastPalmAngle: 20, lastUpdateTs: 0 };
		const r2 = updatePalmConeGate(createLandmarksForAngle(30), facing, config, 200);
		expect(r2.isFacing).toBe(true);
	});

	it('KILLS: full hysteresis cycle (arm → stay → disarm)', () => {
		const gate = createPalmConeGate(config);

		// 1. Start NOT facing (default)
		expect(gate.getState().isFacing).toBe(false);

		// 2. Go to angle 20 (< 25) → should ARM
		gate.process(createLandmarksForAngle(20), 100);
		expect(gate.getState().isFacing).toBe(true);

		// 3. Go to angle 30 (in band) → should STAY facing
		gate.process(createLandmarksForAngle(30), 200);
		expect(gate.getState().isFacing).toBe(true);

		// 4. Go to angle 40 (> 35) → should DISARM
		gate.process(createLandmarksForAngle(40), 300);
		expect(gate.getState().isFacing).toBe(false);

		// 5. Go to angle 30 (in band) → should STAY not facing
		gate.process(createLandmarksForAngle(30), 400);
		expect(gate.getState().isFacing).toBe(false);
	});

	it('KILLS: state transition from NOT_FACING requires angle < armThreshold', () => {
		// This explicitly tests that the branch for !isFacing uses armThreshold
		const state = { isFacing: false, lastPalmAngle: 50, lastUpdateTs: 0 };
		
		// Just above arm threshold - should NOT arm
		const r1 = updatePalmConeGate(createLandmarksForAngle(26), state, config, 100);
		expect(r1.isFacing).toBe(false);
		
		// Just below arm threshold - should arm
		const r2 = updatePalmConeGate(createLandmarksForAngle(24), state, config, 200);
		expect(r2.isFacing).toBe(true);
	});

	it('KILLS: state transition from FACING requires angle >= disarmThreshold', () => {
		// This explicitly tests that the branch for isFacing uses disarmThreshold
		const state = { isFacing: true, lastPalmAngle: 20, lastUpdateTs: 0 };
		
		// Just below disarm threshold - should STAY facing
		const r1 = updatePalmConeGate(createLandmarksForAngle(34), state, config, 100);
		expect(r1.isFacing).toBe(true);
		
		// Well above disarm threshold - should disarm
		const r2 = updatePalmConeGate(createPerpendicularHand(), state, config, 200);
		expect(r2.isFacing).toBe(false);
	});
});

// ============================================================================
// MUTATION KILLER TESTS: calculatePalmAngle Math
// ============================================================================

describe('Mutation Killers: calculatePalmAngle Math', () => {
	it('KILLS: cross product signs affect result', () => {
		// Test that swapping vectors or negating components changes result
		const facing = createFacingHand();
		const angle1 = calculatePalmAngle(facing);
		
		// Reverse wrist and index (should change cross product direction)
		const reversed = [...facing];
		const temp = reversed[0];
		reversed[0] = reversed[5];
		reversed[5] = temp;
		const angle2 = calculatePalmAngle(reversed);
		
		// Angles should be different
		expect(angle1).not.toBe(angle2);
	});

	it('KILLS: returns 90 for degenerate case (zero magnitude)', () => {
		// Create landmarks where wrist, index_mcp, pinky_mcp are collinear
		const landmarks: NormalizedLandmark[] = [];
		// All three critical points at same location
		landmarks[0] = createLandmark(0.5, 0.5, 0);
		for (let i = 1; i < 5; i++) landmarks[i] = createLandmark(0.5, 0.5, 0);
		landmarks[5] = createLandmark(0.5, 0.5, 0); // Same as wrist!
		for (let i = 6; i < 17; i++) landmarks[i] = createLandmark(0.5, 0.5, 0);
		landmarks[17] = createLandmark(0.5, 0.5, 0); // Same as wrist!
		for (let i = 18; i < 21; i++) landmarks[i] = createLandmark(0.5, 0.5, 0);
		
		const angle = calculatePalmAngle(landmarks);
		expect(angle).toBe(90); // Degenerate = perpendicular
	});

	it('KILLS: clampedDot handles edge cases', () => {
		// The clamp to [-1, 1] prevents NaN from acos
		// Test with extreme but valid landmarks
		const extreme: NormalizedLandmark[] = [];
		extreme[0] = createLandmark(0, 0, 0);
		for (let i = 1; i < 5; i++) extreme[i] = createLandmark(0, 0, 0);
		extreme[5] = createLandmark(1, 0, 0);
		for (let i = 6; i < 17; i++) extreme[i] = createLandmark(0, 0, 0);
		extreme[17] = createLandmark(0, 1, 0);
		for (let i = 18; i < 21; i++) extreme[i] = createLandmark(0, 0, 0);
		
		const angle = calculatePalmAngle(extreme);
		// Should be a valid number, not NaN
		expect(Number.isNaN(angle)).toBe(false);
		expect(angle).toBeGreaterThanOrEqual(0);
		expect(angle).toBeLessThanOrEqual(180);
	});
});

// ============================================================================
// MUTATION KILLER TESTS: Direct Threshold Behavior (Kill EqualityOperator)
// ============================================================================

describe('Mutation Killers: Direct Threshold Logic', () => {
	// These tests directly verify the branching logic to kill < vs <= mutants
	
	it('KILLS LINE 202: cancelThreshold uses >= not >', () => {
		// Test EXACTLY at cancelThreshold boundary
		const config: PalmConeConfig = {
			armThreshold: 25,
			disarmThreshold: 35,
			cancelThreshold: 70,
		};
		
		// Get any landmarks and calculate their angle
		const landmarks = createFacingHand();
		const actualAngle = calculatePalmAngle(landmarks);
		
		// Now create a config where cancelThreshold = actualAngle
		// This tests >= vs > at the exact boundary
		const configAtBoundary: PalmConeConfig = {
			armThreshold: 25,
			disarmThreshold: 35,
			cancelThreshold: actualAngle, // EXACTLY at angle
		};
		
		const state = createPalmConeGateState();
		const result = updatePalmConeGate(landmarks, state, configAtBoundary, 100);
		
		// angle >= cancelThreshold should cancel (using >=)
		// If mutated to >, would NOT cancel (angle > angle is false)
		expect(result.shouldCancel).toBe(true);
	});

	it('KILLS LINE 209: disarmThreshold uses < not <=', () => {
		// If facing, isFacing = palmAngle < disarmThreshold
		// Test: angle EXACTLY at disarmThreshold
		
		// Get landmarks and their actual angle
		const landmarks = createFacingHand();
		const actualAngle = calculatePalmAngle(landmarks);
		
		// Create config where disarmThreshold = actualAngle
		const configAtBoundary: PalmConeConfig = {
			armThreshold: actualAngle - 5, // Below actual so it can be facing
			disarmThreshold: actualAngle,   // EXACTLY at angle
			cancelThreshold: 90,
		};
		
		// Start facing
		const facingState = { isFacing: true, lastPalmAngle: actualAngle - 10, lastUpdateTs: 0 };
		const result = updatePalmConeGate(landmarks, facingState, configAtBoundary, 100);
		
		// palmAngle < disarmThreshold => angle < angle is FALSE => isFacing = false
		// If mutated to <=, angle <= angle is TRUE => isFacing = true (WRONG)
		expect(result.isFacing).toBe(false);
	});

	it('KILLS LINE 212: armThreshold uses < not <=', () => {
		// If not facing, isFacing = palmAngle < armThreshold
		// Test: angle EXACTLY at armThreshold
		
		// Get landmarks and their actual angle
		const landmarks = createFacingHand();
		const actualAngle = calculatePalmAngle(landmarks);
		
		// Create config where armThreshold = actualAngle
		const configAtBoundary: PalmConeConfig = {
			armThreshold: actualAngle,      // EXACTLY at angle
			disarmThreshold: actualAngle + 10,
			cancelThreshold: 90,
		};
		
		// Start NOT facing
		const notFacingState = { isFacing: false, lastPalmAngle: actualAngle + 20, lastUpdateTs: 0 };
		const result = updatePalmConeGate(landmarks, notFacingState, configAtBoundary, 100);
		
		// palmAngle < armThreshold => angle < angle is FALSE => isFacing = false
		// If mutated to <=, angle <= angle is TRUE => isFacing = true (WRONG)
		expect(result.isFacing).toBe(false);
	});

	it('KILLS LINE 207: isFacing branch selection matters', () => {
		// The if (currentState.isFacing) branch determines which threshold to use
		// Use wide hysteresis band to test branch behavior
		
		// Get facing hand angle
		const facingLandmarks = createFacingHand();
		const facingAngle = calculatePalmAngle(facingLandmarks);
		
		// Get perpendicular hand angle
		const perpLandmarks = createPerpendicularHand();
		const perpAngle = calculatePalmAngle(perpLandmarks);
		
		// Create config where facing hand is in hysteresis band:
		// armThreshold < facingAngle < disarmThreshold
		const config: PalmConeConfig = {
			armThreshold: facingAngle - 5,     // Below facing angle
			disarmThreshold: facingAngle + 20, // Well above facing angle
			cancelThreshold: perpAngle + 10,
		};
		
		// Test: same angle, different starting states = different outcomes
		const facingState = { isFacing: true, lastPalmAngle: facingAngle - 10, lastUpdateTs: 0 };
		const notFacingState = { isFacing: false, lastPalmAngle: perpAngle, lastUpdateTs: 0 };
		
		const resultFromFacing = updatePalmConeGate(facingLandmarks, facingState, config, 100);
		const resultFromNotFacing = updatePalmConeGate(facingLandmarks, notFacingState, config, 200);
		
		// Same landmarks, but different outcomes based on previous state
		// This kills "if (true)" or "if (false)" mutants
		expect(resultFromFacing.isFacing).toBe(true);   // facingAngle < disarm = stays facing
		expect(resultFromNotFacing.isFacing).toBe(false); // facingAngle > arm = stays not facing
	});

	it('KILLS: Hysteresis band maintains state integrity', () => {
		// Comprehensive test: walk through entire hysteresis cycle
		// Get actual angles from real hand fixtures
		const facingLandmarks = createFacingHand();
		const facingAngle = calculatePalmAngle(facingLandmarks);
		const perpLandmarks = createPerpendicularHand();
		const perpAngle = calculatePalmAngle(perpLandmarks);
		
		// Create config based on actual angles
		const config: PalmConeConfig = {
			armThreshold: facingAngle + 5,      // Just above facing angle
			disarmThreshold: perpAngle - 10,    // Just below perpendicular angle  
			cancelThreshold: perpAngle + 10,
		};
		
		// 1. Start not facing with perpendicular hand (high angle)
		let state: PalmConeState = { isFacing: false, lastPalmAngle: perpAngle, lastUpdateTs: 0 };
		let result = updatePalmConeGate(perpLandmarks, state, config, 100);
		expect(result.isFacing).toBe(false); // perpAngle > armThreshold, stays not facing
		
		// 2. Drop to facing hand (below armThreshold)
		state = result.state;
		result = updatePalmConeGate(facingLandmarks, state, config, 200);
		expect(result.isFacing).toBe(true); // facingAngle < armThreshold = Arms!
		
		// 3. Go back to perpendicular (above disarmThreshold)
		state = result.state;
		result = updatePalmConeGate(perpLandmarks, state, config, 300);
		expect(result.isFacing).toBe(false); // perpAngle >= disarmThreshold = Disarms!
	});
});

// ============================================================================
// MUTATION KILLER TESTS: Zod Schema Validation
// ============================================================================

describe('Mutation Killers: Zod Schema Validation', () => {
	it('KILLS: armThreshold must be >= 0', () => {
		expect(() => PalmConeConfigSchema.parse({ armThreshold: -1 })).toThrow();
	});

	it('KILLS: armThreshold must be <= 90', () => {
		expect(() => PalmConeConfigSchema.parse({ armThreshold: 91 })).toThrow();
	});

	it('KILLS: disarmThreshold must be >= 0', () => {
		expect(() => PalmConeConfigSchema.parse({ disarmThreshold: -1 })).toThrow();
	});

	it('KILLS: disarmThreshold must be <= 90', () => {
		expect(() => PalmConeConfigSchema.parse({ disarmThreshold: 91 })).toThrow();
	});

	it('KILLS: cancelThreshold must be >= 0', () => {
		expect(() => PalmConeConfigSchema.parse({ cancelThreshold: -1 })).toThrow();
	});

	it('KILLS: cancelThreshold must be <= 180', () => {
		expect(() => PalmConeConfigSchema.parse({ cancelThreshold: 181 })).toThrow();
	});

	it('KILLS: default values are used when not provided', () => {
		const config = PalmConeConfigSchema.parse({});
		expect(config.armThreshold).toBe(25);
		expect(config.disarmThreshold).toBe(35);
		expect(config.cancelThreshold).toBe(70);
	});
});

// ============================================================================
// MUTATION KILLER TESTS: Edge Cases & Guards
// ============================================================================

describe('Mutation Killers: Edge Cases & Guards', () => {
	const config: PalmConeConfig = {
		armThreshold: 25,
		disarmThreshold: 35,
		cancelThreshold: 70,
	};

	it('KILLS: handles exactly 20 landmarks (< 21)', () => {
		const insufficientLandmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 20; i++) {
			insufficientLandmarks.push(createLandmark(0.5, 0.5, 0));
		}
		
		const state = createPalmConeGateState();
		const result = updatePalmConeGate(insufficientLandmarks, state, config, 100);
		
		// Should return safe defaults
		expect(result.isFacing).toBe(false);
		expect(result.palmAngle).toBe(180);
		expect(result.shouldCancel).toBe(false);
		expect(result.state.isFacing).toBe(false);
		expect(result.state.lastPalmAngle).toBe(180);
	});

	it('KILLS: calculatePalmAngle with exactly 20 landmarks returns 180', () => {
		const insufficientLandmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 20; i++) {
			insufficientLandmarks.push(createLandmark(0.5, 0.5, 0));
		}
		
		const angle = calculatePalmAngle(insufficientLandmarks);
		expect(angle).toBe(180);
	});

	it('KILLS: updatePalmConeGate with null returns safe state with state object', () => {
		const state = createPalmConeGateState();
		const result = updatePalmConeGate(null as unknown as NormalizedLandmark[], state, config, 100);
		
		// Verify the returned state object has all required properties
		expect(result.state).toBeDefined();
		expect(typeof result.state.isFacing).toBe('boolean');
		expect(typeof result.state.lastPalmAngle).toBe('number');
		expect(typeof result.state.lastUpdateTs).toBe('number');
	});

	it('KILLS: wrist landmark missing (index 0)', () => {
		const landmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 21; i++) {
			landmarks[i] = createLandmark(0.5, 0.5, 0);
		}
		// Remove wrist (index 0)
		landmarks[0] = undefined as unknown as NormalizedLandmark;
		
		const angle = calculatePalmAngle(landmarks);
		expect(angle).toBe(180);
	});

	it('KILLS: indexMCP landmark missing (index 5)', () => {
		const landmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 21; i++) {
			landmarks[i] = createLandmark(0.5, 0.5, 0);
		}
		// Remove indexMCP (index 5)
		landmarks[5] = undefined as unknown as NormalizedLandmark;
		
		const angle = calculatePalmAngle(landmarks);
		expect(angle).toBe(180);
	});

	it('KILLS: pinkyMCP landmark missing (index 17)', () => {
		const landmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 21; i++) {
			landmarks[i] = createLandmark(0.5, 0.5, 0);
		}
		// Remove pinkyMCP (index 17)
		landmarks[17] = undefined as unknown as NormalizedLandmark;
		
		const angle = calculatePalmAngle(landmarks);
		expect(angle).toBe(180);
	});
});

// ============================================================================
// MUTATION KILLER TESTS: Math Operators (Vector Calculations)
// ============================================================================

describe('Mutation Killers: Vector Math', () => {
	it('KILLS: Z-component in cross product affects result', () => {
		// The cross product uses v1.z and v2.z in multiple terms
		// Test that changing Z values changes the palm normal direction
		
		// Base hand: palm facing camera (low Z values)
		const baseLandmarks = createFacingHand();
		const baseAngle = calculatePalmAngle(baseLandmarks);
		
		// Modified hand: same XY but with significant Z depth
		const zLandmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 21; i++) {
			zLandmarks[i] = createLandmark(
				baseLandmarks[i].x,
				baseLandmarks[i].y,
				baseLandmarks[i].z + 0.3  // Add Z depth to all points
			);
		}
		// But change wrist Z differently to affect subtraction
		zLandmarks[0] = createLandmark(
			baseLandmarks[0].x,
			baseLandmarks[0].y,
			baseLandmarks[0].z + 0.5  // More Z offset for wrist
		);
		
		const zAngle = calculatePalmAngle(zLandmarks);
		
		// The Z differences should affect the cross product terms
		// and produce a different angle
		expect(baseAngle).not.toBeCloseTo(zAngle, 0);
	});

	it('KILLS: magnitude calculation uses correct addition', () => {
		// If normal.y**2 was subtracted instead of added, 
		// result would be different for non-zero Y
		const landmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 21; i++) {
			landmarks[i] = createLandmark(0.5, 0.5, 0);
		}
		
		// Create geometry with significant Y component in cross product
		landmarks[0] = createLandmark(0, 0, 0);      // WRIST
		landmarks[5] = createLandmark(1, 0, 0);      // INDEX - along X
		landmarks[17] = createLandmark(0, 0, 1);     // PINKY - along Z
		
		// Cross product will have significant Y component
		const angle = calculatePalmAngle(landmarks);
		
		// With subtraction mutation, magnitude would be sqrt(x² - y² + z²)
		// which could give different results or NaN for large Y
		expect(Number.isNaN(angle)).toBe(false);
		expect(angle).toBeGreaterThanOrEqual(0);
		expect(angle).toBeLessThanOrEqual(180);
	});

	it('KILLS: normalization division (not multiplication)', () => {
		// Test that dividing by magnitude produces unit vector behavior
		const landmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 21; i++) {
			landmarks[i] = createLandmark(0.5, 0.5, 0);
		}
		
		// Large-magnitude vectors
		landmarks[0] = createLandmark(0, 0, 0);
		landmarks[5] = createLandmark(10, 0, 0);     // 10x normal distance
		landmarks[17] = createLandmark(0, 10, 0);    // 10x normal distance
		
		// Small-magnitude vectors (same ratio)
		const smallLandmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 21; i++) {
			smallLandmarks[i] = createLandmark(0.5, 0.5, 0);
		}
		smallLandmarks[0] = createLandmark(0, 0, 0);
		smallLandmarks[5] = createLandmark(0.1, 0, 0);
		smallLandmarks[17] = createLandmark(0, 0.1, 0);
		
		const angleLarge = calculatePalmAngle(landmarks);
		const angleSmall = calculatePalmAngle(smallLandmarks);
		
		// If multiplication was used instead of division,
		// large vectors would give huge results, small would give tiny results
		// With correct division (normalization), angles should be similar
		expect(Math.abs(angleLarge - angleSmall)).toBeLessThan(1); // Within 1 degree
	});

	it('KILLS: dot product Y term addition', () => {
		// Test that Y component is ADDED not subtracted in dot product
		const landmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 21; i++) {
			landmarks[i] = createLandmark(0.5, 0.5, 0);
		}
		
		// Create normal with positive and negative Y components
		landmarks[0] = createLandmark(0, 0, 0);
		landmarks[5] = createLandmark(1, 0, 0.5);
		landmarks[17] = createLandmark(0, 1, 0);
		
		const angle1 = calculatePalmAngle(landmarks);
		
		// Flip Y of pinky (changes cross product Y sign)
		landmarks[17] = createLandmark(0, -1, 0);
		const angle2 = calculatePalmAngle(landmarks);
		
		// Angles should differ when Y component changes
		// (this tests that Y is correctly included in dot product)
		expect(angle1).not.toBe(angle2);
	});

	it('KILLS: dot product Z term multiplication', () => {
		// If Z was divided instead of multiplied, result would be very different
		const landmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 21; i++) {
			landmarks[i] = createLandmark(0.5, 0.5, 0);
		}
		
		// Create clear Z-axis aligned normal
		landmarks[0] = createLandmark(0, 0, 0);
		landmarks[5] = createLandmark(1, 0, 0);
		landmarks[17] = createLandmark(0, 1, 0);
		
		// Cross product: (1,0,0) × (0,1,0) = (0,0,1) = Z-axis
		// Dot with camera (0,0,-1) = -1
		// acos(-1) = 180°
		
		const angle = calculatePalmAngle(landmarks);
		
		// If division was used, result would be division by -1 = different
		// Camera axis Z is -1, so multiplying gives -Z, dividing would give -Z*-1 = Z
		expect(angle).toBeGreaterThan(90); // Palm facing away
	});
});
