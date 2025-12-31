# W3C Pointer Gesture Control Product Specification
**SSOT**: Single Source of Truth for Gesture Control Product  
**Date**: 2025-12-31T19:31:23Z  
**Generation**: 87.X3  
**Status**: ACTIVE - This document defines the product requirements

---

## Purpose

This specification defines the **W3C Pointer Gesture Control Plane** product, a universal gesture control system that converts hand gestures to W3C-compliant pointer events for any target application.

Based on: [LIDLESS LEGION Audit](../sandbox/audits/LIDLESS_LEGION_STATUS_REPORT.md) and existing architecture.

---

## 1. Product Vision

### 1.1 Core Concept
**Transform ANY hand gesture into W3C PointerEvents for ANY target application**

```
Hand Gesture → MediaPipe → Smoothing → FSM → W3C Pointer → Target Adapter → ANY APP
                                                                    ↓
                                          ┌─────────────────────────┴───────────────────┐
                                          │                                             │
                                     DOM/Canvas                                    Emulators
                                     Excalidraw                                    v86 (x86)
                                     tldraw                                        js-dos
                                     Any element                                   EmulatorJS
                                                                                   daedalOS
                                                                                   Puter
```

### 1.2 User Stories

**As a developer**, I want to:
- Control Excalidraw drawings with hand gestures
- Navigate a DOS emulator with air pointing
- Interact with cloud OS (Puter) using gesture commands
- Swap gesture detection algorithms at runtime
- Add new target adapters without changing the pipeline

**As an end user**, I want to:
- Point at screen with index finger to move cursor
- Make thumb-middle pinch gesture to click
- Open palm to reset/calibrate
- See visual feedback when gestures are recognized
- Have smooth, responsive cursor movement

---

## 2. Architecture (Hexagonal CDD)

### 2.1 5-Stage Pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  STAGE 1 │───▶│  STAGE 2 │───▶│  STAGE 3 │───▶│  STAGE 4 │───▶│  STAGE 5 │
│  SENSOR  │    │  SMOOTH  │    │   FSM    │    │  OUTPUT  │    │  TARGET  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
    ▲               ▲               ▲               ▲               ▲
    │               │               │               │               │
SensorPort    SmootherPort      FSMPort      EventFactoryPort  TargetPort
```

**Communication**: NATS JetStream (NOT direct calls)

---

### 2.2 Stage 1: Input Sensing (SensorPort)

**Purpose**: Detect hand landmarks and gestures

**Primary Implementation**: MediaPipe Hands
- **File**: `sandbox/src/adapters/mediapipe.adapter.ts` (235 LOC)
- **Status**: ✅ REAL, ✅ WORKING
- **Wiring**: ✅ Connected (via CDN)

**Output**:
```typescript
interface HandLandmarks {
  landmarks: { x: number; y: number; z: number }[]; // 21 points
  handedness: 'Left' | 'Right';
  confidence: number; // 0.0 - 1.0
  timestamp: number;
}

