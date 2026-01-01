# Sandbox Research Folder

> **Purpose**: HUNT phase exploration and research outputs (Bronze tier)

## Structure

```
research/
├── explorations/   # Trade studies, options analysis, deep dives
├── notes/          # Raw session notes, scratch work
└── _archive/       # Old research (safe to delete periodically)
```

## Guidelines

### ✅ What Goes Here

- Trade study documents
- Options analysis
- Exploration notes
- Draft ideas
- Comparison tables
- Research findings (before validation)

### ❌ What Does NOT Go Here

- Finalized specs (→ `sandbox/specs/`)
- Session handoffs (→ `sandbox/handoffs/`)
- Production code (→ `sandbox/src/`)
- Audit reports (→ `sandbox/audits/`)

### Lifecycle

1. **Create** during HUNT phase
2. **Validate** during V phase (may move to handoffs/)
3. **Promote** to specs/ if finalized
4. **Archive** if superseded or stale

### Naming Convention

```
[TOPIC]_[TYPE]_[DATE].md

Examples:
- MEDIAPIPE_TRADE_STUDY_20251230.md
- XSTATE_V5_EXPLORATION_20251230.md
- FSM_OPTIONS_ANALYSIS_20251230.md
```

### Cleanup Policy

Research older than 30 days should be:
- Moved to `_archive/` if potentially useful
- Deleted if superseded by finalized specs

---

*Bronze tier documentation - ephemeral by design*
