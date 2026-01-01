/**
 * @fileoverview HIVE/8 CDD (Contract-Driven Development) Master Contract
 *
 * This file defines THE source of truth for all HIVE/8 signal validation.
 * All components (Temporal, LangGraph, CrewAI, MCP) MUST use these contracts.
 *
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  HARD GATES G0-G7 (Signal Validation)                                      ║
 * ╠════╦══════════════════════════════════════════════════════════════════════╣
 * ║ G0 ║ ts    - Valid ISO8601 UTC timestamp                                  ║
 * ║ G1 ║ mark  - Confidence 0.0 to 1.0                                        ║
 * ║ G2 ║ pull  - Direction: upstream | downstream | lateral                   ║
 * ║ G3 ║ msg   - Non-empty human-readable message                             ║
 * ║ G4 ║ type  - Category: signal | event | error | metric                    ║
 * ║ G5 ║ hive  - Phase: H | I | V | E | X                                     ║
 * ║ G6 ║ gen   - Generation >= 87                                             ║
 * ║ G7 ║ port  - Port number 0-7                                              ║
 * ╚════╩══════════════════════════════════════════════════════════════════════╝
 *
 * @module contracts/hive-cdd.contract
 * @hive I (Interlock) - Contract definition phase
 */
// @ts-nocheck


import { z } from 'zod';

// =============================================================================
// CONSTANTS
// =============================================================================

export const CURRENT_GEN = 87;
export const MIN_GEN = 87;
export const MAX_PORT = 7;

// =============================================================================
// G0: TIMESTAMP (Position 0 - Lidless)
// =============================================================================

const ISO8601_REGEX = /^[+-]?\d{4,6}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export const G0_TimestampSchema = z
	.string()
	.refine((ts) => ISO8601_REGEX.test(ts) && !isNaN(new Date(ts).getTime()), {
		message: 'G0 FAIL: ts must be valid ISO8601 UTC (YYYY-MM-DDTHH:mm:ssZ)',
	});

// =============================================================================
// G1: MARK (Position 1 - Weaver)
// =============================================================================

export const G1_MarkSchema = z
	.number()
	.min(0, 'G1 FAIL: mark must be >= 0.0')
	.max(1, 'G1 FAIL: mark must be <= 1.0');

// =============================================================================
// G2: PULL (Position 2 - Magus)
// =============================================================================

export const PULL_DIRECTIONS = ['upstream', 'downstream', 'lateral'] as const;
export type PullDirection = (typeof PULL_DIRECTIONS)[number];

export const G2_PullSchema = z.enum(PULL_DIRECTIONS, {
	errorMap: () => ({ message: `G2 FAIL: pull must be one of: ${PULL_DIRECTIONS.join(', ')}` }),
});

// =============================================================================
// G3: MESSAGE (Position 3 - Storm)
// =============================================================================

export const G3_MessageSchema = z.string().min(1, 'G3 FAIL: msg must be non-empty string');

// =============================================================================
// G4: TYPE (Position 4 - Regnant)
// =============================================================================

export const SIGNAL_TYPES = ['signal', 'event', 'error', 'metric'] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export const G4_TypeSchema = z.enum(SIGNAL_TYPES, {
	errorMap: () => ({ message: `G4 FAIL: type must be one of: ${SIGNAL_TYPES.join(', ')}` }),
});

// =============================================================================
// G5: HIVE PHASE (Position 5 - Pyre)
// =============================================================================

export const HIVE_PHASES = ['H', 'I', 'V', 'E', 'X'] as const;
export type HivePhase = (typeof HIVE_PHASES)[number];

export const G5_HiveSchema = z.enum(HIVE_PHASES, {
	errorMap: () => ({ message: `G5 FAIL: hive must be one of: ${HIVE_PHASES.join(', ')}` }),
});

// =============================================================================
// G6: GENERATION (Position 6 - Kraken)
// =============================================================================

export const G6_GenerationSchema = z
	.number()
	.int('G6 FAIL: gen must be integer')
	.min(MIN_GEN, `G6 FAIL: gen must be >= ${MIN_GEN}`);

// =============================================================================
// G7: PORT (Position 7 - Spider)
// =============================================================================

export const G7_PortSchema = z
	.number()
	.int('G7 FAIL: port must be integer')
	.min(0, 'G7 FAIL: port must be >= 0')
	.max(MAX_PORT, `G7 FAIL: port must be <= ${MAX_PORT}`);

