/**
 * NATS JetStream HOT Stigmergy Substrate - Contracts
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | CDD Source of Truth
 *
 * PRINCIPLE: We do NOT use EventEmitter. We use the RIGHT architecture.
 * GROUNDED: Context7 NATS.js documentation, 2025-12-30
 *
 * @see https://github.com/nats-io/nats.js
 * @see Section 17 of W3C_POINTER_GESTURE_CONTROL_PLANE_20251230.md
 */

import { z } from 'zod';
import type { FSMAction, SensorFrame, SmoothedFrame } from './schemas.js';

// ============================================================================
// NATS SUBJECT HIERARCHY
// Hard gate boundaries - each subject has Zod validation
// ============================================================================

export const NatsSubjects = {
	// Pipeline stages (JetStream durable)
	pipeline: {
		sensor: (handId: 'left' | 'right') => `hfo.pipeline.sensor.${handId}` as const,
		smooth: (handId: 'left' | 'right') => `hfo.pipeline.smooth.${handId}` as const,
		fsm: (handId: 'left' | 'right') => `hfo.pipeline.fsm.${handId}` as const,
		pointer: 'hfo.pipeline.pointer' as const,
		target: (targetId: string) => `hfo.pipeline.target.${targetId}` as const,
	},

	// KV state keys
	state: {
		cursorPosition: (handId: 'left' | 'right') => `cursor.${handId}.position` as const,
		fsmState: (handId: 'left' | 'right') => `fsm.${handId}.state` as const,
		configSmoother: 'config.smoother' as const,
		configPipeline: 'config.pipeline' as const,
	},

	// AI Swarm coordination
	swarm: {
		signal: (phase: 'hunt' | 'interlock' | 'validate' | 'evolve') =>
			`hfo.swarm.signal.${phase}` as const,
		phase: 'swarm.phase.current' as const,
		agent: (id: string) => `swarm.agent.${id}` as const,
		taskQueue: 'swarm.task.queue' as const,
	},

	// Object store paths
	recordings: {
		metadata: (sessionId: string) => `session/${sessionId}/metadata.json` as const,
		frames: (sessionId: string) => `session/${sessionId}/frames.jsonl` as const,
		events: (sessionId: string) => `session/${sessionId}/events.jsonl` as const,
	},
} as const;

// ============================================================================
// KV STATE SCHEMAS
// Real-time state stored in NATS KV with history
// ============================================================================

export const CursorPositionSchema = z.object({
	x: z.number().min(0).max(1),
	y: z.number().min(0).max(1),
	ts: z.number().nonnegative(),
	screenX: z.number().optional(),
	screenY: z.number().optional(),
});
export type CursorPosition = z.infer<typeof CursorPositionSchema>;

export const FSMStateKVSchema = z.object({
	state: z.enum(['DISARMED', 'ARMING', 'ARMED', 'DOWN_COMMIT', 'DOWN_NAV', 'ZOOM']),
	since: z.number().nonnegative(),
	confidence: z.number().min(0).max(1),
	label: z.enum([
		'Open_Palm',
		'Pointing_Up',
		'Victory',
		'Thumb_Up',
		'Thumb_Down',
		'Closed_Fist',
		'ILoveYou',
		'None',
	] as const),
});
export type FSMStateKV = z.infer<typeof FSMStateKVSchema>;

export const SmootherConfigSchema = z.object({
	type: z.enum(['one-euro', 'rapier', 'hybrid', 'kalman']),
	oneEuro: z
		.object({
			mincutoff: z.number().positive(),
			beta: z.number().nonnegative(),
			dcutoff: z.number().positive(),
		})
		.optional(),
	rapier: z
		.object({
			springStiffness: z.number().positive(),
			damping: z.number().nonnegative(),
			mass: z.number().positive(),
		})
		.optional(),
	blendRatio: z.number().min(0).max(1).optional(),
});
export type SmootherConfig = z.infer<typeof SmootherConfigSchema>;

export const PipelineConfigSchema = z.object({
	enabled: z.boolean(),
	targetFrameRate: z.number().int().positive(),
	predictionMs: z.number().nonnegative(),
	armingDurationMs: z.number().positive(),
	palmConeThreshold: z.number().min(0).max(1),
});
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

