/**
 * Temporal.io HIVE/8 Workflows
 *
 * Gen87.X3 | Durable Workflow Orchestration
 *
 * Temporal provides:
 * - Durable execution (survives crashes)
 * - Automatic retries
 * - Long-running workflows (days/weeks)
 * - Signals and queries for coordination
 * - Child workflow spawning (task factory)
 *
 * NOTE: Requires Temporal server running. See setup instructions.
 */
import * as workflow from '@temporalio/workflow';
import type * as activities from './temporal.activities.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface HIVEConfig {
	task: string;
	scaling: '8:0001' | '8:0010' | '8:0100' | '8:1010';
	maxCycles: number;
}

export interface HIVEState {
	phase: 'H' | 'I' | 'V' | 'E';
	cycle: number;
	results: PhaseResult[];
}

export interface PhaseResult {
	phase: 'H' | 'I' | 'V' | 'E';
	port: number;
	output: string;
	timestamp: string;
}

// ============================================================================
// SIGNALS AND QUERIES
// ============================================================================

// Signals for external events
export const phaseCompleteSignal = workflow.defineSignal<[PhaseResult]>('phaseComplete');
export const cancelSignal = workflow.defineSignal('cancel');

// Queries for state inspection (NO HUMAN NEEDED)
export const getStateQuery = workflow.defineQuery<HIVEState>('getState');
export const getPhaseQuery = workflow.defineQuery<'H' | 'I' | 'V' | 'E'>('getPhase');

// ============================================================================
// PROXY ACTIVITIES
// ============================================================================

const { huntActivity, interlockActivity, validateActivity, evolveActivity } =
	workflow.proxyActivities<typeof activities>({
		startToCloseTimeout: '5 minutes',
		retry: {
			maximumAttempts: 3, // Auto-retry, no babysitting
		},
	});

// ============================================================================
// HIVE ORCHESTRATOR WORKFLOW
// ============================================================================

export async function HIVEOrchestratorWorkflow(config: HIVEConfig): Promise<HIVEState> {
	// Initialize state
	const state: HIVEState = {
		phase: 'H',
		cycle: 0,
		results: [],
	};

	let cancelled = false;

	// Set up signal handlers
	workflow.setHandler(phaseCompleteSignal, (result: PhaseResult) => {
		state.results.push(result);
	});

	workflow.setHandler(cancelSignal, () => {
		cancelled = true;
	});

	// Set up query handlers
	workflow.setHandler(getStateQuery, () => state);
	workflow.setHandler(getPhaseQuery, () => state.phase);

	// Parse scaling config
	const parallelism = parseScaling(config.scaling);

	// Main HIVE loop
	while (state.cycle < config.maxCycles && !cancelled) {
		// HUNT PHASE (H) - Ports 0+7
		state.phase = 'H';
		const huntResult = await huntActivity({
			task: config.task,
			cycle: state.cycle,
			port: 0,
		});
		state.results.push(huntResult);

		if (cancelled) break;

		// INTERLOCK PHASE (I) - Ports 1+6
		state.phase = 'I';
		const interlockResult = await interlockActivity({
			task: config.task,
			huntResults: [huntResult],
			cycle: state.cycle,
			port: 1,
		});
		state.results.push(interlockResult);

		if (cancelled) break;

		// VALIDATE PHASE (V) - Ports 2+5
		state.phase = 'V';
		const validateResult = await validateActivity({
			task: config.task,
			interlockResults: [interlockResult],
			cycle: state.cycle,
			port: 2,
		});
		state.results.push(validateResult);

		if (cancelled) break;

		// EVOLVE PHASE (E) - Ports 3+4
		state.phase = 'E';
		const evolveResult = await evolveActivity({
			task: config.task,
			validateResults: [validateResult],
			cycle: state.cycle,
			port: 3,
		});
		state.results.push(evolveResult);

		// Increment cycle
		state.cycle++;

		// Check if we should continue-as-new (for unlimited evolution)
		if (state.cycle > 0 && state.cycle % 100 === 0) {
			return workflow.continueAsNew<typeof HIVEOrchestratorWorkflow>({
				...config,
				maxCycles: config.maxCycles - state.cycle,
			});
		}
	}

	return state;
}

// ============================================================================
// SCALING PARSER
// ============================================================================

function parseScaling(scaling: string): number {
	// 8:WXYZ format
	const match = scaling.match(/8:(\d)(\d)(\d)(\d)/);
	if (!match) return 1;

	const [, w, x, y, z] = match;
	return (
		Number.parseInt(w, 10) * 1000 +
		Number.parseInt(x, 10) * 100 +
		Number.parseInt(y, 10) * 10 +
		Number.parseInt(z, 10)
	);
}

// ============================================================================
// CHILD WORKFLOW: Phase Worker
// ============================================================================

export interface PhaseWorkerConfig {
	phase: 'H' | 'I' | 'V' | 'E';
	port: number;
	task: string;
	context: string[];
}

export async function PhaseWorkerWorkflow(config: PhaseWorkerConfig): Promise<PhaseResult> {
	const { phase, port, task, context } = config;

	let output: string;

	switch (phase) {
		case 'H':
			output = (await huntActivity({ task, cycle: 0, port })).output;
			break;
		case 'I':
			output = (await interlockActivity({ task, huntResults: [], cycle: 0, port })).output;
			break;
		case 'V':
			output = (await validateActivity({ task, interlockResults: [], cycle: 0, port })).output;
			break;
		case 'E':
			output = (await evolveActivity({ task, validateResults: [], cycle: 0, port })).output;
			break;
	}

	return {
		phase,
		port,
		output,
		timestamp: new Date().toISOString(),
	};
}
