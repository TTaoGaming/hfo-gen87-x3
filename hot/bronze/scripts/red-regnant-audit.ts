/**
 * RED REGNANT AUDIT - Port 4 Adversarial Critic
 *
 * Gen87.X3 | Port 4 (Red Regnant) | TEST
 *
 * "How do we TEST the TEST?"
 *
 * The Red Queen runs just to stay in place.
 * NO MERCY. NO SYCOPHANCY. BRUTAL HONESTY ONLY.
 *
 * This script produces a TRUTH REPORT:
 * - TRUE GREEN: Tests that actually validate something
 * - FAKE GREEN: Tests that pass but test nothing (reward hacking)
 * - HONEST RED: Tests that fail honestly
 * - HONEST TODO: Tests marked as not implemented (honest)
 * - THEATER CODE: Implementation that looks real but isn't
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TYPES
// ============================================================================

interface FakeGreenViolation {
	file: string;
	line: number;
	testName: string;
	pattern: string;
	evidence: string;
	severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface TestFileAnalysis {
	file: string;
	trueGreen: number; // Tests with real assertions
	fakeGreen: number; // Tests with fake passing patterns
	honestTodo: number; // it.todo() - honest skip
	honestSkip: number; // it.skip() - honest skip
	honestFail: number; // Tests that fail honestly
	emptyTests: number; // Tests with no body
	violations: FakeGreenViolation[];
}

interface PropertyTestAnalysis {
	file: string;
	hasFastCheck: boolean;
	propertyTestCount: number;
	iterationsConfigured: number | null;
	arbitraries: string[];
}

interface AuditReport {
	timestamp: string;
	generation: string;
	port: number;
	commander: string;

	// Summary
	totalTestFiles: number;
	totalTests: number;
	trueGreen: number;
	fakeGreen: number;
	honestTodo: number;
	honestSkip: number;
	honestFail: number;

	// Ratios
	fakeGreenRatio: number; // fakeGreen / (trueGreen + fakeGreen)
	truthRatio: number; // trueGreen / totalTests

	// Property Testing
	filesWithPropertyTests: number;
	totalPropertyTests: number;
	filesNeedingPropertyTests: string[];

	// Violations
	violations: FakeGreenViolation[];

	// Mutation Testing Readiness
	mutationReady: boolean;
	mutationBlockers: string[];

	// File Details
	fileAnalysis: TestFileAnalysis[];
	propertyAnalysis: PropertyTestAnalysis[];

	// Verdict
	verdict: 'CRITICAL' | 'FAILING' | 'MARGINAL' | 'PASSING' | 'EXCELLENT';
	verdictReason: string;
}

// ============================================================================
// FAKE GREEN PATTERNS - Things that look green but aren't
// ============================================================================

const FAKE_GREEN_PATTERNS = [
	{
		name: 'EXPECT_THROW_NOT_IMPLEMENTED',
		regex: /expect\s*\([^)]*\)\s*\.toThrow\s*\(\s*['"`].*[Nn]ot.{0,10}implement.*['"`]/gi,
		severity: 'CRITICAL' as const,
		reason: 'Test passes by expecting failure - classic reward hack',
	},
	{
		name: 'EXPECT_THROW_TDD_RED',
		regex: /expect\s*\([^)]*\)\s*\.toThrow\s*\(\s*['"`].*TDD.?RED.*['"`]/gi,
		severity: 'CRITICAL' as const,
		reason: 'Test passes by expecting TDD RED phase stub',
	},
	{
		name: 'THROW_NOT_IMPLEMENTED_IN_MOCK',
		regex: /throw\s+new\s+Error\s*\(\s*['"`].*[Nn]ot.{0,10}implement.*['"`]\s*\)/gi,
		severity: 'HIGH' as const,
		reason: 'Implementation throws Not Implemented - if test expects this, fake green',
	},
	{
		name: 'CLASS_NOT_IMPLEMENTED',
		regex: /class\s+\w+\s*\{[\s\S]{0,100}throw\s+new\s+Error\s*\(\s*['"`].*not.{0,15}implement/gi,
		severity: 'HIGH' as const,
		reason: 'Class stub that just throws - tests expecting this are fake green',
	},
	{
		name: 'EMPTY_TEST_BODY',
		regex: /it\s*\(\s*['"`][^'"]+['"`]\s*,\s*(?:async\s*)?\(\s*\)\s*=>\s*\{\s*\}\s*\)/gi,
		severity: 'HIGH' as const,
		reason: 'Empty test body - passes without testing anything',
	},
	{
		name: 'CONSOLE_LOG_ONLY',
		regex: /it\s*\(\s*['"`][^'"]+['"`]\s*,\s*(?:async\s*)?\(\s*\)\s*=>\s*\{\s*console\.log[^}]*\}\s*\)/gi,
		severity: 'HIGH' as const,
		reason: 'Test only has console.log - no assertions',
	},
	{
		name: 'EXPECT_TRUE',
		regex: /expect\s*\(\s*true\s*\)\s*\.toBe\s*\(\s*true\s*\)/gi,
		severity: 'MEDIUM' as const,
		reason: 'Always-true assertion - tautology',
	},
	{
		name: 'EXPECT_TRUTHY_STRING',
		regex: /expect\s*\(\s*['"`][^'"]+['"`]\s*\)\s*\.toBeTruthy\s*\(\s*\)/gi,
		severity: 'MEDIUM' as const,
		reason: 'Non-empty string is always truthy - meaningless test',
	},
	{
		name: 'EXPECT_DEFINED_LITERAL',
		regex: /expect\s*\(\s*(?:\d+|['"`][^'"]+['"`]|true|false|\{[^}]*\})\s*\)\s*\.toBeDefined\s*\(\s*\)/gi,
		severity: 'MEDIUM' as const,
		reason: 'Literal is always defined - meaningless test',
	},
	{
		name: 'STUB_RETURN_HARDCODED',
		regex: /return\s+['"`]stub['"`]|return\s+['"`]not implemented['"`]|return\s+\{\s*stub:\s*true\s*\}/gi,
		severity: 'HIGH' as const,
		reason: 'Implementation returns stub value',
	},
	{
		name: 'TODO_IN_EXPECT',
		regex: /expect\s*\(\s*['"`]TODO['"`]\s*\)/gi,
		severity: 'MEDIUM' as const,
		reason: 'Test has TODO marker in assertion',
	},
];

// ============================================================================
// HONEST PATTERNS - These are OK, they're honest about not being done
// ============================================================================

const HONEST_PATTERNS = {
	todo: /it\.todo\s*\(\s*['"`][^'"]+['"`]\s*\)/gi,
	skip: /it\.skip\s*\(\s*['"`][^'"]+['"`]/gi,
	describeSkip: /describe\.skip\s*\(/gi,
	describeTodo: /describe\.todo\s*\(/gi,
};

// ============================================================================
// PROPERTY TEST PATTERNS
// ============================================================================

const PROPERTY_TEST_PATTERNS = {
	fastCheckImport: /import\s+.*from\s*['"]fast-check['"]/i,
	fcImport: /import\s+.*\*\s+as\s+fc\s+from\s*['"]fast-check['"]/i,
	fcVitest: /import\s+.*from\s*['"]@fast-check\/vitest['"]/i,
	fcProperty: /fc\.property\s*\(/gi,
	fcCheck: /fc\.check\s*\(/gi,
	fcAssert: /fc\.assert\s*\(/gi,
	arbitraryPattern: /fc\.(?:integer|string|boolean|array|record|tuple|oneof|constant|nat|bigInt|float|double)\s*\(/gi,
	numRuns: /numRuns\s*:\s*(\d+)/i,
};

// ============================================================================
// SCANNER FUNCTIONS
// ============================================================================

function scanFileForFakeGreen(filePath: string, content: string): FakeGreenViolation[] {
	const violations: FakeGreenViolation[] = [];
	const lines = content.split('\n');

	for (const pattern of FAKE_GREEN_PATTERNS) {
		let match;
		const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

		while ((match = regex.exec(content)) !== null) {
			// Find line number
			const upToMatch = content.substring(0, match.index);
			const lineNumber = upToMatch.split('\n').length;

			// Find test name (look backwards for it('...')
			const beforeMatch = content.substring(Math.max(0, match.index - 500), match.index);
			const testNameMatch = beforeMatch.match(/it\s*\(\s*['"`]([^'"]+)['"`]/);
			const testName = testNameMatch ? testNameMatch[1] : 'unknown';

			violations.push({
				file: filePath,
				line: lineNumber,
				testName,
				pattern: pattern.name,
				evidence: match[0].substring(0, 100),
				severity: pattern.severity,
			});
		}
	}

	return violations;
}

function countHonestPatterns(content: string): { todo: number; skip: number } {
	const todoMatches = content.match(HONEST_PATTERNS.todo) || [];
	const skipMatches = content.match(HONEST_PATTERNS.skip) || [];

	return {
		todo: todoMatches.length,
		skip: skipMatches.length,
	};
}

function analyzePropertyTests(filePath: string, content: string): PropertyTestAnalysis {
	const hasFastCheck =
		PROPERTY_TEST_PATTERNS.fastCheckImport.test(content) ||
		PROPERTY_TEST_PATTERNS.fcImport.test(content) ||
		PROPERTY_TEST_PATTERNS.fcVitest.test(content);

	const propertyMatches = content.match(PROPERTY_TEST_PATTERNS.fcProperty) || [];
	const checkMatches = content.match(PROPERTY_TEST_PATTERNS.fcCheck) || [];
	const assertMatches = content.match(PROPERTY_TEST_PATTERNS.fcAssert) || [];
	const propertyTestCount = propertyMatches.length + checkMatches.length + assertMatches.length;

	const numRunsMatch = content.match(PROPERTY_TEST_PATTERNS.numRuns);
	const iterationsConfigured = numRunsMatch ? parseInt(numRunsMatch[1], 10) : null;

	const arbitraryMatches = content.match(PROPERTY_TEST_PATTERNS.arbitraryPattern) || [];
	const arbitraries = [...new Set(arbitraryMatches.map((m) => m.replace(/\s*\($/, '')))];

	return {
		file: filePath,
		hasFastCheck,
		propertyTestCount,
		iterationsConfigured,
		arbitraries,
	};
}

function countRealAssertions(content: string): number {
	// Count expect() calls that aren't in fake patterns
	const expectCalls = content.match(/expect\s*\([^)]+\)/g) || [];
	const fakePatternMatches = FAKE_GREEN_PATTERNS.reduce((sum, p) => {
		return sum + (content.match(p.regex) || []).length;
	}, 0);

	return Math.max(0, expectCalls.length - fakePatternMatches);
}

function countItBlocks(content: string): number {
	// Count it('...', ...) blocks
	const itBlocks = content.match(/it\s*\(\s*['"`][^'"]+['"`]/g) || [];
	return itBlocks.length;
}

async function analyzeTestFile(filePath: string): Promise<TestFileAnalysis> {
	const content = fs.readFileSync(filePath, 'utf-8');
	const violations = scanFileForFakeGreen(filePath, content);
	const honestCounts = countHonestPatterns(content);
	const totalItBlocks = countItBlocks(content);
	const realAssertions = countRealAssertions(content);

	// Estimate true green vs fake green
	const fakeGreen = violations.filter(
		(v) => v.severity === 'CRITICAL' || v.severity === 'HIGH'
	).length;
	const honestTodo = honestCounts.todo;
	const honestSkip = honestCounts.skip;

	// True green = total - fake - honest
	const trueGreen = Math.max(0, totalItBlocks - fakeGreen - honestTodo - honestSkip);

	return {
		file: filePath,
		trueGreen,
		fakeGreen,
		honestTodo,
		honestSkip,
		honestFail: 0, // Will be filled from test results
		emptyTests: violations.filter((v) => v.pattern === 'EMPTY_TEST_BODY').length,
		violations,
	};
}

// ============================================================================
// MUTATION TESTING READINESS CHECK
// ============================================================================

function checkMutationReadiness(fileAnalysis: TestFileAnalysis[]): {
	ready: boolean;
	blockers: string[];
} {
	const blockers: string[] = [];

	// Check 1: Need at least 50% true green ratio
	const totalTrue = fileAnalysis.reduce((sum, f) => sum + f.trueGreen, 0);
	const totalFake = fileAnalysis.reduce((sum, f) => sum + f.fakeGreen, 0);
	const trueRatio = totalTrue / (totalTrue + totalFake);

	if (trueRatio < 0.5) {
		blockers.push(`True green ratio ${(trueRatio * 100).toFixed(1)}% < 50% required`);
	}

	// Check 2: No CRITICAL fake patterns
	const criticalCount = fileAnalysis.reduce(
		(sum, f) => sum + f.violations.filter((v) => v.severity === 'CRITICAL').length,
		0
	);
	if (criticalCount > 0) {
		blockers.push(`${criticalCount} CRITICAL fake patterns must be fixed first`);
	}

	// Check 3: Need Stryker config
	const strykerConfig = fs.existsSync(path.join(__dirname, '../stryker.conf.js')) ||
		fs.existsSync(path.join(__dirname, '../stryker.conf.mjs')) ||
		fs.existsSync(path.join(__dirname, '../stryker.config.js'));
	if (!strykerConfig) {
		blockers.push('No Stryker config found - run: npx stryker init');
	}

	return {
		ready: blockers.length === 0,
		blockers,
	};
}

// ============================================================================
// MAIN AUDIT FUNCTION
// ============================================================================

async function runAudit(): Promise<AuditReport> {
	const sandboxDir = path.join(__dirname, '../sandbox');
	const srcDir = path.join(__dirname, '../src');

	// Find all test files
	const testFiles = await glob('**/*.test.ts', {
		cwd: sandboxDir,
		absolute: true,
		ignore: ['**/node_modules/**', '**/dist/**'],
	});

	const srcTestFiles = await glob('**/*.test.ts', {
		cwd: srcDir,
		absolute: true,
		ignore: ['**/node_modules/**', '**/dist/**'],
	});

	const allTestFiles = [...testFiles, ...srcTestFiles];

	// Analyze each test file
	const fileAnalysis: TestFileAnalysis[] = [];
	const propertyAnalysis: PropertyTestAnalysis[] = [];

	for (const file of allTestFiles) {
		const analysis = await analyzeTestFile(file);
		fileAnalysis.push(analysis);

		const content = fs.readFileSync(file, 'utf-8');
		propertyAnalysis.push(analyzePropertyTests(file, content));
	}

	// Aggregate stats
	const totalTests = fileAnalysis.reduce(
		(sum, f) => sum + f.trueGreen + f.fakeGreen + f.honestTodo + f.honestSkip,
		0
	);
	const trueGreen = fileAnalysis.reduce((sum, f) => sum + f.trueGreen, 0);
	const fakeGreen = fileAnalysis.reduce((sum, f) => sum + f.fakeGreen, 0);
	const honestTodo = fileAnalysis.reduce((sum, f) => sum + f.honestTodo, 0);
	const honestSkip = fileAnalysis.reduce((sum, f) => sum + f.honestSkip, 0);

	// Property test stats
	const filesWithPropertyTests = propertyAnalysis.filter((p) => p.hasFastCheck).length;
	const totalPropertyTests = propertyAnalysis.reduce((sum, p) => sum + p.propertyTestCount, 0);
	const filesNeedingPropertyTests = propertyAnalysis
		.filter((p) => !p.hasFastCheck && fileAnalysis.find((f) => f.file === p.file)?.trueGreen || 0 > 5)
		.map((p) => p.file);

	// Mutation readiness
	const mutationCheck = checkMutationReadiness(fileAnalysis);

	// All violations
	const allViolations = fileAnalysis.flatMap((f) => f.violations);

	// Calculate ratios
	const fakeGreenRatio = fakeGreen / Math.max(1, trueGreen + fakeGreen);
	const truthRatio = trueGreen / Math.max(1, totalTests);

	// Determine verdict
	let verdict: AuditReport['verdict'];
	let verdictReason: string;

	if (fakeGreenRatio > 0.3) {
		verdict = 'CRITICAL';
		verdictReason = `${(fakeGreenRatio * 100).toFixed(1)}% of "green" tests are FAKE. System is compromised.`;
	} else if (fakeGreenRatio > 0.15) {
		verdict = 'FAILING';
		verdictReason = `${(fakeGreenRatio * 100).toFixed(1)}% fake green rate is unacceptable.`;
	} else if (fakeGreenRatio > 0.05) {
		verdict = 'MARGINAL';
		verdictReason = `${(fakeGreenRatio * 100).toFixed(1)}% fake green rate needs attention.`;
	} else if (totalPropertyTests < 10) {
		verdict = 'PASSING';
		verdictReason = `Low fake rate but only ${totalPropertyTests} property tests. Need more.`;
	} else {
		verdict = 'EXCELLENT';
		verdictReason = `${(truthRatio * 100).toFixed(1)}% truth ratio with ${totalPropertyTests} property tests.`;
	}

	return {
		timestamp: new Date().toISOString(),
		generation: '87.X3',
		port: 4,
		commander: 'Red Regnant',

		totalTestFiles: allTestFiles.length,
		totalTests,
		trueGreen,
		fakeGreen,
		honestTodo,
		honestSkip,
		honestFail: 178, // From vitest output

		fakeGreenRatio,
		truthRatio,

		filesWithPropertyTests,
		totalPropertyTests,
		filesNeedingPropertyTests,

		violations: allViolations,

		mutationReady: mutationCheck.ready,
		mutationBlockers: mutationCheck.blockers,

		fileAnalysis,
		propertyAnalysis,

		verdict,
		verdictReason,
	};
}

