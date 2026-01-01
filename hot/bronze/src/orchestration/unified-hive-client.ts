/**
 * Unified HIVE/8 Client
 *
 * Gen87.X3 | Start unified workflows from CLI
 *
 * Usage:
 *   npx tsx unified-hive-client.ts "Your task" [mode]
 *
 * Modes:
 *   sequential (default) - Run phases in order
 *   parallel - Run all systems in parallel per phase
 */
import { Client, Connection } from '@temporalio/client';
import type { UnifiedWorkflowConfig } from './unified-hive-workflow.js';
import { UnifiedHIVEWorkflow } from './unified-hive-workflow.js';

async function main() {
	const task = process.argv[2] || 'Test unified HIVE workflow';
	const mode = (process.argv[3] as 'sequential' | 'parallel') || 'sequential';

	console.log('🚀 Starting Unified HIVE Workflow');
	console.log(`   Task: ${task}`);
	console.log(`   Mode: ${mode}`);
	console.log('');

	// Connect to Temporal
	const connection = await Connection.connect({
		address: 'localhost:7233',
	});

	const client = new Client({ connection });

	const workflowId = `unified-hive-${Date.now()}`;

	const config: UnifiedWorkflowConfig = {
		task,
		maxCycles: 1,
		mode,
		systems: {
			langgraph: true,
			crewai: false, // Disabled by default (needs Python)
			mcp: false, // Disabled by default (needs server)
			nats: false, // Disabled by default (needs server)
		},
	};

	console.log('📋 Config:', JSON.stringify(config, null, 2));
	console.log('');

	// Start workflow
	const handle = await client.workflow.start(UnifiedHIVEWorkflow, {
		taskQueue: 'unified-hive',
		workflowId,
		args: [config],
	});

	console.log(`✅ Workflow started: ${workflowId}`);
	console.log('   Waiting for completion...');
	console.log('');

	// Wait for result
	const result = await handle.result();

	console.log('═══════════════════════════════════════════════════════════════════');
	console.log('                    UNIFIED HIVE WORKFLOW RESULT');
	console.log('═══════════════════════════════════════════════════════════════════');
	console.log('');
	console.log(`Phase: ${result.phase}`);
	console.log(`Cycles: ${result.cycle}`);
	console.log(`Systems Used: ${Array.from(result.systemsUsed).join(', ')}`);
	console.log(`Results: ${result.results.length}`);
	console.log('');

	for (const r of result.results) {
		console.log(`[${r.phase}] Port ${r.port} via ${r.source} (${r.durationMs}ms)`);
		console.log(`   ${r.output.slice(0, 200)}...`);
		console.log('');
	}

	if (result.errors.length > 0) {
		console.log('Errors:');
		for (const err of result.errors) {
			console.log(`   ❌ ${err}`);
		}
	}

	await connection.close();
}

main().catch((err) => {
	console.error('❌ Client error:', err);
	process.exit(1);
});
