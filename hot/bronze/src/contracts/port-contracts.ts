/**
 * HFO Port Behavioral Contracts (BDD/CDD)
 * =======================================
 *
 * Based on the Galois Lattice structure from FCA (Formal Concept Analysis).
 * Each port's identity IS its behavioral constraint.
 *
 * DIAGONAL QUINES (★):
 *   0.0 - "How do we SENSE the SENSE?" → Self-aware perception
 *   1.1 - "How do we FUSE the FUSE?" → Self-integrating adapters
 *   2.2 - "How do we SHAPE the SHAPE?" → Self-transforming geometry
 *   3.3 - "How do we DELIVER the DELIVER?" → Self-executing workflows
 *   4.4 - "How do we TEST the TEST?" → Self-validating probes
 *   5.5 - "How do we DEFEND the DEFEND?" → Self-protecting gates
 *   6.6 - "How do we STORE the STORE?" → Self-persisting memory
 *   7.7 - "How do we DECIDE the DECIDE?" → Self-navigating choices
 *
 * The diagonal represents the "strange loop" - each commander's purpose
 * is self-referential. Identity = Purpose = Constraint.
 */

import { z } from 'zod';
import type { HFOVerb, PortNumber } from './hfo-ports.js';

// ============================================================================
// BEHAVIORAL CONSTRAINT TYPES
// ============================================================================

/** What a port CAN do */
export type PortCapability =
	| 'read' // Can read/observe data
	| 'tag' // Can add metadata/annotations
	| 'transform' // Can change data structure
	| 'emit' // Can output/deliver
	| 'emit_output' // Can output/deliver (alias)
	| 'validate' // Can check properties
	| 'gate' // Can allow/deny passage
	| 'persist' // Can store durably
	| 'route' // Can direct flow
	| 'compose' // Can combine elements
	| 'invoke' // Can call external systems
	| 'invoke_external'; // Can call external systems (alias)

/** What a port MUST NOT do (violations) */
export type PortProhibition =
	| 'modify_data' // Cannot change data content
	| 'block_flow' // Cannot stop data flow
	| 'persist' // Cannot store durably
	| 'emit_output' // Cannot produce output
	| 'invoke_external' // Cannot call external systems
	| 'make_decisions' // Cannot choose paths
	| 'skip_validation' // Cannot bypass gates
	| 'transform' // Cannot transform data
	| 'validate'; // Cannot validate

/** Behavioral contract for a port */
export interface PortBehavioralContract {
	/** Port number (0-7) */
	port: PortNumber;

	/** Commander name for semantic anchoring */
	commander: string;

	/** Primary verb (SENSE, FUSE, etc.) */
	verb: HFOVerb;

	/** The diagonal quine mantra */
	mantra: string;

	/** What this port CAN do */
	capabilities: PortCapability[];

	/** What this port MUST NOT do */
	prohibitions: PortProhibition[];

	/** Gherkin-style behavioral specs */
	behaviors: PortBehavior[];

	/** Input contract (Zod schema) */
	inputSchema: z.ZodType<unknown>;

	/** Output contract (Zod schema) */
	outputSchema: z.ZodType<unknown>;
}

/** A single behavioral specification */
export interface PortBehavior {
	/** Scenario name */
	scenario: string;

	/** Given precondition */
	given: string;

	/** When action */
	when: string;

	/** Then expected outcome */
	then: string;

	/** And additional assertions */
	and?: string[];
}

// ============================================================================
// PORT 0: SENSE - Lidless Legion (★ Diagonal Quine 0.0)
// ============================================================================

/**
 * Port 0 Behavioral Contract
 *
 * IDENTITY: "How do we SENSE the SENSE?" - Self-aware perception
 *
 * CONSTRAINT: Port 0 can OBSERVE and TAG but NEVER MODIFY data.
 * The Lidless Legion perceives without interpretation.
 * Like a security camera - it records, it doesn't edit.
 */
