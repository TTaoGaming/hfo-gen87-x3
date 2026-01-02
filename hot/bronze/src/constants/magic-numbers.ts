/**
 * MAGIC NUMBERS REGISTRY - All numeric constants with TRL-9 provenance
 *
 * RULES:
 * 1. Every constant MUST have @source (URL) and @citation (paper/spec)
 * 2. Every constant MUST have @range with validated bounds
 * 3. Every constant MUST be user-tunable via config override
 * 4. NO inline numeric literals in production code - import from here
 *
 * @see MAGIC_NUMBERS_REGISTRY.md for full documentation
 */

import { z } from 'zod';

// =============================================================================
// 1€ FILTER PARAMETERS (Casiez et al. CHI 2012)
// =============================================================================

/**
 * Minimum cutoff frequency for 1€ filter
 * @source https://gery.casiez.net/1euro/
 * @citation Casiez, G., Roussel, N., & Vogel, D. (2012). 1€ Filter: A Simple Speed-based Low-pass Filter. CHI 2012.
 * @range [0.1, 10.0] Hz - Lower = more smoothing, higher = more responsive
 * @default 1.0 Hz - Paper default, good starting point
 */
export const ONE_EURO_MINCUTOFF_DEFAULT = 1.0;
export const ONE_EURO_MINCUTOFF_MIN = 0.1;
export const ONE_EURO_MINCUTOFF_MAX = 10.0;

/**
 * Beta (speed coefficient) for 1€ filter
 * @source https://gery.casiez.net/1euro/
 * @citation Casiez, G., Roussel, N., & Vogel, D. (2012). 1€ Filter: A Simple Speed-based Low-pass Filter. CHI 2012.
 * @range [0.0, 1.0] - 0 = no speed adaptation, higher = more lag reduction at high speed
 * @default 0.0 - Paper recommends starting at 0, increase if lag is visible
 * @tuning "First set BETA to 0 and MINCUTOFF to a reasonable middle-ground value such as 1 Hz"
 */
export const ONE_EURO_BETA_DEFAULT = 0.0;
export const ONE_EURO_BETA_MIN = 0.0;
export const ONE_EURO_BETA_MAX = 1.0;

/**
 * Derivative cutoff frequency for 1€ filter
 * @source https://gery.casiez.net/1euro/
 * @citation Casiez, G., Roussel, N., & Vogel, D. (2012). 1€ Filter: A Simple Speed-based Low-pass Filter. CHI 2012.
 * @range [0.1, 10.0] Hz - Filters the derivative estimate
 * @default 1.0 Hz - Paper default
 */
export const ONE_EURO_DCUTOFF_DEFAULT = 1.0;
export const ONE_EURO_DCUTOFF_MIN = 0.1;
export const ONE_EURO_DCUTOFF_MAX = 10.0;

// =============================================================================
// DEAD ZONE / VELOCITY THRESHOLD (XInput / Industry Standard)
// =============================================================================

/**
 * Dead zone threshold for input filtering (as fraction of range)
 * @source https://docs.microsoft.com/en-us/windows/win32/xinput/getting-started-with-xinput#dead-zone
 * @citation Microsoft XInput documentation; Unity Input System docs
 * @range [0.05, 0.25] - Industry standard range
 * @default 0.10 - Matches typical hardware noise floor (~10%)
 * @note Xbox controllers: 0.20-0.25, Steam: 0.05-0.08, Hardware: ~0.10
 */
export const DEAD_ZONE_DEFAULT = 0.1;
export const DEAD_ZONE_MIN = 0.05;
export const DEAD_ZONE_MAX = 0.25;

/**
 * XInput standard left stick dead zone
 * @source https://docs.microsoft.com/en-us/windows/win32/xinput/getting-started-with-xinput
 * @citation XINPUT_GAMEPAD_LEFT_THUMB_DEADZONE = 7849 / 32767 ≈ 0.24
 */
export const XINPUT_LEFT_STICK_DEADZONE = 0.24;

/**
 * XInput standard right stick dead zone
 * @source https://docs.microsoft.com/en-us/windows/win32/xinput/getting-started-with-xinput
 * @citation XINPUT_GAMEPAD_RIGHT_THUMB_DEADZONE = 8689 / 32767 ≈ 0.27
 */
export const XINPUT_RIGHT_STICK_DEADZONE = 0.27;

// =============================================================================
// RAPIER PHYSICS PARAMETERS (Tuned for HFO hand tracking)
// =============================================================================

/**
 * Damping coefficient for spring-damper system
 * @source Custom tuning for HFO - see GEN87_X3_Rapier_Tuning_Notes
 * @citation Critically damped system: ζ = c / (2√(km)) = 1.0
 * @range [0.5, 2.0] - Underdamped (0.5-0.9), Critical (1.0), Overdamped (1.1-2.0)
 * @default 1.2 - Slightly overdamped to prevent any oscillation
 * @rationale Hand tracking has ~60Hz input, 1.2 ensures no overshoot
 */
export const RAPIER_DAMPING_DEFAULT = 1.2;
export const RAPIER_DAMPING_MIN = 0.5;
export const RAPIER_DAMPING_MAX = 2.0;

/**
 * Spring stiffness for spring-damper system
 * @source Custom tuning for HFO - see GEN87_X3_Rapier_Tuning_Notes
 * @citation k = (2π * f_n)² * m where f_n is natural frequency
 * @range [100, 500] - Lower = slower response, higher = faster but may overshoot
 * @default 200 - Tuned for ~50ms settling time at 60Hz input
 */
