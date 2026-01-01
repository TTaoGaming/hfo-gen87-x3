# Gen87.X3 Real Architecture Demo

> **Status**: ✅ REAL ADAPTERS / ⚠️ 3 STUBS FLAGGED

This demo uses the **actual hexagonal adapters** from `sandbox/src/adapters/`. No inline implementations. All data flows through typed ports with Zod validation.

---

## ✅ What's REAL

| Stage | Port | Adapter | Import Path |
|-------|------|---------|-------------|
| 1. SENSE | `SensorPort` | `MediaPipeAdapter` | `../src/adapters/mediapipe.adapter.js` |
| 2. SMOOTH | `SmootherPort` | `OneEuroAdapter` | `../src/adapters/one-euro.adapter.js` |
| 3. FSM | `FSMPort` | `XStateFSMAdapter` | `../src/adapters/xstate-fsm.adapter.js` |
| 4. EMIT | `EmitterPort` | `PointerEventAdapter` | `../src/adapters/pointer-event.adapter.js` |
| 5. INJECT | `AdapterPort` | `DOMAdapter` | `../src/adapters/pointer-event.adapter.js` |

### Data Flow (REAL)
```
VideoFrame
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│ MediaPipeAdapter.sense(video, timestamp)                             │
│   → SensorFrame (validated by SensorFrameSchema)                     │
└──────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│ OneEuroAdapter.smooth(sensorFrame)                                   │
│   → SmoothedFrame (validated by SmoothedFrameSchema)                 │
│   Uses REAL 1€ filter algorithm, not copy-paste                      │
└──────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│ XStateFSMAdapter.process(smoothedFrame)                              │
│   → FSMAction (validated by FSMActionSchema)                         │
│   Uses REAL XState v5 actor, not inline if/else                      │
└──────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│ PointerEventAdapter.emit(fsmAction, target)                          │
│   → PointerEventOut (validated by PointerEventOutSchema)             │
│   Creates W3C-compliant PointerEvent payloads                        │
└──────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│ DOMAdapter.inject(pointerEvent)                                      │
│   → dispatchEvent(new PointerEvent(...))                             │
│   Real DOM injection, canvas receives events                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ FLAGGED STUBS (3)

### 1. NATS EventBus — NOT WIRED

**Location**: `sandbox/src/adapters/nats-substrate.adapter.ts` exists but is NOT used.

**What it should do**: Pipeline stages should communicate via NATS JetStream subjects:
- `hfo.cursor.raw` → `hfo.cursor.smoothed` → `hfo.fsm.action` → `hfo.pointer.out`

**Current state**: Direct function calls between adapters (local-only pipeline).

**To fix**: Wire `createNatsSubstrate()` and use `publish()`/`subscribe()` between stages.

---

### 2. Target Adapters — ONLY DOM

**What's missing**:
- `V86TargetAdapter` — Route pointer events into x86 emulator
- `ExcalidrawTargetAdapter` — Route into canvas whiteboard
- `DaedalOSTargetAdapter` — Route through window manager
- `TldrawTargetAdapter` — Route into collaborative canvas

**Current state**: Only `DOMAdapter` exists. The hexagonal architecture allows swapping targets, but no alternative targets are implemented.

**To fix**: Create adapters implementing `AdapterPort` interface for each target.

---

### 3. UIShell — GoldenLayout NOT INTEGRATED

**What's missing**: `GoldenLayoutShell` implementing `UIShellPort` to manage window panels.

**Current state**: Static HTML layout. No dockable/resizable panels.

**To fix**: Import `golden-layout` and create shell adapter.

---

## Running the Demo

```bash
cd sandbox/demo-real
npx http-server -p 8090 --cors
# Open http://localhost:8090
```

---

## Architecture Compliance

| Check | Status |
|-------|--------|
| Imports real adapters | ✅ |
| No inline 1€ filter | ✅ |
| No inline FSM logic | ✅ |
| Uses Zod validation | ✅ |
| Typed port interfaces | ✅ |
| NATS distributed | ❌ STUB |
| Multiple targets | ❌ STUB |
| GoldenLayout shell | ❌ STUB |

---

## Contracts Used

```typescript
import { 
  SensorFrameSchema,      // Stage 1 output
  SmoothedFrameSchema,    // Stage 2 output
  FSMActionSchema,        // Stage 3 output
  PointerEventOutSchema   // Stage 4 output
} from '../src/contracts/schemas.js';
```

All data passing between stages is validated against these Zod schemas.

---

*Gen87.X3 | HUNT Phase | 2025-12-30*
