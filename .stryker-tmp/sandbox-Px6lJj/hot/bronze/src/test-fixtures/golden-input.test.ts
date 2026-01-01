/**
 * Golden Input Fixtures Tests
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * Tests deterministic golden input sequences for FSM validation.
 */
// @ts-nocheck

import { beforeEach, describe, expect, it } from 'vitest';
import { XStateFSMAdapter } from '../adapters/xstate-fsm.adapter.js';
import {
	GOLDEN_SEQUENCES,
	createGoldenFrame,
	exportSequenceToJSON,
	getAllFrames,
	getFrameAt,
	getFramesInRange,
	holdGesture,
	importSequenceFromJSON,
	moveToPosition,
	playbackGoldenSequence,
	resetFrameCounter,
	validateActionSequence,
	validateStateSequence,
} from './golden-input.js';

// ============================================================================
// FRAME FACTORY TESTS
// ============================================================================

describe('Golden Frame Factory', () => {
	beforeEach(() => {
		resetFrameCounter();
	});

	it('should create frame with default values', () => {
		const frame = createGoldenFrame({});

		expect(frame.ts).toBe(16); // First frame at 16ms
		expect(frame.handId).toBe('right');
		expect(frame.trackingOk).toBe(true);
		expect(frame.palmFacing).toBe(true);
		expect(frame.label).toBe('Open_Palm');
		expect(frame.confidence).toBeGreaterThanOrEqual(0.9);
	});

	it('should create frame with overrides', () => {
		const frame = createGoldenFrame({
			ts: 100,
			label: 'Pointing_Up',
			confidence: 0.88,
			position: { x: 0.25, y: 0.75 },
		});

		expect(frame.ts).toBe(100);
		expect(frame.label).toBe('Pointing_Up');
		expect(frame.confidence).toBe(0.88);
		expect(frame.position).toEqual({ x: 0.25, y: 0.75 });
	});

	it('should increment frame counter for auto-timestamp', () => {
		const frame1 = createGoldenFrame({});
		const frame2 = createGoldenFrame({});
		const frame3 = createGoldenFrame({});

		expect(frame1.ts).toBe(16);
		expect(frame2.ts).toBe(32);
		expect(frame3.ts).toBe(48);
	});

	it('should reset frame counter', () => {
		createGoldenFrame({});
		createGoldenFrame({});
		resetFrameCounter();
		const frame = createGoldenFrame({});

		expect(frame.ts).toBe(16);
	});
});

// ============================================================================
// GESTURE HOLD TESTS
// ============================================================================

describe('holdGesture', () => {
	beforeEach(() => {
		resetFrameCounter();
	});

	it('should generate frames for specified duration', () => {
		const frames = holdGesture('Open_Palm', 100, 0);

		// 100ms at 16ms per frame ≈ 7 frames
		expect(frames.length).toBeGreaterThanOrEqual(6);
		expect(frames.length).toBeLessThanOrEqual(8);
	});

	it('should set all frames to specified gesture', () => {
		const frames = holdGesture('Victory', 50, 0);

		for (const frame of frames) {
			expect(frame.label).toBe('Victory');
		}
	});

	it('should start at specified timestamp', () => {
		const frames = holdGesture('Open_Palm', 50, 1000);

		expect(frames[0].ts).toBe(1000);
		expect(frames[frames.length - 1].ts).toBeGreaterThan(1000);
	});

	it('should set position for all frames', () => {
		const frames = holdGesture('Open_Palm', 50, 0, { x: 0.1, y: 0.9 });

		for (const frame of frames) {
			expect(frame.position).toEqual({ x: 0.1, y: 0.9 });
		}
	});

	it('should maintain tracking and palm facing', () => {
		const frames = holdGesture('Open_Palm', 50, 0);

		for (const frame of frames) {
			expect(frame.trackingOk).toBe(true);
			expect(frame.palmFacing).toBe(true);
		}
	});
});

// ============================================================================
// MOVE TO POSITION TESTS
// ============================================================================

describe('moveToPosition', () => {
	beforeEach(() => {
		resetFrameCounter();
	});

	it('should interpolate position over duration', () => {
		const frames = moveToPosition(
			{ x: 0, y: 0 },
			{ x: 1, y: 1 },
			160, // ~10 frames
			0,
		);

		expect(frames[0].position.x).toBeCloseTo(0, 1);
		expect(frames[frames.length - 1].position.x).toBeCloseTo(1, 1);
	});

	it('should calculate velocity', () => {
		const frames = moveToPosition(
			{ x: 0, y: 0 },
			{ x: 1, y: 0 },
			1000, // 1 second
			0,
		);

		// Moving 1 unit in 1 second = velocity of 1
		expect(frames[0].velocity.x).toBeCloseTo(1, 1);
		expect(frames[0].velocity.y).toBeCloseTo(0, 1);
	});

	it('should calculate prediction', () => {
		const frames = moveToPosition({ x: 0, y: 0 }, { x: 1, y: 0 }, 1000, 0);

		// Prediction should be ahead of current position
		const midFrame = frames[Math.floor(frames.length / 2)];
		expect(midFrame.prediction.x).toBeGreaterThan(midFrame.position.x);
	});
});

