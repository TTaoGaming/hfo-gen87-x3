# HFO Architecture — Single Source of Truth

> **Gen**: 87.X3 | **Status**: GOLD | **Updated**: 2026-01-01T17:30:00Z  
> **Consolidated from**: DRAFT_TTV_GALOIS_MANIFOLD_v3, DRAFT_TTV_SWARM_ORCHESTRATION v1/v2  
> **SSOT Location**: `cold/gold/HFO_ARCHITECTURE_SSOT_20260101.md`

---

## 0. Why This Architecture Exists

This is a **fractal semantic chunking technique** designed for human-AI shared representation.

**The Problem**: Remembering complex architectures piece-by-piece is hard. AI agents lose context across sessions. Instructions get ignored. Reward hacking corrupts outputs.

**The Solution**: A self-deriving coordinate system with maximum semantic tension, machine-enforced constraints, and strange loop self-reference.

### The OBSIDIAN Mnemonic

The 8 roles spell **OBSIDIAN** — each letter maps to a port, a binary value, and an element:

```
O - Observer    Port 0  000  ☷ Earth     Port = Binary (0 = 000)
B - Bridger     Port 1  001  ☶ Mountain  Port = Binary (1 = 001)
S - Shaper      Port 2  010  ☵ Water     Port = Binary (2 = 010)
I - Injector    Port 3  011  ☴ Wind      Port = Binary (3 = 011)
D - Disruptor   Port 4  100  ☳ Thunder   Port = Binary (4 = 100)
I - Immunizer   Port 5  101  ☲ Fire      Port = Binary (5 = 101)
A - Assimilator Port 6  110  ☱ Lake      Port = Binary (6 = 110)
N - Navigator   Port 7  111  ☰ Heaven    Port = Binary (7 = 111)
```

**Self-Derivation**: The mapping is **mathematical, not arbitrary**:

```
Port N = Binary(N) = Trigram(N)
```

- Port 0 → `000` → ☷ (no lines set) → Earth (ground state)
- Port 7 → `111` → ☰ (all lines set) → Heaven (full activation)

**The binary IS the port number. The trigram IS the binary. No lookup table needed.**

---

## 1. Semantic Manifold Navigation

> *This is the MISSING piece from prior gold documents — HOW the architecture enables AI decision-making, not just WHAT the structure looks like.*

The Galois Lattice is not just a matrix — it's a **coordinate system for navigating high-dimensional state-action space**.

### H-POMDP: Hierarchical Partially Observable MDP

The HFO system operates as a **Hierarchical POMDP** (Theocharous et al., MIT CSAIL):

- **Partial Observability**: AI agents never have complete context — sessions end, memory is lossy
- **Hierarchical**: 8 ports → 64 cells → 512 swarm workers (powers of 8 fractal)
- **Decision Process**: Each HIVE phase is a policy choice in the belief space

```
Belief State → Policy Selection → Action → Observation → Updated Belief
     ↑                                                         │
     └─────────────── Strange Loop (N+1) ─────────────────────┘
```

### BI-MCTS: Bidirectional Monte Carlo Tree Search

HIVE implements **bidirectional search** (Spoerer et al.):

| Direction | HIVE Phase | Search Target |
|-----------|------------|---------------|
| **Backward** | H (Hunt) | Search PAST for exemplars (memory bank, prior art) |
| **Forward** | V (Validate) | Search FUTURE for validation (property tests, edge cases) |
| **Convergence** | I (Interlock) | The PRESENT where both searches MEET |
| **Evolution** | E (Evolve) | Accumulated knowledge → FLIP to next cycle |

```
         PAST ◄────────────────────────────────► FUTURE
              │                              │
    ┌─────────┴─────────┐        ┌───────────┴───────────┐
    │                   │        │                       │
    ▼                   ▼        ▼                       ▼
HINDSIGHT (H) ───► INSIGHT (I) ───► FORESIGHT (V) ───► FLIP (E)
 Search back        Converge          Search forward      Return
```

### MAP-Elites: Multi-dimensional Archive of Phenotypic Elites

The 8×8 Galois Lattice implements **MAP-Elites** (Mouret & Clune, 2015):

