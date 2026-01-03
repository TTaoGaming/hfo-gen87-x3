#!/usr/bin/env npx tsx
/**
 * Web Weaver Quality Gate Checker
 * Port 1 - Bridger - FUSE verb
 *
 * Usage:
 *   npm run weaver:check one-euro
 *   npm run weaver:check rapier-physics
 *   npm run weaver:check -- --all
 *
 * This script runs quality gates on adapters:
 * 1. Unit tests (vitest)
 * 2. Mutation tests (stryker)
 * 3. Updates WEAVER_MANIFEST.json with results
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface GateResult {
	pass: number;
	fail: number;
	todo?: number;
	checked: string;
}

interface MutationResult {
	score: number;
	killed: number;
	survived: number;
	checked: string | null;
	error?: string;
}

interface AdapterEntry {
	name: string;
	port: string;
	source: string;
	tests: string;
	status: 'BRONZE' | 'TESTING' | 'SILVER_READY' | 'SILVER';
	gates: {
		unitTests: GateResult;
		mutation: MutationResult;
	};
	npmPackage: string | null;
	description: string;
}

interface WeaverManifest {
	version: string;
	thresholds: {
		unitTestsPass: boolean;
		mutationScore: number;
		propertyTests: number;
	};
	adapters: Record<string, AdapterEntry>;
	promotionQueue: Array<{ adapter: string; priority: string; reason: string }>;
}

const MANIFEST_PATH = resolve(process.cwd(), 'WEAVER_MANIFEST.json');
const MUTATION_THRESHOLD = 60;

function loadManifest(): WeaverManifest {
	const content = readFileSync(MANIFEST_PATH, 'utf-8');
	return JSON.parse(content);
}

function saveManifest(manifest: WeaverManifest): void {
	writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function runUnitTests(testPath: string): GateResult {
	console.log(`\n🧪 Running unit tests: ${testPath}`);
	try {
		const output = execSync(`npx vitest run "${testPath}" --reporter=json`, {
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		// Parse vitest JSON output
		const jsonMatch = output.match(/\{[\s\S]*"numPassedTests"[\s\S]*\}/);
		if (jsonMatch) {
			const result = JSON.parse(jsonMatch[0]);
			return {
				pass: result.numPassedTests || 0,
				fail: result.numFailedTests || 0,
				todo: result.numTodoTests || 0,
				checked: new Date().toISOString().split('T')[0],
			};
		}
	} catch (error: unknown) {
		// Even on failure, try to extract numbers from output
		const err = error as { stdout?: string; stderr?: string };
		const stdout = err.stdout || '';
		const passMatch = stdout.match(/(\d+) passed/);
		const failMatch = stdout.match(/(\d+) failed/);
		return {
			pass: passMatch ? Number.parseInt(passMatch[1], 10) : 0,
			fail: failMatch ? Number.parseInt(failMatch[1], 10) : 1,
			checked: new Date().toISOString().split('T')[0],
		};
	}
	return { pass: 0, fail: 1, checked: new Date().toISOString().split('T')[0] };
}

function runMutationTests(sourcePath: string): MutationResult {
	console.log(`\n🧬 Running mutation tests: ${sourcePath}`);
	try {
		const output = execSync(
			`npx stryker run --mutate "${sourcePath}" --concurrency 2 --reporters clear-text,json`,
			{
				encoding: 'utf-8',
				stdio: ['pipe', 'pipe', 'pipe'],
				timeout: 300000, // 5 minute timeout
			},
		);

		// Try to parse mutation score from output
		const scoreMatch = output.match(/Mutation score[:\s]+(\d+\.?\d*)%/i);
		const killedMatch = output.match(/Killed[:\s]+(\d+)/i);
		const survivedMatch = output.match(/Survived[:\s]+(\d+)/i);

		if (scoreMatch) {
			return {
				score: Number.parseFloat(scoreMatch[1]),
				killed: killedMatch ? Number.parseInt(killedMatch[1], 10) : 0,
				survived: survivedMatch ? Number.parseInt(survivedMatch[1], 10) : 0,
				checked: new Date().toISOString().split('T')[0],
			};
		}
	} catch (error: unknown) {
		const err = error as { message?: string };
		console.log(`⚠️ Mutation test error: ${err.message?.slice(0, 100)}`);
		return {
			score: 0,
			killed: 0,
			survived: 0,
			checked: null,
			error: 'Stryker execution failed',
		};
	}
	return {
		score: 0,
		killed: 0,
		survived: 0,
		checked: null,
		error: 'Could not parse results',
	};
}

function determineStatus(
	unitTests: GateResult,
	mutation: MutationResult,
	threshold: number,
): 'BRONZE' | 'TESTING' | 'SILVER_READY' {
	// Must have passing unit tests
	if (unitTests.fail > 0) return 'BRONZE';

	// Must have mutation testing run
	if (!mutation.checked) return 'BRONZE';

	// Must meet mutation threshold
	if (mutation.score >= threshold) return 'SILVER_READY';

	return 'TESTING';
}

function checkAdapter(adapterKey: string, manifest: WeaverManifest): boolean {
	const adapter = manifest.adapters[adapterKey];
	if (!adapter) {
		console.error(`❌ Unknown adapter: ${adapterKey}`);
		console.log('Available adapters:', Object.keys(manifest.adapters).join(', '));
		return false;
	}

	console.log(`\n${'═'.repeat(60)}`);
	console.log(`🕸️  WEB WEAVER QUALITY GATE: ${adapter.name}`);
	console.log(`${'═'.repeat(60)}`);
	console.log(`Port: ${adapter.port}`);
	console.log(`Source: ${adapter.source}`);
	console.log(`Tests: ${adapter.tests}`);

	// Run unit tests
	const unitTests = runUnitTests(adapter.tests);
	adapter.gates.unitTests = unitTests;
	console.log(`\n✅ Unit Tests: ${unitTests.pass} pass, ${unitTests.fail} fail`);

	// Run mutation tests (only if unit tests pass)
	if (unitTests.fail === 0) {
		const mutation = runMutationTests(adapter.source);
		adapter.gates.mutation = mutation;

		if (mutation.checked) {
			const emoji = mutation.score >= MUTATION_THRESHOLD ? '✅' : '⚠️';
			console.log(
				`\n${emoji} Mutation Score: ${mutation.score.toFixed(1)}% (threshold: ${MUTATION_THRESHOLD}%)`,
			);
			console.log(`   Killed: ${mutation.killed}, Survived: ${mutation.survived}`);
		} else {
			console.log(`\n❌ Mutation test failed: ${mutation.error}`);
		}
	} else {
		console.log('\n⏭️ Skipping mutation tests (unit tests failed)');
	}

	// Determine new status
	const newStatus = determineStatus(unitTests, adapter.gates.mutation, MUTATION_THRESHOLD);
	const statusChanged = adapter.status !== newStatus && adapter.status !== 'SILVER';

	if (statusChanged) {
		console.log(`\n📊 Status: ${adapter.status} → ${newStatus}`);
		adapter.status = newStatus;
	} else {
		console.log(`\n📊 Status: ${adapter.status}`);
	}

	// Final verdict
	console.log(`\n${'─'.repeat(60)}`);
	if (newStatus === 'SILVER_READY') {
		console.log('🎉 VERDICT: PASSED - Ready for Silver promotion!');
		console.log(`   Run: npm run weaver:promote ${adapterKey}`);
	} else if (newStatus === 'TESTING') {
		console.log(
			`⚠️ VERDICT: NEEDS WORK - Mutation score ${adapter.gates.mutation.score.toFixed(1)}% < ${MUTATION_THRESHOLD}%`,
		);
	} else {
		console.log('❌ VERDICT: FAILED - Fix issues before promotion');
	}
	console.log(`${'─'.repeat(60)}\n`);

	return newStatus === 'SILVER_READY';
}

function printStatus(manifest: WeaverManifest): void {
	console.log(`\n${'═'.repeat(60)}`);
	console.log('🕸️  WEB WEAVER MANIFEST STATUS');
	console.log(`${'═'.repeat(60)}\n`);

	const statusGroups: Record<string, string[]> = {
		SILVER: [],
		SILVER_READY: [],
		TESTING: [],
		BRONZE: [],
	};

	for (const [key, adapter] of Object.entries(manifest.adapters)) {
		const mutScore = adapter.gates.mutation.score;
		const tests = adapter.gates.unitTests.pass;
		statusGroups[adapter.status].push(
			`  ${key.padEnd(20)} ${adapter.port.padEnd(15)} ${tests} tests  ${mutScore > 0 ? `${mutScore.toFixed(0)}%` : '—'}`,
		);
	}

	if (statusGroups.SILVER.length > 0) {
		console.log('🥈 SILVER (Promoted):');
		statusGroups.SILVER.forEach((s) => console.log(s));
		console.log();
	}

	if (statusGroups.SILVER_READY.length > 0) {
		console.log('✅ SILVER_READY (Can promote):');
		statusGroups.SILVER_READY.forEach((s) => console.log(s));
		console.log();
	}

	if (statusGroups.TESTING.length > 0) {
		console.log('⚠️ TESTING (Needs mutation work):');
		statusGroups.TESTING.forEach((s) => console.log(s));
		console.log();
	}

	if (statusGroups.BRONZE.length > 0) {
		console.log('🔶 BRONZE (Not quality-gated):');
		statusGroups.BRONZE.forEach((s) => console.log(s));
		console.log();
	}

	// Promotion queue
	if (manifest.promotionQueue.length > 0) {
		console.log('📋 PROMOTION QUEUE:');
		for (const item of manifest.promotionQueue) {
			const adapter = manifest.adapters[item.adapter];
			const status = adapter?.status || 'UNKNOWN';
			const emoji = status === 'SILVER_READY' ? '✅' : status === 'SILVER' ? '🥈' : '⏳';
			console.log(`  ${emoji} [${item.priority}] ${item.adapter}: ${item.reason}`);
		}
	}
}

// Main
const args = process.argv.slice(2);
const manifest = loadManifest();

if (args.length === 0 || args.includes('--status')) {
	printStatus(manifest);
} else if (args.includes('--all')) {
	console.log('🕸️ Running quality gates on ALL adapters...\n');
	let allPassed = true;
	for (const key of Object.keys(manifest.adapters)) {
		const passed = checkAdapter(key, manifest);
		if (!passed) allPassed = false;
	}
	saveManifest(manifest);
	process.exit(allPassed ? 0 : 1);
} else {
	const adapterKey = args[0];
	const passed = checkAdapter(adapterKey, manifest);
	saveManifest(manifest);
	process.exit(passed ? 0 : 1);
}
