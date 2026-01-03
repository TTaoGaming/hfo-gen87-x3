Yes# Total Tool Virtualization (TTV) - Primitives Checklist

> **Goal**: Daily driver pointer emulator using gesture controls
> **Platform**: Mobile, Chromebook, Laptop (any device with camera)
> **Architecture**: W3C Gesture Control Plane

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        W3C GESTURE CONTROL PLANE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   SENSE     │───▶│    FUSE     │───▶│   SHAPE     │───▶│  DELIVER    │  │
│  │   Port 0    │    │   Port 1    │    │   Port 2    │    │   Port 3    │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│        │                  │                  │                  │          │
│        ▼                  ▼                  ▼                  ▼          │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐      │
│  │ MediaPipe │     │ Gesture   │     │ 1€ Filter │     │ W3C Ptr   │      │
│  │ Hands     │     │ Classifier│     │ Smoother  │     │ Events    │      │
│  ├───────────┤     ├───────────┤     ├───────────┤     ├───────────┤      │
│  │ Touch     │     │ Multi-Src │     │ Rapier2D  │     │ Golden    │      │
│  │ Input     │     │ Fuser     │     │ Physics   │     │ Layout    │      │
│  ├───────────┤     ├───────────┤     ├───────────┤     ├───────────┤      │
│  │ Mouse     │     │ Coord     │     │ Coord     │     │ DOM Event │      │
│  │ Fallback  │     │ Normalizer│     │ Mapper    │     │ Dispatch  │      │
│  └───────────┘     └───────────┘     └───────────┘     └───────────┘      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      FSM (Port 7 - Navigator)                        │   │
│  │  XState Machine: IDLE ──▶ TRACKING ──▶ GESTURE ──▶ ACTION           │   │
│  │  Modes: POINTER | SCROLL | ZOOM | DRAG | CONTEXT_MENU               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Primitives Checklist

### Port 0: SENSE (Input Adapters)

| # | Primitive | NPM Package | Status | Mutation Score | Location |
|---|-----------|-------------|--------|----------------|----------|
| 1 | MediaPipe Hands | `@mediapipe/hands` | ⬜ TODO | - | quarantine/ |
| 2 | MediaPipe Gestures | `@mediapipe/tasks-vision` | ⬜ TODO | - | quarantine/ |
| 3 | Touch Input | Native `TouchEvent` | ⬜ TODO | - | quarantine/ |
| 4 | Mouse Fallback | Native `MouseEvent` | ⬜ TODO | - | quarantine/ |
| 5 | Webcam Stream | `getUserMedia` | ⬜ TODO | - | quarantine/ |

### Port 1: FUSE (Fusion Adapters)

| # | Primitive | NPM Package | Status | Mutation Score | Location |
|---|-----------|-------------|--------|----------------|----------|
| 6 | Gesture Classifier | Custom + Zod | ⬜ TODO | - | quarantine/ |
| 7 | Multi-Source Fuser | Custom | ⬜ TODO | - | quarantine/ |
| 8 | Coordinate Normalizer | Custom | ⬜ TODO | - | quarantine/ |
| 9 | Device Capability | `navigator.mediaDevices` | ⬜ TODO | - | quarantine/ |

### Port 2: SHAPE (Transform Adapters)

| # | Primitive | NPM Package | Status | Mutation Score | Location |
|---|-----------|-------------|--------|----------------|----------|
| 10 | **1€ Filter** | `1eurofilter@1.2.2` | ✅ DONE | **96.15%** | adapters/ |
| 11 | **Rapier2D Physics** | `@dimforge/rapier2d` | ✅ DONE | **68.7%** | adapters/ |
| 12 | Coordinate Mapper | Custom | ⬜ TODO | - | quarantine/ |
| 13 | Velocity Calculator | Custom | ⬜ TODO | - | quarantine/ |

### Port 3: DELIVER (Output Adapters)

| # | Primitive | NPM Package | Status | Mutation Score | Location |
|---|-----------|-------------|--------|----------------|----------|
| 14 | **W3C Pointer Events** | Native `PointerEvent` | ✅ DONE | **48 tests** | adapters/ |
| 15 | **Golden Layout** | `golden-layout@2.x` | ✅ DONE | **39 tests** | adapters/ |
| 16 | DOM Event Dispatch | Custom | ⬜ TODO | - | quarantine/ |
| 17 | Virtual Cursor | CSS + DOM | ⬜ TODO | - | quarantine/ |

### Port 7: NAVIGATE (FSM Adapters)

| # | Primitive | NPM Package | Status | Mutation Score | Location |
|---|-----------|-------------|--------|----------------|----------|
| 18 | **XState FSM** | `xstate@5.25.0` | ✅ DONE | **22 tests** | adapters/ |
| 19 | Gesture Mode Manager | XState Actor | ⬜ TODO | - | quarantine/ |
| 20 | Action Dispatcher | XState Actions | ⬜ TODO | - | quarantine/ |

### Composition Layer (Hexagonal Infrastructure)

