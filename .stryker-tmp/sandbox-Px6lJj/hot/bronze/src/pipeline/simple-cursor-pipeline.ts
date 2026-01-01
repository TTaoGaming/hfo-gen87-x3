/**
 * Simple Cursor Pipeline
 *
 * Gen87.X3 | HIVE Phase: VALIDATE (V) | TDD GREEN
 *
 * Composes REAL adapters into a production-ready cursor pipeline:
 * - OneEuroExemplarAdapter (npm 1eurofilter wrapper)
 * - XStateFSMAdapter (real XState v5 machine)
 * - W3CPointerEventFactory (W3C compliant events)
 *
 * NO THEATER - Uses exemplar packages only
 *
 * Data Flow:
 * SensorFrame → 1€ Filter → FSM → W3C PointerEvents
 */
// @ts-nocheck

import {
	type OneEuroConfig,
	OneEuroExemplarAdapter,
} from '../adapters/one-euro-exemplar.adapter.js';
import { XStateFSMAdapter } from '../adapters/xstate-fsm.adapter.js';
import type { FSMPort, PortFactory, SmootherPort } from '../contracts/ports.js';
import type { FSMAction, SensorFrame, SmoothedFrame } from '../contracts/schemas.js';
import { W3CPointerEventFactory } from '../phase1-w3c-cursor/w3c-pointer-factory.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface SimpleCursorPipelineConfig {
	/** Viewport width for coordinate mapping */
	viewportWidth: number;
	/** Viewport height for coordinate mapping */
	viewportHeight: number;
	/** 1€ filter parameters */
	oneEuro?: OneEuroConfig;
	/** Optional PortFactory for dependency injection */
	factory?: PortFactory;
}

const DEFAULT_CONFIG: SimpleCursorPipelineConfig = {
	viewportWidth: 1920,
	viewportHeight: 1080,
	oneEuro: {
		frequency: 60,
		minCutoff: 1.0,
		beta: 0.007,
		dCutoff: 1.0,
	},
};

// ============================================================================
// PIPELINE RESULT
// ============================================================================

export interface PipelineResult {
	/** Generated pointer events (may be empty) */
	events: PointerEvent[];
	/** Current FSM state */
	fsmState: string;
	/** Smoothed position (normalized 0-1) */
	smoothedPosition: { x: number; y: number } | null;
	/** Raw FSM action */
	fsmAction: FSMAction;
}

// ============================================================================
// SIMPLE CURSOR PIPELINE
// ============================================================================

/**
 * SimpleCursorPipeline - Production cursor input processing
 *
 * Wires together three real adapters:
 * 1. OneEuroExemplarAdapter - Smooths jittery hand tracking
 * 2. XStateFSMAdapter - Manages gesture state machine
 * 3. W3CPointerEventFactory - Emits W3C-compliant pointer events
 *
 * @example
 * ```typescript
 * const pipeline = new SimpleCursorPipeline({ viewportWidth: 1920, viewportHeight: 1080 });
 * const result = pipeline.process(sensorFrame);
 * for (const event of result.events) {
 *   targetElement.dispatchEvent(event);
 * }
 * ```
 */
export class SimpleCursorPipeline {
	private readonly config: SimpleCursorPipelineConfig;
	private readonly smoother: SmootherPort;
	private readonly fsm: FSMPort;
	private readonly pointerFactory: W3CPointerEventFactory;

	constructor(config: Partial<SimpleCursorPipelineConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };

		// Use DI factory if provided, otherwise create adapters directly
		if (this.config.factory) {
			this.smoother = this.config.factory.createSmoother();
			this.fsm = this.config.factory.createFSM();
		} else {
			// Fallback: direct instantiation (legacy path)
			this.smoother = new OneEuroExemplarAdapter(this.config.oneEuro);
			this.fsm = new XStateFSMAdapter();
		}
		this.pointerFactory = new W3CPointerEventFactory({
			viewportWidth: this.config.viewportWidth,
			viewportHeight: this.config.viewportHeight,
			pointerType: 'pen', // Gesture input is pen-like precision
		});
	}

	/**
	 * Process a sensor frame through the full pipeline
	 *
	 * @param frame - Raw sensor frame from MediaPipe
	 * @returns Pipeline result with pointer events and state
	 */
	process(frame: SensorFrame): PipelineResult {
		// Stage 1: Smooth the frame using 1€ filter
		const smoothedFrame: SmoothedFrame = this.smoother.smooth(frame);

		// Stage 2: Process through FSM to get action
		const fsmAction: FSMAction = this.fsm.process(smoothedFrame);

		// Stage 3: Convert FSM action to W3C pointer events
		const events = this.convertActionToEvents(fsmAction);

		return {
			events,
			fsmState: this.fsm.getState(),
			smoothedPosition: smoothedFrame.position,
			fsmAction,
		};
	}

	/**
	 * Convert FSM action to W3C pointer events
	 */
	private convertActionToEvents(action: FSMAction): PointerEvent[] {
		// Handle discriminated union based on action type
		switch (action.action) {
			case 'move':
				return [this.pointerFactory.createMoveEvent({ x: action.x, y: action.y })];

			case 'down':
				return [
					this.pointerFactory.createDownEvent(
						{ x: action.x, y: action.y },
						action.button === 0 ? 0.5 : 0.25,
					),
				];

			case 'up':
				return [this.pointerFactory.createUpEvent({ x: action.x, y: action.y })];

			case 'cancel':
				return [this.pointerFactory.createCancelEvent()];

			case 'wheel':
				// Wheel events are different from pointer events
				// For now, return empty - could be extended with WheelEvent
				return [];

			case 'none':
				return [];

			default:
				return [];
		}
	}

	/**
	 * Get current FSM state
	 */
	getFSMState(): string {
		return this.fsm.getState();
	}

	/**
	 * Get current configuration
	 */
	getConfig(): Readonly<SimpleCursorPipelineConfig> {
		return { ...this.config };
	}

	/**
	 * Reset pipeline state
	 * - Resets FSM to DISARMED
	 * - Clears 1€ filter state
	 */
	reset(): void {
		this.smoother.reset();
		this.fsm.disarm();
	}

	/**
	 * Clean up resources
	 */
	dispose(): void {
		this.fsm.dispose();
	}

	/**
	 * Update viewport dimensions (e.g., on window resize)
	 */
	setViewport(width: number, height: number): void {
		this.pointerFactory.setViewport(width, height);
		(this.config as SimpleCursorPipelineConfig).viewportWidth = width;
		(this.config as SimpleCursorPipelineConfig).viewportHeight = height;
	}

	/**
	 * Subscribe to FSM state changes
	 */
	onStateChange(callback: (state: string, action: FSMAction) => void): () => void {
		return this.fsm.subscribe(callback);
	}
}

// Default export for convenience
export default SimpleCursorPipeline;
