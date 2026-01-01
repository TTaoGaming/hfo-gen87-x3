# Sandbox Handoffs Folder

> **Purpose**: Session continuity and knowledge transfer (Silver tier)

## Structure

```
handoffs/
├── templates/      # Handoff templates
└── YYYY-MM-DD/     # Dated session handoffs (optional organization)
```

## Guidelines

### ✅ What Goes Here

- Session handoff documents
- Knowledge transfer notes
- Validated findings from research
- Interface contracts (before finalization)
- Test result summaries

### ❌ What Does NOT Go Here

- Raw research (→ `sandbox/research/`)
- Finalized specs (→ `sandbox/specs/`)
- Audit reports (→ `sandbox/audits/`)
- Code (→ `sandbox/src/`)

### Naming Convention

```
SESSION_HANDOFF_[YYYYMMDD]_[HHMM]Z.md
[TOPIC]_HANDOFF_[YYYYMMDD].md

Examples:
- SESSION_HANDOFF_20251230_2345Z.md
- LIDLESS_LEGION_MCP_HANDOFF_20251230.md
```

### Required Sections

Every handoff MUST include:
1. **What was done** - Completed work
2. **Files changed** - With commit status
3. **Pending items** - Unfinished work
4. **Next actions** - Prioritized recommendations
5. **Blackboard signals** - Last 3 signals emitted

### Lifecycle

1. **Create** at end of each significant session
2. **Read** by next agent at session start
3. **Archive** after 7 days if superseded

---

*Silver tier documentation - persist for continuity*
