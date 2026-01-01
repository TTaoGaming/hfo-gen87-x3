/**
 * W3C Gesture Control Plane - Adapters Index
 *
 * Gen87.X3 | Phase: INTERLOCK (I)
 *
 * Export all adapter implementations
 * 
 * RULE: All adapters MUST wrap npm exemplars, not hand-roll algorithms.
 */
// @ts-nocheck


// Sensor adapters
export { MediaPipeAdapter, MockSensorAdapter } from './mediapipe.adapter.js';

// Smoother adapters (EXEMPLAR COMPOSITION)
export { OneEuroExemplarAdapter } from './one-euro-exemplar.adapter.js';
export { OneEuroAdapter, PassthroughSmootherAdapter } from './one-euro.adapter.js';
export { RapierPhysicsAdapter, createPredictiveRapierAdapter, createSmoothedRapierAdapter } from './rapier-physics.adapter.js';
export type { RapierConfig } from './rapier-physics.adapter.js';

// FSM adapter
export { XStateFSMAdapter } from './xstate-fsm.adapter.js';

// Emitter adapters
export { DOMAdapter, MockDOMAdapter, PointerEventAdapter } from './pointer-event.adapter.js';

// Pipeline
export { GesturePipeline, createDefaultPipeline, type PipelineConfig } from './pipeline.js';
