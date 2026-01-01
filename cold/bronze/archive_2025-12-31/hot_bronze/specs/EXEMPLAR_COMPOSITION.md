# 📦 EXEMPLAR COMPOSITION — No Bespoke Code

> **Gen87.X3** | **Port 1 (Web Weaver)** | **FUSE**
> **Rule**: If an exemplar exists, USE IT. No hand-rolling.

---

## 🎯 PRINCIPLE

**"Code is liability, exemplars are assets."**

Every hand-rolled implementation is:
- More bugs to fix
- More tests to write
- More maintenance burden
- Less battle-tested

---

## 📋 EXEMPLAR REGISTRY (Authoritative)

| Component | NPM Package | ESM CDN | Author | Status |
|-----------|-------------|---------|--------|--------|
| **1€ Filter** | `1eurofilter@1.2.2` | `https://esm.sh/1eurofilter@1.2.2` | Géry Casiez ✅ | ✅ Installed |
| **FSM** | `xstate@5.25.0` | `https://esm.sh/xstate@5.25.0` | Stately.ai | ✅ Installed |
| **Validation** | `zod@3.25.76` | `https://esm.sh/zod@3.25.76` | Colin McDonnell | ✅ Installed |
| **Hand Tracking** | `@mediapipe/tasks-vision` | `cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8` | Google | ✅ CDN |
| **Layout** | `golden-layout@2.6.0` | `esm.sh/golden-layout@2.6.0` | Golden Layout | ✅ CDN |

---

## 🚫 THEATER PATTERNS (Banned)

### ❌ Hand-Rolled 1€ Filter
```javascript
// BAD - Hand-rolled
function oneEuroFilter(x, y, timestamp) {
  const alpha = 1.0 / (1.0 + tau / (2 * Math.PI * cutoff * dt));
  // ... 40 lines of reimplementation
}

// GOOD - Use exemplar
import { OneEuroFilter } from '1eurofilter';
const filter = new OneEuroFilter();
const smoothed = filter.filter(value, timestamp);
```

### ❌ Inline FSM
```javascript
// BAD - Hand-rolled state machine
let state = 'DISARMED';
if (gesture === 'fist') state = 'ARMING';
if (state === 'ARMED' && gesture === 'open') state = 'ACTIVE';

// GOOD - Use XState
import { createMachine, createActor } from 'xstate';
const machine = createMachine({ /* proper FSM */ });
const actor = createActor(machine);
```

### ❌ Class-in-HTML
```html
<!-- BAD - Inline adapter class -->
<script>
class OneEuroAdapter {
  // 50 lines of code in HTML
}
</script>

<!-- GOOD - Import from module -->
<script type="module">
import { OneEuroAdapter } from './adapters/one-euro.adapter.js';
</script>
```

---

## ✅ COMPOSITION PATTERN

### 1€ Filter Adapter (Wrapping Exemplar)

```typescript
// sandbox/src/adapters/one-euro.adapter.ts
import { OneEuroFilter } from '1eurofilter';
import { SmoothedFrameSchema, SensorFrameSchema } from '../contracts/schemas.js';

export class OneEuroAdapter implements SmootherPort {
  private filters: Map<string, OneEuroFilter> = new Map();
  
  smooth(frame: SensorFrame): SmoothedFrame {
    // Wrap the EXEMPLAR, don't reimplement
    const landmarks = frame.landmarks.map((hand, hi) =>
      hand.map((lm, li) => {
        const key = `${hi}-${li}-x`;
        if (!this.filters.has(key)) {
          this.filters.set(key, new OneEuroFilter({ frequency: 60 }));
          this.filters.set(`${hi}-${li}-y`, new OneEuroFilter({ frequency: 60 }));
        }
        return {
          x: this.filters.get(key)!.filter(lm.x, frame.timestamp),
          y: this.filters.get(`${hi}-${li}-y`)!.filter(lm.y, frame.timestamp),
          z: lm.z,
        };
      })
    );
    
    return SmoothedFrameSchema.parse({ ...frame, landmarks, smoothed: true });
  }
}
```

### XState FSM Adapter

```typescript
// sandbox/src/adapters/xstate-fsm.adapter.ts
import { createMachine, createActor, assign, setup } from 'xstate';
import { GestureStateSchema } from '../contracts/schemas.js';

// XState v5 setup pattern (typed)
const gestureMachine = setup({
  types: {
    context: {} as { x: number; y: number; gesture: string },
    events: {} as 
      | { type: 'HAND'; x: number; y: number }
      | { type: 'LOST' }
      | { type: 'FIST' }
      | { type: 'OPEN' }
      | { type: 'MOVE'; x: number; y: number },
  },
}).createMachine({
  id: 'gesture',
  initial: 'idle',
  context: { x: 0.5, y: 0.5, gesture: 'None' },
  states: {
    idle: { on: { HAND: 'tracking' } },
    tracking: {
      on: {
        LOST: 'idle',
        FIST: 'pressing',
        MOVE: { actions: assign({ x: ({ event }) => event.x, y: ({ event }) => event.y }) },
      },
    },
    pressing: {
      on: {
        LOST: 'idle',
        OPEN: 'tracking',
        MOVE: { actions: assign({ x: ({ event }) => event.x, y: ({ event }) => event.y }) },
      },
    },
  },
});

export class XStateFSMAdapter implements FSMPort {
  private actor = createActor(gestureMachine);
  
  constructor() {
    this.actor.start();
  }
  
  send(event: GestureEvent): GestureState {
    this.actor.send(event);
    return GestureStateSchema.parse(this.actor.getSnapshot().context);
  }
}
```

---

## 🔧 ENFORCEMENT

### Pre-Commit Gate
```bash
npm run detect:theater
# Fails if hand-rolled patterns found
```

### V-Phase Gate
```bash
npm run v-phase
# Blocks inline FSM, inline 1€, etc.
```

---

## 📊 CURRENT STATUS

| Component | Status | Action |
|-----------|--------|--------|
| `1eurofilter` | ✅ npm installed | Refactor adapters to use |
| `xstate` | ✅ npm installed | Already using in demos |
| `zod` | ✅ npm installed | Already using |
| Inline classes in HTML | ❌ 8 violations | Extract to modules |
| Hand-rolled 1€ | ❌ 2 violations | Refactor to use npm |

Run `npm run detect:theater` to see current violations.

---

## 🎯 MIGRATION PLAN

1. **Create wrapper adapters** that use npm exemplars
2. **Extract inline classes** from HTML to TypeScript modules
3. **Update demos** to import from modules
4. **Add pre-commit gate** to block new theater

---

*"No bespoke code. Compose exemplars."*
*Gen87.X3 | Web Weaver | FUSE*
