/**
 * OneEuroSmoother - REAL Implementation
 * =====================================
 * Uses npm 1eurofilter@1.2.2 by Géry Casiez (original author)
 *
 * Port 2: SHAPE - Mirror Magus
 * CAPABILITIES: transform, smooth
 * PROHIBITIONS: persist, emit, decide
 */

import { OneEuroFilter } from '1eurofilter';
import { z } from 'zod';

// ============================================================================
// SCHEMAS (CDD - Contract Driven Development)
// ============================================================================

export const SmootherConfigSchema = z.object({
	freq: z.number().min(1).max(1000).default(60),
	minCutoff: z.number().min(0).max(10).default(1.0),
	beta: z.number().min(0).max(10).default(0.007),
	dCutoff: z.number().min(0).max(10).default(1.0),
});

export type SmootherConfig = z.infer<typeof SmootherConfigSchema>;

export const Point2DSchema = z.object({
	x: z.number().finite(),
	y: z.number().finite(),
	timestamp: z.number().nonnegative(),
});

export type Point2D = z.infer<typeof Point2DSchema>;

export const SmoothedPointSchema = Point2DSchema.extend({
	smoothedX: z.number().finite(),
	smoothedY: z.number().finite(),
	jitter: z.number().nonnegative(),
});

export type SmoothedPoint = z.infer<typeof SmoothedPointSchema>;

// ============================================================================
// SMOOTHER PORT INTERFACE
// ============================================================================

export interface SmootherPort {
	/** Smooth a single point */
	smooth(point: Point2D): SmoothedPoint;

	/** Reset filter state */
	reset(): void;

	/** Update configuration */
	setConfig(config: Partial<SmootherConfig>): void;

	/** Get current configuration */
	getConfig(): SmootherConfig;
}

// ============================================================================
// REAL IMPLEMENTATION
// ============================================================================

export class OneEuroSmoother implements SmootherPort {
	private filterX: OneEuroFilter;
	private filterY: OneEuroFilter;
	private config: SmootherConfig;

	constructor(config: Partial<SmootherConfig> = {}) {
		this.config = SmootherConfigSchema.parse(config);
		this.filterX = new OneEuroFilter(
			this.config.freq,
			this.config.minCutoff,
			this.config.beta,
			this.config.dCutoff,
		);
		this.filterY = new OneEuroFilter(
			this.config.freq,
			this.config.minCutoff,
			this.config.beta,
			this.config.dCutoff,
		);
	}

	smooth(point: Point2D): SmoothedPoint {
		// Validate input
		const validated = Point2DSchema.parse(point);

		// Apply 1€ filter
		const smoothedX = this.filterX.filter(validated.x, validated.timestamp);
		const smoothedY = this.filterY.filter(validated.y, validated.timestamp);

		// Calculate jitter (distance between raw and smoothed)
		const dx = validated.x - smoothedX;
		const dy = validated.y - smoothedY;
		const jitter = Math.sqrt(dx * dx + dy * dy);

		return {
			x: validated.x,
			y: validated.y,
			timestamp: validated.timestamp,
			smoothedX,
			smoothedY,
			jitter,
		};
	}

	reset(): void {
		this.filterX = new OneEuroFilter(
			this.config.freq,
			this.config.minCutoff,
			this.config.beta,
			this.config.dCutoff,
		);
		this.filterY = new OneEuroFilter(
			this.config.freq,
			this.config.minCutoff,
			this.config.beta,
			this.config.dCutoff,
		);
	}

	setConfig(config: Partial<SmootherConfig>): void {
		this.config = SmootherConfigSchema.parse({ ...this.config, ...config });
		this.reset(); // Reinitialize filters with new config
	}

	getConfig(): SmootherConfig {
		return { ...this.config };
	}
}
