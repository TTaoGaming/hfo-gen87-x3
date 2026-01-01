# 🕸️ HFO 8-Port Architecture — Polymorphic Composition

> **Purpose**: Prove polymorphic adapter composition via terminal & mutation testing
> **Enforcement**: Machine-checkable, AI cannot bypass
> **Status**: 1/8 ports with mutation-proven adapter

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        OBSIDIAN HOURGLASS - 8 PORTS                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  HIVE/8 Anti-Diagonal Pairs (sum = 7):                                         │
│                                                                                 │
│    H (Hunt):      0 + 7 = Lidless Legion + Spider Sovereign                    │
│    I (Interlock): 1 + 6 = Web Weaver + Kraken Keeper                           │
│    V (Validate):  2 + 5 = Mirror Magus + Pyre Praetorian                       │
│    E (Evolve):    3 + 4 = Spore Storm + Red Regnant                            │
│                                                                                 │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐                         │
│  │ Port 0  │──▶│ Port 1  │──▶│ Port 2  │──▶│ Port 3  │                         │
│  │ SENSE   │   │  FUSE   │   │ SHAPE   │   │ DELIVER │                         │
│  │ Lidless │   │ Weaver  │   │ Magus   │   │ Spore   │                         │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘                         │
│       │              │              │              │                            │
│       │              │              │              │                            │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐                         │
│  │ Port 7  │◀──│ Port 6  │◀──│ Port 5  │◀──│ Port 4  │                         │
│  │ DECIDE  │   │ STORE   │   │ DEFEND  │   │  TEST   │                         │
│  │ Spider  │   │ Kraken  │   │  Pyre   │   │ Regnant │                         │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 The 8 Legendary Commanders

| Port | Commander | Verb | Mantra | Status |
|------|-----------|------|--------|--------|
| 0 | **Lidless Legion** | SENSE | "How do we SENSE the SENSE?" | ✅ MediaPipe adapter |
| 1 | **Web Weaver** | FUSE | "How do we FUSE the FUSE?" | ✅ Vacuole wrapper |
| 2 | **Mirror Magus** | SHAPE | "How do we SHAPE the SHAPE?" | ✅ 1€ Filter (96% mut) |
| 3 | **Spore Storm** | DELIVER | "How do we DELIVER the DELIVER?" | ✅ GoldenLayout adapter |
| 4 | **Red Regnant** | TEST | "How do we TEST the TEST?" | 🔄 Stryker harness |
| 5 | **Pyre Praetorian** | DEFEND | "How do we DEFEND the DEFEND?" | 🔄 Gate validator |
| 6 | **Kraken Keeper** | STORE | "How do we STORE the STORE?" | ⬜ TODO |
| 7 | **Spider Sovereign** | DECIDE | "How do we DECIDE the DECIDE?" | ⬜ XState FSM |

---

## 🔬 Polymorphic Port Interfaces

Each port has a **behavioral contract** that any adapter must implement.
This enables **polymorphic composition** - swap adapters without changing pipeline.

### Port Interface Hierarchy

