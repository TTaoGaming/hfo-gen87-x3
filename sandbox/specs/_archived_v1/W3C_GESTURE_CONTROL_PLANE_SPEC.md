# W3C Gesture Control Plane Specification

> **Generation**: 87.X3
> **Date**: 2025-12-29
> **Status**: SPEC COMPLETE - Ready for Implementation
> **Phase**: INTERLOCK (I) - Contract-Driven Development

---

## Executive Summary

This specification defines a universal gesture input adapter that converts MediaPipe hand landmarks and gesture labels into standard W3C Pointer Events. The system enables any pointer-based application (Excalidraw, Phaser, web apps) to accept gesture input without modification.

**Core Principle**: NO INVENTION - Exemplar Composition Only

---

## 1. Architecture Overview

### 1.1 Pipeline

```
┌─────────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────────┐   ┌─────────────┐
│  MediaPipe  │ → │ GestureFrame │ → │  1€ Filter  │ → │  XState FSM  │ → │ PointerStream│ → DOM
│   (Camera)  │   │   Contract   │   │ (Smoothing) │   │   (States)   │   │   Injector   │
└─────────────┘   └──────────────┘   └─────────────┘   └──────────────┘   └─────────────┘
     Port 0            Port 1            Port 2            Port 3            Port 5
    (SENSE)          (FUSE)           (SHAPE)          (DELIVER)         (DEFEND)
```

### 1.2 OBSIDIAN Port Mapping

| Port | Component | Role | Description |
|------|-----------|------|-------------|
| 0 | MediaPipe Adapter | SENSE | Observe camera, produce landmarks |
| 1 | GestureFrame Bus | FUSE | Bridge raw data to typed contracts |
| 2 | 1€ Filter | SHAPE | Smooth and predict positions |
| 3 | XState FSM | DELIVER | Inject state transitions |
| 4 | TDD Test Suite | TEST | Validate correctness properties |
| 5 | Pointer Lifecycle | DEFEND | Guard against stuck/invalid states |
| 6 | Record/Replay Store | STORE | Persist streams for determinism |
| 7 | Phase Coordinator | DECIDE | Route based on current phase |

---

## 2. Grounded Technology Stack

All technologies are TRL 9 (production-ready), verified via Tavily search 2025-12-29.

### 2.1 MediaPipe Gesture Recognizer

**Source**: https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer

> "The MediaPipe Gesture Recognizer task lets you recognize hand gestures in real time, and provides the recognized hand gesture results along with the landmarks of the detected hands."

**Capabilities**:
- 21 3D landmarks per hand
- Real-time performance in browser
- Built-in gesture classification: Open_Palm, Pointing_Up, Victory, Thumb_Up, Thumb_Down, Closed_Fist, ILoveYou
- Handedness detection (left/right)
- Confidence scores

**Web Package**: `@mediapipe/tasks-vision`

```javascript
// From Tavily: ai.google.dev/edge/mediapipe
const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
);
const gestureRecognizer = await GestureRecognizer.createFromModelPath(vision,
    "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
);
```

### 2.2 One Euro Filter (1€ Filter)

**Source**: https://gery.casiez.net/1euro/

