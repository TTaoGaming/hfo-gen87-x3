# 📋 MANIFEST — HFO Gen87.X3 Repository Structure

> **Generated**: 2026-01-02 | **Gen**: 87.X3 | **Status**: GOLD

---

## 🎯 Purpose

This manifest documents the canonical repository structure and protection rules.
**AI agents MUST read this before modifying any files.**

---

## 📁 Directory Structure

```
hfo_gen87_x3/
├── MANIFEST.md              # THIS FILE - Repository map
├── AGENTS.md                # AI agent instructions
├── llms.txt                 # Quick context for LLMs
│
├── hot/                     # 🔥 ACTIVE DEVELOPMENT
│   ├── MANIFEST.md          # Medallion tier rules
│   ├── gold/                # Specifications, SSOT (READ-ONLY)
│   ├── silver/              # Designs, exemplars (REVIEW-REQUIRED)
│   └── bronze/              # Implementation code (EDITABLE)
│
├── cold/                    # 🧊 ARCHIVED (READ-ONLY)
│   ├── gold/                # Archived specs
│   ├── silver/              # Archived designs
│   └── bronze/              # Archived code
│
├── demos/                   # 🎪 SHOWCASE DEMOS
│   ├── MANIFEST.md          # Demo inventory
│   ├── src/                 # TypeScript sources
│   └── *.html               # Entry points
│
├── e2e/                     # 🧪 E2E TESTS
│   ├── MANIFEST.md          # Test inventory
│   └── *.spec.ts            # Playwright specs
│
├── config/                  # ⚙️ CONFIGURATION (consolidated)
│   ├── playwright/          # All playwright configs
│   └── README.md            # Config usage guide
│
├── scripts/                 # 🔧 Build/daemon scripts
└── tools/                   # 🛠️ Development utilities
```

---

## 🛡️ Protection Rules

### 🥇 GOLD Tier (READ-ONLY for AI)
```
hot/gold/**           → NEVER modify without explicit user approval
cold/**               → NEVER modify (archived)
MANIFEST.md           → NEVER modify without explicit user approval
AGENTS.md             → APPEND-ONLY observations section
```

### 🥈 SILVER Tier (REVIEW-REQUIRED)
```
hot/silver/**         → Modifications require justification in commit
*.config.ts           → Document why changes needed
package.json          → Log dependency changes
```

### 🥉 BRONZE Tier (EDITABLE)
```
hot/bronze/src/**     → Standard TDD workflow
demos/src/**          → Showcase code
e2e/**                → Test code
```

---

## 📊 File Inventory

### Root Configuration Files
| File | Purpose | Status |
|------|---------|--------|
| `playwright-unified.config.ts` | **CANONICAL** - IR-0008 fix, port 8081 | ✅ USE THIS |
| `playwright-golden.config.ts` | Vite-based demos, port 8082 | ✅ ACTIVE |
| `playwright.config.ts` | Legacy - references stale sandbox/ | ⚠️ DEPRECATED |
| `playwright-demo.config.ts` | Legacy | ⚠️ DEPRECATED |
| `playwright-fsm.config.ts` | Legacy | ⚠️ DEPRECATED |
| `playwright-silver.config.ts` | Legacy | ⚠️ DEPRECATED |
| `playwright-down-commit.config.ts` | Legacy | ⚠️ DEPRECATED |
| `playwright-e2e-demos.config.ts` | Legacy | ⚠️ DEPRECATED |
| `vitest.config.ts` | Unit tests | ✅ ACTIVE |
| `biome.json` | Linter config | ✅ ACTIVE |
| `tsconfig.json` | TypeScript config | ✅ ACTIVE |

### Key Documentation
| File | Purpose |
|------|---------|
| `hot/gold/HFO_ARCHITECTURE_SSOT.md` | Single Source of Truth |
| `hot/silver/SILVER_EXECUTIVE_SUMMARY_20260101.md` | Architecture summary |
| `hot/bronze/TTV_PRIMITIVES_CHECKLIST.md` | Implementation checklist |

---

## 🚫 Anti-Sprawl Rules

1. **ONE canonical playwright config** - Use `playwright-unified.config.ts`
2. **NO sandbox/ at root** - Use `demos/` for showcases
3. **NO orphan HTML files at root** - Must be in `demos/`
4. **Archive before delete** - Move to `cold/` not `rm`
5. **MANIFEST per directory** - Document contents before adding

---

## 🔄 Maintenance

When adding files:
1. Check if directory has MANIFEST.md
2. Update relevant MANIFEST with new file
3. Follow protection tier rules
4. Use medallion structure (gold/silver/bronze)

---

*"The spider weaves the web that weaves the spider."*
*Gen87.X3 | 2026-01-02*
