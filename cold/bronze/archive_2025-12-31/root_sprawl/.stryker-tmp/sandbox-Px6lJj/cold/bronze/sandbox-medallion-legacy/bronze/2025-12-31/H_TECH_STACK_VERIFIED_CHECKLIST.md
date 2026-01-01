# 📋 HFO Gen87.X3 Tech Stack Checklist

> **Date**: 2025-12-31 | **Phase**: HUNT | **Gen**: 87.X3  
> **Purpose**: Verify installed packages, adapter status, and demo compliance

---

## 📊 SUMMARY MATRIX

| Category | Installed | Has Adapter | Has Tests | HFO Ready |
|----------|-----------|-------------|-----------|-----------|
| Core Pipeline | 5 | 5 | ✅ 267 | ✅ |
| Infrastructure | 4 | 1 | ⚠️ 0 | ❌ |
| AI/ML | 3 | 0 | ❌ | ❌ |
| UI/Viz | 2 | 0 | ⚠️ | ❌ |
| Testing | 5 | N/A | N/A | ✅ |

---

## 🟢 TIER 1: PRODUCTION READY — Tested + Hexagonal

These have adapters implementing port interfaces with GREEN tests.

| Package | Version | Adapter | Port | Tests | Status |
|---------|---------|---------|------|-------|--------|
| `1eurofilter` | 1.2.2 | `OneEuroExemplarAdapter` | `SmootherPort` | 13 ✅ | **READY** |
| `xstate` | 5.25.0 | `XStateFSMAdapter` | `FSMPort` | 27 ✅ | **READY** |
| `@dimforge/rapier2d-compat` | 0.19.3 | `RapierPhysicsAdapter` | `SmootherPort` | ✅ | **READY** |
| `zod` | 3.25.76 | N/A (contracts) | All Ports | ✅ | **READY** |
| `@mediapipe/tasks-vision` | 0.10.22 | `MediaPipeAdapter` | `SensorPort` | ✅ | **READY** |

### How to Use:
```typescript
import { OneEuroExemplarAdapter } from './adapters/one-euro-exemplar.adapter';
import { XStateFSMAdapter } from './adapters/xstate-fsm.adapter';
import { GesturePipeline } from './adapters/pipeline';

// Hexagonal composition - adapters are swappable
const pipeline = new GesturePipeline({
  sensor: new MediaPipeAdapter(config),
  smoother: new OneEuroExemplarAdapter({ minCutoff: 1.0 }),
  fsm: new XStateFSMAdapter(),
  emitter: new PointerEventAdapter(document)
});
```

---

## 🟡 TIER 2: INSTALLED + ADAPTER EXISTS — Not Hexagonal

These have code but don't implement standard port interfaces.

| Package | Version | Adapter File | Issue | Action |
|---------|---------|--------------|-------|--------|
| `@nats-io/*` | 3.3.0 | `nats-substrate.adapter.ts` (462 lines) | **NO PORT!** | Create `SubstratePort` |
| `golden-layout` | 2.6.0 | CDN only in demos | No adapter | Create `UIShellPort` adapter |
| `pixi.js` | 8.14.3 | Test mocks only | No real adapter | Create `OverlayPort` adapter |

### NATS Status:
```
File: sandbox/src/adapters/nats-substrate.adapter.ts
Lines: 462
Implements: NOTHING (should be SubstratePort)
Tests: 0
```

---

## 🔴 TIER 3: INSTALLED — Completely Orphan

No adapter, no tests, no integration. Just `npm install` artifacts.

| Package | Version | Purpose | Adapter | Tests |
|---------|---------|---------|---------|-------|
| `@temporalio/client` | 1.14.0 | Durable workflows | ❌ None | ❌ |
| `@temporalio/worker` | 1.14.0 | Workflow workers | ❌ None | ❌ |
| `@temporalio/workflow` | 1.14.0 | Workflow definitions | ❌ None | ❌ |
| `@temporalio/activity` | 1.14.0 | Activity handlers | ❌ None | ❌ |
| `@langchain/core` | 1.1.8 | LLM foundation | ❌ None | ❌ |
| `@langchain/langgraph` | 1.0.7 | Agent graphs | ❌ None | ❌ |
| `@langchain/openai` | 1.2.0 | OpenAI LLM | ❌ None | ❌ |
| `openai` | 6.15.0 | Raw OpenAI SDK | ❌ None | ❌ |
| `rxjs` | 7.8.2 | Reactive streams | ❌ None | ❌ |
| `@opentelemetry/api` | 1.9.0 | Tracing API | Partial | Partial |
| `@opentelemetry/sdk-trace-web` | 2.2.0 | Web tracing | Partial | Partial |