**Citation**:
> Casiez, G., Roussel, N. and Vogel, D. (2012). 1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems. Proceedings of the ACM Conference on Human Factors in Computing Systems (CHI '12). Austin, Texas (May 5-12, 2012). New York: ACM Press, pp. 2527-2530.

**Algorithm**:
- First-order low-pass filter with adaptive cutoff frequency
- At low speeds: low cutoff → reduce jitter
- At high speeds: high cutoff → reduce lag
- Two parameters: `mincutoff` (minimum cutoff), `beta` (speed coefficient)

**Key Insight** (from Tavily):
> "One euro filter is deployed in many real-time tracking frameworks (e.g., Google MediaPipe face tracking) due to its simplicity and effectiveness."

**GitHub**: https://github.com/casiez/OneEuroFilter

### 2.3 XState v5

**Source**: https://stately.ai/docs/setup

**Key Pattern** (from Tavily):
```typescript
import { setup, createActor, assign } from 'xstate';

const machine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'increment' } | { type: 'decrement' },
  },
  actions: {
    someAction: () => { /* ... */ },
  },
  guards: {
    someGuard: ({ context }) => context.count <= 10,
  },
}).createMachine({
  id: 'example',
  initial: 'idle',
  context: { count: 0 },
  states: {
    idle: {
      on: {
        increment: { actions: assign({ count: ({ context }) => context.count + 1 }) }
      }
    }
  }
});
```

**Benefits of `setup()` pattern**:
- Strongly typed context, events, actions, guards
- Better type inference
- Reusable source logic

### 2.4 W3C Pointer Events

**Source**: https://www.w3.org/TR/pointerevents/

**Specification** (from Tavily):
> "The events for handling generic pointer input look a lot like those for mouse: pointerdown, pointermove, pointerup, pointerover, pointerout, and so on. This facilitates easy content migration from Mouse Events to Pointer Events."

**Event Types**:
| Event | Bubbles | Cancelable | Default Action |
|-------|---------|------------|----------------|
| `pointerdown` | Yes | Yes | Varies: mousedown |
| `pointermove` | Yes | Yes | None |
| `pointerup` | Yes | Yes | Varies: mouseup |
| `pointercancel` | Yes | No | None |
| `pointerout` | Yes | Yes | None |
| `pointerleave` | No | No | None |

**PointerEvent Interface** extends MouseEvent:
- `pointerId`: Unique identifier for pointer
- `pointerType`: "mouse" | "pen" | "touch"
- `pressure`: 0.0 to 1.0
- `tiltX`, `tiltY`: -90 to 90 degrees
- `twist`: 0 to 359 degrees

**Critical Invariant** (from W3C spec):
> "A user agent MUST fire a pointer event named `pointercancel` when the user agent has determined that a pointer is unlikely to continue to produce events"

---

## 3. Contract Definitions (CDD)

### 3.1 GestureLabel Type

```typescript
// Source: Gen 83, REF__W3C_GESTURE_LANGUAGE_SPEC.md
export const GestureLabels = [
  'Open_Palm',    // Baseline / arming gesture
  'Pointing_Up',  // Commit action (click/drag)
  'Victory',      // Navigation action (pan/scroll)
  'Thumb_Up',     // Zoom in
  'Thumb_Down',   // Zoom out
  'Closed_Fist',  // Alternative commit
  'ILoveYou',     // Optional: tool switch
  'None',         // No gesture detected
] as const;

export type GestureLabel = typeof GestureLabels[number];
```

### 3.2 GestureFrame Contract

```typescript
// Source: Gen 83, REF__W3C_GESTURE_CONTROL_PLANE_GOLD_BATON.md
import { z } from 'zod';

export const GestureFrameSchema = z.object({
  /** Timestamp in milliseconds */
  ts: z.number().nonnegative(),
  
  /** Hand identifier */
  handId: z.enum(['left', 'right']),
  
  /** Whether hand is currently tracked */
  trackingOk: z.boolean(),
  
  /** Whether palm is facing camera (within cone) */
  palmFacing: z.boolean(),
  
  /** Detected gesture label */
  label: z.enum(GestureLabels),
  
  /** Gesture confidence (0..1) */
  conf: z.number().min(0).max(1),
  
  /** Index fingertip position in screen coordinates */
  indexTip: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export type GestureFrame = z.infer<typeof GestureFrameSchema>;
```

### 3.3 PointerEventOut Contract

```typescript
// Source: Gen 83, REF__W3C_GESTURE_CONTROL_PLANE_GOLD_BATON.md
import { z } from 'zod';

export const PointerMoveSchema = z.object({
  t: z.literal('move'),
  pointerId: z.number().int().nonnegative(),
  x: z.number(),
  y: z.number(),
  pointerType: z.enum(['mouse', 'pen']),
  buttons: z.number().int().nonnegative(),
});

export const PointerDownSchema = z.object({
  t: z.literal('down'),
  pointerId: z.number().int().nonnegative(),
  x: z.number(),
  y: z.number(),
  button: z.union([z.literal(0), z.literal(1)]),
  buttons: z.number().int().nonnegative(),
});

export const PointerUpSchema = z.object({
  t: z.literal('up'),
  pointerId: z.number().int().nonnegative(),
  x: z.number(),
  y: z.number(),
  button: z.union([z.literal(0), z.literal(1)]),
  buttons: z.number().int().nonnegative(),
});

export const PointerCancelSchema = z.object({
  t: z.literal('cancel'),
  pointerId: z.number().int().nonnegative(),
});

export const PointerEventOutSchema = z.discriminatedUnion('t', [
  PointerMoveSchema,
  PointerDownSchema,
  PointerUpSchema,
  PointerCancelSchema,
]);

export type PointerEventOut = z.infer<typeof PointerEventOutSchema>;

export const WheelOutSchema = z.object({
  t: z.literal('wheel'),
  deltaY: z.number(),
  ctrl: z.boolean().optional(),
  shift: z.boolean().optional(),
});

export type WheelOut = z.infer<typeof WheelOutSchema>;
```

---

## 4. FSM Specification (XState)

### 4.1 State Machine Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GESTURE FSM STATES                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    BASELINE_OK    ┌──────────┐                           │
│  │ DISARMED │ ────────────────► │  ARMING  │                           │
│  └──────────┘                   └────┬─────┘                           │
│       ▲                              │ ARM_STABLE_MS                   │
│       │ !palmFacing                  ▼                                 │
│       │ !trackingOk            ┌──────────┐                            │
│       └────────────────────────│  ARMED   │◄───────┐                   │
│                                └────┬─────┘        │                   │
│                                     │              │ UP                │
│              ┌──────────────────────┼──────────────┤                   │
│              │                      │              │                   │
│              ▼                      ▼              │                   │
│       ┌────────────┐         ┌────────────┐       │                   │
│       │ DOWN_COMMIT│         │  DOWN_NAV  │───────┘                   │
│       │ (button=0) │         │ (button=1) │                           │
│       └────────────┘         └────────────┘                           │
│              │                      │                                  │
│              │ !trackingOk          │ !trackingOk                      │
│              ▼                      ▼                                  │
│         CANCEL ──────────────► DISARMED                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 States

| State | Description | Output |
|-------|-------------|--------|
| `DISARMED` | System inactive | No pointer events |
| `ARMING` | Baseline hysteresis (waiting for stable Open_Palm) | No pointer events |
| `ARMED` | Cursor aim mode (pointer active) | `pointermove` |
| `DOWN_COMMIT` | Primary click/drag (button=0) | `pointerdown` + `pointermove` |
| `DOWN_NAV` | Middle-click drag (button=1) for pan | `pointerdown` + `pointermove` |
| `ZOOM` | Wheel emission for zoom | `wheel` events |

### 4.3 Guards

| Guard | Condition | Source |
|-------|-----------|--------|
| `GATE_BASELINE_OK` | `label == Open_Palm && palmFacing && conf >= Cmin` | Gen83 spec |
| `GATE_BASELINE_STABLE` | `BASELINE_OK` maintained for N frames | Gen83 spec |
| `GATE_CMD_WINDOW_OK` | `now - baselineStableAt <= CMD_WINDOW_MS` | Gen83 spec |
| `GATE_TRACKING_OK` | `trackingOk == true` | Gen83 spec |
| `GATE_PALM_FACING` | `palmFacing == true` | Gen83 spec |

### 4.4 Actions

| Action | Effect | Source |
|--------|--------|--------|
| `A_EMIT_POINTER_MOVE` | Emit `pointermove` with indexTip | Gen83 spec |
| `A_EMIT_POINTER_DOWN_PRIMARY` | Emit `pointerdown(button=0)` + capture | Gen83 spec |
| `A_EMIT_POINTER_DOWN_MIDDLE` | Emit `pointerdown(button=1)` + capture | Gen83 spec |
| `A_EMIT_POINTER_UP` | Emit `pointerup` + release capture | Gen83 spec |
| `A_EMIT_POINTER_CANCEL` | Emit `pointercancel` + release capture | Gen83 spec |
| `A_SET_ARMED_FROM_BASELINE` | Set flag to true | Gen83 spec |
| `A_CLEAR_ARMED_FROM_BASELINE` | Set flag to false | Gen83 spec |
| `A_RECORD_BASELINE_TIME` | Store `baselineStableAt = now` | Gen83 spec |

### 4.5 Transition Rules

**DISARMED → ARMING**:
- When `GATE_BASELINE_OK` becomes true

**ARMING → ARMED**:
- After `ARM_STABLE_MS` (e.g., 200ms) with `GATE_BASELINE_OK` still true
- Set `ARMED_FROM_BASELINE = true`
- Record `baselineStableAt = now`

**ARMED transitions**:
- If `Pointing_Up` AND `GATE_CMD_WINDOW_OK` AND `GATE_PALM_FACING` → `DOWN_COMMIT`
- If `Victory` AND `GATE_CMD_WINDOW_OK` AND `GATE_PALM_FACING` → `DOWN_NAV`
- If `Thumb_Up/Down` AND `GATE_CMD_WINDOW_OK` AND `GATE_PALM_FACING` → `ZOOM`
- If `!GATE_PALM_FACING` → `DISARMED`
- If `!GATE_TRACKING_OK` → `DISARMED`

**DOWN_* → exit**:
- If baseline regained OR `!GATE_PALM_FACING` → emit `pointerup` → `ARMED` (set `ARMED_FROM_BASELINE = false`)
- If `!GATE_TRACKING_OK` → emit `pointercancel` → `DISARMED`

### 4.6 Delimiter Enforcement (Anti-Midas-Touch)

**Critical Rule**: Commands are only accepted from `ARMED` state when `ARMED_FROM_BASELINE = true`.

When leaving any command state:
1. Set `ARMED_FROM_BASELINE = false`
2. Require returning through `ARMING` → `ARMED` transition before next command

This prevents accidental gesture-to-gesture transitions.

---

## 5. One Euro Filter Specification

### 5.1 Algorithm

From Casiez CHI 2012 paper:

```typescript
// Source: https://gery.casiez.net/1euro/
class OneEuroFilter {
  private mincutoff: number;  // Minimum cutoff frequency
  private beta: number;       // Speed coefficient
  private dcutoff: number;    // Derivative cutoff frequency
  private x: LowPassFilter;   // Position filter
  private dx: LowPassFilter;  // Derivative filter
  private lastTime: number;

  constructor(freq: number, mincutoff = 1.0, beta = 0.0, dcutoff = 1.0) {
    this.mincutoff = mincutoff;
    this.beta = beta;
    this.dcutoff = dcutoff;
    this.x = new LowPassFilter(this.alpha(mincutoff, 1.0 / freq));
    this.dx = new LowPassFilter(this.alpha(dcutoff, 1.0 / freq));
    this.lastTime = undefined;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(x: number, timestamp: number): number {
    const dt = this.lastTime !== undefined 
      ? (timestamp - this.lastTime) / 1000  // Convert to seconds
      : 1.0 / 120;  // Default 120Hz

    this.lastTime = timestamp;

    // Estimate derivative
    const dx = this.dx.hasLastValue() 
      ? (x - this.dx.lastValue()) / dt 
      : 0;
    const edx = this.dx.filter(dx, this.alpha(this.dcutoff, dt));

    // Adaptive cutoff based on speed
    const cutoff = this.mincutoff + this.beta * Math.abs(edx);
    
    return this.x.filter(x, this.alpha(cutoff, dt));
  }
}

class LowPassFilter {
  private y: number | undefined;
  private a: number;

  constructor(alpha: number) {
    this.a = alpha;
  }

  filter(x: number, alpha?: number): number {
    if (alpha !== undefined) this.a = alpha;
    
    if (this.y === undefined) {
      this.y = x;
    } else {
      this.y = this.a * x + (1 - this.a) * this.y;
    }
    return this.y;
  }

  hasLastValue(): boolean {
    return this.y !== undefined;
  }

  lastValue(): number {
    return this.y!;
  }
}
```

### 5.2 Parameters

| Parameter | Description | Recommended |
|-----------|-------------|-------------|
| `mincutoff` | Minimum cutoff frequency (Hz) | 1.0 |
| `beta` | Speed coefficient | 0.0 - 0.007 |
| `dcutoff` | Derivative cutoff frequency | 1.0 |

**Tuning** (from Casiez):
- Increase `mincutoff` to reduce jitter (but increases lag)
- Increase `beta` to reduce lag when moving fast

---

## 6. Pointer Lifecycle Invariants

### 6.1 W3C Compliance (HARD REQUIREMENTS)

From W3C Pointer Events spec (grounded via Tavily):

1. **Never emit pressed moves without prior down**
   - `pointermove` with `buttons > 0` requires prior `pointerdown`

2. **Always emit `pointercancel` on tracking failure while down**
   - If in `DOWN_*` state and `trackingOk` becomes false → `pointercancel`

3. **Use pointer capture during drags**
   - `setPointerCapture(pointerId)` on `pointerdown`
   - `releasePointerCapture(pointerId)` on `pointerup` / `pointercancel`

4. **Consistent `pointerId` per hand**
   - Same `pointerId` for entire gesture sequence

### 6.2 Anti-Stuck-State Invariants

1. Every `pointerdown` must eventually be followed by `pointerup` OR `pointercancel`
2. Tracking loss always results in `pointercancel` if currently down
3. Palm rotation away always releases (up or cancel depending on tracking)

---

## 7. Test Plan (TDD)

### 7.1 Contract Tests

```typescript
describe('GestureFrameSchema', () => {
  it('validates valid GestureFrame', () => {
    const frame: GestureFrame = {
      ts: 1234567890,
      handId: 'right',
      trackingOk: true,
      palmFacing: true,
      label: 'Open_Palm',
      conf: 0.95,
      indexTip: { x: 100, y: 200 },
    };
    expect(GestureFrameSchema.safeParse(frame).success).toBe(true);
  });

  it('rejects invalid confidence', () => {
    const frame = { ...validFrame, conf: 1.5 };
    expect(GestureFrameSchema.safeParse(frame).success).toBe(false);
  });
});
```

### 7.2 FSM Tests

```typescript
describe('GestureFSM', () => {
  it('requires N frames of stable baseline to arm', () => { /* ... */ });
  it('command window expires correctly', () => { /* ... */ });
  it('no command→command transitions without baseline', () => { /* ... */ });
  it('always cancels on tracking loss while down', () => { /* ... */ });
  it('proper up emitted on release conditions', () => { /* ... */ });
});
```

### 7.3 Property Tests (fast-check)

```typescript
import * as fc from 'fast-check';

describe('Pointer Lifecycle Properties', () => {
  it('every down has matching up or cancel', () => {
    fc.assert(fc.property(
      fc.array(gestureFrameArbitrary),
      (frames) => {
        const events = runFSM(frames);
        const downs = events.filter(e => e.t === 'down');
        const closes = events.filter(e => e.t === 'up' || e.t === 'cancel');
        return downs.length === closes.length;
      }
    ));
  });
});
```

### 7.4 Integration Tests

```typescript
describe('Excalidraw Integration', () => {
  it('draw stroke: down→moves→up creates element', () => { /* ... */ });
  it('pan: middle drag moves viewport', () => { /* ... */ });
  it('zoom: wheel changes zoom level', () => { /* ... */ });
  it('stuck state: tracking loss mid-drag cancels and recovers', () => { /* ... */ });
});
```

---

## 8. Implementation Order

### Phase 0: Contracts First
1. `contracts/gesture-label.ts` - GestureLabel type
2. `contracts/gesture-frame.contract.ts` - GestureFrame Zod schema
3. `contracts/pointer-stream.contract.ts` - PointerEventOut Zod schemas
4. Tests for all contracts (TDD RED → GREEN)

### Phase 1: Physics Smoothing
1. `smoothing/low-pass-filter.ts` - LowPassFilter class
2. `smoothing/one-euro-filter.ts` - OneEuroFilter class
3. `smoothing/one-euro-filter.test.ts` - Property tests

### Phase 2: State Machine
1. `fsm/types.ts` - FSM types and context
2. `fsm/guards.ts` - Guard implementations
3. `fsm/actions.ts` - Action implementations
4. `fsm/gesture-fsm.ts` - XState machine
5. `fsm/gesture-fsm.test.ts` - State transition tests

### Phase 3: Adapters
1. `adapters/mediapipe-adapter.ts` - MediaPipe → GestureFrame
2. `adapters/dom-injector-adapter.ts` - PointerEventOut → DOM
3. Integration tests

### Phase 4: Demo
1. `demo/index.html` - HTML page with canvas
2. `demo/app.ts` - Wire everything together
3. E2E tests with Playwright

---

## 9. References

### Memory Bank Sources
- Gen 83, `REF__W3C_GESTURE_CONTROL_PLANE_GOLD_BATON.md` - Complete architecture
- Gen 83, `REF__W3C_GESTURE_LANGUAGE_SPEC.md` - FSM specification
- Gen 84, `HFO_TECH_STACK_GEN84.md` - Technology stack
- spatial era, `mediapipe-threejs-research_20250802135638.md` - MediaPipe integration

### Tavily-Grounded External Sources (2025-12-29)
- W3C Pointer Events Level 3: https://www.w3.org/TR/pointerevents/
- W3C Pointer Events (Updated CR 2025): https://www.w3.org/news/2025/updated-candidate-recommendation-pointer-events-level-3/
- One Euro Filter: https://gery.casiez.net/1euro/
- One Euro Filter GitHub: https://github.com/casiez/OneEuroFilter
- Casiez CHI 2012 Paper: https://gery.casiez.net/publications/CHI2012-casiez.pdf
- XState v5 Setup: https://stately.ai/docs/setup
- XState TypeScript: https://stately.ai/docs/typescript
- MediaPipe Gesture Recognizer: https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
- MediaPipe Hands: https://mediapipe.readthedocs.io/en/latest/solutions/hands.html
- MDN Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events

---

## 10. Approval Checklist

- [x] Architecture derived from Gen83 Gold Baton (no invention)
- [x] All technologies TRL 9 (production-ready)
- [x] Sources grounded via Tavily search
- [x] Contracts defined with Zod schemas
- [x] FSM states and transitions specified
- [x] Test plan covers unit, property, and integration
- [x] Pointer lifecycle invariants documented
- [ ] Implementation complete (PENDING)
- [ ] All tests passing (PENDING)
- [ ] E2E demo working (PENDING)

---

*The spider weaves the web that weaves the spider.*
*Gen87.X3 Sandbox | W3C Gesture Control Plane Spec | 2025-12-29*
