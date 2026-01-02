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
	type NormalizedLandmark,
	type SensorFrame,
	type SmoothedFrame,
	SmoothedFrameSchema,
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
	private config: Required<OneEuroConfig>;
	private readonly filters: Map<string, { x: OneEuroFilter; y: OneEuroFilter }> = new Map();
	private lastTimestamp: number | null = null;
	private lastPosition: { x: number; y: number } | null = null;

	constructor(config: OneEuroConfig = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Smooth a sensor frame using 1€ filter
	 * @param frame Raw sensor frame from MediaPipe
	 * @returns Smoothed frame with filtered positions and velocity
	 */
	smooth(frame: SensorFrame): SmoothedFrame {
		// Handle no indexTip case - landmarks is optional, indexTip is required for filtering
		if (!frame.indexTip) {
			return this.createPassthroughFrame(frame);
		}

		// Calculate delta time for velocity estimation (in seconds)
		const dt =
			this.lastTimestamp !== null
				? Math.max((frame.ts - this.lastTimestamp) / 1000, 0.001)
				: 1 / this.config.frequency;
		this.lastTimestamp = frame.ts;

		// Convert timestamp to seconds for the 1€ filter
		// The filter expects cumulative timestamp, not delta
		// EDGE CASE FIX: Ensure minimum timestamp > 0 to avoid NaN from filter internals
		// When ts=0, filter's alpha calculation divides by zero
		const timestampSec = Math.max(frame.ts / 1000, 0.001);

		// Smooth index tip (primary cursor position)
		const smoothedTip = this.smoothLandmark('indexTip', frame.indexTip, timestampSec);

		// Calculate velocity from smoothed position delta
		let velocity = { x: 0, y: 0 };
		if (this.lastPosition && dt > 0) {
			velocity = {
				x: (smoothedTip.x - this.lastPosition.x) / dt,
				y: (smoothedTip.y - this.lastPosition.y) / dt,
			};
		}

		// NaN guard: If filter produced invalid output, reset and passthrough
		// This handles edge cases like non-monotonic timestamps, first-frame issues
		if (Number.isNaN(smoothedTip.x) || Number.isNaN(smoothedTip.y)) {
			this.reset();
			return this.createPassthroughFrame(frame);
		}

		this.lastPosition = { x: smoothedTip.x, y: smoothedTip.y };

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
	 * @param key - Landmark identifier for filter caching
	 * @param landmark - Raw landmark position
	 * @param timestampSec - Absolute timestamp in seconds (frame.ts / 1000)
	 */
	private smoothLandmark(
		key: string,
		landmark: NormalizedLandmark,
		timestampSec: number,
	): NormalizedLandmark {
		// Get or create filter pair for this landmark
		if (!this.filters.has(key)) {
			// OneEuroFilter constructor: (freq, mincutoff?, beta?, dcutoff?)
			this.filters.set(key, {
				x: new OneEuroFilter(
					this.config.frequency,
					this.config.minCutoff,
					this.config.beta,
					this.config.dCutoff,
				),
				y: new OneEuroFilter(
					this.config.frequency,
					this.config.minCutoff,
					this.config.beta,
					this.config.dCutoff,
				),
			});
		}

		const filter = this.filters.get(key)!;

		// filter() takes (value, timestamp) where timestamp is ABSOLUTE time in seconds
		// The npm 1eurofilter internally calculates dt from consecutive timestamps
		// NOTE: 1€ filter can overshoot [0,1] range due to derivative response
		// Clamp to normalized coordinate space (REQ-PBT-003)
		return {
			x: Math.max(0, Math.min(1, filter.x.filter(landmark.x, timestampSec))),
			y: Math.max(0, Math.min(1, filter.y.filter(landmark.y, timestampSec))),
			z: landmark.z,
			visibility: landmark.visibility,
		};
	}

	/**
	 * Create passthrough frame when filtering fails or no landmarks available
	 * If indexTip exists, uses raw values. Otherwise null position.
	 */
	private createPassthroughFrame(frame: SensorFrame): SmoothedFrame {
		// If indexTip exists, pass it through unfiltered
		const position = frame.indexTip
			? {
					x: Math.max(0, Math.min(1, frame.indexTip.x)),
					y: Math.max(0, Math.min(1, frame.indexTip.y)),
				}
			: null;

		return SmoothedFrameSchema.parse({
			ts: frame.ts,
			handId: frame.handId,
			trackingOk: frame.trackingOk,
			palmFacing: frame.palmFacing,
			label: frame.label,
			confidence: frame.confidence,
			position,
			velocity: position ? { x: 0, y: 0 } : null,
			prediction: null,
		});
	}

	/**
	 * Reset all filters (e.g., when hand tracking is lost)
	 */
	reset(): void {
		this.filters.clear();
		this.lastTimestamp = null;
		this.lastPosition = null;
	}

	/**
	 * Update filter parameters at runtime
	 * @param mincutoff - Min cutoff frequency in Hz (> 0). Lower = more smoothing.
	 * @param beta - Speed coefficient (> 0). Higher = less lag at high speeds.
	 */
	setParams(mincutoff: number, beta: number): void {
		this.config.minCutoff = mincutoff;
		this.config.beta = beta;

		// Update all existing filters with new parameters
		this.filters.forEach((filterPair) => {
			filterPair.x.setMinCutoff(mincutoff);
			filterPair.x.setBeta(beta);
			filterPair.y.setMinCutoff(mincutoff);
			filterPair.y.setBeta(beta);
		});
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
