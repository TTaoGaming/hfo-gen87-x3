/**
 * PORT 2: MIRROR MAGUS — SHAPER — SHAPE
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Authority Registry
 *
 * @port 2
 * @binary 010
 * @trigram ☵ Kan (Water)
 * @element Water - Flowing, taking shape of container
 * @verb SHAPE - Pure transformation
 * @jadc2 Effectors - Fires, action execution
 * @stigmergy Secretion - Emit pheromone trails
 * @mantra "How do we SHAPE the SHAPE?"
 * @secret "The mirror that reflects itself"
 *
 * CAN: read, transform, tag
 * CANNOT: persist, decide, emit_output, invoke_external
 *
 * ## INTERLOCKING INTERFACE PATTERN
 *
 * All smoothers implement SmootherPort with three methods:
 * - smooth(frame: SensorFrame): SmoothedFrame
 * - reset(): void
 * - setParams(mincutoff: number, beta: number): void
 *
 * This enables hot-swapping at runtime via PortFactory:
 * ```typescript
 * const factory = new HFOPortFactory({
 *   smoother: { type: '1euro' }, // or 'rapier-smooth', 'desp', etc.
 *   shell: { type: 'raw' }
 * });
 * const smoother = factory.createSmoother();
 * ```
 *
 * ## AVAILABLE SMOOTHERS (Under Mirror Magus Authority)
 *
 * | Type | Algorithm | Best For |
 * |------|-----------|----------|
 * | 1euro | 1€ Filter (Casiez CHI 2012) | Low-latency cursor tracking |
 * | rapier-smooth | Spring-damper physics | Cinematic smooth motion |
 * | rapier-predict | Physics trajectory prediction | Latency compensation |
 * | rapier-adaptive | 1€-inspired physics | Best of both worlds |
 * | desp | Double Exponential (LaViola 2003) | Prediction + smoothing |
 *
 * @source https://gery.casiez.net/1euro/ (1€ Filter)
 * @source https://rapier.rs/ (Rapier physics)
 * @source https://cs.brown.edu/people/jlaviola/pubs/kfvsexp_final_laviola.pdf (DESP)
 */

// ============================================================================
// PORT 2 SMOOTHER ADAPTERS (All implement SmootherPort)
// ============================================================================

/**
 * 1€ FILTER EXEMPLAR (Canonical implementation)
 *
 * Wraps npm 1eurofilter@1.2.2 by original author Géry Casiez.
 * NO HAND-ROLLING - Uses the canonical implementation.
 *
 * @source https://www.npmjs.com/package/1eurofilter
 * @citation Casiez, G., Roussel, N. and Vogel, D. (2012).
 *           1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input
 *           in Interactive Systems. CHI '12.
 */
export {
	OneEuroExemplarAdapter,
	type OneEuroConfig,
} from './one-euro-exemplar.adapter.js';

/**
 * RAPIER PHYSICS ADAPTER (REAL WASM)
 *
 * Uses @dimforge/rapier2d-compat - actual physics, not theater.
 * Supports three modes: smoothed, predictive, adaptive.
 *
 * @source https://rapier.rs/docs/user_guides/javascript/getting_started_js
 */
export { RapierPhysicsAdapter, type RapierConfig } from './rapier-physics.adapter.js';

/**
 * DOUBLE EXPONENTIAL SMOOTHING PREDICTOR (LaViola DESP)
 *
 * Unlike 1€ filter, DESP can PREDICT future positions.
 * 135x faster than Kalman filter with equivalent accuracy.
 *
 * @source https://cs.brown.edu/people/jlaviola/pubs/kfvsexp_final_laviola.pdf
 */
export {
	DoubleExponentialPredictor,
	type DESPConfig,
} from './double-exponential-predictor.adapter.js';

// ============================================================================
// CONTRACT (What all smoothers MUST implement)
// ============================================================================

/**
 * SmootherPort - Port 2 Contract
 *
 * All adapters in this file implement this interface.
 * This enables polymorphic composition and hot-swapping.
 */
export type { SmootherPort } from '../contracts/ports.js';

/**
 * Input/Output Schemas
 *
 * - SensorFrame: Input from Port 0 (Observer)
 * - SmoothedFrame: Output to Port 3 (Injector) or Port 5 (Immunizer)
 */
export type { SensorFrame, SmoothedFrame } from '../contracts/schemas.js';

// ============================================================================
// FACTORY ACCESS
// ============================================================================

/**
 * SmootherConfig - Factory configuration for smoother selection
 *
 * Use with HFOPortFactory.createSmoother() for DI-based instantiation.
 */
export type { SmootherConfig } from './port-factory.js';

// ============================================================================
// TYPE GUARD (Runtime polymorphism check)
// ============================================================================

/**
 * Check if an object implements SmootherPort
 *
 * @param obj - Object to check
 * @returns true if obj has smooth, reset, setParams methods
 */
export function isSmootherPort(obj: unknown): obj is import('../contracts/ports.js').SmootherPort {
	if (!obj || typeof obj !== 'object') return false;
	const candidate = obj as Record<string, unknown>;
	return (
		typeof candidate.smooth === 'function' &&
		typeof candidate.reset === 'function' &&
		typeof candidate.setParams === 'function'
	);
}

// ============================================================================
// MIRROR MAGUS METADATA
// ============================================================================

/**
 * Port 2 metadata for runtime reflection
 */
export const PORT_2_METADATA = {
	port: 2,
	name: 'Mirror Magus',
	binary: '010',
	trigram: '☵',
	element: 'Water',
	verb: 'SHAPE',
	jadc2: 'Effectors',
	stigmergy: 'Secretion',
	mantra: 'How do we SHAPE the SHAPE?',
	secret: 'The mirror that reflects itself',
	adapters: [
		{ type: '1euro', name: 'OneEuroExemplarAdapter', source: 'npm 1eurofilter@1.2.2' },
		{ type: 'rapier-smooth', name: 'RapierPhysicsAdapter', source: '@dimforge/rapier2d-compat' },
		{ type: 'rapier-predict', name: 'RapierPhysicsAdapter', source: '@dimforge/rapier2d-compat' },
		{ type: 'rapier-adaptive', name: 'RapierPhysicsAdapter', source: '@dimforge/rapier2d-compat' },
		{ type: 'desp', name: 'DoubleExponentialPredictor', source: 'LaViola (2003)' },
	],
} as const;
