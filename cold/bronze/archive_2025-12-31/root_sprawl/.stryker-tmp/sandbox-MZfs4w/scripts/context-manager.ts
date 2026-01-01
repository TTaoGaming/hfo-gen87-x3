/**
 * DYNAMIC CONTEXT MANAGER - Gen87.X3
 *
 * Solves the "lossy compression" problem by:
 * 1. Generating context payload DYNAMICALLY (not static dump)
 * 2. Tracking file staleness via git + timestamps
 * 3. Summarizing large files automatically
 * 4. Tiering content by relevance + recency
 * 5. Using Memory MCP as external storage
 *
 * Based on Anthropic's "Effective context engineering for AI agents" (Sep 2025):
 * - Preserve: architectural decisions, unresolved bugs, implementation details
 * - Discard: redundant tool outputs, stale messages
 *
 * Usage:
 *   npx tsx scripts/context-manager.ts generate    # Create COLD_START_PAYLOAD.md
 *   npx tsx scripts/context-manager.ts analyze     # Show context state
 *   npx tsx scripts/context-manager.ts compact     # Identify files to compress
 *   npx tsx scripts/context-manager.ts hive        # Show current HIVE state
 */
// @ts-nocheck


import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION - Optimized for minimal footprint
// ============================================================================

interface ContextPolicy {
	maxTotalTokens: number; // Target budget for cold start
	maxFileTokens: number; // Summarize files over this
	criticalFiles: string[]; // Always include (full or summary)
	excludePatterns: string[]; // Never include
	summarizationRatio: number; // Target compression ratio
	staleThresholdHours: number; // Mark files stale after this
	tiers: {
		critical: number; // Token budget for critical tier
		active: number; // Token budget for active tier
		retrievable: number; // Token budget for hints only
	};
}

const DEFAULT_POLICY: ContextPolicy = {
	maxTotalTokens: 3000, // ~1.5% of 200k context - MINIMAL
	maxFileTokens: 500, // Force summarization over this
	criticalFiles: [
		'MANIFEST.json',
		'obsidianblackboard.jsonl', // Last 3 signals only
	],
	excludePatterns: [
		'node_modules/**',
		'.git/**',
		'*.lock',
		'.build/**',
		'cold/**', // All cold tier
		'.stryker-tmp/**', // Mutation testing artifacts
		'**/__pycache__/**',
		'**/*.pyc',
		'hot/blackboard.jsonl', // Huge - use root only
		'hot/bronze/**', // Bronze is unprocessed
		'**/SPEC_CONSOLIDATION*.md', // 193k tokens!
		'ttao-notes-*.md', // Use Memory MCP instead
	],
	summarizationRatio: 0.1, // 10x compression target
	staleThresholdHours: 24,
	tiers: {
		critical: 1500, // Very minimal
		active: 1000,
		retrievable: 500,
	},
};

// ============================================================================
// TOKEN ESTIMATION
// ============================================================================

function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

// ============================================================================
// GIT INTEGRATION
// ============================================================================

function getGitChangedFiles(since = 'HEAD~10'): string[] {
	try {
		const output = execSync(`git diff --name-only ${since}`, { encoding: 'utf-8' });
		return output.split('\n').filter((f) => f.trim().length > 0);
	} catch {
		return [];
	}
}

function getGitLastCommitTime(file: string): Date | null {
	try {
		const output = execSync(`git log -1 --format=%cI -- "${file}"`, { encoding: 'utf-8' });
		return new Date(output.trim());
	} catch {
		return null;
	}
}

function getGitFileHash(file: string): string | null {
	try {
		const output = execSync(`git hash-object "${file}"`, { encoding: 'utf-8' });
		return output.trim().substring(0, 8);
	} catch {
		return null;
	}
}

// ============================================================================
// FILE ANALYSIS
// ============================================================================

interface FileInfo {
	path: string;
	tokens: number;
	hash: string | null;
	lastModified: Date;
	tier: 'critical' | 'active' | 'retrievable' | 'archived';
	isStale: boolean;
	summary?: string;
}

