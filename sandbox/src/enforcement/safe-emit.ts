/**
 * Safe Signal Emitter
 * 
 * WRAPPER that enforces HIVE/8 sequence before emitting to blackboard.
 * Out-of-sequence signals are BLOCKED and logged to quarantine.
 * 
 * TRL Lineage: Custom enforcement for HIVE/8 workflow
 * Source: Gen85 pyre_audit.jsonl, quarantine.jsonl patterns
 * 
 * @module enforcement/safe-emit
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  HIVEValidator,
  getHIVEValidator,
  Signal,
  SignalSchema,
  TransitionResult,
} from './hive-validator.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SANDBOX_ROOT = path.resolve(__dirname, '../..');
const BLACKBOARD_PATH = path.join(SANDBOX_ROOT, 'obsidianblackboard.jsonl');
const QUARANTINE_PATH = path.join(SANDBOX_ROOT, 'quarantine.jsonl');
const PYRE_AUDIT_PATH = path.join(SANDBOX_ROOT, 'pyre_audit.jsonl');

// =============================================================================
// BLACKBOARD READER
// =============================================================================

/**
 * Load existing signals from blackboard
 */
export function loadBlackboardSignals(filePath = BLACKBOARD_PATH): Signal[] {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    
    const signals: Signal[] = [];
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const validated = SignalSchema.safeParse(parsed);
        if (validated.success) {
          signals.push(validated.data);
        }
      } catch {
        // Skip malformed lines
      }
    }
    
    return signals;
  } catch (error) {
    console.error('[SafeEmit] Failed to load blackboard:', error);
    return [];
  }
}

// =============================================================================
// QUARANTINE LOGGER
// =============================================================================

interface QuarantineEntry {
  ts: string;
  violation: string;
  from: string;
  to: string;
  reason: string;
  blockedSignal: Signal;
}

/**
 * Log a blocked signal to quarantine
 */
export function logToQuarantine(
  signal: Signal,
  result: TransitionResult,
  filePath = QUARANTINE_PATH
): void {
  const entry: QuarantineEntry = {
    ts: new Date().toISOString(),
    violation: result.violation || 'UNKNOWN',
    from: result.from,
    to: result.to,
    reason: result.reason || 'No reason provided',
    blockedSignal: signal,
  };

  try {
    fs.appendFileSync(filePath, JSON.stringify(entry) + '\n');
    console.warn(`[QUARANTINE] ${result.violation}: ${result.reason}`);
  } catch (error) {
    console.error('[SafeEmit] Failed to write quarantine:', error);
  }
}

// =============================================================================
// PYRE AUDIT LOGGER
// =============================================================================

interface AuditEntry {
  ts: string;
  action: 'ALLOWED' | 'BLOCKED';
  phase: string;
  port: number;
  msg: string;
  cycleStats?: {
    totalSignals: number;
    completedCycles: number;
  };
}

/**
 * Log to Pyre audit trail
 */
export function logToAudit(
  signal: Signal,
  action: 'ALLOWED' | 'BLOCKED',
  validator: HIVEValidator,
  filePath = PYRE_AUDIT_PATH
): void {
  const stats = validator.getCycleStats();
  const entry: AuditEntry = {
    ts: new Date().toISOString(),
    action,
    phase: signal.hive,
    port: signal.port,
    msg: signal.msg.substring(0, 100),
    cycleStats: {
      totalSignals: stats.totalSignals,
      completedCycles: stats.completedCycles,
    },
  };

  try {
    fs.appendFileSync(filePath, JSON.stringify(entry) + '\n');
  } catch (error) {
    console.error('[SafeEmit] Failed to write audit:', error);
  }
}

// =============================================================================
// SAFE EMIT FUNCTION
// =============================================================================

export interface EmitResult {
  success: boolean;
  signal: Signal;
  validation: TransitionResult;
  writtenTo?: string;
  quarantined?: boolean;
}

/**
 * Safely emit a signal with HIVE/8 enforcement
 * 
 * @param signal - The signal to emit
 * @param options - Configuration options
 * @returns EmitResult with success status and details
 */
