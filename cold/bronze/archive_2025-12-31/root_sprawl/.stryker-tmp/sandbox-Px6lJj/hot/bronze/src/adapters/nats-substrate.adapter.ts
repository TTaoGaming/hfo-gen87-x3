/**
 * NATS JetStream Adapter - HOT Stigmergy Substrate Implementation
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Port 1 (Web Weaver BRIDGER)
 *
 * PRINCIPLE: Production-ready from day 1. No EventEmitter shortcuts.
 * GROUNDED: Context7 NATS.js documentation, 2025-12-30
 *
 * This adapter provides:
 * - JetStream for durable message streams
 * - KV for real-time state
 * - Object Store for recordings
 * - Hard gate validation at every boundary
 */
// @ts-nocheck


import type { JetStreamClient, KV, NatsConnection, ObjectStore } from '@nats-io/jetstream';
import type { z } from 'zod';
import {
	type CursorPosition,
	CursorPositionSchema,
	DefaultStreamConfig,
	type FSMStateKV,
	FSMStateKVSchema,
	NatsSubjects,
	type SmootherConfig,
	SmootherConfigSchema,
	type StageGateConfig,
	type SwarmSignal,
	SwarmSignalSchema,
} from '../contracts/nats-substrate.js';

// ============================================================================
// NATS SUBSTRATE ADAPTER
// Central coordinator for all NATS operations
// ============================================================================

export interface NatsSubstrateOptions {
	/** WebSocket URL for browser, TCP for Node */
	servers: string | string[];
	/** Stream name (default: HFO_PIPELINE) */
	streamName?: string;
	/** KV bucket name (default: hfo-state) */
	kvBucket?: string;
	/** Object store name (default: hfo-recordings) */
	objStore?: string;
	/** Enable debug logging */
	debug?: boolean;
}

export class NatsSubstrateAdapter {
	private nc: NatsConnection | null = null;
	private js: JetStreamClient | null = null;
	private kv: KV | null = null;
	private obj: ObjectStore | null = null;
	private readonly options: Required<NatsSubstrateOptions>;
	private readonly gates: Map<string, AbortController> = new Map();

	constructor(options: NatsSubstrateOptions) {
		this.options = {
			streamName: 'HFO_PIPELINE',
			kvBucket: 'hfo-state',
			objStore: 'hfo-recordings',
			debug: false,
			...options,
		};
	}

	// ============================================================================
	// LIFECYCLE
	// ============================================================================

	/**
	 * Connect to NATS and initialize JetStream, KV, and Object Store
	 */
	async connect(): Promise<void> {
		// Dynamic import to support both browser and Node
		const { wsconnect } = await import('@nats-io/nats-core');
		const { jetstream, jetstreamManager } = await import('@nats-io/jetstream');
		const { Kvm } = await import('@nats-io/kv');
		const { Objm } = await import('@nats-io/obj');

		// Connect via WebSocket (browser-safe)
		this.nc = await wsconnect({
			servers: Array.isArray(this.options.servers) ? this.options.servers : [this.options.servers],
		});

		this.log(`Connected to NATS: ${this.nc.getServer()}`);

		// Initialize JetStream
		const jsm = await jetstreamManager(this.nc);
		this.js = jetstream(this.nc);

		// Ensure stream exists
		try {
			await jsm.streams.info(this.options.streamName);
			this.log(`Stream ${this.options.streamName} exists`);
		} catch {
			await jsm.streams.add({
				name: DefaultStreamConfig.name,
				subjects: DefaultStreamConfig.subjects,
				retention: 'limits' as any,
				max_age: DefaultStreamConfig.maxAge,
				storage: DefaultStreamConfig.storage as any,
				num_replicas: DefaultStreamConfig.replicas,
			});
			this.log(`Created stream ${this.options.streamName}`);
		}

		// Initialize KV
		const kvm = new Kvm(this.nc);
		try {
			this.kv = await kvm.open(this.options.kvBucket);
		} catch {
			this.kv = await kvm.create(this.options.kvBucket, { history: 5 });
		}
		this.log(`KV bucket ${this.options.kvBucket} ready`);

		// Initialize Object Store
		const objm = new Objm(this.nc);
		try {
			this.obj = await objm.open(this.options.objStore);
		} catch {
			this.obj = await objm.create(this.options.objStore, {
				description: 'Gesture recordings for ML training',
			});
		}
		this.log(`Object store ${this.options.objStore} ready`);
	}

	/**
	 * Gracefully disconnect from NATS
	 */
	async disconnect(): Promise<void> {
		// Stop all gates
		for (const [name, controller] of this.gates) {
			controller.abort();
			this.log(`Stopped gate: ${name}`);
		}
		this.gates.clear();

		// Drain and close connection
		if (this.nc) {
			await this.nc.drain();
			await this.nc.close();
			this.nc = null;
			this.js = null;
			this.kv = null;
			this.obj = null;
			this.log('Disconnected from NATS');
		}
	}

