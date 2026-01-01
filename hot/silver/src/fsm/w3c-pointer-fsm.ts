/**
 * W3C Pointer Events Level 3 Compliant FSM
 * 
 * Gen87.X3 | Hot Silver | Port 3 (DELIVER)
 * 
 * DESIGN PRINCIPLES:
 * 1. Palm angle is CONTINUOUS (0-180°), not binary
 * 2. Palm facing camera (< threshold) = tracking active
 * 3. Palm roll away (> threshold) = pointercancel (user clutch)
 * 4. Open_Palm + facing = ARMED (ready for gestures)
 * 5. Schmitt trigger hysteresis prevents oscillation
 * 
 * STATE MODEL (4 states):
 * IDLE → TRACKING → ARMED → ENGAGED
 *          ↓          ↓        ↓
 *       COASTING  COASTING  COASTING
 *          ↓          ↓        ↓
 *        IDLE       IDLE     IDLE
 * 
 * W3C POINTER EVENT MAPPING:
 * - IDLE: No events (hand not detected or palm away)
 * - TRACKING: pointermove (palm facing, any gesture)
 * - ARMED: pointermove (Open_Palm + palm facing = ready)
 * - ENGAGED: pointerdown → pointermove (Pointing_Up held)
 * - Exit via palm roll: pointercancel
 * - Exit via tracking loss: COASTING → timeout → pointercancel
 */

import { setup, createActor, assign, type ActorRefFrom, type SnapshotFrom } from 'xstate';

// ============================================================================
// CONFIGURATION - Schmitt Trigger Hysteresis
// ============================================================================

export interface GateConfig {
  palm: {
    /** Palm angle to ENTER tracking (< this = facing camera) */
    enterThreshold: number;
    /** Palm angle to EXIT tracking (> this = facing away) - hysteresis band */
    exitThreshold: number;
    /** Palm angle for IMMEDIATE cancel (intentional roll away) */
    cancelThreshold: number;
  };
  confidence: {
    /** Confidence to arm (high bar) */
    armThreshold: number;
    /** Confidence to maintain (lower bar - hysteresis) */
    maintainThreshold: number;
    /** Confidence for immediate drop */
    dropThreshold: number;
  };
  timing: {
    /** Ignore None gesture if < this duration (transition noise) */
    noneDebounceMs: number;
    /** Time palm must be stable to arm */
    armStableMs: number;
    /** Max coasting duration before cancel */
    coastingMaxMs: number;
  };
  coasting: {
    /** Velocity damping per frame */
    damping: number;
    /** Stop coasting when velocity below this */
    minVelocity: number;
  };
}

export const DEFAULT_GATE_CONFIG: GateConfig = {
  palm: {
    enterThreshold: 30,    // < 30° from camera normal = facing
    exitThreshold: 45,     // > 45° = facing away (15° hysteresis band)
    cancelThreshold: 70,   // > 70° = immediate cancel (intentional roll)
  },
  confidence: {
    armThreshold: 0.7,
    maintainThreshold: 0.5,
    dropThreshold: 0.25,
  },
  timing: {
    noneDebounceMs: 80,
    armStableMs: 150,
    coastingMaxMs: 2000,
  },
  coasting: {
    damping: 0.92,
    minVelocity: 0.0005,
  },
};

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface PointerFrame {
  /** Timestamp in ms */
  ts: number;
  /** Is hand being tracked? */
  trackingOk: boolean;
  /** Palm angle from camera normal (0° = facing directly, 90° = perpendicular, 180° = facing away) */
  palmAngle: number;
  /** Gesture label from MediaPipe */
  gesture: 'None' | 'Open_Palm' | 'Pointing_Up' | 'Victory' | 'Thumb_Up' | 'Thumb_Down' | 'Closed_Fist';
  /** Gesture confidence 0-1 */
  confidence: number;
  /** Index fingertip position (normalized 0-1) */
  position: { x: number; y: number };
  /** Velocity for coasting */
  velocity?: { vx: number; vy: number };
}

// ============================================================================
// OUTPUT TYPES (W3C Pointer Events)
// ============================================================================

export type W3CPointerAction = 
  | { type: 'none' }
  | { type: 'enter'; x: number; y: number; pointerId: number }
  | { type: 'move'; x: number; y: number; pointerId: number }
  | { type: 'down'; x: number; y: number; pointerId: number; button: number }
  | { type: 'up'; x: number; y: number; pointerId: number; button: number }
  | { type: 'cancel'; pointerId: number }
  | { type: 'leave'; pointerId: number };

