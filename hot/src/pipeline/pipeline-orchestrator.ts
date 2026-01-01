/**
 * Pipeline Orchestrator - Wires all 5 stages through NATS JetStream
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Port 1 (Web Weaver BRIDGER)
 *
 * Pipeline Flow:
 * MediaPipe → [NATS] → Smoother → [NATS] → FSM → [NATS] → W3C Pointer → [NATS] → Target
 *
 * Each stage boundary is a HARD GATE with Zod validation.
 * No data flows without explicit schema validation.
 */

import { z } from 'zod';
import {
	NatsSubstrateAdapter,
	type NatsSubstrateOptions,
} from '../adapters/nats-substrate.adapter.js';
import { OneEuroExemplarAdapter } from '../adapters/one-euro-exemplar.adapter.js';
import { XStateFSMAdapter } from '../adapters/xstate-fsm.adapter.js';
import { NatsSubjects, type StageGateConfig } from '../contracts/nats-substrate.js';
import type { SensorFrame, SmoothedFrame } from '../contracts/schemas.js';

// ============================================================================
// STAGE SCHEMAS (Hard Gate Boundaries)
// ============================================================================

/**
 * Stage 1: Sensor input from MediaPipe
 * Raw hand landmark data from vision pipeline
 */
export const SensorInputSchema = z.object({
	handId: z.enum(['left', 'right']),
	timestamp: z.number().positive(),
	landmarks: z.array(
		z.object({
			x: z.number().min(0).max(1),
			y: z.number().min(0).max(1),
			z: z.number(),
			visibility: z.number().optional(),
		}),
	),
	/** Index fingertip (landmark 8) in normalized coords */
	fingertip: z.object({
		x: z.number().min(0).max(1),
		y: z.number().min(0).max(1),
	}),
	/** Palm base (landmark 0) for palm cone detection */
	palmBase: z.object({
		x: z.number().min(0).max(1),
		y: z.number().min(0).max(1),
	}),
	/** Thumb tip (landmark 4) for pinch detection */
	thumbTip: z.object({
		x: z.number().min(0).max(1),
		y: z.number().min(0).max(1),
	}),
	handedness: z.number().min(0).max(1),
});

export type SensorInput = z.infer<typeof SensorInputSchema>;

/**
 * Stage 2: Smoother output
 * 1€ filtered position with velocity metadata
 */
export const SmootherOutputSchema = z.object({
	handId: z.enum(['left', 'right']),
	timestamp: z.number().positive(),
	position: z.object({
		x: z.number(), // Can be screen coords now
		y: z.number(),
	}),
	velocity: z.object({
		x: z.number(),
		y: z.number(),
		magnitude: z.number().nonnegative(),
	}),
	/** Was prediction used? (Rapier spring-damper) */
	predicted: z.boolean(),
	/** Filter cutoff frequency (adaptive) */
	cutoff: z.number().positive(),
});

export type SmootherOutput = z.infer<typeof SmootherOutputSchema>;

/**
 * Stage 3: FSM output
 * Current state and event from XState gesture recognizer
 */
export const FSMOutputSchema = z.object({
	handId: z.enum(['left', 'right']),
	timestamp: z.number().positive(),
	state: z.enum([
		'DISARMED',
		'ARMING',
		'ARMED',
		'DOWN_COMMIT', // Click
		'DOWN_NAV', // Drag
		'ZOOM',
		'SCROLL',
	]),
	previousState: z.string(),
	event: z.string().optional(),
	/** Palm cone: fingertip relative to palm (degrees) */
	palmCone: z.number().nonnegative(),
	/** Time in current state (ms) */
	duration: z.number().nonnegative(),
	/** Should emit pointer event? */
	shouldEmit: z.boolean(),
	/** What type of pointer event? */
	pointerEventType: z.enum(['move', 'down', 'up', 'cancel']).optional(),
});

export type FSMOutput = z.infer<typeof FSMOutputSchema>;

