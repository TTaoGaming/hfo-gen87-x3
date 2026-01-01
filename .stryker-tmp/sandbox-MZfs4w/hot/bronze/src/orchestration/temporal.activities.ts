/**
 * Temporal.io HIVE/8 Activities
 *
 * Gen87.X3 | Durable Activity Definitions
 *
 * Activities are the "units of work" in Temporal.
 * They can:
 * - Make network calls (LLM APIs)
 * - Access databases
 * - Perform I/O operations
 *
 * Activities automatically retry on failure (no babysitting).
 */
// @ts-nocheck

import { generateCompletion } from './openrouter.config.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface HuntInput {
	task: string;
	cycle: number;
	port: number;
}

export interface InterlockInput {
	task: string;
	huntResults: PhaseResult[];
	cycle: number;
	port: number;
}

export interface ValidateInput {
	task: string;
	interlockResults: PhaseResult[];
	cycle: number;
	port: number;
}

export interface EvolveInput {
	task: string;
	validateResults: PhaseResult[];
	cycle: number;
	port: number;
}

export interface PhaseResult {
	phase: 'H' | 'I' | 'V' | 'E';
	port: number;
	output: string;
	timestamp: string;
}

// ============================================================================
// HUNT ACTIVITY (Ports 0+7)
// ============================================================================

export async function huntActivity(input: HuntInput): Promise<PhaseResult> {
	const output = await generateCompletion(
		`
You are the HUNT phase (H) of HIVE/8. Your role is to:
1. Search for exemplars and prior art
2. Research patterns and solutions
3. Plan the approach

TASK: ${input.task}
CYCLE: ${input.cycle}

Provide a concise list of findings and recommendations.
`,
		{
			port: input.port,
			systemPrompt:
				'You are Lidless Legion (Port 0), the ever-watchful Observer. SENSE without interpretation.',
		},
	);

	return {
		phase: 'H',
		port: input.port,
		output,
		timestamp: new Date().toISOString(),
	};
}

// ============================================================================
// INTERLOCK ACTIVITY (Ports 1+6)
// ============================================================================

export async function interlockActivity(input: InterlockInput): Promise<PhaseResult> {
	const huntContext = input.huntResults.map((r) => r.output).join('\n---\n');

	const output = await generateCompletion(
		`
You are the INTERLOCK phase (I) of HIVE/8. Your role is to:
1. Define contracts and interfaces (Zod schemas)
2. Write failing tests (TDD RED)
3. Connect pieces via adapters

HUNT FINDINGS:
${huntContext || 'No prior hunt results.'}

TASK: ${input.task}
CYCLE: ${input.cycle}

Define the contracts and interfaces needed.
`,
		{
			port: input.port,
			systemPrompt: 'You are Web Weaver (Port 1), the Bridger. FUSE contracts and connections.',
		},
	);

	return {
		phase: 'I',
		port: input.port,
		output,
		timestamp: new Date().toISOString(),
	};
}

// ============================================================================
// VALIDATE ACTIVITY (Ports 2+5)
// ============================================================================

export async function validateActivity(input: ValidateInput): Promise<PhaseResult> {
	const interlockContext = input.interlockResults.map((r) => r.output).join('\n---\n');

	const output = await generateCompletion(
		`
You are the VALIDATE phase (V) of HIVE/8. Your role is to:
1. Implement code to make tests pass (TDD GREEN)
2. Run property-based tests with fast-check
3. Enforce gates (G0-G11)

CONTRACTS DEFINED:
${interlockContext || 'No prior interlock results.'}

TASK: ${input.task}
CYCLE: ${input.cycle}

Provide the implementation and validation results.
`,
		{
			port: input.port,
			systemPrompt: 'You are Mirror Magus (Port 2), the Shaper. SHAPE transformations precisely.',
		},
	);

	return {
		phase: 'V',
		port: input.port,
		output,
		timestamp: new Date().toISOString(),
	};
}

// ============================================================================
// EVOLVE ACTIVITY (Ports 3+4)
// ============================================================================

export async function evolveActivity(input: EvolveInput): Promise<PhaseResult> {
	const validateContext = input.validateResults.map((r) => r.output).join('\n---\n');

	const output = await generateCompletion(
		`
You are the EVOLVE phase (E) of HIVE/8. Your role is to:
1. Refactor and clean up code
2. Emit results to blackboard
3. Prepare for next cycle (N+1)

VALIDATION RESULTS:
${validateContext || 'No prior validate results.'}

TASK: ${input.task}
CYCLE: ${input.cycle}

Provide the final output and evolution recommendations.
`,
		{
			port: input.port,
			systemPrompt: 'You are Spore Storm (Port 3), the Injector. DELIVER outputs via HIVE/8.',
		},
	);

	return {
		phase: 'E',
		port: input.port,
		output,
		timestamp: new Date().toISOString(),
	};
}
