---
hfo:
  gen: 87
  port: 7
  role: DECIDE
  medallion: gold
  desc: "Swarm Orchestration Guide - AI Tool Exposure for W3C Gesture Control Plane"
---

# 🐝 Swarm Orchestration Guide

> **Gen87.X3** | AI Orchestration for the W3C Gesture Control Plane Mission
> 
> **Status**: ✅ Tested and Ready | **Last Updated**: 2025-12-30

---

## 0. BLUF (Bottom Line Up Front)

**What this provides:**
- **OpenRouter Gateway** → 200+ LLMs via single API (using Llama 3.3 70B free)
- **LangGraph HIVE/8** → State machine for H→I→V→E workflow cycles
- **Memory Bank** → 6,423 artifacts from Pre-HFO to Gen84 (FTS search)
- **Stigmergy Blackboard** → Inter-agent coordination via signals
- **CrewAI Agents** → Python multi-agent framework (8 commanders)

**Quick smoke test:**
```bash
npx tsx src/orchestration/test-orchestration.ts
```

**Import for use:**
```typescript
import { 
  askLLM, 
  runTask, 
  emitHuntSignal,
  smokeTestSwarm 
} from './sandbox/src/swarm/index.js';
```

---

## 1. Components (FUSE)

### 1.1 OpenRouter Gateway

**Location**: `src/orchestration/openrouter.config.ts`

**What it does**: Provides LLM access via OpenRouter API with automatic model routing per HIVE/8 port.

**Models configured** (all free tier for testing):
| Model | Use Case |
|-------|----------|
| `meta-llama/llama-3.3-70b-instruct:free` | Default for all ports |

**Port → Model Mapping**:
| Port | Commander | Verb | Model Type |
|------|-----------|------|------------|
| 0 | Lidless Legion | SENSE | fast |
| 1 | Web Weaver | FUSE | code |
| 2 | Mirror Magus | SHAPE | code |
| 3 | Spore Storm | DELIVER | balanced |
| 4 | Red Regnant | TEST | powerful |
| 5 | Pyre Praetorian | DEFEND | fast |
| 6 | Kraken Keeper | STORE | longContext |
| 7 | Spider Sovereign | DECIDE | powerful |

**Usage**:
```typescript
import { generateCompletion, PORT_MODELS } from './src/orchestration/openrouter.config.js';

// Simple completion
const response = await generateCompletion('Explain HIVE/8 in one sentence');

// With port-specific model
const codeResponse = await generateCompletion('Write a Zod schema for GestureFrame', {
  port: 1, // Web Weaver - code specialist
});
```

### 1.2 LangGraph HIVE/8

**Location**: `src/orchestration/langgraph.hive.ts`

**What it does**: Executes HIVE/8 workflow cycles as a state machine:
```
START → HUNT → INTERLOCK → VALIDATE → EVOLVE → END
```

**State tracked**:
- `phase`: Current HIVE phase (H/I/V/E)
- `cycle`: Iteration count
- `huntResults`: Exemplars found
- `interlockResults`: Contracts defined
- `validateResults`: Tests passed
- `evolveResults`: Outputs emitted
- `task`: Input task description
- `output`: Final result

**Usage**:
```typescript
import { runHIVECycle } from './src/orchestration/langgraph.hive.js';

const result = await runHIVECycle('Design a GestureFrame contract for MediaPipe hand tracking');

console.log('Hunt findings:', result.huntResults);
console.log('Contracts:', result.interlockResults);
console.log('Validation:', result.validateResults);
console.log('Output:', result.output);
```

### 1.3 Memory Bank (Portable)

**Location**: `../portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/`

**What it does**: DuckDB database with 6,423 artifacts from HFO history, with FTS (Full-Text Search).

**Key files found**:
| File | Gen | Score | Purpose |
|------|-----|-------|---------|
| `GEN83.2_ENRICHED_GOLD_BATON_QUINE.md` | 83 | 7.18 | Complete HFO architecture |
| `GEN84.2_ENRICHED_GOLD_BATON_QUINE.md` | 84 | 7.10 | Updated architecture |
| `REF__W3C_GESTURE_CONTROL_PLANE_GOLD_BATON.md` | 83 | 9.82 | **Mission spec** |
| `1.0_card_08_gestural_gateway.md` | 82 | 10.37 | Gesture Gateway card |

