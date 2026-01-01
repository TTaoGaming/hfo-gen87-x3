/**
 * @fileoverview RED Tests - Commit Gesture System
 *
 * SPEC FROM USER NOTES (2025-12-29):
 * - Armed state is STICKY - once armed, stays ready for gesture
 * - Only gesture needed: "pointer up" = thumb + middle finger pinch
 * - Index finger = pointer (stability detection - shouldn't move much)
 * - Commit gesture is swappable (adapter pattern)
 * - Hysteresis and stability on pointer up before commit
 * - Reset conditions: palm orientation lock OR open palm
 *
 * FSM Flow:
 *   [Disarmed] --palm orientation--> [Armed] --sticky-->
 *   [Armed] --pointer_up+stable--> [Committing] --hysteresis--> [Committed]
 *   [Committed] --open_palm OR palm_lock--> [Armed] (ready for next)
 *   [Armed] --palm_away--> [Disarmed]
 *
 * @module gesture/commit-gesture.test
 * @hive I (Interlock)
 * @tdd RED
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

// ============================================================================
// PORT INTERFACES (Hexagonal CDD)
// ============================================================================

/**
 * Landmark positions from MediaPipe
 */
interface HandLandmarks {
	thumb_tip: { x: number; y: number; z: number };
	index_tip: { x: number; y: number; z: number };
	middle_tip: { x: number; y: number; z: number };
	ring_tip: { x: number; y: number; z: number };
	pinky_tip: { x: number; y: number; z: number };
	wrist: { x: number; y: number; z: number };
	// MCPs for palm plane
	index_mcp: { x: number; y: number; z: number };
	middle_mcp: { x: number; y: number; z: number };
	pinky_mcp: { x: number; y: number; z: number };
}

/**
 * Commit gesture detection port - swappable
 */
interface CommitGesturePort {
	/** Detect if commit gesture is active */
	isCommitGesture(landmarks: HandLandmarks): boolean;
	/** Get confidence 0-1 */
	getConfidence(landmarks: HandLandmarks): number;
	/** Human-readable name */
	readonly gestureName: string;
}

/**
 * Pointer stability port - index finger shouldn't move much
 */
interface PointerStabilityPort {
	/** Update with new position, returns stability score 0-1 */
	update(position: { x: number; y: number }): number;
	/** Is stable enough for commit? */
	isStable(): boolean;
	/** Reset stability tracking */
	reset(): void;
	/** Configure stability threshold */
	setThreshold(threshold: number): void;
}

/**
 * Armed state machine port
 */
interface ArmedStateMachinePort {
	/** Current state */
	readonly state: 'disarmed' | 'armed' | 'committing' | 'committed';
	/** Is sticky armed? */
	readonly isArmed: boolean;
	/** Process frame */
	update(landmarks: HandLandmarks, palmOriented: boolean): void;
	/** Force reset */
	reset(): void;
	/** Get time in current state (ms) */
	getStateTime(): number;
}

/**
 * Hysteresis gate for commit stability
 */
interface CommitHysteresisPort {
	/** Update gate with gesture active state */
	update(gestureActive: boolean, timestampMs: number): boolean;
	/** Is commit confirmed? */
	isConfirmed(): boolean;
	/** Reset gate */
	reset(): void;
	/** Configure hold time required */
	setHoldTime(ms: number): void;
}

/**
 * Reset condition detector
 */
interface ResetConditionPort {
	/** Check if reset should occur */
	shouldReset(landmarks: HandLandmarks, palmOriented: boolean): boolean;
	/** Which reset triggered */
	getResetType(): 'palm_lock' | 'open_palm' | 'none';
}

// ============================================================================
// PLACEHOLDER IMPORTS (Will fail - RED phase)
// These modules DON'T EXIST YET - tests will fail at runtime
// ============================================================================

// RED PHASE: These will throw "module not found" or "is not a constructor"
// When we implement GREEN phase, we'll create these files
let ThumbMiddlePinchDetector: any;
let PointerStabilityTracker: any;
let StickyArmedFSM: any;
let CommitHysteresis: any;
let ResetConditionDetector: any;
let CommitGestureAdapter: any;

