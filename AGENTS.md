# AGENTS.md — HFO Gen87.X3 Workspace

> **Generation**: 87.X3  
> **Date**: 2025-12-29  
> **Model**: Any (auto-approve enabled)  
> **Purpose**: Pre-configured AI workspace with all tools ready

---

## 🎯 CURRENT MISSION: W3C Gesture Control Plane

**ACTIVE WORK IS IN `sandbox/`** — See [sandbox/AGENTS.md](sandbox/AGENTS.md) for detailed instructions.

| Document | Purpose |
|----------|---------|
| [sandbox/AGENTS.md](sandbox/AGENTS.md) | Sandbox-specific agent instructions |
| [sandbox/llms.txt](sandbox/llms.txt) | Quick LLM context for sandbox |
| [sandbox/specs/W3C_GESTURE_CONTROL_PLANE_SPEC.md](sandbox/specs/W3C_GESTURE_CONTROL_PLANE_SPEC.md) | **MAIN SPEC** - Grounded with Tavily |

**Phase**: INTERLOCK (I) - Creating contracts and interfaces

---

## 🚨 Critical Rules (MUST FOLLOW)

1. **NEVER hallucinate content** — If you can't find it, say "I don't know"
2. **ALWAYS cite sources** — Include generation and filename OR Tavily URL
3. **NEVER delete files** without explicit human authorization
4. **ALWAYS use sandbox/** for new work — Never write outside this folder
5. **VERIFY claims** with tool output, not assumptions
6. **USE TAVILY** for web grounding — API key in .env

---

## 🧰 Pre-Configured Tools (Auto-Approved)

| Tool | Purpose | Status |
|------|---------|--------|
| GitHub MCP | Repo management, issues, PRs, code search | ✅ Auto |
| Memory MCP | Knowledge graph persistence | ✅ Auto |
| Playwright MCP | Browser automation & screenshots | ✅ Auto |
| Context7 MCP | Library documentation lookup | ✅ Auto |
| Sequential Thinking | Chain-of-thought reasoning | ✅ Auto |
| Filesystem MCP | Direct file access to C:/Dev/active | ✅ Auto |

---

## 📁 Workspace Folders

| Folder | Purpose |
|--------|---------|
| `.` (Gen87.X3) | Active development workspace |
| `📚 Memory Bank` | 6,423 artifacts from Pre-HFO to Gen84 (READ-ONLY) |
| `🏗️ Gen85 Codebase` | 687 tests, 8/8 ports - reference implementation |
| `📋 Context Payloads` | Architecture docs and injection packages |

---

## 🔑 Quick Start

### 1. Verify Memory Access
```bash
# Run task: "🔍 Query Memory"
# Or manually:
python -c "import duckdb; con = duckdb.connect('../portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/hfo_memory.duckdb', read_only=True); print(con.execute('SELECT COUNT(*) FROM artifacts').fetchone())"
```

### 2. Key Documents
1. **[../GEN87_X1_GOLD_BATON_QUINE.md](../GEN87_X1_GOLD_BATON_QUINE.md)** - Full architecture (1,136 lines)
2. **[../FORENSIC_ANALYSIS_AI_FAILURES_2025.md](../FORENSIC_ANALYSIS_AI_FAILURES_2025.md)** - Know the failure modes
3. **[../context_payload_gen85/RAW_PAIN_GENESIS_WHY_HFO_EXISTS.md](../context_payload_gen85/RAW_PAIN_GENESIS_WHY_HFO_EXISTS.md)** - Why this exists

### 3. Work in Sandbox
All new work goes in `sandbox/`. This is your safe write zone.

---

## 🏗️ HFO Architecture Quick Reference

### The 8 Legendary Commanders
```
Port │ Commander        │ Verb    │ HIVE Phase
─────┼──────────────────┼─────────┼────────────
  0  │ Lidless Legion   │ SENSE   │ H (Hunt)
  1  │ Web Weaver       │ FUSE    │ I (Interlock)
  2  │ Mirror Magus     │ SHAPE   │ V (Validate)
  3  │ Spore Storm      │ DELIVER │ E (Evolve)
  4  │ Red Regnant      │ TEST    │ E (Evolve)
  5  │ Pyre Praetorian  │ DEFEND  │ V (Validate)
  6  │ Kraken Keeper    │ STORE   │ I (Interlock)
  7  │ Spider Sovereign │ DECIDE  │ H (Hunt)
```

### HIVE/8 Phases
- **H** (Hunt): Research, plan → Ports 0+7
- **I** (Interlock): TDD RED, failing tests → Ports 1+6
- **V** (Validate): TDD GREEN, make tests pass → Ports 2+5
- **E** (Evolve): TDD REFACTOR, prepare N+1 → Ports 3+4

---

## The Mantra

> **"The spider weaves the web that weaves the spider."**

---

*Gen87.X3 | Pre-configured | Auto-approve enabled | 2025-12-29*
