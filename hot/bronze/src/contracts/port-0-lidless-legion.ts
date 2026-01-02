/**
 * PORT 0: LIDLESS LEGION — OBSERVER — SENSE
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Authority Registry
 *
 * @port 0
 * @binary 000
 * @trigram ☷ Kun (Earth)
 * @element Earth - Ground state, stability, pure receptivity
 * @verb SENSE - Perception without interpretation
 * @jadc2 Sensors - ISR (Intelligence, Surveillance, Reconnaissance)
 * @stigmergy Olfaction - Sense chemical gradients in environment
 * @mantra "How do we SENSE the SENSE?"
 * @secret "The eye that watches itself watching"
 *
 * CAN: read, tag
 * CANNOT: modify, transform, persist, decide, emit
 *
 * ## DOMAIN
 *
 * Port 0 owns ALL sensing/observation:
 * - MediaPipe hand landmarks (21 per hand)
 * - Gesture recognition labels + confidence
 * - Camera/video input configuration
 * - Frame timestamps and dimensions
 *
 * ## DATA FLOW
 *
 * ```
 * Camera → VideoFrame → MediaPipe → SensorFrame → Port 2 (SHAPE)
 *          ↑                         ↑
 *        Port 0                   Port 0
 *       (input)                  (output)
 * ```
 *
 * @source https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
 * @source https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
 * @source https://www.w3.org/TR/mediacapture-streams/ (getUserMedia constraints)
 */
import { z } from 'zod';

// ============================================================================
// CAMERA INPUT SCHEMAS (What Port 0 receives from the world)
// @source https://www.w3.org/TR/mediacapture-streams/#dom-mediatrackconstraints
// TRL 9: W3C Media Capture and Streams
// ============================================================================

/**
 * Camera constraint range (min/ideal/max pattern)
 * @source https://www.w3.org/TR/mediacapture-streams/#dom-constrainulong
 */
export const ConstraintRangeSchema = z.union([
	z.number().int().positive(),
	z.object({
		ideal: z.number().int().positive().optional(),
		min: z.number().int().positive().optional(),
		max: z.number().int().positive().optional(),
		exact: z.number().int().positive().optional(),
	}),
]);
export type ConstraintRange = z.infer<typeof ConstraintRangeSchema>;

/**
 * Camera constraints for getUserMedia
 * @source https://www.w3.org/TR/mediacapture-streams/#dom-mediatrackconstraints
 * @see W3C Media Capture and Streams
 * TRL 9: W3C Recommendation
 */
export const CameraConstraintsSchema = z.object({
	/** Video width constraint */
	width: ConstraintRangeSchema.optional(),
	/** Video height constraint */
	height: ConstraintRangeSchema.optional(),
	/** Frame rate constraint (fps) */
	frameRate: ConstraintRangeSchema.optional(),
	/** Camera facing mode */
	facingMode: z.enum(['user', 'environment', 'left', 'right']).optional(),
	/** Specific device ID */
	deviceId: z.string().optional(),
	/** Aspect ratio constraint */
	aspectRatio: z.number().positive().optional(),
});
export type CameraConstraints = z.infer<typeof CameraConstraintsSchema>;

/**
 * Video frame metadata - what Port 0 observes from camera
 * @source https://html.spec.whatwg.org/multipage/media.html#htmlvideoelement
 * @see W3C HTML Living Standard
 * TRL 9: W3C HTML Living Standard
 */
export const VideoFrameSchema = z.object({
	/** Performance.now() timestamp in ms */
	timestamp: z.number().nonnegative().describe('Performance.now() in ms'),
	/** Frame width in pixels */
	width: z.number().int().positive(),
	/** Frame height in pixels */
	height: z.number().int().positive(),
});
export type VideoFrame = z.infer<typeof VideoFrameSchema>;

// ============================================================================
// MEDIAPIPE CONFIGURATION SCHEMAS
// @source https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
// TRL 9: Google Production ML pipeline
// ============================================================================

/**
 * MediaPipe delegate options for hardware acceleration
 * @source https://ai.google.dev/edge/mediapipe/solutions/guide#delegates
 */
export const MediaPipeDelegateSchema = z.enum([
	'CPU', // Default CPU execution
	'GPU', // WebGL acceleration
]);
export type MediaPipeDelegate = z.infer<typeof MediaPipeDelegateSchema>;