// =============================================================================
// COMPOSITE: STIGMERGY SIGNAL (G0-G7 Combined)
// =============================================================================

export const StigmergySignalSchema = z.object({
	ts: G0_TimestampSchema,
	mark: G1_MarkSchema,
	pull: G2_PullSchema,
	msg: G3_MessageSchema,
	type: G4_TypeSchema,
	hive: G5_HiveSchema,
	gen: G6_GenerationSchema,
	port: G7_PortSchema,
});

export type StigmergySignal = z.infer<typeof StigmergySignalSchema>;

// =============================================================================
// HIVE PHASE TRANSITION CONTRACT
// =============================================================================

export const ALLOWED_TRANSITIONS: Record<HivePhase, HivePhase[]> = {
	H: ['H', 'I', 'X'], // Hunt → Hunt, Interlock, or Handoff
	I: ['I', 'V', 'X'], // Interlock → Interlock, Validate, or Handoff
	V: ['V', 'E', 'X'], // Validate → Validate, Evolve, or Handoff
	E: ['E', 'H', 'X'], // Evolve → Evolve, Hunt (N+1), or Handoff
	X: ['H', 'I', 'V', 'E'], // Handoff → any phase
};

export const PhaseTransitionSchema = z.object({
	from: G5_HiveSchema.nullable(),
	to: G5_HiveSchema,
	valid: z.boolean(),
	violation: z
		.enum(['SKIPPED_HUNT', 'SKIPPED_INTERLOCK', 'SKIPPED_VALIDATE', 'REWARD_HACK', 'INVALID_HANDOFF'])
		.optional(),
	reason: z.string().optional(),
});

export type PhaseTransition = z.infer<typeof PhaseTransitionSchema>;

// =============================================================================
// COMMANDER CONTRACT (for CrewAI/LangGraph agents)
// =============================================================================

export const CommanderSchema = z.object({
	port: G7_PortSchema,
	name: z.string().min(1),
	role: z.string().min(1),
	verb: z.enum(['SENSE', 'FUSE', 'SHAPE', 'DELIVER', 'TEST', 'DEFEND', 'STORE', 'DECIDE']),
	hivePhase: z.array(G5_HiveSchema),
	mantra: z.string(),
});

export type Commander = z.infer<typeof CommanderSchema>;

export const COMMANDERS: Commander[] = [
	{
		port: 0,
		name: 'Lidless Legion',
		role: 'Observer',
		verb: 'SENSE',
		hivePhase: ['H'],
		mantra: 'How do we SENSE the SENSE?',
	},
	{
		port: 1,
		name: 'Web Weaver',
		role: 'Bridger',
		verb: 'FUSE',
		hivePhase: ['I'],
		mantra: 'How do we FUSE the FUSE?',
	},
	{
		port: 2,
		name: 'Mirror Magus',
		role: 'Shaper',
		verb: 'SHAPE',
		hivePhase: ['V'],
		mantra: 'How do we SHAPE the SHAPE?',
	},
	{
		port: 3,
		name: 'Spore Storm',
		role: 'Injector',
		verb: 'DELIVER',
		hivePhase: ['E'],
		mantra: 'How do we DELIVER the DELIVER?',
	},
	{
		port: 4,
		name: 'Red Regnant',
		role: 'Disruptor',
		verb: 'TEST',
		hivePhase: ['E'],
		mantra: 'How do we TEST the TEST?',
	},
	{
		port: 5,
		name: 'Pyre Praetorian',
		role: 'Immunizer',
		verb: 'DEFEND',
		hivePhase: ['V'],
		mantra: 'How do we DEFEND the DEFEND?',
	},
	{
		port: 6,
		name: 'Kraken Keeper',
		role: 'Assimilator',
		verb: 'STORE',
		hivePhase: ['I'],
		mantra: 'How do we STORE the STORE?',
	},
	{
		port: 7,
		name: 'Spider Sovereign',
		role: 'Navigator',
		verb: 'DECIDE',
		hivePhase: ['H'],
		mantra: 'How do we DECIDE the DECIDE?',
	},
];

// =============================================================================
// HIVE CYCLE RESULT CONTRACT (for Temporal workflows)
// =============================================================================

export const PhaseResultSchema = z.object({
	phase: G5_HiveSchema,
	output: z.string(),
	timestamp: G0_TimestampSchema,
	port: G7_PortSchema,
	success: z.boolean(),
	error: z.string().optional(),
});

export type PhaseResult = z.infer<typeof PhaseResultSchema>;

