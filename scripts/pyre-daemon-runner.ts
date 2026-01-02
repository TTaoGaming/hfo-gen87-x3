#!/usr/bin/env npx tsx
/**
 * Pyre Praetorian Daemon Runner - OCTOPULSE Edition
 * ==================================================
 *
 * Runs the Pyre Praetorian Daemon with OCTOPULSE heartbeat pattern.
 *
 * SIGNATURE: Emits exactly 8 signals at the SAME timestamp - one per port.
 * This is the Pyre Praetorian's unique fingerprint that distinguishes
 * intentional batch emissions from reward-hack BATCH_FABRICATION.
 *
 * Normal BATCH_FABRICATION = random signals at same timestamp (violation)
 * PYRE OCTOPULSE = exactly 8 signals, ports 0-7, same timestamp (signature)
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
const REPORT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const WATCH_POLL_INTERVAL_MS = 30 * 1000; // 30 seconds

// ============================================================================
// 8 HARD GATES - Pyre Praetorian DEFENSE Status
// ============================================================================
// NOTE: Heartbeat Mantra ("Given one swarm to rule the 8") belongs to
//       Spore Storm (Port 3), NOT Pyre Praetorian.
//       Pyre's job is DEFENSE = gate enforcement and violation reporting.

const GATE_DEFINITIONS = [
	{ port: 0, gate: 'G0', field: 'ts', rule: 'Valid ISO8601 timestamp', emoji: '⏰' },
	{ port: 1, gate: 'G1', field: 'mark', rule: '0.0 ≤ mark ≤ 1.0', emoji: '📊' },
	{ port: 2, gate: 'G2', field: 'pull', rule: 'upstream|downstream|lateral', emoji: '🔄' },
	{ port: 3, gate: 'G3', field: 'msg', rule: 'Non-empty string', emoji: '💬' },
	{ port: 4, gate: 'G4', field: 'type', rule: 'signal|event|error|metric', emoji: '🏷️' },
	{ port: 5, gate: 'G5', field: 'hive', rule: 'H|I|V|E|X', emoji: '🐝' },
	{ port: 6, gate: 'G6', field: 'gen', rule: 'Integer ≥ 85', emoji: '🧬' },
	{ port: 7, gate: 'G7', field: 'port', rule: 'Integer 0-7', emoji: '🚪' },
] as const;

// ============================================================================
// BLACKBOARD READER
// ============================================================================

function readBlackboard(filePath: string): string {
	try {
		return readFileSync(filePath, 'utf-8');
	} catch (err) {
		console.error(`[PYRE] Failed to read blackboard: ${err}`);
		return '';
	}
}

// ============================================================================
// OCTOPULSE EMITTER - 8 Signals at Same Timestamp
// ============================================================================

let pulseCount = 0;

interface HealthReport {
	signalsValidated: number;
	violationsDetected: number;
	violationsByType: Record<string, number>;
	status: string;
	blackboardSignals?: number;
	gitCommits?: Array<{ hash: string; message: string }>;
}

/**
 * Emit OCTOPULSE - 8 signals at the exact same timestamp
 * Each pulse reports on one of the 8 Hard Gates (G0-G7)
 * This is Pyre Praetorian's DEFENSE report - gate health status
 */
function emitOctopulse(report: HealthReport): void {
	pulseCount++;
	const pulseTs = new Date().toISOString();

	console.log(`\n${'🔥'.repeat(8)} OCTOPULSE #${pulseCount} @ ${pulseTs}`);
	console.log(`   Status: ${report.status}`);
	console.log(`   Signals: ${report.signalsValidated} validated`);
	console.log(`   Violations: ${report.violationsDetected} detected`);

	// Compute gate-specific violation counts
	const gateViolations: Record<string, number> = {
		G0: 0,
		G1: 0,
		G2: 0,
		G3: 0,
		G4: 0,
		G5: 0,
		G6: 0,
		G7: 0,
	};
	// Map violation types to gates
	for (const [vType, count] of Object.entries(report.violationsByType)) {
		// HIVE sequence violations affect G5 (hive field)
		if (['REWARD_HACK', 'SKIPPED_PHASE', 'PHASE_INVERSION'].includes(vType)) {
			gateViolations.G5 += count;
		}
		// Batch fabrication affects G0 (timestamp)
		if (vType === 'BATCH_FABRICATION') {
			gateViolations.G0 += count;
		}
	}

	// Build 8 signals - one per gate - all with SAME timestamp
	const signals: StigmergySignal[] = GATE_DEFINITIONS.map((gate) => {
		const violations = gateViolations[gate.gate] ?? 0;
		const health = violations === 0 ? 'HEALTHY' : violations < 5 ? 'WARNING' : 'CRITICAL';

		return {
			ts: pulseTs, // SAME timestamp for all 8 = OCTOPULSE signature
			mark: health === 'HEALTHY' ? 1.0 : health === 'WARNING' ? 0.5 : 0.0,
			pull: 'downstream' as const,
			msg: JSON.stringify({
				type: 'PYRE_OCTOPULSE',
				pulse: pulseCount,
				gate: gate.gate,
				field: gate.field,
				rule: gate.rule,
				violations,
				health,
				totalSignals: report.signalsValidated,
				totalViolations: report.violationsDetected,
			}),
			type: 'metric' as const,
			hive: 'V' as const, // All defense reports are Validate phase
			gen: 87,
			port: gate.port,
		};
	});

	// Emit all 8 at once - this is the OCTOPULSE signature
	const lines = `${signals.map((s) => JSON.stringify(s)).join('\n')}\n`;
	appendFileSync(BLACKBOARD_PATH, lines);

	// Pretty print the gate status
	console.log(`   ${'─'.repeat(50)}`);
	for (const gate of GATE_DEFINITIONS) {
		const violations = gateViolations[gate.gate] ?? 0;
		const status = violations === 0 ? '✅' : violations < 5 ? '⚠️' : '❌';
		console.log(
			`   ${gate.emoji} ${gate.gate} [${gate.field}]: ${status} ${violations} violations`,
		);
	}
	console.log(`   ${'─'.repeat(50)}`);

	// Show violations if any
	const totalViolations = Object.values(report.violationsByType).reduce((a, b) => a + b, 0);
	if (totalViolations > 0) {
		console.log('   ⚠️  Violations:');
		for (const [type, count] of Object.entries(report.violationsByType)) {
			if (count > 0) {
				console.log(`      - ${type}: ${count}`);
			}
		}
	}
}

