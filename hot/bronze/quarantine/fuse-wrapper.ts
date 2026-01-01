/**
 * Port 1: FUSE - Wrapper Adapter
 * ===============================
 * Web Weaver - "How do we FUSE the FUSE?"
 *
 * BEHAVIORAL CONTRACT (Galois Lattice Port 1):
 * - CAPABILITIES: validate, bridge, route, connect, transform_schema
 * - PROHIBITIONS: persist, make_decisions, sense_raw, test
 *
 * This adapter wraps raw sensed data in a standardized "vacuole" format
 * that flows through the rest of the pipeline. It VALIDATES and CONNECTS
 * but does NOT persist or make autonomous decisions.
 */

import { z } from 'zod';
import type { FusePort, FuseInput, FuseResult, SchemaDefinition, HFOPortMetadata } from '../contracts/hfo-ports.js';
import { PORT_METADATA } from '../contracts/hfo-ports.js';
import type { SensedGestureFrame } from './sense-mediapipe.js';

// ============================================================================
// VACUOLE SCHEMA (The Standardized Wrapper)
// ============================================================================

/**
 * A "Vacuole" is the standardized envelope that wraps all data flowing through the pipeline.
 * Named after biological vacuoles that encapsulate substances within cells.
 *
 * The Vacuole adds:
 * - Traceability (trace IDs, port chain)
 * - Validation metadata (schema version, validation status)
 * - Routing hints (target ports, priority)
 */
export const VacuoleSchema = z.object({
	// === Identity ===
	id: z.string().uuid(),
	traceId: z.string(),
	parentId: z.string().optional(),

	// === Provenance ===
	createdAt: z.string().datetime(),
	createdBy: z.object({
		port: z.number().min(0).max(7),
		verb: z.string(),
		commander: z.string(),
	}),

	// === Port Chain (tracks flow through ports) ===
	portChain: z.array(
		z.object({
			port: z.number().min(0).max(7),
			verb: z.string(),
			timestamp: z.string().datetime(),
		})
	),

	// === Schema Validation ===
	schemaName: z.string(),
	schemaVersion: z.string(),
	valid: z.boolean(),
	validationErrors: z.array(z.string()).optional(),

	// === Routing ===
	targetPorts: z.array(z.number().min(0).max(7)),
	priority: z.enum(['low', 'normal', 'high', 'critical']),

	// === Payload (the actual data, now wrapped) ===
	payload: z.unknown(),
});

export type Vacuole<T = unknown> = Omit<z.infer<typeof VacuoleSchema>, 'payload'> & {
	payload: T;
};

// ============================================================================
// FUSE PORT IMPLEMENTATION
// ============================================================================

export class FuseWrapperAdapter implements FusePort {
	readonly portNumber = 1 as const;
	readonly metadata: HFOPortMetadata = PORT_METADATA[1];

	private schemaRegistry: Map<string, SchemaDefinition> = new Map();
	private vacuoleCount = 0;
	private currentTraceId: string | null = null;

	// ========================================================================
	// HFOPort Interface
	// ========================================================================

	async heartbeat(): Promise<{ healthy: boolean; timestamp: string; details?: unknown }> {
		return {
			healthy: true,
			timestamp: new Date().toISOString(),
			details: {
				port: 1,
				verb: 'FUSE',
				commander: 'Web Weaver',
				vacuoleCount: this.vacuoleCount,
				registeredSchemas: this.schemaRegistry.size,
			},
		};
	}

	async initialize(): Promise<void> {
		console.log('[Port 1/FUSE] Web Weaver initializing...');

		// Register default schemas
		this.schemaRegistry.set('SensedGestureFrame', {
			name: 'SensedGestureFrame',
			schema: z.object({
				_port: z.literal(0),
				_verb: z.literal('SENSE'),
				_timestamp: z.string(),
				_source: z.string(),
				_frameId: z.number(),
				detected: z.boolean(),
				landmarks: z.array(z.object({ x: z.number(), y: z.number(), z: z.number() })),
				gesture: z.string(),
				confidence: z.number(),
				handedness: z.string().optional(),
			}),
			version: '1.0.0',
		});

		console.log('[Port 1/FUSE] Web Weaver ready.');
	}

	async shutdown(): Promise<void> {
		this.schemaRegistry.clear();
		console.log('[Port 1/FUSE] Web Weaver shutdown.');
	}

	// ========================================================================
	// FusePort Interface
	// ========================================================================

