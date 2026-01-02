# ⚙️ CONFIG — Playwright Configuration

> **Consolidated Playwright Configs** | Gen87.X3 | 2026-01-02

---

## 🎯 Which Config To Use?

| Use Case | Config | Command |
|----------|--------|---------|
| **Most E2E tests** | `playwright-unified.config.ts` | `npx playwright test --config=playwright-unified.config.ts` |
| **TypeScript demos (Vite)** | `playwright-golden.config.ts` | `npx playwright test --config=playwright-golden.config.ts` |

---

## 📋 Config Inventory

### ✅ Active Configs (at project root)

| Config | Port | Server | Purpose |
|--------|------|--------|---------|
| `playwright-unified.config.ts` | 8081 | http-server | IR-0008 fix, CANONICAL |
| `playwright-golden.config.ts` | 8082 | vite | TypeScript demos |
| `vitest.config.ts` | - | - | Unit tests |

### ⚠️ Deprecated Configs (at project root)

These exist for backwards compatibility but should NOT be used:

| Config | Issue | Alternative |
|--------|-------|-------------|
| `playwright.config.ts` | References stale sandbox/ paths | Use unified |
| `playwright-demo.config.ts` | Legacy | Use unified |
| `playwright-fsm.config.ts` | Legacy | Use unified |
| `playwright-silver.config.ts` | Legacy | Use unified |
| `playwright-down-commit.config.ts` | Specific test | Use unified |
| `playwright-e2e-demos.config.ts` | Legacy | Use unified |

---

## 🔧 Port Assignments

| Port | Service | Config |
|------|---------|--------|
| 8081 | http-server (static) | playwright-unified |
| 8082 | vite (HMR) | playwright-golden |
| 9093 | DEPRECATED | playwright.config.ts |
| 9094 | DEPRECATED | playwright.config.ts |

---

## 🚫 Port Race Condition (IR-0008)

**Problem**: Multiple configs starting servers on different ports caused race conditions.

**Solution**: 
1. Use `reuseExistingServer: true`
2. Standardize on port 8081 for static serving
3. Use port 8082 only for Vite dev server

---

## 📝 Future Cleanup

When ready to clean up deprecated configs:
```bash
# Move to archive (non-destructive)
mkdir -p cold/bronze/archive_configs
mv playwright-demo.config.ts cold/bronze/archive_configs/
mv playwright-fsm.config.ts cold/bronze/archive_configs/
mv playwright-silver.config.ts cold/bronze/archive_configs/
mv playwright-down-commit.config.ts cold/bronze/archive_configs/
mv playwright-e2e-demos.config.ts cold/bronze/archive_configs/
```

---

*Gen87.X3 | 2026-01-02*
