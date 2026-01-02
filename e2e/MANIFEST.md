# 🧪 E2E — Test Manifest

> **Playwright E2E Tests** | Gen87.X3 | 2026-01-02

---

## 📁 Structure

```
e2e/
├── MANIFEST.md                    # THIS FILE
├── golden-master.spec.ts          # Showcase golden tests
├── demo-visual-test.spec.ts       # Visual regression tests
├── demo-freeze-diagnosis.spec.ts  # Freeze detection
├── down-commit-visual-test.spec.ts # Commit visualization
├── e2e-pipeline-variant-b.spec.ts # Pipeline variant tests
├── fsm-showcase.spec.ts           # FSM tests
└── __snapshots__/                 # Visual snapshots
```

---

## 🎯 Active Tests

| Test File | Config | Status | Description |
|-----------|--------|--------|-------------|
| `golden-master.spec.ts` | `playwright-golden.config.ts` | ✅ | All showcase demos |
| `demo-visual-test.spec.ts` | `playwright-unified.config.ts` | ✅ | Visual regression |
| `fsm-showcase.spec.ts` | `playwright-unified.config.ts` | ✅ | FSM behavior |
| `demo-freeze-diagnosis.spec.ts` | `playwright-unified.config.ts` | 🔧 | Debugging |
| `down-commit-visual-test.spec.ts` | `playwright-down-commit.config.ts` | 🔧 | Commit vis |
| `e2e-pipeline-variant-b.spec.ts` | `playwright-unified.config.ts` | 🔧 | Pipeline |

---

## ⚙️ Playwright Configs

| Config | Port | Server | Use For |
|--------|------|--------|---------|
| `playwright-unified.config.ts` | 8081 | http-server | **DEFAULT** |
| `playwright-golden.config.ts` | 8082 | vite | TypeScript demos |
| `playwright.config.ts` | 9093/9094 | http-server | **DEPRECATED** |

### Canonical Usage
```bash
# Most tests - use unified config
npx playwright test --config=playwright-unified.config.ts

# Golden demos with Vite
npx playwright test --config=playwright-golden.config.ts
```

---

## 🏃 Running Tests

### All E2E
```bash
npx playwright test --config=playwright-unified.config.ts
```

### Specific File
```bash
npx playwright test e2e/golden-master.spec.ts --config=playwright-golden.config.ts
```

### With UI
```bash
npx playwright test --ui --config=playwright-unified.config.ts
```

### Debug Mode
```bash
npx playwright test --debug --config=playwright-unified.config.ts
```

---

## 📸 Snapshots

Location: `e2e/__snapshots__/`

Updating snapshots:
```bash
npx playwright test --update-snapshots --config=playwright-unified.config.ts
```

---

## 🚫 Known Issues

| Issue | Status | Workaround |
|-------|--------|------------|
| Port race conditions | Fixed | Use unified config with `reuseExistingServer: true` |
| Stale sandbox refs | Open | playwright.config.ts references non-existent paths |
| Video fixture missing | Open | golden-master/video-fixture.spec.ts deleted |

---

## 📝 Adding New Tests

1. Create `e2e/{feature}.spec.ts`
2. Use `playwright-unified.config.ts` unless needing Vite
3. Update this MANIFEST
4. Add to CI workflow if critical

---

*Gen87.X3 | 2026-01-02*
