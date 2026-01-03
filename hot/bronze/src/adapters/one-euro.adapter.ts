/**
 * One Euro Filter Adapter
 *
 * Gen87.X3 | Port 2 (SHAPE) | Implements SmootherPort
 *
 * Wraps OneEuroPrimitive (cold/silver) to implement SmootherPort.
 */
import { OneEuroPrimitive } from '../../../../cold/silver/primitives/one-euro.js';
import type { SmootherPort } from '../contracts/ports.js';
import type { SensorFrame, SmoothedFrame } from '../contracts/schemas.js';

/**
 * One Euro Filter Adapter
 * Implements SmootherPort interface with CDD validation
 */
export class OneEuroAdapter implements SmootherPort {
	private primitive: OneEuroPrimitive;
	private readonly predictionMs: number;

	constructor(mincutoff = 1.0, beta = 0.007, dcutoff = 1.0, frequency = 60, predictionMs = 16) {
		this.primitive = new OneEuroPrimitive({
			minCutoff: mincutoff,
			beta,
			dCutoff: dcutoff,
			frequency,
		});
		this.predictionMs = predictionMs;
	}

	smooth(frame: SensorFrame): SmoothedFrame {
		const timestampSec = frame.ts / 1000;

		// Handle tracking lost or missing indexTip
		if (!frame.trackingOk || !frame.indexTip) {
			this.primitive.reset();
			return {
				...frame,
				position: null,
				velocity: null,
				prediction: null,
			};
		}

		const result = this.primitive.filter(frame.indexTip.x, frame.indexTip.y, timestampSec);

		// Fallback if filter returns NaN
		const position = {
			x: Number.isNaN(result.position.x) ? frame.indexTip.x : result.position.x,
			y: Number.isNaN(result.position.y) ? frame.indexTip.y : result.position.y,
		};

		// Clamping to [0, 1]
		const clampedPosition = {
			x: Math.max(0, Math.min(1, position.x)),
			y: Math.max(0, Math.min(1, position.y)),
		};

		// Prediction
		const predictionSec = this.predictionMs / 1000;
		const prediction = {
			x: Math.max(0, Math.min(1, clampedPosition.x + result.velocity.x * predictionSec)),
			y: Math.max(0, Math.min(1, clampedPosition.y + result.velocity.y * predictionSec)),
		};

		return {
			...frame,
			position: clampedPosition,
			velocity: result.velocity,
			prediction,
		};
	}

	setParams(mincutoff: number, beta: number): void {
		this.primitive.setParams(mincutoff, beta);
	}

	reset(): void {
		this.primitive.reset();
	}
}

/**
 * Passthrough Smoother Adapter
 * No-op smoother that returns input as-is.
 */
export class PassthroughSmootherAdapter implements SmootherPort {
	smooth(frame: SensorFrame): SmoothedFrame {
		if (!frame.trackingOk || !frame.indexTip) {
			return {
				...frame,
				position: null,
				velocity: null,
				prediction: null,
			};
		}

		return {
			...frame,
			position: frame.indexTip,
			velocity: { x: 0, y: 0 },
			prediction: frame.indexTip,
		};
	}

	setParams(): void {}
	reset(): void {}
}
