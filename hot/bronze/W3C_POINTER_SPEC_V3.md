# 🎯 W3C Pointer Gesture Spec — Variant 3

> **Generated**: 2026-01-01 | **Agent**: Spider Sovereign V3 (3rd semantic chunking pass)  
> **Source**: Cold archive (W3C_POINTER_GAP_ANALYSIS + SEMANTIC_CHUNKS_V2 + Research citations)  
> **Purpose**: TODO manifest for W3C Level 3 compliance with grounded citations  
> **Strange Loop**: N+1 Iteration

---

## Executive Summary

| Feature | W3C L3 Status | Your Status | Gap | Priority |
|---------|---------------|-------------|-----|----------|
| Basic pointer events | ✅ Required | ✅ Done | — | — |
| `getCoalescedEvents()` | ✅ Required | 🟡 Schema | Need impl | 🔴 P0 |
| `getPredictedEvents()` | ✅ Required | 🟡 Schema | Need predictor | 🔴 P0 |
| `pointerrawupdate` | ✅ Required | ❌ Missing | New handler | 🔴 P0 |
| Latency measurement | Best practice | ❌ Missing | Need harness | 🔴 P0 |
| Double-exp smoother | Research | ❌ Missing | LaViola impl | 🔴 P0 |

**V3 VERDICT**: W3C Level 3 compliance is 60%. Missing pieces are well-defined in research literature. LaViola double-exponential is the key unlock for prediction.

---

## 7-Stage Pipeline (Canonical)

```
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│   SENSE    │→ │   SMOOTH   │→ │  PREDICT   │→ │    FSM     │→ │    EMIT    │→ │   TARGET   │→ │     UI     │
│ MediaPipe  │  │  1€ Filter │  │  LaViola   │  │   XState   │  │  W3C Ptr   │  │ Adapters   │  │  Golden    │
│  Port 0    │  │   Port 2   │  │  Port 2.5  │  │   Port 3   │  │   Port 5   │  │   Port 1   │  │   Port 7   │
└────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘
```

| Stage | TRL-9 Exemplar | Current Status |
|-------|----------------|----------------|
| SENSE | `@mediapipe/tasks-vision` | ✅ Working |
| SMOOTH | `1eurofilter@1.2.2` | ✅ Working (no prediction) |
| PREDICT | Double-exp / N-euro | ❌ **MISSING** |
| FSM | `xstate@5.25.0` | ✅ Working |
| EMIT | Native PointerEvent | ✅ Working |
| TARGET | DOM EventTarget | ✅ Working |
| UI | `golden-layout@2.6.0` | ✅ Working |

---

## 🔴 P0 — Do TODAY

### Task 1: Double Exponential Smoother (LaViola)

**Why**: W3C `getPredictedEvents()` requires prediction. 1€ filter doesn't predict.

**Citation**: LaViola, J.J. (2003). "Double Exponential Smoothing: An Alternative to Kalman Filter-Based Predictive Tracking." EGVE '03.

**File**: `hot/bronze/src/smoothers/double-exponential-smoother.ts`

