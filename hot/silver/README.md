# Hot/Silver: AI-Proof Development Zone

> **Purpose**: Machine-enforceable architectural boundaries that AI cannot bypass
> **Philosophy**: Trust nothing. Verify everything. Machines check machines.
> **Tests**: 67 passing | **Mutation Score**: 96% (OneEuroSmoother)

---

## 📊 Current Status

| Component | Tests | Mutation Score | Status |
|-----------|-------|----------------|--------|
| 8-Port Architecture | 12 | N/A | ✅ PROVEN |
| Port Contracts | 35 | N/A | ✅ PROVEN |
| OneEuroSmoother | 12 | **96.15%** | ✅ SILVER |
| NATS Integration | 3 | N/A | ✅ PASSING |
| Architecture Smoke | 5 | N/A | ✅ ENFORCED |

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| [8_PORT_ARCHITECTURE.md](8_PORT_ARCHITECTURE.md) | Full 8-port documentation, commander table |
| [POLYMORPHIC_COMPOSITION.md](POLYMORPHIC_COMPOSITION.md) | How to prove adapters are interchangeable |
| [MUTATION_TESTING_GUIDE.md](MUTATION_TESTING_GUIDE.md) | How to run Stryker, interpret results |
| [MEDALLION_ARCHITECTURE_20260101.md](MEDALLION_ARCHITECTURE_20260101.md) | Bronze → Silver → Gold flow |
| [CHECKLIST.md](CHECKLIST.md) | Human verification steps |

---

## The Fundamental Problem

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

---

## Hot/Silver Structure

```
hot/silver/
├── README.md                         # This file
├── 8_PORT_ARCHITECTURE.md            # Full 8-port documentation
├── POLYMORPHIC_COMPOSITION.md        # Composition proof
├── MUTATION_TESTING_GUIDE.md         # How to run mutation tests
├── 8-port-composition.test.ts        # 12 tests for polymorphism
├── .constraint-rules.mjs             # Machine-checkable dependency rules
├── architecture.smoke.test.ts        # Fails if boundaries violated
├── CHECKLIST.md                      # Human verification steps
│
└── exemplars/                        # Production-ready reference implementations
    └── README.md                     # Promotion criteria
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

## 🧪 Terminal Proof Commands

```powershell
# 1. Run all tests (67 passing)
npm test

# 2. Run 8-port composition tests
npx vitest run hot/silver/8-port-composition.test.ts

# 3. Run mutation testing on OneEuroSmoother
npx stryker run --mutate "hot/bronze/quarantine/one-euro-smoother.ts"

# 4. Type check
npx tsc --noEmit
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

---

*Gen87-X3.1 | Hot/Silver | 2026-01-01*
