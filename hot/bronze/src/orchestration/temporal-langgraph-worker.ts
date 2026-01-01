/**
 * Temporal Worker for LangGraph Bridge
 *
 * Gen87.X3 | Worker that executes LangGraph activities via Temporal
 *
 * This worker:
 * 1. Bundles TypeScript workflows at runtime
 * 2. Loads LangGraph bridge activities
 * 3. Connects to Temporal server on localhost:7233
 */
import { Worker, bundleWorkflowCode } from '@temporalio/worker';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as bridgeActivities from './temporal-langgraph-bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
	console.log('🌀 Starting Temporal Worker with LangGraph Bridge...');

	// Bundle workflows at runtime (handles TypeScript)
	console.log('📦 Bundling workflows...');
	const workflowBundle = await bundleWorkflowCode({
		workflowsPath: path.join(__dirname, 'temporal-langgraph-workflow.ts'),
	});
	console.log('✅ Workflows bundled');

	// Create worker with LangGraph activities
	const worker = await Worker.create({
		workflowBundle,
		activities: bridgeActivities,
		taskQueue: 'hive-langgraph',
		namespace: 'default',
	});

	console.log('🟢 Worker started on task queue: hive-langgraph');
	console.log('   Activities: langGraphHuntActivity, langGraphInterlockActivity, langGraphValidateActivity, langGraphEvolveActivity');
	console.log('   Workflows: HIVELangGraphWorkflow');
	console.log('');
	console.log('Press Ctrl+C to stop');

	await worker.run();
}

run().catch((err) => {
	console.error('❌ Worker error:', err);
	process.exit(1);
});
