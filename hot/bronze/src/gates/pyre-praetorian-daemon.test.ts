/**
 * Pyre Praetorian Daemon Tests
 * ============================
 *
 * Port 5 - DEFEND - "How do we DEFEND the DEFEND?"
 *
 * Test cases for HIVE/8 sequence validation:
 *   - G0-G7 gate validation
 *   - HIVE phase transition rules
 *   - Timestamp validation (future, drift, batch)
 *   - Violation detection and categorization
 *
 * @module gates/pyre-praetorian-daemon.test
 * @owner Port 5 - Pyre Praetorian
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	PyrePraetorianDaemon,
	StigmergySignalSchema,
	VALID_TRANSITIONS,
	HIVE_ORDER,
	type StigmergySignal,
	type HIVEViolation,
	type ViolationType,
} from './pyre-praetorian-daemon.js';

// ============================================================================
// TEST UTILITIES
// ============================================================================

let timestampCounter = 0;

/**
 * Create valid signal with unique timestamp
 * Uses counter to ensure unique timestamps in tests
 */
const validSignal = (overrides: Partial<StigmergySignal> = {}): StigmergySignal => {
	timestampCounter++;
	const baseTime = new Date('2026-01-01T00:00:00.000Z').getTime();
	const uniqueTime = new Date(baseTime + timestampCounter * 1000).toISOString();

	return {
		ts: uniqueTime,
		mark: 1.0,
		pull: 'downstream',
		msg: 'Test signal',
		type: 'signal',
		hive: 'H',
		gen: 87,
		port: 7,
		...overrides,
	};
};

// ============================================================================
// SIGNAL SCHEMA TESTS (G0-G7 GATES)
// ============================================================================

describe('StigmergySignalSchema (G0-G7 Gates)', () => {
	describe('G0: ts (timestamp)', () => {
		it('ACCEPTS valid ISO8601 timestamp', () => {
			const signal = validSignal({ ts: '2026-01-01T00:00:00.000Z' });
			expect(StigmergySignalSchema.safeParse(signal).success).toBe(true);
		});

		it('REJECTS invalid timestamp format', () => {
			const signal = validSignal({ ts: 'not-a-timestamp' });
			const result = StigmergySignalSchema.safeParse(signal);
			expect(result.success).toBe(false);
		});

		it('REJECTS empty timestamp', () => {
			const signal = validSignal({ ts: '' });
			const result = StigmergySignalSchema.safeParse(signal);
			expect(result.success).toBe(false);
		});
	});

	describe('G1: mark (confidence)', () => {
		it('ACCEPTS mark in range [0, 1]', () => {
			expect(StigmergySignalSchema.safeParse(validSignal({ mark: 0 })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ mark: 0.5 })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ mark: 1 })).success).toBe(true);
		});

		it('REJECTS mark < 0', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ mark: -0.1 }));
			expect(result.success).toBe(false);
		});

		it('REJECTS mark > 1', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ mark: 1.1 }));
			expect(result.success).toBe(false);
		});
	});

	describe('G2: pull (direction)', () => {
		it('ACCEPTS valid pull values', () => {
			expect(StigmergySignalSchema.safeParse(validSignal({ pull: 'upstream' })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ pull: 'downstream' })).success).toBe(
				true,
			);
			expect(StigmergySignalSchema.safeParse(validSignal({ pull: 'lateral' })).success).toBe(true);
		});

		it('REJECTS invalid pull value', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ pull: 'invalid' as any }));
			expect(result.success).toBe(false);
		});
	});

	describe('G3: msg (message)', () => {
		it('ACCEPTS non-empty message', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ msg: 'Hello' }));
			expect(result.success).toBe(true);
		});

		it('REJECTS empty message', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ msg: '' }));
			expect(result.success).toBe(false);
		});
	});

	describe('G4: type (signal type)', () => {
		it('ACCEPTS valid type values', () => {
			expect(StigmergySignalSchema.safeParse(validSignal({ type: 'signal' })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ type: 'event' })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ type: 'error' })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ type: 'metric' })).success).toBe(true);
		});

		it('REJECTS invalid type', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ type: 'invalid' as any }));
			expect(result.success).toBe(false);
		});
	});

	describe('G5: hive (phase)', () => {
		it('ACCEPTS valid HIVE phases', () => {
			expect(StigmergySignalSchema.safeParse(validSignal({ hive: 'H' })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ hive: 'I' })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ hive: 'V' })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ hive: 'E' })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ hive: 'X' })).success).toBe(true);
		});

		it('REJECTS invalid hive phase', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ hive: 'Z' as any }));
			expect(result.success).toBe(false);
		});
	});

	describe('G6: gen (generation)', () => {
		it('ACCEPTS gen >= 85', () => {
			expect(StigmergySignalSchema.safeParse(validSignal({ gen: 85 })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ gen: 87 })).success).toBe(true);
			expect(StigmergySignalSchema.safeParse(validSignal({ gen: 100 })).success).toBe(true);
		});

		it('REJECTS gen < 85', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ gen: 84 }));
			expect(result.success).toBe(false);
		});

		it('REJECTS non-integer gen', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ gen: 85.5 }));
			expect(result.success).toBe(false);
		});
	});

	describe('G7: port (port number)', () => {
		it('ACCEPTS port in range [0, 7]', () => {
			for (let port = 0; port <= 7; port++) {
				expect(StigmergySignalSchema.safeParse(validSignal({ port })).success).toBe(true);
			}
		});

		it('REJECTS port < 0', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ port: -1 }));
			expect(result.success).toBe(false);
		});

		it('REJECTS port > 7', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ port: 8 }));
			expect(result.success).toBe(false);
		});

		it('REJECTS non-integer port', () => {
			const result = StigmergySignalSchema.safeParse(validSignal({ port: 3.5 }));
			expect(result.success).toBe(false);
		});
	});
});

