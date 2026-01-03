/**
 * W3C Gesture Control Plane - Zod Contract Schemas
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | CDD Source of Truth
 *
 * PRINCIPLE: All port types derive from these schemas via z.infer<T>
 * Grounded: Tavily research 2025-12-29
 */
import { z } from 'zod';

// ============================================================================
// GESTURE LABELS (MediaPipe built-in recognition)
// Source: https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
// ============================================================================

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

// ============================================================================
// SENSOR PORT SCHEMAS (Port 0 - SENSE)
// Input: VideoFrame metadata | Output: SensorFrame
// @source HTMLVideoElement - https://html.spec.whatwg.org/multipage/media.html#htmlvideoelement
// @source Performance.now() - https://www.w3.org/TR/hr-time-3/
// TRL 9: W3C HTML Living Standard, W3C High Resolution Time L3
// ============================================================================

/**
 * Video frame metadata - what the sensor receives
 * @source https://html.spec.whatwg.org/multipage/media.html#htmlvideoelement
 * @see W3C HTML Living Standard
 */
export const VideoFrameSchema = z.object({
	timestamp: z.number().nonnegative().describe('Performance.now() in ms'),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
});
export type VideoFrame = z.infer<typeof VideoFrameSchema>;

/**
 * Normalized 2D landmark (0-1 range)
 * @source https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker#models
 * @see MediaPipe Hand Landmarker - 21 landmarks per hand
 * TRL 9: Google Production (used in Google Meet, Android)
 */
export const NormalizedLandmarkSchema = z.object({
	x: z.number().min(0).max(1),
	y: z.number().min(0).max(1),
	z: z.number(), // depth relative to wrist
	visibility: z.number().min(0).max(1).nullish(), // Allow null or undefined
});
export type NormalizedLandmark = z.infer<typeof NormalizedLandmarkSchema>;

/**
 * Sensor output - raw gesture detection result
 * @source https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
 * @see MediaPipe GestureRecognizerResult
 * TRL 9: Google Production ML pipeline
 */
export const SensorFrameSchema = z.object({
	ts: z.number().nonnegative().describe('Timestamp in ms'),
	handId: z.enum(['left', 'right', 'none']),
	trackingOk: z.boolean(),
	palmFacing: z.boolean(),
	label: z.enum(GestureLabels),
	confidence: z.number().min(0).max(1),
	indexTip: NormalizedLandmarkSchema.nullable(),
	landmarks: z.array(NormalizedLandmarkSchema).length(21).nullable(),
});
export type SensorFrame = z.infer<typeof SensorFrameSchema>;

// ============================================================================
// SMOOTHER PORT SCHEMAS (Port 2 - SHAPE)
// Input: SensorFrame | Output: SmoothedFrame
// Source: 1€ Filter - https://gery.casiez.net/1euro/
// ============================================================================

/**
 * Smoothed frame with filtered position and velocity estimate
 * @source https://gery.casiez.net/1euro/ (1€ Filter - CHI 2012)
 * @source https://dl.acm.org/doi/10.1145/2207676.2208639 (Casiez et al.)
 * TRL 9: Peer-reviewed CHI publication, widely deployed
 */
export const SmoothedFrameSchema = z.object({
	ts: z.number().nonnegative(),
	handId: z.enum(['left', 'right', 'none']),
	trackingOk: z.boolean(),
	palmFacing: z.boolean(),
	label: z.enum(GestureLabels),
	confidence: z.number().min(0).max(1),

	/** Filtered position (0-1 normalized) */
	position: z
		.object({
			x: z.number().min(0).max(1),
			y: z.number().min(0).max(1),
		})
		.nullable(),

	/** Estimated velocity (units/second) */
	velocity: z
		.object({
			x: z.number(),
			y: z.number(),
		})
		.nullable(),

	/** Predicted position for next frame (latency compensation) */
	prediction: z
		.object({
			x: z.number().min(0).max(1),
			y: z.number().min(0).max(1),
		})
		.nullable(),
});
export type SmoothedFrame = z.infer<typeof SmoothedFrameSchema>;

// ============================================================================
// FSM PORT SCHEMAS (Port 3 - DELIVER)
// Input: SmoothedFrame | Output: FSMAction
// Source: XState v5 - https://stately.ai/docs/setup
// ============================================================================

/** FSM states matching spec 4.2 */
export const FSMStates = [
	'DISARMED', // System inactive
	'ARMING', // Baseline hysteresis
	'ARMED', // Cursor aim mode
	'DOWN_COMMIT', // Primary click/drag (button=0)
	'DOWN_NAV', // Middle-click drag (button=1)
	'ZOOM', // Wheel emission
] as const;
export type FSMState = (typeof FSMStates)[number];