try {
	// Dynamic import attempts - will fail until modules exist
	ThumbMiddlePinchDetector = require('./thumb-middle-pinch.js').ThumbMiddlePinchDetector;
} catch {
	ThumbMiddlePinchDetector = class {
		constructor() {
			throw new Error('ThumbMiddlePinchDetector not implemented');
		}
	};
}

try {
	PointerStabilityTracker = require('./pointer-stability.js').PointerStabilityTracker;
} catch {
	PointerStabilityTracker = class {
		constructor() {
			throw new Error('PointerStabilityTracker not implemented');
		}
	};
}

try {
	StickyArmedFSM = require('./sticky-armed-fsm.js').StickyArmedFSM;
} catch {
	StickyArmedFSM = class {
		constructor() {
			throw new Error('StickyArmedFSM not implemented');
		}
	};
}

try {
	CommitHysteresis = require('./commit-hysteresis.js').CommitHysteresis;
} catch {
	CommitHysteresis = class {
		constructor() {
			throw new Error('CommitHysteresis not implemented');
		}
	};
}

try {
	ResetConditionDetector = require('./reset-condition.js').ResetConditionDetector;
} catch {
	ResetConditionDetector = class {
		constructor() {
			throw new Error('ResetConditionDetector not implemented');
		}
	};
}

try {
	CommitGestureAdapter = require('./commit-gesture-adapter.js').CommitGestureAdapter;
} catch {
	CommitGestureAdapter = class {
		constructor() {
			throw new Error('CommitGestureAdapter not implemented');
		}
	};
}

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

const landmarkArb = fc.record({
	x: fc.float({ min: 0, max: 1, noNaN: true }),
	y: fc.float({ min: 0, max: 1, noNaN: true }),
	z: fc.float({ min: -0.5, max: 0.5, noNaN: true }),
});

const handLandmarksArb = fc.record({
	thumb_tip: landmarkArb,
	index_tip: landmarkArb,
	middle_tip: landmarkArb,
	ring_tip: landmarkArb,
	pinky_tip: landmarkArb,
	wrist: landmarkArb,
	index_mcp: landmarkArb,
	middle_mcp: landmarkArb,
	pinky_mcp: landmarkArb,
});

// ============================================================================
// THUMB-MIDDLE PINCH DETECTOR TESTS
// ============================================================================