**Usage (Python)**:
```python
import duckdb
con = duckdb.connect('../portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/hfo_memory.duckdb', read_only=True)
con.execute('LOAD fts')

# Search for exemplars
results = con.execute("""
    SELECT filename, generation, content,
           fts_main_artifacts.match_bm25(id, 'mediapipe pointer events') as score
    FROM artifacts WHERE score IS NOT NULL
    ORDER BY score DESC LIMIT 10
""").fetchall()
```

**Usage (CLI)**:
```bash
python ../portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/tools/search.py "gesture control w3c" --limit 10
```

### 1.4 Stigmergy Blackboard

**Location**: `sandbox/obsidianblackboard.jsonl`

**What it does**: Inter-agent coordination via append-only signal log (stigmergy pattern).

**Signal schema** (8 fields, G0-G7 validated):
```typescript
interface Signal {
  ts: string;      // ISO8601 timestamp
  mark: number;    // 0.0-1.0 confidence
  pull: string;    // upstream|downstream|lateral
  msg: string;     // Signal message
  type: string;    // signal|event|error|metric
  hive: string;    // H|I|V|E|X
  gen: number;     // Generation (87)
  port: number;    // Port 0-7
}
```

**Usage**:
```typescript
import { emitHuntSignal, emitValidateSignal } from './sandbox/src/swarm/index.js';

// During HUNT phase
emitHuntSignal('Found MediaPipe gesture exemplar in Gen83');

// During VALIDATE phase
emitValidateSignal('GestureFrame contract tests passing');
```

### 1.5 CrewAI Agents (Python)

**Location**: `src/orchestration/crewai_hive.py`

**What it does**: 8 commander agents with specific roles, using OpenRouter backend.

**Commanders**:
| Commander | Port | Role | Goal |
|-----------|------|------|------|
| Lidless Legion | 0 | Researcher | Search memory and web for exemplars |
| Web Weaver | 1 | Architect | Design contracts and interfaces |
| Mirror Magus | 2 | Engineer | Transform and implement |
| Spore Storm | 3 | Executor | Deliver workflows |
| Red Regnant | 4 | Tester | Property testing |
| Pyre Praetorian | 5 | Validator | Gate enforcement |
| Kraken Keeper | 6 | Archivist | Memory operations |
| Spider Sovereign | 7 | Strategist | Strategic decisions |

**Usage**:
```bash
python src/orchestration/crewai_hive.py
```

---

## 2. Smoke Tests (TEST)

### 2.1 Full Suite Test

```bash
# Run all orchestration tests
npx tsx src/orchestration/test-orchestration.ts
```

**Expected output**:
```
✅ OpenRouter connected: HFO Gen87 is online
✅ Direct Completion: Response received
✅ LangGraph HIVE/8: All phases completed
```

### 2.2 Individual Component Tests

**OpenRouter only**:
```typescript
import { testOpenRouterConnection } from './src/orchestration/openrouter.config.js';
const connected = await testOpenRouterConnection();
```

**LangGraph only**:
```typescript
import { runHIVECycle } from './src/orchestration/langgraph.hive.js';
const result = await runHIVECycle('Test task');
console.log(result.huntResults.length > 0 ? '✅ HUNT passed' : '❌ HUNT failed');
```

**Memory Bank only**:
```bash
python ../portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/tools/search.py "test query"
```

### 2.3 Swarm Smoke Test

```typescript
import { smokeTestSwarm } from './sandbox/src/swarm/index.js';

const results = await smokeTestSwarm();
console.log('OpenRouter:', results.openrouter ? '✅' : '❌');
console.log('LangGraph:', results.langgraph ? '✅' : '❌');
console.log('Blackboard:', results.blackboard ? '✅' : '❌');
```

---

