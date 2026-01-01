# Documentation Structure Audit

> **Date**: 2025-12-30T23:50:00Z  
> **Author**: Spider Sovereign (Port 7)  
> **HIVE Phase**: HUNT (Research)  
> **Purpose**: Establish SSOT documentation structure aligned with HIVE/8 workflow

---

## 📊 Current State Analysis

### Problem: Spec Sprawl

Per memory graph entity `TTao_Workflow_Improvements_Needed`:
> "Spec sprawl confirmed - 15+ locations including sandbox/specs/, hfo_daily_specs/, root level"

### Current Documentation Locations

| Location | Purpose | Files | Issue |
|----------|---------|-------|-------|
| `hfo_daily_specs/` | Dated spec files | 2 | ✅ Clear purpose |
| `sandbox/specs/` | Architectural specs | 7 + 2 archives | ⚠️ Mixed with research |
| `context_payload/` | Context injection | 1 README | ⚠️ Unclear role |
| `sandbox/` (root) | Mixed | AGENTS.md, llms.txt | ⚠️ No clear lifecycle |
| Root level | Project docs | AGENTS.md, README.md | ✅ Clear purpose |

### Core Issue

**Research artifacts (Bronze) are mixed with finalized specs (Gold)**

When AI executes HUNT phase, it creates exploration documents in `sandbox/specs/`. These ephemeral research outputs then pollute the authoritative spec location, making it unclear what's finalized vs. what's still under exploration.

---

## 🎯 Proposed Structure

### Three-Tier Documentation (Medallion-Aligned)

```
sandbox/
├── research/           # 🥉 BRONZE - HUNT phase outputs
│   ├── explorations/   # Trade studies, options analysis
│   ├── notes/          # Raw session notes
│   └── _archive/       # Old research (safe to delete)
│
├── handoffs/           # 🥈 SILVER - Session continuity
│   ├── 2025-12-30/     # Dated folders
│   └── templates/      # Handoff templates
│
├── specs/              # 🥇 GOLD - Finalized architecture (EXISTING)
│   ├── *.md            # Authoritative specs
│   ├── _archived_v1/   # Version history
│   └── _archived_v2/
│
└── audits/             # 📋 Compliance audits (NEW)
    └── *.md            # Audit reports like this one
```

### Lifecycle Flow

```
HUNT Phase → sandbox/research/
     ↓ (promote if validated)
I/V Phase → sandbox/handoffs/
     ↓ (finalize if approved)
E Phase → sandbox/specs/ (Gold)
```

### HIVE Phase Mapping

| HIVE Phase | Folder | Action |
|------------|--------|--------|
| **H (Hunt)** | `research/` | Create explorations, trade studies |
| **I (Interlock)** | `handoffs/` | Document contracts, interfaces |
| **V (Validate)** | `handoffs/` | Document validation results |
| **E (Evolve)** | `specs/` | Promote validated docs to Gold |

---

## ✅ Best Practices

### 1. Research Safety (HUNT Phase)

```
✅ DO: Create in sandbox/research/
✅ DO: Use descriptive filenames with dates
✅ DO: Mark as "DRAFT" or "EXPLORATION"
✅ DO: Archive old research periodically

❌ DON'T: Create research in sandbox/specs/
❌ DON'T: Mix exploration with finalized specs
❌ DON'T: Keep stale research indefinitely
```

### 2. Handoff Discipline (Session Continuity)

```
✅ DO: Create dated handoff on session end
✅ DO: Include: what was done, what's pending, blockers
✅ DO: Reference blackboard signals
✅ DO: Link to relevant research/specs

❌ DON'T: Leave session without handoff
❌ DON'T: Assume next agent has context
❌ DON'T: Duplicate content from specs
```

### 3. Spec Promotion (Bronze → Silver → Gold)

```
Research (Bronze):
- Trade study document
- Options analysis
- Raw notes
     ↓ (validation)
Handoff (Silver):
- Validated findings
- Interface contracts
- Test results
     ↓ (approval)
Spec (Gold):
- Authoritative architecture
- Finalized contracts
- Reference implementation
```

---

## 📝 MANIFEST.json Updates Required

```json
{
  "authoritative": {
    "specs": "sandbox/specs/",
    "handoffs": "sandbox/handoffs/",
    "research": "sandbox/research/",
    "audits": "sandbox/audits/"
  },
  "lifecycle": {
    "bronze": "sandbox/research/",
    "silver": "sandbox/handoffs/",
    "gold": "sandbox/specs/"
  }
}
```

---

## 🔧 Implementation Checklist

- [x] Create `sandbox/audits/` folder (this file)
- [ ] Create `sandbox/research/` folder structure
- [ ] Create `sandbox/handoffs/` folder structure
- [ ] Update MANIFEST.json with new locations
- [ ] Move existing research files to proper location
- [ ] Create handoff template
- [ ] Emit blackboard signal

---

## 📋 Files to Relocate

### Move to `sandbox/research/`

| Current Location | Proposed | Reason |
|------------------|----------|--------|
| `sandbox/specs/PRE_CREATE_CHECKLIST.md` | `research/checklists/` | Process doc, not spec |
| `sandbox/specs/VSCODE_AGENTS_CAPABILITY_CHECKLIST.md` | `research/checklists/` | Process doc, not spec |
| `sandbox/WORKING_SURFACE.md` | `research/` | Active exploration |

### Keep in `sandbox/specs/` (Gold)

| File | Reason |
|------|--------|
| `OBSIDIAN_GRIMOIRE_GALOIS_LATTICE.md` | Core architecture |
| `OBSIDIAN_LEGENDARY_COMMANDERS.md` | Core architecture |
| `OBSIDIAN_LEGENDARY_COMMANDERS_VSCODE_AGENTS.md` | Core architecture |
| `HIVE_SWARM_MCP_SERVER_ARCHITECTURE.md` | Finalized spec |
| `GEN87_X3_CONTEXT_PAYLOAD_V1_20251230Z.md` | Context injection |

---

## 🎯 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Spec locations | 15+ | 3 (research/handoffs/specs) |
| Research in specs/ | Mixed | 0 |
| Handoffs per session | Inconsistent | 1 per session |
| Stale research | Unknown | Archived monthly |

---

## 📡 Handoff Notes

**For Next Agent**:
1. This audit proposes structure but doesn't implement it
2. Implementation requires creating folders + moving files
3. MANIFEST.json update needed after folder creation
4. Emit E-phase signal when complete

**Blockers**: None - straightforward folder operations

**Dependencies**: None

---

*The spider weaves the web that weaves the spider.*  
*Spider Sovereign | Port 7 | HUNT Phase | Gen87.X3*
