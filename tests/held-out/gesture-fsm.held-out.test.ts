/**
 * Gesture FSM - HELD-OUT TESTS
 *
 * These tests are HIDDEN from AI during development.
 * They validate edge cases that AI might skip or game.
 *
 * Gen87.X3 | Held-Out Defense Protocol | 2026-01-02
 */
import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import {
	DEFAULT_ARM_STABLE_MS,
	DEFAULT_CMD_WINDOW_MS,
	DEFAULT_MIN_CONFIDENCE,
	type GestureContext,
	gestureMachine,
	guards,
} from '../../cold/silver/primitives/gesture-fsm.js';
import type { SmoothedFrame } from '../../hot/bronze/src/contracts/schemas.js';

// Helper to create a SmoothedFrame for testing
function createFrame(overrides: Partial<SmoothedFrame> = {}): SmoothedFrame {
	return {
		ts: 1000,
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: 'Open_Palm',
		confidence: 0.9,
		position: { x: 0.5, y: 0.5 },
		velocity: { x: 0, y: 0 },
		prediction: { x: 0.5, y: 0.5 },
		...overrides,
	};
}

describe('GestureFSM HELD-OUT Validation', () => {
	// =========================================================================
	// EDGE CASE: Initial State
	// =========================================================================

	it('starts in DISARMED state', () => {
		const actor = createActor(gestureMachine);
		actor.start();
		expect(actor.getSnapshot().value).toBe('DISARMED');
		actor.stop();
	});

	// =========================================================================
	// EDGE CASE: Confidence Thresholds
	// =========================================================================

	it('rejects frame with confidence exactly at threshold', () => {
		const frame = createFrame({ confidence: DEFAULT_MIN_CONFIDENCE });
		const result = guards.isBaselineOk({ event: { type: 'FRAME', frame } } as any);
		// Exactly at threshold should pass (>=)
		expect(result).toBe(true);
	});

	it('rejects frame with confidence just below threshold', () => {
		const frame = createFrame({ confidence: DEFAULT_MIN_CONFIDENCE - 0.001 });
		const result = guards.isBaselineOk({ event: { type: 'FRAME', frame } } as any);
		expect(result).toBe(false);
	});

	it('rejects frame with zero confidence', () => {
		const frame = createFrame({ confidence: 0 });
		const result = guards.isBaselineOk({ event: { type: 'FRAME', frame } } as any);
		expect(result).toBe(false);
	});

	// =========================================================================
	// EDGE CASE: Palm Orientation
	// =========================================================================

	it('rejects baseline when palm not facing camera', () => {
		const frame = createFrame({ palmFacing: false });
		const result = guards.isBaselineOk({ event: { type: 'FRAME', frame } } as any);
		expect(result).toBe(false);
	});

	it('requires palm facing for baseline even with high confidence', () => {
		const frame = createFrame({ palmFacing: false, confidence: 1.0 });
		const result = guards.isBaselineOk({ event: { type: 'FRAME', frame } } as any);
		expect(result).toBe(false);
	});

	// =========================================================================
	// EDGE CASE: Tracking Loss
	// =========================================================================

	it('rejects frame when tracking lost', () => {
		const frame = createFrame({ trackingOk: false });
		const result = guards.isTrackingOk({ event: { type: 'FRAME', frame } } as any);
		expect(result).toBe(false);
	});

	it('isBaselineOk fails when tracking lost', () => {
		const frame = createFrame({ trackingOk: false, palmFacing: true, label: 'Open_Palm' });
		const result = guards.isBaselineOk({ event: { type: 'FRAME', frame } } as any);
		expect(result).toBe(false);
	});

	// =========================================================================
	// EDGE CASE: Stability Timing
	// =========================================================================

	it('requires exactly ARM_STABLE_MS for stability', () => {
		const context: GestureContext = {
			baselineStableAt: 1000,
			armedFromBaseline: false,
			lastPosition: null,
			currentTs: 0,
		};

		// Exactly at threshold
		const frameAtThreshold = createFrame({ ts: 1000 + DEFAULT_ARM_STABLE_MS });
		const resultAt = guards.isBaselineStable({
			context,
			event: { type: 'FRAME', frame: frameAtThreshold },
		} as any);
		expect(resultAt).toBe(true);

		// Just under threshold
		const frameUnder = createFrame({ ts: 1000 + DEFAULT_ARM_STABLE_MS - 1 });
		const resultUnder = guards.isBaselineStable({
			context,
			event: { type: 'FRAME', frame: frameUnder },
		} as any);
		expect(resultUnder).toBe(false);
	});

	// =========================================================================
	// EDGE CASE: Command Window Timing
	// =========================================================================

	it('command window expires after CMD_WINDOW_MS', () => {
		const context: GestureContext = {
			baselineStableAt: 1000,
			armedFromBaseline: true,
			lastPosition: null,
			currentTs: 0,
		};

		// Just within window
		const frameInWindow = createFrame({ ts: 1000 + DEFAULT_CMD_WINDOW_MS });
		const resultIn = guards.isCmdWindowOk({
			context,
			event: { type: 'FRAME', frame: frameInWindow },
		} as any);
		expect(resultIn).toBe(true);

		// Just after window
		const frameOutWindow = createFrame({ ts: 1000 + DEFAULT_CMD_WINDOW_MS + 1 });
		const resultOut = guards.isCmdWindowOk({
			context,
			event: { type: 'FRAME', frame: frameOutWindow },
		} as any);
		expect(resultOut).toBe(false);
	});

	// =========================================================================
	// EDGE CASE: Gesture Label Recognition
	// =========================================================================

	it('recognizes Pointing_Up gesture', () => {
		const frame = createFrame({ label: 'Pointing_Up', confidence: 0.9 });
		expect(guards.isPointingUp({ event: { type: 'FRAME', frame } } as any)).toBe(true);
	});

	it('recognizes Victory gesture', () => {
		const frame = createFrame({ label: 'Victory', confidence: 0.9 });
		expect(guards.isVictory({ event: { type: 'FRAME', frame } } as any)).toBe(true);
	});

	it('recognizes Thumb_Up gesture', () => {
		const frame = createFrame({ label: 'Thumb_Up', confidence: 0.9 });
		expect(guards.isThumbUp({ event: { type: 'FRAME', frame } } as any)).toBe(true);
	});

	it('recognizes Thumb_Down gesture', () => {
		const frame = createFrame({ label: 'Thumb_Down', confidence: 0.9 });
		expect(guards.isThumbDown({ event: { type: 'FRAME', frame } } as any)).toBe(true);
	});

	it('rejects low-confidence gestures', () => {
		const frame = createFrame({ label: 'Pointing_Up', confidence: 0.5 });
		expect(guards.isPointingUp({ event: { type: 'FRAME', frame } } as any)).toBe(false);
	});

	// =========================================================================
	// STATE MACHINE: Full Transitions
	// =========================================================================

	it('transitions DISARMED → ARMING → ARMED', () => {
		const actor = createActor(gestureMachine);
		actor.start();

		// DISARMED -> ARMING
		actor.send({ type: 'FRAME', frame: createFrame({ ts: 1000 }) });
		expect(actor.getSnapshot().value).toBe('ARMING');

		// ARMING -> ARMED (after stability period)
		actor.send({ type: 'FRAME', frame: createFrame({ ts: 1000 + DEFAULT_ARM_STABLE_MS }) });
		expect(actor.getSnapshot().value).toBe('ARMED');

		actor.stop();
	});

	it('transitions ARMED → DOWN_COMMIT on Pointing_Up', () => {
		const actor = createActor(gestureMachine);
		actor.start();

		// Get to ARMED state
		actor.send({ type: 'FRAME', frame: createFrame({ ts: 1000 }) });
		actor.send({ type: 'FRAME', frame: createFrame({ ts: 1000 + DEFAULT_ARM_STABLE_MS }) });
		expect(actor.getSnapshot().value).toBe('ARMED');

		// ARMED -> DOWN_COMMIT
		actor.send({
			type: 'FRAME',
			frame: createFrame({ ts: 1300, label: 'Pointing_Up', confidence: 0.9 }),
		});
		expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');

		actor.stop();
	});

	it('transitions DOWN_COMMIT → ARMED on gesture release', () => {
		const actor = createActor(gestureMachine);
		actor.start();

		// Get to DOWN_COMMIT state
		actor.send({ type: 'FRAME', frame: createFrame({ ts: 1000 }) });
		actor.send({ type: 'FRAME', frame: createFrame({ ts: 1000 + DEFAULT_ARM_STABLE_MS }) });
		actor.send({
			type: 'FRAME',
			frame: createFrame({ ts: 1300, label: 'Pointing_Up' }),
		});
		expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');

		// DOWN_COMMIT -> ARMED (release gesture)
		actor.send({
			type: 'FRAME',
			frame: createFrame({ ts: 1400, label: 'Open_Palm' }),
		});
		expect(actor.getSnapshot().value).toBe('ARMED');

		actor.stop();
	});

	it('transitions any state → DISARMED on DISARM event', () => {
		const actor = createActor(gestureMachine);
		actor.start();

		// Get to ARMED
		actor.send({ type: 'FRAME', frame: createFrame({ ts: 1000 }) });
		actor.send({ type: 'FRAME', frame: createFrame({ ts: 1200 }) });
		expect(actor.getSnapshot().value).toBe('ARMED');

		// Global DISARM
		actor.send({ type: 'DISARM' });
		expect(actor.getSnapshot().value).toBe('DISARMED');

		actor.stop();
	});

	// =========================================================================
	// EDGE CASE: Rapid State Changes
	// =========================================================================

	it('handles rapid gesture changes without crashing', () => {
		const actor = createActor(gestureMachine);
		actor.start();

		const gestures = ['Open_Palm', 'Pointing_Up', 'Victory', 'Thumb_Up', 'None', 'Open_Palm'];

		for (let i = 0; i < 100; i++) {
			const label = gestures[i % gestures.length] as any;
			actor.send({
				type: 'FRAME',
				frame: createFrame({ ts: 1000 + i * 16, label, confidence: 0.9 }),
			});
			// Should never throw
			expect(actor.getSnapshot().value).toBeDefined();
		}

		actor.stop();
	});

	// =========================================================================
	// EDGE CASE: Non-FRAME Events
	// =========================================================================

	it('guards return false for non-FRAME events', () => {
		expect(guards.isBaselineOk({ event: { type: 'DISARM' } } as any)).toBe(false);
		expect(guards.isTrackingOk({ event: { type: 'DISARM' } } as any)).toBe(false);
		expect(guards.isPointingUp({ event: { type: 'DISARM' } } as any)).toBe(false);
	});
});