describe('ThumbMiddlePinchDetector (pointer_up gesture)', () => {
	it('should implement CommitGesturePort interface', () => {
		const detector = new ThumbMiddlePinchDetector();
		expect(detector.isCommitGesture).toBeInstanceOf(Function);
		expect(detector.getConfidence).toBeInstanceOf(Function);
		expect(detector.gestureName).toBe('pointer_up');
	});

	it('should detect pinch when thumb and middle finger tips are close', () => {
		const detector = new ThumbMiddlePinchDetector();
		const landmarks: HandLandmarks = {
			thumb_tip: { x: 0.5, y: 0.5, z: 0 },
			middle_tip: { x: 0.52, y: 0.51, z: 0.01 }, // Very close
			index_tip: { x: 0.6, y: 0.3, z: 0 }, // Extended (pointer)
			ring_tip: { x: 0.4, y: 0.6, z: 0 },
			pinky_tip: { x: 0.35, y: 0.65, z: 0 },
			wrist: { x: 0.5, y: 0.8, z: 0 },
			index_mcp: { x: 0.55, y: 0.6, z: 0 },
			middle_mcp: { x: 0.5, y: 0.6, z: 0 },
			pinky_mcp: { x: 0.4, y: 0.65, z: 0 },
		};

		expect(detector.isCommitGesture(landmarks)).toBe(true);
		expect(detector.getConfidence(landmarks)).toBeGreaterThan(0.8);
	});

	it('should NOT detect pinch when fingers are far apart', () => {
		const detector = new ThumbMiddlePinchDetector();
		const landmarks: HandLandmarks = {
			thumb_tip: { x: 0.3, y: 0.5, z: 0 },
			middle_tip: { x: 0.7, y: 0.5, z: 0 }, // Far from thumb
			index_tip: { x: 0.6, y: 0.3, z: 0 },
			ring_tip: { x: 0.4, y: 0.6, z: 0 },
			pinky_tip: { x: 0.35, y: 0.65, z: 0 },
			wrist: { x: 0.5, y: 0.8, z: 0 },
			index_mcp: { x: 0.55, y: 0.6, z: 0 },
			middle_mcp: { x: 0.5, y: 0.6, z: 0 },
			pinky_mcp: { x: 0.4, y: 0.65, z: 0 },
		};

		expect(detector.isCommitGesture(landmarks)).toBe(false);
		expect(detector.getConfidence(landmarks)).toBeLessThan(0.3);
	});

	it('should require index finger to be extended (pointer position)', () => {
		const detector = new ThumbMiddlePinchDetector();
		// Pinch is there but index is curled
		const landmarks: HandLandmarks = {
			thumb_tip: { x: 0.5, y: 0.5, z: 0 },
			middle_tip: { x: 0.52, y: 0.51, z: 0.01 },
			index_tip: { x: 0.5, y: 0.55, z: 0 }, // Curled, not extended
			ring_tip: { x: 0.4, y: 0.6, z: 0 },
			pinky_tip: { x: 0.35, y: 0.65, z: 0 },
			wrist: { x: 0.5, y: 0.8, z: 0 },
			index_mcp: { x: 0.55, y: 0.6, z: 0 },
			middle_mcp: { x: 0.5, y: 0.6, z: 0 },
			pinky_mcp: { x: 0.4, y: 0.65, z: 0 },
		};

		// Should fail - index must be extended for pointer_up
		expect(detector.isCommitGesture(landmarks)).toBe(false);
	});

	it('should have configurable pinch distance threshold', () => {
		const detector = new ThumbMiddlePinchDetector({ pinchThreshold: 0.1 });
		expect(detector).toBeDefined();

		const detectorTight = new ThumbMiddlePinchDetector({ pinchThreshold: 0.03 });
		expect(detectorTight).toBeDefined();
	});

	it('should return confidence between 0 and 1 (property)', () => {
		fc.assert(
			fc.property(handLandmarksArb, (landmarks) => {
				const detector = new ThumbMiddlePinchDetector();
				const confidence = detector.getConfidence(landmarks);
				return confidence >= 0 && confidence <= 1;
			}),
		);
	});
});

// ============================================================================
// POINTER STABILITY TRACKER TESTS
// ============================================================================

