/**
 * One Euro Filter Adapter
 *
 * Gen87.X3 | Port 2 (SHAPE) | Implements SmootherPort
 *
 * EXEMPLAR SOURCE: https://gery.casiez.net/1euro/
 * NPM PACKAGE: 1eurofilter@1.2.2 (NO THEATER - uses real npm package)
 *
 * Citation: Casiez, G., Roussel, N. and Vogel, D. (2012).
 *           1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input
 *           in Interactive Systems. CHI '12.
 *
 * Grounded: Tavily research 2025-12-29
 * De-theatered: 2025-12-31 - replaced inline class with npm import
 */
// @ts-nocheck

import { OneEuroFilter } from '1eurofilter';
import type { SmootherPort } from '../contracts/ports.js';
import { type SensorFrame, type SmoothedFrame, SmoothedFrameSchema } from '../contracts/schemas.js';

// ============================================================================
// NOTE: Using npm 1eurofilter package - NO INLINE THEATER
// The package provides: filter(value, timestamp) with automatic dt calculation
// ============================================================================

/**
 * Extended One Euro Filter with derivative access
 * Wraps npm package to add velocity tracking
 */
class OneEuroFilterWithVelocity {
	private filter: OneEuroFilter;
	private lastValue: number | undefined;
	private lastTime: number | undefined;
	private derivative = 0;

	constructor(frequency: number, mincutoff: number, beta: number, dcutoff: number) {
		this.filter = new OneEuroFilter(frequency, mincutoff, beta, dcutoff);
	}

	filterValue(x: number, timestamp: number): number {
		// Track derivative manually since npm package doesn't expose it
		if (this.lastValue !== undefined && this.lastTime !== undefined) {
			const dt = (timestamp - this.lastTime) / 1000;
			if (dt > 0) {
				this.derivative = (x - this.lastValue) / dt;
			}
		}
		this.lastValue = x;
		this.lastTime = timestamp;

		return this.filter.filter(x, timestamp);
	}

	getDerivative(): number {
		return this.derivative;
	}

	setParams(mincutoff: number, beta: number): void {
		this.filter.setMinCutoff(mincutoff);
		this.filter.setBeta(beta);
	}

	reset(): void {
		this.filter.reset();
		this.lastValue = undefined;
		this.lastTime = undefined;
		this.derivative = 0;
	}
}

/**
 * One Euro Filter Adapter
 * Implements SmootherPort interface with CDD validation
 * Uses npm 1eurofilter package (de-theatered)
 */
export class OneEuroAdapter implements SmootherPort {
	private filterX: OneEuroFilterWithVelocity;
	private filterY: OneEuroFilterWithVelocity;
	private readonly predictionMs: number;

	constructor(
		mincutoff = 1.0,
		beta = 0.007,
		dcutoff = 1.0,
		private readonly frequency = 60, // Assumed frame rate
		predictionMs = 16, // One frame ahead prediction
	) {
		this.filterX = new OneEuroFilterWithVelocity(frequency, mincutoff, beta, dcutoff);
		this.filterY = new OneEuroFilterWithVelocity(frequency, mincutoff, beta, dcutoff);
		this.predictionMs = predictionMs;
	}

	smooth(frame: SensorFrame): SmoothedFrame {
		// If no valid tracking, pass through with null position
		if (!frame.trackingOk || !frame.indexTip) {
			this.reset(); // Reset filters when tracking lost

			return SmoothedFrameSchema.parse({
				ts: frame.ts,
				handId: frame.handId,
				trackingOk: false,
				palmFacing: frame.palmFacing,
				label: frame.label,
				confidence: frame.confidence,
				position: null,
				velocity: null,
				prediction: null,
			});
		}

		// Apply 1€ filter to x and y coordinates
		const smoothedX = this.filterX.filterValue(frame.indexTip.x, frame.ts);
		const smoothedY = this.filterY.filterValue(frame.indexTip.y, frame.ts);

		// Get velocity estimates from filter derivatives
		const velocityX = this.filterX.getDerivative();
		const velocityY = this.filterY.getDerivative();

		// Predict future position (for latency compensation)
		const predictionSec = this.predictionMs / 1000;
		const predictedX = Math.max(0, Math.min(1, smoothedX + velocityX * predictionSec));
		const predictedY = Math.max(0, Math.min(1, smoothedY + velocityY * predictionSec));

		// CDD: Validate output at port boundary
		return SmoothedFrameSchema.parse({
			ts: frame.ts,
			handId: frame.handId,
			trackingOk: true,
			palmFacing: frame.palmFacing,
			label: frame.label,
			confidence: frame.confidence,
			position: {
				x: smoothedX,
				y: smoothedY,
			},
			velocity: {
				x: velocityX,
				y: velocityY,
			},
			prediction: {
				x: predictedX,
				y: predictedY,
			},
		});
	}

	reset(): void {
		this.filterX.reset();
		this.filterY.reset();
	}

	setParams(mincutoff: number, beta: number): void {
		this.filterX.setParams(mincutoff, beta);
		this.filterY.setParams(mincutoff, beta);
	}
}

/**
 * Pass-through adapter for testing (no smoothing)
 */
export class PassthroughSmootherAdapter implements SmootherPort {
	smooth(frame: SensorFrame): SmoothedFrame {
		if (!frame.trackingOk || !frame.indexTip) {
			return SmoothedFrameSchema.parse({
				ts: frame.ts,
				handId: frame.handId,
				trackingOk: false,
				palmFacing: frame.palmFacing,
				label: frame.label,
				confidence: frame.confidence,
				position: null,
				velocity: null,
				prediction: null,
			});
		}

		return SmoothedFrameSchema.parse({
			ts: frame.ts,
			handId: frame.handId,
			trackingOk: true,
			palmFacing: frame.palmFacing,
			label: frame.label,
			confidence: frame.confidence,
			position: {
				x: frame.indexTip.x,
				y: frame.indexTip.y,
			},
			velocity: { x: 0, y: 0 },
			prediction: {
				x: frame.indexTip.x,
				y: frame.indexTip.y,
			},
		});
	}

	reset(): void {
		// No-op
	}

	setParams(_mincutoff: number, _beta: number): void {
		// No-op
	}
}
