/**
 * Palm Cone Gate - Schmitt Trigger Hysteresis for Anti-Midas Touch
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Port 5 (DEFEND)
 *
 * DESIGN: Uses Schmitt trigger pattern to prevent oscillation when
 * user's palm hovers near threshold angle. Two thresholds create
 * a hysteresis band:
 * - ARM_THRESHOLD (25°): Must be below to enter ARMED
 * - DISARM_THRESHOLD (35°): Must be above to exit ARMED
 * - 10° band prevents flicker
 *
 * @source Memory: FSM_Hysteresis_Architecture_20251231
 * @source Tavily: Midas Touch UX problem research
 */
import { z } from 'zod';
import type { NormalizedLandmark } from '../contracts/schemas.js';

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

export const PalmConeConfigSchema = z.object({
	/** Angle to ENTER tracking (< this = palm facing camera) */
	armThreshold: z.number().min(0).max(90).default(25),

	/** Angle to EXIT tracking (> this = palm facing away) - hysteresis */
	disarmThreshold: z.number().min(0).max(90).default(35),

	/** Angle for IMMEDIATE cancel (intentional roll away) */
	cancelThreshold: z.number().min(0).max(180).default(70),
});

export type PalmConeConfig = z.infer<typeof PalmConeConfigSchema>;

export const DEFAULT_PALM_CONE_CONFIG: PalmConeConfig = {
	armThreshold: 25,
	disarmThreshold: 35,
	cancelThreshold: 70,
};

// ============================================================================
// PALM CONE GATE STATE
// ============================================================================

export interface PalmConeGateState {
	/** Current hysteresis state - is palm currently considered "facing"? */
	isFacing: boolean;

	/** Last computed palm angle (for debugging) */
	lastPalmAngle: number;

	/** Timestamp of last update */
	lastUpdateTs: number;
}

export function createPalmConeGateState(): PalmConeGateState {
	return {
		isFacing: false,
		lastPalmAngle: 180, // Start with palm "away"
		lastUpdateTs: 0,
	};
}

// ============================================================================
// PALM ANGLE CALCULATION
// ============================================================================

// MediaPipe landmark indices
const WRIST = 0;
const INDEX_FINGER_MCP = 5;
const PINKY_MCP = 17;

/**
 * Calculate palm normal angle from camera Z-axis
 *
 * Uses cross product of wrist→index_mcp × wrist→pinky_mcp to get palm normal,
 * then dot product with camera Z-axis (0, 0, -1) to get angle.
 *
 * @param landmarks 21 MediaPipe hand landmarks
 * @returns Palm angle in degrees (0° = facing camera, 90° = perpendicular, 180° = away)
 */
export function calculatePalmAngle(landmarks: NormalizedLandmark[]): number {
	if (!landmarks || landmarks.length < 21) {
		return 180; // Invalid input = consider palm "away"
	}

	const wrist = landmarks[WRIST];
	const indexMCP = landmarks[INDEX_FINGER_MCP];
	const pinkyMCP = landmarks[PINKY_MCP];

	// Check for valid landmarks
	if (!wrist || !indexMCP || !pinkyMCP) {
		return 180;
	}

	// Create vectors from wrist to MCPs
	const v1 = {
		x: indexMCP.x - wrist.x,
		y: indexMCP.y - wrist.y,
		z: indexMCP.z - wrist.z,
	};
	const v2 = {
		x: pinkyMCP.x - wrist.x,
		y: pinkyMCP.y - wrist.y,
		z: pinkyMCP.z - wrist.z,
	};

	// Cross product = palm normal (pointing out of palm)
	const normal = {
		x: v1.y * v2.z - v1.z * v2.y,
		y: v1.z * v2.x - v1.x * v2.z,
		z: v1.x * v2.y - v1.y * v2.x,
	};

	// Calculate magnitude
	const mag = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);

	// Avoid division by zero
	if (mag < 1e-10) {
		return 90; // Degenerate case = perpendicular
	}

	// Normalize
	const unitNormal = {
		x: normal.x / mag,
		y: normal.y / mag,
		z: normal.z / mag,
	};

	// Camera Z-axis (pointing into screen in normalized coordinates)
	// MediaPipe uses right-handed coordinate system with Z pointing toward camera
	const cameraAxis = { x: 0, y: 0, z: -1 };

	// Dot product = cosine of angle between palm normal and camera axis
	const dot =
		unitNormal.x * cameraAxis.x + unitNormal.y * cameraAxis.y + unitNormal.z * cameraAxis.z;

	// Clamp to [-1, 1] to handle floating point errors
	const clampedDot = Math.max(-1, Math.min(1, dot));

	// Convert to degrees
	const angleRadians = Math.acos(clampedDot);
	return angleRadians * (180 / Math.PI);
}

