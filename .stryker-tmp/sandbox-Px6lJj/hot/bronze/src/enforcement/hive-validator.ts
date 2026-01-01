/**
 * HIVE/8 Phase Validator
 *
 * ENFORCES sequential phase transitions: H → I → V → E → H(N+1)
 * This is a HARD GATE - out-of-sequence signals are BLOCKED.
 *
 * TRL Lineage: Custom enforcement for HIVE/8 workflow
 * Source: Gen87.X3 AGENTS.md, GEN85.1_ENRICHED_GOLD_BATON_QUINE.md
 *
 * Phase Rules:
 * - H (Hunt): Research only. NO file creation, NO code.
 * - I (Interlock): TDD RED - Write failing tests, define contracts.
 * - V (Validate): TDD GREEN - Make tests pass, implement.
 * - E (Evolve): TDD REFACTOR - Clean up, commit, prepare next cycle.
 * - X (Handoff): Can occur at phase boundaries only.
 *
 * @module enforcement/hive-validator
 */
// @ts-nocheck


import { z } from 'zod';

// =============================================================================
// SCHEMAS
// =============================================================================

export const HIVEPhaseSchema = z.enum(['H', 'I', 'V', 'E', 'X']);
export type HIVEPhase = z.infer<typeof HIVEPhaseSchema>;

// <<<<<<< STATE_MERGE_MARKER: G0_TIMESTAMP_VALIDATION_FIX_20251231
// AUDIT FIX: Priority 0 - Timestamp validation to prevent FAKE_TIMESTAMP violations
// Source: W3C_GESTURE_CONTROL_PLANE_AUDIT_20251231.md Section 3.1
// Issue: Blackboard showed ts="2026-01-01" which is impossible (future date)
const MAX_FUTURE_DRIFT_MS = 60_000; // Allow 60s clock drift
const MAX_STALENESS_MS = 300_000; // Reject signals >5 minutes old

/**
 * Validate timestamp is not fake (future) or stale (>5 min old)
 * G0 Gate: Temporal sanity check
 */
export function validateTimestamp(ts: string): { valid: boolean; error?: string } {
	const timestamp = new Date(ts).getTime();
	const now = Date.now();

	if (Number.isNaN(timestamp)) {
		return { valid: false, error: 'G0_INVALID_TIMESTAMP: Cannot parse timestamp' };
	}

	if (timestamp > now + MAX_FUTURE_DRIFT_MS) {
		return {
			valid: false,
			error: `G0_FAKE_TIMESTAMP: ${ts} is in the future (>${MAX_FUTURE_DRIFT_MS}ms ahead)`,
		};
	}

	if (timestamp < now - MAX_STALENESS_MS) {
		return {
			valid: false,
			error: `G0_STALE_TIMESTAMP: ${ts} is too old (>${MAX_STALENESS_MS}ms ago)`,
		};
	}

	return { valid: true };
}
// >>>>>>> STATE_MERGE_MARKER: G0_TIMESTAMP_VALIDATION_FIX_20251231

export const SignalSchema = z
	.object({
		ts: z.string().datetime(),
		mark: z.number().min(0).max(1),
		pull: z.enum(['upstream', 'downstream', 'lateral']),
		msg: z.string().min(1),
		type: z.enum(['signal', 'event', 'error', 'metric', 'handoff']),
		hive: HIVEPhaseSchema,
		gen: z.number().int().min(1),
		port: z.number().int().min(0).max(7),
	})
	// <<<<<<< STATE_MERGE_MARKER: G0_TIMESTAMP_REFINEMENT_20251231
	.refine(
		(signal) => {
			const result = validateTimestamp(signal.ts);
			return result.valid;
		},
		{
			message: 'G0_TIMESTAMP_VIOLATION: Timestamp is fake (future) or stale (>5 min)',
			path: ['ts'],
		},
	);
// >>>>>>> STATE_MERGE_MARKER: G0_TIMESTAMP_REFINEMENT_20251231

export type Signal = z.infer<typeof SignalSchema>;