export const PORT_0_CONTRACT: PortBehavioralContract = {
	port: 0,
	commander: 'Lidless Legion',
	verb: 'SENSE',
	mantra: 'How do we SENSE the SENSE?',

	capabilities: [
		'read', // ✅ Can read/observe any data
		'tag', // ✅ Can add metadata (timestamps, source, confidence)
	],

	prohibitions: [
		'modify_data', // ❌ NEVER modify incoming data
		'transform', // ❌ No transformations (that's Port 2)
		'persist', // ❌ No persistence (that's Port 6)
		'make_decisions', // ❌ No decisions (that's Port 7)
		'emit_output', // ❌ No output (that's Port 3)
	],

	behaviors: [
		{
			scenario: 'Observe without modification',
			given: 'Raw input data from any source',
			when: 'Port 0 senses the data',
			then: 'The original data remains unchanged',
			and: [
				'A timestamp tag is added',
				'A source tag is added',
				'A confidence score may be added',
				'The data passes through unmodified',
			],
		},
		{
			scenario: 'Detect changes only',
			given: 'A stream of input data',
			when: 'Port 0 observes changes',
			then: 'Change events are emitted but data is not modified',
			and: ['Events contain diff metadata only', 'Original data reference is preserved'],
		},
		{
			scenario: 'No interpretation',
			given: 'Ambiguous input data',
			when: 'Port 0 senses ambiguity',
			then: 'Ambiguity is tagged, not resolved',
			and: ['Resolution is deferred to Port 7 (DECIDE)', 'All possible interpretations are tagged'],
		},
	],

	inputSchema: z.unknown(),
	outputSchema: z.object({
		data: z.unknown(), // Original data, unchanged
		tags: z.object({
			ts: z.string().datetime(),
			source: z.string(),
			confidence: z.number().min(0).max(1).optional(),
		}),
	}),
};

// ============================================================================
// PORT 1: FUSE - Web Weaver (★ Diagonal Quine 1.1)
// ============================================================================

/**
 * Port 1 Behavioral Contract
 *
 * IDENTITY: "How do we FUSE the FUSE?" - Self-integrating adapters
 *
 * CONSTRAINT: Port 1 CONNECTS and VALIDATES but doesn't CREATE.
 * The Web Weaver bridges gaps, it doesn't build new content.
 * Like a translator - it connects languages, doesn't write novels.
 */
export const PORT_1_CONTRACT: PortBehavioralContract = {
	port: 1,
	commander: 'Web Weaver',
	verb: 'FUSE',
	mantra: 'How do we FUSE the FUSE?',

	capabilities: [
		'read', // ✅ Can read data to validate
		'validate', // ✅ Can validate against schemas
		'compose', // ✅ Can compose/merge data from multiple sources
		'route', // ✅ Can route to appropriate handlers
	],

	prohibitions: [
		'persist', // ❌ No persistence (that's Port 6)
		'make_decisions', // ❌ No strategic decisions (that's Port 7)
		'skip_validation', // ❌ MUST validate - that's its identity
	],

	behaviors: [
		{
			scenario: 'Validate all inputs',
			given: 'Input data with a schema',
			when: 'Port 1 receives the data',
			then: 'Schema validation MUST run',
			and: [
				'Invalid data is rejected with clear error',
				'Valid data passes with validation proof',
				'No data passes without validation',
			],
		},
		{
			scenario: 'Bridge adapters transparently',
			given: 'Two systems with different interfaces',
			when: 'Port 1 bridges between them',
			then: 'Data is translated but not interpreted',
			and: [
				'Semantic meaning is preserved',
				'Format changes are tracked',
				'Original source is traceable',
			],
		},
		{
			scenario: 'Compose without inventing',
			given: 'Multiple data sources to merge',
			when: 'Port 1 fuses them',
			then: 'Result contains ONLY data from sources',
			and: [
				'No new data is synthesized',
				'Conflicts are flagged, not resolved',
				'Source provenance is maintained',
			],
		},
	],

	inputSchema: z.object({
		sources: z.array(z.unknown()),
		schema: z.unknown().optional(),
	}),
	outputSchema: z.object({
		fused: z.unknown(),
		valid: z.boolean(),
		sources: z.array(z.string()),
		errors: z.array(z.string()).optional(),
	}),
};

