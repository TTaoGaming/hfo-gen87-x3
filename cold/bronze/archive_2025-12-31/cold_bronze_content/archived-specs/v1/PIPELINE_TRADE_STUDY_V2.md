# W3C Gesture Control Plane - Pipeline Trade Study V2

> **Generation**: 87.X3  
> **Date**: 2025-12-30  
> **Phase**: HUNT (H) - Hexagonal CDD Exemplar Analysis  
> **Focus**: Composable Adapters for MAP-Elite Quality Diversity  
> **Status**: Tavily-Grounded + Sequential Thinking Validated

---

## 🎯 Executive Summary

**Goal**: Build a **vendor-neutral**, **composable** gesture control pipeline using **Hexagonal Architecture** (Ports & Adapters). Each pipeline stage has:

1. **Port** = Interface contract (Zod schema)
2. **Adapters** = Multiple interchangeable implementations
3. **Feature Dimensions** = Metrics for MAP-Elite diversity

**Why Hexagonal CDD?**
- Swap MediaPipe for TensorFlow.js without touching core logic
- Test with mock adapters, deploy with real ones
- AI swarms can combine/evolve adapter combinations
- No vendor lock-in: every stage has alternatives

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    HEXAGONAL CDD GESTURE PIPELINE (V2)                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│   │  INPUT PORT     │  │  SMOOTH PORT    │  │  FSM PORT       │  │  TARGET PORT    │   │
│   │  (IInputSensor) │→ │  (ISmoother)    │→ │  (IStateMachine)│→ │  (ITargetAdapter│   │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │
│            │                    │                    │                    │             │
│   ┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐   │
│   │ MediaPipeAdapter│  │ OneEuroAdapter  │  │ XStateAdapter   │  │ DOMAdapter      │   │
│   │ TFJSAdapter     │  │ RapierAdapter   │  │ RobotAdapter    │  │ V86Adapter      │   │
│   │ HandtrackAdapter│  │ KalmanAdapter   │  │ MachinaAdapter  │  │ JsDosAdapter    │   │
│   │ + fingerpose    │  │ NEuroAdapter    │  │ SCXMLAdapter    │  │ ExcalidrawAdapter│  │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                                         │
│   Zod Contract ←───────────────────────────────────────────────────→ Zod Contract      │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Hexagonal CDD Architecture Pattern

### Core Concepts

| Concept | Definition | HFO Example |
|---------|------------|-------------|
| **Port** | Interface/contract defining what the core needs | `IInputSensor.sense(): Promise<HandFrame>` |
| **Adapter** | Concrete implementation of a port | `MediaPipeAdapter implements IInputSensor` |
| **Core** | Business logic, knows only ports | Pipeline orchestrator |
| **DI Container** | Wires adapters to ports at runtime | `container.bind('InputPort').to(MediaPipeAdapter)` |

### TypeScript Pattern (Source: [LinkedIn DDD Article](https://www.linkedin.com/pulse/implementing-hexagonal-architecture-ddd-typescript-haidery-d0cof))

```typescript
// 1. Define Port (Interface)
interface InputSensorPort {
  sense(): Promise<HandFrame>;
  start(): Promise<void>;
  stop(): void;
}

// 2. Define Adapter (Implementation)
class MediaPipeAdapter implements InputSensorPort {
  async sense(): Promise<HandFrame> { /* MediaPipe specific */ }
  async start(): Promise<void> { /* init camera + model */ }
  stop(): void { /* cleanup */ }
}

// 3. Wire via DI Container
const container = new Container();
container.bind<InputSensorPort>('InputSensorPort').to(MediaPipeAdapter);

// 4. Core logic uses only Port
class GesturePipeline {
  constructor(@inject('InputSensorPort') private sensor: InputSensorPort) {}
  
  async run() {
    const frame = await this.sensor.sense(); // No MediaPipe knowledge!
    // ... process through other ports
  }
}
```

**Source**: [AWS Hexagonal Architecture](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/hexagonal-architecture.html)

---

## 📊 Stage 1: INPUT SENSING PORT

### Port Contract (Zod Schema)

```typescript
import { z } from 'zod';

// Individual landmark (21 per hand)
export const LandmarkSchema = z.object({
  x: z.number(), // 0-1 normalized
  y: z.number(), // 0-1 normalized
  z: z.number(), // depth (optional accuracy)
});

// MediaPipe gesture categories
export const GestureNameSchema = z.enum([
  'None',
  'Closed_Fist',
  'Open_Palm',
  'Pointing_Up',
  'Thumb_Down',
  'Thumb_Up',
  'Victory',
  'ILoveYou',
  // Custom gestures via fingerpose
  'Custom_1',
  'Custom_2',
]);

// HandFrame: Output of any InputSensor adapter
export const HandFrameSchema = z.object({
  timestamp: z.number(),           // performance.now()
  handedness: z.enum(['Left', 'Right']),
  landmarks: z.array(LandmarkSchema).length(21),
  gesture: z.object({
    name: GestureNameSchema,
    confidence: z.number().min(0).max(1),
  }),
  worldLandmarks: z.array(LandmarkSchema).length(21).optional(), // 3D world coords
});

export type HandFrame = z.infer<typeof HandFrameSchema>;

// PORT INTERFACE
export interface IInputSensorPort {
  readonly id: string;
  sense(): Promise<HandFrame | null>;
  start(videoElement: HTMLVideoElement): Promise<void>;
  stop(): void;
  isRunning(): boolean;
}
```

### Adapter Comparison Matrix

| Adapter | Package | Size | FPS | Gestures | Custom Gestures | License | Stars |
|---------|---------|------|-----|----------|-----------------|---------|-------|
| **MediaPipe Tasks Vision** | `@mediapipe/tasks-vision` | ~5MB | 30+ | ✅ 7 built-in | Via fingerpose | Apache 2.0 | N/A (Google) |
| **TensorFlow.js Handpose** | `@tensorflow-models/hand-pose-detection` | ~3MB | 20-30 | ❌ Manual | Via fingerpose | Apache 2.0 | 18K |
| **Handtrack.js** | `handtrackjs` | ~2MB | 15-25 | ❌ None | Via post-process | MIT | 3.5K |
| **OpenCV.js** | `opencv.js` | ~8MB | 15-25 | ❌ None | Custom CV | Apache 2.0 | 79K |

**Source**: [TensorFlow Blog](https://blog.tensorflow.org/2020/03/face-and-hand-tracking-in-browser-with-mediapipe-and-tensorflowjs.html), [Google AI Edge](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js)

### 🔌 fingerpose: Universal Gesture Extension

**KEY INSIGHT**: fingerpose works with ANY landmark detector. It's a **composable add-on**, not a replacement.

```typescript
// Works with MediaPipe OR TensorFlow.js OR any 21-landmark detector
import * as fp from 'fingerpose';

// Define custom gesture (e.g., "Rock On" 🤘)
const rockOnGesture = new fp.GestureDescription('Rock_On');
rockOnGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl);
rockOnGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl);
rockOnGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl);
rockOnGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl);
rockOnGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl);

// Create estimator with built-in + custom gestures
const gestureEstimator = new fp.GestureEstimator([
  fp.Gestures.VictoryGesture,
  fp.Gestures.ThumbsUpGesture,
  rockOnGesture, // Custom!
]);

// Use with any landmarks (21 points × 3 coords)
const estimate = gestureEstimator.estimate(hand.landmarks, 8.5);
if (estimate.gestures.length > 0) {
  console.log(estimate.gestures[0].name); // 'Rock_On'
}
```

**Source**: [GitHub andypotato/fingerpose](https://github.com/andypotato/fingerpose), [GetStream Tutorial](https://getstream.io/blog/tensorflow-gesture-recognition/)

### Adapter Implementation Stubs

```typescript
// MediaPipe Adapter
class MediaPipeInputAdapter implements IInputSensorPort {
  readonly id = 'mediapipe';
  private gestureRecognizer: GestureRecognizer;
  private fingerpose: GestureEstimator; // Optional custom gestures
  
  async sense(): Promise<HandFrame | null> {
    const result = this.gestureRecognizer.recognizeForVideo(video, timestamp);
    if (!result.landmarks.length) return null;
    return {
      timestamp: performance.now(),
      handedness: result.handedness[0][0].categoryName,
      landmarks: result.landmarks[0],
      gesture: {
        name: result.gestures[0][0].categoryName,
        confidence: result.gestures[0][0].score,
      },
    };
  }
}

// TensorFlow.js Adapter (needs fingerpose for gestures)
class TFJSInputAdapter implements IInputSensorPort {
  readonly id = 'tfjs';
  private detector: HandDetector;
  private fingerpose: GestureEstimator;
  
  async sense(): Promise<HandFrame | null> {
    const hands = await this.detector.estimateHands(video);
    if (!hands.length) return null;
    
    // Use fingerpose for gesture recognition
    const estimate = this.fingerpose.estimate(hands[0].keypoints3D, 8.5);
    return {
      timestamp: performance.now(),
      handedness: hands[0].handedness,
      landmarks: hands[0].keypoints,
      gesture: {
        name: estimate.gestures[0]?.name ?? 'None',
        confidence: estimate.gestures[0]?.score ?? 0,
      },
    };
  }
}
```

---

## 📊 Stage 2: SMOOTHING/PREDICTION PORT

### Port Contract (Zod Schema)

```typescript
export const SmoothedFrameSchema = z.object({
  // Smoothed current position
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number().optional(),
  }),
  
  // Velocity (for prediction and gesture velocity thresholds)
  velocity: z.object({
    vx: z.number(), // pixels/second or normalized/second
    vy: z.number(),
  }),
  
  // Predicted future position (latency compensation)
  prediction: z.object({
    x: z.number(),
    y: z.number(),
    lookaheadMs: z.number(),
  }).optional(),
  
  // Pass-through from input
  gesture: HandFrameSchema.shape.gesture,
  handedness: z.enum(['Left', 'Right']),
  timestamp: z.number(),
});

export type SmoothedFrame = z.infer<typeof SmoothedFrameSchema>;

// PORT INTERFACE
export interface ISmootherPort {
  readonly id: string;
  smooth(frame: HandFrame): SmoothedFrame;
  reset(): void;
  configure(params: Record<string, number>): void;
}
```

### Adapter Comparison Matrix

| Adapter | Latency | Jitter | Prediction | Complexity | Dependencies | Params |
|---------|---------|--------|------------|------------|--------------|--------|
| **1€ Filter** | Very Low | ⭐⭐⭐⭐⭐ | ❌ No | Low | None (~50 LOC) | 3: fcmin, beta, dcutoff |
| **Rapier Physics** | Very Low | ⭐⭐⭐⭐⭐ | ✅ Yes (velocity) | Medium | @dimforge/rapier2d (~500KB) | 4: mass, stiffness, damping, lookahead |
| **Kalman Filter** | Low | ⭐⭐⭐⭐⭐ | ✅ Yes (state est.) | High | None (~200 LOC) | 4+ matrices |
| **N-euro Predictor** | Very Low | ⭐⭐⭐⭐ | ✅ Yes (neural) | High | TensorFlow.js | NN weights |
| **EMA** | Very Low | ⭐⭐⭐ | ❌ No | Very Low | None (~10 LOC) | 1: α |

**Source**: [1€ Filter Paper](https://inria.hal.science/hal-00670496v1/document), [casiez/OneEuroFilter](https://github.com/casiez/OneEuroFilter), [N-euro Paper](https://jianwang-cmu.github.io/23Neuro/N_euro_predictor.pdf)

### 1€ Filter Adapter

```typescript
// Source: https://github.com/casiez/OneEuroFilter/tree/main/typescript
class OneEuroFilterAdapter implements ISmootherPort {
  readonly id = 'oneEuro';
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;
  
  constructor(params = { freq: 60, mincutoff: 1.0, beta: 0.0, dcutoff: 1.0 }) {
    this.filterX = new OneEuroFilter(params.freq, params.mincutoff, params.beta, params.dcutoff);
    this.filterY = new OneEuroFilter(params.freq, params.mincutoff, params.beta, params.dcutoff);
  }
  
  smooth(frame: HandFrame): SmoothedFrame {
    const indexTip = frame.landmarks[8]; // Index finger tip
    const timestamp = frame.timestamp / 1000; // Convert to seconds
    
    return {
      position: {
        x: this.filterX.filter(indexTip.x, timestamp),
        y: this.filterY.filter(indexTip.y, timestamp),
      },
      velocity: {
        vx: this.filterX.dxHat,
        vy: this.filterY.dxHat,
      },
      // No prediction capability
      gesture: frame.gesture,
      handedness: frame.handedness,
      timestamp: frame.timestamp,
    };
  }
  
  configure(params: Record<string, number>): void {
    // Re-initialize filters with new params
  }
  
  reset(): void {
    this.filterX = new OneEuroFilter(60, 1.0, 0.0, 1.0);
    this.filterY = new OneEuroFilter(60, 1.0, 0.0, 1.0);
  }
}
```

### Rapier Physics Adapter (with Prediction)

```typescript
import RAPIER from '@dimforge/rapier2d';

class RapierSmootherAdapter implements ISmootherPort {
  readonly id = 'rapier';
  private world: RAPIER.World;
  private anchor: RAPIER.RigidBody;
  private cursor: RAPIER.RigidBody;
  private lookaheadMs = 50;
  
  constructor(params = { stiffness: 500, damping: 10, mass: 0.1, lookaheadMs: 50 }) {
    this.lookaheadMs = params.lookaheadMs;
    this.initPhysics(params);
  }
  
  private async initPhysics(params: any) {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: 0 }); // No gravity
    
    // Anchor follows raw input (kinematic)
    this.anchor = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased()
    );
    
    // Cursor follows anchor via spring (dynamic)
    this.cursor = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setLinearDamping(params.damping)
    );
    
    // Spring joint
    const jointParams = RAPIER.JointData.spring(
      0.0,               // Rest length
      params.stiffness,  // Spring constant
      params.damping,    // Damping
      { x: 0, y: 0 },
      { x: 0, y: 0 }
    );
    this.world.createImpulseJoint(jointParams, this.anchor, this.cursor, true);
  }
  
  smooth(frame: HandFrame): SmoothedFrame {
    const indexTip = frame.landmarks[8];
    
    // Move anchor to raw position
    this.anchor.setNextKinematicTranslation({ x: indexTip.x, y: indexTip.y });
    
    // Step physics
    this.world.step();
    
    const pos = this.cursor.translation();
    const vel = this.cursor.linvel();
    
    // Predict future position
    const lookaheadSec = this.lookaheadMs / 1000;
    
    return {
      position: { x: pos.x, y: pos.y },
      velocity: { vx: vel.x, vy: vel.y },
      prediction: {
        x: pos.x + vel.x * lookaheadSec,
        y: pos.y + vel.y * lookaheadSec,
        lookaheadMs: this.lookaheadMs,
      },
      gesture: frame.gesture,
      handedness: frame.handedness,
      timestamp: frame.timestamp,
    };
  }
  
  reset(): void {
    this.cursor.setTranslation({ x: 0.5, y: 0.5 }, true);
    this.cursor.setLinvel({ x: 0, y: 0 }, true);
  }
  
  configure(params: Record<string, number>): void {
    if (params.lookaheadMs) this.lookaheadMs = params.lookaheadMs;
  }
}
```

### Hybrid Adapter Pattern

```typescript
// Combine 1€ for denoising + Rapier for smoothing/prediction
class HybridSmootherAdapter implements ISmootherPort {
  readonly id = 'hybrid';
  private preFilter: OneEuroFilterAdapter;
  private physics: RapierSmootherAdapter;
  
  constructor() {
    this.preFilter = new OneEuroFilterAdapter({ mincutoff: 0.5, beta: 0.1 });
    this.physics = new RapierSmootherAdapter({ stiffness: 300 });
  }
  
  smooth(frame: HandFrame): SmoothedFrame {
    // 1. Denoise with 1€ (removes sensor noise)
    const denoised = this.preFilter.smooth(frame);
    
    // 2. Smooth + predict with Rapier (natural motion)
    const fakeFrame: HandFrame = {
      ...frame,
      landmarks: frame.landmarks.map((l, i) => 
        i === 8 ? { x: denoised.position.x, y: denoised.position.y, z: l.z } : l
      ),
    };
    
    return this.physics.smooth(fakeFrame);
  }
}
```

---

## 📊 Stage 3: FSM PORT

### Port Contract (Zod Schema)

```typescript
export const FSMStateSchema = z.enum([
  'OFFLINE',
  'STARTING',
  'SENSING',
  'DISARMED',
  'ARMING',
  'ARMED',
  'POINTING',
  'PANNING',
  'ZOOMING',
  'ERROR',
]);

export const FSMEventSchema = z.enum([
  'INIT',
  'STARTED',
  'HAND_DETECTED',
  'HAND_LOST',
  'PALM_DETECTED',
  'PALM_TIMEOUT',
  'POINTING_UP',
  'VICTORY',
  'THUMB_UP',
  'THUMB_DOWN',
  'GESTURE_END',
  'ERROR',
]);

export const FSMOutputSchema = z.object({
  state: FSMStateSchema,
  previousState: FSMStateSchema,
  event: FSMEventSchema,
  // Action to emit
  action: z.enum(['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'wheel', 'none']),
  // Context data
  context: z.record(z.unknown()).optional(),
});

export type FSMState = z.infer<typeof FSMStateSchema>;
export type FSMEvent = z.infer<typeof FSMEventSchema>;
export type FSMOutput = z.infer<typeof FSMOutputSchema>;

// PORT INTERFACE
export interface IFSMPort {
  readonly id: string;
  send(event: FSMEvent, data?: SmoothedFrame): FSMOutput;
  getState(): FSMState;
  reset(): void;
  subscribe(callback: (output: FSMOutput) => void): () => void;
}
```

### Adapter Comparison Matrix

| Adapter | Package | Size | TypeScript | Visualizer | Hierarchical | SCXML | Actors |
|---------|---------|------|------------|------------|--------------|-------|--------|
| **XState v5** | `xstate` | ~40KB | ⭐⭐⭐⭐⭐ Native | ✅ Stately.ai | ✅ | Partial | ✅ |
| **Robot.js** | `robot3` | ~2KB | ⭐⭐⭐ | ❌ | ❌ | ❌ | ❌ |
| **Machina.js** | `machina` | ~15KB | ⭐⭐⭐ | ✅ Basic | ✅ | ❌ | ❌ |
| **jssm** | `jssm` | ~20KB | ⭐⭐⭐⭐ | ❌ | ❌ | ❌ | ❌ |
| **SCION-CORE** | `scion-core` | ~30KB | ⭐⭐ | ❌ | ✅ | ✅ W3C | ❌ |
| **kingly** | `kingly` | ~8KB | ⭐⭐⭐⭐ | ❌ | ✅ | ❌ | ❌ |

**Source**: [Awesome FSM](https://github.com/leonardomso/awesome-fsm), [XState Docs](https://stately.ai/docs/xstate), [statecharts.dev](https://statecharts.dev/resources.html)

### XState Adapter

```typescript
import { setup, createActor, type AnyActorRef } from 'xstate';

class XStateAdapter implements IFSMPort {
  readonly id = 'xstate';
  private actor: AnyActorRef;
  private subscribers: Set<(output: FSMOutput) => void> = new Set();
  
  constructor() {
    const machine = setup({
      types: {
        context: {} as { lastPosition: { x: number; y: number } },
        events: {} as 
          | { type: 'PALM_DETECTED' }
          | { type: 'POINTING_UP'; data: SmoothedFrame }
          | { type: 'VICTORY'; data: SmoothedFrame }
          | { type: 'GESTURE_END' }
          | { type: 'HAND_LOST' },
      },
      guards: {
        isPalmFacing: ({ context }) => true, // Implement palm orientation check
      },
      actions: {
        notifySubscribers: ({ context, event }, params) => {
          this.subscribers.forEach(cb => cb(params as FSMOutput));
        },
      },
    }).createMachine({
      id: 'gesture',
      initial: 'DISARMED',
      context: { lastPosition: { x: 0.5, y: 0.5 } },
      states: {
        DISARMED: {
          on: { PALM_DETECTED: 'ARMING' },
        },
        ARMING: {
          after: { 500: { target: 'ARMED', guard: 'isPalmFacing' } },
          on: { HAND_LOST: 'DISARMED' },
        },
        ARMED: {
          on: {
            POINTING_UP: { target: 'POINTING', actions: ['notifySubscribers'] },
            VICTORY: { target: 'PANNING', actions: ['notifySubscribers'] },
            HAND_LOST: 'DISARMED',
          },
        },
        POINTING: {
          entry: [{ type: 'notifySubscribers', params: { action: 'pointerdown' } }],
          on: { GESTURE_END: { target: 'ARMED', actions: ['notifySubscribers'] } },
        },
        PANNING: {
          entry: [{ type: 'notifySubscribers', params: { action: 'pointerdown' } }],
          on: { GESTURE_END: { target: 'ARMED', actions: ['notifySubscribers'] } },
        },
      },
    });
    
    this.actor = createActor(machine);
    this.actor.start();
  }
  
  send(event: FSMEvent, data?: SmoothedFrame): FSMOutput {
    const previousState = this.actor.getSnapshot().value as FSMState;
    this.actor.send({ type: event, data });
    const newState = this.actor.getSnapshot().value as FSMState;
    
    return {
      state: newState,
      previousState,
      event,
      action: this.determineAction(previousState, newState),
    };
  }
  
  private determineAction(from: FSMState, to: FSMState): FSMOutput['action'] {
    if (from === 'ARMED' && (to === 'POINTING' || to === 'PANNING')) return 'pointerdown';
    if ((from === 'POINTING' || from === 'PANNING') && to === 'ARMED') return 'pointerup';
    if (from === 'POINTING' || from === 'PANNING') return 'pointermove';
    return 'none';
  }
  
  getState(): FSMState {
    return this.actor.getSnapshot().value as FSMState;
  }
  
  reset(): void {
    this.actor.stop();
    // Re-create actor
  }
  
  subscribe(callback: (output: FSMOutput) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}
```

### Robot.js Adapter (Lightweight Alternative)

```typescript
import { createMachine, state, transition, invoke, reduce } from 'robot3';

class RobotAdapter implements IFSMPort {
  readonly id = 'robot';
  private machine: any;
  private current: FSMState = 'DISARMED';
  
  constructor() {
    this.machine = createMachine({
      DISARMED: state(
        transition('PALM_DETECTED', 'ARMING')
      ),
      ARMING: state(
        transition('PALM_TIMEOUT', 'ARMED'),
        transition('HAND_LOST', 'DISARMED')
      ),
      ARMED: state(
        transition('POINTING_UP', 'POINTING'),
        transition('VICTORY', 'PANNING'),
        transition('HAND_LOST', 'DISARMED')
      ),
      POINTING: state(
        transition('GESTURE_END', 'ARMED')
      ),
      PANNING: state(
        transition('GESTURE_END', 'ARMED')
      ),
    });
  }
  
  send(event: FSMEvent): FSMOutput {
    const previousState = this.current;
    // Robot.js transition logic
    this.current = this.machine.current.name as FSMState;
    return {
      state: this.current,
      previousState,
      event,
      action: 'none', // Determine based on transition
    };
  }
  
  getState(): FSMState { return this.current; }
  reset(): void { this.current = 'DISARMED'; }
  subscribe(cb: (o: FSMOutput) => void): () => void { return () => {}; }
}
```

---

## 📊 Stage 4: OUTPUT EVENTS PORT (W3C Standard)

### Port Contract (W3C PointerEvent)

```typescript
// W3C Pointer Events Level 3
// Source: https://www.w3.org/TR/pointerevents/
export const PointerEventOutSchema = z.object({
  type: z.enum(['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerover', 'pointerout']),
  
  // Identity
  pointerId: z.number().int().default(1),
  pointerType: z.enum(['mouse', 'pen', 'touch']).default('pen'),
  
  // Position (client coordinates)
  clientX: z.number(),
  clientY: z.number(),
  screenX: z.number().optional(),
  screenY: z.number().optional(),
  
  // Geometry
  width: z.number().default(1),
  height: z.number().default(1),
  
  // Pressure/Tilt (pen-like features)
  pressure: z.number().min(0).max(1).default(0.5),
  tangentialPressure: z.number().min(-1).max(1).default(0),
  tiltX: z.number().min(-90).max(90).default(0),
  tiltY: z.number().min(-90).max(90).default(0),
  twist: z.number().min(0).max(359).default(0),
  
  // Buttons
  button: z.number().int().default(0), // -1=move, 0=left, 1=middle, 2=right
  buttons: z.number().int().default(0), // Bitmask
  
  // Flags
  isPrimary: z.boolean().default(true),
  bubbles: z.boolean().default(true),
  cancelable: z.boolean().default(true),
  
  // Predicted events (W3C Pointer Events Level 3)
  predictedEvents: z.array(z.lazy(() => PointerEventOutSchema)).optional(),
});

export type PointerEventOut = z.infer<typeof PointerEventOutSchema>;

// PORT INTERFACE (single implementation - standard compliance)
export interface IOutputPort {
  createEvent(type: PointerEventOut['type'], frame: SmoothedFrame, viewport: DOMRect): PointerEvent;
}
```

### Standard Implementation (No Alternatives Needed)

```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/PointerEvent

class W3CPointerEventFactory implements IOutputPort {
  private pointerId = 1; // Unique per "virtual finger"
  
  createEvent(
    type: PointerEventOut['type'],
    frame: SmoothedFrame,
    viewport: DOMRect
  ): PointerEvent {
    // Transform normalized (0-1) to client coordinates
    const clientX = frame.position.x * viewport.width + viewport.left;
    const clientY = frame.position.y * viewport.height + viewport.top;
    
    // Create synthetic PointerEvent
    return new PointerEvent(type, {
      pointerId: this.pointerId,
      pointerType: 'pen', // Gesture = stylus-like
      clientX,
      clientY,
      screenX: clientX + window.screenX,
      screenY: clientY + window.screenY,
      
      // Pressure from gesture (e.g., pinch distance)
      pressure: type === 'pointermove' ? 0.5 : (type === 'pointerdown' ? 1.0 : 0.0),
      
      // Tilt from hand orientation (if available)
      tiltX: 0,
      tiltY: 0,
      
      // Buttons
      button: type === 'pointermove' ? -1 : 0,
      buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
      
      isPrimary: true,
      bubbles: true,
      cancelable: true,
    });
  }
}
```

---

## 📊 Stage 5: TARGET ADAPTER PORT

### Port Contract

```typescript
export const TargetTypeSchema = z.enum([
  'dom',
  'emulator-x86',
  'emulator-dos',
  'emulator-console',
  'whiteboard',
  'iframe',
  'native',
]);

export interface ITargetAdapterPort {
  readonly id: string;
  readonly type: z.infer<typeof TargetTypeSchema>;
  
  // Core methods
  inject(event: PointerEvent): void;
  getBounds(): DOMRect;
  
  // Lifecycle
  attach(target: HTMLElement | string): void;
  detach(): void;
  isReady(): boolean;
  
  // Input capture
  lock(): void;
  unlock(): void;
}
```

### Adapter Comparison Matrix

| Adapter | Type | API Pattern | Latency | Cross-Origin | Complexity |
|---------|------|-------------|---------|--------------|------------|
| **DOM dispatchEvent** | dom | `element.dispatchEvent(event)` | <1ms | ❌ | Very Low |
| **tldraw** | whiteboard | DOM events (React) | <1ms | ❌ | Very Low |
| **Excalidraw** | whiteboard | `onPointerDown/Up` callbacks | <1ms | ❌ | Low |
| **v86** | emulator-x86 | `bus.send('mouse-delta', ...)` | 1-5ms | ❌ | Medium |
| **js-dos** | emulator-dos | `setMouseSensitivity()`, events | 1-5ms | ❌ | Medium |
| **EmulatorJS** | emulator-console | `EJS_defaultControls` | 1-5ms | ❌ | Medium |
| **PostMessage** | iframe | `iframe.contentWindow.postMessage()` | 1-10ms | ✅ | Low |
| **nut.js** | native | `mouse.move()`, `mouse.click()` | 1ms | N/A | High (Node.js) |

### DOM Adapter (Simplest)

```typescript
class DOMTargetAdapter implements ITargetAdapterPort {
  readonly id = 'dom';
  readonly type = 'dom' as const;
  private target: HTMLElement | null = null;
  
  attach(target: HTMLElement | string): void {
    this.target = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;
  }
  
  inject(event: PointerEvent): void {
    this.target?.dispatchEvent(event);
  }
  
  getBounds(): DOMRect {
    return this.target?.getBoundingClientRect() ?? new DOMRect();
  }
  
  lock(): void {
    this.target?.requestPointerLock?.();
  }
  
  unlock(): void {
    document.exitPointerLock?.();
  }
  
  isReady(): boolean {
    return this.target !== null;
  }
  
  detach(): void {
    this.target = null;
  }
}
```

### V86 Emulator Adapter

```typescript
// Source: https://github.com/copy/v86
class V86TargetAdapter implements ITargetAdapterPort {
  readonly id = 'v86';
  readonly type = 'emulator-x86' as const;
  private emulator: any; // V86 instance
  private lastX = 0;
  private lastY = 0;
  
  attach(emulatorInstance: any): void {
    this.emulator = emulatorInstance;
  }
  
  inject(event: PointerEvent): void {
    // v86 uses relative mouse deltas
    const deltaX = event.clientX - this.lastX;
    const deltaY = event.clientY - this.lastY;
    
    // Send mouse delta via bus
    this.emulator.bus.send('mouse-delta', [deltaX, deltaY]);
    
    // Handle buttons
    if (event.type === 'pointerdown') {
      this.emulator.bus.send('mouse-click', [1, true]); // Left button down
    } else if (event.type === 'pointerup') {
      this.emulator.bus.send('mouse-click', [1, false]); // Left button up
    }
    
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }
  
  lock(): void {
    this.emulator?.lock_mouse?.();
  }
  
  unlock(): void {
    document.exitPointerLock?.();
  }
  
  getBounds(): DOMRect {
    const container = document.getElementById('screen_container');
    return container?.getBoundingClientRect() ?? new DOMRect();
  }
  
  isReady(): boolean {
    return this.emulator !== null;
  }
  
  detach(): void {
    this.emulator = null;
  }
}
```

### JS-DOS Adapter

```typescript
// Source: https://js-dos.com/player-api.html
class JsDosTargetAdapter implements ITargetAdapterPort {
  readonly id = 'jsdos';
  readonly type = 'emulator-dos' as const;
  private dos: any; // js-dos instance
  
  attach(dosInstance: any): void {
    this.dos = dosInstance;
    // Configure for gesture control
    this.dos.setMouseSensitivity(1.0);
    this.dos.setNoCursor(true); // Hide system cursor
  }
  
  inject(event: PointerEvent): void {
    // js-dos can receive synthetic events directly
    const canvas = document.querySelector('.dosbox-canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.dispatchEvent(event);
    }
  }
  
  lock(): void {
    // js-dos autolock via config
    // Or trigger via canvas click
  }
  
  getBounds(): DOMRect {
    const canvas = document.querySelector('.dosbox-canvas');
    return canvas?.getBoundingClientRect() ?? new DOMRect();
  }
  
  isReady(): boolean {
    return this.dos !== null;
  }
  
  detach(): void {
    this.dos = null;
  }
}
```

### Excalidraw Adapter

```typescript
// Excalidraw uses React refs for pointer events
class ExcalidrawTargetAdapter implements ITargetAdapterPort {
  readonly id = 'excalidraw';
  readonly type = 'whiteboard' as const;
  private excalidrawAPI: any;
  
  attach(api: any): void {
    this.excalidrawAPI = api;
  }
  
  inject(event: PointerEvent): void {
    // Excalidraw's canvas element
    const canvas = document.querySelector('.excalidraw__canvas') as HTMLCanvasElement;
    if (canvas) {
      // Transform to canvas coordinates
      const bounds = canvas.getBoundingClientRect();
      const canvasEvent = new PointerEvent(event.type, {
        ...event,
        clientX: event.clientX - bounds.left,
        clientY: event.clientY - bounds.top,
      });
      canvas.dispatchEvent(canvasEvent);
    }
  }
  
  getBounds(): DOMRect {
    const canvas = document.querySelector('.excalidraw__canvas');
    return canvas?.getBoundingClientRect() ?? new DOMRect();
  }
  
  isReady(): boolean {
    return this.excalidrawAPI !== null;
  }
  
  lock(): void {}
  unlock(): void {}
  detach(): void { this.excalidrawAPI = null; }
}
```

---

## 📈 MAP-Elite Feature Dimensions

For quality-diversity optimization, each adapter combination has these feature dimensions:

### Input Adapters
| Dimension | Range | Measurement |
|-----------|-------|-------------|
| Latency (ms) | 0-100 | Time from frame to landmarks |
| Bundle Size (KB) | 0-10000 | Minified + gzipped |
| Gesture Count | 0-50 | Built-in + custom via fingerpose |
| Accuracy (%) | 0-100 | Landmark precision |
| Browser Support (%) | 0-100 | Can I Use data |

### Smoothing Adapters
| Dimension | Range | Measurement |
|-----------|-------|-------------|
| Latency Added (ms) | 0-50 | Processing overhead |
| Jitter Reduction (%) | 0-100 | Variance reduction |
| Has Prediction | 0/1 | Boolean |
| Prediction Accuracy (%) | 0-100 | MSE of lookahead |
| Complexity (LOC) | 0-1000 | Lines of code |

### FSM Adapters
| Dimension | Range | Measurement |
|-----------|-------|-------------|
| Bundle Size (KB) | 0-100 | Minified |
| TypeScript Support | 0-5 | Stars rating |
| Has Visualizer | 0/1 | Boolean |
| SCXML Compliant | 0/1 | W3C standard |
| Learning Curve (hours) | 0-40 | Time to productivity |

### Target Adapters
| Dimension | Range | Measurement |
|-----------|-------|-------------|
| Injection Latency (ms) | 0-20 | dispatchEvent overhead |
| Cross-Origin Support | 0/1 | Boolean |
| Lock Support | 0/1 | Pointer Lock API |
| Native Look | 0/1 | Indistinguishable from real input |

---

## 🔓 Vendor Neutrality Matrix

| Stage | Primary | Alternative 1 | Alternative 2 | Alternative 3 |
|-------|---------|---------------|---------------|---------------|
| **Input** | MediaPipe | TensorFlow.js + fingerpose | Handtrack.js | OpenCV.js |
| **Smooth** | Rapier | 1€ Filter | Kalman | N-euro |
| **FSM** | XState | Robot.js | Machina | SCION (SCXML) |
| **Output** | W3C PointerEvent | (Standard - no alternatives) | | |
| **Target** | DOM | v86 | js-dos | Excalidraw |

**Key Vendor Neutrality Points:**
1. **fingerpose** works with ANY landmark detector (not locked to MediaPipe)
2. **SCXML** is a W3C standard for state machines (not locked to XState)
3. **W3C PointerEvents** are browser-standard (no library needed)
4. **All smoothing algorithms** are pure math (no vendor lock-in)

---

## 🔗 Composability Matrix

Which adapters work well together?

| Input → | Smooth | Works | Notes |
|---------|--------|-------|-------|
| MediaPipe | 1€ Filter | ✅ | Lowest latency combo |
| MediaPipe | Rapier | ✅ | Best for prediction |
| TensorFlow.js | Rapier | ✅ | Need fingerpose for gestures |
| Handtrack.js | EMA | ✅ | Simplest combo |

| Smooth → | FSM | Works | Notes |
|----------|-----|-------|-------|
| Any | XState | ✅ | Best TypeScript |
| Any | Robot.js | ✅ | Smallest bundle |
| Any | SCION | ✅ | W3C SCXML compliant |

| FSM → | Target | Works | Notes |
|-------|--------|-------|-------|
| Any | DOM | ✅ | Universal |
| Any | v86 | ✅ | Need delta conversion |
| Any | js-dos | ✅ | Direct events work |
| Any | Excalidraw | ✅ | Canvas dispatch |

---

## 📋 Implementation Roadmap

### Phase 1: Foundation (I Phase - Interlock)
1. [ ] Define all Zod port contracts
2. [ ] Create DI container (`tsyringe` or `inversify`)
3. [ ] Implement DOM target adapter (simplest)
4. [ ] Write contract tests for ports

### Phase 2: Core Adapters (V Phase - Validate)
1. [ ] MediaPipe input adapter
2. [ ] 1€ Filter smoother adapter
3. [ ] XState FSM adapter
4. [ ] Integration tests

### Phase 3: Alternatives (E Phase - Evolve)
1. [ ] TensorFlow.js + fingerpose input adapter
2. [ ] Rapier physics smoother adapter
3. [ ] Robot.js FSM adapter
4. [ ] v86 target adapter

### Phase 4: MAP-Elite (E Phase - Evolve)
1. [ ] Feature dimension measurement harness
2. [ ] Adapter combination generator
3. [ ] Quality-diversity search
4. [ ] Pareto frontier visualization

---

## 📡 Blackboard Signals

```json
{"ts":"2025-12-30T12:00:00Z","mark":1.0,"pull":"downstream","msg":"HUNT: Created PIPELINE_TRADE_STUDY_V2.md - Hexagonal CDD architecture with ports/adapters, MAP-Elite feature dimensions, vendor neutrality matrix, Tavily-grounded sources","type":"event","hive":"H","gen":87,"port":0}
```

---

## 📚 Sources

| Topic | Source | URL |
|-------|--------|-----|
| MediaPipe Gestures | Google AI Edge | https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js |
| TensorFlow.js Handpose | TF Blog | https://blog.tensorflow.org/2021/11/3D-handpose.html |
| fingerpose | GitHub | https://github.com/andypotato/fingerpose |
| 1€ Filter | HAL-Inria | https://inria.hal.science/hal-00670496v1/document |
| 1€ Filter Implementations | GitHub | https://github.com/casiez/OneEuroFilter |
| N-euro Predictor | CMU | https://jianwang-cmu.github.io/23Neuro/N_euro_predictor.pdf |
| XState | Stately | https://stately.ai/docs/xstate |
| FSM Libraries | GitHub | https://github.com/leonardomso/awesome-fsm |
| W3C Pointer Events | W3C | https://www.w3.org/TR/pointerevents/ |
| Hexagonal Architecture | AWS | https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/hexagonal-architecture.html |
| Hexagonal DDD TypeScript | LinkedIn | https://www.linkedin.com/pulse/implementing-hexagonal-architecture-ddd-typescript-haidery-d0cof |
| v86 Emulator | GitHub | https://github.com/copy/v86 |
| js-dos API | js-dos.com | https://js-dos.com/player-api.html |

---

*The spider weaves the web that weaves the spider.*  
*Gen87.X3 Hunt Phase | 2025-12-30*
