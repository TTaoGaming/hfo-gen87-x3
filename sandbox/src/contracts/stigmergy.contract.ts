/**
 * @fileoverview Universal Stigmergy Signal Contract - 8-Part Header Format
 *
 * HFO/HIVE/8 stigmergy protocol requires exactly 8 fields for all signals.
 * This contract ENFORCES the format at compile-time (Zod) and runtime.
 *
 * The 8 Universal Fields:
 * 1. ts     - ISO8601 timestamp (when)
 * 2. mark   - Quality/confidence 0.0-1.0 (how confident)
 * 3. pull   - Direction: upstream/downstream/lateral (where)
 * 4. msg    - Human-readable message (what)
 * 5. type   - Signal type: signal/event/error/metric (category)
 * 6. hive   - HIVE phase: H/I/V/E/X (workflow)
 * 7. gen    - Generation number >= 87 (version)
 * 8. port   - Port 0-7 (who/which commander)
 *
 * @module contracts/stigmergy.contract
 * @hive I (Interlock)
 * @tdd GREEN (implementing RED tests from Gen85)
 */

import { z } from 'zod';

// ============================================================================
// CONSTANTS - Gate Thresholds
// ============================================================================

/** Minimum generation number (Gen87+) */
export const MIN_GENERATION = 87;

/** Maximum port number (8 ports: 0-7) */
export const MAX_PORT = 7;

/** Valid HIVE phases */
export const HIVE_PHASES = ['H', 'I', 'V', 'E', 'X'] as const;

/** Valid signal directions */
export const PULL_DIRECTIONS = ['upstream', 'downstream', 'lateral'] as const;

/** Valid signal types */
export const SIGNAL_TYPES = ['signal', 'event', 'error', 'metric'] as const;

// ============================================================================
// ISO8601 TIMESTAMP VALIDATION
// ============================================================================

/**
 * ISO8601 timestamp regex - accepts standard and extended year formats
 * Matches: 2025-12-30T16:00:00Z or 2025-12-30T16:00:00.123Z or +010000-01-01T00:00:00.000Z
 */
const ISO8601_REGEX = /^[+-]?\d{4,6}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * Validate ISO8601 timestamp string
 */
export function isValidISO8601(ts: string): boolean {
	if (typeof ts !== 'string') return false;
	if (!ISO8601_REGEX.test(ts)) return false;
	const date = new Date(ts);
	return !isNaN(date.getTime());
}

// ============================================================================
// ZOD SCHEMAS - THE 8 GATES
// ============================================================================

/**
 * G0: Timestamp Gate
 * Must be valid ISO8601 UTC timestamp
 */
export const TimestampSchema = z.string().refine(isValidISO8601, {
	message: 'G0 FAIL: ts must be valid ISO8601 UTC (YYYY-MM-DDTHH:mm:ssZ)',
});

/**
 * G1: Mark Gate
 * Confidence/quality score 0.0 to 1.0
 */
export const MarkSchema = z
	.number()
	.min(0, 'G1 FAIL: mark must be >= 0.0')
	.max(1, 'G1 FAIL: mark must be <= 1.0');

/**
 * G2: Pull Gate
 * Signal direction
 */
export const PullSchema = z.enum(PULL_DIRECTIONS, {
	errorMap: () => ({
		message: `G2 FAIL: pull must be one of: ${PULL_DIRECTIONS.join(', ')}`,
	}),
});

/**
 * G3: Message Gate
 * Non-empty human-readable message
 */
export const MessageSchema = z.string().min(1, 'G3 FAIL: msg must be non-empty string');

/**
 * G4: Type Gate
 * Signal category
 */
export const TypeSchema = z.enum(SIGNAL_TYPES, {
	errorMap: () => ({
		message: `G4 FAIL: type must be one of: ${SIGNAL_TYPES.join(', ')}`,
	}),
});

/**
 * G5: HIVE Gate
 * HIVE/8 phase marker
 */
export const HiveSchema = z.enum(HIVE_PHASES, {
	errorMap: () => ({
		message: `G5 FAIL: hive must be one of: ${HIVE_PHASES.join(', ')}`,
	}),
});

/**
 * G6: Generation Gate
 * Must be >= 87 (current generation)
 */
export const GenerationSchema = z
	.number()
	.int('G6 FAIL: gen must be integer')
	.min(MIN_GENERATION, `G6 FAIL: gen must be >= ${MIN_GENERATION}`);

/**
 * G7: Port Gate
 * Must be 0-7 (8 commanders)
 */
export const PortSchema = z
	.number()
	.int('G7 FAIL: port must be integer')
	.min(0, 'G7 FAIL: port must be >= 0')
	.max(MAX_PORT, `G7 FAIL: port must be <= ${MAX_PORT}`);

