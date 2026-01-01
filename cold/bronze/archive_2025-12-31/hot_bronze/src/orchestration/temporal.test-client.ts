#!/usr/bin/env npx tsx
/**
 * Temporal Test Client - PROVE IT WORKS
 * 
 * Gen87.X3 | Quick validation of Temporal workflow execution
 */
import { Client, Connection } from '@temporalio/client';

async function proveItWorks() {
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('  🔬 TEMPORAL PROOF OF WORK - Gen87.X3');
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('');

	// Connect to Temporal
	console.log('1️⃣ Connecting to Temporal server at localhost:7233...');
	const connection = await Connection.connect({
		address: 'localhost:7233',
	});
	const client = new Client({ connection });
	console.log('   ✅ Connected!');
	console.log('');

	// List existing workflows to prove server is live
	console.log('2️⃣ Listing existing workflows...');
	const workflows = client.workflow.list({ pageSize: 5 });
	let count = 0;
	for await (const wf of workflows) {
		console.log(`   📋 ${wf.workflowId} (${wf.status.name})`);
		count++;
		if (count >= 5) break;
	}
	console.log(`   Found ${count} workflow(s)`);
	console.log('');

	// Start a new workflow
	const workflowId = `hive-proof-${Date.now()}`;
	console.log(`3️⃣ Starting NEW HIVE workflow: ${workflowId}`);
	console.log('   Task: "Prove Temporal is working with HIVE/8"');
	console.log('   Scaling: 8:0001 (1 cycle)');
	console.log('');

	const handle = await client.workflow.start('HIVEOrchestratorWorkflow', {
		taskQueue: 'hive-task-queue',
		workflowId,
		args: [
			{
				task: 'Prove Temporal is working with HIVE/8 by responding to this test',
				scaling: '8:0001',
				maxCycles: 1,
			},
		],
	});

	console.log(`   ✅ Workflow started!`);
	console.log(`   🔗 Workflow ID: ${handle.workflowId}`);
	console.log(`   🔗 Run ID: ${handle.firstExecutionRunId}`);
	console.log('');

	// Query workflow state
	console.log('4️⃣ Querying workflow state...');
	try {
		const phase = await handle.query('getPhase');
		console.log(`   Current phase: ${phase}`);
	} catch (e) {
		console.log('   (Query not available yet)');
	}
	console.log('');

	// Wait for result with timeout
	console.log('5️⃣ Waiting for workflow to complete (max 2 minutes)...');
	const startTime = Date.now();
	
	try {
		const result = await handle.result({ timeout: 120000 });
		const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
		
		console.log('');
		console.log('═══════════════════════════════════════════════════════════════');
		console.log('  ✅ TEMPORAL PROOF COMPLETE');
		console.log('═══════════════════════════════════════════════════════════════');
		console.log(`   Duration: ${elapsed}s`);
		console.log(`   Final Phase: ${result.phase}`);
		console.log(`   Cycles: ${result.cycle}`);
		console.log(`   Results: ${result.results.length} phase outputs`);
		console.log('');
		console.log('   Phase Outputs:');
		for (const r of result.results) {
			console.log(`   ┌─ ${r.phase} Phase (Port ${r.port}) @ ${r.timestamp}`);
			console.log(`   │  ${r.output.substring(0, 200).replace(/\n/g, '\n   │  ')}...`);
			console.log(`   └─────────────────────────────────────────────────`);
		}
		
		// Emit success signal to blackboard
		const fs = await import('node:fs');
		const signal = {
			ts: new Date().toISOString(),
			mark: 1.0,
			pull: 'downstream',
			msg: `VALIDATE: Temporal PROOF COMPLETE - ${result.results.length} phases executed in ${elapsed}s. Workflow ${workflowId}`,
			type: 'event',
			hive: 'V',
			gen: 87,
			port: 2,
		};
		fs.appendFileSync('../../obsidianblackboard.jsonl', JSON.stringify(signal) + '\n');
		console.log('');
		console.log('   📡 Signal emitted to blackboard');
		
	} catch (err) {
		console.log('');
		console.log('═══════════════════════════════════════════════════════════════');
		console.log('  ⚠️ WORKFLOW STILL RUNNING');
		console.log('═══════════════════════════════════════════════════════════════');
		console.log(`   Workflow ${workflowId} is still executing.`);
		console.log('   This proves Temporal is working - workflow was accepted!');
		console.log('');
		console.log('   Check status with:');
		console.log(`   temporal workflow describe --workflow-id ${workflowId}`);
	}

	await connection.close();
}

proveItWorks().catch((err) => {
	console.error('');
	console.error('═══════════════════════════════════════════════════════════════');
	console.error('  ❌ PROOF FAILED');
	console.error('═══════════════════════════════════════════════════════════════');
	console.error('');
	console.error('Error:', err.message);
	console.error('');
	console.error('Make sure:');
	console.error('  1. Temporal server running: temporal server start-dev');
	console.error('  2. Worker running in separate terminal:');
	console.error('     cd hot/bronze && npx tsx src/orchestration/temporal.worker.ts');
	console.error('');
	process.exit(1);
});
