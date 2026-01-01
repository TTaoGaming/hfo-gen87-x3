# Medallion Architecture - Single Entry Point Enforcement

**Date**: 2026-01-01
**Status**: ENFORCED via pre-commit gates

---

## The Problem (Before)

AI had 10+ bypass routes to dump code anywhere:

```
Before: SIEVE (many holes)
─────────────────────────────
AI → hot/bronze/quarantine/  ← intended
AI → hot/bronze/src/         ← bypass
AI → hot/silver/quarantine/  ← bypass (WRONG TIER!)
AI → hot/silver/exemplars/   ← bypass (skips promotion)
AI → hot/silver/*.ts         ← bypass
AI → hot/gold/*              ← bypass
AI → new-folder/             ← bypass
AI → root/*.ts               ← bypass
```

---

## The Solution (After)

Single entry point with promotion gates:

```
After: FUNNEL (one entry)
─────────────────────────────

                    ┌─────────────────────────────────┐
                    │       AI GENERATES CODE          │
                    └──────────────┬──────────────────┘
                                   │
                                   ▼
              ┌────────────────────────────────────────┐
              │   hot/bronze/quarantine/               │
              │   (ONLY entry point for new code)      │
              │   • Untrusted                          │
              │   • Unvalidated                        │
              │   • Machine gates not yet run          │
              └──────────────┬─────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            │         MACHINE GATES           │
            │  • TypeCheck                    │
            │  • Lint                         │
            │  • Tests                        │
            │  • Dependency boundaries        │
            │  • Smoke tests                  │
            └────────────────┬────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐          ┌─────────────────┐
    │ PASS → PROMOTE  │          │ FAIL → REJECT   │
    │ to silver/      │          │ to cold/bronze/ │
    └────────┬────────┘          └─────────────────┘
             │
             ▼
    ┌─────────────────────────────────────────┐
    │   hot/silver/exemplars/                 │
    │   (Machine-validated, curated)          │
    │   • TypeCheck passed                    │
    │   • Tests passed                        │
    │   • Dependency rules passed             │
    │   • Human review pending                │
    └──────────────┬──────────────────────────┘
                   │
      ┌────────────┴────────────┐
      │      HUMAN REVIEW       │
      │  • Code review          │
      │  • Functional test      │
      │  • Architecture check   │
      └────────────┬────────────┘
                   │
                   ▼
    ┌─────────────────────────────────────────┐
    │   hot/gold/released/                    │
    │   (Production-ready, approved)          │
    │   • Human approved                      │
    │   • Integration tested                  │
    │   • Ready for production                │
    └─────────────────────────────────────────┘
```

---

## Pre-commit Gates (6 Total)

| Gate | What It Checks | Blocks |
|------|----------------|--------|
| 1. TypeCheck | `tsc --noEmit` | Type errors |
| 2. Lint | `biome check` | Style/lint violations |
| 3. Smoke Tests | Architecture patterns | Slop patterns, missing imports |
| 4. Dep Boundaries | `dependency-cruiser` | Wrong imports |
| 5. Folder Whitelist | Silver structure | Unauthorized folders |
| 6. **Single Entry Point** | New code location | Code outside quarantine |

---

## Gate 6: Single Entry Point Rule

```bash
# New .ts/.js/.html files MUST be in hot/bronze/quarantine/
NEW_CODE=$(git diff --cached --name-only --diff-filter=A \
  | grep -E '\.(ts|tsx|js|jsx|html)$' \
  | grep -v 'hot/bronze/quarantine/' \
  | grep -v '\.test\.' \
  | grep -v '\.spec\.')

if [ -n "$NEW_CODE" ]; then
  echo "❌ BLOCKED: New code files must go to hot/bronze/quarantine/"
  exit 1
fi
```

---

## Folder Structure (Enforced)

```
hot/                          # Active development
├── bronze/                   # Tier 1: Raw/Untrusted
│   ├── quarantine/          # ← ONLY entry point for new code
│   └── src/                 # (legacy - should migrate to silver)
├── silver/                   # Tier 2: Validated/Curated
│   └── exemplars/           # ← Machine-validated code only
└── gold/                     # Tier 3: Production/Released
    └── released/            # ← Human-approved only

cold/                         # Archive (read-mostly)
├── bronze/
│   └── rejected/            # Failed validation
├── silver/
│   └── deprecated/          # Replaced components
└── gold/
    └── archive/             # Old releases
```

---

## How AI Should Work Now

### Correct Flow
```
1. AI creates new-component.ts
2. AI places it in hot/bronze/quarantine/new-component.ts
3. Commit triggers pre-commit gates
4. All gates pass → commit succeeds
5. Later: human runs promotion script → moves to silver
```

### Blocked Flows
```
❌ AI creates hot/silver/new-component.ts
   → Gate 6 blocks: "must go to quarantine"

❌ AI creates hot/bronze/src/new-component.ts
   → Gate 6 blocks: "must go to quarantine"

❌ AI creates hot/silver/demo/index.ts
   → Gate 5 blocks: "unauthorized folder"
   → Gate 6 blocks: "must go to quarantine"

❌ AI creates slop-folder/bypass.ts
   → Gate 6 blocks: "must go to quarantine"
```

---

## Why This Works

| Before | After |
|--------|-------|
| 10+ entry points | 1 entry point |
| AI chooses where to write | AI has no choice |
| Human catches bypasses | Machine catches bypasses |
| Instructions (gameable) | Constraints (enforced) |
| Sieve (many holes) | Funnel (one path) |

---

## Remaining Work

1. **Promotion script**: `npm run promote` to move quarantine → silver
2. **Rejection script**: `npm run reject` to move failed → cold/bronze
3. **Migrate legacy**: Move `hot/bronze/src/*` to appropriate tier
4. **CI enforcement**: Same gates on GitHub Actions

---

*The funnel has one opening. The sieve has many holes.*