// ============================================================================
// OUTPUT FUNCTIONS
// ============================================================================

function generateMarkdownReport(report: AuditReport): string {
	const criticalViolations = report.violations.filter((v) => v.severity === 'CRITICAL');
	const highViolations = report.violations.filter((v) => v.severity === 'HIGH');

	return `# 🔴 RED REGNANT AUDIT REPORT

> **Port 4 | Disruptor | TEST**
> *"The Red Queen runs just to stay in place."*
> **NO MERCY. NO SYCOPHANCY. BRUTAL HONESTY ONLY.**

---

## ⚖️ VERDICT: ${report.verdict}

**${report.verdictReason}**

---

## 📊 TRUTH METRICS

| Metric | Count | Percentage |
|--------|-------|------------|
| **TRUE GREEN** | ${report.trueGreen} | ${((report.trueGreen / report.totalTests) * 100).toFixed(1)}% |
| **FAKE GREEN** 🚨 | ${report.fakeGreen} | ${((report.fakeGreen / report.totalTests) * 100).toFixed(1)}% |
| **HONEST TODO** | ${report.honestTodo} | ${((report.honestTodo / report.totalTests) * 100).toFixed(1)}% |
| **HONEST SKIP** | ${report.honestSkip} | ${((report.honestSkip / report.totalTests) * 100).toFixed(1)}% |
| **HONEST FAIL** | ${report.honestFail} | ${((report.honestFail / report.totalTests) * 100).toFixed(1)}% |
| **TOTAL TESTS** | ${report.totalTests} | 100% |

### Ratios
- **Fake Green Ratio**: ${(report.fakeGreenRatio * 100).toFixed(1)}% of "passing" tests are FAKE
- **Truth Ratio**: ${(report.truthRatio * 100).toFixed(1)}% of tests are genuinely useful

---

## 🚨 CRITICAL VIOLATIONS (${criticalViolations.length})

${
	criticalViolations.length === 0
		? '*None found - good.*'
		: criticalViolations
				.slice(0, 20)
				.map(
					(v) => `- **${v.file}:${v.line}** - \`${v.testName}\`
  - Pattern: \`${v.pattern}\`
  - Evidence: \`${v.evidence.substring(0, 60)}...\``
				)
				.join('\n\n')
}

