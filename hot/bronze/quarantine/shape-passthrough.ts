/**
 * Port 2: SHAPE - Passthrough Adapter
 * ====================================
 * Mirror Magus - "How do we SHAPE the SHAPE?"
 *
 * BEHAVIORAL CONTRACT (Galois Lattice Port 2):
 * - CAPABILITIES: transform, map, filter, reduce, extract_structure, smooth
 * - PROHIBITIONS: persist, make_decisions, sense_raw, validate_external, emit
 *
 * In passthrough mode, Port 2 is a PASSTHROUGH - it demonstrates that the pipeline
 * works even when a port does minimal transformation. In production, this
 * would apply smoothing, filtering, coordinate transforms, etc.
 */

import { z } from 'zod';
import type { ShapePort, ShapeInput, ShapeResult, ShapeSpec, HFOPortMetadata } from '../contracts/hfo-ports.js';
import { PORT_METADATA } from '../contracts/hfo-ports.js';
import type { Vacuole } from './fuse-wrapper.js';

// ============================================================================
// SHAPE PORT IMPLEMENTATION
// ============================================================================

export class ShapePassthroughAdapter implements ShapePort {
	readonly portNumber = 2 as const;
	readonly metadata: HFOPortMetadata = PORT_METADATA[2];

	private transformCount = 0;
	private passthroughMode = true; // Configurable, can be toggled

	// ========================================================================
	// HFOPort Interface
	// ========================================================================

	async heartbeat(): Promise<{ healthy: boolean; timestamp: string; details?: unknown }> {
		return {
			healthy: true,
			timestamp: new Date().toISOString(),
			details: {
				port: 2,
				verb: 'SHAPE',
				commander: 'Mirror Magus',
				transformCount: this.transformCount,
				passthroughMode: this.passthroughMode,
			},
		};
	}

	async initialize(): Promise<void> {
		console.log('[Port 2/SHAPE] Mirror Magus initializing...');
		console.log('[Port 2/SHAPE] Mode: PASSTHROUGH (passthrough mode)');
		console.log('[Port 2/SHAPE] Mirror Magus ready.');
	}

	async shutdown(): Promise<void> {
		console.log('[Port 2/SHAPE] Mirror Magus shutdown.');
	}

	// ========================================================================
	// ShapePort Interface
	// ========================================================================

	/**
	 * Primary verb: SHAPE
	 * Transforms data according to specs
	 */
	async shape(input: ShapeInput): Promise<ShapeResult> {
		const { data, specs } = input;
		this.transformCount++;

		if (this.passthroughMode || specs.length === 0) {
			// Passthrough mode - no transformation
			return {
				shaped: data,
				transformations: ['passthrough'],
				originalShape: this.describeShape(data),
				resultShape: this.describeShape(data),
			};
		}

		// Apply transformations
		let current = data;
		const appliedTransforms: string[] = [];

		for (const spec of specs) {
			current = this.applySpec(current, spec);
			appliedTransforms.push(spec.type);
		}

		return {
			shaped: current,
			transformations: appliedTransforms,
			originalShape: this.describeShape(data),
			resultShape: this.describeShape(current),
		};
	}

	/**
	 * Smooth/normalize data
	 */
	async smooth(
		data: unknown,
		options?: { window?: number; method?: string }
	): Promise<unknown> {
		// In passthrough mode, return as-is
		if (this.passthroughMode) return data;

		// Simple moving average for arrays
		if (Array.isArray(data) && data.every((x) => typeof x === 'number')) {
			const window = options?.window ?? 3;
			return this.movingAverage(data as number[], window);
		}

		return data;
	}

	/**
	 * Apply pattern/template
	 */
	async applyPattern(data: unknown, pattern: string): Promise<unknown> {
		// Pattern application (in production, would apply templates)
		if (this.passthroughMode) return data;

		// Simple pattern: JSON path extraction
		if (pattern.startsWith('$.') && typeof data === 'object' && data !== null) {
			const path = pattern.slice(2).split('.');
			let current: unknown = data;
			for (const key of path) {
				if (typeof current === 'object' && current !== null && key in current) {
					current = (current as Record<string, unknown>)[key];
				} else {
					return undefined;
				}
			}
			return current;
		}

		return data;
	}

	/**
	 * Extract structure from data
	 */
	async extractStructure(
		data: unknown
	): Promise<{ type: string; fields: string[]; nested?: unknown }> {
		if (data === null) return { type: 'null', fields: [] };
		if (Array.isArray(data)) {
			return {
				type: 'array',
				fields: [],
				nested: data.length > 0 ? await this.extractStructure(data[0]) : undefined,
			};
		}
		if (typeof data === 'object') {
			return {
				type: 'object',
				fields: Object.keys(data),
				nested: Object.fromEntries(
					await Promise.all(
						Object.entries(data).map(async ([k, v]) => [k, await this.extractStructure(v)])
					)
				),
			};
		}
		return { type: typeof data, fields: [] };
	}

	// ========================================================================
	// Extended Methods
	// ========================================================================

	/**
	 * Process a vacuole through the shaping pipeline
	 */
	processVacuole<T>(vacuole: Vacuole<T>): Vacuole<T> {
		this.transformCount++;

		// Add ourselves to the port chain
		const shapedVacuole: Vacuole<T> = {
			...vacuole,
			portChain: [
				...vacuole.portChain,
				{ port: 2, verb: 'SHAPE', timestamp: new Date().toISOString() },
			],
		};

		// In passthrough mode, payload is unchanged
		// In production, we would apply smoothing, filtering, etc.

		return shapedVacuole;
	}

	/**
	 * Enable/disable passthrough mode
	 */
	setPassthroughMode(enabled: boolean): void {
		this.passthroughMode = enabled;
		console.log(`[Port 2/SHAPE] Passthrough mode: ${enabled ? 'ON' : 'OFF'}`);
	}

	/**
	 * Get current mode
	 */
	isPassthrough(): boolean {
		return this.passthroughMode;
	}

	// ========================================================================
	// Private Helpers
	// ========================================================================

	private applySpec(data: unknown, spec: ShapeSpec): unknown {
		switch (spec.type) {
			case 'map':
				if (Array.isArray(data) && typeof spec.fn === 'function') {
					return data.map(spec.fn);
				}
				break;

			case 'filter':
				if (Array.isArray(data) && typeof spec.fn === 'function') {
					return data.filter(spec.fn as (x: unknown) => boolean);
				}
				break;

			case 'reduce':
				if (Array.isArray(data) && typeof spec.fn === 'function') {
					return data.reduce((acc, x) => (spec.fn as (acc: unknown, x: unknown) => unknown)(acc, x));
				}
				break;

			case 'transform':
				if (typeof spec.fn === 'function') {
					return spec.fn(data);
				}
				break;
		}

		return data;
	}

	private describeShape(data: unknown): string {
		if (data === null) return 'null';
		if (Array.isArray(data)) return `array[${data.length}]`;
		if (typeof data === 'object') {
			const keys = Object.keys(data);
			return `object{${keys.slice(0, 3).join(',')}${keys.length > 3 ? '...' : ''}}`;
		}
		return typeof data;
	}

	private movingAverage(data: number[], window: number): number[] {
		const result: number[] = [];
		for (let i = 0; i < data.length; i++) {
			const start = Math.max(0, i - Math.floor(window / 2));
			const end = Math.min(data.length, i + Math.ceil(window / 2));
			const slice = data.slice(start, end);
			result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
		}
		return result;
	}
}
