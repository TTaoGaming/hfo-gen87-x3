# 📁 Documentation Organization — Pareto Frontier Analysis

> **Port 7 — Spider Sovereign — DECIDE**  
> **Generated**: 2025-12-31T19:55:00Z  
> **HIVE Phase**: H (HUNT) — Research & Options  
> **Gen**: 87.X3  
> **Context**: Organizing hfo_daily_specs, research/, and related docs

---

## 📋 Current State Analysis

### What We Have Now

| Location | Contents | Files | Issue |
|----------|----------|-------|-------|
| `hfo_daily_specs/` | Daily W3C specs | 3 | No lifecycle, flat structure |
| `sandbox/research/` | Audits, explorations | 8+ | Good timestamping, needs hierarchy |
| `sandbox/specs/` | (Empty/Underused) | ~0 | SSOT defined but not enforced |
| `sandbox/handoffs/` | Session continuity | ~0 | Good concept, not populated |

### The Problem

1. **Multiple competing locations** — Where is "authoritative"?
2. **No lifecycle progression** — Research → Validated → Production unclear
3. **Inconsistent naming** — Some dated, some not
4. **HIVE phase disconnect** — Docs don't align with H→I→V→E

---

## 🎯 4 Pareto Frontier Options

### Trade-off Dimensions

| Dimension | Description |
|-----------|-------------|
| **Structure** | How organized/hierarchical |
| **HFO Alignment** | Maps to HIVE/8, Medallion, TDD |
| **Overhead** | Effort to maintain |
| **Scalability** | Works at Gen100+? |

---

## Option 1: Pure PARA Method

> **From**: Tiago Forte's "Building a Second Brain"

### Structure

```
sandbox/
├── projects/                # Active work with deadlines
│   ├── w3c-gesture-plane/   # Current mission
│   └── dashboard-v2/        # Side project
├── areas/                   # Ongoing responsibilities
│   ├── enforcement/         # Always active
│   └── testing/             # Continuous
├── resources/               # Reference material
│   ├── w3c-specs/           # External specs
│   └── exemplars/           # Code patterns
└── archives/                # Completed/dormant
    └── gen87-x2/            # Old generations
```

### Ratings

| Dimension | Score | Notes |
|-----------|-------|-------|
| Structure | ⭐⭐⭐ | Clear 4 buckets |
| HFO Alignment | ⭐⭐ | No HIVE phase mapping |
| Overhead | ⭐⭐⭐⭐ | Low — just 4 folders |
| Scalability | ⭐⭐⭐ | Projects can get messy |

### Pros
- ✅ Well-documented method (book, community)
- ✅ Simple mental model
- ✅ Easy to explain to new agents

### Cons
- ❌ No lifecycle/maturity progression
- ❌ "Projects" conflates HUNT research with VALIDATE code
- ❌ Doesn't map to HIVE phases

---

## Option 2: Pure Medallion Architecture

> **From**: HFO Gen85 Data Engineering Pattern

### Structure

```
sandbox/
├── bronze/                  # Raw, unvalidated (HUNT outputs)
│   ├── 2025-12-31/
│   │   ├── lidless_audit.md
│   │   └── theater_research.md
│   └── 2025-12-30/
├── silver/                  # Validated, cleaned (INTERLOCK+VALIDATE)
│   ├── contracts/           # Zod schemas
│   ├── specs/               # Verified specs
│   └── handoffs/            # Session docs
├── gold/                    # Production-ready (EVOLVE)
│   ├── adapters/            # Working code
│   └── manifests/           # Version-locked
└── archive/                 # Expired Gold (superseded)
    └── gold-v1/
```

### Ratings

| Dimension | Score | Notes |
|-----------|-------|-------|
| Structure | ⭐⭐⭐ | 3-tier + archive |
| HFO Alignment | ⭐⭐⭐⭐⭐ | Direct HIVE mapping |
| Overhead | ⭐⭐⭐ | Medium — lifecycle tracking |
| Scalability | ⭐⭐⭐⭐ | Bronze is time-based |

### Pros
- ✅ **Native to HFO** — Already in architecture
- ✅ **Provenance chain** — Bronze→Silver→Gold traces
- ✅ **TDD aligned** — Research→Test→Implement→Refactor

### Cons
- ❌ When does a doc "promote" to Silver?
- ❌ Same doc in multiple tiers is confusing
- ❌ No category for "reference material"

### HIVE Phase Mapping

| HIVE | Medallion | Output |
|------|-----------|--------|
| H (Hunt) | Bronze | Raw explorations, searches |
| I (Interlock) | Silver (contracts) | Zod schemas, interfaces |
| V (Validate) | Silver (specs) | Validated requirements |
| E (Evolve) | Gold | Production code, exemplars |

---

## Option 3: Timestamped Atomic (Zettelkasten)

> **From**: Niklas Luhmann's slip-box + your Lidless Legion audit naming

### Structure

```
sandbox/
├── docs/
│   ├── 2025-12-31T1330_lidless_legion_audit.md
│   ├── 2025-12-31T1400_theater_taxonomy.md
│   ├── 2025-12-30T2200_fsm_hysteresis.md
│   └── 2025-12-30T0900_w3c_pointer_spec.md
├── index/
│   ├── by-topic.md          # Links to docs by theme
│   ├── by-phase.md          # Links by HIVE phase
│   └── by-commander.md      # Links by Port
└── archive/
    └── closed/              # No longer active links
```

### Ratings

