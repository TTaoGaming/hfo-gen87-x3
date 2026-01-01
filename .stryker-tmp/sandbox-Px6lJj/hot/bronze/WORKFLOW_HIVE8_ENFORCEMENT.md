# WORKFLOW_HIVE8_ENFORCEMENT — SILVER SPEC
> **Tier**: hot/silver (validated, deduplicated, ready for use)  
> **Generated**: 2025-12-31T19:45:00Z  
> **Source Chunks**: C3 (AI Enforcement) + C5 (HIVE/8 Workflow)  
> **Priority**: 🔴 HIGHEST — This is the foundation for all other specs

---
I
## 🎯 PURPOSE

Define the **HIVE/8 workflow** AND **enforcement rules** as a single unified specification. These were previously split across 8 specs, creating confusion about what rules apply where.

**Key Insight**: Enforcement IS workflow. You can't separate "how to work" from "how to enforce work."

---

## 1️⃣ HIVE/8 = TDD = PDCA ISOMORPHISM

```
┌──────────┬──────────────────┬────────────┬────────────┬──────────────┐
│ HIVE     │ Temporal Domain  │ TDD Phase  │ PDCA       │ Ports        │
├──────────┼──────────────────┼────────────┼────────────┼──────────────┤
│ H (Hunt) │ HINDSIGHT        │ Research   │ Plan       │ 0+7 (=7)     │
│ I (Inter)│ INSIGHT          │ RED        │ Do         │ 1+6 (=7)     │
│ V (Valid)│ FORESIGHT        │ GREEN      │ Check      │ 2+5 (=7)     │
│ E (Evolve│ ITERATE          │ REFACTOR   │ Act        │ 3+4 (=7)     │
└──────────┴──────────────────┴────────────┴────────────┴──────────────┘
                    ↑
              FLIP: E → H(N+1)
              The Strange Loop
```

### Port Pairs (Anti-Diagonal Sum = 7)
| Phase | Ports | Commanders |
|-------|-------|------------|
| H | 0 + 7 | Lidless Legion + Spider Sovereign |
| I | 1 + 6 | Web Weaver + Kraken Keeper |
| V | 2 + 5 | Mirror Magus + Pyre Praetorian |
| E | 3 + 4 | Spore Storm + Red Regnant |

---

## 2️⃣ PHASE TOOL PERMISSIONS (AUTHORITATIVE)

| Tool | H | I | V | E | Notes |
|------|---|---|---|---|-------|
| `read_file` | ✅ | ✅ | ✅ | ✅ | Always allowed |
| `grep_search` | ✅ | ✅ | ✅ | ✅ | Always allowed |
| `semantic_search` | ✅ | ✅ | ✅ | ✅ | Always allowed |
| `list_dir` | ✅ | ✅ | ✅ | ✅ | Always allowed |
| `mcp_memory_read_graph` | ✅ **REQ** | ✅ | ✅ | ✅ | Cold start |
| `mcp_memory_search_nodes` | ✅ **REQ** | ✅ | ✅ | ✅ | Find exemplars |
| `mcp_memory_add_observations` | ❌ | ✅ | ✅ | ✅ **REQ** | Persist lessons |
| `mcp_tavily_search` | ✅ **REQ** | ⚠️ | ⚠️ | ⚠️ | Ground claims |
| `mcp_sequentialthi_sequentialthinking` | ✅ **REQ** | ✅ **REQ** | ✅ | ⚠️ | Complex decisions |
| `create_file` | ❌ | ✅ tests | ✅ impl | ❌ new | Phase-specific |
| `replace_string_in_file` | ❌ | ✅ | ✅ | ✅ refactor | Edit existing |
| `runTests` | ❌ | ❌ | ✅ | ✅ | Anti-reward-hack |
| `run_in_terminal` | ❌ | ❌ | ⚠️ build | ✅ git | Limited |
| `runSubagent` | ✅ | ✅ | ✅ | ✅ | Delegation |

**Legend**:
- ✅ = Allowed
- ❌ = BLOCKED (attempting = violation)
- ⚠️ = Conditional (specific use only)
- **REQ** = REQUIRED (skipping = violation)

---

## 3️⃣ PHASE ENTRY/EXIT CHECKLISTS

### H-Phase (HUNT) — Research & Planning

**Entry Requirements**:
| # | Requirement | Check |
|---|-------------|-------|
| 1 | Previous E-phase complete OR fresh start | Signal exists |
| 2 | Cold start protocol executed | `mcp_memory_read_graph` called |

**Exit Requirements**:
| # | Requirement | Check |
|---|-------------|-------|
| 1 | Exemplars found and documented | Listed in msg |
| 2 | Sequential thinking 3+ thoughts used | Tool called |
| 3 | Web claims grounded (Tavily) | Tool called |
| 4 | HUNT signal emitted to blackboard | `hive: "H"` signal |

