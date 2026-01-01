/**
 * Rapier Physics REAL Adapter
 *
 * Gen87.X3 | Port 2 (SHAPE) | Implements SmootherPort
 *
 * REAL WASM: Uses @dimforge/rapier2d-compat - actual physics, not theater
 *
 * Two modes:
 * 1. SMOOTHED: Spring-damper physics for smooth cursor movement
 * 2. PREDICTIVE: Simulate future trajectory for latency compensation
 *
 * @source https://rapier.rs/docs/user_guides/javascript/getting_started_js
 * @see https://dimforge.com/
 */
import RAPIER from '@dimforge/rapier2d-compat';
import type { SmootherPort } from '../contracts/ports.js';
import type { SensorFrame, SmoothedFrame } from '../contracts/schemas.js';

// ============================================================================
// TYPES
// ============================================================================

export interface RapierConfig {
	/** Mode: 'smoothed' for spring-damper, 'predictive' for trajectory lookahead */
	mode: 'smoothed' | 'predictive';
	/** Spring stiffness (higher = snappier response) */
	stiffness?: number;
	/** Damping ratio (0.7 = underdamped, 1.0 = critical, >1 = overdamped) */
	damping?: number;
	/** Prediction lookahead in ms (only for predictive mode) */
	predictionMs?: number;
	/** Physics substeps per frame (more = smoother but slower) */
	substeps?: number;
}

const DEFAULT_CONFIG: Required<RapierConfig> = {
	mode: 'smoothed',
	stiffness: 400, // High for responsive tracking
	damping: 0.85, // Slightly underdamped for natural feel
	predictionMs: 50, // 3 frames at 60fps
	substeps: 2,
};

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
 */
export class RapierPhysicsAdapter implements SmootherPort {
	private config: Required<RapierConfig>;
	private initialized = false;
	private world: RAPIER.World | null = null;
	private cursorBody: RAPIER.RigidBody | null = null;
	private targetPosition: { x: number; y: number } = { x: 0.5, y: 0.5 };
	private lastTimestamp: number | null = null;
	private velocity: { x: number; y: number } = { x: 0, y: 0 };

