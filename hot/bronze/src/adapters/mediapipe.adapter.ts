/**
 * MediaPipe Gesture Recognizer Adapter
 *
 * Gen87.X3 | Port 0 (SENSE) | Implements SensorPort
 *
 * EXEMPLAR SOURCE: https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
 * Grounded: Tavily research 2025-12-29
 */
import type { SensorPort } from '../contracts/ports.js';
import { type GestureLabel, type SensorFrame, SensorFrameSchema } from '../contracts/schemas.js';

// MediaPipe types (from @mediapipe/tasks-vision)
interface GestureRecognizerResult {
	landmarks: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>;
	worldLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
	handedness: Array<Array<{ categoryName: string; score: number }>>;
	gestures: Array<Array<{ categoryName: string; score: number }>>;
}

interface GestureRecognizer {
	recognizeForVideo(video: HTMLVideoElement, timestamp: number): GestureRecognizerResult;
	close(): void;
}

// Lazy import for MediaPipe (tree-shaking friendly)
let GestureRecognizerClass: {
	createFromOptions(vision: unknown, options: unknown): Promise<GestureRecognizer>;
} | null = null;

let FilesetResolverClass: {
	forVisionTasks(wasmPath: string): Promise<unknown>;
} | null = null;

/**
 * Palm facing detection using landmark geometry
 * Source: Gen 83, REF__W3C_GESTURE_CONTROL_PLANE_GOLD_BATON.md
 */
function isPalmFacing(landmarks: Array<{ x: number; y: number; z: number }>): boolean {
	if (landmarks.length < 21) return false;

	// Palm normal: cross product of (wrist→middle_mcp) × (wrist→index_mcp)
	const wrist = landmarks[0];
	const indexMcp = landmarks[5];
	const middleMcp = landmarks[9];

	// Guard against undefined landmarks
	if (!wrist || !indexMcp || !middleMcp) {
		return false;
	}

	// Vector from wrist to index MCP
	const v1 = {
		x: indexMcp.x - wrist.x,
		y: indexMcp.y - wrist.y,
		z: indexMcp.z - wrist.z,
	};

	// Vector from wrist to middle MCP
	const v2 = {
		x: middleMcp.x - wrist.x,
		y: middleMcp.y - wrist.y,
		z: middleMcp.z - wrist.z,
	};

	// Cross product gives palm normal
	const normal = {
		x: v1.y * v2.z - v1.z * v2.y,
		y: v1.z * v2.x - v1.x * v2.z,
		z: v1.x * v2.y - v1.y * v2.x,
	};

	// Palm faces camera if z-component of normal is negative
	// (in MediaPipe's coordinate system, -z is towards camera)
	return normal.z < 0;
}

/**
 * MediaPipe Gesture Recognizer Adapter
 * Implements SensorPort interface with CDD validation
 */
export class MediaPipeAdapter implements SensorPort {
	private recognizer: GestureRecognizer | null = null;
	private _isReady = false;

	constructor(
		private readonly modelPath: string = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
		private readonly wasmPath: string = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
	) {}

	get isReady(): boolean {
		return this._isReady;
	}

	async initialize(): Promise<void> {
		if (this._isReady) return;

		// Dynamic import for tree-shaking
		const vision = await import('@mediapipe/tasks-vision');
		GestureRecognizerClass = vision.GestureRecognizer;
		FilesetResolverClass = vision.FilesetResolver;

		const filesetResolver = await FilesetResolverClass.forVisionTasks(this.wasmPath);

		this.recognizer = await GestureRecognizerClass.createFromOptions(filesetResolver, {
			baseOptions: {
				modelAssetPath: this.modelPath,
				delegate: 'GPU',
			},
			runningMode: 'VIDEO',
			numHands: 1, // Single hand for gesture control
		});

		this._isReady = true;
	}

	async sense(video: HTMLVideoElement, timestamp: number): Promise<SensorFrame> {
		if (!this.recognizer) {
			throw new Error('MediaPipeAdapter not initialized. Call initialize() first.');
		}

		const result = this.recognizer.recognizeForVideo(video, timestamp);

		// Transform MediaPipe result to SensorFrame
		const frame = this.transformResult(result, timestamp);

		// CDD: Validate output at port boundary
		return SensorFrameSchema.parse(frame);
	}

	private transformResult(result: GestureRecognizerResult, timestamp: number): SensorFrame {
		// No hands detected
		if (result.landmarks.length === 0 || result.gestures.length === 0) {
			return {
				ts: timestamp,
				handId: 'none',
				trackingOk: false,
				palmFacing: false,
				label: 'None',
				confidence: 0,
				indexTip: null,
				landmarks: null,
			};
		}

		// Get first hand's data
		const landmarks = result.landmarks[0];
		const gesture = result.gestures[0]?.[0];
		const handedness = result.handedness[0]?.[0];

		// Guard against missing landmarks
		if (!landmarks || landmarks.length < 21) {
			return {
				ts: timestamp,
				handId: 'none',
				trackingOk: false,
				palmFacing: false,
				label: 'None',
				confidence: 0,
				indexTip: null,
				landmarks: null,
			};
		}

		// Index finger tip is landmark 8
		const indexTip = landmarks[8];
		if (!indexTip) {
			return {
				ts: timestamp,
				handId: 'none',
				trackingOk: false,
				palmFacing: false,
				label: 'None',
				confidence: 0,
				indexTip: null,
				landmarks: null,
			};
		}

		// Determine gesture label (map MediaPipe names to our enum)
		const label = (gesture?.categoryName as GestureLabel) || 'None';
		const confidence = gesture?.score ?? 0;

		return {
			ts: timestamp,
			handId: (handedness?.categoryName?.toLowerCase() as 'left' | 'right') || 'right',
			trackingOk: true,
			palmFacing: isPalmFacing(landmarks),
			label,
			confidence,
			indexTip: {
				x: indexTip.x,
				y: indexTip.y,
				z: indexTip.z,
				visibility: indexTip.visibility,
			},
			landmarks: landmarks.map((l) => ({
				x: l.x,
				y: l.y,
				z: l.z,
				visibility: l.visibility,
			})),
		};
	}

	dispose(): void {
		if (this.recognizer) {
			this.recognizer.close();
			this.recognizer = null;
			this._isReady = false;
		}
	}
}

/**
 * Mock adapter for testing (no MediaPipe dependency)
 */
export class MockSensorAdapter implements SensorPort {
	private _isReady = false;
	private mockFrames: SensorFrame[] = [];
	private frameIndex = 0;

	get isReady(): boolean {
		return this._isReady;
	}

	async initialize(): Promise<void> {
		this._isReady = true;
	}

	/**
	 * Load mock frames for testing
	 */
	loadMockFrames(frames: SensorFrame[]): void {
		this.mockFrames = frames;
		this.frameIndex = 0;
	}

	async sense(_video: HTMLVideoElement, timestamp: number): Promise<SensorFrame> {
		if (this.mockFrames.length === 0) {
			return SensorFrameSchema.parse({
				ts: timestamp,
				handId: 'none',
				trackingOk: false,
				palmFacing: false,
				label: 'None',
				confidence: 0,
				indexTip: null,
				landmarks: null,
			});
		}

		const frame = {
			...this.mockFrames[this.frameIndex % this.mockFrames.length],
			ts: timestamp,
		};
		this.frameIndex++;

		return SensorFrameSchema.parse(frame);
	}

	dispose(): void {
		this._isReady = false;
		this.mockFrames = [];
		this.frameIndex = 0;
	}
}
