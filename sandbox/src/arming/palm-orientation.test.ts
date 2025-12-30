/**
 * PALM ORIENTATION ARMING RED TESTS
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | TDD RED
 *
 * REQUIREMENT: Palm orientation-based arming gate
 * - Primary: Palm facing camera = armed
 * - Secondary: Gesture as double-check (not primary)
 * - Directional: Palm direction as knob/dial modifier
 * - Physics: Palm as plane or quaternion from bones
 *
 * RATIONALE: Gesture recognition is brittle. Palm orientation is stable.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { NormalizedLandmark, SensorFrame } from '../contracts/schemas.js';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/** Create 21 landmarks representing a hand */
function createLandmarks(overrides?: {
	wrist?: Partial<NormalizedLandmark>;
	indexMCP?: Partial<NormalizedLandmark>;
	middleMCP?: Partial<NormalizedLandmark>;
	ringMCP?: Partial<NormalizedLandmark>;
	pinkyMCP?: Partial<NormalizedLandmark>;
}): NormalizedLandmark[] {
	const defaultLandmark = { x: 0.5, y: 0.5, z: 0, visibility: 1 };

	// MediaPipe hand landmarks indices:
	// 0: Wrist, 5: Index MCP, 9: Middle MCP, 13: Ring MCP, 17: Pinky MCP
	const landmarks: NormalizedLandmark[] = Array(21)
		.fill(null)
		.map(() => ({ ...defaultLandmark }));

	// Set key landmarks for palm plane calculation
	landmarks[0] = { ...defaultLandmark, ...overrides?.wrist }; // Wrist
	landmarks[5] = { ...defaultLandmark, x: 0.4, y: 0.4, ...overrides?.indexMCP }; // Index MCP
	landmarks[9] = { ...defaultLandmark, x: 0.5, y: 0.35, ...overrides?.middleMCP }; // Middle MCP
	landmarks[13] = { ...defaultLandmark, x: 0.6, y: 0.4, ...overrides?.ringMCP }; // Ring MCP
	landmarks[17] = { ...defaultLandmark, x: 0.7, y: 0.45, ...overrides?.pinkyMCP }; // Pinky MCP

	return landmarks;
}

/** Create a SensorFrame with landmarks */
function createSensorFrameWithLandmarks(
	landmarks: NormalizedLandmark[],
	overrides?: Partial<SensorFrame>,
): SensorFrame {
	return {
		ts: 16.67,
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: 'Open_Palm',
		confidence: 0.95,
		indexTip: landmarks[8] || { x: 0.5, y: 0.5, z: 0, visibility: 1 },
		landmarks,
		...overrides,
	};
}

/** Create landmarks with palm facing camera (z pointing toward viewer) */
function createPalmFacingCameraLandmarks(): NormalizedLandmark[] {
	// Palm plane roughly parallel to screen, z values similar
	return createLandmarks({
		wrist: { x: 0.5, y: 0.7, z: 0 },
		indexMCP: { x: 0.35, y: 0.5, z: -0.02 },
		middleMCP: { x: 0.5, y: 0.45, z: -0.03 },
		ringMCP: { x: 0.6, y: 0.5, z: -0.02 },
		pinkyMCP: { x: 0.7, y: 0.55, z: -0.01 },
	});
}

/** Create landmarks with palm facing away (back of hand visible) */
function createPalmFacingAwayLandmarks(): NormalizedLandmark[] {
	// Palm plane tilted, z values reversed
	return createLandmarks({
		wrist: { x: 0.5, y: 0.7, z: 0.1 },
		indexMCP: { x: 0.35, y: 0.5, z: 0.15 },
		middleMCP: { x: 0.5, y: 0.45, z: 0.18 },
		ringMCP: { x: 0.6, y: 0.5, z: 0.15 },
		pinkyMCP: { x: 0.7, y: 0.55, z: 0.12 },
	});
}

