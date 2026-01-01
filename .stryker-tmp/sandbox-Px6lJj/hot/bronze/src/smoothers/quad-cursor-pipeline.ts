/**
 * Quad Cursor Pipeline - 4-Stage Output - IMPLEMENTED (TDD GREEN Phase)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * Outputs 4 cursor positions simultaneously per frame:
 *
 * 1. Raw: Unprocessed MediaPipe fingertip position
 * 2. Euro: 1€ Filter output (snappy/smooth adaptive)
 * 3. Spring: Spring-damper smoothed (natural inertia)
 * 4. Predictive: Motion-predicted position (reduced latency)
 *
 * This allows:
 * - Visual comparison of different smoothing strategies
 * - Runtime selection of preferred cursor
 * - A/B testing for user preference studies
 * - Debugging pipeline behavior
 *
 * Each stage can be independently enabled/disabled via null.
 */
// @ts-nocheck


import { PassthroughSmootherAdapter } from '../adapters/one-euro.adapter.js';
import type { SmootherPort } from '../contracts/ports.js';
import type { SensorFrame } from '../contracts/schemas.js';

export interface QuadCursorOutput {
	/** Raw MediaPipe position (no smoothing) */
	raw: { x: number; y: number } | null;
	/** 1€ Filter smoothed position */
	euro: { x: number; y: number } | null;
	/** Spring-damper physics position */
	spring: { x: number; y: number } | null;
	/** Motion-predicted position */
	predictive: { x: number; y: number } | null;
	/** Timestamp of this quad output */
	ts: number;
}

export interface QuadCursorConfig {
	/** 1€ smoother (null to disable) */
	euro: SmootherPort | null;
	/** Spring-damper smoother (null to disable) */
	spring: SmootherPort | null;
	/** Predictive smoother (null to disable) */
	predictive: SmootherPort | null;
}

/**
 * QuadCursorPipeline - 4-Stage Cursor Output
 *
 * Runs frame through all 4 smoothers simultaneously.
 */
export class QuadCursorPipeline {
	private passthrough: PassthroughSmootherAdapter;
	private euro: SmootherPort | null;
	private spring: SmootherPort | null;
	private predictive: SmootherPort | null;

	constructor(config: QuadCursorConfig) {
		this.passthrough = new PassthroughSmootherAdapter();
		this.euro = config.euro;
		this.spring = config.spring;
		this.predictive = config.predictive;
	}

	/** Process a frame and return all 4 cursor positions */
	process(frame: SensorFrame): QuadCursorOutput {
		// Raw is always available via passthrough
		const rawFrame = this.passthrough.smooth(frame);
		const raw = rawFrame.position ? { x: rawFrame.position.x, y: rawFrame.position.y } : null;

		// Euro (1€ filter)
		let euro: { x: number; y: number } | null = null;
		if (this.euro) {
			const euroFrame = this.euro.smooth(frame);
			euro = euroFrame.position ? { x: euroFrame.position.x, y: euroFrame.position.y } : null;
		}

		// Spring-damper
		let spring: { x: number; y: number } | null = null;
		if (this.spring) {
			const springFrame = this.spring.smooth(frame);
			spring = springFrame.position
				? { x: springFrame.position.x, y: springFrame.position.y }
				: null;
		}

		// Predictive
		let predictive: { x: number; y: number } | null = null;
		if (this.predictive) {
			const predFrame = this.predictive.smooth(frame);
			predictive = predFrame.prediction
				? { x: predFrame.prediction.x, y: predFrame.prediction.y }
				: null;
		}

		return {
			raw,
			euro,
			spring,
			predictive,
			ts: frame.ts,
		};
	}

	/** Reset all smoothers */
	reset(): void {
		this.passthrough.reset();
		this.euro?.reset();
		this.spring?.reset();
		this.predictive?.reset();
	}
}
