# AGENTS.md — HFO Gen87.X3 AI Agent Instructions

> **Generation**: 87.X3  
> **Date**: 2025-12-30  
> **Model**: Any (auto-approve enabled)  
> **Purpose**: Pre-configured AI workspace with HIVE/8 workflow enforcement

---

## 🔴 CURRENT PHASE: HUNT (H) — STILL EXPLORING

**You are in Hunt phase. DO NOT finalize architecture decisions yet.**

| What to DO in Hunt | What NOT to do |
|--------------------|----------------|
| ✅ Search Memory Bank for exemplars | ❌ Write production code |
| ✅ Use Tavily to ground new findings | ❌ Create final contracts |
| ✅ Explore options, trade-offs | ❌ Skip to implementation |
| ✅ Read existing specs/research | ❌ Commit to tech choices |
| ✅ Emit HUNT signals to blackboard | ❌ Emit I/V/E signals |

**Hunt Outputs**: Exemplars found, options explored, trade study extended.

---

## 🎯 CURRENT MISSION: W3C Gesture Control Plane

**User Vision: Total Tool Virtualization**
```
MediaPipe → Physics (Rapier/1€) → FSM (XState) → W3C Pointer → TargetAdapter → ANY TARGET
                                                                     ↓
                                      ┌──────────────────────────────┴───────────────────────────┐
                                      │                                                          │
                                 DOM/Canvas                                               Emulators
                                 Excalidraw (54K⭐)                                       v86 (x86)
                                 tldraw (15K⭐)                                           js-dos
                                 Any element                                              EmulatorJS
                                                                                          daedalOS (12K⭐)
                                                                                          Puter (38K⭐)
```

**Hexagonal CDD Goal**: Ports define contracts (Zod), Adapters implement. AI swarms can combine/evolve primitives.

---

## 🚨 Critical Rules (MUST FOLLOW)

1. **NEVER hallucinate content** — If you can't find it, search first
2. **ALWAYS cite sources** — `Source: Gen X, filename.md` OR `Tavily: URL`
3. **NEVER delete files** without explicit human authorization
4. **ALWAYS work in `sandbox/`** — Never write outside this folder
5. **VERIFY claims** with tool output, not assumptions
6. **USE TAVILY** for web grounding — API key configured
7. **EMIT signals** to `sandbox/obsidianblackboard.jsonl`
8. **RESPECT HIVE phase** — H means explore, not decide

---

## 🔴 HARD-GATED TOOL REQUIREMENTS (ENFORCED)

> **These are NOT suggestions. These are REQUIREMENTS.**  
> **Violations result in QUARANTINE.**

### 🧊 Cold Start Protocol (EVERY new conversation)

**BEFORE doing anything else, you MUST:**

```
1. [REQUIRED] mcp_memory_read_graph
   → Check what knowledge already exists in memory
   → Load user context: TTao preferences, mission, AI friction patterns
   → Load architecture: HIVE/8, swarm patterns, limitations

2. [REQUIRED] mcp_memory_search_nodes("<task keywords>")
   → Search for relevant exemplars based on current task
   → Find prior art before reinventing
```

### 📊 Phase-Specific Requirements