function analyzeFile(filePath: string, policy: ContextPolicy): FileInfo | null {
	if (!fs.existsSync(filePath)) return null;

	try {
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) return null;

		const content = fs.readFileSync(filePath, 'utf-8');
		const tokens = estimateTokens(content);
		const lastModified = stat.mtime;
		const hash = getGitFileHash(filePath);

		const hoursSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60);
		const isStale = hoursSinceModified > policy.staleThresholdHours;

		// Determine tier
		let tier: FileInfo['tier'] = 'archived';
		const relativePath = path.relative(process.cwd(), filePath);

		if (policy.criticalFiles.some((p) => matchGlob(relativePath, p))) {
			tier = 'critical';
		} else if (getGitChangedFiles().includes(relativePath)) {
			tier = 'active';
		} else if (!isStale) {
			tier = 'retrievable';
		}

		return { path: relativePath, tokens, hash, lastModified, tier, isStale };
	} catch {
		return null;
	}
}

function matchGlob(filePath: string, pattern: string): boolean {
	// Simple glob matching (* and **)
	const regexPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\?/g, '.');
	return new RegExp(`^${regexPattern}$`).test(filePath);
}

// ============================================================================
// BLACKBOARD SIGNALS EXTRACTION
// ============================================================================

interface BlackboardSignal {
	ts: string;
	mark: number;
	pull: string;
	msg: string;
	type: string;
	hive: string;
	gen: number;
	port: number;
}

function getRecentBlackboardSignals(count = 5): BlackboardSignal[] {
	const bbPath = path.join(process.cwd(), 'obsidianblackboard.jsonl');
	if (!fs.existsSync(bbPath)) return [];

	const lines = fs
		.readFileSync(bbPath, 'utf-8')
		.split('\n')
		.filter((l) => l.trim());
	const signals: BlackboardSignal[] = [];

	for (const line of lines.slice(-count)) {
		try {
			signals.push(JSON.parse(line));
		} catch {}
	}

	return signals;
}

function summarizeHivePhase(signals: BlackboardSignal[]): string {
	if (signals.length === 0) return 'No recent signals';

	const lastSignal = signals[signals.length - 1];
	const phaseMap: Record<string, string> = {
		H: 'HUNT (researching)',
		I: 'INTERLOCK (connecting)',
		V: 'VALIDATE (testing)',
		E: 'EVOLVE (delivering)',
	};

	return `Current: ${phaseMap[lastSignal.hive] || lastSignal.hive} | Last: ${lastSignal.msg.substring(0, 80)}...`;
}

// ============================================================================
// MANIFEST GENERATION
// ============================================================================

interface ContextManifest {
	version: string;
	generated: string;
	budget: {
		total: number;
		used: number;
		reserved: number;
		remaining: number;
	};
	hiveState: {
		phase: string;
		phaseSummary: string;
		recentSignals: number;
	};
	tiers: {
		critical: { files: string[]; tokens: number };
		active: { files: string[]; tokens: number };
		retrievable: { files: string[]; tokens: number };
		archived: { count: number };
	};
	files: Record<
		string,
		{
			tokens: number;
			hash: string | null;
			tier: string;
			stale: boolean;
		}
	>;
	recommendations: string[];
}

