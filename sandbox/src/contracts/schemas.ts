/**
 * W3C Gesture Control Plane - Zod Contract Schemas
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | CDD Source of Truth
 *
 * PRINCIPLE: All port types derive from these schemas via z.infer<T>
 * Grounded: Tavily research 2025-12-29
 */
import { z } from 'zod';

// ============================================================================
// GESTURE LABELS (MediaPipe built-in recognition)
// Source: https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
// ============================================================================

export const GestureLabels = [
	'Open_Palm', // Baseline / arming gesture
	'Pointing_Up', // Commit action (click/drag)
	'Victory', // Navigation action (pan/scroll)
	'Thumb_Up', // Zoom in
	'Thumb_Down', // Zoom out
	'Closed_Fist', // Alternative commit
	'ILoveYou', // Optional: tool switch
	'None', // No gesture detected
] as const;

export type GestureLabel = (typeof GestureLabels)[number];

// ============================================================================
// SENSOR PORT SCHEMAS (Port 0 - SENSE)
// Input: VideoFrame metadata | Output: SensorFrame
// ============================================================================

/** Video frame metadata - what the sensor receives */
export const VideoFrameSchema = z.object({
	timestamp: z.number().nonnegative().describe('Performance.now() in ms'),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
});
export type VideoFrame = z.infer<typeof VideoFrameSchema>;

/** Normalized 2D landmark (0-1 range) */
export const NormalizedLandmarkSchema = z.object({
	x: z.number().min(0).max(1),
	y: z.number().min(0).max(1),
	z: z.number(), // depth relative to wrist
	visibility: z.number().min(0).max(1).nullish(), // Allow null or undefined
});
export type NormalizedLandmark = z.infer<typeof NormalizedLandmarkSchema>;

/** Sensor output - raw gesture detection result */
export const SensorFrameSchema = z.object({
	ts: z.number().nonnegative().describe('Timestamp in ms'),
	handId: z.enum(['left', 'right', 'none']),
	trackingOk: z.boolean(),
	palmFacing: z.boolean(),
	label: z.enum(GestureLabels),
	confidence: z.number().min(0).max(1),
	indexTip: NormalizedLandmarkSchema.nullable(),
	landmarks: z.array(NormalizedLandmarkSchema).length(21).nullable(),
});
export type SensorFrame = z.infer<typeof SensorFrameSchema>;

// ============================================================================
// SMOOTHER PORT SCHEMAS (Port 2 - SHAPE)
// Input: SensorFrame | Output: SmoothedFrame
// Source: 1€ Filter - https://gery.casiez.net/1euro/
// ============================================================================

/** Smoothed frame with filtered position and velocity estimate */
export const SmoothedFrameSchema = z.object({
	ts: z.number().nonnegative(),
	handId: z.enum(['left', 'right', 'none']),
	trackingOk: z.boolean(),
	palmFacing: z.boolean(),
	label: z.enum(GestureLabels),
	confidence: z.number().min(0).max(1),

	/** Filtered position (0-1 normalized) */
	position: z
		.object({
			x: z.number().min(0).max(1),
			y: z.number().min(0).max(1),
		})
		.nullable(),

	/** Estimated velocity (units/second) */
	velocity: z
		.object({
			x: z.number(),
			y: z.number(),
		})
		.nullable(),

	/** Predicted position for next frame (latency compensation) */
	prediction: z
		.object({
			x: z.number().min(0).max(1),
			y: z.number().min(0).max(1),
		})
		.nullable(),
});
export type SmoothedFrame = z.infer<typeof SmoothedFrameSchema>;

// ============================================================================
// FSM PORT SCHEMAS (Port 3 - DELIVER)
// Input: SmoothedFrame | Output: FSMAction
// Source: XState v5 - https://stately.ai/docs/setup
// ============================================================================

/** FSM states matching spec 4.2 */
export const FSMStates = [
	'DISARMED', // System inactive
	'ARMING', // Baseline hysteresis
	'ARMED', // Cursor aim mode
	'DOWN_COMMIT', // Primary click/drag (button=0)
	'DOWN_NAV', // Middle-click drag (button=1)
	'ZOOM', // Wheel emission
] as const;
export type FSMState = (typeof FSMStates)[number];

