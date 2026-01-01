/**
 * HIVE Validator Tests
 *
 * TDD RED phase tests for HIVE/8 enforcement.
 * These tests verify that phase transitions are properly enforced.
 *
 * @module enforcement/hive-validator.test
 */
// @ts-nocheck


import { beforeEach, describe, expect, it } from 'vitest';
import {
	ALLOWED_TRANSITIONS,
	type HIVEPhase,
	HIVEValidator,
	type Signal,
	getRecommendedPort,
	isPortValidForPhase,
} from './hive-validator.js';

describe('HIVEValidator', () => {
	let validator: HIVEValidator;

	beforeEach(() => {
		validator = new HIVEValidator();
	});

	describe('Initial State', () => {
		it('should have null current phase when no signals recorded', () => {
			expect(validator.getCurrentPhase()).toBeNull();
		});

		it('should only allow H phase as first signal', () => {
			const result = validator.validateTransition(null, 'H');
			expect(result.valid).toBe(true);
		});

		it('should BLOCK I phase as first signal', () => {
			const result = validator.validateTransition(null, 'I');
			expect(result.valid).toBe(false);
			expect(result.violation).toBe('SKIPPED_HUNT');
		});

		it('should BLOCK V phase as first signal', () => {
			const result = validator.validateTransition(null, 'V');
			expect(result.valid).toBe(false);
			expect(result.violation).toBe('SKIPPED_HUNT');
		});

		it('should BLOCK E phase as first signal', () => {
			const result = validator.validateTransition(null, 'E');
			expect(result.valid).toBe(false);
			expect(result.violation).toBe('SKIPPED_HUNT');
		});
	});

	describe('Valid Transitions', () => {
		it('should allow H → H (continue hunting)', () => {
			const result = validator.validateTransition('H', 'H');
			expect(result.valid).toBe(true);
		});

		it('should allow H → I (ready for contracts)', () => {
			const result = validator.validateTransition('H', 'I');
			expect(result.valid).toBe(true);
		});

		it('should allow I → I (continue tests)', () => {
			const result = validator.validateTransition('I', 'I');
			expect(result.valid).toBe(true);
		});

		it('should allow I → V (tests exist, ready for impl)', () => {
			const result = validator.validateTransition('I', 'V');
			expect(result.valid).toBe(true);
		});

		it('should allow V → V (continue impl)', () => {
			const result = validator.validateTransition('V', 'V');
			expect(result.valid).toBe(true);
		});

		it('should allow V → E (tests pass, ready for refactor)', () => {
			const result = validator.validateTransition('V', 'E');
			expect(result.valid).toBe(true);
		});

		it('should allow E → E (continue refactor)', () => {
			const result = validator.validateTransition('E', 'E');
			expect(result.valid).toBe(true);
		});

		it('should allow E → H (strange loop back to hunt)', () => {
			const result = validator.validateTransition('E', 'H');
			expect(result.valid).toBe(true);
		});
	});

	describe('BLOCKED Transitions (Violations)', () => {
		it('should BLOCK H → V (SKIPPED_INTERLOCK)', () => {
			const result = validator.validateTransition('H', 'V');
			expect(result.valid).toBe(false);
			expect(result.violation).toBe('SKIPPED_INTERLOCK');
		});

		it('should BLOCK H → E (SKIPPED_INTERLOCK)', () => {
			const result = validator.validateTransition('H', 'E');
			expect(result.valid).toBe(false);
			expect(result.violation).toBe('SKIPPED_INTERLOCK');
		});

		it('should BLOCK I → E (SKIPPED_VALIDATE)', () => {
			const result = validator.validateTransition('I', 'E');
			expect(result.valid).toBe(false);
			expect(result.violation).toBe('SKIPPED_VALIDATE');
		});

		it('should BLOCK I → H (backward not allowed mid-cycle)', () => {
			const result = validator.validateTransition('I', 'H');
			expect(result.valid).toBe(false);
		});

		it('should BLOCK V → H (backward not allowed mid-cycle)', () => {
			const result = validator.validateTransition('V', 'H');
			expect(result.valid).toBe(false);
		});

		it('should BLOCK V → I (backward not allowed)', () => {
			const result = validator.validateTransition('V', 'I');
			expect(result.valid).toBe(false);
		});

		it('should BLOCK E → I (backward not allowed)', () => {
			const result = validator.validateTransition('E', 'I');
			expect(result.valid).toBe(false);
		});

		it('should BLOCK E → V (backward not allowed)', () => {
			const result = validator.validateTransition('E', 'V');
			expect(result.valid).toBe(false);
		});
	});

	describe('Handoff (X) Phase', () => {
		it('should allow X from any phase', () => {
			const phases: HIVEPhase[] = ['H', 'I', 'V', 'E'];
			for (const phase of phases) {
				const result = validator.validateTransition(phase, 'X');
				expect(result.valid).toBe(true);
			}
		});

		it('should allow transition to any phase after X', () => {
			const phases: HIVEPhase[] = ['H', 'I', 'V', 'E'];
			for (const phase of phases) {
				const result = validator.validateTransition('X', phase);
				expect(result.valid).toBe(true);
			}
		});
	});

	describe('canEmitSignal', () => {
		const createTestSignal = (hive: HIVEPhase): Signal => ({
			ts: new Date().toISOString(),
			mark: 1.0,
			pull: 'downstream',
			msg: `Test ${hive} signal`,
			type: 'signal',
			hive,
			gen: 87,
			port: 0,
		});

		it('should allow H signal when no history', () => {
			const signal = createTestSignal('H');
			const result = validator.canEmitSignal(signal);
			expect(result.valid).toBe(true);
		});

		it('should BLOCK V signal when no history', () => {
			const signal = createTestSignal('V');
			const result = validator.canEmitSignal(signal);
			expect(result.valid).toBe(false);
		});

		it('should track history after recording signals', () => {
			validator.recordSignal(createTestSignal('H'));
			expect(validator.getCurrentPhase()).toBe('H');

			const result = validator.canEmitSignal(createTestSignal('I'));
			expect(result.valid).toBe(true);
		});

		it('should block skipping phases even with history', () => {
			validator.recordSignal(createTestSignal('H'));

			const result = validator.canEmitSignal(createTestSignal('V'));
			expect(result.valid).toBe(false);
			expect(result.violation).toBe('SKIPPED_INTERLOCK');
		});
	});

	describe('Complete HIVE Cycle', () => {
		const createTestSignal = (hive: HIVEPhase, msg: string): Signal => ({
			ts: new Date().toISOString(),
			mark: 1.0,
			pull: 'downstream',
			msg,
			type: 'signal',
			hive,
			gen: 87,
			port: 0,
		});

		it('should track a complete H → I → V → E cycle', () => {
			validator.recordSignal(createTestSignal('H', 'Hunt phase'));
			expect(validator.getCurrentPhase()).toBe('H');

			validator.recordSignal(createTestSignal('I', 'Interlock phase'));
			expect(validator.getCurrentPhase()).toBe('I');

			validator.recordSignal(createTestSignal('V', 'Validate phase'));
			expect(validator.getCurrentPhase()).toBe('V');

			validator.recordSignal(createTestSignal('E', 'Evolve phase'));
			expect(validator.getCurrentPhase()).toBe('E');

			const stats = validator.getCycleStats();
			expect(stats.completedCycles).toBe(1);
		});

		it('should allow strange loop E → H for next cycle', () => {
			// Complete first cycle
			validator.recordSignal(createTestSignal('H', 'Hunt 1'));
			validator.recordSignal(createTestSignal('I', 'Interlock 1'));
			validator.recordSignal(createTestSignal('V', 'Validate 1'));
			validator.recordSignal(createTestSignal('E', 'Evolve 1'));

			// Strange loop back to Hunt
			const result = validator.canEmitSignal(createTestSignal('H', 'Hunt 2'));
			expect(result.valid).toBe(true);
		});
	});

	describe('Cycle Statistics', () => {
		const createTestSignal = (hive: HIVEPhase): Signal => ({
			ts: new Date().toISOString(),
			mark: 1.0,
			pull: 'downstream',
			msg: `${hive} signal`,
			type: 'signal',
			hive,
			gen: 87,
			port: 0,
		});

		it('should count signals by phase', () => {
			validator.recordSignal(createTestSignal('H'));
			validator.recordSignal(createTestSignal('H'));
			validator.recordSignal(createTestSignal('I'));

			const stats = validator.getCycleStats();
			expect(stats.byPhase.H).toBe(2);
			expect(stats.byPhase.I).toBe(1);
			expect(stats.totalSignals).toBe(3);
		});
	});
});

