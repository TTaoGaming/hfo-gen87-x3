/**
 * SENSE Adapters - Port 0 (@0) - Lidless Legion
 *
 * Gen87.X3 | "How do we SENSE the SENSE?"
 *
 * 6 ADAPTERS:
 * 1. CameraAdapter - WebRTC getUserMedia
 * 2. CameraSettingsAdapter - Resolution, FPS, facing mode
 * 3. MediaPipelineAdapter - MediaPipe task runner
 * 4. MediaPipelineSettingsAdapter - Model complexity, smoothing
 * 5. GestureRecognizerAdapter - Gesture classification
 * 6. GestureRecognizerSettingsAdapter - Detection thresholds
 *
 * BEHAVIORAL CONTRACT (Galois Lattice Port 0):
 * - CAN: read, tag, observe, snapshot
 * - CANNOT: modify_data, transform, persist, make_decisions, emit_output
 *
 * Settings are tagged and passed to Kraken Keeper (Port 6) for persistence.
 */

import { z } from 'zod';

// ============================================================================
// SHARED TYPES
// ============================================================================

/** W3C Trace Context for CloudEvents integration */
export interface SenseTraceContext {
	traceparent?: string;
	tracestate?: string;
}

/** Port 0 tag - applied to all sensed data */
export interface SenseTag {
	_port: 0;
	_verb: 'SENSE';
	_timestamp: string;
	_frameId: number;
	_source: string;
}

/** Create a sense tag */
export function createSenseTag(source: string, frameId: number): SenseTag {
	return {
		_port: 0,
		_verb: 'SENSE',
		_timestamp: new Date().toISOString(),
		_frameId: frameId,
		_source: source,
	};
}

// ============================================================================
// 1. CAMERA ADAPTER
// ============================================================================

/** Camera stream state */
export type CameraState = 'idle' | 'requesting' | 'active' | 'error' | 'stopped';

/** Camera adapter interface */
export interface CameraAdapter {
	readonly state: CameraState;
	readonly stream: MediaStream | null;
	readonly videoElement: HTMLVideoElement | null;

	/** Request camera access */
	start(settings: CameraSettings): Promise<CameraResult>;

	/** Stop camera stream */
	stop(): void;

	/** Get current frame as ImageData */
	captureFrame(): ImageData | null;

	/** Subscribe to state changes */
	onStateChange(callback: (state: CameraState) => void): () => void;
}

/** Camera result - tagged with Port 0 metadata */
export interface CameraResult {
	success: boolean;
	error?: string;
	tag: SenseTag;
	capabilities?: MediaTrackCapabilities;
}

// ============================================================================
// 2. CAMERA SETTINGS ADAPTER
// ============================================================================

/** Camera settings schema */
export const CameraSettingsSchema = z.object({
	/** Video width constraint */
	width: z.number().int().min(160).max(4096).default(1280),

	/** Video height constraint */
	height: z.number().int().min(120).max(2160).default(720),

	/** Frame rate constraint */
	frameRate: z.number().min(1).max(120).default(30),

	/** Facing mode: user (front) or environment (back) */
	facingMode: z.enum(['user', 'environment']).default('user'),

	/** Device ID for specific camera selection */
	deviceId: z.string().optional(),

	/** Enable auto-focus */
	autoFocus: z.boolean().default(true),
});

export type CameraSettings = z.infer<typeof CameraSettingsSchema>;

/** Default camera settings */
export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
	width: 1280,
	height: 720,
	frameRate: 30,
	facingMode: 'user',
	autoFocus: true,
};

/** Camera settings adapter interface */
export interface CameraSettingsAdapter {
	readonly current: CameraSettings;

	/** Get settings as MediaStreamConstraints */
	toConstraints(): MediaStreamConstraints;

	/** Update settings (creates new copy - immutable) */
	update(partial: Partial<CameraSettings>): CameraSettings;

	/** Validate settings */
	validate(settings: unknown): CameraSettings;

	/** Tag settings for Kraken Keeper storage */
	tag(): { settings: CameraSettings; tag: SenseTag };
}

// ============================================================================
// 3. MEDIA PIPELINE ADAPTER
// ============================================================================

/** MediaPipe pipeline state */
export type PipelineState = 'uninitialized' | 'loading' | 'ready' | 'processing' | 'error';

/** Normalized landmark from MediaPipe */
export interface NormalizedLandmark {
	x: number; // 0-1 normalized
	y: number; // 0-1 normalized
	z: number; // depth (negative = towards camera)
}

