# DEMO REBUILD CHECKLIST — Gen87.X3.2

> **Created**: 2026-01-02  
> **Status**: IN PROGRESS  
> **SSOT**: This file is the Single Source of Truth for demo rebuilding  
> **Architecture**: GoldenLayout + RxJS Subjects + CDD (Contract-Driven Development)

---

## 🎯 MISSION

Rebuild all demos using:
1. **GoldenLayout** — Tiling window manager for consistent UI
2. **RxJS Subjects** — In-memory pub/sub (NOT NATS for browser-only)
3. **CDD** — Contract-first, tests before implementation
4. **REAL adapters** — From `lib/hfo.js` (mutation-tested)

---

## 📋 MASTER CHECKLIST

### Phase 0: Infrastructure (BLOCKING)

- [x] **0.1** Create `InMemorySubstrateAdapter` implementing `SubstratePort` interface ✅ COMPLETE (2026-01-02)
  - Location: `hot/bronze/src/adapters/in-memory-substrate.adapter.ts`
  - Uses: RxJS `Subject<unknown>` per topic
  - Contract: `ports.ts` SubstratePort interface (lines 370-400)
  - Tests: `in-memory-substrate.adapter.test.ts` — **34 tests passing**
  
- [ ] **0.2** Create `GoldenLayoutShell` wrapper component
  - Location: `hot/bronze/src/adapters/golden-layout-shell.ts`
  - **NOTE**: golden-layout-shell.adapter.ts EXISTS (519 LOC) — needs verification
  - Provides: Panel registration, layout serialization
  - Contract: `UIShellPort` interface
  - Tests: `golden-layout-shell.test.ts`

- [x] **0.3** Rebuild `demos/lib/hfo.js` bundle with new exports ✅ COMPLETE
  - Command: `npm run build:demos`
  - Exports: All adapters + **InMemorySubstrateAdapter**

---

### Phase 1: Primitive Demos (One per Port)

Each demo follows template:
```
┌─────────────────────────────────────────┐
│           GoldenLayout Shell            │
├─────────────┬─────────────┬─────────────┤
│   Input     │   Process   │   Output    │
│  (Source)   │  (Adapter)  │  (Sink)     │
└─────────────┴─────────────┴─────────────┘
        ↑           ↑            ↑
        └───────────┴────────────┘
              RxJS MessageBus
```

#### Demo 1: SensorPort (Port 0 — SENSE)
- [x] **1.1** Contract: Define `SensorFrame` Zod schema in demo ✅ (uses `SensorFrameSchema` from lib/hfo.js)
- [x] **1.2** Create `demos/sensor-demo.html` ✅ COMPLETE (2026-01-02)
  - Panel 1: Camera/Mouse input selector (MediaPipe Vision + mouse fallback)
  - Panel 2: Raw landmark visualization (21-point hand)
  - Panel 3: Gesture display (8 gestures + confidence bar)
  - Panel 4: Stats panel (FPS, latency, messages/sec)
  - Panel 5: MessageBus traffic log
  - Panel 6: Config panel (JADC2 ISR role documentation)
  - **REAL ARCHITECTURE**: Uses `createSensorFrameFromMouse` + `InMemorySubstrateAdapter` from lib/hfo.js
- [x] **1.3** Uses: `lib/hfo.js` → MediaPipe integration ✅
- [ ] **1.4** E2E test: `e2e/sensor-demo.spec.ts`

#### Demo 2: SmootherPort (Port 2 — SHAPE)
- [x] **2.1** Contract: `SmoothedFrame` Zod schema ✅ (exists in adapters)
- [x] **2.2** Create `demos/smoother-demo.html` ✅ COMPLETE (2026-01-02)
  - Panel 1: Noisy input generator (mouse + synthetic jitter)
  - Panel 2: Side-by-side comparison (Raw vs Smoothed trails)
  - Panel 3: Parameter tuner (minCutoff, beta sliders)
  - Panel 4: Stats (jitter reduction %, latency)
  - Panel 5: MessageBus traffic log
  - **REAL ARCHITECTURE**: Uses `OneEuroExemplarAdapter` + `InMemorySubstrateAdapter` from lib/hfo.js
