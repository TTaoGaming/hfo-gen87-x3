/**
 * W3C Cursor Pipeline - Production Ready
 *
 * Gen87.X3 | Phase: V (Validate) | NO THEATER
 *
 * This is the REAL pipeline that wires REAL adapters together:
 * - OneEuroAdapter (real 1€ filter, not inline copy)
 * - XStateFSMAdapter (real XState v5, not if/else bypass)
 * - W3CPointerEventFactory (real W3C Level 3 events)
 *
 * NO NATS dependency - browser-only use case
 * NO inline implementations - uses real adapter imports
 * NO TODO stubs - every method is implemented
 *
 * @module pipeline/w3c-cursor-pipeline
 * @hive V (Validate)
 * @tdd GREEN
 */

import { z } from 'zod';
import { OneEuroAdapter } from '../adapters/one-euro.adapter.js';
import { XStateFSMAdapter } from '../adapters/xstate-fsm.adapter.js';
import {
	W3CPointerEventFactory,
	DOMEventDispatcher,
	type FSMAction as FactoryFSMAction,
} from '../phase1-w3c-cursor/w3c-pointer-factory.js';
import type { SensorFrame, SmoothedFrame, FSMAction } from '../contracts/schemas.js';
import type { SmootherPort, FSMPort } from '../contracts/ports.js';

// ============================================================================
// PIPELINE CONFIGURATION SCHEMA
// ============================================================================

export const PipelineConfigSchema = z.object({
	/** Viewport width for coordinate mapping */
	viewportWidth: z.number().positive().default(1920),
	/** Viewport height for coordinate mapping */
	viewportHeight: z.number().positive().default(1080),
	/** 1€ Filter minimum cutoff frequency */
	filterMincutoff: z.number().positive().default(1.0),
	/** 1€ Filter beta (speed coefficient) */
	filterBeta: z.number().nonnegative().default(0.007),
	/** Pointer type for W3C events */
	pointerType: z.enum(['mouse', 'pen', 'touch']).default('pen'),
	/** Enable debug logging */
	debug: z.boolean().default(false),
});

export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

// ============================================================================
// PIPELINE EVENT TYPES
// ============================================================================

export type PipelineEvent =
	| { type: 'frame'; events: PointerEvent[]; state: string }
	| { type: 'stateChange'; from: string; to: string }
	| { type: 'error'; error: Error };

export type PipelineListener = (event: PipelineEvent) => void;

// ============================================================================
// W3C CURSOR PIPELINE CLASS
// ============================================================================

/**
 * Production-ready W3C Cursor Pipeline
 *
 * Composes real adapters:
 * SensorFrame → OneEuroAdapter → XStateFSMAdapter → W3CPointerEventFactory → DOM
 *
 * @example
 * ```typescript
 * const pipeline = new W3CCursorPipeline({
 *   viewportWidth: window.innerWidth,
 *   viewportHeight: window.innerHeight,
 * });
 *
 * // Set target element
 * pipeline.setTarget(document.getElementById('canvas')!);
 *
 * // Process MediaPipe frame
 * const events = pipeline.processFrame(sensorFrame);
 * ```
 */
export class W3CCursorPipeline {
	private readonly config: Required<PipelineConfig>;
	private readonly smoother: SmootherPort;
	private readonly fsm: FSMPort;
	private readonly factory: W3CPointerEventFactory;
	private dispatcher: DOMEventDispatcher | null = null;
	private listeners: Set<PipelineListener> = new Set();
	private lastState: string = 'DISARMED';

	constructor(config: Partial<PipelineConfig> = {}) {
		this.config = PipelineConfigSchema.parse(config) as Required<PipelineConfig>;

		// Initialize REAL adapters (not inline copies)
		this.smoother = new OneEuroAdapter({
			mincutoff: this.config.filterMincutoff,
			beta: this.config.filterBeta,
		});

		this.fsm = new XStateFSMAdapter();

		this.factory = new W3CPointerEventFactory({
			viewportWidth: this.config.viewportWidth,
			viewportHeight: this.config.viewportHeight,
			pointerType: this.config.pointerType,
			isPrimary: true,
		});

		// Subscribe to FSM state changes
		this.fsm.subscribe((state, action) => {
			if (state !== this.lastState) {
				this.emit({ type: 'stateChange', from: this.lastState, to: state });
				this.lastState = state;
			}
		});

		this.log('Pipeline initialized with real adapters');
	}

	/**
	 * Set DOM target element for pointer event injection
	 */
	setTarget(target: EventTarget): void {
		this.dispatcher = new DOMEventDispatcher({
			target,
			capturePointer: true,
			onDispatch: (event) => {
				this.log(`Dispatched: ${event.type} at (${event.clientX}, ${event.clientY})`);
			},
		});
		this.log(`Target set: ${target.constructor.name}`);
	}

