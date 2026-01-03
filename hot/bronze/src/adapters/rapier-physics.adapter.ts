/**
 * Rapier Physics REAL Adapter
 *
 * Gen87.X3 | Port 2 (SHAPE) | Implements SmootherPort
 *
 * REAL WASM: Uses @dimforge/rapier2d-compat - actual physics, not theater
 *
 * Wraps RapierPhysicsPrimitive (cold/silver) to implement SmootherPort.
 */
import {
	type RapierPhysicsConfig as RapierConfig,
	RapierPhysicsPrimitive,
} from '../../../../cold/silver/primitives/rapier-physics.js';
import type { SmootherPort } from '../contracts/ports.js';
import type { SensorFrame, SmoothedFrame } from '../contracts/schemas.js';

export type { RapierConfig };

// ============================================================================
// RAPIER PHYSICS ADAPTER
// ============================================================================

/**
 * RapierPhysicsAdapter - REAL WASM physics for cursor smoothing
 *
 * Uses spring-damper model where:
 * - Target position = raw input (index tip)
 * - Current position = cursor position (rigid body)
 * - Spring force pulls cursor toward target
 * - Damping prevents oscillation
 *
 * ADAPTIVE MODE (1€ Physics):
 * - Dynamically adjusts stiffness based on cursor velocity
 * - Low velocity → Lower stiffness (jitter reduction)
 * - High velocity → Higher stiffness (lag reduction)
 * - Formula: effectiveStiffness = minStiffness + speedCoefficient * |velocity|
 */
export class RapierPhysicsAdapter implements SmootherPort {
	private primitive: RapierPhysicsPrimitive;
	private lastTimestamp: number | null = null;

	constructor(config: Partial<RapierConfig> = {}) {
		this.primitive = new RapierPhysicsPrimitive(config);
	}

	/**
	 * Initialize Rapier WASM - MUST be called before use
	 */
	async init(): Promise<void> {
		await this.primitive.init();
	}

	/**
	 * Smooth a sensor frame using Rapier physics
	 */
	smooth(frame: SensorFrame): SmoothedFrame {
		// Calculate dt (clamped to prevent physics explosion)
		const rawDt = this.lastTimestamp !== null ? (frame.ts - this.lastTimestamp) / 1000 : 1 / 60;
		const dt = Math.min(rawDt, 0.1); // Cap at 100ms to prevent huge forces
		this.lastTimestamp = frame.ts;

		const target = frame.indexTip
			? { x: frame.indexTip.x, y: frame.indexTip.y }
			: { x: 0.5, y: 0.5 };

		const result = this.primitive.update(target, dt);

		return {
			ts: frame.ts,
			handId: frame.handId,
			// Maintain legacy behavior where position is predicted if mode is predictive
			position: result.prediction || result.position,
			velocity: result.velocity,
			prediction: result.prediction,
			trackingOk: frame.trackingOk,
			label: frame.label ?? 'None',
			confidence: frame.confidence ?? 0,
			palmFacing: frame.palmFacing ?? false,
		};
	}

	/**
	 * Reset the physics state
	 */
	reset(): void {
		this.primitive.reset();
		this.lastTimestamp = null;
	}

	/**
	 * Update configuration (SmootherPort interface compatibility)
	 * @param mincutoff - Maps to stiffness (higher = less smoothing)
	 * @param beta - Maps to damping (higher = more damping)
	 */
	setParams(mincutoff: number, beta: number): void {
		const currentConfig = this.primitive.getConfig();

		if (currentConfig.mode === 'adaptive') {
			// In adaptive mode, map to 1€-physics params
			this.primitive.setConfig({
				minStiffness: mincutoff * 50, // Scale for minStiffness
				speedCoefficient: beta * 1000, // Scale for velocity sensitivity
			});
		} else {
			// In smoothed/predictive mode, map to fixed stiffness/damping
			this.primitive.setConfig({
				stiffness: mincutoff * 100,
				damping: 0.5 + beta * 0.45,
			});
		}
	}

	/**
	 * Get current physics state for debugging
	 */
	getState(): {
		position: { x: number; y: number };
		velocity: { x: number; y: number };
		effectiveStiffness: number;
		mode: RapierConfig['mode'];
	} {
		const config = this.primitive.getConfig();
		// Get current state via a zero-dt update
		const res = this.primitive.update({ x: 0.5, y: 0.5 }, 0);
		return {
			position: res.position,
			velocity: res.velocity,
			effectiveStiffness: res.effectiveStiffness || 0,
			mode: config.mode,
		};
	}

	/**
	 * Get current configuration (for testing)
	 */
	getConfig(): Readonly<Required<RapierConfig>> {
		return this.primitive.getConfig();
	}

	/**
	 * Calculate Time-to-Impact (TTI) to a target point
	 */
	calculateTTI(targetX: number, targetY: number): number {
		const state = this.getState();
		const pos = state.position;
		const vel = state.velocity;

		const dx = targetX - pos.x;
		const dy = targetY - pos.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < 0.001) return 0;

		const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2);
		if (speed < 0.001) return Number.POSITIVE_INFINITY;

		const dot = dx * vel.x + dy * vel.y;
		if (dot <= 0) return Number.POSITIVE_INFINITY;

		const velocityTowardTarget = dot / distance;
		return (distance / velocityTowardTarget) * 1000;
	}

	/**
	 * Get predicted trajectory points for visualization
	 */
	getPredictedTrajectory(
		durationMs: number,
		steps: number,
	): Array<{ x: number; y: number; t: number }> {
		const trajectory: Array<{ x: number; y: number; t: number }> = [];
		const state = this.getState();
		const pos = state.position;
		const vel = state.velocity;

		for (let i = 0; i <= steps; i++) {
			const t = (i / steps) * durationMs;
			const τ = t / 1000;

			let x = pos.x + vel.x * τ;
			let y = pos.y + vel.y * τ;

			x = Math.max(0, Math.min(1, x));
			y = Math.max(0, Math.min(1, y));

			trajectory.push({ x, y, t });
		}

		return trajectory;
	}
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export async function createSmoothedRapierAdapter(
	config: Partial<Omit<RapierConfig, 'mode'>> = {},
): Promise<RapierPhysicsAdapter> {
	const adapter = new RapierPhysicsAdapter({ ...config, mode: 'smoothed' });
	await adapter.init();
	return adapter;
}

export async function createPredictiveRapierAdapter(
	config: Partial<Omit<RapierConfig, 'mode'>> = {},
): Promise<RapierPhysicsAdapter> {
	const adapter = new RapierPhysicsAdapter({ ...config, mode: 'predictive' });
	await adapter.init();
	return adapter;
}

export async function createAdaptiveRapierAdapter(
	config: Partial<Omit<RapierConfig, 'mode'>> = {},
): Promise<RapierPhysicsAdapter> {
	const adapter = new RapierPhysicsAdapter({ ...config, mode: 'adaptive' });
	await adapter.init();
	return adapter;
}
