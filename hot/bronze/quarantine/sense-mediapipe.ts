/**
 * Port 0: SENSE - MediaPipe Adapter
 * ===================================
 * Lidless Legion - "How do we SENSE the SENSE?"
 *
 * BEHAVIORAL CONTRACT (Galois Lattice Port 0):
 * - CAPABILITIES: read, tag, observe, snapshot
 * - PROHIBITIONS: modify_data, transform, persist, make_decisions, emit_output
 *
 * This adapter ONLY senses. It does NOT modify the MediaPipe data.
 * It may tag with metadata (timestamps, source info) but raw gesture data is untouched.
 */

import { z } from 'zod';
import type { SensePort, SenseInput, SenseResult, HFOPortMetadata } from '../contracts/hfo-ports.js';
import { PORT_METADATA } from '../contracts/hfo-ports.js';

// ============================================================================
// MEDIAPIPE TYPES (loaded from CDN in browser)
// ============================================================================

declare const vision: {
	GestureRecognizer: {
		createFromOptions: (
			wasmFileset: unknown,
			options: unknown
		) => Promise<GestureRecognizerInstance>;
	};
	FilesetResolver: {
		forVisionTasks: (wasmPath: string) => Promise<unknown>;
	};
	DrawingUtils: new (ctx: CanvasRenderingContext2D) => DrawingUtilsInstance;
};

interface GestureRecognizerInstance {
	recognizeForVideo: (video: HTMLVideoElement, timestamp: number) => GestureRecognizerResult;
	setOptions: (options: unknown) => void;
}

interface DrawingUtilsInstance {
	drawConnectors: (landmarks: NormalizedLandmark[], connections: number[][], style: unknown) => void;
	drawLandmarks: (landmarks: NormalizedLandmark[], style: unknown) => void;
}

interface GestureRecognizerResult {
	landmarks: NormalizedLandmark[][];
	gestures: Array<Array<{ categoryName: string; score: number }>>;
	handedness: Array<Array<{ categoryName: string }>>;
}

interface NormalizedLandmark {
	x: number;
	y: number;
	z: number;
}

// ============================================================================
// SENSE OUTPUT SCHEMA (what Port 0 emits - READ ONLY, TAGGED)
// ============================================================================

/** Raw gesture frame - untouched from MediaPipe, only tagged with metadata */
export const SensedGestureFrameSchema = z.object({
	// === TAGS (added by Port 0) ===
	_port: z.literal(0),
	_verb: z.literal('SENSE'),
	_timestamp: z.string(),
	_source: z.literal('mediapipe'),
	_frameId: z.number(),

	// === RAW DATA (untouched from MediaPipe) ===
	detected: z.boolean(),
	landmarks: z.array(
		z.object({
			x: z.number(),
			y: z.number(),
			z: z.number(),
		})
	),
	gesture: z.string(),
	confidence: z.number(),
	handedness: z.string().optional(),
});

export type SensedGestureFrame = z.infer<typeof SensedGestureFrameSchema>;

// Hand connections for drawing (reference, not modification)
const HAND_CONNECTIONS = [
	[0, 1], [1, 2], [2, 3], [3, 4],
	[0, 5], [5, 6], [6, 7], [7, 8],
	[0, 9], [9, 10], [10, 11], [11, 12],
	[0, 13], [13, 14], [14, 15], [15, 16],
	[0, 17], [17, 18], [18, 19], [19, 20],
	[5, 9], [9, 13], [13, 17],
];

// ============================================================================
// SENSE PORT IMPLEMENTATION
// ============================================================================

export class MediaPipeSenseAdapter implements SensePort {
	readonly portNumber = 0 as const;
	readonly metadata: HFOPortMetadata = PORT_METADATA[0];

	private gestureRecognizer: GestureRecognizerInstance | null = null;
	private drawingUtils: DrawingUtilsInstance | null = null;
	private video: HTMLVideoElement | null = null;
	private canvas: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;
	private frameCount = 0;
	private running = false;
	private mockMode = false;
	private observers: Map<string, (event: unknown) => void> = new Map();

	// ========================================================================
	// HFOPort Interface
	// ========================================================================

	async heartbeat(): Promise<{ healthy: boolean; timestamp: string; details?: unknown }> {
		return {
			healthy: this.gestureRecognizer !== null || this.mockMode,
			timestamp: new Date().toISOString(),
			details: {
				port: 0,
				verb: 'SENSE',
				commander: 'Lidless Legion',
				frameCount: this.frameCount,
				running: this.running,
				mockMode: this.mockMode,
			},
		};
	}

