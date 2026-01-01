# 🧩 Polymorphic Composition Proof

> **Goal**: Prove adapters are truly interchangeable via port interfaces
> **Method**: Terminal tests + mutation testing + type checking
> **Status**: Phase 1 (Port 2 smoother proven)

---

## What is Polymorphic Composition?

```
SAME INTERFACE + DIFFERENT IMPLEMENTATION = INTERCHANGEABLE

┌─────────────────────────────────────────────────────────────┐
│ SmootherPort Interface                                       │
├─────────────────────────────────────────────────────────────┤
│  smooth(point: Point2D): SmoothedPoint                       │
│  reset(): void                                               │
│  setConfig(config: Partial<SmootherConfig>): void            │
│  getConfig(): SmootherConfig                                 │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
   │ OneEuro      │    │ Kalman       │    │ DoubleExp    │
   │ Smoother     │    │ Smoother     │    │ Smoother     │
   │ (96% mut)    │    │ (TODO)       │    │ (TODO)       │
   └──────────────┘    └──────────────┘    └──────────────┘
```

**The pipeline doesn't care WHICH smoother - only that it implements SmootherPort.**

---

## Test: Polymorphic Type Check

```typescript
// hot/silver/exemplars/polymorphic-composition.test.ts

import { describe, it, expect } from 'vitest';
import type { SmootherPort } from '../../bronze/quarantine/one-euro-smoother.js';
import { OneEuroSmoother } from '../../bronze/quarantine/one-euro-smoother.js';

// Mock alternative smoother
class MockKalmanSmoother implements SmootherPort {
  private config: SmootherConfig = { freq: 60, minCutoff: 1, beta: 0, dCutoff: 1 };
  
  smooth(point: Point2D): SmoothedPoint {
    return { ...point, smoothedX: point.x, smoothedY: point.y, jitter: 0 };
  }
  reset(): void { /* no-op */ }
  setConfig(c: Partial<SmootherConfig>) { this.config = { ...this.config, ...c }; }
  getConfig(): SmootherConfig { return this.config; }
}

describe('Polymorphic SmootherPort', () => {
  // Factory accepts ANY SmootherPort implementation
  function createPipeline(smoother: SmootherPort) {
    return {
      process: (x: number, y: number, ts: number) => 
        smoother.smooth({ x, y, timestamp: ts })
    };
  }

  it('accepts OneEuroSmoother', () => {
    const pipeline = createPipeline(new OneEuroSmoother());
    const result = pipeline.process(0.5, 0.5, 1);
    expect(result.smoothedX).toBeDefined();
    expect(result.smoothedY).toBeDefined();
  });

  it('accepts MockKalmanSmoother', () => {
    const pipeline = createPipeline(new MockKalmanSmoother());
    const result = pipeline.process(0.5, 0.5, 1);
    expect(result.smoothedX).toBe(0.5);
    expect(result.smoothedY).toBe(0.5);
  });

  it('both produce SmoothedPoint', () => {
    const oneEuro = createPipeline(new OneEuroSmoother());
    const kalman = createPipeline(new MockKalmanSmoother());
    
    const r1 = oneEuro.process(0.5, 0.5, 1);
    const r2 = kalman.process(0.5, 0.5, 1);
    
    // Both have same shape
    expect(r1).toHaveProperty('x');
    expect(r1).toHaveProperty('y');
    expect(r1).toHaveProperty('smoothedX');
    expect(r1).toHaveProperty('smoothedY');
    expect(r1).toHaveProperty('jitter');
    
    expect(r2).toHaveProperty('x');
    expect(r2).toHaveProperty('y');
    expect(r2).toHaveProperty('smoothedX');
    expect(r2).toHaveProperty('smoothedY');
    expect(r2).toHaveProperty('jitter');
  });
});
```

---

## Terminal Proof Commands

### 1. Type Safety (Compile-Time Polymorphism)

```powershell
# Prove interfaces are correctly typed
npx tsc --noEmit

# Expected: 0 errors
# This proves: All adapters correctly implement their port interfaces
```

### 2. Runtime Polymorphism

```powershell
# Run polymorphic composition tests
npx vitest run --grep "Polymorphic"

# Expected: All tests pass
# This proves: Adapters are interchangeable at runtime
```

### 3. Mutation Proof (Behavioral)

```powershell
# Prove each adapter's tests catch real bugs
npx stryker run --mutate "hot/bronze/quarantine/one-euro-smoother.ts"

# Expected: ≥80% mutation score
# This proves: Tests are behavioral, not cosmetic
```

### 4. Contract Validation

```powershell
# Check port contracts are enforced
npx vitest run hot/bronze/src/contracts/hfo-ports.test.ts

# Expected: All contract tests pass
# This proves: Port metadata and schemas are valid
```

---

## 8-Port Composition Pipeline

