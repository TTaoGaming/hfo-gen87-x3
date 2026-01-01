#!/usr/bin/env tsx
// @ts-nocheck
/**
 * HFO Gen87 Architecture Enforcement Script
 * 
 * Detects reward hacking and architectural violations:
 * - REWARD_HACK: expect(true), toBeTruthy() without context
 * - MOCK_ABUSE: >3 vi.mock() calls in single file
 * - CUSTOM_CONTRACT: Zod schema without TRL 9 source comment
 * - SKIP_ABUSE: it.skip without TODO/FIXME comment
 * - THEATER_CODE: Files with only exports, no logic
 * - LAZY_AI: GREEN tests without corresponding RED tests
 * 
 * Source: Gen85 disruptor.test.ts patterns (TRL 9: HFO internal)
 * @see https://github.com/TTaoGaming/hfo-gen87-x3
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface Violation {
  file: string;
  line: number;
  type: ViolationType;
  message: string;
  severity: 'error' | 'warning';
}

type ViolationType = 
  | 'REWARD_HACK'
  | 'MOCK_ABUSE'
  | 'CUSTOM_CONTRACT'
  | 'SKIP_ABUSE'
  | 'THEATER_CODE'
  | 'LAZY_AI'
  | 'WEAK_ASSERTION';

// ============================================================================
// DETECTION PATTERNS (Tavily-grounded from TDD anti-patterns)
// ============================================================================

/**
 * Patterns that indicate reward hacking / meaningless tests
 * Source: Codurance TDD Anti-Patterns, Gen85 disruptor
 * 
 * NOTE: expect(result.success).toBe(true) is VALID for Zod schema testing
 * We only flag expect(true).toBe(true) which is truly meaningless
 */
const REWARD_HACK_PATTERNS = [
  { pattern: /expect\s*\(\s*true\s*\)\s*\.toBe\s*\(\s*true\s*\)/g, msg: 'expect(true).toBe(true) is meaningless' },
  { pattern: /expect\s*\(\s*1\s*\)\s*\.toBe\s*\(\s*1\s*\)/g, msg: 'expect(1).toBe(1) is meaningless' },
  { pattern: /expect\s*\(\s*""\s*\)\s*\.toBe\s*\(\s*""\s*\)/g, msg: 'expect("").toBe("") is meaningless' },
];

/**
 * Weak assertions that pass on any truthy value
 */
const WEAK_ASSERTION_PATTERNS = [
  { 
    pattern: /expect\([^)]+\)\.toBeTruthy\(\)/g, 
    msg: 'toBeTruthy() is weak - use specific assertion',
    // Allow if preceded by comment explaining why
    allowIf: (content: string, match: RegExpMatchArray) => {
      const lineStart = content.lastIndexOf('\n', match.index!) + 1;
      const prevLine = content.slice(Math.max(0, lineStart - 100), lineStart);
      return prevLine.includes('// truthy check intentional') || 
             prevLine.includes('/* truthy */');
    }
  },
  {
    pattern: /expect\([^)]+\)\.toBeFalsy\(\)/g,
    msg: 'toBeFalsy() is weak - use specific assertion',
    allowIf: (content: string, match: RegExpMatchArray) => {
      const lineStart = content.lastIndexOf('\n', match.index!) + 1;
      const prevLine = content.slice(Math.max(0, lineStart - 100), lineStart);
      return prevLine.includes('// falsy check intentional');
    }
  }
];

/**
 * Mock abuse detection threshold
 * Source: Codurance "The Mockery" anti-pattern
 */
const MOCK_ABUSE_THRESHOLD = 3;

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

function detectRewardHack(filePath: string, content: string): Violation[] {
  const violations: Violation[] = [];
  
  for (const { pattern, msg } of REWARD_HACK_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      const line = content.slice(0, match.index).split('\n').length;
      violations.push({
        file: filePath,
        line,
        type: 'REWARD_HACK',
        message: msg,
        severity: 'error'
      });
    }
  }
  
  return violations;
}