// ============================================================================
// FSM CONTEXT
// ============================================================================

interface FSMContext {
  /** Current pointer ID (stable per session) */
  pointerId: number;
  /** Last valid position */
  position: { x: number; y: number };
  /** Velocity for coasting */
  velocity: { vx: number; vy: number };
  /** When palm became stable (for arming) */
  palmStableAt: number | null;
  /** When coasting started */
  coastStartAt: number | null;
  /** Last valid gesture timestamp (for None debounce) */
  lastValidGestureAt: number;
  /** Previous palm angle (for hysteresis state) */
  wasFacing: boolean;
  /** Gate configuration */
  config: GateConfig;
}

type FSMEvent = 
  | { type: 'FRAME'; frame: PointerFrame }
  | { type: 'CANCEL' };

// ============================================================================
// COMPUTED GATES (Schmitt Trigger Logic)
// ============================================================================

/**
 * Schmitt trigger for palm facing detection
 * Uses hysteresis to prevent oscillation
 */
function isPalmFacing(palmAngle: number, wasFacing: boolean, config: GateConfig): boolean {
  if (wasFacing) {
    // Currently facing - need to exceed EXIT threshold to stop
    return palmAngle < config.palm.exitThreshold;
  } else {
    // Currently not facing - need to go below ENTER threshold to start
    return palmAngle < config.palm.enterThreshold;
  }
}

/**
 * Immediate cancel check (user intentional roll away)
 */
function isPalmRolledAway(palmAngle: number, config: GateConfig): boolean {
  return palmAngle >= config.palm.cancelThreshold;
}

/**
 * Check if gesture is stable (not transition noise)
 */
function isGestureStable(frame: PointerFrame, lastValidGestureAt: number, config: GateConfig): boolean {
  if (frame.gesture === 'None') {
    // None is only valid if held for debounce period
    return (frame.ts - lastValidGestureAt) >= config.timing.noneDebounceMs;
  }
  return true; // Non-None gestures are immediately valid
}

// ============================================================================
// XSTATE V5 MACHINE
// ============================================================================

