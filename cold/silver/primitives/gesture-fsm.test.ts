import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import type { SmoothedFrame } from '../../../hot/bronze/src/contracts/schemas.js';
import { gestureMachine } from './gesture-fsm.js';

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
});
