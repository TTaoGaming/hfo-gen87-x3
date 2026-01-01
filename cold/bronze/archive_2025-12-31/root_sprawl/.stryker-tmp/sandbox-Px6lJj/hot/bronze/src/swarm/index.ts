/**
 * Swarm Utilities
 *
 * Gen87.X3 | Easy-to-use wrappers for AI orchestration
 *
 * This module exposes orchestration tools to the swarm for easy use:
 * - Memory Bank queries (FTS search)
 * - LLM completions (OpenRouter)
 * - HIVE/8 cycle execution (LangGraph)
 * - Stigmergy signals (blackboard)
 */
// @ts-nocheck


export {
	createHIVEGraph,
	HIVEStateAnnotation,
	runHIVECycle,
} from '../../src/orchestration/langgraph.hive.js';
export {
	generateCompletion,
	MODELS,
	PORT_MODELS,
	testOpenRouterConnection,
} from '../../src/orchestration/openrouter.config.js';

// Re-export types
export type { HIVEState } from '../../src/orchestration/langgraph.hive.js';
export type { CompletionOptions } from '../../src/orchestration/openrouter.config.js';

/**
 * Quick helpers for common swarm operations
 */

import { appendFileSync } from 'node:fs';
import { runHIVECycle } from '../../src/orchestration/langgraph.hive.js';
import { generateCompletion } from '../../src/orchestration/openrouter.config.js';

// ============================================================================
// STIGMERGY: Emit signals to blackboard
// ============================================================================

export interface Signal {
	ts: string;
	mark: number;
	pull: 'upstream' | 'downstream' | 'lateral';
	msg: string;
	type: 'signal' | 'event' | 'error' | 'metric' | 'handoff';
	hive: 'H' | 'I' | 'V' | 'E' | 'X';
	gen: number;
	port: number;
}

export function createSignal(
	msg: string,
	options: {
		hive?: Signal['hive'];
		port?: number;
		type?: Signal['type'];
		mark?: number;
		pull?: Signal['pull'];
	} = {},
): Signal {
	return {
		ts: new Date().toISOString(),
		mark: options.mark ?? 1.0,
		pull: options.pull ?? 'downstream',
		msg,
		type: options.type ?? 'signal',
		hive: options.hive ?? 'H',
		gen: 87,
		port: options.port ?? 7,
	};
}

export function emitSignal(
	signal: Signal,
	blackboardPath = 'sandbox/obsidianblackboard.jsonl',
): void {
	appendFileSync(blackboardPath, JSON.stringify(signal) + '\n');
}

export function emitHuntSignal(msg: string, port = 0): void {
	emitSignal(createSignal(msg, { hive: 'H', port, type: 'signal' }));
}

export function emitInterlockSignal(msg: string, port = 1): void {
	emitSignal(createSignal(msg, { hive: 'I', port, type: 'signal' }));
}

export function emitValidateSignal(msg: string, port = 2): void {
	emitSignal(createSignal(msg, { hive: 'V', port, type: 'event' }));
}

export function emitEvolveSignal(msg: string, port = 3): void {
	emitSignal(createSignal(msg, { hive: 'E', port, type: 'event' }));
}

// ============================================================================
// QUICK OPERATIONS
// ============================================================================

/**
 * Quick LLM completion with HIVE/8 port context
 */
export async function askLLM(prompt: string, port = 7): Promise<string> {
	return generateCompletion(prompt, { port });
}

/**
 * Quick HIVE/8 cycle for a task
 */
export async function runTask(task: string): Promise<{
	huntResults: string[];
	interlockResults: string[];
	validateResults: string[];
	evolveResults: string[];
	output: string;
}> {
	return runHIVECycle(task);
}

// ============================================================================
// SMOKE TEST
// ============================================================================