/**
 * Stage 4: W3C Pointer Event
 * Compliant with Pointer Events Level 3
 */
export const W3CPointerSchema = z.object({
	// Required PointerEvent properties
	pointerId: z.number().positive(),
	pointerType: z.literal('touch'), // Hand = touch
	isPrimary: z.boolean(),

	// Event type
	type: z.enum(['pointermove', 'pointerdown', 'pointerup', 'pointercancel']),

	// Position (screen coordinates)
	clientX: z.number(),
	clientY: z.number(),
	screenX: z.number(),
	screenY: z.number(),

	// Movement delta
	movementX: z.number(),
	movementY: z.number(),

	// Pressure (pinch strength)
	pressure: z.number().min(0).max(1),

	// Dimensions (fingertip projected size)
	width: z.number().positive(),
	height: z.number().positive(),

	// Tilt (could derive from hand orientation)
	tiltX: z.number().min(-90).max(90),
	tiltY: z.number().min(-90).max(90),

	// Metadata
	timestamp: z.number().positive(),
	handId: z.enum(['left', 'right']),
});

export type W3CPointer = z.infer<typeof W3CPointerSchema>;

/**
 * Stage 5: Target routing
 * Which adapter should receive the pointer event
 */
export const TargetRouteSchema = z.object({
	targetId: z.string(),
	targetType: z.enum([
		'dom', // Standard DOM element
		'canvas', // Canvas rendering context
		'tldraw', // tldraw editor
		'excalidraw', // Excalidraw editor
		'v86', // x86 emulator
		'jsdos', // DOS emulator
		'emulatorjs', // Multi-platform emulator
		'daedaos', // daedalOS window manager
		'puter', // Puter cloud OS
	]),
	pointer: W3CPointerSchema,
	/** Target-specific routing info */
	routing: z
		.object({
			windowId: z.string().optional(),
			elementSelector: z.string().optional(),
			canvasId: z.string().optional(),
		})
		.optional(),
});

export type TargetRoute = z.infer<typeof TargetRouteSchema>;

// ============================================================================
// PIPELINE ORCHESTRATOR
// ============================================================================

export interface PipelineOrchestratorOptions extends NatsSubstrateOptions {
	/** Screen dimensions for coordinate transform */
	screenWidth: number;
	screenHeight: number;
	/** Enable debug logging */
	debug?: boolean;
}

export class PipelineOrchestrator {
	private substrate: NatsSubstrateAdapter;
	private readonly options: Required<PipelineOrchestratorOptions>;
	private pointerIds: Map<string, number> = new Map();
	private lastPositions: Map<string, { x: number; y: number }> = new Map();

	// Production adapters (npm 1eurofilter + XState)
	private smoother: OneEuroExemplarAdapter | null = null;
	private fsmAdapters: Map<string, XStateFSMAdapter> = new Map();

	constructor(options: PipelineOrchestratorOptions) {
		this.options = {
			streamName: 'HFO_PIPELINE',
			kvBucket: 'hfo-state',
			objStore: 'hfo-recordings',
			debug: false,
			...options,
		};
		this.substrate = new NatsSubstrateAdapter(this.options);
	}

	/**
	 * Start the complete pipeline with all stage gates
	 */
	async start(): Promise<void> {
		await this.substrate.connect();
		this.log('NATS connected, setting up pipeline gates...');

		// Initialize production adapters with error handling
		try {
			this.smoother = new OneEuroExemplarAdapter({
				frequency: 60,
				minCutoff: 1.0,
				beta: 0.007,
			});
			this.log('OneEuroExemplarAdapter initialized (npm 1eurofilter)');
		} catch (err) {
			this.log(`Warning: OneEuroExemplarAdapter failed to init, using passthrough: ${err}`);
			this.smoother = null;
		}

		try {
			this.fsmAdapters.set('left', new XStateFSMAdapter());
			this.fsmAdapters.set('right', new XStateFSMAdapter());
			this.log('XStateFSMAdapter initialized (XState v5 gesture FSM)');
		} catch (err) {
			this.log(`Warning: XStateFSMAdapter failed to init, using fallback: ${err}`);
			this.fsmAdapters.clear();
		}

		// Set up all stage gates
		await Promise.all([
			this.setupSmootherGate('left'),
			this.setupSmootherGate('right'),
			this.setupFSMGate('left'),
			this.setupFSMGate('right'),
			this.setupPointerGate(),
			this.setupTargetGate(),
		]);

		this.log('Pipeline ready: 6 stage gates active');
	}

