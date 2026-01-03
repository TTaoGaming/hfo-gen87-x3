import type { Port6_Assimilator } from '../contracts/eight-ports.js';
import type { FSMPort, SubstratePort } from '../contracts/ports.js';
import type { FSMAction, SmoothedFrame } from '../contracts/schemas.js';
import { type VacuoleEnvelope, propagateVacuole } from '../contracts/vacuole-envelope.js';

/**
 * Kraken Keeper Assimilator (Port 6)
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | STORE
 *
 * Manages the persistence and memory of the swarm through the substrate.
 * IR-0008 FIX: Now hosts the FSM as part of the "Store" (State) domain.
 * "How do we STORE the STORE?"
 */
export class KrakenKeeperAssimilator implements Port6_Assimilator {
	private substrate: SubstratePort;
	private fsm: FSMPort;

	constructor(substrate: SubstratePort, fsm: FSMPort) {
		this.substrate = substrate;
		this.fsm = fsm;
	}

	/**
	 * Port 6: STORE
	 * Persists a payload to the substrate.
	 */
	async store(key: string, payload: unknown): Promise<void> {
		await this.substrate.publish(`hfo.store.${key}`, payload);
		await this.substrate.kvSet(key, payload);
	}

	/**
	 * Port 6: RETRIEVE
	 * Retrieves a payload from the substrate.
	 */
	async retrieve(key: string): Promise<unknown> {
		return await this.substrate.kvGet(key);
	}

	/**
	 * Port 6: ASSIMILATE
	 * Processes a frame through the state machine.
	 */
	async assimilate(envelope: VacuoleEnvelope<SmoothedFrame>): Promise<VacuoleEnvelope<FSMAction>> {
		const action = this.fsm.process(envelope.data);

		// Store the state change in memory
		await this.store('fsm_state', this.fsm.getState());

		return propagateVacuole(envelope, action, 6, 6) as VacuoleEnvelope<FSMAction>;
	}
}
