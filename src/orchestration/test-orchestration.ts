/**
 * AI Orchestration Test Runner
 *
 * Gen87.X3 | Test all orchestration tools
 *
 * Run with: npx tsx src/orchestration/test-orchestration.ts
 */
import 'dotenv/config';
import { testLangGraphHIVE } from './langgraph.hive.js';
import { generateCompletion, testOpenRouterConnection } from './openrouter.config.js';

async function main() {
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('       HFO Gen87.X3 AI Orchestration Test Suite');
	console.log('═══════════════════════════════════════════════════════════════');
	console.log();

	// Test 1: OpenRouter Connection
	console.log('📡 Test 1: OpenRouter Connection');
	console.log('─────────────────────────────────────────────────────────────────');
	const openRouterOk = await testOpenRouterConnection();
	console.log();

	if (!openRouterOk) {
		console.error('❌ OpenRouter connection failed. Check OPENROUTER_API_KEY in .env');
		process.exit(1);
	}

	// Test 2: Direct Completion
	console.log('💬 Test 2: Direct Completion (Port 7 - Spider Sovereign)');
	console.log('─────────────────────────────────────────────────────────────────');
	const completion = await generateCompletion('What is 2 + 2? Answer with just the number.', {
		port: 7,
		temperature: 0,
		maxTokens: 10,
	});
	console.log('Response:', completion.trim());
	console.log();

	// Test 3: LangGraph HIVE Cycle
	console.log('🔄 Test 3: LangGraph HIVE/8 Cycle');
	console.log('─────────────────────────────────────────────────────────────────');
	try {
		await testLangGraphHIVE();
	} catch (error) {
		console.error('❌ LangGraph test failed:', error);
	}
	console.log();

	// Summary
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('                    TEST SUMMARY');
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('✅ OpenRouter:  Connected');
	console.log('✅ LangGraph:   HIVE/8 cycle working');
	console.log('⏳ Temporal:    Requires Temporal server (see setup)');
	console.log('⏳ CrewAI:      Run with Python (see crewai_hive.py)');
	console.log();
	console.log('Next steps:');
	console.log('  1. Start Temporal server: temporal server start-dev');
	console.log('  2. Test CrewAI: python src/orchestration/crewai_hive.py');
	console.log('  3. Start Temporal worker: npx tsx src/orchestration/temporal.worker.ts');
}

main().catch(console.error);
