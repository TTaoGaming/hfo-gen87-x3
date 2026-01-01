import { type BaseMessage, HumanMessage } from '@langchain/core/messages';
/**
 * LangGraph HIVE/8 Orchestrator
 *
 * Gen87.X3 | Stateful Graph-Based Agent Orchestration
 *
 * LangGraph provides:
 * - Stateful workflows with checkpointing
 * - Cycles and branching (unlike linear chains)
 * - Human-in-the-loop (optional, we disable for no-babysitting)
 * - Streaming support
 */
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

// ============================================================================
// OPENROUTER-BACKED CHAT MODEL
// ============================================================================

export function createOpenRouterLLM(model: string) {
	return new ChatOpenAI({
		modelName: model,
		temperature: 0.7,
		configuration: {
			baseURL: 'https://openrouter.ai/api/v1',
			defaultHeaders: {
				'HTTP-Referer': 'https://github.com/TTaoGaming/hfo-gen87-x3',
				'X-Title': 'HFO Gen87.X3 LangGraph',
			},
		},
		apiKey: process.env.OPENROUTER_API_KEY,
	});
}

// ============================================================================
// HIVE/8 STATE ANNOTATION
// ============================================================================

export const HIVEStateAnnotation = Annotation.Root({
	// Current HIVE phase
	phase: Annotation<'H' | 'I' | 'V' | 'E'>({
		reducer: (_, next) => next,
		default: () => 'H',
	}),

	// Cycle count (for evolution tracking)
	cycle: Annotation<number>({
		reducer: (_, next) => next,
		default: () => 0,
	}),

	// Messages history
	messages: Annotation<BaseMessage[]>({
		reducer: (prev, next) => [...prev, ...next],
		default: () => [],
	}),

	// Hunt results (exemplars found)
	huntResults: Annotation<string[]>({
		reducer: (prev, next) => [...prev, ...next],
		default: () => [],
	}),

	// Interlock results (contracts defined)
	interlockResults: Annotation<string[]>({
		reducer: (prev, next) => [...prev, ...next],
		default: () => [],
	}),

	// Validate results (tests passed)
	validateResults: Annotation<string[]>({
		reducer: (prev, next) => [...prev, ...next],
		default: () => [],
	}),

	// Evolve results (outputs emitted)
	evolveResults: Annotation<string[]>({
		reducer: (prev, next) => [...prev, ...next],
		default: () => [],
	}),

	// Task to execute
	task: Annotation<string>({
		reducer: (_, next) => next,
		default: () => '',
	}),

	// Final output
	output: Annotation<string>({
		reducer: (_, next) => next,
		default: () => '',
	}),
});

export type HIVEState = typeof HIVEStateAnnotation.State;

// ============================================================================
// HIVE/8 NODE FUNCTIONS
// ============================================================================

const llm = createOpenRouterLLM('google/gemini-2.0-flash-001');

async function huntNode(state: HIVEState): Promise<Partial<HIVEState>> {
	const response = await llm.invoke([
		new HumanMessage(`
You are the HUNT phase (H) of HIVE/8. Your role is to:
1. Search for exemplars and prior art
2. Research patterns and solutions
3. Plan the approach

TASK: ${state.task}

Provide a concise list of findings and recommendations.
`),
	]);

	return {
		phase: 'I',
		huntResults: [response.content as string],
		messages: [response],
	};
}

async function interlockNode(state: HIVEState): Promise<Partial<HIVEState>> {
	const response = await llm.invoke([
		new HumanMessage(`
You are the INTERLOCK phase (I) of HIVE/8. Your role is to:
1. Define contracts and interfaces
2. Write failing tests (TDD RED)
3. Connect pieces via adapters

HUNT FINDINGS:
${state.huntResults.join('\n')}

TASK: ${state.task}

Define the contracts and interfaces needed.
`),
	]);

	return {
		phase: 'V',
		interlockResults: [response.content as string],
		messages: [response],
	};
}

async function validateNode(state: HIVEState): Promise<Partial<HIVEState>> {
	const response = await llm.invoke([
		new HumanMessage(`
You are the VALIDATE phase (V) of HIVE/8. Your role is to:
1. Implement code to make tests pass (TDD GREEN)
2. Run property-based tests
3. Enforce gates (G0-G11)

CONTRACTS DEFINED:
${state.interlockResults.join('\n')}

TASK: ${state.task}

Provide the implementation and validation results.
`),
	]);

	return {
		phase: 'E',
		validateResults: [response.content as string],
		messages: [response],
	};
}

async function evolveNode(state: HIVEState): Promise<Partial<HIVEState>> {
	const response = await llm.invoke([
		new HumanMessage(`
You are the EVOLVE phase (E) of HIVE/8. Your role is to:
1. Refactor and clean up code
2. Emit results to blackboard
3. Prepare for next cycle (N+1)

VALIDATION RESULTS:
${state.validateResults.join('\n')}

TASK: ${state.task}

Provide the final output and evolution recommendations.
`),
	]);

	return {
		cycle: state.cycle + 1,
		evolveResults: [response.content as string],
		output: response.content as string,
		messages: [response],
	};
}

// ============================================================================
// ROUTER: Decide next phase or end (reserved for multi-cycle evolution)
// ============================================================================

// NOTE: routeAfterEvolve reserved for continuous evolution loops
// Currently single-cycle (H→I→V→E→END), can enable N+1 looping later
// function routeAfterEvolve(state: HIVEState): 'hunt' | typeof END {
// 	if (state.cycle < 1) return END;
// 	return 'hunt';
// }

// ============================================================================
// BUILD THE HIVE/8 GRAPH
// ============================================================================

export function createHIVEGraph() {
	const workflow = new StateGraph(HIVEStateAnnotation)
		// Add nodes for each HIVE phase
		.addNode('hunt', huntNode)
		.addNode('interlock', interlockNode)
		.addNode('validate', validateNode)
		.addNode('evolve', evolveNode)

		// Define edges (HIVE sequence)
		.addEdge(START, 'hunt')
		.addEdge('hunt', 'interlock')
		.addEdge('interlock', 'validate')
		.addEdge('validate', 'evolve')

		// End after evolve (no loop for now)
		.addEdge('evolve', END);

	return workflow.compile();
}

// ============================================================================
// RUN HIVE CYCLE
// ============================================================================

export async function runHIVECycle(task: string): Promise<HIVEState> {
	const graph = createHIVEGraph();

	const result = await graph.invoke({
		task,
		phase: 'H',
		cycle: 0,
	});

	return result as HIVEState;
}

// ============================================================================
// TEST
// ============================================================================

export async function testLangGraphHIVE(): Promise<void> {
	console.log('🔄 Testing LangGraph HIVE/8 orchestration...');

	const result = await runHIVECycle('Create a simple "Hello World" TypeScript function');

	console.log('✅ HIVE Cycle Complete:');
	console.log('  Cycle:', result.cycle);
	console.log('  Hunt Results:', result.huntResults.length);
	console.log('  Interlock Results:', result.interlockResults.length);
	console.log('  Validate Results:', result.validateResults.length);
	console.log('  Evolve Results:', result.evolveResults.length);
	console.log('  Output Preview:', `${result.output.substring(0, 200)}...`);
}
