import {
	GoldenLayoutFactory,
	MediaPipeFactory,
	OneEuroFactory,
	RapierPredictorFactory,
	RapierSmootherFactory,
	W3CPointerFactory,
	XStateFSMFactory,
} from '../adapters/factories.js';
import { InMemorySubstrateAdapter } from '../adapters/in-memory-substrate.adapter.js';
import { DOMTargetRouterAdapter } from '../adapters/target-router.adapter.js';
/**
 * HFO W3C Pointer Orchestrator
 *
 * Gen87.X3 | Canonical Production Ready Pipeline
 *
 * This orchestrator manages the full 7-stage W3C Gesture Pipeline:
 * 1. SENSE (MediaPipe)
 * 2. SMOOTH (1€ / Rapier)
 * 3. PREDICT (Rapier / DESP)
 * 4. FSM (XState)
 * 5. EMIT (W3C Pointer)
 * 6. TARGET (DOM / NATS)
 * 7. UI (Golden Layout)
 *
 * It integrates with the Substrate (Message Bus) to allow hot-swapping
 * of components like an OS.
 */
import {
	EmitterRegistry,
	FSMRegistry,
	type PipelineComposition,
	PredictorRegistry,
	SensorRegistry,
	SmootherRegistry,
	TargetRegistry,
	UIShellRegistry,
} from '../contracts/adapter-factory.js';
import type { SubstratePort } from '../contracts/ports.js';
import { W3CGestureComposer } from './w3c-gesture-composer.js';

// ============================================================================
// REGISTRY INITIALIZATION (The "OS" Boot Sequence)
// ============================================================================

/**
 * Initialize all registries with production-ready factories
 */
export function initializeRegistries(): void {
	// Port 0 - SENSE
	if (!SensorRegistry.has('mediapipe')) SensorRegistry.register('mediapipe', MediaPipeFactory);

	// Port 2 - SHAPE (Smooth)
	if (!SmootherRegistry.has('one-euro')) SmootherRegistry.register('one-euro', OneEuroFactory);
	if (!SmootherRegistry.has('rapier-smooth'))
		SmootherRegistry.register('rapier-smooth', RapierSmootherFactory);

	// Port 2.5 - PREDICT
	if (!PredictorRegistry.has('rapier-predict'))
		PredictorRegistry.register('rapier-predict', RapierPredictorFactory);

	// Port 3 - DELIVER (FSM)
	if (!FSMRegistry.has('xstate')) FSMRegistry.register('xstate', XStateFSMFactory);

	// Port 5 - DEFEND (Emit)
	if (!EmitterRegistry.has('w3c-pointer'))
		EmitterRegistry.register('w3c-pointer', W3CPointerFactory);

	// Port 6 - TARGET
	if (!TargetRegistry.has('dom')) {
		TargetRegistry.register('dom', {
			metadata: {
				id: 'dom',
				name: 'DOM Target Router',
				version: '1.0.0',
				description: 'Routes events to DOM elements',
				trl: 9,
				source: 'HFO Internal',
			},
			create: () => new DOMTargetRouterAdapter(),
			validateConfig: () => ({ valid: true }),
			getDefaultConfig: () => ({}),
		});
	}

	// Port 7 - NAVIGATE (UI Shell)
	if (!UIShellRegistry.has('golden')) UIShellRegistry.register('golden', GoldenLayoutFactory);
}

// ============================================================================
// ORCHESTRATOR IMPLEMENTATION
// ============================================================================

export interface OrchestratorConfig {
	gen: number;
	viewport: { width: number; height: number };
	composition: PipelineComposition;
	enableBus?: boolean;
}

/**
 * HFO_W3C_Pointer_Orchestrator
 *
 * The central Command & Control for the gesture pipeline.
 * Handles composition, execution, and bus integration.
 */
export class HFO_W3C_Pointer_Orchestrator {
	private composer: W3CGestureComposer;
	private bus: SubstratePort;
	private isRunning = false;
	private config: OrchestratorConfig;

	constructor(config: OrchestratorConfig) {
		this.config = config;
		// 1. Ensure registries are ready
		initializeRegistries();

		// 2. Initialize Bus (The "OS" Substrate)
		this.bus = new InMemorySubstrateAdapter();

		// 3. Initialize Composer (The "CPU" Pipeline)
		this.composer = new W3CGestureComposer({
			gen: config.gen,
			viewport: config.viewport,
			enableEnvelopes: true,
		});

		// 4. Compose the pipeline
		this.composer.compose(config.composition);

		// 5. Connect Pipeline to Bus (Stigmergy)
		if (config.enableBus !== false) {
			this.connectToBus();
		}
	}

	/**
	 * Start the orchestrator
	 */
	async start(): Promise<void> {
		if (this.isRunning) return;
		await this.bus.connect();
		this.isRunning = true;
		console.log('[Orchestrator] Started');
	}

	/**
	 * Stop the orchestrator
	 */
	async stop(): Promise<void> {
		if (!this.isRunning) return;
		await this.bus.disconnect();
		this.isRunning = false;
		console.log('[Orchestrator] Stopped');
	}

	/**
	 * Process a single frame (e.g. from MediaPipe)
	 */
	async process(video: HTMLVideoElement, timestamp: number): Promise<void> {
		if (!this.isRunning) return;
		await this.composer.process(video, timestamp);
	}

	/**
	 * Hot-swap a stage in the pipeline
	 */
	swapStage(stage: keyof PipelineComposition, adapterId: string): void {
		console.log(`[Orchestrator] Swapping ${stage} to ${adapterId}`);
		this.config.composition[stage] = adapterId as any;
		this.composer.compose(this.config.composition);
	}

	/**
	 * Connect pipeline stages to the message bus
	 */
	private connectToBus(): void {
		const stages: Array<'sense' | 'smooth' | 'predict' | 'fsm' | 'emit' | 'target' | 'ui'> = [
			'sense',
			'smooth',
			'predict',
			'fsm',
			'emit',
			'target',
			'ui',
		];

		for (const stage of stages) {
			this.composer.onStageComplete(stage, (envelope) => {
				this.bus.publish(`hfo.pipeline.${stage}`, envelope);
			});
		}
	}

	/**
	 * Get the message bus for external component integration
	 */
	getBus(): SubstratePort {
		return this.bus;
	}

	/**
	 * Get the composer for direct inspection
	 */
	getComposer(): W3CGestureComposer {
		return this.composer;
	}
}