/** Hand landmark indices (MediaPipe standard) */
export const LANDMARK_INDEX = {
	WRIST: 0,
	THUMB_CMC: 1,
	THUMB_MCP: 2,
	THUMB_IP: 3,
	THUMB_TIP: 4,
	INDEX_MCP: 5,
	INDEX_PIP: 6,
	INDEX_DIP: 7,
	INDEX_TIP: 8,
	MIDDLE_MCP: 9,
	MIDDLE_PIP: 10,
	MIDDLE_DIP: 11,
	MIDDLE_TIP: 12,
	RING_MCP: 13,
	RING_PIP: 14,
	RING_DIP: 15,
	RING_TIP: 16,
	PINKY_MCP: 17,
	PINKY_PIP: 18,
	PINKY_DIP: 19,
	PINKY_TIP: 20,
} as const;

/** Hand connections for visualization */
export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
	// Thumb
	[0, 1], [1, 2], [2, 3], [3, 4],
	// Index
	[0, 5], [5, 6], [6, 7], [7, 8],
	// Middle
	[0, 9], [9, 10], [10, 11], [11, 12],
	// Ring
	[0, 13], [13, 14], [14, 15], [15, 16],
	// Pinky
	[0, 17], [17, 18], [18, 19], [19, 20],
	// Palm
	[5, 9], [9, 13], [13, 17],
];

/** Raw pipeline result - unprocessed MediaPipe output */
export interface PipelineResult {
	/** Detection timestamp */
	timestamp: number;

	/** Hand landmarks (up to 2 hands) */
	landmarks: NormalizedLandmark[][];

	/** World landmarks (3D space) */
	worldLandmarks: NormalizedLandmark[][];

	/** Handedness for each detected hand */
	handedness: Array<{ label: 'Left' | 'Right'; score: number }>;

	/** Port 0 tag */
	tag: SenseTag;
}

/** Media pipeline adapter interface */
export interface MediaPipelineAdapter {
	readonly state: PipelineState;
	readonly modelLoaded: boolean;

	/** Initialize the pipeline with WASM */
	initialize(settings: MediaPipelineSettings): Promise<void>;

	/** Process a video frame */
	processFrame(video: HTMLVideoElement, timestamp: number): PipelineResult | null;

	/** Dispose resources */
	dispose(): void;

	/** Subscribe to state changes */
	onStateChange(callback: (state: PipelineState) => void): () => void;
}

// ============================================================================
// 4. MEDIA PIPELINE SETTINGS ADAPTER
// ============================================================================

/** MediaPipe model complexity */
export type ModelComplexity = 0 | 1 | 2;

/** Media pipeline settings schema */
export const MediaPipelineSettingsSchema = z.object({
	/** Model complexity: 0=lite, 1=full, 2=heavy */
	modelComplexity: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(1),

	/** Maximum number of hands to detect */
	maxNumHands: z.number().int().min(1).max(4).default(2),

	/** Minimum detection confidence */
	minDetectionConfidence: z.number().min(0).max(1).default(0.5),

	/** Minimum tracking confidence */
	minTrackingConfidence: z.number().min(0).max(1).default(0.5),

	/** WASM path for MediaPipe */
	wasmPath: z.string().default('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'),

	/** Model asset path */
	modelAssetPath: z.string().default(
		'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
	),

	/** Use GPU delegate if available */
	useGpu: z.boolean().default(true),

	/** Running mode: VIDEO for streaming, IMAGE for single frame */
	runningMode: z.enum(['VIDEO', 'IMAGE']).default('VIDEO'),
});

export type MediaPipelineSettings = z.infer<typeof MediaPipelineSettingsSchema>;

/** Default pipeline settings */
export const DEFAULT_PIPELINE_SETTINGS: MediaPipelineSettings = {
	modelComplexity: 1,
	maxNumHands: 2,
	minDetectionConfidence: 0.5,
	minTrackingConfidence: 0.5,
	wasmPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
	modelAssetPath:
		'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
	useGpu: true,
	runningMode: 'VIDEO',
};

/** Media pipeline settings adapter interface */
export interface MediaPipelineSettingsAdapter {
	readonly current: MediaPipelineSettings;

	/** Update settings (immutable) */
	update(partial: Partial<MediaPipelineSettings>): MediaPipelineSettings;

	/** Validate settings */
	validate(settings: unknown): MediaPipelineSettings;

	/** Tag settings for Kraken Keeper storage */
	tag(): { settings: MediaPipelineSettings; tag: SenseTag };
}

// ============================================================================
// 5. GESTURE RECOGNIZER ADAPTER
// ============================================================================

/** MediaPipe gesture categories */
export type GestureCategory =
	| 'None'
	| 'Closed_Fist'
	| 'Open_Palm'
	| 'Pointing_Up'
	| 'Thumb_Down'
	| 'Thumb_Up'
	| 'Victory'
	| 'ILoveYou';

/** Gesture recognition result for a single hand */
export interface GestureResult {
	/** Detected gesture category */
	gesture: GestureCategory;

	/** Confidence score 0-1 */
	confidence: number;