// ============================================================================
// STREAM CONFIGURATION
// JetStream stream and consumer settings
// ============================================================================

export const StreamConfigSchema = z.object({
	name: z.literal('HFO_PIPELINE'),
	subjects: z.array(z.string()),
	retention: z.enum(['limits', 'interest', 'workqueue']),
	maxAge: z.number().positive().describe('Max age in nanoseconds'),
	storage: z.enum(['file', 'memory']),
	replicas: z.number().int().min(1).max(5),
});

export const DefaultStreamConfig: z.infer<typeof StreamConfigSchema> = {
	name: 'HFO_PIPELINE',
	subjects: ['hfo.pipeline.>'],
	retention: 'limits',
	maxAge: 24 * 60 * 60 * 1_000_000_000, // 24 hours in nanoseconds
	storage: 'file',
	replicas: 1, // Dev mode, increase for prod
};

export const ConsumerConfigSchema = z.object({
	durableName: z.string(),
	filterSubject: z.string(),
	ackPolicy: z.enum(['none', 'all', 'explicit']),
	deliverPolicy: z.enum(['all', 'last', 'new', 'by_start_sequence', 'by_start_time']),
	maxAckPending: z.number().int().positive(),
	ackWait: z.number().positive().describe('Ack wait in nanoseconds'),
});

// ============================================================================
// STAGE GATE INTERFACE
// Hard gate pattern for pipeline stages
// ============================================================================

export interface StageGateConfig<TIn, TOut> {
	/** Input NATS subject to subscribe */
	inputSubject: string;
	/** Output NATS subject to publish */
	outputSubject: string;
	/** Zod schema for input validation */
	inputSchema: z.ZodType<TIn>;
	/** Zod schema for output validation */
	outputSchema: z.ZodType<TOut>;
	/** Transform function (can be async) */
	transform: (input: TIn) => TOut | Promise<TOut>;
	/** Durable consumer name */
	consumerName: string;
	/** Optional: KV key to update with latest value */
	kvStateKey?: string;
}

// ============================================================================
// SWARM SIGNAL SCHEMA
// AI agent coordination via NATS
// ============================================================================

export const SwarmSignalSchema = z.object({
	ts: z.string().datetime(),
	agentId: z.string(),
	phase: z.enum(['H', 'I', 'V', 'E']),
	port: z.number().int().min(0).max(7),
	msg: z.string(),
	mark: z.number().min(0).max(1),
	pull: z.enum(['upstream', 'downstream', 'lateral']),
	taskId: z.string().optional(),
});
export type SwarmSignal = z.infer<typeof SwarmSignalSchema>;

// ============================================================================
// RECORDING METADATA SCHEMA
// Object store session recordings for ML training
// ============================================================================

export const RecordingMetadataSchema = z.object({
	sessionId: z.string().uuid(),
	startTime: z.string().datetime(),
	endTime: z.string().datetime().optional(),
	frameCount: z.number().int().nonnegative(),
	eventCount: z.number().int().nonnegative(),
	handedness: z.enum(['left', 'right', 'both']),
	gestures: z.array(
		z.enum([
			'Open_Palm',
			'Pointing_Up',
			'Victory',
			'Thumb_Up',
			'Thumb_Down',
			'Closed_Fist',
			'ILoveYou',
			'None',
		] as const),
	),
	smootherConfig: SmootherConfigSchema,
	avgLatencyMs: z.number().nonnegative().optional(),
	avgConfidence: z.number().min(0).max(1).optional(),
});
export type RecordingMetadata = z.infer<typeof RecordingMetadataSchema>;

// ============================================================================
// TYPE GUARDS FOR RUNTIME VALIDATION
// ============================================================================

export function validateSensorFrame(data: unknown): SensorFrame {
	// Import dynamically to avoid circular deps
	const { SensorFrameSchema } = require('./schemas.js');
	return SensorFrameSchema.parse(data);
}

export function validateSmoothedFrame(data: unknown): SmoothedFrame {
	const { SmoothedFrameSchema } = require('./schemas.js');
	return SmoothedFrameSchema.parse(data);
}

export function validateFSMAction(data: unknown): FSMAction {
	const { FSMActionSchema } = require('./schemas.js');
	return FSMActionSchema.parse(data);
}