// ============================================================================
// PORT 2: SHAPE - Mirror Magus (★ Diagonal Quine 2.2)
// ============================================================================

/**
 * Port 2 Behavioral Contract
 *
 * IDENTITY: "How do we SHAPE the SHAPE?" - Self-transforming geometry
 *
 * CONSTRAINT: Port 2 TRANSFORMS structure but preserves SEMANTIC content.
 * The Mirror Magus changes form, not meaning.
 * Like a prism - it splits light, doesn't create it.
 */
export const PORT_2_CONTRACT: PortBehavioralContract = {
	port: 2,
	commander: 'Mirror Magus',
	verb: 'SHAPE',
	mantra: 'How do we SHAPE the SHAPE?',

	capabilities: [
		'read', // ✅ Can read input data
		'transform', // ✅ Can transform structure
		'tag', // ✅ Can tag transformation metadata
	],

	prohibitions: [
		'persist', // ❌ No persistence (that's Port 6)
		'make_decisions', // ❌ No strategic decisions (that's Port 7)
		'emit_output', // ❌ No external output (that's Port 3)
		'invoke_external', // ❌ No external calls (pure transformation)
	],

	behaviors: [
		{
			scenario: 'Transform preserves semantics',
			given: 'Input data with known semantic content',
			when: 'Port 2 transforms the data',
			then: 'Semantic content is preserved',
			and: [
				'Structure may change completely',
				'Information content is conserved',
				'Transformation is reversible when possible',
			],
		},
		{
			scenario: 'Pure function - no side effects',
			given: 'Any input data',
			when: 'Port 2 shapes it',
			then: 'No external state is modified',
			and: [
				'Same input always produces same output',
				'No network calls',
				'No file system changes',
				'No database writes',
			],
		},
		{
			scenario: 'Smoothing preserves signal',
			given: 'Noisy input data',
			when: 'Port 2 applies smoothing',
			then: 'Signal is preserved, noise is reduced',
			and: [
				'Original data is not modified',
				'Smoothing parameters are tracked',
				'Raw data remains accessible',
			],
		},
	],

	inputSchema: z.unknown(),
	outputSchema: z.object({
		shaped: z.unknown(),
		transformations: z.array(z.string()),
		reversible: z.boolean().optional(),
	}),
};

// ============================================================================
// PORT 3: DELIVER - Spore Storm (★ Diagonal Quine 3.3)
// ============================================================================

/**
 * Port 3 Behavioral Contract
 *
 * IDENTITY: "How do we DELIVER the DELIVER?" - Self-executing workflows
 *
 * CONSTRAINT: Port 3 DELIVERS outputs and EXECUTES workflows.
 * The Spore Storm spreads, it doesn't decide where.
 * Like a courier - it delivers packages, doesn't choose addresses.
 */
export const PORT_3_CONTRACT: PortBehavioralContract = {
	port: 3,
	commander: 'Spore Storm',
	verb: 'DELIVER',
	mantra: 'How do we DELIVER the DELIVER?',

	capabilities: [
		'read', // ✅ Can read payload
		'emit_output', // ✅ Primary function - emit/deliver
		'invoke_external', // ✅ Can call external systems to deliver
		'tag', // ✅ Can add delivery metadata
	],

	prohibitions: [
		'make_decisions', // ❌ No decisions on WHERE to deliver (that's Port 7)
		'persist', // ❌ No persistence (that's Port 6)
		'validate', // ❌ No validation (that's Port 5)
		'transform', // ❌ No transformation (that's Port 2)
	],

	behaviors: [
		{
			scenario: 'Deliver without judgment',
			given: 'A payload with a target',
			when: 'Port 3 delivers it',
			then: 'Payload is delivered to target',
			and: [
				'Payload content is not modified',
				'Delivery confirmation is returned',
				'Delivery target was decided by Port 7',
			],
		},
		{
			scenario: 'Execute workflow step',
			given: 'A workflow state and action',
			when: 'Port 3 executes the action',
			then: 'The action is performed',
			and: [
				'State transition follows FSM rules',
				'Next state is determined by FSM, not Port 3',
				'Execution is logged to stigmergy',
			],
		},
		{
			scenario: 'Emit signal to blackboard',
			given: 'A valid stigmergy signal',
			when: 'Port 3 emits it',
			then: 'Signal is appended to blackboard',
			and: [
				'Signal passes G0-G7 gates (via Port 5)',
				'Emission is acknowledged',
				'Signal is immutable once emitted',
			],
		},
	],

	inputSchema: z.object({
		payload: z.unknown(),
		target: z.string(),
	}),
	outputSchema: z.object({
		delivered: z.boolean(),
		target: z.string(),
		timestamp: z.string().datetime(),
		acknowledgment: z.unknown().optional(),
	}),
};

