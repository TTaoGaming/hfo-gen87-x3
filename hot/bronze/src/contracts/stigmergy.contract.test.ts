/**
 * @fileoverview Tests for Universal Stigmergy Signal Contract
 *
 * Tests all 8 gates (G0-G7) for the stigmergy signal format.
 * Uses property-based testing with fast-check for thorough validation.
 *
 * @module contracts/stigmergy.contract.test
 * @hive V (Validate)
 * @tdd GREEN
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
	HIVE_PHASES,
	MAX_PORT,
	MIN_GENERATION,
	PULL_DIRECTIONS,
	SIGNAL_TYPES,
	type StigmergySignal,
	createHiveSignal,
	createSignal,
	deserializeSignal,
	getCommander,
	isValidSignal,
	safeDeserializeSignal,
	safeParseSignal,
	serializeSignal,
	validateSignal,
	validateSignalStrict,
	validateSignalWithArchetypes,
} from './stigmergy.contract.js';

// ============================================================================
// TEST DATA GENERATORS (fast-check arbitraries)
// ============================================================================

/** Generate valid ISO8601 timestamps */
const validTimestamp = fc.date().map((d) => d.toISOString());

/** Generate valid mark values */
const validMark = fc.float({ min: 0, max: 1, noNaN: true });

/** Generate valid pull directions */
const validPull = fc.constantFrom(...PULL_DIRECTIONS);

/** Generate valid messages */
const validMsg = fc.string({ minLength: 1, maxLength: 1000 });

/** Generate valid types */
const validType = fc.constantFrom(...SIGNAL_TYPES);

/** Generate valid HIVE phases */
const validHive = fc.constantFrom(...HIVE_PHASES);

/** Generate valid generations */
const validGen = fc.integer({ min: MIN_GENERATION, max: 9999 });

/** Generate valid ports */
const validPort = fc.integer({ min: 0, max: MAX_PORT });

/** Generate complete valid signals */
const validSignal = fc.record({
	ts: validTimestamp,
	mark: validMark,
	pull: validPull,
	msg: validMsg,
	type: validType,
	hive: validHive,
	gen: validGen,
	port: validPort,
});

// ============================================================================
// G0: TIMESTAMP GATE TESTS
// ============================================================================

describe('G0: Timestamp Gate', () => {
	it('should accept valid ISO8601 timestamps', () => {
		fc.assert(
			fc.property(validTimestamp, (ts) => {
				const signal = createSignal({ msg: 'test', ts });
				expect(isValidSignal(signal)).toBe(true);
			}),
		);
	});

	it('should reject invalid timestamp formats', () => {
		const invalidTimestamps = [
			'2025-12-30', // Missing time
			'2025-12-30T16:00:00', // Missing Z
			'2025/12/30T16:00:00Z', // Wrong separator
			'not-a-date',
			'',
			123,
			null,
			undefined,
		];

		for (const ts of invalidTimestamps) {
			const result = validateSignal({ ...createSignal({ msg: 'test' }), ts });
			expect(result.gates.find((g) => g.gate === 'G0')?.passed).toBe(false);
		}
	});

	it('should accept timestamps with milliseconds', () => {
		const ts = '2025-12-30T16:00:00.123Z';
		const signal = createSignal({ msg: 'test', ts });
		expect(isValidSignal(signal)).toBe(true);
	});
});

// ============================================================================
// G1: MARK GATE TESTS
// ============================================================================

describe('G1: Mark Gate', () => {
	it('should accept marks in range [0, 1]', () => {
		fc.assert(
			fc.property(validMark, (mark) => {
				const signal = createSignal({ msg: 'test', mark });
				expect(isValidSignal(signal)).toBe(true);
			}),
		);
	});

	it('should accept boundary values 0 and 1', () => {
		expect(isValidSignal(createSignal({ msg: 'test', mark: 0 }))).toBe(true);
		expect(isValidSignal(createSignal({ msg: 'test', mark: 1 }))).toBe(true);
		expect(isValidSignal(createSignal({ msg: 'test', mark: 0.5 }))).toBe(true);
	});

	it('should reject marks outside range', () => {
		const invalidMarks = [-0.1, 1.1, -1, 2, 100];
		for (const mark of invalidMarks) {
			const result = validateSignal({ ...createSignal({ msg: 'test' }), mark });
			expect(result.gates.find((g) => g.gate === 'G1')?.passed).toBe(false);
		}
	});

	it('should reject non-numeric marks', () => {
		const invalidMarks = ['0.5', null, undefined, Number.NaN];
		for (const mark of invalidMarks) {
			const result = validateSignal({ ...createSignal({ msg: 'test' }), mark });
			expect(result.gates.find((g) => g.gate === 'G1')?.passed).toBe(false);
		}
	});
});

