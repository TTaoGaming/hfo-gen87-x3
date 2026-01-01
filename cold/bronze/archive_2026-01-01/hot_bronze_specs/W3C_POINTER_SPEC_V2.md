# 🎯 W3C Pointer Gesture Spec — Variant 2

> **Generated**: 2026-01-01 | **Agent**: Spider Sovereign V2  
> **Source**: Cold archive (W3C_POINTER_GESTURE_CONTROL_PLANE_SILVER + W3C_POINTER_GAP_ANALYSIS)  
> **Purpose**: TODO manifest for W3C pointer compliance

---

## Executive Summary

7-stage pipeline is **architecturally sound**. W3C Level 3 compliance is **60%**.

| Feature | W3C Spec | Your Status | Gap |
|---------|----------|-------------|-----|
| Basic pointer events | ✅ Required | ✅ Working | — |
| `getCoalescedEvents()` | ✅ Required | 🟡 Schema only | Need impl |
| `getPredictedEvents()` | ✅ Required | 🟡 Schema only | Need impl |
| `pointerrawupdate` | ✅ Required | ❌ Missing | P0 |
| Altitude/Azimuth angles | ✅ Required | ✅ Schema exists | Need conversion |

---

## 7-Stage Pipeline Architecture

```
┌───────┐   ┌───────┐   ┌────────┐   ┌─────┐   ┌──────┐   ┌────────┐   ┌─────┐
│ SENSE │ → │ SMOOTH │ → │ PREDICT │ → │ FSM │ → │ EMIT │ → │ TARGET │ → │ UI  │
└───────┘   └───────┘   └────────┘   └─────┘   └──────┘   └────────┘   └─────┘
MediaPipe    1€ Filter   Physics     XState    W3C Evts   Adapters    Golden
 Port 0      Port 2      Port 2.5    Port 3    Port 5     Port 1      Layout
```

| Stage | TRL-9 Exemplar | Status |
|-------|----------------|--------|
| 1. SENSE | @mediapipe/tasks-vision | ✅ |
| 2. SMOOTH | 1eurofilter | ✅ |
| 3. PREDICT | kalman-filter / rapier | 🟡 Schema only |
| 4. FSM | xstate 5.25.0 | ✅ |
| 5. EMIT | Native PointerEvent | ✅ |
| 6. TARGET | DOM EventTarget | ✅ |
| 7. UI | golden-layout 2.6.0 | ✅ |

---

## 🔴 P0 — Do TODAY

### Task 1: Double Exponential Smoother (LaViola)

**Why**: W3C `getPredictedEvents()` requires prediction. 1€ filter doesn't predict.

**File**: `hot/bronze/src/smoothers/double-exponential-smoother.ts`

```typescript
interface DoubleExpConfig {
  alpha: number;      // Data smoothing (0.1-0.5)
  beta: number;       // Trend smoothing (0.01-0.1)
  predictionMs: number;
}

// Formula:
// S_t = α * x_t + (1-α) * (S_{t-1} + b_{t-1})
// b_t = β * (S_t - S_{t-1}) + (1-β) * b_{t-1}
// Predict = S_t + b_t * (predictionMs / 1000)
```

**Citation**: LaViola EGVE 2003  
**Effort**: 2-4 hours | **Tests**: ~15

---

### Task 2: Event Coalescing Implementation

**Why**: W3C `getCoalescedEvents()` — you have schema, no logic.

**File**: `hot/bronze/src/adapters/event-coalescer.adapter.ts`

```typescript
interface EventCoalescer {
  push(event: PointerEvent): void;
  flush(): PointerEvent[];
  getCoalescedEvents(): PointerEvent[];  // W3C compliance
}
```

**Reference**: W3C Pointer Events Level 3 §10.1  
**Effort**: 3-4 hours | **Tests**: ~20

---

### Task 3: Latency Measurement Harness

**Why**: Can't optimize what you don't measure.

**File**: `hot/bronze/src/pipeline/latency-harness.ts`

```typescript
interface LatencyMeasurement {
  stage: string;
  entryTs: number;
  exitTs: number;
  durationMs: number;
}

interface LatencyHarness {
  start(stage: string): void;
  end(stage: string): LatencyMeasurement;
  getReport(): LatencyReport;
}
```

**Target Latency Budget**:
| Stage | Target |
|-------|--------|
| MediaPipe | <33ms |
| Smoothing | <1ms |
| FSM | <1ms |
| Rendering | <16ms |
| **Total** | **<50ms** |

**Effort**: 2-3 hours | **Tests**: ~10

---

### Task 4: `pointerrawupdate` Handler

**Why**: High-frequency events for drawing apps.

**File**: `hot/bronze/src/adapters/raw-update-handler.ts`

**Effort**: 2 hours | **Tests**: ~8

---

## 🟡 P1 — This Week

### Task 5: Neural Predictor (N-euro) Option

Advanced prediction using neural network.  
**Citation**: N-euro 2023  
**Effort**: High

### Task 6: Jitter/Lag Tradeoff Visualization

Dashboard showing smoothing parameter effects.

### Task 7: Gesture Chaining

Multi-gesture sequences: Victory → Fist = contextmenu

### Task 8: Confidence Hysteresis

Per-gesture thresholds to prevent flickering.

---

## 🟢 P2 — Next Sprint

### Task 9: MCP Tool Wrappers

AI-friendly tool discovery for pipeline components.

### Task 10: Per-Component Inline Docs

JSDoc examples for each adapter.

---

## 🔬 Research Citations

| Topic | Source | Key Finding |
|-------|--------|-------------|
| 1€ Filter | Casiez CHI 2012 | Best jitter (0.004 SEM), no prediction |
| Double Exp | LaViola EGVE 2003 | Prediction without Kalman complexity |
| N-euro | N-euro 2023 | Neural outperforms 1€ and double exp |
| Lag Impact | MacKenzie CHI 1993 | 75ms degrades performance |
| W3C L3 | W3C CR Q4 2025 | Implementation-defined coalescing |

---

## 📊 W3C Level 3 Compliance Checklist

| Feature | Spec Section | Status |
|---------|--------------|--------|
| `pointerdown/up/move` | §4 | ✅ |
| `pointerenter/leave` | §4 | ✅ |
| `pointerover/out` | §4 | ✅ |
| `pointercancel` | §4 | ✅ |
| `gotpointercapture` | §5 | 🟡 |
| `lostpointercapture` | §5 | 🟡 |
| `pointerrawupdate` | §6 | ❌ |
| `getCoalescedEvents()` | §10.1 | 🟡 Schema |
| `getPredictedEvents()` | §10.2 | 🟡 Schema |
| `altitudeAngle` | §11 | ✅ Schema |
| `azimuthAngle` | §11 | ✅ Schema |

---

## 🎯 Definition of Done

| Criteria | Verified By |
|----------|-------------|
| Double exponential smoother impl | Unit test + property test |
| Event coalescer impl | Unit test |
| Latency harness measures all stages | E2E test |
| `pointerrawupdate` fires | Integration test |
| Total latency < 50ms | Benchmark |

---

*Source: cold/bronze/archive_2025-12-31 | Spider Sovereign V2*
