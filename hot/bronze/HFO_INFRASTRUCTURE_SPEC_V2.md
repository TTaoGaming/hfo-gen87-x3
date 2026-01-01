# 🏗️ HFO Infrastructure Spec — Variant 2

> **Generated**: 2026-01-01 | **Agent**: Spider Sovereign V2  
> **Source**: Cold archive (HIVE8_WORKFLOW_SILVER_SPEC + INTERLOCK_HANDOFF + Architecture docs)  
> **Purpose**: TODO manifest for infrastructure work today

---

## Executive Summary

HFO infrastructure is **architecturally complete** but **runtime wiring missing**.

| Layer | Status | Blocker |
|-------|--------|---------|
| Port Interfaces | ✅ Done | — |
| Adapter Implementations | ✅ 90% | NavigatorPort |
| Registry Pattern | ✅ Code exists | Not wired |
| Bootstrap Code | ❌ Missing | P0 Task |
| Integration Tests | ❌ Missing | P0 Task |

---

## 🔴 P0 — Do TODAY

### Task 1: Create `bootstrapRegistries.ts`

**File**: `hot/bronze/src/bootstrap-registries.ts`

```typescript
import { SmootherRegistry, FSMRegistry, UIShellRegistry } from './contracts/adapter-factory.js';
import { OneEuroFactory, RapierFactory } from './adapters/one-euro-exemplar.adapter.js';
import { XStateFSMFactory } from './adapters/xstate-fsm.adapter.js';
import { GoldenLayoutFactory } from './adapters/golden-layout-shell.adapter.js';

export function bootstrapRegistries(): void {
  SmootherRegistry.register('one-euro', OneEuroFactory);
  SmootherRegistry.register('rapier', RapierFactory);
  FSMRegistry.register('xstate', XStateFSMFactory);
  UIShellRegistry.register('golden-layout', GoldenLayoutFactory);
}
```

**Acceptance**: All registries populated at app startup.

---

### Task 2: Hot-Swap Integration Test

**File**: `hot/bronze/src/adapters/registry-swap.integration.test.ts`

```typescript
describe('AdapterRegistry Hot-Swap', () => {
  beforeAll(() => bootstrapRegistries());

  it('swaps smoother at runtime via registry', () => {
    const tile = composer.addTile({ id: 'test' });
    expect(tile.smoother).toBeInstanceOf(OneEuroExemplarAdapter);
    
    tile.smoother = SmootherRegistry.create('rapier', { stiffness: 100 });
    expect(tile.smoother).toBeInstanceOf(RapierPhysicsAdapter);
  });

  it('lists available adapters by TRL', () => {
    const available = SmootherRegistry.getByTRL(7);
    expect(available.length).toBeGreaterThanOrEqual(2);
  });
});
```

**Acceptance**: Test proves swap works without app restart.

---

### Task 3: Fix Stryker Import Paths

**Problem**: Relative imports break in Stryker sandbox.

**Fix Options**:
1. Use `baseUrl` + path aliases in tsconfig
2. Switch to package-local imports
3. Add explicit file extensions (.js)

**Acceptance**: `npm run mutation` completes without import errors.

---

## 🟡 P1 — This Week

### Task 4: Mutation Test TileComposer

**Target**: 80%+ mutation score

```bash
npx stryker run --mutate "hot/bronze/src/adapters/tile-composer.ts"
```

### Task 5: Mutation Test HFOPortFactory

**Target**: 80%+ mutation score

```bash
npx stryker run --mutate "hot/bronze/src/adapters/port-factory.ts"
```

### Task 6: Rewire Demo to Use Registry

**File**: `hot/silver/demo/index.html`

**Before** (theater):
```javascript
import { OneEuroFilter } from '1eurofilter';
const filter = new OneEuroFilter({ freq: 60 });
```

**After** (real):
```javascript
import { SmootherRegistry, bootstrapRegistries } from './adapters';
bootstrapRegistries();
const filter = SmootherRegistry.create('one-euro', { freq: 60 });
```

---

## 🟢 P2 — Next Sprint

### Task 7: BronzeSilverBridge

Translate PULL (hot/bronze) ↔ PUSH (hot/silver) paradigms.

### Task 8: Package Promotion Workflow

Script to extract bronze adapter → npm package.

### Task 9: NavigatorPort Implementation

Port 7 — final missing port interface.

---

## 📦 Infrastructure Components Status

| Component | File | Tests | Mutation | Status |
|-----------|------|-------|----------|--------|
| AdapterRegistry | `adapter-factory.ts` | 20+ | ? | ✅ |
| HFOPortFactory | `port-factory.ts` | 34 | blocked | ✅ |
| TileComposer | `tile-composer.ts` | 23 | blocked | ✅ |
| SmootherChain | `smoother-chain.ts` | — | — | 🟡 |
| PipelinePort | `pipeline.ts` | — | — | 🟡 |

---

## 🎯 Definition of Done

| Criteria | Verified By |
|----------|-------------|
| `bootstrapRegistries()` exists | File exists |
| All 5 smoother factories registered | Unit test |
| Hot-swap integration test passes | Vitest |
| Stryker completes without errors | CI |
| Demo uses registry | Code review |

---

## HIVE/8 Mapping

| Task | HIVE Phase | Ports |
|------|------------|-------|
| Research existing code | H (Hunt) | 0+7 |
| Write failing tests | I (Interlock) | 1+6 |
| Implement bootstrap | V (Validate) | 2+5 |
| Refactor demo | E (Evolve) | 3+4 |

---

*Source: cold/bronze/archive_2025-12-31 | Spider Sovereign V2*