	/**
	 * Process a sensor frame through the complete pipeline
	 *
	 * Flow: SensorFrame → Smooth → FSM → PointerEvents → DOM
	 *
	 * @param frame - Raw sensor frame from MediaPipe
	 * @returns Array of PointerEvents that were dispatched
	 */
	processFrame(frame: SensorFrame): PointerEvent[] {
		try {
			// Stage 2: Smooth with 1€ filter
			const smoothed = this.smoother.smooth(frame);

			// Stage 3: Process through FSM
			const action = this.fsm.process(smoothed);

			// Stage 4: Convert to W3C PointerEvents
			const events = this.convertToPointerEvents(action, smoothed);

			// Stage 5: Dispatch to DOM target
			if (this.dispatcher && events.length > 0) {
				this.dispatcher.dispatchAll(events);
			}

			// Notify listeners
			this.emit({ type: 'frame', events, state: this.fsm.getState() });

			return events;
		} catch (error) {
			this.emit({ type: 'error', error: error as Error });
			this.log(`Error processing frame: ${error}`);
			return [];
		}
	}

	/**
	 * Convert FSM action to W3C PointerEvents
	 */
	private convertToPointerEvents(action: FSMAction, frame: SmoothedFrame): PointerEvent[] {
		const position = frame.position ?? { x: 0, y: 0 };

		// Map our FSMAction schema to factory's expected format
		const factoryAction: FactoryFSMAction = this.mapActionToFactory(action, position);

		return this.factory.fromFSMAction(factoryAction);
	}

	/**
	 * Map our discriminated union FSMAction to factory's FSMAction format
	 */
	private mapActionToFactory(
		action: FSMAction,
		position: { x: number; y: number }
	): FactoryFSMAction {
		switch (action.action) {
			case 'move':
				return {
					type: 'MOVE',
					position: { x: action.x, y: action.y },
					state: action.state,
				};
			case 'down':
				return {
					type: 'DOWN',
					position: { x: action.x, y: action.y },
					state: action.state,
					pressure: 0.5,
				};
			case 'up':
				return {
					type: 'UP',
					position: { x: action.x, y: action.y },
					state: action.state,
				};
			case 'cancel':
				return {
					type: 'CANCEL',
					position,
					state: action.state,
				};
			case 'none':
			case 'wheel':
			default:
				return {
					type: 'NONE',
					position,
					state: action.state,
				};
		}
	}

	/**
	 * Get current FSM state
	 */
	getState(): string {
		return this.fsm.getState();
	}

	/**
	 * Force disarm (emergency stop)
	 */
	disarm(): void {
		this.fsm.disarm();
		this.smoother.reset();
		this.log('Pipeline disarmed');
	}

	/**
	 * Update viewport dimensions (e.g., on window resize)
	 */
	updateViewport(width: number, height: number): void {
		this.factory.setViewport(width, height);
		(this.config as PipelineConfig).viewportWidth = width;
		(this.config as PipelineConfig).viewportHeight = height;
		this.log(`Viewport updated: ${width}x${height}`);
	}

	/**
	 * Update 1€ filter parameters at runtime
	 */
	updateFilter(mincutoff: number, beta: number): void {
		this.smoother.setParams(mincutoff, beta);
		this.log(`Filter updated: mincutoff=${mincutoff}, beta=${beta}`);
	}

	/**
	 * Subscribe to pipeline events
	 */
	subscribe(listener: PipelineListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/**
	 * Get configuration (read-only)
	 */
	getConfig(): Readonly<PipelineConfig> {
		return { ...this.config };
	}

	/**
	 * Get adapter references for testing/debugging
	 */
	getAdapters(): {
		smoother: SmootherPort;
		fsm: FSMPort;
		factory: W3CPointerEventFactory;
	} {
		return {
			smoother: this.smoother,
			fsm: this.fsm,
			factory: this.factory,
		};
	}

	private emit(event: PipelineEvent): void {
		for (const listener of this.listeners) {
			try {
				listener(event);
			} catch (error) {
				console.error('Pipeline listener error:', error);
			}
		}
	}

	private log(message: string): void {
		if (this.config.debug) {
			console.log(`[W3CCursorPipeline] ${message}`);
		}
	}
}

// ============================================================================
// FACTORY FUNCTION (Convenient creation)
// ============================================================================

/**
 * Create a production-ready W3C cursor pipeline
 *
 * @example
 * ```typescript
 * const pipeline = createW3CCursorPipeline({
 *   viewportWidth: window.innerWidth,
 *   viewportHeight: window.innerHeight,
 *   debug: true,
 * });
 * pipeline.setTarget(document.body);
 * ```
 */
export function createW3CCursorPipeline(config?: Partial<PipelineConfig>): W3CCursorPipeline {
	return new W3CCursorPipeline(config);
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { SensorFrame, SmoothedFrame, FSMAction };
