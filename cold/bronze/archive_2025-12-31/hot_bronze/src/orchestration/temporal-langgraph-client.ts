/**
 * Temporal Client for LangGraph Workflow
 *
 * Gen87.X3 | Starts HIVE/8 workflow using LangGraph bridge
 */
import { Client, Connection } from '@temporalio/client';
import { HIVELangGraphWorkflow, getPhaseQuery } from './temporal-langgraph-workflow.js';

async function main() {
	const task = process.argv[2] || 'Analyze the HFO architecture and suggest improvements';

	console.log('🔗 Connecting to Temporal...');
	const connection = await Connection.connect({ address: 'localhost:7233' });
	const client = new Client({ connection });

	const workflowId = `hive-langgraph-${Date.now()}`;
	console.log(`🚀 Starting workflow: ${workflowId}`);
	console.log(`📋 Task: ${task}`);

	const handle = await client.workflow.start(HIVELangGraphWorkflow, {
		taskQueue: 'hive-langgraph',
		workflowId,
		args: [{ task, maxCycles: 1 }],
	});

	console.log('⏳ Workflow started, polling for completion...');

	// Poll until complete
	let lastPhase = '';
	const pollInterval = setInterval(async () => {
		try {
			const phase = await handle.query(getPhaseQuery);
			if (phase !== lastPhase) {
				console.log(`   Phase: ${phase}`);
				lastPhase = phase;
			}
		} catch {
			// Query may fail if workflow completed
		}
	}, 1000);

	const result = await handle.result();
	clearInterval(pollInterval);

	console.log('\n✅ Workflow completed!');
	console.log(`📊 Final state:`);
	console.log(`   Phase: ${result.phase}`);
	console.log(`   Cycles: ${result.cycle}`);
	console.log(`   Results: ${result.results.length} phase outputs`);
	console.log('');

	for (const r of result.results) {
		console.log(`=== ${r.phase} (${r.timestamp}) ===`);
		console.log(r.output.substring(0, 500) + (r.output.length > 500 ? '...' : ''));
		console.log('');
	}

	await connection.close();
}

main().catch((err) => {
	console.error('❌ Error:', err);
	process.exit(1);
});
