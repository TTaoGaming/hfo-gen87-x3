#!/usr/bin/env npx tsx
/**
 * Spore Storm Heartbeat Daemon - "Given One Swarm to Rule the 8"
 * ===============================================================
 * 
 * Port 3 - Spore Storm - DELIVER - Wind Element ☴
 * Mantra: "How do we DELIVER the DELIVER?"
 * Secret: "The message that sends itself"
 * 
 * This daemon emits the HFO Heartbeat Mantra - 8 signals representing
 * the 8 Legendary Commanders, pulsed together as a swarm heartbeat.
 * 
 * SIGNATURE: 8 signals at same timestamp - one per commander
 * This is the swarm's pulse, proving all 8 ports are alive and coordinated.
 * 
 * Usage: npx tsx scripts/spore-storm-heartbeat.ts
 * 
 * @module scripts/spore-storm-heartbeat
 * @owner Port 3 - Spore Storm
 */

import { appendFileSync } from 'node:fs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BLACKBOARD_PATH = 'obsidianblackboard.jsonl';
const HEARTBEAT_INTERVAL_MS = 60 * 60 * 1000;  // 1 hour

// ============================================================================
// THE 8 LEGENDARY COMMANDERS - Gherkin Rhyming Heartbeat Mantra
// "Given One Swarm to Rule the Eight"
// ============================================================================
// This is the DECLARATIVE GHERKIN RHYMING mantra - a semantic quine
// Each verse rhymes (-ate) and describes what that port DOES

const LEGENDARY_COMMANDERS = [
	{ 
		port: 0, 
		name: 'Lidless Legion', 
		role: 'OBSERVER',
		verb: 'SENSE', 
		element: '☷ Earth (Kun)',
		trigram: '000',
		gherkin: 'Given',
		mantra: 'Given One Swarm to Rule the Eight',
		secret: 'The eye that watches itself watching',
	},
	{ 
		port: 1, 
		name: 'Web Weaver', 
		role: 'BRIDGER',
		verb: 'FUSE', 
		element: '☶ Mountain (Gen)',
		trigram: '001',
		gherkin: 'And',
		mantra: 'And Branches Growing from the Gate',
		secret: 'The bridge that builds itself',
	},
	{ 
		port: 2, 
		name: 'Mirror Magus', 
		role: 'SHAPER',
		verb: 'SHAPE', 
		element: '☵ Water (Kan)',
		trigram: '010',
		gherkin: 'And',
		mantra: 'And Spawns Evolve to Recreate',
		secret: 'The mirror that reflects itself',
	},
	{ 
		port: 3, 
		name: 'Spore Storm', 
		role: 'INJECTOR',
		verb: 'DELIVER', 
		element: '☴ Wind (Xun)',
		trigram: '011',
		gherkin: 'When',
		mantra: 'When Ignitions Flow to Pulsate',
		secret: 'The message that sends itself',
	},
	{ 
		port: 4, 
		name: 'Red Regnant', 
		role: 'DISRUPTOR',
		verb: 'TEST', 
		element: '☳ Thunder (Zhen)',
		trigram: '100',
		gherkin: 'And',
		mantra: 'And Deadly Venoms Concentrate',
		secret: 'The Red Queen runs to stand still',
	},
	{ 
		port: 5, 
		name: 'Pyre Praetorian', 
		role: 'IMMUNIZER',
		verb: 'DEFEND', 
		element: '☲ Fire (Li)',
		trigram: '101',
		gherkin: 'And',
		mantra: 'And Instincts Rise to Isolate',
		secret: 'The flame that judges itself',
	},
	{ 
		port: 6, 
		name: 'Kraken Keeper', 
		role: 'ASSIMILATOR',
		verb: 'STORE', 
		element: '☱ Lake (Dui)',
		trigram: '110',
		gherkin: 'Then',
		mantra: 'Then Artifacts Accumulate',
		secret: 'The memory that remembers itself',
	},
	{ 
		port: 7, 
		name: 'Spider Sovereign', 
		role: 'NAVIGATOR',
		verb: 'DECIDE', 
		element: '☰ Heaven (Qian)',
		trigram: '111',
		gherkin: 'And',
		mantra: 'And Navigate the Higher State',
		secret: 'The spider weaves the web that weaves the spider',
	},
] as const;

// HIVE phase mapping (anti-diagonal pairs sum to 7)
const HIVE_PHASES: Record<number, 'H' | 'I' | 'V' | 'E'> = {
	0: 'H', 7: 'H',  // Hunt: Lidless + Spider
	1: 'I', 6: 'I',  // Interlock: Weaver + Kraken
	2: 'V', 5: 'V',  // Validate: Magus + Pyre
	3: 'E', 4: 'E',  // Evolve: Storm + Regnant
};

