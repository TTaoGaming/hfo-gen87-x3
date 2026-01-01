/**
 * Temporal Client
 *
 * Gen87.X3 | Start and manage workflows
 *
 * Usage: npx tsx src/orchestration/temporal.client.ts
 */
import { Client, Connection } from '@temporalio/client';
import 'dotenv/config';

async function runClient() {
	console.log('🔗 Connecting to Temporal server...');

	const connection = await Connection.connect({
		address: 'localhost:7233', // Default Temporal server address
	});

	const client = new Client({
		connection,
	});

	console.log('✅ Connected to Temporal server');
	console.log('');

	// Start a HIVE workflow
	const workflowId = `hive-${Date.now()}`;

	console.log(`🚀 Starting HIVE workflow: ${workflowId}`);

	const handle = await client.workflow.start('HIVEOrchestratorWorkflow', {
		taskQueue: 'hive-task-queue',
		workflowId,
		args: [
			{
				task: 'Create a simple Hello World function',
				scaling: '8:0001',
				maxCycles: 1,
			},
		],
	});

	console.log(`✅ Workflow started: ${handle.workflowId}`);
	console.log('');

	// Wait for result
	console.log('⏳ Waiting for workflow to complete...');
	const result = await handle.result();

	console.log('');
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('                    WORKFLOW RESULT');
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('Phase:', result.phase);
	console.log('Cycle:', result.cycle);
	console.log('Results:', result.results.length, 'phase outputs');
	console.log('');

	for (const r of result.results) {
		console.log(`--- ${r.phase} Phase (Port ${r.port}) ---`);
		console.log(`${r.output.substring(0, 300)}...`);
		console.log('');
	}
}

runClient().catch((err) => {
	console.error('❌ Client failed:', err);
	console.error('');
	console.error('Make sure:');
	console.error('  1. Temporal server is running: temporal server start-dev');
	console.error('  2. Worker is running: npx tsx src/orchestration/temporal.worker.ts');
	process.exit(1);
});
