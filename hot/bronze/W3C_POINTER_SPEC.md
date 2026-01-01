# 🎯 W3C Pointer Gesture Control Plane — TODO Manifest

> **Generated**: 2025-01-01  
> **Archive Source**: `cold/bronze/archive_2025-12-31/hot_silver/`  
> **Purpose**: Actionable task list for W3C pointer gesture pipeline  
> **Mission**: Build a daily-driver gesture input replacing mouse/touch

---

## 📊 Pipeline Overview

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│ 1. SENSE  │ → │ 2. SMOOTH │ → │  3. FSM   │ → │ 4. EMIT   │ → │ 5. TARGET │
│ MediaPipe │   │ 1€ Filter │   │  XState   │   │ W3C Ptr   │   │   DOM     │
│  60 fps   │   │ De-jitter │   │ Gestures  │   │  Events   │   │ Dispatch  │
└───────────┘   └───────────┘   └───────────┘   └───────────┘   └───────────┘
   Port 0          Port 2          Port 3          Port 5          Port 1
  SENSE           SHAPE          DELIVER         DEFEND           FUSE
```

---

## 📋 Today's W3C Pipeline Tasks

### 🔴 PRIORITY 1: Restore Core Schemas (1 hour)

**Problem**: Clean slate needs type definitions first

| Task | Source | Dest | Est. | Status |
|------|--------|------|------|--------|
| [ ] Copy schemas.ts | `archive/root_sprawl/src/shared/` | `hot/bronze/src/shared/` | 15m | |
| [ ] Copy contracts | `archive/hot_bronze/src/contracts/` | `hot/bronze/src/contracts/` | 15m | |
| [ ] Verify types compile | `npm run typecheck` | | 15m | |
| [ ] Run schema tests | `npm run prove:schemas` | | 15m | |

**Core Schemas Needed**:
```typescript
// SensorFrame - MediaPipe output
export const SensorFrame = z.object({
  timestamp: z.number().positive(),
  frameId: z.number().nonnegative(),
  hands: z.array(HandResult).max(2),
  latencyMs: z.number().nonnegative()
});

// SmoothedFrame - After 1€ filter
export const SmoothedFrame = z.object({
  timestamp: z.number(),
  frameId: z.number(),
  smoothedHands: z.array(SmoothedHand).max(2),
  rawLatencyMs: z.number(),
  smoothingLatencyMs: z.number()
});

// FSMAction - XState output
export const FSMAction = z.object({
  type: z.enum(['move', 'down', 'up', 'cancel']),
  position: Position,
  handedness: z.enum(['left', 'right']),
  pressure: z.number().min(0).max(1),
  timestamp: z.number()
});

// PointerEventOut - W3C compliant
export const PointerEventOut = z.object({
  type: z.enum(['pointermove', 'pointerdown', 'pointerup', 'pointercancel']),
  clientX: z.number(),
  clientY: z.number(),
  pointerId: z.number(),
  pointerType: z.literal('pen'),
  pressure: z.number().min(0).max(1),
  isPrimary: z.boolean()
});
```

---

### 🔴 PRIORITY 2: Restore Stage 1 - SENSE (1 hour)

**Problem**: Need MediaPipe hand tracking adapter

| Task | Source | Dest | Est. | Status |
|------|--------|------|------|--------|
| [ ] Copy mediapipe adapter | `archive/hot_bronze/src/adapters/` | `hot/bronze/src/adapters/` | 20m | |
| [ ] Copy adapter tests | Same | Same | 10m | |
| [ ] Verify WASM loads | Manual test | | 15m | |
| [ ] Run adapter tests | `npm run prove:mediapipe` | | 15m | |

**TRL-9 Exemplar**:
```typescript
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// 21 landmarks per hand
// INDEX_TIP (landmark 8) = primary pointer
// Configuration: 2 hands, 60fps VIDEO mode
```

**Port Contract**:
```typescript
interface SensorPort {
  process(results: MediaPipeResults): SensorFrame;
}
```

---

### 🔴 PRIORITY 3: Restore Stage 2 - SMOOTH (1 hour)

**Problem**: Need 1€ filter for jitter removal

| Task | Source | Dest | Est. | Status |
|------|--------|------|------|--------|
| [ ] Copy one-euro adapter | `archive/hot_bronze/src/adapters/` | `hot/bronze/src/adapters/` | 20m | |
| [ ] Copy adapter tests | Same | Same | 10m | |
| [ ] Verify filter params | Manual test | | 15m | |
| [ ] Run adapter tests | `npm run prove:one-euro` | | 15m | |

**TRL-9 Exemplar**:
```typescript
import OneEuroFilter from "1eurofilter";

