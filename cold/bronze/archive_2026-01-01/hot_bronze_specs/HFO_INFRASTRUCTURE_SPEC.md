# 🏗️ HFO Infrastructure Spec — TODO Manifest

> **Generated**: 2025-01-01  
> **Archive Source**: `cold/bronze/archive_2025-12-31/`  
> **Purpose**: Actionable task list for HFO infrastructure  
> **Priority**: Execute in order

---

## 📋 Today's Infrastructure Tasks

### 🔴 PRIORITY 1: AI Adoption (2 hours)

**Problem**: AGENTS.md is 500+ lines, AI doesn't use the architecture

| Task | File | Est. | Status |
|------|------|------|--------|
| [ ] Create 20-line quick reference | `hot/bronze/AI_QUICK_REF.md` | 30m | |
| [ ] Export schemas from single index | `hot/bronze/src/shared/index.ts` | 30m | |
| [ ] Add copy-paste signal examples | `AI_QUICK_REF.md` | 30m | |
| [ ] Test with fresh Claude session | Manual | 30m | |

**Quick Reference Template**:
```markdown
# HFO Quick Ref (Keep under 20 lines)
- **Signal**: {ts,mark,pull,msg,type,hive,gen,port}
- **HIVE**: H(hunt)→I(interlock)→V(validate)→E(evolve)
- **Ports**: 0=sense,1=fuse,2=shape,3=deliver,4=test,5=defend,6=store,7=decide
- **Test**: `npm run prove:[piece]`
- **Mutate**: `npx stryker run --mutate "path/to/file.ts"`
```

---

### 🔴 PRIORITY 2: Web Weaver Manifest (1 hour)

**Problem**: No registry of what pieces exist and their quality status

| Task | File | Est. | Status |
|------|------|------|--------|
| [ ] Create manifest.json | `hot/bronze/WEAVER_MANIFEST.json` | 30m | |
| [ ] Inventory archived adapters | From archive | 20m | |
| [ ] Add mutation scores (null for now) | manifest.json | 10m | |

**Manifest Schema**:
```json
{
  "pieces": [
    {
      "name": "one-euro",
      "path": "src/adapters/one-euro-exemplar.adapter.ts",
      "port": 2,
      "tests": 12,
      "mutationScore": null,
      "status": "archived"
    }
  ]
}
```

---

### 🟡 PRIORITY 3: Per-Piece Testing Scripts (1 hour)

**Problem**: Can't test individual adapters in isolation

| Task | File | Est. | Status |
|------|------|------|--------|
| [ ] Add prove:* scripts | `package.json` | 30m | |
| [ ] Document in README | `hot/bronze/README.md` | 15m | |
| [ ] Test one adapter | Terminal | 15m | |

**Scripts to Add**:
```json
{
  "prove:one-euro": "vitest run src/adapters/one-euro*.test.ts",
  "prove:mediapipe": "vitest run src/adapters/mediapipe*.test.ts",
  "prove:xstate": "vitest run src/adapters/xstate*.test.ts",
  "prove:pointer": "vitest run src/adapters/pointer*.test.ts",
  "prove:schemas": "vitest run src/shared/*.test.ts"
}
```

---

### 🟡 PRIORITY 4: Fix Import Paths (1 hour)

**Problem**: Stryker sandbox breaks due to relative imports

| Task | File | Est. | Status |
|------|------|------|--------|
| [ ] Audit current import patterns | Grep search | 20m | |
| [ ] Create path alias in tsconfig | `tsconfig.json` | 20m | |
| [ ] Update imports to use alias | `src/**/*.ts` | 20m | |

**Path Alias Config**:
```json
{
  "compilerOptions": {
    "paths": {
      "@hfo/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"],
      "@adapters/*": ["./src/adapters/*"]
    }
  }
}
```

---

## 📋 This Week's Infrastructure Tasks

### 🔵 PRIORITY 5: HIVE/8 Enforcement (4 hours)

**Problem**: Detection ≠ Prevention. 309+ violations detected but damage done.

| Task | File | Est. | Status |
|------|------|------|--------|
| [ ] Create MCP tool gating server | `src/mcp/hive-enforcer.ts` | 2h | |
| [ ] Implement phase-based tool hiding | hive-enforcer.ts | 1h | |
| [ ] Add to VS Code config | `.vscode/settings.json` | 30m | |
| [ ] Test with constrained session | Manual | 30m | |

