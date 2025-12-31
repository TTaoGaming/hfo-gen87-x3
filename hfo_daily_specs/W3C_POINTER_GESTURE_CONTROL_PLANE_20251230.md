# W3C Pointer Gesture Control Plane Specification

> **Version**: 1.6.0  
> **Date**: 2025-12-30  
> **Generation**: 87.X3  
> **Status**: VALIDATE (V) - TDD GREEN Phase  
> **Author**: Gen87.X3 AI Swarm  
> **Mission Fit Score**: 8.0/10 → Target 9.5/10  
> **Test Status**: 785 tests (185 RED / 593 GREEN / 7 SKIP)  
> **PDCA Cycle**: CHECK | **HIVE/8**: V (Validate) | **TDD**: GREEN  
> **Last Update**: 2025-12-30T17:00Z (Stage 4+5 Implemented)  
> **Substrate**: **NATS JetStream** (NOT EventEmitter - production architecture)  
> **Related Docs**: [Executive Summary](../sandbox/specs/GEN87_X3_EXECUTIVE_SUMMARY_20251230T2230Z.md) | [Deep Dive](../sandbox/specs/GEN87_X3_DEEP_DIVE_20251230T2230Z.md)

---

## 0. Implementation Status (UPDATED 2025-12-30T17:00Z)

### ✅ PRODUCTION READY (593 tests GREEN)

| Component | Location | Tests | Status |
|-----------|----------|-------|--------|
| XState FSM Adapter | `adapters/xstate-fsm.adapter.ts` | 22 | ✅ GREEN |
| Gesture Language Grammar | `physics/gesture-language.ts` | 17 | ✅ GREEN |
| Gesture Transition Model | `physics/gesture-transition-model.ts` | 17 | ✅ GREEN |
| **Rapier WASM Simulator** | `physics/rapier-wasm-simulator.ts` | **23** | ✅ GREEN |
| 1€ Filter Adapter | `adapters/one-euro.adapter.ts` | - | ✅ GREEN |
| Palm Orientation Gate | `gesture/palm-orientation-gate.ts` | 18 | ✅ GREEN |
| Stigmergy Contract | `contracts/stigmergy.contract.ts` | 34 | ✅ GREEN |
| Golden Input Fixtures | `test-fixtures/golden-input.ts` | 36 | ✅ GREEN |
| Emulator Adapters (schema) | `adapters/emulator-adapters.test.ts` | 34 | ✅ GREEN |
| **W3CPointerEventFactory** | `phase1-w3c-cursor/w3c-pointer-factory.ts` | **37** | ✅ **NEW** |
| **DOMEventDispatcher** | `phase1-w3c-cursor/w3c-pointer-factory.ts` | incl. | ✅ **NEW** |
| **CursorPipeline** | `phase1-w3c-cursor/w3c-pointer-factory.ts` | incl. | ✅ **NEW** |

### 🎬 Visual Verification (Playwright Screenshots)

16 screenshots captured demonstrating full FSM cycle:
- `01-initial-disarmed.png` - DISARMED state (red cursor)
- `02-arming-state.png` - ARMING state (yellow pulse animation)
- `03-armed-state.png` - ARMED state (green cursor)
- `05-during-click.png` - DOWN_COMMIT state (blue click)
- `07-multi-targets-hit.png` - Multiple targets clicked
- `08-cycle-*` - Complete DISARMED→ARMING→ARMED→DOWN_COMMIT→ARMED→DISARMED

### ❌ TDD RED STUBS (185 tests failing)

| Component | Location | Priority | Blocker? |
|-----------|----------|----------|----------|
| UIShellFactory | `adapters/ui-shell-port.test.ts` | HIGH | NO |
| MultiHandManager | `phase1-w3c-cursor/` | MEDIUM | NO |
| CommitGestureAdapter | `gesture/` | MEDIUM | NO |
| DegradationStrategy | `phase1-w3c-cursor/` | MEDIUM | NO |

### ⚠️ REWARD HACK REMEDIATED

**Incident**: `RapierTrajectorySimulator` claimed Rapier physics but used plain JS spring-damper.  
**Fix**: Created `RapierWasmSimulator` with real `@dimforge/rapier2d-compat` WASM.  
**Verification**: 23 tests GREEN including golden input E2E.

---

## 0.1 Standards Alignment Audit

### 0.1 Stage-by-Stage Standards Analysis

| Stage | Component | Standard? | Exemplar | Gap | Priority |
|-------|-----------|-----------|----------|-----|----------|
| 1. SENSOR | SensorFrame | ❌ | MediaPipe (Google TRL9) | No W3C webcam hand standard | Low |
| 2. SMOOTHER | SmoothedFrame | ❌ | 1€ Filter (CHI 2012) | Exemplar-only, no standard | Low |
| 3. FSM | FSMAction | ⚠️ | XState (SCXML-adherent) | Output is CUSTOM, could be W3C | Medium |
| 4. EMITTER | PointerEventOut | ✅ | W3C Pointer Events L3 | **IMPLEMENTED** | Done |
| 5. TARGET | dispatchEvent | ✅ | W3C EventTarget | Fully standard | Done |

### 0.2 W3C PointerEventInit Gap (RESOLVED)