	/**
	 * Stop the pipeline and disconnect
	 */
	async stop(): Promise<void> {
		// Dispose FSM adapters (stops XState actors)
		for (const adapter of this.fsmAdapters.values()) {
			try {
				adapter.dispose();
			} catch (err) {
				this.log(`Warning: FSM adapter dispose error: ${err}`);
			}
		}
		this.fsmAdapters.clear();

		// Reset smoother
		if (this.smoother) {
			try {
				this.smoother.reset();
			} catch (err) {
				this.log(`Warning: Smoother reset error: ${err}`);
			}
			this.smoother = null;
		}

		await this.substrate.disconnect();
		this.log('Pipeline stopped');
	}

	/**
	 * Feed sensor data into the pipeline (entry point)
	 */
	async feedSensor(input: SensorInput): Promise<void> {
		// Validate at boundary
		const validated = SensorInputSchema.parse(input);
		await this.substrate.publish(
			NatsSubjects.pipeline.sensor(validated.handId),
			validated,
			SensorInputSchema,
		);
	}

	// ============================================================================
	// STAGE GATES
	// ============================================================================

	/**
	 * Stage 2: Smoother gate (1€ filter)
	 */
	private async setupSmootherGate(handId: 'left' | 'right'): Promise<void> {
		const config: StageGateConfig<SensorInput, SmootherOutput> = {
			inputSubject: NatsSubjects.pipeline.sensor(handId),
			outputSubject: NatsSubjects.pipeline.smooth(handId),
			inputSchema: SensorInputSchema,
			outputSchema: SmootherOutputSchema,
			consumerName: `smoother-${handId}`,
			kvStateKey: NatsSubjects.state.cursorPosition(handId),
			transform: async (input) => {
				// Production: Use OneEuroExemplarAdapter (npm 1eurofilter by Géry Casiez)
				// Fallback: passthrough with velocity calculation if adapter unavailable

				const screenX = input.fingertip.x * this.options.screenWidth;
				const screenY = input.fingertip.y * this.options.screenHeight;

				// Try to use real 1€ filter adapter
				if (this.smoother) {
					try {
						// Convert SensorInput to SensorFrame format for adapter
						const sensorFrame: SensorFrame = {
							ts: input.timestamp,
							handId: input.handId,
							trackingOk: true,
							palmFacing: true,
							label: 'Open_Palm' as const,
							confidence: input.handedness,
							landmarks: input.landmarks.map((l) => ({
								x: l.x,
								y: l.y,
								z: l.z,
								visibility: l.visibility ?? 1.0,
							})),
							indexTip: { x: input.fingertip.x, y: input.fingertip.y, z: 0, visibility: 1.0 },
							thumbTip: { x: input.thumbTip.x, y: input.thumbTip.y, z: 0, visibility: 1.0 },
							palmBase: { x: input.palmBase.x, y: input.palmBase.y, z: 0, visibility: 1.0 },
						};

						const smoothed = this.smoother.smooth(sensorFrame);

						this.lastPositions.set(handId, {
							x: (smoothed.position?.x ?? input.fingertip.x) * this.options.screenWidth,
							y: (smoothed.position?.y ?? input.fingertip.y) * this.options.screenHeight,
						});

						return {
							handId,
							timestamp: input.timestamp,
							position: {
								x: (smoothed.position?.x ?? input.fingertip.x) * this.options.screenWidth,
								y: (smoothed.position?.y ?? input.fingertip.y) * this.options.screenHeight,
							},
							velocity: {
								x: smoothed.velocity?.x ?? 0,
								y: smoothed.velocity?.y ?? 0,
								magnitude: Math.sqrt(
									(smoothed.velocity?.x ?? 0) ** 2 + (smoothed.velocity?.y ?? 0) ** 2,
								),
							},
							predicted: !!smoothed.prediction,
							cutoff: 1.0, // Adaptive cutoff is internal to 1€ filter
						};
					} catch (err) {
						this.log(`OneEuro adapter error, falling back to passthrough: ${err}`);
					}
				}

				// Fallback: passthrough with velocity calculation
				const lastPos = this.lastPositions.get(handId);

				let vx = 0;
				let vy = 0;
				if (lastPos) {
					const dt = 1 / 60; // Assume 60fps
					vx = (screenX - lastPos.x) / dt;
					vy = (screenY - lastPos.y) / dt;
				}

				this.lastPositions.set(handId, { x: screenX, y: screenY });

				return {
					handId,
					timestamp: input.timestamp,
					position: { x: screenX, y: screenY },
					velocity: { x: vx, y: vy, magnitude: Math.sqrt(vx * vx + vy * vy) },
					predicted: false,
					cutoff: 1.0,
				};
			},
		};

		await this.substrate.createStageGate(config);
		this.log(`Smoother gate ${handId} active`);
	}

