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
// PERIODIC REPORT TYPES
// ============================================================================

/**
 * Stigmergy emitter interface (JSONL now, NATS later)
 * Abstracted for easy swap to NATS when ready
 */
export interface StigmergyEmitter {
	emit(signal: StigmergySignal): void | Promise<void>;
}

/**
 * Periodic health report emitted by Pyre Praetorian
 */
export interface PyreHealthReport {
	/** Report timestamp */
	reportTs: string;
	/** Period start timestamp */
	periodStart: string;
	/** Period end timestamp */
	periodEnd: string;
	/** Total signals validated in period */
	signalsValidated: number;
	/** Total violations detected in period */
	violationsDetected: number;
	/** Breakdown by violation type */
	violationsByType: Record<ViolationType, number>;
	/** Breakdown by severity */
	violationsBySeverity: Record<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', number>;
	/** Current HIVE phase */
	currentPhase: HIVEPhase | 'X' | null;
	/** Health status based on violations */
	status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
	/** Daemon uptime in milliseconds */
	uptimeMs: number;
	/** Git commits detected in signals (optional) */
	gitCommits?: GitCommitInfo[];
	/** Total signals in blackboard (optional) */
	blackboardSignals?: number;
}

// ============================================================================
// PYRE PRAETORIAN DAEMON
// ============================================================================

/**
 * Git commit info extracted from signal messages
 */
export interface GitCommitInfo {
	hash: string;
	message: string;
	timestamp: string;
	signalTs: string;
}

/**
 * Blackboard reader function type
 * Allows injection of file reading for testability
 */
export type BlackboardReader = (filePath: string) => string;

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
	/** Periodic report interval in milliseconds (default: 5 minutes). Set 0 to disable. */
	reportIntervalMs: number;
	/** Blackboard file path for reading signals (default: 'obsidianblackboard.jsonl') */
	blackboardPath?: string;
	/** Blackboard file reader function (injectable for testing) */
	blackboardReader?: BlackboardReader;
	/** Stigmergy emitter for periodic reports (JSONL now, NATS later) */
	emitter?: StigmergyEmitter;
}

