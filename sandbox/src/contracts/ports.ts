/**
 * W3C Gesture Control Plane - Port Interfaces
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | CDD Port Definitions
 *
 * PRINCIPLE: Ports define WHAT, Adapters define HOW
 * These interfaces enable dependency injection and testability.
 */
import type {
	AdapterTarget,
	FSMAction,
	PointerEventOut,
	SensorFrame,
	SmoothedFrame,
} from './schemas.js';

// ============================================================================
// PORT 0: SENSOR PORT (SENSE)
// Observes video frames and produces gesture detection results
// Implemented by: MediaPipeAdapter
// ============================================================================

export interface SensorPort {
	/**
	 * Initialize the sensor (load ML model, etc.)
	 * Must be called before sense()
	 */
	initialize(): Promise<void>;

	/**
	 * Process a video frame and detect gestures
	 * @param video - HTMLVideoElement to process
	 * @param timestamp - Performance.now() timestamp
	 * @returns Validated SensorFrame
	 */
	sense(video: HTMLVideoElement, timestamp: number): Promise<SensorFrame>;

	/**
	 * Release resources
	 */
	dispose(): void;

	/**
	 * Check if sensor is ready
	 */
	readonly isReady: boolean;
}

// ============================================================================
// PORT 2: SMOOTHER PORT (SHAPE)
// Applies 1€ filter to reduce jitter while maintaining responsiveness
// Implemented by: OneEuroAdapter
// ============================================================================

export interface SmootherPort {
	/**
	 * Apply smoothing filter to sensor frame
	 * @param frame - Raw sensor frame
	 * @returns Smoothed frame with filtered position and velocity
	 */
	smooth(frame: SensorFrame): SmoothedFrame;

	/**
	 * Reset filter state (call when tracking is lost)
	 */
	reset(): void;

	/**
	 * Update filter parameters at runtime
	 */
	setParams(mincutoff: number, beta: number): void;
}

// ============================================================================
// PORT 3: FSM PORT (DELIVER)
// Manages gesture state machine and determines pointer actions
// Implemented by: XStateFSMAdapter
// ============================================================================

export interface FSMPort {
	/**
	 * Process smoothed frame through state machine
	 * @param frame - Smoothed gesture frame
	 * @returns Action to take (pointer event type and coords)
	 */
	process(frame: SmoothedFrame): FSMAction;

	/**
	 * Get current FSM state
	 */
	getState(): string;

	/**
	 * Force transition to DISARMED state
	 */
	disarm(): void;

	/**
	 * Subscribe to state changes
	 */
	subscribe(callback: (state: string, action: FSMAction) => void): () => void;
}

// ============================================================================
// PORT 5: EMITTER PORT (DEFEND)
// Converts FSM actions to W3C PointerEvent objects
// Implemented by: PointerEventAdapter
// ============================================================================

export interface EmitterPort {
	/**
	 * Convert FSM action to PointerEvent descriptor
	 * @param action - FSM action with coordinates
	 * @param target - Target bounds for coordinate mapping
	 * @returns Validated PointerEventOut
	 */
	emit(action: FSMAction, target: AdapterTarget): PointerEventOut | null;

	/**
	 * Get the pointerId being used
	 */
	readonly pointerId: number;
}

// ============================================================================
// ADAPTER PORT (INJECT)
// Injects synthetic PointerEvents into DOM targets
// Implemented by: DOMAdapter, CanvasAdapter, IframeAdapter
// ============================================================================

export interface AdapterPort {
	/**
	 * Inject a pointer event into the target
	 * @param event - PointerEventOut descriptor
	 * @returns true if successfully dispatched
	 */
	inject(event: PointerEventOut): boolean;

	/**
	 * Get current target bounds
	 */
	getBounds(): AdapterTarget['bounds'];

	/**
	 * Set pointer capture on target element
	 */
	setCapture(): void;

	/**
	 * Release pointer capture
	 */
	releaseCapture(): void;

	/**
	 * Check if target has pointer capture
	 */
	hasCapture(): boolean;
}

// ============================================================================
// PIPELINE PORT (Composition)
// Wires all ports together
// ============================================================================

export interface PipelinePort {
	/**
	 * Start processing video frames
	 */
	start(): Promise<void>;

	/**
	 * Stop processing
	 */
	stop(): void;