export async function safeEmitSignal(
  signal: Signal,
  options: {
    blackboardPath?: string;
    quarantinePath?: string;
    auditPath?: string;
    force?: boolean; // Bypass validation (DANGEROUS)
  } = {}
): Promise<EmitResult> {
  const {
    blackboardPath = BLACKBOARD_PATH,
    quarantinePath = QUARANTINE_PATH,
    auditPath = PYRE_AUDIT_PATH,
    force = false,
  } = options;

  // Validate signal schema
  const schemaResult = SignalSchema.safeParse(signal);
  if (!schemaResult.success) {
    console.error('[SafeEmit] Invalid signal schema:', schemaResult.error);
    return {
      success: false,
      signal,
      validation: {
        valid: false,
        from: 'X',
        to: signal.hive,
        reason: `Schema validation failed: ${schemaResult.error.message}`,
        violation: 'UNKNOWN_PHASE',
      },
    };
  }

  // Get validator and load history
  const validator = getHIVEValidator();
  const existingSignals = loadBlackboardSignals(blackboardPath);
  validator.loadHistory(existingSignals);

  // Validate transition
  const validation = validator.canEmitSignal(signal);

  if (!validation.valid && !force) {
    // BLOCKED - Log to quarantine
    logToQuarantine(signal, validation, quarantinePath);
    logToAudit(signal, 'BLOCKED', validator, auditPath);

    return {
      success: false,
      signal,
      validation,
      quarantined: true,
    };
  }

  // ALLOWED - Write to blackboard
  try {
    fs.appendFileSync(blackboardPath, JSON.stringify(signal) + '\n');
    validator.recordSignal(signal);
    logToAudit(signal, 'ALLOWED', validator, auditPath);

    if (force && !validation.valid) {
      console.warn('[SafeEmit] FORCE mode: Signal emitted despite validation failure');
    }

    return {
      success: true,
      signal,
      validation,
      writtenTo: blackboardPath,
    };
  } catch (error) {
    console.error('[SafeEmit] Failed to write signal:', error);
    return {
      success: false,
      signal,
      validation: {
        valid: false,
        from: validation.from,
        to: validation.to,
        reason: `Write failed: ${error}`,
      },
    };
  }
}

// =============================================================================
// CONVENIENCE CREATORS
// =============================================================================

/**
 * Create a properly structured signal
 */
export function createSignal(params: {
  msg: string;
  hive: Signal['hive'];
  port: number;
  type?: Signal['type'];
  gen?: number;
  mark?: number;
  pull?: Signal['pull'];
}): Signal {
  return {
    ts: new Date().toISOString(),
    mark: params.mark ?? 1.0,
    pull: params.pull ?? 'downstream',
    msg: params.msg,
    type: params.type ?? 'signal',
    hive: params.hive,
    gen: params.gen ?? 87,
    port: params.port,
  };
}

/**
 * Quick emit helpers for each phase
 */
export const emit = {
  hunt: (msg: string, port = 0) =>
    safeEmitSignal(createSignal({ msg: `HUNT: ${msg}`, hive: 'H', port })),

  interlock: (msg: string, port = 1) =>
    safeEmitSignal(createSignal({ msg: `INTERLOCK: ${msg}`, hive: 'I', port })),

  validate: (msg: string, port = 2) =>
    safeEmitSignal(createSignal({ msg: `VALIDATE: ${msg}`, hive: 'V', port })),

  evolve: (msg: string, port = 3) =>
    safeEmitSignal(createSignal({ msg: `EVOLVE: ${msg}`, hive: 'E', port })),

  handoff: (msg: string, port = 7) =>
    safeEmitSignal(createSignal({ msg: `HANDOFF: ${msg}`, hive: 'X', port, type: 'handoff' })),
};

// =============================================================================
// CLI INTERFACE
// =============================================================================

/**
 * Get current HIVE phase status
 */
export function getPhaseStatus(blackboardPath = BLACKBOARD_PATH): {
  currentPhase: string | null;
  totalSignals: number;
  byPhase: Record<string, number>;
  completedCycles: number;
  lastSignal: Signal | null;
} {
  const validator = getHIVEValidator();
  const signals = loadBlackboardSignals(blackboardPath);
  validator.loadHistory(signals);

  const stats = validator.getCycleStats();
  const lastSignals = validator.getLastNSignals(1);

  return {
    currentPhase: stats.currentPhase,
    totalSignals: stats.totalSignals,
    byPhase: stats.byPhase,
    completedCycles: stats.completedCycles,
    lastSignal: lastSignals[0] || null,
  };
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const status = getPhaseStatus();
  console.log('\n🐝 HIVE/8 Phase Status');
  console.log('═'.repeat(40));
  console.log(`Current Phase: ${status.currentPhase || 'None (start with H)'}`);
  console.log(`Total Signals: ${status.totalSignals}`);
  console.log(`Completed Cycles: ${status.completedCycles}`);
  console.log('\nBy Phase:');
  for (const [phase, count] of Object.entries(status.byPhase)) {
    console.log(`  ${phase}: ${count}`);
  }
  if (status.lastSignal) {
    console.log(`\nLast Signal: [${status.lastSignal.hive}] ${status.lastSignal.msg.substring(0, 60)}...`);
  }
}