	// ============================================================================
	// JETSTREAM OPERATIONS
	// ============================================================================

	/**
	 * Publish a message to a JetStream subject with Zod validation
	 */
	async publish<T>(subject: string, data: T, schema: z.ZodType<T>): Promise<void> {
		if (!this.js) throw new Error('Not connected to NATS');

		// Hard gate: Validate before publishing
		const validated = schema.parse(data);
		await this.js.publish(subject, JSON.stringify(validated));
		this.log(`Published to ${subject}`);
	}

	/**
	 * Create a stage gate that validates input/output and transforms data
	 */
	async createStageGate<TIn, TOut>(config: StageGateConfig<TIn, TOut>): Promise<void> {
		if (!this.js || !this.nc) throw new Error('Not connected to NATS');

		const { jetstreamManager, AckPolicy, DeliverPolicy } = await import('@nats-io/jetstream');
		const jsm = await jetstreamManager(this.nc);

		// Ensure consumer exists
		try {
			await jsm.consumers.info(this.options.streamName, config.consumerName);
		} catch {
			await jsm.consumers.add(this.options.streamName, {
				durable_name: config.consumerName,
				filter_subject: config.inputSubject,
				ack_policy: AckPolicy.Explicit,
				deliver_policy: DeliverPolicy.New,
				max_ack_pending: 100,
			});
		}

		// Create abort controller for graceful shutdown
		const controller = new AbortController();
		this.gates.set(config.consumerName, controller);

		// Start consuming
		const consumer = await this.js.consumers.get(this.options.streamName, config.consumerName);
		const messages = await consumer.consume();

		// Process messages (runs in background)
		(async () => {
			for await (const msg of messages) {
				if (controller.signal.aborted) break;

				try {
					// Gate 1: Validate input
					const rawInput = JSON.parse(msg.string());
					const validInput = config.inputSchema.parse(rawInput);

					// Transform
					const output = await config.transform(validInput);

					// Gate 2: Validate output
					const validOutput = config.outputSchema.parse(output);

					// Publish to next stage
					await this.js!.publish(config.outputSubject, JSON.stringify(validOutput));

					// Update KV state if configured
					if (config.kvStateKey && this.kv) {
						await this.kv.put(config.kvStateKey, JSON.stringify(validOutput));
					}

					// Acknowledge successful processing
					msg.ack();
					this.log(`Gate ${config.consumerName}: processed ${msg.seq}`);
				} catch (err) {
					this.log(`Gate ${config.consumerName} error:`, err);
					msg.nak(); // Will be redelivered
				}
			}
		})();

		this.log(`Stage gate ${config.consumerName} started`);
	}

	// ============================================================================
	// KV OPERATIONS
	// ============================================================================

	/**
	 * Get current cursor position from KV
	 */
	async getCursorPosition(handId: 'left' | 'right'): Promise<CursorPosition | null> {
		if (!this.kv) throw new Error('Not connected to NATS');

		const entry = await this.kv.get(NatsSubjects.state.cursorPosition(handId));
		if (!entry) return null;

		return CursorPositionSchema.parse(JSON.parse(entry.string()));
	}

	/**
	 * Set cursor position in KV
	 */
	async setCursorPosition(handId: 'left' | 'right', position: CursorPosition): Promise<void> {
		if (!this.kv) throw new Error('Not connected to NATS');

		const validated = CursorPositionSchema.parse(position);
		await this.kv.put(NatsSubjects.state.cursorPosition(handId), JSON.stringify(validated));
	}

	/**
	 * Get current FSM state from KV
	 */
	async getFSMState(handId: 'left' | 'right'): Promise<FSMStateKV | null> {
		if (!this.kv) throw new Error('Not connected to NATS');

		const entry = await this.kv.get(NatsSubjects.state.fsmState(handId));
		if (!entry) return null;

		return FSMStateKVSchema.parse(JSON.parse(entry.string()));
	}

	/**
	 * Set FSM state in KV
	 */
	async setFSMState(handId: 'left' | 'right', state: FSMStateKV): Promise<void> {
		if (!this.kv) throw new Error('Not connected to NATS');

		const validated = FSMStateKVSchema.parse(state);
		await this.kv.put(NatsSubjects.state.fsmState(handId), JSON.stringify(validated));
	}

	/**
	 * Get smoother configuration from KV
	 */
	async getSmootherConfig(): Promise<SmootherConfig | null> {
		if (!this.kv) throw new Error('Not connected to NATS');

		const entry = await this.kv.get(NatsSubjects.state.configSmoother);
		if (!entry) return null;

		return SmootherConfigSchema.parse(JSON.parse(entry.string()));
	}