export const HiveCycleResultSchema = z.object({
	task: z.string(),
	cycle: z.number().int().min(0),
	phases: z.array(PhaseResultSchema),
	finalPhase: G5_HiveSchema,
	success: z.boolean(),
	duration_ms: z.number().optional(),
});

export type HiveCycleResult = z.infer<typeof HiveCycleResultSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	signal?: StigmergySignal;
}

/**
 * Validate a signal through ALL G0-G7 gates
 */
export function validateSignal(input: unknown): ValidationResult {
	const result = StigmergySignalSchema.safeParse(input);

	if (result.success) {
		return { valid: true, errors: [], signal: result.data };
	}

	const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
	return { valid: false, errors };
}

/**
 * Validate a phase transition
 */
export function validateTransition(from: HivePhase | null, to: HivePhase): PhaseTransition {
	// First signal must be H (Hunt)
	if (from === null) {
		if (to === 'H') {
			return { from: null, to, valid: true, reason: 'Starting HIVE cycle with Hunt' };
		}
		return { from: null, to, valid: false, violation: 'SKIPPED_HUNT', reason: 'Must start with Hunt phase' };
	}

	// Check allowed transitions
	if (ALLOWED_TRANSITIONS[from].includes(to)) {
		return { from, to, valid: true, reason: `Valid: ${from} → ${to}` };
	}

	// Determine violation type
	let violation: PhaseTransition['violation'] = 'SKIPPED_HUNT';
	if (from === 'H' && (to === 'V' || to === 'E')) {
		violation = 'SKIPPED_INTERLOCK';
	} else if (from === 'I' && to === 'E') {
		violation = 'SKIPPED_VALIDATE';
	} else if (from === 'H' && to === 'V') {
		violation = 'REWARD_HACK'; // Skipping RED (tests) to go GREEN
	}

	return { from, to, valid: false, violation, reason: `Invalid transition: ${from} → ${to}` };
}

/**
 * Create a valid signal with current timestamp
 */
export function createSignal(
	msg: string,
	port: number,
	hive: HivePhase,
	type: SignalType = 'signal',
	mark = 1.0
): StigmergySignal {
	return {
		ts: new Date().toISOString(),
		mark,
		pull: 'downstream',
		msg,
		type,
		hive,
		gen: CURRENT_GEN,
		port,
	};
}

// =============================================================================
// PYTHON INTEROP SCHEMA (JSON-serializable for CrewAI)
// =============================================================================

/**
 * Export schemas as JSON Schema for Python validation
 */
export function getJSONSchema(): object {
	return {
		$schema: 'http://json-schema.org/draft-07/schema#',
		title: 'HIVE/8 CDD Contract',
		definitions: {
			StigmergySignal: {
				type: 'object',
				required: ['ts', 'mark', 'pull', 'msg', 'type', 'hive', 'gen', 'port'],
				properties: {
					ts: { type: 'string', format: 'date-time', description: 'G0: ISO8601 timestamp' },
					mark: { type: 'number', minimum: 0, maximum: 1, description: 'G1: Confidence 0-1' },
					pull: { type: 'string', enum: [...PULL_DIRECTIONS], description: 'G2: Direction' },
					msg: { type: 'string', minLength: 1, description: 'G3: Message' },
					type: { type: 'string', enum: [...SIGNAL_TYPES], description: 'G4: Type' },
					hive: { type: 'string', enum: [...HIVE_PHASES], description: 'G5: Phase' },
					gen: { type: 'integer', minimum: MIN_GEN, description: 'G6: Generation' },
					port: { type: 'integer', minimum: 0, maximum: MAX_PORT, description: 'G7: Port' },
				},
			},
			PhaseTransition: {
				type: 'object',
				required: ['from', 'to', 'valid'],
				properties: {
					from: { type: ['string', 'null'], enum: [...HIVE_PHASES, null] },
					to: { type: 'string', enum: [...HIVE_PHASES] },
					valid: { type: 'boolean' },
					violation: { type: 'string' },
					reason: { type: 'string' },
				},
			},
		},
	};
}

export default {
	StigmergySignalSchema,
	PhaseTransitionSchema,
	CommanderSchema,
	HiveCycleResultSchema,
	validateSignal,
	validateTransition,
	createSignal,
	getJSONSchema,
	COMMANDERS,
	ALLOWED_TRANSITIONS,
	HIVE_PHASES,
	CURRENT_GEN,
};