// ============================================================================
// PORT 4: TEST - Red Regnant (★ Diagonal Quine 4.4)
// ============================================================================

/**
 * Port 4 Behavioral Contract
 *
 * IDENTITY: "How do we TEST the TEST?" - Self-validating probes
 *
 * CONSTRAINT: Port 4 DISRUPTS and VALIDATES with zero/negative trust.
 * The Red Regnant breaks things to prove they work.
 * Like a penetration tester - it attacks to protect.
 */
export const PORT_4_CONTRACT: PortBehavioralContract = {
	port: 4,
	commander: 'Red Regnant',
	verb: 'TEST',
	mantra: 'How do we TEST the TEST?',

	capabilities: [
		'read', // ✅ Can read data to test
		'validate', // ✅ Can validate properties
		'invoke', // ✅ Can invoke functions under test
	],

	prohibitions: [
		'persist', // ❌ No persistence (that's Port 6)
		'make_decisions', // ❌ No strategic decisions (that's Port 7)
		'emit_output', // ❌ No production output (that's Port 3)
		'modify_data', // ❌ No production data modification
	],

	behaviors: [
		{
			scenario: 'Property-based testing',
			given: 'A property predicate and generator',
			when: 'Port 4 runs property tests',
			then: 'At least 100 test cases are generated',
			and: [
				'Counterexamples are found if property fails',
				'Counterexamples are shrunk to minimal form',
				'All edge cases are explored',
			],
		},
		{
			scenario: 'Adversarial testing',
			given: 'A system component',
			when: 'Port 4 attacks it',
			then: 'Vulnerabilities are exposed',
			and: [
				'Byzantine fault tolerance is verified',
				'Hidden failure modes are found',
				'Trust boundaries are probed',
			],
		},
		{
			scenario: 'Zero trust validation',
			given: 'Any input claiming to be valid',
			when: 'Port 4 validates it',
			then: 'Trust level starts at -1 (negative)',
			and: [
				'Validation must be EARNED through proof',
				'No input is trusted by default',
				'Even internal signals are verified',
			],
		},
	],

	inputSchema: z.object({
		subject: z.unknown(),
		properties: z.array(
			z.object({
				name: z.string(),
				predicate: z.function(),
			}),
		),
		iterations: z.number().min(1).default(100),
	}),
	outputSchema: z.object({
		passed: z.boolean(),
		results: z.array(
			z.object({
				property: z.string(),
				passed: z.boolean(),
				counterexample: z.unknown().optional(),
				iterations: z.number(),
			}),
		),
	}),
};

// ============================================================================
// PORT 5: DEFEND - Pyre Praetorian (★ Diagonal Quine 5.5)
// ============================================================================

/**
 * Port 5 Behavioral Contract
 *
 * IDENTITY: "How do we DEFEND the DEFEND?" - Self-protecting gates
 *
 * CONSTRAINT: Port 5 ENFORCES gates and PROTECTS integrity.
 * The Pyre Praetorian guards passage, it doesn't choose destinations.
 * Like a firewall - it filters, doesn't route.
 */
