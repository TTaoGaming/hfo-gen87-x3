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
// @ts-nocheck


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
	serializeSignal,
	validateSignal,
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
});
