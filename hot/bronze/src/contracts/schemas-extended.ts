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
import { z } from 'zod';
import { SmoothedFrameSchema } from './schemas.js';

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

/**
 * Target definition schema
 */
export const TargetDefinitionSchema = z.object({
	id: z.string(),
	type: TargetTypeSchema,
	element: z.any().optional(), // HTMLElement is hard to validate with Zod in all envs
	selector: z.string().optional(), // CSS selector for DOM targets
	bounds: z
		.object({
			left: z.number(),
			top: z.number(),
			width: z.number(),
			height: z.number(),
		})
		.optional(),
	priority: z.number().int().default(0),
	enabled: z.boolean().default(true),
	natsSubject: z.string().optional(),
});
export type TargetDefinition = z.infer<typeof TargetDefinitionSchema>;

// ============================================================================
// UI SHELL SCHEMAS (Stage 7)
// ============================================================================

/**
 * Layout action schema
 */
export const LayoutActionSchema = z.object({
	type: z.enum([
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
	]),
	tileId: z.string().optional(),
	direction: z.enum(['horizontal', 'vertical']).optional(),
	delta: z.object({ x: z.number(), y: z.number() }).optional(),
	corner: z.enum(['nw', 'ne', 'sw', 'se']).optional(),
});
export type LayoutAction = z.infer<typeof LayoutActionSchema>;

/**
 * Gesture binding schema
 */
export const GestureBindingSchema = z.object({
	gesture: z.enum(['pinch', 'palm', 'fist', 'point', 'victory', 'thumbs-up', 'thumbs-down']),
	modifier: z.enum(['dwell', 'throw-left', 'throw-right', 'throw-up', 'throw-down']).optional(),
	action: LayoutActionSchema.shape.type,
	params: LayoutActionSchema.partial().optional(),
});
export type GestureBinding = z.infer<typeof GestureBindingSchema>;

// ============================================================================
// PIPELINE STATISTICS
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
