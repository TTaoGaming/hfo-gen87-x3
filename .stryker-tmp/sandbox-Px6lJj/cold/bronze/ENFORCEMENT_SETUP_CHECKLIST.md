# Gen87.X3 Enforcement Setup Checklist

> **Purpose**: Stop fighting AI, start enforcing workflows  
> **Date**: 2025-12-29  
> **Status**: VERIFIED WORKING ✅
> **Principle**: "Complex tools solve complex problems. Stop hacking, start enforcing."

---

## 🎯 CURRENT STATUS

| Component | Status | Verified |
|-----------|--------|----------|
| Memory Bank (6,423 artifacts) | ✅ WORKING | 2025-12-29 |
| GitHub Token | ✅ CONFIGURED | API tested |
| Tavily API Key | ✅ CONFIGURED | Present |
| OpenRouter API Key | ✅ CONFIGURED | Present |
| NPM Dependencies | ✅ INSTALLED | 220 packages |
| TypeCheck | ✅ PASSING | `npm run typecheck` |
| Lint | ✅ PASSING | `npm run lint` |
| Tests | ✅ PASSING | 10/10 tests |
| Git Hooks | ✅ INSTALLED | pre-commit + commit-msg |
| CI/CD Workflow | ✅ CONFIGURED | `.github/workflows/enforce.yml` |

---

## 📋 MASTER CHECKLIST

### Phase 1: MCP Servers ✅ COMPLETE

#### Core MCP Servers (All Auto-Approved)
- [x] **GitHub MCP** - Repo management, issues, PRs
  - Status: ✅ Configured in `.vscode/settings.json`
  - Token: Set in `.env` as `GITHUB_TOKEN`

- [x] **Playwright MCP** - Browser automation & screenshots
  - Status: ✅ Configured and working

- [x] **Memory MCP** - Knowledge graph persistence
  - Status: ✅ Configured and working

- [x] **Sequential Thinking MCP** - Chain-of-thought reasoning
  - Status: ✅ Configured and working

- [x] **Context7 MCP** - Library documentation lookup
  - Status: ✅ Configured and working (tested W3C docs)

- [x] **Filesystem MCP** - Direct file access to `C:/Dev/active`
  - Status: ✅ Configured and working

- [x] **GitKraken MCP** - Advanced git operations
  - Status: ✅ Available (git add/commit/push/stash/blame)

#### Optional MCP Servers
- [ ] **Tavily Search MCP** - Web search (key ready, need to add to config)
- [ ] **Brave Search MCP** - Alternative web search
- [ ] **Fetch MCP** - HTTP requests & web scraping

---

### Phase 2: VS Code Extensions ✅ COMPLETE

#### AI & Copilot
- [x] `github.copilot` - GitHub Copilot
- [x] `github.copilot-chat` - Copilot Chat

#### TDD/BDD Testing
- [x] `ms-playwright.playwright` - Playwright Test Runner
- [x] `vitest.explorer` - Vitest Test Explorer

#### Code Quality & Enforcement
- [x] `biomejs.biome` - Fast linter/formatter
- [x] `dbaeumer.vscode-eslint` - ESLint
- [x] `usernamehw.errorlens` - Inline error display
- [x] `yoavbls.pretty-ts-errors` - Better TS errors

#### Git & GitOps
- [x] `eamodio.gitlens` - Git supercharged
- [x] `github.vscode-pull-request-github` - GitHub PR integration

---

### Phase 3: Environment Variables ✅ COMPLETE

File: `.env` (gitignored)

| Variable | Status | Source |
|----------|--------|--------|
| `GITHUB_TOKEN` | ✅ Set | https://github.com/settings/tokens |
| `TAVILY_API_KEY` | ✅ Set | https://tavily.com |
| `OPENROUTER_API_KEY` | ✅ Set | https://openrouter.ai/keys |
| `BRAVE_API_KEY` | ⬜ Optional | https://brave.com/search/api/ |
| `OPENAI_API_KEY` | ⬜ Optional | https://platform.openai.com |

---

### Phase 4: Git Hooks (TDD/GitOps Enforcement) ✅ COMPLETE

