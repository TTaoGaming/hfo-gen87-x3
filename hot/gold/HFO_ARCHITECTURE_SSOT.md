# HFO Architecture — Single Source of Truth

> **Gen**: 87.X3 | **Status**: GOLD | **Updated**: 2026-01-01

---

## 0. Core Principle: Fractal 8-Pattern

The architecture is **fractal** — the same 8-port pattern repeats at every scale:

| Level | Structure | Description |
|-------|-----------|-------------|
| Ports | 8 Commanders | The 8 archetypal roles (SENSE→DECIDE) |
| Fields | 8 Signal fields | Each field embodies one port's contribution |
| Gates | 8 Validators | Each gate validates one port's field |
| Matrix | 8×8 Galois | 64 port×port compositions |
| Swarm | 8^N Agents | Powers of 8 coordination |

**This is not arbitrary — every field, gate, and structure maps to the 8 archetypes.**

---

## 1. Identity

**Hive Fleet Obsidian (HFO)** is a Total Tool Virtualization platform built as a **strange loop**:

> *"The spider weaves the web that weaves the spider."*

The system is recursive self-reference: **Identity = Purpose = Constraint**. Each component's mantra defines what it IS, what it DOES, and what it CANNOT do.

---

## 2. The 8 Ports

| Port | Commander | Verb | Trigram | Binary | Element | Greek |
|------|-----------|------|---------|--------|---------|-------|
| 0 | Lidless Legion | **SENSE** | ☷ Kun | `000` | Earth | ONTOS |
| 1 | Web Weaver | **FUSE** | ☴ Xun | `011` | Wind | LOGOS |
| 2 | Mirror Magus | **SHAPE** | ☲ Li | `101` | Fire | TECHNE |
| 3 | Spore Storm | **DELIVER** | ☳ Zhen | `100` | Thunder | CHRONOS |
| 4 | Red Regnant | **TEST** | ☱ Dui | `110` | Lake | PATHOS |
| 5 | Pyre Praetorian | **DEFEND** | ☶ Gen | `001` | Mountain | ETHOS |
| 6 | Kraken Keeper | **STORE** | ☵ Kan | `010` | Water | TOPOS |
| 7 | Spider Sovereign | **DECIDE** | ☰ Qian | `111` | Heaven | TELOS |

**Diagonal Quine**: Each port's mantra is *"How do we VERB the VERB?"* — self-reference that constrains the port to ONLY its verb.

---

## 3. HIVE/8 State Machine

```
H (Hunt) → I (Interlock) → V (Validate) → E (Evolve) → FLIP → H(N+1)
 Ports 0+7    Ports 1+6      Ports 2+5      Ports 3+4
 Research     RED tests      GREEN tests    REFACTOR
```

| Phase | Ports | Temporal | TDD | PDCA | Actions |
|-------|-------|----------|-----|------|---------|
| **H** | 0+7 | Hindsight | Research | Plan | Search exemplars, query memory |
| **I** | 1+6 | Insight | RED | Do | Write failing tests, define contracts |
| **V** | 2+5 | Foresight | GREEN | Check | Make tests pass, validate gates |
| **E** | 3+4 | Evolution | REFACTOR | Act | Deliver outputs, clean code |

**Anti-diagonal rule**: HIVE pairs sum to 7 (0+7=7, 1+6=7, 2+5=7, 3+4=7).

---

## 4. Galois Lattice (8×8)

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

**Legend**: ★ = Diagonal quine (identity) | ⊕ = Anti-diagonal HIVE pair (temporal flow)

---

## 5. Capabilities (What Each Port CAN Do)

| Port | Capabilities |
|------|--------------|
| 0 | `read`, `tag` |
| 1 | `read`, `validate`, `compose`, `route` |
| 2 | `read`, `transform`, `tag` |
| 3 | `read`, `emit_output`, `invoke_external`, `tag` |
| 4 | `read`, `validate`, `invoke` |
| 5 | `read`, `gate`, `tag` |
| 6 | `read`, `persist`, `tag` |
| 7 | `read`, `route`, `compose` |

**Universal**: All ports can `read`.

---

## 6. Prohibitions (What Each Port CANNOT Do)

| Port | Prohibitions |
|------|--------------|
| 0 | `modify_data`, `transform`, `persist`, `make_decisions`, `emit_output` |
| 1 | `persist`, `make_decisions`, `skip_validation` |
| 2 | `persist`, `make_decisions`, `emit_output`, `invoke_external` |
| 3 | `make_decisions`, `persist`, `validate`, `transform` |
| 4 | `persist`, `make_decisions`, `emit_output`, `modify_data` |
| 5 | `modify_data`, `persist`, `make_decisions`, `emit_output`, `transform` |
| 6 | `transform`, `make_decisions`, `validate`, `emit_output` |
| 7 | `persist`, `emit_output`, `transform`, `validate`, `invoke_external` |