```typescript
// Full pipeline composition with all 8 ports

import type { 
  SensePort, FusePort, ShapePort, DeliverPort,
  TestPort, DefendPort, StorePort, DecidePort 
} from './contracts/hfo-ports.js';

interface ObsidianPipeline {
  // Primary flow (Ports 0-3)
  sense: SensePort;    // Port 0: SENSE
  fuse: FusePort;      // Port 1: FUSE
  shape: ShapePort;    // Port 2: SHAPE
  deliver: DeliverPort; // Port 3: DELIVER
  
  // Secondary flow (Ports 4-7)
  test: TestPort;      // Port 4: TEST
  defend: DefendPort;  // Port 5: DEFEND
  store: StorePort;    // Port 6: STORE
  decide: DecidePort;  // Port 7: DECIDE
}

async function createObsidianPipeline(config: {
  senseAdapter: SensePort;
  fuseAdapter: FusePort;
  shapeAdapter: ShapePort;
  deliverAdapter: DeliverPort;
  testAdapter: TestPort;
  defendAdapter: DefendPort;
  storeAdapter: StorePort;
  decideAdapter: DecidePort;
}): Promise<ObsidianPipeline> {
  
  // Initialize all ports in parallel
  await Promise.all([
    config.senseAdapter.initialize(),
    config.fuseAdapter.initialize(),
    config.shapeAdapter.initialize(),
    config.deliverAdapter.initialize(),
    config.testAdapter.initialize(),
    config.defendAdapter.initialize(),
    config.storeAdapter.initialize(),
    config.decideAdapter.initialize(),
  ]);

  return {
    sense: config.senseAdapter,
    fuse: config.fuseAdapter,
    shape: config.shapeAdapter,
    deliver: config.deliverAdapter,
    test: config.testAdapter,
    defend: config.defendAdapter,
    store: config.storeAdapter,
    decide: config.decideAdapter,
  };
}
```

---

## HIVE/8 Phase Composition

```typescript
// Anti-diagonal pairs (sum = 7)

const hivePhases = {
  H: { // Hunt
    ports: [0, 7],
    adapters: [pipeline.sense, pipeline.decide],
    description: 'Search and decide what to sense',
  },
  I: { // Interlock
    ports: [1, 6],
    adapters: [pipeline.fuse, pipeline.store],
    description: 'Fuse data and store context',
  },
  V: { // Validate
    ports: [2, 5],
    adapters: [pipeline.shape, pipeline.defend],
    description: 'Transform data and validate gates',
  },
  E: { // Evolve
    ports: [3, 4],
    adapters: [pipeline.deliver, pipeline.test],
    description: 'Deliver output and test properties',
  },
};

// Execute HIVE cycle
async function executeHIVECycle(
  pipeline: ObsidianPipeline,
  input: unknown
) {
  // H: Hunt (Ports 0+7)
  const sensed = await pipeline.sense.sense({ source: 'webcam' });
  const decision = await pipeline.decide.decide({ options: ['track', 'idle'] });
  
  // I: Interlock (Ports 1+6)
  const fused = await pipeline.fuse.fuse({ sources: [sensed] });
  await pipeline.store.store({ data: fused, key: 'frame' });
  
  // V: Validate (Ports 2+5)
  const shaped = await pipeline.shape.shape({ data: fused });
  const gateResult = await pipeline.defend.gate({ signal: shaped });
  
  // E: Evolve (Ports 3+4)
  if (gateResult.allowed) {
    await pipeline.deliver.deliver({ payload: shaped, target: 'ui' });
    await pipeline.test.test({ subject: shaped, property: 'smoothness' });
  }
}
```

---

## Adapter Status Matrix

| Port | Interface | Adapter | Mutation | Promoted |
|------|-----------|---------|----------|----------|
| 0 | `SensePort` | `MediaPipeSenseAdapter` | ⬜ TODO | ❌ |
| 1 | `FusePort` | `FuseWrapperAdapter` | ⬜ TODO | ❌ |
| 2 | `ShapePort` | `OneEuroSmoother` | **96%** ✅ | 🔜 |
| 3 | `DeliverPort` | `DeliverGoldenLayoutAdapter` | ⬜ TODO | ❌ |
| 4 | `TestPort` | `StrykerTestAdapter` | ⬜ TODO | ❌ |
| 5 | `DefendPort` | `PyreGateAdapter` | ⬜ TODO | ❌ |
| 6 | `StorePort` | `KrakenStoreAdapter` | ⬜ TODO | ❌ |
| 7 | `DecidePort` | `SpiderDecideAdapter` | ⬜ TODO | ❌ |

---

## Next Steps

1. **Port 0**: Add mutation tests to `MediaPipeSenseAdapter`
2. **Port 1**: Add mutation tests to `FuseWrapperAdapter`
3. **Port 3**: Add mutation tests to `DeliverGoldenLayoutAdapter`
4. **Port 7**: Build `XStateFSMAdapter` for DECIDE port

---

*Prove composition. Trust math, not prompts.*
*Gen87-X3.1 | Polymorphic Composition | 2026-01-01*