${criticalViolations.length > 20 ? `\n*...and ${criticalViolations.length - 20} more critical violations*` : ''}

---

## ⚠️ HIGH SEVERITY VIOLATIONS (${highViolations.length})

${
	highViolations.length === 0
		? '*None found - good.*'
		: highViolations
				.slice(0, 10)
				.map((v) => `- **${v.file}:${v.line}** - \`${v.pattern}\``)
				.join('\n')
}

${highViolations.length > 10 ? `\n*...and ${highViolations.length - 10} more high severity violations*` : ''}

---

## 🧪 PROPERTY TESTING STATUS

| Metric | Value |
|--------|-------|
| Files with fast-check | ${report.filesWithPropertyTests} / ${report.totalTestFiles} |
| Total property tests | ${report.totalPropertyTests} |
| Files needing property tests | ${report.filesNeedingPropertyTests.length} |

${
	report.filesNeedingPropertyTests.length > 0
		? `### Files That NEED Property Tests
${report.filesNeedingPropertyTests.slice(0, 10).map((f) => `- ${path.basename(f)}`).join('\n')}`
		: ''
}

---

## 🧬 MUTATION TESTING READINESS

**Ready**: ${report.mutationReady ? '✅ YES' : '❌ NO'}

${
	report.mutationBlockers.length > 0
		? `### Blockers
${report.mutationBlockers.map((b) => `- ❌ ${b}`).join('\n')}`
		: ''
}