describe('PointerStabilityTracker (index finger stability)', () => {
	it('should implement PointerStabilityPort interface', () => {
		const tracker = new PointerStabilityTracker();
		expect(tracker.update).toBeInstanceOf(Function);
		expect(tracker.isStable).toBeInstanceOf(Function);
		expect(tracker.reset).toBeInstanceOf(Function);
		expect(tracker.setThreshold).toBeInstanceOf(Function);
	});

	it('should report stable when pointer barely moves', () => {
		const tracker = new PointerStabilityTracker({ windowSize: 5 });

		// Barely moving pointer
		tracker.update({ x: 0.5, y: 0.5 });
		tracker.update({ x: 0.501, y: 0.499 });
		tracker.update({ x: 0.502, y: 0.501 });
		tracker.update({ x: 0.5, y: 0.5 });
		tracker.update({ x: 0.501, y: 0.5 });

		expect(tracker.isStable()).toBe(true);
	});

	it('should report unstable when pointer moves significantly', () => {
		const tracker = new PointerStabilityTracker({ windowSize: 5 });

		// Moving pointer
		tracker.update({ x: 0.5, y: 0.5 });
		tracker.update({ x: 0.55, y: 0.45 });
		tracker.update({ x: 0.6, y: 0.4 });
		tracker.update({ x: 0.65, y: 0.35 });
		tracker.update({ x: 0.7, y: 0.3 });

		expect(tracker.isStable()).toBe(false);
	});

	it('should return stability score 0-1', () => {
		const tracker = new PointerStabilityTracker();
		const score = tracker.update({ x: 0.5, y: 0.5 });
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(1);
	});

	it('should reset tracked history', () => {
		const tracker = new PointerStabilityTracker({ windowSize: 3 });

		// Build up stable history
		tracker.update({ x: 0.5, y: 0.5 });
		tracker.update({ x: 0.5, y: 0.5 });
		tracker.update({ x: 0.5, y: 0.5 });
		expect(tracker.isStable()).toBe(true);

		// Reset
		tracker.reset();

		// Should need to rebuild
		expect(tracker.isStable()).toBe(false); // Not enough samples
	});

	it('should allow configurable stability threshold', () => {
		const tracker = new PointerStabilityTracker();
		tracker.setThreshold(0.01); // Very strict

		tracker.update({ x: 0.5, y: 0.5 });
		tracker.update({ x: 0.52, y: 0.48 }); // Small but exceeds strict threshold

		expect(tracker.isStable()).toBe(false);
	});

	it('should use sliding window for variance calculation', () => {
		const tracker = new PointerStabilityTracker({ windowSize: 3 });

		// Initial unstable movements
		tracker.update({ x: 0.1, y: 0.1 });
		tracker.update({ x: 0.9, y: 0.9 });
		tracker.update({ x: 0.1, y: 0.1 });
		expect(tracker.isStable()).toBe(false);

		// Now stable - old samples should slide out
		tracker.update({ x: 0.5, y: 0.5 });
		tracker.update({ x: 0.5, y: 0.5 });
		tracker.update({ x: 0.5, y: 0.5 });
		expect(tracker.isStable()).toBe(true);
	});
});

// ============================================================================
// STICKY ARMED FSM TESTS
// ============================================================================

describe('StickyArmedFSM (armed state machine)', () => {
	it('should implement ArmedStateMachinePort interface', () => {
		const fsm = new StickyArmedFSM();
		expect(fsm.state).toBeDefined();
		expect(fsm.isArmed).toBeDefined();
		expect(fsm.update).toBeInstanceOf(Function);
		expect(fsm.reset).toBeInstanceOf(Function);
		expect(fsm.getStateTime).toBeInstanceOf(Function);
	});

	it('should start in disarmed state', () => {
		const fsm = new StickyArmedFSM();
		expect(fsm.state).toBe('disarmed');
		expect(fsm.isArmed).toBe(false);
	});

	it('should transition to armed when palm oriented', () => {
		const fsm = new StickyArmedFSM();
		const landmarks = createMockLandmarks();

		fsm.update(landmarks, true); // palmOriented = true

		expect(fsm.state).toBe('armed');
		expect(fsm.isArmed).toBe(true);
	});

	it('should STAY armed (sticky) until explicit reset', () => {
		const fsm = new StickyArmedFSM();
		const landmarks = createMockLandmarks();

		// Arm
		fsm.update(landmarks, true);
		expect(fsm.isArmed).toBe(true);

		// Palm orientation lost but should stay armed (STICKY)
		fsm.update(landmarks, false);
		expect(fsm.isArmed).toBe(true); // Still armed!
		expect(fsm.state).toBe('armed');
	});

	it('should transition to committing when gesture detected and stable', () => {
		const fsm = new StickyArmedFSM({
			commitGesture: new ThumbMiddlePinchDetector(),
			pointerStability: new PointerStabilityTracker(),
		});
		const landmarks = createPinchLandmarks();

		// First arm
		fsm.update(landmarks, true);
		expect(fsm.state).toBe('armed');

		// Stable pointer + pinch gesture
		// (FSM should check both commit gesture and stability)
		fsm.update(landmarks, true);

		expect(fsm.state).toBe('committing');
	});

	it('should transition to committed after hysteresis hold', () => {
		const fsm = new StickyArmedFSM({
			hysteresisMs: 100, // 100ms hold required
		});
		const landmarks = createPinchLandmarks();

		// Arm and start committing
		fsm.update(landmarks, true);
		fsm.update(landmarks, true); // Start commit
		expect(fsm.state).toBe('committing');

		// Hold for hysteresis period
		// (In real implementation, this would use timestamps)
		// Simulate time passing...
		fsm.update(landmarks, true); // Still holding

		// After hold time, should commit
		expect(fsm.state).toBe('committed');
	});

	it('should return to armed (not disarmed) after commit', () => {
		const fsm = new StickyArmedFSM();
		const landmarks = createMockLandmarks();

		// Go through full cycle
		fsm.update(landmarks, true); // arm
		// ... simulate commit flow ...

		// After commit, with open palm reset, should go back to armed
		const openPalmLandmarks = createOpenPalmLandmarks();
		fsm.update(openPalmLandmarks, true);

		expect(fsm.state).toBe('armed'); // Ready for next gesture
		expect(fsm.isArmed).toBe(true);
	});

	it('should disarm when palm orientation is lost for extended time', () => {
		const fsm = new StickyArmedFSM({
			disarmTimeoutMs: 2000, // 2 seconds without palm orientation
		});
		const landmarks = createMockLandmarks();

		// Arm
		fsm.update(landmarks, true);
		expect(fsm.isArmed).toBe(true);

		// Lose palm orientation for extended time
		// (In real implementation, this tracks time)
		// Only after timeout should it disarm
		fsm.forceDisarmTimeout(); // Test helper

		expect(fsm.state).toBe('disarmed');
	});

	it('should track time in current state', () => {
		const fsm = new StickyArmedFSM();
		const landmarks = createMockLandmarks();

		fsm.update(landmarks, true);

		// Should track how long we've been armed
		const time1 = fsm.getStateTime();
		expect(time1).toBeGreaterThanOrEqual(0);
	});

	it('should allow force reset to disarmed', () => {
		const fsm = new StickyArmedFSM();
		const landmarks = createMockLandmarks();

		fsm.update(landmarks, true);
		expect(fsm.isArmed).toBe(true);

		fsm.reset();

		expect(fsm.state).toBe('disarmed');
		expect(fsm.isArmed).toBe(false);
	});
});