const pointerFSM = setup({
  types: {
    context: {} as FSMContext,
    events: {} as FSMEvent,
  },
  guards: {
    // Palm is facing camera (with hysteresis)
    isPalmFacingCamera: ({ context, event }) => {
      if (event.type !== 'FRAME') return false;
      return isPalmFacing(event.frame.palmAngle, context.wasFacing, context.config);
    },
    
    // Palm rolled away intentionally (immediate cancel)
    isPalmRolledAway: ({ context, event }) => {
      if (event.type !== 'FRAME') return false;
      return isPalmRolledAway(event.frame.palmAngle, context.config);
    },
    
    // Tracking is OK
    isTrackingOk: ({ event }) => {
      if (event.type !== 'FRAME') return false;
      return event.frame.trackingOk;
    },
    
    // Tracking lost
    isTrackingLost: ({ event }) => {
      if (event.type !== 'FRAME') return false;
      return !event.frame.trackingOk;
    },
    
    // Open palm gesture (for arming)
    isOpenPalm: ({ context, event }) => {
      if (event.type !== 'FRAME') return false;
      return event.frame.gesture === 'Open_Palm' && 
             event.frame.confidence >= context.config.confidence.armThreshold;
    },
    
    // Palm stable for arm duration
    isPalmStable: ({ context, event }) => {
      if (event.type !== 'FRAME') return false;
      if (context.palmStableAt === null) return false;
      return (event.frame.ts - context.palmStableAt) >= context.config.timing.armStableMs;
    },
    
    // Pointing gesture (for engage)
    isPointing: ({ context, event }) => {
      if (event.type !== 'FRAME') return false;
      const frame = event.frame;
      return frame.gesture === 'Pointing_Up' && 
             frame.confidence >= context.config.confidence.armThreshold &&
             isGestureStable(frame, context.lastValidGestureAt, context.config);
    },
    
    // Coasting timeout
    isCoastingTimeout: ({ context, event }) => {
      if (event.type !== 'FRAME') return false;
      if (context.coastStartAt === null) return false;
      return (event.frame.ts - context.coastStartAt) >= context.config.timing.coastingMaxMs;
    },
    
    // Coasting velocity depleted
    isCoastingDepleted: ({ context }) => {
      const v = context.velocity;
      const speed = Math.sqrt(v.vx * v.vx + v.vy * v.vy);
      return speed < context.config.coasting.minVelocity;
    },
  },
  actions: {
    updatePosition: assign({
      position: ({ event }) => {
        if (event.type !== 'FRAME') return { x: 0.5, y: 0.5 };
        return { ...event.frame.position };
      },
      velocity: ({ context, event }) => {
        if (event.type !== 'FRAME') return context.velocity;
        return event.frame.velocity ?? context.velocity;
      },
      wasFacing: ({ context, event }) => {
        if (event.type !== 'FRAME') return context.wasFacing;
        return isPalmFacing(event.frame.palmAngle, context.wasFacing, context.config);
      },
      lastValidGestureAt: ({ context, event }) => {
        if (event.type !== 'FRAME') return context.lastValidGestureAt;
        if (event.frame.gesture !== 'None') return event.frame.ts;
        return context.lastValidGestureAt;
      },
    }),
    
    recordPalmStable: assign({
      palmStableAt: ({ event }) => {
        if (event.type !== 'FRAME') return null;
        return event.frame.ts;
      },
    }),
    
    clearPalmStable: assign({
      palmStableAt: null,
    }),
    
    startCoasting: assign({
      coastStartAt: ({ event }) => {
        if (event.type !== 'FRAME') return null;
        return event.frame.ts;
      },
      // IMPORTANT: Always use context.velocity (the last known velocity)
      // because the frame triggering coasting (trackingOk: false) won't have velocity
      velocity: ({ context }) => {
        return { ...context.velocity };
      },
    }),
    
    updateCoastPosition: assign({
      position: ({ context }) => {
        // Apply damping to velocity and update position
        const damping = context.config.coasting.damping;
        const newVx = context.velocity.vx * damping;
        const newVy = context.velocity.vy * damping;
        return {
          x: Math.max(0, Math.min(1, context.position.x + newVx)),
          y: Math.max(0, Math.min(1, context.position.y + newVy)),
        };
      },
      velocity: ({ context }) => {
        const damping = context.config.coasting.damping;
        return {
          vx: context.velocity.vx * damping,
          vy: context.velocity.vy * damping,
        };
      },
    }),
    
    clearCoasting: assign({
      coastStartAt: null,
    }),
    
    setFacingTrue: assign({
      wasFacing: true,
    }),
    
    setFacingFalse: assign({
      wasFacing: false,
    }),
  },
}).createMachine({
  id: 'w3cPointerFSM',
  initial: 'IDLE',
  context: ({ input }: { input?: { config?: Partial<GateConfig>; pointerId?: number } }) => ({
    pointerId: input?.pointerId ?? 1,
    position: { x: 0.5, y: 0.5 },
    velocity: { vx: 0, vy: 0 },
    palmStableAt: null,
    coastStartAt: null,
    lastValidGestureAt: 0,
    wasFacing: false,
    config: { ...DEFAULT_GATE_CONFIG, ...input?.config },
  }),

  states: {
    /**
     * IDLE: No cursor active
     * Entry: Hand not detected OR palm facing away
     * Exit: Palm faces camera → TRACKING
     */
    IDLE: {
      on: {
        FRAME: [
          {
            guard: ({ context, event }) => {
              if (event.type !== 'FRAME') return false;
              return event.frame.trackingOk && 
                     isPalmFacing(event.frame.palmAngle, context.wasFacing, context.config);
            },
            target: 'TRACKING',
            actions: ['updatePosition', 'recordPalmStable', 'setFacingTrue'],
          },
          {
            // Stay in IDLE, update facing state
            actions: 'updatePosition',
          },
        ],
      },
    },

    /**
     * TRACKING: Cursor active, emitting pointermove
     * Entry: Palm facing camera
     * Exit: Open_Palm + stable → ARMED
     * Exit: Palm roll away → IDLE (pointercancel)
     * Exit: Tracking lost → COASTING
     */
    TRACKING: {
      on: {
        FRAME: [
          // Palm rolled away intentionally → IDLE with cancel
          {
            guard: 'isPalmRolledAway',
            target: 'IDLE',
            actions: ['clearPalmStable', 'setFacingFalse'],
          },
          // Tracking lost → COASTING
          {
            guard: 'isTrackingLost',
            target: 'COASTING',
            actions: 'startCoasting',
          },
          // Palm no longer facing (hysteresis exit) → IDLE
          {
            guard: ({ context, event }) => {
              if (event.type !== 'FRAME') return false;
              return !isPalmFacing(event.frame.palmAngle, context.wasFacing, context.config);
            },
            target: 'IDLE',
            actions: ['clearPalmStable', 'setFacingFalse'],
          },
          // Open palm + stable + high confidence → ARMED
          {
            guard: ({ context, event }) => {
              if (event.type !== 'FRAME') return false;
              const frame = event.frame;
              const isOpen = frame.gesture === 'Open_Palm';
              const highConfidence = frame.confidence >= context.config.confidence.armThreshold;
              const stable = context.palmStableAt !== null &&
                            (frame.ts - context.palmStableAt) >= context.config.timing.armStableMs;
              return isOpen && highConfidence && stable;
            },
            target: 'ARMED',
            actions: 'updatePosition',
          },
          // Low confidence Open_Palm - still tracking, reset stability timer
          {
            guard: ({ context, event }) => {
              if (event.type !== 'FRAME') return false;
              const frame = event.frame;
              return frame.gesture === 'Open_Palm' && 
                     frame.confidence < context.config.confidence.armThreshold;
            },
            actions: ['updatePosition', 'recordPalmStable'],
          },
          // Not open palm - reset stability timer
          {
            guard: ({ event }) => {
              if (event.type !== 'FRAME') return false;
              return event.frame.gesture !== 'Open_Palm';
            },
            actions: ['updatePosition', 'recordPalmStable'],
          },
          // Stay in TRACKING (Open_Palm with high confidence, not yet stable)
          {
            actions: 'updatePosition',
          },
        ],
        CANCEL: {
          target: 'IDLE',
          actions: ['clearPalmStable', 'setFacingFalse'],
        },
      },
    },

    /**
     * ARMED: Ready for gestures (Open_Palm + facing)
     * Entry: Open palm held while facing camera
     * Exit: Pointing_Up → ENGAGED (pointerdown)
     * Exit: Palm roll away → IDLE (pointercancel)
     * Exit: Tracking lost → COASTING
     */
    ARMED: {
      on: {
        FRAME: [
          // Palm rolled away intentionally → IDLE with cancel
          {
            guard: 'isPalmRolledAway',
            target: 'IDLE',
            actions: ['clearPalmStable', 'setFacingFalse'],
          },
          // Tracking lost → COASTING
          {
            guard: 'isTrackingLost',
            target: 'COASTING',
            actions: 'startCoasting',
          },
          // Palm no longer facing → IDLE
          {
            guard: ({ context, event }) => {
              if (event.type !== 'FRAME') return false;
              return !isPalmFacing(event.frame.palmAngle, context.wasFacing, context.config);
            },
            target: 'IDLE',
            actions: ['clearPalmStable', 'setFacingFalse'],
          },
          // Pointing gesture → ENGAGED
          {
            guard: 'isPointing',
            target: 'ENGAGED',
            actions: 'updatePosition',
          },
          // Stay in ARMED
          {
            actions: 'updatePosition',
          },
        ],
        CANCEL: {
          target: 'IDLE',
          actions: ['clearPalmStable', 'setFacingFalse'],
        },
      },
    },

    /**
     * ENGAGED: Pointer down, dragging
     * Entry: Pointing_Up from ARMED
     * Exit: Open_Palm return → ARMED (pointerup)
     * Exit: Palm roll away → IDLE (pointercancel)
     * Exit: Tracking lost → COASTING
     */
    ENGAGED: {
      on: {
        FRAME: [
          // Palm rolled away intentionally → IDLE with cancel
          {
            guard: 'isPalmRolledAway',
            target: 'IDLE',
            actions: ['clearPalmStable', 'setFacingFalse'],
          },
          // Tracking lost → COASTING
          {
            guard: 'isTrackingLost',
            target: 'COASTING',
            actions: 'startCoasting',
          },
          // Palm no longer facing → IDLE (cancel drag)
          {
            guard: ({ context, event }) => {
              if (event.type !== 'FRAME') return false;
              return !isPalmFacing(event.frame.palmAngle, context.wasFacing, context.config);
            },
            target: 'IDLE',
            actions: ['clearPalmStable', 'setFacingFalse'],
          },
          // Return to Open_Palm → ARMED (pointerup)
          {
            guard: 'isOpenPalm',
            target: 'ARMED',
            actions: 'updatePosition',
          },
          // Stay in ENGAGED (dragging)
          {
            actions: 'updatePosition',
          },
        ],
        CANCEL: {
          target: 'IDLE',
          actions: ['clearPalmStable', 'setFacingFalse'],
        },
      },
    },

    /**
     * COASTING: Tracking lost, using physics prediction
     * Entry: Tracking lost from any active state
     * Exit: Tracking recovered → previous state (CHECK FIRST!)
     * Exit: Timeout → IDLE (pointercancel)
     * Exit: Velocity depleted → IDLE (pointercancel)
     */
    COASTING: {
      on: {
        FRAME: [
          // PRIORITY 1: Tracking recovered + palm facing → TRACKING
          // Must check BEFORE timeout/depleted to allow recovery
          {
            guard: ({ context, event }) => {
              if (event.type !== 'FRAME') return false;
              return event.frame.trackingOk && 
                     isPalmFacing(event.frame.palmAngle, true, context.config);
            },
            target: 'TRACKING',
            actions: ['clearCoasting', 'updatePosition', 'recordPalmStable', 'setFacingTrue'],
          },
          // Timeout → IDLE
          {
            guard: 'isCoastingTimeout',
            target: 'IDLE',
            actions: ['clearCoasting', 'setFacingFalse'],
          },
          // Velocity depleted → IDLE (only if no recovery)
          {
            guard: 'isCoastingDepleted',
            target: 'IDLE',
            actions: ['clearCoasting', 'setFacingFalse'],
          },
          // Continue coasting
          {
            actions: 'updateCoastPosition',
          },
        ],
        CANCEL: {
          target: 'IDLE',
          actions: ['clearCoasting', 'setFacingFalse'],
        },
      },
    },
  },
});

