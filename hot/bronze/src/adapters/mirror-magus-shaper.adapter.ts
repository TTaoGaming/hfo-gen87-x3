import type { Port2_Shaper } from '../contracts/eight-ports.js';
import type { PredictorPort } from '../contracts/ports-extended.js';
import type { SmootherPort } from '../contracts/ports.js';
import type { SensorFrame, SmoothedFrame } from '../contracts/schemas.js';
import { type VacuoleEnvelope, propagateVacuole } from '../contracts/vacuole-envelope.js';

/**
 * Mirror Magus Shaper (Port 2)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | SHAPE
 *
 * Transforms raw sensor data into a refined, smoothed, and predicted form.
 * "How do we SHAPE the SHAPE?"
 */
export class MirrorMagusShaper implements Port2_Shaper {
	private smoother: SmootherPort;
	private predictor: PredictorPort | undefined;

	constructor(smoother: SmootherPort, predictor?: PredictorPort) {
		this.smoother = smoother;
		this.predictor = predictor;
	}

	/**
	 * Port 2: SHAPE
	 * Applies smoothing and prediction to the sensor frame.
	 */
	shape(envelope: VacuoleEnvelope<SensorFrame>): VacuoleEnvelope<SmoothedFrame> {
		const rawFrame = envelope.data;

		// 1. Smooth
		const smoothed = this.smoother.smooth(rawFrame);

		// 2. Predict (Optional)
		let predicted = undefined;
		if (this.predictor) {
			predicted = this.predictor.predict(smoothed);
		}

		// 3. Propagate Vacuole
		return propagateVacuole(
			envelope,
			{
				...smoothed,
				predicted,
			} as unknown as SmoothedFrame,
			2,
			2,
		);
	}
}
