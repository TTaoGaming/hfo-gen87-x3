/**
 * Vacuole Envelope - CloudEvents Wrapper for Polymorphic Pipeline
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Web Weaver (Port 1) + Kraken Keeper (Port 6)
 *
 * The VACUOLE PATTERN:
 * 1. ENVELOPE: Wrap any payload in a CloudEvents-compliant envelope
 * 2. TRANSFORM: Each pipeline stage unwraps, processes, re-wraps
 * 3. ASSIMILATE: Envelope contains routing for NATS/blackboard stigmergy
 *
 * @source CloudEvents 1.0 - https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
 * @source W3C Trace Context - https://www.w3.org/TR/trace-context/
 */
import { z } from 'zod';

// ============================================================================
// W3C TRACE CONTEXT (for distributed tracing)
// @source https://www.w3.org/TR/trace-context/
// ============================================================================

/**
 * W3C Traceparent format: {version}-{trace-id}-{parent-id}-{trace-flags}
 * Example: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
 */
export const TraceparentSchema = z
	.string()
	.regex(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/, 'Invalid W3C traceparent format');
export type Traceparent = z.infer<typeof TraceparentSchema>;

/**
 * Generate a new W3C traceparent
 */
export function generateTraceparent(): Traceparent {
	const traceId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
	const parentId = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
	return `00-${traceId}-${parentId}-01` as Traceparent;
}

/**
 * Propagate trace context (creates child span)
 */
export function propagateTraceparent(parent: Traceparent): Traceparent {
	const [version, traceId, _parentId, flags] = parent.split('-');
	const newParentId = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
	return `${version}-${traceId}-${newParentId}-${flags}` as Traceparent;
}

// ============================================================================
// CLOUDEVENTS 1.0 ENVELOPE
// @source https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
// ============================================================================

/**
 * CloudEvents 1.0 base envelope (required fields)
 */
export const CloudEventsBaseSchema = z.object({
	// REQUIRED by CloudEvents 1.0
	specversion: z.literal('1.0'),
	id: z.string().uuid(),
	source: z.string().url().or(z.string().startsWith('/hfo/')),
	type: z.string().min(1),

	// OPTIONAL but recommended
	time: z.string().datetime().optional(),
	subject: z.string().optional(),
	datacontenttype: z.literal('application/json').optional(),
});

// ============================================================================
// HFO EXTENSIONS (namespaced under "hfo*")
// ============================================================================

/**
 * HFO-specific CloudEvents extensions
 * MUST be prefixed with "hfo" per CloudEvents extension naming
 */
export const HFOExtensionsSchema = z.object({
	/** HFO Generation number (85+) */
	hfogen: z.number().int().min(85),

	/** HIVE phase: H(unt), I(nterlock), V(alidate), E(volve), X(exception) */
	hfohive: z.enum(['H', 'I', 'V', 'E', 'X']),

	/** Port number (0-7) */
	hfoport: z.number().int().min(0).max(7),

	/** Pipeline stage (1-7) for W3C gesture pipeline */
	hfostage: z.number().int().min(1).max(7).optional(),

	/** Mark (confidence/priority) 0.0-1.0 */
	hfomark: z.number().min(0).max(1).optional(),

	/** Pull direction for stigmergy */
	hfopull: z.enum(['upstream', 'downstream', 'lateral']).optional(),

	/** NATS subject for routing */
	hfonats: z.string().optional(),
});
export type HFOExtensions = z.infer<typeof HFOExtensionsSchema>;

// ============================================================================
// VACUOLE ENVELOPE (CloudEvents + HFO + Trace + Payload)
// ============================================================================

/**
 * Complete Vacuole Envelope - wraps any pipeline payload
 *
 * Usage:
 * ```typescript
 * const envelope = wrapInVacuole(sensorFrame, {
 *   type: 'hfo.w3c.gesture.sense',
 *   hfogen: 87,
 *   hfohive: 'V',
 *   hfoport: 0,
 *   hfostage: 1
 * });
 * ```
 */
export const VacuoleEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	CloudEventsBaseSchema.extend({
		// W3C Trace Context
		traceparent: TraceparentSchema,
		tracestate: z.string().optional(),

		// HFO Extensions
		...HFOExtensionsSchema.shape,

		// Payload
		data: dataSchema,
	});

/**
 * Generic Vacuole Envelope type
 */
export type VacuoleEnvelope<T> = z.infer<typeof CloudEventsBaseSchema> & {
	traceparent: Traceparent;
	tracestate?: string;
	data: T;
} & HFOExtensions;