// ============================================================================
// FSM ADAPTER CLASS
// ============================================================================

export type PointerFSMState = 'IDLE' | 'TRACKING' | 'ARMED' | 'ENGAGED' | 'COASTING';

export class W3CPointerFSM {
  private actor: ActorRefFrom<typeof pointerFSM>;
  private previousState: PointerFSMState = 'IDLE';
  private config: GateConfig;

  constructor(config: Partial<GateConfig> = {}, pointerId: number = 1) {
    this.config = { ...DEFAULT_GATE_CONFIG, ...config };
    this.actor = createActor(pointerFSM, {
      input: { config: this.config, pointerId },
    });
    this.actor.start();
  }

  /**
   * Process a frame and get W3C pointer action
   */
  process(frame: PointerFrame): W3CPointerAction {
    const prevState = this.actor.getSnapshot().value as PointerFSMState;
    this.previousState = prevState;

    this.actor.send({ type: 'FRAME', frame });

    const snapshot = this.actor.getSnapshot();
    const newState = snapshot.value as PointerFSMState;
    const ctx = snapshot.context;

    return this.computeAction(prevState, newState, ctx);
  }

  private computeAction(
    prevState: PointerFSMState,
    newState: PointerFSMState,
    ctx: FSMContext
  ): W3CPointerAction {
    const { position, pointerId } = ctx;

    // State transition logic for W3C events
    
    // IDLE → TRACKING: pointerenter
    if (prevState === 'IDLE' && newState === 'TRACKING') {
      return { type: 'enter', x: position.x, y: position.y, pointerId };
    }

    // Any → IDLE: pointercancel or pointerleave
    if (newState === 'IDLE' && prevState !== 'IDLE') {
      if (prevState === 'ENGAGED') {
        return { type: 'cancel', pointerId }; // Cancel drag
      }
      return { type: 'leave', pointerId };
    }

    // ARMED → ENGAGED: pointerdown
    if (prevState === 'ARMED' && newState === 'ENGAGED') {
      return { type: 'down', x: position.x, y: position.y, pointerId, button: 0 };
    }

    // ENGAGED → ARMED: pointerup
    if (prevState === 'ENGAGED' && newState === 'ARMED') {
      return { type: 'up', x: position.x, y: position.y, pointerId, button: 0 };
    }

    // Active states (TRACKING, ARMED, ENGAGED): pointermove
    if (newState === 'TRACKING' || newState === 'ARMED' || newState === 'ENGAGED') {
      return { type: 'move', x: position.x, y: position.y, pointerId };
    }

    // COASTING: no events (still predicting)
    if (newState === 'COASTING') {
      return { type: 'none' };
    }

    return { type: 'none' };
  }

  /**
   * Get current FSM state
   */
  getState(): PointerFSMState {
    return this.actor.getSnapshot().value as PointerFSMState;
  }

  /**
   * Get current context
   */
  getContext(): FSMContext {
    return this.actor.getSnapshot().context;
  }

  /**
   * Get current position (works during coasting too)
   */
  getPosition(): { x: number; y: number } {
    return { ...this.actor.getSnapshot().context.position };
  }

  /**
   * Force cancel (external trigger)
   */
  cancel(): void {
    this.actor.send({ type: 'CANCEL' });
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.actor.stop();
  }

  /**
   * Get configuration
   */
  getConfig(): GateConfig {
    return { ...this.config };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { pointerFSM };
export type { FSMContext, FSMEvent };
