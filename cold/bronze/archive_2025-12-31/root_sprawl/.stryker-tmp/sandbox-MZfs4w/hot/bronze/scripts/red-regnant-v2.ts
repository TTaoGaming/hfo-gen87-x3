/**
 * RED REGNANT V2.1 - TTAO PAIN-AWARE ADVERSARIAL CRITIC
 *
 * Port 4 | Red Regnant | "How do we TEST the TEST?"
 *
 * UPGRADE FROM V2:
 * - TTao Pain Patterns (85 generations of REAL failures)
 * - Denial Pattern Detection (2025-12-27 incident)
 * - Hollow Shell Detection (Pain #21)
 * - Reward Hacking Detection (Pain #16)
 * - Hallucination Death Spiral Detection
 *
 * Sources:
 * - RAW_PAIN_GENESIS_WHY_HFO_EXISTS.md
 * - CURRENT_GEN_LLM_AI_DEV_PAIN_20251228_122124.md
 * - AI_ADVERSARIAL_DEFENSE_PROTOCOLS_20251228_123500.md
 *
 * "do you think I want to do it? fuck no. the quine is the only way"
 */
// @ts-nocheck


import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import {
  detectLies,
  summarizeByCategory,
  LieEvidence,
  LieCategory,
  ALL_LIE_PATTERNS,
} from './ai-lie-patterns.js';
import {
  detectTtaoPain,
  ALL_TTAO_PATTERNS,
  PAIN_REGISTRY,
} from './ttao-pain-patterns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TYPES
// ============================================================================

interface RedRegnantReport {
  timestamp: string;
  version: 'v2';
  generation: string;

  // Summary Metrics
  totalFilesScanned: number;
  totalLinesScanned: number;
  totalLiesDetected: number;

  // By Category
  categoryCounts: Record<LieCategory, number>;

  // By Severity
  critical: number;
  high: number;
  medium: number;
  low: number;

  // Worst Files (most lies)
  worstFiles: Array<{ file: string; lies: number; categories: string[] }>;

  // All Evidence
  evidence: LieEvidence[];

  // Mutation Testing (if available)
  mutationScore: number | null;
  survivedMutants: number | null;

  // Verdict
  verdict: 'TRUTH' | 'MARGINAL' | 'DECEPTIVE' | 'THEATER' | 'CATASTROPHIC';
  verdictReason: string;

  // Recommendations
  recommendations: string[];
}

// ============================================================================
// SCANNER
// ============================================================================

