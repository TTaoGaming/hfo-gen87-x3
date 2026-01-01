// @ts-nocheck
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Unified HIVE/8 Worker
 *
 * Gen87.X3 | Worker that handles ALL integrations
 *
 * This worker:
 * - Bundles unified workflow
 * - Loads all activities (LangGraph, CrewAI, MCP, NATS)
 * - Connects to Temporal on localhost:7233
 */
import { Worker, bundleWorkflowCode } from '@temporalio/worker';
import * as unifiedActivities from './unified-hive-activities.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
	console.log('🌀 Starting Unified HIVE/8 Worker...');
	console.log('');

	// Check environment
	const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
	const hasNats = !!process.env.NATS_URL || true; // Default to localhost

	console.log('📊 Environment Check:');
	console.log(`   OPENROUTER_API_KEY: ${hasOpenRouter ? '✅ Set' : '❌ Missing'}`);
	console.log(`   NATS_URL: ${process.env.NATS_URL || 'localhost:4222 (default)'}`);
	console.log('');

	if (!hasOpenRouter) {
		console.warn('⚠️  OPENROUTER_API_KEY not set - LLM calls will fail');
	}

	// Bundle workflows at runtime
	console.log('📦 Bundling workflows...');
	const workflowBundle = await bundleWorkflowCode({
		workflowsPath: path.join(__dirname, 'unified-hive-workflow.ts'),
	});
	console.log('✅ Workflows bundled');

	// Create worker with all activities
	const worker = await Worker.create({
		workflowBundle,
		activities: unifiedActivities,
		taskQueue: 'unified-hive',
		namespace: 'default',
	});

	console.log('');
	console.log('🟢 Worker started on task queue: unified-hive');
	console.log('');
	console.log('Available Workflows:');
	console.log('  - UnifiedHIVEWorkflow (full HIVE/8 cycle)');
	console.log('  - SimpleHIVEWorkflow (single phase test)');
	console.log('');
	console.log('Available Activities:');
	console.log('  - langGraphActivity  (LLM via OpenRouter)');
	console.log('  - crewaiActivity     (Python CrewAI)');
	console.log('  - mcpActivity        (MCP tool calls)');
	console.log('  - natsActivity       (NATS pub/sub)');
	console.log('  - unifiedHIVEActivity (auto-routing)');
	console.log('');
	console.log('Press Ctrl+C to stop');

	// Handle graceful shutdown
	process.on('SIGINT', async () => {
		console.log('\n🛑 Shutting down worker...');
		await unifiedActivities.closeNATSConnection();
		process.exit(0);
	});

	await worker.run();
}

run().catch((err) => {
	console.error('❌ Worker error:', err);
	process.exit(1);
});
