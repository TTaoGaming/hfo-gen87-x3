#!/usr/bin/env tsx
// @ts-nocheck
/**
 * Test Bucket Status Reporter
 *
 * Shows RED/GREEN test status organized by functional buckets
 * for easier AI agent workflow and prioritization.
 *
 * @source HIVE/8 TDD Workflow - Interlock Phase
 * @see https://vitest.dev/guide/cli.html
 */

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

interface BucketConfig {
	name: string;
	path: string;
	description: string;
	priority: number;
	role: 'contracts' | 'adapters' | 'smoothers' | 'phase1' | 'gesture';
}

const BUCKETS: BucketConfig[] = [
	{
		name: '📜 CONTRACTS',
		path: 'sandbox/src/contracts/',
		description: 'Zod schemas, W3C compliance, observability standards',
		priority: 1,
		role: 'contracts',
	},
	{
		name: '🔌 ADAPTERS',
		path: 'sandbox/src/adapters/',
		description: 'UI shells, emulators, FSM, overlays, targets',
		priority: 2,
		role: 'adapters',
	},
	{
		name: '🌊 SMOOTHERS',
		path: 'sandbox/src/smoothers/',
		description: '1€ filter, physics spring, prediction, pipeline',
		priority: 3,
		role: 'smoothers',
	},
	{
		name: '👆 PHASE1',
		path: 'sandbox/src/phase1-w3c-cursor/',
		description: 'Core MVP cursor pipeline, multi-hand tracking',
		priority: 4,
		role: 'phase1',
	},
	{
		name: '✋ GESTURE',
		path: 'sandbox/src/gesture/,sandbox/src/arming/',
		description: 'Commit gestures, arming gate, evolutionary tuner',
		priority: 5,
		role: 'gesture',
	},
];

interface TestResult {
	bucket: string;
	passed: number;
	failed: number;
	skipped: number;
	total: number;
	status: 'GREEN' | 'RED' | 'PARTIAL';
}

function runBucketTests(path: string): { passed: number; failed: number; skipped: number } {
	try {
		const paths = path.split(',').join(' ');
		const result = execSync(`npx vitest run ${paths} --reporter=json 2>&1`, {
			encoding: 'utf-8',
			cwd: resolve(process.cwd()),
			timeout: 60000,
		});

		// Parse JSON output from vitest
		const jsonMatch = result.match(/\{[\s\S]*"numPassedTests"[\s\S]*\}/);
		if (jsonMatch) {
			const json = JSON.parse(jsonMatch[0]);
			return {
				passed: json.numPassedTests || 0,
				failed: json.numFailedTests || 0,
				skipped: json.numPendingTests || 0,
			};
		}

		// Fallback: parse text output
		const passMatch = result.match(/(\d+) passed/);
		const failMatch = result.match(/(\d+) failed/);
		const skipMatch = result.match(/(\d+) skipped/);

		return {
			passed: passMatch ? Number.parseInt(passMatch[1], 10) : 0,
			failed: failMatch ? Number.parseInt(failMatch[1], 10) : 0,
			skipped: skipMatch ? Number.parseInt(skipMatch[1], 10) : 0,
		};
	} catch (error: unknown) {
		// Tests failed - parse output anyway
		const output = (error as { stdout?: string }).stdout || String(error);
		const passMatch = output.match(/(\d+) passed/);
		const failMatch = output.match(/(\d+) failed/);
		const skipMatch = output.match(/(\d+) skipped/);

		return {
			passed: passMatch ? Number.parseInt(passMatch[1], 10) : 0,
			failed: failMatch ? Number.parseInt(failMatch[1], 10) : 0,
			skipped: skipMatch ? Number.parseInt(skipMatch[1], 10) : 0,
		};
	}
}

function getStatus(passed: number, failed: number): 'GREEN' | 'RED' | 'PARTIAL' {
	if (failed === 0 && passed > 0) return 'GREEN';
	if (passed === 0 && failed > 0) return 'RED';
	return 'PARTIAL';
}

function getStatusEmoji(status: string): string {
	switch (status) {
		case 'GREEN':
			return '🟢';
		case 'RED':
			return '🔴';
		case 'PARTIAL':
			return '🟡';
		default:
			return '⚪';
	}
}

