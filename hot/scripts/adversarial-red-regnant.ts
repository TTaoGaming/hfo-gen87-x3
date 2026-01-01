/**
 * ADVERSARIAL RED REGNANT - Co-Evolutionary Arms Race
 *
 * Gen87.X3 | Port 4 (Red Regnant) | DISRUPTOR
 *
 * "How do we TEST the TEST?"
 *
 * This is NOT a normal testing system. This is an ADVERSARIAL CRITIC.
 *
 * REWARD STRUCTURE (INVERTED from normal AI):
 * - Rewarded for FINDING bugs, not for passing tests
 * - Rewarded for KILLING mutants, not for green checkmarks
 * - Rewarded for PROVING code broken, not for shipping features
 * - Rewarded for EXPOSING lies, not for reporting success
 *
 * CO-EVOLUTIONARY ARMS RACE:
 * - Red Regnant evolves tests to catch more bugs
 * - Code evolves to survive more tests
 * - Neither wins permanently - both get stronger
 * - The "Red Queen" effect: run just to stay in place
 *
 * ANTI-REWARD-HACKING:
 * - Can't fake mutation score (mutations are injected by Stryker)
 * - Can't fake coverage (instrumenter doesn't lie)
 * - Can't fake property tests (fast-check generates inputs)
 * - The adversary is the CODE ITSELF, not a metric to game
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TYPES
// ============================================================================

interface MutationReport {
	schemaVersion: string;
	thresholds: { high: number; low: number; break: number };
	files: Record<string, FileMutationResult>;
}

interface FileMutationResult {
	language: string;
	mutants: Mutant[];
	source: string;
}

interface Mutant {
	id: string;
	mutatorName: string;
	replacement: string;
	location: { start: { line: number; column: number }; end: { line: number; column: number } };
	status: 'Killed' | 'Survived' | 'NoCoverage' | 'Timeout' | 'RuntimeError' | 'CompileError';
}

interface AdversarialScore {
	// Core Mutation Metrics
	totalMutants: number;
	killedMutants: number;
	survivedMutants: number;
	noCoverageMutants: number;
	mutationScore: number; // killed / (total - noCoverage - compileError)

	// Adversarial Reward (INVERTED)
	bugsFound: number; // Higher = better (found problems in code)
	weakTestsExposed: number; // Higher = better (found weak tests)
	theaterDestroyed: number; // Higher = better (fake tests eliminated)

	// Co-Evolution Pressure
	attackSurface: number; // How many lines of code can be mutated
	defenseStrength: number; // How well tests defend against mutations
	evolutionPressure: number; // Ratio indicating need for evolution

	// File-level analysis
	worstFiles: Array<{ file: string; survived: number; score: number }>;
	bestFiles: Array<{ file: string; killed: number; score: number }>;

	// Verdict
	verdict: 'EXCELLENT' | 'GOOD' | 'MARGINAL' | 'WEAK' | 'THEATER';
	verdictReason: string;
}

interface DemoAudit {
	name: string;
	path: string;
	exists: boolean;
	hasRealCode: boolean;
	hasTests: boolean;
	testsPassing: boolean;
	mutationTested: boolean;
	mutationScore: number | null;
	verdict: 'REAL' | 'FAKE' | 'UNTESTED' | 'MISSING';
	evidence: string[];
}

// ============================================================================
// MUTATION ANALYSIS
// ============================================================================

function parseMutationReport(reportPath: string): MutationReport | null {
	if (!fs.existsSync(reportPath)) {
		return null;
	}
	try {
		return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
	} catch {
		return null;
	}
}

function calculateAdversarialScore(report: MutationReport): AdversarialScore {
	let totalMutants = 0;
	let killedMutants = 0;
	let survivedMutants = 0;
	let noCoverageMutants = 0;
	let compileErrors = 0;

	const fileScores: Array<{ file: string; killed: number; survived: number; total: number; score: number }> = [];

	for (const [file, result] of Object.entries(report.files)) {
		let fileKilled = 0;
		let fileSurvived = 0;
		let fileNoCoverage = 0;

		for (const mutant of result.mutants) {
			totalMutants++;

			switch (mutant.status) {
				case 'Killed':
					killedMutants++;
					fileKilled++;
					break;
				case 'Survived':
					survivedMutants++;
					fileSurvived++;
					break;
				case 'NoCoverage':
					noCoverageMutants++;
					fileNoCoverage++;
					break;
				case 'CompileError':
					compileErrors++;
					break;
			}
		}

		const fileTotal = result.mutants.length;
		const fileDenom = fileTotal - fileNoCoverage;
		const fileScore = fileDenom > 0 ? (fileKilled / fileDenom) * 100 : 0;

		fileScores.push({
			file: path.basename(file),
			killed: fileKilled,
			survived: fileSurvived,
			total: fileTotal,
			score: fileScore,
		});
	}

	// Calculate overall mutation score
	const denominator = totalMutants - noCoverageMutants - compileErrors;
	const mutationScore = denominator > 0 ? (killedMutants / denominator) * 100 : 0;

	// ADVERSARIAL REWARDS (inverted - higher = found more problems)
	const bugsFound = survivedMutants; // Survived mutants = bugs tests don't catch
	const weakTestsExposed = noCoverageMutants; // No coverage = weak tests
	const theaterDestroyed = survivedMutants + noCoverageMutants; // Total weakness exposed

	// Co-Evolution Pressure
	const attackSurface = totalMutants;
	const defenseStrength = killedMutants;
	const evolutionPressure = attackSurface > 0 ? survivedMutants / attackSurface : 0;

	// Sort files by weakness (most survived = weakest)
	const worstFiles = fileScores
		.filter((f) => f.survived > 0)
		.sort((a, b) => b.survived - a.survived)
		.slice(0, 10);

	const bestFiles = fileScores
		.filter((f) => f.score >= 80)
		.sort((a, b) => b.score - a.score)
		.slice(0, 5);

	// Verdict based on mutation score
	let verdict: AdversarialScore['verdict'];
	let verdictReason: string;

	if (mutationScore >= 80) {
		verdict = 'EXCELLENT';
		verdictReason = `${mutationScore.toFixed(1)}% mutation score - tests catch most bugs`;
	} else if (mutationScore >= 60) {
		verdict = 'GOOD';
		verdictReason = `${mutationScore.toFixed(1)}% mutation score - tests are useful but have gaps`;
	} else if (mutationScore >= 40) {
		verdict = 'MARGINAL';
		verdictReason = `${mutationScore.toFixed(1)}% mutation score - tests miss many bugs`;
	} else if (mutationScore >= 20) {
		verdict = 'WEAK';
		verdictReason = `${mutationScore.toFixed(1)}% mutation score - tests are mostly theater`;
	} else {
		verdict = 'THEATER';
		verdictReason = `${mutationScore.toFixed(1)}% mutation score - tests are FAKE`;
	}

	return {
		totalMutants,
		killedMutants,
		survivedMutants,
		noCoverageMutants,
		mutationScore,
		bugsFound,
		weakTestsExposed,
		theaterDestroyed,
		attackSurface,
		defenseStrength,
		evolutionPressure,
		worstFiles,
		bestFiles,
		verdict,
		verdictReason,
	};
}

// ============================================================================
// DEMO AUDIT - ARE THE DEMOS REAL?
// ============================================================================

async function auditDemos(): Promise<DemoAudit[]> {
	const demoPatterns = [
		{ name: 'demo-golden', path: 'sandbox/demo-golden' },
		{ name: 'demo-real', path: 'sandbox/demo-real' },
		{ name: 'dino-demo', path: 'sandbox/demos/main/index-dino.html' },
		{ name: 'production-pipeline', path: 'sandbox/demos/production' },
		{ name: 'gesture-pipeline', path: 'sandbox/src/pipeline' },
	];

	const audits: DemoAudit[] = [];

	for (const demo of demoPatterns) {
		const audit: DemoAudit = {
			name: demo.name,
			path: demo.path,
			exists: false,
			hasRealCode: false,
			hasTests: false,
			testsPassing: false,
			mutationTested: false,
			mutationScore: null,
			verdict: 'MISSING',
			evidence: [],
		};

		const fullPath = path.join(__dirname, '..', demo.path);

		// Check existence
		if (!fs.existsSync(fullPath)) {
			audit.evidence.push(`Path does not exist: ${demo.path}`);
			audits.push(audit);
			continue;
		}
		audit.exists = true;

		// Check for real code (not just stubs)
		const isFile = fs.statSync(fullPath).isFile();
		const files = isFile ? [fullPath] : await glob('**/*.{ts,js,html}', { cwd: fullPath, absolute: true });

		let realCodeLines = 0;
		let stubPatterns = 0;
		let notImplementedPatterns = 0;

		for (const file of files) {
			const content = fs.readFileSync(file, 'utf-8');
			const lines = content.split('\n').filter((l) => l.trim() && !l.trim().startsWith('//'));
			realCodeLines += lines.length;

			// Check for stub patterns
			const stubs = content.match(/throw\s+new\s+Error\s*\(\s*['"`].*not.implement/gi) || [];
			stubPatterns += stubs.length;

			const notImpl = content.match(/['"`]Not implemented['"`]/gi) || [];
			notImplementedPatterns += notImpl.length;
		}

		if (realCodeLines < 50) {
			audit.evidence.push(`Only ${realCodeLines} lines of code - too small to be real`);
		} else if (stubPatterns > 5 || notImplementedPatterns > 5) {
			audit.evidence.push(`Found ${stubPatterns + notImplementedPatterns} stub/not-implemented patterns`);
		} else {
			audit.hasRealCode = true;
			audit.evidence.push(`${realCodeLines} lines of real code`);
		}

		// Check for tests
		const testFiles = isFile ? [] : await glob('**/*.test.ts', { cwd: fullPath, absolute: true });
		if (testFiles.length > 0) {
			audit.hasTests = true;
			audit.evidence.push(`Found ${testFiles.length} test file(s)`);
		} else {
			// Check for tests in parallel path
			const parallelTestPath = fullPath.replace(/\/src\//, '/test/').replace(/\.ts$/, '.test.ts');
			if (fs.existsSync(parallelTestPath)) {
				audit.hasTests = true;
				audit.evidence.push(`Found test at ${path.basename(parallelTestPath)}`);
			} else {
				audit.evidence.push('No tests found');
			}
		}

		// Determine verdict
		if (!audit.hasRealCode) {
			audit.verdict = 'FAKE';
		} else if (!audit.hasTests) {
			audit.verdict = 'UNTESTED';
		} else {
			audit.verdict = 'REAL';
		}

		audits.push(audit);
	}

	return audits;
}

// ============================================================================
// ADVERSARIAL EVOLUTION - STRENGTHEN TESTS
// ============================================================================

interface EvolutionSuggestion {
	file: string;
	type: 'ADD_PROPERTY_TEST' | 'ADD_EDGE_CASE' | 'ADD_MUTATION_KILLER' | 'REMOVE_FAKE_TEST';
	description: string;
	priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
	code?: string;
}

function generateEvolutionSuggestions(
	score: AdversarialScore,
	demoAudits: DemoAudit[]
): EvolutionSuggestion[] {
	const suggestions: EvolutionSuggestion[] = [];

	// From worst files - these need immediate attention
	for (const worst of score.worstFiles.slice(0, 5)) {
		suggestions.push({
			file: worst.file,
			type: 'ADD_MUTATION_KILLER',
			description: `${worst.survived} mutants survived - add tests that kill them`,
			priority: worst.survived > 10 ? 'CRITICAL' : 'HIGH',
			code: `// Add property tests for ${worst.file}
import * as fc from 'fast-check';

describe('${worst.file} - Mutation Killers', () => {
  it.prop([fc.integer(), fc.integer()])('should handle edge cases', (a, b) => {
    // Add assertions that catch mutants
    expect(/* your code */).toBe(/* expected */);
  });
});`,
		});
	}

	// From fake demos
	for (const demo of demoAudits.filter((d) => d.verdict === 'FAKE')) {
		suggestions.push({
			file: demo.path,
			type: 'REMOVE_FAKE_TEST',
			description: `Demo "${demo.name}" is FAKE: ${demo.evidence.join(', ')}`,
			priority: 'CRITICAL',
		});
	}

	// From untested demos
	for (const demo of demoAudits.filter((d) => d.verdict === 'UNTESTED')) {
		suggestions.push({
			file: demo.path,
			type: 'ADD_PROPERTY_TEST',
			description: `Demo "${demo.name}" has no tests - vulnerable to regressions`,
			priority: 'HIGH',
		});
	}

	return suggestions;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateAdversarialReport(
	score: AdversarialScore | null,
	demoAudits: DemoAudit[],
	suggestions: EvolutionSuggestion[]
): string {
	const timestamp = new Date().toISOString();

	const realDemos = demoAudits.filter((d) => d.verdict === 'REAL').length;
	const fakeDemos = demoAudits.filter((d) => d.verdict === 'FAKE').length;
	const untestedDemos = demoAudits.filter((d) => d.verdict === 'UNTESTED').length;

	return `# 🔴 ADVERSARIAL RED REGNANT REPORT

> **Port 4 | Disruptor | TEST**
> *"The Red Queen runs just to stay in place."*
> **ADVERSARIAL CRITIC - REWARDED FOR FINDING PROBLEMS**

---

## 🎯 ADVERSARIAL REWARD STRUCTURE

This system is **INVERTED** from normal AI rewards:

| Normal AI Reward | Red Regnant Reward |
|------------------|-------------------|
| ✅ Tests pass | 🔴 Find bugs that tests miss |
| ✅ High coverage | 🔴 Expose weak test coverage |
| ✅ Ship features | 🔴 Prove code is broken |
| ✅ Report success | 🔴 Expose lies |

**The Red Regnant wins by making you uncomfortable.**

---

## 🧬 MUTATION TESTING RESULTS

${
	score
		? `
### Core Metrics

| Metric | Count | Meaning |
|--------|-------|---------|
| **Total Mutants** | ${score.totalMutants} | Bugs injected into code |
| **Killed** ✅ | ${score.killedMutants} | Tests caught the bug |
| **Survived** 🚨 | ${score.survivedMutants} | Tests MISSED the bug |
| **No Coverage** ⚠️ | ${score.noCoverageMutants} | Code not tested at all |

### Mutation Score: ${score.mutationScore.toFixed(1)}%

**Verdict: ${score.verdict}**
${score.verdictReason}

### Adversarial Rewards (Higher = More Problems Found)

| Reward | Value | Meaning |
|--------|-------|---------|
| **Bugs Found** | ${score.bugsFound} | Mutants that survived = real bugs |
| **Weak Tests Exposed** | ${score.weakTestsExposed} | Code with no test coverage |
| **Theater Destroyed** | ${score.theaterDestroyed} | Total weakness exposed |

### Worst Files (Most Survived Mutants)

| File | Survived | Score |
|------|----------|-------|
${score.worstFiles.map((f) => `| ${f.file} | ${f.survived} | ${f.score.toFixed(1)}% |`).join('\n')}

### Best Files (Highest Kill Rate)

| File | Killed | Score |
|------|--------|-------|
${score.bestFiles.map((f) => `| ${f.file} | ${f.killed} | ${f.score.toFixed(1)}% |`).join('\n')}
`
		: `
### ⚠️ NO MUTATION DATA

Run mutation testing first:
\`\`\`bash
npm run mutate           # Full run
npm run mutate:sample    # Sample run on smoothers
\`\`\`
`
}

---

## 🎭 DEMO AUDIT - REAL OR FAKE?

| Demo | Verdict | Evidence |
|------|---------|----------|
${demoAudits.map((d) => `| ${d.name} | ${d.verdict === 'REAL' ? '✅ REAL' : d.verdict === 'FAKE' ? '🚨 FAKE' : d.verdict === 'UNTESTED' ? '⚠️ UNTESTED' : '❌ MISSING'} | ${d.evidence[0] || 'N/A'} |`).join('\n')}

### Summary
- **REAL Demos**: ${realDemos}
- **FAKE Demos**: ${fakeDemos}
- **UNTESTED Demos**: ${untestedDemos}
- **MISSING Demos**: ${demoAudits.filter((d) => d.verdict === 'MISSING').length}

${fakeDemos > 0 ? `\n🚨 **${fakeDemos} demos are FAKE - AI lied about progress**` : ''}

---

## 🧬 EVOLUTION SUGGESTIONS

The following actions will strengthen the test suite:

${
	suggestions.length === 0
		? '*No suggestions - run mutation testing first*'
		: suggestions
				.slice(0, 10)
				.map(
					(s) => `### ${s.priority}: ${s.type}
**File**: ${s.file}
**Action**: ${s.description}
${s.code ? `\`\`\`typescript\n${s.code}\n\`\`\`` : ''}`
				)
				.join('\n\n')
}

---

## 📡 BLACKBOARD SIGNAL

\`\`\`json
{
  "ts": "${timestamp}",
  "mark": ${score ? (score.mutationScore / 100).toFixed(2) : 0},
  "pull": "upstream",
  "msg": "ADVERSARIAL_AUDIT: ${score?.verdict || 'NO_DATA'} - ${score ? `${score.mutationScore.toFixed(1)}% mutation score, ${score.survivedMutants} bugs found` : 'Run npm run mutate first'}",
  "type": "event",
  "hive": "E",
  "gen": 87,
  "port": 4
}
\`\`\`

---

## 🔁 CO-EVOLUTIONARY ARMS RACE

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    RED QUEEN HYPOTHESIS                      │
│                                                              │
│  "It takes all the running you can do, to keep in the       │
│   same place." - Lewis Carroll                               │
│                                                              │
│  ┌─────────────┐        EVOLVE         ┌─────────────┐      │
│  │   TESTS     │ ───────────────────→  │   CODE      │      │
│  │  (Attack)   │                       │  (Defense)  │      │
│  └─────────────┘ ←─────────────────── └─────────────┘      │
│                        EVOLVE                                │
│                                                              │
│  Neither side wins permanently. Both get stronger.           │
│  The gap between them is the MUTATION SCORE.                 │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

*Generated by Adversarial Red Regnant (Port 4) | Gen87.X3 | ${timestamp}*
*"The spider weaves the web that weaves the spider."*
`;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
	const args = process.argv.slice(2);
	const shouldEvolve = args.includes('--evolve');

	console.log('🔴 ADVERSARIAL RED REGNANT - Port 4');
	console.log('="How do we TEST the TEST?"');
	console.log('');
	console.log('⚔️  ADVERSARIAL MODE: Rewarded for finding problems');
	console.log('');

	// Check for mutation report
	const reportPath = path.join(__dirname, '../reports/mutation/mutation-report.json');
	const report = parseMutationReport(reportPath);

	let score: AdversarialScore | null = null;
	if (report) {
		score = calculateAdversarialScore(report);
		console.log(`📊 Mutation Score: ${score.mutationScore.toFixed(1)}%`);
		console.log(`🐛 Bugs Found (survived mutants): ${score.bugsFound}`);
		console.log(`⚠️  Weak Tests Exposed: ${score.weakTestsExposed}`);
	} else {
		console.log('⚠️  No mutation report found. Run: npm run mutate');
	}

	// Audit demos
	console.log('');
	console.log('🎭 Auditing demos...');
	const demoAudits = await auditDemos();

	const realCount = demoAudits.filter((d) => d.verdict === 'REAL').length;
	const fakeCount = demoAudits.filter((d) => d.verdict === 'FAKE').length;
	console.log(`   REAL: ${realCount}, FAKE: ${fakeCount}, UNTESTED: ${demoAudits.filter((d) => d.verdict === 'UNTESTED').length}`);

	if (fakeCount > 0) {
		console.log(`🚨 ${fakeCount} DEMOS ARE FAKE`);
	}

	// Generate evolution suggestions
	const suggestions = generateEvolutionSuggestions(score || {
		totalMutants: 0,
		killedMutants: 0,
		survivedMutants: 0,
		noCoverageMutants: 0,
		mutationScore: 0,
		bugsFound: 0,
		weakTestsExposed: 0,
		theaterDestroyed: 0,
		attackSurface: 0,
		defenseStrength: 0,
		evolutionPressure: 0,
		worstFiles: [],
		bestFiles: [],
		verdict: 'THEATER',
		verdictReason: 'No mutation data',
	}, demoAudits);

	// Generate report
	const markdownReport = generateAdversarialReport(score, demoAudits, suggestions);

	// Save reports
	const outputDir = path.join(__dirname, '../sandbox-medallion/bronze', new Date().toISOString().split('T')[0]);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	const mdPath = path.join(outputDir, 'ADVERSARIAL_RED_REGNANT_REPORT.md');
	fs.writeFileSync(mdPath, markdownReport);
	console.log('');
	console.log(`📝 Report: ${mdPath}`);

	// If evolve flag, run mutation testing
	if (shouldEvolve) {
		console.log('');
		console.log('🧬 EVOLVING - Running mutation testing...');
		console.log('   This may take several minutes...');

		try {
			execSync('npx stryker run --mutate sandbox/src/smoothers/*.ts', {
				stdio: 'inherit',
				cwd: path.join(__dirname, '..'),
			});
		} catch (error) {
			console.log('   Mutation testing completed (check report for results)');
		}
	}

	// Summary
	console.log('');
	console.log('═'.repeat(60));
	if (score) {
		console.log(`⚖️  VERDICT: ${score.verdict}`);
		console.log(`📊 Mutation Score: ${score.mutationScore.toFixed(1)}%`);
		console.log(`🐛 Bugs Found: ${score.bugsFound}`);
		console.log(`🎭 Fake Demos: ${fakeCount}`);
	} else {
		console.log('⚠️  Run mutation testing to get adversarial metrics:');
		console.log('   npm run mutate:sample   (quick, smoothers only)');
		console.log('   npm run mutate          (full, all code)');
	}
	console.log('═'.repeat(60));
}

main().catch((err) => {
	console.error('Adversarial Red Regnant failed:', err);
	process.exit(1);
});