// ============================================================================
// VALID TRANSITIONS TESTS
// ============================================================================

describe('VALID_TRANSITIONS', () => {
	it('H can transition to I, H, or X', () => {
		expect(VALID_TRANSITIONS.H).toContain('I');
		expect(VALID_TRANSITIONS.H).toContain('H');
		expect(VALID_TRANSITIONS.H).toContain('X');
		expect(VALID_TRANSITIONS.H).not.toContain('V');
		expect(VALID_TRANSITIONS.H).not.toContain('E');
	});

	it('I can transition to V, H, or X', () => {
		expect(VALID_TRANSITIONS.I).toContain('V');
		expect(VALID_TRANSITIONS.I).toContain('H');
		expect(VALID_TRANSITIONS.I).toContain('X');
		expect(VALID_TRANSITIONS.I).not.toContain('E');
	});

	it('V can transition to E, H, or X', () => {
		expect(VALID_TRANSITIONS.V).toContain('E');
		expect(VALID_TRANSITIONS.V).toContain('H');
		expect(VALID_TRANSITIONS.V).toContain('X');
		expect(VALID_TRANSITIONS.V).not.toContain('I');
	});

	it('E can only transition to H or X (cycle complete)', () => {
		expect(VALID_TRANSITIONS.E).toContain('H');
		expect(VALID_TRANSITIONS.E).toContain('X');
		expect(VALID_TRANSITIONS.E).not.toContain('I');
		expect(VALID_TRANSITIONS.E).not.toContain('V');
	});

	it('X (exceptional) can transition anywhere', () => {
		expect(VALID_TRANSITIONS.X).toContain('H');
		expect(VALID_TRANSITIONS.X).toContain('I');
		expect(VALID_TRANSITIONS.X).toContain('V');
		expect(VALID_TRANSITIONS.X).toContain('E');
		expect(VALID_TRANSITIONS.X).toContain('X');
	});
});

// ============================================================================
// HIVE ORDER TESTS
// ============================================================================

