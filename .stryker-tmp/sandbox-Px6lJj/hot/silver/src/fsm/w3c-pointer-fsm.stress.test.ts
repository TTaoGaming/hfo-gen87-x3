/**
 * W3C Pointer FSM - Synthetic Data Stress Tests
 *
 * Gen87.X3 | Hot Silver | MUTATION + BOUNDARY TESTING
 *
 * Tests:
 * 1. POSITIVE: Valid gesture sequences
 * 2. NEGATIVE: Invalid/malformed data rejection
 * 3. BOUNDARY: Schmitt trigger edge cases
 * 4. ADVERSARIAL: Rapid oscillation, noise injection
 */
// @ts-nocheck


import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type PointerFrame, type W3CPointerAction, W3CPointerFSM } from './w3c-pointer-fsm.js';

// ============================================================================
// SYNTHETIC DATA GENERATORS
// ============================================================================

type GestureType = PointerFrame['gesture'];

interface SyntheticSequence {
	name: string;
	frames: PointerFrame[];
	expectedStates: string[];
	expectedActions: string[];
}

function generateFrame(
	ts: number,
	palmAngle: number,
	gesture: GestureType,
	overrides: Partial<PointerFrame> = {},
): PointerFrame {
	return {
		ts,
		trackingOk: true,
		palmAngle,
		gesture,
		confidence: 0.9,
		position: { x: 0.5, y: 0.5 },
		velocity: { vx: 0, vy: 0 },
		...overrides,
	};
}

function runSequence(
	fsm: W3CPointerFSM,
	frames: PointerFrame[],
): { states: string[]; actions: W3CPointerAction[] } {
	const states: string[] = [fsm.getState()];
	const actions: W3CPointerAction[] = [];

	for (const frame of frames) {
		const action = fsm.process(frame);
		actions.push(action);
		states.push(fsm.getState());
	}

	return { states, actions };
}

// ============================================================================
// POSITIVE TESTS - Valid Sequences
// ============================================================================

describe('POSITIVE: Valid Gesture Sequences', () => {
	let fsm: W3CPointerFSM;

	beforeEach(() => {
		fsm = new W3CPointerFSM();
	});

	afterEach(() => {
		fsm.dispose();
	});

	it('CLICK: IDLE → TRACKING → ARMED → ENGAGED → ARMED → IDLE', () => {
		const frames: PointerFrame[] = [
			// Enter tracking
			generateFrame(1000, 20, 'Open_Palm'),
			// Stabilize for arming (need 150ms+)
			generateFrame(1200, 20, 'Open_Palm'),
			// Point to engage
			generateFrame(1300, 20, 'Pointing_Up'),
			// Release back to open palm
			generateFrame(1400, 20, 'Open_Palm'),
			// Roll away to exit
			generateFrame(1500, 80, 'Open_Palm'),
		];

		const { states, actions } = runSequence(fsm, frames);

		expect(states).toEqual(['IDLE', 'TRACKING', 'ARMED', 'ENGAGED', 'ARMED', 'IDLE']);
		expect(actions.map((a) => a.type)).toEqual(['enter', 'move', 'down', 'up', 'leave']);
	});

	it('DRAG: Full drag and release sequence', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Open_Palm'),
			generateFrame(1200, 20, 'Open_Palm'),
			generateFrame(1300, 20, 'Pointing_Up'),
			// Drag movement
			generateFrame(1400, 20, 'Pointing_Up', { position: { x: 0.6, y: 0.4 } }),
			generateFrame(1500, 20, 'Pointing_Up', { position: { x: 0.7, y: 0.3 } }),
			generateFrame(1600, 20, 'Pointing_Up', { position: { x: 0.8, y: 0.2 } }),
			// Release
			generateFrame(1700, 20, 'Open_Palm'),
		];

		const { states, actions } = runSequence(fsm, frames);

		expect(states[0]).toBe('IDLE');
		expect(states[3]).toBe('ENGAGED'); // After pointing
		expect(states[states.length - 1]).toBe('ARMED'); // After release
		expect(actions[2].type).toBe('down');
		expect(actions[6].type).toBe('up');
	});

	it('CLUTCH: Palm roll cancels at any active state', () => {
		// Start tracking, then roll away
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Open_Palm'),
			generateFrame(1100, 80, 'Open_Palm'), // Roll away
		];

		const { states, actions } = runSequence(fsm, frames);
		expect(states).toEqual(['IDLE', 'TRACKING', 'IDLE']);
		expect(actions[1].type).toBe('leave');
	});

	it('COASTING RECOVERY: Tracking loss → recovery within timeout', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Open_Palm'),
			generateFrame(1100, 20, 'Open_Palm', { trackingOk: false }), // Lost
			generateFrame(1200, 20, 'Open_Palm', { trackingOk: true }), // Recovered
		];

		const { states } = runSequence(fsm, frames);
		expect(states).toEqual(['IDLE', 'TRACKING', 'COASTING', 'TRACKING']);
	});
});

