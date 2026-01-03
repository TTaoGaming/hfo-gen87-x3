# Cold/Silver Extraction Plan

> Gen87.X3 | INTERLOCK Phase | 2026-01-02
> Port 7: Spider Sovereign | DECIDE

## Purpose

Extract **pure algorithmic primitives** from hot/bronze adapters into cold/silver for:
1. Isolation testing without adapter overhead
2. Mutation testing with Stryker
3. Reuse across multiple adapter implementations
4. Clear separation of concerns (algorithm vs infrastructure wrapper)

---

## Slop Inventory (Found Issues)

### 1. `demos/12-golden-unified.html` — **ARCHIVED**
- **Issue**: Used `new GoldenLayout()` directly instead of `GoldenLayoutShellAdapter`
- **Action**: Archived to `cold/bronze/archive_2025-12-31/demos/12-golden-unified.html`
- **Status**: ✅ SLOP REMOVED

### 2. Quarantine Import Breakage — **FIXED**
- **Issue**: Tests importing from wrong paths after quarantine move
- **Files Fixed**:
  - `pointer-event.adapter.test.ts` → `quarantine/mock-dom.adapter.js`
  - `webcam-pipeline.test.ts` → `quarantine/mock-sensor.adapter.js`
  - `mock-sensor.adapter.ts` → `../../contracts/hfo-ports.js`
- **Status**: ✅ All 461 adapter tests GREEN

### 3. Theater Code Eliminated — **FIXED**
- **Issue**: Reward hacks (`expect(true).toBe(true)`)
- **Status**: ✅ Cleaned in previous session

---

## Primitives to Extract

### Tier 1: Pure Algorithms (No Dependencies)

| Primitive | Current Location | Tests | Notes |
|-----------|------------------|-------|-------|
| `DoubleExponential` | `cold/silver/primitives/double-exponential.ts` | 27 | ✅ 69.37% Mutation Score |
| `LayoutTree` | `cold/silver/primitives/layout-tree.ts` | 20 | ✅ 95.29% Mutation Score |
| `OneEuro` | `cold/silver/primitives/one-euro.ts` | 15 | ✅ Extracted (Pure) |
| `GestureFSM` | `cold/silver/primitives/gesture-fsm.ts` | 18 | ✅ Extracted (Pure) |
| `Rapier` | `cold/silver/primitives/rapier-primitive.ts` | 12 | ✅ Extracted (Pure) |
| `SignalGates` | `cold/silver/primitives/signal-gates.ts` | 10 | ✅ Extracted (Pure) |
| `DoubleExponentialPredictor` | `double-exponential-predictor.adapter.ts` | Yes | Pure math |

### Tier 2: Contracts (Zod Schemas)

| Contract | Current Location | Notes |
|----------|------------------|-------|
| `SensorFrameSchema` | `contracts/schemas.ts` | Already in contracts |
| `SmoothedFrameSchema` | `contracts/schemas.ts` | Already in contracts |
| `FSMActionSchema` | `contracts/schemas.ts` | Already in contracts |
| `HFOSignalSchema` | `contracts/signal.contract.ts` | Already in contracts |

### Tier 3: Adapters (Keep in hot/bronze)

| Adapter | Tests | Status |
|---------|-------|--------|
| `GoldenLayoutShellAdapter` | 39 | ✅ REAL |
| `OneEuroAdapter` | 22 | ✅ REAL (uses npm) |
| `OneEuroExemplarAdapter` | 24 | ✅ REAL |
| `PointerEventAdapter` | 49 | ✅ REAL |
| `XStateFSMAdapter` | Many | ✅ REAL |
| `RapierPhysicsAdapter` | Many | ✅ REAL |
| `InMemorySubstrateAdapter` | Yes | ✅ REAL |
| `NatsSubstrateAdapter` | Yes | ✅ REAL |
| `DoubleExponentialPredictor` | Yes | ✅ REAL |
| `MediaPipeAdapter` | Minimal | ⚠️ Needs more tests |

---

## Extraction Steps

### Step 1: Create cold/silver/primitives/

```
cold/silver/primitives/
├── one-euro-filter.ts          # Pure 1€ algorithm (reference impl)
├── one-euro-filter.test.ts     # Mutation-tested
├── double-exponential.ts       # Pure predictor algorithm
├── double-exponential.test.ts  # Mutation-tested
├── signal-gates.ts             # G0-G7 validation logic
├── signal-gates.test.ts        # Property-based tests
└── index.ts                    # Exports
```

### Step 2: Add Stryker Configuration

```json
// stryker.conf.json
{
  "mutate": ["cold/silver/primitives/**/*.ts"],
  "testRunner": "vitest",
  "reporters": ["html", "clear-text", "progress"],
  "thresholds": { "high": 80, "low": 60, "break": 60 }
}
```

### Step 3: Create Held-Out Test Suite

```
tests/held-out/
├── one-euro-held-out.test.ts   # AI never sees these
├── signal-held-out.test.ts     # Hidden validation
└── README.md                   # Explains purpose
```

---

## Enforcement Gates to Add

| Gate | Tier | Tool | Threshold |
|------|------|------|-----------|
| Mutation Score | PR | Stryker | ≥80% kill rate |
| Held-Out Tests | CI | Vitest | 100% pass (hidden) |
| Type Safety | Pre-commit | tsc --noEmit | 0 errors |
| Reward Hack | Pre-commit | enforce-architecture.ts | 0 errors |
| Adapter Usage | PR | infrastructure-usage.test.ts | All constraints pass |

---

## Next Actions

1. [x] Extract `DoubleExponentialPredictor` algorithm to `cold/silver/primitives/` ✅ DONE
2. [x] Add Stryker mutation testing config ✅ DONE (69.37% kill rate)
3. [ ] Strengthen tests to improve mutation kill rate to ≥80%
4. [ ] Create held-out test suite in `tests/held-out/`
5. [ ] Extract `OneEuroFilter` reference implementation
6. [ ] Extract `SignalGates` G0-G7 validation
7. [ ] Archive `demos/12-golden-unified.html` to cold/bronze
8. [ ] Create pre-commit hook that blocks without tests

---

## Mutation Testing Results (2026-01-02)

### `double-exponential.ts`
- **Score**: 69.37%
- **Killed**: 77 mutants
- **Survived**: 33 mutants
- **Tests**: 27 (including 5 property-based)
- **Report**: `reports/mutation/mutation-report.html`

Key surviving mutants (need stronger tests):
- Conditional expressions in dt calculation (line 147)
- Arithmetic operators in smoothing (lines 158, 161-163)
- Clamp block removal (line 185)
- TTI speed calculations (lines 246-266)

---

*"The spider weaves the web that weaves the spider."*
*Port 7 | DECIDE | Gen87.X3*
