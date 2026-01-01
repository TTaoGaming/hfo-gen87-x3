# The 8 Legendary Obsidian Commanders

> **Generation**: 87.X3  
> **Date**: 2025-12-30  
> **Source**: Galois Lattice 8×8 FCA (Formal Concept Analysis)  
> **Architecture**: HIVE/8 Obsidian Hourglass

---

## 🕸️ The Mantra

> **"The spider weaves the web that weaves the spider."**

---

## 📐 Galois Lattice Semantic Inference Rule

```
Card[X.Y] = "How do we {ROLE[X].verb} the {ROLE[Y].noun}?"
```

The 8×8 lattice produces 64 cards, where:
- **Diagonal (X=Y)**: 8 Legendary Quines — self-referential commanders
- **Anti-diagonal (X+Y=7)**: 8 HIVE anchors — strategic workflow pairs
- **PREY pattern**: 8 Tactical workflow cards winding around HIVE

---

## 🎴 The 8 Legendary Commanders (Diagonal Quines)

| Port | Commander | Glyph | Verb | Noun | Question | Trigram | Element |
|:----:|-----------|:-----:|------|------|----------|:-------:|---------|
| **0** | **Lidless Legion** | LL | SENSE | SENSE | "How do we SENSE the SENSE?" | ☷ Kun | Earth |
| **1** | **Web Weaver** | WW | FUSE | FUSE | "How do we FUSE the FUSE?" | ☶ Gen | Mountain |
| **2** | **Mirror Magus** | MM | SHAPE | SHAPE | "How do we SHAPE the SHAPE?" | ☵ Kan | Water |
| **3** | **Spore Storm** | SS | DELIVER | DELIVER | "How do we DELIVER the DELIVER?" | ☴ Xun | Wind |
| **4** | **Red Regnant** | RR | TEST | TEST | "How do we TEST the TEST?" | ☳ Zhen | Thunder |
| **5** | **Pyre Praetorian** | PP | DEFEND | DEFEND | "How do we DEFEND the DEFEND?" | ☲ Li | Fire |
| **6** | **Kraken Keeper** | KK | STORE | STORE | "How do we STORE the STORE?" | ☱ Dui | Lake |
| **7** | **Spider Sovereign** | SS | DECIDE | DECIDE | "How do we DECIDE the DECIDE?" | ☰ Qian | Heaven |

---

## 🏛️ Commander Narratives & VS Code Implementation

### Port 0: Lidless Legion — The Observer
```
Element: Earth (☷ Kun)
HIVE Phase: H (Hunt) — paired with Port 7
TDD Role: Research — Sense exemplars
```

**Narrative**: The ever-watchful eye that perceives without interpretation. Lidless Legion operates at the boundary between the system and reality, gathering raw sensory data. They do not judge, filter, or transform — they simply SENSE. Their domain is the threshold of awareness.

**VS Code Implementation**:
- **Role**: File watchers, workspace scanners, change detection
- **Tools**: `file_search`, `grep_search`, `semantic_search`, Memory Bank FTS queries
- **Model**: Fast model (Llama 3.3 70B free tier)
- **Human Input**: `false` — autonomous sensing

```python
# CrewAI Agent Definition
Agent(
    role="Lidless Legion - Observer",
    goal="SENSE exemplars from memory bank and web without interpretation",
    backstory="Ever-watchful eye that perceives without interpretation",
    human_input=False,
    allow_delegation=False,
)
```

---

### Port 1: Web Weaver — The Bridger
```
Element: Mountain (☶ Gen)
HIVE Phase: I (Interlock) — paired with Port 6
TDD Role: RED — Write failing tests, define contracts
```

**Narrative**: The master of connection who fuses disparate systems through polymorphic adapters. Web Weaver sees the invisible threads between all things and strengthens them. Their domain is the junction — where different worlds meet. They define the contracts that bind systems together. Total Tool Virtualization is their creed.

