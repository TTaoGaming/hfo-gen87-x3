/**
 * Quad Cursor Pipeline - 4-Stage Output - STUB (TDD RED Phase)
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | TDD RED
 *
 * Outputs 4 cursor positions simultaneously per frame:
 *
 * 1. Raw: Unprocessed MediaPipe fingertip position
 * 2. Smooth: 1€ Filter output (snappy/smooth adaptive)
 * 3. Physics: Spring-damper smoothed (natural inertia)
 * 4. Predictive: Motion-predicted position (reduced latency)
 *
 * This allows:
 * - Visual comparison of different smoothing strategies
 * - Runtime selection of preferred cursor
 * - A/B testing for user preference studies
 * - Debugging pipeline behavior
 *
 * Each stage can be independently enabled/disabled.
 */

import type { SmoothedFrame, SmootherPort } from '../contracts/ports.js';
import type { SensorFrame } from '../contracts/schemas.js';

export interface QuadCursorOutput {
	/** Raw MediaPipe position (no smoothing) */
	raw: SmoothedFrame;
	/** 1€ Filter smoothed position */
	smooth: SmoothedFrame;
	/** Spring-damper physics position */
	physics: SmoothedFrame;
	/** Motion-predicted position */
	predictive: SmoothedFrame;
	/** Timestamp of this quad output */
	ts: number;
}

export interface QuadCursorConfig {
	/** Enable raw output */
	enableRaw: boolean;
	/** Enable 1€ smooth output */
	enableSmooth: boolean;
	/** Enable physics output */
	enablePhysics: boolean;
	/** Enable predictive output */
	enablePredictive: boolean;
}

/**
 * QuadCursorPipeline - 4-Stage Cursor Output
 *
 * STUB: Throws "not implemented" - will be implemented in GREEN phase
 */
export class QuadCursorPipeline {
	constructor(
		_smoothers: {
			oneEuro: SmootherPort;
			physics: SmootherPort;
			predictive: SmootherPort;
		},
		_config?: Partial<QuadCursorConfig>,
	) {
		throw new Error('QuadCursorPipeline not implemented');
	}

	/** Process a frame and return all 4 cursor positions */
	process(_frame: SensorFrame): QuadCursorOutput {
		throw new Error('QuadCursorPipeline.process not implemented');
	}

	/** Reset all smoothers */
	reset(): void {
		throw new Error('QuadCursorPipeline.reset not implemented');
	}

	/** Update configuration */
	setConfig(_config: Partial<QuadCursorConfig>): void {
		throw new Error('QuadCursorPipeline.setConfig not implemented');
	}

	/** Get current configuration */
	getConfig(): QuadCursorConfig {
		throw new Error('QuadCursorPipeline.getConfig not implemented');
	}
}