export const PORT_5_CONTRACT: PortBehavioralContract = {
	port: 5,
	commander: 'Pyre Praetorian',
	verb: 'DEFEND',
	mantra: 'How do we DEFEND the DEFEND?',

	capabilities: [
		'read', // ✅ Can read data to check
		'gate', // ✅ Primary function - allow/deny
		'tag', // ✅ Can tag validation results
	],

	prohibitions: [
		'modify_data', // ❌ No data modification (gate only)
		'persist', // ❌ No persistence (that's Port 6)
		'make_decisions', // ❌ No strategic decisions (that's Port 7)
		'emit_output', // ❌ No output (that's Port 3)
		'transform', // ❌ No transformation (that's Port 2)
	],

	behaviors: [
		{
			scenario: 'Enforce G0-G7 gates',
			given: 'A stigmergy signal',
			when: 'Port 5 validates it',
			then: 'All 8 gates are checked',
			and: [
				'G0: Valid ISO8601 timestamp',
				'G1: 0.0 ≤ mark ≤ 1.0',
				'G2: pull ∈ {upstream, downstream, lateral}',
				'G3: Non-empty msg',
				'G4: type ∈ {signal, event, error, metric}',
				'G5: hive ∈ {H, I, V, E, X}',
				'G6: gen ≥ 84',
				'G7: 0 ≤ port ≤ 7',
			],
		},
		{
			scenario: 'Quarantine invalid data',
			given: 'Data that fails validation',
			when: 'Port 5 rejects it',
			then: 'Data is quarantined, not destroyed',
			and: [
				'Quarantine reason is recorded',
				'Data can be reviewed later',
				'Rejection is logged to stigmergy',
			],
		},
		{
			scenario: 'HIVE sequence enforcement',
			given: 'A series of HIVE signals',
			when: 'Port 5 checks sequence',
			then: 'H→I→V→E order is enforced',
			and: [
				'SKIPPED_HUNT detected (RED without HUNT)',
				'REWARD_HACK detected (GREEN without RED)',
				'LAZY_AI detected (no REFACTOR after GREEN)',
			],
		},
	],

	inputSchema: z.object({
		payload: z.unknown(),
		gates: z.array(
			z.object({
				id: z.string(),
				check: z.function(),
			}),
		),
	}),
	outputSchema: z.object({
		allowed: z.boolean(),
		passedGates: z.array(z.string()),
		failedGates: z.array(z.string()),
		quarantineId: z.string().optional(),
	}),
};

// ============================================================================
// PORT 6: STORE - Kraken Keeper (★ Diagonal Quine 6.6)
// ============================================================================

/**
 * Port 6 Behavioral Contract
 *
 * IDENTITY: "How do we STORE the STORE?" - Self-persisting memory
 *
 * CONSTRAINT: Port 6 PERSISTS and RETRIEVES but doesn't PROCESS.
 * The Kraken Keeper remembers everything, judges nothing.
 * Like a database - it stores, doesn't compute.
 */
export const PORT_6_CONTRACT: PortBehavioralContract = {
	port: 6,
	commander: 'Kraken Keeper',
	verb: 'STORE',
	mantra: 'How do we STORE the STORE?',

	capabilities: [
		'read', // ✅ Can read/query stored data
		'persist', // ✅ Primary function - durable storage
		'tag', // ✅ Can add storage metadata
	],

	prohibitions: [
		'transform', // ❌ No transformation (that's Port 2)
		'make_decisions', // ❌ No strategic decisions (that's Port 7)
		'validate', // ❌ No validation logic (that's Port 5)
		'emit_output', // ❌ No external output (that's Port 3)
	],

	behaviors: [
		{
			scenario: 'Store immutably',
			given: 'Data to persist',
			when: 'Port 6 stores it',
			then: 'Data is stored immutably',
			and: [
				'Original data is never modified',
				'Append-only semantics',
				'Timestamp and ID are assigned',
				'Data is retrievable by ID',
			],
		},
		{
			scenario: 'Full-text search',
			given: 'A search query',
			when: 'Port 6 searches',
			then: 'Matching records are returned',
			and: [
				'Search does not modify data',
				'Results are ranked by relevance',
				'Search is read-only operation',
			],
		},
		{
			scenario: 'Memory mining',
			given: 'Historical data request',
			when: 'Port 6 retrieves it',
			then: 'Complete history is available',
			and: [
				'All generations are accessible',
				'Lineage is traceable',
				'No data is lost or summarized',
			],
		},
	],

	inputSchema: z.object({
		collection: z.string(),
		data: z.unknown(),
	}),
	outputSchema: z.object({
		stored: z.boolean(),
		id: z.string(),
		timestamp: z.string().datetime(),
	}),
};

