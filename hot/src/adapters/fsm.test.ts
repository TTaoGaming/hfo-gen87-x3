/**
 * XState FSM Adapter Tests
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * PHASE 1: FSM Unit Tests
 * Tests the gesture state machine in isolation with synthetic frames.
 *
 * Blackboard Signal: VALIDATE-FSM | Port: 2 | Owner: Claude-Opus
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SmoothedFrame } from '../contracts/schemas.js';
import { XStateFSMAdapter } from './xstate-fsm.adapter.js';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createFrame(overrides: Partial<SmoothedFrame> = {}): SmoothedFrame {
	return {
		ts: Date.now(),
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: 'Open_Palm',
		confidence: 0.95,
		position: { x: 0.5, y: 0.5 },
		velocity: { x: 0, y: 0 },
		prediction: { x: 0.5, y: 0.5 },
		...overrides,
	};
}

// ============================================================================
// FSM STATE MACHINE TESTS
// ============================================================================

describe('XStateFSMAdapter - State Machine', () => {
	let fsm: XStateFSMAdapter;

	beforeEach(() => {
		fsm = new XStateFSMAdapter();
	});

	afterEach(() => {
		fsm.dispose();
	});

	describe('Initial State', () => {
		it('should start in DISARMED state', () => {
			expect(fsm.getState()).toBe('DISARMED');
		});

		it('should return action=none when DISARMED', () => {
			const frame = createFrame({ trackingOk: false });
			const action = fsm.process(frame);
			expect(action.action).toBe('none');
			expect(action.state).toBe('DISARMED');
		});
	});

	describe('DISARMED → ARMING transition', () => {
		it('should transition to ARMING on valid baseline (Open_Palm + palmFacing)', () => {
			const frame = createFrame({
				label: 'Open_Palm',
				palmFacing: true,
				trackingOk: true,
				confidence: 0.9,
			});

			fsm.process(frame);
			expect(fsm.getState()).toBe('ARMING');
		});

		it('should stay DISARMED if tracking is lost', () => {
			const frame = createFrame({ trackingOk: false });
			fsm.process(frame);
			expect(fsm.getState()).toBe('DISARMED');
		});

		it('should stay DISARMED if palm is not facing', () => {
			const frame = createFrame({ palmFacing: false });
			fsm.process(frame);
			expect(fsm.getState()).toBe('DISARMED');
		});

		it('should stay DISARMED if confidence is too low', () => {
			const frame = createFrame({ confidence: 0.5 });
			fsm.process(frame);
			expect(fsm.getState()).toBe('DISARMED');
		});
	});

	describe('ARMING → ARMED transition', () => {
		it('should transition to ARMED after stable baseline (200ms)', () => {
			const startTime = 1000;

			// First frame - start ARMING
			fsm.process(createFrame({ ts: startTime }));
			expect(fsm.getState()).toBe('ARMING');

			// Frame at 100ms - still ARMING
			fsm.process(createFrame({ ts: startTime + 100 }));
			expect(fsm.getState()).toBe('ARMING');

			// Frame at 250ms - should be ARMED
			fsm.process(createFrame({ ts: startTime + 250 }));
			expect(fsm.getState()).toBe('ARMED');
		});

		it('should return to DISARMED if baseline broken during ARMING', () => {
			// Enter ARMING
			fsm.process(createFrame({ ts: 1000 }));
			expect(fsm.getState()).toBe('ARMING');

			// Break baseline - palm not facing
			fsm.process(createFrame({ ts: 1050, palmFacing: false }));
			expect(fsm.getState()).toBe('DISARMED');
		});
	});

	describe('ARMED state - pointer move', () => {
		beforeEach(() => {
			// Get to ARMED state
			fsm.process(createFrame({ ts: 0 }));
			fsm.process(createFrame({ ts: 250 }));
			expect(fsm.getState()).toBe('ARMED');
		});

		it('should emit move action when ARMED', () => {
			const action = fsm.process(createFrame({ ts: 300, position: { x: 0.3, y: 0.7 } }));
			expect(action.action).toBe('move');
			expect(action.state).toBe('ARMED');
			if (action.action === 'move') {
				expect(action.x).toBe(0.3);
				expect(action.y).toBe(0.7);
			}
		});

		it('should return to DISARMED if tracking lost', () => {
			const action = fsm.process(createFrame({ ts: 300, trackingOk: false }));
			expect(fsm.getState()).toBe('DISARMED');
			expect(action.action).toBe('none');
		});
	});

	describe('ARMED → DOWN_COMMIT (Pointing_Up click)', () => {
		beforeEach(() => {
			// Get to ARMED state
			fsm.process(createFrame({ ts: 0 }));
			fsm.process(createFrame({ ts: 250 }));
		});

		it('should transition to DOWN_COMMIT on Pointing_Up gesture', () => {
			const action = fsm.process(
				createFrame({
					ts: 300,
					label: 'Pointing_Up',
					confidence: 0.9,
				}),
			);

			expect(fsm.getState()).toBe('DOWN_COMMIT');
			expect(action.action).toBe('down');
			if (action.action === 'down') {
				expect(action.button).toBe(0); // Left click
			}
		});

		it('should emit up when returning to baseline from DOWN_COMMIT', () => {
			// Enter DOWN_COMMIT
			fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));
			expect(fsm.getState()).toBe('DOWN_COMMIT');

			// Return to baseline
			const action = fsm.process(
				createFrame({
					ts: 400,
					label: 'Open_Palm',
					palmFacing: true,
				}),
			);

			expect(fsm.getState()).toBe('ARMED');
			expect(action.action).toBe('up');
			if (action.action === 'up') {
				expect(action.button).toBe(0);
			}
		});

		it('should emit cancel if tracking lost during DOWN_COMMIT', () => {
			// Enter DOWN_COMMIT
			fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));

			// Lose tracking
			const action = fsm.process(createFrame({ ts: 400, trackingOk: false }));

			expect(fsm.getState()).toBe('DISARMED');
			expect(action.action).toBe('cancel');
		});
	});

	describe('ARMED → DOWN_NAV (Victory pan)', () => {
		beforeEach(() => {
			// Get to ARMED state
			fsm.process(createFrame({ ts: 0 }));
			fsm.process(createFrame({ ts: 250 }));
		});

		it('should transition to DOWN_NAV on Victory gesture', () => {
			const action = fsm.process(
				createFrame({
					ts: 300,
					label: 'Victory',
					confidence: 0.9,
				}),
			);

			expect(fsm.getState()).toBe('DOWN_NAV');
			expect(action.action).toBe('down');
			if (action.action === 'down') {
				expect(action.button).toBe(1); // Middle click
			}
		});

		it('should emit up when returning to baseline from DOWN_NAV', () => {
			// Enter DOWN_NAV
			fsm.process(createFrame({ ts: 300, label: 'Victory', confidence: 0.9 }));

			// Return to baseline
			const action = fsm.process(
				createFrame({
					ts: 400,
					label: 'Open_Palm',
					palmFacing: true,
				}),
			);

			expect(fsm.getState()).toBe('ARMED');
			expect(action.action).toBe('up');
			if (action.action === 'up') {
				expect(action.button).toBe(1);
			}
		});
	});

	describe('ARMED → ZOOM (Thumb gestures)', () => {
		beforeEach(() => {
			// Get to ARMED state
			fsm.process(createFrame({ ts: 0 }));
			fsm.process(createFrame({ ts: 250 }));
		});

		it('should emit wheel with negative deltaY on Thumb_Up (zoom in)', () => {
			const action = fsm.process(
				createFrame({
					ts: 300,
					label: 'Thumb_Up',
					confidence: 0.9,
				}),
			);

			expect(fsm.getState()).toBe('ZOOM');
			expect(action.action).toBe('wheel');
			if (action.action === 'wheel') {
				expect(action.deltaY).toBe(-100);
				expect(action.ctrl).toBe(true);
			}
		});

		it('should emit wheel with positive deltaY on Thumb_Down (zoom out)', () => {
			const action = fsm.process(
				createFrame({
					ts: 300,
					label: 'Thumb_Down',
					confidence: 0.9,
				}),
			);

			expect(fsm.getState()).toBe('ZOOM');
			expect(action.action).toBe('wheel');
			if (action.action === 'wheel') {
				expect(action.deltaY).toBe(100);
			}
		});
	});

	describe('disarm() method', () => {
		it('should force transition to DISARMED from any state', () => {
			// Get to ARMED
			fsm.process(createFrame({ ts: 0 }));
			fsm.process(createFrame({ ts: 250 }));
			expect(fsm.getState()).toBe('ARMED');

			// Force disarm
			fsm.disarm();
			expect(fsm.getState()).toBe('DISARMED');
		});

		it('should force transition from DOWN_COMMIT', () => {
			// Get to DOWN_COMMIT
			fsm.process(createFrame({ ts: 0 }));
			fsm.process(createFrame({ ts: 250 }));
			fsm.process(createFrame({ ts: 300, label: 'Pointing_Up', confidence: 0.9 }));
			expect(fsm.getState()).toBe('DOWN_COMMIT');

			// Force disarm
			fsm.disarm();
			expect(fsm.getState()).toBe('DISARMED');
		});
	});

	describe('subscribe()', () => {
		it('should call callback on state changes', () => {
			const states: string[] = [];
			const unsubscribe = fsm.subscribe((state) => states.push(state));

			// Trigger state changes
			fsm.process(createFrame({ ts: 0 }));
			fsm.process(createFrame({ ts: 250 }));

			expect(states).toContain('ARMING');
			expect(states).toContain('ARMED');

			unsubscribe();
		});
	});
});
