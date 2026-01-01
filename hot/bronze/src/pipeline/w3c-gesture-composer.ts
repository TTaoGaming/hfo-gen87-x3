import type { PipelineComposition, ResolvedPipeline } from '../contracts/adapter-factory.js';
import {
	EmitterRegistry,
	FSMRegistry,
	OverlayRegistry,
	PredictorRegistry,
	SensorRegistry,
	SmootherRegistry,
	TargetRegistry,
} from '../contracts/adapter-factory.js';
import type {
	EmitEnvelope,
	FSMEnvelope,
	PredictEnvelope,
	SenseEnvelope,
	SmoothEnvelope,
	TargetEnvelope,
	UIEnvelope,
	UIShellPortEnhanced,
} from '../contracts/ports-extended.js';
/**
 * W3C Gesture Pipeline Composer - Dependency Injection Wiring
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Web Weaver (Port 1) + Kraken Keeper (Port 6)
 *
 * This composer wires together all 7 pipeline stages using:
 * 1. Adapter Factory pattern (polymorphic, runtime-swappable)
 * 2. Vacuole Envelope pattern (CloudEvents wrapper, full traceability)
 * 3. Registry-based discovery (hot-reload capable)
 *
 * The Composer is the "vacuole membrane" - it:
 * - ENVELOPES each stage input in CloudEvents
 * - ASSIMILATES stage outputs into next stage input
 * - ROUTES to NATS subjects for distributed processing (optional)
 */
import type { PipelineStats, PredictedFrame } from '../contracts/schemas-extended.js';
import type { AdapterTarget, SmoothedFrame } from '../contracts/schemas.js';
import {
	PIPELINE_EVENT_TYPES,
	PIPELINE_NATS_SUBJECTS,
	type Traceparent,
	type VacuoleEnvelope,
	propagateVacuole,
	wrapInVacuole,
} from '../contracts/vacuole-envelope.js';

// ============================================================================
// COMPOSER CONFIGURATION
// ============================================================================

export interface ComposerConfig {
	/** HFO generation (87+) */
	gen: number;
	/** Enable NATS routing (distributed mode) */
	enableNATS?: boolean;
	/** NATS server URL */
	natsUrl?: string;
	/** Enable vacuole envelopes (default: true) */
	enableEnvelopes?: boolean;
	/** Enable prediction stage (default: true) */
	enablePrediction?: boolean;
	/** Viewport dimensions for coordinate mapping */
	viewport: { width: number; height: number };
	/** Target element for pointer dispatch */
	targetElement?: HTMLElement;
	/** Overlay container (optional) */
	overlayContainer?: HTMLElement;
}

// ============================================================================
// PIPELINE COMPOSER
// ============================================================================

/**
 * W3CGestureComposer - Wires the 7-stage pipeline with vacuole pattern
 *
 * Usage:
 * ```typescript
 * // Using adapter IDs (resolved from registries)
 * const composer = new W3CGestureComposer({
 *   gen: 87,
 *   viewport: { width: 1920, height: 1080 }
 * });
 *
 * composer.compose({
 *   sensor: 'mediapipe',
 *   smoother: 'one-euro',
 *   predictor: 'kalman',
 *   fsm: 'xstate',
 *   emitter: 'w3c-pointer',
 *   target: 'dom'
 * });
 *
 * const result = await composer.process(videoElement, performance.now());
 * ```
 */
export class W3CGestureComposer {
	private config: ComposerConfig;
	private pipeline: ResolvedPipeline | null = null;
	private uiShell: UIShellPortEnhanced | null = null;
	private isRunning = false;
	private animationFrameId: number | null = null;

	// Statistics
	private stats: PipelineStats = {
		framesProcessed: 0,
		averageLatencyMs: 0,
		droppedFrames: 0,
		errorsCount: 0,
		stageLatencies: {
			sense: 0,
			smooth: 0,
			predict: 0,
			fsm: 0,
			emit: 0,
			target: 0,
			ui: 0,
		},
	};

	// Last envelopes (for debugging)
	private lastEnvelopes: {
		sense?: SenseEnvelope;
		smooth?: SmoothEnvelope;
		predict?: PredictEnvelope;
		fsm?: FSMEnvelope;
		emit?: EmitEnvelope;
		target?: TargetEnvelope;
		ui?: UIEnvelope;
	} = {};

