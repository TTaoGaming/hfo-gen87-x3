/**
 * Physics Spring-Damper Smoother - IMPLEMENTED (TDD GREEN Phase)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * Reference: Rapier Physics Engine - Spring-Damper Model
 * https://rapier.rs/docs/user_guides/javascript/rigid_body_simulation
 *
 * Uses a critically damped spring system to create smooth cursor movement:
 * - Spring constant (k): Stiffness - higher = snappier
 * - Damping coefficient (c): Energy dissipation - higher = less oscillation
 * - Mass (m): Inertia - higher = more sluggish
 *
 * For critical damping: c = 2 * sqrt(k * m)
 *
 * TRL 9: Industry-standard physics model used in games, UI, robotics
 */
// @ts-nocheck


import type { SmoothedFrame, SmootherPort } from '../contracts/ports.js';
import type { SensorFrame } from '../contracts/schemas.js';
import { SmoothedFrameSchema } from '../contracts/schemas.js';

export interface SpringDamperConfig {
	/** Spring constant (stiffness) - higher = snappier */
	stiffness: number;
	/** Damping coefficient - higher = less oscillation */
	damping: number;
	/** Mass - higher = more sluggish */
	mass: number;
}

/**
 * PhysicsSpringDamperSmoother - Spring-Damper Physics
 *
 * Simulates a critically damped spring pulling cursor toward target.
 * Natural feel with momentum and deceleration.
 */
export class PhysicsSpringDamperSmoother implements SmootherPort {
	private stiffness: number;
	private damping: number;
	private mass: number;
	private posX = 0;
	private posY = 0;
	private velX = 0;
	private velY = 0;
	private lastTs: number | null = null;
	private initialized = false;

	constructor(config: SpringDamperConfig) {
		this.stiffness = config.stiffness;
		this.damping = config.damping;
		this.mass = config.mass;
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

		const targetX = frame.indexTip.x;
		const targetY = frame.indexTip.y;

		// Initialize on first frame
		if (!this.initialized) {
			this.posX = targetX;
			this.posY = targetY;
			this.velX = 0;
			this.velY = 0;
			this.lastTs = frame.ts;
			this.initialized = true;
		}

		// Calculate time delta
		let dt = this.lastTs !== null ? (frame.ts - this.lastTs) / 1000 : 1 / 60;
		if (dt <= 0) dt = 1 / 60;
		this.lastTs = frame.ts;

		// Spring-damper physics: F = -k*x - c*v
		// a = F/m
		// v += a * dt
		// x += v * dt

		// X axis
		const forceX = -this.stiffness * (this.posX - targetX) - this.damping * this.velX;
		const accelX = forceX / this.mass;
		this.velX += accelX * dt;
		this.posX += this.velX * dt;

		// Y axis
		const forceY = -this.stiffness * (this.posY - targetY) - this.damping * this.velY;
		const accelY = forceY / this.mass;
		this.velY += accelY * dt;
		this.posY += this.velY * dt;

		// Clamp to [0,1] range
		this.posX = Math.max(0, Math.min(1, this.posX));
		this.posY = Math.max(0, Math.min(1, this.posY));

		// Predict one frame ahead
		const predX = Math.max(0, Math.min(1, this.posX + this.velX * (1 / 60)));
		const predY = Math.max(0, Math.min(1, this.posY + this.velY * (1 / 60)));

		return SmoothedFrameSchema.parse({
			ts: frame.ts,
			handId: frame.handId,
			trackingOk: true,
			palmFacing: frame.palmFacing,
			label: frame.label,
			confidence: frame.confidence,
			position: { x: this.posX, y: this.posY },
			velocity: { x: this.velX, y: this.velY },
			prediction: { x: predX, y: predY },
		});
	}

	reset(): void {
		this.posX = 0;
		this.posY = 0;
		this.velX = 0;
		this.velY = 0;
		this.lastTs = null;
		this.initialized = false;
	}

	setParams(params: Partial<SpringDamperConfig>): void {
		if (params.stiffness !== undefined) this.stiffness = params.stiffness;
		if (params.damping !== undefined) this.damping = params.damping;
		if (params.mass !== undefined) this.mass = params.mass;
	}
}
