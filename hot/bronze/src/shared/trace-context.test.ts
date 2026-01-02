/**
 * W3C Trace Context Tests
 * TDD RED→GREEN→REFACTOR for W3C trace context
 *
 * Gen87.X3 | Phase: VALIDATE (V) | Port 4 (Red Regnant)
 *
 * @source Gen85: src/shared/trace-context.test.ts
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
    createDeterministicTrace,
    createTraceContext,
    extractSpanId,
    extractTraceId,
    getSpanId,
    getTraceId,
    isSampled,
    parseTraceparent,
    propagateTrace,
    validateTraceparent,
} from './trace-context.js';

describe('trace-context', () => {
	describe('createTraceContext', () => {
		it('should create valid W3C traceparent format', () => {
			const ctx = createTraceContext();
			expect(validateTraceparent(ctx.traceparent)).toBe(true);
		});

		it('should create unique traceIds', () => {
			const ctx1 = createTraceContext();
			const ctx2 = createTraceContext();
			expect(extractTraceId(ctx1.traceparent)).not.toBe(extractTraceId(ctx2.traceparent));
		});

		it('should set tracestate to hfo=gen87', () => {
			const ctx = createTraceContext();
			expect(ctx.tracestate).toBe('hfo=gen87');
		});

		it('should have 32-char traceId', () => {
			const ctx = createTraceContext();
			const traceId = extractTraceId(ctx.traceparent);
			expect(traceId).toHaveLength(32);
		});

		it('should have 16-char spanId', () => {
			const ctx = createTraceContext();
			const spanId = extractSpanId(ctx.traceparent);
			expect(spanId).toHaveLength(16);
		});

		// Property: All created contexts are valid
		it('property: all created contexts have valid traceparent', () => {
			fc.assert(
				fc.property(fc.constant(null), () => {
					const ctx = createTraceContext();
					return validateTraceparent(ctx.traceparent);
				}),
				{ numRuns: 100 },
			);
		});
	});

	describe('propagateTrace', () => {
		it('should preserve traceId from parent', () => {
			const parent = createTraceContext();
			const child = propagateTrace(parent);
			expect(extractTraceId(child.traceparent)).toBe(extractTraceId(parent.traceparent));
		});

		it('should generate new spanId', () => {
			const parent = createTraceContext();
			const child = propagateTrace(parent);
			expect(extractSpanId(child.traceparent)).not.toBe(extractSpanId(parent.traceparent));
		});

		it('should preserve tracestate', () => {
			const parent = createTraceContext();
			const child = propagateTrace(parent);
			expect(child.tracestate).toBe(parent.tracestate);
		});

		it('should create new context for invalid parent', () => {
			const invalid = { traceparent: 'invalid', tracestate: 'test' };
			const child = propagateTrace(invalid);
			expect(validateTraceparent(child.traceparent)).toBe(true);
		});

		// Property: Propagation preserves traceId
		it('property: propagation always preserves traceId', () => {
			fc.assert(
				fc.property(fc.constant(null), () => {
					const parent = createTraceContext();
					const child = propagateTrace(parent);
					return extractTraceId(child.traceparent) === extractTraceId(parent.traceparent);
				}),
				{ numRuns: 100 },
			);
		});
	});

	describe('extractTraceId', () => {
		it('should extract 32-char traceId', () => {
			const ctx = createTraceContext();
			const traceId = extractTraceId(ctx.traceparent);
			expect(traceId).toHaveLength(32);
		});

		it('should return null for invalid format', () => {
			expect(extractTraceId('invalid')).toBeNull();
		});

		it('should return null for empty string', () => {
			expect(extractTraceId('')).toBeNull();
		});
	});

	describe('extractSpanId', () => {
		it('should extract 16-char spanId', () => {
			const ctx = createTraceContext();
			const spanId = extractSpanId(ctx.traceparent);
			expect(spanId).toHaveLength(16);
		});

		it('should return null for invalid format', () => {
			expect(extractSpanId('00-abc')).toBeNull();
		});
	});

	describe('validateTraceparent', () => {
		it('should accept valid W3C format', () => {
			expect(
				validateTraceparent('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'),
			).toBe(true);
		});

		it('should reject invalid version', () => {
			expect(
				validateTraceparent('01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'),
			).toBe(false);
		});

		it('should reject short traceId', () => {
			expect(validateTraceparent('00-4bf92f35-00f067aa0ba902b7-01')).toBe(false);
		});

		it('should reject short spanId', () => {
			expect(
				validateTraceparent('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067-01'),
			).toBe(false);
		});

		it('should reject uppercase hex', () => {
			expect(
				validateTraceparent('00-4BF92F3577B34DA6A3CE929D0E0E4736-00F067AA0BA902B7-01'),
			).toBe(false);
		});
	});

	describe('createDeterministicTrace', () => {
		it('should create same trace for same seed', () => {
			const trace1 = createDeterministicTrace('test-seed');
			const trace2 = createDeterministicTrace('test-seed');
			expect(trace1.traceparent).toBe(trace2.traceparent);
		});

		it('should create different traces for different seeds', () => {
			const trace1 = createDeterministicTrace('seed-1');
			const trace2 = createDeterministicTrace('seed-2');
			expect(trace1.traceparent).not.toBe(trace2.traceparent);
		});

		it('should set tracestate to hfo=gen87', () => {
			const trace = createDeterministicTrace('any-seed');
			expect(trace.tracestate).toBe('hfo=gen87');
		});

		it('should create valid W3C format', () => {
			const trace = createDeterministicTrace('test-seed');
			expect(validateTraceparent(trace.traceparent)).toBe(true);
		});

		// Property: All deterministic traces are valid
		it('property: all deterministic traces have valid traceparent', () => {
			fc.assert(
				fc.property(fc.string({ minLength: 1 }), (seed) => {
					const trace = createDeterministicTrace(seed);
					return validateTraceparent(trace.traceparent);
				}),
				{ numRuns: 100 },
			);
		});
	});

	describe('parseTraceparent', () => {
		it('should parse valid traceparent', () => {
			const parsed = parseTraceparent(
				'00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
			);
			expect(parsed).toEqual({
				version: '00',
				traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
				parentId: '00f067aa0ba902b7',
				flags: '01',
			});
		});

		it('should return null for invalid traceparent', () => {
			expect(parseTraceparent('invalid')).toBeNull();
		});
	});

	describe('isSampled', () => {
		it('should return true for sampled trace', () => {
			const ctx = createTraceContext();
			expect(isSampled(ctx)).toBe(true);
		});

		it('should return false for invalid trace', () => {
			const ctx = { traceparent: 'invalid', tracestate: '' };
			expect(isSampled(ctx)).toBe(false);
		});

		it('should check flag bit 0', () => {
			const ctx = {
				traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00',
				tracestate: '',
			};
			expect(isSampled(ctx)).toBe(false);
		});
	});

	describe('getTraceId and getSpanId', () => {
		it('should get traceId from context', () => {
			const ctx = createTraceContext();
			expect(getTraceId(ctx)).toBe(extractTraceId(ctx.traceparent));
		});

		it('should get spanId from context', () => {
			const ctx = createTraceContext();
			expect(getSpanId(ctx)).toBe(extractSpanId(ctx.traceparent));
		});
	});
});
