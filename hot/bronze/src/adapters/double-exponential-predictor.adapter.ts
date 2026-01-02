import { TTI_DISTANCE_THRESHOLD, TTI_SPEED_THRESHOLD } from '../constants/magic-numbers.js';
/**
 * Double Exponential Smoothing Predictor (LaViola DESP)
 *
 * Gen87.X3 | Port 2 (SHAPE) | PREDICTION-CAPABLE Smoother
 *
 * SOURCE: LaViola Jr., Joseph J. "Double Exponential Smoothing: An Alternative
 * to Kalman Filter-Based Predictive Tracking" (2003)
 * URL: https://cs.brown.edu/people/jlaviola/pubs/kfvsexp_final_laviola.pdf
 *
 * KEY ADVANTAGE over 1€ Filter:
 * - 1€ Filter: Smooths only, NO prediction capability
 * - DESP: Smooths AND predicts position τ ms into future
 * - 135x faster than Kalman filter with equivalent accuracy
 *
 * ALGORITHM (from LaViola paper):
 * 1. Single smoothing: Sp_t = α * p_t + (1-α) * Sp_{t-1}
 * 2. Double smoothing: Sp'_t = α * Sp_t + (1-α) * Sp'_{t-1}
 * 3. Slope estimate: b1(t) = α/(1-α) * (Sp_t - Sp'_t)
 * 4. Level estimate: b0(t) = 2*Sp_t - Sp'_t
 * 5. Prediction: p_{t+τ} = b0(t) + b1(t) * τ
 *
 * @source https://cs.brown.edu/people/jlaviola/pubs/kfvsexp_final_laviola.pdf
 * @source https://www.eecs.ucf.edu/~jjl/pubs/vr2003_laviola.pdf
 */
import type { SmootherPort } from '../contracts/ports.js';
import type { SensorFrame, SmoothedFrame } from '../contracts/schemas.js';

// ============================================================================
// TYPES
// ============================================================================

export interface DESPConfig {
	/**
	 * Smoothing factor α ∈ (0,1). Higher = more responsive, lower = smoother
	 * @source https://cs.brown.edu/people/jlaviola/pubs/kfvsexp_final_laviola.pdf (Section 3.1)
	 * @range [0.1, 0.9] - LaViola paper suggests tuning per application
	 */
	alpha: number;
	/** Prediction lookahead in ms (default: 50ms = 3 frames at 60fps) */
	predictionMs: number;
	/** Clamp output to [0,1] normalized space */
	clampOutput: boolean;
}

const DEFAULT_CONFIG: DESPConfig = {
	alpha: 0.5, // LaViola paper suggests tuning per application
	predictionMs: 50,
	clampOutput: true,
};

// ============================================================================
// DOUBLE EXPONENTIAL SMOOTHING PREDICTOR
// ============================================================================

/**
 * DoubleExponentialPredictor - LaViola DESP Algorithm
 *
 * Implements the double exponential smoothing prediction algorithm
 * from LaViola (2003). Unlike 1€ filter, this PREDICTS future position.
 *
 * Mathematical basis:
 * - Models signal as linear trend: p(t) = b0 + b1*t
 * - b0 (intercept) and b1 (slope) are time-varying
 * - Exponential weighting gives recent observations higher weight
 */
export class DoubleExponentialPredictor implements SmootherPort {
	private config: DESPConfig;

	// Single-smoothed statistics (Sp)
	private Sp_x = 0.5;
	private Sp_y = 0.5;

	// Double-smoothed statistics (Sp')
	private Spp_x = 0.5;
	private Spp_y = 0.5;

	// Velocity estimates (computed from slope)
	private velocity = { x: 0, y: 0 };

	// Timestamp tracking
	private lastTs: number | null = null;
	private initialized = false;

	constructor(config: Partial<DESPConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };

