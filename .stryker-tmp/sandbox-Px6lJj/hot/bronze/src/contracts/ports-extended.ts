// @ts-nocheck
import type { PredictedFrame } from './adapter-factory.js';
import type {
	AdapterTarget,
	FSMAction,
	LayoutState,
	PointerEventOut,
	SensorFrame,
	SmoothedFrame,
	TileConfig,
} from './schemas.js';
/**
 * Extended Port Interfaces - Complete W3C Gesture Pipeline
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Web Weaver (Port 1) + Kraken Keeper (Port 6)
 *
 * These ports complete the 7-stage W3C Gesture Pipeline:
 * Stage 1: SensorPort (Port 0) - existing in ports.ts
 * Stage 2: SmootherPort (Port 2) - existing in ports.ts
 * Stage 3: PredictorPort (Port 2.5) - NEW
 * Stage 4: FSMPort (Port 3) - existing in ports.ts
 * Stage 5: EmitterPort (Port 5) - existing in ports.ts
 * Stage 6: TargetRouterPort (Port 1) - NEW (multi-target routing)
 * Stage 7: UIShellPort (Port 7) - enhanced from ports.ts
 *
 * Plus Vacuole-aware wrappers for stigmergy integration.
 */
import type { VacuoleEnvelope } from './vacuole-envelope.js';

// ============================================================================
// PREDICTOR PORT (Stage 3 - Port 2.5)
// ============================================================================

/**
 * Predictor configuration for different algorithms
 */
export interface PredictorConfig {
	/** Algorithm type */
	algorithm: 'kalman' | 'rapier' | 'spring-damper' | 'none';
	/** Lookahead time in ms (default 16ms = 1 frame) */
	lookAheadMs?: number;
	/** Algorithm-specific config */
	params?: {
		// Kalman
		processNoise?: number;
		measurementNoise?: number;
		// Spring-damper
		mass?: number;
		stiffness?: number;
		damping?: number;
		// Rapier
		gravity?: { x: number; y: number };
	};
}

/**
 * Extended PredictorPort with vacuole awareness
 */
export interface PredictorPortVacuole {
	/**
	 * Predict with vacuole envelope passthrough
	 */
	predictWithEnvelope(
		envelope: VacuoleEnvelope<SmoothedFrame>,
		lookAheadMs?: number,
	): VacuoleEnvelope<PredictedFrame>;

	/**
	 * Raw predict (for non-vacuole usage)
	 */
	predict(frame: SmoothedFrame, lookAheadMs?: number): PredictedFrame;

	/**
	 * Reset state
	 */
	reset(): void;

	/**
	 * Update configuration at runtime
	 */
	setConfig(config: Partial<PredictorConfig>): void;

	/**
	 * Get current confidence
	 */
	getConfidence(): number;
}

// ============================================================================
// TARGET ROUTER PORT (Stage 6 - Port 1)
// ============================================================================

/**
 * Target definition for routing pointer events
 */
export interface TargetDefinition {
	/** Unique target ID */
	id: string;
	/** Target type */
	type: 'dom' | 'canvas' | 'iframe' | 'golden-layout' | 'nats' | 'webxr';
	/** Element selector or reference */
	element?: HTMLElement | string;
	/** Bounds for coordinate transform */
	bounds?: DOMRect;
	/** Priority (higher = checked first for hit testing) */
	priority?: number;
	/** Whether target is enabled */
	enabled?: boolean;
	/** NATS subject for remote targets */
	natsSubject?: string;
}

/**
 * TargetRouterPort - Routes pointer events to multiple targets
 *
 * This port enables:
 * - Hit testing across multiple overlapping targets
 * - Routing to local DOM elements
 * - Routing to remote targets via NATS
 * - Golden Layout tile-specific routing
 */
export interface TargetRouterPort {
	/**
	 * Register a target for event routing
	 */
	registerTarget(target: TargetDefinition): void;

	/**
	 * Unregister a target
	 */
	unregisterTarget(id: string): void;

	/**
	 * Get all registered targets
	 */
	getTargets(): TargetDefinition[];

	/**
	 * Route a pointer event to appropriate target(s)
	 * Returns targets that received the event
	 */
	route(event: PointerEventOut): string[];

	/**
	 * Route with vacuole envelope
	 */
	routeWithEnvelope(envelope: VacuoleEnvelope<PointerEventOut>): string[];

	/**
	 * Hit test: which target is at given coordinates?
	 */
	hitTest(x: number, y: number): TargetDefinition | null;

	/**
	 * Set capture to a specific target (all events go there)
	 */
	setCapture(targetId: string): void;

	/**
	 * Release capture
	 */
	releaseCapture(): void;

	/**
	 * Check if a target has capture
	 */
	hasCapture(): string | null;

	/**
	 * Update target bounds (call on resize)
	 */
	updateBounds(targetId: string, bounds: DOMRect): void;

	/**
	 * Enable/disable a target
	 */
	setTargetEnabled(targetId: string, enabled: boolean): void;

	/**
	 * Dispose all targets
	 */
	dispose(): void;
}