// ============================================================================
// COMMIT HYSTERESIS TESTS
// ============================================================================

describe('CommitHysteresis (stable commit gate)', () => {
	it('should implement CommitHysteresisPort interface', () => {
		const hysteresis = new CommitHysteresis();
		expect(hysteresis.update).toBeInstanceOf(Function);
		expect(hysteresis.isConfirmed).toBeInstanceOf(Function);
		expect(hysteresis.reset).toBeInstanceOf(Function);
		expect(hysteresis.setHoldTime).toBeInstanceOf(Function);
	});

	it('should NOT confirm immediately', () => {
		const hysteresis = new CommitHysteresis({ holdTimeMs: 100 });

		hysteresis.update(true, 0); // Gesture active at t=0

		expect(hysteresis.isConfirmed()).toBe(false); // Need to hold
	});

	it('should confirm after hold time', () => {
		const hysteresis = new CommitHysteresis({ holdTimeMs: 100 });

		hysteresis.update(true, 0); // Start at t=0
		hysteresis.update(true, 50); // Still holding at t=50
		hysteresis.update(true, 100); // Held for 100ms

		expect(hysteresis.isConfirmed()).toBe(true);
	});

	it('should reset if gesture released before hold time', () => {
		const hysteresis = new CommitHysteresis({ holdTimeMs: 100 });

		hysteresis.update(true, 0); // Start
		hysteresis.update(true, 50); // Holding
		hysteresis.update(false, 60); // Released early!

		expect(hysteresis.isConfirmed()).toBe(false);

		// Should need full hold time again
		hysteresis.update(true, 100);
		hysteresis.update(true, 150);
		expect(hysteresis.isConfirmed()).toBe(false); // Only 50ms since restart
	});

	it('should reset state on reset()', () => {
		const hysteresis = new CommitHysteresis({ holdTimeMs: 100 });

		hysteresis.update(true, 0);
		hysteresis.update(true, 100);
		expect(hysteresis.isConfirmed()).toBe(true);

		hysteresis.reset();

		expect(hysteresis.isConfirmed()).toBe(false);
	});

	it('should allow configurable hold time', () => {
		const hysteresis = new CommitHysteresis({ holdTimeMs: 50 });

		hysteresis.update(true, 0);
		hysteresis.update(true, 50);
		expect(hysteresis.isConfirmed()).toBe(true);

		hysteresis.setHoldTime(200);
		hysteresis.reset();

		hysteresis.update(true, 0);
		hysteresis.update(true, 100);
		expect(hysteresis.isConfirmed()).toBe(false); // Need 200ms now
	});

	it('should handle any gesture sequence without crashing (property)', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 50, max: 500 }),
				fc.array(fc.boolean(), { minLength: 5, maxLength: 20 }),
				(holdTime, sequence) => {
					const hysteresis = new CommitHysteresis({ holdTimeMs: holdTime });

					let time = 0;
					for (const active of sequence) {
						hysteresis.update(active, time);
						time += 20;
					}

					// Should not throw
					const confirmed = hysteresis.isConfirmed();
					return typeof confirmed === 'boolean';
				},
			),
		);
	});
});