/** Create landmarks with palm tilted 45 degrees */
function createPalmTiltedLandmarks(tiltDegrees: number): NormalizedLandmark[] {
	const tiltRad = (tiltDegrees * Math.PI) / 180;
	const zOffset = Math.sin(tiltRad) * 0.1;

	return createLandmarks({
		wrist: { x: 0.5, y: 0.7, z: 0 },
		indexMCP: { x: 0.35, y: 0.5, z: -0.02 + zOffset },
		middleMCP: { x: 0.5, y: 0.45, z: -0.03 + zOffset * 1.5 },
		ringMCP: { x: 0.6, y: 0.5, z: -0.02 + zOffset },
		pinkyMCP: { x: 0.7, y: 0.55, z: -0.01 + zOffset * 0.5 },
	});
}

// ============================================================================
// RED TEST 1: PalmOrientationGate - Primary Arming Mechanism
// ============================================================================

describe('PalmOrientationGate', () => {
	let gate: PalmOrientationGatePort;

	beforeEach(async () => {
		// This will FAIL - module doesn't exist yet
		const { PalmOrientationGate } = await import('./palm-orientation-gate.js');
		gate = new PalmOrientationGate({
			coneAngleDegrees: 45, // Accept palm within 45° of facing camera
			hysteresisMs: 100, // Debounce threshold
		});
	});

	it('exports PalmOrientationGatePort interface', async () => {
		const mod = await import('./palm-orientation-gate.js');
		expect(mod.PalmOrientationGate).toBeDefined();
	});

	it('implements required methods', () => {
		expect(gate.evaluate).toBeTypeOf('function');
		expect(gate.isArmed).toBeTypeOf('function');
		expect(gate.reset).toBeTypeOf('function');
		expect(gate.setConfig).toBeTypeOf('function');
	});

	it('returns ARMED when palm faces camera', () => {
		const landmarks = createPalmFacingCameraLandmarks();
		const frame = createSensorFrameWithLandmarks(landmarks);

		const result = gate.evaluate(frame);

		expect(result.armed).toBe(true);
		expect(result.palmNormal).toBeDefined();
		expect(result.palmNormal!.z).toBeLessThan(0); // Pointing toward camera (negative z)
	});

	it('returns DISARMED when palm faces away', () => {
		const landmarks = createPalmFacingAwayLandmarks();
		const frame = createSensorFrameWithLandmarks(landmarks);

		const result = gate.evaluate(frame);

		expect(result.armed).toBe(false);
		expect(result.palmNormal!.z).toBeGreaterThan(0); // Pointing away
	});

	it('respects cone angle threshold', () => {
		// 30° tilt - should still be armed with 45° cone
		const tiltedIn = createPalmTiltedLandmarks(30);
		const frameIn = createSensorFrameWithLandmarks(tiltedIn);
		expect(gate.evaluate(frameIn).armed).toBe(true);

		// 60° tilt - should be disarmed with 45° cone
		const tiltedOut = createPalmTiltedLandmarks(60);
		const frameOut = createSensorFrameWithLandmarks(tiltedOut);
		expect(gate.evaluate(frameOut).armed).toBe(false);
	});

	it('setConfig changes cone angle dynamically', () => {
		const tiltedLandmarks = createPalmTiltedLandmarks(50);
		const frame = createSensorFrameWithLandmarks(tiltedLandmarks);

		// 45° cone - should be disarmed at 50° tilt
		gate.setConfig({ coneAngleDegrees: 45 });
		expect(gate.evaluate(frame).armed).toBe(false);

		// 60° cone - should be armed at 50° tilt
		gate.setConfig({ coneAngleDegrees: 60 });
		expect(gate.evaluate(frame).armed).toBe(true);
	});

	it('provides hysteresis to prevent flickering', async () => {
		const { PalmOrientationGate } = await import('./palm-orientation-gate.js');
		const gateWithHysteresis = new PalmOrientationGate({
			coneAngleDegrees: 45,
			hysteresisMs: 200,
		});

		const facingCamera = createPalmFacingCameraLandmarks();
		const facingAway = createPalmFacingAwayLandmarks();

		// Arm
		gateWithHysteresis.evaluate(createSensorFrameWithLandmarks(facingCamera, { ts: 0 }));
		expect(gateWithHysteresis.isArmed()).toBe(true);

		// Quick flip - should stay armed due to hysteresis
		gateWithHysteresis.evaluate(createSensorFrameWithLandmarks(facingAway, { ts: 50 }));
		expect(gateWithHysteresis.isArmed()).toBe(true); // Still armed!

		// Sustained flip - should disarm after hysteresis
		gateWithHysteresis.evaluate(createSensorFrameWithLandmarks(facingAway, { ts: 300 }));
		expect(gateWithHysteresis.isArmed()).toBe(false);
	});

	it('returns null palmNormal when landmarks missing', () => {
		const frame = createSensorFrameWithLandmarks([], {
			landmarks: null,
			trackingOk: false,
		});

		const result = gate.evaluate(frame);

		expect(result.armed).toBe(false);
		expect(result.palmNormal).toBeNull();
	});
});