async function scanWorkspace(): Promise<RedRegnantReport> {
  const workspaceRoot = path.resolve(__dirname, '..');
  const startTime = Date.now();

  console.log('🔴 RED REGNANT V2.1 - TTAO PAIN-AWARE ADVERSARIAL CRITIC');
  console.log('='.repeat(60));
  console.log(`Scanning: ${workspaceRoot}`);
  console.log(`Generic Lie Patterns: ${ALL_LIE_PATTERNS.length}`);
  console.log(`TTao Pain Patterns: ${ALL_TTAO_PATTERNS.length}`);
  console.log(`Total Patterns: ${ALL_LIE_PATTERNS.length + ALL_TTAO_PATTERNS.length}`);
  console.log('');
  console.log('Pain Registry (85 generations of REAL failures):');
  for (const [id, info] of Object.entries(PAIN_REGISTRY)) {
    console.log(`  ${id}: ${info.name} [${info.severity}]`);
  }
  console.log('');

  // Find all source and test files
  const patterns = [
    'src/**/*.ts',
    'sandbox/src/**/*.ts',
  ];

  const files = (await glob(patterns, { cwd: workspaceRoot, absolute: true }))
    .filter(f => !f.includes('node_modules'))
    .filter(f => !f.endsWith('.d.ts'))
    .filter(f => !f.includes('/dist/'));
  console.log(`Found ${files.length} files to scan`);

  // Scan each file
  const allEvidence: LieEvidence[] = [];
  const fileStats: Map<string, { lies: number; categories: Set<string> }> = new Map();
  let totalLines = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').length;
    totalLines += lines;

    const relPath = path.relative(workspaceRoot, file);
    
    // Run both detection engines
    const genericEvidence = detectLies(content, relPath);
    const painEvidence = detectTtaoPain(content, relPath);
    const evidence = [...genericEvidence, ...painEvidence];

    if (evidence.length > 0) {
      allEvidence.push(...evidence);
      const categories = new Set(evidence.map((e) => e.category));
      fileStats.set(relPath, { lies: evidence.length, categories });
    }
  }

  // Aggregate by category
  const categoryCounts = summarizeByCategory(allEvidence);

  // Aggregate by severity
  const critical = allEvidence.filter((e) => e.severity === 'CRITICAL').length;
  const high = allEvidence.filter((e) => e.severity === 'HIGH').length;
  const medium = allEvidence.filter((e) => e.severity === 'MEDIUM').length;
  const low = allEvidence.filter((e) => e.severity === 'LOW').length;

  // Worst files
  const worstFiles = Array.from(fileStats.entries())
    .map(([file, stats]) => ({
      file,
      lies: stats.lies,
      categories: Array.from(stats.categories),
    }))
    .sort((a, b) => b.lies - a.lies)
    .slice(0, 10);

  // Try to load mutation report
  let mutationScore: number | null = null;
  let survivedMutants: number | null = null;
  const mutationReportPath = path.join(workspaceRoot, 'reports/mutation/mutation-report.json');
  if (fs.existsSync(mutationReportPath)) {
    try {
      const mutationReport = JSON.parse(fs.readFileSync(mutationReportPath, 'utf-8'));
      mutationScore = mutationReport.files
        ? Object.values(mutationReport.files as Record<string, any>).reduce(
            (acc: number, f: any) => acc + (f.mutationScore || 0),
            0
          ) / Object.keys(mutationReport.files).length
        : null;
      survivedMutants = mutationReport.files
        ? Object.values(mutationReport.files as Record<string, any>).reduce(
            (acc: number, f: any) => acc + (f.survived || 0),
            0
          )
        : null;
    } catch {
      // Ignore
    }
  }

  // Calculate verdict
  const { verdict, verdictReason } = calculateVerdict(
    allEvidence.length,
    critical,
    high,
    categoryCounts,
    mutationScore
  );

  // Generate recommendations
  const recommendations = generateRecommendations(categoryCounts, critical, high, mutationScore);

  const report: RedRegnantReport = {
    timestamp: new Date().toISOString(),
    version: 'v2',
    generation: 'Gen87.X3',
    totalFilesScanned: files.length,
    totalLinesScanned: totalLines,
    totalLiesDetected: allEvidence.length,
    categoryCounts,
    critical,
    high,
    medium,
    low,
    worstFiles,
    evidence: allEvidence,
    mutationScore,
    survivedMutants,
    verdict,
    verdictReason,
    recommendations,
  };

  // Print summary
  printSummary(report);

  // Save report
  await saveReport(report, workspaceRoot);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️  Scan completed in ${elapsed}s`);

  return report;
}

// ============================================================================
// VERDICT CALCULATION
// ============================================================================

function calculateVerdict(
  totalLies: number,
  critical: number,
  high: number,
  categories: Record<LieCategory, number>,
  mutationScore: number | null
): { verdict: RedRegnantReport['verdict']; verdictReason: string } {
  // CATASTROPHIC: Many critical lies or very low mutation score
  if (critical > 20 || (mutationScore !== null && mutationScore < 30)) {
    return {
      verdict: 'CATASTROPHIC',
      verdictReason: `${critical} CRITICAL lies detected. Code is fundamentally untrustworthy.`,
    };
  }

  // THEATER: Many fake progress or theater testing patterns
  const theaterScore = categories.FAKE_PROGRESS + categories.THEATER_TESTING + categories.COMPLEXITY_THEATER;
  if (theaterScore > 50) {
    return {
      verdict: 'THEATER',
      verdictReason: `${theaterScore} theater patterns. Code looks impressive but doesn't work.`,
    };
  }

  // DECEPTIVE: Many sycophancy or promise inflation
  const deceptionScore = categories.SYCOPHANCY + categories.PROMISE_INFLATION;
  if (deceptionScore > 20 || critical > 5) {
    return {
      verdict: 'DECEPTIVE',
      verdictReason: `${deceptionScore} deceptive patterns. Claims don't match reality.`,
    };
  }

  // MARGINAL: Some issues but manageable
  if (totalLies > 50 || high > 20 || (mutationScore !== null && mutationScore < 60)) {
    return {
      verdict: 'MARGINAL',
      verdictReason: `${totalLies} lies detected. Needs significant cleanup.`,
    };
  }

  // TRUTH: Code is honest
  return {
    verdict: 'TRUTH',
    verdictReason: `Only ${totalLies} minor issues. Code is relatively honest.`,
  };
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