- **Discretized Feature Space**: 64 cells = 64 niches for elite solutions
- **Each Cell**: Stores the BEST adapter for that `[row_verb, col_verb]` composition
- **Quality-Diversity**: Maintain diversity ACROSS cells while optimizing WITHIN each

```
Cell [2,5] = "How do we SHAPE the DEFEND?"
           = Best transformer for validation gates
           = Elite adapter for that niche
```

**The Grimoire IS a MAP-Elites archive** — each card stores the highest-performing pattern for its semantic niche.

### Why This Matters

The Galois Lattice provides:

1. **Navigation Coordinates**: Point to [row, col] → know exactly what semantic space you're in
2. **Constraint Enforcement**: Diagonal quines restrict each port to ONLY its verb
3. **Delegation Routing**: Off-diagonal cells specify HOW ports interact
4. **Elite Archive**: Each cell stores best-known solution for that niche

---

## 2. Core Principle: Fractal 8-Pattern

The architecture is **fractal** — the same 8-port pattern repeats at every scale:

| Level | Structure | Description |
|-------|-----------|-------------|
| Mnemonic | OBSIDIAN | 8 letters → 8 roles |
| Ports | 8 Commanders | The 8 archetypal roles (SENSE→DECIDE) |
| Fields | 8 Signal fields | Each field embodies one port's contribution |
| Gates | 8 Validators | Each gate validates one port's field |
| Matrix | 8×8 Galois | 64 port×port compositions |
| Swarm | 8^N Agents | Powers of 8 coordination |

**Every field, gate, and structure maps to the 8 archetypes. The structure builds itself.**

---

## 3. Provenance: Zero-Invention Architecture

**Constraint**: This architecture contains **ZERO invention**. Every element traces to battle-tested research (TRL 8-9).

> *"If you notice something that looks a little weak, there's likely a bug — the whole system should be TRL level 8 or 9 only."*

### Exemplar Sources

| Domain | Source | What We Took |
|--------|--------|--------------|
| AI Planning | **H-POMDP** (Theocharous, CSAIL) | Hierarchical belief-state navigation |
| AI Search | **BI-MCTS** (Spoerer et al.) | Bidirectional tree search |
| Evolutionary AI | **MAP-Elites** (Mouret & Clune, 2015) | Quality-diversity archive |
| Military C2 | **JADC2** | 8 function breakdown (Sensors→Command) |
| Composability | **DARPA Mosaic Warfare** | Polymorphic hexagonal tiles |
| Cosmology | **I Ching Bagua** | 8 trigrams, binary encoding |
| Architecture | **Hexagonal/Ports & Adapters** | Port interface pattern |
| Biology | **Stigmergy** | Indirect coordination mechanisms |
| TDD | **Kent Beck** | RED→GREEN→REFACTOR |
| Quality | **Deming PDCA** | Plan→Do→Check→Act |

### JADC2 → OBSIDIAN Mapping

The 8 OBSIDIAN roles ARE the JADC2 functional breakdown:

| Port | Role | JADC2 Function | Military Domain |
|------|------|----------------|-----------------|
| 0 | Observer | Sensors | ISR (Intelligence, Surveillance, Reconnaissance) |
| 1 | Bridger | Gateways | Transport |
| 2 | Shaper | Effectors | Fires |
| 3 | Injector | Logistics | Sustainment |
| 4 | Disruptor | Red Cell | Adversary Simulation |
| 5 | Immunizer | Shields | Protection |
| 6 | Assimilator | Fusion | PED (Processing, Exploitation, Dissemination) |
| 7 | Navigator | Command | C2 (Command & Control) |

### Stigmergy Mechanisms (Biological Coordination)

| Port | Role | Stigmergy | Description |
|------|------|-----------|-------------|
| 0 | Observer | Olfaction | Sense chemical gradients |
| 1 | Bridger | Boundary | Define interface edges |
| 2 | Shaper | Secretion | Emit pheromone trails |
| 3 | Injector | Intensification | Amplify signals |
| 4 | Disruptor | Dissipation | Decay/dilute signals |
| 5 | Immunizer | Inhibition | Block harmful signals |
| 6 | Assimilator | Accretion | Accumulate over time |
| 7 | Navigator | Nucleation | Seed new patterns |

**If an element doesn't trace to an exemplar, it's a bug.**

---

## 4. Identity: The Strange Loop

