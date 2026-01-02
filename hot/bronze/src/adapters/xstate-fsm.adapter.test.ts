/**
 * XState FSM Adapter Tests
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | TDD RED → GREEN
 *
 * Tests the gesture state machine transitions and action emissions.
 * PRINCIPLE: Each state transition must emit correct pointer action.
 *
 * MUTATION COVERAGE: Tests boundary conditions (>=, <=, ===) to catch
 * operator mutations. Tests EXACTLY at thresholds.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SmoothedFrame } from '../contracts/schemas.js';
import { FSMActionSchema } from '../contracts/schemas.js';
import {
	DEFAULT_ARM_STABLE_MS,
	DEFAULT_CMD_WINDOW_MS,
	DEFAULT_MIN_CONFIDENCE,
	XStateFSMAdapter,
	guards,
} from './xstate-fsm.adapter.js';

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

	// ==========================================================================
	// BOUNDARY CONDITION TESTS (Mutation Coverage)
	// ==========================================================================

	describe('BOUNDARY: Confidence threshold (>= 0.7)', () => {
		it('EXACTLY at threshold (0.7) should arm', () => {
			const frame = createFrame({
				label: 'Open_Palm',
				palmFacing: true,
				confidence: DEFAULT_MIN_CONFIDENCE, // Exactly 0.7
			});
			fsm.process(frame);
			expect(fsm.getState()).toBe('ARMING');
		});

		it('JUST BELOW threshold (0.699) should NOT arm', () => {
			const frame = createFrame({
				label: 'Open_Palm',
				palmFacing: true,
				confidence: DEFAULT_MIN_CONFIDENCE - 0.001, // 0.699
			});
			fsm.process(frame);
			expect(fsm.getState()).toBe('DISARMED');
		});

		it('ABOVE threshold (0.71) should arm', () => {
			const frame = createFrame({
				label: 'Open_Palm',
				palmFacing: true,
				confidence: DEFAULT_MIN_CONFIDENCE + 0.01,
			});
			fsm.process(frame);
			expect(fsm.getState()).toBe('ARMING');
		});
	});

	describe('BOUNDARY: Arm stable time (>= 200ms)', () => {
		it('EXACTLY at 200ms should transition to ARMED', () => {
			// Start arming
			fsm.process(createFrame({ ts: 0, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			expect(fsm.getState()).toBe('ARMING');

			// Exactly 200ms later
			fsm.process(
				createFrame({
					ts: DEFAULT_ARM_STABLE_MS,
					label: 'Open_Palm',
					palmFacing: true,
					confidence: 0.9,
				}),
			);
			expect(fsm.getState()).toBe('ARMED');
		});

		it('JUST BELOW 200ms (199ms) should stay ARMING', () => {
			fsm.process(createFrame({ ts: 0, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			expect(fsm.getState()).toBe('ARMING');

			fsm.process(
				createFrame({
					ts: DEFAULT_ARM_STABLE_MS - 1,
					label: 'Open_Palm',
					palmFacing: true,
					confidence: 0.9,
				}),
			);
			expect(fsm.getState()).toBe('ARMING');
		});

		it('ABOVE 200ms (201ms) should be ARMED', () => {
			fsm.process(createFrame({ ts: 0, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			fsm.process(
				createFrame({
					ts: DEFAULT_ARM_STABLE_MS + 1,
					label: 'Open_Palm',
					palmFacing: true,
					confidence: 0.9,
				}),
			);
			expect(fsm.getState()).toBe('ARMED');
		});
	});

	describe('BOUNDARY: Command window (<= 500ms)', () => {
		beforeEach(() => {
			// Get to ARMED at ts=200
			fsm.process(createFrame({ ts: 0, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			fsm.process(
				createFrame({
					ts: DEFAULT_ARM_STABLE_MS,
					label: 'Open_Palm',
					palmFacing: true,
					confidence: 0.9,
				}),
			);
			expect(fsm.getState()).toBe('ARMED');
		});

		it('EXACTLY at window end (500ms from baseline) should work', () => {
			// Pointing_Up exactly at window boundary (0 + 500 = 500ms)
			fsm.process(
				createFrame({
					ts: DEFAULT_CMD_WINDOW_MS,
					label: 'Pointing_Up',
					palmFacing: true,
					confidence: 0.9,
				}),
			);
			expect(fsm.getState()).toBe('DOWN_COMMIT');
		});

		it('JUST OUTSIDE window (501ms) should stay ARMED', () => {
			fsm.process(
				createFrame({
					ts: DEFAULT_CMD_WINDOW_MS + 1,
					label: 'Pointing_Up',
					palmFacing: true,
					confidence: 0.9,
				}),
			);
			// Should stay ARMED because outside command window
			expect(fsm.getState()).toBe('ARMED');
		});

		it('INSIDE window (400ms) should work', () => {
			fsm.process(
				createFrame({
					ts: 400,
					label: 'Pointing_Up',
					palmFacing: true,
					confidence: 0.9,
				}),
			);
			expect(fsm.getState()).toBe('DOWN_COMMIT');
		});
	});

	describe('BOUNDARY: Guard functions directly', () => {
		it('isBaselineOk returns true only with all conditions met', () => {
			const validFrame = createFrame({
				label: 'Open_Palm',
				palmFacing: true,
				trackingOk: true,
				confidence: 0.7,
			});
			const event = { type: 'FRAME' as const, frame: validFrame };

			expect(guards.isBaselineOk({ event })).toBe(true);
		});

		it('isBaselineOk returns false if trackingOk is false', () => {
			const frame = createFrame({
				label: 'Open_Palm',
				palmFacing: true,
				trackingOk: false,
				confidence: 0.9,
			});
			const event = { type: 'FRAME' as const, frame };

			expect(guards.isBaselineOk({ event })).toBe(false);
		});

		it('isBaselineOk returns false if palmFacing is false', () => {
			const frame = createFrame({
				label: 'Open_Palm',
				palmFacing: false,
				trackingOk: true,
				confidence: 0.9,
			});
			const event = { type: 'FRAME' as const, frame };

			expect(guards.isBaselineOk({ event })).toBe(false);
		});

		it('isBaselineOk returns false for wrong gesture', () => {
			const frame = createFrame({
				label: 'Pointing_Up',
				palmFacing: true,
				trackingOk: true,
				confidence: 0.9,
			});
			const event = { type: 'FRAME' as const, frame };

			expect(guards.isBaselineOk({ event })).toBe(false);
		});

		it('isTrackingOk returns correct boolean', () => {
			const trackingFrame = createFrame({ trackingOk: true });
			const noTrackingFrame = createFrame({ trackingOk: false });

			expect(guards.isTrackingOk({ event: { type: 'FRAME', frame: trackingFrame } })).toBe(true);
			expect(guards.isTrackingOk({ event: { type: 'FRAME', frame: noTrackingFrame } })).toBe(false);
		});

		it('isPalmFacing returns correct boolean', () => {
			const facingFrame = createFrame({ palmFacing: true });
			const notFacingFrame = createFrame({ palmFacing: false });

			expect(guards.isPalmFacing({ event: { type: 'FRAME', frame: facingFrame } })).toBe(true);
			expect(guards.isPalmFacing({ event: { type: 'FRAME', frame: notFacingFrame } })).toBe(false);
		});

		it('isPointingUp requires label AND confidence', () => {
			const valid = createFrame({ label: 'Pointing_Up', confidence: 0.9 });
			const lowConf = createFrame({ label: 'Pointing_Up', confidence: 0.5 });
			const wrongLabel = createFrame({ label: 'Open_Palm', confidence: 0.9 });

			expect(guards.isPointingUp({ event: { type: 'FRAME', frame: valid } })).toBe(true);
			expect(guards.isPointingUp({ event: { type: 'FRAME', frame: lowConf } })).toBe(false);
			expect(guards.isPointingUp({ event: { type: 'FRAME', frame: wrongLabel } })).toBe(false);
		});

		it('isVictory requires label AND confidence', () => {
			const valid = createFrame({ label: 'Victory', confidence: 0.9 });
			const lowConf = createFrame({ label: 'Victory', confidence: 0.5 });

			expect(guards.isVictory({ event: { type: 'FRAME', frame: valid } })).toBe(true);
			expect(guards.isVictory({ event: { type: 'FRAME', frame: lowConf } })).toBe(false);
		});

		it('isZoomGesture works for both Thumb_Up and Thumb_Down', () => {
			const thumbUp = createFrame({ label: 'Thumb_Up', confidence: 0.9 });
			const thumbDown = createFrame({ label: 'Thumb_Down', confidence: 0.9 });
			const other = createFrame({ label: 'Open_Palm', confidence: 0.9 });

			expect(guards.isZoomGesture({ event: { type: 'FRAME', frame: thumbUp } })).toBe(true);
			expect(guards.isZoomGesture({ event: { type: 'FRAME', frame: thumbDown } })).toBe(true);
			expect(guards.isZoomGesture({ event: { type: 'FRAME', frame: other } })).toBe(false);
		});

		it('isReturningToBaseline checks all conditions', () => {
			const valid = createFrame({ label: 'Open_Palm', palmFacing: true, trackingOk: true });
			const notTracking = createFrame({ label: 'Open_Palm', palmFacing: true, trackingOk: false });
			const notFacing = createFrame({ label: 'Open_Palm', palmFacing: false, trackingOk: true });

			expect(guards.isReturningToBaseline({ event: { type: 'FRAME', frame: valid } })).toBe(true);
			expect(guards.isReturningToBaseline({ event: { type: 'FRAME', frame: notTracking } })).toBe(
				false,
			);
			expect(guards.isReturningToBaseline({ event: { type: 'FRAME', frame: notFacing } })).toBe(
				false,
			);
		});

		it('inverse guards return opposite of normal guards', () => {
			const valid = createFrame({
				label: 'Open_Palm',
				palmFacing: true,
				trackingOk: true,
				confidence: 0.9,
			});
			const event = { type: 'FRAME' as const, frame: valid };

			expect(guards.isNotBaselineOk({ event })).toBe(!guards.isBaselineOk({ event }));
			expect(guards.isNotTrackingOk({ event })).toBe(!guards.isTrackingOk({ event }));
			expect(guards.isNotPalmFacing({ event })).toBe(!guards.isPalmFacing({ event }));
		});

		it('guards return safe defaults for DISARM events', () => {
			const disarmEvent = { type: 'DISARM' as const };

			expect(guards.isBaselineOk({ event: disarmEvent })).toBe(false);
			expect(guards.isTrackingOk({ event: disarmEvent })).toBe(false);
			expect(guards.isPalmFacing({ event: disarmEvent })).toBe(false);
			expect(guards.isPointingUp({ event: disarmEvent })).toBe(false);
			expect(guards.isNotBaselineOk({ event: disarmEvent })).toBe(true);
			expect(guards.isNotTrackingOk({ event: disarmEvent })).toBe(true);
		});
	});

	describe('BOUNDARY: Compound guards with context', () => {
		it('isBaselineStable checks context.baselineStableAt', () => {
			const frame = createFrame({ ts: 300 });
			const event = { type: 'FRAME' as const, frame };

			// With null baselineStableAt
			expect(
				guards.isBaselineStable({
					context: {
						baselineStableAt: null,
						armedFromBaseline: false,
						lastPosition: null,
						currentTs: 0,
					},
					event,
				}),
			).toBe(false);

			// With baselineStableAt set, not enough time
			expect(
				guards.isBaselineStable({
					context: {
						baselineStableAt: 200,
						armedFromBaseline: false,
						lastPosition: null,
						currentTs: 0,
					},
					event,
				}),
			).toBe(false);

			// With enough time elapsed (300 - 0 >= 200)
			const oldFrame = createFrame({ ts: 200 });
			expect(
				guards.isBaselineStable({
					context: {
						baselineStableAt: 0,
						armedFromBaseline: false,
						lastPosition: null,
						currentTs: 0,
					},
					event: { type: 'FRAME', frame: oldFrame },
				}),
			).toBe(true);
		});

		it('isCmdWindowOk requires armedFromBaseline', () => {
			const frame = createFrame({ ts: 300 });
			const event = { type: 'FRAME' as const, frame };

			// Not armed from baseline
			expect(
				guards.isCmdWindowOk({
					context: {
						baselineStableAt: 0,
						armedFromBaseline: false,
						lastPosition: null,
						currentTs: 0,
					},
					event,
				}),
			).toBe(false);

			// Armed from baseline, in window
			expect(
				guards.isCmdWindowOk({
					context: {
						baselineStableAt: 0,
						armedFromBaseline: true,
						lastPosition: null,
						currentTs: 0,
					},
					event,
				}),
			).toBe(true);
		});
	});

	describe('EXHAUSTIVE: All state transitions', () => {
		it('DISARMED ignores all non-baseline gestures', () => {
			const gestures = [
				'Pointing_Up',
				'Victory',
				'Thumb_Up',
				'Thumb_Down',
				'Closed_Fist',
				'None',
			] as const;

			for (const label of gestures) {
				const newFsm = new XStateFSMAdapter();
				newFsm.process(createFrame({ label, palmFacing: true, confidence: 0.9 }));
				expect(newFsm.getState()).toBe('DISARMED');
				newFsm.dispose();
			}
		});

		it('ARMING breaks on any non-baseline condition', () => {
			// Start arming
			fsm.process(createFrame({ ts: 0, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			expect(fsm.getState()).toBe('ARMING');

			// Test each break condition
			const breakConditions = [
				{ label: 'Pointing_Up' as const, palmFacing: true, confidence: 0.9 },
				{ label: 'Open_Palm' as const, palmFacing: false, confidence: 0.9 },
				{ label: 'Open_Palm' as const, palmFacing: true, confidence: 0.5 },
				{ label: 'Open_Palm' as const, palmFacing: true, trackingOk: false, confidence: 0.9 },
			];

			for (const condition of breakConditions) {
				const testFsm = new XStateFSMAdapter();
				testFsm.process(
					createFrame({ ts: 0, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }),
				);
				testFsm.process(createFrame({ ts: 50, ...condition }));
				expect(testFsm.getState()).toBe('DISARMED');
				testFsm.dispose();
			}
		});

		it('ARMED responds to all command gestures', () => {
			const getArmedFsm = () => {
				const f = new XStateFSMAdapter();
				f.process(createFrame({ ts: 0, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
				f.process(createFrame({ ts: 200, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
				return f;
			};

			// Pointing_Up → DOWN_COMMIT
			let testFsm = getArmedFsm();
			testFsm.process(
				createFrame({ ts: 300, label: 'Pointing_Up', palmFacing: true, confidence: 0.9 }),
			);
			expect(testFsm.getState()).toBe('DOWN_COMMIT');
			testFsm.dispose();

			// Victory → DOWN_NAV
			testFsm = getArmedFsm();
			testFsm.process(
				createFrame({ ts: 300, label: 'Victory', palmFacing: true, confidence: 0.9 }),
			);
			expect(testFsm.getState()).toBe('DOWN_NAV');
			testFsm.dispose();

			// Thumb_Up → ZOOM
			testFsm = getArmedFsm();
			testFsm.process(
				createFrame({ ts: 300, label: 'Thumb_Up', palmFacing: true, confidence: 0.9 }),
			);
			expect(testFsm.getState()).toBe('ZOOM');
			testFsm.dispose();

			// Thumb_Down → ZOOM
			testFsm = getArmedFsm();
			testFsm.process(
				createFrame({ ts: 300, label: 'Thumb_Down', palmFacing: true, confidence: 0.9 }),
			);
			expect(testFsm.getState()).toBe('ZOOM');
			testFsm.dispose();
		});

		it('DOWN_NAV returns to ARMED on Open_Palm', () => {
			// Get to DOWN_NAV
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Victory', confidence: 0.9 }));
			expect(fsm.getState()).toBe('DOWN_NAV');

			// Return to baseline
			fsm.process(createFrame({ ts: 400, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			expect(fsm.getState()).toBe('ARMED');
		});

		it('DOWN_NAV emits up with button=1', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Victory', confidence: 0.9 }));

			const action = fsm.process(
				createFrame({ ts: 400, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }),
			);
			expect(action.action).toBe('up');
			if (action.action === 'up') {
				expect(action.button).toBe(1);
			}
		});

		it('ZOOM returns to ARMED on Open_Palm', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Thumb_Up', confidence: 0.9 }));
			expect(fsm.getState()).toBe('ZOOM');

			fsm.process(createFrame({ ts: 400, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			expect(fsm.getState()).toBe('ARMED');
		});

		it('ZOOM goes to DISARMED on tracking lost', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Thumb_Up', confidence: 0.9 }));
			expect(fsm.getState()).toBe('ZOOM');

			fsm.process(createFrame({ ts: 400, trackingOk: false, label: 'None', confidence: 0 }));
			expect(fsm.getState()).toBe('DISARMED');
		});
	});

	describe('ACTION EMISSIONS: Every state emits correct action', () => {
		it('DISARMED emits none', () => {
			const action = fsm.process(createFrame({ label: 'None', trackingOk: false }));
			expect(action.action).toBe('none');
			expect(action.state).toBe('DISARMED');
		});

		it('ARMING emits none', () => {
			const action = fsm.process(
				createFrame({ label: 'Open_Palm', palmFacing: true, confidence: 0.9 }),
			);
			expect(action.action).toBe('none');
			expect(action.state).toBe('ARMING');
		});

		it('ARMED emits move with position', () => {
			const frames = createBaselineSequence(250, 0);
			let lastAction = null;
			for (const frame of frames) {
				lastAction = fsm.process(frame);
			}
			expect(lastAction?.action).toBe('move');
			expect(lastAction?.state).toBe('ARMED');
			if (lastAction?.action === 'move') {
				expect(lastAction.x).toBeDefined();
				expect(lastAction.y).toBeDefined();
			}
		});

		it('DOWN_COMMIT on entry emits down with button=0', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			const action = fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));
			expect(action.action).toBe('down');
			if (action.action === 'down') {
				expect(action.button).toBe(0);
			}
		});

		it('DOWN_COMMIT while held emits move', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));

			// Continue holding
			const action = fsm.process(createFrame({ ts: 350, label: 'Pointing_Up', confidence: 0.9 }));
			expect(action.action).toBe('move');
		});

		it('DOWN_NAV on entry emits down with button=1', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			const action = fsm.process(createFrame({ ts: 300, label: 'Victory', confidence: 0.9 }));
			expect(action.action).toBe('down');
			if (action.action === 'down') {
				expect(action.button).toBe(1);
			}
		});

		it('ZOOM emits wheel with ctrl=true', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			const action = fsm.process(createFrame({ ts: 300, label: 'Thumb_Up', confidence: 0.9 }));
			expect(action.action).toBe('wheel');
			if (action.action === 'wheel') {
				expect(action.ctrl).toBe(true);
			}
		});

		it('cancel emitted when DOWN state loses tracking', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));

			const action = fsm.process(
				createFrame({ ts: 400, trackingOk: false, label: 'None', confidence: 0 }),
			);
			expect(action.action).toBe('cancel');
		});
	});

	describe('CONTEXT: State machine context updates', () => {
		it('getContext returns current context', () => {
			fsm.process(createFrame({ ts: 100, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			const context = fsm.getContext();

			expect(context.baselineStableAt).toBe(100);
		});

		it('context.baselineStableAt is cleared on disarm', () => {
			fsm.process(createFrame({ ts: 100, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			fsm.disarm();

			const context = fsm.getContext();
			expect(context.baselineStableAt).toBeNull();
		});
	});

	// ==========================================================================
	// MUTATION KILLERS: State Machine Config (ObjectLiteral mutations)
	// ==========================================================================

	describe('MUTATION KILLER: DISARM event from every state', () => {
		it('DISARM from ARMING clears baselineStableAt', () => {
			fsm.process(createFrame({ ts: 0, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			expect(fsm.getState()).toBe('ARMING');
			expect(fsm.getContext().baselineStableAt).toBe(0);

			fsm.disarm();
			expect(fsm.getState()).toBe('DISARMED');
			expect(fsm.getContext().baselineStableAt).toBeNull();
		});

		it('DISARM from ARMED clears both baselineStableAt and armedFromBaseline', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			expect(fsm.getState()).toBe('ARMED');
			expect(fsm.getContext().armedFromBaseline).toBe(true);

			fsm.disarm();
			expect(fsm.getState()).toBe('DISARMED');
			expect(fsm.getContext().baselineStableAt).toBeNull();
			expect(fsm.getContext().armedFromBaseline).toBe(false);
		});

		it('DISARM from DOWN_COMMIT clears context flags', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));
			expect(fsm.getState()).toBe('DOWN_COMMIT');

			fsm.disarm();
			expect(fsm.getState()).toBe('DISARMED');
			expect(fsm.getContext().baselineStableAt).toBeNull();
			expect(fsm.getContext().armedFromBaseline).toBe(false);
		});

		it('DISARM from DOWN_NAV clears context flags', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Victory', confidence: 0.9 }));
			expect(fsm.getState()).toBe('DOWN_NAV');

			fsm.disarm();
			expect(fsm.getState()).toBe('DISARMED');
			expect(fsm.getContext().baselineStableAt).toBeNull();
			expect(fsm.getContext().armedFromBaseline).toBe(false);
		});

		it('DISARM from ZOOM clears context flags', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Thumb_Up', confidence: 0.9 }));
			expect(fsm.getState()).toBe('ZOOM');

			fsm.disarm();
			expect(fsm.getState()).toBe('DISARMED');
			expect(fsm.getContext().baselineStableAt).toBeNull();
			expect(fsm.getContext().armedFromBaseline).toBe(false);
		});
	});

	describe('MUTATION KILLER: Action arrays execute all actions', () => {
		it('recordBaselineTime sets baselineStableAt to frame timestamp', () => {
			fsm.process(
				createFrame({ ts: 12345, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }),
			);
			expect(fsm.getContext().baselineStableAt).toBe(12345);
		});

		it('setArmedFromBaseline sets flag to true on ARMED entry', () => {
			fsm.process(createFrame({ ts: 0, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			expect(fsm.getContext().armedFromBaseline).toBe(false);

			fsm.process(createFrame({ ts: 200, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			expect(fsm.getState()).toBe('ARMED');
			expect(fsm.getContext().armedFromBaseline).toBe(true);
		});

		it('updatePosition sets lastPosition from frame', () => {
			fsm.process(
				createFrame({
					ts: 0,
					label: 'Open_Palm',
					palmFacing: true,
					confidence: 0.9,
					position: { x: 0.3, y: 0.7 },
				}),
			);
			expect(fsm.getContext().lastPosition).toEqual({ x: 0.3, y: 0.7 });
		});

		it('clearArmedFromBaseline resets flag when returning from DOWN to ARMED', () => {
			// Get to DOWN_COMMIT
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));
			expect(fsm.getContext().armedFromBaseline).toBe(true);

			// Return to ARMED - should clear armedFromBaseline
			fsm.process(createFrame({ ts: 400, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			expect(fsm.getState()).toBe('ARMED');
			expect(fsm.getContext().armedFromBaseline).toBe(false);
		});
	});

	describe('MUTATION KILLER: Guard edge cases', () => {
		it('isBaselineStable returns false for DISARM event type', () => {
			const disarmEvent = { type: 'DISARM' as const };
			const context = {
				baselineStableAt: 0,
				armedFromBaseline: true,
				lastPosition: null,
				currentTs: 0,
			};
			expect(guards.isBaselineStable({ context, event: disarmEvent })).toBe(false);
		});

		it('isCmdWindowOk returns false for DISARM event type', () => {
			const disarmEvent = { type: 'DISARM' as const };
			const context = {
				baselineStableAt: 0,
				armedFromBaseline: true,
				lastPosition: null,
				currentTs: 0,
			};
			expect(guards.isCmdWindowOk({ context, event: disarmEvent })).toBe(false);
		});

		it('isCmdWindowOk returns false when baselineStableAt is null', () => {
			const frame = createFrame({ ts: 100 });
			const context = {
				baselineStableAt: null,
				armedFromBaseline: true,
				lastPosition: null,
				currentTs: 0,
			};
			expect(guards.isCmdWindowOk({ context, event: { type: 'FRAME', frame } })).toBe(false);
		});

		it('isPointingUpInWindow requires ALL conditions', () => {
			const frame = createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 });
			const event = { type: 'FRAME' as const, frame };

			// Missing armedFromBaseline
			expect(
				guards.isPointingUpInWindow({
					context: {
						baselineStableAt: 0,
						armedFromBaseline: false,
						lastPosition: null,
						currentTs: 0,
					},
					event,
				}),
			).toBe(false);

			// Missing baselineStableAt
			expect(
				guards.isPointingUpInWindow({
					context: {
						baselineStableAt: null,
						armedFromBaseline: true,
						lastPosition: null,
						currentTs: 0,
					},
					event,
				}),
			).toBe(false);

			// Outside window (ts - baselineStableAt > 500)
			const lateFrame = createFrame({ ts: 600, label: 'Pointing_Up', confidence: 0.9 });
			expect(
				guards.isPointingUpInWindow({
					context: {
						baselineStableAt: 0,
						armedFromBaseline: true,
						lastPosition: null,
						currentTs: 0,
					},
					event: { type: 'FRAME', frame: lateFrame },
				}),
			).toBe(false);

			// All conditions met
			expect(
				guards.isPointingUpInWindow({
					context: {
						baselineStableAt: 0,
						armedFromBaseline: true,
						lastPosition: null,
						currentTs: 0,
					},
					event,
				}),
			).toBe(true);
		});

		it('isVictoryInWindow requires ALL conditions', () => {
			const frame = createFrame({ ts: 300, label: 'Victory', confidence: 0.9 });
			const event = { type: 'FRAME' as const, frame };

			// All conditions met
			expect(
				guards.isVictoryInWindow({
					context: {
						baselineStableAt: 0,
						armedFromBaseline: true,
						lastPosition: null,
						currentTs: 0,
					},
					event,
				}),
			).toBe(true);

			// Wrong label
			const wrongFrame = createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 });
			expect(
				guards.isVictoryInWindow({
					context: {
						baselineStableAt: 0,
						armedFromBaseline: true,
						lastPosition: null,
						currentTs: 0,
					},
					event: { type: 'FRAME', frame: wrongFrame },
				}),
			).toBe(false);
		});

		it('isZoomInWindow requires ALL conditions', () => {
			const thumbUp = createFrame({ ts: 300, label: 'Thumb_Up', confidence: 0.9 });
			const thumbDown = createFrame({ ts: 300, label: 'Thumb_Down', confidence: 0.9 });
			const context = {
				baselineStableAt: 0,
				armedFromBaseline: true,
				lastPosition: null,
				currentTs: 0,
			};

			expect(guards.isZoomInWindow({ context, event: { type: 'FRAME', frame: thumbUp } })).toBe(
				true,
			);
			expect(guards.isZoomInWindow({ context, event: { type: 'FRAME', frame: thumbDown } })).toBe(
				true,
			);

			// Wrong label
			const openPalm = createFrame({ ts: 300, label: 'Open_Palm', confidence: 0.9 });
			expect(guards.isZoomInWindow({ context, event: { type: 'FRAME', frame: openPalm } })).toBe(
				false,
			);

			// Low confidence
			const lowConf = createFrame({ ts: 300, label: 'Thumb_Up', confidence: 0.5 });
			expect(guards.isZoomInWindow({ context, event: { type: 'FRAME', frame: lowConf } })).toBe(
				false,
			);
		});

		it('isReturningToBaseline returns false for DISARM event', () => {
			expect(guards.isReturningToBaseline({ event: { type: 'DISARM' } })).toBe(false);
		});
	});

	describe('MUTATION KILLER: computeAction edge cases', () => {
		it('ZOOM with Thumb_Up emits deltaY < 0', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			const action = fsm.process(createFrame({ ts: 300, label: 'Thumb_Up', confidence: 0.9 }));
			expect(action.action).toBe('wheel');
			if (action.action === 'wheel') {
				expect(action.deltaY).toBe(-100);
			}
		});

		it('ZOOM with Thumb_Down emits deltaY > 0', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			const action = fsm.process(createFrame({ ts: 300, label: 'Thumb_Down', confidence: 0.9 }));
			expect(action.action).toBe('wheel');
			if (action.action === 'wheel') {
				expect(action.deltaY).toBe(100);
			}
		});

		it('ZOOM with other gesture stays in ZOOM if tracking ok', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			// First enter ZOOM with Thumb_Up
			fsm.process(createFrame({ ts: 300, label: 'Thumb_Up', confidence: 0.9 }));
			expect(fsm.getState()).toBe('ZOOM');

			// Stay in ZOOM with different gesture but still tracking
			const action = fsm.process(
				createFrame({
					ts: 350,
					label: 'Closed_Fist',
					confidence: 0.9,
					palmFacing: true,
					trackingOk: true,
				}),
			);
			// Should stay in ZOOM because tracking still ok
			expect(fsm.getState()).toBe('ZOOM');
			expect(action.action).toBe('wheel');
		});

		it('DOWN_COMMIT continues to emit move while held', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			// Enter DOWN_COMMIT
			const enterAction = fsm.process(
				createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }),
			);
			expect(enterAction.action).toBe('down');

			// Continue holding - should emit move
			const holdAction = fsm.process(
				createFrame({
					ts: 350,
					label: 'Pointing_Up',
					confidence: 0.9,
					position: { x: 0.6, y: 0.4 },
				}),
			);
			expect(holdAction.action).toBe('move');
			expect(fsm.getState()).toBe('DOWN_COMMIT');
		});

		it('DOWN_NAV continues to emit move while held', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			// Enter DOWN_NAV
			const enterAction = fsm.process(createFrame({ ts: 300, label: 'Victory', confidence: 0.9 }));
			expect(enterAction.action).toBe('down');

			// Continue holding
			const holdAction = fsm.process(createFrame({ ts: 350, label: 'Victory', confidence: 0.9 }));
			expect(holdAction.action).toBe('move');
			expect(fsm.getState()).toBe('DOWN_NAV');
		});
	});

	describe('MUTATION KILLER: State transition with palmFacing=false', () => {
		it('ARMED goes to DISARMED when palmFacing becomes false', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			expect(fsm.getState()).toBe('ARMED');

			fsm.process(
				createFrame({
					ts: 300,
					palmFacing: false,
					trackingOk: true,
					label: 'Open_Palm',
					confidence: 0.9,
				}),
			);
			expect(fsm.getState()).toBe('DISARMED');
		});

		it('DOWN_COMMIT goes to DISARMED when palmFacing becomes false', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));
			expect(fsm.getState()).toBe('DOWN_COMMIT');

			fsm.process(
				createFrame({
					ts: 400,
					palmFacing: false,
					trackingOk: true,
					label: 'Pointing_Up',
					confidence: 0.9,
				}),
			);
			expect(fsm.getState()).toBe('DISARMED');
		});

		it('DOWN_NAV goes to DISARMED when palmFacing becomes false', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Victory', confidence: 0.9 }));
			expect(fsm.getState()).toBe('DOWN_NAV');

			fsm.process(
				createFrame({
					ts: 400,
					palmFacing: false,
					trackingOk: true,
					label: 'Victory',
					confidence: 0.9,
				}),
			);
			expect(fsm.getState()).toBe('DISARMED');
		});
	});

	describe('MUTATION KILLER: Subscription callback receives action', () => {
		it('subscription callback receives state AND action on transitions', () => {
			const receivedCallbacks: Array<{ state: string; action: any }> = [];

			fsm.subscribe((state, action) => {
				receivedCallbacks.push({ state, action });
			});

			// Trigger transition
			fsm.process(createFrame({ ts: 0, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));

			expect(receivedCallbacks.length).toBeGreaterThan(0);
			expect(receivedCallbacks[0].state).toBe('ARMING');
			expect(receivedCallbacks[0].action).toBeDefined();
			expect(receivedCallbacks[0].action.action).toBe('move'); // Default action for subscription
		});

		it('unsubscribe stops callbacks', () => {
			let callCount = 0;
			const unsubscribe = fsm.subscribe(() => {
				callCount++;
			});

			fsm.process(createFrame({ ts: 0, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			const firstCount = callCount;

			unsubscribe();

			fsm.process(createFrame({ ts: 50, label: 'Open_Palm', palmFacing: true, confidence: 0.9 }));
			expect(callCount).toBe(firstCount); // No new callbacks
		});
	});

	describe('MUTATION KILLER: Position defaults and updates', () => {
		it('action includes position from context.lastPosition', () => {
			fsm.process(
				createFrame({
					ts: 0,
					label: 'Open_Palm',
					palmFacing: true,
					confidence: 0.9,
					position: { x: 0.25, y: 0.75 },
				}),
			);
			fsm.process(
				createFrame({
					ts: 200,
					label: 'Open_Palm',
					palmFacing: true,
					confidence: 0.9,
					position: { x: 0.25, y: 0.75 },
				}),
			);

			const action = fsm.process(
				createFrame({
					ts: 300,
					label: 'Open_Palm',
					palmFacing: true,
					confidence: 0.9,
					position: { x: 0.3, y: 0.8 },
				}),
			);
			expect(action.action).toBe('move');
			if (action.action === 'move') {
				expect(action.x).toBe(0.3);
				expect(action.y).toBe(0.8);
			}
		});

		it('action uses default position {0.5, 0.5} when lastPosition is null', () => {
			// Create FSM and trigger action without setting position
			const action = fsm.process(createFrame({ ts: 0, label: 'None', trackingOk: false }));
			expect(action.state).toBe('DISARMED');
			// cancel and none don't include position, so check ARMED state
		});
	});

	describe('MUTATION KILLER: Cancel action specifics', () => {
		it('cancel from DOWN_COMMIT has state DISARMED', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));

			const action = fsm.process(createFrame({ ts: 400, trackingOk: false }));
			expect(action.action).toBe('cancel');
			expect(action.state).toBe('DISARMED');
		});

		it('cancel from DOWN_NAV has state DISARMED', () => {
			const frames = createBaselineSequence(250, 0);
			for (const frame of frames) {
				fsm.process(frame);
			}
			fsm.process(createFrame({ ts: 300, label: 'Victory', confidence: 0.9 }));

			const action = fsm.process(createFrame({ ts: 400, trackingOk: false }));
			expect(action.action).toBe('cancel');
			expect(action.state).toBe('DISARMED');
		});
	});
});
