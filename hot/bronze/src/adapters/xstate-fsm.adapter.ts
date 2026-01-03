/**
 * XState FSM Adapter
 *
 * Gen87.X3 | Port 3 (DELIVER) | Implements FSMPort
 *
 * EXEMPLAR SOURCE: https://stately.ai/docs/setup
 * Machine design from: W3C_GESTURE_CONTROL_PLANE_SPEC.md Section 4
 *
 * Grounded: Tavily research 2025-12-29
 */
import { type ActorRefFrom, assign, createActor, setup } from 'xstate';
import type { FSMPort } from '../contracts/ports.js';
import {
	type FSMAction,
	FSMActionSchema,
	type FSMState,
	type SmoothedFrame,
} from '../contracts/schemas.js';

// ============================================================================
// FSM TYPES
// ============================================================================

type GestureContext = {
	/** Time when baseline became stable */
	baselineStableAt: number | null;
	/** Whether we entered ARMED from baseline (not from command state) */
	armedFromBaseline: boolean;
	/** Last valid position */
	lastPosition: { x: number; y: number } | null;
	/** Current frame timestamp */
	currentTs: number;
};

type GestureEvent = { type: 'FRAME'; frame: SmoothedFrame } | { type: 'DISARM' };

// ============================================================================
// FSM CONFIGURATION (Exported for boundary testing)
// ============================================================================

export const DEFAULT_ARM_STABLE_MS = 200;
export const DEFAULT_CMD_WINDOW_MS = 500;
export const DEFAULT_MIN_CONFIDENCE = 0.7;

// ============================================================================
// GUARDS
// ============================================================================

