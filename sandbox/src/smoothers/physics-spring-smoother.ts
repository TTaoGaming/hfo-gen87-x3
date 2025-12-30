/**
 * Physics Spring-Damper Smoother - STUB (TDD RED Phase)
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | TDD RED
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

import type { SmoothedFrame, SmootherPort } from '../contracts/ports.js';
import type { SensorFrame } from '../contracts/schemas.js';

export interface SpringDamperConfig {
	/** Spring constant (stiffness) - higher = snappier */
	springK: number;
	/** Damping coefficient - higher = less oscillation */
	dampingC: number;
	/** Mass - higher = more sluggish */
	mass: number;
}

/**
 * PhysicsSpringDamperSmoother - Spring-Damper Physics
 *
 * STUB: Throws "not implemented" - will be implemented in GREEN phase
 */
export class PhysicsSpringDamperSmoother implements SmootherPort {
	constructor(_config: SpringDamperConfig) {
		throw new Error('PhysicsSpringDamperSmoother not implemented');
	}

	smooth(_frame: SensorFrame): SmoothedFrame {
		throw new Error('PhysicsSpringDamperSmoother.smooth not implemented');
	}

	reset(): void {
		throw new Error('PhysicsSpringDamperSmoother.reset not implemented');
	}

	setParams(_params: Partial<SpringDamperConfig>): void {
		throw new Error('PhysicsSpringDamperSmoother.setParams not implemented');
	}
}
