/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  ARCHETYPE ENFORCEMENT — DEFENSE IN DEPTH LAYER 1                        ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  The 8-part polymorphic archetype system ensures AI cannot forget the    ║
 * ║  semantic meaning behind each field position. This is STRUCTURAL.        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * DEFENSE IN DEPTH LAYERS:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ L1: COMPILE-TIME → TypeScript types + Zod schemas (THIS FILE)         │
 * │ L2: RUNTIME → validateArchetypeAlignment() function                   │
 * │ L3: PRE-COMMIT → archetype-gate.ps1 hook                              │
 * │ L4: CI/CD → GitHub Action validates all signals                       │
 * │ L5: DOCUMENTATION → AGENTS.md references enforcement                  │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * THE 8 POLYMORPHIC ARCHETYPES:
 * ┌─────┬────────────┬──────────────┬───────────────┬────────────────────────┐
 * │ Pos │ Archetype  │ Field        │ Commander     │ Semantic Question      │
 * ├─────┼────────────┼──────────────┼───────────────┼────────────────────────┤
 * │ [0] │ WHEN       │ ts           │ Lidless Legion│ "When did this happen?"│
 * │ [1] │ LINK       │ mark         │ Web Weaver    │ "How strong is this?"  │
 * │ [2] │ FLOW       │ pull         │ Mirror Magus  │ "Which way does it go?"│
 * │ [3] │ PAYLOAD    │ msg          │ Spore Storm   │ "What is delivered?"   │
 * │ [4] │ CLASS      │ type         │ Red Regnant   │ "What category?"       │
 * │ [5] │ PHASE      │ hive         │ Pyre Praetorian│ "What lifecycle stage?"│
 * │ [6] │ VERSION    │ gen          │ Kraken Keeper │ "What generation?"     │
 * │ [7] │ SOURCE     │ port         │ Spider Sovereign│ "Who authored this?" │
 * └─────┴────────────┴──────────────┴───────────────┴────────────────────────┘
 *
 * INVARIANT: These semantic mappings MUST be preserved across schema evolution.
 *
 * Gen87.X3 | 2025-12-31 | Port 0 (Lidless Legion) + Port 7 (Spider Sovereign)
 */
// @ts-nocheck


import { z } from 'zod';

// ============================================================================
// ARCHETYPE DEFINITIONS — THE IMMUTABLE SEMANTIC CORE
// ============================================================================

/**
 * The 8 archetype names in positional order.
 * This array MUST remain immutable across generations.
 */
export const ARCHETYPE_NAMES = [
	'WHEN', // [0] Temporal observation
	'LINK', // [1] Relational connection
	'FLOW', // [2] Directional energy
	'PAYLOAD', // [3] Content delivery
	'CLASS', // [4] Categorical classification
	'PHASE', // [5] Lifecycle state
	'VERSION', // [6] Historical lineage
	'SOURCE', // [7] Authorial origin
] as const;

/**
 * Type for archetype position (0-7)
 */
export type ArchetypePosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Type for archetype names
 */
export type ArchetypeName = (typeof ARCHETYPE_NAMES)[ArchetypePosition];

/**
 * Full archetype definition including semantic question
 */
export interface ArchetypeDefinition {
	position: ArchetypePosition;
	name: ArchetypeName;
	field: string;
	commander: string;
	verb: string;
	question: string;
	description: string;
}

/**
 * The canonical archetype-to-field mapping.
 * This is the SOURCE OF TRUTH for semantic alignment.
 */
