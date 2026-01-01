/**
 * Golden Input Fixtures
 *
 * Gen87.X3 | Phase: VALIDATE (V) | Deterministic E2E Testing
 *
 * PURPOSE: Pre-recorded gesture frame sequences with controlled timestamps
 * for deterministic e2e testing. Simulates MediaPipe output without camera.
 *
 * USAGE:
 *   import { GOLDEN_SEQUENCES, playbackGoldenSequence } from './golden-input.js';
 *   const frames = GOLDEN_SEQUENCES.ARM_AND_CLICK;
 *
 * GROUNDED: W3C_GESTURE_CONTROL_PLANE_SPEC.md Section 4.3 FSM States
 */
// @ts-nocheck


import type { SmoothedFrame } from '../contracts/schemas.js';

// ============================================================================
// TYPES
// ============================================================================

export interface GoldenSequence {
	/** Descriptive name for the sequence */
	name: string;
	/** What this sequence tests */
	description: string;
	/** Expected FSM state transitions */
	expectedStates: string[];
	/** Expected pointer actions emitted */
	expectedActions: string[];
	/** The frame data */
	frames: SmoothedFrame[];
}

export interface PlaybackOptions {
	/** Time scale (1.0 = real-time, 2.0 = 2x speed) */
	timeScale?: number;
	/** Callback for each frame */
	onFrame?: (frame: SmoothedFrame, index: number) => void;
	/** Callback when sequence completes */
	onComplete?: () => void;
}

// ============================================================================
// FRAME FACTORY
// ============================================================================

let frameCounter = 0;

/**
 * Create a SmoothedFrame with deterministic values
 */
export function createGoldenFrame(overrides: Partial<SmoothedFrame>): SmoothedFrame {
	frameCounter++;
	return {
		ts: overrides.ts ?? frameCounter * 16, // ~60fps
		handId: overrides.handId ?? 'right',
		trackingOk: overrides.trackingOk ?? true,
		palmFacing: overrides.palmFacing ?? true,
		label: overrides.label ?? 'Open_Palm',
		confidence: overrides.confidence ?? 0.95,
		position: overrides.position ?? { x: 0.5, y: 0.5 },
		velocity: overrides.velocity ?? { x: 0, y: 0 },
		prediction: overrides.prediction ?? { x: 0.5, y: 0.5 },
	};
}

/**
 * Reset frame counter (for test isolation)
 */
export function resetFrameCounter(): void {
	frameCounter = 0;
}

/**
 * Generate frames for holding a gesture
 */
export function holdGesture(
	label: string,
	durationMs: number,
	startTs: number,
	position: { x: number; y: number } = { x: 0.5, y: 0.5 },
): SmoothedFrame[] {
	const frames: SmoothedFrame[] = [];
	const frameCount = Math.ceil(durationMs / 16); // ~60fps

	for (let i = 0; i < frameCount; i++) {
		frames.push(
			createGoldenFrame({
				ts: startTs + i * 16,
				label,
				position,
				palmFacing: true,
				trackingOk: true,
				confidence: 0.92 + Math.random() * 0.06, // 0.92-0.98
				velocity: { x: 0, y: 0 },
				prediction: position,
			}),
		);
	}

	return frames;
}

/**
 * Generate frames for moving to a position
 */
export function moveToPosition(
	fromPos: { x: number; y: number },
	toPos: { x: number; y: number },
	durationMs: number,
	startTs: number,
	label = 'Open_Palm',
): SmoothedFrame[] {
	const frames: SmoothedFrame[] = [];
	const frameCount = Math.ceil(durationMs / 16);

	for (let i = 0; i < frameCount; i++) {
		const t = i / (frameCount - 1); // 0 to 1
		const x = fromPos.x + (toPos.x - fromPos.x) * t;
		const y = fromPos.y + (toPos.y - fromPos.y) * t;

		// Calculate velocity
		const vx = (toPos.x - fromPos.x) / (durationMs / 1000);
		const vy = (toPos.y - fromPos.y) / (durationMs / 1000);

		frames.push(
			createGoldenFrame({
				ts: startTs + i * 16,
				label,
				position: { x, y },
				velocity: { x: vx, y: vy },
				prediction: {
					x: x + vx * 0.033, // 33ms prediction
					y: y + vy * 0.033,
				},
				palmFacing: true,
				trackingOk: true,
				confidence: 0.94,
			}),
		);
	}

	return frames;
}

// ============================================================================
// GOLDEN SEQUENCES
// ============================================================================

