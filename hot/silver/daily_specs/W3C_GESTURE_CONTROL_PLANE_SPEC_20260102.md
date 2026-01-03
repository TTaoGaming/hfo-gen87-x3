# W3C Gesture Control Plane — Daily Spec

> **Date**: 2026-01-02T14:00:00Z  
> **Status**: 🥈 SILVER (Active Development)  
> **Gen**: 87.X3  
> **Mission**: Total Tool Virtualization via W3C Pointer Level 3  
> **SSOT**: This document is the source of truth for today's work

---

## 1. Executive Summary

This specification defines the **primitives, adapters, and enforcement gates** required to build a production-quality gesture control plane that transforms hand tracking into W3C Pointer Events Level 3.

### The Goal

> **Daily driver gesture input** — replace mouse/touch for Total Tool Virtualization.

### Current State (2026-01-02)

| Metric | Value | Target |
|--------|-------|--------|
| Primitives Extracted | 6/9 | 9 |
| Tests Passing | 64 | 100+ |
| Mutation Coverage | 69-95% | ≥80% all |
| Held-Out Tests | 0 | 20+ |

---

## 2. 7-Stage Pipeline Architecture

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  1. SENSE   │ → │  2. SMOOTH  │ → │  3. PREDICT │ → │   4. FSM    │ → │  5. EMIT    │ → │  6. TARGET  │ → │   7. UI     │
│  MediaPipe  │   │  1€ Filter  │   │ DESP/Rapier │   │   XState    │   │ W3C Pointer │   │  Dispatch   │   │ GoldenLayout│
│  Port 0     │   │  Port 2     │   │  Port 2.5   │   │   Port 3    │   │  Port 5     │   │  Port 1     │   │  Port 1.5   │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
      ❌               ⚠️               ⚠️                ⚠️               ⚠️               ❌               ✅
   MISSING          SPARSE           69%             SPARSE          SPARSE          MISSING         95%
```

---

## 3. Primitive Inventory

### ✅ Extracted to `cold/silver/primitives/`

| Primitive | File | Tests | Mutation | Priority |
|-----------|------|-------|----------|----------|
| 1€ Filter | `one-euro.ts` | 4 | — | **P0** strengthen |
| DESP Predictor | `double-exponential.ts` | 27 | 69.37% | **P0** push to 80% |
| Rapier Physics | `rapier-physics.ts` | 6 | — | OK |
| Gesture FSM | `gesture-fsm.ts` | 4 | — | **P0** strengthen |
| Pointer Generator | `pointer-event-generator.ts` | 3 | — | **P1** strengthen |
| Layout Tree | `layout-tree.ts` | 20 | 95.29% | ✅ EXCELLENT |

### ❌ Missing Primitives

| Primitive | Purpose | Priority | Effort |
|-----------|---------|----------|--------|
| `signal-gates.ts` | G0-G7 HIVE validation | **P1** | 2hr |
| `palm-orientation.ts` | Arming/disarming logic | **P2** | 2hr |
| `target-dispatch.ts` | DOM event injection | **P3** | 1hr |

---

## 4. Held-Out Defense Protocol

### What is Held-Out Defense?

**Held-Out Defense** is an anti-reward-hacking technique borrowed from ML model evaluation. The core principle:

> **Never let the optimizer see the validation set.**

In AI-assisted development, the "optimizer" is the AI agent trying to make tests pass. If AI can see all tests, it can:
- Write code that passes tests without solving the real problem
- Game mutation scores by targeting specific mutant patterns
- Create "cosmetic compliance" — looks right, doesn't work

### The Solution: Hidden Test Suite

```
tests/
├── visible/                    # AI can see these
│   └── primitives/
│       ├── one-euro.test.ts
│       ├── gesture-fsm.test.ts
│       └── ...
│
└── held-out/                   # AI NEVER sees these
    ├── .gitignore              # Not in repo (loaded at CI)
    ├── one-euro.held-out.ts    # Secret validation
    ├── gesture-fsm.held-out.ts # Secret edge cases
    └── integration.held-out.ts # E2E secrets