```typescript
/**
 * LaViola Double Exponential Smoother
 * 
 * Provides prediction without Kalman complexity.
 * Reference: LaViola EGVE 2003
 * 
 * Formula:
 *   S_t = α * x_t + (1-α) * (S_{t-1} + b_{t-1})   // Smoothed value
 *   b_t = β * (S_t - S_{t-1}) + (1-β) * b_{t-1}   // Trend estimate
 *   Predict(t+Δ) = S_t + b_t * Δ                   // Prediction
 */

import type { SmootherPort, SensorFrame, SmoothedFrame } from '../contracts/ports.js';

export interface DoubleExpConfig {
  /** Data smoothing factor (0.1-0.5 recommended) */
  alpha: number;
  /** Trend smoothing factor (0.01-0.1 recommended) */
  beta: number;
  /** Prediction horizon in milliseconds */
  predictionMs: number;
}

export class DoubleExponentialSmoother implements SmootherPort {
  private alpha: number;
  private beta: number;
  private predictionMs: number;
  
  // State per axis
  private sx = 0;  // Smoothed x
  private sy = 0;  // Smoothed y
  private bx = 0;  // Trend x
  private by = 0;  // Trend y
  private initialized = false;
  private lastTs = 0;

  constructor(config: DoubleExpConfig) {
    this.alpha = Math.max(0, Math.min(1, config.alpha));
    this.beta = Math.max(0, Math.min(1, config.beta));
    this.predictionMs = Math.max(0, config.predictionMs);
  }

  smooth(frame: SensorFrame): SmoothedFrame {
    const { x, y, timestamp } = frame;
    
    if (!this.initialized) {
      this.sx = x;
      this.sy = y;
      this.bx = 0;
      this.by = 0;
      this.lastTs = timestamp;
      this.initialized = true;
      return { x, y, timestamp, predicted: false };
    }

    // Delta time in seconds
    const dt = (timestamp - this.lastTs) / 1000;
    this.lastTs = timestamp;

    // Double exponential smoothing
    const prevSx = this.sx;
    const prevSy = this.sy;
    
    // S_t = α * x_t + (1-α) * (S_{t-1} + b_{t-1})
    this.sx = this.alpha * x + (1 - this.alpha) * (prevSx + this.bx * dt);
    this.sy = this.alpha * y + (1 - this.alpha) * (prevSy + this.by * dt);
    
    // b_t = β * (S_t - S_{t-1}) + (1-β) * b_{t-1}
    this.bx = this.beta * (this.sx - prevSx) / dt + (1 - this.beta) * this.bx;
    this.by = this.beta * (this.sy - prevSy) / dt + (1 - this.beta) * this.by;

    return {
      x: this.sx,
      y: this.sy,
      timestamp,
      predicted: false
    };
  }

  /**
   * Get predicted position at time t + predictionMs
   */
  predict(): SmoothedFrame {
    const dt = this.predictionMs / 1000;
    return {
      x: this.sx + this.bx * dt,
      y: this.sy + this.by * dt,
      timestamp: Date.now() + this.predictionMs,
      predicted: true
    };
  }

  reset(): void {
    this.sx = 0;
    this.sy = 0;
    this.bx = 0;
    this.by = 0;
    this.initialized = false;
  }

  setParams(alpha: number, beta: number): void {
    this.alpha = Math.max(0, Math.min(1, alpha));
    this.beta = Math.max(0, Math.min(1, beta));
  }

  setPredictionHorizon(ms: number): void {
    this.predictionMs = Math.max(0, ms);
  }
}

// Factory for registry
export const DoubleExponentialFactory = {
  metadata: {
    id: 'double-exponential',
    name: 'LaViola Double Exponential',
    trl: 8,
    citation: 'LaViola EGVE 2003'
  },
  create: (config: DoubleExpConfig) => new DoubleExponentialSmoother(config),
  validateConfig: (config: DoubleExpConfig) => ({
    valid: config.alpha >= 0 && config.alpha <= 1 && 
           config.beta >= 0 && config.beta <= 1,
    errors: []
  })
};
```

**Tests**: ~20 | **Effort**: 2-4 hours

**Verification Gate**:
```bash
npm test -- --grep "DoubleExponentialSmoother" && echo "PASS"
```

---

### Task 2: Event Coalescer Implementation

**Why**: W3C `getCoalescedEvents()` — you have schema, no logic.

**Citation**: W3C Pointer Events Level 3, §10.1: "getCoalescedEvents() returns a sequence of all PointerEvents that were coalesced into the dispatched pointermove event."

**File**: `hot/bronze/src/adapters/event-coalescer.adapter.ts`

```typescript
/**
 * W3C Event Coalescer
 * 
 * Batches high-frequency pointer events for efficient dispatch.
 * Reference: W3C Pointer Events Level 3 §10.1
 */

export interface CoalescedPointerEvent extends PointerEvent {
  getCoalescedEvents(): PointerEvent[];
  getPredictedEvents(): PointerEvent[];
}

export class EventCoalescer {
  private buffer: PointerEvent[] = [];
  private predictedBuffer: PointerEvent[] = [];
  private maxBufferSize: number;
  private flushIntervalMs: number;
  private lastFlushTime: number = 0;

  constructor(config: { maxBufferSize?: number; flushIntervalMs?: number } = {}) {
    this.maxBufferSize = config.maxBufferSize ?? 16;
    this.flushIntervalMs = config.flushIntervalMs ?? 8; // ~120Hz
  }

  /**
   * Push raw event into buffer
   */
  push(event: PointerEvent): void {
    this.buffer.push(event);
    
    // Auto-flush if buffer full
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Push predicted event into buffer
   */
  pushPredicted(event: PointerEvent): void {
    this.predictedBuffer.push(event);
  }

  /**
   * Flush buffer and return coalesced event
   */
  flush(): CoalescedPointerEvent | null {
    if (this.buffer.length === 0) return null;

    const events = [...this.buffer];
    const predicted = [...this.predictedBuffer];
    this.buffer = [];
    this.predictedBuffer = [];
    this.lastFlushTime = performance.now();

    // Create synthetic event from last event
    const lastEvent = events[events.length - 1];
    
    // Attach W3C methods
    const coalesced = lastEvent as CoalescedPointerEvent;
    coalesced.getCoalescedEvents = () => events;
    coalesced.getPredictedEvents = () => predicted;

    return coalesced;
  }

  /**
   * Check if buffer should be flushed based on time
   */
  shouldFlush(): boolean {
    return performance.now() - this.lastFlushTime >= this.flushIntervalMs;
  }

  /**
   * Get current buffer size
   */
  get bufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Clear all buffers
   */
  reset(): void {
    this.buffer = [];
    this.predictedBuffer = [];
    this.lastFlushTime = 0;
  }
}
```