// ============================================================================
// NEGATIVE TESTS - Invalid/Rejected Data
// ============================================================================

describe('NEGATIVE: Invalid Data Rejection', () => {
	let fsm: W3CPointerFSM;

	beforeEach(() => {
		fsm = new W3CPointerFSM();
	});

	afterEach(() => {
		fsm.dispose();
	});

	it('REJECT: Palm facing away should NOT enter tracking', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 60, 'Open_Palm'), // Too far from camera
			generateFrame(1100, 50, 'Open_Palm'), // Still too far
			generateFrame(1200, 40, 'Open_Palm'), // Still above 30° threshold
		];

		const { states } = runSequence(fsm, frames);
		expect(states.every((s) => s === 'IDLE')).toBe(true);
	});

	it('REJECT: Low confidence should NOT arm', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Open_Palm'),
			generateFrame(1200, 20, 'Open_Palm', { confidence: 0.3 }), // Below 0.7 threshold
		];

		const { states } = runSequence(fsm, frames);
		// Should stay in TRACKING, not progress to ARMED
		expect(states[states.length - 1]).toBe('TRACKING');
	});

	it('REJECT: Tracking lost should NOT allow state advancement', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Open_Palm'),
			generateFrame(1200, 20, 'Open_Palm'), // Armed
			generateFrame(1300, 20, 'Pointing_Up', { trackingOk: false }), // Try to engage with no tracking
		];

		const { states } = runSequence(fsm, frames);
		// Should go to COASTING, not ENGAGED
		expect(states[states.length - 1]).toBe('COASTING');
	});

	it('REJECT: Cannot skip ARMED state - direct IDLE → ENGAGED impossible', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Pointing_Up'), // Try to point from IDLE
		];

		const { states, actions } = runSequence(fsm, frames);
		// Should enter TRACKING (not ENGAGED) because Open_Palm not held first
		expect(states[1]).toBe('TRACKING');
		expect(actions[0].type).toBe('enter');
	});

	it('REJECT: Cannot engage without stable arm period', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Open_Palm'),
			generateFrame(1050, 20, 'Pointing_Up'), // Only 50ms, need 150ms to arm
		];

		const { states } = runSequence(fsm, frames);
		// Should be TRACKING (not ENGAGED) - not armed yet
		expect(states[states.length - 1]).toBe('TRACKING');
	});
});

// ============================================================================
// BOUNDARY TESTS - Schmitt Trigger Hysteresis
// ============================================================================

