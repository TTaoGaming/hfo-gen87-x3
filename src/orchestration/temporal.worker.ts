/**
 * Temporal Worker
 *
 * Gen87.X3 | Runs Temporal activities
 *
 * Usage:
 * 1. Start Temporal server: temporal server start-dev
 * 2. Start worker: npx tsx src/orchestration/temporal.worker.ts
 */
import { Worker } from '@temporalio/worker';
import 'dotenv/config';
import * as activities from './temporal.activities.js';

async function runWorker() {
	console.log('🚀 Starting Temporal Worker for HIVE/8...');

	const worker = await Worker.create({
		workflowsPath: new URL('./temporal.workflows.js', import.meta.url).pathname,
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
