/**
 * One Euro Filter Adapter
 *
 * Gen87.X3 | Port 2 (SHAPE) | Implements SmootherPort
 *
 * EXEMPLAR SOURCE: https://gery.casiez.net/1euro/
 * Citation: Casiez, G., Roussel, N. and Vogel, D. (2012).
 *           1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input
 *           in Interactive Systems. CHI '12.
 *
 * Grounded: Tavily research 2025-12-29
 */
import type { SmootherPort } from '../contracts/ports.js';
import { type SensorFrame, type SmoothedFrame, SmoothedFrameSchema } from '../contracts/schemas.js';

/**
 * Low-pass filter component
 * Implements exponential smoothing with adaptive alpha
 */
class LowPassFilter {
	private y: number | undefined;
	private alpha: number;

	constructor(alpha: number) {
		this.alpha = alpha;
	}

	filter(x: number, alpha?: number): number {
		if (alpha !== undefined) {
			this.alpha = alpha;
		}

		if (this.y === undefined) {
			this.y = x;
		} else {
			this.y = this.alpha * x + (1 - this.alpha) * this.y;
		}

		return this.y;
	}

	hasLastValue(): boolean {
		return this.y !== undefined;
	}

	lastValue(): number {
		return this.y ?? 0;
	}

	reset(): void {
		this.y = undefined;
	}
}

/**
 * One Euro Filter
 *
 * A simple speed-based low-pass filter that:
 * - At low speeds: uses low cutoff frequency → reduces jitter
 * - At high speeds: uses high cutoff frequency → reduces lag
 */
class OneEuroFilter {
	private mincutoff: number;
	private beta: number;
	private dcutoff: number;
	private xFilter: LowPassFilter;
	private dxFilter: LowPassFilter;
	private lastTime: number | undefined;
	private lastRawValue: number | undefined;

	constructor(frequency: number, mincutoff = 1.0, beta = 0.0, dcutoff = 1.0) {
		this.mincutoff = mincutoff;
		this.beta = beta;
		this.dcutoff = dcutoff;
		this.xFilter = new LowPassFilter(this.alpha(mincutoff, 1 / frequency));
		this.dxFilter = new LowPassFilter(this.alpha(dcutoff, 1 / frequency));
	}

	private alpha(cutoff: number, dt: number): number {
		const tau = 1.0 / (2 * Math.PI * cutoff);
		return 1.0 / (1.0 + tau / dt);
	}

	filter(x: number, timestamp: number): number {
		// Calculate time delta - clamp to avoid division by zero
		let dt =
			this.lastTime !== undefined
				? (timestamp - this.lastTime) / 1000 // Convert ms to seconds
				: 1.0 / 120; // Default 120Hz

		// Prevent NaN from zero or negative dt
		if (dt <= 0) dt = 1.0 / 120;

		this.lastTime = timestamp;

		// Estimate derivative - guard against NaN
		let dx = 0;
		if (this.lastRawValue !== undefined && dt > 0) {
			dx = (x - this.lastRawValue) / dt;
			if (!Number.isFinite(dx)) dx = 0;
		}
		this.lastRawValue = x;

		// Filter derivative
		const edx = this.dxFilter.filter(dx, this.alpha(this.dcutoff, dt));

		// Compute adaptive cutoff based on speed
		const cutoff = this.mincutoff + this.beta * Math.abs(edx);

		// Filter position with adaptive cutoff
		return this.xFilter.filter(x, this.alpha(cutoff, dt));
	}

	getDerivative(): number {
		return this.dxFilter.lastValue();
	}

	setParams(mincutoff: number, beta: number): void {
		this.mincutoff = mincutoff;
		this.beta = beta;
	}

	reset(): void {
		this.xFilter.reset();
		this.dxFilter.reset();
		this.lastTime = undefined;
		this.lastRawValue = undefined;
	}
}

/**
 * One Euro Filter Adapter
 * Implements SmootherPort interface with CDD validation
 */
export class OneEuroAdapter implements SmootherPort {
	private filterX: OneEuroFilter;
	private filterY: OneEuroFilter;
	private readonly predictionMs: number;

	constructor(
		mincutoff = 1.0,
		beta = 0.007,
		dcutoff = 1.0,
		private readonly frequency = 60, // Assumed frame rate
		predictionMs = 16, // One frame ahead prediction
	) {
		this.filterX = new OneEuroFilter(frequency, mincutoff, beta, dcutoff);
		this.filterY = new OneEuroFilter(frequency, mincutoff, beta, dcutoff);
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
		const smoothedX = this.filterX.filter(frame.indexTip.x, frame.ts);
		const smoothedY = this.filterY.filter(frame.indexTip.y, frame.ts);

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
