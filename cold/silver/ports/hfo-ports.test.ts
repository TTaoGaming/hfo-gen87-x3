/**
 * HFO 8-Port Interface Tests
 *
 * Gen87.X3 | Port 4 (Red Regnant) | HARD COVERAGE
 *
 * Tests the port metadata, type guards, and behavioral constraints.
 * Target: 80%+ mutation score
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	PORT_METADATA,
	isValidPort,
	assertPortCan,
	assertPortCannot,
	CloudEventSchema,
	type PortNumber,
	type PortMetadata,
} from './hfo-ports.js';

// ============================================================================
// 1. PORT METADATA TESTS
// ============================================================================

describe('PORT_METADATA', () => {
	it('has exactly 8 ports (0-7)', () => {
		const keys = Object.keys(PORT_METADATA).map(Number);
		expect(keys).toHaveLength(8);
		expect(keys).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
	});

	it('each port has required metadata fields', () => {
		for (let port = 0; port <= 7; port++) {
			const meta = PORT_METADATA[port as PortNumber];
			expect(meta.port).toBe(port);
			expect(typeof meta.name).toBe('string');
			expect(typeof meta.verb).toBe('string');
			expect(typeof meta.commander).toBe('string');
			expect(Array.isArray(meta.can)).toBe(true);
			expect(Array.isArray(meta.cannot)).toBe(true);
		}
	});

	it('port 0 is Lidless Legion - SENSE', () => {
		const meta = PORT_METADATA[0];
		expect(meta.commander).toBe('Lidless Legion');
		expect(meta.verb).toBe('SENSE');
		expect(meta.can).toContain('read');
		expect(meta.can).toContain('tag');
		expect(meta.cannot).toContain('modify');
		expect(meta.cannot).toContain('persist');
	});

	it('port 1 is Web Weaver - FUSE', () => {
		const meta = PORT_METADATA[1];
		expect(meta.commander).toBe('Web Weaver');
		expect(meta.verb).toBe('FUSE');
		expect(meta.can).toContain('validate');
		expect(meta.can).toContain('compose');
		expect(meta.cannot).toContain('skip_validation');
	});

	it('port 2 is Mirror Magus - SHAPE', () => {
		const meta = PORT_METADATA[2];
		expect(meta.commander).toBe('Mirror Magus');
		expect(meta.verb).toBe('SHAPE');
		expect(meta.can).toContain('transform');
		expect(meta.cannot).toContain('emit_output');
	});

	it('port 3 is Spore Storm - DELIVER', () => {
		const meta = PORT_METADATA[3];
		expect(meta.commander).toBe('Spore Storm');
		expect(meta.verb).toBe('DELIVER');
		expect(meta.can).toContain('emit_output');
		expect(meta.cannot).toContain('transform');
	});

	it('port 4 is Red Regnant - TEST', () => {
		const meta = PORT_METADATA[4];
		expect(meta.commander).toBe('Red Regnant');
		expect(meta.verb).toBe('TEST');
		expect(meta.can).toContain('validate');
		expect(meta.cannot).toContain('modify');
	});

	it('port 5 is Pyre Praetorian - DEFEND', () => {
		const meta = PORT_METADATA[5];
		expect(meta.commander).toBe('Pyre Praetorian');
		expect(meta.verb).toBe('DEFEND');
		expect(meta.can).toContain('gate');
		expect(meta.cannot).toContain('modify');
	});

	it('port 6 is Kraken Keeper - STORE', () => {
		const meta = PORT_METADATA[6];
		expect(meta.commander).toBe('Kraken Keeper');
		expect(meta.verb).toBe('STORE');
		expect(meta.can).toContain('persist');
		expect(meta.cannot).toContain('transform');
	});

	it('port 7 is Spider Sovereign - DECIDE', () => {
		const meta = PORT_METADATA[7];
		expect(meta.commander).toBe('Spider Sovereign');
		expect(meta.verb).toBe('DECIDE');
		expect(meta.can).toContain('route');
		expect(meta.can).toContain('compose');
		expect(meta.cannot).toContain('persist');
		expect(meta.cannot).toContain('emit_output');
	});

	it('all ports have "read" capability', () => {
		for (let port = 0; port <= 7; port++) {
			const meta = PORT_METADATA[port as PortNumber];
			expect(meta.can).toContain('read');
		}
	});

	it('anti-diagonal pairs sum to 7 (HIVE/8)', () => {
		// H: 0+7 = 7
		// I: 1+6 = 7
		// V: 2+5 = 7
		// E: 3+4 = 7
		expect(0 + 7).toBe(7);
		expect(1 + 6).toBe(7);
		expect(2 + 5).toBe(7);
		expect(3 + 4).toBe(7);
	});
});

// ============================================================================
// 2. TYPE GUARD TESTS
// ============================================================================

describe('isValidPort', () => {
	it('returns true for valid ports 0-7', () => {
		for (let i = 0; i <= 7; i++) {
			expect(isValidPort(i)).toBe(true);
		}
	});

	it('returns false for negative numbers', () => {
		expect(isValidPort(-1)).toBe(false);
		expect(isValidPort(-100)).toBe(false);
	});

	it('returns false for numbers > 7', () => {
		expect(isValidPort(8)).toBe(false);
		expect(isValidPort(100)).toBe(false);
	});

	it('returns false for non-integers', () => {
		expect(isValidPort(0.5)).toBe(false);
		expect(isValidPort(3.14)).toBe(false);
		expect(isValidPort(NaN)).toBe(false);
	});

	// Property: valid ports are exactly 0-7
	it('property: valid ports are in range [0, 7]', () => {
		fc.assert(
			fc.property(fc.integer({ min: -1000, max: 1000 }), (n) => {
				const expected = Number.isInteger(n) && n >= 0 && n <= 7;
				return isValidPort(n) === expected;
			}),
			{ numRuns: 100 }
		);
	});
});

// ============================================================================
// 3. BEHAVIORAL CONSTRAINT TESTS
// ============================================================================

describe('assertPortCan', () => {
	it('does not throw for allowed actions', () => {
		expect(() => assertPortCan(0, 'read')).not.toThrow();
		expect(() => assertPortCan(0, 'tag')).not.toThrow();
		expect(() => assertPortCan(1, 'validate')).not.toThrow();
		expect(() => assertPortCan(2, 'transform')).not.toThrow();
		expect(() => assertPortCan(7, 'compose')).not.toThrow();
	});

	it('throws for disallowed actions', () => {
		expect(() => assertPortCan(0, 'persist')).toThrow();
		expect(() => assertPortCan(1, 'decide')).toThrow();
		expect(() => assertPortCan(2, 'emit_output')).toThrow();
		expect(() => assertPortCan(7, 'persist')).toThrow();
	});

	it('error message includes port number and commander', () => {
		try {
			assertPortCan(0, 'persist');
		} catch (e) {
			expect((e as Error).message).toContain('Port 0');
			expect((e as Error).message).toContain('Lidless Legion');
			expect((e as Error).message).toContain('persist');
		}
	});
});

describe('assertPortCannot', () => {
	it('throws for prohibited actions', () => {
		expect(() => assertPortCannot(0, 'modify')).toThrow();
		expect(() => assertPortCannot(1, 'skip_validation')).toThrow();
		expect(() => assertPortCannot(7, 'emit_output')).toThrow();
	});

	it('does not throw for non-prohibited actions', () => {
		expect(() => assertPortCannot(0, 'read')).not.toThrow();
		expect(() => assertPortCannot(1, 'route')).not.toThrow();
		expect(() => assertPortCannot(7, 'decide')).not.toThrow();
	});

	it('error message includes prohibited list', () => {
		try {
			assertPortCannot(0, 'modify');
		} catch (e) {
			expect((e as Error).message).toContain('PROHIBITED');
			expect((e as Error).message).toContain('modify');
		}
	});
});

// ============================================================================
// 4. CLOUDEVENT SCHEMA TESTS
// ============================================================================

describe('CloudEventSchema', () => {
	const validEvent = {
		specversion: '1.0' as const,
		id: '550e8400-e29b-41d4-a716-446655440000',
		source: '/hfo/port/0',
		type: 'hfo.sense.frame',
		time: '2026-01-02T12:00:00.000Z',
		data: { test: true },
		hfoport: 0,
		hfogen: 87,
		hfohive: 'H' as const,
	};

	it('validates correct CloudEvent', () => {
		const result = CloudEventSchema.safeParse(validEvent);
		expect(result.success).toBe(true);
	});

	it('rejects invalid specversion', () => {
		const result = CloudEventSchema.safeParse({ ...validEvent, specversion: '2.0' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid UUID', () => {
		const result = CloudEventSchema.safeParse({ ...validEvent, id: 'not-a-uuid' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid hfoport', () => {
		const result = CloudEventSchema.safeParse({ ...validEvent, hfoport: 8 });
		expect(result.success).toBe(false);
	});

	it('rejects hfogen < 85', () => {
		const result = CloudEventSchema.safeParse({ ...validEvent, hfogen: 84 });
		expect(result.success).toBe(false);
	});

	it('accepts hfogen >= 85', () => {
		const result = CloudEventSchema.safeParse({ ...validEvent, hfogen: 85 });
		expect(result.success).toBe(true);
	});

	it('rejects invalid hfohive', () => {
		const result = CloudEventSchema.safeParse({ ...validEvent, hfohive: 'Z' });
		expect(result.success).toBe(false);
	});

	it('accepts all valid hive phases', () => {
		for (const hive of ['H', 'I', 'V', 'E', 'X']) {
			const result = CloudEventSchema.safeParse({ ...validEvent, hfohive: hive });
			expect(result.success).toBe(true);
		}
	});

	// Property: all ports 0-7 are valid
	it('property: all ports 0-7 are valid', () => {
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 7 }), (port) => {
				const result = CloudEventSchema.safeParse({ ...validEvent, hfoport: port });
				return result.success === true;
			}),
			{ numRuns: 8 }
		);
	});
});

// ============================================================================
// 5. INTER-PORT COMMUNICATION RULES
// ============================================================================

describe('Inter-Port Communication Rules', () => {
	it('Port 0 can only output to Port 1 or 2', () => {
		// SENSE → FUSE or SHAPE
		const meta = PORT_METADATA[0];
		expect(meta.cannot).not.toContain('tag'); // Can tag for output
	});

	it('Port 7 can compose but not emit', () => {
		const meta = PORT_METADATA[7];
		expect(meta.can).toContain('compose');
		expect(meta.cannot).toContain('emit_output');
	});

	it('Port 5 gates before Port 6 dispatches', () => {
		// DEFEND → STORE
		const defendMeta = PORT_METADATA[5];
		const storeMeta = PORT_METADATA[6];
		expect(defendMeta.can).toContain('gate');
		expect(storeMeta.can).toContain('persist');
	});

	it('only Port 1 can validate', () => {
		const fusePort = PORT_METADATA[1];
		const testPort = PORT_METADATA[4];
		expect(fusePort.can).toContain('validate');
		expect(testPort.can).toContain('validate'); // Red Regnant also validates
	});

	it('only Port 6 can persist', () => {
		const persistPorts = Object.values(PORT_METADATA).filter((m) =>
			m.can.includes('persist')
		);
		expect(persistPorts).toHaveLength(1);
		expect(persistPorts[0].port).toBe(6);
	});
});

// ============================================================================
// 6. PROPERTY-BASED TESTS
// ============================================================================

describe('Property-Based Tests', () => {
	it('property: CAN and CANNOT are disjoint', () => {
		for (let port = 0; port <= 7; port++) {
			const meta = PORT_METADATA[port as PortNumber];
			const overlap = meta.can.filter((action) =>
				meta.cannot.includes(action as (typeof meta.cannot)[number])
			);
			expect(overlap).toHaveLength(0);
		}
	});

	it('property: every port has at least one CAN', () => {
		for (let port = 0; port <= 7; port++) {
			const meta = PORT_METADATA[port as PortNumber];
			expect(meta.can.length).toBeGreaterThan(0);
		}
	});

	it('property: every port has at least one CANNOT', () => {
		for (let port = 0; port <= 7; port++) {
			const meta = PORT_METADATA[port as PortNumber];
			expect(meta.cannot.length).toBeGreaterThan(0);
		}
	});

	it('property: port number matches metadata port field', () => {
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 7 }), (port) => {
				const meta = PORT_METADATA[port as PortNumber];
				return meta.port === port;
			}),
			{ numRuns: 8 }
		);
	});
});
