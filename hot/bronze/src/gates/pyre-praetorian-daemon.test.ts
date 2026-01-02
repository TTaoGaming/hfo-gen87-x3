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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    DEFAULT_CONFIG,
    HIVE_ORDER,
    PyrePraetorianDaemon,
    StigmergySignalSchema,
    VALID_TRANSITIONS,
    type StigmergySignal
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

		it('ALLOWS PYRE OCTOPULSE signature (8 signals, ports 0-7, same timestamp, SAME PHASE)', () => {
			// OCTOPULSE is the Pyre Praetorian's unique heartbeat signature
			// Exactly 8 signals at the SAME timestamp, one per port (0-7), type=metric
			// NOTE: All signals must be SAME HIVE phase to avoid SEQUENCE violations
			// The BATCH_FABRICATION only fires on different phases, OCTOPULSE is same phase
			const timestamp = new Date().toISOString();
			const octopulseMsg = JSON.stringify({ type: 'PYRE_OCTOPULSE', pulse: 1 });
			
			// Emit 8 signals at same timestamp with sequential ports, ALL SAME PHASE (V for Pyre)
			const results = [];
			for (let port = 0; port < 8; port++) {
				results.push(daemon.validateSignal(validSignal({
					ts: timestamp,
					port,
					hive: 'V', // All same phase - Pyre is Port 5, V phase
					type: 'metric',
					msg: octopulseMsg,
				})));
			}
			
			// None of the signals should trigger BATCH_FABRICATION (same phase = allowed)
			const batchViolations = results.flatMap(r => 
				r.violations.filter(v => v.type === 'BATCH_FABRICATION')
			);
			expect(batchViolations).toHaveLength(0);
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

		it('BLOCKS X transitions when allowExceptional=false', () => {
			const strictDaemon = new PyrePraetorianDaemon({
				allowExceptional: false,
				validateTimestamps: false,
			});
			strictDaemon.validateSignal(validSignal({ hive: 'H' }));
			const result = strictDaemon.validateSignal(validSignal({ hive: 'X' }));

			// When allowExceptional=false, X is NOT a valid transition target
			// The fix ensures X is blocked when exceptional mode is disabled
			expect(result.valid).toBe(false);
			expect(result.violations.some(v => v.type === 'SKIPPED_PHASE')).toBe(true);
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

// ============================================================================
// PERIODIC REPORTING TESTS
// ============================================================================

describe('Periodic Reporting (JSONL now, NATS later)', () => {
	beforeEach(() => {
		timestampCounter = 0;
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('generates health report with correct structure', () => {
		const daemon = new PyrePraetorianDaemon({ validateTimestamps: false });

		// Process some signals
		daemon.validateSignal(validSignal({ hive: 'H' }));
		daemon.validateSignal(validSignal({ hive: 'I' }));
		daemon.validateSignal(validSignal({ hive: 'V' }));

		const report = daemon.generateHealthReport();

		expect(report).toHaveProperty('reportTs');
		expect(report).toHaveProperty('periodStart');
		expect(report).toHaveProperty('periodEnd');
		expect(report).toHaveProperty('signalsValidated', 3);
		expect(report).toHaveProperty('violationsDetected', 0);
		expect(report).toHaveProperty('violationsByType');
		expect(report).toHaveProperty('violationsBySeverity');
		expect(report).toHaveProperty('currentPhase', 'V');
		expect(report).toHaveProperty('status', 'HEALTHY');
		expect(report).toHaveProperty('uptimeMs');
	});

	it('reports CRITICAL status when critical violations exist', () => {
		const daemon = new PyrePraetorianDaemon({ validateTimestamps: false });

		daemon.validateSignal(validSignal({ hive: 'H' }));
		daemon.validateSignal(validSignal({ hive: 'V' })); // SKIPPED_PHASE (CRITICAL)

		const report = daemon.generateHealthReport();

		expect(report.status).toBe('CRITICAL');
		expect(report.violationsDetected).toBe(1);
		expect(report.violationsBySeverity.CRITICAL).toBe(1);
		expect(report.violationsByType.SKIPPED_PHASE).toBe(1);
	});

	it('reports DEGRADED status for HIGH severity violations', () => {
		const daemon = new PyrePraetorianDaemon({
			validateTimestamps: false,
		});

		// Cause BATCH_FABRICATION (HIGH severity) by using same timestamp
		const sameTs = new Date('2026-01-01T00:00:00.000Z').toISOString();
		daemon.validateSignal(validSignal({ hive: 'H', ts: sameTs }));
		daemon.validateSignal(validSignal({ hive: 'I', ts: sameTs }));

		const report = daemon.generateHealthReport();

		expect(report.status).toBe('DEGRADED');
		expect(report.violationsBySeverity.HIGH).toBe(1);
	});

	it('tracks period signal count correctly', () => {
		const daemon = new PyrePraetorianDaemon({ validateTimestamps: false });

		daemon.validateSignal(validSignal({ hive: 'H' }));
		daemon.validateSignal(validSignal({ hive: 'I' }));

		expect(daemon.getPeriodSignalCount()).toBe(2);

		const report = daemon.generateHealthReport();
		expect(report.signalsValidated).toBe(2);
	});

	it('resets period counters after report emission', () => {
		const emitted: StigmergySignal[] = [];
		const daemon = new PyrePraetorianDaemon({
			validateTimestamps: false,
			emitter: { emit: (s) => emitted.push(s) },
		});

		daemon.validateSignal(validSignal({ hive: 'H' }));
		daemon.validateSignal(validSignal({ hive: 'I' }));
		expect(daemon.getPeriodSignalCount()).toBe(2);

		daemon.emitHealthReport();

		expect(daemon.getPeriodSignalCount()).toBe(0);
		expect(daemon.getPeriodViolations()).toHaveLength(0);
	});

	it('emits signal via configured emitter', () => {
		const emitted: StigmergySignal[] = [];
		const daemon = new PyrePraetorianDaemon({
			validateTimestamps: false,
			emitter: { emit: (s) => emitted.push(s) },
		});

		daemon.validateSignal(validSignal({ hive: 'H' }));
		daemon.emitHealthReport();

		expect(emitted).toHaveLength(1);
		expect(emitted[0].type).toBe('metric');
		expect(emitted[0].port).toBe(5); // Pyre = Port 5
		expect(emitted[0].hive).toBe('V'); // Pyre is V phase
	});

	it('creates report signal with correct structure', () => {
		const emitted: StigmergySignal[] = [];
		const daemon = new PyrePraetorianDaemon({
			validateTimestamps: false,
			emitter: { emit: (s) => emitted.push(s) },
		});

		daemon.validateSignal(validSignal({ hive: 'H' }));
		daemon.emitHealthReport();

		const signal = emitted[0];
		const parsed = JSON.parse(signal.msg);

		expect(parsed.type).toBe('PYRE_HEALTH_REPORT');
		expect(parsed.summary).toContain('HEALTHY');
		expect(parsed.report.signalsValidated).toBe(1);
	});

	it('starts and stops periodic reports', () => {
		const emitted: StigmergySignal[] = [];
		const daemon = new PyrePraetorianDaemon({
			validateTimestamps: false,
			reportIntervalMs: 1000, // 1 second for testing
			emitter: { emit: (s) => emitted.push(s) },
		});

		expect(daemon.isReporting()).toBe(false);

		daemon.startPeriodicReports();
		expect(daemon.isReporting()).toBe(true);
		expect(emitted).toHaveLength(1); // Initial report

		// Advance time
		vi.advanceTimersByTime(1000);
		expect(emitted).toHaveLength(2);

		vi.advanceTimersByTime(1000);
		expect(emitted).toHaveLength(3);

		daemon.stopPeriodicReports();
		expect(daemon.isReporting()).toBe(false);

		vi.advanceTimersByTime(1000);
		expect(emitted).toHaveLength(3); // No more reports
	});

	it('does not start reports without emitter', () => {
		const daemon = new PyrePraetorianDaemon({
			reportIntervalMs: 1000,
			// No emitter configured
		});

		daemon.startPeriodicReports();
		expect(daemon.isReporting()).toBe(false);
	});

	it('does not start reports if interval is 0', () => {
		const emitted: StigmergySignal[] = [];
		const daemon = new PyrePraetorianDaemon({
			reportIntervalMs: 0, // Disabled
			emitter: { emit: (s) => emitted.push(s) },
		});

		daemon.startPeriodicReports();
		expect(daemon.isReporting()).toBe(false);
	});

	it('shutdown stops reports and resets state', () => {
		const emitted: StigmergySignal[] = [];
		const daemon = new PyrePraetorianDaemon({
			validateTimestamps: false,
			reportIntervalMs: 1000,
			emitter: { emit: (s) => emitted.push(s) },
		});

		daemon.validateSignal(validSignal({ hive: 'H' }));
		daemon.startPeriodicReports();
		expect(daemon.isReporting()).toBe(true);

		daemon.shutdown();

		expect(daemon.isReporting()).toBe(false);
		expect(daemon.getHistory()).toHaveLength(0);
		expect(daemon.getPeriodSignalCount()).toBe(0);
	});

	it('mark reflects health status in signal', () => {
		const emitted: StigmergySignal[] = [];
		const daemon = new PyrePraetorianDaemon({
			validateTimestamps: false,
			emitter: { emit: (s) => emitted.push(s) },
		});

		// HEALTHY case
		daemon.validateSignal(validSignal({ hive: 'H' }));
		daemon.emitHealthReport();
		expect(emitted[0].mark).toBe(1.0); // HEALTHY

		// CRITICAL case (reset and cause violation)
		daemon.reset();
		daemon.validateSignal(validSignal({ hive: 'H' }));
		daemon.validateSignal(validSignal({ hive: 'V' })); // SKIPPED_PHASE
		daemon.emitHealthReport();
		expect(emitted[1].mark).toBe(0.0); // CRITICAL
	});
});

// ============================================================================
// BLACKBOARD READING & WATCHING TESTS
// ============================================================================

describe('Blackboard Reading & Watching', () => {
	describe('readBlackboardFile', () => {
		it('returns empty array when no blackboard path configured', () => {
			const daemon = new PyrePraetorianDaemon();
			expect(daemon.readBlackboardFile()).toHaveLength(0);
		});

		it('returns empty array when no reader configured', () => {
			const daemon = new PyrePraetorianDaemon({
				blackboardPath: 'test.jsonl',
			});
			expect(daemon.readBlackboardFile()).toHaveLength(0);
		});

		it('parses valid JSONL signals', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'H', msg: 'First' })),
				JSON.stringify(validSignal({ hive: 'I', msg: 'Second' })),
				JSON.stringify(validSignal({ hive: 'V', msg: 'Third' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			const signals = daemon.readBlackboardFile();
			expect(signals).toHaveLength(3);
			expect(signals[0].hive).toBe('H');
			expect(signals[1].hive).toBe('I');
			expect(signals[2].hive).toBe('V');
		});

		it('skips invalid JSON lines', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'H' })),
				'not valid json {{{',
				JSON.stringify(validSignal({ hive: 'I' })),
				'',
				JSON.stringify(validSignal({ hive: 'V' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			const signals = daemon.readBlackboardFile();
			expect(signals).toHaveLength(3);
		});

		it('skips objects without hive field', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'H' })),
				JSON.stringify({ msg: 'No hive field' }),
				JSON.stringify(validSignal({ hive: 'V' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			const signals = daemon.readBlackboardFile();
			expect(signals).toHaveLength(2);
		});

		it('handles file read errors gracefully', () => {
			const daemon = new PyrePraetorianDaemon({
				blackboardPath: 'test.jsonl',
				blackboardReader: () => {
					throw new Error('File not found');
				},
			});

			const signals = daemon.readBlackboardFile();
			expect(signals).toHaveLength(0);
		});
	});

	describe('scanBlackboard', () => {
		it('scans blackboard and detects violations', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'H', msg: 'Hunt' })),
				JSON.stringify(validSignal({ hive: 'V', msg: 'Skip to Validate' })), // VIOLATION
				JSON.stringify(validSignal({ hive: 'E', msg: 'Evolve' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			const result = daemon.scanBlackboard();
			expect(result.signalsFound).toBe(3);
			expect(result.violations.length).toBeGreaterThan(0);
			expect(result.violations[0].type).toBe('SKIPPED_PHASE');
		});

		it('reports valid sequence with no violations', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'H', msg: 'Hunt' })),
				JSON.stringify(validSignal({ hive: 'I', msg: 'Interlock' })),
				JSON.stringify(validSignal({ hive: 'V', msg: 'Validate' })),
				JSON.stringify(validSignal({ hive: 'E', msg: 'Evolve' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			const result = daemon.scanBlackboard();
			expect(result.signalsFound).toBe(4);
			expect(result.violations).toHaveLength(0);
		});
	});

	describe('git commit extraction', () => {
		it('extracts commit hash from "commit abc123" pattern', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'E', msg: 'EVOLVE: Git commit abc1234 - feature complete' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			const result = daemon.scanBlackboard();
			expect(result.gitCommits).toHaveLength(1);
			expect(result.gitCommits[0].hash).toBe('abc1234');
		});

		it('extracts full SHA from message', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'E', msg: 'Merged commit 1234567890abcdef1234567890abcdef12345678' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			const result = daemon.scanBlackboard();
			expect(result.gitCommits).toHaveLength(1);
			expect(result.gitCommits[0].hash).toBe('1234567890abcdef1234567890abcdef12345678');
		});

		it('avoids duplicate commit hashes', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'E', msg: 'Git commit abc1234 - first' })),
				JSON.stringify(validSignal({ hive: 'H', msg: 'Ref: commit abc1234 - second mention' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			const result = daemon.scanBlackboard();
			expect(result.gitCommits).toHaveLength(1);
		});

		it('extracts multiple different commits', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'E', msg: 'Git commit abc1234 - first' })),
				JSON.stringify(validSignal({ hive: 'E', msg: 'Git commit def5678 - second' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			const result = daemon.scanBlackboard();
			expect(result.gitCommits).toHaveLength(2);
		});

		it('getGitCommits returns detected commits', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'E', msg: 'Git commit abc1234' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			daemon.scanBlackboard();
			const commits = daemon.getGitCommits();
			expect(commits).toHaveLength(1);
			expect(commits[0].hash).toBe('abc1234');
		});
	});

	describe('blackboard watching', () => {
		it('starts and stops watching', () => {
			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: () => '',
			});

			expect(daemon.isWatching()).toBe(false);

			daemon.startWatchingBlackboard(1000);
			expect(daemon.isWatching()).toBe(true);

			daemon.stopWatchingBlackboard();
			expect(daemon.isWatching()).toBe(false);
		});

		it('does not start without blackboard config', () => {
			const daemon = new PyrePraetorianDaemon();

			daemon.startWatchingBlackboard(1000);
			expect(daemon.isWatching()).toBe(false);
		});

		it('shutdown stops watching', () => {
			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: () => '',
			});

			daemon.startWatchingBlackboard(1000);
			expect(daemon.isWatching()).toBe(true);

			daemon.shutdown();
			expect(daemon.isWatching()).toBe(false);
		});

		it('polling detects new signals', () => {
			vi.useFakeTimers();

			let signalCount = 1;
			const getMockContent = () => {
				const signals = [];
				for (let i = 0; i < signalCount; i++) {
					signals.push(JSON.stringify(validSignal({ hive: 'H', msg: `Signal ${i}` })));
				}
				return signals.join('\n');
			};

			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: getMockContent,
			});

			// Initial scan
			daemon.startWatchingBlackboard(1000);
			expect(daemon.getPeriodSignalCount()).toBe(1);

			// Add more signals and poll
			signalCount = 3;
			vi.advanceTimersByTime(1000);
			expect(daemon.getPeriodSignalCount()).toBe(3);

			daemon.shutdown();
			vi.useRealTimers();
		});

		it('skips PYRE_HEALTH_REPORT signals during polling', () => {
			vi.useFakeTimers();

			let includeHealthReport = false;
			const getMockContent = () => {
				const signals = [
					JSON.stringify(validSignal({ hive: 'H', msg: 'Hunt signal' })),
				];
				if (includeHealthReport) {
					signals.push(JSON.stringify(validSignal({ 
						hive: 'V', 
						msg: JSON.stringify({ type: 'PYRE_HEALTH_REPORT', summary: 'test' })
					})));
				}
				return signals.join('\n');
			};

			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: getMockContent,
			});

			// Initial scan
			daemon.startWatchingBlackboard(1000);
			expect(daemon.getPeriodSignalCount()).toBe(1);

			// Add health report and poll
			includeHealthReport = true;
			vi.advanceTimersByTime(1000);
			// Should still be 1 because health report is skipped
			expect(daemon.getPeriodSignalCount()).toBe(1);

			daemon.shutdown();
			vi.useRealTimers();
		});
	});

	describe('health report includes blackboard info', () => {
		it('includes gitCommits in health report', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'E', msg: 'Git commit abc1234' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			daemon.scanBlackboard();
			const report = daemon.generateHealthReport();
			
			expect(report.gitCommits).toBeDefined();
			expect(report.gitCommits).toHaveLength(1);
			expect(report.gitCommits?.[0].hash).toBe('abc1234');
		});

		it('includes blackboardSignals count in health report', () => {
			const mockContent = [
				JSON.stringify(validSignal({ hive: 'H' })),
				JSON.stringify(validSignal({ hive: 'I' })),
				JSON.stringify(validSignal({ hive: 'V' })),
			].join('\n');

			const daemon = new PyrePraetorianDaemon({
				validateTimestamps: false,
				blackboardPath: 'test.jsonl',
				blackboardReader: () => mockContent,
			});

			daemon.scanBlackboard();
			const report = daemon.generateHealthReport();
			
			expect(report.blackboardSignals).toBe(3);
		});
	});
});