	/**
	 * Stage 3: FSM gate (XState gesture recognizer)
	 */
	private async setupFSMGate(handId: 'left' | 'right'): Promise<void> {
		const config: StageGateConfig<SmootherOutput, FSMOutput> = {
			inputSubject: NatsSubjects.pipeline.smooth(handId),
			outputSubject: NatsSubjects.pipeline.fsm(handId),
			inputSchema: SmootherOutputSchema,
			outputSchema: FSMOutputSchema,
			consumerName: `fsm-${handId}`,
			kvStateKey: NatsSubjects.state.fsmState(handId),
			transform: async (input) => {
				// Production: Use XStateFSMAdapter (XState v5 gesture state machine)
				// Fallback: always ARMED + move if adapter unavailable

				const fsmAdapter = this.fsmAdapters.get(handId);
				if (fsmAdapter) {
					try {
						// Convert SmootherOutput to SmoothedFrame format for adapter
						const smoothedFrame: SmoothedFrame = {
							ts: input.timestamp,
							handId: input.handId,
							trackingOk: true,
							palmFacing: true,
							label: 'Open_Palm' as const, // Would come from MediaPipe gesture recognizer
							confidence: 0.9,
							position: { x: input.position.x, y: input.position.y },
							velocity: { x: input.velocity.x, y: input.velocity.y },
							prediction: input.predicted ? { x: input.position.x, y: input.position.y } : null,
						};

						const previousState = fsmAdapter.getState();
						const action = fsmAdapter.process(smoothedFrame);

						// Map FSMAction to FSMOutput
						const pointerEventType =
							action.action === 'move'
								? ('move' as const)
								: action.action === 'down'
									? ('down' as const)
									: action.action === 'up'
										? ('up' as const)
										: action.action === 'cancel'
											? ('cancel' as const)
											: undefined;

						return {
							handId,
							timestamp: input.timestamp,
							state: action.state as
								| 'DISARMED'
								| 'ARMING'
								| 'ARMED'
								| 'DOWN_COMMIT'
								| 'DOWN_NAV'
								| 'ZOOM'
								| 'SCROLL',
							previousState,
							event: action.action,
							palmCone: 30,
							duration: 0,
							shouldEmit: action.action !== 'none',
							pointerEventType,
						};
					} catch (err) {
						this.log(`XState FSM adapter error, falling back to ARMED: ${err}`);
					}
				}

				// Fallback: always emit move events when ARMED
				return {
					handId,
					timestamp: input.timestamp,
					state: 'ARMED' as const,
					previousState: 'ARMED',
					palmCone: 30,
					duration: 0,
					shouldEmit: true,
					pointerEventType: 'move' as const,
				};
			},
		};

		await this.substrate.createStageGate(config);
		this.log(`FSM gate ${handId} active`);
	}

