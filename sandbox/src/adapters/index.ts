/**
 * W3C Gesture Control Plane - Adapters Index
 *
 * Gen87.X3 | Phase: INTERLOCK (I)
 *
 * Export all adapter implementations
 */

// Sensor adapters
export { MediaPipeAdapter, MockSensorAdapter } from './mediapipe.adapter.js';

// Smoother adapters
export { OneEuroAdapter, PassthroughSmootherAdapter } from './one-euro.adapter.js';

// FSM adapter
export { XStateFSMAdapter } from './xstate-fsm.adapter.js';

// Emitter adapters
export { DOMAdapter, MockDOMAdapter, PointerEventAdapter } from './pointer-event.adapter.js';

// Pipeline
export { GesturePipeline, createDefaultPipeline, type PipelineConfig } from './pipeline.js';