// ============================================================================
// GOLDEN SEQUENCE STRUCTURE TESTS
// ============================================================================

describe('Golden Sequences Structure', () => {
	it('should have ARM_BASELINE sequence', () => {
		const seq = GOLDEN_SEQUENCES.ARM_BASELINE;

		expect(seq.name).toBe('ARM_BASELINE');
		expect(seq.frames.length).toBeGreaterThan(0);
		expect(seq.expectedStates).toContain('DISARMED');
		expect(seq.expectedStates).toContain('ARMED');
	});

	it('should have ARM_AND_CLICK sequence', () => {
		const seq = GOLDEN_SEQUENCES.ARM_AND_CLICK;

		expect(seq.name).toBe('ARM_AND_CLICK');
		expect(seq.expectedStates).toContain('DOWN_COMMIT');
		expect(seq.expectedActions).toContain('down');
		expect(seq.expectedActions).toContain('up');
	});

	it('should have QUAD_CURSOR_TOUR sequence', () => {
		const seq = GOLDEN_SEQUENCES.QUAD_CURSOR_TOUR;

		expect(seq.name).toBe('QUAD_CURSOR_TOUR');
		expect(seq.frames.length).toBeGreaterThan(50); // Long sequence
	});

	it('all sequences should have required fields', () => {
		for (const [name, seq] of Object.entries(GOLDEN_SEQUENCES)) {
			expect(seq.name).toBe(name);
			expect(seq.description.length).toBeGreaterThan(10);
			expect(seq.expectedStates.length).toBeGreaterThan(0);
			expect(seq.expectedActions.length).toBeGreaterThan(0);
			expect(seq.frames.length).toBeGreaterThan(0);
		}
	});

	it('all frames should have valid structure', () => {
		for (const seq of Object.values(GOLDEN_SEQUENCES)) {
			for (const frame of seq.frames) {
				expect(typeof frame.ts).toBe('number');
				expect(typeof frame.trackingOk).toBe('boolean');
				expect(typeof frame.palmFacing).toBe('boolean');
				expect(typeof frame.label).toBe('string');
				expect(typeof frame.confidence).toBe('number');
				expect(frame.position).toHaveProperty('x');
				expect(frame.position).toHaveProperty('y');
			}
		}
	});
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('Utility Functions', () => {
	it('getAllFrames should return copy of frames', () => {
		const seq = GOLDEN_SEQUENCES.ARM_BASELINE;
		const frames = getAllFrames(seq);

		expect(frames.length).toBe(seq.frames.length);
		expect(frames).not.toBe(seq.frames); // Different array
	});

	it('getFrameAt should return frame at index', () => {
		const seq = GOLDEN_SEQUENCES.ARM_BASELINE;
		const frame = getFrameAt(seq, 0);

		expect(frame).toBeDefined();
		expect(frame).toEqual(seq.frames[0]);
	});

	it('getFrameAt should return undefined for invalid index', () => {
		const seq = GOLDEN_SEQUENCES.ARM_BASELINE;
		const frame = getFrameAt(seq, 99999);

		expect(frame).toBeUndefined();
	});

	it('getFramesInRange should filter by timestamp', () => {
		const seq = GOLDEN_SEQUENCES.ARM_AND_CLICK;
		const frames = getFramesInRange(seq, 100, 200);

		for (const frame of frames) {
			expect(frame.ts).toBeGreaterThanOrEqual(100);
			expect(frame.ts).toBeLessThanOrEqual(200);
		}
	});
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('State Sequence Validation', () => {
	it('should validate correct sequence', () => {
		const result = validateStateSequence(
			['DISARMED', 'ARMING', 'ARMED'],
			['DISARMED', 'ARMING', 'ARMED'],
		);

		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate subset in order', () => {
		const result = validateStateSequence(
			['DISARMED', 'DISARMED', 'ARMING', 'ARMING', 'ARMED', 'ARMED'],
			['DISARMED', 'ARMING', 'ARMED'],
		);

		expect(result.valid).toBe(true);
	});

	it('should fail on missing state', () => {
		const result = validateStateSequence(['DISARMED', 'ARMING'], ['DISARMED', 'ARMING', 'ARMED']);

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});
});

describe('Action Sequence Validation', () => {
	it('should validate correct sequence', () => {
		const result = validateActionSequence(
			['none', 'move', 'down', 'up'],
			['none', 'move', 'down', 'up'],
		);

		expect(result.valid).toBe(true);
	});

	it('should deduplicate consecutive actions', () => {
		const result = validateActionSequence(
			['none', 'none', 'move', 'move', 'down', 'up'],
			['none', 'move', 'down', 'up'],
		);

		expect(result.valid).toBe(true);
	});

	it('should fail on mismatch', () => {
		const result = validateActionSequence(['none', 'move', 'down'], ['none', 'move', 'down', 'up']);

		expect(result.valid).toBe(false);
	});
});

// ============================================================================
// JSON EXPORT/IMPORT TESTS
// ============================================================================

describe('JSON Export/Import', () => {
	it('should export sequence to JSON', () => {
		const seq = GOLDEN_SEQUENCES.ARM_BASELINE;
		const json = exportSequenceToJSON(seq);

		expect(typeof json).toBe('string');
		expect(json).toContain('ARM_BASELINE');
	});

	it('should import sequence from JSON', () => {
		const original = GOLDEN_SEQUENCES.ARM_BASELINE;
		const json = exportSequenceToJSON(original);
		const imported = importSequenceFromJSON(json);

		expect(imported.name).toBe(original.name);
		expect(imported.frames.length).toBe(original.frames.length);
	});

	it('should round-trip without data loss', () => {
		const original = GOLDEN_SEQUENCES.ARM_AND_CLICK;
		const json = exportSequenceToJSON(original);
		const imported = importSequenceFromJSON(json);

		expect(imported).toEqual(original);
	});
});

// ============================================================================
// FSM INTEGRATION TESTS (using XStateFSMAdapter)
// ============================================================================

describe('Golden Sequences with FSM', () => {
	it('ARM_BASELINE should transition FSM to ARMED', () => {
		const fsm = new XStateFSMAdapter();
		const seq = GOLDEN_SEQUENCES.ARM_BASELINE;
		const states: string[] = [];

		for (const frame of seq.frames) {
			const result = fsm.process(frame);
			states.push(result.state);
		}

		// Should have reached ARMED
		expect(states).toContain('ARMED');

		fsm.dispose();
	});

	it('ARM_AND_CLICK should complete click cycle', () => {
		const fsm = new XStateFSMAdapter();
		const seq = GOLDEN_SEQUENCES.ARM_AND_CLICK;
		const states: string[] = [];
		const actions: string[] = [];

		for (const frame of seq.frames) {
			const result = fsm.process(frame);
			states.push(result.state);
			actions.push(result.action);
		}

		// Should have transitioned through all states
		expect(states).toContain('ARMED');
		expect(states.some((s) => s === 'DOWN_COMMIT' || s === 'DOWN_NAV')).toBe(true);

		fsm.dispose();
	});

	it('DISARM_TRACKING_LOST should return to DISARMED', () => {
		const fsm = new XStateFSMAdapter();
		const seq = GOLDEN_SEQUENCES.DISARM_TRACKING_LOST;
		const states: string[] = [];

		for (const frame of seq.frames) {
			const result = fsm.process(frame);
			states.push(result.state);
		}

		// Last state should be DISARMED
		const lastState = states[states.length - 1];
		expect(lastState).toBe('DISARMED');

		fsm.dispose();
	});

	it('QUAD_CURSOR_TOUR should maintain ARMED during movement', () => {
		const fsm = new XStateFSMAdapter();
		const seq = GOLDEN_SEQUENCES.QUAD_CURSOR_TOUR;
		let armedCount = 0;

		for (const frame of seq.frames) {
			const result = fsm.process(frame);
			if (result.state === 'ARMED') {
				armedCount++;
			}
		}

		// Most frames should be in ARMED state
		expect(armedCount).toBeGreaterThan(seq.frames.length * 0.5);

		fsm.dispose();
	});
});

// ============================================================================
// PLAYBACK TESTS
// ============================================================================

describe('Playback Utilities', () => {
	it('should call onFrame for each frame', async () => {
		const seq = GOLDEN_SEQUENCES.ARM_BASELINE;
		const frameCount = { count: 0 };

		await playbackGoldenSequence(
			{ ...seq, frames: seq.frames.slice(0, 5) }, // Limit for speed
			{
				timeScale: 100, // Speed up
				onFrame: () => {
					frameCount.count++;
				},
			},
		);

		expect(frameCount.count).toBe(5);
	});

	it('should call onComplete when done', async () => {
		const seq = GOLDEN_SEQUENCES.ARM_BASELINE;
		let completed = false;

		await playbackGoldenSequence(
			{ ...seq, frames: seq.frames.slice(0, 3) },
			{
				timeScale: 100,
				onComplete: () => {
					completed = true;
				},
			},
		);

		expect(completed).toBe(true);
	});
});