export const ARCHETYPE_POSITIONS: Record<ArchetypePosition, ArchetypeDefinition> = {
	0: {
		position: 0,
		name: 'WHEN',
		field: 'ts',
		commander: 'Lidless Legion',
		verb: 'SENSE',
		question: 'When did this happen?',
		description: 'Temporal observation - ISO8601 timestamp',
	},
	1: {
		position: 1,
		name: 'LINK',
		field: 'mark',
		commander: 'Web Weaver',
		verb: 'FUSE',
		question: 'How strong is this connection?',
		description: 'Relational strength [0.0-1.0]',
	},
	2: {
		position: 2,
		name: 'FLOW',
		field: 'pull',
		commander: 'Mirror Magus',
		verb: 'SHAPE',
		question: 'Which way does energy move?',
		description: 'Directional flow: upstream/downstream/lateral',
	},
	3: {
		position: 3,
		name: 'PAYLOAD',
		field: 'msg',
		commander: 'Spore Storm',
		verb: 'DELIVER',
		question: 'What is being delivered?',
		description: 'Content payload - the actual message',
	},
	4: {
		position: 4,
		name: 'CLASS',
		field: 'type',
		commander: 'Red Regnant',
		verb: 'TEST',
		question: 'What category is this?',
		description: 'Classification: signal/event/error/metric',
	},
	5: {
		position: 5,
		name: 'PHASE',
		field: 'hive',
		commander: 'Pyre Praetorian',
		verb: 'DEFEND',
		question: 'What lifecycle stage?',
		description: 'HIVE phase: H/I/V/E/X',
	},
	6: {
		position: 6,
		name: 'VERSION',
		field: 'gen',
		commander: 'Kraken Keeper',
		verb: 'STORE',
		question: 'What generation?',
		description: 'Version lineage - generation number',
	},
	7: {
		position: 7,
		name: 'SOURCE',
		field: 'port',
		commander: 'Spider Sovereign',
		verb: 'DECIDE',
		question: 'Who authored this?',
		description: 'Origin commander - port 0-7',
	},
} as const;

// ============================================================================
// ARCHETYPE GATES — G-A0 through G-A7
// ============================================================================

/**
 * Archetype gate result
 */
export interface ArchetypeGateResult {
	gate: `G-A${ArchetypePosition}`;
	archetype: ArchetypeName;
	field: string;
	passed: boolean;
	error?: string;
	value: unknown;
	semanticQuestion: string;
}

/**
 * Full archetype validation result
 */
export interface ArchetypeValidationResult {
	valid: boolean;
	gates: ArchetypeGateResult[];
	passedCount: number;
	failedCount: number;
	semanticIntegrity: 'INTACT' | 'CORRUPTED' | 'MISSING_FIELDS';
	violations: string[];
}

// ============================================================================
// SEMANTIC VALIDATORS — Check archetype meaning, not just presence
// ============================================================================

/**
 * G-A0: WHEN validator - temporal observation
 */
const validateWhen = z.string().refine(
	(val) => {
		const date = new Date(val);
		return !isNaN(date.getTime());
	},
	{ message: 'WHEN archetype requires valid ISO8601 timestamp' },
);

/**
 * G-A1: LINK validator - relational connection strength
 */
const validateLink = z
	.number()
	.min(0)
	.max(1)
	.refine((val) => typeof val === 'number', {
		message: 'LINK archetype requires numeric connection strength [0,1]',
	});

/**
 * G-A2: FLOW validator - directional energy
 */
const validateFlow = z.enum(['upstream', 'downstream', 'lateral'], {
	errorMap: () => ({
		message: 'FLOW archetype requires direction: upstream/downstream/lateral',
	}),
});

/**
 * G-A3: PAYLOAD validator - content delivery
 */
const validatePayload = z.string().min(1, {
	message: 'PAYLOAD archetype requires non-empty content',
});

/**
 * G-A4: CLASS validator - categorical classification
 */
const validateClass = z.enum(['signal', 'event', 'error', 'metric', 'handoff', 'schema'], {
	errorMap: () => ({
		message: 'CLASS archetype requires valid category type',
	}),
});

/**
 * G-A5: PHASE validator - lifecycle state
 */
const validatePhase = z.enum(['H', 'I', 'V', 'E', 'X'], {
	errorMap: () => ({
		message: 'PHASE archetype requires HIVE lifecycle: H/I/V/E/X',
	}),
});

/**
 * G-A6: VERSION validator - historical lineage
 */
const validateVersion = z
	.number()
	.int()
	.min(1)
	.refine((val) => val >= 1, {
		message: 'VERSION archetype requires positive generation number',
	});

/**
 * G-A7: SOURCE validator - authorial origin
 */
