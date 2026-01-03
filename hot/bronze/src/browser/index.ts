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
// 8-PORT ARCHITECTURE (The Obsidian Hourglass)
// ============================================================================
export { MirrorMagusShaper } from '../adapters/mirror-magus-shaper.adapter.js';
export { PyrePraetorianImmunizer } from '../adapters/pyre-praetorian-immunizer.adapter.js';
export { SporeStormInjector } from '../adapters/spore-storm-injector.adapter.js';
export { WebWeaverBridger } from '../adapters/web-weaver-bridger.adapter.js';
export * from '../contracts/eight-ports.js';
export { SpiderSovereignOrchestrator } from '../pipeline/spider-sovereign.js';

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
	type VideoFrame,
} from '../contracts/schemas.js';

export type { FSMPort, SensorPort, SmootherPort } from '../contracts/ports.js';

// ============================================================================
// PIPELINE & ORCHESTRATION (Gen87.X3 Canonical)
// ============================================================================
export * from '../adapters/factories.js';
export { DOMTargetRouterAdapter } from '../adapters/target-router.adapter.js';
export {
	AdapterRegistry,
	EmitterRegistry,
	FSMRegistry,
	OverlayRegistry,
	PredictorRegistry,
	SensorRegistry,
	SmootherRegistry,
	TargetRegistry,
} from '../contracts/adapter-factory.js';
export { HFO_W3C_Pointer_Orchestrator } from '../pipeline/hfo_w3c_pointer_orchestrator.js';
export { W3CGestureComposer } from '../pipeline/w3c-gesture-composer.js';

// ============================================================================
// SENSOR ADAPTERS (Port 0 - SENSE)
// ============================================================================
export { MediaPipeAdapter } from '../adapters/mediapipe.adapter.js';

// ============================================================================
// SMOOTHER ADAPTERS (Port 2 - SHAPE)
// ============================================================================

// 1€ Filter - Casiez CHI 2012 (npm 1eurofilter by original author)
export {
	OneEuroExemplarAdapter,
	type OneEuroConfig,
} from '../adapters/one-euro-exemplar.adapter.js';

// Rapier Physics - REAL WASM physics (dimforge/rapier2d-compat)
export {
	createAdaptiveRapierAdapter,
	createPredictiveRapierAdapter,
	RapierPhysicsAdapter,
	type RapierConfig,
} from '../adapters/rapier-physics.adapter.js';

// DESP - Double Exponential Smoothing Predictor (LaViola 2003)
export {
	DoubleExponentialPredictor,
	type DESPConfig,
} from '../adapters/double-exponential-predictor.adapter.js';

// ============================================================================
// FSM ADAPTER (Port 3 - DELIVER) - XState v5 State Machine
// ============================================================================
export { XStateFSMAdapter } from '../adapters/xstate-fsm.adapter.js';

// ============================================================================
// POINTER EVENT ADAPTER (Port 3 - DELIVER) - W3C PointerEvents
// ============================================================================
export { DOMAdapter, PointerEventAdapter } from '../adapters/pointer-event.adapter.js';

// ============================================================================
// UI SHELL ADAPTER (Port 7 - NAVIGATE) - GoldenLayout 2.6.0
// ============================================================================
export { GoldenLayoutShellAdapter } from '../adapters/golden-layout-shell.adapter.js';

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
	type PalmConeGateState,
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
	type GestureTransitionState,
} from '../gates/gesture-transition-predictor.js';

// ============================================================================
// SUBSTRATE (Message Bus Adapters)
// ============================================================================

// In-Memory (browser-only, no server needed)
export { InMemorySubstrateAdapter } from '../adapters/in-memory-substrate.adapter.js';

// NATS (production, requires NATS server)
export {
	createSubstrateAdapter,
	NatsSubstrateAdapter,
	type NatsSubstrateConfig,
} from '../adapters/nats-substrate.adapter.js';

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
	type TraceContext,
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
	RAPIER_SUBSTEPS_DEFAULT,
} from '../constants/magic-numbers.js';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Create a SensorFrame from mouse/touch coordinates
 * Useful for demos without MediaPipe camera
 *
 * @param x - Normalized X coordinate (0-1)
 * @param y - Normalized Y coordinate (0-1)
 * @param timestamp - Timestamp in ms (default: performance.now())
 * @param label - Gesture label (default: 'Pointing_Up')
 * @param palmFacing - Palm orientation (default: true)
 * @param confidence - Detection confidence (default: 1.0)
 */
export function createSensorFrameFromMouse(
	x: number,
	y: number,
	timestamp: number = performance.now(),
	label: SensorFrame['label'] = 'Pointing_Up',
	palmFacing = true,
	confidence = 1.0,
): SensorFrame {
	return {
		ts: timestamp,
		handId: 'right',
		trackingOk: true,
		palmFacing,
		label,
		confidence,
		indexTip: { x, y, z: 0, visibility: 1.0 },
		landmarks: null,
	};
}

/**
 * Add synthetic jitter to coordinates (for testing smoothers)
 * @param value - Original coordinate (0-1)
 * @param jitterAmount - Max jitter magnitude (default 0.01 = 1%)
 */
export function addJitter(value: number, jitterAmount = 0.01): number {
	return value + (Math.random() - 0.5) * 2 * jitterAmount;
}

// Re-export SensorFrame type for convenience
import type { SensorFrame } from '../contracts/schemas.js';