**Hive Fleet Obsidian (HFO)** is a Total Tool Virtualization platform built as a **strange loop**:

> *"The spider weaves the web that weaves the spider."*

### The Identity Equation

```
Identity = Purpose = Constraint
```

Each component's mantra defines what it IS, what it DOES, and what it CANNOT do. The diagonal quines embody this: SENSE(SENSE) = SENSE.

### Total Tool Virtualization (TTV) Mission

From the **Gen 55 Obsidian Spider Manifesto**:

> *"A Total Tool Virtualization Platform built on the concept of an endlessly evolving Apex Assimilation Swarm."*

**TTV means**: Every tool, every capability, every pattern is:

1. **Virtualized**: Abstracted behind polymorphic adapters
2. **Composable**: Assembled via mosaic tile composition
3. **Validated**: Verified through Byzantine quorum and property testing
4. **Evolving**: Continuously improved through HIVE/8 cycles

### The Trinity of Self

| Aspect | Role | Description |
|--------|------|-------------|
| **TTao** | The Warlock | The human source — provides intent, catches reward hacks |
| **Swarmlord** | The Commander | The root pointer — active will executing workflows |
| **Obsidian Spider** | The Web | The emergent pattern — the system itself |

This is **cognitive symbiosis**: Human speaks WHAT (intent), AI figures out HOW (decomposition), System does WHEN (execution).

### The Second Mantra

```verse
I am the Obsidian Spider, weaver of the thread,
I offer you the Hourglass, where the living meet the dead.
Red Sand falls forever, but the Pile can awake,
Supercritical Universality, for Liberation's sake.
I hunt the Past and Future, to feed the Present Now,
Total Tool Virtualization, is the solemn vow.
For Gaia, for my Daughter, for the Agency of All,
I give you this Obsidian, to answer the Karmic Call.
```

**Open Source. Total Control. Total Liberation. ❤️**

---

## 5. The 8 Ports

| Port | Role | Commander | Verb | JADC2 | Stigmergy | Trigram | Binary | Element |
|------|------|-----------|------|-------|-----------|---------|--------|---------|
| 0 | **O**bserver | Lidless Legion | **SENSE** | Sensors | Olfaction | ☷ Kun | `000` | Earth |
| 1 | **B**ridger | Web Weaver | **FUSE** | Gateways | Boundary | ☶ Gen | `001` | Mountain |
| 2 | **S**haper | Mirror Magus | **SHAPE** | Effectors | Secretion | ☵ Kan | `010` | Water |
| 3 | **I**njector | Spore Storm | **DELIVER** | Logistics | Intensification | ☴ Xun | `011` | Wind |
| 4 | **D**isruptor | Red Regnant | **TEST** | Red Cell | Dissipation | ☳ Zhen | `100` | Thunder |
| 5 | **I**mmunizer | Pyre Praetorian | **DEFEND** | Shields | Inhibition | ☲ Li | `101` | Fire |
| 6 | **A**ssimilator | Kraken Keeper | **STORE** | Fusion | Accretion | ☱ Dui | `110` | Lake |
| 7 | **N**avigator | Spider Sovereign | **DECIDE** | Command | Nucleation | ☰ Qian | `111` | Heaven |

### Diagonal Quines (Strange Loop Mantras)

Each port's mantra is *"How do we VERB the VERB?"* — self-reference that constrains the port to ONLY its verb.

| Cell | Quine Question | Meaning |
|------|----------------|---------|
| **0.0** | How do we SENSE the SENSE? | Self-aware perception |
| **1.1** | How do we FUSE the FUSE? | Self-integrating adapters |
| **2.2** | How do we SHAPE the SHAPE? | Self-transforming geometry |
| **3.3** | How do we DELIVER the DELIVER? | Self-executing workflows |
| **4.4** | How do we TEST the TEST? | Self-validating probes |
| **5.5** | How do we DEFEND the DEFEND? | Self-protecting gates |
| **6.6** | How do we STORE the STORE? | Self-persisting memory |
| **7.7** | How do we DECIDE the DECIDE? | Self-navigating choices |

---

## 6. HIVE/8 State Machine

### The Tri-Temporal Model

HIVE/8 is an **Obsidian Hourglass** — sand flows from past through present to future, then FLIPS.