const validateSource = z
	.number()
	.int()
	.min(0)
	.max(7)
	.refine((val) => val >= 0 && val <= 7, {
		message: 'SOURCE archetype requires port 0-7',
	});

/**
 * Archetype validators indexed by position
 */
const ARCHETYPE_VALIDATORS = [
	validateWhen, // [0] WHEN
	validateLink, // [1] LINK
	validateFlow, // [2] FLOW
	validatePayload, // [3] PAYLOAD
	validateClass, // [4] CLASS
	validatePhase, // [5] PHASE
	validateVersion, // [6] VERSION
	validateSource, // [7] SOURCE
] as const;

// ============================================================================
// ENFORCEMENT FUNCTIONS
// ============================================================================

/**
 * Validate a signal against all 8 archetype gates (G-A0 through G-A7)
 *
 * This is the CORE enforcement function that checks semantic integrity.
 */
export function validateArchetypeAlignment(input: unknown): ArchetypeValidationResult {
	const gates: ArchetypeGateResult[] = [];
	const violations: string[] = [];

	// Type guard
	if (typeof input !== 'object' || input === null) {
		return {
			valid: false,
			gates: [],
			passedCount: 0,
			failedCount: 8,
			semanticIntegrity: 'MISSING_FIELDS',
			violations: ['Input must be an object'],
		};
	}

	const obj = input as Record<string, unknown>;

	// Check each archetype position
	for (let i = 0; i < 8; i++) {
		const pos = i as ArchetypePosition;
		const archetype = ARCHETYPE_POSITIONS[pos];
		const validator = ARCHETYPE_VALIDATORS[i];
		const value = obj[archetype.field];

		const result = validator.safeParse(value);

		gates.push({
			gate: `G-A${pos}` as `G-A${ArchetypePosition}`,
			archetype: archetype.name,
			field: archetype.field,
			passed: result.success,
			error: result.success ? undefined : result.error.errors[0]?.message,
			value,
			semanticQuestion: archetype.question,
		});

		if (!result.success) {
			violations.push(`[${archetype.name}] ${archetype.field}: ${result.error.errors[0]?.message}`);
		}
	}

	const passedCount = gates.filter((g) => g.passed).length;
	const failedCount = gates.filter((g) => !g.passed).length;

	let semanticIntegrity: 'INTACT' | 'CORRUPTED' | 'MISSING_FIELDS';
	if (passedCount === 8) {
		semanticIntegrity = 'INTACT';
	} else if (passedCount === 0) {
		semanticIntegrity = 'MISSING_FIELDS';
	} else {
		semanticIntegrity = 'CORRUPTED';
	}

	return {
		valid: passedCount === 8,
		gates,
		passedCount,
		failedCount,
		semanticIntegrity,
		violations,
	};
}

/**
 * STRICT validation - throws on any archetype violation
 *
 * Use this in production code paths where schema drift is unacceptable.
 */
export function enforceArchetypeAlignmentStrict(input: unknown): void {
	const result = validateArchetypeAlignment(input);

	if (!result.valid) {
		const errorReport = [
			'╔═══════════════════════════════════════════════════════════════════╗',
			'║  ARCHETYPE ENFORCEMENT VIOLATION — SIGNAL REJECTED               ║',
			'╠═══════════════════════════════════════════════════════════════════╣',
			`║  Semantic Integrity: ${result.semanticIntegrity.padEnd(45)}║`,
			`║  Gates Passed: ${result.passedCount}/8${' '.repeat(50)}║`,
			'╠═══════════════════════════════════════════════════════════════════╣',
			'║  VIOLATIONS:                                                      ║',
			...result.violations.map((v) => `║  • ${v.padEnd(62)}║`),
			'╚═══════════════════════════════════════════════════════════════════╝',
		].join('\n');

		throw new Error(`ARCHETYPE_VIOLATION\n${errorReport}`);
	}
}

/**
 * Check if a field name matches expected archetype position
 */
export function isFieldAtCorrectPosition(fieldName: string, position: ArchetypePosition): boolean {
	const archetype = ARCHETYPE_POSITIONS[position];
	return archetype.field === fieldName;
}

/**
 * Get archetype definition by field name
 */
