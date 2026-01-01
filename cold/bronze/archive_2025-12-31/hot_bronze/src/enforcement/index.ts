/**
 * HIVE/8 Enforcement Module
 *
 * Exports all enforcement tools for sequential HIVE workflow.
 *
 * @module enforcement
 */

export {
	ALLOWED_TRANSITIONS,
	HIVEPhaseSchema,
	HIVEValidator,
	PHASE_PORT_MAP,
	SignalSchema,
	TransitionResultSchema,
	VIOLATION_MESSAGES,
	getHIVEValidator,
	getRecommendedPort,
	isPortValidForPhase,
	resetHIVEValidator,
	type HIVEPhase,
	type Signal,
	type TransitionResult,
} from './hive-validator.js';

export {
	createSignal,
	emit,
	getPhaseStatus,
	loadBlackboardSignals,
	logToAudit,
	logToQuarantine,
	safeEmitSignal,
	type EmitResult,
} from './safe-emit.js';
