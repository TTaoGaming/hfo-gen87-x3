/**
 * Smoother Chain - Composable Pipeline - IMPLEMENTED (TDD GREEN Phase)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
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
import { SmoothedFrameSchema } from '../contracts/schemas.js';

/**
 * SmootherChain - Composable Smoother Pipeline
 *
 * Chain of smoothers that process frames in sequence.
 */
export class SmootherChain implements SmootherPort {
	private smoothers: SmootherPort[];

	constructor(smoothers: SmootherPort[]) {
		this.smoothers = [...smoothers];
	}

	smooth(frame: SensorFrame): SmoothedFrame {
		if (this.smoothers.length === 0) {
			// Empty chain - return pass-through
			return SmoothedFrameSchema.parse({
				ts: frame.ts,
				handId: frame.handId,
				trackingOk: frame.trackingOk,
				palmFacing: frame.palmFacing,
				label: frame.label,
				confidence: frame.confidence,
				position: frame.indexTip ? { x: frame.indexTip.x, y: frame.indexTip.y } : null,
				velocity: null,
				prediction: null,
			});
		}

		// Run first smoother with sensor frame
		let result = this.smoothers[0].smooth(frame);

		// Chain through remaining smoothers
		// Each smoother receives the previous output converted to SensorFrame
		for (let i = 1; i < this.smoothers.length; i++) {
			// Convert SmoothedFrame back to SensorFrame for chaining
			const chainFrame: SensorFrame = {
				ts: result.ts,
				handId: result.handId,
				trackingOk: result.trackingOk,
				palmFacing: result.palmFacing,
				label: result.label,
				confidence: result.confidence,
				indexTip: result.position
					? { x: result.position.x, y: result.position.y, z: 0, visibility: 1 }
					: undefined,
			};

			result = this.smoothers[i].smooth(chainFrame);
		}

		return result;
	}

	reset(): void {
		for (const smoother of this.smoothers) {
			smoother.reset();
		}
	}

	setParams(_params: Record<string, unknown>): void {
		// Chain doesn't have its own params - this is a no-op
		// Individual smoothers can be accessed via getSmoothers()
	}

	/** Add a smoother to the end of the chain */
	addSmoother(smoother: SmootherPort): void {
		this.smoothers.push(smoother);
	}

	/** Remove a smoother from the chain by index */
	removeSmoother(index: number): void {
		if (index >= 0 && index < this.smoothers.length) {
			this.smoothers.splice(index, 1);
		}
	}

	/** Replace a smoother at a specific index */
	replaceSmoother(index: number, smoother: SmootherPort): void {
		if (index >= 0 && index < this.smoothers.length) {
			this.smoothers[index] = smoother;
		}
	}

	/** Get the current chain length */
	getLength(): number {
		return this.smoothers.length;
	}

	/** Get all smoothers in the chain */
	getSmoothers(): SmootherPort[] {
		return [...this.smoothers];
	}

	/** Replace all smoothers in the chain (runtime swap) */
	setSmoothers(smoothers: SmootherPort[]): void {
		this.smoothers = [...smoothers];
	}
}