const config = {
  freq: 60,        // Sampling frequency (Hz)
  minCutoff: 1.0,  // Minimum cutoff frequency
  beta: 0.007,     // Speed coefficient
  dCutoff: 1.0     // Derivative cutoff
};
```

**Port Contract**:
```typescript
interface SmootherPort {
  smooth(frame: SensorFrame): SmoothedFrame;
}
```

---

### 🟡 PRIORITY 4: Restore Stage 3 - FSM (2 hours)

**Problem**: Need XState gesture recognition FSM

| Task | Source | Dest | Est. | Status |
|------|--------|------|------|--------|
| [ ] Copy xstate-fsm adapter | `archive/hot_bronze/src/adapters/` | `hot/bronze/src/adapters/` | 30m | |
| [ ] Copy FSM definition | `archive/hot_silver/` | `hot/bronze/src/fsm/` | 30m | |
| [ ] Copy FSM tests | Same | Same | 20m | |
| [ ] Run FSM tests | `npm run prove:xstate` | | 40m | |

**TRL-9 Exemplar**:
```typescript
import { createMachine, interpret } from "xstate";

// States: idle, hovering, pressing, dragging
// Events: HAND_ENTER, HAND_MOVE, PINCH_START, PINCH_END, HAND_LEAVE
```

**Port Contract**:
```typescript
interface FSMPort {
  transition(frame: SmoothedFrame): FSMAction;
}
```

**Gesture State Machine**:
```
        ┌──────────────────────────────────────────────────────┐
        │                                                      │
        ▼                                                      │
    ┌───────┐  HAND_ENTER   ┌──────────┐  PINCH_START  ┌──────────┐
    │ idle  │──────────────▶│ hovering │──────────────▶│ pressing │
    └───────┘               └──────────┘               └──────────┘
        ▲                        │                          │
        │                        │ HAND_LEAVE               │ MOVE
        │                        ▼                          ▼
        │                   ┌──────────┐              ┌──────────┐
        └───────────────────│  (exit)  │              │ dragging │
                            └──────────┘              └──────────┘
                                                           │
                                                           │ PINCH_END
                                                           ▼
                                                      ┌──────────┐
                                                      │ hovering │
                                                      └──────────┘
```

---

### 🟡 PRIORITY 5: Restore Stage 4 - EMIT (1 hour)

**Problem**: Need W3C Pointer Event emitter

| Task | Source | Dest | Est. | Status |
|------|--------|------|------|--------|
| [ ] Copy pointer-event adapter | `archive/hot_bronze/src/adapters/` | `hot/bronze/src/adapters/` | 20m | |
| [ ] Copy adapter tests | Same | Same | 10m | |
| [ ] Verify W3C compliance | Manual test | | 15m | |
| [ ] Run adapter tests | `npm run prove:pointer` | | 15m | |

**TRL-9 Exemplar**:
```typescript
// W3C Pointer Events Level 3
const event = new PointerEvent('pointermove', {
  clientX: position.x,
  clientY: position.y,
  pointerId: 1,
  pointerType: 'pen',  // Gesture = pen (not touch)
  pressure: pinchStrength,
  isPrimary: true
});
```

**Port Contract**:
```typescript
interface EmitterPort {
  emit(action: FSMAction): PointerEventOut;
}
```

---

### 🟡 PRIORITY 6: Restore Stage 5 - TARGET (1 hour)

**Problem**: Need DOM dispatch adapter

| Task | Source | Dest | Est. | Status |
|------|--------|------|------|--------|
| [ ] Copy target adapter | `archive/hot_bronze/src/adapters/` | `hot/bronze/src/adapters/` | 20m | |
| [ ] Implement hit testing | New or from archive | | 20m | |
| [ ] Copy adapter tests | Same | Same | 10m | |
| [ ] Run adapter tests | Terminal | | 10m | |

**Port Contract**:
```typescript
interface TargetPort {
  dispatch(event: PointerEventOut): void;
}
```

---

## 📋 This Week's W3C Pipeline Tasks

### 🔵 PRIORITY 7: Integration Test (2 hours)

**Problem**: Individual stages work, need end-to-end test

| Task | Est. | Status |
|------|------|--------|
| [ ] Create integration test file | 30m | |
| [ ] Mock MediaPipe input | 30m | |
| [ ] Verify pipeline flow | 30m | |
| [ ] Measure latency budget | 30m | |

**Latency Budget**:
```
Total budget: 16.67ms (60fps)

