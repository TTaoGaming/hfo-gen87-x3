/**
 * 1€ Filter Smoother - WIRED (TDD GREEN Phase)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * Reference: Géry Casiez, Nicolas Roussel, Daniel Vogel.
 * "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems"
 * CHI 2012 - https://dl.acm.org/doi/10.1145/2207676.2208639
 *
 * The 1€ filter is an adaptive low-pass filter that adjusts its cutoff frequency
 * based on the speed of the input signal. This provides:
 * - Low cutoff (smooth) when stationary or slow-moving
 * - High cutoff (snappy) when fast-moving
 *
 * TRL 9: Peer-reviewed, widely deployed in production (MediaPipe, Unity, etc.)
 *
 * VALIDATE: Re-exports the working adapter from one-euro.adapter.ts
 */
// @ts-nocheck


import { OneEuroAdapter, PassthroughSmootherAdapter } from '../adapters/one-euro.adapter.js';

// Re-export config type for consumers
export interface OneEuroConfig {
	/** Minimum cutoff frequency (Hz) - lower = smoother when slow */
	mincutoff: number;
	/** Speed coefficient - higher = snappier response to fast movement */
	beta: number;
	/** Derivative cutoff frequency (Hz) - smooths velocity estimate */
	dcutoff?: number;
}

/**
 * OneEuroSmoother - 1€ Filter Implementation
 *
 * WIRED: Wraps OneEuroAdapter with config-based construction
 */
export class OneEuroSmoother extends OneEuroAdapter {
	constructor(config: OneEuroConfig) {
		super(config.mincutoff, config.beta, config.dcutoff ?? 1.0);
	}
}

// Re-export for consumers
export { OneEuroAdapter, PassthroughSmootherAdapter };