	// Stage callbacks
	private stageCallbacks = new Map<string, Array<(envelope: VacuoleEnvelope<unknown>) => void>>();

	constructor(config: ComposerConfig) {
		this.config = {
			enableEnvelopes: true,
			enablePrediction: true,
			...config,
		};
	}

	/**
	 * Compose the pipeline from adapter IDs or instances
	 */
	compose(composition: PipelineComposition): void {
		this.pipeline = {
			sensor: this.resolveAdapter(composition.sensor, SensorRegistry, 'SensorPort'),
			smoother: this.resolveAdapter(composition.smoother, SmootherRegistry, 'SmootherPort'),
			predictor: composition.predictor
				? this.resolveAdapter(composition.predictor, PredictorRegistry, 'PredictorPort')
				: undefined,
			fsm: this.resolveAdapter(composition.fsm, FSMRegistry, 'FSMPort'),
			emitter: this.resolveAdapter(composition.emitter, EmitterRegistry, 'EmitterPort'),
			target: this.resolveAdapter(composition.target, TargetRegistry, 'AdapterPort'),
			overlay: composition.overlay
				? this.resolveAdapter(composition.overlay, OverlayRegistry, 'OverlayPort')
				: undefined,
		};
	}

	/**
	 * Set UI Shell (optional Stage 7)
	 */
	setUIShell(uiShell: UIShellPortEnhanced): void {
		this.uiShell = uiShell;
	}

	/**
	 * Resolve adapter from ID string or return instance directly
	 */
	private resolveAdapter<T>(
		adapterOrId: string | T,
		registry: { create: (id: string, config?: unknown) => T },
		portName: string,
	): T {
		if (typeof adapterOrId === 'string') {
			try {
				return registry.create(adapterOrId);
			} catch (e) {
				throw new Error(`Failed to resolve ${portName} adapter "${adapterOrId}": ${e}`);
			}
		}
		return adapterOrId;
	}

