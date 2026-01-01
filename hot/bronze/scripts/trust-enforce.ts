#!/usr/bin/env tsx
/**
 * Trust Enforcement Script
 *
 * Checks if a tool call is allowed based on current trust score.
 * Exit code 0 = allowed, exit code 1 = blocked
 *
 * Usage:
 *   npm run trust:enforce -- create_file
 *   npm run trust:enforce -- read_file
 *   npm run trust:enforce -- run_in_terminal
 *
 * Or directly:
 *   tsx scripts/trust-enforce.ts create_file
 */

import { enforceToolAccess, calculateTrustFromBlackboard, getTrustLevel } from '../src/reputation/trust-score.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const BLACKBOARD_PATHS = [
  'sandbox/obsidianblackboard.jsonl',
  'obsidianblackboard.jsonl',
  '../hfo_kiro_gen85/obsidianblackboard.jsonl',
];

function findBlackboard(): string | null {
  for (const p of BLACKBOARD_PATHS) {
    if (existsSync(p)) return p;
  }
  return null;
}

function main() {
  const args = process.argv.slice(2);

  // Find blackboard
  const blackboardPath = findBlackboard();

  if (!blackboardPath) {
    console.log('⚠️  No blackboard found. Trust defaults to 0.5 (initial)');
    console.log('   Searched:', BLACKBOARD_PATHS.join(', '));
    console.log('');
  }

  // If no tool specified, just show status
  if (args.length === 0 || args[0] === '--status') {
    const trust = blackboardPath
      ? calculateTrustFromBlackboard(blackboardPath)
      : 0.5;
    const level = getTrustLevel(trust);

    console.log('╔══════════════════════════════════════╗');
    console.log('║      AI TRUST SCORE STATUS           ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  Score:   ${(trust * 100).toFixed(1).padStart(5)}%                    ║`);
    console.log(`║  Level:   ${level.padEnd(12)}               ║`);
    console.log('╠══════════════════════════════════════╣');

    if (level === 'full') {
      console.log('║  🟢 FULL ACCESS                      ║');
      console.log('║  All tools available                 ║');
    } else if (level === 'read-only') {
      console.log('║  🟡 READ-ONLY MODE                   ║');
      console.log('║  Write tools blocked                 ║');
    } else {
      console.log('║  🔴 QUARANTINE                       ║');
      console.log('║  ALL tools blocked                   ║');
    }

    console.log('╚══════════════════════════════════════╝');

    process.exit(level === 'quarantine' ? 1 : 0);
  }

  // Check specific tool
  const tool = args[0];
  const effectiveBlackboardPath = blackboardPath || 'nonexistent.jsonl';
  const result = enforceToolAccess(tool, effectiveBlackboardPath);

  console.log('');
  console.log(`Tool: ${tool}`);
  console.log(`Trust: ${(result.trustScore * 100).toFixed(1)}%`);
  console.log(`Level: ${result.trustLevel}`);
  console.log('');

  if (result.allowed) {
    console.log(`✅ ALLOWED: ${tool}`);
    process.exit(0);
  } else {
    console.log(`❌ BLOCKED: ${tool}`);
    console.log(`   Reason: ${result.reason}`);
    console.log('');
    console.log('Available tools at this trust level:');
    if (result.availableTools.length === 0) {
      console.log('   (none - quarantine mode)');
    } else {
      result.availableTools.forEach(t => console.log(`   - ${t}`));
    }
    process.exit(1);
  }
}

main();