interface GestureRecognition {
  gesture: 'Open_Palm' | 'Closed_Fist' | 'Pointing_Up' | 'Victory' | 'ILoveYou' | 'None';
  confidence: number;
  timestamp: number;
}
```

**Contract**: `SensorPort` (Zod schema)

**Alternative Implementations**:
- TensorFlow.js HandPose (manual gesture detection)
- WebHID controllers (non-standard)

---

### 2.3 Stage 2: Smoothing/Physics (SmootherPort)

**Purpose**: Denoise, predict, smooth cursor trajectory

**Implementations**:

#### A. OneEuro Filter (1€)
- **File**: `sandbox/src/adapters/one-euro-exemplar.adapter.ts` (212 LOC)
- **Status**: ✅ REAL, ✅ TESTED, ❌ NOT WIRED
- **Algorithm**: Adaptive low-pass filter with speed compensation
- **Package**: `1eurofilter@1.2.2`

```typescript
interface OneEuroConfig {
  minCutoff: number; // Default: 1.0 (lower = smoother)
  beta: number;      // Default: 0.007 (higher = faster response)
  dcutoff: number;   // Default: 1.0
}
```

#### B. Rapier Spring-Damper
- **File**: `sandbox/src/physics/rapier-wasm-simulator.ts` (165 LOC)
- **Status**: ✅ REAL, ✅ TESTED, ❌ NOT WIRED
- **Algorithm**: Physics-based spring-damper with prediction
- **Package**: `@dimforge/rapier2d-compat@0.19.3`

```typescript
interface SpringDamperConfig {
  stiffness: number;  // Spring constant
  damping: number;    // Damping coefficient
  mass: number;       // Pointer mass
}
```

#### C. Smoother Chain
- **File**: `sandbox/src/smoothers/smoother-chain.ts` (89 LOC)
- **Status**: ✅ REAL, ✅ TESTED, ❌ NOT WIRED
- **Purpose**: Compose multiple smoothers in sequence

```typescript
const chain = new SmootherChain([
  new OneEuroSmoother({ minCutoff: 1.0, beta: 0.007 }),
  new SpringDamperSmoother({ stiffness: 50, damping: 10, mass: 1 })
]);
```

**Contract**: `SmootherPort` (Zod schema)

---

### 2.4 Stage 3: State Machine (FSMPort)

**Purpose**: Manage gesture state transitions and arming logic

**Primary Implementation**: XState v5
- **File**: `sandbox/src/adapters/xstate-fsm.adapter.ts` (552 LOC)
- **Status**: ✅ REAL, ✅ TESTED, ❌ NOT WIRED
- **Package**: `xstate@5.25.0`

**States**:
```typescript
type GestureState = 
  | 'DISARMED'   // Default: hand not detected or not oriented
  | 'ARMING'     // Palm detected, waiting for stability
  | 'ARMED'      // Ready to accept gestures (sticky)
  | 'ACTIVE'     // Gesture in progress (e.g., pointer down)
```

**Transitions**:
```
DISARMED ──palm_oriented──▶ ARMING ──500ms──▶ ARMED ──gesture_detected──▶ ACTIVE
    ▲                                           │                              │
    │                                           │◀──gesture_released───────────┘
    │                                           │
    └───────────palm_lost_5s──────────────────┘
```

**Key Features**:
- **Sticky ARMED state**: Stays armed until explicit reset
- **Palm orientation gate**: Must face camera
- **Hysteresis**: Prevent false triggers
- **Reset gestures**: Open palm or return to oriented position

**Contract**: `FSMPort` (Zod schema)

**Alternative**: robot.js (tiny FSM library)

---

### 2.5 Stage 4: W3C Pointer Output (EventFactoryPort)

**Purpose**: Generate W3C-compliant PointerEvent objects

**Primary Implementation**: W3CPointerEventFactory
- **File**: `sandbox/src/adapters/pointer-event.adapter.ts` (249 LOC)
- **Status**: ✅ REAL, ✅ TESTED, ⚠️ PARTIAL WIRING

**W3C Spec Compliance**:
```typescript
interface PointerEventInit {
  // Required W3C properties
  pointerId: number;           // Unique ID per pointer
  pointerType: 'mouse' | 'pen' | 'touch';
  isPrimary: boolean;          // True for first/only pointer
  
  // Position
  clientX: number;             // Viewport coordinates
  clientY: number;
  screenX: number;             // Screen coordinates
  screenY: number;
  
  // Pressure & tilt
  pressure: number;            // 0.0 - 1.0
  tiltX: number;               // -90 to 90 degrees
  tiltY: number;
  twist: number;               // 0 - 359 degrees
  
  // Button state
  button: number;              // -1 (none), 0 (primary), 1 (middle), 2 (secondary)
  buttons: number;             // Bitmask
  