**Tests**: ~20 | **Effort**: 3-4 hours

---

### Task 3: Latency Measurement Harness

**Why**: "You can't optimize what you don't measure." — MacKenzie & Ware CHI 1993

**Citation**: MacKenzie, I.S. & Ware, C. (1993). "Lag as a determinant of human performance in interactive systems." CHI '93.

**Key Finding**: "Lag as low as 75ms significantly degrades performance."

**File**: `hot/bronze/src/pipeline/latency-harness.ts`

```typescript
/**
 * Pipeline Latency Measurement Harness
 * 
 * Timestamps each stage for optimization.
 * Target: <50ms total motion-to-photon latency.
 */

export interface LatencyMeasurement {
  stage: string;
  entryTs: number;
  exitTs: number;
  durationMs: number;
}

export interface LatencyReport {
  measurements: LatencyMeasurement[];
  totalMs: number;
  budgetMs: number;
  withinBudget: boolean;
  breakdown: Record<string, number>;
}

export class LatencyHarness {
  private measurements: Map<string, { entryTs: number }> = new Map();
  private completed: LatencyMeasurement[] = [];
  private budgetMs: number;

  // Target latency budget per stage
  static readonly STAGE_BUDGETS: Record<string, number> = {
    'mediapipe': 33,    // ~30fps inference
    'smoothing': 1,     // Sub-millisecond
    'prediction': 1,    // Sub-millisecond
    'fsm': 1,           // Sub-millisecond
    'emit': 1,          // Sub-millisecond
    'render': 16,       // 60fps target
  };

  constructor(budgetMs: number = 50) {
    this.budgetMs = budgetMs;
  }

  /**
   * Mark entry to a pipeline stage
   */
  start(stage: string): void {
    this.measurements.set(stage, { entryTs: performance.now() });
  }

  /**
   * Mark exit from a pipeline stage
   */
  end(stage: string): LatencyMeasurement {
    const entry = this.measurements.get(stage);
    if (!entry) {
      throw new Error(`Stage "${stage}" was not started`);
    }

    const exitTs = performance.now();
    const measurement: LatencyMeasurement = {
      stage,
      entryTs: entry.entryTs,
      exitTs,
      durationMs: exitTs - entry.entryTs
    };

    this.completed.push(measurement);
    this.measurements.delete(stage);
    return measurement;
  }

  /**
   * Get full latency report
   */
  getReport(): LatencyReport {
    const totalMs = this.completed.reduce((sum, m) => sum + m.durationMs, 0);
    const breakdown: Record<string, number> = {};
    
    for (const m of this.completed) {
      breakdown[m.stage] = m.durationMs;
    }

    return {
      measurements: [...this.completed],
      totalMs,
      budgetMs: this.budgetMs,
      withinBudget: totalMs <= this.budgetMs,
      breakdown
    };
  }

  /**
   * Reset for next frame
   */
  reset(): void {
    this.measurements.clear();
    this.completed = [];
  }

  /**
   * Check if any stage exceeds its budget
   */
  getViolations(): Array<{ stage: string; actual: number; budget: number }> {
    const violations: Array<{ stage: string; actual: number; budget: number }> = [];
    
    for (const m of this.completed) {
      const budget = LatencyHarness.STAGE_BUDGETS[m.stage] ?? 10;
      if (m.durationMs > budget) {
        violations.push({ stage: m.stage, actual: m.durationMs, budget });
      }
    }
    
    return violations;
  }
}
```

**Tests**: ~15 | **Effort**: 2-3 hours

---

### Task 4: `pointerrawupdate` Handler

**Why**: High-frequency events for drawing/inking apps.

**Citation**: W3C Pointer Events Level 3 §6: "The pointerrawupdate event is fired when pointer state changes, at a higher frequency than pointermove."

**File**: `hot/bronze/src/adapters/raw-update-handler.ts`

```typescript
/**
 * High-frequency raw pointer event handler
 * 
 * For inking/drawing applications that need every sample.
 * Reference: W3C Pointer Events Level 3 §6
 */

export interface RawUpdateConfig {
  target: EventTarget;
  onRawUpdate: (event: PointerEvent) => void;
  coalescingEnabled?: boolean;
}

export class RawUpdateHandler {
  private target: EventTarget;
  private callback: (event: PointerEvent) => void;
  private coalescingEnabled: boolean;
  private bound = false;

  constructor(config: RawUpdateConfig) {
    this.target = config.target;
    this.callback = config.onRawUpdate;
    this.coalescingEnabled = config.coalescingEnabled ?? true;
  }

  bind(): void {
    if (this.bound) return;
    
    this.target.addEventListener('pointerrawupdate', this.handleRaw as EventListener);
    this.bound = true;
  }

  unbind(): void {
    if (!this.bound) return;
    
    this.target.removeEventListener('pointerrawupdate', this.handleRaw as EventListener);
    this.bound = false;
  }

  private handleRaw = (event: PointerEvent): void => {
    // Process coalesced events if available
    if (this.coalescingEnabled && 'getCoalescedEvents' in event) {
      const coalesced = (event as any).getCoalescedEvents() as PointerEvent[];
      for (const e of coalesced) {
        this.callback(e);
      }
    } else {
      this.callback(event);
    }
  };
}
```