// ============================================================================
// SCHMITT TRIGGER GATE
// ============================================================================

export interface PalmConeGateResult {
	/** Is palm currently facing camera (with hysteresis)? */
	isFacing: boolean;

	/** Raw palm angle in degrees */
	palmAngle: number;

	/** Should trigger immediate cancel (intentional roll)? */
	shouldCancel: boolean;

	/** Updated gate state */
	state: PalmConeGateState;
}

/**
 * Schmitt trigger gate for palm cone detection
 *
 * Uses hysteresis to prevent oscillation:
 * - Once facing (< armThreshold), stays facing until > disarmThreshold
 * - Once not facing (> disarmThreshold), stays not facing until < armThreshold
 *
 * @param landmarks Current MediaPipe landmarks
 * @param currentState Previous gate state
 * @param config Threshold configuration
 * @param ts Current timestamp in ms
 * @returns Gate result with updated state
 */
export function updatePalmConeGate(
	landmarks: NormalizedLandmark[] | null,
	currentState: PalmConeGateState,
	config: PalmConeConfig,
	ts: number,
): PalmConeGateResult {
	// Handle null/invalid landmarks
	if (!landmarks || landmarks.length < 21) {
		return {
			isFacing: false,
			palmAngle: 180,
			shouldCancel: false,
			state: {
				isFacing: false,
				lastPalmAngle: 180,
				lastUpdateTs: ts,
			},
		};
	}

	// Calculate current palm angle
	const palmAngle = calculatePalmAngle(landmarks);

	// Check for immediate cancel (intentional roll away)
	const shouldCancel = palmAngle >= config.cancelThreshold;

	// Schmitt trigger logic
	let isFacing: boolean;

	if (currentState.isFacing) {
		// Currently facing - only stop facing if angle exceeds disarmThreshold
		isFacing = palmAngle < config.disarmThreshold;
	} else {
		// Currently not facing - only start facing if angle is below armThreshold
		isFacing = palmAngle < config.armThreshold;
	}

	return {
		isFacing,
		palmAngle,
		shouldCancel,
		state: {
			isFacing,
			lastPalmAngle: palmAngle,
			lastUpdateTs: ts,
		},
	};
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a palm cone gate processor function
 *
 * @param config Gate configuration (optional)
 * @returns Stateful gate processor function
 */
export function createPalmConeGate(config: Partial<PalmConeConfig> = {}) {
	const fullConfig = { ...DEFAULT_PALM_CONE_CONFIG, ...config };
	let state = createPalmConeGateState();

	return {
		/**
		 * Process frame and update gate state
		 */
		process(landmarks: NormalizedLandmark[] | null, ts: number): PalmConeGateResult {
			const result = updatePalmConeGate(landmarks, state, fullConfig, ts);
			state = result.state;
			return result;
		},

		/**
		 * Reset gate to initial state
		 */
		reset(): void {
			state = createPalmConeGateState();
		},

		/**
		 * Get current state (for debugging)
		 */
		getState(): PalmConeGateState {
			return { ...state };
		},

		/**
		 * Get configuration (for debugging)
		 */
		getConfig(): PalmConeConfig {
			return { ...fullConfig };
		},
	};
}

export type PalmConeGate = ReturnType<typeof createPalmConeGate>;