// ============================================================================
// VACUOLE FACTORY FUNCTIONS
// ============================================================================

export interface VacuoleOptions {
	/** CloudEvents type (e.g., "hfo.w3c.gesture.sense") */
	type: string;
	/** HFO generation */
	hfogen: number;
	/** HIVE phase */
	hfohive: 'H' | 'I' | 'V' | 'E' | 'X';
	/** Port number */
	hfoport: number;
	/** Pipeline stage (optional) */
	hfostage?: number;
	/** Parent traceparent for propagation (optional) */
	parentTrace?: Traceparent;
	/** NATS subject (optional) */
	hfonats?: string;
	/** Mark/confidence (optional) */
	hfomark?: number;
	/** Pull direction (optional) */
	hfopull?: 'upstream' | 'downstream' | 'lateral';
}

/**
 * Wrap any payload in a Vacuole Envelope
 *
 * @param data - The payload to wrap
 * @param options - Envelope configuration
 * @returns VacuoleEnvelope wrapping the data
 *
 * @example
 * ```typescript
 * const sensorEnvelope = wrapInVacuole(sensorFrame, {
 *   type: 'hfo.w3c.gesture.sense',
 *   hfogen: 87,
 *   hfohive: 'V',
 *   hfoport: 0,
 *   hfostage: 1
 * });
 * ```
 */
export function wrapInVacuole<T>(data: T, options: VacuoleOptions): VacuoleEnvelope<T> {
	const traceparent = options.parentTrace ? propagateTraceparent(options.parentTrace) : generateTraceparent();

	return {
		// CloudEvents required
		specversion: '1.0',
		id: crypto.randomUUID(),
		source: `/hfo/gen${options.hfogen}/port${options.hfoport}`,
		type: options.type,

		// CloudEvents optional
		time: new Date().toISOString(),
		datacontenttype: 'application/json',

		// W3C Trace
		traceparent,

		// HFO Extensions
		hfogen: options.hfogen,
		hfohive: options.hfohive,
		hfoport: options.hfoport,
		hfostage: options.hfostage,
		hfomark: options.hfomark ?? 1.0,
		hfopull: options.hfopull ?? 'downstream',
		hfonats: options.hfonats,

		// Payload
		data,
	};
}

/**
 * Unwrap a Vacuole Envelope to get the payload
 */
export function unwrapVacuole<T>(envelope: VacuoleEnvelope<T>): T {
	return envelope.data;
}

/**
 * Propagate envelope to next stage (preserves trace, updates stage)
 */
export function propagateVacuole<T, U>(
	source: VacuoleEnvelope<T>,
	newData: U,
	newStage: number,
	newPort: number
): VacuoleEnvelope<U> {
	return wrapInVacuole(newData, {
		type: source.type.replace(/stage\d/, `stage${newStage}`),
		hfogen: source.hfogen,
		hfohive: source.hfohive,
		hfoport: newPort,
		hfostage: newStage,
		parentTrace: source.traceparent,
		hfonats: source.hfonats,
		hfomark: source.hfomark,
		hfopull: source.hfopull,
	});
}

// ============================================================================
// PIPELINE STAGE TYPES (for W3C Gesture Pipeline)
// ============================================================================

/** CloudEvents types for each pipeline stage */
export const PIPELINE_EVENT_TYPES = {
	SENSE: 'hfo.w3c.gesture.stage1.sense',
	SMOOTH: 'hfo.w3c.gesture.stage2.smooth',
	PREDICT: 'hfo.w3c.gesture.stage3.predict',
	FSM: 'hfo.w3c.gesture.stage4.fsm',
	EMIT: 'hfo.w3c.gesture.stage5.emit',
	TARGET: 'hfo.w3c.gesture.stage6.target',
	UI: 'hfo.w3c.gesture.stage7.ui',
} as const;

/** NATS subjects for pipeline routing */
export const PIPELINE_NATS_SUBJECTS = {
	SENSE: 'hfo.w3c.gesture.sense',
	SMOOTH: 'hfo.w3c.gesture.smooth',
	PREDICT: 'hfo.w3c.gesture.predict',
	FSM: 'hfo.w3c.gesture.fsm',
	EMIT: 'hfo.w3c.gesture.emit',
	TARGET: 'hfo.w3c.gesture.target',
	UI: 'hfo.w3c.gesture.ui',
} as const;
