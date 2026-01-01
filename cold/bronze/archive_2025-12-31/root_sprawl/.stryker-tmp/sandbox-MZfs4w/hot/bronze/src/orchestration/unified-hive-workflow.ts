/**
 * Unified HIVE/8 Temporal Workflow
 *
 * Gen87.X3 | Single workflow that orchestrates ALL systems
 *
 * This workflow:
 * - Routes to LangGraph, CrewAI, MCP, or NATS based on phase/port
 * - Provides unified interface for HIVE/8 execution
 * - Supports signals and queries for state inspection
 * - Handles failures gracefully with fallbacks
 */
// @ts-nocheck

import * as workflow from '@temporalio/workflow';
import type * as activities from './unified-hive-activities.js';

// ============================================================================
// TYPES
// ============================================================================

export interface UnifiedWorkflowConfig {
	task: string;
	maxCycles: number;
	mode: 'sequential' | 'parallel'; // 0001 or 1010
	systems: {
		langgraph: boolean;
		crewai: boolean;
		mcp: boolean;
		nats: boolean;
	};
}

export interface UnifiedWorkflowState {
	phase: 'H' | 'I' | 'V' | 'E' | 'COMPLETE';
	cycle: number;
	results: activities.UnifiedPhaseOutput[];
	errors: string[];
	systemsUsed: Set<string>;
}

// ============================================================================
// SIGNALS AND QUERIES
// ============================================================================

export const getStateQuery = workflow.defineQuery<UnifiedWorkflowState>('getState');
export const getPhaseQuery = workflow.defineQuery<string>('getPhase');
export const getResultsQuery = workflow.defineQuery<activities.UnifiedPhaseOutput[]>('getResults');
export const cancelSignal = workflow.defineSignal('cancel');
export const skipPhaseSignal = workflow.defineSignal<['H' | 'I' | 'V' | 'E']>('skipPhase');

// ============================================================================
// PROXY ACTIVITIES
// ============================================================================

const { langGraphActivity, crewaiActivity, mcpActivity, natsActivity, unifiedHIVEActivity } =
	workflow.proxyActivities<typeof activities>({
		startToCloseTimeout: '5 minutes',
		retry: {
			maximumAttempts: 3,
			initialInterval: '1 second',
			backoffCoefficient: 2,
		},
	});

// ============================================================================
// UNIFIED HIVE WORKFLOW
// ============================================================================

export async function UnifiedHIVEWorkflow(
	config: UnifiedWorkflowConfig,
): Promise<UnifiedWorkflowState> {
	const state: UnifiedWorkflowState = {
		phase: 'H',
		cycle: 0,
		results: [],
		errors: [],
		systemsUsed: new Set(),
	};

	let cancelled = false;
	const skippedPhases = new Set<string>();

	// Set up handlers
	workflow.setHandler(getStateQuery, () => ({
		...state,
		systemsUsed: Array.from(state.systemsUsed) as unknown as Set<string>,
	}));
	workflow.setHandler(getPhaseQuery, () => state.phase);
	workflow.setHandler(getResultsQuery, () => state.results);
	workflow.setHandler(cancelSignal, () => {
		cancelled = true;
	});
	workflow.setHandler(skipPhaseSignal, (phase) => {
		skippedPhases.add(phase);
	});

	// Main HIVE loop
	while (state.cycle < config.maxCycles && !cancelled) {
		state.cycle++;
		const context: string[] = [];

		// HUNT Phase (Ports 0+7)
		if (!skippedPhases.has('H')) {
			state.phase = 'H';

			if (config.mode === 'parallel') {
				// Parallel: All enabled systems at once
				const huntPromises: Promise<activities.UnifiedPhaseOutput>[] = [];

				if (config.systems.mcp) {
					huntPromises.push(
						mcpActivity({ tool: 'lidless_sense', args: { query: config.task } }).catch((e) => ({
							phase: 'H' as const,
							port: 0,
							source: 'mcp' as const,
							output: `MCP Error: ${e.message}`,
							timestamp: new Date().toISOString(),
							durationMs: 0,
						})),
					);
				}

				if (config.systems.langgraph) {
					huntPromises.push(
						langGraphActivity({
							phase: 'H',
							task: config.task,
							context: [],
							cycle: state.cycle,
							port: 7,
						}),
					);
				}

				const huntResults = await Promise.all(huntPromises);
				for (const result of huntResults) {
					state.results.push(result);
					state.systemsUsed.add(result.source);
					context.push(result.output);
				}
			} else {
				// Sequential: Use unified activity with auto-routing
				const huntResult = await unifiedHIVEActivity({
					phase: 'H',
					task: config.task,
					context: [],
					cycle: state.cycle,
					port: 0,
					preferredSystem: config.systems.mcp ? 'mcp' : 'langgraph',
				});
				state.results.push(huntResult);
				state.systemsUsed.add(huntResult.source);
				context.push(huntResult.output);
			}
		}

		// INTERLOCK Phase (Ports 1+6)
		if (!skippedPhases.has('I')) {
			state.phase = 'I';

			const interlockResult = await unifiedHIVEActivity({
				phase: 'I',
				task: config.task,
				context,
				cycle: state.cycle,
				port: 1,
				preferredSystem: 'langgraph', // LangGraph best for interface design
			});
			state.results.push(interlockResult);
			state.systemsUsed.add(interlockResult.source);
			context.push(interlockResult.output);
		}

		// VALIDATE Phase (Ports 2+5)
		if (!skippedPhases.has('V')) {
			state.phase = 'V';

			const validateResult = await unifiedHIVEActivity({
				phase: 'V',
				task: config.task,
				context,
				cycle: state.cycle,
				port: 2,
				preferredSystem: 'langgraph', // LangGraph best for testing
			});
			state.results.push(validateResult);
			state.systemsUsed.add(validateResult.source);
			context.push(validateResult.output);
		}

		// EVOLVE Phase (Ports 3+4)
		if (!skippedPhases.has('E')) {
			state.phase = 'E';

			if (config.systems.nats) {
				// Try NATS for delivery
				const natsResult = await natsActivity({
					subject: `hive.evolve.cycle${state.cycle}`,
					payload: JSON.stringify({
						task: config.task,
						cycle: state.cycle,
						results: context,
					}),
				});
				state.results.push(natsResult);
				state.systemsUsed.add('nats');
			}

			// Also run LangGraph for synthesis
			const evolveResult = await unifiedHIVEActivity({
				phase: 'E',
				task: config.task,
				context,
				cycle: state.cycle,
				port: 4,
				preferredSystem: 'langgraph',
			});
			state.results.push(evolveResult);
			state.systemsUsed.add(evolveResult.source);
		}
	}

	state.phase = 'COMPLETE';
	return state;
}

// ============================================================================
// SIMPLE TEST WORKFLOW (For mutation testing)
// ============================================================================

export interface SimpleHIVEConfig {
	task: string;
	port: number;
}

/**
 * Simple single-phase workflow for testing
 */
export async function SimpleHIVEWorkflow(
	config: SimpleHIVEConfig,
): Promise<activities.UnifiedPhaseOutput> {
	const result = await langGraphActivity({
		phase: 'H',
		task: config.task,
		context: [],
		cycle: 1,
		port: config.port,
	});

	return result;
}
