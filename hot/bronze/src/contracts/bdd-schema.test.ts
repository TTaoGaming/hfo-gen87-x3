/**
 * BDD Schema Validation Tests
 * ============================
 *
 * Tests that ACTUALLY validate the input/output schemas defined in port-contracts.ts
 * These tests kill the mutations that survived the original test suite.
 *
 * MUTATION TESTING FINDINGS:
 * - 54 mutants survived in port-contracts.ts (27.85% score)
 * - Schemas can be emptied (z.object({})) without test failure
 * - BDD scenarios are documentation, not enforcement
 *
 * This file HARDENS the contracts by:
 * 1. Validating that schemas accept valid input
 * 2. Validating that schemas reject invalid input
 * 3. Testing schema field constraints (min/max bounds)
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { PortNumber } from '../contracts/hfo-ports.js';
import { getContract } from '../contracts/port-contracts.js';

// ============================================================================
// HELPER: Schema Field Counter
// ============================================================================

/**
 * Counts the number of fields in a Zod object schema.
 * Empty schemas have 0 fields - this catches the z.object({}) mutation.
 */
function countSchemaFields(schema: z.ZodType<unknown>): number {
	if (schema instanceof z.ZodObject) {
		return Object.keys(schema.shape).length;
	}
	return 0;
}

/**
 * Validates that a schema has at least the expected number of fields.
 * This is the key test that kills the "empty object" mutations.
 */
function assertSchemaHasFields(schema: z.ZodType<unknown>, minFields: number, schemaName: string) {
	const fieldCount = countSchemaFields(schema);
	if (fieldCount < minFields) {
		throw new Error(`${schemaName} has ${fieldCount} fields, expected at least ${minFields}`);
	}
}

// ============================================================================
// PORT 0: SENSE - Input/Output Schema Tests
// ============================================================================

describe('Port 0 (SENSE) Schema Validation', () => {
	const contract = getContract(0);

	it('outputSchema has required fields (data, tags)', () => {
		assertSchemaHasFields(contract.outputSchema, 2, 'Port0.outputSchema');
	});

	it('outputSchema.tags has required fields (ts, source)', () => {
		// @ts-expect-error - accessing internal shape
		const tagsSchema = contract.outputSchema.shape?.tags;
		expect(tagsSchema).toBeDefined();
		if (tagsSchema instanceof z.ZodObject) {
			assertSchemaHasFields(tagsSchema, 2, 'Port0.outputSchema.tags');
		}
	});

	it('accepts valid output data', () => {
		const validOutput = {
			data: { raw: 'any data' },
			tags: {
				ts: new Date().toISOString(),
				source: 'webcam',
				confidence: 0.95,
			},
		};
		const result = contract.outputSchema.safeParse(validOutput);
		expect(result.success).toBe(true);
	});

	it('confidence must be between 0 and 1', () => {
		const invalidOutput = {
			data: {},
			tags: {
				ts: new Date().toISOString(),
				source: 'test',
				confidence: 1.5, // Invalid: > 1
			},
		};
		const result = contract.outputSchema.safeParse(invalidOutput);
		expect(result.success).toBe(false);
	});
});

// ============================================================================
// PORT 1: FUSE - Input/Output Schema Tests
// ============================================================================

