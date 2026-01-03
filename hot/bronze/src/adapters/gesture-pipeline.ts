/**
 * GesturePipeline - Port 2 (SHAPE)
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | CDD Implementation
 *
 * PRINCIPLE: Orchestrates the 7-stage gesture processing pipeline.
 *
 * 7-stage pipeline logic:
 * - Stage 0: SENSOR (MediaPipe)
 * - Stage 1: SMOOTH (1€ Filter)
 * - Stage 2: FSM (XState)
 * - Stage 3: PREDICT (DESP) - Optional
 * - Stage 5: EMIT (W3C Pointer)
 * - Stage 6: TARGET (Dispatch)
 */

import type {
	AdapterPort,
	EmitterPort,
	FSMPort,
	PipelinePort,
	SensorPort,
	SmootherPort,
} from '../contracts/ports.js';
import {
	type AdapterTarget,
	type FSMAction,
	FSMActionSchema,
	type PointerEventOut,
	PointerEventOutSchema,
	type SensorFrame,
	SensorFrameSchema,
	SmoothedFrameSchema,
} from '../contracts/schemas.js';

export interface GesturePipelineConfig {
	sensor: SensorPort;
	smoother: SmootherPort;
	fsm: FSMPort;
	emitter: EmitterPort;
	adapter: AdapterPort;
	predictor?: SmootherPort; // Optional Stage 3 support
}

export class GesturePipeline implements PipelinePort {
	private sensor: SensorPort;
	private smoother: SmootherPort;
	private fsm: FSMPort;
	private emitter: EmitterPort;
	private adapter: AdapterPort;
	private predictor: SmootherPort | undefined;
	private _isRunning = false;
	private subscribers: Set<(event: PointerEventOut | null) => void> = new Set();

	constructor(config: GesturePipelineConfig) {
		this.sensor = config.sensor;
		this.smoother = config.smoother;
		this.fsm = config.fsm;
		this.emitter = config.emitter;
		this.adapter = config.adapter;
		this.predictor = config.predictor;
	}

	async start(): Promise<void> {
		if (!this.sensor.isReady) {
			await this.sensor.initialize();
		}
		this._isRunning = true;
	}

	stop(): void {
		this._isRunning = false;
	}

	/**
	 * Update the target adapter for the pipeline.
	 * Useful for switching targets in a multi-showcase environment.
	 */
	setAdapter(adapter: AdapterPort): void {
		this.adapter = adapter;
	}

	async processFrame(video: HTMLVideoElement, timestamp: number): Promise<FSMAction> {
		// Stage 0: SENSOR
		const rawSensorFrame = await this.sensor.sense(video, timestamp);
		return this.processSensorFrame(rawSensorFrame);
	}

	/**
	 * Process a pre-sensed SensorFrame through the rest of the pipeline.
	 * Useful for bus-driven flows or recorded data playback.
	 *
	 * @param rawSensorFrame - The raw sensor frame to process
	 * @returns The resulting FSM action
	 */
	async processSensorFrame(rawSensorFrame: SensorFrame): Promise<FSMAction> {
		const sensorFrame = SensorFrameSchema.parse(rawSensorFrame);

		// Stage 1: SMOOTH
		const rawSmoothedFrame = this.smoother.smooth(sensorFrame);
		const smoothedFrame = SmoothedFrameSchema.parse(rawSmoothedFrame);

		// Stage 2: FSM
		const rawFsmAction = this.fsm.process(smoothedFrame);
		let fsmAction = FSMActionSchema.parse(rawFsmAction);

		// Stage 3: PREDICT (Optional)
		// "If smoother provides prediction, use it."
		if (fsmAction.action !== 'none' && fsmAction.action !== 'cancel') {
			const prediction = this.predictor
				? this.predictor.smooth(sensorFrame).prediction
				: smoothedFrame.prediction;

			if (prediction) {
				fsmAction = {
					...fsmAction,
					x: prediction.x,
					y: prediction.y,
				} as FSMAction;
			}
		}

		// Stage 5: EMIT
		const bounds = this.adapter.getBounds();
		const target: AdapterTarget = {
			type: 'element', // Default to element
			bounds: {
				width: bounds.width,
				height: bounds.height,
				left: bounds.left,
				top: bounds.top,
			},
		};
		const rawPointerEvent = this.emitter.emit(fsmAction, target);

		let pointerEvent: PointerEventOut | null = null;
		if (rawPointerEvent) {
			pointerEvent = PointerEventOutSchema.parse(rawPointerEvent);
		}

		// Stage 6: TARGET
		if (pointerEvent) {
			this.adapter.inject(pointerEvent);
		}

		// Notify subscribers
		for (const sub of this.subscribers) {
			sub(pointerEvent);
		}

		return fsmAction;
	}

	subscribe(callback: (event: PointerEventOut | null) => void): () => void {
		this.subscribers.add(callback);
		return () => {
			this.subscribers.delete(callback);
		};
	}

	get isRunning(): boolean {
		return this._isRunning;
	}
}
