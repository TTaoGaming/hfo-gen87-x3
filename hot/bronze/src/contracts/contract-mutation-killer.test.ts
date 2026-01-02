/**
 * Contract Schema Mutation Killer Tests
 * =====================================
 *
 * Kill all surviving ObjectLiteral mutations in contracts
 */

import { describe, expect, it } from 'vitest';
import hfoPorts, { HFOPortMetadataSchema, PORT_METADATA } from './hfo-ports.js';
import portContracts, {
	GALOIS_LATTICE,
	PORT_CONTRACTS,
	validatePortAction,
} from './port-contracts.js';

// ============================================================================
// HFO-PORTS.TS - SCHEMA MUTATION KILLERS
// ============================================================================

describe('HFOPortMetadataSchema - Mutation Killers', () => {
	it('REJECTS empty object (kills ObjectLiteral mutation)', () => {
		const result = HFOPortMetadataSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('REQUIRES portNumber field', () => {
		const result = HFOPortMetadataSchema.safeParse({
			commander: 'Lidless Legion',
			verb: 'SENSE',
			hivePhase: 'H',
			antiDiagonalPair: 7,
			mantra: 'test',
		});
		expect(result.success).toBe(false);
	});

	it('REQUIRES commander field', () => {
		const result = HFOPortMetadataSchema.safeParse({
			portNumber: 0,
			verb: 'SENSE',
			hivePhase: 'H',
			antiDiagonalPair: 7,
			mantra: 'test',
		});
		expect(result.success).toBe(false);
	});

	it('REQUIRES verb field', () => {
		const result = HFOPortMetadataSchema.safeParse({
			portNumber: 0,
			commander: 'Lidless Legion',
			hivePhase: 'H',
			antiDiagonalPair: 7,
			mantra: 'test',
		});
		expect(result.success).toBe(false);
	});

	it('REQUIRES hivePhase field', () => {
		const result = HFOPortMetadataSchema.safeParse({
			portNumber: 0,
			commander: 'Lidless Legion',
			verb: 'SENSE',
			antiDiagonalPair: 7,
			mantra: 'test',
		});
		expect(result.success).toBe(false);
	});

	it('REQUIRES antiDiagonalPair field', () => {
		const result = HFOPortMetadataSchema.safeParse({
			portNumber: 0,
			commander: 'Lidless Legion',
			verb: 'SENSE',
			hivePhase: 'H',
			mantra: 'test',
		});
		expect(result.success).toBe(false);
	});

	it('REQUIRES mantra field', () => {
		const result = HFOPortMetadataSchema.safeParse({
			portNumber: 0,
			commander: 'Lidless Legion',
			verb: 'SENSE',
			hivePhase: 'H',
			antiDiagonalPair: 7,
		});
		expect(result.success).toBe(false);
	});

	it('ACCEPTS valid complete object', () => {
		const result = HFOPortMetadataSchema.safeParse({
			portNumber: 0,
			commander: 'Lidless Legion',
			verb: 'SENSE',
			hivePhase: 'H',
			antiDiagonalPair: 7,
			mantra: 'How do we SENSE the SENSE?',
		});
		expect(result.success).toBe(true);
	});

	it('VALIDATES all PORT_METADATA entries against schema', () => {
		for (let i = 0; i < 8; i++) {
			const metadata = PORT_METADATA[i as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
			const result = HFOPortMetadataSchema.safeParse(metadata);
			expect(result.success, `PORT_METADATA[${i}] should be valid`).toBe(true);
		}
	});
});

describe('hfo-ports default export - Mutation Killers', () => {
	it('default export has PORT_METADATA', () => {
		expect(hfoPorts.PORT_METADATA).toBeDefined();
		expect(hfoPorts.PORT_METADATA).toEqual(PORT_METADATA);
	});

	it('default export has getAntiDiagonalPair', () => {
		expect(hfoPorts.getAntiDiagonalPair).toBeDefined();
		expect(typeof hfoPorts.getAntiDiagonalPair).toBe('function');
		expect(hfoPorts.getAntiDiagonalPair(0)).toBe(7);
	});

	it('default export has getHIVEPhase', () => {
		expect(hfoPorts.getHIVEPhase).toBeDefined();
		expect(typeof hfoPorts.getHIVEPhase).toBe('function');
		expect(hfoPorts.getHIVEPhase(0)).toBe('H');
	});

	it('default export has getHIVEPorts', () => {
		expect(hfoPorts.getHIVEPorts).toBeDefined();
		expect(typeof hfoPorts.getHIVEPorts).toBe('function');
	});

	it('default export has getCommander', () => {
		expect(hfoPorts.getCommander).toBeDefined();
		expect(typeof hfoPorts.getCommander).toBe('function');
		expect(hfoPorts.getCommander(0)).toBe('Lidless Legion');
	});

	it('default export has getVerb', () => {
		expect(hfoPorts.getVerb).toBeDefined();
		expect(typeof hfoPorts.getVerb).toBe('function');
		expect(hfoPorts.getVerb(0)).toBe('SENSE');
	});

	it('default export is NOT empty object', () => {
		expect(Object.keys(hfoPorts).length).toBeGreaterThan(0);
	});
});

// ============================================================================
// PORT-CONTRACTS.TS - SCHEMA MUTATION KILLERS
// ============================================================================

describe('PORT_CONTRACTS - Mutation Killers', () => {
	it('all ports have valid contracts', () => {
		for (let i = 0; i < 8; i++) {
			const contract = PORT_CONTRACTS[i as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
			expect(contract).toBeDefined();
			expect(contract.port).toBe(i);
			expect(contract.commander).toBeDefined();
			expect(contract.verb).toBeDefined();
			expect(contract.mantra).toBeDefined();
			expect(Array.isArray(contract.capabilities)).toBe(true);
			expect(Array.isArray(contract.prohibitions)).toBe(true);
			expect(Array.isArray(contract.behaviors)).toBe(true);
		}
	});
});

describe('validatePortAction - Mutation Killers', () => {
	it('returns valid:true for allowed capability', () => {
		const result = validatePortAction(0, 'read');
		expect(result.valid).toBe(true);
	});

	it('returns valid:false for prohibited action', () => {
		const result = validatePortAction(0, 'modify_data');
		expect(result.valid).toBe(false);
		expect(result.reason).toContain('prohibited');
	});

	it('returns valid:false for unknown action', () => {
		const result = validatePortAction(0, 'unknown_action_xyz' as any);
		expect(result.valid).toBe(false);
		expect(result.reason).toContain('Unknown action');
	});

	it('prohibition check actually enters the prohibition branch', () => {
		// This kills the ConditionalExpression mutation: if (contract.prohibitions.includes(action)) → if (true)
		const result = validatePortAction(0, 'persist');
		expect(result.valid).toBe(false);
		expect(result.reason).toContain('Lidless Legion');
		expect(result.reason).toContain('prohibited');
		expect(result.reason).toContain('persist');
	});

	it('unknown action returns reason with action name', () => {
		const result = validatePortAction(0, 'completely_fake_action' as any);
		expect(result.reason).toContain('completely_fake_action');
	});
});

describe('port-contracts default export - Mutation Killers', () => {
	it('default export has PORT_CONTRACTS', () => {
		expect(portContracts.PORT_CONTRACTS).toBeDefined();
		expect(portContracts.PORT_CONTRACTS).toEqual(PORT_CONTRACTS);
	});

	it('default export has GALOIS_LATTICE', () => {
		expect(portContracts.GALOIS_LATTICE).toBeDefined();
		expect(portContracts.GALOIS_LATTICE).toEqual(GALOIS_LATTICE);
	});

	it('default export has getContract', () => {
		expect(portContracts.getContract).toBeDefined();
		expect(typeof portContracts.getContract).toBe('function');
	});

	it('default export has isCapable', () => {
		expect(portContracts.isCapable).toBeDefined();
		expect(typeof portContracts.isCapable).toBe('function');
		expect(portContracts.isCapable(0, 'read')).toBe(true);
	});

	it('default export has isProhibited', () => {
		expect(portContracts.isProhibited).toBeDefined();
		expect(typeof portContracts.isProhibited).toBe('function');
		expect(portContracts.isProhibited(0, 'persist')).toBe(true);
	});

	it('default export has getMantra', () => {
		expect(portContracts.getMantra).toBeDefined();
		expect(typeof portContracts.getMantra).toBe('function');
	});

	it('default export has validatePortAction', () => {
		expect(portContracts.validatePortAction).toBeDefined();
		expect(typeof portContracts.validatePortAction).toBe('function');
	});

	it('default export is NOT empty object', () => {
		expect(Object.keys(portContracts).length).toBeGreaterThan(0);
	});
});

// ============================================================================
// PORT INPUT/OUTPUT SCHEMA MUTATION KILLERS (Kill nested ObjectLiteral mutations)
// ============================================================================

describe('Port 4 (TEST) Schema - Nested Object Mutations', () => {
	it('inputSchema.properties REQUIRES name and predicate fields', () => {
		const contract = PORT_CONTRACTS[4];
		const schema = contract.inputSchema;

		// Valid input
		const validInput = {
			subject: {},
			properties: [{ name: 'test', predicate: () => true }],
			iterations: 100,
		};
		expect(schema.safeParse(validInput).success).toBe(true);

		// Missing name in property object (kills ObjectLiteral mutation)
		const missingName = {
			subject: {},
			properties: [{ predicate: () => true }],
			iterations: 100,
		};
		expect(schema.safeParse(missingName).success).toBe(false);

		// Missing predicate in property object (kills ObjectLiteral mutation)
		const missingPredicate = {
			subject: {},
			properties: [{ name: 'test' }],
			iterations: 100,
		};
		expect(schema.safeParse(missingPredicate).success).toBe(false);
	});

	it('outputSchema.results REQUIRES property, passed, iterations fields', () => {
		const contract = PORT_CONTRACTS[4];
		const schema = contract.outputSchema;

		// Valid output
		const validOutput = {
			passed: true,
			results: [{ property: 'test', passed: true, iterations: 100 }],
		};
		expect(schema.safeParse(validOutput).success).toBe(true);

		// Missing property field (kills ObjectLiteral mutation)
		const missingProperty = {
			passed: true,
			results: [{ passed: true, iterations: 100 }],
		};
		expect(schema.safeParse(missingProperty).success).toBe(false);

		// Missing passed field (kills ObjectLiteral mutation)
		const missingPassed = {
			passed: true,
			results: [{ property: 'test', iterations: 100 }],
		};
		expect(schema.safeParse(missingPassed).success).toBe(false);

		// Missing iterations field (kills ObjectLiteral mutation)
		const missingIterations = {
			passed: true,
			results: [{ property: 'test', passed: true }],
		};
		expect(schema.safeParse(missingIterations).success).toBe(false);
	});
});

describe('Port 5 (DEFEND) Schema - Nested Object Mutations', () => {
	it('inputSchema.gates REQUIRES id and check fields', () => {
		const contract = PORT_CONTRACTS[5];
		const schema = contract.inputSchema;

		// Valid input
		const validInput = {
			payload: {},
			gates: [{ id: 'G0', check: () => true }],
		};
		expect(schema.safeParse(validInput).success).toBe(true);

		// Missing id in gate object (kills ObjectLiteral mutation)
		const missingId = {
			payload: {},
			gates: [{ check: () => true }],
		};
		expect(schema.safeParse(missingId).success).toBe(false);

		// Missing check in gate object (kills ObjectLiteral mutation)
		const missingCheck = {
			payload: {},
			gates: [{ id: 'G0' }],
		};
		expect(schema.safeParse(missingCheck).success).toBe(false);
	});
});

describe('Port 7 (DECIDE) Schema - Nested Object Mutations', () => {
	it('inputSchema.context REQUIRES state to be a record', () => {
		const contract = PORT_CONTRACTS[7];
		const schema = contract.inputSchema;

		// Valid input
		const validInput = {
			context: {
				request: {},
				state: { key: 'value' },
			},
			options: [{ id: 'opt1', action: 'do_thing' }],
		};
		expect(schema.safeParse(validInput).success).toBe(true);

		// state must be a record (object), not a primitive (kills ObjectLiteral mutation)
		const stateNotRecord = {
			context: {
				request: {},
				state: 'not-a-record', // String instead of object
			},
			options: [{ id: 'opt1', action: 'do_thing' }],
		};
		expect(schema.safeParse(stateNotRecord).success).toBe(false);

		// state must be present (kills ObjectLiteral mutation)
		const missingState = {
			context: {
				request: {},
			},
			options: [{ id: 'opt1', action: 'do_thing' }],
		};
		expect(schema.safeParse(missingState).success).toBe(false);
	});

	it('inputSchema.options REQUIRES id and action fields', () => {
		const contract = PORT_CONTRACTS[7];
		const schema = contract.inputSchema;

		// Valid input
		const validInput = {
			context: { request: {}, state: {} },
			options: [{ id: 'opt1', action: 'do_thing' }],
		};
		expect(schema.safeParse(validInput).success).toBe(true);

		// Missing id in option (kills ObjectLiteral mutation)
		const missingId = {
			context: { request: {}, state: {} },
			options: [{ action: 'do_thing' }],
		};
		expect(schema.safeParse(missingId).success).toBe(false);

		// Missing action in option (kills ObjectLiteral mutation)
		const missingAction = {
			context: { request: {}, state: {} },
			options: [{ id: 'opt1' }],
		};
		expect(schema.safeParse(missingAction).success).toBe(false);
	});
});
