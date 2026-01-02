# 🎪 DEMOS — Showcase Manifest

> **Gen87.X3 Demonstrations** | 2026-01-02

---

## 📁 Structure

```
demos/
├── MANIFEST.md              # THIS FILE
├── index.html               # Main launcher (links to all demos)
├── vite.config.ts           # Vite config for dev server
├── src/                     # TypeScript sources
│   ├── index.ts             # Launcher page logic
│   ├── showcase-*.ts        # Showcase implementations
│   └── port-*.ts            # Port-specific demos
├── lib/                     # Pre-built bundles
│   └── hfo.js               # Browser bundle (2MB)
├── archive/                 # Deprecated demos
└── *.html                   # Entry points per demo
```

---

## 🎯 Active Showcases

| Demo | HTML | TypeScript | Status | Description |
|------|------|------------|--------|-------------|
| **Launcher** | `index.html` | `src/index.ts` | ✅ | Main demo grid |
| **FSM** | `showcase-fsm.html` | `src/showcase-fsm.ts` | ✅ | XState FSM visualization |
| **GoldenLayout** | `showcase-goldenlayout.html` | `src/showcase-goldenlayout.ts` | ✅ | Multi-pane tiling |
| **Launcher (Full)** | `showcase-launcher.html` | `src/showcase-launcher.ts` | ✅ | Physics + palm cone |
| **Palm Cone** | `showcase-palmcone.html` | `src/showcase-palmcone.ts` | ✅ | Gesture gate demo |
| **Pointer** | `showcase-pointer.html` | `src/showcase-pointer.ts` | ✅ | Pointer event pipeline |
| **Rapier** | `showcase-rapier.html` | `src/showcase-rapier.ts` | ✅ | Physics simulation |
| **Substrate** | `showcase-substrate.html` | `src/showcase-substrate.ts` | ✅ | InMemory/NATS messaging |
| **🆕 Webcam** | `showcase-webcam.html` | `src/showcase-webcam.ts` | ✅ | **FULL Pipeline: Webcam → W3C Pointer Level 3** |

---

## 🔌 Port Demos

| Port | Demo | Status | Description |
|------|------|--------|-------------|
| Port 0 | `port-0-observer.html` | ✅ | Lidless Legion - SENSE |
| Port 1 | `port-1-bridger.html` | ✅ | Web Weaver - FUSE |
| Port 2 | `port-2-shaper.html` | ✅ | Mirror Magus - SHAPE |
| Port 3 | `port-3-injector.html` | ✅ | Spore Storm - DELIVER |

---

## 📦 Archived

| Demo | Reason | Date |
|------|--------|------|
| `11-e2e-pipeline-variant-b.html` | Superseded by showcases | 2026-01-02 |
| `11-full-pipeline-orchestrator.html` | Superseded | 2026-01-02 |
| `12-golden-unified.html` | Superseded | 2026-01-02 |
| `13-golden-fsm-dual.html` | Superseded | 2026-01-02 |
| `sensor-demo.html` | Superseded | 2026-01-02 |
| `smoother-demo.html` | Superseded | 2026-01-02 |

---

## 🚀 Running Demos

### Development (Vite)
```bash
cd demos
npx vite --port 8082
# Open http://localhost:8082
```

### Production (http-server)
```bash
npx http-server . -p 8081 --cors -c-1
# Open http://localhost:8081/demos/index.html
```

### E2E Testing
```bash
npx playwright test --config=playwright-golden.config.ts
```

---

## 📝 Adding New Demos

1. Create `demos/showcase-{name}.html`
2. Create `demos/src/showcase-{name}.ts`
3. Update this MANIFEST
4. Add to `demos/src/index.ts` DEMOS array
5. Create E2E test in `e2e/`

---

## 🔧 Dependencies

All demos import from `../../hot/bronze/src/browser/index.js`:
- Adapters (Rapier, OneEuro, XState, etc.)
- Schemas (SensorFrame, FSM types)
- Gates (Palm Cone)
- Substrate (InMemory, NATS)

---

*Gen87.X3 | 2026-01-02*
