#!/usr/bin/env npx tsx
/**
 * Pyre Praetorian Daemon Runner
 * =============================
 * 
 * Runs the Pyre Praetorian Daemon with hourly health reports.
 * NOW READS the obsidianblackboard.jsonl to detect violations!
 * 
 * Usage: npx tsx scripts/pyre-daemon-runner.ts
 * 
 * @module scripts/pyre-daemon-runner
 * @owner Port 5 - Pyre Praetorian
 */

import { appendFileSync, readFileSync } from 'node:fs';
import {
	PyrePraetorianDaemon,
	type StigmergySignal,
} from '../hot/bronze/src/gates/pyre-praetorian-daemon.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BLACKBOARD_PATH = 'obsidianblackboard.jsonl';
const REPORT_INTERVAL_MS = 60 * 60 * 1000;  // 1 hour
const WATCH_POLL_INTERVAL_MS = 30 * 1000;   // 30 seconds

// ============================================================================
// BLACKBOARD READER
// ============================================================================

/**
 * Read blackboard file content
 */
function readBlackboard(filePath: string): string {
	try {
		return readFileSync(filePath, 'utf-8');
	} catch (err) {
		console.error(`[PYRE] Failed to read blackboard: ${err}`);
		return '';
	}
}

// ============================================================================
// EMITTER
// ============================================================================

let reportCount = 0;

/**
 * Custom emitter that logs to console AND JSONL
 */
const emitter = {
	emit(signal: StigmergySignal): void {
		reportCount++;
		
		// Append to JSONL
		const line = JSON.stringify(signal) + '\n';
		appendFileSync(BLACKBOARD_PATH, line);
		
		// Pretty print to console
		const parsed = JSON.parse(signal.msg);
		const timestamp = new Date().toISOString();
		console.log(`\n[${timestamp}] 🔥 PYRE REPORT #${reportCount}`);
		console.log(`   Status: ${parsed.report.status}`);
		console.log(`   Signals: ${parsed.report.signalsValidated}`);
		console.log(`   Violations: ${parsed.report.violationsDetected}`);
		if (parsed.report.blackboardSignals) {
			console.log(`   Blackboard: ${parsed.report.blackboardSignals} total signals`);
		}
		if (parsed.report.gitCommits?.length) {
			console.log(`   Git Commits: ${parsed.report.gitCommits.length} detected`);
		}
		// Show violation breakdown if any
		const totalViolations = Object.values(parsed.report.violationsByType as Record<string, number>)
			.reduce((a: number, b: number) => a + b, 0);
		if (totalViolations > 0) {
			console.log(`   Breakdown:`);
			for (const [type, count] of Object.entries(parsed.report.violationsByType)) {
				if ((count as number) > 0) {
					console.log(`     - ${type}: ${count}`);
				}
			}
		}
	}
};

// ============================================================================
// MAIN
// ============================================================================

console.log('🔥 PYRE PRAETORIAN DAEMON - Blackboard Watcher');
console.log(`   Blackboard: ${BLACKBOARD_PATH}`);
console.log(`   Report Interval: ${REPORT_INTERVAL_MS / 1000 / 60} minutes`);
console.log(`   Watch Poll: ${WATCH_POLL_INTERVAL_MS / 1000} seconds`);

const daemon = new PyrePraetorianDaemon({
	validateTimestamps: false,  // Don't validate timestamps for historical signals
	quarantineOnViolation: true,
	allowExceptional: true,
	emitter,
	reportIntervalMs: REPORT_INTERVAL_MS,
	blackboardPath: BLACKBOARD_PATH,
	blackboardReader: readBlackboard,
});

// Initial scan of existing blackboard
console.log('\n📖 Initial blackboard scan...');
const initialScan = daemon.scanBlackboard();
console.log(`   Found ${initialScan.signalsFound} signals`);
console.log(`   Detected ${initialScan.violations.length} violations`);
console.log(`   Git commits: ${initialScan.gitCommits.length}`);

if (initialScan.violations.length > 0) {
	console.log('\n⚠️  VIOLATIONS DETECTED:');
	const byType: Record<string, number> = {};
	for (const v of initialScan.violations) {
		byType[v.type] = (byType[v.type] || 0) + 1;
	}
	for (const [type, count] of Object.entries(byType)) {
		console.log(`   - ${type}: ${count}`);
	}
}

if (initialScan.gitCommits.length > 0) {
	console.log('\n📝 GIT COMMITS DETECTED:');
	for (const commit of initialScan.gitCommits.slice(-5)) {
		console.log(`   - ${commit.hash.substring(0, 7)}: ${commit.message.substring(0, 60)}...`);
	}
}

// Start watching for new signals
console.log('\n👁️  Starting blackboard watcher...');
daemon.startWatchingBlackboard(WATCH_POLL_INTERVAL_MS);

// Start periodic reports
console.log('📊 Starting periodic reports...\n');
daemon.startPeriodicReports();

// Keep alive
process.on('SIGINT', () => {
	console.log(`\n🛑 Shutdown. Reports: ${reportCount}`);
	daemon.shutdown();
	process.exit(0);
});
