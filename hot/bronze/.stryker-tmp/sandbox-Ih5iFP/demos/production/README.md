# Gen87.X3 PRODUCTION W3C Pointer Demo

> **Status**: ✅ ALL REAL ADAPTERS — NO THEATER

This demo wires **REAL npm packages** together, not inline stub implementations.

---

## What Makes This PRODUCTION (Not Theater)

| Component | Theater Version | PRODUCTION Version |
|-----------|----------------|-------------------|
| 1€ Filter | Inline `class LowPassFilter {}` | `import { OneEuroFilter } from '1eurofilter'` |
| FSM | Inline `if/else` chain | `import { setup, createActor } from 'xstate'` |
| Pointer Events | Manual `new PointerEvent()` | W3C PointerEventFactory with Zod validation |
| Layout | Static HTML divs | `import { GoldenLayout } from 'golden-layout'` |

---

## 5-Stage Pipeline (ALL REAL)

```
VideoFrame
    │
    ▼
┌────────────────────────────────────────────────────────────────────┐
│ Stage 1: SENSE — MediaPipe Tasks Vision 0.10.8                     │
│   GestureRecognizer.recognizeForVideo(video, timestamp)            │
│   → SensorFrame (Zod validated)                                    │
└────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────────┐
│ Stage 2: SMOOTH — npm 1eurofilter@1.2.2 (Géry Casiez)              │
│   OneEuroFilter.filter(value, timestamp)                           │
│   → SmoothedFrame (Zod validated)                                  │
│   Citation: CHI '12, 1€ Filter paper                               │
└────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────────┐
│ Stage 3: FSM — XState v5.19.2 (Stately.ai)                         │
│   setup({ guards, actions }).createMachine({ states })             │
│   → FSMAction { type: MOVE|DOWN|UP|CLICK|CANCEL, position, state } │
└────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────────┐
│ Stage 4: EMIT — W3C PointerEvent Level 3                           │
│   W3CPointerEventFactory.fromFSMAction(action)                     │
│   → PointerEvent[] (pointerdown, pointermove, pointerup)           │
│   @see https://www.w3.org/TR/pointerevents/                        │
└────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────────┐
│ Stage 5: INJECT — DOM dispatchEvent()                              │
│   targetElement.dispatchEvent(pointerEvent)                        │
│   → Events received by target element listeners                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## ESM.SH Imports (Zero Build Required)

```javascript
// Layout - Golden Layout 2.6.0 (NO jQuery)
import { GoldenLayout } from 'https://esm.sh/golden-layout@2.6.0';

// Validation - Zod 3.24
import { z } from 'https://esm.sh/zod@3.24.1';

// FSM - XState v5 (REAL state machine)
import { createActor, setup, assign } from 'https://esm.sh/xstate@5.19.2';

// Smoothing - 1€ Filter by Géry Casiez (OFFICIAL npm package)
import { OneEuroFilter } from 'https://esm.sh/1eurofilter@1.2.2';

// Sensor - MediaPipe Tasks Vision
import { GestureRecognizer, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8';
```

---

## Running the Demo

1. **Serve the folder** (any static server):
   ```bash
   npx serve sandbox/demos/production
   # or
   python -m http.server 8080 --directory sandbox/demos/production
   ```

2. **Open in browser**: `http://localhost:8080` (or appropriate port)

3. **Grant camera permission** when prompted

4. **Use gestures**:
   - **Open Palm** → ARM the system
   - **Pointing Up / Closed Fist** → CLICK
   - **Victory** → NAVIGATE mode

---

## Verification Checklist

- [x] `OneEuroFilter` imported from `1eurofilter` npm package
- [x] `setup()` API from XState v5 (not inline if/else)
- [x] `GoldenLayout` from golden-layout (NO jQuery dependency)
- [x] W3C PointerEvent with proper `pointerId`, `pointerType`, `pressure`
- [x] Zod schema validation on all pipeline stages
- [x] DOM `dispatchEvent()` on real target element

---

## References

- **1€ Filter**: https://gery.casiez.net/1euro/
- **XState v5**: https://stately.ai/docs
- **Golden Layout**: https://golden-layout.com/
- **W3C Pointer Events**: https://www.w3.org/TR/pointerevents/
- **MediaPipe**: https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer

---

*Gen87.X3 | Port 2 (SHAPE) | V-PHASE PRODUCTION*