---

## 🚨 DEMO QUARANTINE MANIFEST

### Demos to QUARANTINE (Inline Code, Not HFO):

| Demo | Location | Issue | Quarantine |
|------|----------|-------|------------|
| `demo-golden` | `_staging_for_removal/demo-golden/` | CDN imports, inline XState | ✅ Already staged |
| `demo-puter` | `_staging_for_removal/demo-puter/` | Inline adapters | ✅ Already staged |
| `demo-real` | `_staging_for_removal/demo-real/` | Claims "real" but inline | ✅ Already staged |
| `demo` | `_staging_for_removal/demo/` | Legacy inline | ✅ Already staged |
| `demos/main` | `sandbox/demos/main/` | **CDN esm.sh imports!** | ⚠️ QUARANTINE |
| `demo-daedalos` | `_staging_for_removal/demo-daedalos/` | Unknown status | ✅ Already staged |

### Evidence — `demos/main/index.html` uses CDN not HFO adapters:
```javascript
// Line 278-282 - CDN IMPORTS (NOT HFO!)
import { GoldenLayout } from 'https://esm.sh/golden-layout@2.6.0';
import { connect, StringCodec } from 'https://esm.sh/nats.ws@1.30.3';
import { GestureRecognizer, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8';
import { z } from 'https://esm.sh/zod@3.24.1';
import { createActor, createMachine, assign } from 'https://esm.sh/xstate@5.19.2';
```

This is **reward hacking** - the demo looks complete but doesn't test the actual HFO architecture!

---

## ✅ WHAT AN HFO-COMPLIANT DEMO LOOKS LIKE

### Required Components:
1. **Import from `dist/` or compiled adapters** - NOT CDN
2. **Use port interfaces** - `SensorPort`, `SmootherPort`, `FSMPort`, `EmitterPort`
3. **Pipeline composition** - `GesturePipeline` orchestrating adapters
4. **Zod validation** - Contracts at every boundary
5. **Stigmergy logging** - Emit to blackboard or NATS

### Demo Contract:
```typescript
// CORRECT: Import compiled HFO adapters
import { MediaPipeAdapter } from '../src/adapters/mediapipe.adapter.js';
import { OneEuroExemplarAdapter } from '../src/adapters/one-euro-exemplar.adapter.js';
import { XStateFSMAdapter } from '../src/adapters/xstate-fsm.adapter.js';
import { PointerEventAdapter } from '../src/adapters/pointer-event.adapter.js';
import { GesturePipeline } from '../src/adapters/pipeline.js';

// NOT: CDN imports like esm.sh
```

---

## 🎯 ACTION ITEMS

### P0: Quarantine Reward-Hacking Demos
- [ ] Move `sandbox/demos/main/` to `_staging_for_removal/`
- [ ] Create `sandbox/demos/production/` for HFO-compliant demos

### P1: Create HFO W3C Golden Layout Demo
- [ ] Use compiled browser bundle
- [ ] Import real adapters via `dist/browser-bundle.js`
- [ ] Wire MediaPipe → 1€ → XState → PointerEvent → GoldenLayout
- [ ] Add stigmergy logging to blackboard

### P2: Wire Missing Adapters
- [ ] Create `SubstratePort` interface
- [ ] Make `NatsSubstrateAdapter implements SubstratePort`
- [ ] Create `GoldenLayoutShellAdapter implements UIShellPort`
- [ ] Create `TemporalWorkflowAdapter implements WorkflowPort`

---

## 📈 CURRENT TEST COVERAGE

| Test Bucket | Passed | Failed | Todo | Coverage |
|-------------|--------|--------|------|----------|
| `adapters/` | 224 | 13 | 51 | ~78% |
| `smoothers/` | 43 | 0 | 3 | ~93% |
| `contracts/` | ✅ | 0 | - | 100% |
| `pipeline/` | ✅ | 0 | - | - |

### Run Tests:
```bash
npm run test:bucket:adapters
npm run test:bucket:smoothers
npm run test:bucket:contracts
```

---

## 🏗️ BROWSER BUNDLE STATUS

| Bundle | Location | Status |
|--------|----------|--------|
| `browser-bundle.ts` | `sandbox/src/adapters/` | Source exists |
| Compiled output | `sandbox/dist/` | ❓ Check if built |

### Build Command:
```bash
npm run build:bundle
```

---

*Source: Gen 87.X3 HUNT Phase Analysis*  
*Lidless Legion @ Port 0 | 2025-12-31*