/** FSM action output - what pointer event to emit */
export const FSMActionSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal('none'),
		state: z.enum(FSMStates),
	}),
	z.object({
		action: z.literal('move'),
		state: z.enum(FSMStates),
		x: z.number(),
		y: z.number(),
	}),
	z.object({
		action: z.literal('down'),
		state: z.enum(FSMStates),
		x: z.number(),
		y: z.number(),
		button: z.union([z.literal(0), z.literal(1)]),
	}),
	z.object({
		action: z.literal('up'),
		state: z.enum(FSMStates),
		x: z.number(),
		y: z.number(),
		button: z.union([z.literal(0), z.literal(1)]),
	}),
	z.object({
		action: z.literal('cancel'),
		state: z.enum(FSMStates),
	}),
	z.object({
		action: z.literal('wheel'),
		state: z.enum(FSMStates),
		deltaY: z.number(),
		ctrl: z.boolean().nullish(), // Allow null or undefined
	}),
]);
export type FSMAction = z.infer<typeof FSMActionSchema>;

// ============================================================================
// EMITTER PORT SCHEMAS (Port 5 - DEFEND)
// Input: FSMAction | Output: PointerEventOut
// Source: W3C Pointer Events - https://www.w3.org/TR/pointerevents/
// ============================================================================

export const PointerEventOutSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('pointermove'),
		pointerId: z.number().int().nonnegative(),
		clientX: z.number(),
		clientY: z.number(),
		pointerType: z.enum(['mouse', 'pen', 'touch']),
		pressure: z.number().min(0).max(1),
		isPrimary: z.boolean(),
	}),
	z.object({
		type: z.literal('pointerdown'),
		pointerId: z.number().int().nonnegative(),
		clientX: z.number(),
		clientY: z.number(),
		pointerType: z.enum(['mouse', 'pen', 'touch']),
		button: z.number().int().min(0).max(2),
		buttons: z.number().int().nonnegative(),
		pressure: z.number().min(0).max(1),
		isPrimary: z.boolean(),
	}),
	z.object({
		type: z.literal('pointerup'),
		pointerId: z.number().int().nonnegative(),
		clientX: z.number(),
		clientY: z.number(),
		pointerType: z.enum(['mouse', 'pen', 'touch']),
		button: z.number().int().min(0).max(2),
		buttons: z.number().int().nonnegative(),
		pressure: z.number().min(0).max(1),
		isPrimary: z.boolean(),
	}),
	z.object({
		type: z.literal('pointercancel'),
		pointerId: z.number().int().nonnegative(),
		pointerType: z.enum(['mouse', 'pen', 'touch']),
	}),
	z.object({
		type: z.literal('wheel'),
		deltaY: z.number(),
		deltaMode: z.number().int(),
		ctrlKey: z.boolean(),
		clientX: z.number(),
		clientY: z.number(),
	}),
]);
export type PointerEventOut = z.infer<typeof PointerEventOutSchema>;

// ============================================================================
// ADAPTER PORT SCHEMAS (Target injection)
// Input: PointerEventOut | Output: void (side effect)
// ============================================================================

export const AdapterTargetSchema = z.object({
	type: z.enum(['canvas', 'element', 'iframe', 'document']),
	selector: z.string().optional(),
	bounds: z.object({
		width: z.number().positive(),
		height: z.number().positive(),
		left: z.number(),
		top: z.number(),
	}),
});
export type AdapterTarget = z.infer<typeof AdapterTargetSchema>;

// ============================================================================
// PIPELINE CONFIG
// ============================================================================

export const PipelineConfigSchema = z.object({
	/** 1€ Filter parameters */
	filter: z.object({
		mincutoff: z.number().positive().default(1.0),
		beta: z.number().nonnegative().default(0.007),
		dcutoff: z.number().positive().default(1.0),
	}),

	/** FSM timing parameters */
	fsm: z.object({
		armStableMs: z.number().positive().default(200),
		cmdWindowMs: z.number().positive().default(500),
		minConfidence: z.number().min(0).max(1).default(0.7),
	}),

	/** Pointer ID for synthetic events */
	pointerId: z.number().int().nonnegative().default(1),

	/** Pointer type to simulate */
	pointerType: z.enum(['mouse', 'pen', 'touch']).default('touch'),
});
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;
