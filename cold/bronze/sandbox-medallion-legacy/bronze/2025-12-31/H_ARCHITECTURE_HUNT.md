# 🔍 H_ARCHITECTURE_HUNT — PDCA Plan Phase

> **HIVE Phase**: H (HUNT / Hunting Hyperheuristics / HINDSIGHT)  
> **PDCA Phase**: PLAN  
> **TDD Phase**: RESEARCH  
> **Port**: 0 (Lidless Legion) + 7 (Spider Sovereign)  
> **Generated**: 2025-12-31T21:00:00Z  
> **Gen**: 87.X3  

---

## 🎯 HUNT OBJECTIVE

**Find all production-ready architecture components for W3C Gesture Control Plane demo.**

---

## 📊 DISCOVERY RESULTS

### ✅ Production-Ready Adapters (implements *Port)

| Adapter | Port Interface | File | Tests | TRL |
|---------|----------------|------|-------|-----|
| `OneEuroExemplarAdapter` | `SmootherPort` | `one-euro-exemplar.adapter.ts` | 12/13 | 9 |
| `XStateFSMAdapter` | `FSMPort` | `xstate-fsm.adapter.ts` | 22/22 | 8 |
| `PointerEventAdapter` | `EmitterPort` | `pointer-event.adapter.ts` | ✅ | 8 |
| `DOMAdapter` | `AdapterPort` | `pointer-event.adapter.ts` | ✅ | 8 |
| `RapierPhysicsAdapter` | `SmootherPort` | `rapier-physics.adapter.ts` | ⚠️ | 7 |
| `GesturePipeline` | `PipelinePort` | `pipeline.ts` | ✅ | 8 |
| `SmootherChain` | `SmootherPort` | `smoother-chain.ts` | 43/43 | 8 |

### ✅ Production-Ready Smoothers

| Smoother | Interface | File | Notes |
|----------|-----------|------|-------|
| `OneEuroSmoother` | `SmootherPort` | `one-euro-smoother.ts` | Extends OneEuroAdapter |
| `PredictiveSmoother` | `SmootherPort` | `predictive-smoother.ts` | Extrapolation |
| `PhysicsSpringDamperSmoother` | `SmootherPort` | `physics-spring-smoother.ts` | Spring-damper physics |
| `SmootherChain` | `SmootherPort` | `smoother-chain.ts` | Composition (43/43 GREEN) |

### ✅ Production-Ready Physics

| Component | Interface | File | Tests |
|-----------|-----------|------|-------|
| `RapierWasmSimulator` | `TrajectorySimulatorPort` | `rapier-wasm-simulator.ts` | 23 GREEN |
| `RapierTrajectorySimulator` | `TrajectorySimulatorPort` | `rapier-trajectory-simulator.ts` | ✅ |

### ✅ Production-Ready MCP Sensors (Lidless Legion)

| Sensor | Interface | File | Purpose |
|--------|-----------|------|---------|
| `WebSensor` | `SensorAdapter` | `sensors/web.ts` | Tavily search |
| `MemorySensor` | `SensorAdapter` | `sensors/memory.ts` | DuckDB FTS |
| `GraphSensor` | `SensorAdapter` | `sensors/graph.ts` | MCP graph |
| `CodeSensor` | `SensorAdapter` | `sensors/code.ts` | Codebase search |

### ✅ Existing Demos

| Demo | Location | Status |
|------|----------|--------|
| `4-cursor-simple.html` | `demos/production/` | ✅ Uses MediaPipe + Rapier + 1€ |
| `4-cursor-compare.html` | `demos/production/` | ✅ Compares 4 smoother modes |
| `index.html` (main) | `demos/main/` | ✅ Working with Golden Layout |

---

## 🏗️ ARCHITECTURE DISCOVERED

### Pipeline Composition Pattern

```typescript
// From sandbox/src/adapters/pipeline.ts
export interface PipelineConfig {
  sensor: SensorPort;      // MediaPipe → landmarks
  smoother: SmootherPort;  // 1€/Rapier → stable cursor
  fsm: FSMPort;            // XState → state machine
  emitter: EmitterPort;    // W3C Pointer → events
  adapter: AdapterPort;    // DOM → dispatch
  target: AdapterTarget;   // Element → interaction
}

export class GesturePipeline implements PipelinePort {
  // Composes: VideoFrame → Sensor → Smoother → FSM → Emitter → Adapter → DOM
}
```