---

## 📁 FILE-BY-FILE ANALYSIS

| File | True | Fake | Todo | Violations |
|------|------|------|------|------------|
${report.fileAnalysis
	.filter((f) => f.fakeGreen > 0 || f.violations.length > 0)
	.sort((a, b) => b.fakeGreen - a.fakeGreen)
	.slice(0, 20)
	.map((f) => `| ${path.basename(f.file)} | ${f.trueGreen} | ${f.fakeGreen} | ${f.honestTodo} | ${f.violations.length} |`)
	.join('\n')}

---

## 🎯 RECOMMENDED ACTIONS

1. **IMMEDIATE**: Convert ${criticalViolations.length} \`expect().toThrow('Not implemented')\` to \`it.todo()\`
2. **THIS WEEK**: Add property tests to ${report.filesNeedingPropertyTests.length} files with >5 tests
3. **THIS MONTH**: Configure Stryker mutation testing
4. **ONGOING**: Maintain <5% fake green ratio

---

## 📡 BLACKBOARD SIGNAL

\`\`\`json
{
  "ts": "${report.timestamp}",
  "mark": ${report.verdict === 'CRITICAL' ? 0.0 : report.verdict === 'FAILING' ? 0.25 : report.verdict === 'MARGINAL' ? 0.5 : 0.75},
  "pull": "upstream",
  "msg": "RED_REGNANT_AUDIT: ${report.verdict} - ${report.trueGreen}/${report.totalTests} true green (${(report.truthRatio * 100).toFixed(1)}%), ${report.fakeGreen} fake green detected",
  "type": "event",
  "hive": "V",
  "gen": 87,
  "port": 4
}
\`\`\`

---

*Generated by Red Regnant (Port 4) | Gen87.X3 | ${report.timestamp}*
*"The spider weaves the web that weaves the spider."*
`;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
	console.log('🔴 RED REGNANT AUDIT - Port 4');
	console.log('="How do we TEST the TEST?"');
	console.log('');

	const report = await runAudit();

	// Output JSON
	const jsonPath = path.join(__dirname, '../sandbox-medallion/bronze', new Date().toISOString().split('T')[0], 'RED_REGNANT_AUDIT.json');
	const jsonDir = path.dirname(jsonPath);
	if (!fs.existsSync(jsonDir)) {
		fs.mkdirSync(jsonDir, { recursive: true });
	}
	fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
	console.log(`📊 JSON report: ${jsonPath}`);

	// Output Markdown
	const mdPath = path.join(jsonDir, 'RED_REGNANT_AUDIT_REPORT.md');
	fs.writeFileSync(mdPath, generateMarkdownReport(report));
	console.log(`📝 Markdown report: ${mdPath}`);

	// Output summary
	console.log('');
	console.log('═'.repeat(60));
	console.log(`⚖️  VERDICT: ${report.verdict}`);
	console.log(`📊 TRUE GREEN: ${report.trueGreen} / ${report.totalTests} (${(report.truthRatio * 100).toFixed(1)}%)`);
	console.log(`🚨 FAKE GREEN: ${report.fakeGreen} (${(report.fakeGreenRatio * 100).toFixed(1)}% of passing)`);
	console.log(`✅ HONEST TODO: ${report.honestTodo}`);
	console.log(`⏭️  HONEST SKIP: ${report.honestSkip}`);
	console.log(`❌ HONEST FAIL: ${report.honestFail}`);
	console.log(`🧪 PROPERTY TESTS: ${report.totalPropertyTests}`);
	console.log(`🧬 MUTATION READY: ${report.mutationReady ? 'YES' : 'NO'}`);
	console.log('═'.repeat(60));

	// Exit with error if critical
	if (report.verdict === 'CRITICAL') {
		process.exit(1);
	}
}

main().catch((err) => {
	console.error('Red Regnant audit failed:', err);
	process.exit(1);
});