	/** Which hand */
	handedness: 'Left' | 'Right';

	/** Hand index in landmarks array */
	handIndex: number;
}

/** Full gesture recognition frame */
export interface GestureFrame {
	/** Frame timestamp */
	timestamp: number;

	/** Detected gestures (one per hand) */
	gestures: GestureResult[];

	/** Landmarks for each hand */
	landmarks: NormalizedLandmark[][];

	/** Port 0 tag */
	tag: SenseTag;

	/** Whether any hand was detected */
	detected: boolean;

	/** Number of hands detected */
	handCount: number;
}

/** Gesture recognizer adapter interface */
export interface GestureRecognizerAdapter {
	readonly modelLoaded: boolean;

	/** Initialize with settings */
	initialize(settings: GestureRecognizerSettings): Promise<void>;

	/** Recognize gestures from video frame */
	recognize(video: HTMLVideoElement, timestamp: number): GestureFrame | null;

	/** Dispose resources */
	dispose(): void;
}

// ============================================================================
// 6. GESTURE RECOGNIZER SETTINGS ADAPTER
// ============================================================================

/** Gesture recognizer settings schema */
export const GestureRecognizerSettingsSchema = z.object({
	/** Minimum gesture confidence to report */
	minGestureConfidence: z.number().min(0).max(1).default(0.5),

	/** Minimum hand presence confidence */
	minHandPresenceConfidence: z.number().min(0).max(1).default(0.5),

	/** Maximum number of hands */
	maxNumHands: z.number().int().min(1).max(4).default(2),

	/** Model asset path for gesture recognizer */
	modelAssetPath: z.string().default(
		'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'
	),

	/** WASM path */
	wasmPath: z.string().default('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'),

	/** Use GPU if available */
	useGpu: z.boolean().default(true),

	/** Running mode */
	runningMode: z.enum(['VIDEO', 'IMAGE']).default('VIDEO'),

	/** Custom gesture model path (optional) */
	customModelPath: z.string().optional(),
});

export type GestureRecognizerSettings = z.infer<typeof GestureRecognizerSettingsSchema>;

/** Default gesture recognizer settings */
export const DEFAULT_GESTURE_SETTINGS: GestureRecognizerSettings = {
	minGestureConfidence: 0.5,
	minHandPresenceConfidence: 0.5,
	maxNumHands: 2,
	modelAssetPath:
		'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
	wasmPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
	useGpu: true,
	runningMode: 'VIDEO',
};

/** Gesture recognizer settings adapter interface */
export interface GestureRecognizerSettingsAdapter {
	readonly current: GestureRecognizerSettings;

	/** Update settings (immutable) */
	update(partial: Partial<GestureRecognizerSettings>): GestureRecognizerSettings;

	/** Validate settings */
	validate(settings: unknown): GestureRecognizerSettings;

	/** Tag settings for Kraken Keeper storage */
	tag(): { settings: GestureRecognizerSettings; tag: SenseTag };
}

// ============================================================================
// COMPOSITE SENSE PORT (All 6 adapters)
// ============================================================================

/** Complete SENSE port combining all adapters */
export interface SensePort {
	readonly portNumber: 0;

	/** Camera adapter */
	camera: CameraAdapter;
	cameraSettings: CameraSettingsAdapter;

	/** Media pipeline adapter */
	pipeline: MediaPipelineAdapter;
	pipelineSettings: MediaPipelineSettingsAdapter;

	/** Gesture recognizer adapter */
	gestureRecognizer: GestureRecognizerAdapter;
	gestureSettings: GestureRecognizerSettingsAdapter;

	/** Initialize all adapters */
	initialize(): Promise<void>;

	/** Start sensing (camera + pipeline) */
	start(): Promise<void>;

	/** Stop sensing */
	stop(): void;

	/** Get current frame with all data */
	sense(): GestureFrame | null;

