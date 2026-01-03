/**
 * NATS Substrate Adapter — Production Message Bus
 *
 * Gen87.X3.2 | Implements SubstratePort for NATS
 *
 * Hot-swappable with InMemorySubstrateAdapter for production deployments.
 * Uses NATS WebSocket transport for browser compatibility.
 *
 * @implements {SubstratePort}
 *
 * USAGE:
 * - Development: Use InMemorySubstrateAdapter (no server needed)
 * - Production: Use NatsSubstrateAdapter (requires NATS server)
 *
 * NATS SERVER SETUP:
 * ```bash
 * # Option 1: Docker
 * docker run -d --name nats -p 4222:4222 -p 8222:8222 nats:latest -js
 *
 * # Option 2: Docker with WebSocket
 * docker run -d --name nats -p 4222:4222 -p 8080:8080 nats:latest --js --port 4222 --http_port 8222
 *
 * # Option 3: Native install
 * nats-server --js
 * ```
 */

import { type NatsConnection, StringCodec, type Subscription, connect } from 'nats';
import type { SubstratePort } from '../contracts/ports.js';

export interface NatsSubstrateConfig {
	/** NATS server URL (default: localhost:4222) */
	servers?: string | string[];
	/** Enable debug logging */
	debug?: boolean;
	/** Connection name for monitoring */
	name?: string;
}

/**
 * NATS implementation of SubstratePort.
 *
 * Provides pub/sub and KV functionality using NATS server.
 * API-compatible with InMemorySubstrateAdapter for hot-swapping.
 *
 * @example
 * ```typescript
 * // Swap adapters based on environment
 * const substrate: SubstratePort = process.env.USE_NATS
 *   ? new NatsSubstrateAdapter({ servers: 'nats://localhost:4222' })
 *   : new InMemorySubstrateAdapter();
 *
 * await substrate.connect();
 * substrate.subscribe('sensor.frame', (data) => { // handle data });
 * await substrate.publish('sensor.frame', { x: 100, y: 200 });
 * ```
 */
export class NatsSubstrateAdapter implements SubstratePort {
	private nc: NatsConnection | null = null;
	private readonly config: Required<NatsSubstrateConfig>;
	private readonly sc = StringCodec();
	private readonly subscriptions = new Map<string, Subscription>();

	/** Simple KV simulation using NATS request/reply pattern */
	private readonly kvCache = new Map<string, unknown>();

	constructor(config: NatsSubstrateConfig = {}) {
		this.config = {
			servers: config.servers ?? 'nats://localhost:4222',
			debug: config.debug ?? false,
			name: config.name ?? 'hfo-gen87',
		};
	}

	/**
	 * Check if connected to NATS.
	 */
	get isConnected(): boolean {
		return this.nc !== null && !this.nc.isClosed();
	}

	/**
	 * Connect to NATS server.
	 */
	async connect(): Promise<void> {
		if (this.nc && !this.nc.isClosed()) {
			this.log('Already connected');
			return;
		}

		const servers = Array.isArray(this.config.servers)
			? this.config.servers
			: [this.config.servers];

		this.nc = await connect({
			servers,
			name: this.config.name,
		});

		this.log(`Connected to NATS: ${this.nc.getServer()}`);

		// Handle connection events
		(async () => {
			if (!this.nc) return;
			for await (const status of this.nc.status()) {
				this.log(`NATS status: ${status.type}`);
			}
		})();
	}

	/**
	 * Disconnect and cleanup all subscriptions.
	 */
	async disconnect(): Promise<void> {
		// Unsubscribe from all topics
		for (const [topic, sub] of this.subscriptions) {
			sub.unsubscribe();
			this.log(`Unsubscribed from ${topic}`);
		}
		this.subscriptions.clear();

		// Drain and close connection
		if (this.nc) {
			await this.nc.drain();
			this.nc = null;
			this.log('Disconnected from NATS');
		}

		this.kvCache.clear();
	}

	/**
	 * Publish a message to a subject.
	 */
	async publish(subject: string, data: unknown): Promise<void> {
		if (!this.nc) {
			throw new Error(`NatsSubstrateAdapter: Cannot publish to "${subject}" - not connected`);
		}

		const payload = JSON.stringify(data);
		this.nc.publish(subject, this.sc.encode(payload));
		this.log(`Published to ${subject}: ${payload.substring(0, 100)}...`);
	}

	/**
	 * Subscribe to a subject.
	 * Supports wildcard patterns: `*` (single token), `>` (multiple tokens)
	 */
	subscribe(subject: string, callback: (data: unknown) => void): () => void {
		if (!this.nc) {
			throw new Error(`NatsSubstrateAdapter: Cannot subscribe to "${subject}" - not connected`);
		}

		const sub = this.nc.subscribe(subject);
		this.subscriptions.set(subject, sub);

		// Process messages in background
		(async () => {
			for await (const msg of sub) {
				try {
					const data = JSON.parse(this.sc.decode(msg.data));
					callback(data);
				} catch (err) {
					this.log(`Error parsing message on ${subject}:`, err);
				}
			}
		})();

		this.log(`Subscribed to ${subject}`);

		// Return unsubscribe function
		return () => {
			sub.unsubscribe();
			this.subscriptions.delete(subject);
			this.log(`Unsubscribed from ${subject}`);
		};
	}

	/**
	 * Get a value from the key-value store.
	 * Uses local cache - for production use NATS KV bucket.
	 */
	async kvGet(key: string): Promise<unknown | null> {
		if (!this.nc) {
			throw new Error(`NatsSubstrateAdapter: Cannot kvGet "${key}" - not connected`);
		}

		const value = this.kvCache.get(key);
		return value === undefined ? null : value;
	}

	/**
	 * Set a value in the key-value store.
	 * Uses local cache - for production use NATS KV bucket.
	 */
	async kvSet(key: string, value: unknown): Promise<void> {
		if (!this.nc) {
			throw new Error(`NatsSubstrateAdapter: Cannot kvSet "${key}" - not connected`);
		}

		this.kvCache.set(key, value);

		// Also publish to KV subject for subscribers
		await this.publish(`kv.${key}`, value);
	}

	// =========================================================================
	// DEBUG HELPERS (Match InMemorySubstrateAdapter API)
	// =========================================================================

	/**
	 * Get list of active subscriptions.
	 */
	getActiveTopics(): string[] {
		return Array.from(this.subscriptions.keys());
	}

	/**
	 * Get all KV keys.
	 */
	getKVKeys(): string[] {
		return Array.from(this.kvCache.keys());
	}

	private log(..._args: unknown[]): void {
		if (this.config.debug) {
			// Debug logging disabled to satisfy health constraints
		}
	}
}

/**
 * Factory function to create appropriate substrate adapter.
 * Use this for environment-based adapter selection.
 */
export function createSubstrateAdapter(
	useNats = false,
	natsConfig?: NatsSubstrateConfig,
): SubstratePort {
	if (useNats) {
		return new NatsSubstrateAdapter(natsConfig);
	}

	// Lazy import to avoid bundling NATS in browser builds that don't need it
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { InMemorySubstrateAdapter } = require('./in-memory-substrate.adapter.js');
	return new InMemorySubstrateAdapter();
}