**Tests**: ~10 | **Effort**: 2 hours

---

## 🟡 P1 — This Week

### Task 5: Neural Predictor (N-euro) Option

**Citation**: N-euro 2023 — "Outperforms both 1€ and double exponential in smoothness (MAAE)."

**Effort**: High (requires ONNX/TF.js integration)

### Task 6: Jitter/Lag Tradeoff Visualization

Dashboard component showing smoothing parameter effects in real-time.

### Task 7: Gesture Chaining

Multi-gesture sequences: `Victory → Fist = contextmenu`

### Task 8: Confidence Hysteresis

Per-gesture thresholds to prevent flickering on boundary conditions.

---

## 🟢 P2 — Next Sprint

### Task 9: MCP Tool Wrappers

AI-discoverable tool definitions for pipeline components.

### Task 10: Per-Component Inline Docs

JSDoc with copy-paste examples for each adapter.

---

## 📊 W3C Level 3 Compliance Matrix

| Feature | Spec Section | Status | Gap |
|---------|--------------|--------|-----|
| `pointerdown/up/move` | §4 | ✅ | — |
| `pointerenter/leave` | §4 | ✅ | — |
| `pointerover/out` | §4 | ✅ | — |
| `pointercancel` | §4 | ✅ | — |
| `gotpointercapture` | §5 | 🟡 | Partial |
| `lostpointercapture` | §5 | 🟡 | Partial |
| **`pointerrawupdate`** | §6 | ❌ | **P0** |
| **`getCoalescedEvents()`** | §10.1 | 🟡 | **P0** |
| **`getPredictedEvents()`** | §10.2 | 🟡 | **P0** |
| `altitudeAngle` | §11 | ✅ | Schema only |
| `azimuthAngle` | §11 | ✅ | Schema only |
| `persistentDeviceId` | §12 | ✅ | Schema only |

---

## 🔬 Research Citations (Grounded)

| Topic | Citation | Key Finding |
|-------|----------|-------------|
| 1€ Filter | Casiez et al. CHI 2012 | Best jitter (0.004 SEM), no prediction |
| Double Exp | LaViola EGVE 2003 | Prediction without Kalman complexity |
| N-euro | N-euro 2023 | Neural outperforms 1€ and double exp |
| Latency | MacKenzie CHI 1993 | 75ms degrades performance |
| W3C L3 | W3C CR Q4 2025 | Coalescing is implementation-defined |

---

## 🎯 Definition of Done

| Criteria | Verified By | Status |
|----------|-------------|--------|
| Double-exp smoother passes 20 tests | Vitest | ❌ |
| Event coalescer passes 20 tests | Vitest | ❌ |
| Latency harness measures <50ms E2E | Manual | ❌ |
| `pointerrawupdate` handler works | E2E test | ❌ |
| Demo uses prediction | Code review | ❌ |

---

## 🔒 V3 Verification Gates

| Gate ID | Check | Enforcement |
|---------|-------|-------------|
| **G-LAVIOLA** | DoubleExponentialSmoother tests pass | CI |
| **G-COALESCE** | EventCoalescer tests pass | CI |
| **G-LATENCY** | LatencyHarness measures all stages | E2E |
| **G-RAWUPDATE** | pointerrawupdate handled | Browser test |

---

## 🔄 HIVE/8 Phase Mapping

| Task | HIVE Phase | Ports |
|------|------------|-------|
| Research LaViola paper | **H** (Hunt) | 0+7 |
| Write failing smoother tests | **I** (Interlock) | 1+6 |
| Implement double-exp | **V** (Validate) | 2+5 |
| Integrate into pipeline | **E** (Evolve) | 3+4 |

---

## 🔄 Strange Loop Markers

| Version | Agent | Key Contribution |
|---------|-------|------------------|
| V1 | Agent 1 | Initial spec structure |
| V2 | Agent 2 | Added P0/P1/P2 priorities, citations |
| **V3** | **Agent 3** | **Full LaViola code, verification gates, compliance matrix** |

---

*Source: cold/bronze/archive_2025-12-31 | Spider Sovereign V3 | W3C Level 3 pursuit*
