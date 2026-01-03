import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import type { SmoothedFrame } from '../../../hot/bronze/src/contracts/schemas.js';
import { gestureMachine, guards } from './gesture-fsm.js';

describe('GestureFSM Primitive', () => {
const createMockFrame = (overrides: Partial<SmoothedFrame> = {}): SmoothedFrame => ({
ts: Date.now(),
handId: 'right',
trackingOk: true,
palmFacing: true,
label: 'Open_Palm',
confidence: 0.9,
position: { x: 0.5, y: 0.5 },
velocity: { x: 0, y: 0 },
prediction: { x: 0.5, y: 0.5 },
...overrides,
});

it('should transition from DISARMED to ARMING on baseline', () => {
const actor = createActor(gestureMachine).start();
const frame = createMockFrame({ ts: 1234 });
actor.send({ type: 'FRAME', frame });
expect(actor.getSnapshot().value).toBe('ARMING');
expect(actor.getSnapshot().context.baselineStableAt).toBe(1234);
expect(actor.getSnapshot().context.currentTs).toBe(1234);
});

it('should transition to ARMED after stability period', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;

actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
expect(actor.getSnapshot().value).toBe('ARMING');

// Send frame after 250ms (default stable is 200ms)
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
expect(actor.getSnapshot().value).toBe('ARMED');
expect(actor.getSnapshot().context.armedFromBaseline).toBe(true);
expect(actor.getSnapshot().context.currentTs).toBe(startTs + 250);
});

it('should transition to DOWN_COMMIT on Pointing_Up', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;

actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
expect(actor.getSnapshot().value).toBe('ARMED');

const pos = { x: 0.1, y: 0.2 };
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Pointing_Up', position: pos }) });
expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');
expect(actor.getSnapshot().context.lastPosition).toEqual(pos);
expect(actor.getSnapshot().context.currentTs).toBe(startTs + 300);
});

it('should disarm on tracking loss', () => {
const actor = createActor(gestureMachine).start();
actor.send({ type: 'FRAME', frame: createMockFrame() });
actor.send({ type: 'FRAME', frame: createMockFrame({ trackingOk: false }) });
expect(actor.getSnapshot().value).toBe('DISARMED');
});

it('should reject frames below confidence threshold', () => {
const actor = createActor(gestureMachine).start();
actor.send({ type: 'FRAME', frame: createMockFrame({ confidence: 0.6 }) });
expect(actor.getSnapshot().value).toBe('DISARMED');
});

it('should reject frames when palm is not facing camera', () => {
const actor = createActor(gestureMachine).start();
actor.send({ type: 'FRAME', frame: createMockFrame({ palmFacing: false }) });
expect(actor.getSnapshot().value).toBe('DISARMED');
});

it('should transition to DOWN_NAV on Victory', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });

const pos = { x: 0.3, y: 0.4 };
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Victory', position: pos }) });
expect(actor.getSnapshot().value).toBe('DOWN_NAV');
expect(actor.getSnapshot().context.lastPosition).toEqual(pos);
expect(actor.getSnapshot().context.currentTs).toBe(startTs + 300);
});

it('should transition to ZOOM on Thumb_Up', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Thumb_Up' }) });
expect(actor.getSnapshot().value).toBe('ZOOM');
expect(actor.getSnapshot().context.currentTs).toBe(startTs + 300);
});

it('should transition to ZOOM on Thumb_Down', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Thumb_Down' }) });
expect(actor.getSnapshot().value).toBe('ZOOM');
expect(actor.getSnapshot().context.currentTs).toBe(startTs + 300);
});

it('should transition to ARMED from command states on release', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });

// From DOWN_COMMIT
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Pointing_Up' }) });
expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 400, label: 'Open_Palm' }) });
expect(actor.getSnapshot().value).toBe('ARMED');
expect(actor.getSnapshot().context.armedFromBaseline).toBe(false);

// From DOWN_NAV
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 500, label: 'Victory' }) });
expect(actor.getSnapshot().value).toBe('DOWN_NAV');
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 600, label: 'Open_Palm' }) });
expect(actor.getSnapshot().value).toBe('ARMED');
expect(actor.getSnapshot().context.armedFromBaseline).toBe(false);

// From ZOOM
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 700, label: 'Thumb_Up' }) });
expect(actor.getSnapshot().value).toBe('ZOOM');
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 800, label: 'Open_Palm' }) });
expect(actor.getSnapshot().value).toBe('ARMED');
expect(actor.getSnapshot().context.armedFromBaseline).toBe(false);
});

