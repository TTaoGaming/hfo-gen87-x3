/**
 * NATS Integration Test
 * =====================
 *
 * Proves NATS pub/sub is working for HFO stigmergy.
 *
 * QUARANTINED: Requires NATS server running.
 * Start with: docker-compose up -d nats
 *
 * Tests auto-skip when NATS is unavailable.
 */

import { type NatsConnection, StringCodec, connect } from 'nats';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Skip if NATS not available (auto-detect on connection failure)
let SKIP_NATS = process.env.SKIP_NATS === 'true';

describe('NATS Integration', () => {
	let nc: NatsConnection | null = null;
	const sc = StringCodec();

	beforeAll(async () => {
		if (SKIP_NATS) return;
		
		try {
			nc = await connect({ servers: 'nats://localhost:4222' });
		} catch {
			// NATS not available - mark for skip
			SKIP_NATS = true;
			nc = null;
		}
	});

	afterAll(async () => {
		if (nc) {
			await nc.drain();
		}
	});

	it('should connect to NATS server', () => {
		if (SKIP_NATS || !nc) return;
		
		expect(nc).toBeDefined();
		expect(nc.isClosed()).toBe(false);
	});

	it('should publish and subscribe to stigmergy signals', async () => {
		if (SKIP_NATS || !nc) return;
		
		const subject = 'hive.test.signal';
		const messages: string[] = [];

		// Subscribe
		const sub = nc.subscribe(subject);
		const done = (async () => {
			for await (const msg of sub) {
				messages.push(sc.decode(msg.data));
				if (messages.length >= 3) break;
			}
		})();

		// Give subscription time to register
		await new Promise((r) => setTimeout(r, 100));

		// Publish 3 test signals
		const testSignal = JSON.stringify({
			ts: new Date().toISOString(),
			mark: 1.0,
			pull: 'downstream',
			msg: 'NATS test signal',
			type: 'signal',
			hive: 'H',
			gen: 87,
			port: 7,
		});

		nc.publish(subject, sc.encode(testSignal));
		nc.publish(subject, sc.encode(testSignal));
		nc.publish(subject, sc.encode(testSignal));

		// Wait for messages with timeout
		await Promise.race([
			done,
			new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)),
		]);

		sub.unsubscribe();

		expect(messages).toHaveLength(3);
		expect(JSON.parse(messages[0])).toHaveProperty('hive', 'H');
	});

	it('should support HIVE phase subjects', async () => {
		if (SKIP_NATS || !nc) return;
		
		const phases = ['hunt', 'interlock', 'validate', 'evolve'];
		const received = new Map<string, number>();

		// Subscribe to all HIVE phases with wildcard
		const sub = nc.subscribe('hive.phase.*');
		const done = (async () => {
			let count = 0;
			for await (const msg of sub) {
				const phase = msg.subject.split('.')[2];
				received.set(phase, (received.get(phase) || 0) + 1);
				count++;
				if (count >= 4) break;
			}
		})();

		await new Promise((r) => setTimeout(r, 100));

		// Publish to each phase
		for (const phase of phases) {
			nc.publish(`hive.phase.${phase}`, sc.encode(`${phase} signal`));
		}

		await Promise.race([
			done,
			new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)),
		]);

		sub.unsubscribe();

		expect(received.size).toBe(4);
		for (const phase of phases) {
			expect(received.get(phase)).toBe(1);
		}
	});

	it('should respect port-specific subjects', async () => {
		if (SKIP_NATS || !nc) return;
		
		const portMessages = new Map<number, string[]>();

		// Subscribe to Port 7 (Spider Sovereign)
		const sub = nc.subscribe('hive.port.7');
		const done = (async () => {
			for await (const msg of sub) {
				const data = sc.decode(msg.data);
				const port = 7;
				if (!portMessages.has(port)) portMessages.set(port, []);
				portMessages.get(port)!.push(data);
				if (portMessages.get(port)!.length >= 2) break;
			}
		})();

		await new Promise((r) => setTimeout(r, 100));

		// Publish to Port 7
		nc.publish('hive.port.7', sc.encode('DECIDE command 1'));
		nc.publish('hive.port.7', sc.encode('DECIDE command 2'));

		await Promise.race([
			done,
			new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)),
		]);

		sub.unsubscribe();

		expect(portMessages.get(7)).toHaveLength(2);
		expect(portMessages.get(7)![0]).toContain('DECIDE');
	});
});