Stage 1 (Sense):    ~8ms  (MediaPipe)
Stage 2 (Smooth):   ~1ms  (1€ filter)
Stage 3 (FSM):      ~1ms  (XState)
Stage 4 (Emit):     ~1ms  (Event creation)
Stage 5 (Target):   ~1ms  (DOM dispatch)
─────────────────────────
Total:             ~12ms  (4.67ms margin)
```

---

### 🔵 PRIORITY 8: Demo Page (2 hours)

**Problem**: Need visual demo of gesture control

| Task | Est. | Status |
|------|------|--------|
| [ ] Create demo HTML page | 30m | |
| [ ] Add camera preview | 30m | |
| [ ] Add pointer visualization | 30m | |
| [ ] Add event log panel | 30m | |

---

### 🔵 PRIORITY 9: Property-Based Tests (2 hours)

**Problem**: Need fast-check property tests for edge cases

| Task | Est. | Status |
|------|------|--------|
| [ ] Property: Smoothed output bounded by input | 30m | |
| [ ] Property: FSM transitions are deterministic | 30m | |
| [ ] Property: Events maintain temporal order | 30m | |
| [ ] Property: Pressure always in [0,1] | 30m | |

**Example Property**:
```typescript
import * as fc from 'fast-check';

// Property: Smoothed coordinates never exceed frame bounds
fc.assert(
  fc.property(
    fc.float({ min: 0, max: 1 }),
    fc.float({ min: 0, max: 1 }),
    (x, y) => {
      const smoothed = smoother.smooth({ x, y });
      return smoothed.x >= 0 && smoothed.x <= 1 &&
             smoothed.y >= 0 && smoothed.y <= 1;
    }
  ),
  { numRuns: 100 }
);
```

---

## 📋 Future W3C Pipeline Tasks

### ⚪ PRIORITY 10: Rapier Physics Predictor

**Problem**: Add look-ahead prediction for reduced perceived latency

| Task | Est. | Status |
|------|------|--------|
| [ ] Integrate Rapier2D WASM | 2h | |
| [ ] Implement velocity prediction | 2h | |
| [ ] Tune prediction window | 1h | |
| [ ] Test prediction accuracy | 1h | |

---

### ⚪ PRIORITY 11: Alternative Sensors

**Problem**: Only MediaPipe supported, need diversity

| Sensor | Package | Priority |
|--------|---------|----------|
| WebXR XRHand | Native | HIGH (VR/AR) |
| Leap Motion | @parvathi/leap | MEDIUM |
| Mouse (testing) | Native | LOW |

---

### ⚪ PRIORITY 12: Golden Layout Integration

**Problem**: Gesture control needs panel docking target

| Task | Est. | Status |
|------|------|--------|
| [ ] Restore golden-layout adapter | 1h | |
| [ ] Implement resize gestures | 2h | |
| [ ] Implement drag-drop panels | 2h | |
| [ ] E2E test with Playwright | 2h | |

---

## 🔑 Key Metrics to Track

| Metric | Target | Current | Tracking |
|--------|--------|---------|----------|
| End-to-end latency | <16ms | N/A | Performance test |
| Pointer accuracy | <5px error | N/A | Property tests |
| Gesture recognition | >95% | N/A | Integration test |
| False positive rate | <1% | N/A | Property tests |
| Frame drop rate | <1% | N/A | Performance test |

---

## 📂 Files to Restore/Create

### From Archive (restore)
- [ ] `src/shared/schemas.ts`
- [ ] `src/contracts/sensor.contract.ts`
- [ ] `src/contracts/smoother.contract.ts`
- [ ] `src/contracts/fsm.contract.ts`
- [ ] `src/contracts/emitter.contract.ts`
- [ ] `src/adapters/mediapipe.adapter.ts`
- [ ] `src/adapters/one-euro-exemplar.adapter.ts`
- [ ] `src/adapters/xstate-fsm.adapter.ts`
- [ ] `src/adapters/pointer-event.adapter.ts`

### Create Fresh
- [ ] `src/adapters/target.adapter.ts`
- [ ] `src/integration/pipeline.test.ts`
- [ ] `demo/gesture-demo.html`

---

## 🧪 TRL-9 Exemplar Verification

| Stage | Package | Version | Author | Verified |
|-------|---------|---------|--------|----------|
| 1 | `@mediapipe/tasks-vision` | 0.10.22 | Google | ✅ |
| 2 | `1eurofilter` | 1.2.2 | Géry Casiez | ✅ |
| 3 | `xstate` | 5.25.0 | David Khourshid | ✅ |
| 4 | W3C Pointer Events L3 | Native | W3C | ✅ |
| 5 | DOM EventTarget | Native | WHATWG | ✅ |

---

*Spider Sovereign — Port 7 — DECIDE*  
*"The spider weaves the web that weaves the spider."*
