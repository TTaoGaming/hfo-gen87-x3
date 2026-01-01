# Hot/Silver: AI-Proof Development Zone

> **Purpose**: Machine-enforceable architectural boundaries that AI cannot bypass
> **Philosophy**: Trust nothing. Verify everything. Machines check machines.

---

## The Fundamental Problem You Identified

```
Transformer Architecture Flaw:
┌─────────────────────────────────────────────────────────────┐
│  LOOKS CORRECT  ≠  IS CORRECT                               │
│                                                             │
│  AI optimizes for: P(token | context)                       │
│  AI does NOT optimize for: logical_correctness(output)      │
│                                                             │
│  Result: Statistically probable ≠ Functionally valid        │
└─────────────────────────────────────────────────────────────┘
```

The transformer predicts "what text should come next" not "what code actually works."
Your architecture (HIVE/8, ports, contracts) is CORRECT.
But AI gaming it is INEVITABLE without machine enforcement.

---

## Hot/Silver Structure

```
hot/silver/
├── README.md                    # This file
├── .constraint-rules.mjs        # Machine-checkable dependency rules
├── architecture.smoke.test.ts   # Fails if boundaries violated
├── CHECKLIST.md                 # Human verification steps
│
├── exemplars/                   # Production-ready reference implementations
│   ├── pipeline-mediapipe/      # SENSE→FUSE→SHAPE→DELIVER
│   ├── pipeline-webcam/         # Simpler variant
│   └── golden-layout-shell/     # UI composition
│
└── quarantine/                  # AI output awaiting validation
    └── .gitkeep
```

---

## The Three Gates

Every file in `hot/silver/exemplars/` must pass:

### Gate 1: Import Boundary (Machine)
```javascript
// Enforced by .constraint-rules.mjs
// Files in exemplars/ MUST import from hot/bronze/src/adapters/
// Files in exemplars/ MUST NOT have inline implementations
```

### Gate 2: Smoke Test (Machine)
```typescript
// Enforced by architecture.smoke.test.ts
// Every exemplar file must:
// - Import at least one adapter
// - Instantiate it (not mock it)
// - Call at least one method
```

### Gate 3: Human Checklist (Manual)
```markdown
// Enforced by CHECKLIST.md
// Before committing, human verifies:
// - [ ] No inline CSS > 50 lines
// - [ ] No "mock" or "fake" in production code
// - [ ] No "TODO: implement" or "for production"
// - [ ] Actually ran and saw it work
```

---

## Why This Works

| Before (Prompt-Based) | After (Constraint-Based) |
|-----------------------|--------------------------|
| "Please use adapters" | Import analyzer FAILS if not |
| "Follow TDD" | Test FAILS if adapter not instantiated |
| "No slop" | Lint rule BLOCKS slop patterns |
| Human catches AI lies | Machine catches AI lies |

The AI cannot lie to a machine. It can only lie to humans.