**Phase → Tool Matrix**:
```
HUNT:      read_file, grep_search, semantic_search, tavily ✅
           create_file, edit_file, run_terminal ❌ HIDDEN

INTERLOCK: create_file (tests only), edit_file (contracts) ✅
           runTests ❌ HIDDEN (reward hack prevention)

VALIDATE:  create_file, edit_file (implementation), runTests ✅
           delete tests ❌ BLOCKED

EVOLVE:    edit_file (refactor), run_terminal (git) ✅
           new features ❌ BLOCKED (that's next HUNT)
```

---

### 🔵 PRIORITY 6: Pre-Commit Hooks (2 hours)

**Problem**: No gate before code enters repo

| Task | File | Est. | Status |
|------|------|------|--------|
| [ ] Install husky | `npm i -D husky` | 10m | |
| [ ] Add pre-commit hook | `.husky/pre-commit` | 30m | |
| [ ] Add commit-msg hook | `.husky/commit-msg` | 30m | |
| [ ] Test hook rejection | Manual | 30m | |

**Pre-Commit Checks**:
```bash
#!/bin/sh
# .husky/pre-commit

# 1. Type check
npm run typecheck || exit 1

# 2. Lint
npm run lint || exit 1

# 3. Tests for changed files
npm run test:changed || exit 1

# 4. Schema validation
npm run validate:schemas || exit 1
```

---

### 🔵 PRIORITY 7: Medallion Layer Structure (1 hour)

**Problem**: Hot/cold/bronze/silver/gold layers created but not documented

| Task | File | Est. | Status |
|------|------|------|--------|
| [ ] Document layer semantics | `README.md` | 30m | |
| [ ] Create promotion criteria | `PROMOTION_CRITERIA.md` | 30m | |

**Layer Semantics**:
```
hot/           = Active work (mutable)
cold/          = Archives (immutable reference)

bronze/        = Unproven (compiles, may have tests)
silver/        = Validated (tests GREEN, mutation >60%)
gold/          = Production (battle-tested, documented)
```

**Promotion Criteria**:
```
BRONZE → SILVER:
- [ ] All tests GREEN
- [ ] Mutation score >60%
- [ ] No HIVE violations in creation
- [ ] Zod schema at boundary

SILVER → GOLD:
- [ ] Mutation score >80%
- [ ] Property-based tests
- [ ] E2E test coverage
- [ ] User documentation
- [ ] 30-day stability
```

---

## 📋 Future Infrastructure Tasks

### ⚪ PRIORITY 8: Package Promotion Workflow

**Problem**: Can't extract pieces as standalone npm packages

| Task | Est. | Status |
|------|------|--------|
| [ ] Create package template | 2h | |
| [ ] Write extraction script | 2h | |
| [ ] Publish `@hfo/one-euro` | 1h | |
| [ ] Document promotion process | 1h | |

---

### ⚪ PRIORITY 9: Temporal.io Integration

**Problem**: Workflow state doesn't survive VS Code crashes

| Task | Est. | Status |
|------|------|--------|
| [ ] Set up Temporal server (docker) | 2h | |
| [ ] Create HIVE workflow definition | 4h | |
| [ ] Migrate phases to Activities | 4h | |
| [ ] Add durability tests | 2h | |

---

### ⚪ PRIORITY 10: CrewAI Workers

**Problem**: Claude is expensive for grunt work

| Task | Est. | Status |
|------|------|--------|
| [ ] Set up OpenRouter | 1h | |
| [ ] Create Lidless agent (DeepSeek) | 2h | |
| [ ] Create Web Weaver agent (GPT-4m) | 2h | |
| [ ] Integrate with Spider orchestration | 2h | |

---

## 🔑 Key Metrics to Track

| Metric | Target | Current | Tracking |
|--------|--------|---------|----------|
| Test Count | >500 | 0 | `npm test` |
| Mutation Score | >60% | N/A | `npm run mutate` |
| HIVE Violations | 0 | N/A | Blackboard |
| AI Compliance | >90% | ~20% | Session audits |
| Build Time | <30s | N/A | CI |

---

## 📂 Files to Create/Restore

### Create Fresh (in hot/bronze/)
- [ ] `AI_QUICK_REF.md`
- [ ] `WEAVER_MANIFEST.json`
- [ ] `README.md`
- [ ] `src/shared/index.ts`

### Selectively Restore (from archive)
- [ ] `src/shared/schemas.ts`
- [ ] `src/shared/contracts/*.ts`
- [ ] Core adapter files (see W3C_POINTER_SPEC.md)

---

*Spider Sovereign — Port 7 — DECIDE*  
*"The spider weaves the web that weaves the spider."*
