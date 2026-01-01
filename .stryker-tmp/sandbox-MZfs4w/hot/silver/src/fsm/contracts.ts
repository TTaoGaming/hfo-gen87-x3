/**
 * W3C Pointer FSM - Port & Adapter Contracts
 * 
 * Gen87.X3 | Hot Silver | CDD (Contract-Driven Development)
 * 
 * DESIGN: Hexagonal Architecture with Polymorphic Adapters
 * 
 * ```
 *                    ┌─────────────────────────────┐
 *                    │      FSM Core (Domain)      │
 *                    │   W3CPointerFSM (XState)    │
 *                    └─────────────────────────────┘
 *                              ▲       │
 *                              │       │
 *              ┌───────────────┴───────┴───────────────┐
 *              │                                       │
 *      ┌───────┴───────┐                       ┌───────┴───────┐
 *      │  INPUT PORT   │                       │  OUTPUT PORT  │
 *      │ (PointerFrame)│                       │(W3CPointerEvent)│
 *      └───────┬───────┘                       └───────┬───────┘
 *              │                                       │
 *      ┌───────┴───────┐                       ┌───────┴───────┐
 *      │   ADAPTERS    │                       │   ADAPTERS    │
 *      │ - MediaPipe   │                       │ - DOM Events  │
 *      │ - Synthetic   │                       │ - WebSocket   │
 *      │ - Replay      │                       │ - Logger      │
 *      └───────────────┘                       └───────────────┘
 * ```
 */
// @ts-nocheck


import { z } from 'zod';

// ============================================================================
// INPUT PORT CONTRACT (What FSM receives)
// ============================================================================

/**
 * MediaPipe gesture labels we care about
 * SOP: Only these 6 gestures are valid, everything else maps to 'None'
 */
export const GestureLabel = z.enum([
  'None',
  'Open_Palm',
  'Pointing_Up',
  'Victory',
  'Thumb_Up',
  'Thumb_Down',
  'Closed_Fist',
]);
export type GestureLabel = z.infer<typeof GestureLabel>;

/**
 * 2D position normalized to [0, 1]
 */
export const NormalizedPosition = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
export type NormalizedPosition = z.infer<typeof NormalizedPosition>;

/**
 * 2D velocity (can be negative, unbounded)
 */
export const Velocity2D = z.object({
  vx: z.number(),
  vy: z.number(),
});
export type Velocity2D = z.infer<typeof Velocity2D>;

/**
 * PointerFrame: The INPUT contract for FSM
 * 
 * This is what adapters MUST provide to the FSM.
 * Any input source (MediaPipe, synthetic, replay) must conform.
 */
export const PointerFrameSchema = z.object({
  /** Timestamp in milliseconds (monotonic) */
  ts: z.number().positive(),
  
  /** Is hand currently being tracked? */
  trackingOk: z.boolean(),
  
  /** Palm angle from camera normal (0° = facing, 90° = side, 180° = away) */
  palmAngle: z.number().min(0).max(180),
  
  /** Detected gesture label */
  gesture: GestureLabel,
  
  /** Gesture detection confidence [0, 1] */
  confidence: z.number().min(0).max(1),
  
  /** Index fingertip position (normalized) */
  position: NormalizedPosition,
  
  /** Velocity for coasting (optional, computed by adapter) */
  velocity: Velocity2D.optional(),
});
export type PointerFrame = z.infer<typeof PointerFrameSchema>;

// ============================================================================
// OUTPUT PORT CONTRACT (What FSM emits)
// ============================================================================

/**
 * FSM State enum
 */
export const FSMState = z.enum([
  'IDLE',
  'TRACKING',
  'ARMED',
  'ENGAGED',
  'COASTING',
]);
export type FSMState = z.infer<typeof FSMState>;

/**
 * W3C Pointer Event Types we emit
 */
