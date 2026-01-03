/**
 * CloudEvents Bridge Tests - MUTATION KILLING
 *
 * Gen87.X3 | Port 4 (Red Regnant) | HARD COVERAGE
 *
 * Target: 80%+ mutation score
 */
import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import {
	generateEventId,
	generateTraceparent,
	generateHexId,
	parseTraceparent,
	propagateTrace,
	wrapAsCloudEvent,
	validateCloudEvent,
	unwrapCloudEvent,
	isCloudEvent,
	DEFAULT_BRIDGE_CONFIG,
	type CloudEvent,
	type W3CTraceContext,
} from './cloudevents-bridge.js';

describe('CloudEvents Bridge Primitive', () => {
	// =========================================================================
	// EVENT ID GENERATION
	// =========================================================================
	describe('generateEventId', () => {
		it('should return a string', () => {
			const id = generateEventId();
			expect(typeof id).toBe('string');
		});

		it('should return non-empty string', () => {
			const id = generateEventId();
			expect(id.length).toBeGreaterThan(0);
		});

		it('should generate unique IDs', () => {
			const ids = new Set<string>();
			for (let i = 0; i < 100; i++) {
				ids.add(generateEventId());
			}
			expect(ids.size).toBe(100);
		});

		it('should generate valid UUID format', () => {
			const id = generateEventId();
			// UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(id).toMatch(uuidRegex);
		});
	});

	// =========================================================================
	// HEX ID GENERATION
	// =========================================================================
	describe('generateHexId', () => {
		it('should generate correct length', () => {
			expect(generateHexId(16).length).toBe(16);
			expect(generateHexId(32).length).toBe(32);
			expect(generateHexId(8).length).toBe(8);
		});

		it('should only contain hex characters', () => {
			const hexRegex = /^[0-9a-f]+$/;
			expect(generateHexId(32)).toMatch(hexRegex);
		});

		it('should generate unique values', () => {
			const ids = new Set<string>();
			for (let i = 0; i < 100; i++) {
				ids.add(generateHexId(32));
			}
			expect(ids.size).toBe(100);
		});

		it('should handle zero length', () => {
			expect(generateHexId(0)).toBe('');
		});
	});

	// =========================================================================
	// TRACEPARENT GENERATION
	// =========================================================================
	describe('generateTraceparent', () => {
		it('should return W3C format', () => {
			const tp = generateTraceparent();
			expect(tp.split('-').length).toBe(4);
		});

		it('should start with version 00', () => {
			const tp = generateTraceparent();
			expect(tp.startsWith('00-')).toBe(true);
		});

		it('should have 32-char trace ID', () => {
			const tp = generateTraceparent();
			const parts = tp.split('-');
			expect(parts[1].length).toBe(32);
		});

		it('should have 16-char parent ID', () => {
			const tp = generateTraceparent();
			const parts = tp.split('-');
			expect(parts[2].length).toBe(16);
		});

		it('should have sampled flag 01', () => {
			const tp = generateTraceparent();
			expect(tp.endsWith('-01')).toBe(true);
		});

		it('should use provided traceId', () => {
			const traceId = 'a'.repeat(32);
			const tp = generateTraceparent(traceId);
			expect(tp.includes(traceId)).toBe(true);
		});

		it('should use provided parentId', () => {
			const parentId = 'b'.repeat(16);
			const tp = generateTraceparent(undefined, parentId);
			expect(tp.includes(parentId)).toBe(true);
		});
	});

	// =========================================================================
	// TRACEPARENT PARSING
	// =========================================================================
	describe('parseTraceparent', () => {
		it('should parse valid traceparent', () => {
			const tp = '00-' + 'a'.repeat(32) + '-' + 'b'.repeat(16) + '-01';
			const result = parseTraceparent(tp);
			expect(result).not.toBeNull();
			expect(result?.version).toBe('00');
			expect(result?.traceId).toBe('a'.repeat(32));
			expect(result?.parentId).toBe('b'.repeat(16));
			expect(result?.flags).toBe('01');
		});

		it('should return null for wrong part count', () => {
			expect(parseTraceparent('00-abc-def')).toBeNull();
			expect(parseTraceparent('00')).toBeNull();
		});

		it('should return null for wrong version', () => {
			const tp = '01-' + 'a'.repeat(32) + '-' + 'b'.repeat(16) + '-01';
			expect(parseTraceparent(tp)).toBeNull();
		});

		it('should return null for wrong traceId length', () => {
			const tp = '00-' + 'a'.repeat(31) + '-' + 'b'.repeat(16) + '-01';
			expect(parseTraceparent(tp)).toBeNull();
		});

		it('should return null for wrong parentId length', () => {
			const tp = '00-' + 'a'.repeat(32) + '-' + 'b'.repeat(15) + '-01';
			expect(parseTraceparent(tp)).toBeNull();
		});

		it('should return null for wrong flags length', () => {
			const tp = '00-' + 'a'.repeat(32) + '-' + 'b'.repeat(16) + '-1';
			expect(parseTraceparent(tp)).toBeNull();
		});

		it('should return null for non-hex characters', () => {
			const tp = '00-' + 'g'.repeat(32) + '-' + 'b'.repeat(16) + '-01';
			expect(parseTraceparent(tp)).toBeNull();
		});

		it('should reject traceId with non-hex prefix', () => {
			// This tests the ^ anchor in the hex regex
			const tp = '00-z' + 'a'.repeat(31) + '-' + 'b'.repeat(16) + '-01';
			expect(parseTraceparent(tp)).toBeNull();
		});

		it('should reject traceId with non-hex suffix', () => {
			// This tests the $ anchor in the hex regex
			const tp = '00-' + 'a'.repeat(31) + 'z-' + 'b'.repeat(16) + '-01';
			expect(parseTraceparent(tp)).toBeNull();
		});

		it('should reject parentId with non-hex characters', () => {
			const tp = '00-' + 'a'.repeat(32) + '-z' + 'b'.repeat(15) + '-01';
			expect(parseTraceparent(tp)).toBeNull();
		});

		it('should reject flags with non-hex characters', () => {
			const tp = '00-' + 'a'.repeat(32) + '-' + 'b'.repeat(16) + '-zz';
			expect(parseTraceparent(tp)).toBeNull();
		});
	});

	// =========================================================================
	// TRACE PROPAGATION
	// =========================================================================
	describe('propagateTrace', () => {
		it('should preserve traceId from parent', () => {
			const traceId = 'a'.repeat(32);
			const parent: W3CTraceContext = {
				traceparent: `00-${traceId}-${'b'.repeat(16)}-01`,
			};
			const child = propagateTrace(parent);
			expect(child.traceparent.includes(traceId)).toBe(true);
		});

		it('should generate new parentId', () => {
			const parentId = 'b'.repeat(16);
			const parent: W3CTraceContext = {
				traceparent: `00-${'a'.repeat(32)}-${parentId}-01`,
			};
			const child = propagateTrace(parent);
			// New parentId should be different
			const childParts = child.traceparent.split('-');
			expect(childParts[2]).not.toBe(parentId);
		});

		it('should preserve tracestate', () => {
			const parent: W3CTraceContext = {
				traceparent: `00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`,
				tracestate: 'congo=lZWRzIHRoNhcm5teleS',
			};
			const child = propagateTrace(parent);
			expect(child.tracestate).toBe(parent.tracestate);
		});

		it('should create new trace for invalid parent', () => {
			const parent: W3CTraceContext = {
				traceparent: 'invalid',
			};
			const child = propagateTrace(parent);
			expect(child.traceparent.split('-').length).toBe(4);
		});
	});

	// =========================================================================
	// WRAP AS CLOUDEVENT
	// =========================================================================
	describe('wrapAsCloudEvent', () => {
		it('should set specversion to 1.0', () => {
			const event = wrapAsCloudEvent({ foo: 'bar' }, 'test');
			expect(event.specversion).toBe('1.0');
		});

		it('should generate unique id', () => {
			const event1 = wrapAsCloudEvent({ foo: 'bar' }, 'test');
			const event2 = wrapAsCloudEvent({ foo: 'bar' }, 'test');
			expect(event1.id).not.toBe(event2.id);
		});

		it('should use source from config', () => {
			const event = wrapAsCloudEvent({ foo: 'bar' }, 'test');
			expect(event.source).toBe(DEFAULT_BRIDGE_CONFIG.source);
		});

		it('should construct type from prefix and eventType', () => {
			const event = wrapAsCloudEvent({ foo: 'bar' }, 'frame');
			expect(event.type).toBe(`${DEFAULT_BRIDGE_CONFIG.typePrefix}.frame`);
		});

		it('should use non-empty default typePrefix', () => {
			// Mutation: typePrefix: '' would break this
			const event = wrapAsCloudEvent({ foo: 'bar' }, 'test');
			expect(event.type).toContain('.');
			expect(event.type.length).toBeGreaterThan(5); // 'hfo.gesture.test' > 5
			expect(DEFAULT_BRIDGE_CONFIG.typePrefix.length).toBeGreaterThan(0);
		});

		it('should set datacontenttype to application/json', () => {
			const event = wrapAsCloudEvent({ foo: 'bar' }, 'test');
			expect(event.datacontenttype).toBe('application/json');
		});

		it('should set time to ISO8601 format', () => {
			const event = wrapAsCloudEvent({ foo: 'bar' }, 'test');
			expect(event.time).toBeDefined();
			expect(Number.isNaN(Date.parse(event.time!))).toBe(false);
		});

		it('should include data payload', () => {
			const data = { x: 0.5, y: 0.5 };
			const event = wrapAsCloudEvent(data, 'test');
			expect(event.data).toEqual(data);
		});

		it('should add HFO extensions', () => {
			const event = wrapAsCloudEvent({ foo: 'bar' }, 'test');
			expect(event.hfoport).toBe(DEFAULT_BRIDGE_CONFIG.hfoPort);
			expect(event.hfohive).toBe(DEFAULT_BRIDGE_CONFIG.hfoHive);
			expect(event.hfogen).toBe(DEFAULT_BRIDGE_CONFIG.hfoGen);
		});

		it('should add trace context when provided', () => {
			const trace: W3CTraceContext = {
				traceparent: `00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`,
				tracestate: 'vendor=value',
			};
			const event = wrapAsCloudEvent({ foo: 'bar' }, 'test', DEFAULT_BRIDGE_CONFIG, trace);
			expect(event.traceparent).toBe(trace.traceparent);
			expect(event.tracestate).toBe(trace.tracestate);
		});

		it('should use custom config', () => {
			const config = {
				source: '/custom/source',
				typePrefix: 'custom',
				hfoPort: 3,
				hfoHive: 'V' as const,
				hfoGen: 88,
			};
			const event = wrapAsCloudEvent({ foo: 'bar' }, 'test', config);
			expect(event.source).toBe(config.source);
			expect(event.type).toBe('custom.test');
			expect(event.hfoport).toBe(3);
			expect(event.hfohive).toBe('V');
			expect(event.hfogen).toBe(88);
		});
	});

	// =========================================================================
	// VALIDATE CLOUDEVENT
	// =========================================================================
	describe('validateCloudEvent', () => {
		it('should return empty array for valid event', () => {
			const event = wrapAsCloudEvent({ foo: 'bar' }, 'test');
			const errors = validateCloudEvent(event);
			expect(errors).toEqual([]);
		});

		it('should reject non-object', () => {
			expect(validateCloudEvent(null)).toContain('Event must be an object');
			expect(validateCloudEvent('string')).toContain('Event must be an object');
			expect(validateCloudEvent(123)).toContain('Event must be an object');
		});

		it('should require specversion 1.0', () => {
			const event = { specversion: '0.3', id: 'x', source: '/x', type: 'x' };
			expect(validateCloudEvent(event)).toContain('specversion must be "1.0"');
		});

		it('should require non-empty id', () => {
			const event = { specversion: '1.0', id: '', source: '/x', type: 'x' };
			expect(validateCloudEvent(event)).toContain('id must be a non-empty string');
		});

		it('should require non-empty source', () => {
			const event = { specversion: '1.0', id: 'x', source: '', type: 'x' };
			expect(validateCloudEvent(event)).toContain('source must be a non-empty string');
		});

		it('should require non-empty type', () => {
			const event = { specversion: '1.0', id: 'x', source: '/x', type: '' };
			expect(validateCloudEvent(event)).toContain('type must be a non-empty string');
		});

		it('should validate time format if present', () => {
			const event = { specversion: '1.0', id: 'x', source: '/x', type: 'x', time: 'invalid' };
			expect(validateCloudEvent(event)).toContain('time must be a valid ISO8601 timestamp');
		});

		it('should accept event without optional time field', () => {
			const event = { specversion: '1.0', id: 'x', source: '/x', type: 'x' };
			const errors = validateCloudEvent(event);
			expect(errors).toEqual([]);
		});

		it('should validate traceparent format if present', () => {
			const event = { specversion: '1.0', id: 'x', source: '/x', type: 'x', traceparent: 'invalid' };
			expect(validateCloudEvent(event)).toContain('traceparent must be valid W3C format');
		});

		it('should accept valid traceparent string', () => {
			const event = {
				specversion: '1.0',
				id: 'x',
				source: '/x',
				type: 'x',
				traceparent: `00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`,
			};
			const errors = validateCloudEvent(event);
			expect(errors).toEqual([]);
		});

		it('should reject invalid traceparent type', () => {
			const event = { specversion: '1.0', id: 'x', source: '/x', type: 'x', traceparent: 123 };
			expect(validateCloudEvent(event)).toContain('traceparent must be valid W3C format');
		});
	});

	// =========================================================================
	// UNWRAP CLOUDEVENT
	// =========================================================================
	describe('unwrapCloudEvent', () => {
		it('should extract data from valid event', () => {
			const data = { x: 0.5, y: 0.5 };
			const event = wrapAsCloudEvent(data, 'test');
			expect(unwrapCloudEvent(event)).toEqual(data);
		});

		it('should return null for invalid event', () => {
			const invalid = { specversion: '0.3' } as CloudEvent;
			expect(unwrapCloudEvent(invalid)).toBeNull();
		});

		it('should return null when validation fails with errors', () => {
			const invalid = { specversion: '1.0', id: '', source: '', type: '' } as CloudEvent;
			// This event has empty id/source/type which should cause validation errors
			const result = unwrapCloudEvent(invalid);
			expect(result).toBeNull();
		});

		it('should return null for undefined data', () => {
			const event = wrapAsCloudEvent(undefined, 'test');
			delete event.data;
			expect(unwrapCloudEvent(event)).toBeNull();
		});
	});

	// =========================================================================
	// IS CLOUDEVENT
	// =========================================================================
	describe('isCloudEvent', () => {
		it('should return true for valid event', () => {
			const event = wrapAsCloudEvent({ foo: 'bar' }, 'test');
			expect(isCloudEvent(event)).toBe(true);
		});

		it('should return false for invalid event', () => {
			expect(isCloudEvent(null)).toBe(false);
			expect(isCloudEvent({})).toBe(false);
			expect(isCloudEvent({ specversion: '0.3' })).toBe(false);
		});
	});

	// =========================================================================
	// PROPERTY-BASED TESTS
	// =========================================================================
	describe('PROPERTY: CloudEvents invariants', () => {
		it('wrapped events are always valid', () => {
			fc.assert(
				fc.property(fc.anything(), fc.string({ minLength: 1 }), (data, eventType) => {
					const event = wrapAsCloudEvent(data, eventType);
					const errors = validateCloudEvent(event);
					expect(errors).toEqual([]);
				}),
				{ numRuns: 100 }
			);
		});

		it('unwrap(wrap(x)) === x for serializable data', () => {
			fc.assert(
				fc.property(
					fc.oneof(fc.string(), fc.integer(), fc.double({ noNaN: true }), fc.boolean()),
					(data) => {
						const event = wrapAsCloudEvent(data, 'test');
						expect(unwrapCloudEvent(event)).toEqual(data);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('trace propagation preserves traceId', () => {
			fc.assert(
				fc.property(fc.hexaString({ minLength: 32, maxLength: 32 }), (traceId) => {
					const parent: W3CTraceContext = {
						traceparent: `00-${traceId}-${'0'.repeat(16)}-01`,
					};
					const child = propagateTrace(parent);
					expect(child.traceparent.includes(traceId)).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});
	});
});
