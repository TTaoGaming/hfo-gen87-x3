/**
 * XState FSM Adapter Tests
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | TDD RED → GREEN
 *
 * Tests the gesture state machine transitions and action emissions.
 * PRINCIPLE: Each state transition must emit correct pointer action.
 */
// @ts-nocheck

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SmoothedFrame } from '../contracts/schemas.js';
import { FSMActionSchema } from '../contracts/schemas.js';
import { XStateFSMAdapter } from './xstate-fsm.adapter.js';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a SmoothedFrame with given parameters
 */
function createFrame(overrides: Partial<SmoothedFrame> = {}): SmoothedFrame {
	const defaults: SmoothedFrame = {
		ts: Date.now(),
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: 'Open_Palm',
		confidence: 0.9,
		position: { x: 0.5, y: 0.5 },
		velocity: { x: 0, y: 0 },
		prediction: { x: 0.5, y: 0.5 },
	};
	return { ...defaults, ...overrides };
}

/**
 * Create frames that simulate holding Open_Palm baseline for duration
 */
function createBaselineSequence(durationMs: number, startTs = 0): SmoothedFrame[] {
	const frames: SmoothedFrame[] = [];
	const frameCount = Math.ceil(durationMs / 16); // ~60fps

	for (let i = 0; i < frameCount; i++) {
		frames.push(
			createFrame({
				ts: startTs + i * 16,
				label: 'Open_Palm',
				palmFacing: true,
				trackingOk: true,
				confidence: 0.9,
			}),
		);
	}

	return frames;
}

// ============================================================================
// FSM STATE TRANSITION TESTS
// ============================================================================