export const PointerEventType = z.enum([
  'none',
  'enter',
  'move',
  'down',
  'up',
  'cancel',
  'leave',
]);
export type PointerEventType = z.infer<typeof PointerEventType>;

/**
 * W3CPointerAction: The OUTPUT contract from FSM
 * 
 * This is what the FSM emits. Output adapters consume this.
 */
export const W3CPointerActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('none'),
  }),
  z.object({
    type: z.literal('enter'),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    pointerId: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('move'),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    pointerId: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('down'),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    pointerId: z.number().int().positive(),
    button: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('up'),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    pointerId: z.number().int().positive(),
    button: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('cancel'),
    pointerId: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('leave'),
    pointerId: z.number().int().positive(),
  }),
]);
export type W3CPointerAction = z.infer<typeof W3CPointerActionSchema>;

/**
 * FSM State Snapshot: Full state for debugging/logging
 */
export const FSMSnapshotSchema = z.object({
  state: FSMState,
  position: NormalizedPosition,
  velocity: Velocity2D,
  wasFacing: z.boolean(),
  pointerId: z.number().int().positive(),
  palmStableAt: z.number().nullable(),
  coastStartAt: z.number().nullable(),
});
export type FSMSnapshot = z.infer<typeof FSMSnapshotSchema>;

// ============================================================================
// CONFIGURATION CONTRACT
// ============================================================================

/**
 * Gate thresholds for palm angle (Schmitt trigger)
 */
export const PalmGateConfigSchema = z.object({
  /** Palm angle to ENTER tracking (< this = facing camera) */
  enterThreshold: z.number().min(0).max(90).default(30),
  /** Palm angle to EXIT tracking (> this = facing away) */
  exitThreshold: z.number().min(0).max(90).default(45),
  /** Palm angle for IMMEDIATE cancel (intentional roll) */
  cancelThreshold: z.number().min(0).max(180).default(70),
});

/**
 * Confidence thresholds (Schmitt trigger)
 */
export const ConfidenceGateConfigSchema = z.object({
  /** Confidence to arm (high bar) */
  armThreshold: z.number().min(0).max(1).default(0.7),
  /** Confidence to maintain (lower bar) */
  maintainThreshold: z.number().min(0).max(1).default(0.5),
  /** Confidence for immediate drop */
  dropThreshold: z.number().min(0).max(1).default(0.25),
});

/**
 * Timing configuration
 */
export const TimingConfigSchema = z.object({
  /** Ignore None gesture if < this duration (ms) */
  noneDebounceMs: z.number().min(0).default(80),
  /** Time palm must be stable to arm (ms) */
  armStableMs: z.number().min(0).default(150),
  /** Max coasting duration before cancel (ms) */
  coastingMaxMs: z.number().min(0).default(2000),
});

/**
 * Coasting physics configuration
 */
export const CoastingConfigSchema = z.object({
  /** Velocity damping per frame */
  damping: z.number().min(0).max(1).default(0.92),
  /** Stop coasting when velocity below this */
  minVelocity: z.number().min(0).default(0.0005),
});

/**
 * Full FSM Gate Configuration
 */
export const GateConfigSchema = z.object({
  palm: PalmGateConfigSchema.default({}),
  confidence: ConfidenceGateConfigSchema.default({}),
  timing: TimingConfigSchema.default({}),
  coasting: CoastingConfigSchema.default({}),
});
export type GateConfig = z.infer<typeof GateConfigSchema>;

// ============================================================================
// PORT INTERFACES (TypeScript)
// ============================================================================

/**
 * INPUT PORT: Adapters that provide frames to FSM
 * 
 * SOP: Implement this interface to create a new input source
 */
export interface IPointerFramePort {
  /** Unique identifier for this adapter */
  readonly id: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Start producing frames */
  start(): Promise<void>;
  
  /** Stop producing frames */
  stop(): Promise<void>;
  
  /** Subscribe to frames */
  onFrame(callback: (frame: PointerFrame) => void): () => void;
  
