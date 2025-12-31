/**
 * HIVE/8 Enforcement Module
 * 
 * Exports all enforcement tools for sequential HIVE workflow.
 * 
 * @module enforcement
 */

export {
  HIVEValidator,
  getHIVEValidator,
  resetHIVEValidator,
  HIVEPhaseSchema,
  SignalSchema,
  TransitionResultSchema,
  ALLOWED_TRANSITIONS,
  VIOLATION_MESSAGES,
  PHASE_PORT_MAP,
  isPortValidForPhase,
  getRecommendedPort,
  type HIVEPhase,
  type Signal,
  type TransitionResult,
} from './hive-validator.js';

export {
  safeEmitSignal,
  createSignal,
  emit,
  getPhaseStatus,
  loadBlackboardSignals,
  logToQuarantine,
  logToAudit,
  type EmitResult,
} from './safe-emit.js';