async function main() {
	console.log('\n' + '═'.repeat(70));
	console.log('📊 TEST BUCKET STATUS REPORT');
	console.log('═'.repeat(70));
	console.log(`Generated: ${new Date().toISOString()}`);
	console.log('Phase: I (INTERLOCK) - TDD RED\n');

	const results: TestResult[] = [];

	for (const bucket of BUCKETS) {
		console.log(`Testing ${bucket.name}...`);
		const { passed, failed, skipped } = runBucketTests(bucket.path);
		const total = passed + failed + skipped;
		const status = getStatus(passed, failed);

		results.push({
			bucket: bucket.name,
			passed,
			failed,
			skipped,
			total,
			status,
		});
	}

	// Print summary table
	console.log('\n' + '─'.repeat(70));
	console.log('BUCKET SUMMARY');
	console.log('─'.repeat(70));
	console.log(
		'Bucket'.padEnd(20) +
			'Status'.padEnd(10) +
			'Passed'.padEnd(10) +
			'Failed'.padEnd(10) +
			'Skip'.padEnd(8) +
			'Total',
	);
	console.log('─'.repeat(70));

	let totalPassed = 0;
	let totalFailed = 0;
	let totalSkipped = 0;

	for (const result of results) {
		const emoji = getStatusEmoji(result.status);
		console.log(
			result.bucket.padEnd(20) +
				`${emoji} ${result.status}`.padEnd(12) +
				String(result.passed).padEnd(10) +
				String(result.failed).padEnd(10) +
				String(result.skipped).padEnd(8) +
				result.total,
		);
		totalPassed += result.passed;
		totalFailed += result.failed;
		totalSkipped += result.skipped;
	}

	console.log('─'.repeat(70));
	const overallStatus = getStatus(totalPassed, totalFailed);
	const overallEmoji = getStatusEmoji(overallStatus);
	console.log(
		'TOTAL'.padEnd(20) +
			`${overallEmoji} ${overallStatus}`.padEnd(12) +
			String(totalPassed).padEnd(10) +
			String(totalFailed).padEnd(10) +
			String(totalSkipped).padEnd(8) +
			(totalPassed + totalFailed + totalSkipped),
	);

	// Print priority recommendations
	console.log('\n' + '─'.repeat(70));
	console.log('🎯 WORK PRIORITY (RED buckets need implementation)');
	console.log('─'.repeat(70));

	const redBuckets = results.filter((r) => r.status === 'RED' || r.status === 'PARTIAL');
	if (redBuckets.length === 0) {
		console.log('✅ All buckets GREEN! Ready for V (VALIDATE) phase.');
	} else {
		for (const bucket of redBuckets.sort((a, b) => {
			const bucketA = BUCKETS.find((b) => b.name === a.bucket);
			const bucketB = BUCKETS.find((b) => b.name === b.bucket);
			return (bucketA?.priority || 99) - (bucketB?.priority || 99);
		})) {
			const config = BUCKETS.find((b) => b.name === bucket.bucket);
			console.log(`\n${getStatusEmoji(bucket.status)} ${bucket.bucket}`);
			console.log(`   ${config?.description || ''}`);
			console.log(`   Run: npm run test:bucket:${config?.role}`);
			console.log(`   RED: ${bucket.failed} tests need implementation`);
		}
	}

	// Print quick commands
	console.log('\n' + '─'.repeat(70));
	console.log('⚡ QUICK COMMANDS');
	console.log('─'.repeat(70));
	console.log('npm run test:bucket:contracts  # Run contracts tests only');
	console.log('npm run test:bucket:adapters   # Run adapter tests only');
	console.log('npm run test:bucket:smoothers  # Run smoother tests only');
	console.log('npm run test:bucket:phase1     # Run Phase 1 tests only');
	console.log('npm run test:bucket:gesture    # Run gesture tests only');
	console.log('npm run test                   # Run ALL tests');

	console.log('\n' + '═'.repeat(70) + '\n');

	// Exit with error code if any tests failed
	process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(console.error);