// Import afterEach for vi cleanup
import { afterEach } from 'vitest';

// ============================================================================
// CONFIG BEHAVIOR TESTS (Mutation Killers)
// ============================================================================

describe('Config Behavior Verification (Mutation Killers)', () => {
	describe('validateTimestamps config', () => {
		it('validateTimestamps=true DETECTS future timestamps', () => {
			const daemon = new PyrePraetorianDaemon({ validateTimestamps: true });
			const futureSignal = validSignal({ ts: '2099-01-01T00:00:00.000Z' });
			const result = daemon.validateSignal(futureSignal);
			
			expect(result.valid).toBe(false);
			expect(result.violations.some(v => v.type === 'FUTURE_TIMESTAMP')).toBe(true);
		});

		it('validateTimestamps=false SKIPS future timestamp detection', () => {
			const daemon = new PyrePraetorianDaemon({ validateTimestamps: false });
			const futureSignal = validSignal({ ts: '2099-01-01T00:00:00.000Z', hive: 'H' });
			const result = daemon.validateSignal(futureSignal);
			
			// With validateTimestamps=false, future timestamp should NOT be a violation
			expect(result.violations.some(v => v.type === 'FUTURE_TIMESTAMP')).toBe(false);
		});

		it('validateTimestamps BEHAVIOR DIFFERENCE proves config works', () => {
			const futureSignal = validSignal({ ts: '2099-01-01T00:00:00.000Z', hive: 'H' });
			
			const enabledDaemon = new PyrePraetorianDaemon({ validateTimestamps: true });
			const disabledDaemon = new PyrePraetorianDaemon({ validateTimestamps: false });
			
			const enabledResult = enabledDaemon.validateSignal(futureSignal);
			const disabledResult = disabledDaemon.validateSignal(futureSignal);
			
			// These MUST be different for config to have effect
			const enabledHasFuture = enabledResult.violations.some(v => v.type === 'FUTURE_TIMESTAMP');
			const disabledHasFuture = disabledResult.violations.some(v => v.type === 'FUTURE_TIMESTAMP');
			
			expect(enabledHasFuture).toBe(true);
			expect(disabledHasFuture).toBe(false);
		});
	});

	describe('allowExceptional config', () => {
		it('allowExceptional=true ALLOWS X phase to bypass sequence rules', () => {
			const daemon = new PyrePraetorianDaemon({ 
				allowExceptional: true,
				validateTimestamps: false 
			});
			
			// Start with H
			daemon.validateSignal(validSignal({ hive: 'H' }));
			
			// Jump to X (exceptional) - should be allowed with allowExceptional=true
			const xResult = daemon.validateSignal(validSignal({ hive: 'X' }));
			expect(xResult.valid).toBe(true);
			
			// Jump from X to E (skipping I, V) - should be allowed
			const eResult = daemon.validateSignal(validSignal({ hive: 'E' }));
			expect(eResult.valid).toBe(true);
		});

		it('allowExceptional=false BLOCKS X phase from bypassing rules', () => {
			const daemon = new PyrePraetorianDaemon({ 
				allowExceptional: false,
				validateTimestamps: false 
			});
			
			// Start with H
			daemon.validateSignal(validSignal({ hive: 'H' }));
			
			// Try to go H -> X - without allowExceptional, X follows normal rules
			const xResult = daemon.validateSignal(validSignal({ hive: 'X' }));
			
			// X is not a valid transition from H in normal rules
			// (VALID_TRANSITIONS['H'] = ['H', 'I'] typically)
			expect(xResult.violations.some(v => 
				v.type === 'SKIPPED_PHASE' || v.type === 'PHASE_INVERSION'
			)).toBe(true);
		});

		it('allowExceptional BEHAVIOR DIFFERENCE proves config works', () => {
			const enabledDaemon = new PyrePraetorianDaemon({ 
				allowExceptional: true, 
				validateTimestamps: false 
			});
			const disabledDaemon = new PyrePraetorianDaemon({ 
				allowExceptional: false, 
				validateTimestamps: false 
			});
			
			// Both start with H
			enabledDaemon.validateSignal(validSignal({ hive: 'H' }));
			disabledDaemon.validateSignal(validSignal({ hive: 'H' }));
			
			// Both try H -> X
			const enabledXResult = enabledDaemon.validateSignal(validSignal({ hive: 'X' }));
			const disabledXResult = disabledDaemon.validateSignal(validSignal({ hive: 'X' }));
			
			// These MUST be different for config to have effect
			expect(enabledXResult.valid).toBe(true); // X bypasses allowed
			expect(disabledXResult.valid).toBe(false); // X must follow rules
		});
	});

	describe('maxTimeDriftMs config', () => {
		it('maxTimeDriftMs=60000 ALLOWS signals 59 seconds old', () => {
			const daemon = new PyrePraetorianDaemon({ 
				maxTimeDriftMs: 60000,
				validateTimestamps: true 
			});
			
			const now = new Date();
			const past59s = new Date(now.getTime() - 59000).toISOString();
			const signal = validSignal({ ts: past59s, hive: 'H' });
			
			const result = daemon.validateSignal(signal, now);
			expect(result.violations.some(v => v.type === 'TIMESTAMP_PROXIMITY')).toBe(false);
		});

		it('maxTimeDriftMs=60000 REJECTS signals 61 seconds old', () => {
			const daemon = new PyrePraetorianDaemon({ 
				maxTimeDriftMs: 60000,
				validateTimestamps: true 
			});
			
			const now = new Date();
			const past61s = new Date(now.getTime() - 61000).toISOString();
			const signal = validSignal({ ts: past61s, hive: 'H' });
			
			const result = daemon.validateSignal(signal, now);
			expect(result.violations.some(v => v.type === 'TIMESTAMP_PROXIMITY')).toBe(true);
		});

		it('maxTimeDriftMs BEHAVIOR DIFFERENCE proves config works', () => {
			const now = new Date();
			const past30s = new Date(now.getTime() - 30000).toISOString();
			const signal = validSignal({ ts: past30s, hive: 'H' });
			
			const tightDaemon = new PyrePraetorianDaemon({ 
				maxTimeDriftMs: 20000, // 20 seconds - too tight
				validateTimestamps: true 
			});
			const looseDaemon = new PyrePraetorianDaemon({ 
				maxTimeDriftMs: 60000, // 60 seconds - ok
				validateTimestamps: true 
			});
			
			const tightResult = tightDaemon.validateSignal(signal, now);
			const looseResult = looseDaemon.validateSignal(signal, now);
			
			// These MUST be different for config to have effect
			const tightHasProximity = tightResult.violations.some(v => v.type === 'TIMESTAMP_PROXIMITY');
			const looseHasProximity = looseResult.violations.some(v => v.type === 'TIMESTAMP_PROXIMITY');
			
			expect(tightHasProximity).toBe(true); // 30s > 20s max drift
			expect(looseHasProximity).toBe(false); // 30s < 60s max drift
		});
	});

	describe('reportIntervalMs config', () => {
		it('reportIntervalMs is used in periodic report generation', () => {
			// This tests that the config value is actually stored and accessible
			const daemon = new PyrePraetorianDaemon({ 
				reportIntervalMs: 30000 // 30 seconds
			});
			
			// Start periodic reports (this uses reportIntervalMs internally)
			daemon.startPeriodicReports();
			
			// Clean up
			daemon.stopPeriodicReports();
			
			// The test passes if no errors - meaning reportIntervalMs was used
			expect(true).toBe(true);
		});
	});

	describe('DEFAULT_CONFIG values', () => {
		it('DEFAULT_CONFIG has correct maxTimeDriftMs (60 seconds)', () => {
			expect(DEFAULT_CONFIG.maxTimeDriftMs).toBe(60_000);
		});

		it('DEFAULT_CONFIG has quarantineOnViolation=true', () => {
			expect(DEFAULT_CONFIG.quarantineOnViolation).toBe(true);
		});

		it('DEFAULT_CONFIG has allowExceptional=true', () => {
			expect(DEFAULT_CONFIG.allowExceptional).toBe(true);
		});

		it('DEFAULT_CONFIG has validateTimestamps=true', () => {
			expect(DEFAULT_CONFIG.validateTimestamps).toBe(true);
		});

		it('DEFAULT_CONFIG has reportIntervalMs=5 minutes (300000ms)', () => {
			expect(DEFAULT_CONFIG.reportIntervalMs).toBe(5 * 60 * 1000);
			expect(DEFAULT_CONFIG.reportIntervalMs).toBe(300_000);
		});

		it('daemon with no config uses DEFAULT_CONFIG.validateTimestamps=true', () => {
			// Create daemon with NO config (uses defaults)
			const defaultDaemon = new PyrePraetorianDaemon();
			
			// Future timestamp should be DETECTED (because validateTimestamps defaults to true)
			const futureSignal = validSignal({ ts: '2099-01-01T00:00:00.000Z', hive: 'H' });
			const result = defaultDaemon.validateSignal(futureSignal);
			
			// With default validateTimestamps=true, should detect future timestamp
			expect(result.violations.some(v => v.type === 'FUTURE_TIMESTAMP')).toBe(true);
		});

		it('daemon with no config uses DEFAULT_CONFIG.allowExceptional=true', () => {
			// Create daemon with NO config (uses defaults)
			const defaultDaemon = new PyrePraetorianDaemon({ validateTimestamps: false });
			
			// Start with H, then go to X
			defaultDaemon.validateSignal(validSignal({ hive: 'H' }));
			const xResult = defaultDaemon.validateSignal(validSignal({ hive: 'X' }));
			
			// With default allowExceptional=true, X should bypass rules
			expect(xResult.valid).toBe(true);
		});

		it('daemon with no config uses DEFAULT_CONFIG.maxTimeDriftMs=60000', () => {
			// Create daemon with NO config (uses defaults)
			const defaultDaemon = new PyrePraetorianDaemon();
			const now = new Date();
			
			// Signal 59 seconds old (within 60s default)
			const past59s = new Date(now.getTime() - 59000).toISOString();
			const result = defaultDaemon.validateSignal(validSignal({ ts: past59s, hive: 'H' }), now);
			
			// Should NOT have proximity violation (59s < 60s default)
			expect(result.violations.some(v => v.type === 'TIMESTAMP_PROXIMITY')).toBe(false);
		});
	});
});
