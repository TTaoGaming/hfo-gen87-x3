/**
 * Temporal ↔ LangGraph Bridge
 *
 * Gen87.X3 | Durable LangGraph Orchestration via Temporal
 *
 * This bridge allows Temporal to orchestrate LangGraph StateGraph workflows:
 * - Temporal provides: Durability, retries, signals, queries, long-running support
 * - LangGraph provides: Stateful graph execution, cycles, streaming
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ Temporal Workflow                                               │
 * │  ├─ HIVELangGraphWorkflow                                       │
 * │  │   ├─ Activity: runLangGraphPhase('H')  → LangGraph huntNode  │
 * │  │   ├─ Activity: runLangGraphPhase('I')  → LangGraph interlock │
 * │  │   ├─ Activity: runLangGraphPhase('V')  → LangGraph validate  │
 * │  │   └─ Activity: runLangGraphPhase('E')  → LangGraph evolve    │
 * │  └─ Signals/Queries for state inspection                        │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { HumanMessage } from '@langchain/core/messages';
import { createOpenRouterLLM } from './langgraph.hive.js';

// ============================================================================
// TYPES
// ============================================================================

export interface LangGraphPhaseInput {
	phase: 'H' | 'I' | 'V' | 'E';
	task: string;
	context: string[]; // Previous phase outputs
	cycle: number;
}

export interface LangGraphPhaseOutput {
	phase: 'H' | 'I' | 'V' | 'E';
	output: string;
	timestamp: string;
}

// ============================================================================
// LANGGRAPH PHASE EXECUTOR
// Runs a single HIVE phase using LangGraph's LLM invocation pattern
// ============================================================================

const PHASE_PROMPTS = {
	H: (task: string, context: string[]) => `
You are the HUNT phase (H) of HIVE/8. Your role is to:
1. Search for exemplars and prior art
2. Research patterns and solutions
3. Plan the approach

${context.length > 0 ? `PREVIOUS CONTEXT:\n${context.join('\n---\n')}` : ''}

TASK: ${task}

Provide a concise list of findings and recommendations.
`,

	I: (task: string, context: string[]) => `
You are the INTERLOCK phase (I) of HIVE/8. Your role is to:
1. Define contracts and interfaces (Zod schemas)
2. Write failing tests (TDD RED)
3. Connect pieces via adapters

HUNT FINDINGS:
${context.join('\n---\n')}

TASK: ${task}

Define the contracts and interfaces needed.
`,

	V: (task: string, context: string[]) => `
You are the VALIDATE phase (V) of HIVE/8. Your role is to:
1. Implement code to make tests pass (TDD GREEN)
2. Run property-based tests with fast-check
3. Enforce gates (G0-G11)

CONTRACTS DEFINED:
${context.join('\n---\n')}

TASK: ${task}

Provide the implementation and validation results.
`,

	E: (task: string, context: string[]) => `
You are the EVOLVE phase (E) of HIVE/8. Your role is to:
1. Refactor and clean up code
2. Emit results to blackboard
3. Prepare for next cycle (N+1)

VALIDATION RESULTS:
${context.join('\n---\n')}

TASK: ${task}

Provide the final output, evolution recommendations, and N+1 task.
`,
};

// Model mapping by phase (can use different models per phase)
const PHASE_MODELS: Record<string, string> = {
	H: 'google/gemini-2.0-flash-exp:free', // Fast for research
	I: 'meta-llama/llama-3.3-70b-instruct:free', // Good at code
	V: 'meta-llama/llama-3.3-70b-instruct:free', // Good at implementation
	E: 'google/gemini-2.0-flash-exp:free', // Good at synthesis
};

/**
 * Execute a single HIVE phase using LangGraph's LLM pattern
 * This is the core bridge function called by Temporal Activities
 */