		// Validate alpha
		if (this.config.alpha <= 0 || this.config.alpha >= 1) {
			throw new Error(`alpha must be in (0,1), got ${this.config.alpha}`);
		}
	}

	/**
	 * Smooth and predict a sensor frame
	 *
	 * @param frame - Raw sensor input
	 * @returns SmoothedFrame with prediction
	 */
	smooth(frame: SensorFrame): SmoothedFrame {
		if (!frame.indexTip) {
			// No tracking - return passthrough
			return this.createPassthroughFrame(frame);
		}

		const x = frame.indexTip.x;
		const y = frame.indexTip.y;
		const α = this.config.alpha;

		// Initialize on first observation
		if (!this.initialized) {
			this.Sp_x = x;
			this.Sp_y = y;
			this.Spp_x = x;
			this.Spp_y = y;
			this.lastTs = frame.ts;
			this.initialized = true;

			return this.createFrame(frame, x, y, x, y);
		}

		// Calculate dt for velocity estimation
		const dt = this.lastTs !== null ? (frame.ts - this.lastTs) / 1000 : 1 / 60;
		this.lastTs = frame.ts;

		// ========== LaViola DESP Algorithm ==========

		// Step 1: Single exponential smoothing
		this.Sp_x = α * x + (1 - α) * this.Sp_x;
		this.Sp_y = α * y + (1 - α) * this.Sp_y;

		// Step 2: Double exponential smoothing
		this.Spp_x = α * this.Sp_x + (1 - α) * this.Spp_x;
		this.Spp_y = α * this.Sp_y + (1 - α) * this.Spp_y;

		// Step 3: Calculate slope (b1) - rate of change per second
		const αRatio = α / (1 - α);
		const b1_x = αRatio * (this.Sp_x - this.Spp_x);
		const b1_y = αRatio * (this.Sp_y - this.Spp_y);

		// Step 4: Calculate level (b0) - current smoothed position
		const b0_x = 2 * this.Sp_x - this.Spp_x;
		const b0_y = 2 * this.Sp_y - this.Spp_y;

		// Store velocity for output (b1 is the instantaneous velocity estimate)
		// Scale by frame rate to get units/second
		this.velocity = {
			x: b1_x / dt,
			y: b1_y / dt,
		};

		// Step 5: Predict τ ms into future
		const τ = this.config.predictionMs / 1000; // Convert to seconds
		let predicted_x = b0_x + b1_x * τ;
		let predicted_y = b0_y + b1_y * τ;

		// Clamp if configured
		if (this.config.clampOutput) {
			predicted_x = this.clamp(predicted_x, 0, 1);
			predicted_y = this.clamp(predicted_y, 0, 1);
		}

		// Smoothed position IS b0 (the level estimate)
		const smoothed_x = this.config.clampOutput ? this.clamp(b0_x, 0, 1) : b0_x;
		const smoothed_y = this.config.clampOutput ? this.clamp(b0_y, 0, 1) : b0_y;

		return this.createFrame(frame, smoothed_x, smoothed_y, predicted_x, predicted_y);
	}

	/**
	 * Reset predictor state
	 */
	reset(): void {
		this.Sp_x = 0.5;
		this.Sp_y = 0.5;
		this.Spp_x = 0.5;
		this.Spp_y = 0.5;
		this.velocity = { x: 0, y: 0 };
		this.lastTs = null;
		this.initialized = false;
	}

	/**
	 * SmootherPort compatibility - maps params to alpha/predictionMs
	 * @param mincutoff - Maps to predictionMs (higher = shorter prediction)
	 * @param beta - Maps to alpha (higher = more responsive)
	 */
	setParams(mincutoff: number, beta: number): void {
		// Map 1€ params to DESP params
		// mincutoff (1-10) → predictionMs (100-10)
		this.config.predictionMs = Math.max(10, 110 - mincutoff * 10);
		// beta (0-1) → alpha (0.1-0.9)
		this.config.alpha = Math.max(0.1, Math.min(0.9, 0.1 + beta * 0.8));
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
			Sp: { x: this.Sp_x, y: this.Sp_y },
			Spp: { x: this.Spp_x, y: this.Spp_y },
			velocity: { ...this.velocity },
			config: { ...this.config },
		};
	}

	/**
	 * Calculate Time-to-Impact (TTI) to a target point
	 *
	 * @param targetX - Target X coordinate (0-1)
	 * @param targetY - Target Y coordinate (0-1)
	 * @returns TTI in ms, or Infinity if moving away
	 */
	calculateTTI(targetX: number, targetY: number): number {
		// Current smoothed position (b0)
		const posX = 2 * this.Sp_x - this.Spp_x;
		const posY = 2 * this.Sp_y - this.Spp_y;

		// Distance vector to target
		const dx = targetX - posX;
		const dy = targetY - posY;
		const distance = Math.sqrt(dx * dx + dy * dy);

		// If already at target (within threshold from magic-numbers.ts)
		// @source MAGIC_NUMBERS_REGISTRY.md - TTI_DISTANCE_THRESHOLD
		if (distance < TTI_DISTANCE_THRESHOLD) return 0;

		// Velocity magnitude in direction of target
		const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
		// @source MAGIC_NUMBERS_REGISTRY.md - TTI_SPEED_THRESHOLD
		if (speed < TTI_SPEED_THRESHOLD) return Number.POSITIVE_INFINITY;

		// Dot product to check if moving toward target
		const dot = dx * this.velocity.x + dy * this.velocity.y;
		if (dot <= 0) return Number.POSITIVE_INFINITY; // Moving away

		// Project velocity onto direction to target
		const velocityTowardTarget = dot / distance;

		// TTI = distance / velocity (in seconds), convert to ms
		return (distance / velocityTowardTarget) * 1000;
	}

	/**
	 * Get predicted trajectory points for visualization
	 *
	 * @param durationMs - How far to predict (ms)
	 * @param steps - Number of points
	 * @returns Array of predicted positions
	 */
	getPredictedTrajectory(
		durationMs: number,
		steps: number,
	): Array<{ x: number; y: number; t: number }> {
		const trajectory: Array<{ x: number; y: number; t: number }> = [];
		const αRatio = this.config.alpha / (1 - this.config.alpha);

		// Current level and slope
		const b0_x = 2 * this.Sp_x - this.Spp_x;
		const b0_y = 2 * this.Sp_y - this.Spp_y;
		const b1_x = αRatio * (this.Sp_x - this.Spp_x);
		const b1_y = αRatio * (this.Sp_y - this.Spp_y);

		for (let i = 0; i <= steps; i++) {
			const t = (i / steps) * durationMs;
			const τ = t / 1000;

			let x = b0_x + b1_x * τ;
			let y = b0_y + b1_y * τ;

			if (this.config.clampOutput) {
				x = this.clamp(x, 0, 1);
				y = this.clamp(y, 0, 1);
			}

			trajectory.push({ x, y, t });
		}

		return trajectory;
	}

	private clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, value));
	}

	private createPassthroughFrame(frame: SensorFrame): SmoothedFrame {
		return {
			ts: frame.ts,
			handId: frame.handId,
			position: null,
			velocity: null,
			prediction: null,
			trackingOk: frame.trackingOk,
			label: frame.label,
			confidence: frame.confidence,
			palmFacing: frame.palmFacing,
		};
	}

	private createFrame(
		frame: SensorFrame,
		smoothX: number,
		smoothY: number,
		predX: number,
		predY: number,
	): SmoothedFrame {
		return {
			ts: frame.ts,
			handId: frame.handId,
			position: { x: smoothX, y: smoothY },
			velocity: { ...this.velocity },
			prediction: { x: predX, y: predY },
			trackingOk: frame.trackingOk,
			label: frame.label,
			confidence: frame.confidence,
			palmFacing: frame.palmFacing,
		};
	}
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a LaViola Double Exponential Predictor
 *
 * @param alpha - Smoothing factor (0.3-0.7 typical)
 * @param predictionMs - Lookahead in ms (50-100 typical)
 */
export function createDoubleExponentialPredictor(
	alpha = 0.5,
	predictionMs = 50,
): DoubleExponentialPredictor {
	return new DoubleExponentialPredictor({ alpha, predictionMs });
}

/**
 * Create a predictor optimized for low-latency cursor tracking
 * (Higher alpha = more responsive, shorter prediction)
 */
export function createResponsivePredictor(): DoubleExponentialPredictor {
	return new DoubleExponentialPredictor({
		alpha: 0.7,
		predictionMs: 33, // 2 frames at 60fps
	});
}

/**
 * Create a predictor optimized for smooth trajectories
 * (Lower alpha = smoother, longer prediction)
 */
export function createSmoothPredictor(): DoubleExponentialPredictor {
	return new DoubleExponentialPredictor({
		alpha: 0.3,
		predictionMs: 100, // 6 frames at 60fps
	});
}
