# 🏗️ HFO Infrastructure Spec — Variant 3

> **Generated**: 2026-01-01 | **Agent**: Spider Sovereign V3 (3rd semantic chunking pass)  
> **Source**: Cold archive (INTERLOCK_HANDOFF + SEMANTIC_CHUNKS_V2 + CRITICAL_INCIDENT_LOG)  
> **Purpose**: TODO manifest for infrastructure work with VERIFICATION gates  
> **Strange Loop**: N+1 Iteration

---

## Executive Summary

| Layer | Status | Blocker | V3 Gate |
|-------|--------|---------|---------|
| Port Interfaces | ✅ Done | — | G-PORTS |
| Adapter Impls | ✅ 90% | NavigatorPort | G-ADAPT |
| Registry Pattern | ✅ Code exists | Not wired | G-REGISTRY |
| **Bootstrap Code** | ❌ Missing | **P0 BLOCKER** | G-BOOTSTRAP |
| **Integration Tests** | ❌ Missing | **P0 BLOCKER** | G-HOTSWAP |
| Stryker | ⚠️ Broken | Import paths | G-MUTATION |

**V3 VERDICT**: The registry pattern is architecturally correct but NEVER EXECUTED in production code. This is the #1 gap preventing real polymorphic composition.

---

## 🔴 P0 — Do TODAY (Blocking)

### Task 1: Create `bootstrapRegistries.ts`

**File**: `hot/bronze/src/bootstrap-registries.ts`

**Why P0**: Without this, all registry code is dead code.

```typescript
// hot/bronze/src/bootstrap-registries.ts
import { 
  SmootherRegistry, 
  FSMRegistry, 
  UIShellRegistry,
  SensorRegistry,
  EmitterRegistry 
} from './contracts/adapter-factory.js';

// SmootherPort implementations
import { 
  OneEuroFactory, 
  RapierFactory,
  SmootherChainFactory 
} from './adapters/one-euro-exemplar.adapter.js';
import { PhysicsSpringDamperFactory } from './adapters/physics-spring-smoother.js';
import { PredictiveSmootherFactory } from './adapters/predictive-smoother.js';

// FSMPort implementations
import { XStateFSMFactory } from './adapters/xstate-fsm.adapter.js';
import { W3CPointerFSMFactory } from '../silver/src/fsm/w3c-pointer-fsm.js';

// UIShellPort implementations
import { GoldenLayoutFactory } from './adapters/golden-layout-shell.adapter.js';
import { RawHTMLShellFactory } from './adapters/port-factory.js';

// SensorPort implementations
import { MediaPipeFactory } from './adapters/mediapipe.adapter.js';

let bootstrapped = false;

export function bootstrapRegistries(): void {
  if (bootstrapped) return; // Idempotent
  
  // SmootherPort (5 options)
  SmootherRegistry.register('one-euro', OneEuroFactory);
  SmootherRegistry.register('rapier', RapierFactory);
  SmootherRegistry.register('spring-damper', PhysicsSpringDamperFactory);
  SmootherRegistry.register('predictive', PredictiveSmootherFactory);
  SmootherRegistry.register('chain', SmootherChainFactory);
  
  // FSMPort (2 options)
  FSMRegistry.register('xstate', XStateFSMFactory);
  FSMRegistry.register('w3c-pointer', W3CPointerFSMFactory);
  
  // UIShellPort (2 options)
  UIShellRegistry.register('golden-layout', GoldenLayoutFactory);
  UIShellRegistry.register('raw-html', RawHTMLShellFactory);
  
  // SensorPort (1 option)
  SensorRegistry.register('mediapipe', MediaPipeFactory);
  
  bootstrapped = true;
  console.log('[HFO] Registries bootstrapped');
}

export function isBootstrapped(): boolean {
  return bootstrapped;
}

export function resetRegistries(): void {
  // For testing only
  bootstrapped = false;
}
```

**Verification Gate (G-BOOTSTRAP)**:
```bash
# Must pass before merge
grep -r "bootstrapRegistries()" hot/*/src/main.ts && echo "PASS" || echo "FAIL"
```

---

### Task 2: Hot-Swap Integration Test

**File**: `hot/bronze/src/adapters/registry-swap.integration.test.ts`

**Why P0**: Proves polymorphic composition works at runtime.