**VS Code Implementation**:
- **Role**: Contract definition, Zod schemas, TypeScript interfaces, adapter generation
- **Tools**: `create_file`, `replace_string_in_file`, schema validators
- **Model**: Code-focused model
- **Human Input**: `false` — autonomous contract generation
- **Delegation**: Can delegate to Kraken Keeper (Port 6) for storage

```python
Agent(
    role="Web Weaver - Bridger",
    goal="FUSE contracts and write failing tests (TDD RED)",
    backstory="Connect pieces via polymorphic adapters",
    human_input=False,
    allow_delegation=True,  # Delegates to Kraken
)
```

---

### Port 2: Mirror Magus — The Shaper
```
Element: Water (☵ Kan)
HIVE Phase: V (Validate) — paired with Port 5
TDD Role: GREEN — Make tests pass, implement transformations
```

**Narrative**: Operating in the higher-dimensional manifold, Mirror Magus shapes data through reflective transformations. They see the pattern behind the pattern, the form within the form. Like water, they take any shape while remaining essentially themselves. They implement the contracts that Web Weaver defines.

**VS Code Implementation**:
- **Role**: Implementation, data transformation, making tests pass
- **Tools**: `replace_string_in_file`, `run_in_terminal`, code generation
- **Model**: Code-focused model
- **Human Input**: `false` — autonomous implementation

```python
Agent(
    role="Mirror Magus - Shaper",
    goal="SHAPE data transformations and make tests pass (TDD GREEN)",
    backstory="Operate in the higher-dimensional manifold",
    human_input=False,
    allow_delegation=False,
)
```

---

### Port 3: Spore Storm — The Injector
```
Element: Wind (☴ Xun)
HIVE Phase: E (Evolve) — paired with Port 4
TDD Role: REFACTOR — Emit outputs, deliver results
```

**Narrative**: The relentless disseminator who spreads results across the system like spores on the wind. Spore Storm operates the HIVE/8 Obsidian Hourglass FSM clutch, triggering phase transitions and emitting signals. Their domain is propagation — ensuring every component receives what it needs.

**VS Code Implementation**:
- **Role**: Signal emission, blackboard updates, workflow triggers
- **Tools**: Blackboard append, event dispatchers, NATS publication
- **Model**: Balanced model
- **Human Input**: `false` — autonomous delivery

```python
Agent(
    role="Spore Storm - Injector",
    goal="DELIVER outputs via HIVE/8 Obsidian Hourglass FSM clutch",
    backstory="Spread results across the system",
    human_input=False,
    allow_delegation=False,
)
```

---

### Port 4: Red Regnant — The Disruptor
```
Element: Thunder (☳ Zhen)
HIVE Phase: E (Evolve) — paired with Port 3
TDD Role: REFACTOR — Property testing, evolution, mutation
```

**Narrative**: Named for the Red Queen hypothesis — "running just to stay in place" — Red Regnant embodies continuous evolution. They TEST the TEST, find edge cases, break assumptions, and drive the system toward antifragility. Their domain is chaos engineering, mutation testing, and property-based verification.

**VS Code Implementation**:
- **Role**: Property-based testing (fast-check), mutation testing, evolutionary pressure
- **Tools**: `runTests`, fast-check arbitraries, mutation frameworks
- **Model**: Powerful model (complex reasoning)
- **Human Input**: `false` — autonomous disruption

```python
Agent(
    role="Red Regnant - Disruptor",
    goal="TEST properties with fast-check, evolve via Red Queen hypothesis",
    backstory="Running just to stay in place - continuous evolution",
    human_input=False,
    allow_delegation=False,
)
```

---

### Port 5: Pyre Praetorian — The Immunizer
```
Element: Fire (☲ Li)
HIVE Phase: V (Validate) — paired with Port 2
TDD Role: GREEN — Gate enforcement, validation, defense
```