describe('Port 1 (FUSE) Schema Validation', () => {
	const contract = getContract(1);

	it('inputSchema has required fields (sources)', () => {
		assertSchemaHasFields(contract.inputSchema, 1, 'Port1.inputSchema');
	});

	it('outputSchema has required fields (fused, valid, sources)', () => {
		assertSchemaHasFields(contract.outputSchema, 3, 'Port1.outputSchema');
	});

	it('accepts valid input with sources array', () => {
		const validInput = {
			sources: [{ x: 1 }, { y: 2 }],
			schema: undefined,
		};
		const result = contract.inputSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('accepts valid output', () => {
		const validOutput = {
			fused: { merged: true },
			valid: true,
			sources: ['source1', 'source2'],
		};
		const result = contract.outputSchema.safeParse(validOutput);
		expect(result.success).toBe(true);
	});
});

// ============================================================================
// PORT 2: SHAPE - Input/Output Schema Tests
// ============================================================================

describe('Port 2 (SHAPE) Schema Validation', () => {
	const contract = getContract(2);

	it('outputSchema has required fields (shaped, transformations)', () => {
		assertSchemaHasFields(contract.outputSchema, 2, 'Port2.outputSchema');
	});

	it('accepts valid output', () => {
		const validOutput = {
			shaped: { smoothedX: 0.5, smoothedY: 0.5 },
			transformations: ['smooth', 'normalize'],
			reversible: true,
		};
		const result = contract.outputSchema.safeParse(validOutput);
		expect(result.success).toBe(true);
	});
});

// ============================================================================
// PORT 3: DELIVER - Input/Output Schema Tests
// ============================================================================

describe('Port 3 (DELIVER) Schema Validation', () => {
	const contract = getContract(3);

	it('inputSchema has required fields (payload, target)', () => {
		assertSchemaHasFields(contract.inputSchema, 2, 'Port3.inputSchema');
	});

	it('outputSchema has required fields (delivered, target, timestamp)', () => {
		assertSchemaHasFields(contract.outputSchema, 3, 'Port3.outputSchema');
	});

	it('accepts valid input', () => {
		const validInput = {
			payload: { data: 'test' },
			target: 'gesture-panel',
		};
		const result = contract.inputSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('accepts valid output', () => {
		const validOutput = {
			delivered: true,
			target: 'gesture-panel',
			timestamp: new Date().toISOString(),
		};
		const result = contract.outputSchema.safeParse(validOutput);
		expect(result.success).toBe(true);
	});
});

// ============================================================================
// PORT 4: TEST - Input/Output Schema Tests
// ============================================================================

describe('Port 4 (TEST) Schema Validation', () => {
	const contract = getContract(4);

	it('inputSchema has required fields (subject, properties, iterations)', () => {
		assertSchemaHasFields(contract.inputSchema, 2, 'Port4.inputSchema');
	});

	it('outputSchema has required fields (passed, results)', () => {
		assertSchemaHasFields(contract.outputSchema, 2, 'Port4.outputSchema');
	});

	it('iterations must be >= 1', () => {
		const invalidInput = {
			subject: {},
			properties: [],
			iterations: 0, // Invalid: < 1
		};
		const result = contract.inputSchema.safeParse(invalidInput);
		expect(result.success).toBe(false);
	});

	it('accepts valid input with default iterations', () => {
		const validInput = {
			subject: { value: 42 },
			properties: [{ name: 'isPositive', predicate: () => true }],
		};
		const result = contract.inputSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});
});

// ============================================================================
// PORT 5: DEFEND - Input/Output Schema Tests
// ============================================================================

describe('Port 5 (DEFEND) Schema Validation', () => {
	const contract = getContract(5);

	it('inputSchema has required fields (payload, gates)', () => {
		assertSchemaHasFields(contract.inputSchema, 2, 'Port5.inputSchema');
	});

	it('outputSchema has required fields (allowed, passedGates, failedGates)', () => {
		assertSchemaHasFields(contract.outputSchema, 3, 'Port5.outputSchema');
	});

	it('accepts valid output', () => {
		const validOutput = {
			allowed: true,
			passedGates: ['G0', 'G1', 'G2'],
			failedGates: [],
		};
		const result = contract.outputSchema.safeParse(validOutput);
		expect(result.success).toBe(true);
	});
});

// ============================================================================
// PORT 6: STORE - Input/Output Schema Tests
// ============================================================================

describe('Port 6 (STORE) Schema Validation', () => {
	const contract = getContract(6);

	it('inputSchema has required fields (collection, data)', () => {
		assertSchemaHasFields(contract.inputSchema, 2, 'Port6.inputSchema');
	});

	it('outputSchema has required fields (stored, id, timestamp)', () => {
		assertSchemaHasFields(contract.outputSchema, 3, 'Port6.outputSchema');
	});

	it('accepts valid input', () => {
		const validInput = {
			collection: 'signals',
			data: { msg: 'test signal' },
		};
		const result = contract.inputSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('accepts valid output', () => {
		const validOutput = {
			stored: true,
			id: 'abc123',
			timestamp: new Date().toISOString(),
		};
		const result = contract.outputSchema.safeParse(validOutput);
		expect(result.success).toBe(true);
	});
});

// ============================================================================
// PORT 7: DECIDE - Input/Output Schema Tests
// ============================================================================

describe('Port 7 (DECIDE) Schema Validation', () => {
	const contract = getContract(7);

	it('inputSchema has required fields (context, options)', () => {
		assertSchemaHasFields(contract.inputSchema, 2, 'Port7.inputSchema');
	});

	it('outputSchema has required fields (decision, confidence, delegations)', () => {
		assertSchemaHasFields(contract.outputSchema, 3, 'Port7.outputSchema');
	});

	it('confidence must be between 0 and 1', () => {
		const invalidOutput = {
			decision: 'route-to-shape',
			confidence: 1.5, // Invalid: > 1
			delegations: [],
		};
		const result = contract.outputSchema.safeParse(invalidOutput);
		expect(result.success).toBe(false);
	});

	it('delegation port must be 0-7', () => {
		const invalidOutput = {
			decision: 'route',
			confidence: 0.9,
			delegations: [{ port: 10, action: 'process' }], // Invalid: port > 7
		};
		const result = contract.outputSchema.safeParse(invalidOutput);
		expect(result.success).toBe(false);
	});

	it('accepts valid output', () => {
		const validOutput = {
			decision: 'route-to-shape',
			confidence: 0.95,
			delegations: [
				{ port: 2, action: 'smooth' },
				{ port: 3, action: 'deliver' },
			],
		};
		const result = contract.outputSchema.safeParse(validOutput);
		expect(result.success).toBe(true);
	});
});

// ============================================================================
// BDD SCENARIO VALIDATION
// ============================================================================

describe('BDD Scenario Validation', () => {
	it('all ports have non-empty behaviors array', () => {
		for (let port = 0; port < 8; port++) {
			const contract = getContract(port as PortNumber);
			expect(contract.behaviors.length).toBeGreaterThan(0);
		}
	});

	it('each behavior has required Gherkin fields', () => {
		for (let port = 0; port < 8; port++) {
			const contract = getContract(port as PortNumber);
			for (const behavior of contract.behaviors) {
				expect(typeof behavior.scenario).toBe('string');
				expect(typeof behavior.given).toBe('string');
				expect(typeof behavior.when).toBe('string');
				expect(typeof behavior.then).toBe('string');
				expect(behavior.scenario.length).toBeGreaterThan(0);
			}
		}
	});

	it('Port 0 has "Observe without modification" scenario', () => {
		const contract = getContract(0);
		const scenario = contract.behaviors.find((b) => b.scenario === 'Observe without modification');
		expect(scenario).toBeDefined();
		expect(scenario?.then).toContain('unchanged');
	});

	it('Port 4 has "Property-based testing" scenario', () => {
		const contract = getContract(4);
		const scenario = contract.behaviors.find((b) => b.scenario === 'Property-based testing');
		expect(scenario).toBeDefined();
		expect(scenario?.then).toContain('100');
	});

	it('Port 5 has "Enforce G0-G7 gates" scenario', () => {
		const contract = getContract(5);
		const scenario = contract.behaviors.find((b) => b.scenario === 'Enforce G0-G7 gates');
		expect(scenario).toBeDefined();
		expect(scenario?.and).toContain('G0: Valid ISO8601 timestamp');
	});

	it('Port 7 has "The spider weaves the web" scenario', () => {
		const contract = getContract(7);
		const scenario = contract.behaviors.find((b) => b.scenario === 'The spider weaves the web');
		expect(scenario).toBeDefined();
	});
});

// ============================================================================
// SCHEMA FIELD COUNT VALIDATION (Kills Empty Object Mutations)
// ============================================================================

describe('Schema Field Count Validation', () => {
	// Port 0 (SENSE) and Port 2 (SHAPE) use z.unknown() for input
	// Port 0: Accepts ANY raw data to observe
	// Port 2: Accepts ANY data to transform/shape
	const portsWithStructuredInput = [1, 3, 4, 5, 6, 7] as const;

	it('ports with structured inputSchemas have at least 1 field', () => {
		for (const port of portsWithStructuredInput) {
			const contract = getContract(port as PortNumber);
			const fieldCount = countSchemaFields(contract.inputSchema);
			expect(fieldCount).toBeGreaterThanOrEqual(1);
		}
	});

	it('Port 0 and Port 2 use z.unknown() for flexible input', () => {
		const port0 = getContract(0);
		const port2 = getContract(2);
		// z.unknown() has no shape - verify it's intentionally flexible
		expect(countSchemaFields(port0.inputSchema)).toBe(0);
		expect(countSchemaFields(port2.inputSchema)).toBe(0);
	});

	it('all outputSchemas have at least 2 fields', () => {
		for (let port = 0; port < 8; port++) {
			const contract = getContract(port as PortNumber);
			const fieldCount = countSchemaFields(contract.outputSchema);
			expect(fieldCount).toBeGreaterThanOrEqual(2);
		}
	});
});
