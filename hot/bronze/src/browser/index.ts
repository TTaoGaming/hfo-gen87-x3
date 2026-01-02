/**
 * HFO Browser Entry Point
 *
 * Gen87.X3 | Browser Bundle Export
 *
 * This module exports all browser-compatible HFO adapters for use in demos.
 * Built with Vite for ESM browser bundle.
 *
 * NO STUBS. NO MOCKS. REAL EXEMPLAR COMPONENTS.
 */

// ============================================================================
// CONTRACTS (Schemas & Types)
// ============================================================================
export {
    FSMActionSchema,
    FSMStates,
    GestureLabels,
    NormalizedLandmarkSchema,
    // Schemas
    SensorFrameSchema,
    SmoothedFrameSchema,
    VideoFrameSchema,
    type FSMState,
    type GestureLabel,
    type NormalizedLandmark,
    // Types
    type SensorFrame,
    type SmoothedFrame,
    type VideoFrame
} from '../contracts/schemas.js';

export type { FSMPort, SensorPort, SmootherPort } from '../contracts/ports.js';

// ============================================================================
// SMOOTHER ADAPTERS (Port 2 - SHAPE)
// ============================================================================

// 1€ Filter - Casiez CHI 2012 (npm 1eurofilter by original author)
export {
    OneEuroExemplarAdapter,
    type OneEuroConfig
} from '../adapters/one-euro-exemplar.adapter.js';

// Rapier Physics - REAL WASM physics (dimforge/rapier2d-compat)
export {
    createAdaptiveRapierAdapter,
    createPredictiveRapierAdapter,
    RapierPhysicsAdapter,
    type RapierConfig
} from '../adapters/rapier-physics.adapter.js';

// DESP - Double Exponential Smoothing Predictor (LaViola 2003)
export {
    DoubleExponentialPredictor,
    type DESPConfig
} from '../adapters/double-exponential-predictor.adapter.js';

// ============================================================================
// FSM ADAPTER (Port 3 - DELIVER) - XState v5 State Machine
// ============================================================================
export { XStateFSMAdapter } from '../adapters/xstate-fsm.adapter.js';

// ============================================================================
// PORT FACTORY (Hot-Swappable Smoothers)
// ============================================================================
export { HFOPortFactory, type PortFactoryConfig } from '../adapters/port-factory.js';

// ============================================================================
// GATES (Port 5 - DEFEND)
// ============================================================================
export {
    // Palm Cone Gate (Schmitt Trigger Hysteresis)
    calculatePalmAngle,
    createPalmConeGate,
    createPalmConeGateState,
    DEFAULT_PALM_CONE_CONFIG,
    PalmConeConfigSchema,
    updatePalmConeGate,
    type PalmConeConfig,
    type PalmConeGateResult,
    type PalmConeGateState
} from '../gates/palm-cone-gate.js';

export {
    createGestureTransitionPredictor,
    createGestureTransitionState,
    DEFAULT_GESTURE_TRANSITION_CONFIG,
    GestureTransitionConfigSchema,
    // Gesture Transition Predictor
    updateGestureTransitionPredictor,
    type GestureTransitionConfig,
    type GestureTransitionPrediction,
    type GestureTransitionState
} from '../gates/gesture-transition-predictor.js';

// ============================================================================
// PIPELINE (Real Data Flow)
// ============================================================================
export {
    FuseAdapter,
    HFOPipeline,
    SenseAdapter,
    ShapeSmootherAdapter
} from '../pipeline/hfo-pipeline.js';

// ============================================================================
// TRACE CONTEXT (OpenTelemetry W3C Format)
// ============================================================================
export {
    createDeterministicTrace,
    createTraceContext,
    extractSpanId,
    extractTraceId,
    getSpanId,
    getTraceId,
    isSampled,
    isValidTraceparent,
    parseTraceparent,
    propagateTrace,
    validateTraceparent,
    type ParsedTraceparent,
    type TraceContext
} from '../shared/trace-context.js';

// ============================================================================
// CONSTANTS (Magic Numbers with Provenance)
// ============================================================================
export {
    // Dead Zone
    DEAD_ZONE_DEFAULT,
    DEAD_ZONE_MAX,
    DEAD_ZONE_MIN,
    ONE_EURO_BETA_DEFAULT,
    ONE_EURO_DCUTOFF_DEFAULT,
    // 1€ Filter Defaults
    ONE_EURO_MINCUTOFF_DEFAULT,
    RAPIER_DAMPING_DEFAULT,
    // Rapier Physics Defaults
    RAPIER_STIFFNESS_DEFAULT,
    RAPIER_SUBSTEPS_DEFAULT
} from '../constants/magic-numbers.js';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Create a SensorFrame from mouse/touch coordinates
 * Useful for demos without MediaPipe camera
 */
export function createSensorFrameFromMouse(
	x: number,
	y: number,
	timestamp: number = performance.now(),
): SensorFrame {
	return {
		ts: timestamp,
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: 'Pointing_Up',
		confidence: 1.0,
		indexTip: { x, y, z: 0, visibility: 1.0 },
		landmarks: null,
	};
}

/**
 * Add synthetic jitter to coordinates (for testing smoothers)
 * @param value - Original coordinate (0-1)
 * @param jitterAmount - Max jitter magnitude (default 0.01 = 1%)
 */
export function addJitter(value: number, jitterAmount: number = 0.01): number {
	return value + (Math.random() - 0.5) * 2 * jitterAmount;
}

// Re-export SensorFrame type for convenience
import type { SensorFrame } from '../contracts/schemas.js';