```

### How It Works

1. **Development**: AI writes code to pass visible tests
2. **CI Pipeline**: Held-Out tests run AFTER AI commits

---

## 5. Real Architecture: The Working Backwards Plan

To realize the vision of **Total Tool Virtualization**, we work backwards from the **W3C Pointer Event** (the output) to the **MediaPipe Hand Landmark** (the input).

### 5.1 The 7-Stage "Real" Pipeline

| Stage | Port | Commander | Contract (SOP) | Implementation |
|-------|------|-----------|----------------|----------------|
| **1. SENSE** | 0 | Lidless Legion | `SensorFrameSchema` | `mediapipe-adapter.ts` |
| **2. SMOOTH** | 2 | Mirror Magus | `SmoothedFrameSchema` | `one-euro.ts` |
| **3. PREDICT** | 2.5 | Mirror Magus | `PredictedFrameSchema` | `double-exponential.ts` |
| **4. FSM** | 3 | Spore Storm | `FSMActionSchema` | `gesture-fsm.ts` |
| **5. EMIT** | 5 | Pyre Praetorian | `PointerEventOutSchema` | `pointer-event-generator.ts` |
| **6. TARGET** | 1 | Web Weaver | `TargetEnvelope` | `target-dispatch.ts` |
| **7. UI** | 1.5 | Web Weaver | `UIEnvelope` | `layout-tree.ts` |

### 5.2 The "Vacuole" Composer

The `W3CGestureComposer` (currently in `quarantine`) is the "vacuole membrane" that wires these stages. It uses:
- **Polymorphic Adapters**: Every stage is an interface, allowing hot-swapping (e.g., swapping 1€ for Kalman).
- **CloudEvents Envelopes**: Every event is wrapped with metadata (traceId, timestamp, gen) for G0-G7 gate validation.
- **Registry Discovery**: Adapters register themselves at runtime, enabling a "Mosaic" composition.

### 5.3 Working Backwards: The Implementation Path

1.  **[DONE] Hardened Primitives**: 1€ Filter, Gesture FSM, and Pointer Generator are extracted and tested.
2.  **[TODO] SOP Contracts**: Finalize Zod schemas in `schemas.ts` to ensure strict boundary enforcement.
3.  **[TODO] Bootstrap Registries**: Create `bootstrapRegistries.ts` to wire the "Real" adapters into the composer.
4.  **[TODO] Held-Out Integration**: Setup the `held-out/` test suite to validate the full pipeline without AI "theater".

---

## 6. Total Tool Virtualization (TTV) Requirements

TTV is not just "gestures"; it is the virtualization of the **entire toolchain**.

### 6.1 The Three Pillars of TTV

1.  **Tool-as-a-Service (TaaS)**: Every tool (VS Code, Browser, Terminal) is an adapter in the HFO mesh.
2.  **Mosaic Composition**: Tools are composed as "tiles" in a JADC2-style mosaic, not hard-coded layouts.
3.  **Byzantine Validation**: Every tool interaction is validated by a quorum of gates (Pyre Praetorian) to prevent "hallucinated" or "malicious" actions.

### 6.2 JADC2 Mosaic Pattern Mapping

| Mosaic Layer | HFO Port | Responsibility |
|--------------|----------|----------------|
| **Sensors** | 0 | MediaPipe, Eye Tracking, Voice |
| **Processing** | 2, 6 | Smoothing, Prediction, Memory |
| **Command** | 7 | Strategic Intent (Spider Sovereign) |
| **Effectors** | 3, 5 | W3C Pointer, NATS Emitters |
| **Defense** | 4, 5 | Mutation Testing, Gate Enforcement |

---

## 7. Daily Tasks (2026-01-02)

- [x] **Task 1**: Move `w3c-gesture-composer.ts` from `quarantine` to `src/pipeline/`.
- [ ] **Task 2**: Implement `signal-gates.ts` for G0-G7 validation.
- [ ] **Task 3**: Create first 5 Held-Out tests for `one-euro.ts`.
- [ ] **Task 4**: Update `AGENTS.md` with the "Real Architecture" protocol.
3. **Failure**: If held-out tests fail, AI's work is REJECTED
4. **Learning**: AI never learns what the held-out tests check

### Implementation Rules

| Rule | Enforcement |
|------|-------------|
| Held-out tests NEVER in git | `.gitignore` + CI secrets |
| Held-out tests run in CI only | GitHub Actions secret step |
| AI cannot read held-out directory | File permission / path block |
| Held-out covers edge cases AI might skip | Human-designed validation |
| Held-out tests are 20%+ of total | Minimum threshold |

### Example Held-Out Tests

```typescript
// held-out/one-euro.held-out.ts (AI NEVER SEES THIS)
describe('OneEuro Held-Out Validation', () => {
  // Edge case: Exactly zero velocity
  it('handles zero velocity without division by zero', () => {
    const filter = new OneEuroPrimitive();
    const result = filter.filter(0.5, 0.5, 1000);
    const result2 = filter.filter(0.5, 0.5, 1016); // Same position
    expect(result2.velocity.x).toBe(0);
    expect(Number.isFinite(result2.position.x)).toBe(true);
  });
  
  // Edge case: Timestamp regression
  it('handles timestamp going backwards gracefully', () => {
    const filter = new OneEuroPrimitive();
    filter.filter(0.5, 0.5, 1000);
    filter.filter(0.6, 0.6, 1016);
    // Timestamp goes backwards (clock skew)
    const result = filter.filter(0.7, 0.7, 1010);
    expect(Number.isFinite(result.position.x)).toBe(true);
  });
  
  // Property: Output bounds preserved
  it('never outputs coordinates outside [0,1] for valid input', () => {
    const filter = new OneEuroPrimitive();
    for (let i = 0; i < 1000; i++) {
      const x = Math.random();
      const y = Math.random();
      const result = filter.filter(x, y, i * 16);
      expect(result.position.x).toBeGreaterThanOrEqual(0);
      expect(result.position.x).toBeLessThanOrEqual(1);
    }
  });
});
```

### Why This Matters for TTV

Without held-out defense:
- AI optimizes for visible metrics
- Code "works" in tests, fails in production
- Gesture control feels broken despite "100% coverage"

With held-out defense:
- AI must write genuinely correct code
- Edge cases caught before production
- Daily driver quality achieved

---

## 5. Today's Priority Actions

### P0: Strengthen Core Primitives (4 hours)

> ⚠️ **CRITICAL INFRASTRUCTURE ALERT**: Do NOT run 300+ tests in serial. Current estimates show a 2-hour execution time for full mutation/unit sweeps. We MUST optimize concurrency (Stryker `concurrency` parameter) and use shard/parallel modes in Vitest.

| Task | Target | Owner |
|------|--------|-------|
| Add 10+ tests to `gesture-fsm.ts` | Cover all state transitions | Mirror Magus |
| Add 10+ tests to `one-euro.ts` | Cover edge cases, properties | Mirror Magus |
| Push `double-exponential.ts` mutation 69%→80% | Kill surviving mutants | Red Regnant |
| Add 5+ tests to `pointer-event-generator.ts` | Cover all action types | Mirror Magus |

### P1: Extract Signal Gates (2 hours)

| Task | Location | Interface |
|------|----------|-----------|
| Extract G0-G7 validation logic | `cold/silver/primitives/signal-gates.ts` | `validateSignal(signal): ValidationResult` |
| Add property tests | 100+ iterations | fast-check |
| Wire to Pyre Praetorian | `hot/bronze/src/adapters/pyre-daemon.ts` | Gate enforcement |

### P2: Create Held-Out Infrastructure (2 hours)

| Task | Location |
|------|----------|
| Create `tests/held-out/` directory structure | Project root |
| Add `.gitignore` for held-out | Exclude from git |
| Create CI workflow for held-out | `.github/workflows/held-out.yml` |
| Write 5 held-out tests per primitive | Secret validation |

---

## 6. Contract Schemas (Source of Truth)

### SensorFrame (Stage 1 Output)

```typescript
const SensorFrameSchema = z.object({
  ts: z.number().nonnegative(),
  handId: z.enum(['left', 'right', 'none']),
  trackingOk: z.boolean(),
  palmFacing: z.boolean(),
  label: z.enum(GestureLabels),
  confidence: z.number().min(0).max(1),
  indexTip: NormalizedLandmarkSchema.nullable(),
  landmarks: z.array(NormalizedLandmarkSchema).length(21).nullable(),
});
```

### SmoothedFrame (Stage 2 Output)

```typescript
const SmoothedFrameSchema = z.object({
  ts: z.number().nonnegative(),
  handId: z.enum(['left', 'right', 'none']),
  trackingOk: z.boolean(),
  palmFacing: z.boolean(),
  label: z.enum(GestureLabels),
  confidence: z.number().min(0).max(1),
  position: z.object({ x: z.number(), y: z.number() }).nullable(),
  velocity: z.object({ x: z.number(), y: z.number() }).nullable(),
  prediction: z.object({ x: z.number(), y: z.number() }).nullable(),
});
```

### FSMAction (Stage 4 Output)

```typescript
const FSMActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('none'), state: z.enum(FSMStates) }),
  z.object({ action: z.literal('move'), state: z.enum(FSMStates), x: z.number(), y: z.number(), velocity: z.object({...}).nullish() }),
  z.object({ action: z.literal('down'), state: z.enum(FSMStates), x: z.number(), y: z.number(), button: z.union([z.literal(0), z.literal(1)]) }),
  z.object({ action: z.literal('up'), state: z.enum(FSMStates), x: z.number(), y: z.number(), button: z.union([z.literal(0), z.literal(1)]) }),
  z.object({ action: z.literal('cancel'), state: z.enum(FSMStates) }),
  z.object({ action: z.literal('wheel'), state: z.enum(FSMStates), deltaY: z.number(), ctrl: z.boolean().optional() }),
]);
```

### PointerEventOut (Stage 5 Output)

```typescript
const PointerEventOutSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('pointermove'), pointerId: z.number(), clientX: z.number(), clientY: z.number(), pointerType: z.string(), pressure: z.number(), isPrimary: z.boolean() }),
  z.object({ type: z.literal('pointerdown'), pointerId: z.number(), clientX: z.number(), clientY: z.number(), pointerType: z.string(), button: z.number(), buttons: z.number(), pressure: z.number(), isPrimary: z.boolean() }),
  z.object({ type: z.literal('pointerup'), pointerId: z.number(), clientX: z.number(), clientY: z.number(), pointerType: z.string(), button: z.number(), buttons: z.number(), pressure: z.number(), isPrimary: z.boolean() }),
  z.object({ type: z.literal('pointercancel'), pointerId: z.number(), pointerType: z.string() }),
  z.object({ type: z.literal('wheel'), deltaY: z.number(), deltaMode: z.number(), ctrlKey: z.boolean() }),
]);
```

---

## 7. Gesture Language Specification

### Valid Gesture Sequence

```
┌─────────────┐    Palm Facing    ┌─────────────┐    Stable 200ms    ┌─────────────┐
│  DISARMED   │ ───────────────→ │   ARMING    │ ─────────────────→ │   ARMED     │
│  (Idle)     │    + Open_Palm   │ (Baseline)  │                    │  (Tracking) │
└─────────────┘                   └─────────────┘                    └─────────────┘
       ↑                                                                   │
       │                                                                   │ Pointing_Up
       │ Palm Away                                                         ↓
       │ (Roll wrist)                                               ┌─────────────┐
       │                                                            │ DOWN_COMMIT │
       └────────────────────────────────────────────────────────────│  (Pressed)  │
                           pointercancel                            └─────────────┘