// ============================================================================
// RED TEST 2: PalmPlaneCalculator - Physics-based palm representation
// ============================================================================

describe('PalmPlaneCalculator', () => {
	let calculator: PalmPlaneCalculatorPort;

	beforeEach(async () => {
		const { PalmPlaneCalculator } = await import('./palm-plane-calculator.js');
		calculator = new PalmPlaneCalculator();
	});

	it('calculates palm normal from landmarks', () => {
		const landmarks = createPalmFacingCameraLandmarks();

		const plane = calculator.calculate(landmarks);

		expect(plane).not.toBeNull();
		expect(plane!.normal).toBeDefined();
		expect(plane!.normal.x).toBeTypeOf('number');
		expect(plane!.normal.y).toBeTypeOf('number');
		expect(plane!.normal.z).toBeTypeOf('number');
	});

	it('returns normalized normal vector (length = 1)', () => {
		const landmarks = createPalmFacingCameraLandmarks();

		const plane = calculator.calculate(landmarks);
		const length = Math.sqrt(plane!.normal.x ** 2 + plane!.normal.y ** 2 + plane!.normal.z ** 2);

		expect(length).toBeCloseTo(1.0, 4);
	});

	it('calculates palm center point', () => {
		const landmarks = createPalmFacingCameraLandmarks();

		const plane = calculator.calculate(landmarks);

		expect(plane!.center).toBeDefined();
		expect(plane!.center.x).toBeGreaterThan(0);
		expect(plane!.center.y).toBeGreaterThan(0);
	});

	it('palm facing camera has negative z normal', () => {
		const landmarks = createPalmFacingCameraLandmarks();

		const plane = calculator.calculate(landmarks);

		// Negative z means pointing toward camera
		expect(plane!.normal.z).toBeLessThan(0);
	});

	it('palm facing away has positive z normal', () => {
		const landmarks = createPalmFacingAwayLandmarks();

		const plane = calculator.calculate(landmarks);

		// Positive z means pointing away from camera
		expect(plane!.normal.z).toBeGreaterThan(0);
	});

	it('returns null for invalid landmarks', () => {
		const plane = calculator.calculate([]);

		expect(plane).toBeNull();
	});
});

// ============================================================================
// RED TEST 3: PalmQuaternion - Bone-based orientation
// ============================================================================

describe('PalmQuaternion', () => {
	let quaternionCalc: PalmQuaternionPort;

	beforeEach(async () => {
		const { PalmQuaternion } = await import('./palm-quaternion.js');
		quaternionCalc = new PalmQuaternion();
	});

	it('calculates quaternion from palm landmarks', () => {
		const landmarks = createPalmFacingCameraLandmarks();

		const quat = quaternionCalc.calculate(landmarks);

		expect(quat).not.toBeNull();
		expect(quat!.w).toBeTypeOf('number');
		expect(quat!.x).toBeTypeOf('number');
		expect(quat!.y).toBeTypeOf('number');
		expect(quat!.z).toBeTypeOf('number');
	});

	it('returns normalized quaternion (length = 1)', () => {
		const landmarks = createPalmFacingCameraLandmarks();

		const quat = quaternionCalc.calculate(landmarks);
		const length = Math.sqrt(quat!.w ** 2 + quat!.x ** 2 + quat!.y ** 2 + quat!.z ** 2);

		expect(length).toBeCloseTo(1.0, 4);
	});

	it('identity quaternion when palm faces camera straight', () => {
		// Perfect palm facing - should be close to identity (w=1, x=y=z=0)
		const landmarks = createPalmFacingCameraLandmarks();

		const quat = quaternionCalc.calculate(landmarks);

		// w should dominate for near-identity
		expect(Math.abs(quat!.w)).toBeGreaterThan(0.9);
	});

	it('extracts euler angles from quaternion', () => {
		const landmarks = createPalmTiltedLandmarks(30);

		const quat = quaternionCalc.calculate(landmarks);
		const euler = quaternionCalc.toEuler(quat!);

		expect(euler.pitch).toBeTypeOf('number');
		expect(euler.yaw).toBeTypeOf('number');
		expect(euler.roll).toBeTypeOf('number');
	});

	it('can slerp between two quaternions', () => {
		const quat1 = { w: 1, x: 0, y: 0, z: 0 };
		const quat2 = { w: 0.707, x: 0.707, y: 0, z: 0 }; // 90° rotation around x

		const mid = quaternionCalc.slerp(quat1, quat2, 0.5);

		// Should be halfway between
		expect(mid.w).toBeLessThan(quat1.w);
		expect(mid.x).toBeGreaterThan(quat1.x);
	});
});