  /** Check if currently running */
  isRunning(): boolean;
}

/**
 * OUTPUT PORT: Adapters that consume FSM actions
 * 
 * SOP: Implement this interface to create a new output sink
 */
export interface IPointerActionPort {
  /** Unique identifier for this adapter */
  readonly id: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Handle an action from FSM */
  handleAction(action: W3CPointerAction, snapshot: FSMSnapshot): void;
  
  /** Cleanup resources */
  dispose(): void;
}

/**
 * FSM PORT: The core FSM interface
 * 
 * This is what the orchestrator uses to control the FSM
 */
export interface IPointerFSMPort {
  /** Process a frame and get action */
  process(frame: PointerFrame): W3CPointerAction;
  
  /** Get current state */
  getState(): FSMState;
  
  /** Get full snapshot */
  getSnapshot(): FSMSnapshot;
  
  /** Get current position */
  getPosition(): NormalizedPosition;
  
  /** Force cancel */
  cancel(): void;
  
  /** Cleanup */
  dispose(): void;
  
  /** Get configuration */
  getConfig(): GateConfig;
}

// ============================================================================
// VALIDATION HELPERS (Gate Guards)
// ============================================================================

/**
 * Validate a PointerFrame, throwing on invalid data
 */
export function validateFrame(frame: unknown): PointerFrame {
  return PointerFrameSchema.parse(frame);
}

/**
 * Safely validate a PointerFrame, returning result
 */
export function safeValidateFrame(frame: unknown): z.SafeParseReturnType<unknown, PointerFrame> {
  return PointerFrameSchema.safeParse(frame);
}

/**
 * Validate a W3CPointerAction
 */
export function validateAction(action: unknown): W3CPointerAction {
  return W3CPointerActionSchema.parse(action);
}

/**
 * Validate GateConfig with defaults
 */
export function validateConfig(config: unknown): GateConfig {
  return GateConfigSchema.parse(config);
}

// ============================================================================
// FACTORY FUNCTIONS (Exemplar Composition)
// ============================================================================

/**
 * Create a default PointerFrame (for testing/initialization)
 */
export function createDefaultFrame(overrides: Partial<PointerFrame> = {}): PointerFrame {
  return {
    ts: Date.now(),
    trackingOk: false,
    palmAngle: 90,
    gesture: 'None',
    confidence: 0,
    position: { x: 0.5, y: 0.5 },
    velocity: { vx: 0, vy: 0 },
    ...overrides,
  };
}

/**
 * Create a "hand detected, facing camera" frame
 */
export function createFacingFrame(
  ts: number,
  position: NormalizedPosition,
  gesture: GestureLabel = 'Open_Palm',
  palmAngle: number = 20,
  confidence: number = 0.9
): PointerFrame {
  return {
    ts,
    trackingOk: true,
    palmAngle,
    gesture,
    confidence,
    position,
    velocity: { vx: 0, vy: 0 },
  };
}

/**
 * Create a "tracking lost" frame
 */
export function createLostFrame(ts: number, lastPosition: NormalizedPosition, lastVelocity: Velocity2D): PointerFrame {
  return {
    ts,
    trackingOk: false,
    palmAngle: 90,
    gesture: 'None',
    confidence: 0,
    position: lastPosition,
    velocity: lastVelocity,
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isTrackingAction(action: W3CPointerAction): action is W3CPointerAction & { type: 'enter' | 'move' | 'down' | 'up' } {
  return ['enter', 'move', 'down', 'up'].includes(action.type);
}

export function isTerminalAction(action: W3CPointerAction): action is W3CPointerAction & { type: 'cancel' | 'leave' } {
  return ['cancel', 'leave'].includes(action.type);
}

export function isClickAction(action: W3CPointerAction): action is W3CPointerAction & { type: 'down' | 'up' } {
  return ['down', 'up'].includes(action.type);
}