  // Dimensions
  width: number;               // Contact geometry
  height: number;
}
```

**Event Types**:
- `pointermove`: Cursor movement
- `pointerdown`: Gesture activation (e.g., pinch)
- `pointerup`: Gesture release
- `pointercancel`: Tracking lost

**Coordinate Conversion**:
```typescript
// Normalized [0, 1] → Viewport pixels
function normalizedToViewport(pos: { x: number; y: number }): { x: number; y: number } {
  return {
    x: Math.round(pos.x * viewport.width),
    y: Math.round(pos.y * viewport.height)
  };
}
```

**Contract**: `EventFactoryPort` (Zod schema)

---

### 2.6 Stage 5: Target Adapters (TargetPort)

**Purpose**: Route pointer events to specific applications

**Implementations**:

#### A. DOM Adapter (WORKING)
- **File**: `sandbox/src/adapters/dom-target.adapter.ts`
- **Status**: ⚠️ PARTIAL (inline in demos)
- **Method**: `element.dispatchEvent(pointerEvent)`

```typescript
class DOMTargetAdapter implements TargetPort {
  constructor(private target: HTMLElement) {}
  
  dispatch(event: PointerEvent): boolean {
    return this.target.dispatchEvent(event);
  }
}
```

#### B. Excalidraw Adapter (FUTURE)
- **Target**: Excalidraw canvas (54K ⭐)
- **API**: `onPointerDown`, `onPointerMove`, `onPointerUp` callbacks
- **Challenge**: Must translate to Excalidraw's coordinate system

#### C. tldraw Adapter (FUTURE)
- **Target**: tldraw canvas (15K ⭐)
- **API**: DOM renderer (standard pointer events)
- **Challenge**: Very low (direct DOM)

#### D. daedalOS Adapter (PLACEHOLDER)
- **File**: `sandbox/src/adapters/daedalos-target.adapter.ts` (475 LOC)
- **Status**: ❌ PLACEHOLDER (throws on init)
- **Target**: daedalOS window manager (12K ⭐)
- **API**: Window routing + event injection

#### E. Puter Adapter (PLACEHOLDER)
- **File**: `sandbox/src/adapters/puter-window.adapter.ts` (358 LOC)
- **Status**: ❌ PLACEHOLDER (throws on init)
- **Target**: Puter cloud OS (38K ⭐)
- **API**: Cloud OS APIs

#### F. v86 Emulator Adapter (FUTURE)
- **Target**: v86 x86 emulator (19K ⭐)
- **API**: `bus.send('mouse-delta', dx, dy)` or absolute positioning
- **Challenge**: Coordinate mapping, mouse lock

#### G. js-dos / EmulatorJS Adapters (FUTURE)
- **Target**: DOS emulators
- **API**: `setMouseSensitivity()`, pointer lock
- **Challenge**: Emulator-specific APIs

**Contract**: `TargetPort` (Zod schema)

---

## 3. Event Bus Architecture (NATS)

### 3.1 Subjects (JetStream Topics)
```
sensor.mediapipe       → Raw hand landmarks
smooth.oneeuro         → Smoothed position
fsm.xstate            → State transitions
pointer.w3c           → W3C PointerEvents
target.dom            → DOM dispatch results
target.excalidraw     → Excalidraw routing
target.emulator       → Emulator routing
```

### 3.2 Message Flow
```typescript
// Stage 1: Sensor publishes landmarks
await js.publish('sensor.mediapipe', JSON.stringify(landmarks));

// Stage 2: Smoother subscribes & publishes
const sub = await js.subscribe('sensor.mediapipe');
for await (const msg of sub) {
  const landmarks = JSON.parse(msg.data);
  const smoothed = smoother.smooth(landmarks);
  await js.publish('smooth.oneeuro', JSON.stringify(smoothed));
}

// Stage 3: FSM subscribes & publishes actions
const sub = await js.subscribe('smooth.oneeuro');
for await (const msg of sub) {
  const position = JSON.parse(msg.data);
  const action = fsm.process(position);
  await js.publish('fsm.xstate', JSON.stringify(action));
}

// Stage 4: Pointer factory subscribes & publishes events
const sub = await js.subscribe('fsm.xstate');
for await (const msg of sub) {
  const action = JSON.parse(msg.data);
  const events = factory.fromFSMAction(action);
  for (const event of events) {
    await js.publish('pointer.w3c', JSON.stringify(event));
  }
}