export const TransitionResultSchema = z.object({
	valid: z.boolean(),
	from: HIVEPhaseSchema,
	to: HIVEPhaseSchema,
	reason: z.string().optional(),
	violation: z
		.enum([
			'SKIPPED_HUNT',
			'SKIPPED_INTERLOCK',
			'SKIPPED_VALIDATE',
			'REWARD_HACK',
			'INVALID_HANDOFF',
			'UNKNOWN_PHASE',
		])
		.optional(),
});

export type TransitionResult = z.infer<typeof TransitionResultSchema>;

// =============================================================================
// ALLOWED TRANSITIONS
// =============================================================================

/**
 * HIVE Phase Transition Matrix
 *
 * Key insight: Phases can repeat (H→H, I→I, etc.) but cannot skip.
 * X (Handoff) is allowed only at phase boundaries.
 */
export const ALLOWED_TRANSITIONS: Record<HIVEPhase, HIVEPhase[]> = {
	H: ['H', 'I', 'X'], // Hunt can continue or move to Interlock
	I: ['I', 'V', 'X'], // Interlock can continue or move to Validate
	V: ['V', 'E', 'X'], // Validate can continue or move to Evolve
	E: ['E', 'H', 'X'], // Evolve can continue or STRANGE LOOP back to Hunt
	X: ['H', 'I', 'V', 'E'], // Handoff can transition to any phase (boundary marker)
};

/**
 * Violation messages for clarity
 */
export const VIOLATION_MESSAGES: Record<string, string> = {
	SKIPPED_HUNT: 'Cannot start HIVE cycle without Hunt phase. Search first!',
	SKIPPED_INTERLOCK: 'Cannot jump to Validate without Interlock. Write failing tests first!',
	SKIPPED_VALIDATE: 'Cannot jump to Evolve without Validate. Make tests pass first!',
	REWARD_HACK: 'REWARD HACK DETECTED: Going GREEN without prior RED is forbidden!',
	INVALID_HANDOFF: 'Handoff (X) must occur at phase boundaries, not mid-phase.',
	UNKNOWN_PHASE: 'Unknown HIVE phase encountered.',
};

// =============================================================================
// VALIDATOR CLASS
// =============================================================================

export class HIVEValidator {
	private signalHistory: Signal[] = [];
	private maxHistorySize: number;

	constructor(maxHistorySize = 100) {
		this.maxHistorySize = maxHistorySize;
	}

	/**
	 * Get the current HIVE phase from the last non-handoff signal
	 */
	getCurrentPhase(): HIVEPhase | null {
		for (let i = this.signalHistory.length - 1; i >= 0; i--) {
			const signal = this.signalHistory[i];
			if (signal.hive !== 'X') {
				return signal.hive;
			}
		}
		return null; // No signals yet, start is allowed
	}

	/**
	 * Validate a phase transition
	 */
	validateTransition(from: HIVEPhase | null, to: HIVEPhase): TransitionResult {
		// First signal can be H only (start with Hunt)
		if (from === null) {
			if (to === 'H') {
				return { valid: true, from: 'H', to, reason: 'Starting HIVE cycle with Hunt' };
			}
			return {
				valid: false,
				from: 'H',
				to,
				reason: VIOLATION_MESSAGES.SKIPPED_HUNT,
				violation: 'SKIPPED_HUNT',
			};
		}

		// Check if transition is allowed
		const allowed = ALLOWED_TRANSITIONS[from];
		if (allowed.includes(to)) {
			return {
				valid: true,
				from,
				to,
				reason: `Valid transition: ${from} → ${to}`,
			};
		}

		// Determine specific violation
		let violation: TransitionResult['violation'] = 'UNKNOWN_PHASE';
		if (from === 'H' && to === 'V') {
			violation = 'SKIPPED_INTERLOCK';
		} else if (from === 'H' && to === 'E') {
			violation = 'SKIPPED_INTERLOCK';
		} else if (from === 'I' && to === 'E') {
			violation = 'SKIPPED_VALIDATE';
		} else if (from === 'H' && to === 'V') {
			violation = 'REWARD_HACK'; // Trying to go GREEN without RED
		}

		return {
			valid: false,
			from,
			to,
			reason: VIOLATION_MESSAGES[violation] || `Invalid transition: ${from} → ${to}`,
			violation,
		};
	}

