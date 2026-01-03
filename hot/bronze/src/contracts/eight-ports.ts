import type { z } from 'zod';
import type {
	AdapterTarget,
	FSMAction,
	PointerEventOut,
	SensorFrame,
	SmoothedFrame,
} from './schemas.js';
import type { VacuoleEnvelope } from './vacuole-envelope.js';

/**
 * HFO 8-Port Architecture (The Obsidian Hourglass)
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Spider Sovereign (Port 7)
 *
 * This file defines the 8 canonical ports of the HFO architecture.
 * Each port corresponds to a Commander and a specific functional domain.
 */

// ============================================================================
// PORT 0: OBSERVER (SENSE) - Lidless Legion
// ============================================================================
export interface Port0_Observer {
	sense(video: HTMLVideoElement, timestamp: number): Promise<VacuoleEnvelope<SensorFrame>>;
}

// ============================================================================
// PORT 1: BRIDGER (FUSE) - Web Weaver
// Total Tool Virtualization & Schema Enforcement
// ============================================================================
export interface Port1_Bridger {
	/**
	 * Fuse multiple inputs into a unified schema
	 * Enforces "Total Tool Virtualization" - virtual tools must match real form/function.
	 */
	fuse<T>(input: unknown, schema: z.ZodType<T>): VacuoleEnvelope<T>;
}

// ============================================================================
// PORT 2: SHAPER (SHAPE) - Mirror Magus
// Transformation, Smoothing, and Prediction
// ============================================================================
export interface Port2_Shaper {
	/**
	 * Shape the raw data into a refined form (smooth + predict)
	 */
	shape(frame: VacuoleEnvelope<SensorFrame>): VacuoleEnvelope<SmoothedFrame>;
}

// ============================================================================
// PORT 3: INJECTOR (DELIVER) - Spore Storm
// Execution, Injection, and Emission
// ============================================================================
export interface Port3_Injector {
	/**
	 * Deliver the final action to the target environment
	 */
	deliver(
		action: VacuoleEnvelope<FSMAction>,
		target: AdapterTarget,
	): Promise<VacuoleEnvelope<PointerEventOut>>;
}

// ============================================================================
// PORT 4: DISRUPTOR (TEST) - Red Regnant
// Validation through Disruption & Property Testing
// ============================================================================
export interface Port4_Disruptor {
	/**
	 * Test the integrity of a payload through mutation or property-based checks
	 */
	test(payload: unknown): Promise<boolean>;
}

// ============================================================================
// PORT 5: IMMUNIZER (DEFEND) - Pyre Praetorian
// Gate Enforcement & Security
// ============================================================================
export interface Port5_Immunizer {
	/**
	 * Defend the system by enforcing gates (G0-G11)
	 */
	defend(envelope: VacuoleEnvelope<unknown>): boolean;
}

// ============================================================================
// PORT 6: ASSIMILATOR (STORE) - Kraken Keeper
// Persistence, Memory, and Substrate
// ============================================================================
export interface Port6_Assimilator {
	/**
	 * Store a payload in the substrate or long-term memory
	 */
	store(key: string, payload: unknown): Promise<void>;

	/**
	 * Retrieve a payload from memory
	 */
	retrieve(key: string): Promise<unknown>;

	/**
	 * Assimilate a frame into the state machine and produce an action.
	 * IR-0008 FIX: FSM moved from Port 3 to Port 6.
	 */
	assimilate(frame: VacuoleEnvelope<SmoothedFrame>): Promise<VacuoleEnvelope<FSMAction>>;
}

// ============================================================================
// PORT 7: NAVIGATOR (DECIDE) - Spider Sovereign
// Strategic Command & Control (C2)
// ============================================================================
export interface Port7_Navigator {
	/**
	 * Decide the next strategic move for the swarm
	 */
	decide(context: unknown): Promise<void>;

	/**
	 * Orchestrate a full HIVE cycle
	 */
	orchestrate(): Promise<void>;
}
