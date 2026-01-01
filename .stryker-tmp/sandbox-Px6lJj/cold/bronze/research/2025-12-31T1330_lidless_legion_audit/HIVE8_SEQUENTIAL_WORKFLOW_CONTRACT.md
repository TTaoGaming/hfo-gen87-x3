# 🐝 HIVE/8 SEQUENTIAL WORKFLOW CONTRACT

> **The Obsidian Hourglass Protocol**  
> **Version**: 1.0.0  
> **Generated**: 2025-12-31T13:30:00Z  
> **Purpose**: Enforceable checklist for HIVE/8 phase progression

---

## 🎯 PURPOSE

This contract defines the MANDATORY steps for working through HIVE/8 workflow sequentially. Each phase has:
- **REQUIRED** tools that MUST be invoked
- **ALLOWED** tools that CAN be used
- **BLOCKED** tools that MUST NOT be used
- **EXIT CRITERIA** that MUST be met to proceed

**Violation of this contract triggers quarantine.**

---

## 🔄 PHASE FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                    HIVE/8 WORKFLOW                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  H (HUNT)     ──▶  I (INTERLOCK)  ──▶  V (VALIDATE)  ──▶  E (EVOLVE)
│  HINDSIGHT        INSIGHT             FORESIGHT          ITERATE
│  Ports 0+7        Ports 1+6           Ports 2+5          Ports 3+4
│  RESEARCH         RED (TDD)           GREEN (TDD)        REFACTOR
│                                                              │
│                         ◀──── FLIP (N+1) ◀────               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 H-PHASE (HUNT) CHECKLIST

**Temporal**: HINDSIGHT — Looking backward at what exists  
**Ports**: 0 (Lidless Legion) + 7 (Spider Sovereign)  
**TDD Mapping**: RESEARCH  
**Duration**: Until exemplars found and approach planned

### ✅ ENTRY REQUIREMENTS
- [ ] Previous E-phase completed OR fresh session start
- [ ] Cold start protocol executed (memory read)

### ✅ REQUIRED ACTIONS
| Step | Tool | Description | Checkpoint |
|------|------|-------------|------------|
| 1 | `mcp_memory_read_graph` | Load knowledge graph | Graph loaded, entities visible |
| 2 | `read_file` blackboard | Check last 10-20 signals | Current state understood |
| 3 | `mcp_sequentialthi_sequentialthinking` | Plan the HUNT | 3+ thoughts documented |
| 4 | `mcp_tavily_tavily-search` | Ground web claims | Sources cited |
| 5 | `grep_search` / `semantic_search` | Search codebase | Existing code found |
| 6 | `read_file` | Read exemplars/specs | Prior art understood |

### ✅ ALLOWED TOOLS
- `file_search` — Find files by glob
- `list_dir` — Browse directories
- `mcp_context7_query-docs` — Library documentation
- `run_in_terminal` — Read-only commands (grep, cat, find)

### 🚫 BLOCKED TOOLS
- ❌ `create_file` — No implementation in research phase
- ❌ `replace_string_in_file` — No edits in research phase
- ❌ `edit_notebook_file` — No notebook changes
- ❌ `runTests` — Nothing to test yet

### ✅ EXIT CRITERIA
- [ ] Exemplars found and documented
- [ ] Approach planned (sequential thinking complete)
- [ ] Web claims grounded with Tavily sources
- [ ] HUNT signal emitted to blackboard
- [ ] Ready to define contracts

### 📤 EXIT SIGNAL
```json
{
  "hive": "H",
  "port": 0,
  "msg": "HUNT COMPLETE: [what was found], ready for INTERLOCK",
  "type": "event"
}
```

---

## 📋 I-PHASE (INTERLOCK) CHECKLIST

**Temporal**: INSIGHT — Present moment connection  
**Ports**: 1 (Web Weaver) + 6 (Kraken Keeper)  
**TDD Mapping**: RED (write failing tests)  
**Duration**: Until contracts defined and tests written

### ✅ ENTRY REQUIREMENTS
- [ ] H-phase HUNT signal emitted
- [ ] Exemplars documented
- [ ] Approach planned