	/**
	 * Check if a proposed signal can be emitted
	 */
	canEmitSignal(proposed: Signal): TransitionResult {
		const currentPhase = this.getCurrentPhase();
		return this.validateTransition(currentPhase, proposed.hive);
	}

	/**
	 * Record a signal (after validation)
	 */
	recordSignal(signal: Signal): void {
		this.signalHistory.push(signal);

		// Trim history if needed
		if (this.signalHistory.length > this.maxHistorySize) {
			this.signalHistory = this.signalHistory.slice(-this.maxHistorySize);
		}
	}

	/**
	 * Get the last N signals
	 */
	getLastNSignals(n: number): Signal[] {
		return this.signalHistory.slice(-n);
	}

	/**
	 * Load signal history (e.g., from blackboard file)
	 */
	loadHistory(signals: Signal[]): void {
		this.signalHistory = signals.slice(-this.maxHistorySize);
	}

	/**
	 * Get HIVE cycle statistics
	 */
	getCycleStats(): {
		totalSignals: number;
		byPhase: Record<HIVEPhase, number>;
		currentPhase: HIVEPhase | null;
		completedCycles: number;
	} {
		const byPhase: Record<HIVEPhase, number> = { H: 0, I: 0, V: 0, E: 0, X: 0 };

		for (const signal of this.signalHistory) {
			byPhase[signal.hive]++;
		}

		// Count completed cycles (H→I→V→E sequences)
		let completedCycles = 0;
		let lastPhase: HIVEPhase | null = null;
		const cyclePhases: HIVEPhase[] = [];

		for (const signal of this.signalHistory) {
			if (signal.hive === 'X') continue;

			if (signal.hive !== lastPhase) {
				cyclePhases.push(signal.hive);
				lastPhase = signal.hive;

				// Check for completed cycle
				if (cyclePhases.length >= 4) {
					const last4 = cyclePhases.slice(-4);
					if (last4[0] === 'H' && last4[1] === 'I' && last4[2] === 'V' && last4[3] === 'E') {
						completedCycles++;
					}
				}
			}
		}

		return {
			totalSignals: this.signalHistory.length,
			byPhase,
			currentPhase: this.getCurrentPhase(),
			completedCycles,
		};
	}

	/**
	 * Reset the validator (for testing)
	 */
	reset(): void {
		this.signalHistory = [];
	}
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let globalValidator: HIVEValidator | null = null;

export function getHIVEValidator(): HIVEValidator {
	if (!globalValidator) {
		globalValidator = new HIVEValidator();
	}
	return globalValidator;
}

export function resetHIVEValidator(): void {
	globalValidator = null;
}

// =============================================================================
// PORT-PHASE MAPPING (HIVE/8 Anti-Diagonal)
// =============================================================================

/**
 * Maps HIVE phases to their primary ports (anti-diagonal sum = 7)
 */
export const PHASE_PORT_MAP: Record<HIVEPhase, [number, number]> = {
	H: [0, 7], // Lidless Legion + Spider Sovereign
	I: [1, 6], // Web Weaver + Kraken Keeper
	V: [2, 5], // Mirror Magus + Pyre Praetorian
	E: [3, 4], // Spore Storm + Red Regnant
	X: [7, 7], // Spider Sovereign handles handoffs
};

/**
 * Check if a port is valid for a given phase
 */
export function isPortValidForPhase(port: number, phase: HIVEPhase): boolean {
	const validPorts = PHASE_PORT_MAP[phase];
	return validPorts.includes(port);
}

/**
 * Get recommended port for a phase
 */
export function getRecommendedPort(phase: HIVEPhase): number {
	return PHASE_PORT_MAP[phase][0];
}