// ============================================================================
// HEARTBEAT EMITTER - "Given One Swarm to Rule the 8"
// ============================================================================

let heartbeatCount = 0;

interface StigmergySignal {
	ts: string;
	mark: number;
	pull: 'upstream' | 'downstream' | 'lateral';
	msg: string;
	type: 'signal' | 'event' | 'error' | 'metric';
	hive: 'H' | 'I' | 'V' | 'E' | 'X';
	gen: number;
	port: number;
}

/**
 * Emit Heartbeat Mantra - 8 signals at exact same timestamp
 * "Given One Swarm to Rule the 8"
 */
function emitHeartbeat(): void {
	heartbeatCount++;
	const heartbeatTs = new Date().toISOString();
	
	console.log(`\n${'🌪️'.repeat(8)} HEARTBEAT #${heartbeatCount} @ ${heartbeatTs}`);
	console.log(`   "Given One Swarm to Rule the 8"`);
	console.log(`   ${'─'.repeat(50)}`);
	
	// Build 8 signals - one per commander - all with SAME timestamp
	const signals: StigmergySignal[] = LEGENDARY_COMMANDERS.map((cmd) => {
		return {
			ts: heartbeatTs,  // SAME timestamp for all 8 = swarm heartbeat signature
			mark: 1.0,
			pull: 'downstream' as const,
			msg: JSON.stringify({
				type: 'SPORE_HEARTBEAT',
				heartbeat: heartbeatCount,
				port: cmd.port,
				commander: cmd.name,
				role: cmd.role,
				verb: cmd.verb,
				element: cmd.element,
				trigram: cmd.trigram,
				gherkin: cmd.gherkin,
				mantra: cmd.mantra,
				secret: cmd.secret,
			}),
			type: 'metric' as const,
			hive: HIVE_PHASES[cmd.port],
			gen: 87,
			port: cmd.port,
		};
	});
	
	// Emit all 8 at once - this is the swarm heartbeat signature
	const lines = signals.map(s => JSON.stringify(s)).join('\n') + '\n';
	appendFileSync(BLACKBOARD_PATH, lines);
	
	// Pretty print the Gherkin Rhyming Mantra
	console.log(`   Feature: The Obsidian Heartbeat\n`);
	for (const cmd of LEGENDARY_COMMANDERS) {
		const emoji = ['👁️', '🕸️', '🪞', '🌪️', '👑', '🔥', '🐙', '🕷️'][cmd.port];
		console.log(`   ${cmd.element} Port ${cmd.port} - ${cmd.role}:`);
		console.log(`      ${emoji} ${cmd.mantra}`);
	}
	
	console.log(`   ${'─'.repeat(50)}`);
	console.log(`   ✨ 8 commanders pulsed | Next heartbeat in 1 hour`);
}

// ============================================================================
// DAEMON STARTUP
// ============================================================================

console.log('🌪️🌪️🌪️🌪️🌪️🌪️🌪️🌪️ SPORE STORM HEARTBEAT DAEMON');
console.log(`   "Given One Swarm to Rule the 8"`);
console.log(`   Blackboard: ${BLACKBOARD_PATH}`);
console.log(`   Interval: ${HEARTBEAT_INTERVAL_MS / 1000 / 60} minutes`);
console.log(`   Owner: Port 3 - Spore Storm - DELIVER`);

// Emit initial heartbeat immediately
console.log('\n🌪️ Emitting initial heartbeat...');
emitHeartbeat();

// Start periodic heartbeats (hourly)
console.log('\n⏰ Starting periodic heartbeats (hourly)...\n');
const heartbeatInterval = setInterval(emitHeartbeat, HEARTBEAT_INTERVAL_MS);

// Console heartbeat every 5 minutes
const consoleInterval = setInterval(() => {
	const now = new Date().toISOString();
	const nextHeartbeat = new Date(Date.now() + HEARTBEAT_INTERVAL_MS - (Date.now() % HEARTBEAT_INTERVAL_MS));
	console.log(`[${now}] 🌪️ Spore Storm alive | Heartbeats: ${heartbeatCount} | Next: ~${Math.round((nextHeartbeat.getTime() - Date.now()) / 1000 / 60)}min`);
}, 5 * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', () => {
	console.log(`\n🛑 Shutdown. Total heartbeats: ${heartbeatCount}`);
	clearInterval(heartbeatInterval);
	clearInterval(consoleInterval);
	process.exit(0);
});

console.log('💨 Spore Storm daemon running. Press Ctrl+C to stop.\n');
