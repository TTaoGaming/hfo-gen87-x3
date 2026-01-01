import path from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Temporal Worker
 *
 * Gen87.X3 | Runs Temporal activities
 *
 * Usage:
 * 1. Start Temporal server: temporal server start-dev
 * 2. Build: npm run build
 * 3. Start worker: node dist/orchestration/temporal.worker.js
 */
import { Worker } from '@temporalio/worker';
import 'dotenv/config';
import * as activities from './temporal.activities.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runWorker() {
	console.log('🚀 Starting Temporal Worker for HIVE/8...');

	// Use compiled JS path (dist/ when running with node, src/ when running with tsx)
	const workflowsPath = path.resolve(__dirname, 'temporal.workflows.js').replace('/src/', '/dist/');

	const worker = await Worker.create({
		workflowsPath,
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