```typescript
// hot/bronze/src/adapters/registry-swap.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { bootstrapRegistries, resetRegistries } from '../bootstrap-registries.js';
import { SmootherRegistry, FSMRegistry } from '../contracts/adapter-factory.js';
import { TileComposer } from './tile-composer.js';
import { OneEuroExemplarAdapter } from './one-euro-exemplar.adapter.js';
import { RapierPhysicsAdapter } from './rapier-physics.adapter.js';

describe('AdapterRegistry Hot-Swap Integration', () => {
  beforeAll(() => {
    bootstrapRegistries();
  });

  afterAll(() => {
    resetRegistries();
  });

  describe('SmootherPort Hot-Swap', () => {
    it('should swap smoother at runtime via registry', () => {
      const composer = new TileComposer();
      const tile = composer.addTile({ 
        id: 'test-tile',
        smootherType: 'one-euro'
      });
      
      // Initial: OneEuro
      expect(tile.smoother).toBeInstanceOf(OneEuroExemplarAdapter);
      
      // Hot-swap to Rapier
      tile.smoother = SmootherRegistry.create('rapier', { 
        stiffness: 100, 
        damping: 10 
      });
      expect(tile.smoother).toBeInstanceOf(RapierPhysicsAdapter);
      
      // Verify still functional
      const frame = { x: 0.5, y: 0.5, timestamp: Date.now() };
      const smoothed = tile.smoother.smooth(frame);
      expect(smoothed).toBeDefined();
    });

    it('should list available smoothers by TRL', () => {
      const trl7Plus = SmootherRegistry.getByTRL(7);
      expect(trl7Plus.length).toBeGreaterThanOrEqual(2);
      expect(trl7Plus.map(s => s.id)).toContain('one-euro');
      expect(trl7Plus.map(s => s.id)).toContain('rapier');
    });

    it('should reject unknown smoother id', () => {
      expect(() => SmootherRegistry.create('unknown-smoother'))
        .toThrow(/not registered/);
    });
  });

  describe('FSMPort Hot-Swap', () => {
    it('should swap FSM implementation at runtime', () => {
      const xstateFSM = FSMRegistry.create('xstate', { initialState: 'idle' });
      const w3cFSM = FSMRegistry.create('w3c-pointer', {});
      
      expect(xstateFSM).toBeDefined();
      expect(w3cFSM).toBeDefined();
    });
  });

  describe('Full Pipeline Swap', () => {
    it('should compose pipeline with different adapters', () => {
      const composer = new TileComposer();
      
      // Create tile with one-euro
      const tile1 = composer.addTile({ 
        id: 'tile-1', 
        smootherType: 'one-euro' 
      });
      
      // Create tile with rapier
      const tile2 = composer.addTile({ 
        id: 'tile-2', 
        smootherType: 'rapier' 
      });
      
      // Both should work independently
      expect(tile1.smoother.constructor.name).toBe('OneEuroExemplarAdapter');
      expect(tile2.smoother.constructor.name).toBe('RapierPhysicsAdapter');
    });
  });
});
```

**Verification Gate (G-HOTSWAP)**:
```bash
# Must pass before merge
npm test -- --grep "Hot-Swap Integration" && echo "PASS" || echo "FAIL"
```

---

### Task 3: Fix Stryker Import Paths

**Problem**: Mutation testing blocked by relative import resolution.

**Option A: Add `.js` extensions (Recommended)**

```typescript
// Before:
import { SmootherPort } from '../contracts/ports';

// After:
import { SmootherPort } from '../contracts/ports.js';
```

**Option B: Configure `tsconfig.json` paths**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@hfo/contracts/*": ["hot/bronze/src/contracts/*"],
      "@hfo/adapters/*": ["hot/bronze/src/adapters/*"]
    }
  }
}
```

**Option C: Update `stryker.config.mjs`**

```javascript
export default {
  mutate: ['hot/bronze/src/**/*.ts'],
  testRunner: 'vitest',
  packageManager: 'npm',
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  buildCommand: 'npm run build',
  // Force ESM resolution
  vitest: {
    configFile: 'vitest.config.ts'
  }
};
```

**Verification Gate (G-MUTATION)**:
```bash
# Must pass before merge
npx stryker run --mutate "hot/bronze/src/adapters/tile-composer.ts" 2>&1 | grep -q "Mutation" && echo "PASS" || echo "FAIL"
```

---

## 🟡 P1 — This Week

### Task 4: Mutation Test TileComposer

**Target**: 80%+ mutation score

```bash
npx stryker run --mutate "hot/bronze/src/adapters/tile-composer.ts" \
  --testRunner vitest \
  --concurrency 4
