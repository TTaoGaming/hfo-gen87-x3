/**
 * HFO Port Contract Tests
 * ========================
 *
 * Tests the Galois Lattice behavioral contracts using:
 * - Vitest for unit tests
 * - fast-check for property-based testing
 * - Zod for contract validation
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { RED_REGNANT_PROPERTY_RUNS } from '../../quarantine/shared/test-budget.js';

import {
	type HIVEPhase,
	PORT_METADATA,
	type PortNumber,
	getAntiDiagonalPair,
	getCommander,
	getHIVEPhase,
	getHIVEPorts,
	getVerb,
} from '../contracts/hfo-ports.js';

import {
	GALOIS_LATTICE,
	PORT_CONTRACTS,
	getMantra,
	isCapable,
	isProhibited,
	validatePortAction,
} from '../contracts/port-contracts.js';

// ============================================================================
// PORT METADATA TESTS
// ============================================================================

describe('PORT_METADATA', () => {
	it('should have exactly 8 ports', () => {
		expect(Object.keys(PORT_METADATA)).toHaveLength(8);
	});

	it('each port should have all required fields', () => {
		for (let port = 0; port < 8; port++) {
			const metadata = PORT_METADATA[port as PortNumber];
			expect(metadata.portNumber).toBe(port);
			expect(metadata.commander).toBeDefined();
			expect(metadata.verb).toBeDefined();
			expect(metadata.hivePhase).toMatch(/^[HIVE]$/);
			expect(metadata.antiDiagonalPair).toBe(7 - port);
			expect(metadata.mantra).toContain('do we');
		}
	});
});

// ============================================================================
// GALOIS LATTICE PROPERTY TESTS
// ============================================================================

describe('Galois Lattice Properties', () => {
	// Arbitrary for port numbers (0-7)
	const portArb = fc.integer({ min: 0, max: 7 }) as fc.Arbitrary<PortNumber>;

	it('anti-diagonal pairs always sum to 7', () => {
		fc.assert(
			fc.property(portArb, (port) => {
				const pair = getAntiDiagonalPair(port);
				return port + pair === 7;
			}),
			{ numRuns: RED_REGNANT_PROPERTY_RUNS },
		);
	});

	it('HIVE ports are symmetric (both ports map to same phase)', () => {
		const phases: HIVEPhase[] = ['H', 'I', 'V', 'E'];
		for (const phase of phases) {
			const [p1, p2] = getHIVEPorts(phase);
			expect(getHIVEPhase(p1)).toBe(phase);
			expect(getHIVEPhase(p2)).toBe(phase);
			expect(p1 + p2).toBe(7); // Anti-diagonal
		}
	});

	it('diagonal quines are self-referential', () => {
		for (let port = 0; port < 8; port++) {
			const question = GALOIS_LATTICE.getQuestion(port as PortNumber, port as PortNumber);
			const verb = getVerb(port as PortNumber);
			// Should contain verb twice (e.g., "SENSE the SENSE")
			expect(question).toContain(`${verb} the ${verb}`);
		}
	});

	it('off-diagonal cards combine different verbs', () => {
		fc.assert(
			fc.property(portArb, portArb, (row, col) => {
				fc.pre(row !== col); // Skip diagonal
				const question = GALOIS_LATTICE.getQuestion(row, col);
				const rowVerb = getVerb(row);
				const colVerb = getVerb(col);
				return question.includes(rowVerb) && question.includes(colVerb);
			}),
			{ numRuns: RED_REGNANT_PROPERTY_RUNS },
		);
	});
});

// ============================================================================
// BEHAVIORAL CONTRACT TESTS
// ============================================================================

describe('Port Behavioral Contracts', () => {
	describe('Port 0 (SENSE) - Lidless Legion', () => {
		it('can observe and tag', () => {
			expect(isCapable(0, 'read')).toBe(true);
			expect(isCapable(0, 'tag')).toBe(true);
		});

		it('cannot modify data', () => {
			expect(isProhibited(0, 'modify_data')).toBe(true);
			expect(isProhibited(0, 'transform')).toBe(true);
		});

		it('validates action correctly', () => {
			const readResult = validatePortAction(0, 'read');
			expect(readResult.valid).toBe(true);

			const modifyResult = validatePortAction(0, 'modify_data');
			expect(modifyResult.valid).toBe(false);
			expect(modifyResult.reason).toContain('Lidless Legion');
		});
	});

	describe('Port 1 (FUSE) - Web Weaver', () => {
		it('can validate and compose', () => {
			expect(isCapable(1, 'validate')).toBe(true);
			expect(isCapable(1, 'compose')).toBe(true);
			expect(isCapable(1, 'route')).toBe(true);
		});

		it('cannot persist or make strategic decisions', () => {
			expect(isProhibited(1, 'persist')).toBe(true);
			expect(isProhibited(1, 'make_decisions')).toBe(true);
		});
	});

	describe('Port 2 (SHAPE) - Mirror Magus', () => {
		it('can transform structure', () => {
			expect(isCapable(2, 'transform')).toBe(true);
		});

		it('is a pure function (no side effects)', () => {
			expect(isProhibited(2, 'persist')).toBe(true);
			expect(isProhibited(2, 'emit_output')).toBe(true);
			expect(isProhibited(2, 'invoke_external')).toBe(true);
		});
	});

	describe('Port 3 (DELIVER) - Spore Storm', () => {
		it('can emit and invoke external systems', () => {
			expect(isCapable(3, 'emit_output')).toBe(true);
			expect(isCapable(3, 'invoke_external')).toBe(true);
		});

		it('cannot decide WHERE to deliver', () => {
			expect(isProhibited(3, 'make_decisions')).toBe(true);
		});
	});

	describe('Port 4 (TEST) - Red Regnant', () => {
		it('can validate with zero trust', () => {
			expect(isCapable(4, 'validate')).toBe(true);
			expect(isCapable(4, 'invoke')).toBe(true);
		});

		it('cannot modify production data', () => {
			expect(isProhibited(4, 'modify_data')).toBe(true);
			expect(isProhibited(4, 'persist')).toBe(true);
		});
	});

	describe('Port 5 (DEFEND) - Pyre Praetorian', () => {
		it('can gate access', () => {
			expect(isCapable(5, 'gate')).toBe(true);
		});

		it('is a pure gate (no modifications)', () => {
			expect(isProhibited(5, 'modify_data')).toBe(true);
			expect(isProhibited(5, 'transform')).toBe(true);
		});
	});

	describe('Port 6 (STORE) - Kraken Keeper', () => {
		it('can persist and read', () => {
			expect(isCapable(6, 'persist')).toBe(true);
			expect(isCapable(6, 'read')).toBe(true);
		});

		it('does not process or transform', () => {
			expect(isProhibited(6, 'transform')).toBe(true);
			expect(isProhibited(6, 'validate')).toBe(true);
		});
	});

	describe('Port 7 (DECIDE) - Spider Sovereign', () => {
		it('can orchestrate and route', () => {
			expect(isCapable(7, 'route')).toBe(true);
			expect(isCapable(7, 'compose')).toBe(true);
		});

		it('delegates execution (never executes directly)', () => {
			expect(isProhibited(7, 'emit_output')).toBe(true);
			expect(isProhibited(7, 'invoke_external')).toBe(true);
			expect(isProhibited(7, 'transform')).toBe(true);
		});
	});
});

// ============================================================================
// COMMANDER INVARIANTS (Property Tests)
// ============================================================================

describe('Commander Invariants (100+ iterations)', () => {
	const portArb = fc.integer({ min: 0, max: 7 }) as fc.Arbitrary<PortNumber>;

	it('every port has a unique commander', () => {
		const commanders = new Set<string>();
		for (let port = 0; port < 8; port++) {
			const commander = getCommander(port as PortNumber);
			expect(commanders.has(commander)).toBe(false);
			commanders.add(commander);
		}
		expect(commanders.size).toBe(8);
	});

	it('every port has a unique verb', () => {
		const verbs = new Set<string>();
		for (let port = 0; port < 8; port++) {
			const verb = getVerb(port as PortNumber);
			expect(verbs.has(verb)).toBe(false);
			verbs.add(verb);
		}
		expect(verbs.size).toBe(8);
	});

	it('mantra contains the verb twice (self-reference)', () => {
		fc.assert(
			fc.property(portArb, (port) => {
				const mantra = getMantra(port);
				const verb = getVerb(port);
				// Count occurrences
				const regex = new RegExp(verb, 'g');
				const matches = mantra.match(regex);
				return matches !== null && matches.length >= 2;
			}),
			{ numRuns: RED_REGNANT_PROPERTY_RUNS },
		);
	});

	it('behavioral contracts have non-empty capabilities', () => {
		fc.assert(
			fc.property(portArb, (port) => {
				const contract = PORT_CONTRACTS[port];
				return contract.capabilities.length > 0;
			}),
			{ numRuns: RED_REGNANT_PROPERTY_RUNS },
		);
	});

	it('behavioral contracts have non-empty prohibitions', () => {
		fc.assert(
			fc.property(portArb, (port) => {
				const contract = PORT_CONTRACTS[port];
				return contract.prohibitions.length > 0;
			}),
			{ numRuns: RED_REGNANT_PROPERTY_RUNS },
		);
	});

	it('capabilities and prohibitions are disjoint', () => {
		fc.assert(
			fc.property(portArb, (port) => {
				const contract = PORT_CONTRACTS[port];
				const capSet = new Set(contract.capabilities);
				const prohibSet = new Set(contract.prohibitions);
				// No overlap
				for (const cap of capSet) {
					if (prohibSet.has(cap as any)) return false;
				}
				return true;
			}),
			{ numRuns: RED_REGNANT_PROPERTY_RUNS },
		);
	});
});

// ============================================================================
// HIVE PHASE INVARIANTS
// ============================================================================

describe('HIVE Phase Invariants', () => {
	it('all phases have exactly 2 ports', () => {
		const phases: HIVEPhase[] = ['H', 'I', 'V', 'E'];
		for (const phase of phases) {
			const ports = getHIVEPorts(phase);
			expect(ports).toHaveLength(2);
		}
	});

	it('phase ports are anti-diagonal pairs', () => {
		expect(getHIVEPorts('H')).toEqual([0, 7]);
		expect(getHIVEPorts('I')).toEqual([1, 6]);
		expect(getHIVEPorts('V')).toEqual([2, 5]);
		expect(getHIVEPorts('E')).toEqual([3, 4]);
	});

	it('each port belongs to exactly one HIVE phase', () => {
		const portPhaseMap = new Map<PortNumber, HIVEPhase>();
		const phases: HIVEPhase[] = ['H', 'I', 'V', 'E'];

		for (const phase of phases) {
			const [p1, p2] = getHIVEPorts(phase);
			expect(portPhaseMap.has(p1)).toBe(false);
			expect(portPhaseMap.has(p2)).toBe(false);
			portPhaseMap.set(p1, phase);
			portPhaseMap.set(p2, phase);
		}

		expect(portPhaseMap.size).toBe(8);
	});
});
