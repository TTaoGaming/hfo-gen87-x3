/**
 * regression-detector.ts - Feature parity checker
 * 
 * HARD ENFORCEMENT: Compares new demo files against the baseline (index.html)
 * to detect any features that were silently removed.
 * 
 * Usage:
 *   npx ts-node scripts/regression-detector.ts <new-file.html>
 *   npx ts-node scripts/regression-detector.ts <new-file.html> --base=<base-file.html>
 * 
 * Exit codes:
 *   0 = No regressions detected
 *   1 = Regressions detected (commit should be blocked)
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

interface Feature {
  id: string;
  name: string;
  patterns: string[];
  weight: number; // 1=minor, 2=standard, 3=critical
}

interface FeaturePresence {
  feature: Feature;
  inBase: boolean;
  inNew: boolean;
  status: 'PRESENT' | 'ADDED' | 'REMOVED' | 'MISSING_BOTH';
}

interface RegressionReport {
  baseFile: string;
  newFile: string;
  timestamp: string;
  regressionDetected: boolean;
  totalRegressions: number;
  criticalRegressions: number;
  features: FeaturePresence[];
  summary: string;
}

// ============================================================================
// FEATURE REGISTRY - The source of truth for what must be present
// ============================================================================

const FEATURE_REGISTRY: Feature[] = [
  // Critical Infrastructure (weight: 3)
  {
    id: 'GL-CORE',
    name: 'Golden Layout Core',
    patterns: ['GoldenLayout', 'golden-layout@2'],
    weight: 3,
  },
  {
    id: 'GL-INIT',
    name: 'Golden Layout Initialization',
    patterns: ['new GoldenLayout', 'goldenlayout.init()'],
    weight: 3,
  },
  {
    id: 'MP-CORE',
    name: 'MediaPipe Core',
    patterns: ['GestureRecognizer', '@mediapipe/tasks-vision'],
    weight: 3,
  },
  {
    id: 'MP-INIT',
    name: 'MediaPipe Initialization',
    patterns: ['createFromOptions', 'recognizeForVideo'],
    weight: 3,
  },
  
  // Required Features (weight: 2)
  {
    id: '1E-FILTER',
    name: '1€ Filter Implementation',
    patterns: ['oneEuroFilter', 'minCutoff', 'computeAlpha'],
    weight: 2,
  },
  {
    id: 'FSM-IMPL',
    name: 'FSM State Machine',
    patterns: ['DISARMED', 'ARMING', 'ARMED', 'ACTIVE'],
    weight: 2,
  },
  {
    id: 'W3C-PTR',
    name: 'W3C Pointer Events',
    patterns: ['PointerEvent', 'pointerType', 'dispatchEvent'],
    weight: 2,
  },
  {
    id: 'WEBCAM',
    name: 'Webcam Access',
    patterns: ['getUserMedia', 'navigator.mediaDevices', 'videoElement'],
    weight: 2,
  },
  
  // Standard Features (weight: 1)
  {
    id: 'GL-CSS',
    name: 'Golden Layout CSS',
    patterns: ['goldenlayout-base.css', 'goldenlayout-dark-theme.css'],
    weight: 1,
  },
  {
    id: 'PANELS',
    name: 'Multiple Panels',
    patterns: ['component', 'type: \'component\'', 'componentState'],
    weight: 1,
  },
  {
    id: 'DEBUG',
    name: 'Debug Panel',
    patterns: ['log-container', 'debugLog', 'event-log'],
    weight: 1,
  },
  {
    id: 'CURSOR',
    name: 'Custom Cursor',
    patterns: ['cursor-dot', 'cursor-pos', 'virtual cursor'],
    weight: 1,
  },
  {
    id: 'GOLDEN-INPUT',
    name: 'Golden Input Testing',
    patterns: ['goldenInput', 'test without camera', 'injection'],
    weight: 1,
  },
];

// ============================================================================
// DETECTION LOGIC
// ============================================================================

function hasFeature(content: string, feature: Feature): boolean {
  // Feature is present if ANY of its patterns are found
  return feature.patterns.some(pattern => content.includes(pattern));
}

function analyzeFeatures(baseContent: string, newContent: string): FeaturePresence[] {
  return FEATURE_REGISTRY.map(feature => {
    const inBase = hasFeature(baseContent, feature);
    const inNew = hasFeature(newContent, feature);
    
    let status: FeaturePresence['status'];
    if (inBase && inNew) {
      status = 'PRESENT';
    } else if (!inBase && inNew) {
      status = 'ADDED';
    } else if (inBase && !inNew) {
      status = 'REMOVED';
    } else {
      status = 'MISSING_BOTH';
    }
    
    return { feature, inBase, inNew, status };
  });
}

function generateReport(baseFile: string, newFile: string, features: FeaturePresence[]): RegressionReport {
  const regressions = features.filter(f => f.status === 'REMOVED');
  const criticalRegressions = regressions.filter(f => f.feature.weight === 3).length;
  
  let summary = '';
  if (regressions.length === 0) {
    summary = '✅ No regressions detected - all base features preserved';
  } else {
    const criticalList = regressions.filter(f => f.feature.weight === 3).map(f => f.feature.name);
    const standardList = regressions.filter(f => f.feature.weight === 2).map(f => f.feature.name);
    const minorList = regressions.filter(f => f.feature.weight === 1).map(f => f.feature.name);
    
    summary = `🚨 ${regressions.length} REGRESSIONS DETECTED:\n`;
    if (criticalList.length) summary += `   CRITICAL: ${criticalList.join(', ')}\n`;
    if (standardList.length) summary += `   STANDARD: ${standardList.join(', ')}\n`;
    if (minorList.length) summary += `   MINOR: ${minorList.join(', ')}`;
  }
  
  return {
    baseFile,
    newFile,
    timestamp: new Date().toISOString(),
    regressionDetected: regressions.length > 0,
    totalRegressions: regressions.length,
    criticalRegressions,
    features,
    summary,
  };
}

// ============================================================================
// OUTPUT
// ============================================================================

function printReport(report: RegressionReport): void {
  console.log('\n' + '='.repeat(70));
  console.log('REGRESSION DETECTION REPORT');
  console.log('='.repeat(70));
  console.log(`Base file: ${path.basename(report.baseFile)}`);
  console.log(`New file:  ${path.basename(report.newFile)}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log('-'.repeat(70));
  
  console.log('\nFEATURE STATUS:');
  console.log('-'.repeat(70));
  
  // Group by status
  const present = report.features.filter(f => f.status === 'PRESENT');
  const added = report.features.filter(f => f.status === 'ADDED');
  const removed = report.features.filter(f => f.status === 'REMOVED');
  const missingBoth = report.features.filter(f => f.status === 'MISSING_BOTH');
  
  if (present.length > 0) {
    console.log('\n✅ PRESERVED (' + present.length + '):');
    for (const f of present) {
      const weightIcon = f.feature.weight === 3 ? '🔴' : f.feature.weight === 2 ? '🟡' : '⚪';
      console.log(`   ${weightIcon} ${f.feature.name} [${f.feature.id}]`);
    }
  }
  
  if (added.length > 0) {
    console.log('\n🆕 ADDED (' + added.length + '):');
    for (const f of added) {
      console.log(`   ➕ ${f.feature.name} [${f.feature.id}]`);
    }
  }
  
  if (removed.length > 0) {
    console.log('\n❌ REMOVED (REGRESSION!) (' + removed.length + '):');
    for (const f of removed) {
      const weightIcon = f.feature.weight === 3 ? '🔴' : f.feature.weight === 2 ? '🟡' : '⚪';
      console.log(`   ${weightIcon} ${f.feature.name} [${f.feature.id}]`);
      console.log(`      Patterns expected: ${f.feature.patterns.join(', ')}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY:');
  console.log(report.summary);
  console.log('='.repeat(70));
  
  if (report.regressionDetected) {
    console.log('\n🚨 REGRESSION DETECTED - COMMIT BLOCKED');
    console.log('Options:');
    console.log('  1. Fix the regressions and try again');
    console.log('  2. Use --allow-regression flag (REQUIRES HUMAN APPROVAL IN INCIDENT LOG)');
    console.log('');
  }
}

// ============================================================================
// CLI
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npx ts-node scripts/regression-detector.ts <new-file.html>');
    console.log('       npx ts-node scripts/regression-detector.ts <new-file.html> --base=<base-file.html>');
    process.exit(2);
  }
  
  // Parse arguments
  let newFile = '';
  let baseFile = path.join(__dirname, '..', 'sandbox', 'demo-golden', 'index.html');
  
  for (const arg of args) {
    if (arg.startsWith('--base=')) {
      baseFile = arg.substring(7);
    } else if (arg.startsWith('--')) {
      // Skip other flags
    } else {
      newFile = arg;
    }
  }
  
  if (!newFile) {
    console.error('Error: No new file specified');
    process.exit(2);
  }
  
  // Resolve paths
  newFile = path.isAbsolute(newFile) ? newFile : path.join(process.cwd(), newFile);
  baseFile = path.isAbsolute(baseFile) ? baseFile : path.join(process.cwd(), baseFile);
  
  // Validate files exist
  if (!fs.existsSync(baseFile)) {
    console.error(`Base file not found: ${baseFile}`);
    process.exit(2);
  }
  
  if (!fs.existsSync(newFile)) {
    console.error(`New file not found: ${newFile}`);
    process.exit(2);
  }
  
  // Read files
  const baseContent = fs.readFileSync(baseFile, 'utf-8');
  const newContent = fs.readFileSync(newFile, 'utf-8');
  
  // Analyze
  const features = analyzeFeatures(baseContent, newContent);
  const report = generateReport(baseFile, newFile, features);
  
  // Output
  printReport(report);
  
  // Exit code
  process.exit(report.regressionDetected ? 1 : 0);
}

main();
