/**
 * Pyre Praetorian Daemon - HIVE/8 Sequence Validator
 * ===================================================
 *
 * Port 5 - DEFEND - "How do we DEFEND the DEFEND?"
 *
 * The Pyre Praetorian is the Immunizer, the flame that judges itself.
 * This daemon watches the blackboard and enforces HIVE phase sequence:
 *   H (Hunt) → I (Interlock) → V (Validate) → E (Evolve) → H (N+1)
 *
 * Violations detected:
 *   - IR-0001: HIVE_SEQUENCE_VIOLATION (H→V skip, V→I inversion)
 *   - IR-0005: TIMESTAMP_FABRICATION (batch emissions, future timestamps)
 *
 * "The flame that judges itself."
 *
 * @module gates/pyre-praetorian-daemon
 * @owner Port 5 - Pyre Praetorian
 */

import { z } from 'zod';
import type { HIVEPhase } from '../contracts/hfo-ports.js';

// ============================================================================
// SIGNAL SCHEMA (G0-G7 Gates)
// ============================================================================

/**
 * 8-Field Stigmergy Signal Schema
 * Each field maps to a port (G0-G7 gates)
 */
export const StigmergySignalSchema = z.object({
	ts: z.string().datetime(), // G0: Port 0 - SENSE - valid ISO8601
	mark: z.number().min(0).max(1), // G1: Port 1 - FUSE - confidence 0-1
	pull: z.enum(['upstream', 'downstream', 'lateral']), // G2: Port 2 - SHAPE
	msg: z.string().min(1), // G3: Port 3 - DELIVER - non-empty
	type: z.enum(['signal', 'event', 'error', 'metric']), // G4: Port 4 - TEST
	hive: z.enum(['H', 'I', 'V', 'E', 'X']), // G5: Port 5 - DEFEND
	gen: z.number().int().min(85), // G6: Port 6 - STORE - gen ≥ 85
	port: z.number().int().min(0).max(7), // G7: Port 7 - DECIDE
});

export type StigmergySignal = z.infer<typeof StigmergySignalSchema>;

// ============================================================================
// HIVE SEQUENCE RULES
// ============================================================================

/**
 * Valid HIVE phase transitions
 * H → I, H → H (restart)
 * I → V, I → H (abort)
 * V → E, V → H (abort)
 * E → H (cycle complete)
 * X is exceptional - can go anywhere
 */
export const VALID_TRANSITIONS: Record<HIVEPhase | 'X', Array<HIVEPhase | 'X'>> = {
	H: ['I', 'H', 'X'], // Hunt can go to Interlock, restart, or exceptional
	I: ['V', 'H', 'X'], // Interlock can go to Validate, abort to Hunt, or exceptional
	V: ['E', 'H', 'X'], // Validate can go to Evolve, abort to Hunt, or exceptional
	E: ['H', 'X'], // Evolve MUST go to Hunt (cycle complete) or exceptional
	X: ['H', 'I', 'V', 'E', 'X'], // Exceptional can go anywhere
};

/**
 * HIVE phase order for sequence validation
 */
export const HIVE_ORDER: Record<HIVEPhase, number> = {
	H: 0,
	I: 1,
	V: 2,
	E: 3,
};

// ============================================================================
// VIOLATION TYPES
// ============================================================================

export type ViolationType =
	| 'SKIPPED_PHASE' // H→V (missing I), I→E (missing V)
	| 'PHASE_INVERSION' // V→I, E→V, E→I (going backwards)
	| 'BATCH_FABRICATION' // Multiple signals at identical timestamp
	| 'FUTURE_TIMESTAMP' // Signal timestamp in the future
	| 'TIMESTAMP_PROXIMITY' // |ts - now| > 60 seconds
	| 'REWARD_HACK'; // GREEN without prior RED

export interface HIVEViolation {
	type: ViolationType;
	severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
	message: string;
	signal: StigmergySignal;
	previousSignal?: StigmergySignal;
	timestamp: string;
}

// ============================================================================
// PYRE PRAETORIAN DAEMON
// ============================================================================

export interface PyrePraetorianConfig {
	/** Maximum allowed time drift in milliseconds (default: 60000 = 60 seconds) */
	maxTimeDriftMs: number;
	/** Whether to quarantine violations (default: true) */
	quarantineOnViolation: boolean;
	/** Callback for violations */
	onViolation?: (violation: HIVEViolation) => void;
	/** Whether to allow X (exceptional) phase to bypass rules */
	allowExceptional: boolean;
	/** Whether to validate timestamps (default: true). Set false for testing. */
	validateTimestamps: boolean;
}

export const DEFAULT_CONFIG: PyrePraetorianConfig = {
	maxTimeDriftMs: 60_000, // 60 seconds
	quarantineOnViolation: true,
	allowExceptional: true,
	validateTimestamps: true,
};