| Phase | REQUIRED Tools | BLOCKED Tools |
|-------|----------------|---------------|
| **H (Hunt)** | `mcp_memory_read_graph`, `mcp_tavily_tavily-search` | `create_file`, `edit_file`, `run_in_terminal` |
| **I (Interlock)** | `mcp_sequentialthi_sequentialthinking` (before contracts) | `runTests` (reward hack prevention) |
| **V (Validate)** | `mcp_sequentialthi_sequentialthinking` (before complex impl) | `delete_file` (can't delete tests) |
| **E (Evolve)** | `mcp_memory_add_observations` (persist lessons) | `create_file` (new features = next H) |

### ✍️ Pre-Create-File Protocol

**BEFORE creating ANY file, you MUST:**

```
1. [REQUIRED in I/V phase] mcp_sequentialthi_sequentialthinking
   → At least 3 thoughts minimum
   → Include: problem analysis, approach, potential issues
   → Output: reasoned decision on file structure/content
```

### 🏁 Phase Exit Protocol

**BEFORE transitioning to next phase:**

```
1. [REQUIRED in E phase] mcp_memory_add_observations
   → What worked? What didn't?
   → New patterns discovered
   → Lessons for next iteration
```

### ⚠️ Violation Types

| Violation | Trigger | Severity |
|-----------|---------|----------|
| `MEMORY_NOT_READ` | Cold start without memory graph read | 🔴 BLOCK |
| `NO_TAVILY_GROUNDING` | H phase web claim without search | 🟡 WARN |
| `NO_SEQUENTIAL_THINKING` | I/V phase file create without reasoning | 🔴 BLOCK |
| `NO_LESSON_PERSISTENCE` | E phase exit without memory update | 🟡 WARN |

---

## 🧰 Pre-Configured Tools (Auto-Approved)

### Primary Tools - USE THESE

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Tavily Search** | Web grounding, find exemplars | `mcp_tavily_tavily-search` for ANY claim you can't verify |
| **Memory Bank** | HFO history (6,423 artifacts) | DuckDB FTS query for past designs/patterns |
| **Context7** | Library documentation | `mcp_context7_query-docs` for XState, Zod, Rapier, etc. |
| **Sequential Thinking** | Complex reasoning | `mcp_sequentialthi_sequentialthinking` for trade-offs |
| **GitHub MCP** | Repo/issue/PR management | Creating issues, searching code |
| **Playwright MCP** | Browser automation | Screenshots, testing |
| **Filesystem MCP** | Direct file access | Reading/writing in sandbox |

### Memory Bank Query Pattern
```python
import duckdb
con = duckdb.connect('../portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/hfo_memory.duckdb', read_only=True)
con.execute('LOAD fts')
# Search for exemplars
results = con.execute("""
    SELECT filename, generation, content,
           fts_main_artifacts.match_bm25(id, 'gesture control pointer') as score
    FROM artifacts WHERE score IS NOT NULL
    ORDER BY score DESC LIMIT 10
""").fetchall()
for r in results:
    print(f"Gen {r[1]}: {r[0]} (score: {r[3]:.2f})")
```

### Tavily Search Pattern
```
Use mcp_tavily_tavily-search with:
- query: "XState v5 setup pattern TypeScript"
- search_depth: "advanced" for thorough results
- include_raw_content: true if you need full page text
```

---

## 📁 Workspace Structure

| Folder | Purpose | Access |
|--------|---------|--------|
| **`sandbox/`** | YOUR WRITE ZONE - all new work | ✅ Read/Write |
| **`sandbox/specs/`** | Specifications and research | ✅ Read/Write |
| **`sandbox/src/`** | Source code (when in I/V/E phases) | ✅ Read/Write |
| **`sandbox/obsidianblackboard.jsonl`** | Stigmergy signals | ✅ APPEND ONLY |
| `📚 Memory Bank` | 6,423 artifacts Pre-HFO to Gen84 | 🔒 READ-ONLY |
| `🏗️ Gen85 Codebase` | Reference implementation (687 tests) | 🔒 READ-ONLY |
| `📋 Context Payloads` | Architecture docs | 🔒 READ-ONLY |

---

## 📊 Hunt Phase Research Completed

### Key Documents (READ THESE)
| Document | Lines | Purpose |
|----------|-------|---------|
| `sandbox/specs/PIPELINE_TRADE_STUDY.md` | 838 | 5-stage pipeline analysis, ALL options |
| `sandbox/specs/HEXAGONAL_CDD_EARS_SPEC.md` | 206 | Contract requirements (EARS format) |
| `sandbox/specs/W3C_GESTURE_CONTROL_PLANE_SPEC.md` | - | Main spec with Tavily sources |
| `sandbox/specs/TOOLING_RECOMMENDATIONS.md` | 226 | VS Code extensions, MCP servers |

### Exemplars Found (Tavily-Grounded)

**Stage 1 - Input Sensing:**
| Option | Source | Decision |
|--------|--------|----------|
| MediaPipe Tasks Vision | ai.google.dev/edge/mediapipe | ✅ Recommended (built-in gestures) |
| TensorFlow.js Handpose | blog.tensorflow.org | Alternative (manual gestures) |
| WebHID API | wicg.github.io/webhid | ⚠️ Not W3C standard |

**Stage 2 - Smoothing/Physics:**
| Option | Source | Decision |
|--------|--------|----------|
| Rapier Physics | dimforge.com | ✅ Recommended (prediction!) |
| 1€ Filter | gery.casiez.net/1euro | ✅ Recommended (denoise) |
| Kalman Filter | - | Alternative (complex) |

**Stage 3 - FSM:**
| Option | Source | Decision |
|--------|--------|----------|
| XState v5 | stately.ai/docs | ✅ Recommended (TypeScript native) |
| Robot.js | - | Alternative (tiny) |
| Behavior Trees | arxiv.org | Alternative (complex AI) |

**Stage 4 - Output:**
| Option | Source | Decision |
|--------|--------|----------|
| W3C Pointer Events | w3.org/TR/pointerevents | ✅ ONLY option (standard) |
| Pointer Lock API | w3.org/TR/pointerlock-2 | Different purpose (capture) |

**Stage 5 - Target Adapters:**
| Target | Stars | Input API | Complexity |
|--------|-------|-----------|------------|
| DOM dispatchEvent | - | Standard | Very Low |
| tldraw | 15K | DOM renderer | Very Low |
| Excalidraw | 54K | onPointerDown/Up callbacks | Low |
| daedalOS | 12K | Window manager routing | Medium |
| v86 | 19K | bus.send('mouse-delta') | Medium |
| js-dos | - | setMouseSensitivity() | Medium |
| EmulatorJS | - | EJS_defaultControls | Medium |
| Puter | 38K | Cloud OS APIs | Medium |

---

## 🏗️ HIVE/8 Architecture (The Obsidian Hourglass)

### Phase Mapping
```
HIVE/8 = Hindsight/Insight/Validated_Foresight/Evolution
       = Hunt/Interlock/Validate/Evolve
       = Research/RED/GREEN/REFACTOR (TDD)
       = Plan/Do/Check/Act (PDCA)
```

### Port Pairs (Anti-Diagonal Sum = 7)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HIVE Phase │ TDD Phase  │ Ports │ Commander            │ Verb    │ Domain   │
├────────────┼────────────┼───────┼──────────────────────┼─────────┼──────────┤
│ H (Hunt)   │ Research   │ 0+7   │ Lidless + Spider     │ SENSE+  │ Past     │
│            │            │       │                      │ DECIDE  │ (memory) │
├────────────┼────────────┼───────┼──────────────────────┼─────────┼──────────┤
│ I (Interlock)│ RED      │ 1+6   │ Weaver + Kraken      │ FUSE+   │ Present  │
│            │            │       │                      │ STORE   │ (connect)│
├────────────┼────────────┼───────┼──────────────────────┼─────────┼──────────┤
│ V (Validate)│ GREEN     │ 2+5   │ Magus + Pyre         │ SHAPE+  │ Future   │
│            │            │       │                      │ DEFEND  │ (verify) │
├────────────┼────────────┼───────┼──────────────────────┼─────────┼──────────┤
│ E (Evolve) │ REFACTOR   │ 3+4   │ Storm + Regnant      │ DELIVER+│ Iterate  │
│            │            │       │                      │ TEST    │ (N+1)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Strange Loop
```
E → H(N+1): After REFACTOR, start new HUNT cycle with accumulated knowledge
```

### Powers of 8 Vision (User Note)
> "The HIVE/8 workflow was never designed to be sequential, that's only bootstrap. It should be powers of 8: 1010 at minimum"

**Interpretation**: Multiple agents can work in parallel across ports. Bootstrap is sequential (1 agent). Production is concurrent (8+ agents swarming).

---

## 📡 Signal Emission Protocol

### Stigmergy Schema (8 Fields)
```json
{
  "ts": "2025-12-30T00:00:00Z",
  "mark": 1.0,
  "pull": "downstream",
  "msg": "HUNT: [what you found or did]",
  "type": "signal",
  "hive": "H",
  "gen": 87,
  "port": 0
}
```

### When to Emit (HUNT Phase)
| Action | Signal Example |
|--------|----------------|
| Start searching | `"HUNT: Searching Memory Bank for MediaPipe exemplars"` |
| Found exemplar | `"HUNT: Found Gen83 Gold Baton gesture spec - complete architecture"` |
| Tavily result | `"HUNT: Tavily grounded Rapier physics spring-damper API"` |
| Trade-off analysis | `"HUNT: Comparing 1€ vs Rapier - Rapier has prediction"` |
| Options explored | `"HUNT: 5 target adapters documented in PIPELINE_TRADE_STUDY.md"` |

### Emit Command
```bash
echo '{"ts":"2025-12-30T12:00:00Z","mark":1.0,"pull":"downstream","msg":"HUNT: [your message]","type":"signal","hive":"H","gen":87,"port":0}' >> sandbox/obsidianblackboard.jsonl
```

---

## 🔑 Key Documents to Read

| Priority | File | Purpose |
|----------|------|---------|
| 1 | `sandbox/specs/PIPELINE_TRADE_STUDY.md` | ALL your Hunt findings |
| 2 | `sandbox/specs/HEXAGONAL_CDD_EARS_SPEC.md` | Contract requirements |
| 3 | `sandbox/AGENTS.md` | Sandbox-specific instructions |
| 4 | `../GEN87_X1_GOLD_BATON_QUINE.md` | Full HFO architecture |
| 5 | Memory Bank: Gen83 Gold Baton | Original gesture spec |

---

## ✅ Do (HUNT Phase)

- ✅ Search Memory Bank for prior art
- ✅ Use Tavily to ground web claims
- ✅ Read existing specs before writing new ones
- ✅ Document trade-offs in PIPELINE_TRADE_STUDY.md
- ✅ Emit HUNT signals to blackboard
- ✅ Use Sequential Thinking for complex decisions
- ✅ Use Context7 for library documentation

## ❌ Do NOT (HUNT Phase)

- ❌ Write production code (save for I phase)
- ❌ Finalize contracts (save for I phase)
- ❌ Run tests (nothing to test yet)
- ❌ Emit I/V/E signals (wrong phase)
- ❌ Hallucinate - if unsure, SEARCH
- ❌ Delete files without permission
- ❌ Write outside sandbox/

---

## 🎯 Next Phase (INTERLOCK)

When Hunt is complete, transition to I phase:
1. Define Zod contracts for all ports
2. Write failing tests (TDD RED)
3. Create adapter interfaces
4. Emit `"hive": "I"` signals

**Hunt → Interlock Trigger**: User says "ready for I phase" or all exemplars documented.

---

## The Mantra

> **"The spider weaves the web that weaves the spider."**

---

*Gen87.X3 | HUNT Phase Active | Auto-approve enabled | 2025-12-30*