/** FSM action output - what pointer event to emit */
export const FSMActionSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal('none'),
		state: z.enum(FSMStates),
	}),
	z.object({
		action: z.literal('move'),
		state: z.enum(FSMStates),
		x: z.number(),
		y: z.number(),
		velocity: z
			.object({
				x: z.number(),
				y: z.number(),
			})
			.nullish(),
		prediction: z
			.object({
				x: z.number(),
				y: z.number(),
			})
			.nullish(),
	}),
	z.object({
		action: z.literal('down'),
		state: z.enum(FSMStates),
		x: z.number(),
		y: z.number(),
		button: z.union([z.literal(0), z.literal(1)]),
		velocity: z
			.object({
				x: z.number(),
				y: z.number(),
			})
			.nullish(),
	}),
	z.object({
		action: z.literal('up'),
		state: z.enum(FSMStates),
		x: z.number(),
		y: z.number(),
		button: z.union([z.literal(0), z.literal(1)]),
		velocity: z
			.object({
				x: z.number(),
				y: z.number(),
			})
			.nullish(),
	}),
	z.object({
		action: z.literal('cancel'),
		state: z.enum(FSMStates),
	}),
	z.object({
		action: z.literal('wheel'),
		state: z.enum(FSMStates),
		deltaY: z.number(),
		ctrl: z.boolean().nullish(), // Allow null or undefined
	}),
]);
export type FSMAction = z.infer<typeof FSMActionSchema>;

// ============================================================================
// EMITTER PORT SCHEMAS (Port 5 - DEFEND)
// Input: FSMAction | Output: PointerEventOut
// Source: W3C Pointer Events - https://www.w3.org/TR/pointerevents/
// ============================================================================

export const PointerEventOutSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('pointermove'),
		pointerId: z.number().int().nonnegative(),
		clientX: z.number(),
		clientY: z.number(),
		pointerType: z.enum(['mouse', 'pen', 'touch']),
		pressure: z.number().min(0).max(1),
		tangentialPressure: z.number().min(-1).max(1).optional(),
		tiltX: z.number().min(-90).max(90).optional(),
		tiltY: z.number().min(-90).max(90).optional(),
		twist: z.number().min(0).max(359).optional(),
		altitudeAngle: z
			.number()
			.min(0)
			.max(Math.PI / 2)
			.optional(),
		azimuthAngle: z
			.number()
			.min(0)
			.max(Math.PI * 2)
			.optional(),
		isPrimary: z.boolean(),
	}),
	z.object({
		type: z.literal('pointerdown'),
		pointerId: z.number().int().nonnegative(),
		clientX: z.number(),
		clientY: z.number(),
		pointerType: z.enum(['mouse', 'pen', 'touch']),
		button: z.number().int().min(0).max(2),
		buttons: z.number().int().nonnegative(),
		pressure: z.number().min(0).max(1),
		tangentialPressure: z.number().min(-1).max(1).optional(),
		tiltX: z.number().min(-90).max(90).optional(),
		tiltY: z.number().min(-90).max(90).optional(),
		twist: z.number().min(0).max(359).optional(),
		altitudeAngle: z
			.number()
			.min(0)
			.max(Math.PI / 2)
			.optional(),
		azimuthAngle: z
			.number()
			.min(0)
			.max(Math.PI * 2)
			.optional(),
		isPrimary: z.boolean(),
	}),
	z.object({
		type: z.literal('pointerup'),
		pointerId: z.number().int().nonnegative(),
		clientX: z.number(),
		clientY: z.number(),
		pointerType: z.enum(['mouse', 'pen', 'touch']),
		button: z.number().int().min(0).max(2),
		buttons: z.number().int().nonnegative(),
		pressure: z.number().min(0).max(1),
		tangentialPressure: z.number().min(-1).max(1).optional(),
		tiltX: z.number().min(-90).max(90).optional(),
		tiltY: z.number().min(-90).max(90).optional(),
		twist: z.number().min(0).max(359).optional(),
		altitudeAngle: z
			.number()
			.min(0)
			.max(Math.PI / 2)
			.optional(),
		azimuthAngle: z
			.number()
			.min(0)
			.max(Math.PI * 2)
			.optional(),
		isPrimary: z.boolean(),
	}),
	z.object({
		type: z.literal('pointercancel'),
		pointerId: z.number().int().nonnegative(),
		pointerType: z.enum(['mouse', 'pen', 'touch']),
	}),
	z.object({
		type: z.literal('wheel'),
		deltaY: z.number(),
		deltaMode: z.number().int(),
		ctrlKey: z.boolean(),
		clientX: z.number(),
		clientY: z.number(),
	}),
]);
export type PointerEventOut = z.infer<typeof PointerEventOutSchema>;