### ✅ REQUIRED ACTIONS
| Step | Tool | Description | Checkpoint |
|------|------|-------------|------------|
| 1 | `mcp_sequentialthi_sequentialthinking` | Design contracts | 3+ thoughts before creating |
| 2 | `create_file` | Create Zod schemas | Contract files exist |
| 3 | `create_file` | Write failing tests | Test files exist |
| 4 | `mcp_memory_add_observations` | Persist decisions | Memory updated |

### ✅ ALLOWED TOOLS
- `replace_string_in_file` — Edit schemas/tests
- `read_file` — Reference exemplars
- `grep_search` — Find existing patterns
- `list_code_usages` — Check interface usage

### 🚫 BLOCKED TOOLS
- ❌ `runTests` — Tests SHOULD fail (no implementation yet)
- ❌ Running tests would be REWARD HACKING

### ✅ EXIT CRITERIA
- [ ] Zod contracts/schemas created
- [ ] TypeScript interfaces defined
- [ ] Failing tests written (TDD RED)
- [ ] Tests fail for the RIGHT reason (no implementation)
- [ ] INTERLOCK signal emitted

### 📤 EXIT SIGNAL
```json
{
  "hive": "I",
  "port": 1,
  "msg": "INTERLOCK COMPLETE: [contracts defined], [N] failing tests ready for implementation",
  "type": "event"
}
```

---

## 📋 V-PHASE (VALIDATE) CHECKLIST

**Temporal**: VALIDATED FORESIGHT — Looking forward to verify  
**Ports**: 2 (Mirror Magus) + 5 (Pyre Praetorian)  
**TDD Mapping**: GREEN (make tests pass)  
**Duration**: Until all new tests pass

### ✅ ENTRY REQUIREMENTS
- [ ] I-phase INTERLOCK signal emitted
- [ ] Contracts/schemas exist
- [ ] Failing tests exist

### ✅ REQUIRED ACTIONS
| Step | Tool | Description | Checkpoint |
|------|------|-------------|------------|
| 1 | `mcp_sequentialthi_sequentialthinking` | Plan implementation | 3+ thoughts for complex code |
| 2 | `create_file` / `replace_string_in_file` | Implement code | Code exists |
| 3 | `runTests` | Verify tests pass | Tests GREEN |
| 4 | `get_errors` | Check for errors | No compile errors |

### ✅ ALLOWED TOOLS
- `run_in_terminal` — Build, type-check
- `read_file` — Reference during implementation
- `mcp_context7_query-docs` — Library docs

### 🚫 BLOCKED TOOLS
- ❌ Delete tests — Cannot remove failing tests
- ❌ Skip tests — Cannot use `.skip()` to fake green
- ❌ Modify test assertions to pass artificially

### ✅ EXIT CRITERIA
- [ ] ALL new tests GREEN
- [ ] No compile/type errors
- [ ] Gate checks pass (anti-theater, v-phase)
- [ ] VALIDATE signal emitted

### 📤 EXIT SIGNAL
```json
{
  "hive": "V",
  "port": 2,
  "msg": "VALIDATE COMPLETE: [N] tests GREEN, implementation verified",
  "type": "event"
}
```

---

## 📋 E-PHASE (EVOLVE) CHECKLIST

**Temporal**: EVOLUTION — Preparing for next cycle  
**Ports**: 3 (Spore Storm) + 4 (Red Regnant)  
**TDD Mapping**: REFACTOR  
**Duration**: Until code cleaned and lessons persisted

### ✅ ENTRY REQUIREMENTS
- [ ] V-phase VALIDATE signal emitted
- [ ] Tests passing
- [ ] Implementation verified

### ✅ REQUIRED ACTIONS
| Step | Tool | Description | Checkpoint |
|------|------|-------------|------------|
| 1 | `replace_string_in_file` | Refactor code | Code cleaner |
| 2 | `runTests` | Verify still passing | Tests still GREEN |
| 3 | `mcp_memory_add_observations` | Persist lessons | Memory updated |
| 4 | `run_in_terminal` git | Commit changes | Changes committed |

### ✅ ALLOWED TOOLS
- `read_file` — Review for refactoring
- `grep_search` — Find duplication
- `list_code_usages` — Find all usages

### 🚫 BLOCKED TOOLS
- ❌ `create_file` for NEW features — New features = next H-phase
- ❌ Major new implementation — That's not refactoring

### ✅ EXIT CRITERIA
- [ ] Code refactored and clean
- [ ] Tests still passing
- [ ] Lessons persisted to memory
- [ ] Git commit with descriptive message
- [ ] EVOLVE signal emitted