#### Pre-commit Hook (`.husky/pre-commit`)
- [x] TypeScript type check
- [x] Biome lint check
- [x] Run tests on changed files

#### Commit Message Hook (`.husky/commit-msg`)
- [x] Commitlint with HIVE phase support
- [x] Valid types: `H`, `I`, `V`, `E`, `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `revert`

---

### Phase 5: TDD Enforcement Configuration ✅ COMPLETE

#### Vitest Config (`vitest.config.ts`)
- [x] 80% coverage threshold (statements, branches, functions, lines)
- [x] Bail on first error in CI
- [x] Sandbox excluded from tests

#### Playwright Config (`playwright.config.ts`)
- [x] E2E tests in `./e2e/`
- [x] HTML report generation
- [x] Screenshot on failure

---

### Phase 6: CI/CD Enforcement ✅ COMPLETE

File: `.github/workflows/enforce.yml`

| Gate | Check | Blocks Merge |
|------|-------|--------------|
| Gate 1 | Commit Message Validation | ✅ Yes |
| Gate 2 | TypeScript Type Safety | ✅ Yes |
| Gate 3 | Biome Lint | ✅ Yes |
| Gate 4 | Unit Tests with Coverage | ✅ Yes |
| Gate 5 | Coverage Threshold (80%) | ✅ Yes |
| Gate 6 | E2E Tests (Playwright) | ✅ Yes |

---

### Phase 7: GitHub Repository ✅ COMPLETE

#### Repository
- **URL**: https://github.com/TTaoGaming/hfo-gen87-x3
- **Status**: ✅ Public, CI/CD active

#### Setup Steps (DONE)
- [x] Create repo at https://github.com/new
- [x] Add remote and push
- [x] CI workflow triggered and running

#### Branch Protection (RECOMMENDED)
To enable branch protection on `main`:
1. Go to Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - [x] Require PR reviews before merging
   - [x] Require status checks (select "enforce" job)
   - [x] Require branches to be up to date

---

## 🔧 QUICK COMMANDS

```bash
# Run all enforcement gates locally
npm run typecheck && npm run lint && npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Format code
npm run format

# Commit with HIVE phase
git commit -m "H: research pointer events API"
git commit -m "I: add failing tests for gesture recognition"
git commit -m "V: implement gesture handler"
git commit -m "E: refactor gesture module structure"
```

---

## 📊 ENFORCEMENT MATRIX

| Your Pain | Solution | Enforcement Level |
|-----------|----------|-------------------|
| AI doesn't follow instructions | Git hooks + CI gates | 🔴 HARD (blocks commit/merge) |
| AI claims done but tests fail | 80% coverage threshold | 🔴 HARD (CI blocks merge) |
| AI forgets context | Memory bank + AGENTS.md | 🟡 SOFT (in context) |
| AI hallucmates | Cite sources rule | 🟡 SOFT (in AGENTS.md) |
| Bad commit messages | Commitlint with HIVE | 🔴 HARD (blocks commit) |
| Broken code merged | Branch protection | 🔴 HARD (requires PR + checks) |

---

## 🎭 TDD/BDD Workflow

### HIVE/8 = TDD Phases

```
H (Hunt)     = Research     → Read docs, search memory, plan approach
I (Interlock) = RED         → Write failing tests FIRST
V (Validate)  = GREEN       → Write code to make tests pass
E (Evolve)    = REFACTOR    → Clean up, optimize, prepare for next cycle
```

### Commit Message Examples

```bash
# Research phase
git commit -m "H(core): research w3c pointer events specification"

# Write failing tests
git commit -m "I(gesture): add failing tests for pinch-to-zoom"

# Make tests pass
git commit -m "V(gesture): implement pinch-to-zoom handler"

# Refactor
git commit -m "E(gesture): extract common gesture utilities"
```

---

## ✅ VERIFICATION

Run this to verify everything works:

```bash
python sandbox/test_integrations.py
```

Expected output:
```
🎉 ALL INTEGRATIONS WORKING!
```

---

*Gen87.X3 Enforcement Checklist | Last Updated: 2025-12-29*
*"The spider weaves the web that weaves the spider."*