	/**
	 * Process a single frame (for testing)
	 */
	processFrame(video: HTMLVideoElement, timestamp: number): Promise<FSMAction>;

	/**
	 * Subscribe to pipeline events
	 */
	subscribe(callback: (event: PointerEventOut | null) => void): () => void;

	/**
	 * Check if pipeline is running
	 */
	readonly isRunning: boolean;
}

// ============================================================================
// OVERLAY PORT (Cursor Visualization)
// Ref: specs/W3C_POINTER_GESTURE_CONTROL_PLANE_20251230.md Section 8
// Implemented by: PixiOverlay, Canvas2DOverlay, DOMOverlay
// ============================================================================

export interface OverlayPort {
	/**
	 * Initialize the overlay (create canvas, load assets)
	 */
	initialize(container: HTMLElement): Promise<void>;

	/**
	 * Update cursor position and state
	 * @param raw - Raw (unfiltered) position (normalized 0-1)
	 * @param smoothed - Smoothed position (normalized 0-1)
	 * @param predicted - Predicted position (normalized 0-1, optional)
	 * @param state - Current cursor state
	 */
	setCursor(
		raw: { x: number; y: number } | null,
		smoothed: { x: number; y: number } | null,
		predicted: { x: number; y: number } | null,
		state: import('./schemas.js').CursorState,
	): void;

	/**
	 * Update hand skeleton visualization
	 * @param landmarks - 21 hand landmarks (normalized 0-1) or null to hide
	 */
	setLandmarks(landmarks: import('./schemas.js').NormalizedLandmark[] | null): void;

	/**
	 * Show/hide the overlay
	 */
	setVisible(visible: boolean): void;

	/**
	 * Update overlay configuration
	 */
	setConfig(config: Partial<import('./schemas.js').OverlayConfig>): void;

	/**
	 * Get overlay bounds (for coordinate mapping)
	 */
	getBounds(): { width: number; height: number };

	/**
	 * Dispose resources
	 */
	dispose(): void;
}

// ============================================================================
// UI SHELL PORT (Window Manager / Tiling Layout)
// Ref: specs/W3C_POINTER_GESTURE_CONTROL_PLANE_20251230.md Section 11
// Implemented by: MosaicShell, GoldenLayoutShell, DaedalOSShell, RawHTMLShell
// ============================================================================

export interface UIShellPort {
	/**
	 * Initialize the shell with configuration
	 */
	initialize(
		container: HTMLElement,
		config: import('./schemas.js').UIShellConfig,
	): Promise<void>;

	/**
	 * Get the target element/canvas for a tile
	 * Used to wire up AdapterPort for each tile
	 */
	getTileTarget(tileId: string): AdapterTarget | null;

	/**
	 * Get all tile IDs
	 */
	getTileIds(): string[];

	/**
	 * Add a new tile
	 */
	addTile(config: import('./schemas.js').TileConfig): void;

	/**
	 * Remove a tile
	 */
	removeTile(tileId: string): void;

	/**
	 * Split a tile
	 */
	splitTile(
		tileId: string,
		direction: 'horizontal' | 'vertical',
		newTile: import('./schemas.js').TileConfig,
	): void;

	/**
	 * Get current layout state (for serialization)
	 */
	getLayout(): import('./schemas.js').LayoutState;

	/**
	 * Set layout state (for deserialization)
	 */
	setLayout(state: import('./schemas.js').LayoutState): void;

	/**
	 * Subscribe to layout changes
	 */
	onLayoutChange(callback: (layout: import('./schemas.js').LayoutState) => void): () => void;

	/**
	 * Subscribe to tile focus changes
	 */
	onTileFocus(callback: (tileId: string) => void): () => void;

	/**
	 * Dispose resources
	 */
	dispose(): void;
}

// ============================================================================
// FACTORY TYPES
// For dependency injection
// ============================================================================

export interface PortFactory {
	createSensor(): SensorPort;
	createSmoother(): SmootherPort;
	createFSM(): FSMPort;
	createEmitter(): EmitterPort;
	createAdapter(target: AdapterTarget): AdapterPort;
	createOverlay(type: import('./schemas.js').OverlayConfig): OverlayPort;
	createShell(type: import('./schemas.js').ShellType): UIShellPort;
}
