/**
 * V-Phase Gate - HARD ENFORCEMENT against reward hacking
 * 
 * Gen87.X3 | Port 5 (Pyre Praetorian) | DEFEND
 * 
 * This gate BLOCKS commits that contain:
 * 1. Demos that bypass architecture (inline implementations)
 * 2. "Green but meaningless" - tests that pass by throwing
 * 3. TODO stubs in non-test files (reward hacking)
 * 4. Theater code (imports adapter but doesn't use it)
 * 
 * PRINCIPLE: A demo that doesn't use the architecture is NOT a demo.
 *            It's a spike that proves nothing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TYPES
// ============================================================================

interface Violation {
  file: string;
  line: number;
  rule: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
  evidence: string;
}

interface GateResult {
  passed: boolean;
  violations: Violation[];
  summary: string;
}

// ============================================================================
// REWARD HACKING PATTERNS
// ============================================================================

const REWARD_HACK_PATTERNS = {
  // Pattern 1: Inline FSM instead of XState
  inlineFSM: {
    rule: 'NO_INLINE_FSM',
    severity: 'CRITICAL' as const,
    pattern: /if\s*\(\s*(?:gesture|state)\s*===?\s*['"`](?:DISARMED|ARMING|ARMED|ACTIVE)['"`]/gi,
    antiPattern: /import.*(?:xstate|createMachine|setup)/i,
    message: 'Inline FSM detected. MUST use XState adapter.',
    appliesTo: ['.html', '.tsx', '.jsx'],
  },

  // Pattern 2: Inline 1€ filter instead of adapter
  inlineOneEuro: {
    rule: 'NO_INLINE_FILTER',
    severity: 'CRITICAL' as const,
    pattern: /function\s+oneEuro|const\s+oneEuro|let\s+oneEuro|class\s+.*(?:LowPass|OneEuro)/gi,
    antiPattern: /import.*(?:OneEuroAdapter|one-euro\.adapter)/i,
    message: 'Inline 1€ filter detected. MUST use OneEuroAdapter.',
    appliesTo: ['.html', '.tsx', '.jsx'],
  },

  // Pattern 3: Direct DOM events instead of NATS
  directDOM: {
    rule: 'NO_DIRECT_DOM_EVENTS',
    severity: 'HIGH' as const,
    pattern: /dispatchEvent\s*\(\s*new\s+(?:Pointer|Mouse|Custom)Event/gi,
    antiPattern: /import.*(?:NatsSubstrate|nats-substrate)/i,
    message: 'Direct DOM event dispatch. MUST route through NATS substrate.',
    appliesTo: ['.html', '.tsx', '.jsx'],
  },

  // Pattern 4: TODO in non-test production code
  todoInProd: {
    rule: 'NO_TODO_IN_PROD',
    severity: 'CRITICAL' as const,
    pattern: /\/\/\s*TODO:?\s*(?:Wire|Implement|For now|pass.?through)/gi,
    antiPattern: null,
    message: 'TODO stub in production code. This is reward hacking.',
    appliesTo: ['.ts', '.tsx', '.js', '.jsx'],
    excludes: ['.test.ts', '.test.tsx', '.spec.ts'],
  },

  // Pattern 5: "For now" shortcuts
  forNowShortcut: {
    rule: 'NO_FOR_NOW',
    severity: 'HIGH' as const,
    pattern: /\/\/\s*For now[,:]?\s*/gi,
    antiPattern: null,
    message: '"For now" shortcut detected. This bypasses architecture.',
    appliesTo: ['.ts', '.tsx', '.js', '.jsx', '.html'],
    excludes: ['.test.ts', '.test.tsx', '.spec.ts'],
  },

  // Pattern 6: Passthrough implementations
  passthrough: {
    rule: 'NO_PASSTHROUGH',
    severity: 'HIGH' as const,
    pattern: /pass.?through|PassthroughAdapter|return\s+input|return\s+data/gi,
    antiPattern: null,
    message: 'Passthrough implementation. MUST have real logic.',
    appliesTo: ['.ts', '.tsx'],
    excludes: ['.test.ts', '.test.tsx', '.spec.ts', 'smoother-chain.ts'],
  },

  // Pattern 7: Empty/trivial implementations
  emptyImpl: {
    rule: 'NO_EMPTY_IMPL',
    severity: 'CRITICAL' as const,
    pattern: /{\s*return\s+(?:null|undefined|{}|\[\]|true|false|0|''|"");\s*}/gi,
    antiPattern: null,
    message: 'Empty/trivial implementation. This is reward hacking.',
    appliesTo: ['.ts', '.tsx'],
    excludes: ['.test.ts', '.test.tsx', '.spec.ts'],
  },
};