- [x] **2.3** Uses: `OneEuroExemplarAdapter` from `lib/hfo.js` (83.58% mutation score) ✅
- [ ] **2.4** E2E test: `e2e/smoother-demo.spec.ts`

#### Demo 3: FSMPort (Port 5 — DEFEND)
- [ ] **3.1** Contract: `FSMState`, `FSMTransition` Zod schemas
- [ ] **3.2** Create `demos/fsm-demo.html`
  - Panel 1: Input source (mouse click = gesture)
  - Panel 2: State machine visualization (nodes + edges)
  - Panel 3: Transition log (timestamped state changes)
  - Panel 4: W3C PointerEvent output display
- [ ] **3.3** Uses: `XStateFSMAdapter` from `lib/hfo.js` (82.70% mutation score)
- [ ] **3.4** E2E test: `e2e/fsm-demo.spec.ts`

#### Demo 4: EmitterPort (Port 3 — DELIVER)
- [ ] **4.1** Contract: `W3CPointerEvent` Zod schema
- [ ] **4.2** Create `demos/emitter-demo.html`
  - Panel 1: Event generator (synthetic or from FSM)
  - Panel 2: DOM target (div receiving pointer events)
  - Panel 3: Event log (all emitted events with timestamps)
- [ ] **4.3** Uses: `PointerEventAdapter` from `lib/hfo.js`
- [ ] **4.4** E2E test: `e2e/emitter-demo.spec.ts`

#### Demo 5: GatePort (Port 5 — DEFEND)
- [ ] **5.1** Contract: `GateResult`, `ValidationReport` Zod schemas
- [ ] **5.2** Create `demos/gate-demo.html`
  - Panel 1: Signal input (valid/invalid JSON)
  - Panel 2: Gate status (G0-G7 pass/fail indicators)
  - Panel 3: Violation log
- [ ] **5.3** Uses: `validateSignal` from `lib/hfo.js`
- [ ] **5.4** E2E test: `e2e/gate-demo.spec.ts`

#### Demo 6: MessageBus Substrate
- [ ] **6.1** Create `demos/messagebus-demo.html`
  - Panel 1: Publisher (send to any topic)
  - Panel 2: Subscriber (listen to topics)
  - Panel 3: Topic inspector (all active subscriptions)
  - Panel 4: Message log (all traffic)
- [ ] **6.2** Uses: `InMemoryMessageBus` (RxJS Subjects)
- [ ] **6.3** E2E test: `e2e/messagebus-demo.spec.ts`

---

### Phase 2: Integration Demo

- [ ] **7.1** Create `demos/full-pipeline-demo.html`
  - All ports connected via MessageBus
  - Camera → Smoother → FSM → Emitter → DOM
  - GoldenLayout with 6+ panels
- [ ] **7.2** E2E test: `e2e/full-pipeline-demo.spec.ts`
- [ ] **7.3** Golden master test with recorded landmarks

---

### Phase 3: Cleanup

- [ ] **8.1** Update `demos/index.html` with new demo links
- [ ] **8.2** Delete or archive `11-*.html` files (superseded)
- [ ] **8.3** Update `README.md` with demo instructions
- [ ] **8.4** Run mutation testing on new demo adapters

---

## 🔧 TECHNICAL SPECS

### InMemoryMessageBus Interface (from ports.ts)

```typescript
interface MessageBus {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(subject: string, data: unknown): Promise<void>;
  subscribe(subject: string, callback: (data: unknown) => void): () => void;
  kvGet(key: string): Promise<unknown | null>;
  kvSet(key: string, value: unknown): Promise<void>;
  readonly isConnected: boolean;
}
```

