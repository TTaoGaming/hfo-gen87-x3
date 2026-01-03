import type { LayoutAction, PredictedFrame, TargetDefinition } from './schemas-extended.js';
/**
 * Extended Ports - Predictor, TargetRouter, UIShell, VacuolePipeline
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Web Weaver (Port 1) + Kraken Keeper (Port 6)
 *
 * These ports extend the base ports.ts with:
 * - Predictor (Port 2.5)
 * - TargetRouter (Port 6)
 * - UIShell (Port 7)
 * - Vacuole-aware Pipeline (Stage 1-7)
 */
import type { FSMAction, PointerEventOut, SensorFrame, SmoothedFrame } from './schemas.js';
import type { VacuoleEnvelope } from './vacuole-envelope.js';

// ============================================================================
// PREDICTOR (Port 2.5)
// ============================================================================

/**
 * Predictor Port - Stage 3 of the W3C Gesture Pipeline
 *
 * Takes a smoothed frame and predicts the next position based on velocity/physics.
 * This is critical for low-latency feel and "throw" gestures.
 */
export interface PredictorPort {
	/**
	 * Predict the next frame state
	 */
	predict(frame: SmoothedFrame): PredictedFrame;

	/**
	 * Reset internal state (e.g. on hand lost)
	 */
	reset(): void;
}

// ============================================================================
// TARGET ROUTER (Port 6)
// ============================================================================

/**
 * Target Router Port - Stage 6 of the W3C Gesture Pipeline
 *
 * Determines which UI element or service should receive the gesture event.
 * Supports DOM elements, Canvas, IFrames, and NATS subjects.
 */
export interface TargetRouterPort {
	/**
	 * Register a potential target
	 */
	registerTarget(target: TargetDefinition): void;

	/**
	 * Unregister a target
	 */
	unregisterTarget(id: string): void;

	/**
	 * Find the best target for a given coordinate
	 */
	findTarget(x: number, y: number): TargetDefinition | null;

	/**
	 * Route an event to a target
	 */
	route(event: any, target: TargetDefinition): Promise<void>;
}

// ============================================================================
// UI SHELL (Port 7)
// ============================================================================

/**
 * UI Shell Port - Stage 7 of the W3C Gesture Pipeline
 *
 * Executes high-level layout actions (split, focus, close) in the host environment.
 * Typically implemented by a GoldenLayout adapter or similar.
 */
export interface UIShellPort {
	/**
	 * Execute a layout action
	 */
	execute(action: LayoutAction): Promise<void>;

	/**
	 * Get current layout state
	 */
	getLayoutState(): any;
}

/**
 * Enhanced UI Shell Port with additional capabilities
 */
export interface UIShellPortEnhanced extends UIShellPort {
	/**
	 * Focus a specific tile
	 */
	focusTile(tileId: string): void;

	/**
	 * Close a specific tile
	 */
	closeTile(tileId: string): void;

	/**
	 * Split a tile
	 */
	splitTile(tileId: string, direction: 'horizontal' | 'vertical'): void;

	/**
	 * Process a gesture and return layout actions
	 */
	processGesture(event: PointerEventOut, action: FSMAction): LayoutAction[];

	/**
	 * Dispose resources
	 */
	dispose(): void;
}

// ============================================================================
// PIPELINE STAGE ENVELOPE TYPES (for type-safe vacuole passing)
// ============================================================================

/** Stage 1 output envelope */
export type SenseEnvelope = VacuoleEnvelope<SensorFrame>;

/** Stage 2 output envelope */
export type SmoothEnvelope = VacuoleEnvelope<SmoothedFrame>;

/** Stage 3 output envelope */
export type PredictEnvelope = VacuoleEnvelope<PredictedFrame>;

/** Stage 4 output envelope */
export type FSMEnvelope = VacuoleEnvelope<FSMAction>;

/** Stage 5 output envelope */
export type EmitEnvelope = VacuoleEnvelope<PointerEventOut>;

/** Stage 6 output envelope */
export type TargetEnvelope = VacuoleEnvelope<{ event: PointerEventOut; targets: string[] }>;

/** Stage 7 output envelope */
export type UIEnvelope = VacuoleEnvelope<LayoutAction[]>;

// ============================================================================
// VACUOLE-AWARE PIPELINE PORT
// ============================================================================

/**
 * Complete pipeline with vacuole envelope support
 *
 * This is the main composition interface - wire up all stages
 * and process frames with full stigmergy traceability.
 */
export interface VacuolePipelinePort {
	/**
	 * Process a video frame through the entire pipeline
	 * Returns the final UI envelope with full trace
	 */
	process(video: HTMLVideoElement, timestamp: number): Promise<UIEnvelope | null>;

	/**
	 * Get intermediate envelopes (for debugging/visualization)
	 */
	getLastEnvelopes(): {
		sense?: SenseEnvelope | undefined;
		smooth?: SmoothEnvelope | undefined;
		predict?: PredictEnvelope | undefined;
		fsm?: FSMEnvelope | undefined;
		emit?: EmitEnvelope | undefined;
		target?: TargetEnvelope | undefined;
		ui?: UIEnvelope | undefined;
	};

	/**
	 * Subscribe to stage completions
	 */
	onStageComplete(
		stage: 'sense' | 'smooth' | 'predict' | 'fsm' | 'emit' | 'target' | 'ui',
		callback: (envelope: VacuoleEnvelope<unknown>) => void,
	): () => void;

	/**
	 * Start processing loop
	 */
	start(): Promise<void>;

	/**
	 * Stop processing loop
	 */
	stop(): void;

	/**
	 * Check if running
	 */
	readonly isRunning: boolean;

	/**
	 * Get pipeline statistics
	 */
	getStats(): {
		framesProcessed: number;
		averageLatencyMs: number;
		droppedFrames: number;
		errorsCount: number;
	};

	/**
	 * Dispose all resources
	 */
	dispose(): void;
}