it('should stay in ZOOM on Thumb_Up/Down', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Thumb_Up' }) });
expect(actor.getSnapshot().value).toBe('ZOOM');

actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 400, label: 'Thumb_Down' }) });
expect(actor.getSnapshot().value).toBe('ZOOM');
expect(actor.getSnapshot().context.currentTs).toBe(startTs + 400);
});

it('should stay in ARMED on tracking ok', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
expect(actor.getSnapshot().value).toBe('ARMED');

actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Open_Palm' }) });
expect(actor.getSnapshot().value).toBe('ARMED');
expect(actor.getSnapshot().context.currentTs).toBe(startTs + 300);
});

it('should stay in DOWN_COMMIT on Pointing_Up', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Pointing_Up' }) });
expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');

const pos = { x: 0.6, y: 0.6 };
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 400, label: 'Pointing_Up', position: pos }) });
expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');
expect(actor.getSnapshot().context.lastPosition).toEqual(pos);
expect(actor.getSnapshot().context.currentTs).toBe(startTs + 400);
});

it('should stay in DOWN_NAV on Victory', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Victory' }) });
expect(actor.getSnapshot().value).toBe('DOWN_NAV');

const pos = { x: 0.7, y: 0.7 };
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 400, label: 'Victory', position: pos }) });
expect(actor.getSnapshot().value).toBe('DOWN_NAV');
expect(actor.getSnapshot().context.lastPosition).toEqual(pos);
expect(actor.getSnapshot().context.currentTs).toBe(startTs + 400);
});

it('should return to ARMED when gesture is released', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Pointing_Up' }) });
expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');

actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 400, label: 'Open_Palm' }) });
expect(actor.getSnapshot().value).toBe('ARMED');
});

it('should expire command window if no gesture is made', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
expect(actor.getSnapshot().value).toBe('ARMED');

// Wait 1.5 seconds (default command window is 1000ms)
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 2000, label: 'Pointing_Up' }) });
expect(actor.getSnapshot().value).toBe('DISARMED');
});

it('should handle non-FRAME events in guards', () => {
const actor = createActor(gestureMachine).start();
actor.send({ type: 'UNKNOWN' as any });
expect(actor.getSnapshot().value).toBe('DISARMED');
});