export const RAPIER_STIFFNESS_DEFAULT = 200;
export const RAPIER_STIFFNESS_MIN = 100;
export const RAPIER_STIFFNESS_MAX = 500;

/**
 * Physics substeps per frame
 * @source Custom tuning - standard practice for stable physics
 * @citation Gaffer On Games: "Fix Your Timestep!" https://gafferongames.com/post/fix_your_timestep/
 * @range [1, 8] - More = accurate but slower
 * @default 4 - Balance accuracy vs performance for 60Hz input
 */
export const RAPIER_SUBSTEPS_DEFAULT = 4;
export const RAPIER_SUBSTEPS_MIN = 1;
export const RAPIER_SUBSTEPS_MAX = 8;

// =============================================================================
// PREDICTION PARAMETERS (LaViola DESP)
// =============================================================================

/**
 * Minimum distance threshold for TTI calculation (normalized)
 * @source LaViola, J. (2003). Double exponential smoothing: an alternative to Kalman filter-based predictive tracking
 * @citation Distance below this is considered "arrived" for time-to-intercept
 * @range [0.0001, 0.01] - Depends on coordinate system resolution
 * @default 0.001 - 0.1% of normalized [0,1] space
 */
export const TTI_DISTANCE_THRESHOLD = 0.001;

/**
 * Minimum speed threshold for TTI calculation
 * @source LaViola DESP paper
 * @citation Speeds below this return infinity (target unreachable in finite time)
 * @range [0.0001, 0.01]
 * @default 0.001 - 0.1% per frame
 */
export const TTI_SPEED_THRESHOLD = 0.001;

// =============================================================================
// MEDIAPIPE / HAND TRACKING PARAMETERS
// =============================================================================

/**
 * Minimum confidence threshold for hand detection
 * @source https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
 * @citation MediaPipe Hand Landmarker documentation
 * @range [0.5, 0.95] - Higher = fewer false positives, may miss hands
 * @default 0.7 - Balanced between stability and responsiveness
 */
export const MEDIAPIPE_MIN_DETECTION_CONFIDENCE = 0.7;

/**
 * Minimum confidence threshold for hand tracking
 * @source https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
 * @citation MediaPipe Hand Landmarker documentation
 * @range [0.5, 0.95]
 * @default 0.5 - Lower than detection to maintain tracking once found
 */
export const MEDIAPIPE_MIN_TRACKING_CONFIDENCE = 0.5;

// =============================================================================
// ZOD SCHEMAS FOR USER TUNABLES
// =============================================================================

export const OneEuroTunablesSchema = z.object({
	mincutoff: z
		.number()
		.min(ONE_EURO_MINCUTOFF_MIN)
		.max(ONE_EURO_MINCUTOFF_MAX)
		.default(ONE_EURO_MINCUTOFF_DEFAULT),
	beta: z.number().min(ONE_EURO_BETA_MIN).max(ONE_EURO_BETA_MAX).default(ONE_EURO_BETA_DEFAULT),
	dcutoff: z
		.number()
		.min(ONE_EURO_DCUTOFF_MIN)
		.max(ONE_EURO_DCUTOFF_MAX)
		.default(ONE_EURO_DCUTOFF_DEFAULT),
});

export const DeadZoneTunablesSchema = z.object({
	deadZone: z.number().min(DEAD_ZONE_MIN).max(DEAD_ZONE_MAX).default(DEAD_ZONE_DEFAULT),
});

export const RapierTunablesSchema = z.object({
	damping: z
		.number()
		.min(RAPIER_DAMPING_MIN)
		.max(RAPIER_DAMPING_MAX)
		.default(RAPIER_DAMPING_DEFAULT),
	stiffness: z
		.number()
		.min(RAPIER_STIFFNESS_MIN)
		.max(RAPIER_STIFFNESS_MAX)
		.default(RAPIER_STIFFNESS_DEFAULT),
	substeps: z
		.number()
		.int()
		.min(RAPIER_SUBSTEPS_MIN)
		.max(RAPIER_SUBSTEPS_MAX)
		.default(RAPIER_SUBSTEPS_DEFAULT),
});

export const AllTunablesSchema = z.object({
	oneEuro: OneEuroTunablesSchema.optional(),
	deadZone: DeadZoneTunablesSchema.optional(),
	rapier: RapierTunablesSchema.optional(),
});

export type OneEuroTunables = z.infer<typeof OneEuroTunablesSchema>;
export type DeadZoneTunables = z.infer<typeof DeadZoneTunablesSchema>;
export type RapierTunables = z.infer<typeof RapierTunablesSchema>;
export type AllTunables = z.infer<typeof AllTunablesSchema>;

// =============================================================================
// UTILITY: Validate user config against bounds
// =============================================================================

/**
 * Clamp a value to its provenance-defined range
 */
export function clampToRange(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Apply user tunables with validation and clamping
 */
export function applyTunables<T extends Record<string, number>>(
	defaults: T,
	userOverrides: Partial<T> | undefined,
	ranges: Record<keyof T, { min: number; max: number }>,
): T {
	if (!userOverrides) return defaults;

	const result = { ...defaults };
	for (const key of Object.keys(userOverrides) as (keyof T)[]) {
		const value = userOverrides[key];
		if (value !== undefined) {
			const range = ranges[key];
			result[key] = clampToRange(value, range.min, range.max) as T[keyof T];
		}
	}
	return result;
}
