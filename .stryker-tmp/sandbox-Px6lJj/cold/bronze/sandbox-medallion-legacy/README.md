# 🏅 Medallion Datalake — HFO Gen87.X3

> **Created**: 2025-12-31  
> **Purpose**: HIVE-aligned documentation lifecycle management  
> **Pattern**: Bronze → Silver → Gold progression

---

## 📁 Structure

```
sandbox-medallion/
├── bronze/              # 🔨 HUNT outputs (raw exploration)
│   └── YYYY-MM-DD/      # Date-bucketed for easy archival
│       └── *.md         # Timestamped research docs
│
├── silver/              # 🔗 INTERLOCK + VALIDATE outputs
│   ├── specs/           # Verified specifications (SSOT)
│   ├── contracts/       # Zod schemas, interfaces
│   └── handoffs/        # Session continuity documents
│
├── gold/                # ✅ EVOLVE outputs (production-ready)
│   ├── exemplars/       # Canonical code patterns
│   └── manifests/       # Version-locked references
│
├── resources/           # 📚 Stable reference material (no lifecycle)
│
└── archive/             # 🗄️ Completed generations, closed hunts
```

---

## 🔄 Lifecycle Rules

### HIVE Phase → Medallion Tier

| HIVE Phase | Medallion Tier | Content |
|------------|----------------|---------|
| **H (Hunt)** | Bronze | Raw explorations, Tavily searches, audits |
| **I (Interlock)** | Silver (contracts) | Zod schemas, interfaces |
| **V (Validate)** | Silver (specs) | Tested specifications |
| **E (Evolve)** | Gold | Production code, exemplars |

### Promotion Gates

| Transition | Trigger | Validation |
|------------|---------|------------|
| Bronze → Silver | INTERLOCK phase start | Has Zod schema OR failing tests written |
| Silver → Gold | EVOLVE phase complete | 100% tests GREEN, in production |
| Gold → Archive | New generation starts | Tagged with closure reason |
| Bronze → Archive | 7 days old, not promoted | Auto-archive or delete |

---

## 📋 Naming Conventions

### Bronze (HUNT research)
```
bronze/YYYY-MM-DD/TOPIC_DESCRIPTOR.md
bronze/2025-12-31/LIDLESS_LEGION_CONSOLIDATED_STATE.md
bronze/2025-12-31/FSM_HYSTERESIS_RESEARCH.md
```

### Silver (Validated specs)
```
silver/specs/TOPIC_SPEC.md
silver/contracts/topic.contract.ts
silver/handoffs/YYYY-MM-DD_session_handoff.md
```

### Gold (Production)
```
gold/exemplars/topic-exemplar.ts
gold/manifests/MANIFEST.json
```

---

## 🎯 Quick Reference

| I need to... | Put it in... |
|--------------|--------------|
| Research a topic | `bronze/YYYY-MM-DD/` |
| Define a contract | `silver/contracts/` |
| Write a spec | `silver/specs/` |
| Hand off to next session | `silver/handoffs/` |
| Store production pattern | `gold/exemplars/` |
| Reference external docs | `resources/` |
| Archive old generation | `archive/genXX/` |

---

*The spider weaves the web that weaves the spider.*