## 3. Workflows (DELIVER)

### 3.1 HIVE/8 Phases

| Phase | Ports | TDD Phase | What Happens |
|-------|-------|-----------|--------------|
| **H** (Hunt) | 0+7 | Research | Search memory bank, find exemplars |
| **I** (Interlock) | 1+6 | RED | Define contracts, write failing tests |
| **V** (Validate) | 2+5 | GREEN | Implement, make tests pass |
| **E** (Evolve) | 3+4 | REFACTOR | Clean up, emit results |

### 3.2 Mission: W3C Gesture Control Plane

**Pipeline** (from `REF__W3C_GESTURE_CONTROL_PLANE_GOLD_BATON.md`):
```
MediaPipe Hands → GestureFrame → FSM (XState) → PointerStream → DOM Injector → Target
                                                                                 ↓
                                                                           Excalidraw
                                                                           tldraw
                                                                           Emulators
```

**Port mapping**:
| Component | Port | Role |
|-----------|------|------|
| MediaPipe Adapter | 0 | SENSE |
| GestureFrame Bus | 1 | FUSE |
| Contract Schemas | 2 | SHAPE |
| FSM (XState) | 3 | DELIVER |
| TDD Test Suite | 4 | TEST |
| Pointer Lifecycle | 5 | DEFEND |
| Record/Replay Store | 6 | STORE |
| Phase Coordinator | 7 | DECIDE |

### 3.3 Example: Design a Contract

```typescript
import { runHIVECycle } from './src/orchestration/langgraph.hive.js';
import { emitHuntSignal, emitInterlockSignal } from './sandbox/src/swarm/index.js';

// Emit signal to blackboard
emitHuntSignal('Starting GestureFrame contract design');

// Run HIVE cycle
const result = await runHIVECycle(`
Design a GestureFrame contract for MediaPipe hand tracking.

Requirements (from REF__W3C_GESTURE_CONTROL_PLANE_GOLD_BATON.md):
- ts: number (timestamp)
- handId: 'left' | 'right'
- trackingOk: boolean
- palmFacing: boolean (cone gate)
- label: GestureLabel ('Open_Palm' | 'Pointing_Up' | 'Victory' | etc.)
- conf: number (0..1)
- indexTip: { x: number; y: number }

Output a Zod schema with validation.
`);

// Emit result
emitInterlockSignal('GestureFrame contract defined: ' + result.interlockResults[0]?.substring(0, 100));

console.log(result.output);
```

---

## 4. Testing (TEST)

### 4.1 Contract Testing (CDD)

All contracts use Zod for runtime validation:

```typescript
import { z } from 'zod';

export const GestureLabel = z.enum([
  'Open_Palm',
  'Pointing_Up', 
  'Victory',
  'Thumb_Up',
  'Thumb_Down',
  'None'
]);

export const GestureFrame = z.object({
  ts: z.number(),
  handId: z.enum(['left', 'right']),
  trackingOk: z.boolean(),
  palmFacing: z.boolean(),
  label: GestureLabel,
  conf: z.number().min(0).max(1),
  indexTip: z.object({
    x: z.number(),
    y: z.number(),
  }),
});
```

### 4.2 Property Testing (fast-check)

```typescript
import * as fc from 'fast-check';
import { GestureFrame } from './contracts';

fc.assert(
  fc.property(
    fc.record({
      ts: fc.nat(),
      handId: fc.oneof(fc.constant('left'), fc.constant('right')),
      trackingOk: fc.boolean(),
      palmFacing: fc.boolean(),
      label: fc.oneof(...GestureLabel.options.map(fc.constant)),
      conf: fc.double({ min: 0, max: 1 }),
      indexTip: fc.record({ x: fc.double(), y: fc.double() }),
    }),
    (frame) => GestureFrame.safeParse(frame).success
  ),
  { numRuns: 100 }
);
```

---

## 5. Contracts (DEFEND)

### 5.1 Signal Contract

