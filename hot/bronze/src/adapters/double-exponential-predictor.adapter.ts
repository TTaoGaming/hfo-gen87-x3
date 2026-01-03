/**
 * Double Exponential Smoothing Predictor (LaViola DESP)
 *
 * Gen87.X3 | Port 2 (SHAPE) | PREDICTION-CAPABLE Smoother
 *
 * Wraps DoubleExponentialPredictor primitive (cold/silver) to implement SmootherPort.
 */
import {
	type DESPConfig,
	type DESPState,
	calculateTTI,
	createInitialState,
	getPredictedTrajectory,
	processDESP,
	resetState,
	validateAlpha,
} from '../../../../cold/silver/primitives/double-exponential.js';
import { TTI_DISTANCE_THRESHOLD, TTI_SPEED_THRESHOLD } from '../constants/magic-numbers.js';
import type { SmootherPort } from '../contracts/ports.js';
import type { SensorFrame, SmoothedFrame } from '../contracts/schemas.js';

export type { DESPConfig, DESPState };

const DEFAULT_CONFIG: DESPConfig = {
	alpha: 0.5,
	predictionMs: 50,
	clampOutput: true,
};

/**
 * DoubleExponentialPredictor - LaViola DESP Algorithm
 *
 * Implements the double exponential smoothing prediction algorithm
 * from LaViola (2003). Unlike 1 filter, this PREDICTS future position.
 */
export class DoubleExponentialPredictor implements SmootherPort {
	private config: DESPConfig;
	private state: DESPState;

	constructor(config: Partial<DESPConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.state = createInitialState();
		validateAlpha(this.config.alpha);
	}

	/**
	 * Smooth and predict a sensor frame
	 */
	smooth(frame: SensorFrame): SmoothedFrame {
		if (!frame.trackingOk || !frame.indexTip) {
			this.reset();
			return {
				...frame,
				position: null,
				velocity: null,
				prediction: null,
			};
		}

		const result = processDESP(
			frame.indexTip.x,
			frame.indexTip.y,
			frame.ts,
			this.state,
			this.config,
		);

		return {
			...frame,
			position: result.smoothed,
			velocity: result.velocity,
			prediction: result.predicted,
		};
	}

	/**
	 * Reset predictor state
	 */
	reset(): void {
		resetState(this.state);
	}

	/**
	 * SmootherPort compatibility - maps params to alpha/predictionMs
	 */
	setParams(mincutoff: number, beta: number): void {
		// Map 1 params to DESP params
		this.config.predictionMs = Math.max(10, 110 - mincutoff * 10);
		this.config.alpha = Math.max(0.1, Math.min(0.9, 0.1 + beta * 0.8));
		validateAlpha(this.config.alpha);
	}

	/**
	 * Get current predictor state for debugging
	 */
	getState(): {
		Sp: { x: number; y: number };
		Spp: { x: number; y: number };
		velocity: { x: number; y: number };
		config: DESPConfig;
	} {
		return {
			Sp: { x: this.state.Sp_x, y: this.state.Sp_y },
			Spp: { x: this.state.Spp_x, y: this.state.Spp_y },
			velocity: { ...this.state.velocity },
			config: { ...this.config },
		};
	}

	/**
	 * Calculate Time-to-Impact (TTI) to a target point
	 */
	calculateTTI(targetX: number, targetY: number): number {
		const currentPos = {
			x: 2 * this.state.Sp_x - this.state.Spp_x,
			y: 2 * this.state.Sp_y - this.state.Spp_y,
		};

		return calculateTTI(
			currentPos.x,
			currentPos.y,
			this.state.velocity.x,
			this.state.velocity.y,
			targetX,
			targetY,
			TTI_DISTANCE_THRESHOLD,
			TTI_SPEED_THRESHOLD,
		);
	}

	/**
	 * Get predicted trajectory points for visualization
	 */
	getPredictedTrajectory(
		durationMs: number,
		steps: number,
	): Array<{ x: number; y: number; t: number }> {
		return getPredictedTrajectory(this.state, this.config, durationMs, steps);
	}
}

/**
 * Factory functions
 */
export function createDoubleExponentialPredictor(
	alpha = 0.5,
	predictionMs = 50,
): DoubleExponentialPredictor {
	return new DoubleExponentialPredictor({ alpha, predictionMs });
}

export function createResponsivePredictor(): DoubleExponentialPredictor {
	return new DoubleExponentialPredictor({
		alpha: 0.7,
		predictionMs: 33,
	});
}

export function createSmoothPredictor(): DoubleExponentialPredictor {
	return new DoubleExponentialPredictor({
		alpha: 0.3,
		predictionMs: 100,
	});
}
