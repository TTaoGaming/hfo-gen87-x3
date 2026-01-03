import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import { DEFAULT_ARM_STABLE_MS, DEFAULT_CMD_WINDOW_MS, gestureMachine } from './gesture-fsm.js';

describe('Gesture FSM Mutation Killer', () => {
it('should have correct machine ID and initial state', () => {
expect(gestureMachine.id).toBe('gesture');
const actor = createActor(gestureMachine).start();
expect(actor.getSnapshot().value).toBe('DISARMED');
});

it('should kill isVictory survivor', () => {
const actor = createActor(gestureMachine).start();

// Go to ARMED
actor.send({
type: 'FRAME',
frame: {
ts: 100,
trackingOk: true,
palmFacing: true,
label: 'Open_Palm',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_ARM_STABLE_MS,
trackingOk: true,
palmFacing: true,
label: 'Open_Palm',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
expect(actor.getSnapshot().value).toBe('ARMED');

// Test Victory with just enough confidence
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_ARM_STABLE_MS + 10,
trackingOk: true,
palmFacing: true,
label: 'Victory',
confidence: 0.7, // DEFAULT_MIN_CONFIDENCE
position: { x: 0, y: 0, z: 0 },
},
});
expect(actor.getSnapshot().value).toBe('DOWN_NAV');
});

it('should kill isThumbUp survivor', () => {
const actor = createActor(gestureMachine).start();

// Go to ARMED
actor.send({
type: 'FRAME',
frame: {
ts: 100,
trackingOk: true,
palmFacing: true,
label: 'Open_Palm',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_ARM_STABLE_MS,
trackingOk: true,
palmFacing: true,
label: 'Open_Palm',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});

// Test Thumb_Up with just enough confidence
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_ARM_STABLE_MS + 10,
trackingOk: true,
palmFacing: true,
label: 'Thumb_Up',
confidence: 0.7,
position: { x: 0, y: 0, z: 0 },
},
});
expect(actor.getSnapshot().value).toBe('ZOOM');
});

it('should kill isThumbDown survivor', () => {
const actor = createActor(gestureMachine).start();

// Go to ARMED
actor.send({
type: 'FRAME',
frame: {
ts: 100,
trackingOk: true,
palmFacing: true,
label: 'Open_Palm',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_ARM_STABLE_MS,
trackingOk: true,
palmFacing: true,
label: 'Open_Palm',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});

// Test Thumb_Down with just enough confidence
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_ARM_STABLE_MS + 10,
trackingOk: true,
palmFacing: true,
label: 'Thumb_Down',
confidence: 0.7,
position: { x: 0, y: 0, z: 0 },
},
});
expect(actor.getSnapshot().value).toBe('ZOOM');
});

it('should kill isCmdWindowOk survivor', () => {
const actor = createActor(gestureMachine).start();

// Go to ARMED
actor.send({
type: 'FRAME',
frame: {
ts: 100,
trackingOk: true,
palmFacing: true,
label: 'Open_Palm',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_ARM_STABLE_MS,
trackingOk: true,
palmFacing: true,
label: 'Open_Palm',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});

// Go to DOWN_COMMIT (within window)
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_ARM_STABLE_MS + 10,
trackingOk: true,
palmFacing: true,
label: 'Pointing_Up',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');

// Test boundary of command window (still within)
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_CMD_WINDOW_MS,
trackingOk: true,
palmFacing: true,
label: 'Pointing_Up',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');

// Exceed command window
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_CMD_WINDOW_MS + 1,
trackingOk: true,
palmFacing: true,
label: 'Pointing_Up',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
expect(actor.getSnapshot().value).toBe('ARMED');
});

it('should transition back to ARMED from gesture states when guard fails', () => {
const actor = createActor(gestureMachine).start();

// 1. Go to ARMED
actor.send({
type: 'FRAME',
frame: {
ts: 100,
trackingOk: true,
palmFacing: true,
label: 'Open_Palm',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_ARM_STABLE_MS,
trackingOk: true,
palmFacing: true,
label: 'Open_Palm',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
expect(actor.getSnapshot().value).toBe('ARMED');

// 2. Go to DOWN_COMMIT
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_ARM_STABLE_MS + 10,
trackingOk: true,
palmFacing: true,
label: 'Pointing_Up',
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
expect(actor.getSnapshot().value).toBe('DOWN_COMMIT');

// 3. Fail guard -> back to ARMED
actor.send({
type: 'FRAME',
frame: {
ts: 100 + DEFAULT_ARM_STABLE_MS + 20,
trackingOk: true,
palmFacing: true,
label: 'Open_Palm', // Not Pointing_Up
confidence: 0.9,
position: { x: 0, y: 0, z: 0 },
},
});
expect(actor.getSnapshot().value).toBe('ARMED');
expect(actor.getSnapshot().context.armedFromBaseline).toBe(false);
});
});