	/**
	 * Set smoother configuration in KV (hot reload)
	 */
	async setSmootherConfig(config: SmootherConfig): Promise<void> {
		if (!this.kv) throw new Error('Not connected to NATS');

		const validated = SmootherConfigSchema.parse(config);
		await this.kv.put(NatsSubjects.state.configSmoother, JSON.stringify(validated));
		this.log('Smoother config updated (hot reload)');
	}

	/**
	 * Watch for KV changes (real-time sync)
	 */
	async watchKV(
		keyPattern: string,
		callback: (key: string, value: unknown, operation: string) => void,
	): Promise<() => void> {
		if (!this.kv) throw new Error('Not connected to NATS');

		const watcher = await this.kv.watch({ key: keyPattern });
		let running = true;

		(async () => {
			for await (const entry of watcher) {
				if (!running) break;
				callback(entry.key, JSON.parse(entry.string()), entry.operation);
			}
		})();

		return () => {
			running = false;
			watcher.stop();
		};
	}

	// ============================================================================
	// OBJECT STORE OPERATIONS
	// ============================================================================

	/**
	 * Save recording session to Object Store
	 */
	async saveRecording(
		sessionId: string,
		frames: unknown[],
		events: unknown[],
		metadata: unknown,
	): Promise<void> {
		if (!this.obj) throw new Error('Not connected to NATS');

		// Save metadata
		const metadataPath = NatsSubjects.recordings.metadata(sessionId);
		await this.obj.putBlob(
			{ name: metadataPath },
			new TextEncoder().encode(JSON.stringify(metadata)),
		);

		// Save frames as JSONL
		const framesPath = NatsSubjects.recordings.frames(sessionId);
		const framesData = frames.map((f) => JSON.stringify(f)).join('\n');
		await this.obj.putBlob({ name: framesPath }, new TextEncoder().encode(framesData));

		// Save events as JSONL
		const eventsPath = NatsSubjects.recordings.events(sessionId);
		const eventsData = events.map((e) => JSON.stringify(e)).join('\n');
		await this.obj.putBlob({ name: eventsPath }, new TextEncoder().encode(eventsData));

		this.log(`Saved recording ${sessionId}: ${frames.length} frames, ${events.length} events`);
	}

	/**
	 * Load recording from Object Store
	 */
	async loadRecording(sessionId: string): Promise<{
		metadata: unknown;
		frames: unknown[];
		events: unknown[];
	} | null> {
		if (!this.obj) throw new Error('Not connected to NATS');

		try {
			const metadataPath = NatsSubjects.recordings.metadata(sessionId);
			const metadataResult = await this.obj.get(metadataPath);
			if (!metadataResult) return null;

			const metadataBytes = await metadataResult.read();
			const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));

			const framesPath = NatsSubjects.recordings.frames(sessionId);
			const framesResult = await this.obj.get(framesPath);
			const framesBytes = framesResult ? await framesResult.read() : new Uint8Array();
			const frames = new TextDecoder()
				.decode(framesBytes)
				.split('\n')
				.filter((l) => l)
				.map((l) => JSON.parse(l));

			const eventsPath = NatsSubjects.recordings.events(sessionId);
			const eventsResult = await this.obj.get(eventsPath);
			const eventsBytes = eventsResult ? await eventsResult.read() : new Uint8Array();
			const events = new TextDecoder()
				.decode(eventsBytes)
				.split('\n')
				.filter((l) => l)
				.map((l) => JSON.parse(l));

			return { metadata, frames, events };
		} catch {
			return null;
		}
	}

	// ============================================================================
	// SWARM COORDINATION
	// ============================================================================

	/**
	 * Emit a swarm signal for AI agent coordination
	 */
	async emitSwarmSignal(signal: SwarmSignal): Promise<void> {
		if (!this.js) throw new Error('Not connected to NATS');

		const validated = SwarmSignalSchema.parse(signal);
		const phase =
			signal.phase === 'H'
				? 'hunt'
				: signal.phase === 'I'
					? 'interlock'
					: signal.phase === 'V'
						? 'validate'
						: 'evolve';

		await this.js.publish(NatsSubjects.swarm.signal(phase), JSON.stringify(validated));
		this.log(`Swarm signal emitted: ${signal.phase} - ${signal.msg}`);
	}

	// ============================================================================
	// UTILITIES
	// ============================================================================

	private log(...args: unknown[]): void {
		if (this.options.debug) {
			console.log('[NATS]', ...args);
		}
	}

	get isConnected(): boolean {
		return this.nc !== null;
	}
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create and connect to NATS substrate
 */
export async function createNatsSubstrate(
	options: NatsSubstrateOptions,
): Promise<NatsSubstrateAdapter> {
	const adapter = new NatsSubstrateAdapter(options);
	await adapter.connect();
	return adapter;
}
