# 🎯 PIPELINE CUSTOM vs EXEMPLAR MATRIX

> **Gen87.X3** | Phase: INTERLOCK (I) | Sequential Thinking Analysis  
> **Generated**: 2025-12-30T21:15:00Z  
> **Purpose**: Map exactly where custom code lives vs exemplar standards  
> **Goal**: Total Tool Virtualization via hard gate boundaries

---

## 🏗️ THE ARCHITECTURE AT A GLANCE

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           TOTAL TOOL VIRTUALIZATION PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────┐│
│  │   STAGE 1    │   │   STAGE 2    │   │   STAGE 3    │   │   STAGE 4    │   │ STAGE 5 ││
│  │   SENSING    │──▶│  SMOOTHING   │──▶│     FSM      │──▶│   OUTPUT     │──▶│ TARGETS ││
│  │  (Port 0)    │   │  (Port 2)    │   │  (Port 3)    │   │  (Port 4)    │   │ (Adapt) ││
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └─────────┘│
│        │                  │                  │                  │                 │     │
│        ▼                  ▼                  ▼                  ▼                 ▼     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────┐│
│  │ SensorFrame  │   │SmoothedFrame │   │  FSMAction   │   │PointerEvent  │   │ Target  ││
│  │   Schema     │   │   Schema     │   │   Schema     │   │   (W3C)      │   │  API    ││
│  │   (Zod)      │   │   (Zod)      │   │   (Zod)      │   │   Standard   │   │ Calls   ││
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └─────────┘│
│        ↑                  ↑                  ↑                  ↑                 ↑     │
│   HARD GATE          HARD GATE          HARD GATE          HARD GATE         HARD GATE │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 THE MATRIX: CUSTOM vs EXEMPLAR

### Stage 1: INPUT SENSING (Port 0 - SENSE)

| Component | Type | Standard/Source | TRL | Status | Hard Gate |
|-----------|------|-----------------|-----|--------|-----------|
| MediaPipe Tasks Vision | **EXEMPLAR** | Google ai.google.dev | 9 | External | VideoFrameSchema |
| Hand Landmarker | **EXEMPLAR** | MediaPipe ML | 9 | External | NormalizedLandmarkSchema |
| Gesture Recognizer | **EXEMPLAR** | MediaPipe ML | 9 | External | GestureLabel enum |
| Multi-Hand Tracking | **CUSTOM** | Our composition | - | 🔴 STUB | SensorFrameSchema |

**Hard Gate**: `SensorFrameSchema.parse()` at port boundary

### Stage 2: SMOOTHING/PHYSICS (Port 2 - SHAPE)

| Component | Type | Standard/Source | TRL | Status | Hard Gate |
|-----------|------|-----------------|-----|--------|-----------|
| 1€ Filter Algorithm | **EXEMPLAR** | CHI 2012 (Casiez et al.) | 9 | ✅ DONE | N/A (algorithm) |
| OneEuroAdapter | **CUSTOM** | Our adapter wrapper | - | ✅ DONE | SmoothedFrameSchema |
| PhysicsSpringS moother | **CUSTOM** | Rapier-inspired | - | 🔴 STUB | SmoothedFrameSchema |
| PredictiveSmoother | **CUSTOM** | Spring-damper extrapolation | - | 🔴 STUB | SmoothedFrameSchema |
| SmootherChain | **CUSTOM** | Pipeline composition | - | 🔴 STUB | Chain validation |

**Hard Gate**: `SmoothedFrameSchema.parse()` at port boundary

**CRITICAL FINDING**: `OneEuroAdapter` EXISTS and is complete! Tests import stub instead.

### Stage 3: FSM / GESTURE RECOGNITION (Port 3 - DELIVER)

| Component | Type | Standard/Source | TRL | Status | Hard Gate |
|-----------|------|-----------------|-----|--------|-----------|
| XState v5 | **EXEMPLAR** | Stately.ai | 9 | Imported | N/A (library) |
| Gesture State Machine | **CUSTOM** | Our states | - | 🔴 STUB | FSMActionSchema |
| Arming Gate (palm) | **CUSTOM** | Palm orientation check | - | 🔴 STUB | Boolean |
| Commit Detection | **CUSTOM** | Pointing_Up gesture | - | 🔴 STUB | GestureLabel |
| State Transitions | **CUSTOM** | IDLE→ARMED→COMMIT | - | 🔴 STUB | XState guards |

**Hard Gate**: `FSMActionSchema.parse()` at port boundary