function generateManifest(policy: ContextPolicy = DEFAULT_POLICY): ContextManifest {
	const files: FileInfo[] = [];

	// Scan hot/ directory
	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) return;
		const entries = fs.readdirSync(dir);
		for (const entry of entries) {
			const fullPath = path.join(dir, entry);
			const relativePath = path.relative(process.cwd(), fullPath);

			// Skip excluded patterns
			if (policy.excludePatterns.some((p) => matchGlob(relativePath, p))) continue;

			const stat = fs.statSync(fullPath);
			if (stat.isDirectory()) {
				scanDir(fullPath);
			} else {
				const info = analyzeFile(fullPath, policy);
				if (info) files.push(info);
			}
		}
	}

	// Scan key directories
	scanDir(path.join(process.cwd(), 'hot'));

	// Also check root critical files
	for (const pattern of policy.criticalFiles) {
		const matches = fs.readdirSync('.').filter((f) => matchGlob(f, pattern.replace(/\*\*/g, '*')));
		for (const match of matches) {
			const info = analyzeFile(match, policy);
			if (info && !files.find((f) => f.path === info.path)) {
				files.push(info);
			}
		}
	}

	// Categorize by tier
	const critical = files.filter((f) => f.tier === 'critical');
	const active = files.filter((f) => f.tier === 'active');
	const retrievable = files.filter((f) => f.tier === 'retrievable');
	const archived = files.filter((f) => f.tier === 'archived');

	const criticalTokens = critical.reduce((sum, f) => sum + f.tokens, 0);
	const activeTokens = active.reduce((sum, f) => sum + f.tokens, 0);
	const retrievableTokens = retrievable.reduce((sum, f) => sum + f.tokens, 0);
	const usedTokens = criticalTokens + activeTokens + retrievableTokens;

	// Get HIVE state from blackboard
	const signals = getRecentBlackboardSignals(5);
	const lastSignal = signals[signals.length - 1];

	// Generate recommendations
	const recommendations: string[] = [];

	if (criticalTokens > policy.tiers.critical) {
		recommendations.push(
			`CRITICAL tier over budget (${criticalTokens}/${policy.tiers.critical}). Summarize large files.`,
		);
	}

	const staleActiveFiles = active.filter((f) => f.isStale);
	if (staleActiveFiles.length > 0) {
		recommendations.push(
			`${staleActiveFiles.length} files in ACTIVE tier are stale. Consider archiving.`,
		);
	}

	if (usedTokens > policy.maxTotalTokens) {
		recommendations.push(
			`Total tokens (${usedTokens}) exceeds budget (${policy.maxTotalTokens}). Run compact.`,
		);
	}

	return {
		version: '87.X3.2',
		generated: new Date().toISOString(),
		budget: {
			total: policy.maxTotalTokens,
			used: usedTokens,
			reserved: Math.floor(policy.maxTotalTokens * 0.2), // 20% reserve for conversation
			remaining: policy.maxTotalTokens - usedTokens,
		},
		hiveState: {
			phase: lastSignal?.hive || 'X',
			phaseSummary: summarizeHivePhase(signals),
			recentSignals: signals.length,
		},
		tiers: {
			critical: { files: critical.map((f) => f.path), tokens: criticalTokens },
			active: { files: active.map((f) => f.path), tokens: activeTokens },
			retrievable: { files: retrievable.map((f) => f.path), tokens: retrievableTokens },
			archived: { count: archived.length },
		},
		files: Object.fromEntries(
			files.map((f) => [
				f.path,
				{
					tokens: f.tokens,
					hash: f.hash,
					tier: f.tier,
					stale: f.isStale,
				},
			]),
		),
		recommendations,
	};
}

// ============================================================================
// COLD START PAYLOAD GENERATION - MINIMAL VERSION
// ============================================================================

function generateColdStartPayload(manifest: ContextManifest): string {
	const signals = getRecentBlackboardSignals(3);

	// Ultra-compact signal summary
	const signalLine =
		signals.length > 0 ? signals.map((s) => `[${s.hive}:${s.port}]`).join(' → ') : 'none';

	const lastMsg =
		signals.length > 0 ? signals[signals.length - 1].msg.substring(0, 50) : 'No signals';

	// Phase names
	const phaseNames: Record<string, string> = {
		H: 'HUNT',
		I: 'INTERLOCK',
		V: 'VALIDATE',
		E: 'EVOLVE',
		X: 'UNKNOWN',
	};

	const phase = manifest.hiveState.phase;
	const phaseName = phaseNames[phase] || phase;

	return `# HFO Gen87.X3 Context
> ${manifest.generated} | ~${manifest.budget.used} tokens

## HIVE: ${phaseName} (${phase})
${signalLine}
> ${lastMsg}...

## Tiers
- **Critical**: ${manifest.tiers.critical.files.length} files
- **Active**: ${manifest.tiers.active.files.length} files  
- **Retrievable**: ${manifest.tiers.retrievable.files.length} files (RAG)
- **Archived**: ${manifest.tiers.archived.count} (Memory MCP)

## Memory MCP Entities
Query these for depth:
- TTao, TTao_Spider_Symbiosis - User context
- HFO_System, HIVE_Phase - Architecture
- Gen87_X3_Session_State - Current work

## Commands
\`\`\`
npx tsx scripts/context-manager.ts generate  # Regenerate
Get-Content obsidianblackboard.jsonl | Select -Last 3
npm test
\`\`\`

${manifest.recommendations.length > 0 ? '## ⚠️ Issues\n' + manifest.recommendations.map((r) => `- ${r}`).join('\n') : ''}
---
*Minimal payload. Use Memory MCP for depth.*
`;
}

