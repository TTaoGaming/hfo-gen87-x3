import type { Port5_Immunizer } from '../contracts/eight-ports.js';
import type { VacuoleEnvelope } from '../contracts/vacuole-envelope.js';

/**
 * Pyre Praetorian Immunizer (Port 5)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | DEFEND
 *
 * Enforces system gates and protects the integrity of the Obsidian Hourglass.
 * "How do we DEFEND the DEFEND?"
 */
export class PyrePraetorianImmunizer implements Port5_Immunizer {
	/**
	 * Port 5: DEFEND
	 * Validates the envelope against system gates (G0-G11).
	 */
	defend(envelope: VacuoleEnvelope<unknown>): boolean {
		// G0: Timestamp validation
		if (!envelope.time || new Date(envelope.time) > new Date()) {
			return false;
		}

		// G7: Port validation
		if (envelope.hfoport < 0 || envelope.hfoport > 7) {
			return false;
		}

		// G5: HIVE phase validation
		const validPhases = ['H', 'I', 'V', 'E', 'X'];
		if (!validPhases.includes(envelope.hfohive)) {
			return false;
		}

		return true;
	}
}