/**
 * Pyre Praetorian Daemon - Real-time HIVE sequence validator
 *
 * @example
 * ```typescript
 * const daemon = new PyrePraetorianDaemon();
 * const result = daemon.validateSignal(newSignal);
 * if (!result.valid) {
 *   console.error('HIVE violation:', result.violations);
 * }
 * ```
 */
export class PyrePraetorianDaemon {
	private config: PyrePraetorianConfig;
	private signalHistory: StigmergySignal[] = [];
	private violations: HIVEViolation[] = [];
	private lastPhase: HIVEPhase | 'X' | null = null;

	constructor(config: Partial<PyrePraetorianConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	// ============================================================================
	// CORE VALIDATION
	// ============================================================================

	/**
	 * Validate a signal against G0-G7 gates
	 */
	validateGates(signal: unknown): { valid: boolean; errors: string[] } {
		const result = StigmergySignalSchema.safeParse(signal);
		if (!result.success) {
			const errors = result.error.errors.map(
				(e) => `G${this.getGateNumber(e.path[0] as string)}: ${e.message}`,
			);
			return { valid: false, errors };
		}
		return { valid: true, errors: [] };
	}

	/**
	 * Map field to gate number
	 */
	private getGateNumber(field: string): number {
		const gates: Record<string, number> = {
			ts: 0,
			mark: 1,
			pull: 2,
			msg: 3,
			type: 4,
			hive: 5,
			gen: 6,
			port: 7,
		};
		return gates[field] ?? -1;
	}

	/**
	 * Validate a signal and check HIVE sequence
	 */
	validateSignal(
		signal: StigmergySignal,
		now: Date = new Date(),
	): { valid: boolean; violations: HIVEViolation[] } {
		const violations: HIVEViolation[] = [];

		// Gate validation first
		const gateResult = this.validateGates(signal);
		if (!gateResult.valid) {
			violations.push({
				type: 'REWARD_HACK', // Using gates to escape validation is a hack
				severity: 'CRITICAL',
				message: `Gate validation failed: ${gateResult.errors.join(', ')}`,
				signal,
				timestamp: now.toISOString(),
			});
		}

		// Timestamp validation (optional, can be disabled for testing)
		if (this.config.validateTimestamps) {
			const tsViolations = this.validateTimestamp(signal, now);
			violations.push(...tsViolations);
		}

		// HIVE sequence validation
		const sequenceViolations = this.validateSequence(signal);
		violations.push(...sequenceViolations);

		// Batch fabrication detection
		const batchViolations = this.detectBatchFabrication(signal);
		violations.push(...batchViolations);

		// Record violations and update state
		if (violations.length > 0) {
			this.violations.push(...violations);
			if (this.config.onViolation) {
				for (const v of violations) {
					this.config.onViolation(v);
				}
			}
		}

		// Update history
		this.signalHistory.push(signal);
		this.lastPhase = signal.hive as HIVEPhase | 'X';

		return { valid: violations.length === 0, violations };
	}

	// ============================================================================
	// TIMESTAMP VALIDATION
	// ============================================================================

	/**
	 * Validate timestamp is not in future and within drift tolerance
	 */
	private validateTimestamp(signal: StigmergySignal, now: Date): HIVEViolation[] {
		const violations: HIVEViolation[] = [];
		const signalTime = new Date(signal.ts);
		const drift = signalTime.getTime() - now.getTime();

		// Future timestamp
		if (drift > 1000) {
			// Allow 1 second for clock drift
			violations.push({
				type: 'FUTURE_TIMESTAMP',
				severity: 'MEDIUM',
				message: `Signal timestamp ${signal.ts} is ${drift}ms in the future`,
				signal,
				timestamp: now.toISOString(),
			});
		}

		// Timestamp proximity (too far in past)
		if (-drift > this.config.maxTimeDriftMs) {
			violations.push({
				type: 'TIMESTAMP_PROXIMITY',
				severity: 'MEDIUM',
				message: `Signal timestamp ${signal.ts} is ${-drift}ms in the past (max: ${this.config.maxTimeDriftMs}ms)`,
				signal,
				timestamp: now.toISOString(),
			});
		}

		return violations;
	}

	// ============================================================================
	// HIVE SEQUENCE VALIDATION
	// ============================================================================

	/**
	 * Validate HIVE phase transition
	 */
	private validateSequence(signal: StigmergySignal): HIVEViolation[] {
		const violations: HIVEViolation[] = [];
		const currentPhase = signal.hive as HIVEPhase | 'X';

		// First signal - no sequence to validate
		if (this.lastPhase === null) {
			return violations;
		}

		// Allow X (exceptional) to go anywhere if configured
		if (this.config.allowExceptional && (currentPhase === 'X' || this.lastPhase === 'X')) {
			return violations;
		}

		const validNextPhases = VALID_TRANSITIONS[this.lastPhase];

		// Check if transition is valid
		if (!validNextPhases.includes(currentPhase)) {
			const lastOrder = HIVE_ORDER[this.lastPhase as HIVEPhase] ?? -1;
			const currentOrder = HIVE_ORDER[currentPhase as HIVEPhase] ?? -1;

			// Determine violation type
			let violationType: ViolationType;
			let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';

			if (currentOrder < lastOrder && currentPhase !== 'H') {
				// Going backwards (not to H which is valid abort)
				violationType = 'PHASE_INVERSION';
				severity = 'CRITICAL';
			} else if (currentOrder > lastOrder + 1) {
				// Skipped a phase
				violationType = 'SKIPPED_PHASE';
				severity = 'CRITICAL';
			} else {
				// Generic invalid transition
				violationType = 'REWARD_HACK';
				severity = 'HIGH';
			}

			const lastSignal = this.signalHistory[this.signalHistory.length - 1];

			violations.push({
				type: violationType,
				severity,
				message: `Invalid transition ${this.lastPhase}→${currentPhase}. Valid: ${validNextPhases.join(', ')}`,
				signal,
				previousSignal: lastSignal!,
				timestamp: new Date().toISOString(),
			});
		}

		return violations;
	}

	// ============================================================================
	// BATCH FABRICATION DETECTION
	// ============================================================================

	/**
	 * Detect batch fabrication (multiple signals at same timestamp)
	 * Only triggers if timestamps match AND signals are DIFFERENT phases
	 * (same phase repeat is allowed for heartbeats etc)
	 */
	private detectBatchFabrication(signal: StigmergySignal): HIVEViolation[] {
		const violations: HIVEViolation[] = [];

		// Check last 5 signals for identical timestamps with DIFFERENT phases
		const recentSignals = this.signalHistory.slice(-5);
		const matchingTimestamps = recentSignals.filter(
			(s) => s.ts === signal.ts && s.hive !== signal.hive,
		);

		if (matchingTimestamps.length > 0) {
			violations.push({
				type: 'BATCH_FABRICATION',
				severity: 'HIGH',
				message: `Signal has identical timestamp to ${matchingTimestamps.length} recent signal(s) with different phases. Batch fabrication detected.`,
				signal,
				previousSignal: matchingTimestamps[0]!,
				timestamp: new Date().toISOString(),
			});
		}

		return violations;
	}

	// ============================================================================
	// BLACKBOARD ANALYSIS
	// ============================================================================

	/**
	 * Analyze an array of blackboard signals for violations
	 */
	analyzeBlackboard(signals: StigmergySignal[]): {
		valid: boolean;
		totalViolations: number;
		violations: HIVEViolation[];
		summary: Record<ViolationType, number>;
	} {
		// Reset state for fresh analysis
		this.reset();

		const allViolations: HIVEViolation[] = [];
		const summary: Record<ViolationType, number> = {
			SKIPPED_PHASE: 0,
			PHASE_INVERSION: 0,
			BATCH_FABRICATION: 0,
			FUTURE_TIMESTAMP: 0,
			TIMESTAMP_PROXIMITY: 0,
			REWARD_HACK: 0,
		};

		for (const signal of signals) {
			const result = this.validateSignal(signal);
			allViolations.push(...result.violations);

			for (const v of result.violations) {
				summary[v.type]++;
			}
		}

		return {
			valid: allViolations.length === 0,
			totalViolations: allViolations.length,
			violations: allViolations,
			summary,
		};
	}

	// ============================================================================
	// STATE MANAGEMENT
	// ============================================================================

	/**
	 * Reset daemon state
	 */
	reset(): void {
		this.signalHistory = [];
		this.violations = [];
		this.lastPhase = null;
	}

	/**
	 * Get all recorded violations
	 */
	getViolations(): HIVEViolation[] {
		return [...this.violations];
	}

	/**
	 * Get signal history
	 */
	getHistory(): StigmergySignal[] {
		return [...this.signalHistory];
	}

	/**
	 * Get current phase
	 */
	getCurrentPhase(): HIVEPhase | 'X' | null {
		return this.lastPhase;
	}

	// ============================================================================
	// STATIC UTILITIES
	// ============================================================================

	/**
	 * Check if a phase transition is valid
	 */
	static isValidTransition(from: HIVEPhase | 'X', to: HIVEPhase | 'X'): boolean {
		return VALID_TRANSITIONS[from].includes(to);
	}

	/**
	 * Get expected next phases
	 */
	static getExpectedNextPhases(current: HIVEPhase | 'X'): Array<HIVEPhase | 'X'> {
		return [...VALID_TRANSITIONS[current]];
	}

	/**
	 * Create a signal with current timestamp
	 */
	static createSignal(
		partial: Partial<StigmergySignal> & { msg: string; port: number; hive: HIVEPhase | 'X' },
	): StigmergySignal {
		return {
			ts: new Date().toISOString(),
			mark: 1.0,
			pull: 'downstream',
			type: 'signal',
			gen: 87,
			...partial,
		};
	}
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PyrePraetorianDaemon;