// ============================================================================
// COMPOSITE STIGMERGY SIGNAL SCHEMA
// ============================================================================

/**
 * Universal Stigmergy Signal - 8 Required Fields
 *
 * This is the AUTHORITATIVE contract for all HFO stigmergy communication.
 * Every signal emitted to the blackboard MUST conform to this schema.
 */
export const StigmergySignalSchema = z.object({
	/** G0: ISO8601 UTC timestamp */
	ts: TimestampSchema,
	/** G1: Quality/confidence 0.0-1.0 */
	mark: MarkSchema,
	/** G2: Direction upstream/downstream/lateral */
	pull: PullSchema,
	/** G3: Human-readable message */
	msg: MessageSchema,
	/** G4: Signal type */
	type: TypeSchema,
	/** G5: HIVE phase H/I/V/E/X */
	hive: HiveSchema,
	/** G6: Generation >= 87 */
	gen: GenerationSchema,
	/** G7: Port 0-7 */
	port: PortSchema,
});

/** TypeScript type inferred from schema */
export type StigmergySignal = z.infer<typeof StigmergySignalSchema>;

/** Type for HIVE phase */
export type HivePhase = z.infer<typeof HiveSchema>;

/** Type for signal direction */
export type PullDirection = z.infer<typeof PullSchema>;

/** Type for signal type */
export type SignalType = z.infer<typeof TypeSchema>;

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/**
 * Individual gate validation result
 */