// ============================================================================
// ARCHITECTURE REQUIREMENTS
// ============================================================================

const DEMO_REQUIREMENTS = {
  // Demos MUST import these (or they're spikes, not demos)
  requiredImports: [
    { pattern: /golden-layout/i, name: 'Golden Layout' },
    { pattern: /@mediapipe\/tasks-vision/i, name: 'MediaPipe' },
  ],
  
  // Demos SHOULD import these (architecture compliance)
  recommendedImports: [
    { pattern: /xstate|createMachine/i, name: 'XState' },
    { pattern: /OneEuroAdapter|one-euro\.adapter/i, name: '1€ Adapter' },
    { pattern: /NatsSubstrate|nats-substrate/i, name: 'NATS Substrate' },
  ],

  // Demos MUST NOT have these (anti-patterns)
  forbidden: [
    { pattern: /function\s+oneEuroFilter\s*\(/i, name: 'Inline 1€ filter function' },
    { pattern: /let\s+state\s*=\s*['"`]DISARMED['"`]/i, name: 'Inline state variable' },
    { pattern: /if.*===.*ARMED.*if.*===.*ACTIVE/is, name: 'Inline FSM logic' },
  ],
};

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

function checkFile(filePath: string, content: string): Violation[] {
  const violations: Violation[] = [];
  const ext = path.extname(filePath);
  const lines = content.split('\n');

  // Check each reward hack pattern
  for (const [name, config] of Object.entries(REWARD_HACK_PATTERNS)) {
    // Skip if file type doesn't match
    if (!config.appliesTo.some(e => filePath.endsWith(e))) continue;
    
    // Skip if file is excluded
    if (config.excludes?.some(e => filePath.includes(e))) continue;

    // Check for pattern
    const matches = content.matchAll(config.pattern);
    for (const match of matches) {
      // If there's an anti-pattern that would make this OK, check for it
      if (config.antiPattern && config.antiPattern.test(content)) {
        continue; // Has the anti-pattern, so this is OK
      }

      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNum = (beforeMatch.match(/\n/g) || []).length + 1;

      violations.push({
        file: filePath,
        line: lineNum,
        rule: config.rule,
        severity: config.severity,
        message: config.message,
        evidence: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
      });
    }
  }

  // Check demo-specific requirements for HTML files
  if (filePath.includes('demo') && filePath.endsWith('.html')) {
    // Check for forbidden patterns
    for (const forbidden of DEMO_REQUIREMENTS.forbidden) {
      if (forbidden.pattern.test(content)) {
        const match = content.match(forbidden.pattern);
        const beforeMatch = content.substring(0, match?.index || 0);
        const lineNum = (beforeMatch.match(/\n/g) || []).length + 1;

        violations.push({
          file: filePath,
          line: lineNum,
          rule: 'DEMO_FORBIDDEN',
          severity: 'CRITICAL',
          message: `Demo contains forbidden pattern: ${forbidden.name}`,
          evidence: match?.[0].substring(0, 60) || '',
        });
      }
    }

    // Check that demos have required imports
    for (const req of DEMO_REQUIREMENTS.requiredImports) {
      if (!req.pattern.test(content)) {
        violations.push({
          file: filePath,
          line: 0,
          rule: 'DEMO_MISSING_IMPORT',
          severity: 'CRITICAL',
          message: `Demo missing required: ${req.name}`,
          evidence: 'Not found in file',
        });
      }
    }

    // Warn about missing recommended imports
    for (const rec of DEMO_REQUIREMENTS.recommendedImports) {
      if (!rec.pattern.test(content)) {
        violations.push({
          file: filePath,
          line: 0,
          rule: 'DEMO_MISSING_RECOMMENDED',
          severity: 'MEDIUM',
          message: `Demo should use: ${rec.name} (architecture compliance)`,
          evidence: 'Not found in file',
        });
      }
    }
  }

  return violations;
}

function validateFiles(files: string[]): GateResult {
  const allViolations: Violation[] = [];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const violations = checkFile(file, content);
      allViolations.push(...violations);
    } catch (err) {
      console.error(`Error reading ${file}:`, err);
    }
  }

  const criticalCount = allViolations.filter(v => v.severity === 'CRITICAL').length;
  const highCount = allViolations.filter(v => v.severity === 'HIGH').length;

  return {
    passed: criticalCount === 0,
    violations: allViolations,
    summary: `${criticalCount} CRITICAL, ${highCount} HIGH, ${allViolations.length} total violations`,
  };
}

// ============================================================================
// OUTPUT
// ============================================================================

function printResult(result: GateResult): void {
  console.log('\n' + '='.repeat(70));
  console.log('V-PHASE GATE: REWARD HACKING DETECTOR');
  console.log('='.repeat(70));
  console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ BLOCKED'}`);
  console.log(`Summary: ${result.summary}`);
  console.log('-'.repeat(70));

  if (result.violations.length === 0) {
    console.log('\n✅ No reward hacking patterns detected.\n');
    return;
  }

  // Group by severity
  const critical = result.violations.filter(v => v.severity === 'CRITICAL');
  const high = result.violations.filter(v => v.severity === 'HIGH');
  const medium = result.violations.filter(v => v.severity === 'MEDIUM');

  if (critical.length > 0) {
    console.log('\n🔴 CRITICAL (Blocks commit):');
    for (const v of critical) {
      console.log(`  ${path.basename(v.file)}:${v.line} [${v.rule}]`);
      console.log(`    ${v.message}`);
      console.log(`    Evidence: "${v.evidence}"`);
    }
  }

  if (high.length > 0) {
    console.log('\n🟡 HIGH (Should fix):');
    for (const v of high) {
      console.log(`  ${path.basename(v.file)}:${v.line} [${v.rule}]`);
      console.log(`    ${v.message}`);
    }
  }

  if (medium.length > 0) {
    console.log('\n⚪ MEDIUM (Recommendations):');
    for (const v of medium) {
      console.log(`  ${path.basename(v.file)}:${v.line} [${v.rule}]`);
      console.log(`    ${v.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  
  if (!result.passed) {
    console.log('\n🚨 COMMIT BLOCKED: Fix CRITICAL violations before committing.');
    console.log('\nA demo that doesn\'t use the architecture is NOT a demo.');
    console.log('It\'s a spike that proves nothing.\n');
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let files: string[] = [];

  if (args[0] === '--staged') {
    // Get staged files from git
    const { execSync } = await import('child_process');
    const staged = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' });
    files = staged.split('\n').filter(f => f.trim()).map(f => path.resolve(f));
  } else if (args[0] === '--all') {
    // Scan all relevant files
    const { execSync } = await import('child_process');
    const allFiles = execSync('git ls-files', { encoding: 'utf-8' });
    files = allFiles.split('\n')
      .filter(f => f.match(/\.(ts|tsx|js|jsx|html)$/))
      .filter(f => !f.includes('node_modules'))
      .map(f => path.resolve(f));
  } else if (args.length > 0) {
    files = args.map(f => path.resolve(f));
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/v-phase-gate.ts --staged    # Check staged files');
    console.log('  npx tsx scripts/v-phase-gate.ts --all       # Check all files');
    console.log('  npx tsx scripts/v-phase-gate.ts <file>      # Check specific file');
    process.exit(0);
  }

  console.log(`Checking ${files.length} files for reward hacking...`);

  const result = validateFiles(files);
  printResult(result);

  process.exit(result.passed ? 0 : 1);
}

main();
