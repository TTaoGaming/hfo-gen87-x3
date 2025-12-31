# HFO Gen87.X3 | W3C Gesture Control Plane | Golden Layout Demo

> **Phase**: V (Validate) | **Port**: 3 (Injector) | **Gen**: 87.X3  
> **Status**: HFO-Compliant Demo

---

## 🎯 Purpose

This demo validates the HFO hexagonal architecture by using **compiled adapters** instead of CDN imports. It proves:

1. **SensorPort** → MediaPipeAdapter works
2. **SmootherPort** → OneEuroExemplarAdapter works  
3. **FSMPort** → XStateFSMAdapter works
4. **EmitterPort** → PointerEventAdapter emits W3C events
5. **Golden Layout** receives W3C PointerEvents

---

## ✅ HFO Compliance Checklist

| Requirement | Status |
|-------------|--------|
| Uses `dist/hfo-adapters.js` | ✅ |
| Uses port interfaces | ✅ SmootherPort |
| Zod validation | ✅ (via bundle) |
| W3C PointerEvents | ✅ |
| Stigmergy logging | ✅ Console + buffer |
| Golden Layout panels | ✅ |

---

## 🚀 Running the Demo

### 1. Build the HFO Bundle
```bash
npm run build:bundle
```

### 2. Serve the Demo
```bash
npx http-server sandbox/demos/hfo-golden-mediapipe -p 8080
```

### 3. Open Browser
```
http://localhost:8080
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Golden Layout Shell                       │
├─────────────────┬───────────────────┬───────────────────────┤
│ 📷 Camera       │ 🎯 Target Panel   │ 🔧 Pipeline Status    │
│                 │                   │                       │
│ MediaPipe       │ W3C PointerEvents │ Stage 0: SensorPort   │
│ Landmark Viz    │ → pointermove     │ Stage 1: SmootherPort │
│                 │ → pointerdown     │ Stage 2: FSMPort      │
│                 │ → pointerup       │ Stage 3: EmitterPort  │
└─────────────────┴───────────────────┴───────────────────────┘
                          ↑
                          │
              ┌───────────┴───────────┐
              │ HFO Adapter Pipeline  │
              │ (from hfo-adapters.js)│
              └───────────────────────┘
```

---

## 📦 Files

| File | Purpose |
|------|---------|
| `index.html` | Main demo (HFO-compliant) |
| `../../dist/hfo-adapters.js` | Compiled HFO bundle |

---

## 🔗 Dependencies

- **HFO Bundle**: `dist/hfo-adapters.js` (build with `npm run build:bundle`)
- **Golden Layout**: CDN (UI framework, not HFO core)

---

## ⚠️ NOT Using

This demo explicitly does NOT use:
- ❌ `esm.sh` CDN imports for XState/Zod/etc
- ❌ Inline state machines
- ❌ Ad-hoc adapter implementations
- ❌ Reward-hacking shortcuts

---

*Gen87.X3 | VALIDATE Phase | Port 3 (Injector)*