```typescript
// Base interface all ports implement
interface HFOPort {
  readonly portNumber: PortNumber;
  readonly metadata: HFOPortMetadata;
  heartbeat(): Promise<{ healthy: boolean; timestamp: string }>;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

// Port 0: SENSE
interface SensePort extends HFOPort {
  sense(input: SenseInput): Promise<SenseResult>;
  observe(source: string): AsyncIterable<SensedData>;
  snapshot(): SensedData | null;
}

// Port 1: FUSE  
interface FusePort extends HFOPort {
  fuse(input: FuseInput): Promise<FuseResult>;
  validate(data: unknown, schema: SchemaDefinition): Promise<ValidationResult>;
  registerSchema(schema: SchemaDefinition): void;
}

// Port 2: SHAPE
interface ShapePort extends HFOPort {
  shape(input: ShapeInput): Promise<ShapeResult>;
  transform(data: unknown, transformation: Transformation): unknown;
  smooth?(point: Point2D): SmoothedPoint;  // Extended for smoothers
}

// Port 3: DELIVER
interface DeliverPort extends HFOPort {
  deliver(input: DeliverInput): Promise<DeliverResult>;
  emit(signal: unknown): Promise<{ emitted: boolean; id: string }>;
  transition(fsm: FSMDefinition, event: string): Promise<FSMState>;
}

// Port 4: TEST
interface TestPort extends HFOPort {
  test(input: TestInput): Promise<TestResult>;
  property(check: PropertyCheck): Promise<PropertyResult>;
  mutate(target: string): Promise<MutationReport>;
}

// Port 5: DEFEND
interface DefendPort extends HFOPort {
  defend(input: DefendInput): Promise<DefendResult>;
  gate(signal: Signal): Promise<GateResult>;
  quarantine(violation: Violation): Promise<void>;
}

// Port 6: STORE
interface StorePort extends HFOPort {
  store(input: StoreInput): Promise<StoreResult>;
  recall(query: RecallQuery): Promise<RecallResult>;
  persist(data: unknown): Promise<{ id: string }>;
}

// Port 7: DECIDE
interface DecidePort extends HFOPort {
  decide(input: DecideInput): Promise<DecideResult>;
  route(signal: Signal): Promise<RouteResult>;
  orchestrate(workflow: Workflow): AsyncIterable<WorkflowEvent>;
}
```

---

## 🧩 Polymorphic Adapter Registry

Multiple adapters can implement the same port interface.
The pipeline composes them interchangeably.

### Port 2 Example: Multiple Smoothers

```typescript
// Interface
interface SmootherPort {
  smooth(point: Point2D): SmoothedPoint;
  reset(): void;
  setConfig(config: Partial<SmootherConfig>): void;
}

// Adapter 1: 1€ Filter (PROVEN - 96% mutation score)
class OneEuroSmoother implements SmootherPort { ... }

// Adapter 2: Kalman Filter (TODO)
class KalmanSmoother implements SmootherPort { ... }

// Adapter 3: Double Exponential (TODO)
class DoubleExponentialSmoother implements SmootherPort { ... }

// Pipeline composes ANY smoother
function createPipeline(smoother: SmootherPort) {
  return { shape: (p: Point2D) => smoother.smooth(p) };
}
```

---

## 🧪 Mutation Testing Proof

**Why Mutation Testing?**
- Unit tests can pass with no behavior (cosmetic compliance)
- Mutation testing PROVES tests catch real bugs
- Target: ≥80% mutation score for silver promotion

### Current Mutation Scores

| Adapter | Port | Tests | Mutation Score | Status |
|---------|------|-------|----------------|--------|
| `OneEuroSmoother` | 2 | 12 | **96.15%** ✅ | SILVER |
| `MediaPipeSenseAdapter` | 0 | - | ⬜ TODO | BRONZE |
| `FuseWrapperAdapter` | 1 | - | ⬜ TODO | BRONZE |
| `DeliverGoldenLayoutAdapter` | 3 | - | ⬜ TODO | BRONZE |

### How to Run Mutation Testing

```bash
# Run Stryker on a specific adapter
npx stryker run --mutate "hot/bronze/quarantine/one-euro-smoother.ts"

# View HTML report
open reports/mutation/html/index.html
```

### Mutation Score Threshold

```javascript
// stryker.config.mjs
export default {
  thresholds: {
    high: 80,    // ≥80% = GREEN (silver ready)
    low: 60,     // <60% = RED (needs work)
    break: 50,   // <50% = FAIL (CI blocks)
  }
};
```

---

## 📁 File Structure

