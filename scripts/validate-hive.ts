#!/usr/bin/env npx tsx
/**
 * HIVE/8 Validate Script
 * 
 * Validates the current HIVE phase sequence from the blackboard.
 * Used in pre-commit hooks to enforce sequential workflow.
 * 
 * Usage:
 *   npx tsx scripts/validate-hive.ts
 *   npm run validate:hive
 * 
 * Exit codes:
 *   0 - Valid sequence
 *   1 - Invalid sequence detected
 * 
 * @module scripts/validate-hive
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// =============================================================================
// CONFIGURATION
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SANDBOX_ROOT = path.resolve(__dirname, '..', 'sandbox');
const BLACKBOARD_PATH = path.join(SANDBOX_ROOT, 'obsidianblackboard.jsonl');
const QUARANTINE_PATH = path.join(SANDBOX_ROOT, 'quarantine.jsonl');

type HIVEPhase = 'H' | 'I' | 'V' | 'E' | 'X';

interface Signal {
  ts: string;
  mark: number;
  pull: string;
  msg: string;
  type: string;
  hive: HIVEPhase;
  gen: number;
  port: number;
}

// =============================================================================
// ALLOWED TRANSITIONS
// =============================================================================

const ALLOWED_TRANSITIONS: Record<HIVEPhase, HIVEPhase[]> = {
  H: ['H', 'I', 'X'],
  I: ['I', 'V', 'X'],
  V: ['V', 'E', 'X'],
  E: ['E', 'H', 'X'],
  X: ['H', 'I', 'V', 'E'],
};

const PHASE_NAMES: Record<HIVEPhase, string> = {
  H: 'Hunt (Research)',
  I: 'Interlock (TDD RED)',
  V: 'Validate (TDD GREEN)',
  E: 'Evolve (Refactor)',
  X: 'Handoff (Boundary)',
};

// =============================================================================
// MAIN VALIDATION
// =============================================================================

function loadSignals(filePath: string): Signal[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  const signals: Signal[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.hive && ['H', 'I', 'V', 'E', 'X'].includes(parsed.hive)) {
        signals.push(parsed as Signal);
      }
    } catch {
      // Skip malformed lines
    }
  }
  
  return signals;
}

function validateSequence(signals: Signal[]): {
  valid: boolean;
  violations: Array<{ from: HIVEPhase; to: HIVEPhase; index: number; msg: string }>;
  stats: { byPhase: Record<HIVEPhase, number>; completedCycles: number };
} {
  const violations: Array<{ from: HIVEPhase; to: HIVEPhase; index: number; msg: string }> = [];
  const byPhase: Record<HIVEPhase, number> = { H: 0, I: 0, V: 0, E: 0, X: 0 };
  let completedCycles = 0;
  
  let lastPhase: HIVEPhase | null = null;
  const phaseSequence: HIVEPhase[] = [];

  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i];
    const currentPhase = signal.hive;
    byPhase[currentPhase]++;

    // First signal must be H
    if (lastPhase === null && currentPhase !== 'H' && currentPhase !== 'X') {
      violations.push({
        from: 'H',
        to: currentPhase,
        index: i,
        msg: `First signal must be H (Hunt), got ${currentPhase}`,
      });
    }

    // Check transition validity
    if (lastPhase !== null) {
      const allowed = ALLOWED_TRANSITIONS[lastPhase];
      if (!allowed.includes(currentPhase)) {
        violations.push({
          from: lastPhase,
          to: currentPhase,
          index: i,
          msg: `Invalid transition ${lastPhase} → ${currentPhase}`,
        });
      }
    }

    // Track phase changes for cycle counting
    if (currentPhase !== 'X' && currentPhase !== lastPhase) {
      phaseSequence.push(currentPhase);
      lastPhase = currentPhase;
      
      // Check for completed cycle
      if (phaseSequence.length >= 4) {
        const last4 = phaseSequence.slice(-4);
        if (last4[0] === 'H' && last4[1] === 'I' && last4[2] === 'V' && last4[3] === 'E') {
          completedCycles++;
        }
      }
    } else if (currentPhase !== 'X') {
      lastPhase = currentPhase;
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    stats: { byPhase, completedCycles },
  };
}

function getCurrentPhase(signals: Signal[]): HIVEPhase | null {
  for (let i = signals.length - 1; i >= 0; i--) {
    if (signals[i].hive !== 'X') {
      return signals[i].hive;
    }
  }
  return null;
}

function getQuarantineCount(filePath: string): number {
  if (!fs.existsSync(filePath)) {
    return 0;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.trim().split('\n').filter(Boolean).length;
}

// =============================================================================
// CLI OUTPUT
// =============================================================================

function printReport(
  signals: Signal[],
  validation: ReturnType<typeof validateSequence>,
  quarantineCount: number
): void {
  const currentPhase = getCurrentPhase(signals);
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              HIVE/8 SEQUENCE VALIDATION                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Current status
  console.log('─── Current Status ───');
  console.log(`  Current Phase: ${currentPhase ? `${currentPhase} - ${PHASE_NAMES[currentPhase]}` : 'None (start with H)'}`);
  console.log(`  Total Signals: ${signals.length}`);
  console.log(`  Completed Cycles: ${validation.stats.completedCycles}`);
  console.log(`  Quarantined: ${quarantineCount}`);

  // Phase breakdown
  console.log('\n─── By Phase ───');
  for (const [phase, count] of Object.entries(validation.stats.byPhase)) {
    const bar = '█'.repeat(Math.min(count, 30));
    console.log(`  ${phase} (${PHASE_NAMES[phase as HIVEPhase].padEnd(20)}): ${count.toString().padStart(3)} ${bar}`);
  }

  // Next allowed transitions
  if (currentPhase) {
    const allowed = ALLOWED_TRANSITIONS[currentPhase];
    console.log(`\n─── Next Allowed ───`);
    console.log(`  From ${currentPhase}, you can go to: ${allowed.join(', ')}`);
  }

  // Violations
  if (validation.violations.length > 0) {
    console.log('\n⚠️  ─── VIOLATIONS DETECTED ───');
    for (const v of validation.violations.slice(0, 10)) {
      console.log(`  🔴 [${v.index}] ${v.from} → ${v.to}: ${v.msg}`);
    }
    if (validation.violations.length > 10) {
      console.log(`  ... and ${validation.violations.length - 10} more`);
    }
    console.log('\n❌ HIVE sequence is INVALID');
  } else {
    console.log('\n✅ HIVE sequence is VALID');
  }

  // Recommendations
  console.log('\n─── Workflow Reminder ───');
  console.log('  H (Hunt)     → Research, search, read. NO code.');
  console.log('  I (Interlock)→ TDD RED: Write failing tests.');
  console.log('  V (Validate) → TDD GREEN: Make tests pass.');
  console.log('  E (Evolve)   → Refactor, commit, strange loop → H');
  console.log('');
}

// =============================================================================
// MAIN
// =============================================================================

const signals = loadSignals(BLACKBOARD_PATH);
const validation = validateSequence(signals);
const quarantineCount = getQuarantineCount(QUARANTINE_PATH);

printReport(signals, validation, quarantineCount);

// Exit code for pre-commit
process.exit(validation.valid ? 0 : 1);