// ============================================================================
// ENHANCED UI SHELL PORT (Stage 7 - Port 7)
// ============================================================================

/**
 * Layout action emitted from gesture interactions
 */
export interface LayoutAction {
	type:
		| 'focus'
		| 'split'
		| 'close'
		| 'maximize'
		| 'minimize'
		| 'move'
		| 'resize'
		| 'drag-start'
		| 'drag-move'
		| 'drag-end';
	tileId?: string;
	direction?: 'horizontal' | 'vertical';
	delta?: { x: number; y: number };
	corner?: 'nw' | 'ne' | 'sw' | 'se';
}

/**
 * Gesture binding for UI Shell
 */
export interface GestureBinding {
	/** Gesture pattern to match */
	gesture: 'pinch' | 'palm' | 'fist' | 'point' | 'victory' | 'thumbs-up' | 'thumbs-down';
	/** Modifier: requires dwell, throw direction, etc. */
	modifier?: 'dwell' | 'throw-left' | 'throw-right' | 'throw-up' | 'throw-down';
	/** Action to perform */
	action: LayoutAction['type'];
	/** Additional action parameters */
	params?: Partial<LayoutAction>;
}

/**
 * Enhanced UIShellPort with gesture binding support
 */
export interface UIShellPortEnhanced {
	// === From base UIShellPort ===
	initialize(container: HTMLElement, config: unknown): Promise<void>;
	getTileTarget(tileId: string): AdapterTarget | null;
	getTileIds(): string[];
	addTile(config: TileConfig): void;
	removeTile(tileId: string): void;
	splitTile(tileId: string, direction: 'horizontal' | 'vertical', newTile: TileConfig): void;
	getLayout(): LayoutState;
	setLayout(state: LayoutState): void;
	onLayoutChange(callback: (layout: LayoutState) => void): () => void;
	onTileFocus(callback: (tileId: string) => void): () => void;
	dispose(): void;

	// === Enhanced for gesture integration ===

	/**
	 * Process a gesture event and return layout actions
	 */
	processGesture(event: PointerEventOut, gestures: FSMAction): LayoutAction[];

	/**
	 * Process with vacuole envelope
	 */
	processGestureWithEnvelope(
		envelope: VacuoleEnvelope<{ event: PointerEventOut; gestures: FSMAction }>,
	): VacuoleEnvelope<LayoutAction[]>;

	/**
	 * Register gesture bindings
	 */
	setGestureBindings(bindings: GestureBinding[]): void;

	/**
	 * Get current gesture bindings
	 */
	getGestureBindings(): GestureBinding[];

	/**
	 * Get tile under given coordinates
	 */
	getTileAt(x: number, y: number): string | null;

	/**
	 * Focus a tile
	 */
	focusTile(tileId: string): void;

	/**
	 * Get focused tile ID
	 */
	getFocusedTile(): string | null;

	/**
	 * Start dragging a tile (for gesture-driven dock/undock)
	 */
	startDrag(tileId: string, startPos: { x: number; y: number }): void;

	/**
	 * Update drag position
	 */
	updateDrag(currentPos: { x: number; y: number }): void;

	/**
	 * End drag (commit or cancel based on drop zone)
	 */
	endDrag(finalPos: { x: number; y: number }): boolean;

	/**
	 * Cancel drag
	 */
	cancelDrag(): void;
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
		sense?: SenseEnvelope;
		smooth?: SmoothEnvelope;
		predict?: PredictEnvelope;
		fsm?: FSMEnvelope;
		emit?: EmitEnvelope;
		target?: TargetEnvelope;
		ui?: UIEnvelope;
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

// ============================================================================
// NATS SUBSTRATE INTEGRATION (for vacuole assimilation)
// ============================================================================

/**
 * NATS Substrate Port for distributed pipeline
 *
 * Enables running pipeline stages across different processes/machines
 * by publishing/subscribing envelopes via NATS subjects.
 */
export interface NATSSubstratePort {
	/**
	 * Connect to NATS server
	 */
	connect(url: string): Promise<void>;

	/**
	 * Disconnect from NATS
	 */
	disconnect(): Promise<void>;

	/**
	 * Check if connected
	 */
	readonly isConnected: boolean;

	/**
	 * Publish an envelope to a subject
	 */
	publish<T>(subject: string, envelope: VacuoleEnvelope<T>): Promise<void>;

	/**
	 * Subscribe to a subject
	 */
	subscribe<T>(subject: string, callback: (envelope: VacuoleEnvelope<T>) => void): () => void;

	/**
	 * Request-reply pattern (for synchronous remote calls)
	 */
	request<TReq, TRes>(
		subject: string,
		envelope: VacuoleEnvelope<TReq>,
		timeoutMs?: number,
	): Promise<VacuoleEnvelope<TRes>>;

	/**
	 * Get JetStream context (for persistent messaging)
	 */
	getJetStream(): unknown; // NATS JetStream type

	/**
	 * Get KV store (for shared state)
	 */
	getKV(bucket: string): unknown; // NATS KV type
}
