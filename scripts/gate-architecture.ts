#!/usr/bin/env tsx
/**
 * G-ARCH: Architecture Compliance Gate
 * 
 * CRITICAL enforcement gate that blocks commits with architectural violations:
 * 1. Inline adapter classes in demos (must import from sandbox/src/adapters/)
 * 2. Hand-rolled FSM (must use XState adapter)
 * 3. Inline filter implementations (must use adapter pattern)
 * 
 * Gen87.X3 | Port 5 (Pyre Praetorian) | DEFEND
 * 
 * Exit codes:
 *   0 - No violations (pass)
 *   1 - Violations found (blocks commit)
 * 
 * Usage:
 *   npm run gate:arch
 *   tsx scripts/gate-architecture.ts
 *   tsx scripts/gate-architecture.ts --json
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
  filesScanned: number;
  summary: string;
}

interface ArchRule {
  name: string;
  pattern: RegExp;
  antiPattern?: RegExp; // If present, skip if matched
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
  appliesTo: string[]; // File extensions
  excludes?: string[]; // Path patterns to exclude
}

// ============================================================================
// RULES (Based on LIDLESS LEGION Audit Findings)
// ============================================================================

const ARCH_RULES: ArchRule[] = [
  // Rule 1: No inline adapter classes in demos
  {
    name: 'NO_INLINE_ADAPTER_CLASSES',
    pattern: /class\s+(\w*Adapter|\w*Smoother|\w*Factory)\s*\{/g,
    antiPattern: /import.*from.*adapters/i,
    severity: 'CRITICAL',
    message: 'Inline adapter class detected. MUST import from sandbox/src/adapters/',
    appliesTo: ['.html', '.jsx', '.tsx'],
    excludes: ['sandbox/src/adapters/', 'test', 'spec']
  },
  
  // Rule 2: No hand-rolled FSM (must use XState)
  {
    name: 'NO_INLINE_FSM',
    pattern: /if\s*\(\s*(?:state|gesture)\s*===?\s*['"](?:DISARMED|ARMING|ARMED|ACTIVE)['"]/gi,
    antiPattern: /import.*(?:xstate|createMachine|createActor)/i,
    severity: 'CRITICAL',
    message: 'Hand-rolled FSM detected. MUST use XState adapter.',
    appliesTo: ['.html', '.jsx', '.tsx', '.js', '.ts'],
    excludes: ['test', 'spec', 'sandbox/src/adapters/xstate']
  },
  
  // Rule 3: No inline filter functions (must use adapter)
  {
    name: 'NO_INLINE_FILTERS',
    pattern: /function\s+oneEuro(?:Filter)?|const\s+oneEuro\s*=/gi,
    antiPattern: /class\s+OneEuroAdapter|import.*OneEuro/i,
    severity: 'CRITICAL',
    message: 'Inline filter detected. MUST use OneEuroAdapter.',
    appliesTo: ['.html', '.jsx', '.tsx'],
    excludes: ['sandbox/src/adapters/', 'test', 'spec']
  },
  
  // Rule 4: No manual state variables in demos
  {
    name: 'NO_MANUAL_STATE_VARS',
    pattern: /(?:let|var|const)\s+state\s*=\s*['"](?:DISARMED|ARMING|ARMED|ACTIVE)['"]/gi,
    antiPattern: /import.*xstate/i,
    severity: 'HIGH',
    message: 'Manual state variable detected. Use XState actor.',
    appliesTo: ['.html', '.jsx', '.tsx', '.js'],
    excludes: ['test', 'spec', 'sandbox/src/adapters/']
  },
  
  // Rule 5: No switch/case FSM
  {
    name: 'NO_SWITCH_FSM',
    pattern: /switch\s*\(\s*state\s*\)\s*\{/gi,
    antiPattern: /import.*xstate/i,
    severity: 'HIGH',
    message: 'Switch-based FSM detected. Use XState machine.',
    appliesTo: ['.html', '.jsx', '.tsx', '.js', '.ts'],
    excludes: ['test', 'spec']
  }
];

// ============================================================================
// SCANNER
// ============================================================================

function shouldScanFile(filePath: string, rule: ArchRule): boolean {
  const ext = path.extname(filePath);
  
  // Check if extension matches
  if (!rule.appliesTo.includes(ext)) {
    return false;
  }
  
  // Check excludes
  if (rule.excludes) {
    for (const exclude of rule.excludes) {
      if (filePath.includes(exclude)) {
        return false;
      }
    }
  }
  
  return true;
}

function scanFile(filePath: string, rule: ArchRule): Violation[] {
  const violations: Violation[] = [];
  
  if (!shouldScanFile(filePath, rule)) {
    return violations;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check anti-pattern first (if present, skip this file)
  if (rule.antiPattern && rule.antiPattern.test(content)) {
    return violations;
  }
  
  // Scan for violations
  const lines = content.split('\n');
  const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
  
  lines.forEach((line, index) => {
    if (regex.test(line)) {
      violations.push({
        file: filePath,
        line: index + 1,
        rule: rule.name,
        severity: rule.severity,
        message: rule.message,
        evidence: line.trim()
      });
    }
  });
  
  return violations;
}

function walk(dir: string, extensions: string[]): string[] {
  let files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules, .git, dist
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue;
      }
      
      if (entry.isDirectory()) {
        files = files.concat(walk(fullPath, extensions));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (err) {
    // Ignore errors (e.g., permission denied)
  }
  
  return files;
}

function runGate(rootDir: string): GateResult {
  const violations: Violation[] = [];
  const allExtensions = new Set<string>();
  
  // Collect all extensions from rules
  ARCH_RULES.forEach(rule => {
    rule.appliesTo.forEach(ext => allExtensions.add(ext));
  });
  
  // Find all files to scan
  const files = walk(rootDir, Array.from(allExtensions));
  
  // Scan each file against each rule
  for (const file of files) {
    for (const rule of ARCH_RULES) {
      const fileViolations = scanFile(file, rule);
      violations.push(...fileViolations);
    }
  }
  
  // Generate summary
  const passed = violations.length === 0;
  const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
  const highCount = violations.filter(v => v.severity === 'HIGH').length;
  
  let summary = '';
  if (passed) {
    summary = `✅ G-ARCH PASSED: No architectural violations found (${files.length} files scanned)`;
  } else {
    summary = `❌ G-ARCH FAILED: ${violations.length} violations found (${criticalCount} CRITICAL, ${highCount} HIGH)`;
  }
  
  return {
    passed,
    violations,
    filesScanned: files.length,
    summary
  };
}

// ============================================================================
// REPORTER
// ============================================================================

function formatViolation(v: Violation, index: number): string {
  const icon = v.severity === 'CRITICAL' ? '🔴' : v.severity === 'HIGH' ? '🟡' : '🟢';
  return [
    `${icon} [${index + 1}] ${v.rule}`,
    `   File: ${v.file}:${v.line}`,
    `   ${v.message}`,
    `   Evidence: ${v.evidence}`,
    ''
  ].join('\n');
}

function printReport(result: GateResult, jsonOutput: boolean = false): void {
  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  G-ARCH: Architecture Compliance Gate                         ║');
  console.log('║  Gen87.X3 | Port 5 (Pyre Praetorian) | DEFEND                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📊 Summary: ${result.summary}\n`);
  console.log(`📁 Files Scanned: ${result.filesScanned}`);
  console.log(`🚨 Violations: ${result.violations.length}\n`);
  
  if (result.violations.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🚨 VIOLATIONS DETECTED:\n');
    
    result.violations.forEach((v, i) => {
      console.log(formatViolation(v, i));
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 ACTION REQUIRED:\n');
    console.log('1. Import adapters from sandbox/src/adapters/ (don\'t copy inline)');
    console.log('2. Use XState machine for FSM (not manual if/else)');
    console.log('3. Use adapter pattern for all filters (not inline functions)\n');
    console.log('💡 See: sandbox/audits/THEATER_VS_REALITY.md\n');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const rootDir = args.find(arg => !arg.startsWith('--')) || path.join(__dirname, '..');
  
  const result = runGate(rootDir);
  printReport(result, jsonOutput);
  
  process.exit(result.passed ? 0 : 1);
}

main();