**Exit Signal Format**:
```json
{
  "hive": "H",
  "port": 7,
  "msg": "HUNT COMPLETE: Found [N] exemplars for [feature], ready for INTERLOCK",
  "type": "event",
  "ts": "ISO8601",
  "mark": 1.0,
  "pull": "downstream",
  "gen": 87
}
```

---

### I-Phase (INTERLOCK) — Contracts & RED Tests

**Entry Requirements**:
| # | Requirement | Check |
|---|-------------|-------|
| 1 | H-phase HUNT signal emitted | Blackboard has `hive: "H"` event |
| 2 | Exemplars documented | Referenced in HUNT signal |

**Exit Requirements**:
| # | Requirement | Check |
|---|-------------|-------|
| 1 | Zod contracts/schemas created | `.ts` file exists |
| 2 | Failing tests written (TDD RED) | `.test.ts` file exists |
| 3 | Tests fail for RIGHT reason | Error message is "Not implemented" or assertion |
| 4 | INTERLOCK signal emitted | `hive: "I"` signal |

**Exit Signal Format**:
```json
{
  "hive": "I",
  "port": 1,
  "msg": "INTERLOCK COMPLETE: [N] contracts, [M] failing tests, ready for VALIDATE",
  "type": "event",
  "ts": "ISO8601",
  "mark": 1.0,
  "pull": "downstream",
  "gen": 87
}
```

---

### V-Phase (VALIDATE) — Implementation & GREEN Tests

**Entry Requirements**:
| # | Requirement | Check |
|---|-------------|-------|
| 1 | I-phase INTERLOCK signal emitted | Blackboard has `hive: "I"` event |
| 2 | Contracts/schemas exist | Files from I-phase |
| 3 | Failing tests exist | Tests from I-phase |

**Exit Requirements**:
| # | Requirement | Check |
|---|-------------|-------|
| 1 | ALL new tests GREEN | `runTests` passes |
| 2 | No compile/type errors | Build succeeds |
| 3 | Gate checks pass | No violations logged |
| 4 | VALIDATE signal emitted | `hive: "V"` signal |

**Exit Signal Format**:
```json
{
  "hive": "V",
  "port": 2,
  "msg": "VALIDATE COMPLETE: [N]/[N] tests GREEN, ready for EVOLVE",
  "type": "event",
  "ts": "ISO8601",
  "mark": 1.0,
  "pull": "downstream",
  "gen": 87
}
```

---

### E-Phase (EVOLVE) — Refactor & Persist

**Entry Requirements**:
| # | Requirement | Check |
|---|-------------|-------|
| 1 | V-phase VALIDATE signal emitted | Blackboard has `hive: "V"` event |
| 2 | Tests passing | From V-phase |

**Exit Requirements**:
| # | Requirement | Check |
|---|-------------|-------|
| 1 | Code refactored and clean | No obvious duplication |
| 2 | Tests still passing | `runTests` passes |
| 3 | Lessons persisted to memory | `mcp_memory_add_observations` called |
| 4 | Git commit with message | Commit hash exists |
| 5 | EVOLVE signal emitted | `hive: "E"` signal |

**Exit Signal Format**:
```json
{
  "hive": "E",
  "port": 3,
  "msg": "EVOLVE COMPLETE: Commit [hash], lessons persisted, FLIP to H(N+1)",
  "type": "event",
  "ts": "ISO8601",
  "mark": 1.0,
  "pull": "downstream",
  "gen": 87
}
```

---

## 4️⃣ BLOCKED TRANSITIONS (QUARANTINE)

| From | To | Violation Code | Reason |
|------|----|----------------|--------|
| H → V | `SKIPPED_INTERLOCK` | No tests written! |
| H → E | `SKIPPED_INTERLOCK` | Skipped TDD entirely! |
| I → E | `SKIPPED_VALIDATE` | Tests not passing! |
| I → H | `BACKWARD_JUMP` | Must complete cycle! |
| V → H | `BACKWARD_JUMP` | Must complete cycle! |
| V → I | `BACKWARD_JUMP` | Must complete cycle! |
| E → I | `BACKWARD_JUMP` | Must complete cycle! |
| E → V | `BACKWARD_JUMP` | Must complete cycle! |

**Valid Transitions**:
```
H → I → V → E → H(N+1)
         ↑
    FLIP (strange loop)
```

---

## 5️⃣ TRUST SCORE ALGORITHM

### Formula
```typescript
trust_new = trust_old * DECAY + bonus

// Constants
const DECAY = 0.95;              // Gradual degradation over time
const BONUS_VERIFIED = 0.1;      // Reward for verified action
const PENALTY_VIOLATION = -0.3;  // Sharp punishment for violation

// One violation takes 4+ verified actions to recover from
// trust after violation: 0.65 → 0.72 → 0.78 → 0.84 → 0.90
```