// ============================================================================
// ADAPTER PORT SCHEMAS (Target injection)
// Input: PointerEventOut | Output: void (side effect)
// ============================================================================

/**
 * Adapter target configuration for polymorphic injection
 * @source https://dom.spec.whatwg.org/#interface-eventtarget
 * @see W3C DOM EventTarget interface
 * TRL 9: W3C DOM Living Standard
 */
export const AdapterTargetSchema = z.object({
	type: z.enum(['canvas', 'element', 'iframe', 'document', 'puter']),
	selector: z.string().optional(),
	bounds: z.object({
		width: z.number().positive(),
		height: z.number().positive(),
		left: z.number(),
		top: z.number(),
	}),
});
export type AdapterTarget = z.infer<typeof AdapterTargetSchema>;

// ============================================================================
// PUTER.JS WINDOW SCHEMAS (Responsive windowing layer)
// Source: https://docs.puter.com/UI/createWindow - Tavily grounded 2025-12-30
// ============================================================================

/**
 * Puter.js window creation options
 * @source https://docs.puter.com/UI/createWindow
 * @see Puter.js OSS documentation (38K⭐ GitHub)
 * TRL 8: Production OSS with documented API
 */
export const PuterWindowOptionsSchema = z.object({
	title: z.string().optional(),
	content: z.string().optional(),
	width: z.number().positive().optional(),
	height: z.number().positive().optional(),
	x: z.number().optional(),
	y: z.number().optional(),
	is_resizable: z.boolean().default(true),
	has_head: z.boolean().default(true),
	center: z.boolean().default(false),
	show_in_taskbar: z.boolean().default(true),
	disable_parent_window: z.boolean().default(false),
});
export type PuterWindowOptions = z.infer<typeof PuterWindowOptionsSchema>;

/**
 * Puter window instance state
 * @source https://docs.puter.com/UI/WindowInterface
 * @see Puter.js OSS window API
 * TRL 8: Production OSS with documented API
 */
export const PuterWindowStateSchema = z.object({
	id: z.string(),
	title: z.string(),
	bounds: z.object({
		width: z.number().positive(),
		height: z.number().positive(),
		x: z.number(),
		y: z.number(),
	}),
	isMinimized: z.boolean(),
	isMaximized: z.boolean(),
	isFocused: z.boolean(),
});
export type PuterWindowState = z.infer<typeof PuterWindowStateSchema>;

/** Puter shell configuration (extends UIShellConfig) */
export const PuterShellConfigSchema = z.object({
	shell: z.literal('puter'),
	autoArrange: z.boolean().default(true),
	showInTaskbar: z.boolean().default(true),
	enableSnapping: z.boolean().default(true),
	defaultWindowSize: z
		.object({
			width: z.number().positive().default(800),
			height: z.number().positive().default(600),
		})
		.optional(),
});
export type PuterShellConfig = z.infer<typeof PuterShellConfigSchema>;

// ============================================================================
// PIPELINE CONFIG
// @source 1€ Filter params: https://gery.casiez.net/1euro/ (mincutoff, beta, dcutoff)
// @source XState timing: https://stately.ai/docs/delays
// TRL 9: CHI 2012 + XState v5 patterns
// ============================================================================

/**
 * Pipeline configuration - combines 1€ Filter and XState FSM params
 * @see Section 5 of W3C_POINTER_GESTURE_CONTROL_PLANE_20251230.md
 */
export const PipelineConfigSchema = z.object({
	/** 1€ Filter parameters */
	filter: z.object({
		mincutoff: z.number().positive().default(1.0),
		beta: z.number().nonnegative().default(0.007),
		dcutoff: z.number().positive().default(1.0),
	}),

	/** FSM timing parameters */
	fsm: z.object({
		armStableMs: z.number().positive().default(200),
		cmdWindowMs: z.number().positive().default(500),
		minConfidence: z.number().min(0).max(1).default(0.7),
	}),

	/** Pointer ID for synthetic events */
	pointerId: z.number().int().nonnegative().default(1),

	/** Pointer type to simulate */
	pointerType: z.enum(['mouse', 'pen', 'touch']).default('touch'),
});
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

// ============================================================================
// OVERLAY PORT SCHEMAS (Cursor Visualization Layer)
// @source HFO Gen87 spec: Section 8 of W3C_POINTER_GESTURE_CONTROL_PLANE_20251230.md
// @see Canvas2D API: https://html.spec.whatwg.org/multipage/canvas.html
// TRL 7: HFO internal + W3C Canvas2D
// ============================================================================

/**
 * Cursor state visualization enum
 * @see Section 8.1 Cursor State Machine
 */