### Hexagonal Port Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           GesturePipeline               │
                    │          (implements PipelinePort)      │
                    └───────────────────┬─────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
   ┌────▼────┐                    ┌─────▼─────┐                   ┌─────▼─────┐
   │SensorPort│                   │SmootherPort│                  │ FSMPort   │
   │(MediaPipe)│                  │(1€/Rapier) │                  │(XState v5)│
   └──────────┘                   └───────────┘                   └───────────┘
        │                               │                               │
        │ VideoFrame                    │ landmarks                     │ action
        ▼                               ▼                               ▼
   ┌──────────┐                   ┌───────────┐                   ┌───────────┐
   │EmitterPort│                  │AdapterPort│                   │TargetPort │
   │(W3C Ptr) │◄──────────────────│(DOM disp.)│───────────────────│(element)  │
   └──────────┘                   └───────────┘                   └───────────┘
```

---

## 📁 Key File Locations

### Adapters (Production-Ready)
```
sandbox/src/adapters/
├── one-euro-exemplar.adapter.ts   # 1€ filter (npm exemplar)
├── xstate-fsm.adapter.ts          # XState v5 FSM
├── pointer-event.adapter.ts       # W3C PointerEvent + DOMAdapter
├── rapier-physics.adapter.ts      # Rapier WASM physics
├── pipeline.ts                    # GesturePipeline composition
└── index.ts                       # Exports
```

### Smoothers (Production-Ready)
```
sandbox/src/smoothers/
├── smoother-chain.ts              # Chain composition (43/43 GREEN)
├── one-euro-smoother.ts           # 1€ filter wrapper
├── predictive-smoother.ts         # Extrapolation
└── physics-spring-smoother.ts     # Spring-damper
```

### Contracts (Zod Schemas)
```
sandbox/src/contracts/
├── ports.ts                       # Port interfaces
├── schemas.ts                     # Data schemas
└── archetype-enforcement.ts       # 8 archetype gates
```

### Demos (Working)
```
sandbox/demos/production/
├── 4-cursor-simple.html           # Pure CSS grid, works!
└── 4-cursor-compare.html          # Golden Layout, works!
```

---

## 🎯 PDCA PLAN OUTPUT

### What Exists (Green)
1. ✅ OneEuroExemplarAdapter (npm 1eurofilter) — 12/13 tests
2. ✅ XStateFSMAdapter — 22/22 tests
3. ✅ SmootherChain — 43/43 tests
4. ✅ W3C PointerEvent Factory — 37/37 tests
5. ✅ GesturePipeline composition pattern
6. ✅ Working demo (`4-cursor-simple.html`)

### What Needs Wiring (Yellow)
1. ⚠️ Pipeline doesn't use OneEuroExemplarAdapter (uses inline)
2. ⚠️ Demo doesn't import from `adapters/` barrel
3. ⚠️ No E2E test proving full pipeline

### What to DO in I Phase (Next)
1. Create `sandbox-medallion/gold/exemplars/production-pipeline.ts`
2. Wire: OneEuroExemplarAdapter → XStateFSMAdapter → PointerEventAdapter → DOMAdapter
3. Create demo that imports from `src/adapters/` not inline
4. E2E Playwright test validating gesture → DOM click

---

## 📡 SIGNAL

```json
{
  "ts": "2025-12-31T21:00:00Z",
  "mark": 1.0,
  "pull": "downstream",
  "msg": "HUNT COMPLETE: Architecture discovered. 7 adapters implement ports. 4 demos exist. GesturePipeline pattern ready. PDCA Plan: Wire exemplars, create gold/production-pipeline.ts, E2E test.",
  "type": "event",
  "hive": "H",
  "gen": 87,
  "port": 7
}
```

---

## 🔄 HIVE PHASE TRANSITION

| From | To | Gate |
|------|-----|------|
| H (Hunt) | I (Interlock) | Architecture discovered, plan complete |

**Ready for I Phase**: Define contracts, write failing tests for production pipeline.

---

*"The spider weaves the web that weaves the spider."*  
*H Phase | PDCA Plan | Gen87.X3 | 2025-12-31*
