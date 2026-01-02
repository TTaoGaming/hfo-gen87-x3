/**
 * InMemorySubstrateAdapter Tests — TDD RED Phase
 *
 * Gen87.X3.2 | Phase 0.1
 *
 * Contract: SubstratePort from ports.ts
 * Implementation: RxJS Subject per topic
 *
 * @source ports.ts lines 370-400
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SubstratePort } from '../contracts/ports.js';
import { InMemorySubstrateAdapter } from './in-memory-substrate.adapter.js';

describe('InMemorySubstrateAdapter', () => {
	let adapter: InMemorySubstrateAdapter;

	beforeEach(() => {
		adapter = new InMemorySubstrateAdapter();
	});

	afterEach(async () => {
		if (adapter.isConnected) {
			await adapter.disconnect();
		}
	});

	// =========================================================================
	// CONTRACT COMPLIANCE: SubstratePort Interface
	// =========================================================================

	describe('SubstratePort Interface Compliance', () => {
		it('implements SubstratePort interface', () => {
			// Type check - if this compiles, interface is implemented
			const port: SubstratePort = adapter;
			expect(port).toBeDefined();
		});

		it('has connect method', () => {
			expect(typeof adapter.connect).toBe('function');
		});

		it('has disconnect method', () => {
			expect(typeof adapter.disconnect).toBe('function');
		});

		it('has publish method', () => {
			expect(typeof adapter.publish).toBe('function');
		});

		it('has subscribe method', () => {
			expect(typeof adapter.subscribe).toBe('function');
		});

		it('has kvGet method', () => {
			expect(typeof adapter.kvGet).toBe('function');
		});

		it('has kvSet method', () => {
			expect(typeof adapter.kvSet).toBe('function');
		});

		it('has isConnected property', () => {
			expect(typeof adapter.isConnected).toBe('boolean');
		});
	});

	// =========================================================================
	// CONNECTION LIFECYCLE
	// =========================================================================

	describe('Connection Lifecycle', () => {
		it('starts disconnected', () => {
			expect(adapter.isConnected).toBe(false);
		});

		it('connect() sets isConnected to true', async () => {
			await adapter.connect();
			expect(adapter.isConnected).toBe(true);
		});

		it('disconnect() sets isConnected to false', async () => {
			await adapter.connect();
			await adapter.disconnect();
			expect(adapter.isConnected).toBe(false);
		});

		it('connect() is idempotent', async () => {
			await adapter.connect();
			await adapter.connect();
			expect(adapter.isConnected).toBe(true);
		});

		it('disconnect() is idempotent', async () => {
			await adapter.connect();
			await adapter.disconnect();
			await adapter.disconnect();
			expect(adapter.isConnected).toBe(false);
		});

		it('can reconnect after disconnect', async () => {
			await adapter.connect();
			await adapter.disconnect();
			await adapter.connect();
			expect(adapter.isConnected).toBe(true);
		});
	});

	// =========================================================================
	// PUBLISH / SUBSCRIBE (Core Stigmergy)
	// =========================================================================

	describe('Publish/Subscribe', () => {
		beforeEach(async () => {
			await adapter.connect();
		});

		it('subscriber receives published message', async () => {
			const received: unknown[] = [];
			adapter.subscribe('test.topic', (data) => received.push(data));

			await adapter.publish('test.topic', { value: 42 });

			// RxJS Subject is synchronous
			expect(received).toHaveLength(1);
			expect(received[0]).toEqual({ value: 42 });
		});

		it('multiple subscribers receive same message', async () => {
			const received1: unknown[] = [];
			const received2: unknown[] = [];

			adapter.subscribe('test.topic', (data) => received1.push(data));
			adapter.subscribe('test.topic', (data) => received2.push(data));

			await adapter.publish('test.topic', { value: 'hello' });

			expect(received1).toHaveLength(1);
			expect(received2).toHaveLength(1);
			expect(received1[0]).toEqual({ value: 'hello' });
			expect(received2[0]).toEqual({ value: 'hello' });
		});

		it('unsubscribe stops receiving messages', async () => {
			const received: unknown[] = [];
			const unsub = adapter.subscribe('test.topic', (data) => received.push(data));

			await adapter.publish('test.topic', { msg: 1 });
			unsub();
			await adapter.publish('test.topic', { msg: 2 });

			expect(received).toHaveLength(1);
			expect(received[0]).toEqual({ msg: 1 });
		});

		it('different topics are isolated', async () => {
			const topicA: unknown[] = [];
			const topicB: unknown[] = [];

			adapter.subscribe('topic.a', (data) => topicA.push(data));
			adapter.subscribe('topic.b', (data) => topicB.push(data));

			await adapter.publish('topic.a', { from: 'A' });
			await adapter.publish('topic.b', { from: 'B' });

			expect(topicA).toHaveLength(1);
			expect(topicB).toHaveLength(1);
			expect(topicA[0]).toEqual({ from: 'A' });
			expect(topicB[0]).toEqual({ from: 'B' });
		});

		it('subscribing to non-existent topic creates it', async () => {
			const received: unknown[] = [];
			adapter.subscribe('new.topic', (data) => received.push(data));
			await adapter.publish('new.topic', { data: 'test' });

			expect(received).toHaveLength(1);
		});

		it('publishing to topic with no subscribers is silent', async () => {
			// Should not throw
			await expect(adapter.publish('no.subscribers', { data: 'test' })).resolves.toBeUndefined();
		});

		it('disconnect completes all subjects', async () => {
			const received: unknown[] = [];
			adapter.subscribe('test.topic', (data) => received.push(data));

			await adapter.disconnect();

			// After disconnect, publishing should not reach old subscribers
			await adapter.connect();
			await adapter.publish('test.topic', { msg: 'after' });

			// Old subscription was completed, shouldn't receive
			expect(received).toHaveLength(0);
		});
	});

	// =========================================================================
	// KEY-VALUE STORE
	// =========================================================================

	describe('Key-Value Store', () => {
		beforeEach(async () => {
			await adapter.connect();
		});

		it('kvGet returns null for non-existent key', async () => {
			const value = await adapter.kvGet('nonexistent');
			expect(value).toBeNull();
		});

		it('kvSet then kvGet returns value', async () => {
			await adapter.kvSet('mykey', { data: 'test' });
			const value = await adapter.kvGet('mykey');
			expect(value).toEqual({ data: 'test' });
		});

		it('kvSet overwrites existing value', async () => {
			await adapter.kvSet('key', 'first');
			await adapter.kvSet('key', 'second');
			const value = await adapter.kvGet('key');
			expect(value).toBe('second');
		});

		it('kvGet returns primitives correctly', async () => {
			await adapter.kvSet('num', 42);
			await adapter.kvSet('str', 'hello');
			await adapter.kvSet('bool', true);
			await adapter.kvSet('null', null);

			expect(await adapter.kvGet('num')).toBe(42);
			expect(await adapter.kvGet('str')).toBe('hello');
			expect(await adapter.kvGet('bool')).toBe(true);
			expect(await adapter.kvGet('null')).toBeNull(); // null stored as null
		});

		it('KV persists across reconnect', async () => {
			await adapter.kvSet('persist', 'value');
			await adapter.disconnect();
			await adapter.connect();

			// Note: In-memory doesn't persist, but within same instance it should
			// This test documents expected behavior
			const value = await adapter.kvGet('persist');
			// In-memory: cleared on disconnect
			expect(value).toBeNull();
		});
	});

	// =========================================================================
	// ERROR HANDLING
	// =========================================================================

	describe('Error Handling', () => {
		it('publish before connect throws', async () => {
			await expect(adapter.publish('topic', {})).rejects.toThrow(/not connected/i);
		});

		it('subscribe before connect throws', () => {
			expect(() => adapter.subscribe('topic', () => {})).toThrow(/not connected/i);
		});

		it('kvGet before connect throws', async () => {
			await expect(adapter.kvGet('key')).rejects.toThrow(/not connected/i);
		});

		it('kvSet before connect throws', async () => {
			await expect(adapter.kvSet('key', 'value')).rejects.toThrow(/not connected/i);
		});
	});

	// =========================================================================
	// HFO-SPECIFIC: Signal Typing
	// =========================================================================

	describe('HFO Signal Integration', () => {
		beforeEach(async () => {
			await adapter.connect();
		});

		it('can publish HFO stigmergy signal', async () => {
			const signal = {
				ts: new Date().toISOString(),
				mark: 1.0,
				pull: 'downstream',
				msg: 'test signal',
				type: 'signal',
				hive: 'H',
				gen: 87,
				port: 7,
			};

			const received: unknown[] = [];
			adapter.subscribe('hfo.stigmergy', (data) => received.push(data));
			await adapter.publish('hfo.stigmergy', signal);

			expect(received).toHaveLength(1);
			expect(received[0]).toEqual(signal);
		});

		it('supports port-specific topics', async () => {
			const portTopics = [
				'port.0.sense',
				'port.1.fuse',
				'port.2.shape',
				'port.3.deliver',
				'port.4.test',
				'port.5.defend',
				'port.6.store',
				'port.7.decide',
			];

			const received = new Map<string, unknown[]>();

			for (const topic of portTopics) {
				received.set(topic, []);
				adapter.subscribe(topic, (data) => received.get(topic)?.push(data));
			}

			for (const topic of portTopics) {
				await adapter.publish(topic, { topic });
			}

			for (const topic of portTopics) {
				expect(received.get(topic)).toHaveLength(1);
				expect(received.get(topic)?.[0]).toEqual({ topic });
			}
		});
	});

	// =========================================================================
	// PERFORMANCE / STRESS
	// =========================================================================

	describe('Performance', () => {
		beforeEach(async () => {
			await adapter.connect();
		});

		it('handles 1000 messages without blocking', async () => {
			const received: unknown[] = [];
			adapter.subscribe('perf.topic', (data) => received.push(data));

			const start = performance.now();
			for (let i = 0; i < 1000; i++) {
				await adapter.publish('perf.topic', { i });
			}
			const elapsed = performance.now() - start;

			expect(received).toHaveLength(1000);
			expect(elapsed).toBeLessThan(1000); // Should complete in <1s
		});

		it('handles 100 concurrent subscribers', async () => {
			const subscribers: unknown[][] = [];

			for (let i = 0; i < 100; i++) {
				const arr: unknown[] = [];
				subscribers.push(arr);
				adapter.subscribe('fan.out', (data) => arr.push(data));
			}

			await adapter.publish('fan.out', { msg: 'broadcast' });

			for (const sub of subscribers) {
				expect(sub).toHaveLength(1);
				expect(sub[0]).toEqual({ msg: 'broadcast' });
			}
		});
	});
});