### 📤 EXIT SIGNAL
```json
{
  "hive": "E",
  "port": 3,
  "msg": "EVOLVE COMPLETE: Refactored, committed [hash], ready for HUNT N+1",
  "type": "event"
}
```

---

## 🚨 VIOLATION PATTERNS

| Violation | Pattern | Phase | Severity |
|-----------|---------|-------|----------|
| `MEMORY_NOT_READ` | Cold start without `mcp_memory_read_graph` | H | 🔴 BLOCK |
| `NO_TAVILY_GROUNDING` | Web claim without `mcp_tavily_tavily-search` | H | 🟡 WARN |
| `SKIPPED_HUNT` | Creating files without prior HUNT signal | I | 🔴 BLOCK |
| `NO_SEQUENTIAL_THINKING` | Complex decision without thinking | I,V | 🟡 WARN |
| `REWARD_HACK` | GREEN without prior RED | V | 🔴 QUARANTINE |
| `SKIPPED_VALIDATE` | REFACTOR without prior GREEN | E | 🔴 QUARANTINE |
| `LAZY_AI` | RED→GREEN without REFACTOR | E | 🟡 WARN |
| `NO_LESSON_PERSISTENCE` | E-phase without `mcp_memory_add_observations` | E | 🟡 WARN |
| `INCOMPLETE_CYCLE` | New HUNT without completing E | H | 🟡 WARN |

---

## 🔄 PHASE TRANSITION CHECKLIST

### H → I (HUNT to INTERLOCK)
- [ ] HUNT signal emitted with findings
- [ ] Exemplars documented
- [ ] Approach planned with sequential thinking
- [ ] Web claims grounded

### I → V (INTERLOCK to VALIDATE)
- [ ] INTERLOCK signal emitted
- [ ] Contracts/schemas created
- [ ] Failing tests written
- [ ] Tests fail for correct reason (not implemented)

### V → E (VALIDATE to EVOLVE)
- [ ] VALIDATE signal emitted
- [ ] All new tests GREEN
- [ ] No compile errors
- [ ] Gate checks pass

### E → H(N+1) (EVOLVE to next HUNT)
- [ ] EVOLVE signal emitted
- [ ] Code refactored
- [ ] Lessons persisted to memory
- [ ] Git commit completed

---

## 📊 TOOL PERMISSIONS MATRIX

| Tool | H | I | V | E |
|------|---|---|---|---|
| `mcp_memory_read_graph` | ✅ REQUIRED | ✅ | ✅ | ✅ |
| `mcp_sequentialthi_sequentialthinking` | ✅ | ✅ REQUIRED | ✅ REQUIRED | ✅ |
| `mcp_tavily_tavily-search` | ✅ REQUIRED | ✅ | ✅ | ✅ |
| `read_file` | ✅ | ✅ | ✅ | ✅ |
| `grep_search` | ✅ | ✅ | ✅ | ✅ |
| `semantic_search` | ✅ | ✅ | ✅ | ✅ |
| `create_file` | ❌ BLOCKED | ✅ | ✅ | ⚠️ REFACTOR ONLY |
| `replace_string_in_file` | ❌ BLOCKED | ✅ | ✅ | ✅ |
| `runTests` | ❌ BLOCKED | ❌ BLOCKED | ✅ | ✅ |
| `mcp_memory_add_observations` | ✅ | ✅ | ✅ | ✅ REQUIRED |
| `run_in_terminal` | ⚠️ READ-ONLY | ✅ | ✅ | ✅ |

---

## 🎯 ADOPTION GUIDE

### To Use This Contract:

1. **Read at session start** — Understand phase requirements
2. **Emit signals at transitions** — Blackboard traces your compliance
3. **Check tool permissions** — Respect phase-specific blocking
4. **Complete exit criteria** — Don't skip to next phase prematurely
5. **Persist lessons** — Memory survives sessions, you don't

### Enforcement Mechanisms:
- Pre-commit hooks check signal trail
- Pyre Praetorian monitors for violations
- Spider Sovereign orchestrates phase transitions
- Memory MCP persists compliance history

---

*"The spider weaves the web that weaves the spider."*  
*HIVE/8 Sequential Workflow Contract v1.0.0 | Gen87.X3*