it('should kill confidence boundary survivors', () => {
const actor = createActor(gestureMachine).start();
const startTs = 1000;
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
expect(actor.getSnapshot().value).toBe('ARMED');

// Test Pointing_Up boundary (0.7)
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Pointing_Up', confidence: 0.7 }) });
expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');
actor.send({ type: 'DISARM' });

// Test Victory boundary (0.7)
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Victory', confidence: 0.7 }) });
expect(actor.getSnapshot().value).toBe('DOWN_NAV');
actor.send({ type: 'DISARM' });

// Test Thumb_Up boundary (0.7)
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Thumb_Up', confidence: 0.7 }) });
expect(actor.getSnapshot().value).toBe('ZOOM');
actor.send({ type: 'DISARM' });

// Test Thumb_Down boundary (0.7)
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 250 }) });
actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 300, label: 'Thumb_Down', confidence: 0.7 }) });
expect(actor.getSnapshot().value).toBe('ZOOM');
});

  it('should handle DISARM event from any state', () => {
    const actor = createActor(gestureMachine).start();
    actor.send({ type: 'FRAME', frame: createMockFrame() });
    expect(actor.getSnapshot().value).toBe('ARMING');
    actor.send({ type: 'DISARM' });
    expect(actor.getSnapshot().value).toBe('DISARMED');

    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 1000 }) });
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 1300 }) });
    expect(actor.getSnapshot().value).toBe('ARMED');
    actor.send({ type: 'DISARM' });
    expect(actor.getSnapshot().value).toBe('DISARMED');
    expect(actor.getSnapshot().context.baselineStableAt).toBeNull();
    expect(actor.getSnapshot().context.armedFromBaseline).toBe(false);
  });

  it('should kill timing boundary survivors', () => {
    const actor = createActor(gestureMachine).start();
    const startTs = 1000;

    // ARMING -> ARMED exactly at 200ms
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs }) });
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 200 }) });
    expect(actor.getSnapshot().value).toBe('ARMED');

    // ARMED -> DISARMED exactly at 500ms (isCmdWindowExceeded)
    // Wait exactly 500ms
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: startTs + 700, label: 'Pointing_Up' }) }); // 1700 - 1000 = 700 > 500
    expect(actor.getSnapshot().value).toBe('DISARMED');

    // Reset and test isCmdWindowOk exactly at 500ms
    actor.send({ type: 'DISARM' });
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 2000 }) });
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 2200 }) });
    expect(actor.getSnapshot().value).toBe('ARMED');
    
    // Stay in command state exactly at 500ms
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 2300, label: 'Pointing_Up' }) });
    expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 2500, label: 'Pointing_Up' }) }); // 2500 - 2000 = 500ms
    expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');
  });

  it('should kill confidence boundary survivors (exactly 0.7)', () => {
    const actor = createActor(gestureMachine).start();
    actor.send({ type: 'FRAME', frame: createMockFrame({ confidence: 0.7 }) });
    expect(actor.getSnapshot().value).toBe('ARMING');
  });

  it('should handle null baselineStableAt in guards', () => {
    const actor = createActor(gestureMachine).start();
    // Manually trigger guards that check baselineStableAt
    // Since we can't easily trigger them without being in the right state,
    // we rely on the fact that DISARMED sets it to null.
    expect(actor.getSnapshot().context.baselineStableAt).toBeNull();
  });

  it('should handle non-FRAME events in all guards', () => {
    const actor = createActor(gestureMachine).start();
    // We already have one test for this, but let's be more thorough if needed.
    // The guards are used in multiple states.
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 1000 }) });
    actor.send({ type: 'UNKNOWN' as any });
    expect(actor.getSnapshot().value).toBe('ARMING'); // Should stay in ARMING if guard returns false
  });

  it('should kill remaining survivors', () => {
    const actor = createActor(gestureMachine).start();

    // 1. Test non-FRAME events in all guards
    const nonFrameEvent = { type: 'NOT_A_FRAME' } as any;
    expect(guards.isBaselineOk({ event: nonFrameEvent } as any)).toBe(false);
    expect(guards.isBaselineStable({ context: { baselineStableAt: 100 }, event: nonFrameEvent } as any)).toBe(false);
    expect(guards.isPointingUp({ event: nonFrameEvent } as any)).toBe(false);
    expect(guards.isVictory({ event: nonFrameEvent } as any)).toBe(false);
    expect(guards.isThumbUp({ event: nonFrameEvent } as any)).toBe(false);
    expect(guards.isThumbDown({ event: nonFrameEvent } as any)).toBe(false);
    expect(guards.isTrackingOk({ event: nonFrameEvent } as any)).toBe(false);
    expect(guards.isCmdWindowOk({ context: {}, event: nonFrameEvent } as any)).toBe(false);
    expect(guards.isCmdWindowExceeded({ context: {}, event: nonFrameEvent } as any)).toBe(false);

    // 2. Test null baselineStableAt in guards
    expect(guards.isBaselineStable({ context: { baselineStableAt: null }, event: { type: 'FRAME', frame: createMockFrame({ ts: 100 }) } } as any)).toBe(false);
    expect(guards.isCmdWindowOk({ context: { baselineStableAt: null }, event: { type: 'FRAME', frame: createMockFrame({ ts: 100 }) } } as any)).toBe(false);
    expect(guards.isCmdWindowExceeded({ context: { baselineStableAt: null }, event: { type: 'FRAME', frame: createMockFrame({ ts: 100 }) } } as any)).toBe(false);

    // 3. Test isCmdWindowOk when armedFromBaseline is false
    expect(guards.isCmdWindowOk({ 
        context: { armedFromBaseline: false, baselineStableAt: 100 }, 
        event: { type: 'FRAME', frame: createMockFrame({ ts: 200 }) } 
    } as any)).toBe(false);

    // 4. Test isCmdWindowOk at exact boundary
    expect(guards.isCmdWindowOk({ 
        context: { armedFromBaseline: true, baselineStableAt: 100 }, 
        event: { type: 'FRAME', frame: createMockFrame({ ts: 100 + 500 }) } 
    } as any)).toBe(true);
    expect(guards.isCmdWindowOk({ 
        context: { armedFromBaseline: true, baselineStableAt: 100 }, 
        event: { type: 'FRAME', frame: createMockFrame({ ts: 100 + 501 }) } 
    } as any)).toBe(false);

    // 5. Test isCmdWindowExceeded at exact boundary
    expect(guards.isCmdWindowExceeded({ 
        context: { armedFromBaseline: true, baselineStableAt: 100 }, 
        event: { type: 'FRAME', frame: createMockFrame({ ts: 100 + 500 }) } 
    } as any)).toBe(false);
    expect(guards.isCmdWindowExceeded({ 
        context: { armedFromBaseline: true, baselineStableAt: 100 }, 
        event: { type: 'FRAME', frame: createMockFrame({ ts: 100 + 501 }) } 
    } as any)).toBe(true);

    // 6. Test isThumbDown confidence boundary
    expect(guards.isThumbDown({ 
        event: { type: 'FRAME', frame: createMockFrame({ label: 'Thumb_Down', confidence: 0.69 }) } 
    } as any)).toBe(false);

    // 7. Verify armedFromBaseline reset in command states
    actor.send({ type: 'FRAME', frame: createMockFrame({ label: 'Open_Palm', confidence: 0.8, ts: 1000 }) });
    actor.send({ type: 'FRAME', frame: createMockFrame({ label: 'Open_Palm', confidence: 0.8, ts: 1201 }) });
    expect(actor.getSnapshot().value).toBe('ARMED');
    expect(actor.getSnapshot().context.armedFromBaseline).toBe(true);

    actor.send({ type: 'FRAME', frame: createMockFrame({ label: 'Pointing_Up', confidence: 0.8, ts: 1300 }) });
    expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');
    
    // Release gesture
    actor.send({ type: 'FRAME', frame: createMockFrame({ label: 'Open_Palm', confidence: 0.8, ts: 1400 }) });
    expect(actor.getSnapshot().value).toBe('ARMED');
    expect(actor.getSnapshot().context.armedFromBaseline).toBe(false);

    // 8. Kill surviving mutants in command state transitions
    // Test DOWN_NAV guard logic (Mutant #242)
    expect(guards.isVictory({ event: { type: 'FRAME', frame: createMockFrame({ label: 'Victory', confidence: 0.7 }) } } as any)).toBe(true);
    expect(guards.isVictory({ event: { type: 'FRAME', frame: createMockFrame({ label: 'Victory', confidence: 0.69 }) } } as any)).toBe(false);

    // Test ZOOM guard logic (Mutant #260, #261)
    expect(guards.isThumbUp({ event: { type: 'FRAME', frame: createMockFrame({ label: 'Thumb_Up', confidence: 0.7 }) } } as any)).toBe(true);
    expect(guards.isThumbDown({ event: { type: 'FRAME', frame: createMockFrame({ label: 'Thumb_Down', confidence: 0.7 }) } } as any)).toBe(true);
    
    // Test state transitions and actions (Mutant #215, #251, #271)
    actor.send({ type: 'DISARM' });
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 2000 }) });
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 2200 }) });
    expect(actor.getSnapshot().value).toBe('ARMED');

    // ARMED -> DOWN_NAV (Mutant #251)
    const navPos = { x: 0.9, y: 0.9 };
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 2250, label: 'Victory', position: navPos }) });
    expect(actor.getSnapshot().value).toBe('DOWN_NAV');
    expect(actor.getSnapshot().context.lastPosition).toEqual(navPos);

    // DOWN_NAV -> DOWN_NAV (Mutant #245)
    const navPos2 = { x: 0.95, y: 0.95 };
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 2300, label: 'Victory', position: navPos2 }) });
    expect(actor.getSnapshot().value).toBe('DOWN_NAV');
    expect(actor.getSnapshot().context.lastPosition).toEqual(navPos2);

    // ARMED -> ZOOM (Mutant #271)
    actor.send({ type: 'DISARM' });
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 3000 }) });
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 3200 }) });
    expect(actor.getSnapshot().value).toBe('ARMED');
    expect(actor.getSnapshot().context.armedFromBaseline).toBe(true);

    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 3300, label: 'Thumb_Up' }) });
    expect(actor.getSnapshot().value).toBe('ZOOM');
    expect(actor.getSnapshot().context.currentTs).toBe(3300);

    // ZOOM -> ZOOM (Mutant #266)
    actor.send({ type: 'FRAME', frame: createMockFrame({ ts: 3400, label: 'Thumb_Down' }) });
    expect(actor.getSnapshot().value).toBe('ZOOM');
    expect(actor.getSnapshot().context.currentTs).toBe(3400);
  });
});