// ============================================================================
// G2: PULL GATE TESTS
// ============================================================================

describe('G2: Pull Gate', () => {
	it('should accept all valid pull directions', () => {
		for (const pull of PULL_DIRECTIONS) {
			const signal = createSignal({ msg: 'test', pull });
			expect(isValidSignal(signal)).toBe(true);
		}
	});

	it('should reject invalid pull values', () => {
		const invalidPulls = ['up', 'down', 'left', 'right', '', 123, null];
		for (const pull of invalidPulls) {
			const result = validateSignal({ ...createSignal({ msg: 'test' }), pull });
			expect(result.gates.find((g) => g.gate === 'G2')?.passed).toBe(false);
		}
	});
});

// ============================================================================
// G3: MESSAGE GATE TESTS
// ============================================================================

describe('G3: Message Gate', () => {
	it('should accept non-empty strings', () => {
		fc.assert(
			fc.property(fc.string({ minLength: 1 }), (msg) => {
				const signal = createSignal({ msg });
				expect(isValidSignal(signal)).toBe(true);
			}),
		);
	});

	it('should reject empty strings', () => {
		const result = validateSignal({ ...createSignal({ msg: 'temp' }), msg: '' });
		expect(result.gates.find((g) => g.gate === 'G3')?.passed).toBe(false);
	});

	it('should reject non-string messages', () => {
		const invalidMsgs = [123, null, undefined, {}, []];
		for (const msg of invalidMsgs) {
			const result = validateSignal({ ...createSignal({ msg: 'temp' }), msg });
			expect(result.gates.find((g) => g.gate === 'G3')?.passed).toBe(false);
		}
	});
});

// ============================================================================
// G4: TYPE GATE TESTS
// ============================================================================

describe('G4: Type Gate', () => {
	it('should accept all valid signal types', () => {
		for (const type of SIGNAL_TYPES) {
			const signal = createSignal({ msg: 'test', type });
			expect(isValidSignal(signal)).toBe(true);
		}
	});

	it('should reject invalid types', () => {
		const invalidTypes = ['info', 'warning', 'debug', '', 123, null];
		for (const type of invalidTypes) {
			const result = validateSignal({ ...createSignal({ msg: 'test' }), type });
			expect(result.gates.find((g) => g.gate === 'G4')?.passed).toBe(false);
		}
	});
});

// ============================================================================
// G5: HIVE GATE TESTS
// ============================================================================

describe('G5: HIVE Gate', () => {
	it('should accept all valid HIVE phases', () => {
		for (const hive of HIVE_PHASES) {
			const signal = createSignal({ msg: 'test', hive });
			expect(isValidSignal(signal)).toBe(true);
		}
	});

	it('should reject invalid HIVE values', () => {
		const invalidHives = ['h', 'hunt', 'HUNT', 'A', 'Z', '', 1, null];
		for (const hive of invalidHives) {
			const result = validateSignal({ ...createSignal({ msg: 'test' }), hive });
			expect(result.gates.find((g) => g.gate === 'G5')?.passed).toBe(false);
		}
	});
});

// ============================================================================
// G6: GENERATION GATE TESTS
// ============================================================================

describe('G6: Generation Gate', () => {
	it('should accept generations >= MIN_GENERATION', () => {
		fc.assert(
			fc.property(validGen, (gen) => {
				const signal = createSignal({ msg: 'test', gen });
				expect(isValidSignal(signal)).toBe(true);
			}),
		);
	});

	it('should reject generations below MIN_GENERATION', () => {
		const invalidGens = [0, 1, 50, 86, MIN_GENERATION - 1];
		for (const gen of invalidGens) {
			const result = validateSignal({ ...createSignal({ msg: 'test' }), gen });
			expect(result.gates.find((g) => g.gate === 'G6')?.passed).toBe(false);
		}
	});

	it('should reject non-integer generations', () => {
		const invalidGens = [87.5, 88.1, '87', null];
		for (const gen of invalidGens) {
			const result = validateSignal({ ...createSignal({ msg: 'test' }), gen });
			expect(result.gates.find((g) => g.gate === 'G6')?.passed).toBe(false);
		}
	});
});

// ============================================================================
// G7: PORT GATE TESTS
// ============================================================================

