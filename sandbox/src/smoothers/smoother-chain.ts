/**
 * Smoother Chain - Composable Pipeline - STUB (TDD RED Phase)
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | TDD RED
 *
 * Implements the Chain of Responsibility pattern for smoothers.
 * Allows composing multiple smoothers in sequence:
 *
 * Raw → 1€ Filter → Spring-Damper → Predictive → Output
 *
 * Each smoother in the chain processes the output of the previous one,
 * enabling flexible pipeline configurations.
 *
 * HEXAGONAL CDD: SmootherChain itself implements SmootherPort,
 * making the composition transparent to consumers.
 *
 * TRL 9: Chain of Responsibility is a Gang of Four design pattern
 */

import type { SmoothedFrame, SmootherPort } from '../contracts/ports.js';
import type { SensorFrame } from '../contracts/schemas.js';

/**
 * SmootherChain - Composable Smoother Pipeline
 *
 * STUB: Throws "not implemented" - will be implemented in GREEN phase
 */
export class SmootherChain implements SmootherPort {
	constructor(_smoothers: SmootherPort[]) {
		throw new Error('SmootherChain not implemented');
	}

	smooth(_frame: SensorFrame): SmoothedFrame {
		throw new Error('SmootherChain.smooth not implemented');
	}

	reset(): void {
		throw new Error('SmootherChain.reset not implemented');
	}

	setParams(_params: Record<string, unknown>): void {
		throw new Error('SmootherChain.setParams not implemented');
	}

	/** Add a smoother to the chain */
	addSmoother(_smoother: SmootherPort): void {
		throw new Error('SmootherChain.addSmoother not implemented');
	}

	/** Remove a smoother from the chain by index */
	removeSmoother(_index: number): void {
		throw new Error('SmootherChain.removeSmoother not implemented');
	}

	/** Replace a smoother at a specific index */
	replaceSmoother(_index: number, _smoother: SmootherPort): void {
		throw new Error('SmootherChain.replaceSmoother not implemented');
	}

	/** Get the current chain configuration */
	getChain(): SmootherPort[] {
		throw new Error('SmootherChain.getChain not implemented');
	}
}