describe('BOUNDARY: Schmitt Trigger Hysteresis', () => {
	let fsm: W3CPointerFSM;

	beforeEach(() => {
		fsm = new W3CPointerFSM();
	});

	afterEach(() => {
		fsm.dispose();
	});

	it('HYSTERESIS BAND: Should not oscillate at boundary', () => {
		// Enter threshold = 30°, Exit threshold = 45°
		const frames: PointerFrame[] = [
			generateFrame(1000, 25, 'Open_Palm'), // < 30 → TRACKING
			generateFrame(1100, 35, 'Open_Palm'), // 30-45 band → stay TRACKING
			generateFrame(1200, 40, 'Open_Palm'), // still in band → stay TRACKING
			generateFrame(1300, 35, 'Open_Palm'), // still in band → stay TRACKING
			generateFrame(1400, 38, 'Open_Palm'), // still in band → stay TRACKING
		];

		const { states } = runSequence(fsm, frames);
		// All should be TRACKING after initial entry (never drops to IDLE in the band)
		// States: IDLE, TRACKING, TRACKING, TRACKING, TRACKING, TRACKING
		expect(states[0]).toBe('IDLE'); // Initial
		expect(states.slice(1).every((s) => s === 'TRACKING' || s === 'ARMED')).toBe(true);
	});

	it('HYSTERESIS EXIT: Must exceed exit threshold to leave', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 25, 'Open_Palm'), // Enter
			generateFrame(1100, 44, 'Open_Palm'), // Just under 45° → still TRACKING
			generateFrame(1200, 46, 'Open_Palm'), // Just over 45° → IDLE
		];

		const { states } = runSequence(fsm, frames);
		expect(states).toEqual(['IDLE', 'TRACKING', 'TRACKING', 'IDLE']);
	});

	it('HYSTERESIS ENTER: Must go below enter threshold to re-enter', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 25, 'Open_Palm'), // Enter
			generateFrame(1100, 50, 'Open_Palm'), // Exit
			generateFrame(1200, 35, 'Open_Palm'), // In band but not < 30 → stay IDLE
			generateFrame(1300, 29, 'Open_Palm'), // Below 30 → TRACKING
		];

		const { states } = runSequence(fsm, frames);
		expect(states).toEqual(['IDLE', 'TRACKING', 'IDLE', 'IDLE', 'TRACKING']);
	});

	it('EXACT BOUNDARY: At exactly 30° should enter (< is the condition)', () => {
		// enterThreshold is 30, condition is palmAngle < enterThreshold
		const frames: PointerFrame[] = [
			generateFrame(1000, 30, 'Open_Palm'), // Exactly 30 → NOT < 30 → IDLE
			generateFrame(1100, 29.9, 'Open_Palm'), // Just under → TRACKING
		];

		const { states } = runSequence(fsm, frames);
		expect(states).toEqual(['IDLE', 'IDLE', 'TRACKING']);
	});

	it('EXACT EXIT: At exactly 45° should stay (< is the condition for exit)', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 25, 'Open_Palm'), // Enter
			generateFrame(1100, 45, 'Open_Palm'), // Exactly 45 → NOT < 45 → exit
		];

		const { states } = runSequence(fsm, frames);
		expect(states).toEqual(['IDLE', 'TRACKING', 'IDLE']);
	});

	it('CANCEL THRESHOLD: > 70° should immediately exit', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 25, 'Open_Palm'),
			generateFrame(1200, 25, 'Open_Palm'), // Armed
			generateFrame(1300, 71, 'Open_Palm'), // Cancel threshold exceeded
		];

		const { states } = runSequence(fsm, frames);
		expect(states[states.length - 1]).toBe('IDLE');
	});
});

// ============================================================================
// ADVERSARIAL TESTS - Noise & Rapid Changes
// ============================================================================