/**
 * SEQUENCE: ARM_BASELINE
 * Tests: DISARMED → ARMING → ARMED transition
 * Duration: ~300ms
 */
export const SEQ_ARM_BASELINE: GoldenSequence = {
	name: 'ARM_BASELINE',
	description: 'Hold Open_Palm with palm facing camera to arm the system',
	expectedStates: ['DISARMED', 'ARMING', 'ARMED'],
	expectedActions: ['none', 'none', 'move'],
	frames: [
		// Frame 0: Initial - no hand
		createGoldenFrame({ ts: 0, trackingOk: false, label: 'None', palmFacing: false }),

		// Frame 1: Hand detected, starts arming
		...holdGesture('Open_Palm', 250, 16, { x: 0.5, y: 0.5 }),
	].flat(),
};

/**
 * SEQUENCE: ARM_AND_CLICK
 * Tests: Full click sequence DISARMED → ARMED → DOWN_COMMIT → ARMED
 * Duration: ~600ms
 */
export const SEQ_ARM_AND_CLICK: GoldenSequence = {
	name: 'ARM_AND_CLICK',
	description: 'Arm system, then perform Pointing_Up gesture for click',
	expectedStates: ['DISARMED', 'ARMING', 'ARMED', 'DOWN_COMMIT', 'ARMED'],
	expectedActions: ['none', 'none', 'move', 'down', 'up'],
	frames: [
		// Phase 1: Arm (0-300ms)
		...holdGesture('Open_Palm', 300, 0, { x: 0.5, y: 0.5 }),

		// Phase 2: Click gesture (300-450ms)
		...holdGesture('Pointing_Up', 150, 300, { x: 0.5, y: 0.5 }),

		// Phase 3: Return to baseline (450-600ms)
		...holdGesture('Open_Palm', 150, 450, { x: 0.5, y: 0.5 }),
	].flat(),
};

/**
 * SEQUENCE: ARM_MOVE_CLICK
 * Tests: Arm, move cursor, click at target position
 * Duration: ~1000ms
 */
export const SEQ_ARM_MOVE_CLICK: GoldenSequence = {
	name: 'ARM_MOVE_CLICK',
	description: 'Arm, move cursor from center to corner, click',
	expectedStates: ['DISARMED', 'ARMING', 'ARMED', 'ARMED', 'DOWN_COMMIT', 'ARMED'],
	expectedActions: ['none', 'none', 'move', 'move', 'down', 'up'],
	frames: [
		// Phase 1: Arm at center (0-300ms)
		...holdGesture('Open_Palm', 300, 0, { x: 0.5, y: 0.5 }),

		// Phase 2: Move to top-left (300-600ms)
		...moveToPosition({ x: 0.5, y: 0.5 }, { x: 0.2, y: 0.2 }, 300, 300),

		// Phase 3: Hold at position (600-700ms)
		...holdGesture('Open_Palm', 100, 600, { x: 0.2, y: 0.2 }),

		// Phase 4: Click (700-850ms)
		...holdGesture('Pointing_Up', 150, 700, { x: 0.2, y: 0.2 }),

		// Phase 5: Return (850-1000ms)
		...holdGesture('Open_Palm', 150, 850, { x: 0.2, y: 0.2 }),
	].flat(),
};

/**
 * SEQUENCE: PAN_GESTURE
 * Tests: Victory gesture for navigation/pan
 * Duration: ~800ms
 */
export const SEQ_PAN_GESTURE: GoldenSequence = {
	name: 'PAN_GESTURE',
	description: 'Arm, then Victory gesture for pan/navigation',
	expectedStates: ['DISARMED', 'ARMING', 'ARMED', 'DOWN_NAV', 'ARMED'],
	expectedActions: ['none', 'none', 'move', 'down', 'up'],
	frames: [
		// Phase 1: Arm (0-300ms)
		...holdGesture('Open_Palm', 300, 0, { x: 0.5, y: 0.5 }),

		// Phase 2: Victory gesture (300-600ms)
		...holdGesture('Victory', 300, 300, { x: 0.5, y: 0.5 }),

		// Phase 3: Return (600-800ms)
		...holdGesture('Open_Palm', 200, 600, { x: 0.5, y: 0.5 }),
	].flat(),
};

/**
 * SEQUENCE: DISARM_TRACKING_LOST
 * Tests: System disarms when tracking lost
 * Duration: ~400ms
 */