export async function smokeTestSwarm(): Promise<{
	openrouter: boolean;
	langgraph: boolean;
	blackboard: boolean;
}> {
	const results = {
		openrouter: false,
		langgraph: false,
		blackboard: false,
	};

	// Test OpenRouter
	try {
		const response = await generateCompletion('Say "smoke test passed" in exactly 3 words.', {
			maxTokens: 20,
		});
		results.openrouter =
			response.toLowerCase().includes('smoke') || response.toLowerCase().includes('passed');
		console.log('✅ OpenRouter:', response.trim().substring(0, 50));
	} catch (e) {
		console.error('❌ OpenRouter failed:', e);
	}

	// Test LangGraph
	try {
		const hiveResult = await runHIVECycle('Test HIVE/8 smoke test - verify all phases execute');
		results.langgraph =
			hiveResult.huntResults.length > 0 &&
			hiveResult.interlockResults.length > 0 &&
			hiveResult.validateResults.length > 0 &&
			hiveResult.evolveResults.length > 0;
		console.log(
			'✅ LangGraph HIVE/8 completed:',
			results.langgraph ? 'All phases passed' : 'Some phases failed',
		);
	} catch (e) {
		console.error('❌ LangGraph failed:', e);
	}

	// Test blackboard
	try {
		emitSignal(
			createSignal('SMOKE_TEST: Swarm orchestration verified', {
				hive: 'V',
				port: 5,
				type: 'event',
			}),
		);
		results.blackboard = true;
		console.log('✅ Blackboard: Signal emitted');
	} catch (e) {
		console.error('❌ Blackboard failed:', e);
	}

	return results;
}

// ============================================================================
// HANDOFF: Formal agent handoff via blackboard
// ============================================================================

export interface HandoffContext {
	sessionId?: string;
	phase: 'H' | 'I' | 'V' | 'E';
	nextPhase: 'H' | 'I' | 'V' | 'E';
	completedTasks: string[];
	pendingTasks: string[];
	blockers?: string[];
	artifacts?: string[];
	mission?: string;
	keyDocs?: string[];
	testStatus?: string;
}

export interface HandoffSignal extends Signal {
	type: 'handoff';
	hive: 'X';
	handoff: {
		sessionId: string;
		phase: 'H' | 'I' | 'V' | 'E';
		nextPhase: 'H' | 'I' | 'V' | 'E';
		completedTasks: string[];
		pendingTasks: string[];
		blockers: string[];
		artifacts: string[];
		context: {
			mission: string;
			keyDocs: string[];
			testStatus: string;
		};
	};
}

/**
 * Emit a formal handoff signal for agent transition
 */
export function emitHandoff(
	context: HandoffContext,
	blackboardPath = 'sandbox/obsidianblackboard.jsonl',
): HandoffSignal {
	const signal: HandoffSignal = {
		ts: new Date().toISOString(),
		mark: context.blockers?.length ? 0.5 : 1.0,
		pull: 'downstream',
		msg: `HANDOFF: ${context.phase}→${context.nextPhase} - ${context.completedTasks.length} tasks done, ${context.pendingTasks.length} pending`,
		type: 'handoff',
		hive: 'X',
		gen: 87,
		port: 7,
		handoff: {
			sessionId: context.sessionId ?? `gen87-x3-${new Date().toISOString().split('T')[0]}`,
			phase: context.phase,
			nextPhase: context.nextPhase,
			completedTasks: context.completedTasks,
			pendingTasks: context.pendingTasks,
			blockers: context.blockers ?? [],
			artifacts: context.artifacts ?? [],
			context: {
				mission: context.mission ?? 'W3C Gesture Control Plane',
				keyDocs: context.keyDocs ?? ['sandbox/llms.txt', 'AGENTS.md'],
				testStatus: context.testStatus ?? 'Unknown',
			},
		},
	};

	appendFileSync(blackboardPath, JSON.stringify(signal) + '\n');
	return signal;
}

/**
 * Read the last handoff from blackboard
 */
export function readLastHandoff(
	blackboardPath = 'sandbox/obsidianblackboard.jsonl',
): HandoffSignal | null {
	const { readFileSync } = require('fs');
	try {
		const content = readFileSync(blackboardPath, 'utf-8');
		const lines = content.split('\n').filter(Boolean);
		const handoffs = lines
			.map((line: string) => JSON.parse(line))
			.filter((signal: Signal) => signal.type === 'handoff');
		return handoffs.length > 0 ? handoffs[handoffs.length - 1] : null;
	} catch {
		return null;
	}
}