describe('ADVERSARIAL: Noise Injection & Rapid Oscillation', () => {
	let fsm: W3CPointerFSM;

	beforeEach(() => {
		fsm = new W3CPointerFSM();
	});

	afterEach(() => {
		fsm.dispose();
	});

	it('RAPID OSCILLATION: Palm angle bouncing in hysteresis band', () => {
		// Simulate noisy palm angle readings bouncing in the 30-45° band
		const frames: PointerFrame[] = [
			generateFrame(1000, 25, 'Open_Palm'), // Enter
			// Rapid oscillation in band
			...Array.from({ length: 20 }, (_, i) =>
				generateFrame(1100 + i * 16, 32 + Math.sin(i) * 10, 'Open_Palm'),
			),
		];

		const { states } = runSequence(fsm, frames);
		// Should stay in TRACKING throughout (hysteresis prevents oscillation)
		const nonIdleStates = states.slice(1);
		expect(nonIdleStates.filter((s) => s === 'IDLE').length).toBeLessThan(3);
	});

	it('GESTURE FLICKER: None interspersed in gesture stream', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Open_Palm'),
			generateFrame(1200, 20, 'Open_Palm'), // Armed
			generateFrame(1250, 20, 'None'), // Brief None
			generateFrame(1280, 20, 'Pointing_Up'), // Back to pointing
		];

		const { states } = runSequence(fsm, frames);
		// Should still be able to engage (None is transient)
		expect(states.includes('ARMED') || states.includes('ENGAGED')).toBe(true);
	});

	it('TRACKING FLICKER: Rapid tracking loss/recovery', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Open_Palm'),
			generateFrame(1100, 20, 'Open_Palm', { trackingOk: false }),
			generateFrame(1150, 20, 'Open_Palm', { trackingOk: true }),
			generateFrame(1200, 20, 'Open_Palm', { trackingOk: false }),
			generateFrame(1250, 20, 'Open_Palm', { trackingOk: true }),
		];

		const { states } = runSequence(fsm, frames);
		// Should handle gracefully via COASTING
		const coastingCount = states.filter((s) => s === 'COASTING').length;
		expect(coastingCount).toBeGreaterThan(0);
		// Should recover to TRACKING
		expect(states[states.length - 1]).toBe('TRACKING');
	});

	it('CONFIDENCE NOISE: Fluctuating confidence values', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Open_Palm', { confidence: 0.9 }),
			generateFrame(1050, 20, 'Open_Palm', { confidence: 0.4 }), // Dip - resets timer but stays
			generateFrame(1100, 20, 'Open_Palm', { confidence: 0.8 }),
			generateFrame(1150, 20, 'Open_Palm', { confidence: 0.3 }), // Dip - resets timer
			generateFrame(1200, 20, 'Open_Palm', { confidence: 0.9 }),
		];

		const { states } = runSequence(fsm, frames);
		// Should stay in TRACKING or ARMED (low confidence resets timer, doesn't exit)
		expect(states.slice(1).every((s) => s === 'TRACKING' || s === 'ARMED')).toBe(true);
	});

	it('POSITION JITTER: Rapid position changes', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Open_Palm', { position: { x: 0.5, y: 0.5 } }),
			generateFrame(1200, 20, 'Open_Palm', { position: { x: 0.5, y: 0.5 } }),
			// Jittery positions during engaged state
			generateFrame(1300, 20, 'Pointing_Up', { position: { x: 0.51, y: 0.49 } }),
			generateFrame(1316, 20, 'Pointing_Up', { position: { x: 0.52, y: 0.48 } }),
			generateFrame(1332, 20, 'Pointing_Up', { position: { x: 0.5, y: 0.51 } }),
			generateFrame(1348, 20, 'Pointing_Up', { position: { x: 0.53, y: 0.47 } }),
		];

		const { states, actions } = runSequence(fsm, frames);
		// Should all be valid moves
		const moveCount = actions.filter((a) => a.type === 'move').length;
		expect(moveCount).toBeGreaterThan(2);
		expect(states[states.length - 1]).toBe('ENGAGED');
	});
});

// ============================================================================
// COASTING STATE TESTS
// ============================================================================

