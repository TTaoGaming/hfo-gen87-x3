/**
 * @fileoverview HIVE/8 CDD Bridge - Connects Temporal, LangGraph, CrewAI, MCP
 *
 * This bridge ensures ALL components validate through the same G0-G7 hard gates.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                     HIVE/8 CDD INTEGRATION LAYER                       │
 * │                                                                         │
 * │   ┌─────────┐    ┌───────────┐    ┌─────────┐    ┌───────────┐        │
 * │   │ Temporal│───▶│ CDD Bridge│◀───│LangGraph│───▶│   MCP     │        │
 * │   │Workflows│    │  (G0-G7)  │    │ Agents  │    │ Servers   │        │
 * │   └─────────┘    └─────┬─────┘    └─────────┘    └───────────┘        │
 * │                        │                                               │
 * │                  ┌─────▼─────┐                                         │
 * │                  │ Blackboard│                                         │
 * │                  │  (JSONL)  │                                         │
 * │                  └───────────┘                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * @module contracts/hive-cdd-bridge
 * @hive I (Interlock) - Integration layer
 */
// @ts-nocheck


import * as fs from 'fs';
import * as path from 'path';

import {
	HIVE_PHASES,
	type HivePhase,
	type StigmergySignal,
	StigmergySignalSchema,
	type ValidationResult,
	createSignal,
	validateSignal,
	validateTransition,
} from './hive-cdd.contract.js';

// =============================================================================
// BLACKBOARD PATH RESOLUTION
// =============================================================================

const findBlackboardPath = (): string => {
	const candidates = [
		path.resolve(process.cwd(), 'obsidianblackboard.jsonl'),
		path.resolve(process.cwd(), '..', '..', 'obsidianblackboard.jsonl'),
		path.resolve(process.cwd(), 'hot', 'blackboard.jsonl'),
		path.resolve(__dirname, '..', '..', '..', 'obsidianblackboard.jsonl'),
	];

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	// Default to workspace root
	return candidates[0];
};

// =============================================================================
// HIVE PHASE TRACKER (State Machine)
// =============================================================================

export class HivePhaseTracker {
	private currentPhase: HivePhase | null = null;
	private cycleCount = 0;
	private phaseHistory: Array<{ phase: HivePhase; timestamp: string }> = [];

	constructor(initialPhase?: HivePhase) {
		if (initialPhase) {
			this.currentPhase = initialPhase;
		}
	}

	/**
	 * Attempt to transition to a new phase
	 * @throws Error if transition is invalid
	 */
	transition(toPhase: HivePhase): { valid: boolean; reason: string } {
		const result = validateTransition(this.currentPhase, toPhase);

		if (!result.valid) {
			return {
				valid: false,
				reason: result.reason || `Invalid transition: ${this.currentPhase} → ${toPhase}`,
			};
		}

		// Track N+1 cycle on E→H transition
		if (this.currentPhase === 'E' && toPhase === 'H') {
			this.cycleCount++;
		}

		this.currentPhase = toPhase;
		this.phaseHistory.push({ phase: toPhase, timestamp: new Date().toISOString() });

		return { valid: true, reason: result.reason || 'OK' };
	}

	getCurrentPhase(): HivePhase | null {
		return this.currentPhase;
	}

	getCycleCount(): number {
		return this.cycleCount;
	}

	getPhaseHistory(): Array<{ phase: HivePhase; timestamp: string }> {
		return [...this.phaseHistory];
	}

	/**
	 * Get the port(s) associated with current phase
	 */
	getActivePorts(): number[] {
		if (!this.currentPhase || this.currentPhase === 'X') {
			return [];
		}

		// HIVE/8 anti-diagonal pairs
		const phaseToPort: Record<string, number[]> = {
			H: [0, 7], // Hunt - Lidless + Spider
			I: [1, 6], // Interlock - Weaver + Kraken
			V: [2, 5], // Validate - Magus + Pyre
			E: [3, 4], // Evolve - Storm + Regnant
		};

		return phaseToPort[this.currentPhase] || [];
	}
}

// =============================================================================
// BLACKBOARD EMIT (Stigmergy)
// =============================================================================

export interface EmitOptions {
	validate?: boolean;
	toConsole?: boolean;
}

/**
 * Emit a validated signal to the blackboard
 */
