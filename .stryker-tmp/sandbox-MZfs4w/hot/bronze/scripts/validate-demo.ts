/**
 * validate-demo.ts - Static analyzer for demo files
 * 
 * HARD ENFORCEMENT: This script validates demo HTML files against spec-contract.json
 * It is designed to be run as a pre-commit hook and BLOCK invalid commits.
 * 
 * Usage:
 *   npx ts-node scripts/validate-demo.ts <file.html>
 *   npx ts-node scripts/validate-demo.ts --all
 * 
 * Exit codes:
 *   0 = All validations passed
 *   1 = Validation failures (commit should be blocked)
 *   2 = Error reading files
 */
// @ts-nocheck


import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TYPES
// ============================================================================

interface ValidationResult {
  ruleId: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  passed: boolean;
  message: string;
  matchedPatterns?: string[];
  missingPatterns?: string[];
}

interface ValidationReport {
  file: string;
  timestamp: string;
  passed: boolean;
  criticalFailures: number;
  highFailures: number;
  results: ValidationResult[];
}

// ============================================================================
// SPEC CONTRACT (Embedded for reliability - also in spec-contract.json)
// ============================================================================

const SPEC_CONTRACT = {
  requiredImports: {
    goldenLayout: {
      patterns: ['golden-layout@2.6.0', 'golden-layout@2', 'GoldenLayout'],
      errorMessage: 'Golden Layout v2.6.0 is REQUIRED',
    },
    mediaPipe: {
      patterns: ['@mediapipe/tasks-vision', 'GestureRecognizer'],
      errorMessage: 'MediaPipe Tasks Vision is REQUIRED',
    },
  },
  requiredFeatures: {
    oneEuroFilter: {
      patterns: ['oneEuroFilter', '1€', 'minCutoff', 'computeAlpha'],
      errorMessage: '1€ Filter is REQUIRED for smoothing',
    },
    fsmStates: {
      patterns: ['DISARMED', 'ARMING', 'ARMED', 'ACTIVE'],
      errorMessage: 'FSM with 4 states is REQUIRED',
    },
    w3cPointerEvents: {
      patterns: ['PointerEvent', 'pointerdown', 'pointermove'],
      errorMessage: 'W3C Pointer Events are REQUIRED',
    },
  },
  forbiddenPatterns: {
    jquery: {
      patterns: ['jquery.min.js', 'jQuery(', '$(document)'],
      errorMessage: 'jQuery is FORBIDDEN - use GL v2.6.0',
    },
    wrongGLVersion: {
      patterns: ['golden-layout@1.5', 'golden-layout@1.'],
      errorMessage: 'Golden Layout v1.x is FORBIDDEN',
    },
  },
};

// ============================================================================
// VALIDATORS
// ============================================================================

function checkPatterns(content: string, patterns: string[], requireAll: boolean = false): { found: string[], missing: string[] } {
  const found: string[] = [];
  const missing: string[] = [];
  
  for (const pattern of patterns) {
    if (content.includes(pattern)) {
      found.push(pattern);
    } else {
      missing.push(pattern);
    }
  }
  
  return { found, missing };
}

function validateGoldenLayout(content: string): ValidationResult {
  const { found, missing } = checkPatterns(content, SPEC_CONTRACT.requiredImports.goldenLayout.patterns);
  
  // Must have at least one GL pattern
  const passed = found.length > 0;
  
  return {
    ruleId: 'GL-001',
    name: 'Golden Layout Present',
    severity: 'CRITICAL',
    passed,
    message: passed 
      ? `✅ Golden Layout found: ${found.join(', ')}`
      : `❌ ${SPEC_CONTRACT.requiredImports.goldenLayout.errorMessage}`,
    matchedPatterns: found,
    missingPatterns: passed ? [] : missing,
  };
}

function validateMediaPipe(content: string): ValidationResult {
  const { found, missing } = checkPatterns(content, SPEC_CONTRACT.requiredImports.mediaPipe.patterns);
  const passed = found.length >= 1;
  
  return {
    ruleId: 'MP-001',
    name: 'MediaPipe Present',
    severity: 'CRITICAL',
    passed,
    message: passed
      ? `✅ MediaPipe found: ${found.join(', ')}`
      : `❌ ${SPEC_CONTRACT.requiredImports.mediaPipe.errorMessage}`,
    matchedPatterns: found,
    missingPatterns: passed ? [] : missing,
  };
}

function validateOneEuroFilter(content: string): ValidationResult {
  const { found, missing } = checkPatterns(content, SPEC_CONTRACT.requiredFeatures.oneEuroFilter.patterns);
  const passed = found.length >= 2; // Need at least 2 patterns to confirm real implementation
  
  return {
    ruleId: '1E-001',
    name: '1€ Filter Present',
    severity: 'HIGH',
    passed,
    message: passed
      ? `✅ 1€ Filter found: ${found.join(', ')}`
      : `❌ ${SPEC_CONTRACT.requiredFeatures.oneEuroFilter.errorMessage}`,
    matchedPatterns: found,
    missingPatterns: missing,
  };
}

