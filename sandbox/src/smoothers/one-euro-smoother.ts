/**
 * 1€ Filter Smoother - STUB (TDD RED Phase)
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | TDD RED
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
 */

import type { SmoothedFrame, SmootherPort } from '../contracts/ports.js';
import type { SensorFrame } from '../contracts/schemas.js';

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
 * STUB: Throws "not implemented" - will be implemented in GREEN phase
 */
export class OneEuroSmoother implements SmootherPort {
	constructor(_config: OneEuroConfig) {
		throw new Error('OneEuroSmoother not implemented');
	}

	smooth(_frame: SensorFrame): SmoothedFrame {
		throw new Error('OneEuroSmoother.smooth not implemented');
	}

	reset(): void {
		throw new Error('OneEuroSmoother.reset not implemented');
	}

	setParams(_params: Partial<OneEuroConfig>): void {
		throw new Error('OneEuroSmoother.setParams not implemented');
	}
}