/**
 * MediaPipe Gesture Recognizer configuration
 * @source https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer#configurations
 * TRL 9: Google Production ML pipeline
 */
export const MediaPipeConfigSchema = z.object({
	/** Path to gesture recognizer model (.task file) */
	modelAssetPath: z.string().default('gesture_recognizer.task'),
	/** Path to WASM files directory */
	wasmLoaderPath: z.string().optional(),
	/** Hardware delegate */
	delegate: MediaPipeDelegateSchema.default('GPU'),
	/** Running mode */
	runningMode: z.enum(['IMAGE', 'VIDEO']).default('VIDEO'),
	/** Number of hands to detect */
	numHands: z.number().int().min(1).max(2).default(1),
	/** Minimum detection confidence */
	minHandDetectionConfidence: z.number().min(0).max(1).default(0.5),
	/** Minimum tracking confidence */
	minHandPresenceConfidence: z.number().min(0).max(1).default(0.5),
	/** Minimum gesture confidence */
	minTrackingConfidence: z.number().min(0).max(1).default(0.5),
});
export type MediaPipeConfig = z.infer<typeof MediaPipeConfigSchema>;

// ============================================================================
// HAND LANDMARK SCHEMAS
// @source https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker#models
// TRL 9: Google Production (21 landmarks per hand)
// ============================================================================

/**
 * MediaPipe Hand Landmark indices (21 landmarks per hand)
 * @source https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker#hand_landmark_model
 *
 * ```
 *        8   12  16  20
 *        |   |   |   |
 *    7   11  15  19  |
 *    |   |   |   |   |
 *    6   10  14  18  |
 *    |   |   |   |   |
 *    5---9---13--17--+
 *     \             /
 *   4  \           /
 *   |   \         /
 *   3    \       /
 *   |     \     /
 *   2      \   /
 *   |       \ /
 *   1--------0 (WRIST)
 * ```
 */
export const HandLandmarkIndex = {
	WRIST: 0,
	THUMB_CMC: 1,
	THUMB_MCP: 2,
	THUMB_IP: 3,
	THUMB_TIP: 4,
	INDEX_FINGER_MCP: 5,
	INDEX_FINGER_PIP: 6,
	INDEX_FINGER_DIP: 7,
	INDEX_FINGER_TIP: 8,
	MIDDLE_FINGER_MCP: 9,
	MIDDLE_FINGER_PIP: 10,
	MIDDLE_FINGER_DIP: 11,
	MIDDLE_FINGER_TIP: 12,
	RING_FINGER_MCP: 13,
	RING_FINGER_PIP: 14,
	RING_FINGER_DIP: 15,
	RING_FINGER_TIP: 16,
	PINKY_MCP: 17,
	PINKY_PIP: 18,
	PINKY_DIP: 19,
	PINKY_TIP: 20,
} as const;
export type HandLandmarkIndex = (typeof HandLandmarkIndex)[keyof typeof HandLandmarkIndex];

/**
 * Normalized 2D/3D landmark (0-1 range for x,y)
 * @source https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker#models
 * @see MediaPipe Hand Landmarker - 21 landmarks per hand
 * TRL 9: Google Production (used in Google Meet, Android)
 */
export const NormalizedLandmarkSchema = z.object({
	/** X coordinate (0-1 normalized, left to right) */
	x: z.number().min(0).max(1),
	/** Y coordinate (0-1 normalized, top to bottom) */
	y: z.number().min(0).max(1),
	/** Z coordinate (depth relative to wrist, smaller = closer to camera) */
	z: z.number(),
	/** Landmark visibility (0-1, may be null) */
	visibility: z.number().min(0).max(1).nullish(),
});
export type NormalizedLandmark = z.infer<typeof NormalizedLandmarkSchema>;

/**
 * Full hand landmark set (21 landmarks)
 */
export const HandLandmarksSchema = z.array(NormalizedLandmarkSchema).length(21);
export type HandLandmarks = z.infer<typeof HandLandmarksSchema>;

// ============================================================================
// GESTURE RECOGNITION SCHEMAS
// @source https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
// TRL 9: Google Production ML pipeline
// ============================================================================

/**
 * MediaPipe built-in gesture labels
 * @source https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer#models
 */