	async initialize(): Promise<void> {
		console.log('[Port 0/SENSE] Lidless Legion initializing...');

		try {
			// Load MediaPipe script dynamically
			await this.loadMediaPipeScript();
			
			// Wait for vision global to be available
			await this.waitForVision();

			console.log('[Port 0/SENSE] MediaPipe vision bundle loaded');

			// Initialize WASM
			const wasmFileset = await vision.FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
			);

			// Create gesture recognizer with GPU fallback to CPU
			try {
				this.gestureRecognizer = await vision.GestureRecognizer.createFromOptions(wasmFileset, {
					baseOptions: {
						modelAssetPath:
							'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
						delegate: 'GPU',
					},
					runningMode: 'VIDEO',
					numHands: 1,
				});
				console.log('[Port 0/SENSE] Using GPU delegate');
			} catch {
				console.warn('[Port 0/SENSE] GPU failed, falling back to CPU');
				this.gestureRecognizer = await vision.GestureRecognizer.createFromOptions(wasmFileset, {
					baseOptions: {
						modelAssetPath:
							'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
						delegate: 'CPU',
					},
					runningMode: 'VIDEO',
					numHands: 1,
				});
			}

			console.log('[Port 0/SENSE] Lidless Legion ready.');
		} catch (error) {
			console.warn('[Port 0/SENSE] MediaPipe failed to load, using mock mode:', error);
			this.mockMode = true;
			console.log('[Port 0/SENSE] Lidless Legion ready (MOCK MODE).');
		}
	}

	async shutdown(): Promise<void> {
		this.running = false;
		this.gestureRecognizer = null;
		this.observers.clear();
		console.log('[Port 0/SENSE] Lidless Legion shutdown.');
	}

	// ========================================================================
	// SensePort Interface
	// ========================================================================

	/**
	 * Primary verb: SENSE
	 * Perceives input and returns observations WITHOUT MODIFICATION
	 */
	async sense(input: SenseInput): Promise<SenseResult> {
		const timestamp = new Date().toISOString();
		this.frameCount++;

		// Mock mode - generate synthetic data for testing
		if (this.mockMode) {
			return this.generateMockSenseResult(timestamp);
		}

		if (!this.gestureRecognizer) {
			return {
				detected: false,
				observations: [],
				timestamp,
			};
		}

		// Extract video element from payload
		const { video, frameTimestamp } = input.payload as {
			video: HTMLVideoElement;
			frameTimestamp: number;
		};

		if (!video || video.readyState < 2) {
			return {
				detected: false,
				observations: [],
				timestamp,
			};
		}

		// Run MediaPipe gesture recognition (READ-ONLY operation)
		const results = this.gestureRecognizer.recognizeForVideo(video, frameTimestamp);

		// Return observations - we TAG but don't MODIFY the data
		if (results.landmarks.length === 0) {
			const frame = this.createSensedFrame(false, [], 'None', 0, undefined);
			this.notifyObservers('frame', frame);

			return {
				detected: false,
				observations: [{ key: 'gesture', value: frame, confidence: 0 }],
				timestamp,
			};
		}

		// Extract raw data (DO NOT TRANSFORM - only read)
		const landmarks = results.landmarks[0];
		const gesture = results.gestures[0]?.[0]?.categoryName ?? 'None';
		const confidence = results.gestures[0]?.[0]?.score ?? 0;
		const handedness = results.handedness[0]?.[0]?.categoryName;

		// Create tagged frame (adds metadata, preserves raw data)
		const frame = this.createSensedFrame(true, landmarks, gesture, confidence, handedness);

		// Notify observers
		this.notifyObservers('frame', frame);

		return {
			detected: true,
			observations: [{ key: 'gesture', value: frame, confidence }],
			timestamp,
		};
	}

	/**
	 * Subscribe to change events
	 */
	observe(pattern: string, callback: (event: unknown) => void): () => void {
		const id = `${pattern}-${Date.now()}`;
		this.observers.set(id, callback);
		return () => this.observers.delete(id);
	}

	/**
	 * Query current state snapshot (READ-ONLY)
	 */
	async snapshot(): Promise<Record<string, unknown>> {
		return {
			port: 0,
			verb: 'SENSE',
			commander: 'Lidless Legion',
			running: this.running,
			frameCount: this.frameCount,
			hasRecognizer: this.gestureRecognizer !== null,
		};
	}

	// ========================================================================
	// Extended Methods
	// ========================================================================

	/**
	 * Set video/canvas elements for overlay drawing
	 */
	setVideoElements(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
		this.video = video;
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		if (this.ctx && typeof vision !== 'undefined') {
			this.drawingUtils = new vision.DrawingUtils(this.ctx);
		}
	}

	/**
	 * Start the sensing loop
	 */
	start(): void {
		this.running = true;
	}

	/**
	 * Stop the sensing loop
	 */
	stop(): void {
		this.running = false;
	}

	/**
	 * Check if running
	 */
	isRunning(): boolean {
		return this.running;
	}

	/**
	 * Check if in mock mode
	 */
	isMockMode(): boolean {
		return this.mockMode;
	}

	/**
	 * Draw hand landmarks on canvas (visualization, not data modification)
	 */
	drawLandmarks(landmarks: NormalizedLandmark[]): void {
		if (!this.ctx || !this.canvas || !this.drawingUtils) return;

		// Resize canvas if needed
		if (this.video && this.canvas.width !== this.video.videoWidth) {
			this.canvas.width = this.video.videoWidth;
			this.canvas.height = this.video.videoHeight;
		}

		// Clear and draw (mirrored to match video)
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.save();
		this.ctx.scale(-1, 1);
		this.ctx.translate(-this.canvas.width, 0);

		this.drawingUtils.drawConnectors(landmarks, HAND_CONNECTIONS, {
			color: '#00FF00',
			lineWidth: 2,
		});
		this.drawingUtils.drawLandmarks(landmarks, {
			color: '#FF0000',
			lineWidth: 1,
			radius: 3,
		});

		this.ctx.restore();
	}

	// ========================================================================
	// Private Helpers
	// ========================================================================

	/**
	 * Create a tagged sense frame
	 * IMPORTANT: This TAGS the data with metadata but does NOT modify the raw gesture data
	 */
	private createSensedFrame(
		detected: boolean,
		landmarks: NormalizedLandmark[],
		gesture: string,
		confidence: number,
		handedness: string | undefined
	): SensedGestureFrame {
		return {
			// Tags (added by Port 0)
			_port: 0,
			_verb: 'SENSE',
			_timestamp: new Date().toISOString(),
			_source: 'mediapipe',
			_frameId: this.frameCount,

			// Raw data (untouched)
			detected,
			landmarks: landmarks.map((l) => ({ x: l.x, y: l.y, z: l.z })),
			gesture,
			confidence,
			handedness,
		};
	}

	private notifyObservers(pattern: string, event: unknown): void {
		for (const [id, callback] of this.observers) {
			if (id.startsWith(pattern) || id.startsWith('*')) {
				callback(event);
			}
		}
	}

	private loadMediaPipeScript(): Promise<void> {
		return new Promise((resolve, reject) => {
			const src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/vision_bundle.js';
			const existingScript = document.querySelector(`script[src="${src}"]`);
			if (existingScript) {
				// Script already exists, just resolve
				resolve();
				return;
			}
			const script = document.createElement('script');
			script.src = src;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load MediaPipe script'));
			document.head.appendChild(script);
		});
	}

	private waitForVision(): Promise<void> {
		return new Promise((resolve, reject) => {
			let attempts = 0;
			const maxAttempts = 50; // 5 seconds max

			const check = () => {
				if (typeof vision !== 'undefined') {
					resolve();
				} else if (attempts >= maxAttempts) {
					reject(new Error('MediaPipe vision bundle failed to load - timeout'));
				} else {
					attempts++;
					setTimeout(check, 100);
				}
			};

			check();
		});
	}

	/**
	 * Generate mock sense result for testing without MediaPipe
	 */
	private generateMockSenseResult(timestamp: string): SenseResult {
		const gestures = ['None', 'Open_Palm', 'Closed_Fist', 'Pointing_Up', 'Victory', 'Thumb_Up'];
		const gesture = gestures[Math.floor(this.frameCount / 60) % gestures.length];
		const detected = gesture !== 'None';
		const confidence = detected ? 0.85 + Math.random() * 0.1 : 0;

		// Generate mock landmarks (21 points for a hand)
		const mockLandmarks = detected
			? Array.from({ length: 21 }, (_, i) => ({
					x: 0.3 + Math.sin(this.frameCount / 30 + i * 0.3) * 0.1,
					y: 0.3 + Math.cos(this.frameCount / 30 + i * 0.3) * 0.1,
					z: 0,
				}))
			: [];

		const frame = this.createSensedFrame(detected, mockLandmarks, gesture, confidence, 'Right');

		this.notifyObservers('frame', frame);

		return {
			detected,
			observations: [{ key: 'gesture', value: frame, confidence }],
			timestamp,
		};
	}
}