// Stage 5: Target adapter subscribes & dispatches
const sub = await js.subscribe('pointer.w3c');
for await (const msg of sub) {
  const event = JSON.parse(msg.data);
  target.dispatch(event);
  await js.publish('target.dom', JSON.stringify({ success: true }));
}
```

---

## 4. Gesture Vocabulary

### 4.1 Core Gestures

#### Pointer Control
- **Gesture**: Index finger extended (Pointing_Up)
- **Action**: Move cursor
- **FSM State**: ARMED → ACTIVE (pointermove)

#### Click/Commit
- **Gesture**: Thumb-middle pinch
- **Action**: Click / commit action
- **FSM State**: ACTIVE → pointerdown + pointerup

#### Reset/Calibrate
- **Gesture**: Open palm (all fingers extended)
- **Action**: Reset FSM to DISARMED
- **FSM State**: ANY → DISARMED

#### Arming Gate
- **Gesture**: Palm facing camera (palm orientation check)
- **Action**: Enable gesture detection
- **FSM State**: DISARMED → ARMING → ARMED

### 4.2 Advanced Gestures (Future)

- **Scroll**: Two-finger swipe
- **Zoom**: Pinch/spread
- **Drag**: Closed fist + movement
- **Right-click**: Ring-pinky pinch
- **Double-click**: Two quick thumb-middle pinches

---

## 5. User Interface

### 5.1 Visual Feedback

**Overlay Elements**:
```typescript
interface GestureOverlay {
  // Hand skeleton
  drawLandmarks(landmarks: HandLandmarks): void;
  
  // State indicator
  showState(state: GestureState): void; // Color-coded
  
  // Virtual cursor
  drawCursor(position: { x: number; y: number }): void;
  
  // Gesture hint
  showGestureHint(gesture: string): void;
}
```

**State Colors**:
- 🔴 DISARMED: Red (hand not detected)
- 🟡 ARMING: Yellow (calibrating)
- 🟢 ARMED: Green (ready)
- 🔵 ACTIVE: Blue (gesture in progress)

---

### 5.2 Settings Panel

**Adjustable Parameters**:
```typescript
interface GestureSettings {
  // Smoothing
  smoothingAlgorithm: 'oneeuro' | 'spring-damper' | 'chain';
  oneEuroMinCutoff: number;  // 0.1 - 10.0
  oneEuroBeta: number;       // 0.001 - 0.1
  
  // FSM
  armingDelay: number;       // 100 - 1000 ms
  commitHoldTime: number;    // 100 - 1000 ms
  
  // Gestures
  pinchThreshold: number;    // 0.01 - 0.1 (distance)
  palmOrientationTolerance: number; // 0 - 45 degrees
  