	/**
	 * Primary verb: FUSE
	 * Combines multiple sources and wraps in standardized format
	 */
	async fuse(input: FuseInput): Promise<FuseResult> {
		const { sources, schema, strategy = 'merge' } = input;

		// Validate all sources if schema provided
		let valid = true;
		const errors: string[] = [];

		if (schema) {
			for (let i = 0; i < sources.length; i++) {
				const result = await this.validate(sources[i], schema);
				if (!result.valid) {
					valid = false;
					errors.push(`Source ${i}: ${result.errors?.join(', ')}`);
				}
			}
		}

		// Fuse sources based on strategy
		let fused: unknown;
		const sourceMap: Record<string, number[]> = {};

		switch (strategy) {
			case 'concat':
				fused = sources;
				sources.forEach((_, i) => (sourceMap[`source_${i}`] = [i]));
				break;

			case 'override':
				fused = sources[sources.length - 1];
				sourceMap['final'] = [sources.length - 1];
				break;

			case 'merge':
			default:
				if (sources.every((s) => typeof s === 'object' && s !== null)) {
					fused = Object.assign({}, ...sources);
					sources.forEach((_, i) => (sourceMap[`source_${i}`] = [i]));
				} else {
					fused = sources;
					sources.forEach((_, i) => (sourceMap[`source_${i}`] = [i]));
				}
		}

		return { fused, valid, errors: errors.length > 0 ? errors : undefined, sourceMap };
	}

	/**
	 * Validate data against schema
	 */
	async validate(
		data: unknown,
		schema: SchemaDefinition
	): Promise<{ valid: boolean; errors?: string[] }> {
		try {
			schema.schema.parse(data);
			return { valid: true };
		} catch (e) {
			if (e instanceof z.ZodError) {
				return {
					valid: false,
					errors: e.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
				};
			}
			return { valid: false, errors: ['Unknown validation error'] };
		}
	}

	/**
	 * Bridge between adapters
	 */
	async bridge<TIn, TOut>(input: TIn, adapter: (x: TIn) => Promise<TOut>): Promise<TOut> {
		return adapter(input);
	}

	/**
	 * Route to appropriate handler
	 */
	async route(
		input: unknown,
		routes: Record<string, (x: unknown) => Promise<unknown>>
	): Promise<unknown> {
		// Simple type-based routing
		const type = typeof input;
		if (routes[type]) {
			return routes[type](input);
		}
		if (routes['default']) {
			return routes['default'](input);
		}
		throw new Error(`No route for type: ${type}`);
	}

	// ========================================================================
	// Extended Methods
	// ========================================================================

	/**
	 * Start a new trace (for pipeline tracking)
	 */
	startTrace(): string {
		this.currentTraceId = crypto.randomUUID();
		return this.currentTraceId;
	}

	/**
	 * Wrap raw sensed data in a Vacuole
	 * This is the main job of Port 1 - standardizing the envelope
	 */
	wrapInVacuole<T>(
		payload: T,
		options: {
			schemaName: string;
			targetPorts?: number[];
			priority?: 'low' | 'normal' | 'high' | 'critical';
			sourcePort?: number;
		}
	): Vacuole<T> {
		const now = new Date().toISOString();
		this.vacuoleCount++;

		// Validate against registered schema if available
		const schemaDef = this.schemaRegistry.get(options.schemaName);
		let valid = true;
		let validationErrors: string[] | undefined;

		if (schemaDef) {
			try {
				schemaDef.schema.parse(payload);
			} catch (e) {
				valid = false;
				if (e instanceof z.ZodError) {
					validationErrors = e.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
				}
			}
		}

		return {
			id: crypto.randomUUID(),
			traceId: this.currentTraceId ?? crypto.randomUUID(),
			createdAt: now,
			createdBy: {
				port: 1,
				verb: 'FUSE',
				commander: 'Web Weaver',
			},
			portChain: [
				...(options.sourcePort !== undefined
					? [{ port: options.sourcePort, verb: this.getVerbForPort(options.sourcePort), timestamp: now }]
					: []),
				{ port: 1, verb: 'FUSE', timestamp: now },
			],
			schemaName: options.schemaName,
			schemaVersion: schemaDef?.version ?? '1.0.0',
			valid,
			validationErrors,
			targetPorts: options.targetPorts ?? [2, 3], // Default: Shape → Deliver
			priority: options.priority ?? 'normal',
			payload,
		};
	}

	/**
	 * Add this port to an existing vacuole's chain
	 */
	passthrough<T>(vacuole: Vacuole<T>): Vacuole<T> {
		return {
			...vacuole,
			portChain: [
				...vacuole.portChain,
				{ port: 1, verb: 'FUSE', timestamp: new Date().toISOString() },
			],
		};
	}

	/**
	 * Register a schema for validation
	 */
	registerSchema(def: SchemaDefinition): void {
		this.schemaRegistry.set(def.name, def);
	}

	// ========================================================================
	// Private Helpers
	// ========================================================================

	private getVerbForPort(port: number): string {
		const verbs = ['SENSE', 'FUSE', 'SHAPE', 'DELIVER', 'TEST', 'DEFEND', 'STORE', 'DECIDE'];
		return verbs[port] ?? 'UNKNOWN';
	}
}

/**
 * Type guard for Vacuole
 */
export function isVacuole(obj: unknown): obj is Vacuole {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'id' in obj &&
		'traceId' in obj &&
		'portChain' in obj &&
		'payload' in obj
	);
}