	/**
	 * Process a single frame through the pipeline
	 */
	async process(video: HTMLVideoElement, timestamp: number): Promise<UIEnvelope | null> {
		if (!this.pipeline) {
			throw new Error('Pipeline not composed. Call compose() first.');
		}

		const startTime = performance.now();
		let currentTrace: Traceparent | undefined;

		try {
			// ================================================================
			// STAGE 1: SENSE (Port 0 - Observer)
			// ================================================================
			const senseStart = performance.now();
			const sensorFrame = await this.pipeline.sensor.sense(video, timestamp);
			this.stats.stageLatencies.sense = performance.now() - senseStart;

			const senseEnvelope = this.config.enableEnvelopes
				? wrapInVacuole(sensorFrame, {
						type: PIPELINE_EVENT_TYPES.SENSE,
						hfogen: this.config.gen,
						hfohive: 'V',
						hfoport: 0,
						hfostage: 1,
						hfonats: PIPELINE_NATS_SUBJECTS.SENSE,
					})
				: null;

			this.lastEnvelopes.sense = senseEnvelope ?? undefined;
			currentTrace = senseEnvelope?.traceparent;
			this.notifyStageComplete('sense', senseEnvelope);

			// ================================================================
			// STAGE 2: SMOOTH (Port 2 - Shaper)
			// ================================================================
			const smoothStart = performance.now();
			const smoothedFrame = this.pipeline.smoother.smooth(sensorFrame);
			this.stats.stageLatencies.smooth = performance.now() - smoothStart;

			const smoothEnvelope =
				this.config.enableEnvelopes && senseEnvelope
					? propagateVacuole(senseEnvelope, smoothedFrame, 2, 2)
					: null;

			this.lastEnvelopes.smooth = smoothEnvelope ?? undefined;
			this.notifyStageComplete('smooth', smoothEnvelope);

			// ================================================================
			// STAGE 3: PREDICT (Port 2.5 - Optional)
			// ================================================================
			let predictedFrame: PredictedFrame | null = null;
			let predictEnvelope: PredictEnvelope | null = null;

			if (this.config.enablePrediction && this.pipeline.predictor && smoothedFrame.position) {
				const predictStart = performance.now();
				predictedFrame = this.pipeline.predictor.predict(smoothedFrame);
				this.stats.stageLatencies.predict = performance.now() - predictStart;

				predictEnvelope =
					this.config.enableEnvelopes && smoothEnvelope
						? propagateVacuole(smoothEnvelope, predictedFrame, 3, 2)
						: null;

				this.lastEnvelopes.predict = predictEnvelope ?? undefined;
				this.notifyStageComplete('predict', predictEnvelope);
			}

			// ================================================================
			// STAGE 4: FSM (Port 3 - Injector)
			// ================================================================
			const fsmStart = performance.now();
			// Use predicted position if available, otherwise smoothed
			const frameForFSM = predictedFrame
				? { ...smoothedFrame, position: predictedFrame.predicted }
				: smoothedFrame;
			const fsmAction = this.pipeline.fsm.process(frameForFSM as SmoothedFrame);
			this.stats.stageLatencies.fsm = performance.now() - fsmStart;

			// FSM envelope uses smoothed frame as source (PredictedFrame is extension data)
			const fsmEnvelope =
				this.config.enableEnvelopes && smoothEnvelope
					? propagateVacuole(smoothEnvelope, fsmAction, 4, 3)
					: null;

			this.lastEnvelopes.fsm = fsmEnvelope ?? undefined;
			this.notifyStageComplete('fsm', fsmEnvelope);

			// ================================================================
			// STAGE 5: EMIT (Port 5 - Immunizer)
			// ================================================================
			const emitStart = performance.now();
			const target: AdapterTarget = {
				type: 'element',
				bounds: {
					left: 0,
					top: 0,
					width: this.config.viewport.width,
					height: this.config.viewport.height,
				},
			};
			const pointerEvent = this.pipeline.emitter.emit(fsmAction, target);
			this.stats.stageLatencies.emit = performance.now() - emitStart;

			if (!pointerEvent) {
				// No event to emit (e.g., FSM state is DISARMED)
				return null;
			}

			const emitEnvelope =
				this.config.enableEnvelopes && fsmEnvelope
					? propagateVacuole(fsmEnvelope, pointerEvent, 5, 5)
					: null;

			this.lastEnvelopes.emit = emitEnvelope ?? undefined;
			this.notifyStageComplete('emit', emitEnvelope);

			// ================================================================
			// STAGE 6: TARGET (Port 1 - Bridger)
			// ================================================================
			const targetStart = performance.now();
			const dispatched = this.pipeline.target.inject(pointerEvent);
			this.stats.stageLatencies.target = performance.now() - targetStart;

			const targetEnvelope =
				this.config.enableEnvelopes && emitEnvelope
					? propagateVacuole(
							emitEnvelope,
							{ event: pointerEvent, targets: dispatched ? ['primary'] : [] },
							6,
							1,
						)
					: null;

			this.lastEnvelopes.target = targetEnvelope ?? undefined;
			this.notifyStageComplete('target', targetEnvelope);

			// ================================================================
			// STAGE 7: UI (Port 7 - Navigator) - Optional
			// ================================================================
			let uiEnvelope: UIEnvelope | null = null;

			if (this.uiShell) {
				const uiStart = performance.now();
				const layoutActions = this.uiShell.processGesture(pointerEvent, fsmAction);
				this.stats.stageLatencies.ui = performance.now() - uiStart;

				uiEnvelope =
					this.config.enableEnvelopes && targetEnvelope
						? propagateVacuole(targetEnvelope, layoutActions, 7, 7)
						: null;

				this.lastEnvelopes.ui = uiEnvelope ?? undefined;
				this.notifyStageComplete('ui', uiEnvelope);
			}

			// Update statistics
			this.stats.framesProcessed++;
			const totalLatency = performance.now() - startTime;
			this.stats.averageLatencyMs =
				(this.stats.averageLatencyMs * (this.stats.framesProcessed - 1) + totalLatency) /
				this.stats.framesProcessed;

			return uiEnvelope;
		} catch (error) {
			this.stats.errorsCount++;
			console.error('[W3CGestureComposer] Pipeline error:', error);
			return null;
		}
	}