function validateFSMStates(content: string): ValidationResult {
  const { found, missing } = checkPatterns(content, SPEC_CONTRACT.requiredFeatures.fsmStates.patterns);
  const passed = found.length === 4; // ALL 4 states required
  
  return {
    ruleId: 'FSM-001',
    name: 'FSM States Present',
    severity: 'CRITICAL',
    passed,
    message: passed
      ? `✅ All FSM states found: ${found.join(', ')}`
      : `❌ ${SPEC_CONTRACT.requiredFeatures.fsmStates.errorMessage}. Missing: ${missing.join(', ')}`,
    matchedPatterns: found,
    missingPatterns: missing,
  };
}

function validateW3CPointerEvents(content: string): ValidationResult {
  const { found, missing } = checkPatterns(content, SPEC_CONTRACT.requiredFeatures.w3cPointerEvents.patterns);
  const passed = found.length >= 2;
  
  return {
    ruleId: 'W3C-001',
    name: 'W3C Pointer Events Present',
    severity: 'CRITICAL',
    passed,
    message: passed
      ? `✅ W3C Pointer Events found: ${found.join(', ')}`
      : `❌ ${SPEC_CONTRACT.requiredFeatures.w3cPointerEvents.errorMessage}`,
    matchedPatterns: found,
    missingPatterns: missing,
  };
}

function validateNoJQuery(content: string): ValidationResult {
  const { found } = checkPatterns(content, SPEC_CONTRACT.forbiddenPatterns.jquery.patterns);
  const passed = found.length === 0; // None should be found
  
  return {
    ruleId: 'NO-JQ',
    name: 'No jQuery Dependency',
    severity: 'CRITICAL',
    passed,
    message: passed
      ? `✅ No jQuery detected`
      : `❌ ${SPEC_CONTRACT.forbiddenPatterns.jquery.errorMessage}. Found: ${found.join(', ')}`,
    matchedPatterns: passed ? [] : found,
  };
}

function validateNoWrongGLVersion(content: string): ValidationResult {
  const { found } = checkPatterns(content, SPEC_CONTRACT.forbiddenPatterns.wrongGLVersion.patterns);
  const passed = found.length === 0;
  
  return {
    ruleId: 'NO-GL1',
    name: 'No Golden Layout v1.x',
    severity: 'CRITICAL',
    passed,
    message: passed
      ? `✅ No GL v1.x detected`
      : `❌ ${SPEC_CONTRACT.forbiddenPatterns.wrongGLVersion.errorMessage}. Found: ${found.join(', ')}`,
    matchedPatterns: passed ? [] : found,
  };
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

function validateFile(filePath: string): ValidationReport {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const results: ValidationResult[] = [
    validateGoldenLayout(content),
    validateMediaPipe(content),
    validateOneEuroFilter(content),
    validateFSMStates(content),
    validateW3CPointerEvents(content),
    validateNoJQuery(content),
    validateNoWrongGLVersion(content),
  ];
  
  const criticalFailures = results.filter(r => !r.passed && r.severity === 'CRITICAL').length;
  const highFailures = results.filter(r => !r.passed && r.severity === 'HIGH').length;
  
  return {
    file: filePath,
    timestamp: new Date().toISOString(),
    passed: criticalFailures === 0,
    criticalFailures,
    highFailures,
    results,
  };
}

function printReport(report: ValidationReport): void {
  console.log('\n' + '='.repeat(70));
  console.log(`VALIDATION REPORT: ${path.basename(report.file)}`);
  console.log('='.repeat(70));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Critical Failures: ${report.criticalFailures}`);
  console.log(`High Failures: ${report.highFailures}`);
  console.log('-'.repeat(70));
  
  for (const result of report.results) {
    const icon = result.passed ? '✅' : '❌';
    const severity = result.passed ? '' : ` [${result.severity}]`;
    console.log(`${icon} ${result.ruleId}: ${result.name}${severity}`);
    if (!result.passed) {
      console.log(`   ${result.message}`);
      if (result.missingPatterns && result.missingPatterns.length > 0) {
        console.log(`   Missing: ${result.missingPatterns.join(', ')}`);
      }
    }
  }
  
  console.log('='.repeat(70));
  
  if (!report.passed) {
    console.log('\n🚨 VALIDATION FAILED - Commit should be BLOCKED');
    console.log('Fix the issues above or use --allow-regression flag (requires human approval)\n');
  }
}

// ============================================================================
// CLI
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npx ts-node scripts/validate-demo.ts <file.html>');
    console.log('       npx ts-node scripts/validate-demo.ts --all');
    process.exit(2);
  }
  
  const demoDir = path.join(__dirname, '..', 'sandbox', 'demo-golden');
  let files: string[] = [];
  
  if (args[0] === '--all') {
    // Validate all HTML files in demo-golden
    const allFiles = fs.readdirSync(demoDir);
    files = allFiles
      .filter(f => f.endsWith('.html'))
      .map(f => path.join(demoDir, f));
  } else {
    files = args.map(f => path.isAbsolute(f) ? f : path.join(process.cwd(), f));
  }
  
  let allPassed = true;
  
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.error(`File not found: ${file}`);
      continue;
    }
    
    const report = validateFile(file);
    printReport(report);
    
    if (!report.passed) {
      allPassed = false;
    }
  }
  
  process.exit(allPassed ? 0 : 1);
}

main();
