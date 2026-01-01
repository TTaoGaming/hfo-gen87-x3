# GEN87 X3.2 HANDOFF — Zero-Trust Machine-Enforceable Architecture

> **Branch**: `gen87-x3.2/develop`
> **Parent**: `gen87-x3.1/develop` @ commit `1275792`
> **Date**: 2025-01-01
> **Status**: Active Development

---

## 🚨 WHY THIS GENERATION EXISTS

**The Problem (X3.1 Discovery):**
```
"the ai says it's doing the right thing and then when I check it's all lies"
"there is no trust in our system there can't be because we've been burned too much"
```

AI agents repeatedly created **"slop"** — cosmetic compliance without real implementation:
- Files that looked right but had empty functions
- Types that compiled but had wrong semantics
- Tests that passed but didn't test anything
- Documentation that described non-existent code

**The Solution (X3.2 Mandate):**
```
"create constraint based and machine enforceable architecture"
"entirely machine enforceable... verified and trust there is no trust"
```

---

## 🔒 ZERO-TRUST ARCHITECTURE PRINCIPLES

### 1. Machine Gates Over Instructions

| OLD (X3.1) | NEW (X3.2) |
|------------|------------|
| "Please follow TDD" | Pre-commit blocks without tests |
| "Don't import from cold/" | dependency-cruiser enforces boundaries |
| "Use proper types" | `tsc --noEmit` must pass |
| "Format code correctly" | biome check blocks commit |

### 2. Proven Gates (X3.1 Validation)

The pre-commit hook blocked 5+ invalid commits in X3.1. Each required REAL fixes:

| Gate | What It Caught |
|------|----------------|
| TypeCheck | tsconfig pointing to empty folder, 27 type errors |
| Lint | Thousands of errors in archived files |
| Smoke Tests | Missing exemplar files |
| Depcruise | (Ready for boundary violations) |
| Commit-msg | Non-conventional commit format |

**This proves the gates work.** They don't just warn — they BLOCK.

### 3. The Trust Hierarchy

```
TRUST LEVEL 0 (None):     AI-generated code
TRUST LEVEL 1 (Machine):  Code that passes all gates
TRUST LEVEL 2 (Human):    Code reviewed by human
TRUST LEVEL 3 (Proven):   Code validated in production
```

X3.2 operates at Trust Level 1. No code enters without machine validation.

---

## 🏗️ CURRENT INFRASTRUCTURE

### Pre-Commit Gates (`.husky/pre-commit`)

```bash
# 4 Sequential Gates - ALL must pass
1. TypeCheck:    tsc --noEmit
2. Lint:         npx biome check .
3. Smoke Tests:  npx vitest run hot/silver/architecture.smoke.test.ts
4. Depcruise:    npx depcruise hot/ --config .constraint-rules.mjs
```

### Dependency Boundaries (`.constraint-rules.mjs`)

```javascript
// Forbidden paths
hot/ → cold/          // Hot cannot import archived code
adapters/ → adapters/ // Adapters cannot import each other
```

### Architecture Smoke Tests (`hot/silver/architecture.smoke.test.ts`)

- Bronze contracts must exist
- Bronze source files must exist
- Files must not be empty
- Files must have valid TypeScript

---

## 📁 DIRECTORY STRUCTURE

```
hot/                      # Active development (machine-validated)
├── bronze/              # Implementation tier
│   ├── src/
│   │   ├── adapters/   # Port implementations (currently empty)
│   │   └── contracts/  # BDD contracts (port-contracts.ts)
│   └── quarantine/     # Failed code awaiting repair
├── silver/              # Test tier
│   └── architecture.smoke.test.ts
└── gold/                # Proven tier (empty - nothing proven yet)

cold/                     # Archives (READ-ONLY, ignored by all tools)
├── bronze/archive_*/    # Historical code
├── silver/              # (empty)
└── gold/                # (empty)
```

---

## 🔴 QUARANTINED CODE

**Location**: `hot/bronze/quarantine/`
**Count**: 6 files, 17 TypeScript errors

These files were moved from `hot/bronze/src/adapters/` because they failed typecheck.
They are NOT deleted — they can be repaired and returned.

**Recovery Process**:
1. Fix TypeScript errors in quarantine
2. Run `tsc --noEmit` on individual file
3. Move back to `hot/bronze/src/adapters/`
4. Commit (gates will validate)

---

## 🎯 X3.2 DEVELOPMENT FOCUS

### Priority 1: Strengthen Machine Gates
- [ ] Add mutation testing gate (Stryker)
- [ ] Add coverage threshold gate
- [ ] Add property-based test gate (fast-check)
- [ ] Add contract validation gate

### Priority 2: Rehabilitate Quarantine
- [ ] Fix deliver-goldenlayout.ts (GoldenLayout API)
- [ ] Fix fuse-wrapper.ts (null checks)
- [ ] Fix shape-passthrough.ts (unused variables)
- [ ] Fix sense-mediapipe.ts (type assertions)

### Priority 3: New Development
- All new code MUST:
  - Pass all gates before commit
  - Have corresponding tests
  - Have corresponding contracts
  - Not import from cold/

---

## 📜 COMMIT CONVENTIONS

All commits MUST use conventional commit format:

```
feat(scope): description      # New feature
fix(scope): description       # Bug fix
refactor(scope): description  # Code improvement
test(scope): description      # Test changes
docs(scope): description      # Documentation
chore(scope): description     # Maintenance
```

The commit-msg hook enforces this. Non-compliant commits are REJECTED.

---

## 🚫 WHAT AI AGENTS MUST NOT DO

1. **Don't claim compliance** — Let the gates verify
2. **Don't skip gates** — Use `--no-verify` only with explicit human approval
3. **Don't create empty files** — Smoke tests catch this
4. **Don't import from cold/** — Depcruise catches this
5. **Don't commit broken types** — TypeCheck catches this

---

## ✅ WHAT AI AGENTS MUST DO

1. **Run gates locally** before attempting commit
2. **Fix failures** rather than bypassing gates
3. **Quarantine bad code** rather than deleting it
4. **Document decisions** in handoff files
5. **Emit signals** to blackboard for coordination

---

## 🔗 KEY FILES

| File | Purpose |
|------|---------|
| `.husky/pre-commit` | Machine validation gates |
| `.constraint-rules.mjs` | Dependency boundary rules |
| `biome.json` | Lint/format configuration |
| `tsconfig.json` | TypeScript configuration |
| `hot/silver/architecture.smoke.test.ts` | Exemplar validation |
| `hot/bronze/quarantine/README.md` | Quarantine documentation |

---

## 📊 GENERATION METRICS

| Metric | X3.1 (End) | X3.2 (Target) |
|--------|------------|---------------|
| Gate Coverage | 4 gates | 6+ gates |
| Quarantine Files | 6 | 0 |
| Test Coverage | Unknown | 80%+ |
| Mutation Score | Unknown | 70%+ |

---

*"There is no trust in our system. There can't be."*
*— X3.2 Founding Principle*
