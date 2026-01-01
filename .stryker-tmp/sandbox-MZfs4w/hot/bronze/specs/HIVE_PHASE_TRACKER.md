# 🐝 HIVE/8 Phase Tracker

> **Generation**: 87.X3  
> **Last Updated**: 2025-12-31T08:00:00Z  
> **Current Phase**: I (Interlock)  
> **Enforcement**: ACTIVE

---

## 📊 Phase Status

| Phase | Name | TDD Stage | Status | Tests |
|-------|------|-----------|--------|-------|
| **H** | Hunt | Research | ✅ Complete | N/A |
| **I** | Interlock | RED | 🔴 IN PROGRESS | 229 failing |
| **V** | Validate | GREEN | ⏳ Pending | - |
| **E** | Evolve | Refactor | ⏳ Pending | - |

---

## 🚦 Transition Rules (ENFORCED)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│    H    │ ──▶ │    I    │ ──▶ │    V    │ ──▶ │    E    │
│  HUNT   │     │INTERLOCK│     │VALIDATE │     │ EVOLVE  │
└────┬────┘     └─────────┘     └─────────┘     └────┬────┘
     │                                               │
     └───────────────◀ STRANGE LOOP ◀───────────────┘
```

### Allowed Transitions

| From | To | Description |
|------|----|-------------|
| H | H, I, X | Continue hunting or move to contracts |
| I | I, V, X | Continue tests or move to implementation |
| V | V, E, X | Continue impl or move to refactor |
| E | E, H, X | Continue refactor or strange loop to next cycle |
| X | Any | Handoff can transition to any phase |

### BLOCKED Transitions (Will Be Quarantined)

| Blocked | Violation | Why |
|---------|-----------|-----|
| H → V | SKIPPED_INTERLOCK | No tests written! |
| H → E | SKIPPED_INTERLOCK | Skipped TDD entirely! |
| I → E | SKIPPED_VALIDATE | Tests not passing! |
| V → H | BACKWARD_JUMP | Must complete cycle! |
| V → I | BACKWARD_JUMP | Must complete cycle! |

---

## 🔧 Phase-Specific Rules

### H (Hunt) - Research Only
**Ports**: 0 (Lidless Legion) + 7 (Spider Sovereign)

✅ ALLOWED:
- `mcp_memory_read_graph`, `mcp_memory_search_nodes`
- `mcp_tavily_tavily-search`
- `read_file`, `grep_search`, `semantic_search`
- `runSubagent` for research

❌ BLOCKED:
- `create_file` (except specs)
- `edit_file` (except WORKING_SURFACE.md)
- `run_in_terminal` (except git status)

### I (Interlock) - TDD RED
**Ports**: 1 (Web Weaver) + 6 (Kraken Keeper)

✅ ALLOWED:
- `create_file` for `.test.ts`, `.contract.ts`, `.schema.ts`
- `mcp_sequentialthi_sequentialthinking` (REQUIRED before contracts)
- `mcp_memory_add_observations`

❌ BLOCKED:
- `runTests` expecting GREEN (reward hack)
- Implementation files (that's V phase)

### V (Validate) - TDD GREEN
**Ports**: 2 (Mirror Magus) + 5 (Pyre Praetorian)

✅ ALLOWED:
- `create_file` for implementation
- `edit_file` for implementation
- `runTests` (make them GREEN)

❌ BLOCKED:
- Skipping tests
- Deleting failing tests

### E (Evolve) - Refactor
**Ports**: 3 (Spore Storm) + 4 (Red Regnant)

✅ ALLOWED:
- `edit_file` for refactoring
- `run_in_terminal` for git commit
- `mcp_memory_add_observations` (REQUIRED)

❌ BLOCKED:
- New features (start new H cycle)
- New test files (that's I phase)

---

## 📈 Cycle History

| Cycle | Start | H | I | V | E | Duration |
|-------|-------|---|---|---|---|----------|
| 1 | 2025-12-29 | ✅ | ✅ | ✅ | ✅ | ~6h |
| 2 | 2025-12-30 | ✅ | 🔴 | - | - | In Progress |

---

## 🛠️ Enforcement Commands

```bash
# Check current HIVE phase
npm run hive:status

# Run validation (used in pre-commit)
npm run validate:hive

# View quarantined signals
cat sandbox/quarantine.jsonl | tail -10

# View audit trail
cat sandbox/pyre_audit.jsonl | tail -20
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `sandbox/obsidianblackboard.jsonl` | All HIVE signals |
| `sandbox/quarantine.jsonl` | Blocked signals |
| `sandbox/pyre_audit.jsonl` | Enforcement audit trail |
| `sandbox/src/enforcement/hive-validator.ts` | Validation logic |
| `sandbox/src/enforcement/safe-emit.ts` | Safe signal emission |
| `scripts/validate-hive.ts` | CLI validation |

---

*"The spider weaves the web that weaves the spider."*  
*HIVE/8 enforced since Gen87.X3*