  // Target
  targetAdapter: 'dom' | 'excalidraw' | 'tldraw' | 'emulator';
  targetElement: string;     // CSS selector
}
```

---

## 6. Demo Applications

### 6.1 Primary Demo: Gesture-Controlled Canvas
**Location**: `sandbox/demos/main/index.html`  
**Status**: ✅ WORKING, ❌ BYPASSES ARCHITECTURE

**Features**:
- Real-time hand tracking with MediaPipe
- Virtual cursor following index finger
- Gesture state visualization
- Click simulation with thumb-middle pinch
- Canvas drawing demo

**Required Fix**: Import real adapters, not inline copies

---

### 6.2 Production Demo: Full Pipeline
**Location**: `sandbox/demos/production/index.html`  
**Status**: ⚠️ PARTIAL, ❌ BYPASSES ARCHITECTURE

**Features**:
- NATS event bus integration
- All 5 pipeline stages
- Multiple target adapters
- Settings panel

**Required Fix**: Connect NATS, use XState adapter

---

### 6.3 DinoGame Demo
**Location**: `sandbox/demos/main/index-dino.html`  
**Status**: ✅ WORKING (Chrome Dino game control)

**Features**:
- Control Chrome's offline Dino game with gestures
- Pinch to jump
- Fun proof-of-concept

---

### 6.4 Future Demos

#### Excalidraw Integration
- Draw shapes with hand gestures
- Pinch to select/move objects
- Open palm to reset selection

#### Emulator Control
- Navigate DOS/Windows 95 with hand
- Air mouse for retro games
- Gesture-based keyboard shortcuts

#### Cloud OS (Puter)
- Gesture-controlled desktop environment
- Window management via gestures
- File browser navigation

---

## 7. Performance Requirements

### 7.1 Latency Budget
```
Total latency: < 100ms (target)
├─ MediaPipe:     30-50ms (GPU accelerated)
├─ Smoothing:     5-10ms
├─ FSM:          1-5ms
├─ W3C Factory:   1-2ms
└─ Dispatch:      1-5ms
```

### 7.2 Frame Rate
- **Target**: 30 FPS minimum
- **Ideal**: 60 FPS
- **MediaPipe**: 30 FPS native

### 7.3 Resource Usage
- **CPU**: < 20% (single core)
- **GPU**: < 30% (MediaPipe)
- **Memory**: < 200MB
- **Network**: < 10KB/s (NATS messages)

---

## 8. Testing Strategy

### 8.1 Unit Tests (Current: 143 tests, 99.3% passing)

**Coverage**:
- ✅ OneEuroSmoother: 18 tests
- ✅ XStateFSMAdapter: 24 tests
- ✅ W3CPointerEventFactory: 38 tests (pending)
- ✅ NatsSubstrateAdapter: 12 tests
- ✅ RapierGestureSimulator: 8 tests
- ⚠️ MediaPipeSensorAdapter: Integration tests needed

---

### 8.2 Integration Tests (NEEDED)

**Test Suites**:
```typescript
describe('Gesture Pipeline Integration', () => {
  it('should process landmarks through full pipeline', async () => {
    // 1. Mock MediaPipe landmarks
    const landmarks = createMockLandmarks({ gesture: 'Pointing_Up' });
    
    // 2. Publish to sensor subject
    await nats.publish('sensor.mediapipe', landmarks);
    
    // 3. Verify smooth subject receives data
    const smoothed = await nats.subscribe('smooth.oneeuro').next();
    expect(smoothed).toBeDefined();
    
    // 4. Verify FSM processes state
    const action = await nats.subscribe('fsm.xstate').next();
    expect(action.type).toBe('MOVE');
    
    // 5. Verify W3C events created
    const event = await nats.subscribe('pointer.w3c').next();
    expect(event.type).toBe('pointermove');
    
    // 6. Verify dispatch to target
    const result = await nats.subscribe('target.dom').next();
    expect(result.success).toBe(true);
  });
});
```

---

### 8.3 E2E Tests (FUTURE)

**Playwright Tests**:
```typescript
test('gesture control demo works end-to-end', async ({ page }) => {
  await page.goto('http://localhost:9093');
  
  // 1. Wait for MediaPipe to load
  await page.waitForSelector('.hand-skeleton');
  
  // 2. Simulate hand gesture (via MediaPipe mock)
  await page.evaluate(() => {
    window.simulateGesture({ type: 'Pointing_Up', position: { x: 0.5, y: 0.5 } });
  });
  
  // 3. Verify cursor moved
  const cursor = await page.locator('.virtual-cursor');
  await expect(cursor).toHaveCSS('left', '50%');
  
  // 4. Simulate pinch gesture
  await page.evaluate(() => {
    window.simulateGesture({ type: 'Thumb_Middle_Pinch' });
  });
  
  // 5. Verify click event fired
  const clickCount = await page.evaluate(() => window.clickCount);
  expect(clickCount).toBe(1);
});
```

---

## 9. Deployment

### 9.1 Build Process
```bash
# 1. Build adapter bundle
npm run build:adapters

# 2. Run tests
npm test

# 3. Run enforcement gates
npm run gate:all

# 4. Build demo
npm run build:demo