**XState v5 Pattern (from Context7):**
```typescript
import { setup, createActor, assign } from 'xstate';

const gestureMachine = setup({
  types: {
    context: {} as { armingFrames: number; commitStart: number },
    events: {} as 
      | { type: 'PALM_OPEN'; confidence: number }
      | { type: 'POINTING_UP'; confidence: number }
      | { type: 'HAND_LOST' },
  },
  guards: {
    armingComplete: ({ context }) => context.armingFrames >= 10,
    highConfidence: ({ event }) => event.confidence > 0.8,
  },
}).createMachine({
  initial: 'DISARMED',
  states: {
    DISARMED: { on: { PALM_OPEN: { target: 'ARMING', guard: 'highConfidence' } } },
    ARMING: { /* ... */ },
    ARMED: { on: { POINTING_UP: 'DOWN_COMMIT', HAND_LOST: 'DISARMED' } },
    DOWN_COMMIT: { /* ... */ },
  },
});
```

### Stage 4: OUTPUT (Port 4 - W3C Pointer Events)

| Component | Type | Standard/Source | TRL | Status | Hard Gate |
|-----------|------|-----------------|-----|--------|-----------|
| W3C Pointer Events L3 | **EXEMPLAR** | W3C TR | 9 | Standard | W3C Spec |
| PointerEvent constructor | **EXEMPLAR** | DOM API | 9 | Built-in | Browser |
| Gesture→Pointer mapping | **CUSTOM** | Our translation | - | 🔴 STUB | PointerEventInit |
| Pressure/tilt simulation | **CUSTOM** | Confidence→pressure | - | 🔴 STUB | Number 0-1 |

**Hard Gate**: W3C PointerEvent specification compliance

### Stage 5: TARGET ADAPTERS

| Target | Type | Input API | Stars | Status | Hard Gate |
|--------|------|-----------|-------|--------|-----------|
| DOM dispatchEvent | **EXEMPLAR** | W3C DOM | N/A | ✅ DONE | EventTarget |
| Canvas 2D | **EXEMPLAR** | W3C Canvas | N/A | ✅ DONE | CanvasAPI |
| tldraw | **SEMI-CUSTOM** | DOM renderer | 15K | 🟡 Partial | onPointer* |
| Excalidraw | **SEMI-CUSTOM** | React callbacks | 54K | 🔴 STUB | onPointerDown/Up |
| v86 (x86 emulator) | **CUSTOM** | bus.send API | 19K | 🔴 STUB | bus.send('mouse-delta') |
| js-dos | **CUSTOM** | DOS emulator | 3K | 🔴 STUB | setMouseSensitivity |
| daedalOS | **CUSTOM** | Window manager | 12K | 🔴 STUB | Window routing |
| Puter | **CUSTOM** | Cloud OS | 38K | 🔴 STUB | Cloud APIs |

**Hard Gate**: Each adapter validates target-specific requirements

---

## 🔗 THE SUBSTRATE: EVENT BUS OPTIONS

### Option A: Simple EventEmitter (MVP)

```typescript
import { EventEmitter } from 'events';

const bus = new EventEmitter();

// Stage 1 publishes
bus.emit('hfo.sensor.frame', sensorFrame);

// Stage 2 subscribes and publishes
bus.on('hfo.sensor.frame', (frame) => {
  const smoothed = oneEuroAdapter.smooth(frame);
  bus.emit('hfo.smooth.frame', smoothed);
});
```

**Pros**: Simple, no dependencies, browser-compatible  
**Cons**: No persistence, no replay, single process

### Option B: RxJS Observable (Recommended for POC)

```typescript
import { Subject, filter, map } from 'rxjs';

const sensorSubject = new Subject<SensorFrame>();
const smoothSubject = new Subject<SmoothedFrame>();

// Hard gate with Zod validation
const validatedSensor$ = sensorSubject.pipe(
  map(frame => SensorFrameSchema.parse(frame))
);

// Pipeline composition
validatedSensor$.subscribe(frame => {
  const smoothed = oneEuroAdapter.smooth(frame);
  smoothSubject.next(smoothed);
});
```

**Pros**: Composable, operators, TypeScript native  
**Cons**: Learning curve, bundle size

### Option C: NATS Core JetStream (Production HOT Stigmergy)