// ============================================================================
// RESET CONDITION DETECTOR TESTS
// ============================================================================

describe('ResetConditionDetector (palm lock or open palm reset)', () => {
	it('should implement ResetConditionPort interface', () => {
		const detector = new ResetConditionDetector();
		expect(detector.shouldReset).toBeInstanceOf(Function);
		expect(detector.getResetType).toBeInstanceOf(Function);
	});

	it('should detect palm_lock reset (return to oriented palm)', () => {
		const detector = new ResetConditionDetector();
		const landmarks = createPalmOrientedLandmarks();

		const shouldReset = detector.shouldReset(landmarks, true);

		expect(shouldReset).toBe(true);
		expect(detector.getResetType()).toBe('palm_lock');
	});

	it('should detect open_palm reset (all fingers extended)', () => {
		const detector = new ResetConditionDetector();
		const landmarks = createOpenPalmLandmarks();

		const shouldReset = detector.shouldReset(landmarks, true);

		expect(shouldReset).toBe(true);
		expect(detector.getResetType()).toBe('open_palm');
	});

	it('should return none when no reset condition met', () => {
		const detector = new ResetConditionDetector();
		const landmarks = createPinchLandmarks(); // Mid-gesture

		const shouldReset = detector.shouldReset(landmarks, true);

		expect(shouldReset).toBe(false);
		expect(detector.getResetType()).toBe('none');
	});

	it('should prioritize palm_lock over open_palm if both detected', () => {
		const detector = new ResetConditionDetector();
		// Landmarks that could match both
		const landmarks = createOpenPalmLandmarks();

		detector.shouldReset(landmarks, true); // Palm oriented + open palm

		// palm_lock should be primary reset
		expect(detector.getResetType()).toBe('palm_lock');
	});

	it('should have configurable open palm detection threshold', () => {
		const detector = new ResetConditionDetector({
			openPalmThreshold: 0.9, // Very strict
		});

		// Partially open palm
		const landmarks = createPartiallyOpenPalmLandmarks();

		expect(detector.shouldReset(landmarks, false)).toBe(false);
	});
});

// ============================================================================
// COMMIT GESTURE ADAPTER TESTS (Swappable)
// ============================================================================