describe('G7: Port Gate', () => {
	it('should accept ports 0-7', () => {
		for (let port = 0; port <= MAX_PORT; port++) {
			const signal = createSignal({ msg: 'test', port });
			expect(isValidSignal(signal)).toBe(true);
		}
	});

	it('should reject ports outside 0-7', () => {
		const invalidPorts = [-1, 8, 9, 100];
		for (const port of invalidPorts) {
			const result = validateSignal({ ...createSignal({ msg: 'test' }), port });
			expect(result.gates.find((g) => g.gate === 'G7')?.passed).toBe(false);
		}
	});

	it('should reject non-integer ports', () => {
		const invalidPorts = [0.5, 3.7, '0', null];
		for (const port of invalidPorts) {
			const result = validateSignal({ ...createSignal({ msg: 'test' }), port });
			expect(result.gates.find((g) => g.gate === 'G7')?.passed).toBe(false);
		}
	});
});

// ============================================================================
// COMPOSITE VALIDATION TESTS
// ============================================================================

describe('Composite Validation', () => {
	it('should validate complete signals (property test)', () => {
		fc.assert(
			fc.property(validSignal, (signal) => {
				expect(isValidSignal(signal)).toBe(true);
				const result = validateSignal(signal);
				expect(result.valid).toBe(true);
				expect(result.passedCount).toBe(8);
				expect(result.failedCount).toBe(0);
			}),
			{ numRuns: 100 },
		);
	});

	it('should reject non-object inputs', () => {
		const invalidInputs = [null, undefined, 'string', 123, []];
		for (const input of invalidInputs) {
			const result = validateSignal(input);
			expect(result.valid).toBe(false);
		}
	});

	it('should track all failed gates in quarantine reason', () => {
		const result = validateSignal({
			ts: 'invalid',
			mark: -1,
			pull: 'wrong',
			msg: '',
			type: 'invalid',
			hive: 'Z',
			gen: 50,
			port: 10,
		});

		expect(result.valid).toBe(false);
		expect(result.failedCount).toBe(8);
		expect(result.quarantineReason).toContain('G0');
		expect(result.quarantineReason).toContain('G7');
	});
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('Factory Functions', () => {
	describe('createSignal', () => {
		it('should create valid signal with defaults', () => {
			const signal = createSignal({ msg: 'Test message' });
			expect(isValidSignal(signal)).toBe(true);
			expect(signal.msg).toBe('Test message');
			expect(signal.mark).toBe(1.0);
			expect(signal.pull).toBe('downstream');
		});

		it('should allow overriding all fields', () => {
			const signal = createSignal({
				msg: 'Custom',
				mark: 0.5,
				pull: 'upstream',
				type: 'error',
				hive: 'E',
				gen: 88,
				port: 3,
			});
			expect(signal.mark).toBe(0.5);
			expect(signal.pull).toBe('upstream');
			expect(signal.type).toBe('error');
			expect(signal.hive).toBe('E');
			expect(signal.gen).toBe(88);
			expect(signal.port).toBe(3);
		});
	});

	describe('createHiveSignal', () => {
		it('should map HIVE phases to correct ports', () => {
			const huntSignal = createHiveSignal('H', 'Hunt phase');
			expect(huntSignal.port).toBe(0);

			const interlockSignal = createHiveSignal('I', 'Interlock phase');
			expect(interlockSignal.port).toBe(1);

			const validateSignalResult = createHiveSignal('V', 'Validate phase');
			expect(validateSignalResult.port).toBe(2);

			const evolveSignal = createHiveSignal('E', 'Evolve phase');
			expect(evolveSignal.port).toBe(3);

			const emergencySignal = createHiveSignal('X', 'Emergency');
			expect(emergencySignal.port).toBe(7);
		});
	});
});

// ============================================================================
// SERIALIZATION TESTS
// ============================================================================

describe('Serialization', () => {
	it('should serialize and deserialize signals', () => {
		fc.assert(
			fc.property(validSignal, (signal) => {
				const json = serializeSignal(signal as StigmergySignal);
				const parsed = deserializeSignal(json);
				expect(parsed).toEqual(signal);
			}),
			{ numRuns: 50 },
		);
	});

	it('should handle safe deserialization of invalid JSON', () => {
		expect(safeDeserializeSignal('not json')).toBeNull();
		expect(safeDeserializeSignal('{"invalid": true}')).toBeNull();
	});

	it('should produce JSONL-compatible output', () => {
		const signal = createSignal({ msg: 'Test' });
		const json = serializeSignal(signal);
		expect(json).not.toContain('\n');
		expect(() => JSON.parse(json)).not.toThrow();
	});
});

// ============================================================================
// COMMANDER MAPPING TESTS
// ============================================================================

describe('Commander Mapping', () => {
	it('should return commander for valid ports', () => {
		for (let port = 0; port <= 7; port++) {
			const commander = getCommander(port);
			expect(commander).toBeDefined();
			expect(commander?.name).toBeTruthy();
			expect(commander?.verb).toBeTruthy();
		}
	});

	it('should return undefined for invalid ports', () => {
		expect(getCommander(-1)).toBeUndefined();
		expect(getCommander(8)).toBeUndefined();
	});

	it('should have correct commander names', () => {
		expect(getCommander(0)?.name).toBe('Lidless Legion');
		expect(getCommander(7)?.name).toBe('Spider Sovereign');
	});

	it('should return undefined for boundary edge cases (mutation killer)', () => {
		// These specifically kill the port < 0 || port > 7 mutations
		expect(getCommander(-1)).toBeUndefined();
		expect(getCommander(-100)).toBeUndefined();
		expect(getCommander(8)).toBeUndefined();
		expect(getCommander(100)).toBeUndefined();
		// Verify boundary is exactly 0-7
		expect(getCommander(0)).toBeDefined();
		expect(getCommander(7)).toBeDefined();
	});
});

// ============================================================================
// STRICT VALIDATION TESTS (mutation killers for uncovered functions)
// ============================================================================

describe('Strict Validation (validateSignalStrict)', () => {
	it('should return valid signal when all gates pass', () => {
		const input = createSignal({ msg: 'Valid signal' });
		const result = validateSignalStrict(input);
		expect(result).toBeDefined();
		expect(result.msg).toBe('Valid signal');
	});

	it('should throw GATE_VIOLATION on invalid input', () => {
		const invalid = { ...createSignal({ msg: 'test' }), ts: 'invalid-timestamp' };
		expect(() => validateSignalStrict(invalid)).toThrow('GATE_VIOLATION');
	});

	it('should include gate details in error message', () => {
		const invalid = { ...createSignal({ msg: 'test' }), ts: 'bad', mark: -1 };
		try {
			validateSignalStrict(invalid);
			expect.fail('Should have thrown');
		} catch (e) {
			const msg = (e as Error).message;
			expect(msg).toContain('G0');
			expect(msg).toContain('G1');
			expect(msg).toContain('ts');
			expect(msg).toContain('mark');
		}
	});

	it('should filter and map failed gates correctly (mutation killer)', () => {
		const invalid = { ...createSignal({ msg: 'test' }), port: 99 };
		try {
			validateSignalStrict(invalid);
			expect.fail('Should have thrown');
		} catch (e) {
			const msg = (e as Error).message;
			// Verify the filter/map chain produces correct output format
			expect(msg).toMatch(/G7.*port/);
		}
	});
});

// ============================================================================
// FULL VALIDATION TESTS (mutation killers for validateSignalWithArchetypes)
// ============================================================================

describe('Full Validation (validateSignalWithArchetypes)', () => {
	it('should return complete validation result for valid signal', () => {
		const input = createSignal({ msg: 'Valid', hive: 'H', port: 0 });
		const result = validateSignalWithArchetypes(input);
		
		expect(result.gateResult).toBeDefined();
		expect(result.archetypeResult).toBeDefined();
		expect(result.fullyValid).toBe(true);
		expect(result.enforcementReport).toBeDefined();
	});

	it('should return fullyValid=false when gates fail', () => {
		const invalid = { ...createSignal({ msg: 'test' }), ts: 'invalid' };
		const result = validateSignalWithArchetypes(invalid);
		
		expect(result.fullyValid).toBe(false);
		expect(result.gateResult.valid).toBe(false);
	});

	it('should return fullyValid=false when archetype validation fails', () => {
		// Invalid gen (below MIN_GENERATION) will fail archetype validation
		const invalid = { ...createSignal({ msg: 'test' }), gen: 50 };
		const result = validateSignalWithArchetypes(invalid);
		
		// Both gates and archetype should fail for invalid gen
		expect(result.fullyValid).toBe(false);
	});

	it('should use AND logic for fullyValid (mutation killer)', () => {
		// This kills the && to || mutation
		const gatesPass = createSignal({ msg: 'test', hive: 'H', port: 0 });
		const resultBothPass = validateSignalWithArchetypes(gatesPass);
		expect(resultBothPass.fullyValid).toBe(true);
		
		const gatesFail = { ...createSignal({ msg: 'test' }), ts: 'bad' };
		const resultGatesFail = validateSignalWithArchetypes(gatesFail);
		expect(resultGatesFail.fullyValid).toBe(false);
	});
});

// ============================================================================
// SAFE PARSE TESTS (mutation killers for safeParseSignal)
// ============================================================================

describe('Safe Parse (safeParseSignal)', () => {
	it('should return success for valid signals', () => {
		const signal = createSignal({ msg: 'Test' });
		const result = safeParseSignal(signal);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.msg).toBe('Test');
		}
	});

	it('should return error for invalid signals', () => {
		const invalid = { ts: 'bad', mark: 'not a number' };
		const result = safeParseSignal(invalid);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors.length).toBeGreaterThan(0);
		}
	});
});