	constructor(config: Partial<RapierConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Initialize Rapier WASM - MUST be called before use
	 */
	async init(): Promise<void> {
		if (this.initialized) return;

		// Initialize Rapier WASM module
		await RAPIER.init();

		// Create physics world with no gravity (2D cursor space)
		this.world = new RAPIER.World({ x: 0.0, y: 0.0 });

		// Create kinematic cursor body (we control position, physics provides smoothing)
		const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
			.setTranslation(0.5, 0.5)
			.setLinearDamping(this.config.damping * 10); // Rapier uses different damping scale

		this.cursorBody = this.world.createRigidBody(bodyDesc);

		// Small collider for the cursor point
		const colliderDesc = RAPIER.ColliderDesc.ball(0.01);
		this.world.createCollider(colliderDesc, this.cursorBody);

		this.initialized = true;
	}

	/**
	 * Smooth a sensor frame using Rapier physics
	 */
	smooth(frame: SensorFrame): SmoothedFrame {
		if (!this.initialized || !this.world || !this.cursorBody) {
			// Return passthrough if not initialized
			return this.createPassthroughFrame(frame);
		}

		// Update target position from input
		if (frame.indexTip) {
			this.targetPosition = { x: frame.indexTip.x, y: frame.indexTip.y };
		}

		// Calculate dt
		const dt = this.lastTimestamp !== null ? (frame.ts - this.lastTimestamp) / 1000 : 1 / 60;
		this.lastTimestamp = frame.ts;

		// Get current cursor position
		const currentPos = this.cursorBody.translation();

		// Apply spring force toward target
		const dx = this.targetPosition.x - currentPos.x;
		const dy = this.targetPosition.y - currentPos.y;

		// Spring force: F = -k * displacement
		const forceX = dx * this.config.stiffness;
		const forceY = dy * this.config.stiffness;

		// Apply force to rigid body
		this.cursorBody.applyImpulse({ x: forceX * dt, y: forceY * dt }, true);

		// Step physics simulation
		for (let i = 0; i < this.config.substeps; i++) {
			this.world.step();
		}

		// Get smoothed position
		const smoothedPos = this.cursorBody.translation();
		const smoothedVel = this.cursorBody.linvel();

		// Store velocity for output
		this.velocity = { x: smoothedVel.x, y: smoothedVel.y };

		// For predictive mode, simulate future position
		let outputPosition = { x: smoothedPos.x, y: smoothedPos.y };
		if (this.config.mode === 'predictive') {
			const predictionSec = this.config.predictionMs / 1000;
			outputPosition = {
				x: smoothedPos.x + smoothedVel.x * predictionSec,
				y: smoothedPos.y + smoothedVel.y * predictionSec,
			};
		}

		return {
			ts: frame.ts,
			handId: frame.handId,
			position: outputPosition,
			velocity: this.velocity,
			prediction: this.config.mode === 'predictive' ? outputPosition : null,
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
		if (this.cursorBody) {
			this.cursorBody.setTranslation({ x: 0.5, y: 0.5 }, true);
			this.cursorBody.setLinvel({ x: 0, y: 0 }, true);
		}
		this.lastTimestamp = null;
		this.velocity = { x: 0, y: 0 };
	}

	/**
	 * Update configuration (SmootherPort interface compatibility)
	 * @param mincutoff - Maps to stiffness (higher = less smoothing)
	 * @param beta - Maps to damping (higher = more damping)
	 */
	setParams(mincutoff: number, beta: number): void {
		// Map 1€ filter params to physics params
		// mincutoff (1-10) → stiffness (100-1000)
		// beta (0-1) → damping (0.5-0.95)
		this.config = {
			...this.config,
			stiffness: mincutoff * 100,
			damping: 0.5 + beta * 0.45,
		};
		if (this.cursorBody) {
			this.cursorBody.setLinearDamping(this.config.damping * 10);
		}
	}

	/**
	 * Get current physics state for debugging
	 */
	getState(): { position: { x: number; y: number }; velocity: { x: number; y: number } } {
		if (!this.cursorBody) {
			return { position: { x: 0.5, y: 0.5 }, velocity: { x: 0, y: 0 } };
		}
		const pos = this.cursorBody.translation();
		const vel = this.cursorBody.linvel();
		return { position: { x: pos.x, y: pos.y }, velocity: { x: vel.x, y: vel.y } };
	}

	private createPassthroughFrame(frame: SensorFrame): SmoothedFrame {
		return {
			ts: frame.ts,
			handId: frame.handId,
			position: frame.indexTip ?? { x: 0.5, y: 0.5 },
			velocity: { x: 0, y: 0 },
			prediction: null,
			trackingOk: frame.trackingOk,
			label: frame.label ?? 'None',
			confidence: frame.confidence ?? 0,
			palmFacing: frame.palmFacing ?? false,
		};
	}
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a smoothed Rapier adapter (spring-damper, no prediction)
 */
export async function createSmoothedRapierAdapter(
	config: Partial<Omit<RapierConfig, 'mode'>> = {},
): Promise<RapierPhysicsAdapter> {
	const adapter = new RapierPhysicsAdapter({ ...config, mode: 'smoothed' });
	await adapter.init();
	return adapter;
}

/**
 * Create a predictive Rapier adapter (spring-damper + trajectory lookahead)
 */
export async function createPredictiveRapierAdapter(
	config: Partial<Omit<RapierConfig, 'mode'>> = {},
): Promise<RapierPhysicsAdapter> {
	const adapter = new RapierPhysicsAdapter({ ...config, mode: 'predictive' });
	await adapter.init();
	return adapter;
}