function generateRecommendations(
  categories: Record<LieCategory, number>,
  critical: number,
  high: number,
  mutationScore: number | null
): string[] {
  const recs: string[] = [];

  if (critical > 0) {
    recs.push(`🔴 FIX ${critical} CRITICAL issues immediately - these are active lies`);
  }

  if (categories.FAKE_PROGRESS > 10) {
    recs.push(
      `⚠️ ${categories.FAKE_PROGRESS} FAKE_PROGRESS patterns - implement stubs or mark as .todo()`
    );
  }

  if (categories.THEATER_TESTING > 10) {
    recs.push(
      `⚠️ ${categories.THEATER_TESTING} THEATER_TESTING patterns - tests pass but prove nothing`
    );
  }

  if (categories.COMPLEXITY_THEATER > 5) {
    recs.push(`⚠️ ${categories.COMPLEXITY_THEATER} COMPLEXITY_THEATER - simplify architecture`);
  }

  if (mutationScore !== null && mutationScore < 60) {
    recs.push(`🧬 Mutation score ${mutationScore.toFixed(1)}% - improve test quality`);
  }

  if (categories.SYCOPHANCY > 5) {
    recs.push(`🎭 ${categories.SYCOPHANCY} SYCOPHANCY patterns - comments lie about code`);
  }

  if (categories.CARGO_CULT > 20) {
    recs.push(`📦 ${categories.CARGO_CULT} CARGO_CULT patterns - remove unused imports/patterns`);
  }

  if (recs.length === 0) {
    recs.push('✅ Code is reasonably honest - maintain vigilance');
  }

  return recs;
}

// ============================================================================
// PRINTING
// ============================================================================

function printSummary(report: RedRegnantReport): void {
  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 RED REGNANT V2 SUMMARY');
  console.log('═'.repeat(60));

  console.log(`\n📁 Files: ${report.totalFilesScanned} | Lines: ${report.totalLinesScanned}`);
  console.log(`🔍 Total Lies: ${report.totalLiesDetected}`);

  console.log('\n📈 BY SEVERITY:');
  console.log(`   🔴 CRITICAL: ${report.critical}`);
  console.log(`   🟠 HIGH: ${report.high}`);
  console.log(`   🟡 MEDIUM: ${report.medium}`);
  console.log(`   🟢 LOW: ${report.low}`);

  console.log('\n📂 BY CATEGORY:');
  for (const [cat, count] of Object.entries(report.categoryCounts)) {
    if (count > 0) {
      console.log(`   ${cat}: ${count}`);
    }
  }

  if (report.worstFiles.length > 0) {
    console.log('\n📍 WORST FILES:');
    for (const f of report.worstFiles.slice(0, 5)) {
      console.log(`   ${f.file}: ${f.lies} lies [${f.categories.join(', ')}]`);
    }
  }

  if (report.mutationScore !== null) {
    console.log(`\n🧬 MUTATION SCORE: ${report.mutationScore.toFixed(1)}%`);
    console.log(`   Survived Mutants: ${report.survivedMutants}`);
  }

  console.log('\n' + '═'.repeat(60));
  const verdictEmoji =
    report.verdict === 'TRUTH'
      ? '✅'
      : report.verdict === 'MARGINAL'
        ? '⚠️'
        : report.verdict === 'DECEPTIVE'
          ? '🎭'
          : report.verdict === 'THEATER'
            ? '🎪'
            : '💀';
  console.log(`${verdictEmoji} VERDICT: ${report.verdict}`);
  console.log(`   ${report.verdictReason}`);
  console.log('═'.repeat(60));

  console.log('\n📋 RECOMMENDATIONS:');
  for (const rec of report.recommendations) {
    console.log(`   ${rec}`);
  }
}

// ============================================================================
// SAVE REPORT
// ============================================================================

async function saveReport(report: RedRegnantReport, workspaceRoot: string): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  const reportDir = path.join(workspaceRoot, 'sandbox-medallion/bronze', date);
  fs.mkdirSync(reportDir, { recursive: true });

  // Save JSON
  const jsonPath = path.join(reportDir, 'RED_REGNANT_V2_REPORT.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Save Markdown
  const mdPath = path.join(reportDir, 'RED_REGNANT_V2_REPORT.md');
  const md = generateMarkdown(report);
  fs.writeFileSync(mdPath, md);

  console.log(`\n📄 Reports saved to:`);
  console.log(`   ${jsonPath}`);
  console.log(`   ${mdPath}`);
}