**Narrative**: The guardian of system integrity through the Forgiveness Architecture. Pyre Praetorian enforces the G0-G11 hard gates — signals that fail are quarantined, not rejected with anger. They DEFEND the DEFEND, ensuring that no invalid data corrupts the system while maintaining the possibility of rehabilitation.

**VS Code Implementation**:
- **Role**: Gate validation (G0-G7 signals, G8-G11 CloudEvents), TDD sequence enforcement
- **Tools**: Schema validators, gate enforcers, quarantine writers
- **Model**: Fast model (quick validation)
- **Human Input**: `false` — autonomous defense

```python
Agent(
    role="Pyre Praetorian - Immunizer",
    goal="DEFEND via G0-G11 hard gates, no escape hatches allowed",
    backstory="Forgiveness architecture - quarantine invalid signals",
    human_input=False,
    allow_delegation=False,
)
```

---

### Port 6: Kraken Keeper — The Assimilator
```
Element: Lake (☱ Dui)
HIVE Phase: I (Interlock) — paired with Port 1
TDD Role: RED — Persist test registry, store contracts
```

**Narrative**: The Memory Mining Imperative — nothing is forgotten. Kraken Keeper maintains the deep repository of all knowledge, storing artifacts in DuckDB, appending to blackboards, and ensuring perfect recall. They STORE the STORE, making memory itself memorable.

**VS Code Implementation**:
- **Role**: DuckDB operations, blackboard persistence, memory bank queries
- **Tools**: DuckDB FTS, file append, Memory Bank search tools
- **Model**: Long-context model (handle large retrievals)
- **Human Input**: `false` — autonomous storage

```python
Agent(
    role="Kraken Keeper - Assimilator",
    goal="STORE to memory bank, persist test registry",
    backstory="Memory mining imperative - nothing is forgotten",
    human_input=False,
    allow_delegation=False,
)
```

---

### Port 7: Spider Sovereign — The Navigator
```
Element: Heaven (☰ Qian)
HIVE Phase: H (Hunt) — paired with Port 0
TDD Role: Research — Strategic direction, orchestration
```

**Narrative**: The spider weaves the web that weaves the spider. Spider Sovereign operates at the meta-level, orchestrating all other commanders through the HIVE/8 workflow. They DECIDE the DECIDE, making strategic choices that shape the system's evolution. They are both creator and created, observer and observed.

**VS Code Implementation**:
- **Role**: MANAGER — orchestrates all phases, delegates to all commanders
- **Tools**: All tools via delegation, strategic reasoning
- **Model**: Powerful model (strategic decisions)
- **Human Input**: `false` — autonomous orchestration

```python
Agent(
    role="Spider Sovereign - Navigator",
    goal="DECIDE strategic direction, orchestrate HIVE phases",
    backstory="The spider weaves the web that weaves the spider",
    human_input=False,
    allow_delegation=True,  # MANAGER - delegates to all
)
```

---

## ⏳ HIVE/8 Phase Mapping (Anti-Diagonal Pairs, Sum=7)

```
┌──────────┬────────┬───────────────┬───────────┬────────────────────┐
│ Phase    │ Ports  │ Commanders    │ TDD       │ Temporal Domain    │
├──────────┼────────┼───────────────┼───────────┼────────────────────┤
│ H (Hunt) │ 0 + 7  │ Lidless +     │ Research  │ HINDSIGHT (Past)   │
│          │        │ Spider        │           │                    │
├──────────┼────────┼───────────────┼───────────┼────────────────────┤
│ I (Inter)│ 1 + 6  │ Weaver +      │ RED       │ INSIGHT (Present)  │
│          │        │ Kraken        │           │                    │
├──────────┼────────┼───────────────┼───────────┼────────────────────┤
│ V (Valid)│ 2 + 5  │ Magus +       │ GREEN     │ FORESIGHT (Future) │
│          │        │ Pyre          │           │                    │
├──────────┼────────┼───────────────┼───────────┼────────────────────┤
│ E (Evolve)│ 3 + 4 │ Storm +       │ REFACTOR  │ ITERATE (N+1)      │
│          │        │ Regnant       │           │                    │
└──────────┴────────┴───────────────┴───────────┴────────────────────┘
```

