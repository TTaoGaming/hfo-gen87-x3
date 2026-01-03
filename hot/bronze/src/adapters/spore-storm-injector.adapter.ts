import type { Port3_Injector } from '../contracts/eight-ports.js';
import type { AdapterPort, EmitterPort } from '../contracts/ports.js';
import type { AdapterTarget, FSMAction, PointerEventOut } from '../contracts/schemas.js';
import { type VacuoleEnvelope, propagateVacuole } from '../contracts/vacuole-envelope.js';

/**
 * Spore Storm Injector (Port 3)
 *
 * Gen87.X3 | Phase: EVOLVE (E) | DELIVER
 *
 * Executes the final delivery of virtualized tools into the target environment.
 * IR-0008 FIX: FSM moved to Port 6. Port 3 now only handles Emission and Injection.
 * "How do we DELIVER the DELIVER?"
 */
export class SporeStormInjector implements Port3_Injector {
	private emitter: EmitterPort;
	private adapter: AdapterPort;

	constructor(emitter: EmitterPort, adapter: AdapterPort) {
		this.emitter = emitter;
		this.adapter = adapter;
	}

	/**
	 * Port 3: DELIVER
	 * Emits pointer event and injects into target.
	 */
	async deliver(
		envelope: VacuoleEnvelope<FSMAction>,
		target: AdapterTarget,
	): Promise<VacuoleEnvelope<PointerEventOut>> {
		const action = envelope.data;

		// 1. Emit Pointer Event
		const pointerEvent = this.emitter.emit(action, target);

		if (!pointerEvent) {
			// No event to deliver (e.g., FSM in BASELINE)
			return null as any;
		}

		// 2. Inject into Target
		this.adapter.inject(pointerEvent);

		// 3. Propagate Vacuole
		return propagateVacuole(envelope, pointerEvent, 5, 3) as VacuoleEnvelope<PointerEventOut>;
	}
}