// ============================================================================
// TIMESTAMP REGEX EDGE CASES (mutation killers for regex anchors)
// ============================================================================

describe('Timestamp Regex Edge Cases', () => {
	it('should reject timestamps with garbage prefix (kills ^ anchor mutation)', () => {
		const invalidWithPrefix = 'garbage2025-12-30T16:00:00Z';
		const result = validateSignal({ ...createSignal({ msg: 'test' }), ts: invalidWithPrefix });
		expect(result.gates.find((g) => g.gate === 'G0')?.passed).toBe(false);
	});

	it('should reject timestamps with garbage suffix (kills $ anchor mutation)', () => {
		const invalidWithSuffix = '2025-12-30T16:00:00Zgarbage';
		const result = validateSignal({ ...createSignal({ msg: 'test' }), ts: invalidWithSuffix });
		expect(result.gates.find((g) => g.gate === 'G0')?.passed).toBe(false);
	});

	it('should reject timestamps with wrong millisecond format', () => {
		// This kills the \\d{3} to \\d and \\D{3} mutations
		const invalidMs = '2025-12-30T16:00:00.XZ'; // non-digit
		const result = validateSignal({ ...createSignal({ msg: 'test' }), ts: invalidMs });
		expect(result.gates.find((g) => g.gate === 'G0')?.passed).toBe(false);
	});
});