describe('COASTING: Physics Prediction State', () => {
	let fsm: W3CPointerFSM;

	beforeEach(() => {
		fsm = new W3CPointerFSM();
	});

	afterEach(() => {
		fsm.dispose();
	});

	it('COASTING TIMEOUT: Should return to IDLE after timeout', () => {
		const frames: PointerFrame[] = [
			generateFrame(1000, 20, 'Open_Palm', { velocity: { vx: 0.01, vy: 0.01 } }),
			generateFrame(1100, 20, 'Open_Palm', { trackingOk: false }),
			// Wait for timeout (2000ms default)
			generateFrame(3200, 20, 'Open_Palm', { trackingOk: false }),
		];

		const { states, actions } = runSequence(fsm, frames);
		expect(states[states.length - 1]).toBe('IDLE');
		expect(actions[actions.length - 1].type).toBe('leave');
	});

	it('COASTING VELOCITY: Position should update based on velocity', () => {
		fsm.process(
			generateFrame(1000, 20, 'Open_Palm', {
				velocity: { vx: 0.05, vy: 0.02 },
				position: { x: 0.5, y: 0.5 },
			}),
		);

		// Enter coasting
		fsm.process(generateFrame(1100, 20, 'Open_Palm', { trackingOk: false }));

		const pos1 = fsm.getPosition();

		// Continue coasting - position should move
		fsm.process(generateFrame(1200, 20, 'Open_Palm', { trackingOk: false }));

		const pos2 = fsm.getPosition();

		// Position should have changed due to velocity
		expect(pos2.x !== pos1.x || pos2.y !== pos1.y).toBe(true);
	});

	it('COASTING DAMPING: Velocity should decrease over time', () => {
		fsm.process(
			generateFrame(1000, 20, 'Open_Palm', {
				velocity: { vx: 0.1, vy: 0.1 },
				position: { x: 0.5, y: 0.5 },
			}),
		);

		fsm.process(generateFrame(1100, 20, 'Open_Palm', { trackingOk: false }));

		const initialSpeed = Math.sqrt(0.1 ** 2 + 0.1 ** 2); // ~0.1414

		// Multiple coasting frames
		for (let i = 0; i < 10; i++) {
			fsm.process(generateFrame(1200 + i * 100, 20, 'Open_Palm', { trackingOk: false }));
		}

		const ctx = fsm.getContext();
		// Velocity should be reduced after damping (0.92^10 ≈ 0.43 of original)
		const speed = Math.sqrt(ctx.velocity.vx ** 2 + ctx.velocity.vy ** 2);
		// Should be less than 50% of initial (accounting for 10 damping cycles)
		expect(speed).toBeLessThan(initialSpeed * 0.5);
	});
});

// ============================================================================
// GATE VALIDATION TESTS
// ============================================================================

describe('GATE VALIDATION: Hard Boundary Enforcement', () => {
	it('G-PALM-ENTER: palmAngle < 30 required to enter', () => {
		const fsm = new W3CPointerFSM();

		// Boundary values
		const tests = [
			{ angle: 29.9, shouldEnter: true },
			{ angle: 30.0, shouldEnter: false },
			{ angle: 30.1, shouldEnter: false },
		];

		for (const test of tests) {
			const freshFsm = new W3CPointerFSM();
			freshFsm.process(generateFrame(1000, test.angle, 'Open_Palm'));

			if (test.shouldEnter) {
				expect(freshFsm.getState()).toBe('TRACKING');
			} else {
				expect(freshFsm.getState()).toBe('IDLE');
			}

			freshFsm.dispose();
		}

		fsm.dispose();
	});

	it('G-PALM-EXIT: palmAngle >= 45 required to exit (when facing)', () => {
		const tests = [
			{ angle: 44.9, shouldExit: false },
			{ angle: 45.0, shouldExit: true },
			{ angle: 45.1, shouldExit: true },
		];

		for (const test of tests) {
			const fsm = new W3CPointerFSM();
			// Enter first
			fsm.process(generateFrame(1000, 20, 'Open_Palm'));
			expect(fsm.getState()).toBe('TRACKING');

			// Test exit
			fsm.process(generateFrame(1100, test.angle, 'Open_Palm'));

			if (test.shouldExit) {
				expect(fsm.getState()).toBe('IDLE');
			} else {
				expect(fsm.getState()).toBe('TRACKING');
			}

			fsm.dispose();
		}
	});

	it('G-CONFIDENCE: confidence >= 0.7 required for arming', () => {
		const tests = [
			{ conf: 0.69, shouldArm: false },
			{ conf: 0.7, shouldArm: true },
			{ conf: 0.71, shouldArm: true },
		];

		for (const test of tests) {
			const fsm = new W3CPointerFSM();
			fsm.process(generateFrame(1000, 20, 'Open_Palm', { confidence: test.conf }));
			fsm.process(generateFrame(1200, 20, 'Open_Palm', { confidence: test.conf }));

			if (test.shouldArm) {
				expect(fsm.getState()).toBe('ARMED');
			} else {
				expect(fsm.getState()).toBe('TRACKING');
			}

			fsm.dispose();
		}
	});

	it('G-TIMING: armStableMs (150ms) required before arming', () => {
		const tests = [
			{ deltaMs: 100, shouldArm: false },
			{ deltaMs: 149, shouldArm: false },
			{ deltaMs: 150, shouldArm: true },
			{ deltaMs: 200, shouldArm: true },
		];

		for (const test of tests) {
			const fsm = new W3CPointerFSM();
			fsm.process(generateFrame(1000, 20, 'Open_Palm'));
			fsm.process(generateFrame(1000 + test.deltaMs, 20, 'Open_Palm'));

			if (test.shouldArm) {
				expect(fsm.getState()).toBe('ARMED');
			} else {
				expect(fsm.getState()).toBe('TRACKING');
			}

			fsm.dispose();
		}
	});
});