**Exclusive Rights**:
- Only Port 7 can `make_decisions`
- Only Port 6 can `persist`
- Only Port 3 can `emit_output`
- Only Port 2 can `transform`

---

## 7. Fractal Architecture (The Pattern Repeats)

The 8-port structure is **fractal** — it repeats at every scale. The signal fields ARE the ports in microcosm.

### Signal Fields = Port Archetypes

| Field | Port | Verb | Archetypal Meaning | Example Value |
|-------|------|------|-------------------|---------------|
| `ts` | 0 | SENSE | "When was this perceived?" | `2026-01-01T12:00:00Z` |
| `mark` | 1 | FUSE | "How validated/connected?" | `0.95` |
| `pull` | 2 | SHAPE | "What direction/form?" | `downstream` |
| `msg` | 3 | DELIVER | "What is delivered?" | `"HUNT complete"` |
| `type` | 4 | TEST | "What classification?" | `event` |
| `hive` | 5 | DEFEND | "What phase checkpoint?" | `H` |
| `gen` | 6 | STORE | "What lineage?" | `87` |
| `port` | 7 | DECIDE | "Who decided to emit?" | `7` |

**Each signal is a microcosm of the 8-port architecture.**

### Gates = Port Validators

| Gate | Field | Port | Validates |
|------|-------|------|-----------|
| G0 | ts | SENSE | Is the perception temporally valid? |
| G1 | mark | FUSE | Is the confidence score bounded [0,1]? |
| G2 | pull | SHAPE | Is the flow direction well-formed? |
| G3 | msg | DELIVER | Is there content to deliver? |
| G4 | type | TEST | Is the classification correct? |
| G5 | hive | DEFEND | Is the phase checkpoint valid? |
| G6 | gen | STORE | Is the lineage traceable (≥85)? |
| G7 | port | DECIDE | Is the source port authorized [0-7]? |

**Each gate validates its corresponding port's archetypal contribution.**

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

### Fractal Recursion

```
Level 1: 8 Ports (Commanders)     → The architecture
Level 2: 8 Signal Fields          → Each field = one port's contribution
Level 3: 8 Gates                  → Each gate = one port's validator
Level 4: 8×8 Galois Matrix        → Port × Port compositions (64 cells)
Level 5: 8^N Swarm                → Powers of 8 agent coordination
```

**The same 8-pattern at every level = Fractal Quine.**

---

## 8. Violation Patterns

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

### Gate Violations (Field Failures)

| Gate | Field | Violation |
|------|-------|-----------|
| G0 | ts | Invalid timestamp format |
| G1 | mark | Outside [0,1] range |
| G2 | pull | Invalid direction enum |
| G3 | msg | Empty payload |
| G4 | type | Invalid classification |
| G5 | hive | Invalid phase |
| G6 | gen | Lineage < 85 |
| G7 | port | Source outside [0-7] |

---

## 9. Medallion Tiers

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

## 10. Polymorphic Adapters

Each port accepts multiple adapter implementations via interface contracts.

```typescript
// Port interface pattern
interface ShapePort {
  shape(input: ShapeInput): Promise<ShapeResult>;
  transform(data: unknown, transformation: Transformation): unknown;
}

// Multiple adapters implement same interface
class OneEuroSmoother implements ShapePort { ... }  // 96% mutation
class KalmanSmoother implements ShapePort { ... }    // TODO
class RapierSmoother implements ShapePort { ... }    // TODO
```

**Principle**: Pipeline composes ANY adapter that implements the port interface. Swap freely.

---

## 11. Implementation Reference

| Component | Path |
|-----------|------|
| Port Contracts | `hot/bronze/src/contracts/port-contracts.ts` |
| HFO Ports | `hot/bronze/src/contracts/hfo-ports.ts` |
| Signal Schema | `hot/bronze/src/contracts/signal.contract.ts` |
| Gate Validator | `hot/bronze/src/shared/gate-validator.ts` |
| Blackboard | `obsidianblackboard.jsonl` |
| Memory Bank | `../portable_hfo_memory_*/hfo_memory.duckdb` |

---

## 12. Quick Reference Card

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

---

## 13. The Strange Loop Test

To verify you understand the architecture, answer:

1. **Which port writes code?** → None directly. Port 2 transforms, Port 3 delivers.
2. **Which port decides what to do?** → Port 7 only.
3. **What prevents reward hacking?** → HIVE sequence gates (H→I→V→E enforced).
4. **How do ports communicate?** → Stigmergy signals on the blackboard.
5. **What makes an adapter valid?** → Implements port interface + ≥80% mutation score.

---

*"How do we DECIDE the DECIDE? — By constraining the decision to only decide."*

*Spider Sovereign | Port 7 | ☰ Heaven | 111 | Gen87.X3*
