/**
 * W3C Trace Context for HIVE/8 Cycles
 * Enables end-to-end traceability across H→I→V→E phases
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Port 1 (Web Weaver)
 *
 * @source Gen85: src/shared/trace-context.ts
 * @format W3C Trace Context: https://www.w3.org/TR/trace-context/
 */

export interface TraceContext {
	traceparent: string;
	tracestate: string;
}

export interface ParsedTraceparent {
	version: string;
	traceId: string;
	parentId: string;
	flags: string;
}

/**
 * Create a new trace context for a HIVE cycle
 * Format: version-traceId-spanId-flags (W3C)
 *
 * @returns New trace context with unique traceId and spanId
 */
export function createTraceContext(): TraceContext {
	const version = '00';
	const traceId = crypto.randomUUID().replace(/-/g, '');
	const spanId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
	const flags = '01'; // sampled

	return {
		traceparent: `${version}-${traceId}-${spanId}-${flags}`,
		tracestate: 'hfo=gen87',
	};
}

/**
 * Propagate trace context to child span
 * Preserves traceId, generates new spanId
 *
 * @param parent Parent trace context
 * @returns Child trace context with same traceId, new spanId
 */
export function propagateTrace(parent: TraceContext): TraceContext {
	const parts = parent.traceparent.split('-');
	if (parts.length !== 4) {
		return createTraceContext();
	}

	const [version, traceId, , flags] = parts;
	const newSpanId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

	return {
		traceparent: `${version}-${traceId}-${newSpanId}-${flags}`,
		tracestate: parent.tracestate,
	};
}

/**
 * Extract traceId from traceparent
 *
 * @param traceparent W3C traceparent header
 * @returns 32-char traceId or null if invalid
 */
export function extractTraceId(traceparent: string): string | null {
	const parts = traceparent.split('-');
	return parts.length >= 2 ? (parts[1] ?? null) : null;
}

/**
 * Extract spanId from traceparent
 *
 * @param traceparent W3C traceparent header
 * @returns 16-char spanId or null if invalid
 */
export function extractSpanId(traceparent: string): string | null {
	const parts = traceparent.split('-');
	return parts.length >= 3 ? (parts[2] ?? null) : null;
}

/**
 * Validate traceparent format (W3C)
 * Format: 00-{32 hex}-{16 hex}-{2 hex}
 *
 * @param traceparent String to validate
 * @returns true if valid W3C format
 */
export function validateTraceparent(traceparent: string): boolean {
	const regex = /^00-[a-f0-9]{32}-[a-f0-9]{16}-[a-f0-9]{2}$/;
	return regex.test(traceparent);
}

/**
 * Alias for validateTraceparent (backward compatibility)
 */
export function isValidTraceparent(traceparent: string): boolean {
	return validateTraceparent(traceparent);
}

/**
 * Parse traceparent into components
 *
 * @param traceparent W3C traceparent header
 * @returns Parsed components or null if invalid
 */
export function parseTraceparent(traceparent: string): ParsedTraceparent | null {
	if (!validateTraceparent(traceparent)) {
		return null;
	}
	const parts = traceparent.split('-');
	// Safe to access after validateTraceparent passes (ensures 4 parts)
	const version = parts[0] ?? '';
	const traceId = parts[1] ?? '';
	const parentId = parts[2] ?? '';
	const flags = parts[3] ?? '';
	return {
		version,
		traceId,
		parentId,
		flags,
	};
}

/**
 * Get traceId from TraceContext
 */
export function getTraceId(ctx: TraceContext): string | null {
	return extractTraceId(ctx.traceparent);
}

/**
 * Get spanId from TraceContext
 */
export function getSpanId(ctx: TraceContext): string | null {
	return extractSpanId(ctx.traceparent);
}

/**
 * Check if trace is sampled (flags bit 0)
 */
export function isSampled(ctx: TraceContext): boolean {
	const parsed = parseTraceparent(ctx.traceparent);
	if (!parsed) return false;
	const flags = Number.parseInt(parsed.flags, 16);
	return (flags & 0x01) === 0x01;
}

/**
 * Create deterministic trace context from seed (for testing/migration)
 *
 * @param seed String seed for deterministic generation
 * @returns Deterministic trace context
 */
export function createDeterministicTrace(seed: string): TraceContext {
	// Use a simple hash-like approach for deterministic IDs
	const hash = (s: string): string => {
		let h = 0;
		for (let i = 0; i < s.length; i++) {
			h = ((h << 5) - h + s.charCodeAt(i)) | 0;
		}
		return Math.abs(h).toString(16).padStart(8, '0');
	};

	const traceId = (hash(seed) + hash(seed + '1') + hash(seed + '2') + hash(seed + '3')).slice(
		0,
		32,
	);
	const spanId = (hash(seed + 'span') + hash(seed + 'span2')).slice(0, 16);

	return {
		traceparent: `00-${traceId}-${spanId}-01`,
		tracestate: 'hfo=gen87',
	};
}