| # | Primitive | Description | Status | Tests | Location |
|---|-----------|-------------|--------|-------|----------|
| 21 | **Port Contracts** | 8-port Zod schemas | ✅ DONE | **88.54% mutation** | contracts/ |
| 22 | **HFO Ports** | Port interfaces + metadata | ✅ DONE | **88.24% mutation** | contracts/ |
| 23 | **Port Factory** | Polymorphic DI factory | ✅ DONE | **34 tests** | adapters/ |
| 24 | **Tile Composer** | GoldenLayout pipeline DI | ✅ DONE | **27 tests** | adapters/ |

---

## 🎮 Gesture Modes (FSM States)

```
┌────────────────────────────────────────────────────────────────┐
│                    GESTURE STATE MACHINE                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌──────┐     hand detected      ┌──────────┐                │
│   │ IDLE │ ────────────────────▶  │ TRACKING │                │
│   └──────┘                        └──────────┘                │
│       ▲                                │                       │
│       │ hand lost                      │ gesture recognized   │
│       │                                ▼                       │
│       │                          ┌──────────┐                 │
│       └────────────────────────  │ GESTURE  │                 │
│                                  └──────────┘                 │
│                                       │                        │
│                                       │ gesture type          │
│                 ┌─────────────────────┼─────────────────────┐ │
│                 ▼                     ▼                     ▼ │
│          ┌─────────┐           ┌─────────┐           ┌─────────┐
│          │ POINTER │           │ SCROLL  │           │  ZOOM   │
│          │  MODE   │           │  MODE   │           │  MODE   │
│          └─────────┘           └─────────┘           └─────────┘
│                                                                │
└────────────────────────────────────────────────────────────────┘

Gesture Mappings:
  - INDEX_POINT    → POINTER mode (move cursor)
  - TWO_FINGERS    → SCROLL mode (scroll page)
  - PINCH          → ZOOM mode (zoom in/out)
  - FIST           → DRAG mode (click and drag)
  - PALM           → IDLE (pause tracking)
  - THUMB_UP       → Context menu
```

---

## 📐 W3C Pointer Events Output

```typescript
interface GesturePointerEvent {
  // Standard W3C PointerEvent properties
  pointerId: number;        // Unique pointer ID
  pointerType: 'gesture';   // Custom type for gesture input
  isPrimary: true;          // Always primary
  
  // Position (normalized then mapped to screen)
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  
  // Pressure (from gesture confidence)
  pressure: number;         // 0.0 - 1.0
  
  // Tilt (from hand rotation)
  tiltX: number;           // -90 to 90
  tiltY: number;           // -90 to 90
  
  // HFO Extensions
  hfoSource: 'mediapipe' | 'touch' | 'mouse';
  hfoConfidence: number;    // ML confidence score
  hfoGesture: string;       // Current gesture name
  hfoSmoothed: boolean;     // Was 1€ filter applied?
}
```

---

## 🚀 Build Order (Priority)

### Phase 1: Core Pipeline (MVP)
1. ✅ **1€ Filter** - DONE
2. ⬜ **XState FSM** - State management foundation
3. ⬜ **Coordinate Mapper** - Normalized → Screen coords
4. ⬜ **W3C Pointer Events** - Output foundation

### Phase 2: Input Sources
5. ⬜ **MediaPipe Hands** - Primary input
6. ⬜ **Touch Input** - Mobile fallback
7. ⬜ **Mouse Fallback** - Desktop fallback

### Phase 3: Gesture Processing
8. ⬜ **MediaPipe Gestures** - Gesture classification
9. ⬜ **Gesture Classifier** - Custom gesture rules
10. ⬜ **Gesture Mode Manager** - Mode switching

### Phase 4: Enhanced Features
11. ⬜ **Rapier2D Physics** - Momentum/inertia
12. ⬜ **Golden Layout** - UI integration
13. ⬜ **Virtual Cursor** - Visual feedback

### Phase 5: Polish
14. ⬜ **Multi-Source Fuser** - Combine inputs
15. ⬜ **Velocity Calculator** - Gesture speed
16. ⬜ **Device Capability** - Feature detection

---

## 📊 Success Criteria

| Criterion | Threshold |
|-----------|-----------|
| Mutation Score | ≥80% per adapter |
| Test Coverage | ≥90% lines |
| TypeScript | 0 errors |
| Lint | 0 errors |
| Latency | <16ms (60fps) |
| Gesture Accuracy | >95% recognition |

---

## 🔧 NPM Dependencies to Install

```bash
# Already installed
npm ls 1eurofilter   # ✅ 1.2.2
npm ls xstate        # ✅ 5.25.0
npm ls zod           # ✅ 3.25.76

# Need to install
npm install @dimforge/rapier2d-compat  # Rapier Physics (WASM)
npm install golden-layout              # UI Layout
npm install @mediapipe/hands           # Hand tracking
npm install @mediapipe/tasks-vision    # Gesture recognition
```

---

*Generated: 2026-01-01*
*HIVE Phase: H (Hunt) - Planning primitives checklist*