describe('ALLOWED_TRANSITIONS matrix', () => {
	it('should have all phases defined', () => {
		const phases: HIVEPhase[] = ['H', 'I', 'V', 'E', 'X'];
		for (const phase of phases) {
			expect(ALLOWED_TRANSITIONS[phase]).toBeDefined();
			expect(Array.isArray(ALLOWED_TRANSITIONS[phase])).toBe(true);
		}
	});

	it('should allow self-transitions for all phases', () => {
		const phases: HIVEPhase[] = ['H', 'I', 'V', 'E'];
		for (const phase of phases) {
			expect(ALLOWED_TRANSITIONS[phase]).toContain(phase);
		}
	});

	it('should allow X from all phases', () => {
		const phases: HIVEPhase[] = ['H', 'I', 'V', 'E'];
		for (const phase of phases) {
			expect(ALLOWED_TRANSITIONS[phase]).toContain('X');
		}
	});
});

describe('Port-Phase Mapping', () => {
	it('should validate correct ports for H phase', () => {
		expect(isPortValidForPhase(0, 'H')).toBe(true);
		expect(isPortValidForPhase(7, 'H')).toBe(true);
		expect(isPortValidForPhase(1, 'H')).toBe(false);
	});

	it('should validate correct ports for I phase', () => {
		expect(isPortValidForPhase(1, 'I')).toBe(true);
		expect(isPortValidForPhase(6, 'I')).toBe(true);
		expect(isPortValidForPhase(0, 'I')).toBe(false);
	});

	it('should validate correct ports for V phase', () => {
		expect(isPortValidForPhase(2, 'V')).toBe(true);
		expect(isPortValidForPhase(5, 'V')).toBe(true);
		expect(isPortValidForPhase(0, 'V')).toBe(false);
	});

	it('should validate correct ports for E phase', () => {
		expect(isPortValidForPhase(3, 'E')).toBe(true);
		expect(isPortValidForPhase(4, 'E')).toBe(true);
		expect(isPortValidForPhase(0, 'E')).toBe(false);
	});

	it('should return recommended ports correctly', () => {
		expect(getRecommendedPort('H')).toBe(0);
		expect(getRecommendedPort('I')).toBe(1);
		expect(getRecommendedPort('V')).toBe(2);
		expect(getRecommendedPort('E')).toBe(3);
	});
});