export async function executeLangGraphPhase(input: LangGraphPhaseInput): Promise<LangGraphPhaseOutput> {
	const { phase, task, context, cycle } = input;

	console.log(`🔄 [LangGraph] Executing ${phase} phase (cycle ${cycle})...`);

	const llm = createOpenRouterLLM(PHASE_MODELS[phase] || 'meta-llama/llama-3.3-70b-instruct:free');
	const prompt = PHASE_PROMPTS[phase](task, context);

	const response = await llm.invoke([new HumanMessage(prompt)]);
	const output = response.content as string;

	console.log(`✅ [LangGraph] ${phase} phase complete (${output.length} chars)`);

	return {
		phase,
		output,
		timestamp: new Date().toISOString(),
	};
}

// ============================================================================
// TEMPORAL ACTIVITIES (Import these in temporal.activities.ts)
// ============================================================================

/**
 * Temporal Activity: Run LangGraph HUNT phase
 */
export async function langGraphHuntActivity(input: {
	task: string;
	cycle: number;
}): Promise<LangGraphPhaseOutput> {
	return executeLangGraphPhase({
		phase: 'H',
		task: input.task,
		context: [],
		cycle: input.cycle,
	});
}

/**
 * Temporal Activity: Run LangGraph INTERLOCK phase
 */
export async function langGraphInterlockActivity(input: {
	task: string;
	huntOutput: string;
	cycle: number;
}): Promise<LangGraphPhaseOutput> {
	return executeLangGraphPhase({
		phase: 'I',
		task: input.task,
		context: [input.huntOutput],
		cycle: input.cycle,
	});
}

/**
 * Temporal Activity: Run LangGraph VALIDATE phase
 */
export async function langGraphValidateActivity(input: {
	task: string;
	interlockOutput: string;
	cycle: number;
}): Promise<LangGraphPhaseOutput> {
	return executeLangGraphPhase({
		phase: 'V',
		task: input.task,
		context: [input.interlockOutput],
		cycle: input.cycle,
	});
}

/**
 * Temporal Activity: Run LangGraph EVOLVE phase
 */
export async function langGraphEvolveActivity(input: {
	task: string;
	validateOutput: string;
	cycle: number;
}): Promise<LangGraphPhaseOutput> {
	return executeLangGraphPhase({
		phase: 'E',
		task: input.task,
		context: [input.validateOutput],
		cycle: input.cycle,
	});
}

// ============================================================================
// FULL HIVE CYCLE (Direct execution without Temporal)
// ============================================================================

export async function runFullHIVECycle(task: string): Promise<{
	hunt: LangGraphPhaseOutput;
	interlock: LangGraphPhaseOutput;
	validate: LangGraphPhaseOutput;
	evolve: LangGraphPhaseOutput;
}> {
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('  🔄 HIVE/8 CYCLE via LangGraph Bridge');
	console.log('═══════════════════════════════════════════════════════════════');
	console.log(`  Task: ${task}`);
	console.log('');

	const hunt = await executeLangGraphPhase({ phase: 'H', task, context: [], cycle: 0 });
	const interlock = await executeLangGraphPhase({ phase: 'I', task, context: [hunt.output], cycle: 0 });
	const validate = await executeLangGraphPhase({ phase: 'V', task, context: [interlock.output], cycle: 0 });
	const evolve = await executeLangGraphPhase({ phase: 'E', task, context: [validate.output], cycle: 0 });

	console.log('');
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('  ✅ HIVE/8 CYCLE COMPLETE');
	console.log('═══════════════════════════════════════════════════════════════');

	return { hunt, interlock, validate, evolve };
}

// ============================================================================
// CLI TEST
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
	const task = process.argv[2] || 'Create a TypeScript function that validates email addresses';

	runFullHIVECycle(task)
		.then((result) => {
			console.log('');
			console.log('📋 Results Summary:');
			console.log(`  H: ${result.hunt.output.substring(0, 100)}...`);
			console.log(`  I: ${result.interlock.output.substring(0, 100)}...`);
			console.log(`  V: ${result.validate.output.substring(0, 100)}...`);
			console.log(`  E: ${result.evolve.output.substring(0, 100)}...`);
		})
		.catch(console.error);
}