export function emitToBlackboard(
	signal: StigmergySignal,
	options: EmitOptions = {},
): ValidationResult {
	const { validate = true, toConsole = false } = options;

	// Validate through G0-G7
	if (validate) {
		const result = validateSignal(signal);
		if (!result.valid) {
			console.error('❌ Signal validation failed:', result.errors);
			return result;
		}
	}

	// Serialize
	const jsonLine = JSON.stringify(signal);

	// Write to blackboard
	const blackboardPath = findBlackboardPath();
	fs.appendFileSync(blackboardPath, jsonLine + '\n');

	if (toConsole) {
		console.log(`📡 [${signal.hive}] Port ${signal.port}: ${signal.msg}`);
	}

	return { valid: true, errors: [], signal };
}

/**
 * Read recent signals from blackboard
 */
export function readBlackboard(limit = 10): StigmergySignal[] {
	const blackboardPath = findBlackboardPath();

	if (!fs.existsSync(blackboardPath)) {
		return [];
	}

	const content = fs.readFileSync(blackboardPath, 'utf-8');
	const lines = content.trim().split('\n').filter(Boolean);

	const signals: StigmergySignal[] = [];
	const startIdx = Math.max(0, lines.length - limit);

	for (let i = startIdx; i < lines.length; i++) {
		try {
			const parsed = JSON.parse(lines[i]);
			const result = StigmergySignalSchema.safeParse(parsed);
			if (result.success) {
				signals.push(result.data);
			}
		} catch {
			// Skip invalid lines
		}
	}

	return signals;
}

/**
 * Get the last phase from blackboard
 */
export function getLastPhase(): HivePhase | null {
	const signals = readBlackboard(20);

	for (let i = signals.length - 1; i >= 0; i--) {
		const phase = signals[i].hive;
		if (HIVE_PHASES.includes(phase as HivePhase) && phase !== 'X') {
			return phase as HivePhase;
		}
	}

	return null;
}

// =============================================================================
// TEMPORAL WORKFLOW BRIDGE
// =============================================================================

/**
 * Create a HIVE phase signal for Temporal workflow
 */
export function createTemporalSignal(
	phase: HivePhase,
	message: string,
	workflowId?: string,
): StigmergySignal {
	const port = phase === 'H' ? 0 : phase === 'I' ? 1 : phase === 'V' ? 2 : 3;

	return createSignal(
		workflowId ? `[Temporal:${workflowId}] ${message}` : message,
		port,
		phase,
		'signal',
	);
}

/**
 * Emit a Temporal workflow phase event
 */
export function emitTemporalPhase(
	phase: HivePhase,
	message: string,
	workflowId?: string,
): ValidationResult {
	const signal = createTemporalSignal(phase, message, workflowId);
	return emitToBlackboard(signal, { toConsole: true });
}

// =============================================================================
// LANGGRAPH BRIDGE
// =============================================================================

/**
 * Create a signal for LangGraph agent output
 */
export function createLangGraphSignal(
	phase: HivePhase,
	agentOutput: string,
	graphId?: string,
): StigmergySignal {
	const port = phase === 'H' ? 7 : phase === 'I' ? 6 : phase === 'V' ? 5 : 4;

	return createSignal(
		graphId ? `[LangGraph:${graphId}] ${agentOutput.slice(0, 200)}` : agentOutput.slice(0, 200),
		port,
		phase,
		'event',
	);
}

/**
 * Emit a LangGraph agent completion event
 */
export function emitLangGraphPhase(
	phase: HivePhase,
	agentOutput: string,
	graphId?: string,
): ValidationResult {
	const signal = createLangGraphSignal(phase, agentOutput, graphId);
	return emitToBlackboard(signal, { toConsole: true });
}

// =============================================================================
// MCP SERVER BRIDGE
// =============================================================================

/**
 * Create a signal for MCP tool invocation
 */
export function createMCPSignal(
	toolName: string,
	port: number,
	result: string,
	phase?: HivePhase,
): StigmergySignal {
	// Infer phase from port if not provided
	const inferredPhase =
		phase ||
		(port <= 1 || port === 7
			? 'H'
			: port <= 2 || port === 6
				? 'I'
				: port <= 3 || port === 5
					? 'V'
					: 'E');

	return createSignal(`[MCP:${toolName}] ${result.slice(0, 150)}`, port, inferredPhase, 'event');
}

/**
 * Emit an MCP tool result
 */