```typescript
import { z } from 'zod';

export const SignalSchema = z.object({
  ts: z.string().datetime(),
  mark: z.number().min(0).max(1),
  pull: z.enum(['upstream', 'downstream', 'lateral']),
  msg: z.string().min(1),
  type: z.enum(['signal', 'event', 'error', 'metric']),
  hive: z.enum(['H', 'I', 'V', 'E', 'X']),
  gen: z.number().int().min(87),
  port: z.number().int().min(0).max(7),
});
```

### 5.2 HIVE State Contract

```typescript
export const HIVEStateSchema = z.object({
  phase: z.enum(['H', 'I', 'V', 'E']),
  cycle: z.number().int().min(0),
  huntResults: z.array(z.string()),
  interlockResults: z.array(z.string()),
  validateResults: z.array(z.string()),
  evolveResults: z.array(z.string()),
  task: z.string(),
  output: z.string(),
});
```

---

## 6. Examples (STORE)

### 6.1 Simple LLM Query

```typescript
import { askLLM } from './sandbox/src/swarm/index.js';

const answer = await askLLM('What is the HIVE/8 workflow?', 7);
console.log(answer);
```

### 6.2 Memory Bank Search + LLM

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { askLLM } from './sandbox/src/swarm/index.js';

const execAsync = promisify(exec);

// Search memory bank
const { stdout } = await execAsync(
  'python ../portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/tools/search.py "gesture control"'
);

// Ask LLM to summarize
const summary = await askLLM(`
Summarize these memory bank search results:
${stdout}

Focus on W3C Gesture Control Plane exemplars.
`, 7);

console.log(summary);
```

### 6.3 Full HIVE Cycle with Signals

```typescript
import { runTask, emitHuntSignal, emitEvolveSignal } from './sandbox/src/swarm/index.js';

emitHuntSignal('Starting: Design pointer lifecycle contract');

const result = await runTask(`
Design a PointerStream contract for W3C Pointer Events.

Requirements:
- move: { t: 'move', pointerId, x, y, pointerType, buttons }
- down: { t: 'down', pointerId, x, y, button, buttons }
- up: { t: 'up', pointerId, x, y, button, buttons }
- cancel: { t: 'cancel', pointerId }

Output Zod schema with discriminated union.
`);

emitEvolveSignal('Completed: PointerStream contract ready');

console.log(result.output);
```

---

## 7. Mission Context (DECIDE)

### 7.1 W3C Gesture Control Plane

**Goal**: Build a universal gesture input adapter:
```
MediaPipe → Physics (Rapier/1€) → FSM (XState) → W3C Pointer → TargetAdapter → ANY TARGET
```

**Target adapters**:
| Target | Stars | Input API | Complexity |
|--------|-------|-----------|------------|
| DOM dispatchEvent | - | Standard | Very Low |
| tldraw | 15K | DOM renderer | Very Low |
| Excalidraw | 54K | onPointerDown/Up | Low |
| daedalOS | 12K | Window manager | Medium |
| v86 | 19K | bus.send('mouse-delta') | Medium |
| EmulatorJS | - | EJS_defaultControls | Medium |

**Hexagonal CDD principle**: Ports define WHAT (Zod contracts), Adapters define HOW (implementations).

### 7.2 Gold Baton Sources

| Document | Source | Purpose |
|----------|--------|---------|
| `REF__W3C_GESTURE_CONTROL_PLANE_GOLD_BATON.md` | Memory Bank Gen83 | Mission spec |
| `GEN83.2_ENRICHED_GOLD_BATON_QUINE.md` | Memory Bank Gen83 | HFO architecture |
| `1.0_card_08_gestural_gateway.md` | Memory Bank Gen82 | Gesture Gateway card |

### 7.3 Next Steps

1. **Define contracts**: GestureFrame, PointerStream (Zod schemas)
2. **Implement FSM**: XState machine for gesture → pointer translation
3. **Build adapters**: DOM, Excalidraw, tldraw, emulators
4. **Test**: TDD with record/replay determinism

---

## The Mantra

> **"The spider weaves the web that weaves the spider."**

*Gen87.X3 | Swarm Orchestration Guide | 2025-12-30*
