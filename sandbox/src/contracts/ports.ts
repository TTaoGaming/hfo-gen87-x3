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
// FACTORY TYPES
// For dependency injection
// ============================================================================

export interface PortFactory {
	createSensor(): SensorPort;
	createSmoother(): SmootherPort;
	createFSM(): FSMPort;
	createEmitter(): EmitterPort;
	createAdapter(target: AdapterTarget): AdapterPort;
}
