/**
 * CloudEvents Bridge - PURE PRIMITIVE
 *
 * Gen87.X3 | cold/silver/primitives | Stage 1 (BRIDGE)
 *
 * EXEMPLAR: CloudEvents 1.0 Specification
 * https://cloudevents.io/
 *
 * This primitive wraps raw gesture frames in CloudEvents 1.0 envelopes,
 * adding observability, traceability, and interoperability.
 *
 * POLICY: All inter-stage communication uses CloudEvents format.
 */

/**
 * W3C Trace Context traceparent format
 * Format: 00-{trace-id}-{parent-id}-{flags}
 */
export interface W3CTraceContext {
	traceparent: string;
	tracestate?: string;
}

/**
 * CloudEvents 1.0 envelope structure
 * All fields are per CloudEvents spec
 */
export interface CloudEvent<T = unknown> {
	// REQUIRED attributes
	specversion: '1.0';
	id: string;
	source: string;
	type: string;

	// OPTIONAL attributes
	datacontenttype?: string;
	dataschema?: string;
	subject?: string;
	time?: string;

	// Extension: HFO-specific
	hfoport?: number;
	hfohive?: 'H' | 'I' | 'V' | 'E' | 'X';
	hfogen?: number;

	// Extension: W3C Trace Context
	traceparent?: string;
	tracestate?: string;

	// Data payload
	data?: T;
}

/**
 * Configuration for the CloudEvents bridge
 */
export interface CloudEventsBridgeConfig {
	source: string;
	typePrefix: string;
	hfoPort?: number;
	hfoHive?: 'H' | 'I' | 'V' | 'E' | 'X';
	hfoGen?: number;
}

export const DEFAULT_BRIDGE_CONFIG: CloudEventsBridgeConfig = {
	source: '/hfo/gen87/gesture-pipeline',
	typePrefix: 'hfo.gesture',
	hfoPort: 1,
	hfoHive: 'I',
	hfoGen: 87,
};

/**
 * Generate a random UUID v4
 * Pure function - deterministic with seed
 */
export function generateEventId(): string {
	// Use crypto if available, fallback to Math.random
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback UUID v4 pattern
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Generate W3C Trace Context traceparent
 * Format: 00-{trace-id}-{parent-id}-{flags}
 */
export function generateTraceparent(traceId?: string, parentId?: string): string {
	const version = '00';
	const trace = traceId || generateHexId(32);
	const parent = parentId || generateHexId(16);
	const flags = '01'; // sampled
	return `${version}-${trace}-${parent}-${flags}`;
}

/**
 * Generate random hex string of specified length
 */
export function generateHexId(length: number): string {
	const chars = '0123456789abcdef';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * 16)];
	}
	return result;
}

/**
 * Parse a traceparent string into components
 * Returns null if invalid format
 */
export function parseTraceparent(
	traceparent: string
): { version: string; traceId: string; parentId: string; flags: string } | null {
	const parts = traceparent.split('-');
	if (parts.length !== 4) {
		return null;
	}
	// Non-null assertion is safe because we verified length === 4
	const version = parts[0]!;
	const traceId = parts[1]!;
	const parentId = parts[2]!;
	const flags = parts[3]!;

	// Validate format
	if (version !== '00' || traceId.length !== 32 || parentId.length !== 16 || flags.length !== 2) {
		return null;
	}

	// Validate hex
	const hexRegex = /^[0-9a-f]+$/i;
	if (!hexRegex.test(traceId) || !hexRegex.test(parentId) || !hexRegex.test(flags)) {
		return null;
	}

	return { version, traceId, parentId, flags };
}

/**
 * Propagate trace context to create a child span
 * Uses same traceId, generates new parentId
 */
export function propagateTrace(parent: W3CTraceContext): W3CTraceContext {
	const parsed = parseTraceparent(parent.traceparent);
	if (!parsed) {
		// Invalid parent, create new trace
		return { traceparent: generateTraceparent() };
	}

	// Same trace, new parent span
	const result: W3CTraceContext = {
		traceparent: generateTraceparent(parsed.traceId),
	};

	// Only include tracestate if parent has it
	if (parent.tracestate !== undefined) {
		result.tracestate = parent.tracestate;
	}

	return result;
}

/**
 * Wrap a data payload in a CloudEvents 1.0 envelope
 * This is the core BRIDGE function
 */
export function wrapAsCloudEvent<T>(
	data: T,
	eventType: string,
	config: CloudEventsBridgeConfig = DEFAULT_BRIDGE_CONFIG,
	trace?: W3CTraceContext
): CloudEvent<T> {
	const event: CloudEvent<T> = {
		specversion: '1.0',
		id: generateEventId(),
		source: config.source,
		type: `${config.typePrefix}.${eventType}`,
		datacontenttype: 'application/json',
		time: new Date().toISOString(),
		data,
	};

	// Add HFO extensions
	if (config.hfoPort !== undefined) {
		event.hfoport = config.hfoPort;
	}
	if (config.hfoHive !== undefined) {
		event.hfohive = config.hfoHive;
	}
	if (config.hfoGen !== undefined) {
		event.hfogen = config.hfoGen;
	}

	// Add trace context
	if (trace) {
		event.traceparent = trace.traceparent;
		if (trace.tracestate) {
			event.tracestate = trace.tracestate;
		}
	}

	return event;
}

/**
 * Validate a CloudEvent envelope structure
 * Returns array of validation errors (empty if valid)
 */
export function validateCloudEvent(event: unknown): string[] {
	const errors: string[] = [];

	if (!event || typeof event !== 'object') {
		return ['Event must be an object'];
	}

	const e = event as Record<string, unknown>;

	// Required attributes
	if (e.specversion !== '1.0') {
		errors.push('specversion must be "1.0"');
	}
	if (typeof e.id !== 'string' || e.id.length === 0) {
		errors.push('id must be a non-empty string');
	}
	if (typeof e.source !== 'string' || e.source.length === 0) {
		errors.push('source must be a non-empty string');
	}
	if (typeof e.type !== 'string' || e.type.length === 0) {
		errors.push('type must be a non-empty string');
	}

	// Optional time must be valid ISO8601 if present
	if (e.time !== undefined) {
		if (typeof e.time !== 'string' || Number.isNaN(Date.parse(e.time))) {
			errors.push('time must be a valid ISO8601 timestamp');
		}
	}

	// Validate traceparent if present
	if (e.traceparent !== undefined) {
		if (typeof e.traceparent !== 'string' || !parseTraceparent(e.traceparent)) {
			errors.push('traceparent must be valid W3C format');
		}
	}

	return errors;
}

/**
 * Extract data from a CloudEvent envelope
 * Returns null if validation fails
 */
export function unwrapCloudEvent<T>(event: CloudEvent<T>): T | null {
	const errors = validateCloudEvent(event);
	if (errors.length > 0) {
		return null;
	}
	return event.data ?? null;
}

/**
 * Check if an object is a valid CloudEvent
 */
export function isCloudEvent(event: unknown): event is CloudEvent {
	return validateCloudEvent(event).length === 0;
}