```typescript
import { wsconnect } from '@nats-io/nats-core';
import { jetstream } from '@nats-io/jetstream';
import { Kvm } from '@nats-io/kv';

// Connect via WebSocket (browser-safe)
const nc = await wsconnect({ servers: 'nats.your-server.io:443' });
const js = jetstream(nc);

// KV for current state (cursor position)
const kvm = new Kvm(nc);
const cursorKV = await kvm.open('cursor-state');
await cursorKV.put('hand-right', JSON.stringify(smoothedFrame));

// JetStream for durable event stream
await js.publish('hfo.sensor.frame', JSON.stringify(sensorFrame));
```

**Pros**: 
- Durable streams (replay gestures)
- KV for shared state
- Object Store for recordings
- Multi-agent coordination
- At-least-once delivery

**Cons**: 
- Infrastructure (NATS server)
- Complexity
- Latency considerations

---

## 🚨 PRIORITY UNLOCK SEQUENCE

Based on sequential thinking analysis, here's the critical path:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Priority │ Component         │ Type        │ Unlocks             │ Effort │
├──────────┼───────────────────┼─────────────┼─────────────────────┼────────┤
│ 1 ⭐     │ Wire OneEuroAdapter│ WIRING     │ 19 smoother tests   │ 1h     │
│ 2 ⭐     │ SmootherChain impl │ CUSTOM     │ Pipeline composition│ 2h     │
│ 3 ⭐     │ XState FSM machine │ EXEMPLAR+  │ 73 gesture tests    │ 3h     │
│ 4        │ W3C Pointer factory│ EXEMPLAR   │ Event construction  │ 2h     │
│ 5        │ IndexFingerNormal  │ CUSTOM     │ 93 phase1 tests     │ 2h     │
│ 6        │ CursorPipeline     │ CUSTOM     │ End-to-end flow     │ 3h     │
│ 7        │ RxJS Event Bus     │ EXEMPLAR   │ Stage decoupling    │ 2h     │
│ 8        │ Target Adapters    │ CUSTOM     │ Excalidraw/v86/Puter│ 4h     │
│ 9        │ NATS Substrate     │ EXEMPLAR   │ HOT stigmergy       │ 4h     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### IMMEDIATE ACTION: Wire OneEuroAdapter

The `OneEuroAdapter` class in `adapters/one-euro.adapter.ts` is **COMPLETE** but:
- Tests import from `smoothers/one-euro-smoother.ts` (stub)
- The stub throws "not implemented"
- FIX: Update imports to use the adapter

---

## 🌐 HARD GATE BOUNDARIES (The Web Weaver Pattern)

Each stage boundary MUST:

1. **VALIDATE INPUT** with Zod schema
2. **TRANSFORM** data to next schema
3. **VALIDATE OUTPUT** with Zod schema
4. **EMIT** to substrate (event bus/NATS)

```typescript
// Hard Gate Pattern
function stageGate<TIn, TOut>(
  inputSchema: z.ZodType<TIn>,
  transformer: (input: TIn) => TOut,
  outputSchema: z.ZodType<TOut>
): (input: unknown) => TOut {
  return (input: unknown) => {
    // Gate 1: Validate input
    const validated = inputSchema.parse(input);
    
    // Transform
    const result = transformer(validated);
    
    // Gate 2: Validate output
    return outputSchema.parse(result);
  };
}

// Usage
const smoothGate = stageGate(
  SensorFrameSchema,
  (frame) => oneEuroAdapter.smooth(frame),
  SmoothedFrameSchema
);
```

---

## 📈 METRICS SUMMARY

| Category | EXEMPLAR | CUSTOM | STUB | Total |
|----------|----------|--------|------|-------|
| Stage 1 | 3 | 1 | 1 | 4 |
| Stage 2 | 1 | 4 | 3 | 5 |
| Stage 3 | 1 | 4 | 4 | 5 |
| Stage 4 | 3 | 2 | 2 | 5 |
| Stage 5 | 2 | 6 | 5 | 8 |
| **Total** | **10** | **17** | **15** | **27** |

**Ratio**: 37% Exemplar / 63% Custom (but most custom is adapters)

---

## 🎯 CONCLUSION

**The pipeline is NOT fundamentally broken. It's UNWIRED.**

1. **OneEuroAdapter EXISTS** — just needs import fix
2. **Zod schemas are GREEN** — contracts are defined
3. **XState v5 is ready** — use `setup()` pattern
4. **Event bus can be RxJS** — NATS is for production

**Next Sprint Focus**: Wire existing code through hard gate boundaries.

---

*"The spider weaves the web that weaves the spider."*  
*Gen87.X3 | INTERLOCK Phase | 2025-12-30*