export const CursorStateSchema = z.enum([
	'hidden', // No cursor
	'tracking', // Hand detected, not armed
	'armed', // Ready to commit gesture
	'active', // Gesture in progress
	'error', // Tracking lost
]);
export type CursorState = z.infer<typeof CursorStateSchema>;

export const OverlayConfigSchema = z.object({
	/** Show raw (unfiltered) cursor */
	showRaw: z.boolean().default(false),
	/** Show smoothed cursor */
	showSmoothed: z.boolean().default(true),
	/** Show predicted cursor */
	showPredicted: z.boolean().default(false),
	/** Show hand skeleton */
	showSkeleton: z.boolean().default(true),
	/** Cursor size in pixels */
	cursorSize: z.number().positive().default(20),
	/** Colors for cursor states */
	colors: z
		.object({
			raw: z.string().default('#ff0000'),
			smoothed: z.string().default('#00ff00'),
			predicted: z.string().default('#0000ff'),
			skeleton: z.string().default('#ffff00'),
		})
		.default({}),
});
export type OverlayConfig = z.infer<typeof OverlayConfigSchema>;

// ============================================================================
// UI SHELL PORT SCHEMAS (Window Manager Layer)
// @source react-mosaic: https://github.com/nomcopter/react-mosaic
// @source golden-layout: https://golden-layout.com/
// @source daedalOS: https://github.com/DustinBrett/daedalOS (12K⭐)
// TRL 8: Production OSS tiling window managers
// ============================================================================

/**
 * Tile type for adapter routing
 * @see Section 11.1 Multi-Target Tile Grid
 */
export const TileTypeSchema = z.enum([
	'pixi', // PixiJS canvas
	'canvas', // Raw Canvas2D
	'dom', // DOM element
	'iframe', // Iframe (for emulators)
	'excalidraw', // Excalidraw whiteboard
	'tldraw', // tldraw whiteboard
	'v86', // v86 x86 emulator
	'jsdos', // js-dos emulator
	'puter', // Puter cloud OS
	'custom', // Custom adapter
]);
export type TileType = z.infer<typeof TileTypeSchema>;

export const TileConfigSchema = z.object({
	id: z.string(),
	type: TileTypeSchema,
	title: z.string().optional(),
	/** Adapter-specific configuration */
	config: z.record(z.unknown()).default({}),
});
export type TileConfig = z.infer<typeof TileConfigSchema>;

export const ShellTypeSchema = z.enum([
	'mosaic', // react-mosaic tiling
	'golden', // golden-layout
	'daedalos', // daedalOS desktop
	'raw', // Raw HTML divs
]);
export type ShellType = z.infer<typeof ShellTypeSchema>;

/**
 * Layout tree node - recursive binary tree structure
 * @source react-mosaic MosaicNode: https://github.com/nomcopter/react-mosaic#api
 * @see Binary space partitioning pattern
 * TRL 8: react-mosaic production pattern (1.5K⭐)
 */
export const LayoutNodeSchema: z.ZodType<LayoutNode> = z.lazy(() =>
	z.union([
		z.string(), // Leaf node (tile ID)
		z.object({
			direction: z.enum(['row', 'column']),
			first: LayoutNodeSchema,
			second: LayoutNodeSchema,
			splitPercentage: z.number().min(0).max(100).default(50),
		}),
	]),
);
export type LayoutNode =
	| string
	| {
			direction: 'row' | 'column';
			first: LayoutNode;
			second: LayoutNode;
			splitPercentage?: number | undefined;
	  };

/**
 * Complete layout state - tiles + arrangement + shell type
 * @source Section 11.2 of W3C_POINTER_GESTURE_CONTROL_PLANE_20251230.md
 * @see react-mosaic + golden-layout state patterns
 * TRL 7: HFO Gen87 internal + OSS patterns
 */
export const LayoutStateSchema = z.object({
	tiles: z.array(TileConfigSchema),
	arrangement: LayoutNodeSchema,
	shell: ShellTypeSchema,
});
export type LayoutState = z.infer<typeof LayoutStateSchema>;

/**
 * UI Shell configuration - window manager setup\n * @source golden-layout: https://golden-layout.com/docs\n * @see Section 11 of W3C_POINTER_GESTURE_CONTROL_PLANE_20251230.md\n * TRL 8: golden-layout production patterns\n */
export const UIShellConfigSchema = z.object({
	shell: ShellTypeSchema.default('raw'),
	initialLayout: LayoutStateSchema.optional(),
	/** Enable drag-drop tile rearrangement */
	allowDragDrop: z.boolean().default(true),
	/** Enable tile splitting */
	allowSplit: z.boolean().default(true),
	/** Enable tile closing */
	allowClose: z.boolean().default(true),
});
export type UIShellConfig = z.infer<typeof UIShellConfigSchema>;
