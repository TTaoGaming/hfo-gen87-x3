/**
 * RED QUEEN AUDIT - Port 4 Evolutionary Pressure
 *
 * Gen87.X3 | Port 4 (Red Regnant) | TEST
 *
 * "The Red Queen runs just to stay in place."
 *
 * This script formalizes Stryker mutation testing under the authority of Port 4.
 */

import * as fs from 'node:fs';
import { RedRegnantDisruptorAdapter } from '../hot/bronze/quarantine/adapters/red-regnant-disruptor.adapter.js';

async function main() {
	const adapter = new RedRegnantDisruptorAdapter();
	const target = process.argv[2] || 'cold/silver/primitives/one-euro.ts';

	console.log(`\n👑 RED QUEEN AUDIT: ${target}`);
	console.log('═══════════════════════════════════════════════════════════════');

	// 1. Run Mutation Testing
	const mutationResult = await adapter.mutate(target);

	if (mutationResult.type.includes('error')) {
		console.error('❌ Mutation Error: Audit failed to complete.');
	} else {
		const data = mutationResult.data;
		const score = (data.score * 100).toFixed(2);
		console.log(`🧬 Mutation Score: ${score}%`);
		console.log(`   - Killed:   ${data.killed}`);
		console.log(`   - Survived: ${data.survived}`);
		console.log(`   - Total:    ${data.totalMutants}`);

		if (data.score < 0.8) {
			console.warn('⚠️  WARNING: Mutation score below 80% threshold!');
		} else {
			console.log('✅ SUCCESS: Mutation score meets evolutionary threshold.');
		}
	}

	// 2. Run Property Testing
	const propertyResult = await adapter.verifyProperties(target);
	if (propertyResult.type.includes('error')) {
		console.error('❌ Property Error: Verification failed to complete.');
	} else {
		const data = propertyResult.data;
		console.log(`💎 Property Check: ${data.passed ? 'PASSED' : 'FAILED'}`);
	}

	// 3. Emit Signal to Blackboard
	const signal = {
		ts: new Date().toISOString(),
		mark: mutationResult.hfomark || 0,
		pull: 'downstream',
		msg: `RED QUEEN: Audit complete for ${target}. Mutation: ${((mutationResult.hfomark || 0) * 100).toFixed(2)}%`,
		type: 'event',
		hive: 'V',
		gen: 87,
		port: 4,
	};

	fs.appendFileSync('obsidianblackboard.jsonl', `${JSON.stringify(signal)}\n`);
	console.log('\n📡 Signal emitted to blackboard.');
}

main().catch(console.error);
