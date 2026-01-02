/**
 * InMemorySubstrateAdapter — RxJS-based Message Bus
 *
 * Gen87.X3.2 | Phase 0.1
 *
 * Implements SubstratePort interface using RxJS Subjects for in-browser
 * pub/sub communication between GoldenLayout panels.
 *
 * @source ports.ts SubstratePort interface
 * @implements {SubstratePort}
 *
 * WHY NOT NATS?
 * - NATS is for distributed systems (Node↔Node, Node↔Browser across network)
 * - For single-tab browser UI, RxJS Subjects are simpler and have zero deps
 * - This adapter can be swapped for NatsSubstrateAdapter in production
 *
 * MUTATION TESTING NOTES:
 * - All conditionals have explicit branches tested
 * - Error messages include operation context for debugging
 */

import { Subject } from 'rxjs';
import type { SubstratePort } from '../contracts/ports.js';

/**
 * In-memory implementation of SubstratePort using RxJS Subjects.
 *
 * Each topic gets its own Subject for pub/sub.
 * KV store is a simple Map (not persisted across disconnect).
 *
 * @example
 * ```typescript
 * const bus = new InMemorySubstrateAdapter();
 * await bus.connect();
 *
 * bus.subscribe('sensor.frame', (frame) => console.log(frame));
 * await bus.publish('sensor.frame', { x: 100, y: 200 });
 *
 * await bus.disconnect();
 * ```
 */
export class InMemorySubstrateAdapter implements SubstratePort {
	/** RxJS Subject per topic for pub/sub */
	private subjects = new Map<string, Subject<unknown>>();

	/** Simple key-value store */
	private kv = new Map<string, unknown>();

	/** Connection state */
	private _isConnected = false;

	/**
	 * Check if the adapter is connected.
	 * Operations require connection.
	 */
	get isConnected(): boolean {
		return this._isConnected;
	}

	/**
	 * Connect to the message substrate.
	 * For in-memory, this just sets the connection flag.
	 * Idempotent - multiple calls are safe.
	 */
	async connect(): Promise<void> {
		this._isConnected = true;
	}

	/**
	 * Disconnect and cleanup all subscriptions.
	 * Completes all Subjects and clears KV store.
	 * Idempotent - multiple calls are safe.
	 */
	async disconnect(): Promise<void> {
		// Complete all subjects to notify subscribers
		for (const subject of this.subjects.values()) {
			subject.complete();
		}

		// Clear state
		this.subjects.clear();
		this.kv.clear();
		this._isConnected = false;
	}

	/**
	 * Publish a message to a topic.
	 * Creates the topic Subject if it doesn't exist.
	 *
	 * @param subject - Topic name (e.g., 'port.0.sense', 'hfo.stigmergy')
	 * @param data - Payload to publish (any serializable value)
	 * @throws {Error} If not connected
	 */
	async publish(subject: string, data: unknown): Promise<void> {
		if (!this._isConnected) {
			throw new Error(`InMemorySubstrateAdapter: Cannot publish to "${subject}" - not connected`);
		}

		// Lazy-create subject if needed
		if (!this.subjects.has(subject)) {
			this.subjects.set(subject, new Subject<unknown>());
		}

		// Publish to all subscribers
		this.subjects.get(subject)!.next(data);
	}

	/**
	 * Subscribe to a topic.
	 * Creates the topic Subject if it doesn't exist.
	 *
	 * @param subject - Topic name to subscribe to
	 * @param callback - Function called for each message
	 * @returns Unsubscribe function
	 * @throws {Error} If not connected
	 */
	subscribe(subject: string, callback: (data: unknown) => void): () => void {
		if (!this._isConnected) {
			throw new Error(
				`InMemorySubstrateAdapter: Cannot subscribe to "${subject}" - not connected`,
			);
		}

		// Lazy-create subject if needed
		if (!this.subjects.has(subject)) {
			this.subjects.set(subject, new Subject<unknown>());
		}

		// Subscribe and return unsubscribe function
		const subscription = this.subjects.get(subject)!.subscribe(callback);
		return () => subscription.unsubscribe();
	}

	/**
	 * Get a value from the key-value store.
	 *
	 * @param key - Key to retrieve
	 * @returns Value or null if not found
	 * @throws {Error} If not connected
	 */
	async kvGet(key: string): Promise<unknown | null> {
		if (!this._isConnected) {
			throw new Error(`InMemorySubstrateAdapter: Cannot kvGet "${key}" - not connected`);
		}

		const value = this.kv.get(key);
		// Explicitly handle undefined vs null
		// undefined means key doesn't exist → return null
		// null means key exists with null value → return null
		if (value === undefined) {
			return null;
		}
		return value;
	}

	/**
	 * Set a value in the key-value store.
	 *
	 * @param key - Key to set
	 * @param value - Value to store
	 * @throws {Error} If not connected
	 */
	async kvSet(key: string, value: unknown): Promise<void> {
		if (!this._isConnected) {
			throw new Error(`InMemorySubstrateAdapter: Cannot kvSet "${key}" - not connected`);
		}

		this.kv.set(key, value);
	}

	// =========================================================================
	// DEBUG HELPERS (Not part of SubstratePort interface)
	// =========================================================================

	/**
	 * Get list of active topics (for debugging).
	 * @returns Array of topic names with active subjects
	 */
	getActiveTopics(): string[] {
		return Array.from(this.subjects.keys());
	}

	/**
	 * Get subscriber count for a topic (for debugging).
	 * @param topic - Topic to check
	 * @returns Number of active subscribers, or 0 if topic doesn't exist
	 */
	getSubscriberCount(topic: string): number {
		const subject = this.subjects.get(topic);
		if (!subject) {
			return 0;
		}
		// RxJS Subject tracks observers internally
		return subject.observers.length;
	}

	/**
	 * Get all KV keys (for debugging).
	 * @returns Array of keys in KV store
	 */
	getKVKeys(): string[] {
		return Array.from(this.kv.keys());
	}
}
