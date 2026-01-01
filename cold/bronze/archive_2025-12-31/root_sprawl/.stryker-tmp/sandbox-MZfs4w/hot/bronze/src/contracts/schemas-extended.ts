/**
 * Extended Schemas - PredictedFrame, LayoutAction, VacuoleEnvelope Zod
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Web Weaver (Port 1) + Kraken Keeper (Port 6)
 *
 * These schemas extend the base schemas.ts with:
 * - PredictedFrame (Stage 3 output)
 * - LayoutAction (Stage 7 output)
 * - GestureBinding (UI Shell configuration)
 * - Vacuole-typed versions of all stage outputs
 */
// @ts-nocheck

import { z } from 'zod';
import { NormalizedLandmarkSchema, PointerEventOutSchema, SmoothedFrameSchema } from './schemas.js';

// ============================================================================
// PREDICTOR SCHEMAS (Stage 3)
// ============================================================================

/**
 * 3D position with z-axis (for depth-aware gestures)
 */
export const Position3DSchema = z.object({
	x: z.number(),
	y: z.number(),
	z: z.number(),
});
export type Position3D = z.infer<typeof Position3DSchema>;

/**
 * 3D velocity
 */
export const Velocity3DSchema = z.object({
	x: z.number(),
	y: z.number(),
	z: z.number(),
});
export type Velocity3D = z.infer<typeof Velocity3DSchema>;

/**
 * Predicted position with confidence and lookahead info
 */
export const PredictionSchema = z.object({
	x: z.number(),
	y: z.number(),
	z: z.number(),
	velocity: Velocity3DSchema,
	confidence: z.number().min(0).max(1),
	lookAheadMs: z.number().positive(),
});
export type Prediction = z.infer<typeof PredictionSchema>;

/**
 * PredictedFrame - Output of Stage 3 (Predictor)
 *
 * Contains both current smoothed frame and predicted future position.
 * @source Kalman Filter (1960), Rapier Physics, Spring-Damper models
 */
export const PredictedFrameSchema = z.object({
	current: SmoothedFrameSchema,
	predicted: PredictionSchema,
});
export type PredictedFrame = z.infer<typeof PredictedFrameSchema>;

/**
 * Predictor configuration schema
 */
export const PredictorConfigSchema = z.object({
	algorithm: z.enum(['kalman', 'rapier', 'spring-damper', 'none']),
	lookAheadMs: z.number().positive().default(16),
	params: z
		.object({
			// Kalman
			processNoise: z.number().positive().optional(),
			measurementNoise: z.number().positive().optional(),
			// Spring-damper
			mass: z.number().positive().optional(),
			stiffness: z.number().positive().optional(),
			damping: z.number().nonnegative().optional(),
			// Rapier
			gravity: z.object({ x: z.number(), y: z.number() }).optional(),
		})
		.optional(),
});
export type PredictorConfig = z.infer<typeof PredictorConfigSchema>;

// ============================================================================
// TARGET ROUTER SCHEMAS (Stage 6)
// ============================================================================

/**
 * Target type enumeration
 */
export const TargetTypeSchema = z.enum([
	'dom',
	'canvas',
	'iframe',
	'golden-layout',
	'nats',
	'webxr',
]);
export type TargetType = z.infer<typeof TargetTypeSchema>;

/**
 * Target definition for routing
 */
export const TargetDefinitionSchema = z.object({
	id: z.string(),
	type: TargetTypeSchema,
	element: z.any().optional(), // HTMLElement or string selector
	bounds: z
		.object({
			x: z.number(),
			y: z.number(),
			width: z.number(),
			height: z.number(),
		})
		.optional(),
	priority: z.number().int().default(0),
	enabled: z.boolean().default(true),
	natsSubject: z.string().optional(),
});
export type TargetDefinition = z.infer<typeof TargetDefinitionSchema>;

/**
 * Routing result - which targets received the event
 */
export const RoutingResultSchema = z.object({
	event: PointerEventOutSchema,
	targets: z.array(z.string()),
	timestamp: z.number(),
});
export type RoutingResult = z.infer<typeof RoutingResultSchema>;

// ============================================================================
// UI SHELL SCHEMAS (Stage 7)
// ============================================================================

/**
 * Layout action types
 */
export const LayoutActionTypeSchema = z.enum([
	'focus',
	'split',
	'close',
	'maximize',
	'minimize',
	'move',
	'resize',
	'drag-start',
	'drag-move',
	'drag-end',
]);
export type LayoutActionType = z.infer<typeof LayoutActionTypeSchema>;

/**
 * Layout action - output of UI Shell processing
 */
export const LayoutActionSchema = z.object({
	type: LayoutActionTypeSchema,
	tileId: z.string().optional(),
	direction: z.enum(['horizontal', 'vertical']).optional(),
	delta: z.object({ x: z.number(), y: z.number() }).optional(),
	corner: z.enum(['nw', 'ne', 'sw', 'se']).optional(),
	timestamp: z.number().optional(),
});
export type LayoutAction = z.infer<typeof LayoutActionSchema>;

/**
 * Gesture types for binding
 */
export const GestureTypeSchema = z.enum([
	'pinch',
	'palm',
	'fist',
	'point',
	'victory',
	'thumbs-up',
	'thumbs-down',
]);
export type GestureType = z.infer<typeof GestureTypeSchema>;

/**
 * Gesture modifier for binding
 */
export const GestureModifierSchema = z.enum([
	'dwell',
	'throw-left',
	'throw-right',
	'throw-up',
	'throw-down',
]);
export type GestureModifier = z.infer<typeof GestureModifierSchema>;

/**
 * Gesture binding - maps gesture to action
 */