export interface GateResult {
	/** Gate name (G0-G7) */
	gate: string;
	/** Gate field name */
	field: string;
	/** Did it pass? */
	passed: boolean;
	/** Error message if failed */
	error?: string;
	/** Actual value that was tested */
	value?: unknown;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
	/** Overall valid? */
	valid: boolean;
	/** Individual gate results */
	gates: GateResult[];
	/** Total gates passed */
	passedCount: number;
	/** Total gates failed */
	failedCount: number;
	/** Parsed signal if valid */
	signal?: StigmergySignal;
	/** Quarantine reason if invalid */
	quarantineReason?: string;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new stigmergy signal with defaults
 */
export function createSignal(
	overrides: Partial<StigmergySignal> & Pick<StigmergySignal, 'msg'>,
): StigmergySignal {
	const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
	return {
		ts: now,
		mark: 1.0,
		pull: 'downstream',
		type: 'signal',
		hive: 'H',
		gen: MIN_GENERATION,
		port: 0,
		...overrides,
	};
}

/**
 * Create signal for specific HIVE phase with appropriate port
 */
export function createHiveSignal(
	phase: HivePhase,
	msg: string,
	options?: Partial<Omit<StigmergySignal, 'hive' | 'msg'>>,
): StigmergySignal {
	// HIVE phase → Port mapping (anti-diagonal pairs)
	const phaseToPort: Record<HivePhase, number> = {
		H: 0, // Lidless Legion (Hunt)
		I: 1, // Web Weaver (Interlock)
		V: 2, // Mirror Magus (Validate)
		E: 3, // Spore Storm (Evolve)
		X: 7, // Spider Sovereign (Emergency)
	};

	return createSignal({
		hive: phase,
		port: phaseToPort[phase],
		msg,
		...options,
	});
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a signal against all 8 gates
 * Returns detailed result for each gate
 */
export function validateSignal(input: unknown): ValidationResult {
	const gates: GateResult[] = [];
	let valid = true;

	// Type guard for object
	if (typeof input !== 'object' || input === null) {
		return {
			valid: false,
			gates: [
				{
					gate: 'G-1',
					field: 'input',
					passed: false,
					error: 'Input must be an object',
					value: input,
				},
			],
			passedCount: 0,
			failedCount: 1,
			quarantineReason: 'Input is not an object',
		};
	}

	const obj = input as Record<string, unknown>;

	// G0: Timestamp
	const g0Result = TimestampSchema.safeParse(obj.ts);
	gates.push({
		gate: 'G0',
		field: 'ts',
		passed: g0Result.success,
		error: g0Result.success ? undefined : g0Result.error.errors[0]?.message,
		value: obj.ts,
	});
	if (!g0Result.success) valid = false;

	// G1: Mark
	const g1Result = MarkSchema.safeParse(obj.mark);
	gates.push({
		gate: 'G1',
		field: 'mark',
		passed: g1Result.success,
		error: g1Result.success ? undefined : g1Result.error.errors[0]?.message,
		value: obj.mark,
	});
	if (!g1Result.success) valid = false;

	// G2: Pull
	const g2Result = PullSchema.safeParse(obj.pull);
	gates.push({
		gate: 'G2',
		field: 'pull',
		passed: g2Result.success,
		error: g2Result.success ? undefined : g2Result.error.errors[0]?.message,
		value: obj.pull,
	});
	if (!g2Result.success) valid = false;

	// G3: Message
	const g3Result = MessageSchema.safeParse(obj.msg);
	gates.push({
		gate: 'G3',
		field: 'msg',
		passed: g3Result.success,
		error: g3Result.success ? undefined : g3Result.error.errors[0]?.message,
		value: obj.msg,
	});
	if (!g3Result.success) valid = false;

	// G4: Type
	const g4Result = TypeSchema.safeParse(obj.type);
	gates.push({
		gate: 'G4',
		field: 'type',
		passed: g4Result.success,
		error: g4Result.success ? undefined : g4Result.error.errors[0]?.message,
		value: obj.type,
	});
	if (!g4Result.success) valid = false;

	// G5: HIVE
	const g5Result = HiveSchema.safeParse(obj.hive);
	gates.push({
		gate: 'G5',
		field: 'hive',
		passed: g5Result.success,
		error: g5Result.success ? undefined : g5Result.error.errors[0]?.message,
		value: obj.hive,
	});
	if (!g5Result.success) valid = false;

	// G6: Generation
	const g6Result = GenerationSchema.safeParse(obj.gen);
	gates.push({
		gate: 'G6',
		field: 'gen',
		passed: g6Result.success,
		error: g6Result.success ? undefined : g6Result.error.errors[0]?.message,
		value: obj.gen,
	});
	if (!g6Result.success) valid = false;

	// G7: Port
	const g7Result = PortSchema.safeParse(obj.port);
	gates.push({
		gate: 'G7',
		field: 'port',
		passed: g7Result.success,
		error: g7Result.success ? undefined : g7Result.error.errors[0]?.message,
		value: obj.port,
	});
	if (!g7Result.success) valid = false;

	const passedCount = gates.filter((g) => g.passed).length;
	const failedCount = gates.filter((g) => !g.passed).length;

	const result: ValidationResult = {
		valid,
		gates,
		passedCount,
		failedCount,
	};

	if (valid) {
		result.signal = StigmergySignalSchema.parse(input);
	} else {
		const failedGates = gates
			.filter((g) => !g.passed)
			.map((g) => g.gate)
			.join(', ');
		result.quarantineReason = `Failed gates: ${failedGates}`;
	}

	return result;
}

/**
 * Quick validation - just returns boolean
 */
export function isValidSignal(input: unknown): input is StigmergySignal {
	return StigmergySignalSchema.safeParse(input).success;
}

/**
 * Parse and validate - throws on failure
 */
export function parseSignal(input: unknown): StigmergySignal {
	return StigmergySignalSchema.parse(input);
}

/**
 * Safe parse - returns result object
 */
export function safeParseSignal(input: unknown): z.SafeParseReturnType<unknown, StigmergySignal> {
	return StigmergySignalSchema.safeParse(input);
}

// ============================================================================
// PORT ↔ COMMANDER MAPPING
// ============================================================================

/**
 * The 8 Legendary Commanders
 */
export const COMMANDERS = {
	0: { name: 'Lidless Legion', verb: 'SENSE', phase: 'H' },
	1: { name: 'Web Weaver', verb: 'FUSE', phase: 'I' },
	2: { name: 'Mirror Magus', verb: 'SHAPE', phase: 'V' },
	3: { name: 'Spore Storm', verb: 'DELIVER', phase: 'E' },
	4: { name: 'Red Regnant', verb: 'TEST', phase: 'E' },
	5: { name: 'Pyre Praetorian', verb: 'DEFEND', phase: 'V' },
	6: { name: 'Kraken Keeper', verb: 'STORE', phase: 'I' },
	7: { name: 'Spider Sovereign', verb: 'DECIDE', phase: 'H' },
} as const;

/**
 * Get commander info by port
 */
export function getCommander(port: number) {
	if (port < 0 || port > 7) return undefined;
	return COMMANDERS[port as keyof typeof COMMANDERS];
}

/**
 * HIVE phase to anti-diagonal port pairs
 */
export const HIVE_PORT_PAIRS = {
	H: [0, 7], // Hunt: Lidless + Spider
	I: [1, 6], // Interlock: Weaver + Kraken
	V: [2, 5], // Validate: Magus + Pyre
	E: [3, 4], // Evolve: Storm + Regnant
	X: [7], // Emergency: Spider only
} as const;

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serialize signal to JSON string (for blackboard append)
 */
export function serializeSignal(signal: StigmergySignal): string {
	return JSON.stringify(signal);
}

/**
 * Deserialize signal from JSON string
 */
export function deserializeSignal(json: string): StigmergySignal {
	const parsed = JSON.parse(json);
	return parseSignal(parsed);
}

/**
 * Safe deserialize - returns null on failure
 */
export function safeDeserializeSignal(json: string): StigmergySignal | null {
	try {
		const parsed = JSON.parse(json);
		const result = safeParseSignal(parsed);
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}