describe('CommitGestureAdapter (swappable gesture detection)', () => {
	it('should accept any CommitGesturePort implementation', () => {
		const pinchDetector = new ThumbMiddlePinchDetector();
		const adapter = new CommitGestureAdapter(pinchDetector);

		expect(adapter.detector.gestureName).toBe('pointer_up');
	});

	it('should allow runtime swap of gesture detector', () => {
		const adapter = new CommitGestureAdapter(new ThumbMiddlePinchDetector());
		expect(adapter.detector.gestureName).toBe('pointer_up');

		// Create alternative detector
		const altDetector: CommitGesturePort = {
			gestureName: 'fist_close',
			isCommitGesture: () => false,
			getConfidence: () => 0,
		};

		adapter.setDetector(altDetector);
		expect(adapter.detector.gestureName).toBe('fist_close');
	});

	it('should pass through gesture detection calls', () => {
		const mockDetector: CommitGesturePort = {
			gestureName: 'test',
			isCommitGesture: () => true,
			getConfidence: () => 0.95,
		};

		const adapter = new CommitGestureAdapter(mockDetector);
		const landmarks = createMockLandmarks();

		expect(adapter.isCommitGesture(landmarks)).toBe(true);
		expect(adapter.getConfidence(landmarks)).toBe(0.95);
	});

	it('should emit events on gesture state change', () => {
		const adapter = new CommitGestureAdapter(new ThumbMiddlePinchDetector());

		const events: string[] = [];
		adapter.onGestureStart(() => events.push('start'));
		adapter.onGestureEnd(() => events.push('end'));

		// Simulate gesture cycle
		adapter.update(createPinchLandmarks());
		expect(events).toContain('start');

		adapter.update(createMockLandmarks()); // Open hand
		expect(events).toContain('end');
	});
});

// ============================================================================
// INTEGRATION: FULL COMMIT FLOW TESTS
// ============================================================================

describe('Full Commit Flow Integration', () => {
	it('should complete: armed → pointer_up → stable → commit → reset', () => {
		const fsm = new StickyArmedFSM({
			commitGesture: new ThumbMiddlePinchDetector(),
			pointerStability: new PointerStabilityTracker(),
			hysteresisMs: 50,
		});

		// 1. Start disarmed
		expect(fsm.state).toBe('disarmed');

		// 2. Palm oriented → armed
		fsm.update(createPalmOrientedLandmarks(), true);
		expect(fsm.state).toBe('armed');

		// 3. Pointer up gesture (stable index + thumb-middle pinch)
		const pinchLandmarks = createStablePinchLandmarks();
		fsm.update(pinchLandmarks, true);
		expect(fsm.state).toBe('committing');

		// 4. Hold for hysteresis
		fsm.update(pinchLandmarks, true); // +50ms simulated
		expect(fsm.state).toBe('committed');

		// 5. Open palm reset → back to armed
		fsm.update(createOpenPalmLandmarks(), true);
		expect(fsm.state).toBe('armed'); // Ready for next gesture
	});

	it('should abort commit if pointer moves during hysteresis', () => {
		const fsm = new StickyArmedFSM({
			commitGesture: new ThumbMiddlePinchDetector(),
			pointerStability: new PointerStabilityTracker({ threshold: 0.02 }),
			hysteresisMs: 100,
		});

		// Arm
		fsm.update(createPalmOrientedLandmarks(), true);

		// Start commit
		fsm.update(createStablePinchLandmarks(), true);
		expect(fsm.state).toBe('committing');

		// Move pointer during hysteresis!
		const movedLandmarks = createPinchLandmarksWithMovedPointer();
		fsm.update(movedLandmarks, true);

		// Should abort back to armed
		expect(fsm.state).toBe('armed');
	});

	it('should stay armed after commit (sticky)', () => {
		const fsm = new StickyArmedFSM();

		// Complete a commit cycle
		fsm.update(createPalmOrientedLandmarks(), true);
		fsm.update(createStablePinchLandmarks(), true);
		fsm.update(createStablePinchLandmarks(), true); // Complete commit
		fsm.update(createOpenPalmLandmarks(), true); // Reset

		// Should be armed, not disarmed
		expect(fsm.isArmed).toBe(true);
		expect(fsm.state).toBe('armed');

		// Ready for another gesture immediately
		fsm.update(createStablePinchLandmarks(), true);
		expect(fsm.state).toBe('committing');
	});
});

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockLandmarks(): HandLandmarks {
	return {
		thumb_tip: { x: 0.3, y: 0.5, z: 0 },
		index_tip: { x: 0.6, y: 0.3, z: 0 },
		middle_tip: { x: 0.5, y: 0.4, z: 0 },
		ring_tip: { x: 0.4, y: 0.5, z: 0 },
		pinky_tip: { x: 0.35, y: 0.55, z: 0 },
		wrist: { x: 0.5, y: 0.8, z: 0 },
		index_mcp: { x: 0.55, y: 0.6, z: 0 },
		middle_mcp: { x: 0.5, y: 0.6, z: 0 },
		pinky_mcp: { x: 0.4, y: 0.65, z: 0 },
	};
}

