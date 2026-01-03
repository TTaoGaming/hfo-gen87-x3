import type { SensorPort } from '../../contracts/ports.js';
import type { SensorFrame } from '../../contracts/schemas.js';

/**
 * SimulatedSensorAdapter for testing (no MediaPipe dependency)
 * QUARANTINED: This is for testing only and should not be in production.
 */
export class SimulatedSensorAdapter implements SensorPort {
	private _isReady = false;
	private mockFrames: SensorFrame[] = [];
	private frameIndex = 0;

	get isReady(): boolean {
		return this._isReady;
	}

	async initialize(): Promise<void> {
		this._isReady = true;
	}

	/**
	 * Load mock frames for testing
	 */
	loadMockFrames(frames: SensorFrame[]): void {
		this.mockFrames = frames;
		this.frameIndex = 0;
	}

	async sense(_video: HTMLVideoElement, timestamp: number): Promise<SensorFrame> {
		if (this.mockFrames.length === 0) {
			// Return a fully-populated default frame
			return {
				ts: timestamp,
				handId: 'none',
				trackingOk: false,
				palmFacing: false,
				label: 'None',
				confidence: 0,
				indexTip: null,
				landmarks: null,
			};
		}

		const frame = this.mockFrames[this.frameIndex];
		if (!frame) {
			throw new Error('Mock frame is undefined - this should not happen');
		}
		this.frameIndex = (this.frameIndex + 1) % this.mockFrames.length;
		// Ensure all required fields are present
		return {
			ts: timestamp,
			handId: frame.handId ?? 'none',
			trackingOk: frame.trackingOk ?? false,
			palmFacing: frame.palmFacing ?? false,
			label: frame.label ?? 'None',
			confidence: frame.confidence ?? 0,
			indexTip: frame.indexTip ?? null,
			landmarks: frame.landmarks ?? null,
		};
	}

	dispose(): void {
		this._isReady = false;
	}
}