	/**
	 * Stage 4: Pointer gate (W3C PointerEvent synthesis)
	 */
	private async setupPointerGate(): Promise<void> {
		// Single gate that merges both hands
		const config: StageGateConfig<FSMOutput, W3CPointer> = {
			inputSubject: 'hfo.pipeline.fsm.*', // Wildcard for both hands
			outputSubject: NatsSubjects.pipeline.pointer,
			inputSchema: FSMOutputSchema,
			outputSchema: W3CPointerSchema,
			consumerName: 'pointer-emitter',
			transform: async (input) => {
				if (!input.shouldEmit) {
					throw new Error('Skip: shouldEmit is false');
				}

				// Get or create pointer ID for this hand
				let pointerId = this.pointerIds.get(input.handId);
				if (!pointerId) {
					pointerId = input.handId === 'left' ? 1 : 2;
					this.pointerIds.set(input.handId, pointerId);
				}

				// Get last smoothed position from KV
				const cursor = await this.substrate.getCursorPosition(input.handId);
				const x = cursor?.x ?? 0;
				const y = cursor?.y ?? 0;
				const lastPos = this.lastPositions.get(input.handId) ?? { x: 0, y: 0 };

				const typeMap: Record<string, W3CPointer['type']> = {
					move: 'pointermove',
					down: 'pointerdown',
					up: 'pointerup',
					cancel: 'pointercancel',
				};

				return {
					pointerId,
					pointerType: 'touch' as const,
					isPrimary: input.handId === 'right', // Right hand is primary
					type: typeMap[input.pointerEventType ?? 'move'],
					clientX: x,
					clientY: y,
					screenX: x,
					screenY: y,
					movementX: x - lastPos.x,
					movementY: y - lastPos.y,
					pressure: 0.5, // TODO: Derive from pinch strength
					width: 20,
					height: 20,
					tiltX: 0,
					tiltY: 0,
					timestamp: input.timestamp,
					handId: input.handId,
				};
			},
		};

		await this.substrate.createStageGate(config);
		this.log('Pointer gate active');
	}

	/**
	 * Stage 5: Target gate (routing to adapters)
	 */
	private async setupTargetGate(): Promise<void> {
		const config: StageGateConfig<W3CPointer, TargetRoute> = {
			inputSubject: NatsSubjects.pipeline.pointer,
			outputSubject: NatsSubjects.pipeline.target('dom'), // Default target
			inputSchema: W3CPointerSchema,
			outputSchema: TargetRouteSchema,
			consumerName: 'target-router',
			transform: async (input) => {
				// TODO: Implement target selection logic
				// For now, route everything to DOM

				return {
					targetId: 'default',
					targetType: 'dom' as const,
					pointer: input,
					routing: {
						elementSelector: 'body',
					},
				};
			},
		};

		await this.substrate.createStageGate(config);
		this.log('Target gate active');
	}

	// ============================================================================
	// UTILITIES
	// ============================================================================

	private log(...args: unknown[]): void {
		if (this.options.debug) {
			console.log('[Pipeline]', ...args);
		}
	}

	get isRunning(): boolean {
		return this.substrate.isConnected;
	}
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create and start the complete gesture pipeline
 */
export async function createPipeline(
	options: PipelineOrchestratorOptions,
): Promise<PipelineOrchestrator> {
	const orchestrator = new PipelineOrchestrator(options);
	await orchestrator.start();
	return orchestrator;
}