// ============================================================================
// ERROR MESSAGE ASSERTIONS (mutation killers for errorMap mutations)
// ============================================================================

describe('Error Messages (mutation killers)', () => {
	it('should include gate identifier in G2 error', () => {
		const result = validateSignal({ ...createSignal({ msg: 'test' }), pull: 'invalid' });
		const g2 = result.gates.find((g) => g.gate === 'G2');
		expect(g2?.error).toContain('G2');
	});

	it('should include gate identifier in G4 error', () => {
		const result = validateSignal({ ...createSignal({ msg: 'test' }), type: 'invalid' });
		const g4 = result.gates.find((g) => g.gate === 'G4');
		expect(g4?.error).toContain('G4');
	});

	it('should include gate identifier in G5 error', () => {
		const result = validateSignal({ ...createSignal({ msg: 'test' }), hive: 'Z' });
		const g5 = result.gates.find((g) => g.gate === 'G5');
		expect(g5?.error).toContain('G5');
	});

	it('should include valid options in error messages', () => {
		const result = validateSignal({ ...createSignal({ msg: 'test' }), pull: 'wrong' });
		const g2 = result.gates.find((g) => g.gate === 'G2');
		expect(g2?.error).toContain('upstream');
		expect(g2?.error).toContain('downstream');
		expect(g2?.error).toContain('lateral');
	});
});

// ============================================================================
// GATES ARRAY STRUCTURE (mutation killers for filter/passedCount)
// ============================================================================

describe('Gates Array Structure', () => {
	it('should correctly count passed gates', () => {
		const valid = createSignal({ msg: 'test' });
		const result = validateSignal(valid);
		expect(result.passedCount).toBe(8);
		expect(result.failedCount).toBe(0);
		expect(result.gates.filter((g) => g.passed).length).toBe(8);
	});

	it('should correctly count failed gates', () => {
		const invalid = { ts: 'bad', mark: -1, pull: 'x', msg: '', type: 'x', hive: 'Z', gen: 1, port: 99 };
		const result = validateSignal(invalid);
		expect(result.passedCount).toBe(0);
		expect(result.failedCount).toBe(8);
		expect(result.gates.filter((g) => !g.passed).length).toBe(8);
	});

	it('should have exactly 8 gates in result', () => {
		const result = validateSignal(createSignal({ msg: 'test' }));
		expect(result.gates.length).toBe(8);
	});
});