export const SEQ_DISARM_TRACKING_LOST: GoldenSequence = {
	name: 'DISARM_TRACKING_LOST',
	description: 'System returns to DISARMED when hand tracking is lost',
	expectedStates: ['DISARMED', 'ARMING', 'ARMED', 'DISARMED'],
	expectedActions: ['none', 'none', 'move', 'none'],
	frames: [
		// Phase 1: Arm (0-300ms)
		...holdGesture('Open_Palm', 300, 0, { x: 0.5, y: 0.5 }),

		// Phase 2: Tracking lost (300-400ms)
		createGoldenFrame({ ts: 300, trackingOk: false, label: 'None', palmFacing: false }),
		createGoldenFrame({ ts: 316, trackingOk: false, label: 'None', palmFacing: false }),
		createGoldenFrame({ ts: 332, trackingOk: false, label: 'None', palmFacing: false }),
		createGoldenFrame({ ts: 348, trackingOk: false, label: 'None', palmFacing: false }),
		createGoldenFrame({ ts: 364, trackingOk: false, label: 'None', palmFacing: false }),
		createGoldenFrame({ ts: 380, trackingOk: false, label: 'None', palmFacing: false }),
	].flat(),
};

/**
 * SEQUENCE: ZOOM_THUMB_UP
 * Tests: Thumb_Up gesture for zoom in
 * Duration: ~600ms
 */
export const SEQ_ZOOM_THUMB_UP: GoldenSequence = {
	name: 'ZOOM_THUMB_UP',
	description: 'Arm, then Thumb_Up for zoom in',
	expectedStates: ['DISARMED', 'ARMING', 'ARMED', 'DOWN_ZOOM', 'ARMED'],
	expectedActions: ['none', 'none', 'move', 'down', 'up'],
	frames: [
		// Phase 1: Arm (0-300ms)
		...holdGesture('Open_Palm', 300, 0, { x: 0.5, y: 0.5 }),

		// Phase 2: Thumb up (300-450ms)
		...holdGesture('Thumb_Up', 150, 300, { x: 0.5, y: 0.5 }),

		// Phase 3: Return (450-600ms)
		...holdGesture('Open_Palm', 150, 450, { x: 0.5, y: 0.5 }),
	].flat(),
};

/**
 * SEQUENCE: QUAD_CURSOR_TOUR
 * Tests: Move cursor to all 4 quadrants
 * Duration: ~2000ms
 */
export const SEQ_QUAD_CURSOR_TOUR: GoldenSequence = {
	name: 'QUAD_CURSOR_TOUR',
	description: 'Arm and move cursor through all 4 quadrants (for quad view validation)',
	expectedStates: ['DISARMED', 'ARMING', 'ARMED', 'ARMED', 'ARMED', 'ARMED', 'ARMED'],
	expectedActions: ['none', 'none', 'move', 'move', 'move', 'move', 'move'],
	frames: [
		// Phase 1: Arm at center (0-300ms)
		...holdGesture('Open_Palm', 300, 0, { x: 0.5, y: 0.5 }),

		// Phase 2: Move to Q1 - top-right (300-600ms)
		...moveToPosition({ x: 0.5, y: 0.5 }, { x: 0.8, y: 0.2 }, 300, 300),
		...holdGesture('Open_Palm', 100, 600, { x: 0.8, y: 0.2 }),

		// Phase 3: Move to Q2 - top-left (700-1000ms)
		...moveToPosition({ x: 0.8, y: 0.2 }, { x: 0.2, y: 0.2 }, 300, 700),
		...holdGesture('Open_Palm', 100, 1000, { x: 0.2, y: 0.2 }),

		// Phase 4: Move to Q3 - bottom-left (1100-1400ms)
		...moveToPosition({ x: 0.2, y: 0.2 }, { x: 0.2, y: 0.8 }, 300, 1100),
		...holdGesture('Open_Palm', 100, 1400, { x: 0.2, y: 0.8 }),

		// Phase 5: Move to Q4 - bottom-right (1500-1800ms)
		...moveToPosition({ x: 0.2, y: 0.8 }, { x: 0.8, y: 0.8 }, 300, 1500),
		...holdGesture('Open_Palm', 100, 1800, { x: 0.8, y: 0.8 }),

		// Phase 6: Return to center (1900-2000ms)
		...moveToPosition({ x: 0.8, y: 0.8 }, { x: 0.5, y: 0.5 }, 100, 1900),
	].flat(),
};

// ============================================================================
// SEQUENCE REGISTRY
// ============================================================================