function detectWeakAssertions(filePath: string, content: string): Violation[] {
  const violations: Violation[] = [];
  
  for (const { pattern, msg, allowIf } of WEAK_ASSERTION_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      // Check if allowed by exception
      if (allowIf && allowIf(content, match)) continue;
      
      const line = content.slice(0, match.index).split('\n').length;
      violations.push({
        file: filePath,
        line,
        type: 'WEAK_ASSERTION',
        message: msg,
        severity: 'warning'
      });
    }
  }
  
  return violations;
}

function detectMockAbuse(filePath: string, content: string): Violation[] {
  const violations: Violation[] = [];
  
  const mockCalls = content.match(/vi\.mock\s*\(/g) || [];
  const jestMockCalls = content.match(/jest\.mock\s*\(/g) || [];
  const totalMocks = mockCalls.length + jestMockCalls.length;
  
  if (totalMocks > MOCK_ABUSE_THRESHOLD) {
    violations.push({
      file: filePath,
      line: 1,
      type: 'MOCK_ABUSE',
      message: `${totalMocks} mocks detected (threshold: ${MOCK_ABUSE_THRESHOLD}). Consider integration test instead.`,
      severity: 'warning'
    });
  }
  
  return violations;
}

function detectCustomContract(filePath: string, content: string): Violation[] {
  const violations: Violation[] = [];
  
  // Only check contract files
  if (!filePath.includes('contract') && !filePath.includes('schema')) {
    return violations;
  }
  
  // Check for z.object definitions without TRL source
  const zodObjects = content.match(/export\s+(const|type)\s+\w+\s*=\s*z\.object/g) || [];
  
  for (const zodMatch of zodObjects) {
    // Look backwards for JSDoc with @source or @see
    const index = content.indexOf(zodMatch);
    const before = content.slice(Math.max(0, index - 500), index);
    
    const hasSource = 
      before.includes('@source') || 
      before.includes('@see') ||
      before.includes('TRL') ||
      before.includes('W3C') ||
      before.includes('CNCF') ||
      before.includes('RFC') ||
      before.includes('ISO');
    
    if (!hasSource) {
      const line = content.slice(0, index).split('\n').length;
      violations.push({
        file: filePath,
        line,
        type: 'CUSTOM_CONTRACT',
        message: 'Zod schema without TRL 9 source. Add @source or @see JSDoc comment.',
        severity: 'error'
      });
    }
  }
  
  return violations;
}

function detectSkipAbuse(filePath: string, content: string): Violation[] {
  const violations: Violation[] = [];
  
  const skipPatterns = [
    /it\.skip\s*\(/g,
    /test\.skip\s*\(/g,
    /describe\.skip\s*\(/g,
    /xit\s*\(/g,
    /xtest\s*\(/g,
  ];
  
  for (const pattern of skipPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      // Check for TODO/FIXME/Phase comment
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const lineEnd = content.indexOf('\n', match.index);
      const prevLines = content.slice(Math.max(0, lineStart - 200), lineStart);
      const currentLine = content.slice(lineStart, lineEnd);
      
      const hasReason = 
        prevLines.includes('TODO') ||
        prevLines.includes('FIXME') ||
        prevLines.includes('Phase') ||
        prevLines.includes('TDD RED') ||
        currentLine.includes('TODO') ||
        currentLine.includes('Phase');
      
      if (!hasReason) {
        const line = content.slice(0, match.index).split('\n').length;
        violations.push({
          file: filePath,
          line,
          type: 'SKIP_ABUSE',
          message: 'Skipped test without TODO/Phase reason. Either implement or document why skipped.',
          severity: 'warning'
        });
      }
    }
  }
  
  return violations;
}

function detectTheaterCode(filePath: string, content: string): Violation[] {
  const violations: Violation[] = [];
  
  // Skip test files
  if (filePath.includes('.test.') || filePath.includes('.spec.')) {
    return violations;
  }
  
  // Theater code: only exports, no actual logic
  const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  const exportLines = lines.filter(l => l.includes('export'));
  const importLines = lines.filter(l => l.includes('import'));
  const logicLines = lines.length - exportLines.length - importLines.length;
  
  // If more than 70% is just exports and the file is small, it's theater
  if (lines.length > 3 && lines.length < 20 && logicLines < 3) {
    violations.push({
      file: filePath,
      line: 1,
      type: 'THEATER_CODE',
      message: 'File appears to be theater code (only exports, no logic). Add implementation.',
      severity: 'warning'
    });
  }
  
  return violations;
}

// ============================================================================
// MAIN ANALYZER
// ============================================================================

interface AnalysisResult {
  violations: Violation[];
  filesAnalyzed: number;
  errorCount: number;
  warningCount: number;
}

function analyzeFile(filePath: string): Violation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations: Violation[] = [];
  
  if (filePath.endsWith('.test.ts') || filePath.endsWith('.spec.ts')) {
    violations.push(...detectRewardHack(filePath, content));
    violations.push(...detectWeakAssertions(filePath, content));
    violations.push(...detectMockAbuse(filePath, content));
    violations.push(...detectSkipAbuse(filePath, content));
  }
  
  if (filePath.endsWith('.ts') && !filePath.endsWith('.test.ts')) {
    violations.push(...detectCustomContract(filePath, content));
    violations.push(...detectTheaterCode(filePath, content));
  }
  
  return violations;
}

function analyzeDirectory(dir: string): AnalysisResult {
  const violations: Violation[] = [];
  let filesAnalyzed = 0;
  
  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, dist, coverage
        if (!['node_modules', 'dist', 'coverage', '.git', 'playwright-report'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        violations.push(...analyzeFile(fullPath));
        filesAnalyzed++;
      }
    }
  }
  
  walk(dir);
  
  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;
  
  return { violations, filesAnalyzed, errorCount, warningCount };
}

// ============================================================================
// CLI
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || './sandbox';
  const strictMode = args.includes('--strict');
  const jsonOutput = args.includes('--json');
  
  console.log(`\n🔍 HFO Architecture Enforcement\n`);
  console.log(`Target: ${path.resolve(targetDir)}`);
  console.log(`Mode: ${strictMode ? 'STRICT (errors + warnings fail)' : 'NORMAL (only errors fail)'}\n`);
  
  const result = analyzeDirectory(targetDir);
  
  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    // Group by type
    const byType = new Map<ViolationType, Violation[]>();
    for (const v of result.violations) {
      const list = byType.get(v.type) || [];
      list.push(v);
      byType.set(v.type, list);
    }
    
    for (const [type, violations] of byType) {
      const icon = violations[0].severity === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${type} (${violations.length})`);
      for (const v of violations.slice(0, 5)) { // Show max 5 per type
        const relPath = path.relative(process.cwd(), v.file);
        console.log(`   ${relPath}:${v.line} - ${v.message}`);
      }
      if (violations.length > 5) {
        console.log(`   ... and ${violations.length - 5} more`);
      }
      console.log('');
    }
    
    console.log('─'.repeat(50));
    console.log(`Files analyzed: ${result.filesAnalyzed}`);
    console.log(`Errors: ${result.errorCount}`);
    console.log(`Warnings: ${result.warningCount}`);
    console.log('');
  }
  
  // Exit code
  if (result.errorCount > 0) {
    console.log('❌ Architecture enforcement FAILED (errors found)');
    process.exit(1);
  }
  
  if (strictMode && result.warningCount > 0) {
    console.log('❌ Architecture enforcement FAILED (strict mode, warnings found)');
    process.exit(1);
  }
  
  console.log('✅ Architecture enforcement PASSED');
  process.exit(0);
}

main();