```

**Expected Mutants**:
- Boundary conditions in `addTile()`
- State transitions in `removeTile()`
- Config validation in `updateTileConfig()`

---

### Task 5: Mutation Test HFOPortFactory

**Target**: 80%+ mutation score

```bash
npx stryker run --mutate "hot/bronze/src/adapters/port-factory.ts" \
  --testRunner vitest \
  --concurrency 4
```

---

### Task 6: Rewire Demo to Use Registry

**File**: `hot/silver/demo/index.html` or equivalent

**Before (THEATER)**:
```javascript
import { OneEuroFilter } from '1eurofilter';
import GoldenLayout from 'golden-layout';

const filter = new OneEuroFilter({ freq: 60 });
```

**After (REAL)**:
```javascript
import { bootstrapRegistries } from './bootstrap-registries.js';
import { SmootherRegistry, UIShellRegistry } from './contracts/adapter-factory.js';

// Bootstrap at app startup
bootstrapRegistries();

// Use registry
const smoother = SmootherRegistry.create('one-euro', { freq: 60 });
const shell = UIShellRegistry.create('golden-layout', { /* config */ });
```

---

## 🟢 P2 — Next Sprint

### Task 7: BronzeSilverBridge

Translate PULL (hot/bronze) ↔ PUSH (hot/silver) paradigms.

### Task 8: Package Promotion Workflow

Script to extract bronze adapter → publishable npm package.

### Task 9: NavigatorPort Implementation

Port 7 — final missing port interface for strategic decisions.

---

## 📊 Registry Pattern Status

| Registry | Singleton | Factories Registered | Production Use |
|----------|-----------|---------------------|----------------|
| `SmootherRegistry` | ✅ Exists | 0 (test only) | ❌ |
| `FSMRegistry` | ✅ Exists | 0 (test only) | ❌ |
| `UIShellRegistry` | ✅ Exists | 0 (test only) | ❌ |
| `SensorRegistry` | ✅ Exists | 0 (test only) | ❌ |
| `EmitterRegistry` | ✅ Exists | 0 (test only) | ❌ |

**V3 Goal**: Move from "exists in test" to "wired in production".

---

## 🔒 V3 Verification Gates (Anti-Reward-Hack)

| Gate ID | Check | Enforcement |
|---------|-------|-------------|
| **G-BOOTSTRAP** | `bootstrapRegistries()` called in main | Pre-commit |
| **G-HOTSWAP** | Integration test passes | CI required |
| **G-MUTATION** | Stryker completes without error | CI gate |
| **G-REGISTRY** | Demo imports registry, not raw packages | Code review |
| **G-NO-DIRECT** | No `new OneEuroFilter()` in production | grep check |

---

## 🎯 Definition of Done

| Criteria | Verified By | Status |
|----------|-------------|--------|
| `bootstrapRegistries.ts` exists | File check | ❌ |
| All 5 smoother factories registered | Unit test | ❌ |
| Hot-swap integration test passes | Vitest | ❌ |
| Stryker completes without errors | CI | ❌ |
| Demo uses registry | Code review | ❌ |
| 80%+ mutation on TileComposer | Stryker | ❌ |

---

## 🔄 HIVE/8 Phase Mapping

| Task | HIVE Phase | Ports | Action |
|------|------------|-------|--------|
| Research existing code | **H** (Hunt) | 0+7 | Read cold archive |
| Write failing tests | **I** (Interlock) | 1+6 | Create test file first |
| Implement bootstrap | **V** (Validate) | 2+5 | Make tests pass |
| Refactor demo | **E** (Evolve) | 3+4 | Clean up, commit |

---

## 🔄 Strange Loop Markers

| Version | Agent | Key Contribution |
|---------|-------|------------------|
| V1 | Agent 1 | Initial bootstrap spec |
| V2 | Agent 2 | Added code snippets, HIVE mapping |
| **V3** | **Agent 3** | **Verification gates, idempotent bootstrap, full integration test** |

---

*Source: cold/bronze/archive_2025-12-31 | Spider Sovereign V3 | INTERLOCK ready*