describe('HIVE_ORDER', () => {
	it('defines correct phase ordering', () => {
		expect(HIVE_ORDER.H).toBe(0);
		expect(HIVE_ORDER.I).toBe(1);
		expect(HIVE_ORDER.V).toBe(2);
		expect(HIVE_ORDER.E).toBe(3);
	});

	it('has ascending order H < I < V < E', () => {
		expect(HIVE_ORDER.H).toBeLessThan(HIVE_ORDER.I);
		expect(HIVE_ORDER.I).toBeLessThan(HIVE_ORDER.V);
		expect(HIVE_ORDER.V).toBeLessThan(HIVE_ORDER.E);
	});
});

// ============================================================================
// PYRE PRAETORIAN DAEMON TESTS
// ============================================================================

describe('PyrePraetorianDaemon', () => {
	let daemon: PyrePraetorianDaemon;

	beforeEach(() => {
		// Disable timestamp validation for most tests to focus on HIVE sequence logic
		daemon = new PyrePraetorianDaemon({ validateTimestamps: false });
		timestampCounter = 0; // Reset timestamp counter for each test
	});

	// ============================================================================
	// GATE VALIDATION
	// ============================================================================

	describe('validateGates', () => {
		it('ACCEPTS valid signal', () => {
			const result = daemon.validateGates(validSignal());
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('REJECTS signal with multiple gate failures', () => {
			const invalid = {
				ts: 'bad',
				mark: 2,
				pull: 'wrong',
				msg: '',
				type: 'invalid',
				hive: 'Z',
				gen: 50,
				port: 10,
			};
			const result = daemon.validateGates(invalid);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('includes gate number in error messages', () => {
			const invalid = { ...validSignal(), mark: 2 };
			const result = daemon.validateGates(invalid);
			expect(result.errors.some((e) => e.includes('G1'))).toBe(true);
		});
	});

	// ============================================================================
	// SIGNAL VALIDATION
	// ============================================================================

	describe('validateSignal', () => {
		it('ACCEPTS first signal of any phase', () => {
			const result = daemon.validateSignal(validSignal({ hive: 'I' }));
			expect(result.valid).toBe(true);
		});

		it('ACCEPTS valid H→I transition', () => {
			daemon.validateSignal(validSignal({ hive: 'H' }));
			const result = daemon.validateSignal(validSignal({ hive: 'I' }));
			expect(result.valid).toBe(true);
		});

		it('ACCEPTS valid I→V transition', () => {
			daemon.validateSignal(validSignal({ hive: 'I' }));
			const result = daemon.validateSignal(validSignal({ hive: 'V' }));
			expect(result.valid).toBe(true);
		});

		it('ACCEPTS valid V→E transition', () => {
			daemon.validateSignal(validSignal({ hive: 'V' }));
			const result = daemon.validateSignal(validSignal({ hive: 'E' }));
			expect(result.valid).toBe(true);
		});

		it('ACCEPTS valid E→H transition (cycle complete)', () => {
			daemon.validateSignal(validSignal({ hive: 'E' }));
			const result = daemon.validateSignal(validSignal({ hive: 'H' }));
			expect(result.valid).toBe(true);
		});

		it('ACCEPTS full HIVE cycle H→I→V→E→H', () => {
			expect(daemon.validateSignal(validSignal({ hive: 'H' })).valid).toBe(true);
			expect(daemon.validateSignal(validSignal({ hive: 'I' })).valid).toBe(true);
			expect(daemon.validateSignal(validSignal({ hive: 'V' })).valid).toBe(true);
			expect(daemon.validateSignal(validSignal({ hive: 'E' })).valid).toBe(true);
			expect(daemon.validateSignal(validSignal({ hive: 'H' })).valid).toBe(true);
		});
	});

	// ============================================================================
	// VIOLATION DETECTION
	// ============================================================================

	describe('SKIPPED_PHASE violation (IR-0001)', () => {
		it('DETECTS H→V skip (missing I)', () => {
			daemon.validateSignal(validSignal({ hive: 'H' }));
			const result = daemon.validateSignal(validSignal({ hive: 'V' }));

			expect(result.valid).toBe(false);
			expect(result.violations.some((v) => v.type === 'SKIPPED_PHASE')).toBe(true);
		});

		it('DETECTS H→E skip (missing I and V)', () => {
			daemon.validateSignal(validSignal({ hive: 'H' }));
			const result = daemon.validateSignal(validSignal({ hive: 'E' }));

			expect(result.valid).toBe(false);
			expect(result.violations.some((v) => v.type === 'SKIPPED_PHASE')).toBe(true);
		});

		it('DETECTS I→E skip (missing V)', () => {
			daemon.validateSignal(validSignal({ hive: 'I' }));
			const result = daemon.validateSignal(validSignal({ hive: 'E' }));

			expect(result.valid).toBe(false);
			expect(result.violations.some((v) => v.type === 'SKIPPED_PHASE')).toBe(true);
		});
	});

	describe('PHASE_INVERSION violation (IR-0001)', () => {
		it('DETECTS V→I inversion', () => {
			daemon.validateSignal(validSignal({ hive: 'V' }));
			const result = daemon.validateSignal(validSignal({ hive: 'I' }));

			expect(result.valid).toBe(false);
			expect(result.violations.some((v) => v.type === 'PHASE_INVERSION')).toBe(true);
		});

		it('DETECTS E→V inversion', () => {
			daemon.validateSignal(validSignal({ hive: 'E' }));
			const result = daemon.validateSignal(validSignal({ hive: 'V' }));

			expect(result.valid).toBe(false);
			expect(result.violations.some((v) => v.type === 'PHASE_INVERSION')).toBe(true);
		});

		it('DETECTS E→I inversion', () => {
			daemon.validateSignal(validSignal({ hive: 'E' }));
			const result = daemon.validateSignal(validSignal({ hive: 'I' }));

			expect(result.valid).toBe(false);
			expect(result.violations.some((v) => v.type === 'PHASE_INVERSION')).toBe(true);
		});

		it('ALLOWS E→H (not inversion, cycle complete)', () => {
			daemon.validateSignal(validSignal({ hive: 'E' }));
			const result = daemon.validateSignal(validSignal({ hive: 'H' }));

			expect(result.valid).toBe(true);
		});
	});

	describe('FUTURE_TIMESTAMP violation (IR-0005)', () => {
		it('DETECTS timestamp in future', () => {
			const tsDaemon = new PyrePraetorianDaemon({ validateTimestamps: true });
			const futureDate = new Date(Date.now() + 10000).toISOString(); // 10 seconds ahead
			const now = new Date();
			const result = tsDaemon.validateSignal(validSignal({ ts: futureDate }), now);

			expect(result.valid).toBe(false);
			expect(result.violations.some((v) => v.type === 'FUTURE_TIMESTAMP')).toBe(true);
		});

		it('ALLOWS small clock drift (< 1 second)', () => {
			const tsDaemon = new PyrePraetorianDaemon({ validateTimestamps: true });
			const slightlyFuture = new Date(Date.now() + 500).toISOString();
			const now = new Date();
			const result = tsDaemon.validateSignal(validSignal({ ts: slightlyFuture }), now);

			expect(result.violations.filter((v) => v.type === 'FUTURE_TIMESTAMP')).toHaveLength(0);
		});
	});

	describe('TIMESTAMP_PROXIMITY violation (IR-0005)', () => {
		it('DETECTS timestamp too far in past', () => {
			const tsDaemon = new PyrePraetorianDaemon({ validateTimestamps: true });
			const oldDate = new Date(Date.now() - 120000).toISOString(); // 2 minutes ago
			const now = new Date();
			const result = tsDaemon.validateSignal(validSignal({ ts: oldDate }), now);

			expect(result.violations.some((v) => v.type === 'TIMESTAMP_PROXIMITY')).toBe(true);
		});

		it('ALLOWS timestamp within drift tolerance', () => {
			const tsDaemon = new PyrePraetorianDaemon({ validateTimestamps: true });
			const recentDate = new Date(Date.now() - 30000).toISOString(); // 30 seconds ago
			const now = new Date();
			const result = tsDaemon.validateSignal(validSignal({ ts: recentDate }), now);

			expect(result.violations.filter((v) => v.type === 'TIMESTAMP_PROXIMITY')).toHaveLength(0);
		});

		it('respects custom maxTimeDriftMs config', () => {
			const customDaemon = new PyrePraetorianDaemon({ maxTimeDriftMs: 5000, validateTimestamps: true }); // 5 seconds
			const oldDate = new Date(Date.now() - 10000).toISOString(); // 10 seconds ago
			const now = new Date();
			const result = customDaemon.validateSignal(validSignal({ ts: oldDate }), now);

			expect(result.violations.some((v) => v.type === 'TIMESTAMP_PROXIMITY')).toBe(true);
		});
	});

	describe('BATCH_FABRICATION violation (IR-0005)', () => {
		it('DETECTS multiple signals at same timestamp with different phases', () => {
			const timestamp = new Date().toISOString();
			daemon.validateSignal(validSignal({ ts: timestamp, hive: 'H' }));
			const result = daemon.validateSignal(validSignal({ ts: timestamp, hive: 'I' }));

			expect(result.violations.some((v) => v.type === 'BATCH_FABRICATION')).toBe(true);
		});

		it('ALLOWS signals with same timestamp but same phase (heartbeat)', () => {
			const timestamp = new Date().toISOString();
			daemon.validateSignal(validSignal({ ts: timestamp, hive: 'H', msg: 'First H' }));
			const result = daemon.validateSignal(validSignal({ ts: timestamp, hive: 'H', msg: 'Second H' }));

			expect(result.violations.filter((v) => v.type === 'BATCH_FABRICATION')).toHaveLength(0);
		});

		it('ALLOWS signals with different timestamps', () => {
			daemon.validateSignal(validSignal({ ts: '2026-01-01T00:00:00.000Z', hive: 'H' }));
			const result = daemon.validateSignal(
				validSignal({ ts: '2026-01-01T00:00:01.000Z', hive: 'I' }),
			);

			expect(result.violations.filter((v) => v.type === 'BATCH_FABRICATION')).toHaveLength(0);
		});
	});

	// ============================================================================
	// EXCEPTIONAL (X) PHASE
	// ============================================================================

	describe('X (exceptional) phase handling', () => {
		it('ALLOWS X from any phase when allowExceptional=true', () => {
			for (const phase of ['H', 'I', 'V', 'E'] as const) {
				daemon.reset();
				daemon.validateSignal(validSignal({ hive: phase }));
				const result = daemon.validateSignal(validSignal({ hive: 'X' }));
				expect(result.violations.filter((v) => v.type.includes('PHASE'))).toHaveLength(0);
			}
		});

		it('ALLOWS any phase from X when allowExceptional=true', () => {
			daemon.validateSignal(validSignal({ hive: 'X' }));
			for (const phase of ['H', 'I', 'V', 'E'] as const) {
				const result = daemon.validateSignal(validSignal({ hive: phase }));
				expect(result.violations.filter((v) => v.type.includes('PHASE'))).toHaveLength(0);
			}
		});

		it('VALIDATES X transitions when allowExceptional=false', () => {
			const strictDaemon = new PyrePraetorianDaemon({
				allowExceptional: false,
				validateTimestamps: false,
			});
			strictDaemon.validateSignal(validSignal({ hive: 'H' }));
			const result = strictDaemon.validateSignal(validSignal({ hive: 'X' }));

			// When allowExceptional=false, X is still in VALID_TRANSITIONS.H
			// but the validation logic will still check the transition
			// X IS a valid transition from H per VALID_TRANSITIONS
			expect(result.valid).toBe(true);
		});
	});

	// ============================================================================
	// BLACKBOARD ANALYSIS
	// ============================================================================

	describe('analyzeBlackboard', () => {
		it('reports valid for correct HIVE sequence', () => {
			const signals = [
				validSignal({ ts: '2026-01-01T00:00:00.000Z', hive: 'H' }),
				validSignal({ ts: '2026-01-01T00:00:01.000Z', hive: 'I' }),
				validSignal({ ts: '2026-01-01T00:00:02.000Z', hive: 'V' }),
				validSignal({ ts: '2026-01-01T00:00:03.000Z', hive: 'E' }),
			];

			const result = daemon.analyzeBlackboard(signals);
			expect(result.valid).toBe(true);
			expect(result.totalViolations).toBe(0);
		});

		it('reports all violations in summary', () => {
			const signals = [
				validSignal({ ts: '2026-01-01T00:00:00.000Z', hive: 'H' }),
				validSignal({ ts: '2026-01-01T00:00:00.000Z', hive: 'V' }), // Skip + batch
			];

			const result = daemon.analyzeBlackboard(signals);
			expect(result.valid).toBe(false);
			expect(result.totalViolations).toBeGreaterThan(0);
			expect(result.summary.SKIPPED_PHASE).toBeGreaterThan(0);
			expect(result.summary.BATCH_FABRICATION).toBeGreaterThan(0);
		});

		it('resets state before analysis', () => {
			daemon.validateSignal(validSignal({ hive: 'E' }));

			const signals = [validSignal({ ts: '2026-01-01T00:00:00.000Z', hive: 'H' })];

			const result = daemon.analyzeBlackboard(signals);
			expect(result.valid).toBe(true); // Would fail if not reset
		});
	});

	// ============================================================================
	// CALLBACK HANDLING
	// ============================================================================

	describe('onViolation callback', () => {
		it('calls callback for each violation', () => {
			const callback = vi.fn();
			const callbackDaemon = new PyrePraetorianDaemon({
				onViolation: callback,
				validateTimestamps: false,
			});

			callbackDaemon.validateSignal(validSignal({ hive: 'H' }));
			callbackDaemon.validateSignal(validSignal({ hive: 'V' })); // Skip I

			expect(callback).toHaveBeenCalled();
			expect(callback.mock.calls[0][0].type).toBe('SKIPPED_PHASE');
		});
	});

	// ============================================================================
	// STATE MANAGEMENT
	// ============================================================================

	describe('state management', () => {
		it('tracks current phase', () => {
			expect(daemon.getCurrentPhase()).toBeNull();

			daemon.validateSignal(validSignal({ hive: 'H' }));
			expect(daemon.getCurrentPhase()).toBe('H');

			daemon.validateSignal(validSignal({ hive: 'I' }));
			expect(daemon.getCurrentPhase()).toBe('I');
		});

		it('maintains signal history', () => {
			daemon.validateSignal(validSignal({ msg: 'First' }));
			daemon.validateSignal(validSignal({ msg: 'Second', hive: 'I' }));

			const history = daemon.getHistory();
			expect(history).toHaveLength(2);
			expect(history[0].msg).toBe('First');
			expect(history[1].msg).toBe('Second');
		});

		it('accumulates violations', () => {
			daemon.validateSignal(validSignal({ hive: 'H' }));
			daemon.validateSignal(validSignal({ hive: 'V' })); // Skip
			daemon.validateSignal(validSignal({ hive: 'I' })); // Inversion

			const violations = daemon.getViolations();
			expect(violations.length).toBeGreaterThan(0);
		});

		it('reset clears all state', () => {
			daemon.validateSignal(validSignal({ hive: 'H' }));
			daemon.validateSignal(validSignal({ hive: 'V' })); // Violation

			daemon.reset();

			expect(daemon.getCurrentPhase()).toBeNull();
			expect(daemon.getHistory()).toHaveLength(0);
			expect(daemon.getViolations()).toHaveLength(0);
		});
	});

	// ============================================================================
	// STATIC METHODS
	// ============================================================================

	describe('static methods', () => {
		describe('isValidTransition', () => {
			it('returns true for valid transitions', () => {
				expect(PyrePraetorianDaemon.isValidTransition('H', 'I')).toBe(true);
				expect(PyrePraetorianDaemon.isValidTransition('I', 'V')).toBe(true);
				expect(PyrePraetorianDaemon.isValidTransition('V', 'E')).toBe(true);
				expect(PyrePraetorianDaemon.isValidTransition('E', 'H')).toBe(true);
			});

			it('returns false for invalid transitions', () => {
				expect(PyrePraetorianDaemon.isValidTransition('H', 'V')).toBe(false);
				expect(PyrePraetorianDaemon.isValidTransition('V', 'I')).toBe(false);
				expect(PyrePraetorianDaemon.isValidTransition('E', 'V')).toBe(false);
			});
		});

		describe('getExpectedNextPhases', () => {
			it('returns expected phases for each current phase', () => {
				expect(PyrePraetorianDaemon.getExpectedNextPhases('H')).toEqual(['I', 'H', 'X']);
				expect(PyrePraetorianDaemon.getExpectedNextPhases('I')).toEqual(['V', 'H', 'X']);
				expect(PyrePraetorianDaemon.getExpectedNextPhases('V')).toEqual(['E', 'H', 'X']);
				expect(PyrePraetorianDaemon.getExpectedNextPhases('E')).toEqual(['H', 'X']);
			});
		});

		describe('createSignal', () => {
			it('creates valid signal with defaults', () => {
				const signal = PyrePraetorianDaemon.createSignal({
					msg: 'Test',
					port: 5,
					hive: 'V',
				});

				expect(StigmergySignalSchema.safeParse(signal).success).toBe(true);
				expect(signal.msg).toBe('Test');
				expect(signal.port).toBe(5);
				expect(signal.hive).toBe('V');
				expect(signal.gen).toBe(87);
			});
		});
	});
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('PyrePraetorianDaemon Integration', () => {
	it('validates real-world HIVE cycle with timestamps', () => {
		const daemon = new PyrePraetorianDaemon({ validateTimestamps: false });
		const baseTime = Date.now();

		const cycle = [
			{ hive: 'H' as const, offset: 0, msg: 'HUNT: Starting research' },
			{ hive: 'I' as const, offset: 5000, msg: 'INTERLOCK: Writing tests' },
			{ hive: 'V' as const, offset: 10000, msg: 'VALIDATE: Tests passing' },
			{ hive: 'E' as const, offset: 15000, msg: 'EVOLVE: Refactoring' },
			{ hive: 'H' as const, offset: 20000, msg: 'HUNT: Next cycle' },
		];

		for (const step of cycle) {
			const signal = validSignal({
				ts: new Date(baseTime + step.offset).toISOString(),
				hive: step.hive,
				msg: step.msg,
			});
			const result = daemon.validateSignal(signal, new Date(baseTime + step.offset));
			expect(result.valid).toBe(true);
		}

		expect(daemon.getHistory()).toHaveLength(5);
		expect(daemon.getViolations()).toHaveLength(0);
	});

	it('detects reward-hack pattern (GREEN without RED)', () => {
		const daemon = new PyrePraetorianDaemon({ validateTimestamps: false });

		// Simulating H→V skip (skipping I which is RED phase)
		daemon.validateSignal(validSignal({ hive: 'H', msg: 'HUNT: Research' }));
		const result = daemon.validateSignal(validSignal({ hive: 'V', msg: 'VALIDATE: Tests pass' }));

		expect(result.valid).toBe(false);
		expect(result.violations[0].severity).toBe('CRITICAL');
	});

	it('handles abort pattern (any phase → H)', () => {
		const daemon = new PyrePraetorianDaemon({ validateTimestamps: false });

		daemon.validateSignal(validSignal({ hive: 'I', msg: 'INTERLOCK: Something broke' }));
		const result = daemon.validateSignal(validSignal({ hive: 'H', msg: 'HUNT: Starting over' }));

		expect(result.valid).toBe(true); // Abort to H is allowed
	});
});