	/**
	 * Get last envelopes (for debugging/visualization)
	 */
	getLastEnvelopes() {
		return { ...this.lastEnvelopes };
	}

	/**
	 * Subscribe to stage completions
	 */
	onStageComplete(
		stage: 'sense' | 'smooth' | 'predict' | 'fsm' | 'emit' | 'target' | 'ui',
		callback: (envelope: VacuoleEnvelope<unknown>) => void,
	): () => void {
		if (!this.stageCallbacks.has(stage)) {
			this.stageCallbacks.set(stage, []);
		}
		const callbacks = this.stageCallbacks.get(stage);
		if (callbacks) {
			callbacks.push(callback);
		}

		return () => {
			const callbacks = this.stageCallbacks.get(stage);
			if (callbacks) {
				const index = callbacks.indexOf(callback);
				if (index !== -1) {
					callbacks.splice(index, 1);
				}
			}
		};
	}

	/**
	 * Notify stage completion to subscribers
	 */
	private notifyStageComplete(stage: string, envelope: VacuoleEnvelope<unknown> | null): void {
		if (!envelope) return;
		const callbacks = this.stageCallbacks.get(stage);
		if (callbacks) {
			for (const callback of callbacks) {
				try {
					callback(envelope);
				} catch (e) {
					console.error(`[W3CGestureComposer] Stage callback error (${stage}):`, e);
				}
			}
		}
	}

	/**
	 * Start processing loop
	 */
	async start(video: HTMLVideoElement): Promise<void> {
		if (!this.pipeline) {
			throw new Error('Pipeline not composed. Call compose() first.');
		}

		// Initialize sensor
		await this.pipeline.sensor.initialize();

		this.isRunning = true;

		const loop = async () => {
			if (!this.isRunning) return;

			try {
				await this.process(video, performance.now());
			} catch (e) {
				this.stats.droppedFrames++;
			}

			this.animationFrameId = requestAnimationFrame(loop);
		};

		loop();
	}

	/**
	 * Stop processing loop
	 */
	stop(): void {
		this.isRunning = false;
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	/**
	 * Get pipeline statistics
	 */
	getStats(): PipelineStats {
		return { ...this.stats };
	}

	/**
	 * Reset statistics
	 */
	resetStats(): void {
		this.stats = {
			framesProcessed: 0,
			averageLatencyMs: 0,
			droppedFrames: 0,
			errorsCount: 0,
			stageLatencies: {
				sense: 0,
				smooth: 0,
				predict: 0,
				fsm: 0,
				emit: 0,
				target: 0,
				ui: 0,
			},
		};
	}

	/**
	 * Check if running
	 */
	get running(): boolean {
		return this.isRunning;
	}

	/**
	 * Dispose all resources
	 */
	dispose(): void {
		this.stop();
		if (this.pipeline) {
			this.pipeline.sensor.dispose();
			this.pipeline.overlay?.dispose();
			this.uiShell?.dispose();
		}
		this.pipeline = null;
		this.uiShell = null;
		this.lastEnvelopes = {};
		this.stageCallbacks.clear();
	}
}

// ============================================================================
// FACTORY FUNCTION (Convenience)
// ============================================================================

/**
 * Create a pre-configured W3C Gesture Pipeline
 *
 * @example
 * ```typescript
 * const composer = createW3CGesturePipeline({
 *   gen: 87,
 *   viewport: { width: 1920, height: 1080 },
 *   adapters: {
 *     sensor: 'mediapipe',
 *     smoother: 'one-euro',
 *     predictor: 'kalman',
 *     fsm: 'xstate',
 *     emitter: 'w3c-pointer',
 *     target: 'dom'
 *   }
 * });
 * await composer.start(videoElement);
 * ```
 */
export function createW3CGesturePipeline(options: {
	gen: number;
	viewport: { width: number; height: number };
	adapters: PipelineComposition;
	enableNATS?: boolean;
	natsUrl?: string;
	targetElement?: HTMLElement;
}): W3CGestureComposer {
	const composer = new W3CGestureComposer({
		gen: options.gen,
		viewport: options.viewport,
		enableNATS: options.enableNATS,
		natsUrl: options.natsUrl,
		targetElement: options.targetElement,
	});

	composer.compose(options.adapters);
	return composer;
}
