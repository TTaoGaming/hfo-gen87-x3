/**
 * Browser Bundle Entry Point — HFO Gesture Control Plane
 *
 * Gen87.X3 | Port 3 (Spore Storm) | DELIVER
 *
 * This file exports all adapters to window.HFO for browser usage.
 * Demos MUST import from window.HFO, not directly from npm packages.
 *
 * Anti-theater gate BLOCKS:
 * - Direct npm imports in demos
 * - Direct CDN usage (new OneEuroFilter(), RAPIER.init())
 *
 * Anti-theater gate ALLOWS:
 * - Using window.HFO.* adapters
 * - Using this bundled output
 */
// @ts-nocheck


// Re-export adapter classes (they wrap npm packages internally)
export { OneEuroExemplarAdapter } from './one-euro-exemplar.adapter.js';
export { GesturePipeline, createDefaultPipeline, type PipelineConfig } from './pipeline.js';
export { DOMAdapter, MockDOMAdapter, PointerEventAdapter } from './pointer-event.adapter.js';
export {
    RapierPhysicsAdapter, createPredictiveRapierAdapter, createSmoothedRapierAdapter, type RapierConfig
} from './rapier-physics.adapter.js';
export { XStateFSMAdapter } from './xstate-fsm.adapter.js';

// Re-export ports for type checking
export type { EmitterPort, W3CPointerEvent } from '../ports/emitter.port.js';
export type { FSMPort, GestureContext, GestureEvent, GestureState } from '../ports/fsm.port.js';
export type { Landmark, SensorFrame, SensorPort } from '../ports/sensor.port.js';
export type { SmoothedPoint, SmootherPort } from '../ports/smoother.port.js';
export { initHFO };

// Version info
export const VERSION = '87.3.0';
export const BUILD_DATE = new Date().toISOString();

// Create global HFO namespace for browsers
const HFO = {
	// Smoother adapters (wrap npm packages)
	OneEuroExemplarAdapter: undefined as any,
	RapierPhysicsAdapter: undefined as any,
	createSmoothedRapierAdapter: undefined as any,
	createPredictiveRapierAdapter: undefined as any,

	// FSM adapter
	XStateFSMAdapter: undefined as any,

	// Emitter adapters
	PointerEventAdapter: undefined as any,
	DOMAdapter: undefined as any,
	MockDOMAdapter: undefined as any,

	// Pipeline
	GesturePipeline: undefined as any,
	createDefaultPipeline: undefined as any,

	// Meta
	VERSION: '87.3.0',
	BUILD_DATE: '',
};

// Lazy init to avoid circular deps in bundler
async function initHFO() {
	const { OneEuroExemplarAdapter } = await import('./one-euro-exemplar.adapter.js');
	const { RapierPhysicsAdapter, createSmoothedRapierAdapter, createPredictiveRapierAdapter } = await import('./rapier-physics.adapter.js');
	const { XStateFSMAdapter } = await import('./xstate-fsm.adapter.js');
	const { PointerEventAdapter, DOMAdapter, MockDOMAdapter } = await import('./pointer-event.adapter.js');
	const { GesturePipeline, createDefaultPipeline } = await import('./pipeline.js');

	HFO.OneEuroExemplarAdapter = OneEuroExemplarAdapter;
	HFO.RapierPhysicsAdapter = RapierPhysicsAdapter;
	HFO.createSmoothedRapierAdapter = createSmoothedRapierAdapter;
	HFO.createPredictiveRapierAdapter = createPredictiveRapierAdapter;
	HFO.XStateFSMAdapter = XStateFSMAdapter;
	HFO.PointerEventAdapter = PointerEventAdapter;
	HFO.DOMAdapter = DOMAdapter;
	HFO.MockDOMAdapter = MockDOMAdapter;
	HFO.GesturePipeline = GesturePipeline;
	HFO.createDefaultPipeline = createDefaultPipeline;
	HFO.BUILD_DATE = new Date().toISOString();

	return HFO;
}

// Attach to window if in browser
if (typeof window !== 'undefined') {
	(window as any).HFO = HFO;
	(window as any).initHFO = initHFO;
}

export default HFO;