export const DEFAULT_CONFIG: PyrePraetorianConfig = {
	maxTimeDriftMs: 60_000, // 60 seconds
	quarantineOnViolation: true,
	allowExceptional: true,
	validateTimestamps: true,
	reportIntervalMs: 5 * 60 * 1000, // 5 minutes
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

	// Periodic reporting state
	private reportTimer: ReturnType<typeof setInterval> | null = null;
	private startTime: Date;
	private lastReportTime: Date;
	private periodViolations: HIVEViolation[] = [];
	private periodSignalCount: number = 0;

	// Blackboard watching state
	private watchTimer: ReturnType<typeof setInterval> | null = null;
	private lastProcessedIndex: number = 0;
	private gitCommits: GitCommitInfo[] = [];

	constructor(config: Partial<PyrePraetorianConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.startTime = new Date();
		this.lastReportTime = new Date();
	}

	// ============================================================================
	// PERIODIC REPORTING (JSONL now, NATS later)
	// ============================================================================

	/**
	 * Start periodic health reports
	 * Emits a stigmergy signal every X minutes with violation summary
	 */
	startPeriodicReports(): void {
		if (this.reportTimer) {
			return; // Already running
		}

		if (this.config.reportIntervalMs <= 0 || !this.config.emitter) {
			return; // Disabled or no emitter
		}

		this.reportTimer = setInterval(() => {
			this.emitHealthReport();
		}, this.config.reportIntervalMs);

		// Emit initial report
		this.emitHealthReport();
	}

	/**
	 * Stop periodic health reports
	 */
	stopPeriodicReports(): void {
		if (this.reportTimer) {
			clearInterval(this.reportTimer);
			this.reportTimer = null;
		}
	}

	/**
	 * Generate and emit a health report to stigmergy
	 */
	emitHealthReport(): void {
		if (!this.config.emitter) {
			return;
		}

		const report = this.generateHealthReport();
		const signal = this.createReportSignal(report);

		// Emit via configured emitter (JSONL now, NATS later)
		this.config.emitter.emit(signal);

		// Reset period counters
		this.resetPeriodCounters();
	}

	/**
	 * Generate health report for current period
	 */
	generateHealthReport(): PyreHealthReport {
		const now = new Date();

		// Count violations by type
		const violationsByType: Record<ViolationType, number> = {
			SKIPPED_PHASE: 0,
			PHASE_INVERSION: 0,
			BATCH_FABRICATION: 0,
			FUTURE_TIMESTAMP: 0,
			TIMESTAMP_PROXIMITY: 0,
			REWARD_HACK: 0,
		};

		// Count violations by severity
		const violationsBySeverity: Record<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', number> = {
			CRITICAL: 0,
			HIGH: 0,
			MEDIUM: 0,
			LOW: 0,
		};

		for (const v of this.periodViolations) {
			violationsByType[v.type]++;
			violationsBySeverity[v.severity]++;
		}

		// Determine health status
		let status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
		if (violationsBySeverity.CRITICAL > 0) {
			status = 'CRITICAL';
		} else if (violationsBySeverity.HIGH > 0 || this.periodViolations.length > 5) {
			status = 'DEGRADED';
		}

		// Include git commits and blackboard count
		const recentGitCommits = this.gitCommits.slice(-5); // Last 5 commits
		const blackboardSignals = this.signalHistory.length;

		// Build report - only include optional fields if they have data
		const report: PyreHealthReport = {
			reportTs: now.toISOString(),
			periodStart: this.lastReportTime.toISOString(),
			periodEnd: now.toISOString(),
			signalsValidated: this.periodSignalCount,
			violationsDetected: this.periodViolations.length,
			violationsByType,
			violationsBySeverity,
			currentPhase: this.lastPhase,
			status,
			uptimeMs: now.getTime() - this.startTime.getTime(),
		};

		// Add optional fields only if they have content
		if (recentGitCommits.length > 0) {
			report.gitCommits = recentGitCommits;
		}
		if (blackboardSignals > 0) {
			report.blackboardSignals = blackboardSignals;
		}

		return report;
	}

	/**
	 * Create a stigmergy signal from health report
	 */
	private createReportSignal(report: PyreHealthReport): StigmergySignal {
		const emoji = report.status === 'HEALTHY' ? '✅' : report.status === 'DEGRADED' ? '⚠️' : '🔥';
		const summary = `${emoji} PYRE HEALTH: ${report.status} | ${report.signalsValidated} signals | ${report.violationsDetected} violations | Phase: ${report.currentPhase ?? 'NULL'}`;

		return {
			ts: report.reportTs,
			mark: report.status === 'HEALTHY' ? 1.0 : report.status === 'DEGRADED' ? 0.5 : 0.0,
			pull: 'downstream',
			msg: JSON.stringify({ type: 'PYRE_HEALTH_REPORT', summary, report }),
			type: 'metric',
			hive: 'V', // Pyre is in V phase (Port 5)
			gen: 87,
			port: 5, // Port 5 = Pyre Praetorian
		};
	}

	/**
	 * Reset period counters after report emission
	 */
	private resetPeriodCounters(): void {
		this.lastReportTime = new Date();
		this.periodViolations = [];
		this.periodSignalCount = 0;
	}

	// ============================================================================
	// BLACKBOARD READING & WATCHING
	// ============================================================================

	/**
	 * Read and parse the blackboard JSONL file
	 * Returns parsed signals (valid ones only)
	 */
	readBlackboardFile(): StigmergySignal[] {
		if (!this.config.blackboardPath || !this.config.blackboardReader) {
			return [];
		}

		try {
			const content = this.config.blackboardReader(this.config.blackboardPath);
			const lines = content.split('\n').filter((line) => line.trim());
			const signals: StigmergySignal[] = [];

			for (const line of lines) {
				try {
					const parsed = JSON.parse(line);
					// Check if it's a valid HIVE signal (has hive field)
					if (parsed && typeof parsed.hive === 'string') {
						const result = StigmergySignalSchema.safeParse(parsed);
						if (result.success) {
							signals.push(result.data);
							// Git commits are now extracted in validateSignal()
						}
					}
				} catch {
					// Skip invalid JSON lines
				}
			}

			return signals;
		} catch {
			return [];
		}
	}

	/**
	 * Extract git commit info from signal message
	 * Looks for patterns like "commit abc123" or "Git commit abc123"
	 */
	private extractGitCommit(signal: StigmergySignal): void {
		const msg = signal.msg;
		// Multiple patterns for git commits:
		// - "commit abc123" or "Git commit abc123"
		// - "commit: abc123" or "Commit: abc123"
		// - "EVOLVE: Git commit abc123 -"
		// - Just a hash after common keywords
		const patterns = [
			/(?:commit|git commit)[:\s]+([a-f0-9]{7,40})/i,
			/(?:merged|pushed|cherry-picked?)[:\s]+([a-f0-9]{7,40})/i,
			/\b([a-f0-9]{40})\b/, // Full SHA
		];

		for (const pattern of patterns) {
			const match = msg.match(pattern);
			if (match?.[1]) {
				// Avoid duplicates
				const existing = this.gitCommits.find((c) => c.hash === match[1]);
				if (!existing) {
					this.gitCommits.push({
						hash: match[1],
						message: msg.substring(0, 200), // Truncate long messages
						timestamp: new Date().toISOString(),
						signalTs: signal.ts,
					});
				}
				break; // Only extract first match
			}
		}
	}

	/**
	 * Scan blackboard file and validate all signals
	 * Call this on startup to detect existing violations
	 */
	scanBlackboard(): {
		signalsFound: number;
		signalsValidated: number;
		violations: HIVEViolation[];
		gitCommits: GitCommitInfo[];
	} {
		const signals = this.readBlackboardFile();
		const result = this.analyzeBlackboard(signals);

		return {
			signalsFound: signals.length,
			signalsValidated: signals.length,
			violations: result.violations,
			gitCommits: [...this.gitCommits],
		};
	}

	/**
	 * Start watching the blackboard file for new signals
	 * Polls at the report interval (or 10 seconds if faster)
	 */
	startWatchingBlackboard(pollIntervalMs?: number): void {
		if (this.watchTimer) {
			return; // Already watching
		}

		if (!this.config.blackboardPath || !this.config.blackboardReader) {
			console.warn('[PYRE] Cannot watch blackboard: no path or reader configured');
			return;
		}

		// Initial scan
		const initialScan = this.scanBlackboard();
		this.lastProcessedIndex = initialScan.signalsFound;

		const interval = pollIntervalMs ?? Math.min(this.config.reportIntervalMs, 10_000);

		this.watchTimer = setInterval(() => {
			this.pollBlackboard();
		}, interval);
	}

	/**
	 * Stop watching the blackboard file
	 */
	stopWatchingBlackboard(): void {
		if (this.watchTimer) {
			clearInterval(this.watchTimer);
			this.watchTimer = null;
		}
	}

	/**
	 * Poll blackboard for new signals since last check
	 */
	private pollBlackboard(): void {
		const signals = this.readBlackboardFile();

		// Process only new signals
		if (signals.length > this.lastProcessedIndex) {
			const newSignals = signals.slice(this.lastProcessedIndex);

			for (const signal of newSignals) {
				// Skip our own health report signals to avoid circular validation
				if (signal.msg.includes('PYRE_HEALTH_REPORT')) {
					continue;
				}
				this.validateSignal(signal);
			}

			this.lastProcessedIndex = signals.length;
		}
	}

	/**
	 * Get detected git commits
	 */
	getGitCommits(): GitCommitInfo[] {
		return [...this.gitCommits];
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
			this.periodViolations.push(...violations); // Track for periodic report
			if (this.config.onViolation) {
				for (const v of violations) {
					this.config.onViolation(v);
				}
			}
		}

		// Extract git commit info from signal message
		this.extractGitCommit(signal);

		// Update history and period counters
		this.signalHistory.push(signal);
		this.lastPhase = signal.hive as HIVEPhase | 'X';
		this.periodSignalCount++; // Track for periodic report

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

		// Get valid transitions, filtering out X if exceptional is disabled
		let validNextPhases = VALID_TRANSITIONS[this.lastPhase];
		if (!this.config.allowExceptional) {
			// When exceptional is disabled, X is NOT a valid target from any phase
			validNextPhases = validNextPhases.filter(p => p !== 'X');
			
			// Also, transitioning TO X is not allowed
			if (currentPhase === 'X') {
				const lastSignal = this.signalHistory[this.signalHistory.length - 1];
				const violation: HIVEViolation = {
					type: 'SKIPPED_PHASE',
					severity: 'CRITICAL',
					message: `X (exceptional) phase not allowed when allowExceptional=false. Transition ${this.lastPhase}→X blocked.`,
					signal,
					timestamp: new Date().toISOString(),
				};
				if (lastSignal) {
					violation.previousSignal = lastSignal;
				}
				violations.push(violation);
				return violations;
			}
		}

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

			const violation: HIVEViolation = {
				type: violationType,
				severity,
				message: `Invalid transition ${this.lastPhase}→${currentPhase}. Valid: ${validNextPhases.join(', ')}`,
				signal,
				timestamp: new Date().toISOString(),
			};
			if (lastSignal) {
				violation.previousSignal = lastSignal;
			}
			violations.push(violation);
		}

		return violations;
	}

	// ============================================================================
	// BATCH FABRICATION DETECTION
	// ============================================================================

	/**
	 * Check if a signal is part of a PYRE OCTOPULSE signature
	 * OCTOPULSE = 8 signals at same timestamp, ports 0-7, type=metric, msg contains "PYRE_OCTOPULSE"
	 * This is the Pyre Praetorian's unique heartbeat signature, NOT a violation
	 */
	private isPartOfOctopulse(signal: StigmergySignal, matchingSignals: StigmergySignal[]): boolean {
		// Signal must be metric type with OCTOPULSE in message
		if (signal.type !== 'metric' || !signal.msg.includes('PYRE_OCTOPULSE')) {
			return false;
		}
		
		// All matching signals must also be OCTOPULSE metrics
		const allOctopulseMetrics = matchingSignals.every(
			s => s.type === 'metric' && s.msg.includes('PYRE_OCTOPULSE')
		);
		if (!allOctopulseMetrics) {
			return false;
		}
		
		// Check that we're building toward a complete set of ports 0-7
		const allSignals = [...matchingSignals, signal];
		const ports = new Set(allSignals.map(s => s.port));
		
		// Valid OCTOPULSE: unique ports, all in range 0-7
		// Can be partial (building up) or complete (all 8)
		if (ports.size !== allSignals.length) {
			return false; // Duplicate port = not valid OCTOPULSE
		}
		
		for (const port of ports) {
			if (port < 0 || port > 7) {
				return false;
			}
		}
		
		return true;
	}

	/**
	 * Detect batch fabrication (multiple signals at same timestamp)
	 * Only triggers if timestamps match AND signals are DIFFERENT phases
	 * EXCEPTION: PYRE OCTOPULSE signature (8 signals, ports 0-7) is intentional
	 */
	private detectBatchFabrication(signal: StigmergySignal): HIVEViolation[] {
		const violations: HIVEViolation[] = [];

		// Check last 8 signals for identical timestamps
		const recentSignals = this.signalHistory.slice(-8);
		const matchingTimestamps = recentSignals.filter(s => s.ts === signal.ts);
		
		// Check if this is part of a PYRE OCTOPULSE pattern
		if (matchingTimestamps.length > 0 && this.isPartOfOctopulse(signal, matchingTimestamps)) {
			// This is part of a valid PYRE OCTOPULSE - not a violation!
			return [];
		}
		
		// Check for violations (different phases at same timestamp)
		const differentPhases = matchingTimestamps.filter(s => s.hive !== signal.hive);

		if (differentPhases.length > 0) {
			const violation: HIVEViolation = {
				type: 'BATCH_FABRICATION',
				severity: 'HIGH',
				message: `Signal has identical timestamp to ${differentPhases.length} recent signal(s) with different phases. Batch fabrication detected.`,
				signal,
				timestamp: new Date().toISOString(),
			};
			if (differentPhases[0]) {
				violation.previousSignal = differentPhases[0];
			}
			violations.push(violation);
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
	 * Reset daemon state (keeps timer running if started)
	 */
	reset(): void {
		this.signalHistory = [];
		this.violations = [];
		this.lastPhase = null;
		this.periodViolations = [];
		this.periodSignalCount = 0;
		this.lastReportTime = new Date();
		this.lastProcessedIndex = 0;
		this.gitCommits = [];
	}

	/**
	 * Full shutdown - stops timers and resets state
	 */
	shutdown(): void {
		this.stopPeriodicReports();
		this.stopWatchingBlackboard();
		this.reset();
	}

	/**
	 * Get all recorded violations
	 */
	getViolations(): HIVEViolation[] {
		return [...this.violations];
	}

	/**
	 * Get period violations (since last report)
	 */
	getPeriodViolations(): HIVEViolation[] {
		return [...this.periodViolations];
	}

	/**
	 * Get period signal count (since last report)
	 */
	getPeriodSignalCount(): number {
		return this.periodSignalCount;
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

	/**
	 * Check if periodic reports are running
	 */
	isReporting(): boolean {
		return this.reportTimer !== null;
	}

	/**
	 * Check if blackboard watching is active
	 */
	isWatching(): boolean {
		return this.watchTimer !== null;
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
// EMITTER FACTORIES (JSONL now, NATS later)
// ============================================================================

/**
 * Create a JSONL file emitter for stigmergy signals
 * Appends signals as newline-delimited JSON to the specified file
 *
 * @example
 * ```typescript
 * import { appendFileSync } from 'node:fs';
 *
 * const emitter = createJSONLEmitter('obsidianblackboard.jsonl', appendFileSync);
 * const daemon = new PyrePraetorianDaemon({
 *   emitter,
 *   reportIntervalMs: 5 * 60 * 1000, // 5 minutes
 * });
 * daemon.startPeriodicReports();
 * ```
 */
export function createJSONLEmitter(
	filePath: string,
	appendFn: (path: string, data: string) => void,
): StigmergyEmitter {
	return {
		emit(signal: StigmergySignal): void {
			const line = JSON.stringify(signal) + '\n';
			appendFn(filePath, line);
		},
	};
}

/**
 * Create a console emitter for development/debugging
 *
 * @example
 * ```typescript
 * const daemon = new PyrePraetorianDaemon({
 *   emitter: createConsoleEmitter(),
 *   reportIntervalMs: 10_000, // 10 seconds for debugging
 * });
 * ```
 */
export function createConsoleEmitter(): StigmergyEmitter {
	return {
		emit(signal: StigmergySignal): void {
			const parsed = JSON.parse(signal.msg);
			console.log(`[PYRE] ${parsed.summary}`);
		},
	};
}

/**
 * Create a NATS emitter stub (for future implementation)
 * TODO: Implement when NATS integration is ready
 *
 * @example
 * ```typescript
 * const emitter = createNATSEmitter('nats://localhost:4222', 'hfo.stigmergy');
 * ```
 */
export function createNATSEmitter(
	_serverUrl: string,
	_subject: string,
): StigmergyEmitter {
	// Stub for future NATS integration
	return {
		emit(_signal: StigmergySignal): void {
			// TODO: Implement NATS publish
			// const nc = await connect({ servers: serverUrl });
			// nc.publish(subject, JSON.stringify(signal));
			console.warn('[PYRE] NATS emitter not yet implemented - signal dropped');
		},
	};
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PyrePraetorianDaemon;
