# 🔥 HOT — Active Development Manifests

> **Medallion Architecture** | Gen87.X3 | 2026-01-02

---

## 📁 Structure

```
hot/
├── MANIFEST.md           # THIS FILE
├── gold/                 # 🥇 Specifications (READ-ONLY)
├── silver/               # 🥈 Designs (REVIEW-REQUIRED)
└── bronze/               # 🥉 Implementation (EDITABLE)
```

---

## 🥇 GOLD — Specifications (READ-ONLY)

**Protection Level**: AI CANNOT modify without explicit user approval

| File | Purpose | Status |
|------|---------|--------|
| `HFO_ARCHITECTURE_SSOT.md` | Single Source of Truth | ✅ CANONICAL |
| `HFO_ARCHITECTURE_SSOT_20260101.md` | Enriched SSOT with manifold | ✅ CANONICAL |
| `GESTURE_LANGUAGE_SPEC.md` | Hand gesture definitions | ✅ STABLE |
| `DEMO_REBUILD_CHECKLIST.md` | Demo reconstruction guide | ✅ ACTIVE |
| `INCIDENT_REPORTS_20260102.md` | AI friction patterns | ✅ GROWING |

**Rules**:
- Append-only observations
- Version with date suffix for updates
- Never delete, archive to cold/gold/

---

## 🥈 SILVER — Designs (REVIEW-REQUIRED)

**Protection Level**: Modifications require commit justification

| File | Purpose | Status |
|------|---------|--------|
| `SILVER_EXECUTIVE_SUMMARY_20260101.md` | Architecture overview | ✅ STABLE |
| `8_PORT_ARCHITECTURE.md` | 8-port hex design | ✅ STABLE |
| `POLYMORPHIC_COMPOSITION.md` | Adapter composition | ✅ STABLE |
| `MEDALLION_ARCHITECTURE_20260101.md` | Tier system | ✅ STABLE |
| `MUTATION_TESTING_GUIDE.md` | Stryker guide | ✅ STABLE |
| `AI_REWARD_HACK_FORENSICS_20260101.md` | Anti-AI patterns | ✅ GROWING |
| `AI_WORKFLOW_FORENSICS_*.md` | Workflow analysis | ✅ GROWING |
| `DRAFT_TTV_*.md` | Work in progress specs | 🚧 DRAFT |
| `exemplars/` | Reference implementations | ✅ STABLE |

**Rules**:
- Document rationale for changes
- DRAFT_ prefix for work-in-progress
- Graduate to gold/ when stable

---

## 🥉 BRONZE — Implementation (EDITABLE)

**Protection Level**: Standard TDD workflow

```
bronze/
├── src/
│   ├── adapters/        # Port adapters
│   ├── browser/         # Browser bundle exports
│   ├── constants/       # Static values
│   ├── constraints/     # Constraint tests
│   ├── contracts/       # Zod schemas, types
│   ├── gates/           # Gate implementations
│   ├── pipeline/        # Processing pipeline
│   ├── shared/          # Utilities
│   └── test/            # Test utilities
├── quarantine/          # Failing tests awaiting fix
├── GEN87_X3_PROGRESS_REPORT_20260102.md
└── TTV_PRIMITIVES_CHECKLIST.md
```

**Rules**:
- TDD: Write test first (RED), implement (GREEN), refactor (BLUE)
- Tests must pass before commit
- Move to quarantine/ if blocked

---

## 🔄 Graduation Path

```
Draft → Silver/DRAFT_*.md → Silver/*.md → Gold/*.md
              ↓                  ↓            ↓
          WIP specs       Stable designs   Canonical specs
```

---

## 🚫 DO NOT

- ❌ Create files in hot/ root (use gold/silver/bronze)
- ❌ Delete gold/ files (archive to cold/gold/)
- ❌ Skip silver/ for designs (go direct to gold)
- ❌ Put implementation code in silver/ (that's bronze/)

---

*Gen87.X3 | 2026-01-02*
