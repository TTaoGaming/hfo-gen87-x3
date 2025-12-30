/**
 * Gesture Pipeline - Exemplar Composition
 *
 * Gen87.X3 | Wires all ports together
 *
 * PRINCIPLE: NO INVENTION - Exemplar Composition Only
 * Each adapter is a TRL-9 component, composed via typed contracts.
 */
import type {
	AdapterPort,
	EmitterPort,
	FSMPort,
	PipelinePort,
	SensorPort,
	SmootherPort,
} from '../contracts/ports.js';
import type { AdapterTarget, FSMAction, PointerEventOut } from '../contracts/schemas.js';

export interface PipelineConfig {
	sensor: SensorPort;
	smoother: SmootherPort;
	fsm: FSMPort;
	emitter: EmitterPort;
	adapter: AdapterPort;
	target: AdapterTarget;
}

/**
 * Gesture Pipeline
 *
 * Composes the full pipeline:
 * VideoFrame → SensorPort → SmootherPort → FSMPort → EmitterPort → AdapterPort → DOM
 */
export class GesturePipeline implements PipelinePort {
	private config: PipelineConfig;
	private _isRunning = false;
	private animationFrameId: number | null = null;
	private subscribers: Set<(event: PointerEventOut | null) => void> = new Set();

	constructor(config: PipelineConfig) {
		this.config = config;
	}

	get isRunning(): boolean {
		return this._isRunning;
	}

	async start(): Promise<void> {
		if (this._isRunning) return;

		// Initialize sensor
		await this.config.sensor.initialize();
		this._isRunning = true;
	}

	stop(): void {
		if (!this._isRunning) return;

		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		this.config.sensor.dispose();
		this._isRunning = false;
	}

	/**
	 * Process a single frame through the pipeline
	 * Useful for testing and manual control
	 */
	async processFrame(video: HTMLVideoElement, timestamp: number): Promise<FSMAction> {
		// Stage 1: Sense (MediaPipe)
		const sensorFrame = await this.config.sensor.sense(video, timestamp);

		// Stage 2: Shape (1€ Filter)
		const smoothedFrame = this.config.smoother.smooth(sensorFrame);

		// Stage 3: Deliver (XState FSM)
		const action = this.config.fsm.process(smoothedFrame);

		// Stage 4: Defend (Pointer Event Emitter)
		const event = this.config.emitter.emit(action, this.config.target);

		// Stage 5: Inject (DOM Adapter)
		if (event) {
			this.config.adapter.inject(event);

			// Handle pointer capture
			if (event.type === 'pointerdown') {
				this.config.adapter.setCapture();
			} else if (event.type === 'pointerup' || event.type === 'pointercancel') {
				this.config.adapter.releaseCapture();
			}
		}

		// Notify subscribers
		this.subscribers.forEach((cb) => cb(event));

		return action;
	}

	/**
	 * Start continuous processing loop
	 */
	startLoop(video: HTMLVideoElement): void {
		if (!this._isRunning) {
			throw new Error('Pipeline not started. Call start() first.');
		}

		const loop = async () => {
			if (!this._isRunning) return;

			const timestamp = performance.now();
			await this.processFrame(video, timestamp);

			this.animationFrameId = requestAnimationFrame(loop);
		};

		loop();
	}

	subscribe(callback: (event: PointerEventOut | null) => void): () => void {
		this.subscribers.add(callback);
		return () => this.subscribers.delete(callback);
	}

	/**
	 * Update target bounds (call when window/element resizes)
	 */
	updateTarget(target: AdapterTarget): void {
		this.config.target = target;
	}

	/**
	 * Get current FSM state
	 */
	getFSMState(): string {
		return this.config.fsm.getState();
	}

	/**
	 * Force disarm
	 */
	disarm(): void {
		this.config.fsm.disarm();
		this.config.smoother.reset();
		this.config.adapter.releaseCapture();
	}
}

/**
 * Factory function for creating a pipeline with default adapters
 */
export function createDefaultPipeline(
	target: Element,
	options: {
		modelPath?: string;
		wasmPath?: string;
		filterMincutoff?: number;
		filterBeta?: number;
		pointerId?: number;
		pointerType?: 'mouse' | 'pen' | 'touch';
	} = {},
): GesturePipeline {
	// Lazy imports to avoid bundling when not used
	const { MediaPipeAdapter } = require('./mediapipe.adapter.js');
	const { OneEuroAdapter } = require('./one-euro.adapter.js');
	const { XStateFSMAdapter } = require('./xstate-fsm.adapter.js');
	const { PointerEventAdapter, DOMAdapter } = require('./pointer-event.adapter.js');

	const bounds = target.getBoundingClientRect();
	const targetConfig: AdapterTarget = {
		type: 'element',
		selector: undefined,
		bounds: {
			width: bounds.width,
			height: bounds.height,
			left: bounds.left,
			top: bounds.top,
		},
	};

	return new GesturePipeline({
		sensor: new MediaPipeAdapter(options.modelPath, options.wasmPath),
		smoother: new OneEuroAdapter(options.filterMincutoff ?? 1.0, options.filterBeta ?? 0.007),
		fsm: new XStateFSMAdapter(),
		emitter: new PointerEventAdapter(options.pointerId ?? 1, options.pointerType ?? 'touch'),
		adapter: new DOMAdapter(target, options.pointerId ?? 1),
		target: targetConfig,
	});
}
