/**
 * Gesture Finite State Machine - PURE PRIMITIVE
 *
 * Gen87.X3 | cold/silver/primitives | MUTATION TESTABLE
 *
 * Machine design from: W3C_GESTURE_CONTROL_PLANE_SPEC.md Section 4
 * EXEMPLAR: XState v5
 *
 * This is the PURE MACHINE DEFINITION extracted from the adapter.
 */
import { assign, setup } from 'xstate';
import type { SmoothedFrame } from '../../../hot/bronze/src/contracts/schemas.js';

// ============================================================================
// TYPES
// ============================================================================

export type GestureContext = {
	/** Time when baseline became stable */
	baselineStableAt: number | null;
	/** Whether we entered ARMED from baseline (not from command state) */
	armedFromBaseline: boolean;
	/** Last valid position */
	lastPosition: { x: number; y: number } | null;
	/** Current frame timestamp */
	currentTs: number;
};

export type GestureEvent = { type: 'FRAME'; frame: SmoothedFrame } | { type: 'DISARM' };

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_ARM_STABLE_MS = 200;
export const DEFAULT_CMD_WINDOW_MS = 500;
export const DEFAULT_MIN_CONFIDENCE = 0.7;

// ============================================================================
// GUARDS
// ============================================================================

export const guards = {
	isBaselineOk: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		const { frame } = event;
		return (
			frame.trackingOk &&
			frame.palmFacing &&
			frame.label === 'Open_Palm' &&
			frame.confidence >= DEFAULT_MIN_CONFIDENCE
		);
	},

	isBaselineStable: ({ context, event }: { context: GestureContext; event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		if (context.baselineStableAt === null) return false;
		return event.frame.ts - context.baselineStableAt >= DEFAULT_ARM_STABLE_MS;
	},

	isCmdWindowOk: ({ context, event }: { context: GestureContext; event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		if (!context.armedFromBaseline) return false;
		if (context.baselineStableAt === null) return false;
		return event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS;
	},

	isCmdWindowExceeded: ({ context, event }: { context: GestureContext; event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		if (!context.armedFromBaseline) return false;
		if (context.baselineStableAt === null) return false;
		return event.frame.ts - context.baselineStableAt > DEFAULT_CMD_WINDOW_MS;
	},

	isTrackingOk: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		return event.frame.trackingOk;
	},

	isPalmFacing: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		return event.frame.palmFacing;
	},

	isPointingUp: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		return event.frame.label === 'Pointing_Up' && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
	},

	isVictory: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		return event.frame.label === 'Victory' && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
	},

	isThumbUp: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		return event.frame.label === 'Thumb_Up' && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
	},

	isThumbDown: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		return event.frame.label === 'Thumb_Down' && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
	},
};

// ============================================================================
// MACHINE SETUP
// ============================================================================

export const gestureMachine = setup({
	types: {
		context: {} as GestureContext,
		events: {} as GestureEvent,
	},
	guards,
}).createMachine({
	id: 'gesture',
	initial: 'DISARMED',
	context: {
		baselineStableAt: null,
		armedFromBaseline: false,
		lastPosition: null,
		currentTs: 0,
	},
	on: {
		DISARM: { target: '.DISARMED' },
	},
	states: {
		DISARMED: {
			entry: assign({
				baselineStableAt: null,
				armedFromBaseline: false,
			}),
			on: {
				FRAME: {
					guard: 'isBaselineOk',
					target: 'ARMING',
					actions: assign({
						baselineStableAt: ({ event }) => (event as any).frame.ts,
						currentTs: ({ event }) => (event as any).frame.ts,
					}),
				},
			},
		},
		ARMING: {
			on: {
				FRAME: [
					{
						guard: 'isBaselineStable',
						target: 'ARMED',
						actions: assign({
							armedFromBaseline: true,
							currentTs: ({ event }) => (event as any).frame.ts,
						}),
					},
					{
						guard: 'isBaselineOk',
						target: 'ARMING',
						actions: assign({
							currentTs: ({ event }) => (event as any).frame.ts,
						}),
					},
					{
						target: 'DISARMED',
					},
				],
			},
		},
		ARMED: {
			on: {
				FRAME: [
					{
						guard: 'isCmdWindowExceeded',
						target: 'DISARMED',
					},
					{
						guard: 'isPointingUp',
						target: 'DOWN_COMMIT',
						actions: assign({
							lastPosition: ({ event }) => (event as any).frame.position,
							currentTs: ({ event }) => (event as any).frame.ts,
						}),
					},
					{
						guard: 'isVictory',
						target: 'DOWN_NAV',
						actions: assign({
							lastPosition: ({ event }) => (event as any).frame.position,
							currentTs: ({ event }) => (event as any).frame.ts,
						}),
					},
					{
						guard: 'isThumbUp',
						target: 'ZOOM',
						actions: assign({
							currentTs: ({ event }) => (event as any).frame.ts,
						}),
					},
					{
						guard: 'isThumbDown',
						target: 'ZOOM',
						actions: assign({
							currentTs: ({ event }) => (event as any).frame.ts,
						}),
					},
					{
						guard: 'isTrackingOk',
						target: 'ARMED',
						actions: assign({
							currentTs: ({ event }) => (event as any).frame.ts,
						}),
					},
					{
						target: 'DISARMED',
					},
				],
			},
		},
		DOWN_COMMIT: {
			on: {
				FRAME: [
					{
						guard: ({ context, event }) =>
							guards.isPointingUp({ event }) && guards.isCmdWindowOk({ context, event }),
						target: 'DOWN_COMMIT',
						actions: assign({
							lastPosition: ({ event }) => (event as any).frame.position,
							currentTs: ({ event }) => (event as any).frame.ts,
						}),
					},
					{
						target: 'ARMED',
						actions: assign({
							armedFromBaseline: false,
						}),
					},
				],
			},
		},
		DOWN_NAV: {
			on: {
				FRAME: [
					{
						guard: ({ context, event }) =>
							guards.isVictory({ event }) && guards.isCmdWindowOk({ context, event }),
						target: 'DOWN_NAV',
						actions: assign({
							lastPosition: ({ event }) => (event as any).frame.position,
							currentTs: ({ event }) => (event as any).frame.ts,
						}),
					},
					{
						target: 'ARMED',
						actions: assign({
							armedFromBaseline: false,
						}),
					},
				],
			},
		},
		ZOOM: {
			on: {
				FRAME: [
					{
						guard: ({ context, event }) =>
							(guards.isThumbUp({ event }) || guards.isThumbDown({ event })) &&
							guards.isCmdWindowOk({ context, event }),
						target: 'ZOOM',
						actions: assign({
							currentTs: ({ event }) => (event as any).frame.ts,
						}),
					},
					{
						target: 'ARMED',
						actions: assign({
							armedFromBaseline: false,
						}),
					},
				],
			},
		},
	},
});