export const GOLDEN_SEQUENCES = {
	ARM_BASELINE: SEQ_ARM_BASELINE,
	ARM_AND_CLICK: SEQ_ARM_AND_CLICK,
	ARM_MOVE_CLICK: SEQ_ARM_MOVE_CLICK,
	PAN_GESTURE: SEQ_PAN_GESTURE,
	DISARM_TRACKING_LOST: SEQ_DISARM_TRACKING_LOST,
	ZOOM_THUMB_UP: SEQ_ZOOM_THUMB_UP,
	QUAD_CURSOR_TOUR: SEQ_QUAD_CURSOR_TOUR,
} as const;

export type GoldenSequenceName = keyof typeof GOLDEN_SEQUENCES;

// ============================================================================
// PLAYBACK UTILITIES
// ============================================================================

/**
 * Play back a golden sequence with timing
 */
export async function playbackGoldenSequence(
	sequence: GoldenSequence,
	options: PlaybackOptions = {},
): Promise<void> {
	const { timeScale = 1.0, onFrame, onComplete } = options;

	let lastTs = 0;

	for (let i = 0; i < sequence.frames.length; i++) {
		const frame = sequence.frames[i];

		// Calculate delay from timestamp delta
		if (i > 0) {
			const deltaMs = (frame.ts - lastTs) / timeScale;
			if (deltaMs > 0) {
				await new Promise((resolve) => setTimeout(resolve, deltaMs));
			}
		}

		lastTs = frame.ts;

		if (onFrame) {
			onFrame(frame, i);
		}
	}

	if (onComplete) {
		onComplete();
	}
}

/**
 * Get all frames as a single array (for sync processing)
 */
export function getAllFrames(sequence: GoldenSequence): SmoothedFrame[] {
	return [...sequence.frames];
}

/**
 * Get frame at specific index
 */
export function getFrameAt(sequence: GoldenSequence, index: number): SmoothedFrame | undefined {
	return sequence.frames[index];
}

/**
 * Get frames in time range
 */
export function getFramesInRange(
	sequence: GoldenSequence,
	startTs: number,
	endTs: number,
): SmoothedFrame[] {
	return sequence.frames.filter((f) => f.ts >= startTs && f.ts <= endTs);
}

/**
 * Export sequence to JSON (for external tools)
 */
export function exportSequenceToJSON(sequence: GoldenSequence): string {
	return JSON.stringify(sequence, null, 2);
}

/**
 * Import sequence from JSON
 */
export function importSequenceFromJSON(json: string): GoldenSequence {
	return JSON.parse(json) as GoldenSequence;
}

// ============================================================================
// TEST VALIDATION UTILITIES
// ============================================================================

/**
 * Validate FSM state sequence against expected
 */
export function validateStateSequence(
	actualStates: string[],
	expectedStates: string[],
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Check that all expected states appear in order
	let expectedIndex = 0;
	for (const state of actualStates) {
		if (state === expectedStates[expectedIndex]) {
			expectedIndex++;
		}
		if (expectedIndex >= expectedStates.length) {
			break;
		}
	}

	if (expectedIndex < expectedStates.length) {
		errors.push(`Missing expected states: ${expectedStates.slice(expectedIndex).join(' → ')}`);
		errors.push(`Got: ${actualStates.join(' → ')}`);
		errors.push(`Expected: ${expectedStates.join(' → ')}`);
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Validate action sequence against expected
 */
export function validateActionSequence(
	actualActions: string[],
	expectedActions: string[],
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Filter out duplicates for comparison
	const dedupedActual = actualActions.filter((a, i) => i === 0 || a !== actualActions[i - 1]);
	const dedupedExpected = expectedActions.filter((a, i) => i === 0 || a !== expectedActions[i - 1]);

	if (dedupedActual.length !== dedupedExpected.length) {
		errors.push(
			`Action count mismatch: got ${dedupedActual.length}, expected ${dedupedExpected.length}`,
		);
		errors.push(`Got: ${dedupedActual.join(' → ')}`);
		errors.push(`Expected: ${dedupedExpected.join(' → ')}`);
	} else {
		for (let i = 0; i < dedupedActual.length; i++) {
			if (dedupedActual[i] !== dedupedExpected[i]) {
				errors.push(
					`Action mismatch at index ${i}: got '${dedupedActual[i]}', expected '${dedupedExpected[i]}'`,
				);
			}
		}
	}

	return { valid: errors.length === 0, errors };
}
