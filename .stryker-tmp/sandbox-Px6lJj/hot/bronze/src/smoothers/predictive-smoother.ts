/**
 * Predictive Smoother - IMPLEMENTED (TDD GREEN Phase)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * Reference: Dead Reckoning / Motion Prediction
 * Used in gaming for lag compensation and in touch interfaces for
 * reducing perceived latency.
 *
 * Predicts future position based on:
 * - Current position
 * - Current velocity
 * - Optional: acceleration (jerk-aware prediction)
 *
 * Formula: predicted = position + velocity * lookAhead + 0.5 * acceleration * lookAhead²
 *
 * TRL 9: Standard technique in game networking, touch interfaces, robotics
 */
// @ts-nocheck


import type { SmoothedFrame, SmootherPort } from '../contracts/ports.js';
import type { SensorFrame } from '../contracts/schemas.js';
import { SmoothedFrameSchema } from '../contracts/schemas.js';

export interface PredictiveConfig {
	/** How far ahead to predict (ms) */
	predictionMs: number;
	/** Whether to use physics-based prediction */
	usePhysics: boolean;
	/** Velocity smoothing factor (0-1) - optional */
	velocitySmoothing?: number;
}

/**
 * PredictiveSmoother - Motion Prediction
 *
 * Predicts future position using velocity (and optionally acceleration).
 * Reduces perceived latency by rendering where the cursor WILL be.
 */
export class PredictiveSmoother implements SmootherPort {
	private config: PredictiveConfig;
	private lastX: number | null = null;
	private lastY: number | null = null;
	private lastTs: number | null = null;
	private velX = 0;
	private velY = 0;
	private lastVelX = 0;
	private lastVelY = 0;
	private accelX = 0;
	private accelY = 0;

	constructor(config: PredictiveConfig) {
		this.config = config;
	}

	smooth(frame: SensorFrame): SmoothedFrame {
		// If no valid tracking, pass through with null position
		if (!frame.trackingOk || !frame.indexTip) {
			this.reset();
			return SmoothedFrameSchema.parse({
				ts: frame.ts,
				handId: frame.handId,
				trackingOk: false,
				palmFacing: frame.palmFacing,
				label: frame.label,
				confidence: frame.confidence,
				position: null,
				velocity: null,
				prediction: null,
			});
		}

		// Clamp position to [0,1] for schema validation
		const x = Math.max(0, Math.min(1, frame.indexTip.x));
		const y = Math.max(0, Math.min(1, frame.indexTip.y));

		// Calculate velocity
		if (this.lastX !== null && this.lastY !== null && this.lastTs !== null) {
			let dt = (frame.ts - this.lastTs) / 1000;
			if (dt <= 0) dt = 1 / 60;

			// Raw velocity
			const rawVelX = (x - this.lastX) / dt;
			const rawVelY = (y - this.lastY) / dt;

			// Smooth velocity with exponential moving average
			const alpha = this.config.velocitySmoothing ?? 0.5;
			this.velX = alpha * rawVelX + (1 - alpha) * this.velX;
			this.velY = alpha * rawVelY + (1 - alpha) * this.velY;

			// Calculate acceleration if enabled
			if (this.config.useAcceleration) {
				const rawAccelX = (this.velX - this.lastVelX) / dt;
				const rawAccelY = (this.velY - this.lastVelY) / dt;
				this.accelX = alpha * rawAccelX + (1 - alpha) * this.accelX;
				this.accelY = alpha * rawAccelY + (1 - alpha) * this.accelY;
			}

			this.lastVelX = this.velX;
			this.lastVelY = this.velY;
		}

		// Store current values for next frame
		this.lastX = x;
		this.lastY = y;
		this.lastTs = frame.ts;

		// Calculate prediction
		const lookAhead = this.config.predictionMs / 1000;
		let predX = x + this.velX * lookAhead;
		let predY = y + this.velY * lookAhead;

		// Add acceleration term if physics enabled
		if (this.config.usePhysics) {
			predX += 0.5 * this.accelX * lookAhead * lookAhead;
			predY += 0.5 * this.accelY * lookAhead * lookAhead;
		}

		// Clamp prediction to [0,1]
		predX = Math.max(0, Math.min(1, predX));
		predY = Math.max(0, Math.min(1, predY));

		return SmoothedFrameSchema.parse({
			ts: frame.ts,
			handId: frame.handId,
			trackingOk: true,
			palmFacing: frame.palmFacing,
			label: frame.label,
			confidence: frame.confidence,
			position: { x, y },
			velocity: { x: this.velX, y: this.velY },
			prediction: { x: predX, y: predY },
		});
	}

	reset(): void {
		this.lastX = null;
		this.lastY = null;
		this.lastTs = null;
		this.velX = 0;
		this.velY = 0;
		this.lastVelX = 0;
		this.lastVelY = 0;
		this.accelX = 0;
		this.accelY = 0;
	}

	setParams(params: Partial<PredictiveConfig>): void {
		if (params.predictionMs !== undefined) this.config.predictionMs = params.predictionMs;
		if (params.velocitySmoothing !== undefined)
			this.config.velocitySmoothing = params.velocitySmoothing;
		if (params.usePhysics !== undefined) this.config.usePhysics = params.usePhysics;
	}
}
