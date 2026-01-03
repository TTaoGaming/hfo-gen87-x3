/**
 * Rapier Physics - PURE PRIMITIVE
 *
 * Gen87.X3 | cold/silver/primitives | MUTATION TESTABLE
 *
 * REAL WASM: Uses @dimforge/rapier2d-compat
 *
 * This is the PURE PRIMITIVE extracted from the adapter for:
 * 1. Isolation testing
 * 2. Mutation testing with Stryker
 * 3. Reuse across different adapter implementations
 */
import RAPIER from '@dimforge/rapier2d-compat';

export interface RapierPhysicsConfig {
	/** Mode: 'smoothed' for spring-damper, 'predictive' for trajectory, 'adaptive' for 1€-physics */
	mode: 'smoothed' | 'predictive' | 'adaptive';
	/** Spring stiffness (higher = snappier response) - used in smoothed/predictive modes */
	stiffness?: number;
	/** Damping ratio (0.7 = underdamped, 1.0 = critical, >1 = overdamped) */
	damping?: number;
	/** Prediction lookahead in ms (only for predictive mode) */
	predictionMs?: number;
	/** Physics substeps per frame (more = smoother but slower) */
	substeps?: number;
	/** Velocity threshold below which cursor stays still (jitter elimination) */
	velocityDeadZone?: number;
	/** Minimum stiffness at rest (adaptive mode only) */
	minStiffness?: number;
	/** Speed coefficient (adaptive mode only) */
	speedCoefficient?: number;
	/** Maximum stiffness cap for stability (adaptive mode only) */
	maxStiffness?: number;
}

export const DEFAULT_RAPIER_CONFIG: Required<RapierPhysicsConfig> = {
	mode: 'smoothed',
	stiffness: 200,
	damping: 1.2,
	predictionMs: 50,
	substeps: 4,
	velocityDeadZone: 0.1,
	minStiffness: 50,
	speedCoefficient: 300,
	maxStiffness: 400,
};

/**
 * Pure Rapier Physics Engine for 2D cursor smoothing and prediction
 */
export class RapierPhysicsPrimitive {
	private config: Required<RapierPhysicsConfig>;
	private world: RAPIER.World | null = null;
	private cursorBody: RAPIER.RigidBody | null = null;
	private targetPosition: { x: number; y: number } = { x: 0.5, y: 0.5 };
	private velocity: { x: number; y: number } = { x: 0, y: 0 };
	private initialized = false;

	constructor(config: Partial<RapierPhysicsConfig> = {}) {
		this.config = { ...DEFAULT_RAPIER_CONFIG, ...config };
	}

	/**
	 * Initialize the physics world.
	 * Note: RAPIER.init() must be called externally before this if in a browser environment
	 * that requires async WASM loading.
	 */
	public async init(): Promise<void> {
		if (this.initialized) return;

		// Ensure RAPIER is initialized (idempotent)
		await RAPIER.init();

		this.world = new RAPIER.World({ x: 0.0, y: 0.0 });
		// Set timestep to match common 60fps, but we'll adjust it in update if needed
		this.world.timestep = 1 / 60;

		const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
			.setTranslation(0.5, 0.5)
			.setLinearDamping(this.config.damping * 10);

		this.cursorBody = this.world.createRigidBody(bodyDesc);

		const colliderDesc = RAPIER.ColliderDesc.ball(0.01);
		this.world.createCollider(colliderDesc, this.cursorBody);

		this.initialized = true;
	}

	/**
	 * Step the simulation toward a target position
	 */
	public update(target: { x: number; y: number }, dt: number): {
		position: { x: number; y: number };
		velocity: { x: number; y: number };
		prediction: { x: number; y: number } | null;
		effectiveStiffness: number;
	} {
		if (!this.initialized || !this.world || !this.cursorBody) {
			return {
				position: target,
				velocity: { x: 0, y: 0 },
				prediction: null,
				effectiveStiffness: 0,
			};
		}

		this.targetPosition = target;
		const currentPos = this.cursorBody.translation();

		const dx = this.targetPosition.x - currentPos.x;
		const dy = this.targetPosition.y - currentPos.y;

		let effectiveStiffness: number;
		if (this.config.mode === 'adaptive') {
			const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
			effectiveStiffness = Math.min(
				this.config.minStiffness + this.config.speedCoefficient * speed,
				this.config.maxStiffness
			);
		} else {
			effectiveStiffness = this.config.stiffness;
		}

		const forceScale = 0.001;
		const forceX = dx * effectiveStiffness * forceScale;
		const forceY = dy * effectiveStiffness * forceScale;

		// Apply force to rigid body (impulse = force * dt)
		this.cursorBody.applyImpulse({ x: forceX * dt, y: forceY * dt }, true);

		// Step physics simulation
		// We divide dt by substeps to keep simulation time consistent with real time
		this.world.timestep = dt / this.config.substeps;
		for (let i = 0; i < this.config.substeps; i++) {
			this.world.step();
		}

		const smoothedPos = this.cursorBody.translation();
		const smoothedVel = this.cursorBody.linvel();

		if (
			Number.isNaN(smoothedPos.x) ||
			Number.isNaN(smoothedPos.y) ||
			Number.isNaN(smoothedVel.x) ||
			Number.isNaN(smoothedVel.y)
		) {
			this.reset();
			return {
				position: target,
				velocity: { x: 0, y: 0 },
				prediction: null,
				effectiveStiffness: 0,
			};
		}

		const speed = Math.sqrt(smoothedVel.x * smoothedVel.x + smoothedVel.y * smoothedVel.y);
		if (speed < this.config.velocityDeadZone) {
			this.cursorBody.setLinvel({ x: 0, y: 0 }, true);
			this.velocity = { x: 0, y: 0 };
		} else {
			this.velocity = { x: smoothedVel.x, y: smoothedVel.y };
		}

		const smoothedClamped = {
			x: Math.max(0, Math.min(1, smoothedPos.x)),
			y: Math.max(0, Math.min(1, smoothedPos.y)),
		};

		let predictedPosition: { x: number; y: number } | null = null;
		if (this.config.mode === 'predictive') {
			const predictionSec = this.config.predictionMs / 1000;
			predictedPosition = {
				x: Math.max(0, Math.min(1, smoothedPos.x + smoothedVel.x * predictionSec)),
				y: Math.max(0, Math.min(1, smoothedPos.y + smoothedVel.y * predictionSec)),
			};
		}

		return {
			position: smoothedClamped,
			velocity: this.velocity,
			prediction: predictedPosition,
			effectiveStiffness,
		};
	}

	public reset(): void {
		if (this.cursorBody) {
			this.cursorBody.setTranslation({ x: 0.5, y: 0.5 }, true);
			this.cursorBody.setLinvel({ x: 0, y: 0 }, true);
		}
		this.velocity = { x: 0, y: 0 };
	}

	public setConfig(config: Partial<RapierPhysicsConfig>): void {
		this.config = { ...this.config, ...config };
		if (this.cursorBody) {
			this.cursorBody.setLinearDamping(this.config.damping * 10);
		}
	}

	public getConfig(): Required<RapierPhysicsConfig> {
		return { ...this.config };
	}
}