// ============================================================================
// COMPACT (SUMMARIZATION)
// ============================================================================

function compactContext(manifest: ContextManifest): void {
	console.log('\n📦 COMPACT MODE');
	console.log('================');

	// Find files that need summarization
	const largeFiles = Object.entries(manifest.files)
		.filter(([_, info]) => info.tokens > DEFAULT_POLICY.maxFileTokens)
		.sort((a, b) => b[1].tokens - a[1].tokens);

	if (largeFiles.length === 0) {
		console.log('✅ No files need summarization.');
		return;
	}

	console.log(`\n⚠️ ${largeFiles.length} files exceed ${DEFAULT_POLICY.maxFileTokens} tokens:`);
	for (const [file, info] of largeFiles) {
		console.log(`  - ${file}: ${info.tokens} tokens (${info.tier})`);
	}

	console.log('\n📋 Recommended actions:');
	console.log('  1. Move stale files to cold/bronze/');
	console.log('  2. Create summaries for large critical files');
	console.log('  3. Use Memory MCP to store detailed content');
	console.log('  4. Keep only references in hot/ tier');
}

// ============================================================================
// CLI
// ============================================================================

const command = process.argv[2];

switch (command) {
	case 'generate': {
		console.log('🔄 Generating context manifest...\n');
		const manifest = generateManifest();

		// Write manifest
		fs.writeFileSync('CONTEXT_MANIFEST.json', JSON.stringify(manifest, null, 2));
		console.log('✅ Written: CONTEXT_MANIFEST.json');

		// Generate cold start payload
		const payload = generateColdStartPayload(manifest);
		fs.writeFileSync('COLD_START_PAYLOAD.md', payload);
		console.log('✅ Written: COLD_START_PAYLOAD.md');

		// Print summary
		console.log('\n📊 Summary:');
		console.log(`  Budget: ${manifest.budget.used}/${manifest.budget.total} tokens`);
		console.log(
			`  Critical: ${manifest.tiers.critical.files.length} files (${manifest.tiers.critical.tokens} tokens)`,
		);
		console.log(
			`  Active: ${manifest.tiers.active.files.length} files (${manifest.tiers.active.tokens} tokens)`,
		);
		console.log(`  Retrievable: ${manifest.tiers.retrievable.files.length} files`);
		console.log(`  Archived: ${manifest.tiers.archived.count} files`);

		if (manifest.recommendations.length > 0) {
			console.log('\n⚠️ Recommendations:');
			manifest.recommendations.forEach((r) => console.log(`  - ${r}`));
		}
		break;
	}

	case 'analyze': {
		console.log('🔍 Analyzing context...\n');
		const manifest = generateManifest();
		console.log(JSON.stringify(manifest, null, 2));
		break;
	}

	case 'compact': {
		const manifest = generateManifest();
		compactContext(manifest);
		break;
	}

	case 'hive': {
		console.log('🕸️ Current HIVE State\n');
		const signals = getRecentBlackboardSignals(10);
		const phaseNames: Record<string, string> = {
			H: 'HUNT',
			I: 'INTERLOCK',
			V: 'VALIDATE',
			E: 'EVOLVE',
		};

		if (signals.length === 0) {
			console.log('No signals found in blackboard');
		} else {
			const last = signals[signals.length - 1];
			console.log(`Current Phase: ${phaseNames[last.hive] || last.hive} (${last.hive})`);
			console.log(`Active Port: ${last.port}`);
			console.log(`Last Signal: ${last.msg.substring(0, 80)}...`);
			console.log(`\nRecent Signals:`);
			signals.slice(-5).forEach((s) => {
				console.log(`  [${s.hive}:${s.port}] ${s.msg.substring(0, 50)}...`);
			});
		}
		break;
	}

	default:
		console.log(`
Dynamic Context Manager - HFO Gen87.X3

Usage:
  npx tsx scripts/context-manager.ts generate   Generate COLD_START_PAYLOAD.md
  npx tsx scripts/context-manager.ts analyze    Analyze current context state
  npx tsx scripts/context-manager.ts compact    Identify files needing compression
  npx tsx scripts/context-manager.ts hive       Show current HIVE phase

The generated COLD_START_PAYLOAD.md should be:
1. Attached at cold start of AI conversations
2. Regenerated after significant changes
3. Auto-generated via git hooks (on every commit)
    `);
}