function createPinchLandmarks(): HandLandmarks {
	return {
		thumb_tip: { x: 0.5, y: 0.5, z: 0 },
		middle_tip: { x: 0.52, y: 0.51, z: 0.01 }, // Close to thumb
		index_tip: { x: 0.6, y: 0.2, z: 0 }, // Extended pointer
		ring_tip: { x: 0.4, y: 0.6, z: 0 },
		pinky_tip: { x: 0.35, y: 0.65, z: 0 },
		wrist: { x: 0.5, y: 0.8, z: 0 },
		index_mcp: { x: 0.55, y: 0.6, z: 0 },
		middle_mcp: { x: 0.5, y: 0.6, z: 0 },
		pinky_mcp: { x: 0.4, y: 0.65, z: 0 },
	};
}

function createStablePinchLandmarks(): HandLandmarks {
	// Same as pinch but pointer is stable
	return createPinchLandmarks();
}

function createPinchLandmarksWithMovedPointer(): HandLandmarks {
	const landmarks = createPinchLandmarks();
	landmarks.index_tip = { x: 0.7, y: 0.15, z: 0 }; // Moved significantly
	return landmarks;
}

function createOpenPalmLandmarks(): HandLandmarks {
	return {
		thumb_tip: { x: 0.2, y: 0.3, z: 0 },
		index_tip: { x: 0.4, y: 0.1, z: 0 }, // Extended
		middle_tip: { x: 0.5, y: 0.1, z: 0 }, // Extended
		ring_tip: { x: 0.6, y: 0.1, z: 0 }, // Extended
		pinky_tip: { x: 0.7, y: 0.15, z: 0 }, // Extended
		wrist: { x: 0.5, y: 0.8, z: 0 },
		index_mcp: { x: 0.4, y: 0.5, z: 0 },
		middle_mcp: { x: 0.5, y: 0.5, z: 0 },
		pinky_mcp: { x: 0.65, y: 0.5, z: 0 },
	};
}

function createPartiallyOpenPalmLandmarks(): HandLandmarks {
	return {
		thumb_tip: { x: 0.25, y: 0.35, z: 0 },
		index_tip: { x: 0.4, y: 0.15, z: 0 },
		middle_tip: { x: 0.5, y: 0.2, z: 0 }, // Not fully extended
		ring_tip: { x: 0.55, y: 0.3, z: 0 }, // Curled
		pinky_tip: { x: 0.6, y: 0.35, z: 0 }, // Curled
		wrist: { x: 0.5, y: 0.8, z: 0 },
		index_mcp: { x: 0.4, y: 0.5, z: 0 },
		middle_mcp: { x: 0.5, y: 0.5, z: 0 },
		pinky_mcp: { x: 0.6, y: 0.55, z: 0 },
	};
}

function createPalmOrientedLandmarks(): HandLandmarks {
	// Palm facing camera (z values similar)
	return {
		thumb_tip: { x: 0.25, y: 0.4, z: 0.02 },
		index_tip: { x: 0.4, y: 0.2, z: 0.01 },
		middle_tip: { x: 0.5, y: 0.2, z: 0.01 },
		ring_tip: { x: 0.55, y: 0.25, z: 0.01 },
		pinky_tip: { x: 0.6, y: 0.3, z: 0.02 },
		wrist: { x: 0.5, y: 0.8, z: 0 },
		index_mcp: { x: 0.4, y: 0.5, z: 0 },
		middle_mcp: { x: 0.5, y: 0.5, z: 0 },
		pinky_mcp: { x: 0.6, y: 0.55, z: 0 },
	};
}
