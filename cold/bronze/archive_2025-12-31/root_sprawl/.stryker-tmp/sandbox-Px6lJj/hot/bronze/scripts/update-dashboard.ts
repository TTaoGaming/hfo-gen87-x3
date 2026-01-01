#!/usr/bin/env npx tsx
// @ts-nocheck
/**
 * Update Dashboard Script — Gen87.X3
 *
 * Updates dashboard-data.json with fresh data from:
 * 1. Test results (npm test)
 * 2. Anti-theater gate status
 * 3. Recent blackboard signals
 * 4. HIVE phase tracking
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const DASHBOARD_DATA_PATH = path.resolve('./dashboard-data.json');
const BLACKBOARD_PATH = path.resolve('./sandbox/obsidianblackboard.jsonl');

interface Signal {
	ts: string;
	hive: string;
	msg: string;
	port: number;
}

async function updateDashboard() {
	console.log('');
	console.log('═══════════════════════════════════════════════════════════════════');
	console.log('  🖥️  Updating HFO Dev Dashboard                                   ');
	console.log('═══════════════════════════════════════════════════════════════════');
	console.log('');

	// Load current dashboard data
	let data = JSON.parse(fs.readFileSync(DASHBOARD_DATA_PATH, 'utf8'));

	// 1. Get test results
	console.log('📊 Running tests...');
	try {
		const testOutput = execSync('npm test 2>&1', { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
		const testsMatch = testOutput.match(/Tests\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed\s*\|\s*(\d+)\s+skipped\s*\|\s*(\d+)\s+todo\s*\((\d+)\)/);
		if (testsMatch) {
			data.tests = {
				total: parseInt(testsMatch[5]),
				passing: parseInt(testsMatch[2]),
				failing: parseInt(testsMatch[1]),
				skipped: parseInt(testsMatch[3]),
				todo: parseInt(testsMatch[4]),
				coverage: data.tests?.coverage || 0,
			};
			console.log(`   ✅ Tests: ${data.tests.passing}/${data.tests.total} passing`);
		}
	} catch (err: any) {
		const output = err.stdout || err.message;
		const testsMatch = output.match(/Tests\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed\s*\|\s*(\d+)\s+skipped\s*\|\s*(\d+)\s+todo\s*\((\d+)\)/);
		if (testsMatch) {
			data.tests = {
				total: parseInt(testsMatch[5]),
				passing: parseInt(testsMatch[2]),
				failing: parseInt(testsMatch[1]),
				skipped: parseInt(testsMatch[3]),
				todo: parseInt(testsMatch[4]),
				coverage: data.tests?.coverage || 0,
			};
			console.log(`   ✅ Tests: ${data.tests.passing}/${data.tests.total} passing`);
		}
	}

	// 2. Check anti-theater gate
	console.log('🎭 Checking anti-theater gate...');
	try {
		execSync('npm run gate:theater', { encoding: 'utf8' });
		const g7 = data.enforcement?.gates?.find((g: any) => g.id === 'G7');
		if (g7) g7.status = 'active';
		console.log('   ✅ Anti-theater gate PASSES');
	} catch (err) {
		const g7 = data.enforcement?.gates?.find((g: any) => g.id === 'G7');
		if (g7) g7.status = 'failing';
		console.log('   ❌ Anti-theater gate has violations');
	}

	// 3. Get recent blackboard signals
	console.log('📡 Loading blackboard signals...');
	if (fs.existsSync(BLACKBOARD_PATH)) {
		const lines = fs.readFileSync(BLACKBOARD_PATH, 'utf8').trim().split('\n');
		const signals: Signal[] = lines
			.slice(-20)
			.reverse()
			.map(line => {
				try {
					return JSON.parse(line);
				} catch {
					return null;
				}
			})
			.filter(Boolean) as Signal[];

		data.signals = signals.map(s => ({
			ts: s.ts,
			hive: s.hive,
			msg: s.msg?.substring(0, 200) || '',
			port: s.port,
		}));

		// Determine current HIVE phase from last signal
		const lastSignal = signals[0];
		if (lastSignal?.hive && data.hive?.phases) {
			data.hive.currentPhase = lastSignal.hive;
			for (const key of ['H', 'I', 'V', 'E']) {
				if (data.hive.phases[key]) {
					data.hive.phases[key].active = key === lastSignal.hive;
				}
			}
		}

		console.log(`   ✅ Loaded ${signals.length} recent signals`);
		console.log(`   📍 Current phase: ${data.hive?.currentPhase || 'unknown'}`);
	}

	// 4. Update timestamp
	data.lastUpdated = new Date().toISOString();

	// Write updated data
	fs.writeFileSync(DASHBOARD_DATA_PATH, JSON.stringify(data, null, '\t'));

	console.log('');
	console.log('═══════════════════════════════════════════════════════════════════');
	console.log('  ✅ Dashboard data updated!                                       ');
	console.log('  📂 Open HFO_DEV_DASHBOARD.html in browser                        ');
	console.log('═══════════════════════════════════════════════════════════════════');
	console.log('');

	// Print summary
	console.log('📊 CURRENT STATUS:');
	console.log(`   Phase: ${data.hive?.currentPhase || 'unknown'}`);
	console.log(`   Tests: ${data.tests.passing}/${data.tests.total} (${Math.round((data.tests.passing / data.tests.total) * 100)}%)`);
	console.log(`   Failing: ${data.tests.failing}`);
	console.log(`   TODO: ${data.tests.todo}`);
	console.log('');
	console.log('✅ REAL:');
	data.realVsTheater?.real?.forEach((r: any) => {
		console.log(`   ${r.id}: ${r.tests}`);
	});
	console.log('');
	console.log('❌ THEATER/PENDING:');
	data.realVsTheater?.theater?.forEach((t: any) => {
		console.log(`   ${t.id}: ${t.count !== undefined ? t.count : ''} - ${t.desc}`);
	});
}

updateDashboard().catch(console.error);