export const GestureBindingSchema = z.object({
	gesture: GestureTypeSchema,
	modifier: GestureModifierSchema.optional(),
	action: LayoutActionTypeSchema,
	params: LayoutActionSchema.partial().optional(),
});
export type GestureBinding = z.infer<typeof GestureBindingSchema>;

/**
 * Default gesture bindings for UI Shell
 */
export const DEFAULT_GESTURE_BINDINGS: GestureBinding[] = [
	{ gesture: 'pinch', action: 'focus' },
	{ gesture: 'pinch', modifier: 'throw-left', action: 'split', params: { direction: 'vertical' } },
	{ gesture: 'pinch', modifier: 'throw-right', action: 'split', params: { direction: 'vertical' } },
	{ gesture: 'pinch', modifier: 'throw-up', action: 'split', params: { direction: 'horizontal' } },
	{ gesture: 'fist', action: 'close' },
	{ gesture: 'palm', action: 'maximize' },
	{ gesture: 'victory', action: 'minimize' },
	{ gesture: 'point', modifier: 'dwell', action: 'drag-start' },
];

// ============================================================================
// PIPELINE STATISTICS SCHEMA
// ============================================================================

/**
 * Pipeline performance statistics
 */
export const PipelineStatsSchema = z.object({
	framesProcessed: z.number().int().nonnegative(),
	averageLatencyMs: z.number().nonnegative(),
	droppedFrames: z.number().int().nonnegative(),
	errorsCount: z.number().int().nonnegative(),
	stageLatencies: z.object({
		sense: z.number().nonnegative(),
		smooth: z.number().nonnegative(),
		predict: z.number().nonnegative(),
		fsm: z.number().nonnegative(),
		emit: z.number().nonnegative(),
		target: z.number().nonnegative(),
		ui: z.number().nonnegative(),
	}),
});
export type PipelineStats = z.infer<typeof PipelineStatsSchema>;

// ============================================================================
// W3C POINTER EVENTS LEVEL 3 EXTENDED (for gesture-specific properties)
// ============================================================================

/**
 * Extended W3C Pointer Event with HFO gesture extensions
 * @source https://www.w3.org/TR/pointerevents3/
 */
export const PointerEventOutExtendedSchema = z.object({
	// === W3C Pointer Events Level 3 Required ===
	type: z.enum([
		'pointerdown',
		'pointermove',
		'pointerup',
		'pointercancel',
		'pointerenter',
		'pointerleave',
		'pointerover',
		'pointerout',
		'gotpointercapture',
		'lostpointercapture',
	]),
	pointerId: z.number().int().nonnegative(),
	pointerType: z.enum(['mouse', 'pen', 'touch', 'gesture']),

	// === Coordinates ===
	clientX: z.number(),
	clientY: z.number(),
	screenX: z.number(),
	screenY: z.number(),
	pageX: z.number(),
	pageY: z.number(),
	offsetX: z.number().optional(),
	offsetY: z.number().optional(),

	// === Pressure/Geometry ===
	pressure: z.number().min(0).max(1),
	tangentialPressure: z.number().min(-1).max(1).default(0),
	width: z.number().positive().default(23),
	height: z.number().positive().default(23),

	// === Tilt ===
	tiltX: z.number().min(-90).max(90).default(0),
	tiltY: z.number().min(-90).max(90).default(0),
	twist: z.number().min(0).max(359).default(0),
	altitudeAngle: z
		.number()
		.min(0)
		.max(Math.PI / 2)
		.optional(),
	azimuthAngle: z
		.number()
		.min(0)
		.max(2 * Math.PI)
		.optional(),

	// === State ===
	isPrimary: z.boolean(),
	buttons: z.number().int().nonnegative(),
	button: z.number().int().optional(),

	// === HFO Extensions (namespaced) ===
	hfo: z
		.object({
			handedness: z.enum(['Left', 'Right']),
			confidence: z.number().min(0).max(1),
			gesture: GestureTypeSchema.optional(),
			z: z.number(), // Depth coordinate
			lookAheadMs: z.number().optional(),
			landmarks: z.array(NormalizedLandmarkSchema).length(21).optional(),
			fsmState: z.string().optional(),
			pipelineLatencyMs: z.number().optional(),
		})
		.optional(),
});
export type PointerEventOutExtended = z.infer<typeof PointerEventOutExtendedSchema>;

// ============================================================================
// ADAPTER METADATA SCHEMA (for registry validation)
// ============================================================================

/**
 * Adapter metadata schema
 */
export const AdapterMetadataSchema = z.object({
	id: z.string(),
	name: z.string(),
	version: z.string(),
	description: z.string(),
	trl: z.number().int().min(1).max(9),
	source: z.string(),
	citation: z.string().optional(),
	requiredConfig: z.array(z.string()).optional(),
	browser: z
		.object({
			chrome: z.string().optional(),
			firefox: z.string().optional(),
			safari: z.string().optional(),
			edge: z.string().optional(),
		})
		.optional(),
});
export type AdapterMetadata = z.infer<typeof AdapterMetadataSchema>;

// ============================================================================
// RE-EXPORT BASE SCHEMAS (for convenience)
// ============================================================================

export {
	FSMActionSchema,
	FSMStates,
	GestureLabels,
	NormalizedLandmarkSchema,
	PointerEventOutSchema,
	SensorFrameSchema,
	SmoothedFrameSchema,
	VideoFrameSchema,
} from './schemas.js';

export type {
	FSMAction,
	FSMState,
	GestureLabel,
	NormalizedLandmark,
	PointerEventOut,
	SensorFrame,
	SmoothedFrame,
	VideoFrame,
} from './schemas.js';
