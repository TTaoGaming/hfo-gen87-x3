/**
 * Direct test of LangGraph bridge
 */
import { runFullHIVECycle } from './temporal-langgraph-bridge.js';

const task = process.argv[2] || 'Test HIVE cycle';

console.log('🧪 Testing LangGraph Bridge...');
console.log('');

runFullHIVECycle(task)
	.then((result) => {
		console.log('');
		console.log('📋 Results Summary:');
		console.log('');
		console.log('=== HUNT ===');
		console.log(result.hunt.output);
		console.log('');
		console.log('=== INTERLOCK ===');
		console.log(result.interlock.output);
		console.log('');
		console.log('=== VALIDATE ===');
		console.log(result.validate.output);
		console.log('');
		console.log('=== EVOLVE ===');
		console.log(result.evolve.output);
	})
	.catch((err) => {
		console.error('❌ Error:', err);
		process.exit(1);
	});