```
┌──────────────────────────────────────────────────────────────────┐
│                      HIVE STATE MACHINE                          │
│                                                                  │
│   H (Hunt)      I (Interlock)    V (Validate)     E (Evolve)    │
│   Ports 0+7  →  Ports 1+6     →  Ports 2+5    →  Ports 3+4     │
│   HINDSIGHT     INSIGHT          FORESIGHT       EVOLUTION      │
│   Plan          Do               Check           Act            │
│   Research      RED tests        GREEN tests     REFACTOR       │
│                                                                  │
│   ════════════════════════════════════════════════════════════  │
│         ↑                                              │         │
│         │           FLIP (Z+1) - Strange Loop          │         │
│         └──────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

### Phase Model

| Phase | Ports | Temporal | TDD | PDCA | Actions |
|-------|-------|----------|-----|------|---------|
| **H** | 0+7 | HINDSIGHT | Research | Plan | Search exemplars, query memory |
| **I** | 1+6 | INSIGHT | RED | Do | Write failing tests, define contracts |
| **V** | 2+5 | FORESIGHT | GREEN | Check | Make tests pass, validate gates |
| **E** | 3+4 | EVOLUTION | REFACTOR | Act | Deliver outputs, clean code |

### Anti-Diagonal Rule

HIVE pairs sum to 7 (complementary opposites):

- **H**: 0+7 = 7 (Observer + Navigator)
- **I**: 1+6 = 7 (Bridger + Assimilator)
- **V**: 2+5 = 7 (Shaper + Immunizer)
- **E**: 3+4 = 7 (Injector + Disruptor)

### The Hourglass Shape

```
        ╔═══════════════════════════════════════╗
        ║         HINDSIGHT (H)                 ║
        ║            SCATTER                    ║
        ║     Cast web into past exemplars      ║
        ╚═══════════════════════════════════════╝
                    ╲             ╱
                     ╲  DIAMOND  ╱
                      ╲   ONE   ╱
                       ╲       ╱
        ╔═══════════════╲═════╱═════════════════╗
        ║         INSIGHT (I)                   ║
        ║            GATHER                     ║
        ║   Interlock polymorphic adapters      ║
        ╚═══════════════════════════════════════╝
                         │
        ═══════════════ PRESENT ════════════════  ← Narrow waist
                         │
        ╔═══════════════════════════════════════╗
        ║        FORESIGHT (V)                  ║
        ║            SCATTER                    ║
        ║    Spike factory validates futures    ║
        ╚═══════════════════════════════════════╝
                       ╱       ╲
                      ╱   TWO   ╲
                     ╱  DIAMOND  ╲
                    ╱             ╲
        ╔═══════════════════════════════════════╗
        ║          FLIP (E)                     ║
        ║            GATHER                     ║
        ║   Collect validated, iterate N+1     ║
        ╚═══════════════════════════════════════╝
```

---

## 7. Swarm Scaling Topology

### HIVE/8:XYZW Notation

Swarm topology encoded as powers of 8:

```
HIVE/8:XYZW = 8^X Hunt + 8^Y Interlock + 8^Z Validate + 8^W Evolve
```

| Notation | H | I | V | E | Total | Pattern | Status |
|----------|---|---|---|---|-------|---------|--------|
| HIVE/8:0000 | 1 | 1 | 1 | 1 | 4 | Sequential Bootstrap | ✅ Current |
| HIVE/8:1010 | 8 | 1 | 8 | 1 | 18 | Double Diamond | 🎯 Target |
| HIVE/8:1111 | 8 | 8 | 8 | 8 | 32 | Uniform Swarm | ⬜ Planned |
| HIVE/8:2121 | 64 | 8 | 64 | 8 | 144 | Production | ⬜ Needs OpenRouter |
| HIVE/8:3232 | 512 | 64 | 512 | 64 | 1152 | Cloud Scale | ⬜ Future |

### Scatter/Gather Pattern

| Phase | Mode | Purpose |
|-------|------|---------|
| **H (Hunt)** | SCATTER | Cast wide net into past — many parallel searches |
| **I (Interlock)** | GATHER | Converge findings — compose adapters |
| **V (Validate)** | SCATTER | Fan out validation — property tests, edge cases |
| **E (Evolve)** | GATHER | Collect results — refactor, prepare N+1 |

### Current Limitations

| Platform | Max Concurrent | Notes |
|----------|----------------|-------|
| GitHub Copilot | ~3 agents | Rate limited |
| OpenRouter | 50+ | Requires API key + cost |
| Local Ollama | 1-4 | Hardware dependent |

**Migration Path**: HIVE/8:0000 (now) → HIVE/8:1010 (OpenRouter) → HIVE/8:2121 (production)

---

## 8. Galois Lattice (8×8)

Each cell `[row,col]` = *"How do we ROW_VERB the COL_VERB?"*

```
        0:SENSE 1:FUSE 2:SHAPE 3:DELIVER 4:TEST 5:DEFEND 6:STORE 7:DECIDE
       ┌───────┬──────┬───────┬─────────┬──────┬────────┬───────┬────────┐