export function emitMCPResult(
	toolName: string,
	port: number,
	result: string,
	phase?: HivePhase,
): ValidationResult {
	const signal = createMCPSignal(toolName, port, result, phase);
	return emitToBlackboard(signal, { toConsole: true });
}

// =============================================================================
// PYTHON INTEROP (for CrewAI)
// =============================================================================

/**
 * Format signal for Python consumption
 */
export function toPythonDict(signal: StigmergySignal): string {
	return JSON.stringify({
		ts: signal.ts,
		mark: signal.mark,
		pull: signal.pull,
		msg: signal.msg,
		type: signal.type,
		hive: signal.hive,
		gen: signal.gen,
		port: signal.port,
	});
}

/**
 * Parse Python signal output
 */
export function fromPythonDict(pythonOutput: string): ValidationResult {
	try {
		const parsed = JSON.parse(pythonOutput);
		return validateSignal(parsed);
	} catch (e) {
		return { valid: false, errors: [`Failed to parse Python output: ${e}`] };
	}
}

// =============================================================================
// ORCHESTRATION HELPERS
// =============================================================================

/**
 * Run a complete HIVE cycle with validation at each phase
 */
export async function executeHiveCycle<T>(
	task: string,
	handlers: {
		hunt: () => Promise<T>;
		interlock: (huntResult: T) => Promise<T>;
		validate: (interlockResult: T) => Promise<T>;
		evolve: (validateResult: T) => Promise<T>;
	},
): Promise<{ success: boolean; result?: T; error?: string }> {
	const tracker = new HivePhaseTracker();

	try {
		// H - Hunt
		let transition = tracker.transition('H');
		if (!transition.valid) {
			return { success: false, error: `Hunt transition failed: ${transition.reason}` };
		}
		emitToBlackboard(createSignal(`HUNT START: ${task}`, 0, 'H'), { toConsole: true });
		const huntResult = await handlers.hunt();
		emitToBlackboard(createSignal('HUNT COMPLETE', 0, 'H', 'event'), { toConsole: true });

		// I - Interlock
		transition = tracker.transition('I');
		if (!transition.valid) {
			return { success: false, error: `Interlock transition failed: ${transition.reason}` };
		}
		emitToBlackboard(createSignal(`INTERLOCK START: ${task}`, 1, 'I'), { toConsole: true });
		const interlockResult = await handlers.interlock(huntResult);
		emitToBlackboard(createSignal('INTERLOCK COMPLETE', 1, 'I', 'event'), { toConsole: true });

		// V - Validate
		transition = tracker.transition('V');
		if (!transition.valid) {
			return { success: false, error: `Validate transition failed: ${transition.reason}` };
		}
		emitToBlackboard(createSignal(`VALIDATE START: ${task}`, 2, 'V'), { toConsole: true });
		const validateResult = await handlers.validate(interlockResult);
		emitToBlackboard(createSignal('VALIDATE COMPLETE', 2, 'V', 'event'), { toConsole: true });

		// E - Evolve
		transition = tracker.transition('E');
		if (!transition.valid) {
			return { success: false, error: `Evolve transition failed: ${transition.reason}` };
		}
		emitToBlackboard(createSignal(`EVOLVE START: ${task}`, 3, 'E'), { toConsole: true });
		const evolveResult = await handlers.evolve(validateResult);
		emitToBlackboard(createSignal('EVOLVE COMPLETE - CYCLE DONE', 3, 'E', 'event'), {
			toConsole: true,
		});

		return { success: true, result: evolveResult };
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		emitToBlackboard(createSignal(`CYCLE ERROR: ${errorMsg}`, 5, 'X', 'error'), {
			toConsole: true,
		});
		return { success: false, error: errorMsg };
	}
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
	COMMANDERS,
	CURRENT_GEN,
	HIVE_PHASES,
	StigmergySignalSchema,
	createSignal,
	validateSignal,
	validateTransition,
	type HivePhase,
	type StigmergySignal,
	type ValidationResult,
} from './hive-cdd.contract.js';

export default {
	HivePhaseTracker,
	emitToBlackboard,
	readBlackboard,
	getLastPhase,
	createTemporalSignal,
	emitTemporalPhase,
	createLangGraphSignal,
	emitLangGraphPhase,
	createMCPSignal,
	emitMCPResult,
	executeHiveCycle,
	toPythonDict,
	fromPythonDict,
};