// ============================================================================
// PORT 7: DECIDE - Spider Sovereign (★ Diagonal Quine 7.7)
// ============================================================================

/**
 * Port 7 Behavioral Contract
 *
 * IDENTITY: "How do we DECIDE the DECIDE?" - Self-navigating choices
 *
 * CONSTRAINT: Port 7 DECIDES and ORCHESTRATES but doesn't EXECUTE.
 * The Spider Sovereign weaves the web, doesn't crawl it.
 * Like a conductor - it directs, doesn't play instruments.
 */
export const PORT_7_CONTRACT: PortBehavioralContract = {
	port: 7,
	commander: 'Spider Sovereign',
	verb: 'DECIDE',
	mantra: 'How do we DECIDE the DECIDE?',

	capabilities: [
		'read', // ✅ Can read state for decisions
		'route', // ✅ Can route to appropriate ports
		'compose', // ✅ Can compose multi-port workflows
	],

	prohibitions: [
		'persist', // ❌ No persistence (that's Port 6)
		'emit_output', // ❌ No direct output (that's Port 3)
		'transform', // ❌ No transformation (that's Port 2)
		'validate', // ❌ No validation (that's Port 5)
		'invoke_external', // ❌ No external calls (delegates to Port 3)
	],

	behaviors: [
		{
			scenario: 'Orchestrate without executing',
			given: 'A multi-port workflow request',
			when: 'Port 7 orchestrates it',
			then: 'Work is delegated to appropriate ports',
			and: [
				'Port 7 decides WHAT happens',
				'Other ports execute HOW it happens',
				"Port 7 coordinates, doesn't implement",
			],
		},
		{
			scenario: 'OODA loop navigation',
			given: 'An observation from Port 0',
			when: 'Port 7 processes it',
			then: 'Orient→Decide→Act phases are triggered',
			and: [
				'Orient (Port 2 shapes understanding)',
				'Decide (Port 7 chooses action)',
				'Act (Port 3 delivers execution)',
			],
		},
		{
			scenario: 'The spider weaves the web',
			given: 'A complex multi-agent scenario',
			when: 'Port 7 orchestrates the swarm',
			then: 'The web emerges from local decisions',
			and: [
				'Each agent follows HIVE/8 protocol',
				'Stigmergy coordinates without direct messaging',
				'The spider (Port 7) weaves the web that weaves the spider',
			],
		},
	],

	inputSchema: z.object({
		context: z.object({
			request: z.unknown(),
			state: z.record(z.unknown()),
		}),
		options: z.array(
			z.object({
				id: z.string(),
				action: z.string(),
			}),
		),
	}),
	outputSchema: z.object({
		decision: z.string(),
		confidence: z.number().min(0).max(1),
		delegations: z.array(
			z.object({
				port: z.number().min(0).max(7),
				action: z.string(),
			}),
		),
	}),
};

// ============================================================================
// CONTRACT REGISTRY
// ============================================================================

/** All port contracts indexed by port number */
export const PORT_CONTRACTS: Record<PortNumber, PortBehavioralContract> = {
	0: PORT_0_CONTRACT,
	1: PORT_1_CONTRACT,
	2: PORT_2_CONTRACT,
	3: PORT_3_CONTRACT,
	4: PORT_4_CONTRACT,
	5: PORT_5_CONTRACT,
	6: PORT_6_CONTRACT,
	7: PORT_7_CONTRACT,
};

// ============================================================================
// GALOIS LATTICE HELPERS
// ============================================================================

/**
 * Get the behavioral contract for a port
 */
export function getContract(port: PortNumber): PortBehavioralContract {
	return PORT_CONTRACTS[port];
}

/**
 * Check if an action is allowed for a port
 */
export function isCapable(port: PortNumber, capability: PortCapability): boolean {
	return PORT_CONTRACTS[port].capabilities.includes(capability);
}

/**
 * Check if an action is prohibited for a port
 */
