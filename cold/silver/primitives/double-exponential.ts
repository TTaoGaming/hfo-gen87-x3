/**
 * Double Exponential Smoothing Predictor (LaViola DESP) - PURE ALGORITHM
 *
 * Gen87.X3 | cold/silver/primitives | MUTATION TESTABLE
 *
 * SOURCE: LaViola Jr., Joseph J. "Double Exponential Smoothing: An Alternative
 * to Kalman Filter-Based Predictive Tracking" (2003)
 * URL: https://cs.brown.edu/people/jlaviola/pubs/kfvsexp_final_laviola.pdf
 *
 * This is the PURE ALGORITHM extracted from the adapter for:
 * 1. Isolation testing
 * 2. Mutation testing with Stryker
 * 3. Reuse across different adapter implementations
 *
 * ALGORITHM (from LaViola paper):
 * 1. Single smoothing: Sp_t = α * p_t + (1-α) * Sp_{t-1}
 * 2. Double smoothing: Sp'_t = α * Sp_t + (1-α) * Sp'_{t-1}
 * 3. Slope estimate: b1(t) = α/(1-α) * (Sp_t - Sp'_t)
 * 4. Level estimate: b0(t) = 2*Sp_t - Sp'_t
 * 5. Prediction: p_{t+τ} = b0(t) + b1(t) * τ
 *
 * @source https://cs.brown.edu/people/jlaviola/pubs/kfvsexp_final_laviola.pdf
 */

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

export interface DESPState {
	/** Single-smoothed X */
	Sp_x: number;
	/** Single-smoothed Y */
	Sp_y: number;
	/** Double-smoothed X */
	Spp_x: number;
	/** Double-smoothed Y */
	Spp_y: number;
	/** Velocity estimate */
	velocity: { x: number; y: number };
	/** Last timestamp */
	lastTs: number | null;
	/** Initialization flag */
	initialized: boolean;
}

export interface DESPResult {
	/** Smoothed position (b0 - level estimate) */
	smoothed: { x: number; y: number };
	/** Predicted position (b0 + b1*τ) */
	predicted: { x: number; y: number };
	/** Velocity estimate (b1 scaled to units/second) */
	velocity: { x: number; y: number };
}

export const DEFAULT_DESP_CONFIG: DESPConfig = {
	alpha: 0.5,
	predictionMs: 50,
	clampOutput: true,
};

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

/**
 * Clamp a value to a range
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Create initial DESP state
 */
export function createInitialState(): DESPState {
	return {
		Sp_x: 0.5,
		Sp_y: 0.5,
		Spp_x: 0.5,
		Spp_y: 0.5,
		velocity: { x: 0, y: 0 },
		lastTs: null,
		initialized: false,
	};
}

/**
 * Validate alpha is in valid range (0,1)
 */
export function validateAlpha(alpha: number): void {
	if (alpha <= 0 || alpha >= 1) {
		throw new Error(`alpha must be in (0,1), got ${alpha}`);
	}
}

/**
 * Process a single observation through the DESP algorithm
 *
 * This is the CORE algorithm - pure function, no side effects.
 *
 * @param x - Input X coordinate
 * @param y - Input Y coordinate
 * @param ts - Timestamp in ms
 * @param state - Current state (will be mutated)
 * @param config - Configuration
 * @returns Result with smoothed, predicted, and velocity
 */