| Dimension | Score | Notes |
|-----------|-------|-------|
| Structure | ⭐⭐ | Flat with indexes |
| HFO Alignment | ⭐⭐⭐ | Needs index discipline |
| Overhead | ⭐⭐ | Low create, high linking |
| Scalability | ⭐⭐⭐⭐⭐ | Scales infinitely |

### Pros
- ✅ **Atomic** — One idea per file
- ✅ **Timestamped** — Perfect audit trail
- ✅ **Matches current pattern** — You're already doing this!

### Cons
- ❌ "Junk drawer" risk without indexes
- ❌ No clear lifecycle
- ❌ Finding related docs requires good linking

---

## Option 4: Hybrid (Medallion + PARA) ⭐ RECOMMENDED

> **Synthesis**: Medallion handles LIFECYCLE, PARA handles STORAGE CLASS

### Structure

```
sandbox/
├── bronze/                  # 🔨 HUNT outputs (raw exploration)
│   ├── 2025-12-31/          # Date-bucketed for easy purging
│   │   ├── lidless_legion_audit/
│   │   │   ├── OBSERVATION_REPORT.md
│   │   │   └── WORKFLOW_CONTRACT.md
│   │   └── theater_research.md
│   └── README.md            # "What goes here"
│
├── silver/                  # 🔗 INTERLOCK + VALIDATE outputs
│   ├── contracts/           # Zod schemas, interfaces
│   │   └── signal.contract.ts
│   ├── specs/               # Verified specifications (SSOT)
│   │   ├── W3C_GESTURE_CONTROL_PLANE.md  # ← hfo_daily_specs moves here
│   │   └── FSM_HYSTERESIS_ARCHITECTURE.md
│   └── handoffs/            # Session continuity documents
│       └── 2025-12-31_session_handoff.md
│
├── gold/                    # ✅ EVOLVE outputs (production)
│   ├── exemplars/           # Canonical code patterns
│   │   └── one-euro-adapter-exemplar.ts
│   └── manifests/           # Version-locked SSOTs
│       └── MANIFEST.json
│
├── resources/               # 📚 PARA: Stable reference (no lifecycle)
│   ├── w3c-pointerevents3/
│   └── mediapipe-gestures/
│
└── archive/                 # 🗄️ PARA: Completed cycles
    ├── gen87-x2/            # Previous gen
    └── closed-hunts/        # Expired bronze
```

### Ratings

| Dimension | Score | Notes |
|-----------|-------|-------|
| Structure | ⭐⭐⭐⭐ | Clear tiers + categories |
| HFO Alignment | ⭐⭐⭐⭐⭐ | Direct HIVE mapping |
| Overhead | ⭐⭐⭐ | Medium — lifecycle + storage |
| Scalability | ⭐⭐⭐⭐ | Generations archive cleanly |

### Pros
- ✅ **Medallion lifecycle** — Bronze→Silver→Gold tracks maturity
- ✅ **PARA storage** — Resources (stable) vs Archive (closed)
- ✅ **HIVE aligned** — Each phase has a home
- ✅ **Respects SSOT** — Silver/specs is authoritative
- ✅ **Timestamping preserved** — Bronze keeps date folders

### Cons
- ⚠️ More folders than pure PARA
- ⚠️ Need clear "promotion rules"

### Migration Path

| Current | Moves To |
|---------|----------|
| `hfo_daily_specs/` | `silver/specs/` (after validation) |
| `research/lidless_audit/` | `bronze/2025-12-31/lidless_audit/` |
| `research/THEATER*.md` | `bronze/2025-12-31/` |
| External W3C specs | `resources/w3c-pointerevents3/` |

### Promotion Rules

| Transition | Trigger | Gate |
|------------|---------|------|
| Bronze → Silver | INTERLOCK phase complete | Has Zod schema OR validated tests |
| Silver → Gold | EVOLVE phase complete | 100% tests GREEN, in production |
| Silver → Archive | Superseded by newer version | Tagged with closure reason |
| Gold → Archive | Next generation starts | Copied to gen-XX folder |

---

## 📊 Comparison Matrix

| Criterion | PARA | Medallion | Zettelkasten | **Hybrid** |
|-----------|------|-----------|--------------|------------|
| Structure clarity | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| HIVE alignment | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Lifecycle tracking | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Reference storage | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Minimal overhead | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Audit trail | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| AI agent friendly | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **TOTAL** | **19** | **23** | **20** | **29** |

---

## 🎯 Recommendation

**Use Option 4: Hybrid (Medallion + PARA)**

### Rationale

1. **HFO Native** — Medallion is already in your architecture (Gen85 AGENTS.md)
2. **HIVE Aligned** — Bronze=H, Silver=I+V, Gold=E, Archive=post-E
3. **SSOT Clear** — `silver/specs/` becomes THE authoritative location
4. **Preserves Your Pattern** — Timestamped bronze folders match your `2025-12-31T1330_` naming
5. **Pareto Optimal** — Best balance of structure + alignment + overhead

### Immediate Actions

1. Create `bronze/`, `silver/`, `gold/`, `resources/`, `archive/` in sandbox/
2. Move `hfo_daily_specs/*.md` → `silver/specs/` (they're past HUNT)
3. Move `research/2025-12-31T1330_*/` → `bronze/2025-12-31/`
4. Update MANIFEST.json with new paths
5. Add promotion gates to AGENTS.md

---

## 📝 Next Steps (Your Choice)

- [ ] **Accept Hybrid** — I'll create the folder structure and migrate
- [ ] **Customize** — Pick elements from multiple options
- [ ] **Defer** — Keep current structure, add later
- [ ] **Different approach** — Describe what you prefer

---

*"The spider weaves the web that weaves the spider."*  
*Port 7 | DECIDE | Gen87.X3*
