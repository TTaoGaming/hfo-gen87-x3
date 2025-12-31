/**
 * Phase 1 - W3C Cursor / Pointer Event Pipeline
 *
 * Gen87.X3 | INTERLOCK (I) | TDD GREEN
 *
 * This barrel file exports the PRODUCTION-READY implementations.
 * NO THEATER - all exports point to REAL implementations.
 *
 * Pipeline Architecture (5 Stages):
 * ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
 * │ Stage 1     │ → │ Stage 2     │ → │ Stage 3     │ → │ Stage 4     │ → │ Stage 5     │
 * │ SENSOR      │   │ SMOOTHER    │   │ FSM         │   │ EMITTER     │   │ ADAPTER     │
 * │ MediaPipe   │   │ 1€ Filter   │   │ XState v5   │   │ W3C Pointer │   │ DOM Target  │
 * └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
 */

// ============================================================================
// STAGE 4: W3C POINTER EVENT FACTORY (EMITTER)
// ============================================================================

export {
	W3CPointerEventFactory,
	DOMEventDispatcher,
	CursorPipeline,
	// Schemas
	PointerEventTypeSchema,
	PointerEventInitSchema,
	FSMActionSchema,
	// Types
	type PointerEventType,
	type PointerEventInit,
	type FSMAction,
	type W3CPointerFactoryConfig,
	type DOMDispatcherConfig,
} from './w3c-pointer-factory.js';

// ============================================================================
// STAGE 2: SMOOTHERS (1€ Filter, Spring-Damper, Chain)
// ============================================================================

// NPM Exemplar (Géry Casiez's original implementation)
export { OneEuroExemplarAdapter } from '../adapters/one-euro-exemplar.adapter.js';
export type { OneEuroConfig } from '../adapters/one-euro-exemplar.adapter.js';

// Alternative adapter
export { OneEuroAdapter } from '../adapters/one-euro.adapter.js';

// Smoother composition
export { SmootherChain } from '../smoothers/smoother-chain.js';
export { PhysicsSpringDamperSmoother } from '../smoothers/physics-spring-smoother.js';
export { PredictiveSmoother } from '../smoothers/predictive-smoother.js';
export { OneEuroSmoother } from '../smoothers/one-euro-smoother.js';

// ============================================================================
// STAGE 3: FSM (XState v5)
// ============================================================================

export { XStateFSMAdapter } from '../adapters/xstate-fsm.adapter.js';

// ============================================================================
// STAGE 1: SENSOR (MediaPipe)
// ============================================================================

export { MediaPipeAdapter } from '../adapters/mediapipe.adapter.js';

// ============================================================================
// STAGE 5: TARGET ADAPTERS
// ============================================================================

export { PointerEventAdapter, DOMAdapter } from '../adapters/pointer-event.adapter.js';

// ============================================================================
// FULL PIPELINE COMPOSITION
// ============================================================================

export { GesturePipeline, createDefaultPipeline } from '../adapters/pipeline.js';
export type { PipelineConfig } from '../adapters/pipeline.js';

// ============================================================================
// CONTRACTS (Zod Schemas)
// ============================================================================

export type {
	SensorPort,
	SmootherPort,
	FSMPort,
	EmitterPort,
	AdapterPort,
	PipelinePort,
} from '../contracts/ports.js';

export {
	SensorFrameSchema,
	SmoothedFrameSchema,
	FSMActionSchema,
	PointerEventOutSchema,
	AdapterTargetSchema,
} from '../contracts/schemas.js';

export type {
	SensorFrame,
	SmoothedFrame,
	FSMAction as FSMActionOut,
	PointerEventOut,
	AdapterTarget,
	NormalizedLandmark,
} from '../contracts/schemas.js';

// ============================================================================
// QUICK START EXAMPLE
// ============================================================================

/**
 * Quick Start:
 *
 * ```typescript
 * import {
 *   W3CPointerEventFactory,
 *   OneEuroExemplarAdapter,
 *   XStateFSMAdapter,
 *   createDefaultPipeline
 * } from './phase1-w3c-cursor/index.js';
 *
 * // Option 1: Use full pipeline
 * const pipeline = createDefaultPipeline(document.body);
 * await pipeline.start();
 *
 * // Option 2: Use individual components
 * const factory = new W3CPointerEventFactory({ viewportWidth: 1920, viewportHeight: 1080 });
 * const smoother = new OneEuroExemplarAdapter({ minCutoff: 1.0, beta: 0.007 });
 * const fsm = new XStateFSMAdapter();
 * ```
 */