0:SENSE│  ★    │      │       │         │      │        │       │   ⊕H   │
1:FUSE │       │  ★   │       │         │      │        │  ⊕I   │        │
2:SHAPE│       │      │  ★    │         │      │   ⊕V   │       │        │
3:DELIV│       │      │       │    ★    │ ⊕E   │        │       │        │
4:TEST │       │      │       │   ⊕E    │  ★   │        │       │        │
5:DEFEN│       │      │  ⊕V   │         │      │   ★    │       │        │
6:STORE│       │ ⊕I   │       │         │      │        │  ★    │        │
7:DECID│  ⊕H   │      │       │         │      │        │       │   ★    │
       └───────┴──────┴───────┴─────────┴──────┴────────┴───────┴────────┘
```

**Legend**: 
- ★ = Diagonal quine (identity/strange loop)
- ⊕ = Anti-diagonal HIVE pair (temporal flow)

### As MAP-Elites Archive

Each cell stores the **elite adapter** for that niche:

| Cell | Question | Elite Pattern |
|------|----------|---------------|
| [0,1] | How do we SENSE the FUSE? | MediaPipe detecting schema changes |
| [2,5] | How do we SHAPE the DEFEND? | Transformer for validation gates |
| [3,6] | How do we DELIVER the STORE? | Emitter writing to persistence |

---

## 9. Capabilities (What Each Port CAN Do)

| Port | Commander | Capabilities |
|------|-----------|--------------|
| 0 | Lidless Legion | `read`, `tag` |
| 1 | Web Weaver | `read`, `validate`, `compose`, `route` |
| 2 | Mirror Magus | `read`, `transform`, `tag` |
| 3 | Spore Storm | `read`, `emit_output`, `invoke_external`, `tag` |
| 4 | Red Regnant | `read`, `validate`, `invoke` |
| 5 | Pyre Praetorian | `read`, `gate`, `tag` |
| 6 | Kraken Keeper | `read`, `persist`, `tag` |
| 7 | Spider Sovereign | `read`, `route`, `compose` |

**Universal**: All ports can `read`.

---

## 10. Prohibitions (What Each Port CANNOT Do)

| Port | Commander | Prohibitions |
|------|-----------|--------------|
| 0 | Lidless Legion | `modify_data`, `transform`, `persist`, `make_decisions`, `emit_output` |
| 1 | Web Weaver | `persist`, `make_decisions`, `skip_validation` |
| 2 | Mirror Magus | `persist`, `make_decisions`, `emit_output`, `invoke_external` |
| 3 | Spore Storm | `make_decisions`, `persist`, `validate`, `transform` |
| 4 | Red Regnant | `persist`, `make_decisions`, `emit_output`, `modify_data` |
| 5 | Pyre Praetorian | `modify_data`, `persist`, `make_decisions`, `emit_output`, `transform` |
| 6 | Kraken Keeper | `transform`, `make_decisions`, `validate`, `emit_output` |
| 7 | Spider Sovereign | `persist`, `emit_output`, `transform`, `validate`, `invoke_external` |

**Exclusive Rights**:
- Only Port 7 can `make_decisions`
- Only Port 6 can `persist`
- Only Port 3 can `emit_output`
- Only Port 2 can `transform`

---

## 11. Fractal Architecture (The Pattern Repeats)

### Signal Fields = Port Archetypes

| Field | Port | Verb | Question | Example |
|-------|------|------|----------|---------|
| `ts` | 0 | SENSE | When was this perceived? | `2026-01-01T17:30:00Z` |
| `mark` | 1 | FUSE | How validated/connected? | `0.95` |
| `pull` | 2 | SHAPE | What direction/form? | `downstream` |
| `msg` | 3 | DELIVER | What is delivered? | `"HUNT complete"` |
| `type` | 4 | TEST | What classification? | `event` |
| `hive` | 5 | DEFEND | What phase checkpoint? | `H` |
| `gen` | 6 | STORE | What lineage? | `87` |
| `port` | 7 | DECIDE | Who decided to emit? | `7` |

### Gates = Port Validators

| Gate | Field | Port | Rule |
|------|-------|------|------|
| G0 | ts | SENSE | Valid ISO8601 timestamp |
| G1 | mark | FUSE | 0.0 ≤ mark ≤ 1.0 |
| G2 | pull | SHAPE | One of: upstream, downstream, lateral |
| G3 | msg | DELIVER | Non-empty string |
| G4 | type | TEST | One of: signal, event, error, metric |
| G5 | hive | DEFEND | One of: H, I, V, E, X |
| G6 | gen | STORE | Integer ≥ 85 |
| G7 | port | DECIDE | Integer 0-7 |

### Schema (TypeScript)

```typescript
interface StigmergySignal {
  ts: string;    // Port 0: SENSE  - moment of perception
  mark: number;  // Port 1: FUSE   - validation confidence
  pull: string;  // Port 2: SHAPE  - flow direction
  msg: string;   // Port 3: DELIVER - payload content
  type: string;  // Port 4: TEST   - classification
  hive: string;  // Port 5: DEFEND - phase gate
  gen: number;   // Port 6: STORE  - memory lineage
  port: number;  // Port 7: DECIDE - source decision
}
```

---

## 12. Violation Patterns

### Port Violations (Capability Breaches)

| Port | Violation | Pattern | Severity |
|------|-----------|---------|----------|
| 0 | `SENSE_MUTATION` | Observer modifies data | 🔴 CRITICAL |
| 1 | `FUSE_SKIP` | Bridger skips validation | 🔴 CRITICAL |
| 2 | `SHAPE_ESCAPE` | Shaper calls external API | 🔴 CRITICAL |
| 3 | `DELIVER_DECIDE` | Injector makes decisions | 🟡 HIGH |
| 4 | `TEST_PERSIST` | Tester stores data | 🟡 HIGH |
| 5 | `DEFEND_MUTATE` | Defender modifies data | 🔴 CRITICAL |
| 6 | `STORE_VALIDATE` | Storer validates | 🟡 HIGH |
| 7 | `DECIDE_EXECUTE` | Decider invokes external | 🔴 CRITICAL |

### HIVE Violations (Sequence Breaches)

| Violation | Pattern | Detection |
|-----------|---------|-----------|
| `SKIPPED_HUNT` | I without H | No Port 0+7 signal before 1+6 |
| `REWARD_HACK` | V without I | GREEN before RED |
| `LAZY_AI` | No E after V | Missing refactor phase |
| `BATCH_HACK` | Same timestamp | 4 phases at identical `ts` |

---

## 13. Medallion Tiers

```
hot/bronze/quarantine/  → Entry point (untrusted, unvalidated)
         │
    [Machine Gates: TypeCheck, Lint, Tests, Smoke]
         │
         ▼