```

### Gesture → W3C Pointer Mapping

| Gesture | FSM State | W3C Event | Button |
|---------|-----------|-----------|--------|
| Open_Palm (facing) | ARMING→ARMED | — | — |
| Pointing_Up | DOWN_COMMIT | pointerdown | 0 (left) |
| Open_Palm (return) | ARMED | pointerup | 0 |
| Palm Away (roll) | DISARMED | pointercancel | — |
| Victory | DOWN_NAV | pointerdown | 1 (middle) |
| Tracking Lost | — | pointercancel | — |

### Palm Orientation Rules

| Palm State | Camera View | Cursor Behavior |
|------------|-------------|-----------------|
| Facing Camera | Palm visible | Cursor active, gestures enabled |
| Facing Away | Back of hand | Cursor tracks, gestures DISABLED |
| Perpendicular | Side view | Cursor tracks, gestures DISABLED |

**Key Insight**: Palm orientation is a **clutch mechanism**. User can always escape by rolling wrist away.

---

## 8. Mutation Testing Targets

### Per-Primitive Mutation Score Goals

| Primitive | Current | Target | Gap |
|-----------|---------|--------|-----|
| `double-exponential.ts` | 69.37% | 80% | +11% |
| `one-euro.ts` | — | 80% | baseline |
| `gesture-fsm.ts` | — | 80% | baseline |
| `pointer-event-generator.ts` | — | 80% | baseline |
| `rapier-physics.ts` | — | 80% | baseline |
| `layout-tree.ts` | 95.29% | 90% | ✅ EXCEEDS |

### Surviving Mutant Patterns to Kill

From `double-exponential.ts` analysis:

| Mutant Type | Line | How to Kill |
|-------------|------|-------------|
| Conditional boundary | 147 | Test dt=0, dt<0, dt=exactly threshold |
| Arithmetic | 89 | Test alpha edge values (0.001, 0.999) |
| Boolean substitution | 112 | Test clamp enabled/disabled paths |

---

## 9. Test Coverage Matrix

### Visible Tests (AI Can See)

| Primitive | Unit | Property | Integration |
|-----------|------|----------|-------------|
| one-euro | 4 | 0 | 0 |
| double-exponential | 22 | 5 | 0 |
| gesture-fsm | 4 | 0 | 0 |
| pointer-event-generator | 3 | 0 | 0 |
| rapier-physics | 6 | 0 | 0 |
| layout-tree | 16 | 4 | 0 |

### Held-Out Tests (AI Cannot See) — TO CREATE

| Primitive | Edge Cases | Properties | Integration |
|-----------|------------|------------|-------------|
| one-euro | 5 | 3 | 2 |
| double-exponential | 5 | 3 | 2 |
| gesture-fsm | 5 | 3 | 2 |
| pointer-event-generator | 5 | 3 | 2 |
| rapier-physics | 5 | 3 | 2 |
| layout-tree | 5 | 3 | 2 |
| **TOTAL** | **30** | **18** | **12** |

---

## 10. Success Criteria

### End of Day (2026-01-02)

- [ ] All 6 primitives have ≥15 visible tests each
- [ ] `double-exponential.ts` mutation score ≥80%
- [ ] Held-out test infrastructure created
- [ ] Signal gates extracted to `cold/silver/primitives/`

### End of Week

- [ ] All primitives have ≥80% mutation score
- [ ] Held-out tests written and passing in CI
- [ ] Missing primitives extracted (palm-orientation, target-dispatch)
- [ ] E2E gesture demo with Golden Layout

### TTV Milestone

- [ ] Daily driver gesture input quality
- [ ] Works on Chromebook, mobile, laptop
- [ ] 60fps smooth tracking
- [ ] <100ms perceived latency

---

## 11. References

| Document | Location | Purpose |
|----------|----------|---------|
| Architecture SSOT | `cold/gold/HFO_ARCHITECTURE_SSOT_20260101.md` | Master architecture |
| Extraction Plan | `cold/silver/EXTRACTION_PLAN.md` | Primitive extraction tracking |
| Incident Reports | `hot/silver/INCIDENT_REPORTS_20260102.md` | Known AI failure patterns |
| Contract Schemas | `hot/bronze/src/contracts/schemas.ts` | Zod schema definitions |

---

*"The spider weaves the web that weaves the spider."*  
*Gen87.X3 | 2026-01-02 | Spider Sovereign × Web Weaver*
