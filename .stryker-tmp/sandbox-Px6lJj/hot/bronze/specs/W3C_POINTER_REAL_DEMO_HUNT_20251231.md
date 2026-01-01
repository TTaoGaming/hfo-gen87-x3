# W3C Gesture Control Plane — REAL DEMO HUNT Spec

> **Version**: 1.9.0  
> **Date**: 2025-12-31T17:45:00Z  
> **Generation**: 87.X3  
> **Phase**: HUNT (H) — Consolidated Research  
> **Author**: Spider Sovereign (Port 7)  
> **Purpose**: Consolidate workspace state for REAL demo (not theater)

---

## 🎯 MISSION: Real Demo Using Actual Architecture

**Problem**: Previous demos are inline HTML that bypass the 8-port hexagonal architecture.

**Goal**: Create a demo that:
1. Uses **actual port interfaces** (`SmootherPort`, `FSMPort`, `EmitterPort`)
2. Consumes the **browser bundle** (`window.HFO.*`)
3. Wires **real adapters** (not inline reimplementations)
4. Is **verifiable** through automated tests

---

## 📊 PARETO FRONTIER: What Exists vs What's Real

### TEST STATUS (Current Run)

| Metric | Value |
|--------|-------|
| **Total Tests** | 900 |
| **Passed** | 663 (73.7%) |
| **Failed** | 179 (19.9%) |
| **Skipped** | 7 |
| **TODO** | 51 |

### TIER 1: GOLD — Full Hexagonal Compliance (USE THESE)

| Adapter | Port Interface | NPM Package | Tests |
|---------|----------------|-------------|-------|
| `OneEuroExemplarAdapter` | `SmootherPort` | `1eurofilter@1.2.2` | 13 GREEN |
| `XStateFSMAdapter` | `FSMPort` | `xstate@5.25.0` | 27 GREEN |
| `RapierPhysicsAdapter` | `SmootherPort` | `@dimforge/rapier2d-compat@0.19.3` | GREEN |
| `PointerEventAdapter` | `EmitterPort` | W3C Native | GREEN |
| `MediaPipeAdapter` | `SensorPort` | `@mediapipe/tasks-vision` | GREEN |

### TIER 2: SILVER — Internal Implementation (Acceptable)

| Adapter | Port | Tests |
|---------|------|-------|
| `SmootherChain` | `SmootherPort` | 43 GREEN |
| `PredictiveSmoother` | `SmootherPort` | GREEN |
| `GesturePipeline` | `PipelinePort` | GREEN |
| `W3CPointerEventFactory` | Factory | 37 GREEN |

### TIER 3: THEATER — Bypasses Architecture (DO NOT USE)

| Pattern | Location | Status |
|---------|----------|--------|
| Inline 1€ filter | `_legacy/v1-basic/*.html` | ❌ Theater |
| Inline XState | `_legacy/v2-golden-variants/*.html` | ❌ Theater |
| Direct CDN imports | Various demos | ❌ Theater |
| Class definitions in HTML | `_staging_for_removal/` | ❌ Theater |

---

## 🏗️ REAL ARCHITECTURE: Port Interface Compliance

### Port Interfaces Defined (`sandbox/src/contracts/ports.ts`)