// ============================================================================
// RED TEST 4: DirectionalModifier - Palm direction as knob/dial
// ============================================================================

describe('DirectionalModifier', () => {
	let modifier: DirectionalModifierPort;

	beforeEach(async () => {
		const { DirectionalModifier } = await import('./directional-modifier.js');
		modifier = new DirectionalModifier();
	});

	it('extracts palm roll angle (rotation around viewing axis)', () => {
		const landmarks = createPalmFacingCameraLandmarks();

		const direction = modifier.evaluate(landmarks);

		expect(direction).not.toBeNull();
		expect(direction!.rollDegrees).toBeTypeOf('number');
	});

	it('roll is 0 when hand is upright', () => {
		// Create upright hand (fingers pointing up)
		const uprightLandmarks = createLandmarks({
			wrist: { x: 0.5, y: 0.7, z: 0 },
			middleMCP: { x: 0.5, y: 0.4, z: 0 }, // Directly above wrist
		});

		const direction = modifier.evaluate(uprightLandmarks);

		expect(direction!.rollDegrees).toBeCloseTo(0, 10);
	});

	it('roll is ~90 when hand tilted right', () => {
		// Create tilted hand (fingers pointing right)
		const tiltedLandmarks = createLandmarks({
			wrist: { x: 0.3, y: 0.5, z: 0 },
			middleMCP: { x: 0.6, y: 0.5, z: 0 }, // To the right of wrist
		});

		const direction = modifier.evaluate(tiltedLandmarks);

		expect(Math.abs(direction!.rollDegrees)).toBeCloseTo(90, 20);
	});

	it('provides continuous knob value (-180 to 180)', () => {
		const landmarks = createPalmTiltedLandmarks(45);

		const direction = modifier.evaluate(landmarks);

		expect(direction!.rollDegrees).toBeGreaterThanOrEqual(-180);
		expect(direction!.rollDegrees).toBeLessThanOrEqual(180);
	});

	it('provides normalized knob value (0 to 1)', () => {
		const landmarks = createPalmFacingCameraLandmarks();

		const direction = modifier.evaluate(landmarks);

		expect(direction!.knobNormalized).toBeGreaterThanOrEqual(0);
		expect(direction!.knobNormalized).toBeLessThanOrEqual(1);
	});

	it('can be used for discrete zones', () => {
		const landmarks = createPalmFacingCameraLandmarks();

		const zones = modifier.getZone(landmarks, 4); // 4 zones like N/E/S/W

		expect(['up', 'right', 'down', 'left']).toContain(zones);
	});
});

// ============================================================================
// RED TEST 5: CompositeArmingAdapter - Combines orientation + gesture
// ============================================================================