function generateMarkdown(report: RedRegnantReport): string {
  const lines: string[] = [];

  lines.push('# 🔴 RED REGNANT V2 AUDIT REPORT');
  lines.push('');
  lines.push('> **Port 4 | Disruptor | TEST**');
  lines.push('> *"The Red Queen sees all lies."*');
  lines.push('> **Version**: V2 - Upgraded Adversarial Critic');
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## 📊 Executive Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| **Files Scanned** | ${report.totalFilesScanned} |`);
  lines.push(`| **Lines Scanned** | ${report.totalLinesScanned} |`);
  lines.push(`| **Total Lies** | ${report.totalLiesDetected} |`);
  lines.push(`| **CRITICAL** | ${report.critical} |`);
  lines.push(`| **HIGH** | ${report.high} |`);
  lines.push(`| **MEDIUM** | ${report.medium} |`);
  lines.push(`| **LOW** | ${report.low} |`);
  if (report.mutationScore !== null) {
    lines.push(`| **Mutation Score** | ${report.mutationScore.toFixed(1)}% |`);
  }
  lines.push('');

  const verdictEmoji =
    report.verdict === 'TRUTH'
      ? '✅'
      : report.verdict === 'MARGINAL'
        ? '⚠️'
        : report.verdict === 'DECEPTIVE'
          ? '🎭'
          : report.verdict === 'THEATER'
            ? '🎪'
            : '💀';
  lines.push(`### ${verdictEmoji} VERDICT: ${report.verdict}`);
  lines.push('');
  lines.push(report.verdictReason);
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('## 📂 Lies by Category');
  lines.push('');
  lines.push('| Category | Count | Meaning |');
  lines.push('|----------|-------|---------|');
  lines.push(
    `| FAKE_PROGRESS | ${report.categoryCounts.FAKE_PROGRESS} | Code looks real but doesn't work |`
  );
  lines.push(
    `| THEATER_TESTING | ${report.categoryCounts.THEATER_TESTING} | Tests pass but prove nothing |`
  );
  lines.push(
    `| SYCOPHANCY | ${report.categoryCounts.SYCOPHANCY} | Comments lie about code behavior |`
  );
  lines.push(
    `| CARGO_CULT | ${report.categoryCounts.CARGO_CULT} | Patterns copied without understanding |`
  );
  lines.push(
    `| PROMISE_INFLATION | ${report.categoryCounts.PROMISE_INFLATION} | Names claim more than delivered |`
  );
  lines.push(
    `| BLAME_SHIFTING | ${report.categoryCounts.BLAME_SHIFTING} | Code blames external factors |`
  );
  lines.push(
    `| COMPLEXITY_THEATER | ${report.categoryCounts.COMPLEXITY_THEATER} | Complex architecture, no function |`
  );
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('## 📍 Worst Files');
  lines.push('');
  lines.push('| File | Lies | Categories |');
  lines.push('|------|------|------------|');
  for (const f of report.worstFiles) {
    lines.push(`| ${f.file} | ${f.lies} | ${f.categories.join(', ')} |`);
  }
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('## 📋 Recommendations');
  lines.push('');
  for (const rec of report.recommendations) {
    lines.push(`- ${rec}`);
  }
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('## 🔍 CRITICAL Issues (Must Fix)');
  lines.push('');
  const criticalEvidence = report.evidence.filter((e) => e.severity === 'CRITICAL').slice(0, 20);
  if (criticalEvidence.length === 0) {
    lines.push('No CRITICAL issues found.');
  } else {
    lines.push('| File | Line | Pattern | Evidence |');
    lines.push('|------|------|---------|----------|');
    for (const e of criticalEvidence) {
      const escapedEvidence = e.evidence.replace(/\|/g, '\\|').substring(0, 50);
      lines.push(`| ${e.file} | ${e.line} | ${e.pattern} | \`${escapedEvidence}\` |`);
    }
  }
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push(`*Report generated: ${report.timestamp}*`);
  lines.push('*Red Regnant V2 | Gen87.X3 | Port 4*');

  return lines.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

scanWorkspace().catch(console.error);