```
┌─────────────────────────────────────────────────────────────────┐
│ PORT 0: SensorPort       │ MediaPipe → SensorFrame             │
│   - initialize()         │                                     │
│   - sense(video, ts)     │                                     │
│   - dispose()            │                                     │
├─────────────────────────────────────────────────────────────────┤
│ PORT 2: SmootherPort     │ SensorFrame → SmoothedFrame         │
│   - smooth(frame)        │                                     │
│   - reset()              │                                     │
│   - setParams(mc, beta)  │                                     │
├─────────────────────────────────────────────────────────────────┤
│ PORT 3: FSMPort          │ SmoothedFrame → FSMAction           │
│   - process(frame)       │                                     │
│   - getState()           │                                     │
│   - disarm()             │                                     │
│   - subscribe(cb)        │                                     │
├─────────────────────────────────────────────────────────────────┤
│ PORT 5: EmitterPort      │ FSMAction → PointerEventOut         │
│   - emit(action, target) │                                     │
│   - pointerId            │                                     │
├─────────────────────────────────────────────────────────────────┤
│ ADAPTER PORT             │ PointerEventOut → DOM dispatch      │
│   - inject(event)        │                                     │
│   - getBounds()          │                                     │
│   - setCapture()         │                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Real Pipeline Implementations

| File | What It Does | Status |
|------|--------------|--------|
| `simple-cursor-pipeline.ts` | Wires 1€→FSM→W3C | **REAL** (208 lines) |
| `w3c-cursor-pipeline.ts` | Full pipeline orchestrator | **REAL** |
| `browser-bundle.ts` | Exports `window.HFO.*` | **REAL** (100 lines) |

---

## 📦 DEPENDENCIES: Installed vs Used

### Production Dependencies (REAL)

| Package | Version | Adapter | Status |
|---------|---------|---------|--------|
| `1eurofilter` | 1.2.2 | `OneEuroExemplarAdapter` | ✅ USED |
| `xstate` | 5.25.0 | `XStateFSMAdapter` | ✅ USED |
| `@dimforge/rapier2d-compat` | 0.19.3 | `RapierPhysicsAdapter` | ✅ USED |
| `@mediapipe/tasks-vision` | 0.10.22 | `MediaPipeAdapter` | ✅ USED |
| `golden-layout` | 2.6.0 | Demo UI | ✅ USED |
| `zod` | 3.25.76 | Schema validation | ✅ USED |

### Production Dependencies (THEATER — Installed but NOT Hexagonal)

| Package | Version | Issue |
|---------|---------|-------|
| `@nats-io/nats-core` | 3.3.0 | ❌ 462 lines but NO port interface |
| `@temporalio/*` | 1.14.0 | ❌ No adapter exists |
| `@langchain/langgraph` | 1.0.7 | ❌ No adapter exists |

---

## 🗺️ DEMO INVENTORY

### Production Demo (USE THIS)

**Location**: `sandbox/demos/production/index.html`

**Architecture Compliance**:
- ✅ Uses `window.HFO.*` adapters
- ✅ No inline 1€ filter code
- ✅ No inline XState machines
- ✅ Consumes browser bundle

**Panels**:
1. Camera Feed — MediaPipe visualization
2. Cursor Area — Raw vs Smoothed cursor dots
3. Settings — Smoother type selection
4. Architecture — 5-stage pipeline display
5. Metrics — FPS, latency display

### Legacy Demos (DO NOT USE)

| Location | Issue |
|----------|-------|
| `demos/_legacy/v1-basic/` | Inline 1€ filter |
| `demos/_legacy/v2-golden-variants/` | 13 variants, all inline |
| `demos/_legacy/v3-target-*` | Target adapters, mixed quality |
| `_staging_for_removal/` | Duplicates, pending delete |

---

## 🔴 KNOWN FAILURES (179 tests)

### Top Failure Files

| File | Failures | Root Cause |
|------|----------|------------|
| `multi-hand.test.ts` | 152 | `DegradationStrategy not implemented` |
| `ui-shell-port.test.ts` | ~20 | `PuterShellAdapter not implemented` |
| `emulator-adapters.test.ts` | ~10 | Stubs throwing |

### Failure Pattern Analysis

```
Error: DegradationStrategy not implemented
Error: PuterShellAdapter not implemented
Error: Not implemented
```

**Root Cause**: These are RED tests waiting for implementation. They are HONEST (throw clearly) unlike fake-green stubs.

---

## 🧪 AUDIT TOOLS AVAILABLE

| Script | Command | Purpose |
|--------|---------|---------|
| Theater Detector | `npm run detect:theater` | Find inline/hand-rolled code |
| Stub Detector | `npm run detect:stubs` | Find `throw new Error('Not implemented')` |
| Red Regnant V2 | `npm run audit:lies` | Find 50 lie patterns |
| Trust Enforce | `npm run trust:status` | AI trust reputation |
| V-Phase Gate | `npm run v-phase` | Block reward hacking patterns |

---

## 🎯 NEXT STEPS (Phased)

### HUNT Completion Checklist

- [x] Inventory demos (production vs theater)
- [x] Map port interfaces
- [x] Audit dependencies (real vs theater)
- [x] Identify working adapters
- [x] Consolidate into daily spec

### INTERLOCK (I) Phase — Next

1. **Verify production demo works**
   ```bash
   npx serve sandbox/demos/production -p 9090
   # Open http://localhost:9090
   ```

2. **Run E2E tests on real demo**
   ```bash
   npm run test:e2e
   ```

3. **Build browser bundle**
   ```bash
   npm run build:bundle
   ```

### VALIDATE (V) Phase — After I

1. Convert 179 failing tests to GREEN or `.todo()`
2. Remove theater demos to `_archived/`
3. Ensure production demo passes all E2E tests

### EVOLVE (E) Phase — Final

1. Emit completion signal to blackboard
2. Commit clean state
3. Flip to Gen88 Hunt cycle

---

## 📋 ARCHITECTURE SUMMARY

```
┌───────────────────────────────────────────────────────────────────┐
│                    W3C Gesture Control Plane                       │
│                       Gen87.X3 Architecture                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│  │ MediaPipe   │───▶│ 1€ Filter   │───▶│   XState    │            │
│  │ SensorPort  │    │SmootherPort │    │   FSMPort   │            │
│  │ (Port 0)    │    │ (Port 2)    │    │  (Port 3)   │            │
│  └─────────────┘    └─────────────┘    └─────────────┘            │
│        ↓                  ↓                  ↓                     │
│    SensorFrame       SmoothedFrame       FSMAction                 │
│                                              │                     │
│                                              ▼                     │
│                          ┌─────────────────────────────────┐      │
│                          │     PointerEventAdapter          │      │
│                          │       EmitterPort (Port 5)       │      │
│                          └─────────────────────────────────┘      │
│                                              │                     │
│                                              ▼                     │
│                          ┌─────────────────────────────────┐      │
│                          │       DOM / Target Adapter       │      │
│                          │        AdapterPort               │      │
│                          └─────────────────────────────────┘      │
│                                              │                     │
│                                              ▼                     │
│                               🖱️ Synthetic Pointer Events          │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📡 BLACKBOARD SIGNAL

```json
{
  "ts": "2025-12-31T17:45:00Z",
  "mark": 1.0,
  "pull": "downstream",
  "msg": "HUNT: Real Demo Spec Complete - 663/900 tests green, 5 Gold adapters identified, production demo at sandbox/demos/production/",
  "type": "signal",
  "hive": "H",
  "gen": 87,
  "port": 7
}
```

---

*Spider Sovereign | Port 7 | DECIDE | Gen87.X3*
*"The spider weaves the web that weaves the spider."*