```
hot/
├── bronze/
│   ├── quarantine/                    # New code enters HERE
│   │   ├── one-euro-smoother.ts       # ✅ Port 2 adapter (96% mut)
│   │   ├── one-euro-smoother.test.ts  # ✅ Behavioral tests
│   │   ├── sense-mediapipe.ts         # 🔄 Port 0 adapter
│   │   ├── fuse-wrapper.ts            # 🔄 Port 1 adapter
│   │   ├── deliver-goldenlayout.ts    # 🔄 Port 3 adapter
│   │   └── shape-passthrough.ts       # 🔄 Port 2 passthrough
│   │
│   └── src/contracts/
│       ├── hfo-ports.ts               # Port interfaces & metadata
│       └── port-contracts.ts          # Behavioral contracts (CDD)
│
└── silver/
    ├── 8_PORT_ARCHITECTURE.md         # This file
    ├── POLYMORPHIC_COMPOSITION.md     # Composition proof
    ├── MUTATION_TESTING_GUIDE.md      # How to run mutation tests
    ├── .constraint-rules.mjs          # Import enforcement
    ├── architecture.smoke.test.ts     # Boundary tests
    │
    └── exemplars/                     # PROMOTED adapters only
        └── README.md                  # Promotion criteria
```

---

## 🚀 Terminal Commands: Prove Polymorphism

### 1. Type Check All Adapters
```bash
npx tsc --noEmit
# Should show: 0 errors
```

### 2. Run Behavioral Tests
```bash
npm test
# Should show: all tests passing
```

### 3. Run Mutation Testing
```bash
npx stryker run
# Should show: ≥80% mutation score
```

### 4. Check Import Boundaries
```bash
npx dependency-cruiser hot/silver/exemplars --config .constraint-rules.mjs
# Should show: 0 violations
```

### 5. Smoke Test Architecture
```bash
npx vitest run hot/silver/architecture.smoke.test.ts
# Should show: all boundaries enforced
```

---

## 🎭 Adapter Promotion Criteria

To move from `quarantine/` to `exemplars/`:

| Criterion | Threshold | Enforcement |
|-----------|-----------|-------------|
| Mutation Score | ≥80% | Stryker CI gate |
| Type Safety | 0 errors | `tsc --noEmit` |
| Tests Passing | 100% | Vitest CI gate |
| Import Rules | 0 violations | dependency-cruiser |
| Behavioral Contract | Implemented | Port interface check |

---

## 📊 Composition Proof: TTV Pipeline

```typescript
// Polymorphic pipeline composition
async function createTTVPipeline(adapters: {
  sense: SensePort;
  fuse: FusePort;
  shape: ShapePort;
  deliver: DeliverPort;
}) {
  // Initialize all ports
  await Promise.all([
    adapters.sense.initialize(),
    adapters.fuse.initialize(),
    adapters.shape.initialize(),
    adapters.deliver.initialize(),
  ]);

  // Compose pipeline
  return {
    async process(frame: VideoFrame) {
      // Port 0: SENSE
      const sensed = await adapters.sense.sense({ source: 'webcam', frame });
      
      // Port 1: FUSE
      const fused = await adapters.fuse.fuse({ sources: [sensed] });
      
      // Port 2: SHAPE (polymorphic!)
      const shaped = await adapters.shape.shape({ data: fused });
      
      // Port 3: DELIVER
      return adapters.deliver.deliver({ payload: shaped, target: 'ui' });
    },
  };
}

// Example: Swap smoother at runtime
const pipeline1 = createTTVPipeline({
  sense: new MediaPipeSenseAdapter(),
  fuse: new FuseWrapperAdapter(),
  shape: new OneEuroSmoother(),      // 1€ filter
  deliver: new DeliverGoldenLayoutAdapter(),
});

const pipeline2 = createTTVPipeline({
  sense: new MediaPipeSenseAdapter(),
  fuse: new FuseWrapperAdapter(),
  shape: new KalmanSmoother(),        // Kalman filter (different!)
  deliver: new DeliverGoldenLayoutAdapter(),
});
```

---

*The spider weaves the web that weaves the spider.*
*Gen87-X3.1 | 8-Port Architecture | 2026-01-01*