describe('XStateFSMAdapter', () => {
	let fsm: XStateFSMAdapter;

	beforeEach(() => {
		fsm = new XStateFSMAdapter();
	});

	afterEach(() => {
		fsm.dispose();
	});

	describe('Initial State', () => {
		it('starts in DISARMED state', () => {
			expect(fsm.getState()).toBe('DISARMED');
		});

		it('returns action=none when DISARMED', () => {
			const frame = createFrame({ label: 'None', trackingOk: false });
			const action = fsm.process(frame);

			expect(action.action).toBe('none');
			expect(action.state).toBe('DISARMED');
		});
	});

	describe('DISARMED → ARMING transition', () => {
		it('transitions to ARMING on Open_Palm + palmFacing + confidence', () => {
			const frame = createFrame({
				label: 'Open_Palm',
				palmFacing: true,
				confidence: 0.9,
			});

			fsm.process(frame);
			expect(fsm.getState()).toBe('ARMING');
		});

		it('stays DISARMED if confidence too low', () => {
			const frame = createFrame({
				label: 'Open_Palm',
				palmFacing: true,
				confidence: 0.5, // Below threshold
			});

			fsm.process(frame);
			expect(fsm.getState()).toBe('DISARMED');
		});

		it('stays DISARMED if not Open_Palm', () => {
			const frame = createFrame({
				label: 'Pointing_Up',
				palmFacing: true,
				confidence: 0.9,
			});

			fsm.process(frame);
			expect(fsm.getState()).toBe('DISARMED');
		});

		it('stays DISARMED if palm not facing', () => {
			const frame = createFrame({
				label: 'Open_Palm',
				palmFacing: false,
				confidence: 0.9,
			});

			fsm.process(frame);
			expect(fsm.getState()).toBe('DISARMED');
		});
	});

	describe('ARMING → ARMED transition', () => {
		it('transitions to ARMED after stable baseline (200ms)', () => {
			// Hold Open_Palm for 250ms
			const frames = createBaselineSequence(250, 0);

			for (const frame of frames) {
				fsm.process(frame);
			}

			expect(fsm.getState()).toBe('ARMED');
		});

		it('returns action=move when ARMED', () => {
			const frames = createBaselineSequence(250, 0);
			let lastAction = null;

			for (const frame of frames) {
				lastAction = fsm.process(frame);
			}

			expect(lastAction?.action).toBe('move');
			expect(lastAction?.state).toBe('ARMED');
		});

		it('goes back to DISARMED if baseline broken during ARMING', () => {
			// Start baseline
			fsm.process(createFrame({ ts: 0 }));
			expect(fsm.getState()).toBe('ARMING');

			// Break baseline
			fsm.process(createFrame({ ts: 50, label: 'Closed_Fist' }));
			expect(fsm.getState()).toBe('DISARMED');
		});
	});

	describe('ARMED → DOWN_COMMIT transition (Pointing_Up)', () => {
		beforeEach(() => {
			// Get to ARMED state first
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			expect(fsm.getState()).toBe('ARMED');
		});

		it('transitions to DOWN_COMMIT on Pointing_Up within command window', () => {
			// Pointing_Up within 500ms of arming
			const frame = createFrame({
				ts: 300, // Within window
				label: 'Pointing_Up',
				palmFacing: true,
				confidence: 0.9,
			});

			fsm.process(frame);
			expect(fsm.getState()).toBe('DOWN_COMMIT');
		});

		it('emits pointerdown (button=0) when entering DOWN_COMMIT', () => {
			const frame = createFrame({
				ts: 300,
				label: 'Pointing_Up',
				palmFacing: true,
				confidence: 0.9,
			});

			const action = fsm.process(frame);
			expect(action.action).toBe('down');
			expect(action.state).toBe('DOWN_COMMIT');
			if (action.action === 'down') {
				expect(action.button).toBe(0);
			}
		});
	});

	describe('ARMED → DOWN_NAV transition (Victory)', () => {
		beforeEach(() => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			expect(fsm.getState()).toBe('ARMED');
		});

		it('transitions to DOWN_NAV on Victory within command window', () => {
			const frame = createFrame({
				ts: 300,
				label: 'Victory',
				palmFacing: true,
				confidence: 0.9,
			});

			fsm.process(frame);
			expect(fsm.getState()).toBe('DOWN_NAV');
		});

		it('emits pointerdown (button=1) when entering DOWN_NAV', () => {
			const frame = createFrame({
				ts: 300,
				label: 'Victory',
				palmFacing: true,
				confidence: 0.9,
			});

			const action = fsm.process(frame);
			expect(action.action).toBe('down');
			expect(action.state).toBe('DOWN_NAV');
			if (action.action === 'down') {
				expect(action.button).toBe(1);
			}
		});
	});

	describe('DOWN_COMMIT → ARMED transition (Release)', () => {
		beforeEach(() => {
			// Get to DOWN_COMMIT
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));
			expect(fsm.getState()).toBe('DOWN_COMMIT');
		});

		it('returns to ARMED on Open_Palm (release)', () => {
			const frame = createFrame({
				ts: 400,
				label: 'Open_Palm',
				palmFacing: true,
				confidence: 0.9,
			});

			fsm.process(frame);
			expect(fsm.getState()).toBe('ARMED');
		});

		it('emits pointerup (button=0) when releasing from DOWN_COMMIT', () => {
			const frame = createFrame({
				ts: 400,
				label: 'Open_Palm',
				palmFacing: true,
				confidence: 0.9,
			});

			const action = fsm.process(frame);
			expect(action.action).toBe('up');
			if (action.action === 'up') {
				expect(action.button).toBe(0);
			}
		});
	});

	describe('DOWN state → DISARMED (tracking lost)', () => {
		beforeEach(() => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));
			expect(fsm.getState()).toBe('DOWN_COMMIT');
		});

		it('goes to DISARMED and emits cancel on tracking lost', () => {
			const frame = createFrame({
				ts: 400,
				trackingOk: false,
				label: 'None',
				confidence: 0,
			});

			const action = fsm.process(frame);
			expect(fsm.getState()).toBe('DISARMED');
			expect(action.action).toBe('cancel');
		});
	});

	describe('ARMED → ZOOM transition (Thumb_Up/Down)', () => {
		beforeEach(() => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			expect(fsm.getState()).toBe('ARMED');
		});

		it('transitions to ZOOM on Thumb_Up', () => {
			const frame = createFrame({
				ts: 300,
				label: 'Thumb_Up',
				palmFacing: true,
				confidence: 0.9,
			});

			fsm.process(frame);
			expect(fsm.getState()).toBe('ZOOM');
		});

		it('emits wheel event with negative deltaY for Thumb_Up (zoom in)', () => {
			const frame = createFrame({
				ts: 300,
				label: 'Thumb_Up',
				palmFacing: true,
				confidence: 0.9,
			});

			const action = fsm.process(frame);
			expect(action.action).toBe('wheel');
			if (action.action === 'wheel') {
				expect(action.deltaY).toBeLessThan(0); // Zoom in
				expect(action.ctrl).toBe(true); // Ctrl+wheel for zoom
			}
		});

		it('emits wheel event with positive deltaY for Thumb_Down (zoom out)', () => {
			const frame = createFrame({
				ts: 300,
				label: 'Thumb_Down',
				palmFacing: true,
				confidence: 0.9,
			});

			const action = fsm.process(frame);
			expect(action.action).toBe('wheel');
			if (action.action === 'wheel') {
				expect(action.deltaY).toBeGreaterThan(0); // Zoom out
			}
		});
	});

	describe('disarm() method', () => {
		it('forces transition to DISARMED from any state', () => {
			// Get to ARMED
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			expect(fsm.getState()).toBe('ARMED');

			// Force disarm
			fsm.disarm();
			expect(fsm.getState()).toBe('DISARMED');
		});
	});

	describe('CDD: Output validation', () => {
		it('all actions pass FSMActionSchema validation', () => {
			// Test various transitions and validate each action
			const transitions = [
				createFrame({ label: 'None', trackingOk: false }), // DISARMED
				...createBaselineSequence(250, 0), // ARMING → ARMED
				createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }), // DOWN_COMMIT
				createFrame({ ts: 400, label: 'Open_Palm', confidence: 0.9 }), // ARMED
			];

			for (const frame of transitions) {
				const action = fsm.process(frame);
				const result = FSMActionSchema.safeParse(action);
				expect(result.success).toBe(true);
			}
		});
	});

	describe('Subscription', () => {
		it('notifies subscribers on state changes', () => {
			const stateChanges: string[] = [];

			fsm.subscribe((state) => {
				stateChanges.push(state);
			});

			// Trigger some transitions
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}

			// Should have captured state changes
			expect(stateChanges.length).toBeGreaterThan(0);
			expect(stateChanges).toContain('ARMING');
			expect(stateChanges).toContain('ARMED');
		});
	});
});