export function processDESP(
	x: number,
	y: number,
	ts: number,
	state: DESPState,
	config: DESPConfig,
): DESPResult {
	const α = config.alpha;

	// Initialize on first observation
	if (!state.initialized) {
		state.Sp_x = x;
		state.Sp_y = y;
		state.Spp_x = x;
		state.Spp_y = y;
		state.lastTs = ts;
		state.initialized = true;

		return {
			smoothed: { x, y },
			predicted: { x, y },
			velocity: { x: 0, y: 0 },
		};
	}

	// Calculate dt for velocity estimation
	const dt = state.lastTs !== null ? (ts - state.lastTs) / 1000 : 1 / 60;
	state.lastTs = ts;

	// ========== LaViola DESP Algorithm ==========

	// Step 1: Single exponential smoothing
	state.Sp_x = α * x + (1 - α) * state.Sp_x;
	state.Sp_y = α * y + (1 - α) * state.Sp_y;

	// Step 2: Double exponential smoothing
	state.Spp_x = α * state.Sp_x + (1 - α) * state.Spp_x;
	state.Spp_y = α * state.Sp_y + (1 - α) * state.Spp_y;

	// Step 3: Calculate slope (b1) - rate of change per second
	const αRatio = α / (1 - α);
	const b1_x = αRatio * (state.Sp_x - state.Spp_x);
	const b1_y = αRatio * (state.Sp_y - state.Spp_y);

	// Step 4: Calculate level (b0) - current smoothed position
	const b0_x = 2 * state.Sp_x - state.Spp_x;
	const b0_y = 2 * state.Sp_y - state.Spp_y;

	// Store velocity (b1 scaled to units/second)
	state.velocity = {
		x: b1_x / dt,
		y: b1_y / dt,
	};

	// Step 5: Predict τ ms into future
	const τ = config.predictionMs / 1000;
	let predicted_x = b0_x + b1_x * τ;
	let predicted_y = b0_y + b1_y * τ;

	// Smoothed position IS b0 (the level estimate)
	let smoothed_x = b0_x;
	let smoothed_y = b0_y;

	// Clamp if configured
	if (config.clampOutput) {
		predicted_x = clamp(predicted_x, 0, 1);
		predicted_y = clamp(predicted_y, 0, 1);
		smoothed_x = clamp(smoothed_x, 0, 1);
		smoothed_y = clamp(smoothed_y, 0, 1);
	}

	return {
		smoothed: { x: smoothed_x, y: smoothed_y },
		predicted: { x: predicted_x, y: predicted_y },
		velocity: { ...state.velocity },
	};
}

/**
 * Reset DESP state
 */
export function resetState(state: DESPState): void {
	state.Sp_x = 0.5;
	state.Sp_y = 0.5;
	state.Spp_x = 0.5;
	state.Spp_y = 0.5;
	state.velocity = { x: 0, y: 0 };
	state.lastTs = null;
	state.initialized = false;
}

/**
 * Calculate Time-to-Impact (TTI) to a target point
 *
 * @param currentX - Current X position
 * @param currentY - Current Y position
 * @param velocityX - Velocity X (units/second)
 * @param velocityY - Velocity Y (units/second)
 * @param targetX - Target X coordinate
 * @param targetY - Target Y coordinate
 * @param distanceThreshold - Distance to consider "arrived"
 * @param speedThreshold - Minimum speed to consider moving
 * @returns TTI in ms, or Infinity if not moving toward target
 */
export function calculateTTI(
	currentX: number,
	currentY: number,
	velocityX: number,
	velocityY: number,
	targetX: number,
	targetY: number,
	distanceThreshold = 0.05,
	speedThreshold = 0.01,
): number {
	// Distance to target
	const dx = targetX - currentX;
	const dy = targetY - currentY;
	const distance = Math.sqrt(dx * dx + dy * dy);

	// Already at target
	if (distance <= distanceThreshold) {
		return 0;
	}

	// Speed magnitude
	const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

	// Not moving fast enough
	if (speed < speedThreshold) {
		return Number.POSITIVE_INFINITY;
	}

	// Dot product to check if moving toward target
	const dot = dx * velocityX + dy * velocityY;

	// Moving away from target
	if (dot <= 0) {
		return Number.POSITIVE_INFINITY;
	}

	// TTI = distance / closing_speed
	// closing_speed = velocity projected onto target direction
	const closingSpeed = dot / distance;

	// Convert to ms
	return (distance / closingSpeed) * 1000;
}

/**
 * Get predicted trajectory points
 */
export function getPredictedTrajectory(
state: DESPState,
config: DESPConfig,
durationMs: number,
steps: number,
): Array<{ x: number; y: number; t: number }> {
const trajectory: Array<{ x: number; y: number; t: number }> = [];
const α = config.alpha;
const αRatio = α / (1 - α);

// Current level and slope
const b0_x = 2 * state.Sp_x - state.Spp_x;
const b0_y = 2 * state.Sp_y - state.Spp_y;
const b1_x = αRatio * (state.Sp_x - state.Spp_x);
const b1_y = αRatio * (state.Sp_y - state.Spp_y);

for (let i = 0; i <= steps; i++) {
const t = (i / steps) * durationMs;
const τ = t / 1000;

let x = b0_x + b1_x * τ;
let y = b0_y + b1_y * τ;

if (config.clampOutput) {
x = clamp(x, 0, 1);
y = clamp(y, 0, 1);
}

trajectory.push({ x, y, t });
}

return trajectory;
}