export function isProhibited(port: PortNumber, action: PortProhibition): boolean {
	return PORT_CONTRACTS[port].prohibitions.includes(action);
}

/**
 * Get the diagonal quine mantra for a port
 */
export function getMantra(port: PortNumber): string {
	return PORT_CONTRACTS[port].mantra;
}

/**
 * Validate that a port action respects its behavioral contract
 */
export function validatePortAction(
	port: PortNumber,
	action: PortCapability | PortProhibition,
): { valid: boolean; reason?: string } {
	const contract = PORT_CONTRACTS[port];

	// Check if it's a capability (allowed)
	if (contract.capabilities.includes(action as PortCapability)) {
		return { valid: true };
	}

	// Check if it's a prohibition (forbidden)
	if (contract.prohibitions.includes(action as PortProhibition)) {
		return {
			valid: false,
			reason: `${contract.commander} (Port ${port}) is prohibited from "${action}" - ${contract.mantra}`,
		};
	}

	// Unknown action
	return { valid: false, reason: `Unknown action "${action}"` };
}

// ============================================================================
// GALOIS LATTICE CARD MAPPING
// ============================================================================

/**
 * The 8×8 Galois Lattice card structure
 *
 * Each cell [row, col] represents: "How do we {ROW_VERB} the {COL_VERB}?"
 *
 * The diagonal (★) represents the legendary quines - self-referential identity
 */
export const GALOIS_LATTICE = {
	// Diagonal quines (★)
	diagonal: [
		{ card: '0.0', question: 'How do we SENSE the SENSE?', commander: 'Lidless Legion' },
		{ card: '1.1', question: 'How do we FUSE the FUSE?', commander: 'Web Weaver' },
		{ card: '2.2', question: 'How do we SHAPE the SHAPE?', commander: 'Mirror Magus' },
		{ card: '3.3', question: 'How do we DELIVER the DELIVER?', commander: 'Spore Storm' },
		{ card: '4.4', question: 'How do we TEST the TEST?', commander: 'Red Regnant' },
		{ card: '5.5', question: 'How do we DEFEND the DEFEND?', commander: 'Pyre Praetorian' },
		{ card: '6.6', question: 'How do we STORE the STORE?', commander: 'Kraken Keeper' },
		{ card: '7.7', question: 'How do we DECIDE the DECIDE?', commander: 'Spider Sovereign' },
	],

	// Anti-diagonal (HIVEEVIH pattern, sum = 7)
	antiDiagonal: [
		{ card: '0.7', ports: [0, 7], hive: 'H' },
		{ card: '1.6', ports: [1, 6], hive: 'I' },
		{ card: '2.5', ports: [2, 5], hive: 'V' },
		{ card: '3.4', ports: [3, 4], hive: 'E' },
		{ card: '4.3', ports: [4, 3], hive: 'E' },
		{ card: '5.2', ports: [5, 2], hive: 'V' },
		{ card: '6.1', ports: [6, 1], hive: 'I' },
		{ card: '7.0', ports: [7, 0], hive: 'H' },
	],

	/**
	 * Generate the question for any cell in the lattice
	 */
	getQuestion(row: PortNumber, col: PortNumber): string {
		const verbs: Record<PortNumber, string> = {
			0: 'SENSE',
			1: 'FUSE',
			2: 'SHAPE',
			3: 'DELIVER',
			4: 'TEST',
			5: 'DEFEND',
			6: 'STORE',
			7: 'DECIDE',
		};
		return `How do we ${verbs[row]} the ${verbs[col]}?`;
	},

	/**
	 * Check if a cell is on the diagonal (legendary quine)
	 */
	isDiagonal(row: PortNumber, col: PortNumber): boolean {
		return row === col;
	},

	/**
	 * Check if a cell is on the anti-diagonal (HIVE pair)
	 */
	isAntiDiagonal(row: PortNumber, col: PortNumber): boolean {
		return row + col === 7;
	},
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
	PORT_CONTRACTS,
	GALOIS_LATTICE,
	getContract,
	isCapable,
	isProhibited,
	getMantra,
	validatePortAction,
};
