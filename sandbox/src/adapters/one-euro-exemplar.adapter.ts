/**
 * One Euro Filter EXEMPLAR Adapter
 *
 * Gen87.X3 | Port 2 (SHAPE) | Implements SmootherPort
 *
 * EXEMPLAR: npm 1eurofilter@1.2.2 by Géry Casiez (original author)
 * NO HAND-ROLLING - This wraps the canonical implementation
 *
 * @source https://www.npmjs.com/package/1eurofilter
 * @see https://gery.casiez.net/1euro/
 * Citation: Casiez, G., Roussel, N. and Vogel, D. (2012).
 *           1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input
 *           in Interactive Systems. CHI '12.
 */
import { OneEuroFilter } from '1eurofilter';
import type { SmootherPort } from '../contracts/ports.js';
import {
	type SensorFrame,
	type SmoothedFrame,
	SmoothedFrameSchema,
	type NormalizedLandmark,
} from '../contracts/schemas.js';

/**
 * Configuration for the 1€ filter
 * @see https://gery.casiez.net/1euro/ for parameter tuning guide
 */
export interface OneEuroConfig {
	/** Expected sampling frequency in Hz (default: 60) */
	frequency?: number;
	/** Minimum cutoff frequency - lower = more smoothing at low speeds (default: 1.0) */
	minCutoff?: number;
	/** Speed coefficient - higher = less lag at high speeds (default: 0.007) */
	beta?: number;
	/** Derivative cutoff - smoothing for speed estimation (default: 1.0) */
	dCutoff?: number;
}

const DEFAULT_CONFIG: Required<OneEuroConfig> = {
	frequency: 60,
	minCutoff: 1.0,
	beta: 0.007,
	dCutoff: 1.0,
};

/**
 * OneEuroExemplarAdapter - Wraps npm 1eurofilter (by original author)
 *
 * PRINCIPLE: No bespoke code. Compose exemplars.
 *
 * Usage:
 * ```typescript
 * const smoother = new OneEuroExemplarAdapter({ minCutoff: 1.0, beta: 0.007 });
 * const smoothed = smoother.smooth(sensorFrame);
 * ```
 */
export class OneEuroExemplarAdapter implements SmootherPort {
	private readonly config: Required<OneEuroConfig>;
	private readonly filters: Map<string, { x: OneEuroFilter; y: OneEuroFilter }> = new Map();
	private lastTimestamp: number | null = null;

	constructor(config: OneEuroConfig = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Smooth a sensor frame using 1€ filter
	 * @param frame Raw sensor frame from MediaPipe
	 * @returns Smoothed frame with filtered positions and velocity
	 */
	smooth(frame: SensorFrame): SmoothedFrame {
		// Handle no landmarks case
		if (!frame.landmarks || !frame.indexTip) {
			return this.createPassthroughFrame(frame);
		}

		// Calculate delta time
		const dt = this.lastTimestamp !== null 
			? Math.max((frame.ts - this.lastTimestamp) / 1000, 0.001) 
			: 1 / this.config.frequency;
		this.lastTimestamp = frame.ts;

		// Smooth index tip (primary cursor position)
		const smoothedTip = this.smoothLandmark('indexTip', frame.indexTip, dt);

		// Calculate velocity from smoothed position
		const tipFilter = this.filters.get('indexTip');
		const velocity = tipFilter ? {
			x: this.estimateVelocity(tipFilter.x, smoothedTip.x, dt),
			y: this.estimateVelocity(tipFilter.y, smoothedTip.y, dt),
		} : { x: 0, y: 0 };

		// Build and validate output using schema's expected shape
		const output: SmoothedFrame = {
			ts: frame.ts,
			handId: frame.handId,
			trackingOk: frame.trackingOk,
			palmFacing: frame.palmFacing,
			label: frame.label,
			confidence: frame.confidence,
			position: { x: smoothedTip.x, y: smoothedTip.y },
			velocity,
			prediction: null, // Could add Kalman prediction here
		};

		return SmoothedFrameSchema.parse(output);
	}

	/**
	 * Smooth a single landmark using paired X/Y filters
	 */
	private smoothLandmark(
		key: string,
		landmark: NormalizedLandmark,
		dt: number
	): NormalizedLandmark {
		// Get or create filter pair for this landmark
		if (!this.filters.has(key)) {
			this.filters.set(key, {
				x: new OneEuroFilter({
					frequency: this.config.frequency,
					minCutoff: this.config.minCutoff,
					beta: this.config.beta,
					dCutoff: this.config.dCutoff,
				}),
				y: new OneEuroFilter({
					frequency: this.config.frequency,
					minCutoff: this.config.minCutoff,
					beta: this.config.beta,
					dCutoff: this.config.dCutoff,
				}),
			});
		}

		const filter = this.filters.get(key)!;

		return {
			x: filter.x.filter(landmark.x, dt),
			y: filter.y.filter(landmark.y, dt),
			z: landmark.z,
			visibility: landmark.visibility,
		};
	}

	/**
	 * Estimate velocity from filter state
	 * The 1€ filter internally tracks dx/dy - we approximate from position change
	 */
	private estimateVelocity(filter: OneEuroFilter, currentValue: number, dt: number): number {
		// Simple derivative approximation
		// In production, could access filter's internal dx if exposed
		return 0; // TODO: Expose velocity from filter internals
	}

	/**
	 * Create passthrough frame when no landmarks available
	 */
	private createPassthroughFrame(frame: SensorFrame): SmoothedFrame {
		return SmoothedFrameSchema.parse({
			ts: frame.ts,
			handId: frame.handId,
			trackingOk: frame.trackingOk,
			palmFacing: frame.palmFacing,
			label: frame.label,
			confidence: frame.confidence,
			position: null,
			velocity: null,
			prediction: null,
		});
	}

	/**
	 * Reset all filters (e.g., when hand tracking is lost)
	 */
	reset(): void {
		this.filters.clear();
		this.lastTimestamp = null;
	}

	/**
	 * Get current configuration
	 */
	getConfig(): Required<OneEuroConfig> {
		return { ...this.config };
	}
}

// Default export for convenience
export default OneEuroExemplarAdapter;