describe('CompositeArmingAdapter', () => {
	let adapter: CompositeArmingAdapterPort;

	beforeEach(async () => {
		const { CompositeArmingAdapter } = await import('./composite-arming-adapter.js');
		const { PalmOrientationGate } = await import('./palm-orientation-gate.js');

		adapter = new CompositeArmingAdapter({
			primary: new PalmOrientationGate({ coneAngleDegrees: 45 }),
			gestureDoubleCheck: true, // Use gesture as secondary confirmation
			requiredGestures: ['Open_Palm'], // Which gestures count as "armed"
		});
	});

	it('arms when palm orientation passes (primary)', () => {
		const landmarks = createPalmFacingCameraLandmarks();
		const frame = createSensorFrameWithLandmarks(landmarks, {
			label: 'None', // No gesture, but palm is facing
		});

		const result = adapter.evaluate(frame);

		// Primary (orientation) passes, gesture ignored when gestureDoubleCheck is secondary
		expect(result.orientationPassed).toBe(true);
	});

	it('requires gesture when gestureDoubleCheck is strict', async () => {
		const { CompositeArmingAdapter } = await import('./composite-arming-adapter.js');
		const { PalmOrientationGate } = await import('./palm-orientation-gate.js');

		const strictAdapter = new CompositeArmingAdapter({
			primary: new PalmOrientationGate({ coneAngleDegrees: 45 }),
			gestureDoubleCheck: 'strict', // Require both
			requiredGestures: ['Open_Palm'],
		});

		const landmarks = createPalmFacingCameraLandmarks();

		// Palm facing but wrong gesture
		const noGestureFrame = createSensorFrameWithLandmarks(landmarks, {
			label: 'Closed_Fist',
		});
		expect(strictAdapter.evaluate(noGestureFrame).armed).toBe(false);

		// Palm facing AND correct gesture
		const fullFrame = createSensorFrameWithLandmarks(landmarks, {
			label: 'Open_Palm',
		});
		expect(strictAdapter.evaluate(fullFrame).armed).toBe(true);
	});

	it('falls back to gesture-only when orientation unavailable', () => {
		const frame = createSensorFrameWithLandmarks([], {
			landmarks: null,
			trackingOk: true,
			label: 'Open_Palm',
			confidence: 0.9,
		});

		const result = adapter.evaluate(frame);

		expect(result.orientationPassed).toBe(false);
		expect(result.gesturePassed).toBe(true);
		// Fallback policy determines final armed state
	});

	it('outputs combined confidence', () => {
		const landmarks = createPalmFacingCameraLandmarks();
		const frame = createSensorFrameWithLandmarks(landmarks, {
			label: 'Open_Palm',
			confidence: 0.95,
		});

		const result = adapter.evaluate(frame);

		expect(result.confidence).toBeTypeOf('number');
		expect(result.confidence).toBeGreaterThan(0);
		expect(result.confidence).toBeLessThanOrEqual(1);
	});

	it('provides directional modifier in output', () => {
		const landmarks = createPalmFacingCameraLandmarks();
		const frame = createSensorFrameWithLandmarks(landmarks);

		const result = adapter.evaluate(frame);

		expect(result.direction).toBeDefined();
		expect(result.direction!.rollDegrees).toBeTypeOf('number');
	});
});

// ============================================================================
// Type definitions for ports (will be in contracts/ports.ts)
// ============================================================================

interface PalmOrientationGatePort {
	evaluate(frame: SensorFrame): PalmOrientationResult;
	isArmed(): boolean;
	reset(): void;
	setConfig(config: { coneAngleDegrees?: number; hysteresisMs?: number }): void;
}

interface PalmOrientationResult {
	armed: boolean;
	palmNormal: { x: number; y: number; z: number } | null;
	angleFromCamera: number | null;
}

interface PalmPlaneCalculatorPort {
	calculate(
		landmarks: NormalizedLandmark[],
	): {
		normal: { x: number; y: number; z: number };
		center: { x: number; y: number; z: number };
	} | null;
}

interface Quaternion {
	w: number;
	x: number;
	y: number;
	z: number;
}

interface PalmQuaternionPort {
	calculate(landmarks: NormalizedLandmark[]): Quaternion | null;
	toEuler(quat: Quaternion): { pitch: number; yaw: number; roll: number };
	slerp(q1: Quaternion, q2: Quaternion, t: number): Quaternion;
}

interface DirectionalModifierPort {
	evaluate(landmarks: NormalizedLandmark[]): { rollDegrees: number; knobNormalized: number } | null;
	getZone(landmarks: NormalizedLandmark[], numZones: number): string;
}

interface CompositeArmingAdapterPort {
	evaluate(frame: SensorFrame): CompositeArmingResult;
}

interface CompositeArmingResult {
	armed: boolean;
	orientationPassed: boolean;
	gesturePassed: boolean;
	confidence: number;
	direction: { rollDegrees: number; knobNormalized: number } | null;
}