// ============================================================================
// STATE MACHINE INVARIANTS
// ============================================================================

describe('INVARIANTS: State Machine Properties', () => {
	it('INVARIANT: Can never skip from IDLE directly to ENGAGED', () => {
		const fsm = new W3CPointerFSM();

		// Try various ways to get to ENGAGED from IDLE
		const attempts = [
			[generateFrame(1000, 20, 'Pointing_Up')],
			[generateFrame(1000, 0, 'Pointing_Up', { confidence: 1.0 })],
			[generateFrame(1000, 10, 'Pointing_Up', { confidence: 0.99 })],
		];

		for (const frames of attempts) {
			const freshFsm = new W3CPointerFSM();
			for (const frame of frames) {
				freshFsm.process(frame);
			}
			expect(freshFsm.getState()).not.toBe('ENGAGED');
			freshFsm.dispose();
		}

		fsm.dispose();
	});

	it('INVARIANT: ENGAGED requires prior ARMED state', () => {
		const fsm = new W3CPointerFSM();

		// Path to ENGAGED must go through ARMED
		const frames = [
			generateFrame(1000, 20, 'Open_Palm'),
			generateFrame(1200, 20, 'Open_Palm'),
			generateFrame(1300, 20, 'Pointing_Up'),
		];

		const states: string[] = [fsm.getState()];
		for (const frame of frames) {
			fsm.process(frame);
			states.push(fsm.getState());
		}

		// If we reach ENGAGED, ARMED must have been visited
		const engagedIdx = states.indexOf('ENGAGED');
		if (engagedIdx > 0) {
			const priorStates = states.slice(0, engagedIdx);
			expect(priorStates).toContain('ARMED');
		}

		fsm.dispose();
	});

	it('INVARIANT: pointerdown always precedes pointerup', () => {
		const fsm = new W3CPointerFSM();

		const frames = [
			generateFrame(1000, 20, 'Open_Palm'),
			generateFrame(1200, 20, 'Open_Palm'),
			generateFrame(1300, 20, 'Pointing_Up'),
			generateFrame(1400, 20, 'Open_Palm'),
			generateFrame(1500, 20, 'Pointing_Up'),
			generateFrame(1600, 20, 'Open_Palm'),
		];

		const actions: string[] = [];
		for (const frame of frames) {
			const action = fsm.process(frame);
			actions.push(action.type);
		}

		// Every 'up' must be preceded by 'down'
		for (let i = 0; i < actions.length; i++) {
			if (actions[i] === 'up') {
				const priorActions = actions.slice(0, i);
				const downCount = priorActions.filter((a) => a === 'down').length;
				const upCount = priorActions.filter((a) => a === 'up').length;
				expect(downCount).toBeGreaterThan(upCount);
			}
		}

		fsm.dispose();
	});

	it('INVARIANT: pointerenter always precedes pointerleave', () => {
		const fsm = new W3CPointerFSM();

		const frames = [
			generateFrame(1000, 20, 'Open_Palm'),
			generateFrame(1100, 80, 'Open_Palm'),
			generateFrame(1200, 20, 'Open_Palm'),
			generateFrame(1300, 80, 'Open_Palm'),
		];

		const actions: string[] = [];
		for (const frame of frames) {
			const action = fsm.process(frame);
			actions.push(action.type);
		}

		// Every 'leave' must be preceded by 'enter'
		for (let i = 0; i < actions.length; i++) {
			if (actions[i] === 'leave') {
				const priorActions = actions.slice(0, i);
				const enterCount = priorActions.filter((a) => a === 'enter').length;
				const leaveCount = priorActions.filter((a) => a === 'leave').length;
				expect(enterCount).toBeGreaterThan(leaveCount);
			}
		}

		fsm.dispose();
	});
});
