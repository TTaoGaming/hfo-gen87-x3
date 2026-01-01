import path from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Temporal Worker
 *
 * Gen87.X3 | Runs Temporal activities
 *
 * Usage:
 * 1. Start Temporal server: temporal server start-dev
 * 2. Start worker: npx tsx src/orchestration/temporal.worker.ts
 */
import { bundleWorkflowCode, Worker } from '@temporalio/worker';
import 'dotenv/config';
import * as activities from './temporal.activities.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runWorker() {
	console.log('🚀 Starting Temporal Worker for HIVE/8...');
	console.log('📦 Bundling workflow code (TypeScript → JS)...');

	// Bundle TypeScript workflows at runtime (no pre-build needed)
	const workflowsPath = path.resolve(__dirname, 'temporal.workflows.ts');
	const workflowBundle = await bundleWorkflowCode({
		workflowsPath,
	});
	console.log('✅ Workflow bundle created');

	const worker = await Worker.create({
		workflowBundle,
		activities,
		taskQueue: 'hive-task-queue',
	});

	console.log('✅ Worker started. Listening for tasks on queue: hive-task-queue');
	console.log('');
	console.log('Available workflows:');
	console.log('  - HIVEOrchestratorWorkflow');
	console.log('  - PhaseWorkerWorkflow');
	console.log('');
	console.log('Press Ctrl+C to stop.');

	await worker.run();
}

runWorker().catch((err) => {
	console.error('❌ Worker failed:', err);
	process.exit(1);
});