**Source**: [W3C Pointer Events Level 3](https://www.w3.org/TR/pointerevents/)

**IMPLEMENTED** in `W3CPointerEventFactory`:
- `tangentialPressure` - pen barrel pressure
- `twist` - pen rotation [0,359]
- `tiltX`, `tiltY` - pen tilt angles [-90,90]
- `pressure` - primary pressure [0,1]
- `pointerId`, `pointerType`, `isPrimary` - device identification

```typescript
// MISSING FROM CURRENT PointerEventOutSchema:
tangentialPressure: number;  // [0,1] - pen barrel pressure
twist: number;               // [0,359] - pen rotation
altitudeAngle: number;       // pen angle from surface (L3)
azimuthAngle: number;        // pen angle around axis (L3)
persistentDeviceId: number;  // device identifier (L3)
coalescedEvents: PointerEvent[];  // batched high-freq events
predictedEvents: PointerEvent[];  // W3C NATIVE PREDICTION!
```

**Key Insight**: W3C Pointer Events L3 has `predictedEvents` natively!
Our 1€ filter prediction could complement/validate browser prediction.

### 0.3 Intermediary Contracts for Polymorphism Unlock

| Contract | Purpose | Polymorphism Gain |
|----------|---------|-------------------|
| `PointerEventInitSchema` | Full W3C compliance | +1.0 (8.5/10) |
| `MediaPipeResultSchema` | Explicit sensor input | Swap to TensorFlow.js |
| `MouseEventInitSchema` | Parent class properties | Complete event chain |
| `SCXMLEventSchema` | SCXML event naming | Formal FSM interop |

### 0.4 TDD Phase Mapping (HIVE/8)

| HIVE Phase | TDD Phase | Port Pairs | Current Status |
|------------|-----------|------------|----------------|
| H (Hunt) | Research | 0+7 | ✅ COMPLETE |
| I (Interlock) | RED | 1+6 | 🔴 IN PROGRESS |
| V (Validate) | GREEN | 2+5 | ⏳ PENDING |
| E (Evolve) | REFACTOR | 3+4 | ⏳ PENDING |

---

## 1. Executive Summary

**Vision**: Total Tool Virtualization via gesture-to-W3C-pointer translation.

```
MediaPipe → Smoother → FSM → W3C Pointer → ANY TARGET
                                    ↓
              ┌─────────────────────┴────────────────────┐
              │                                          │
         DOM/Canvas                                 Emulators
         • Excalidraw (54K⭐)                       • v86 (x86)
         • tldraw (15K⭐)                           • js-dos
         • Any element                              • EmulatorJS
                                                    • daedalOS (12K⭐)
                                                    • Puter (38K⭐)
```

---

## 2. Pipeline Architecture (5 Stages)

### Stage Overview

| Stage | Name | Input | Output | Primary Tech |
|-------|------|-------|--------|--------------|
| 1 | SENSOR | Camera frame | `SensorFrame` | MediaPipe Tasks Vision |
| 2 | SMOOTHER | `SensorFrame` | `SmoothedFrame` | 1€ Filter + Rapier (hybrid) |
| 3 | FSM | `SmoothedFrame` | `FSMAction` | XState v5 |
| 4 | EMITTER | `FSMAction` | `PointerEvent` | W3C Pointer Events API |
| 5 | TARGET | `PointerEvent` | Side effects | Target Adapters |

### Data Flow

```
┌─────────┐    ┌──────────┐    ┌─────┐    ┌─────────┐    ┌────────┐
│ SENSOR  │───▶│ SMOOTHER │───▶│ FSM │───▶│ EMITTER │───▶│ TARGET │
└─────────┘    └──────────┘    └─────┘    └─────────┘    └────────┘
     │              │            │             │              │
SensorFrame   SmoothedFrame  FSMAction   PointerEvent    dispatch()
```

---

## 3. Contract Definitions (Zod Schemas)

### 3.1 SensorFrame (Stage 1 Output)

```typescript
const SensorFrame = z.object({
  frameId: z.number().int().nonnegative(),
  timestamp: z.number().nonnegative(),
  landmarks: z.array(z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    z: z.number(),
  })).length(21),
  gesture: z.enum([
    'None', 'Closed_Fist', 'Open_Palm', 'Pointing_Up',
    'Thumb_Down', 'Thumb_Up', 'Victory', 'ILoveYou'
  ]),
  handedness: z.enum(['Left', 'Right']),
  confidence: z.number().min(0).max(1),
});
```

### 3.2 SmoothedFrame (Stage 2 Output)

```typescript
const SmoothedFrame = z.object({
  frameId: z.number().int().nonnegative(),
  timestamp: z.number().nonnegative(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  velocity: z.object({
    x: z.number(),
    y: z.number(),
  }),
  predicted: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  gesture: z.enum([
    'None', 'Closed_Fist', 'Open_Palm', 'Pointing_Up',
    'Thumb_Down', 'Thumb_Up', 'Victory', 'ILoveYou'
  ]),
  palmFacing: z.boolean(),
});
```

### 3.3 FSMAction (Stage 3 Output)

```typescript
const FSMAction = z.object({
  type: z.enum([
    'MOVE', 'CLICK', 'DRAG_START', 'DRAG_END',
    'SCROLL', 'ZOOM', 'NONE'
  ]),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  state: z.enum([
    'idle', 'tracking', 'armed', 'clicking',
    'dragging', 'scrolling', 'zooming'
  ]),
  metadata: z.record(z.unknown()).optional(),
});
```

### 3.4 PointerEventOut (Stage 4 Output) - W3C COMPLIANT (UPDATED)

```typescript
// Full W3C Pointer Events Level 3 compliance
// Source: https://www.w3.org/TR/pointerevents/
const PointerEventOut = z.object({
  // Event type
  type: z.enum([
    'pointerdown', 'pointerup', 'pointermove',
    'pointerenter', 'pointerleave', 'pointercancel'
  ]),
  
  // Position (from MouseEvent)
  clientX: z.number(),
  clientY: z.number(),
  screenX: z.number().optional(),  // NEW
  screenY: z.number().optional(),  // NEW
  
  // Pointer identity
  pointerId: z.number().int().default(0),
  pointerType: z.enum(['mouse', 'pen', 'touch']),
  isPrimary: z.boolean().default(true),
  persistentDeviceId: z.number().int().default(0),  // NEW (L3)
  
  // Contact geometry
  width: z.number().positive().default(1),
  height: z.number().positive().default(1),
  
  // Pressure
  pressure: z.number().min(0).max(1).default(0),
  tangentialPressure: z.number().min(0).max(1).default(0),  // NEW
  
  // Tilt/Rotation
  tiltX: z.number().min(-90).max(90).default(0),
  tiltY: z.number().min(-90).max(90).default(0),
  twist: z.number().min(0).max(359).default(0),  // NEW
  altitudeAngle: z.number().optional(),  // NEW (L3)
  azimuthAngle: z.number().optional(),   // NEW (L3)
  
  // Modifier keys (from MouseEvent)
  ctrlKey: z.boolean().default(false),   // NEW
  shiftKey: z.boolean().default(false),  // NEW
  altKey: z.boolean().default(false),    // NEW
  metaKey: z.boolean().default(false),   // NEW
  
  // Button state (from MouseEvent)
  button: z.number().int().min(-1).max(2).default(-1),
  buttons: z.number().int().min(0).default(0),
  
  // High-frequency batching (L3)
  coalescedEvents: z.array(z.lazy(() => PointerEventOut)).optional(),  // NEW
  predictedEvents: z.array(z.lazy(() => PointerEventOut)).optional(),  // NEW - W3C NATIVE PREDICTION!
});
```

**W3C Compliance Rules** (Test assertions from W3C):
- If `pointerType === 'mouse'` && `buttons === 0`: `pressure` MUST be `0`
- If `pointerType === 'mouse'` && `buttons > 0`: `pressure` MUST be `0.5`
- If `pointerType === 'mouse'`: `tiltX` and `tiltY` MUST be `0`
- `twist` MUST be in range `[0, 359]`
- `pressure` MUST be in range `[0, 1]`

---

## 4. Port Interfaces (Hexagonal CDD)

### 4.1 Port Interface Pattern

```typescript
interface Port<TInput, TOutput> {
  readonly name: string;
  readonly inputSchema: z.ZodSchema<TInput>;
  readonly outputSchema: z.ZodSchema<TOutput>;
  process(input: TInput): TOutput | Promise<TOutput>;
}
```

### 4.2 Port Definitions

| Port | Input | Output | Adapters |
|------|-------|--------|----------|
| `SensorPort` | `MediaPipeResults` | `SensorFrame` | MediaPipeAdapter |
| `SmootherPort` | `SensorFrame` | `SmoothedFrame` | OneEuroAdapter, RapierAdapter, HybridAdapter |
| `FSMPort` | `SmoothedFrame` | `FSMAction` | XStateFSMAdapter |
| `EmitterPort` | `FSMAction` | `PointerEventOut` | W3CPointerAdapter |
| `TargetPort` | `PointerEventOut` | `void` | DOMAdapter, ExcalidrawAdapter, V86Adapter, ... |

---

## 5. FSM State Machine

### 5.1 States

| State | Description | Entry Condition |
|-------|-------------|-----------------|
| `idle` | No hand detected | No landmarks |
| `tracking` | Hand visible, not engaged | Palm not facing camera |
| `armed` | Ready to commit gesture | Open_Palm facing camera for 300ms |
| `clicking` | Click in progress | Armed → Pointing_Up |
| `dragging` | Drag in progress | Armed → Closed_Fist |
| `scrolling` | Scroll in progress | Armed → Victory (2 fingers) |
| `zooming` | Zoom in progress | Two hands detected |

### 5.2 State Diagram (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> tracking : hand_detected
    tracking --> idle : hand_lost
    tracking --> armed : open_palm_300ms
    armed --> tracking : palm_away
    armed --> clicking : pointing_up
    armed --> dragging : closed_fist
    armed --> scrolling : victory
    clicking --> armed : open_palm
    clicking --> tracking : gesture_end
    dragging --> armed : open_palm
    dragging --> tracking : gesture_end
    scrolling --> armed : open_palm
    scrolling --> tracking : gesture_end
```

### 5.3 Palm Gating (Tighter Cone)

**Requirement**: Tighter cone for palm detection to reduce false positives.

```typescript
const PALM_CONE_THRESHOLD = 0.7; // cos(45°) ≈ 0.707

function isPalmFacing(landmarks: Landmark[]): boolean {
  const wrist = landmarks[0];
  const middleMCP = landmarks[9];
  const palmNormal = calculatePalmNormal(landmarks);
  
  // Dot product with camera direction (0, 0, -1)
  const dotProduct = -palmNormal.z;
  
  return dotProduct > PALM_CONE_THRESHOLD;
}
```

### 5.4 Arming Sequence (Open Palm → None → Gesture)

**Requirement**: Longer arming sequence for intentional gestures.

```
Open_Palm (300ms) → armed
armed + None (50ms grace) → still armed
armed + Pointing_Up → clicking
```

The FSM maintains `armed` state for 50ms after gesture becomes `None` to handle transition frames.

### 5.5 FSM Transition Insights (2025-12-30 User Notes)

> **Critical Observation**: MediaPipe gestures transition through `None` between gestures.
> Example: `Open_Palm` → `None` → `Pointing_Up` (for commit gesture)

#### Exemplar Composition (Names Only)

| Layer | Exemplar |
|-------|----------|
| Sensor | **MediaPipe Tasks Vision** |
| Smoother | **1€ Filter** + **Rapier** |
| FSM | **XState v5** |
| Events | **W3C Pointer Events Level 3** |
| Targets | **EventTarget.dispatchEvent** |

#### W3C Pointer Events State Machine

| W3C Event | Trigger | MediaPipe Gesture |
|-----------|---------|-------------------|
| `pointermove` | Hand tracking | Any (index finger tip) |
| `pointerover` | Palm facing camera 300ms | `Open_Palm` |
| `pointerdown` | Commit gesture start | `Pointing_Up` |
| `pointerup` | Commit gesture end | `Open_Palm` |
| `pointercancel` | Palm away / hand lost | Palm cone exit |

#### Key Design Principles

1. **`None` Transition Frames (Predictable)**
   - MediaPipe outputs brief `None` frames during gesture transitions
   - Example: `Open_Palm` → `None` → `Pointing_Up` 
   - Rapier physics predicts trajectory during `None` gap
   - NOT an error — expected waypoint in gesture language

2. **Palm Cone → `pointerover` / `pointercancel`**
   - Palm toward camera → emit `pointerover` (armed)
   - Palm away from camera → emit `pointercancel`
   - Threshold: `cos(32°) = 0.85` (TIGHT)

3. **Index Finger = `clientX`, `clientY` (IMMUTABLE)**
   - Index finger tip is ALWAYS the pointer position
   - Maps directly to W3C `PointerEvent.clientX/clientY`
   - Never changes regardless of gesture state

4. **`Pointing_Up` = `pointerdown` (Ergonomic Commit)**
   - MediaPipe `Pointing_Up` triggers `pointerdown`
   - **Ergonomic**: Middle/ring/pinky curl + thumb pinch = natural pointing
   - Index finger stays extended (cursor position stable)
   - Return to `Open_Palm` triggers `pointerup`

5. **W3C Pointer Event Sequence**
   ```
   pointermove (tracking) → pointerover (palm armed) → pointerdown (commit)
   pointerdown → pointerup (release) → pointermove (continue)
   pointerover → pointercancel (palm away / lost)
   ```

6. **Rapier Physics Roles (3 Functions)**
   
   **A. Spring-Driven Physics Cursor (Smoothing)**
   - Rapier spring-damper system for smooth cursor movement
   - Reduces jitter from raw MediaPipe coordinates
   - Feels "weighty" and intentional, not twitchy
   
   **B. Predictive Cursor**
   - Physics simulation predicts cursor position ahead of actual input
   - Reduces perceived latency (especially important at 30fps)
   - Magnetic snap-lock on tracking loss
   
   **C. State Transition Modeling**
   - Model gesture transitions as lines/gradients in state space
   - When user is constrained to known gesture language, transitions are predictable
   - Example: `Open_Palm → None → Pointing_Up` follows predictable trajectory
   - Simulate user intent during the `None` gap frames
   - "Wrong" gestures like `None` are expected waypoints, not errors

#### Palm Orientation Gating Specification

```typescript
// TIGHTER cone requirement - palm must face camera directly
const PALM_CONE_THRESHOLD_TIGHT = 0.85; // cos(~32°) - stricter than default

interface ArmingGate {
  isPalmFacingCamera: boolean;    // dot product > THRESHOLD
  palmConeAngle: number;          // radians from camera axis
  isArmed: boolean;               // sticky once armed
  armingDuration: number;         // ms palm has been facing
}

// Disarm conditions (emit pointercancel)
const DISARM_CONDITIONS = {
  palmFacingAway: true,           // palm cone leaves camera direction
  handLost: true,                 // tracking loss
  explicitGesture: 'Open_Palm',   // user explicitly resets
};
```

#### W3C Pointer Events Mapping (Authoritative)

| MediaPipe Input | W3C Output | Properties |
|-----------------|------------|------------|
| Any hand detected | `pointermove` | `clientX`, `clientY` from index tip |
| `Open_Palm` + palm cone | `pointerover` | `isPrimary: true` |
| `Pointing_Up` | `pointerdown` | `button: 0`, `buttons: 1` |
| Return to `Open_Palm` | `pointerup` | `button: 0`, `buttons: 0` |
| Palm cone exit | `pointercancel` | `isPrimary: true` |
| Hand lost | `pointercancel` | `isPrimary: true` |

---

## 6. Evolutionary Tuning Algorithm

### 6.1 Ring Buffer for Truth Comparison

```typescript
interface PredictionRecord {
  timestamp: number;
  predicted: { x: number; y: number };
  actual: { x: number; y: number };
  error: number;
}

class EvolutionaryTuner {
  private ringBuffer: PredictionRecord[] = [];
  private readonly bufferSize = 100;
  
  // 1€ Filter parameters
  private minCutoff = 1.0;
  private beta = 0.007;
  private dCutoff = 1.0;
  
  record(predicted: Point, actual: Point, timestamp: number) {
    const error = Math.hypot(predicted.x - actual.x, predicted.y - actual.y);
    this.ringBuffer.push({ timestamp, predicted, actual, error });
    if (this.ringBuffer.length > this.bufferSize) {
      this.ringBuffer.shift();
    }
  }
  
  evolve() {
    const avgError = this.ringBuffer.reduce((sum, r) => sum + r.error, 0) / this.ringBuffer.length;
    
    // Evolutionary adjustment
    if (avgError > 0.05) {
      // Too much lag - increase responsiveness
      this.minCutoff *= 1.1;
      this.beta *= 1.05;
    } else if (avgError < 0.02) {
      // Can afford more smoothing
      this.minCutoff *= 0.95;
    }
    
    return { minCutoff: this.minCutoff, beta: this.beta, dCutoff: this.dCutoff };
  }
}
```

### 6.2 Hybrid Smoother Evolution

```typescript
interface HybridConfig {
  oneEuro: { minCutoff: number; beta: number; dCutoff: number };
  rapier: { springStiffness: number; damping: number; mass: number };
  blendRatio: number; // 0 = pure 1€, 1 = pure Rapier
}

// Evolution adjusts all parameters based on prediction accuracy
```

---

## 7. Target Adapters

### 7.1 DOM Adapter (Default)

```typescript
class DOMTargetAdapter implements TargetPort {
  constructor(private target: HTMLElement = document.body) {}
  
  dispatch(event: PointerEventOut): void {
    const pointerEvent = new PointerEvent(event.type, {
      clientX: event.clientX,
      clientY: event.clientY,
      pressure: event.pressure,
      pointerType: event.pointerType,
      isPrimary: event.isPrimary,
      pointerId: event.pointerId,
      bubbles: true,
      cancelable: true,
    });
    this.target.dispatchEvent(pointerEvent);
  }
}
```

### 7.2 Excalidraw Adapter

```typescript
class ExcalidrawAdapter implements TargetPort {
  constructor(private excalidrawAPI: ExcalidrawAPI) {}
  
  dispatch(event: PointerEventOut): void {
    // Excalidraw uses standard pointer events on its canvas
    const canvas = this.excalidrawAPI.getSceneElements();
    // Route to canvas element
  }
}
```

### 7.3 V86 Emulator Adapter

```typescript
class V86Adapter implements TargetPort {
  constructor(private emulator: V86) {}
  
  private lastX = 0;
  private lastY = 0;
  
  dispatch(event: PointerEventOut): void {
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    
    // V86 uses relative mouse deltas
    this.emulator.bus.send('mouse-delta', [dx, dy]);
    
    if (event.type === 'pointerdown') {
      this.emulator.bus.send('mouse-click', [1, true]); // Left button down
    } else if (event.type === 'pointerup') {
      this.emulator.bus.send('mouse-click', [1, false]); // Left button up
    }
    
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }
}
```

### 7.4 daedalOS Adapter

```typescript
class DaedalOSAdapter implements TargetPort {
  constructor(private windowManager: WindowManager) {}
  
  dispatch(event: PointerEventOut): void {
    // Route through daedalOS window manager
    const targetWindow = this.windowManager.getWindowAt(event.clientX, event.clientY);
    if (targetWindow) {
      targetWindow.dispatchEvent(event);
    }
  }
}
```

---

## 8. TDD RED Test Inventory (UPDATED 2025-12-30)

### 8.1 Current Test Status

| Test File | Tests | Status | Coverage |
|-----------|-------|--------|----------|
| `contracts.test.ts` | 79 | 🟢 GREEN | Zod schema validation |
| `golden-master.test.ts` | 40 | 🟢 GREEN | Golden master testing |
| `observability-standards.test.ts` | 36 | 🟢 GREEN | CloudEvents/OTel/AsyncAPI |
| `cursor-pipeline.test.ts` | 63 | 🔴 RED | Phase 1 pipeline |
| `multi-hand.test.ts` | 30 | 🔴 RED | Phase 1.5 multi-hand |
| `commit-gesture.test.ts` | 31 | 🔴 RED | Gesture commit logic |
| `smoother-pipeline.test.ts` | 19 | 🔴 RED | Smoother adapters |
| `evolutionary-tuner.test.ts` | 26 | 🟢 GREEN | Ring buffer + evolution |
| `xstate-fsm.adapter.test.ts` | 18 | 🔴 RED | FSM adapter |
| `fsm.test.ts` | 12 | 🔴 RED | FSM state machine |
| `pipeline.test.ts` | 8 | 🔴 RED | Full pipeline |
| `palm-orientation.test.ts` | 15 | 🔴 RED | Palm gating |
| `puter-target.test.ts` | 38 | 🔴 RED | Puter.js adapter |
| **TOTAL** | **575** | **229 RED / 339 GREEN / 7 SKIP** | |

### 8.2 MISSING RED Tests (Priority Order)

#### HIGH PRIORITY - W3C Compliance

| Test File | Purpose | Tests Needed | HIVE Phase |
|-----------|---------|--------------|------------|
| `w3c-pointer-compliance.test.ts` | Full PointerEventInit | ~25 | I (Interlock) |
| `evolutionary-tuner.test.ts` | Ring buffer + evolution | ~20 | I (Interlock) |
| `fsm-state-transitions.test.ts` | Arming sequence | ~15 | I (Interlock) |
| `palm-cone-gating.test.ts` | 45° threshold | ~10 | I (Interlock) |

#### MEDIUM PRIORITY - Adapter Diversity

| Test File | Purpose | Tests Needed | HIVE Phase |
|-----------|---------|--------------|------------|
| `overlay-port.test.ts` | Pixi/Canvas/DOM | ~20 | V (Validate) |
| `ui-shell-port.test.ts` | Mosaic/Golden/Puter | ~25 | V (Validate) |
| `v86-adapter.test.ts` | x86 emulator | ~15 | E (Evolve) |
| `excalidraw-adapter.test.ts` | Whiteboard | ~10 | E (Evolve) |

### 8.3 Test Implementation Roadmap

```
Week 1: W3C Compliance (HIGH)
├─ w3c-pointer-compliance.test.ts (25 tests)
├─ evolutionary-tuner.test.ts (20 tests)
└─ fsm-state-transitions.test.ts (15 tests)

Week 2: UI Layer (MEDIUM)
├─ overlay-port.test.ts (20 tests)
├─ ui-shell-port.test.ts (25 tests)
└─ palm-cone-gating.test.ts (10 tests)

Week 3: Target Adapters (MEDIUM)
├─ v86-adapter.test.ts (15 tests)
├─ excalidraw-adapter.test.ts (10 tests)
└─ Integration tests
```

---

## 9. Demo Implementation Status

### 9.1 Current (Commit 9a9701b)

| Component | Status | Location |
|-----------|--------|----------|
| DOM Layers | ✅ Working | `sandbox/demo/index.html` |
| MediaPipe | ✅ Working | `sandbox/demo/main.js` |
| 1€ Filter | ✅ Working | `sandbox/demo/main.js` |
| Simplified FSM | ✅ Working | `sandbox/demo/main.js` |
| Triple Cursor | ✅ Working | Raw (red) + Smoothed (green) |
| Contracts | ✅ Defined | `sandbox/src/contracts/` |
| Adapters | 🔄 Partial | `sandbox/src/adapters/` |
| Tests | 🔴 575 (229 RED / 339 GREEN) | Vitest + fast-check |

### 9.2 Next Steps

1. **W3C Compliance** - Full PointerEventInit properties
2. **Tighter Palm Cone** - Implement 45° threshold
3. **Longer Arming** - Open_Palm → None → Gesture sequence
4. **Evolutionary Tuner** - Ring buffer + parameter evolution
5. **Target Adapters** - Excalidraw, V86, daedalOS

---

## 10. Notes from User (ttao-notes-2025-12-29)

> "need to note a few things. we need to visualize the state machine in a diagram to confirm. what I want is a tighter cone for palm gating and a longer arming to gesture sequence since open palm will transition to none and then to the gesture. so it's not a open palm to pointer for commit it's open pal to none to pointer, we need to have a evolutionary tuning algorithm for the smoothed and prediction pointer cursor, the idea is that it gets better with more data like a ring buffer or something to compare prediction with truth and then adjust to get better tracking, it's evolutionary one euro and physics tuning"

**Interpreted Requirements**:
1. ✅ FSM visualization (Mermaid in Section 5.2)
2. 🔜 Tighter palm cone (Section 5.3 - needs implementation)
3. 🔜 Longer arming sequence (Section 5.4 - needs implementation)
4. 🔜 Evolutionary tuning (Section 6 - needs implementation)

---

## 11. Hexagonal Polymorphic Adapter Architecture

### 11.1 Architecture Rating: 7.5/10 → Target 9.5/10

The architecture now supports **full UI layer polymorphism** via two new ports:

| Port | Purpose | Adapters | Status |
|------|---------|----------|--------|
| **OverlayPort** | Cursor/skeleton visualization | PixiOverlay, Canvas2DOverlay, DOMOverlay | ✅ Defined |
| **UIShellPort** | Window manager/tiling | MosaicShell, GoldenLayoutShell, PuterShell, RawHTMLShell | ✅ Defined |

### 10.2 Complete Port Inventory

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GESTURE CONTROL PLANE PORTS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT PORTS (Driven)                OUTPUT PORTS (Driving)                 │
│  ─────────────────────               ──────────────────────                 │
│  SensorPort ← MediaPipe              EmitterPort → W3C Pointer              │
│  SmootherPort ← 1€/Rapier            AdapterPort → DOM/Canvas/iframe        │
│  FSMPort ← XState                    OverlayPort → PixiJS/Canvas2D/DOM      │
│                                      UIShellPort → Mosaic/Golden/Puter      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Full Pipeline Flow

```
Camera → [SensorPort] → [SmootherPort] → [FSMPort] → [EmitterPort]
              ↓               ↓              ↓             ↓
         MediaPipe         1€ Filter      XState      PointerEvent
                               ↓              ↓             ↓
                          [OverlayPort]       ↓      [AdapterPort]
                               ↓              ↓             ↓
                          PixiJS/Canvas   State Viz    Target Element
                               ↓                           ↓
                          ─────────────[UIShellPort]───────────
                                           ↓
                               Mosaic/GoldenLayout/Puter/Raw
```

### 10.4 Config-Driven Adapter Swap

```typescript
// sandbox/src/contracts/schemas.ts defines these enums
const gestureConfig = {
  // Core pipeline
  sensor: 'mediapipe',      // 'mediapipe' | 'tensorflowjs'
  smoother: 'one-euro',     // 'one-euro' | 'rapier' | 'kalman'
  fsm: 'xstate',            // 'xstate' | 'robot' | 'custom'
  
  // UI Layer (NEW - swappable)
  overlay: 'pixi',          // 'pixi' | 'canvas' | 'dom'
  shell: 'golden',          // 'mosaic' | 'golden' | 'puter' | 'daedalos' | 'raw'
  
  // Targets within shell
  tiles: [
    { id: 'canvas', type: 'pixi', title: 'Visualization' },
    { id: 'whiteboard', type: 'excalidraw', title: 'Excalidraw' },
    { id: 'emulator', type: 'v86', title: 'FreeDOS', config: { os: 'freedos' } },
    { id: 'cloud', type: 'puter', title: 'Puter Cloud' },
  ],
};
```

---

## 11. UI Shell Adapters

### 11.1 Available Shell Types

| Shell | Package | Stars | Features | Complexity |
|-------|---------|-------|----------|------------|
| **react-mosaic** | `react-mosaic-component` | 4K | Tiling, Blueprint | Low |
| **golden-layout** | `golden-layout` | 6.6K | Tabs, popouts, themes | Medium |
| **Puter** | `@puter/puter-js` | 38K | Cloud OS, AI, storage | Medium |
| **daedalOS** | N/A (embed) | 12K | Full desktop | High |
| **Raw HTML** | None | - | Simple divs | Very Low |

### 11.2 Shell Port Interface

```typescript
// sandbox/src/contracts/ports.ts - UIShellPort
interface UIShellPort {
  initialize(container: HTMLElement, config: UIShellConfig): Promise<void>;
  getTileTarget(tileId: string): AdapterTarget | null;
  getTileIds(): string[];
  addTile(config: TileConfig): void;
  removeTile(tileId: string): void;
  splitTile(tileId: string, direction: 'horizontal' | 'vertical', newTile: TileConfig): void;
  getLayout(): LayoutState;
  setLayout(state: LayoutState): void;
  onLayoutChange(callback: (layout: LayoutState) => void): () => void;
  dispose(): void;
}
```

### 11.3 Tile Types

| Type | Description | Adapter Required |
|------|-------------|------------------|
| `pixi` | PixiJS canvas | PixiAdapter |
| `canvas` | Raw Canvas2D | Canvas2DAdapter |
| `dom` | DOM element | DOMAdapter |
| `iframe` | Sandboxed iframe | IframeAdapter |
| `excalidraw` | Excalidraw whiteboard | ExcalidrawAdapter |
| `tldraw` | tldraw canvas | TldrawAdapter |
| `v86` | x86 emulator | V86Adapter |
| `jsdos` | DOSBox WASM | JsDosAdapter |
| `puter` | Puter cloud terminal | PuterAdapter |
| `custom` | Custom implementation | CustomAdapter |

---

## 12. Overlay Port

### 12.1 Overlay Types

| Type | Renderer | Performance | Dependencies |
|------|----------|-------------|--------------|
| `pixi` | PixiJS WebGL | ⚡ Fastest | `pixi.js`, `@pixi/react` |
| `canvas` | Canvas2D | Good | None |
| `dom` | DOM elements | Slowest | None |

### 12.2 Overlay Port Interface

```typescript
// sandbox/src/contracts/ports.ts - OverlayPort
interface OverlayPort {
  initialize(container: HTMLElement): Promise<void>;
  setCursor(
    raw: { x: number; y: number } | null,
    smoothed: { x: number; y: number } | null,
    predicted: { x: number; y: number } | null,
    state: CursorState,
  ): void;
  setLandmarks(landmarks: NormalizedLandmark[] | null): void;
  setVisible(visible: boolean): void;
  setConfig(config: Partial<OverlayConfig>): void;
  getBounds(): { width: number; height: number };
  dispose(): void;
}
```

### 12.3 Cursor States

| State | Visual | Meaning |
|-------|--------|---------|
| `hidden` | No cursor | System inactive |
| `tracking` | Gray cursor | Hand detected, not armed |
| `armed` | Green cursor | Ready to commit gesture |
| `active` | Blue cursor | Gesture in progress |
| `error` | Red cursor | Tracking lost |

---

## 13. Golden Master Testing (NEW - 2025-12-30)

### 13.1 Annotated Hand Datasets (Tavily-Grounded)

**Purpose**: Feed known ground truth through pipeline, compare output to expected values.

| Dataset | Source | Size | Annotations | Use Case |
|---------|--------|------|-------------|----------|
| **FreiHAND** | Freiburg University | 36K images | 21 keypoints + 3D shape | ✅ RECOMMENDED (same 21 pts as MediaPipe) |
| **HaGRID v2** | GitHub hukenovs/hagrid | 550K images | 18 gesture classes + bbox | Gesture classification testing |
| **InterHand2.6M** | KAIST | 2.6M frames | Two-hand interactions | Multi-hand testing |
| **MediaPipe Internal** | Google Research | ~30K images | 21 3D coords + Z-depth | Reference (not public) |

**Tavily Sources**:
- FreiHAND: `lmb.informatik.uni-freiburg.de/projects/freihand/`
- HaGRID: `github.com/hukenovs/hagrid`
- InterHand2.6M: `mks0601.github.io/InterHand2.6M/`

### 13.2 Golden Master Test Pattern

```typescript
// Load FreiHAND annotation (same 21 keypoints as MediaPipe)
import { loadFreiHANDSample } from './test-fixtures/freihand-loader';

describe('Golden Master - FreiHAND', () => {
  it('should match ground truth within tolerance', async () => {
    const sample = await loadFreiHANDSample('00000001');
    const result = await pipeline.processImage(sample.image);
    
    // Compare each of 21 keypoints
    for (let i = 0; i < 21; i++) {
      expect(result.landmarks[i].x).toBeCloseTo(sample.keypoints[i].x, 2);
      expect(result.landmarks[i].y).toBeCloseTo(sample.keypoints[i].y, 2);
    }
  });
  
  it('should emit CloudEvent with test results', async () => {
    const sample = await loadFreiHANDSample('00000001');
    const result = await pipeline.processImage(sample.image);
    const error = calculateMSE(result.landmarks, sample.keypoints);
    
    // Emit standardized test event
    const event = createCloudEvent({
      type: 'hfo.test.golden-master',
      source: '/gesture-pipeline/test',
      data: { 
        sampleId: '00000001',
        expected: sample.keypoints, 
        actual: result.landmarks, 
        mse: error 
      }
    });
    
    expect(event.specversion).toBe('1.0');
  });
});
```

### 13.3 User Recording Option

If you don't want to use pre-annotated datasets:

1. **Record video** with clear hand movements
2. **Manually annotate** key frames (tell the AI what you want)
3. **Feed as golden master** - pipeline output must match your intent

```typescript
// Example: User-annotated test case
const userTestCase = {
  frames: [
    { time: 0, gesture: 'open_palm', expectedState: 'tracking' },
    { time: 300, gesture: 'open_palm', expectedState: 'armed' },
    { time: 400, gesture: 'pointing_up', expectedState: 'clicking' },
    { time: 500, gesture: 'open_palm', expectedState: 'armed' },
  ]
};
```

---

## 14. Standards-Based Observability Stack (NEW - 2025-12-30)

### 14.1 Contract Lineage to High TRL Standards

**User Requirement**: "my contracts should not be custom, they should be tested or if custom have clear lineage to high TRL technology"

| Pipeline Stage | Contract | Standard | TRL | Source |
|----------------|----------|----------|-----|--------|
| SENSOR | `MediaPipeResult` | Google MediaPipe | 9 | ai.google.dev/edge/mediapipe |
| SMOOTHER | `SmoothedPosition` | 1€ Filter (CHI 2012) | 9 | gery.casiez.net/1euro |
| FSM | `SCXMLEvent` | W3C SCXML | 9 | w3.org/TR/scxml |
| EMITTER | `CloudEvent<PointerEventInit>` | CNCF CloudEvents + W3C | 9+9 | cloudevents.io + w3.org/TR/pointerevents |
| TARGET | `dispatchEvent()` | W3C DOM Events | 9 | dom.spec.whatwg.org |
| TRACING | `OpenTelemetry Span` | CNCF OpenTelemetry | 9 | opentelemetry.io |

### 14.2 CloudEvents for Gesture Events (CNCF - TRL 9)

**Source**: [cloudevents.io](https://cloudevents.io) - CNCF Graduated Project

```typescript
// CloudEvent envelope for every pipeline event
interface GestureCloudEvent {
  // REQUIRED CloudEvents attributes
  specversion: '1.0';
  id: string;              // UUID per event
  source: string;          // '/gesture-pipeline/sensor' | '/gesture-pipeline/fsm' | etc
  type: string;            // 'hfo.gesture.pointing_up' | 'hfo.state.armed' | etc
  
  // OPTIONAL but recommended
  time: string;            // ISO8601 timestamp
  datacontenttype: 'application/json';
  
  // HFO Extensions (prefixed per spec)
  hfoport: number;         // 0-7 port number
  hfohive: 'H' | 'I' | 'V' | 'E';
  hfogen: number;          // generation 87
  
  // Event payload
  data: PointerEventInit | FSMAction | SensorFrame;
}
```

**CloudEvents Type Taxonomy**:
```
hfo.gesture.*         - Gesture recognition events
hfo.state.*           - FSM state transitions
hfo.pointer.*         - W3C Pointer events
hfo.test.*            - Test/benchmark events
hfo.metrics.*         - Performance metrics
hfo.error.*           - Error events
```

### 14.3 OpenTelemetry Tracing (CNCF - TRL 9)

**Source**: [opentelemetry.io/docs/languages/js](https://opentelemetry.io/docs/languages/js)

```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';

// Initialize tracer
const provider = new WebTracerProvider();
provider.register();
const tracer = trace.getTracer('gesture-pipeline', '87.3.0');

// Trace each pipeline stage
async function processFrame(frame: SensorFrame) {
  return tracer.startActiveSpan('pipeline.process', async (span) => {
    try {
      // Stage 1: Sensor
      const sensorResult = await tracer.startActiveSpan('stage.sensor', async (sensorSpan) => {
        sensorSpan.setAttribute('frame.timestamp', frame.timestamp);
        const result = await sensor.process(frame);
        sensorSpan.end();
        return result;
      });
      
      // Stage 2: Smoother
      const smoothedResult = await tracer.startActiveSpan('stage.smoother', async (smootherSpan) => {
        smootherSpan.setAttribute('smoother.type', 'one-euro');
        const result = await smoother.process(sensorResult);
        smootherSpan.setAttribute('smoother.latency_ms', result.latency);
        smootherSpan.end();
        return result;
      });
      
      // Stage 3: FSM
      const fsmResult = await tracer.startActiveSpan('stage.fsm', async (fsmSpan) => {
        fsmSpan.setAttribute('fsm.state', fsmResult.state);
        const result = await fsm.process(smoothedResult);
        fsmSpan.end();
        return result;
      });
      
      // Stage 4: Emitter
      const pointerEvent = await tracer.startActiveSpan('stage.emitter', async (emitterSpan) => {
        const result = await emitter.process(fsmResult);
        emitterSpan.setAttribute('pointer.type', result.type);
        emitterSpan.end();
        return result;
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      return pointerEvent;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### 14.4 AsyncAPI Schema Definition (TRL 8)

**Source**: [asyncapi.com](https://www.asyncapi.com/)

```yaml
# asyncapi.yaml - Gesture Pipeline Event Schema
asyncapi: '3.0.0'
info:
  title: HFO Gesture Control Plane
  version: '87.3.0'
  description: Real-time gesture events via WebSocket/broadcast channel

channels:
  gesture/pointer:
    address: gesture/pointer
    messages:
      pointerEvent:
        payload:
          $ref: '#/components/schemas/PointerEventInit'
  
  gesture/state:
    address: gesture/state
    messages:
      stateChange:
        payload:
          $ref: '#/components/schemas/FSMStateChange'
  
  gesture/metrics:
    address: gesture/metrics
    messages:
      latencyMetric:
        payload:
          $ref: '#/components/schemas/PipelineLatency'

components:
  schemas:
    PointerEventInit:
      type: object
      required: [clientX, clientY, pointerType]
      properties:
        clientX: { type: number }
        clientY: { type: number }
        pressure: { type: number, minimum: 0, maximum: 1 }
        pointerType: { type: string, enum: ['hand', 'touch', 'mouse', 'pen'] }
        # ... full W3C PointerEventInit
    
    FSMStateChange:
      type: object
      properties:
        previousState: { type: string }
        currentState: { type: string }
        event: { type: string }
        timestamp: { type: string, format: date-time }
    
    PipelineLatency:
      type: object
      properties:
        sensor_ms: { type: number }
        smoother_ms: { type: number }
        fsm_ms: { type: number }
        emitter_ms: { type: number }
        total_ms: { type: number }
```

---

## 15. On-Device Evolutionary Tuning (Antifragile - NEW)

### 15.1 Architecture (No Server Telemetry)

**User Requirement**: "the system is antifragile and starts learning and adapting to the user based on behavior and local interactions with no server side telemetry, it's all on device evo tuning"

```
┌─────────────────────────────────────────────────────────────────┐
│                    ON-DEVICE EVOLUTIONARY LOOP                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Ring Buffer (100 frames)                                      │
│   ┌─────────────────────────────────────────────┐               │
│   │ [predicted, actual, error, timestamp] × 100 │               │
│   └─────────────────────────────────────────────┘               │
│                        ↓                                        │
│   Error Aggregation (MSE, jitter, lag)                          │
│                        ↓                                        │
│   Parameter Mutation                                            │
│   ├─ 1€: minCutoff ±5%, beta ±3%, dCutoff ±2%                   │
│   ├─ Physics: stiffness ±10%, damping ±5%                       │
│   └─ Prediction: horizon ±1 frame                               │
│                        ↓                                        │
│   Fitness Selection (keep if error decreases)                   │
│                        ↓                                        │
│   Persist to IndexedDB (user profile)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.2 Evolutionary Tuner Implementation

```typescript
interface EvolutionaryConfig {
  // 1€ Filter parameters
  oneEuro: {
    minCutoff: number;   // Hz - minimum cutoff frequency
    beta: number;        // speed coefficient
    dCutoff: number;     // derivative cutoff
  };
  // Physics spring parameters
  physics: {
    stiffness: number;   // spring constant
    damping: number;     // damping ratio
    mass: number;        // virtual mass
  };
  // Prediction parameters
  prediction: {
    horizon: number;     // frames ahead
    confidence: number;  // decay factor
  };
}

class EvolutionaryTuner {
  private ringBuffer: PredictionRecord[] = [];
  private readonly bufferSize = 100;
  private config: EvolutionaryConfig;
  private bestFitness = Infinity;
  
  constructor(initialConfig: EvolutionaryConfig) {
    this.config = structuredClone(initialConfig);
    this.loadFromStorage();
  }
  
  record(predicted: Point, actual: Point, timestamp: number): void {
    const error = Math.hypot(predicted.x - actual.x, predicted.y - actual.y);
    this.ringBuffer.push({ timestamp, predicted, actual, error });
    if (this.ringBuffer.length > this.bufferSize) {
      this.ringBuffer.shift();
    }
  }
  
  evolve(): EvolutionaryConfig {
    if (this.ringBuffer.length < this.bufferSize / 2) {
      return this.config; // Not enough data
    }
    
    const fitness = this.calculateFitness();
    
    if (fitness < this.bestFitness) {
      // Current params are better - keep and persist
      this.bestFitness = fitness;
      this.saveToStorage();
    } else {
      // Try mutation
      this.mutateParams();
    }
    
    return this.config;
  }
  
  private calculateFitness(): number {
    const errors = this.ringBuffer.map(r => r.error);
    const mse = errors.reduce((a, b) => a + b * b, 0) / errors.length;
    
    // Calculate jitter (variance of error)
    const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
    const jitter = errors.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / errors.length;
    
    // Combined fitness (lower is better)
    return mse + jitter * 0.5;
  }
  
  private mutateParams(): void {
    // Small random mutations
    this.config.oneEuro.minCutoff *= 1 + (Math.random() - 0.5) * 0.1;
    this.config.oneEuro.beta *= 1 + (Math.random() - 0.5) * 0.06;
    this.config.physics.stiffness *= 1 + (Math.random() - 0.5) * 0.2;
    this.config.physics.damping *= 1 + (Math.random() - 0.5) * 0.1;
  }
  
  private async saveToStorage(): Promise<void> {
    // IndexedDB for persistence
    const db = await openDB('hfo-tuning', 1);
    await db.put('config', this.config, 'current');
  }
  
  private async loadFromStorage(): Promise<void> {
    try {
      const db = await openDB('hfo-tuning', 1);
      const stored = await db.get('config', 'current');
      if (stored) this.config = stored;
    } catch {
      // Use default config
    }
  }
}
```

### 15.3 Antifragile Properties

| Property | Mechanism | Benefit |
|----------|-----------|---------|
| **Local-only** | IndexedDB, no network | Privacy, offline-capable |
| **Self-improving** | Ring buffer + evolution | Gets better with use |
| **Fault-tolerant** | Fitness selection | Bad mutations rejected |
| **Personalized** | Per-user profiles | Adapts to individual |
| **Observable** | CloudEvents emission | Can log locally for debug |

---

## 16. Contract Exemplar Summary (Anti-Theater)

### 16.1 Every Contract Traces to TRL 9 Standard

**User Requirement**: "avoid theater and green but meaningless code"

| Contract | NOT Custom Because | Proof |
|----------|-------------------|-------|
| `PointerEventInit` | W3C Pointer Events Level 3 | w3.org/TR/pointerevents |
| `CloudEvent` | CNCF Graduated Project | cloudevents.io |
| `OpenTelemetry Span` | CNCF Graduated Project | opentelemetry.io |
| `AsyncAPI Schema` | Linux Foundation Project | asyncapi.com |
| `MediaPipeResult` | Google Production API | ai.google.dev/edge/mediapipe |
| `SCXMLEvent` | W3C Recommendation | w3.org/TR/scxml |
| `1€ FilterConfig` | CHI 2012 Peer-Reviewed | dl.acm.org/doi/10.1145/2207676.2208639 |

### 16.2 Meaningful GREEN Criteria

A test is **meaningfully GREEN** only if:

1. ✅ Tests actual production contract (not mock)
2. ✅ Input/output matches exemplar standard
3. ✅ Observable via OpenTelemetry span
4. ✅ Emits CloudEvent for audit trail
5. ✅ Uses property-based testing (fast-check)
6. ✅ Has golden master validation

```typescript
// Example: Meaningful test
it('should emit W3C-compliant PointerEvent via CloudEvent', async () => {
  const input = await loadFreiHANDSample('00000001');
  
  // Process through full pipeline (not mocked)
  const result = await pipeline.process(input.image);
  
  // Validate against W3C standard
  expect(result.specversion).toBe('1.0');  // CloudEvents
  expect(result.type).toBe('hfo.pointer.move');
  expect(result.data.pointerType).toBe('hand');
  expect(result.data.pressure).toBeGreaterThanOrEqual(0);
  expect(result.data.pressure).toBeLessThanOrEqual(1);
  
  // Verify OpenTelemetry trace exists
  const spans = getRecordedSpans();
  expect(spans.some(s => s.name === 'stage.emitter')).toBe(true);
});
```

---

## 17. NATS JetStream HOT Stigmergy Substrate (CORE ARCHITECTURE)

> ⚠️ **NON-NEGOTIABLE**: This is not optional. We do NOT use EventEmitter/RxJS "for simplicity".
> We use the RIGHT architecture from day 1. All code is production-ready.

### 17.1 Architecture Philosophy

**Principle**: "We are not going to do the easy thing. We are going to do the RIGHT thing."

| Lazy Option | Right Option | Why Right |
|-------------|--------------|----------|
| EventEmitter | NATS JetStream | Durable, replayable, multi-agent |
| localStorage | NATS KV | Watched, distributed, versioned |
| File blobs | NATS Object Store | Chunked, streamable, metadata |
| console.log | CloudEvents → NATS | Structured, filterable, auditable |

**PARETO ARGUMENT**:
- 20% more effort now (NATS setup) = 80% less pain later (no migration)
- EventEmitter→NATS migration is PAINFUL (different semantics)
- Starting with NATS means ALL code is production-ready from day 1

### 17.2 NATS Subject Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NATS JetStream HOT SUBSTRATE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STREAM: HFO_PIPELINE                                                       │
│  ─────────────────────                                                      │
│  Subjects: hfo.pipeline.>                                                   │
│  Retention: Limits (time-based, 24h default)                                │
│  Storage: File (persistent)                                                 │
│  Replicas: 1 (dev) / 3 (prod)                                               │
│                                                                             │
│  Subject Hierarchy (Hard Gate Boundaries):                                  │
│                                                                             │
│    hfo.pipeline.sensor.{handId}   → SensorFrame (Zod validated at gate)    │
│    hfo.pipeline.smooth.{handId}   → SmoothedFrame (Zod validated)          │
│    hfo.pipeline.fsm.{handId}      → FSMAction (Zod validated)              │
│    hfo.pipeline.pointer           → W3C PointerEvent                       │
│    hfo.pipeline.target.{targetId} → Target-specific delivery               │
│                                                                             │
│  KV BUCKET: hfo-state                                                       │
│  ────────────────────                                                       │
│  History: 5 revisions (for debugging)                                       │
│                                                                             │
│    cursor.{handId}.position  → { x, y, ts }   (watch for UI sync)          │
│    fsm.{handId}.state        → { state, since, confidence }                │
│    config.smoother           → SmootherConfig (hot reload)                 │
│    config.pipeline           → PipelineConfig                              │
│                                                                             │
│  OBJECT STORE: hfo-recordings                                               │
│  ────────────────────────────                                               │
│  Max chunk: 128KB                                                           │
│  Description: ML training data, gesture recordings                          │
│                                                                             │
│    session/{id}/metadata.json   → Session metadata                         │
│    session/{id}/frames.jsonl    → Frame sequence (replayable)              │
│    session/{id}/events.jsonl    → Pointer events emitted                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 17.3 Consumer Architecture (Durable, Resilient)

```typescript
// Each pipeline stage is a durable consumer
// Source: Context7 NATS.js documentation (grounded 2025-12-30)

import { connect } from '@nats-io/transport-node';  // Node
import { wsconnect } from '@nats-io/nats-core';     // Browser (WebSocket)
import { jetstream, jetstreamManager, AckPolicy, DeliverPolicy } from '@nats-io/jetstream';
import { Kvm } from '@nats-io/kv';
import { Objm } from '@nats-io/obj';

// Connection (browser-safe via WebSocket)
const nc = await wsconnect({ servers: 'wss://nats.example.com:443' });

// Stream setup
const jsm = await jetstreamManager(nc);
await jsm.streams.add({
  name: 'HFO_PIPELINE',
  subjects: ['hfo.pipeline.>'],
  retention: 'limits',
  max_age: 24 * 60 * 60 * 1000000000,  // 24h in nanoseconds
  storage: 'file',
});

// Consumers per pipeline stage
const consumers = [
  { name: 'smoother-left', filter: 'hfo.pipeline.sensor.left' },
  { name: 'smoother-right', filter: 'hfo.pipeline.sensor.right' },
  { name: 'fsm-left', filter: 'hfo.pipeline.smooth.left' },
  { name: 'fsm-right', filter: 'hfo.pipeline.smooth.right' },
  { name: 'pointer-emitter', filter: 'hfo.pipeline.fsm.*' },
  { name: 'target-router', filter: 'hfo.pipeline.pointer' },
];

for (const c of consumers) {
  await jsm.consumers.add('HFO_PIPELINE', {
    durable_name: c.name,
    filter_subject: c.filter,
    ack_policy: AckPolicy.Explicit,
    deliver_policy: DeliverPolicy.New,
    max_ack_pending: 100,
  });
}

// KV for real-time state
const kvm = new Kvm(nc);
const stateKV = await kvm.create('hfo-state', { history: 5 });

// Watch cursor position (UI sync)
const cursorWatch = await stateKV.watch({ key: 'cursor.>' });
for await (const entry of cursorWatch) {
  updateCursorOverlay(entry.key, JSON.parse(entry.string()));
}

// Object Store for recordings
const objm = new Objm(nc);
const recordings = await objm.create('hfo-recordings', {
  description: 'Gesture recordings for ML training',
});
```

### 17.4 Hard Gate Pattern with NATS

```typescript
import { z } from 'zod';
import type { JetStreamClient, Msg } from '@nats-io/jetstream';
import { SensorFrameSchema, SmoothedFrameSchema } from './contracts/schemas.js';

/**
 * Hard Gate: Validates at NATS subject boundary
 * 
 * Each stage:
 * 1. Subscribes to input subject
 * 2. Validates incoming with Zod
 * 3. Transforms data
 * 4. Validates outgoing with Zod
 * 5. Publishes to output subject
 * 6. Acks the original message
 */
async function createStageGate<TIn, TOut>(
  js: JetStreamClient,
  config: {
    inputSubject: string;
    outputSubject: string;
    inputSchema: z.ZodType<TIn>;
    outputSchema: z.ZodType<TOut>;
    transform: (input: TIn) => TOut | Promise<TOut>;
    consumerName: string;
  }
): Promise<void> {
  const consumer = await js.consumers.get('HFO_PIPELINE', config.consumerName);
  const messages = await consumer.consume();

  for await (const msg of messages) {
    try {
      // Gate 1: Validate input
      const rawInput = JSON.parse(msg.string());
      const validInput = config.inputSchema.parse(rawInput);

      // Transform
      const output = await config.transform(validInput);

      // Gate 2: Validate output
      const validOutput = config.outputSchema.parse(output);

      // Publish to next stage
      await js.publish(config.outputSubject, JSON.stringify(validOutput));

      // Acknowledge successful processing
      msg.ack();
    } catch (err) {
      console.error(`Gate error [${config.consumerName}]:`, err);
      msg.nak();  // Negative ack - will be redelivered
    }
  }
}

// Usage: Smoother stage
await createStageGate(js, {
  inputSubject: 'hfo.pipeline.sensor.left',
  outputSubject: 'hfo.pipeline.smooth.left',
  inputSchema: SensorFrameSchema,
  outputSchema: SmoothedFrameSchema,
  transform: (frame) => oneEuroAdapter.smooth(frame),
  consumerName: 'smoother-left',
});
```

### 17.5 Why NATS Over Alternatives

| Feature | EventEmitter | RxJS | Redis Pub/Sub | NATS JetStream |
|---------|--------------|------|---------------|----------------|
| Durable streams | ❌ | ❌ | ❌ | ✅ |
| Message replay | ❌ | ❌ | ❌ | ✅ |
| KV store | ❌ | ❌ | ✅ | ✅ |
| Object store | ❌ | ❌ | ❌ | ✅ |
| Browser native | ✅ | ✅ | ❌ | ✅ (WebSocket) |
| At-least-once | ❌ | ❌ | ❌ | ✅ |
| Consumer groups | ❌ | ❌ | ✅ | ✅ |
| Backpressure | ❌ | ✅ | ❌ | ✅ |
| Multi-agent | ❌ | ❌ | ✅ | ✅ |
| TRL 9 Standard | ❌ | ❌ | ✅ | ✅ (CNCF) |

**NATS wins on**: Durability, replay, KV+ObjStore, browser support.

### 17.6 Local Development Setup

```bash
# Option 1: Docker (recommended)
docker run -d --name nats -p 4222:4222 -p 8222:8222 nats:latest -js

# Option 2: Binary
# Download from https://nats.io/download/
nats-server -js

# Option 3: Synadia NGS (cloud, free tier)
# https://synadia.com/ngs
```

### 17.7 AI Swarm Coordination via NATS

```
Agent A (Hunt)     ─┬─ hfo.swarm.signal.hunt    ──▶ Blackboard
Agent B (Interlock) ├─ hfo.swarm.signal.interlock ──▶ Blackboard
Agent C (Validate)  ├─ hfo.swarm.signal.validate  ──▶ Blackboard
Agent D (Evolve)    └─ hfo.swarm.signal.evolve    ──▶ Blackboard

Blackboard KV:
  swarm.phase.current  → "I"  (HIVE phase)
  swarm.agent.{id}     → { status, lastSignal, task }
  swarm.task.queue     → [ pending tasks ]
```

---

## 18. Architecture Philosophy: RIGHT vs EASY

### 18.1 The Anti-Shortcut Manifesto

> "AI has a habit of not following my architecture and recommending lazy options instead."
> — User feedback, 2025-12-30

**This spec exists to PREVENT that pattern.**

Every architectural decision MUST be:
1. **Grounded** - Use sequential thinking + Context7/Tavily to verify
2. **Standards-based** - TRL 9 exemplars where available
3. **Production-ready** - No "we'll fix it later" patterns
4. **Pareto-optimal** - 20% effort for 80% value, but NEVER skip the 20%

### 18.2 Decision Log (Auditable)

| Decision | Easy Option | Right Option | Justification |
|----------|-------------|--------------|---------------|
| Event bus | EventEmitter | NATS JetStream | Durability, replay, multi-agent |
| State management | In-memory | NATS KV | Watched, versioned, distributed |
| Recordings | localStorage | NATS Object Store | Chunked, metadata, streamable |
| Schemas | TypeScript interfaces | Zod | Runtime validation, composable |
| FSM | if/else | XState v5 | Visual, testable, SCXML-compliant |
| Smoothing | Moving average | 1€ Filter | CHI 2012 peer-reviewed algorithm |
| Events | Custom objects | W3C PointerEvents | Browser-native, standard |
| Observability | console.log | CloudEvents + OTel | Structured, traceable, auditable |

### 18.3 Sequential Thinking Mandate

Before implementing ANY component:

1. **HUNT**: Search memory bank + Context7 for exemplars
2. **ANALYZE**: Use `mcp_sequentialthi_sequentialthinking` for trade-offs
3. **GROUND**: Verify claims with documentation (no hallucination)
4. **DOCUMENT**: Record decision rationale in this spec
5. **IMPLEMENT**: Only after steps 1-4 complete

### 18.4 Anti-Patterns to REJECT

| If AI Suggests | Respond With |
|----------------|-------------|
| "For simplicity, we could use EventEmitter..." | "No. Use NATS. Read Section 17." |
| "Let's mock this for now..." | "No. Implement against real contract." |
| "We can refactor later..." | "No. Do it right the first time." |
| "This is just a POC..." | "No. POC code becomes production." |
| "RxJS is easier..." | "Easier ≠ Better. Use NATS." |

---

## 19. References

| Source | URL | Purpose |
|--------|-----|---------|
| **Standards** | | |
| W3C Pointer Events L3 | w3.org/TR/pointerevents | Output event format |
| W3C SCXML | w3.org/TR/scxml | FSM state machine |
| CloudEvents (CNCF) | cloudevents.io | Event envelope format |
| OpenTelemetry | opentelemetry.io | Tracing/observability |
| AsyncAPI | asyncapi.com | Event schema documentation |
| **Datasets** | | |
| FreiHAND | lmb.informatik.uni-freiburg.de/projects/freihand | 21-keypoint ground truth |
| HaGRID v2 | github.com/hukenovs/hagrid | Gesture classification |
| InterHand2.6M | mks0601.github.io/InterHand2.6M | Two-hand interactions |
| **Libraries** | | |
| MediaPipe Tasks Vision | ai.google.dev/edge/mediapipe | Gesture recognition |
| 1€ Filter | gery.casiez.net/1euro | Noise filtering |
| Rapier Physics | dimforge.com/rapier | Prediction via physics |
| XState v5 | stately.ai/docs | FSM implementation |
| TensorFlow.js | tensorflow.org/js | On-device ML |
| **UI Libraries** | | |
| react-mosaic | github.com/nomcopter/react-mosaic | Tiling window manager |
| golden-layout | github.com/golden-layout/golden-layout | Multi-window layout |
| PixiJS | pixijs.com | 2D WebGL renderer |
| @pixi/react | github.com/pixijs/pixi-react | React bindings |
| **Target Platforms** | | |
| Excalidraw | github.com/excalidraw/excalidraw | Target: whiteboard |
| tldraw | github.com/tldraw/tldraw | Target: canvas |
| v86 | github.com/copy/v86 | Target: x86 emulator |
| daedalOS | github.com/DustinBrett/daedalOS | Target: web desktop |
| Puter | github.com/HeyPuter/puter | Cloud OS platform |

---

*Gen87.X3 | W3C Pointer Gesture Control Plane | 2025-12-30 | Updated with Golden Master Testing + Standards-Based Observability*