	/** Health check */
	heartbeat(): Promise<{
		healthy: boolean;
		timestamp: string;
		adapters: {
			camera: CameraState;
			pipeline: PipelineState;
			gestureRecognizer: boolean;
		};
	}>;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/** Create default camera settings adapter */
export function createCameraSettingsAdapter(
	initial: Partial<CameraSettings> = {}
): CameraSettingsAdapter {
	let current = CameraSettingsSchema.parse({ ...DEFAULT_CAMERA_SETTINGS, ...initial });
	let frameCounter = 0;

	return {
		get current() {
			return current;
		},

		toConstraints(): MediaStreamConstraints {
			const videoConstraints: MediaTrackConstraints = {
				width: { ideal: current.width },
				height: { ideal: current.height },
				frameRate: { ideal: current.frameRate },
				facingMode: current.facingMode,
			};

			if (current.deviceId) {
				videoConstraints.deviceId = { exact: current.deviceId };
			}

			return {
				video: videoConstraints,
				audio: false,
			};
		},

		update(partial: Partial<CameraSettings>): CameraSettings {
			current = CameraSettingsSchema.parse({ ...current, ...partial });
			return current;
		},

		validate(settings: unknown): CameraSettings {
			return CameraSettingsSchema.parse(settings);
		},

		tag(): { settings: CameraSettings; tag: SenseTag } {
			return {
				settings: current,
				tag: createSenseTag('camera-settings', frameCounter++),
			};
		},
	};
}

/** Create default pipeline settings adapter */
export function createPipelineSettingsAdapter(
	initial: Partial<MediaPipelineSettings> = {}
): MediaPipelineSettingsAdapter {
	let current = MediaPipelineSettingsSchema.parse({ ...DEFAULT_PIPELINE_SETTINGS, ...initial });
	let frameCounter = 0;

	return {
		get current() {
			return current;
		},

		update(partial: Partial<MediaPipelineSettings>): MediaPipelineSettings {
			current = MediaPipelineSettingsSchema.parse({ ...current, ...partial });
			return current;
		},

		validate(settings: unknown): MediaPipelineSettings {
			return MediaPipelineSettingsSchema.parse(settings);
		},

		tag(): { settings: MediaPipelineSettings; tag: SenseTag } {
			return {
				settings: current,
				tag: createSenseTag('pipeline-settings', frameCounter++),
			};
		},
	};
}

/** Create default gesture settings adapter */
export function createGestureSettingsAdapter(
	initial: Partial<GestureRecognizerSettings> = {}
): GestureRecognizerSettingsAdapter {
	let current = GestureRecognizerSettingsSchema.parse({ ...DEFAULT_GESTURE_SETTINGS, ...initial });
	let frameCounter = 0;

	return {
		get current() {
			return current;
		},

		update(partial: Partial<GestureRecognizerSettings>): GestureRecognizerSettings {
			current = GestureRecognizerSettingsSchema.parse({ ...current, ...partial });
			return current;
		},

		validate(settings: unknown): GestureRecognizerSettings {
			return GestureRecognizerSettingsSchema.parse(settings);
		},

		tag(): { settings: GestureRecognizerSettings; tag: SenseTag } {
			return {
				settings: current,
				tag: createSenseTag('gesture-settings', frameCounter++),
			};
		},
	};
}

// ============================================================================
// PALM ORIENTATION UTILITIES (Port 0 observes, doesn't transform)
// ============================================================================

/**
 * Calculate palm normal vector from landmarks
 * This is a READ-ONLY observation - no transformation
 */
export function observePalmNormal(
	landmarks: NormalizedLandmark[]
): { x: number; y: number; z: number } | null {
	if (landmarks.length < 21) return null;

	const wrist = landmarks[LANDMARK_INDEX.WRIST];
	const indexMcp = landmarks[LANDMARK_INDEX.INDEX_MCP];
	const pinkyMcp = landmarks[LANDMARK_INDEX.PINKY_MCP];

	if (!wrist || !indexMcp || !pinkyMcp) return null;

	// Vector from wrist to index MCP
	const v1 = {
		x: indexMcp.x - wrist.x,
		y: indexMcp.y - wrist.y,
		z: indexMcp.z - wrist.z,
	};

	// Vector from wrist to pinky MCP
	const v2 = {
		x: pinkyMcp.x - wrist.x,
		y: pinkyMcp.y - wrist.y,
		z: pinkyMcp.z - wrist.z,
	};

	// Cross product gives palm normal
	const normal = {
		x: v1.y * v2.z - v1.z * v2.y,
		y: v1.z * v2.x - v1.x * v2.z,
		z: v1.x * v2.y - v1.y * v2.x,
	};

	// Normalize
	const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
	if (length < 0.0001) return null;

	return {
		x: normal.x / length,
		y: normal.y / length,
		z: normal.z / length,
	};
}

/**
 * Observe palm angle relative to camera (0 = facing camera, 180 = facing away)
 * This is a READ-ONLY observation for the FSM to use in decisions
 */
export function observePalmAngle(landmarks: NormalizedLandmark[]): number | null {
	const normal = observePalmNormal(landmarks);
	if (!normal) return null;

	// Camera looks down -Z axis, so palm facing camera has normal pointing +Z
	// Dot product with (0, 0, 1) gives cos(angle)
	const dotProduct = normal.z;

	// Convert to degrees (0-180)
	const angleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
	return (angleRad * 180) / Math.PI;
}

/**
 * Observe index fingertip position
 * This is the pointer position - READ ONLY
 */
export function observeIndexFingertip(
	landmarks: NormalizedLandmark[]
): NormalizedLandmark | null {
	if (landmarks.length < 21) return null;
	return landmarks[LANDMARK_INDEX.INDEX_TIP] ?? null;
}