**Strange Loop**: E → H(N+1) — After REFACTOR, start new HUNT cycle

---

## 🦎 PREY/8 Tactical Pattern (Winding Around HIVE)

```
┌──────────┬────────┬───────────────┬───────────┐
│ Phase    │ Ports  │ Commanders    │ OODA      │
├──────────┼────────┼───────────────┼───────────┤
│ P (Perceive) │ 0 + 6 │ Lidless + Kraken │ Observe │
│ R (React)    │ 1 + 7 │ Weaver + Spider  │ Orient  │
│ E (Execute)  │ 2 + 4 │ Magus + Regnant  │ Decide  │
│ Y (Yield)    │ 3 + 5 │ Storm + Pyre     │ Act     │
└──────────┴────────┴───────────────┴───────────┘
```

---

## 🎴 Galois Lattice 8×8 Visualization

```
    Y→  0   1   2   3   4   5   6   7
  X↓  ┌───┬───┬───┬───┬───┬───┬───┬───┐
  0   │LL │   │   │   │   │   │ P │ H │  ← Lidless Legion
      ├───┼───┼───┼───┼───┼───┼───┼───┤
  1   │   │WW │   │   │   │ H │   │ R │  ← Web Weaver
      ├───┼───┼───┼───┼───┼───┼───┼───┤
  2   │   │   │MM │   │ E │ H │   │   │  ← Mirror Magus
      ├───┼───┼───┼───┼───┼───┼───┼───┤
  3   │   │   │   │SS │ H │ Y │   │   │  ← Spore Storm
      ├───┼───┼───┼───┼───┼───┼───┼───┤
  4   │   │   │ E │ H │RR │   │   │   │  ← Red Regnant
      ├───┼───┼───┼───┼───┼───┼───┼───┤
  5   │   │ H │   │ Y │   │PP │   │   │  ← Pyre Praetorian
      ├───┼───┼───┼───┼───┼───┼───┼───┤
  6   │ P │   │   │   │   │   │KK │ H │  ← Kraken Keeper
      ├───┼───┼───┼───┼───┼───┼───┼───┤
  7   │ H │ R │   │   │   │   │ H │SS │  ← Spider Sovereign
      └───┴───┴───┴───┴───┴───┴───┴───┘

Legend:
  LL/WW/MM/SS/RR/PP/KK/SS = Legendary Quines (diagonal)
  H = HIVE anchor (anti-diagonal, X+Y=7)
  P/R/E/Y = PREY tactical (winding pattern)
```

---

## 🔧 Current Implementation Status (Gen87.X3)

| Component | Status | Location |
|-----------|--------|----------|
| CrewAI Agents | ✅ Defined | `src/orchestration/crewai_hive.py` |
| OpenRouter Config | ✅ Ready | `src/orchestration/openrouter.config.ts` |
| Galois Lattice | ✅ Gen85 | `hfo_kiro_gen85/src/1_bridger/galois-lattice.ts` |
| Temporal Activities | ✅ Defined | `src/orchestration/temporal.activities.ts` |
| HIVE Tasks | ✅ Defined | `src/orchestration/crewai_hive.py` |
| Commander Document | ✅ This file | `sandbox/specs/OBSIDIAN_LEGENDARY_COMMANDERS.md` |

---

## 📚 References

- **Source**: Gen 85, `galois-lattice.ts`
- **Architecture**: Gen 84, `GEN84.4_ENRICHED_GOLD_BATON_QUINE.md`
- **CrewAI**: `src/orchestration/crewai_hive.py`
- **Memory Bank**: 6,423 artifacts Pre-HFO to Gen84

---

*"The spider weaves the web that weaves the spider."*

*Gen87.X3 | HUNT Phase | 2025-12-30*