/**
 * Custom emitter that triggers OCTOPULSE
 */
const emitter = {
	emit(signal: StigmergySignal): void {
		// Parse the health report and emit octopulse
		const parsed = JSON.parse(signal.msg);
		if (parsed.type === 'PYRE_HEALTH_REPORT') {
			emitOctopulse(parsed.report);
		} else {
			// For non-health signals, just append
			appendFileSync(BLACKBOARD_PATH, `${JSON.stringify(signal)}\n`);
		}
	},
};

// ============================================================================
// MAIN
// ============================================================================

// Parse command line arguments
const args = process.argv.slice(2);
const scanOnlyMode = args.includes('--scan-only') || args.includes('--scan');
const exitOnViolation = args.includes('--exit-on-violation');

console.log('🔥🔥🔥🔥🔥🔥🔥🔥 PYRE PRAETORIAN DAEMON - OCTOPULSE Edition');
console.log(`   Blackboard: ${BLACKBOARD_PATH}`);
console.log(`   Mode: ${scanOnlyMode ? 'SCAN ONLY (pre-commit gate)' : 'CONTINUOUS WATCH'}`);
console.log(`   Exit on Violation: ${exitOnViolation}`);

const daemon = new PyrePraetorianDaemon({
	validateTimestamps: false, // Don't validate timestamps for historical signals
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

// SCAN-ONLY MODE: Exit after scan (for pre-commit gate)
if (scanOnlyMode) {
	// For pre-commit, only count CRITICAL violations
	const criticalViolations = initialScan.violations.filter((v) => v.severity === 'CRITICAL');

	if (exitOnViolation && criticalViolations.length > 0) {
		console.log('\n❌ PYRE PRE-COMMIT GATE: BLOCKED');
		console.log(`   ${criticalViolations.length} CRITICAL HIVE violations detected`);
		console.log('   Violation types:');
		const byType: Record<string, number> = {};
		for (const v of criticalViolations) {
			byType[v.type] = (byType[v.type] || 0) + 1;
		}
		for (const [type, count] of Object.entries(byType)) {
			console.log(`     - ${type}: ${count}`);
		}
		console.log('\n   To fix: Ensure HIVE sequence H→I→V→E is followed');
		console.log('   Note: Use --scan-only (without --exit-on-violation) for info only\n');
		process.exit(1);
	}

	const nonCriticalCount = initialScan.violations.length - criticalViolations.length;
	console.log('\n✅ PYRE PRE-COMMIT GATE: PASSED');
	console.log(`   ${initialScan.signalsFound} signals validated`);
	console.log(`   ${criticalViolations.length} CRITICAL violations (blocking)`);
	console.log(`   ${nonCriticalCount} non-critical violations (warning only)\n`);
	process.exit(0);
}

// Emit initial OCTOPULSE immediately
console.log('\n🔥 Emitting initial OCTOPULSE...');
daemon.emitHealthReport();

// Start watching for new signals
console.log('\n👁️  Starting blackboard watcher...');
daemon.startWatchingBlackboard(WATCH_POLL_INTERVAL_MS);

// Start periodic reports (hourly OCTOPULSE)
console.log('📊 Starting periodic OCTOPULSE reports (hourly)...\n');
daemon.startPeriodicReports();

// Keep alive with heartbeat
const heartbeatInterval = setInterval(
	() => {
		const now = new Date().toISOString();
		console.log(`[${now}] 💓 Pyre Praetorian alive | Pulses: ${pulseCount}`);
	},
	5 * 60 * 1000,
); // Every 5 minutes

process.on('SIGINT', () => {
	console.log(`\n🛑 Shutdown. Total OCTOPULSES: ${pulseCount}`);
	clearInterval(heartbeatInterval);
	daemon.shutdown();
	process.exit(0);
});