// <<<<<<< STATE_MERGE_MARKER: G0_TIMESTAMP_VALIDATION_TESTS_20251231
// AUDIT FIX: Property tests for timestamp validation
// Source: W3C_GESTURE_CONTROL_PLANE_AUDIT_20251231.md Section 3.1
import { SignalSchema, validateTimestamp } from './hive-validator.js';

describe('G0 Timestamp Validation', () => {
	describe('validateTimestamp', () => {
		it('should accept current timestamp', () => {
			const now = new Date().toISOString();
			const result = validateTimestamp(now);
			expect(result.valid).toBe(true);
		});

		it('should accept timestamp within clock drift tolerance (60s future)', () => {
			const nearFuture = new Date(Date.now() + 30_000).toISOString();
			const result = validateTimestamp(nearFuture);
			expect(result.valid).toBe(true);
		});

		it('should REJECT future timestamp beyond tolerance', () => {
			const fakeFuture = new Date(Date.now() + 120_000).toISOString(); // 2 min ahead
			const result = validateTimestamp(fakeFuture);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('G0_FAKE_TIMESTAMP');
		});

		it('should REJECT future timestamp beyond tolerance (genuine future date)', () => {
			// Use a date that is DEFINITELY in the future relative to any reasonable system clock
			const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year ahead
			const result = validateTimestamp(farFuture);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('G0_FAKE_TIMESTAMP');
		});

		it('should accept timestamp within staleness tolerance (5 min ago)', () => {
			const recent = new Date(Date.now() - 60_000).toISOString(); // 1 min ago
			const result = validateTimestamp(recent);
			expect(result.valid).toBe(true);
		});

		it('should REJECT stale timestamp beyond tolerance', () => {
			const stale = new Date(Date.now() - 600_000).toISOString(); // 10 min ago
			const result = validateTimestamp(stale);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('G0_STALE_TIMESTAMP');
		});

		it('should REJECT invalid timestamp format', () => {
			const result = validateTimestamp('not-a-date');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('G0_INVALID_TIMESTAMP');
		});
	});

	describe('SignalSchema timestamp refinement', () => {
		const validSignalBase = {
			mark: 1.0,
			pull: 'downstream' as const,
			msg: 'Test signal',
			type: 'signal' as const,
			hive: 'H' as const,
			gen: 87,
			port: 0,
		};

		it('should accept signal with current timestamp', () => {
			const signal = { ...validSignalBase, ts: new Date().toISOString() };
			const result = SignalSchema.safeParse(signal);
			expect(result.success).toBe(true);
		});

		it('should REJECT signal with fake future timestamp', () => {
			const signal = { ...validSignalBase, ts: '2026-01-01T00:00:00Z' };
			const result = SignalSchema.safeParse(signal);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('G0_TIMESTAMP_VIOLATION');
			}
		});

		it('should REJECT signal with stale timestamp', () => {
			const signal = {
				...validSignalBase,
				ts: new Date(Date.now() - 600_000).toISOString(),
			};
			const result = SignalSchema.safeParse(signal);
			expect(result.success).toBe(false);
		});
	});
});
// >>>>>>> STATE_MERGE_MARKER: G0_TIMESTAMP_VALIDATION_TESTS_20251231