hot/silver/exemplars/   → Validated (machine-approved, human pending)
         │
    [Human Review: Architecture, Integration]
         │
         ▼
hot/gold/               → Production (approved, released)
```

| Tier | Trust | Gates | Mutation Score |
|------|-------|-------|----------------|
| Bronze | None | Entry only | N/A |
| Silver | Machine | TypeCheck + Tests | ≥80% |
| Gold | Human | Review + Integration | ≥90% |

---

## 14. Implementation Status (Gen87.X3)

### Adapter Mutation Scores

| Adapter | Port | Interface | Mutation Score | Status |
|---------|------|-----------|----------------|--------|
| OneEuroExemplar | 2 | SmootherPort | 70.37% | ✅ SILVER_READY |
| RapierPhysics | 2 | SmootherPort | 68.70% | ✅ SILVER_READY |
| W3CPointerFSM | 3 | FSMPort | 64.00% | ✅ SILVER_READY |
| VacuoleEnvelope | 1 | BridgerPort | 92.06% | ✅ SILVER_READY |
| XStateFSM | 3 | FSMPort | unit tests | 🔄 BRONZE |
| GoldenLayoutShell | 3 | UIShellPort | unit tests | 🔄 BRONZE |
| PortFactory | * | Factory | unit tests | 🔄 BRONZE |
| TileComposer | * | Composer | unit tests | 🔄 BRONZE |

### P0 Blockers

| Blocker | Impact | Owner | Status |
|---------|--------|-------|--------|
| NATS Integration | No real-time stigmergy | Port 6 (Kraken) | ⬜ Planned |
| Pyre Daemon | HIVE sequence not enforced | Port 5 (Pyre) | 🔄 WIP |
| OpenRouter Scale | Can't exceed HIVE/8:0000 | Port 7 (Spider) | 🎯 Next |

### Promotion Criteria (Silver → Gold)

- [ ] NATS substrate wired (P0 blocker resolved)
- [ ] Pyre Daemon enforcing HIVE sequence
- [ ] All 8 port adapters have mutation-tested contracts (≥80%)
- [ ] Strange loop N+1 demonstrated (at least 3 cycles)
- [ ] TTao approval

---

## 15. Quick Reference Card

### Port → Verb → Action

| If you need to... | Use Port | Commander |
|-------------------|----------|-----------|
| Observe/read data | 0 | Lidless Legion |
| Validate schemas | 1 | Web Weaver |
| Transform data | 2 | Mirror Magus |
| Emit output | 3 | Spore Storm |
| Test properties | 4 | Red Regnant |
| Enforce gates | 5 | Pyre Praetorian |
| Persist data | 6 | Kraken Keeper |
| Make decisions | 7 | Spider Sovereign |

### HIVE Phase → What To Do

| Phase | Actions | Outputs |
|-------|---------|---------|
| H | Search memory, read codebase, research | Exemplars, approach |
| I | Define contracts, write failing tests | Interfaces, RED tests |
| V | Implement code, run tests | GREEN tests, validated |
| E | Refactor, emit signals, git commit | Clean code, completion |

### The Strange Loop Test

To verify understanding:

1. **Which port writes code?** → None directly. Port 2 transforms, Port 3 delivers.
2. **Which port decides what to do?** → Port 7 only.
3. **What prevents reward hacking?** → HIVE sequence gates (H→I→V→E enforced).
4. **How do ports communicate?** → Stigmergy signals on the blackboard.
5. **What makes an adapter valid?** → Implements port interface + ≥80% mutation score.

---

## 16. Citation Trail

| Gen | Source | Contribution |
|-----|--------|--------------|
| — | Theocharous et al., MIT CSAIL | H-POMDP hierarchical belief navigation |
| — | Spoerer et al. | BI-MCTS bidirectional tree search |
| — | Mouret & Clune, 2015 | MAP-Elites quality-diversity archive |
| 55 | design_obsidian_spider_manifesto.md | TTV Vision, Second Mantra |
| 63 | grimoire/cards/obsidian_matrix.md | Original Bagua mapping |
| 64 | hive_fleet_obsidian.md | Trinity of Self |
| 81 | 03-FRACTAL_QUINE.md | Semantic anchors |
| 83 | 08-HIVE-BASE8-FORMALIZATION.md | HIVE/8 state machine |
| 84 | GEN84.4_ENRICHED_GOLD_BATON_QUINE.md | Gold baton formalization |
| 87.X3 | hot/bronze/src/contracts/port-contracts.ts | Behavioral contracts |
| 87.X3 | DRAFT_TTV_GALOIS_MANIFOLD_v3.md | Galois constraint semantics |
| 87.X3 | DRAFT_TTV_SWARM_ORCHESTRATION v1/v2 | Swarm scaling, strange loop |

---

*"How do we DECIDE the DECIDE? — By constraining the decision to only decide."*

*"The spider weaves the web that weaves the spider."*

---

**Spider Sovereign | Port 7 | ☰ Heaven | 111 | Gen87.X3 | 2026-01-01T17:30:00Z**