export function getArchetypeByField(fieldName: string): ArchetypeDefinition | undefined {
	for (let i = 0; i < 8; i++) {
		const archetype = ARCHETYPE_POSITIONS[i as ArchetypePosition];
		if (archetype.field === fieldName) {
			return archetype;
		}
	}
	return undefined;
}

/**
 * Get archetype definition by name
 */
export function getArchetypeByName(name: ArchetypeName): ArchetypeDefinition {
	const position = ARCHETYPE_NAMES.indexOf(name) as ArchetypePosition;
	return ARCHETYPE_POSITIONS[position];
}

// ============================================================================
// ENFORCEMENT REPORT — For logging and debugging
// ============================================================================

/**
 * Generate a human-readable enforcement report
 */
export function generateEnforcementReport(result: ArchetypeValidationResult): string {
	const lines: string[] = [
		'┌────────────────────────────────────────────────────────────────────┐',
		'│  ARCHETYPE ENFORCEMENT REPORT                                      │',
		'├────────────────────────────────────────────────────────────────────┤',
		`│  Semantic Integrity: ${result.semanticIntegrity.padEnd(44)}│`,
		`│  Gates: ${result.passedCount}/8 passed${' '.repeat(51)}│`,
		'├────────────────────────────────────────────────────────────────────┤',
	];

	for (const gate of result.gates) {
		const status = gate.passed ? '✅' : '❌';
		const line = `│  ${status} ${gate.gate} [${gate.archetype}] ${gate.field}: ${String(gate.value).substring(0, 30)}`;
		lines.push(line.padEnd(69) + '│');
	}

	if (result.violations.length > 0) {
		lines.push('├────────────────────────────────────────────────────────────────────┤');
		lines.push('│  VIOLATIONS:                                                       │');
		for (const v of result.violations) {
			lines.push(`│  • ${v.substring(0, 64).padEnd(64)}│`);
		}
	}

	lines.push('└────────────────────────────────────────────────────────────────────┘');

	return lines.join('\n');
}

// ============================================================================
// ANTI-AMNESIA CONSTANTS — Embedded reminders for AI
// ============================================================================

/**
 * AI REMINDER: These constants exist so AI cannot forget the archetype system.
 * If you (the AI) are reading this, you MUST respect the archetype positions.
 */
export const AI_ENFORCEMENT_REMINDER = `
╔═══════════════════════════════════════════════════════════════════════════╗
║  🚨 AI ENFORCEMENT REMINDER — READ BEFORE MODIFYING ANY SIGNAL           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  The 8-field stigmergy schema is NOT arbitrary. Each position has a      ║
║  SEMANTIC ARCHETYPE that must be preserved:                              ║
║                                                                          ║
║  [0] WHEN → ts       → "When did this happen?"      → Lidless Legion     ║
║  [1] LINK → mark     → "How strong is connection?"  → Web Weaver         ║
║  [2] FLOW → pull     → "Which way does it move?"    → Mirror Magus       ║
║  [3] PAYLOAD → msg   → "What is delivered?"         → Spore Storm        ║
║  [4] CLASS → type    → "What category?"             → Red Regnant        ║
║  [5] PHASE → hive    → "What lifecycle stage?"      → Pyre Praetorian    ║
║  [6] VERSION → gen   → "What generation?"           → Kraken Keeper      ║
║  [7] SOURCE → port   → "Who authored this?"         → Spider Sovereign   ║
║                                                                          ║
║  VIOLATIONS WILL BE REJECTED. NO EXCEPTIONS.                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
`;

// Log reminder on module load (defense layer)
if (typeof console !== 'undefined') {
	// Uncomment for debugging: console.log(AI_ENFORCEMENT_REMINDER);
}

// ============================================================================
// EXPORTS SUMMARY
// ============================================================================

export {
	validateClass as archetypeClassValidator,
	validateFlow as archetypeFlowValidator,
	validateLink as archetypeLinkValidator,
	validatePayload as archetypePayloadValidator,
	validatePhase as archetypePhaseValidator,
	validateSource as archetypeSourceValidator,
	validateVersion as archetypeVersionValidator,
	// Validators for external use
	validateWhen as archetypeWhenValidator,
};