export const GestureLabels = [
	'Open_Palm', // Baseline / arming gesture
	'Pointing_Up', // Commit action (click/drag)
	'Victory', // Navigation action (pan/scroll)
	'Thumb_Up', // Zoom in
	'Thumb_Down', // Zoom out
	'Closed_Fist', // Alternative commit
	'ILoveYou', // Optional: tool switch
	'None', // No gesture detected
] as const;
export type GestureLabel = (typeof GestureLabels)[number];

/**
 * Raw gesture recognition result from MediaPipe
 * @source https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer#gesture_recognizer_result
 */
export const GestureResultSchema = z.object({
	/** Gesture category name */
	categoryName: z.enum(GestureLabels),
	/** Recognition confidence score (0-1) */
	score: z.number().min(0).max(1),
	/** Category index */
	index: z.number().int().nonnegative(),
	/** Display name (may differ from categoryName) */
	displayName: z.string().optional(),
});
export type GestureResult = z.infer<typeof GestureResultSchema>;

/**
 * Handedness classification
 * @source https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker#hand_landmark_detection_result
 */
export const HandednessSchema = z.object({
	/** Hand classification (left/right) */
	categoryName: z.enum(['Left', 'Right']),
	/** Classification confidence */
	score: z.number().min(0).max(1),
	/** Category index */
	index: z.number().int().nonnegative(),
});
export type Handedness = z.infer<typeof HandednessSchema>;

// ============================================================================
// SENSOR FRAME OUTPUT (What Port 0 emits to Port 2)
// ============================================================================

/**
 * Sensor output - processed gesture detection result
 * This is what Port 0 emits after processing MediaPipe results
 *
 * @source https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
 * @see MediaPipe GestureRecognizerResult (transformed to HFO format)
 * TRL 9: Google Production ML pipeline
 */
export const SensorFrameSchema = z.object({
	/** Timestamp in ms (Performance.now()) */
	ts: z.number().nonnegative().describe('Timestamp in ms'),
	/** Which hand (derived from handedness classification) */
	handId: z.enum(['left', 'right', 'none']),
	/** Is hand tracking stable? */
	trackingOk: z.boolean(),
	/** Is palm facing camera? (for gesture validity) */
	palmFacing: z.boolean(),
	/** Recognized gesture label */
	label: z.enum(GestureLabels),
	/** Gesture recognition confidence */
	confidence: z.number().min(0).max(1),
	/** Index finger tip position (primary cursor source) */
	indexTip: NormalizedLandmarkSchema.nullable(),
	/** All 21 hand landmarks (for skeleton visualization) */
	landmarks: HandLandmarksSchema.nullable(),
});
export type SensorFrame = z.infer<typeof SensorFrameSchema>;

// ============================================================================
// PORT 0 METADATA
// ============================================================================

/**
 * Port 0 metadata for runtime reflection
 */
export const PORT_0_METADATA = {
	port: 0,
	name: 'Lidless Legion',
	binary: '000',
	trigram: '☷',
	element: 'Earth',
	verb: 'SENSE',
	jadc2: 'Sensors',
	stigmergy: 'Olfaction',
	mantra: 'How do we SENSE the SENSE?',
	secret: 'The eye that watches itself watching',
	schemas: {
		input: ['CameraConstraintsSchema', 'VideoFrameSchema', 'MediaPipeConfigSchema'],
		output: ['SensorFrameSchema'],
		internal: [
			'NormalizedLandmarkSchema',
			'HandLandmarksSchema',
			'GestureResultSchema',
			'HandednessSchema',
		],
	},
} as const;

// ============================================================================
// TYPE GUARDS (Runtime validation)
// ============================================================================

/**
 * Check if object is a valid SensorFrame
 */
export function isSensorFrame(obj: unknown): obj is SensorFrame {
	return SensorFrameSchema.safeParse(obj).success;
}

/**
 * Check if object is a valid NormalizedLandmark
 */
export function isNormalizedLandmark(obj: unknown): obj is NormalizedLandmark {
	return NormalizedLandmarkSchema.safeParse(obj).success;
}

/**
 * Check if gesture label is valid
 */
export function isGestureLabel(label: string): label is GestureLabel {
	return GestureLabels.includes(label as GestureLabel);
}