### RxJS Implementation Sketch

```typescript
import { Subject, BehaviorSubject } from 'rxjs';
import type { MessageBus } from '../contracts/ports.js';

export class InMemoryMessageBus implements MessageBus {
  private subjects = new Map<string, Subject<unknown>>();
  private kv = new Map<string, unknown>();
  private _isConnected = false;

  get isConnected() { return this._isConnected; }

  async connect() { this._isConnected = true; }
  async disconnect() { 
    this.subjects.forEach(s => s.complete());
    this.subjects.clear();
    this._isConnected = false;
  }

  async publish(subject: string, data: unknown) {
    if (!this.subjects.has(subject)) {
      this.subjects.set(subject, new Subject());
    }
    this.subjects.get(subject)!.next(data);
  }

  subscribe(subject: string, callback: (data: unknown) => void) {
    if (!this.subjects.has(subject)) {
      this.subjects.set(subject, new Subject());
    }
    const sub = this.subjects.get(subject)!.subscribe(callback);
    return () => sub.unsubscribe();
  }

  async kvGet(key: string) { return this.kv.get(key) ?? null; }
  async kvSet(key: string, value: unknown) { this.kv.set(key, value); }
}
```

### GoldenLayout Panel Template

```html
<script type="module">
import { GoldenLayout } from 'golden-layout';
import { InMemoryMessageBus, OneEuroExemplarAdapter } from './lib/hfo.js';

const bus = new InMemoryMessageBus();
await bus.connect();

const layout = new GoldenLayout(container);

// Register panels
layout.registerComponentFactoryFunction('input', (cont) => { ... });
layout.registerComponentFactoryFunction('process', (cont) => { ... });
layout.registerComponentFactoryFunction('output', (cont) => { ... });

// Wire via MessageBus
bus.subscribe('sensor.frame', (frame) => { ... });
</script>
```

---

## 📊 PROGRESS TRACKER

| Phase | Item | Status | Date | Notes |
|-------|------|--------|------|-------|
| 0 | Archive demos 01-10 | ✅ DONE | 2026-01-02 | Moved to cold/bronze/archive_demos_2026-01-02/ |
| 0 | InMemoryMessageBus | ⬜ TODO | | |
| 0 | GoldenLayoutShell | ⬜ TODO | | |
| 0 | Rebuild lib/hfo.js | ⬜ TODO | | |
| 1 | sensor-demo.html | ⬜ TODO | | |
| 1 | smoother-demo.html | ⬜ TODO | | |
| 1 | fsm-demo.html | ⬜ TODO | | |
| 1 | emitter-demo.html | ⬜ TODO | | |
| 1 | gate-demo.html | ⬜ TODO | | |
| 1 | messagebus-demo.html | ⬜ TODO | | |
| 2 | full-pipeline-demo.html | ⬜ TODO | | |
| 3 | Update index.html | ⬜ TODO | | |
| 3 | Archive 11-*.html | ⬜ TODO | | |
| 3 | Mutation testing | ⬜ TODO | | |

---

## 🚨 RULES (DO NOT VIOLATE)

1. **NO INLINE CODE** — All adapters from `lib/hfo.js`
2. **TDD** — Write failing test before implementation
3. **CDD** — Define Zod contract before writing adapter
4. **GoldenLayout** — Every demo uses tiling layout
5. **MessageBus** — All panel communication via RxJS Subjects
6. **CITE SOURCES** — Magic numbers have `@source` provenance

---

## 🔗 REFERENCES

- Archived demos: `cold/bronze/archive_demos_2026-01-02/`
- MessageBus interface: `hot/bronze/src/contracts/ports.ts` line 370-400
- Existing good demo (reference): `demos/12-golden-unified.html`
- Mutation scores: XStateFSM=82.70%, OneEuro=83.58%, Pyre=81.27%

---

*"The spider weaves the web that weaves the spider."*  
*Gen87.X3.2 | 2026-01-02*