export const guards = {
	/** GATE_BASELINE_OK: Open_Palm + palmFacing + conf >= Cmin */
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

	/** GATE_BASELINE_STABLE: Baseline maintained for ARM_STABLE_MS */
	isBaselineStable: ({ context, event }: { context: GestureContext; event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		if (context.baselineStableAt === null) return false;
		return event.frame.ts - context.baselineStableAt >= DEFAULT_ARM_STABLE_MS;
	},

	/** GATE_CMD_WINDOW_OK: Within command window from baseline */
	isCmdWindowOk: ({ context, event }: { context: GestureContext; event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		if (!context.armedFromBaseline) return false;
		if (context.baselineStableAt === null) return false;
		return event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS;
	},

	/** GATE_TRACKING_OK: Hand is being tracked */
	isTrackingOk: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		return event.frame.trackingOk;
	},

	/** GATE_PALM_FACING: Palm facing camera */
	isPalmFacing: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		return event.frame.palmFacing;
	},

	/** Is Pointing_Up gesture (primary click) */
	isPointingUp: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		return event.frame.label === 'Pointing_Up' && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
	},

	/** Is Victory gesture (navigation/pan) */
	isVictory: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		return event.frame.label === 'Victory' && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
	},

	/** Is Thumb_Up/Down gesture (zoom) */
	isZoomGesture: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		return (
			(event.frame.label === 'Thumb_Up' || event.frame.label === 'Thumb_Down') &&
			event.frame.confidence >= DEFAULT_MIN_CONFIDENCE
		);
	},

	/** Is returning to baseline from command state */
	isReturningToBaseline: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		const { frame } = event;
		return frame.trackingOk && frame.palmFacing && frame.label === 'Open_Palm';
	},

	// Inverse guards (XState v5 doesn't have built-in 'not')
	isNotBaselineOk: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return true;
		const { frame } = event;
		return !(
			frame.trackingOk &&
			frame.palmFacing &&
			frame.label === 'Open_Palm' &&
			frame.confidence >= DEFAULT_MIN_CONFIDENCE
		);
	},

	isNotTrackingOk: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return true;
		return !event.frame.trackingOk;
	},

	isNotPalmFacing: ({ event }: { event: GestureEvent }) => {
		if (event.type !== 'FRAME') return true;
		return !event.frame.palmFacing;
	},

	// Compound guards (XState v5 doesn't have built-in 'and')
	isPointingUpInWindow: ({ context, event }: { context: GestureContext; event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		const isPointingUp =
			event.frame.label === 'Pointing_Up' && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
		const isCmdWindowOk =
			context.armedFromBaseline &&
			context.baselineStableAt !== null &&
			event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS;
		return isPointingUp && isCmdWindowOk;
	},

	isVictoryInWindow: ({ context, event }: { context: GestureContext; event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		const isVictory =
			event.frame.label === 'Victory' && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
		const isCmdWindowOk =
			context.armedFromBaseline &&
			context.baselineStableAt !== null &&
			event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS;
		return isVictory && isCmdWindowOk;
	},

	isZoomInWindow: ({ context, event }: { context: GestureContext; event: GestureEvent }) => {
		if (event.type !== 'FRAME') return false;
		const isZoom =
			(event.frame.label === 'Thumb_Up' || event.frame.label === 'Thumb_Down') &&
			event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
		const isCmdWindowOk =
			context.armedFromBaseline &&
			context.baselineStableAt !== null &&
			event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS;
		return isZoom && isCmdWindowOk;
	},
};

// ============================================================================
// ACTIONS (typed for XState v5 setup)
// ============================================================================

// Define actions inline in setup() to get proper types
// This avoids the ActionFunction type mismatch with assign()

// ============================================================================
// STATE MACHINE
// ============================================================================

const gestureMachine = setup({
	types: {
		context: {} as GestureContext,
		events: {} as GestureEvent,
	},
	guards,
	actions: {
		recordBaselineTime: assign({
			baselineStableAt: ({ event }: { event: GestureEvent }) => {
				if (event.type === 'FRAME') return event.frame.ts;
				return null;
			},
		}),

		clearBaselineTime: assign({
			baselineStableAt: () => null,
		}),

		setArmedFromBaseline: assign({
			armedFromBaseline: () => true,
		}),

		clearArmedFromBaseline: assign({
			armedFromBaseline: () => false,
		}),

		updatePosition: assign({
			lastPosition: ({ event }: { event: GestureEvent }) => {
				if (event.type === 'FRAME' && event.frame.position) {
					return { x: event.frame.position.x, y: event.frame.position.y };
				}
				return null;
			},
			currentTs: ({ event }: { event: GestureEvent }) => {
				if (event.type === 'FRAME') return event.frame.ts;
				return 0;
			},
		}),
	},
}).createMachine({
	id: 'gestureFSM',
	initial: 'DISARMED',
	context: {
		baselineStableAt: null,
		armedFromBaseline: false,
		lastPosition: null,
		currentTs: 0,
	},

	states: {
		// System inactive - no pointer events
		DISARMED: {
			on: {
				FRAME: [
					{
						guard: 'isBaselineOk',
						target: 'ARMING',
						actions: ['recordBaselineTime', 'updatePosition'],
					},
					{
						actions: 'updatePosition',
					},
				],
			},
		},

		// Baseline hysteresis - waiting for stable Open_Palm
		ARMING: {
			on: {
				FRAME: [
					{
						guard: 'isNotBaselineOk',
						target: 'DISARMED',
						actions: 'clearBaselineTime',
					},
					{
						guard: 'isBaselineStable',
						target: 'ARMED',
						actions: ['setArmedFromBaseline', 'updatePosition'],
					},
					{
						actions: 'updatePosition',
					},
				],
				DISARM: {
					target: 'DISARMED',
					actions: 'clearBaselineTime',
				},
			},
		},

		// Cursor aim mode - emit pointermove
		ARMED: {
			on: {
				FRAME: [
					// Lost tracking → DISARMED
					{
						guard: 'isNotTrackingOk',
						target: 'DISARMED',
						actions: ['clearBaselineTime', 'clearArmedFromBaseline'],
					},
					// Lost palm facing → DISARMED
					{
						guard: 'isNotPalmFacing',
						target: 'DISARMED',
						actions: ['clearBaselineTime', 'clearArmedFromBaseline'],
					},
					// Pointing_Up + in command window → DOWN_COMMIT
					{
						guard: 'isPointingUpInWindow',
						target: 'DOWN_COMMIT',
						actions: 'updatePosition',
					},
					// Victory + in command window → DOWN_NAV
					{
						guard: 'isVictoryInWindow',
						target: 'DOWN_NAV',
						actions: 'updatePosition',
					},
					// Zoom gesture + in command window → ZOOM
					{
						guard: 'isZoomInWindow',
						target: 'ZOOM',
						actions: 'updatePosition',
					},
					// Stay in ARMED, emit move
					{
						actions: 'updatePosition',
					},
				],
				DISARM: {
					target: 'DISARMED',
					actions: ['clearBaselineTime', 'clearArmedFromBaseline'],
				},
			},
		},

		// Primary click/drag (button=0)
		DOWN_COMMIT: {
			on: {
				FRAME: [
					// Lost tracking → pointercancel → DISARMED
					{
						guard: 'isNotTrackingOk',
						target: 'DISARMED',
						actions: ['clearBaselineTime', 'clearArmedFromBaseline'],
					},
					// Return to baseline → pointerup → ARMED (but not from baseline)
					{
						guard: 'isReturningToBaseline',
						target: 'ARMED',
						actions: ['clearArmedFromBaseline', 'recordBaselineTime', 'updatePosition'],
					},
					// Lost palm facing → pointerup → DISARMED
					{
						guard: 'isNotPalmFacing',
						target: 'DISARMED',
						actions: ['clearBaselineTime', 'clearArmedFromBaseline'],
					},
					// Stay in DOWN_COMMIT, emit move
					{
						actions: 'updatePosition',
					},
				],
				DISARM: {
					target: 'DISARMED',
					actions: ['clearBaselineTime', 'clearArmedFromBaseline'],
				},
			},
		},

		// Middle-click drag (button=1) for pan
		DOWN_NAV: {
			on: {
				FRAME: [
					// Lost tracking → pointercancel → DISARMED
					{
						guard: 'isNotTrackingOk',
						target: 'DISARMED',
						actions: ['clearBaselineTime', 'clearArmedFromBaseline'],
					},
					// Return to baseline → pointerup → ARMED (but not from baseline)
					{
						guard: 'isReturningToBaseline',
						target: 'ARMED',
						actions: ['clearArmedFromBaseline', 'recordBaselineTime', 'updatePosition'],
					},
					// Lost palm facing → pointerup → DISARMED
					{
						guard: 'isNotPalmFacing',
						target: 'DISARMED',
						actions: ['clearBaselineTime', 'clearArmedFromBaseline'],
					},
					// Stay in DOWN_NAV, emit move
					{
						actions: 'updatePosition',
					},
				],
				DISARM: {
					target: 'DISARMED',
					actions: ['clearBaselineTime', 'clearArmedFromBaseline'],
				},
			},
		},

		// Wheel emission for zoom
		ZOOM: {
			on: {
				FRAME: [
					// Lost tracking → DISARMED
					{
						guard: 'isNotTrackingOk',
						target: 'DISARMED',
						actions: ['clearBaselineTime', 'clearArmedFromBaseline'],
					},
					// Return to baseline → ARMED
					{
						guard: 'isReturningToBaseline',
						target: 'ARMED',
						actions: ['clearArmedFromBaseline', 'recordBaselineTime', 'updatePosition'],
					},
					// Stay in ZOOM
					{
						actions: 'updatePosition',
					},
				],
				DISARM: {
					target: 'DISARMED',
					actions: ['clearBaselineTime', 'clearArmedFromBaseline'],
				},
			},
		},
	},
});

// ============================================================================
// FSM ADAPTER
// ============================================================================

type GestureActor = ActorRefFrom<typeof gestureMachine>;

export class XStateFSMAdapter implements FSMPort {
	private actor: GestureActor;
	private previousState: FSMState = 'DISARMED';
	private subscribers: Set<(state: string, action: FSMAction) => void> = new Set();

	constructor() {
		this.actor = createActor(gestureMachine);
		this.actor.start();

		// Subscribe to state changes
		this.actor.subscribe((snapshot) => {
			const newState = snapshot.value as FSMState;
			if (this.subscribers.size > 0) {
				// For subscription callbacks, emit move action with last known position
				const position = snapshot.context.lastPosition ?? { x: 0.5, y: 0.5 };
				const action: FSMAction = { action: 'move', state: newState, x: position.x, y: position.y };
				this.subscribers.forEach((cb) => cb(newState, action));
			}
		});
	}

	process(frame: SmoothedFrame): FSMAction {
		const previousSnapshot = this.actor.getSnapshot();
		this.previousState = previousSnapshot.value as FSMState;

		// Send frame event to machine
		this.actor.send({ type: 'FRAME', frame });

		// Get new state
		const snapshot = this.actor.getSnapshot();
		const newState = snapshot.value as FSMState;

		// Compute action based on state transition (pass current frame for label access)
		const action = this.computeAction(newState, snapshot.context, frame);

		// CDD: Validate output at port boundary
		return FSMActionSchema.parse(action);
	}

	private computeAction(
		newState: FSMState,
		context: GestureContext,
		currentFrame: SmoothedFrame,
	): FSMAction {
		const position = context.lastPosition ?? { x: 0.5, y: 0.5 };
		const previousState = this.previousState;
		const velocity = currentFrame.velocity ?? undefined;
		const prediction = currentFrame.prediction ?? undefined;

		// State transition matrix
		if (newState === 'DISARMED') {
			// If coming from DOWN state, emit cancel
			if (previousState === 'DOWN_COMMIT' || previousState === 'DOWN_NAV') {
				return { action: 'cancel', state: newState };
			}
			return { action: 'none', state: newState };
		}

		if (newState === 'ARMING') {
			return { action: 'none', state: newState };
		}

		if (newState === 'ARMED') {
			// If coming from DOWN state, emit up
			if (previousState === 'DOWN_COMMIT') {
				return {
					action: 'up',
					state: newState,
					x: position.x,
					y: position.y,
					button: 0,
					velocity,
				};
			}
			if (previousState === 'DOWN_NAV') {
				return {
					action: 'up',
					state: newState,
					x: position.x,
					y: position.y,
					button: 1,
					velocity,
				};
			}
			// Normal move
			return {
				action: 'move',
				state: newState,
				x: position.x,
				y: position.y,
				velocity,
				prediction,
			};
		}

		if (newState === 'DOWN_COMMIT') {
			// If just entered, emit down
			if (previousState === 'ARMED') {
				return {
					action: 'down',
					state: newState,
					x: position.x,
					y: position.y,
					button: 0,
					velocity,
				};
			}
			// Continuing drag, emit move
			return {
				action: 'move',
				state: newState,
				x: position.x,
				y: position.y,
				velocity,
				prediction,
			};
		}

		if (newState === 'DOWN_NAV') {
			// If just entered, emit down
			if (previousState === 'ARMED') {
				return {
					action: 'down',
					state: newState,
					x: position.x,
					y: position.y,
					button: 1,
					velocity,
				};
			}
			// Continuing drag, emit move
			return {
				action: 'move',
				state: newState,
				x: position.x,
				y: position.y,
				velocity,
				prediction,
			};
		}

		if (newState === 'ZOOM') {
			// Determine direction from current gesture
			const label = currentFrame.label;
			const deltaY = label === 'Thumb_Up' ? -100 : label === 'Thumb_Down' ? 100 : 0;
			return { action: 'wheel', state: newState, deltaY, ctrl: true };
		}

		return { action: 'none', state: newState };
	}

	getState(): string {
		return this.actor.getSnapshot().value as string;
	}

	getContext(): GestureContext {
		return this.actor.getSnapshot().context;
	}

	disarm(): void {
		this.actor.send({ type: 'DISARM' });
	}

	subscribe(callback: (state: string, action: FSMAction) => void): () => void {
		this.subscribers.add(callback);
		return () => this.subscribers.delete(callback);
	}

	/**
	 * Stop the actor (cleanup)
	 */
	dispose(): void {
		this.actor.stop();
		this.subscribers.clear();
	}
}
