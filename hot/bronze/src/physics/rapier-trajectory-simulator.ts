/**
 * @fileoverview SIMPLIFIED Spring-Damper Trajectory Simulator
 *
 * ⚠️ DEPRECATED: This is a SIMPLIFIED implementation that does NOT use
 * actual Rapier WASM. For real Rapier physics, use:
 *
 *   import { createRapierSimulator } from './rapier-wasm-simulator.js';
 *
 * This file uses basic spring-damper math for trajectory prediction.
 * Kept for backwards compatibility and lightweight environments where
 * WASM is not available.
 *
 * @module physics/rapier-trajectory-simulator
 * @hive V (Validate)
 * @tdd GREEN
 * @deprecated Use rapier-wasm-simulator.ts for production
 */

import type { GestureLabel } from './gesture-language.js';
import type { GestureLanguagePort, GestureState } from './gesture-transition-model.js';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TrajectorySimulatorPort {
	simulate(
		currentState: GestureState,
		durationMs: number,
	): {
		predictedPosition: { x: number; y: number };
		predictedGesture: GestureLabel;
		confidence: number;
	};
	setGrammar(grammar: GestureLanguagePort): void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default damping ratio for velocity decay */
const DEFAULT_DAMPING_RATIO = 0.7;

/** Simulation timestep in ms */
const SIMULATION_TIMESTEP_MS = 5;

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * SIMPLIFIED Spring-Damper Trajectory Simulator
 *
 * Uses a spring-damper model to simulate hand trajectory.
 *
 * ⚠️ WARNING: This does NOT use actual @dimforge/rapier2d-compat WASM.
 * For production, use RapierWasmSimulator from rapier-wasm-simulator.ts
 *
 * @deprecated Use RapierWasmSimulator for production
 */
export class RapierTrajectorySimulator implements TrajectorySimulatorPort {
	private grammar: GestureLanguagePort | null = null;
	private dampingRatio: number;
	private lastPosition: { x: number; y: number } | null = null;
	private lastTimestamp: number | null = null;
	private velocity: { x: number; y: number } = { x: 0, y: 0 };

	constructor(dampingRatio = DEFAULT_DAMPING_RATIO) {
		this.dampingRatio = dampingRatio;
	}

	/**
	 * Simulate trajectory from current state
	 *
	 * Uses simple kinematics with drag for prediction:
	 * p(t) = p0 + v0*t (with velocity decay)
	 */
	simulate(
		currentState: GestureState,
		durationMs: number,
	): {
		predictedPosition: { x: number; y: number };
		predictedGesture: GestureLabel;
		confidence: number;
	} {
		const { indexTip, label, timestampMs } = currentState;

		// Calculate velocity from position delta
		if (this.lastPosition && this.lastTimestamp !== null) {
			const dt = (timestampMs - this.lastTimestamp) / 1000;
			if (dt > 0) {
				this.velocity = {
					x: (indexTip.x - this.lastPosition.x) / dt,
					y: (indexTip.y - this.lastPosition.y) / dt,
				};
			}
		}

		// Store for next call
		this.lastPosition = { ...indexTip };
		this.lastTimestamp = timestampMs;

		// Simulate trajectory
		const position = { ...indexTip };
		const velocity = { ...this.velocity };
		const steps = Math.ceil(durationMs / SIMULATION_TIMESTEP_MS);

		for (let i = 0; i < steps; i++) {
			const dt = SIMULATION_TIMESTEP_MS / 1000;
			const dampingFactor = Math.exp(-this.dampingRatio * dt);

			velocity.x *= dampingFactor;
			velocity.y *= dampingFactor;

			position.x += velocity.x * dt;
			position.y += velocity.y * dt;
		}

		// Clamp to [0, 1] bounds
		position.x = Math.max(0, Math.min(1, position.x));
		position.y = Math.max(0, Math.min(1, position.y));

		// Predict gesture based on grammar
		let predictedGesture: GestureLabel = label;
		let confidence = 0.9;

		if (this.grammar) {
			const validTransitions = this.grammar.getValidTransitions(label);

			// For Open_Palm, predict Pointing_Up (commit gesture)
			if (label === 'Open_Palm') {
				const commitTransition = validTransitions.find((t) => t.to === 'Pointing_Up');
				if (commitTransition) {
					predictedGesture = 'Pointing_Up';
					confidence = 0.85;
				}
			}

			// For None state, predict Pointing_Up (likely completing commit gesture)
			if (label === 'None') {
				const commitTransition = validTransitions.find((t) => t.to === 'Pointing_Up');
				if (commitTransition) {
					predictedGesture = 'Pointing_Up';
					confidence = 0.75;
				}
			}

			// For unexpected gestures, lower confidence
			if (
				label !== 'Open_Palm' &&
				label !== 'Pointing_Up' &&
				label !== 'Closed_Fist' &&
				label !== 'Victory' &&
				label !== 'None'
			) {
				confidence = 0.5;
			}
		}

		return {
			predictedPosition: position,
			predictedGesture,
			confidence,
		};
	}

	/**
	 * Set gesture grammar for grammar-constrained prediction
	 */
	setGrammar(grammar: GestureLanguagePort): void {
		this.grammar = grammar;
	}

	/**
	 * Set damping ratio
	 */
	setDampingRatio(ratio: number): void {
		this.dampingRatio = ratio;
	}
}