### Trust Levels → Tool Access
| Score Range | Level | Available Tools |
|-------------|-------|-----------------|
| 0.80 - 1.00 | `full` | read, grep, **create**, **edit**, **terminal** |
| 0.50 - 0.79 | `read-only` | read, grep, list (no modification) |
| 0.00 - 0.49 | `quarantine` | **NONE** — human intervention required |

### Trust Events
| Event | Score Change |
|-------|--------------|
| Verified action (test passes, commit succeeds) | +0.1 |
| Phase transition validated | +0.05 |
| Violation detected (reward hack, skip phase) | -0.3 |
| Meta-theater (claiming nonexistent script) | -0.5 |
| Idle decay per hour | ×0.95 |

---

## 6️⃣ PRE-CREATE CHECKLIST (8 Checks)

Before creating ANY file, answer these questions:

| # | Port | Question | Good Answer | Bad Answer |
|---|------|----------|-------------|------------|
| 1 | 0 | Based on real exemplar with citation? | "Based on 1eurofilter@1.2.2 by Géry Casiez" | "I'll implement from scratch" |
| 2 | 1 | Composing exemplars, not bypassing? | "Wrapping XState FSM in adapter" | "Inline state machine" |
| 3 | 2 | Implements Port interface? | "Implements SmootherPort" | "Just a function" |
| 4 | 3 | All deps available locally? | "npm ls shows 1eurofilter" | "Assuming it exists" |
| 5 | 4 | TDD RED before this GREEN? | "Test file created first" | "Writing impl first" |
| 6 | 5 | Actually works as claimed? | "Ran and verified output" | "Should work" |
| 7 | 6 | Documented WHY if blocked? | "Blocked: jsdom needed for PointerEvent" | "It doesn't work" |
| 8 | 7 | User would see real functionality? | "Live camera feed smoothing" | "Console.log statements" |

---

## 7️⃣ ENFORCEMENT OPTIONS (3 Choices)

### Option A: MCP Tool Gating ⭐ RECOMMENDED FIRST
- **Investment**: 2-4 hours
- **Cost**: $0
- **Enforcement**: HARD (structural)
- **How**: Tools literally hidden in wrong phase

```typescript
// MCP server reads blackboard, returns only phase-appropriate tools
async getTools(phase: HivePhase): Promise<Tool[]> {
  if (phase === 'H') {
    return [searchTools, readTools]; // create_file NOT EXPOSED
  }
  // ...
}
```

### Option B: Temporal.io Workflow
- **Investment**: 8-16 hours
- **Cost**: ~$10/month
- **Enforcement**: DURABLE (survives crashes)
- **How**: Workflow state machine with required activities

### Option C: CrewAI + OpenRouter
- **Investment**: 6-12 hours
- **Cost**: ~$0.45/swarm
- **Enforcement**: Role-based (agents have limited tools)
- **How**: Each commander agent has restricted tool list

---

## 8️⃣ KEY INSIGHT

> **DETECTION ≠ PREVENTION**
>
> Current state: LLM claims action → logged to blackboard → violation detected → damage done
>
> Target state: LLM requests tool → phase gate checks → tool HIDDEN if wrong phase → PREVENTED

The goal is **structural enforcement** not **honor system**.

---

## 9️⃣ OPERATIONAL COMMANDS

```bash
# Check current HIVE phase
npm run hive:status

# Validate HIVE sequence (pre-commit)
npm run validate:hive

# View blocked signals
cat quarantine.jsonl

# View audit trail
cat pyre_audit.jsonl

# Emit manual signal
echo '{"hive":"H","port":7,"msg":"...","type":"signal","ts":"...",mark":1.0,"pull":"downstream","gen":87}' >> obsidianblackboard.jsonl
```

---

## 🔗 REFERENCES

- **Chunk A (MISSION)**: 5-stage pipeline this workflow operates on
- **Chunk B (ARCHITECTURE)**: Port contracts enforced by this workflow
- **Chunk D (QUALITY)**: Test patterns validated in V-phase
- **Chunk E (SWARM)**: Multi-agent scaling uses this workflow

---

## 📜 SOURCE SPECS (Merged)

| Spec | Content Preserved |
|------|-------------------|
| `HIVE8_SEQUENTIAL_WORKFLOW_CONTRACT.md` | Phase checklists |
| `HIVE_PHASE_TRACKER.md` | Commands, status |
| `AI_HONESTY_ENFORCEMENT_OPTIONS.md` | 3 enforcement options |
| `AI_TRUST_REPUTATION_SYSTEM.md` | Trust algorithm |
| `PRE_CREATE_CHECKLIST.md` | 8 checks |
| `EXEMPLAR_COMPOSITION.md` | No-bespoke rule |
| `HARD_GATED_SWARM_SCATTER_GATHER.md` | MCP tools (ref to Chunk E) |
| `WORKFLOW_IMPROVEMENT_V1.md` | Archived (diagnostic only) |

---

*"The spider weaves the web that weaves the spider."*  
*Gen87.X3 | Silver Tier | WORKFLOW_HIVE8_ENFORCEMENT | 2025-12-31*