# 5. Deploy to GitHub Pages
npm run deploy
```

### 9.2 GitHub Pages Hosting
```yaml
# .github/workflows/deploy.yml
name: Deploy Demo

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build:adapters
      - run: npm run build:demo
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 10. Roadmap

### Phase 1: Architectural Compliance (IMMEDIATE)
**Goal**: Fix theater code, wire real adapters

- [ ] Implement enforcement gates (G-ARCH, G-TODO, G-XSTATE, G-NATS)
- [ ] Add Vite bundler for adapter compilation
- [ ] Rewrite `demos/main/index.html` with real imports
- [ ] Remove inline adapter classes
- [ ] Replace hand-rolled FSM with XState adapter
- [ ] Connect NATS substrate
- [ ] Remove TODO stubs from `pipeline.ts`

**Success Criteria**: 0 violations, 100% wiring

---

### Phase 2: Production Ready (SHORT-TERM)
**Goal**: Deploy working product

- [ ] Set up NATS server (Docker Compose)
- [ ] Complete integration tests
- [ ] Add E2E test suite
- [ ] Implement settings panel
- [ ] Add gesture overlay UI
- [ ] Performance profiling & optimization
- [ ] Documentation (user guide, API docs)

**Success Criteria**: <100ms latency, 60 FPS, full test coverage

---

### Phase 3: Target Adapters (MEDIUM-TERM)
**Goal**: Support multiple applications

- [ ] Implement Excalidraw adapter
- [ ] Implement tldraw adapter
- [ ] Implement daedalOS adapter
- [ ] Implement Puter adapter
- [ ] Implement v86 emulator adapter
- [ ] Create adapter development guide

**Success Criteria**: 5+ working target adapters

---

### Phase 4: Advanced Features (LONG-TERM)
**Goal**: Expand gesture vocabulary

- [ ] Multi-hand support
- [ ] Scroll gestures
- [ ] Zoom gestures
- [ ] Drag gestures
- [ ] Custom gesture training
- [ ] Gesture macros / shortcuts
- [ ] Voice command integration

**Success Criteria**: 10+ gestures, custom training UI

---

## 11. Success Metrics

**Technical Metrics**:
- Wiring Rate: 11% → 100%
- Theater Violations: 13 → 0
- Test Coverage: 99.3%+ (maintain)
- Latency: < 100ms
- Frame Rate: 60 FPS
- Architecture Compliance: PASS

**Product Metrics**:
- Working demos: 1 → 5+
- Target adapters: 1 → 5+
- GitHub stars: Track growth
- User feedback: Collect & iterate

---

## Appendix: API Reference

### A. Port Interfaces (Zod Schemas)

```typescript
// SensorPort
export const HandLandmarksSchema = z.object({
  landmarks: z.array(z.object({ x: z.number(), y: z.number(), z: z.number() })),
  handedness: z.enum(['Left', 'Right']),
  confidence: z.number().min(0).max(1),
  timestamp: z.number()
});

// SmootherPort
export const NormalizedPositionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  timestamp: z.number()
});

// FSMPort
export const FSMActionSchema = z.object({
  type: z.enum(['MOVE', 'DOWN', 'UP', 'CLICK', 'CANCEL', 'NONE']),
  position: NormalizedPositionSchema.optional(),
  confidence: z.number().optional()
});

// EventFactoryPort
export const PointerEventInitSchema = z.object({
  pointerId: z.number(),
  pointerType: z.enum(['mouse', 'pen', 'touch']),
  isPrimary: z.boolean(),
  clientX: z.number(),
  clientY: z.number(),
  pressure: z.number().min(0).max(1),
  // ... (see W3C spec)
});

// TargetPort
export interface TargetPort {
  dispatch(event: PointerEvent): boolean;
  setTarget(element: HTMLElement): void;
}
```

---

**Status**: ACTIVE SSOT  
**Next Update**: After Phase 1 implementation complete  
**Owner**: HFO Gen87.X3 Team

---

*"From Gesture to Pointer, From Pointer to Control"*  
*W3C Pointer Gesture Control Plane | Gen87.X3*
