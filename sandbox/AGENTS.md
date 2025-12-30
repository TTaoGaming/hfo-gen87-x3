# AGENTS.md — Gen87.X3 Sandbox (W3C Gesture Control Plane)

> **Generation**: 87.X3
> **Date**: 2025-12-29
> **Status**: 🔍 HUNT Phase ACTIVE - Finding exemplars, NOT deciding yet
> **Containment**: All work MUST stay in this sandbox folder
> **Blackboard**: `sandbox/obsidianblackboard.jsonl`

---

## 🚨 Critical Rules (SANDBOX CONTAINMENT)

1. **ALL NEW CODE goes in `sandbox/src/`** — Never write outside sandbox
2. **NEVER hallucinate** — If you can't find it, search Memory Bank first
3. **ALWAYS cite sources** — Format: `Source: Gen X, filename.md` or `Tavily: URL`
4. **TDD MANDATORY** — Write failing tests FIRST, then implement
5. **NO INVENTION** — Only compose TRL 9 proven exemplars

---

## 🎯 Current Mission: W3C Gesture Control Plane

**Pipeline Architecture (from Gen83 Gold Baton):**
```
MediaPipe → GestureFrame → 1€ Filter → XState FSM → PointerStream → DOM Injector
```

**Proof Targets:** Excalidraw (pointer semantics), Phaser (high-frequency motion)

---

## 📁 Sandbox Structure

```
sandbox/
├── AGENTS.md              # THIS FILE - sandbox-specific instructions
├── llms.txt               # Quick context for LLMs
├── specs/                 # Specification documents
│   └── W3C_GESTURE_CONTROL_PLANE_SPEC.md
├── src/
│   └── gesture-control/
│       ├── contracts/     # Zod schemas (CDD)
│       ├── smoothing/     # 1€ Filter (physics)
│       ├── fsm/           # XState machine
│       └── adapters/      # MediaPipe in, DOM out
└── tests/                 # Test files
```

---

## 🔬 Tech Stack (ALL TRL 9 - Grounded via Tavily)

| Component | Package | Source | Purpose |
|-----------|---------|--------|---------|
| **Gesture Recognition** | `@mediapipe/tasks-vision` | ai.google.dev/edge/mediapipe | Hand landmarks + gesture labels |
| **State Machine** | `xstate@5` | stately.ai/docs | FSM with TypeScript, setup() pattern |
| **Smoothing** | 1€ Filter | gery.casiez.net/1euro | Adaptive low-pass filter |
| **Pointer Events** | W3C Spec | w3.org/TR/pointerevents | Standard event interface |
| **Schema Validation** | `zod` | (already in project) | Contract-Driven Development |

---

## 🔑 Key Documents (Hunt Findings)

### Memory Bank (Gen83 Gold)
- `Gen 83, REF__W3C_GESTURE_CONTROL_PLANE_GOLD_BATON.md` - Complete architecture
- `Gen 83, REF__W3C_GESTURE_LANGUAGE_SPEC.md` - FSM states, guards, actions
- `Gen 84, HFO_TECH_STACK_GEN84.md` - Technology stack mapping

### Tavily-Grounded Sources (Core Pipeline)
- **W3C Pointer Events**: https://www.w3.org/TR/pointerevents/ (Level 3 CR 2025-03-13)
- **One Euro Filter**: https://gery.casiez.net/1euro/ (Casiez CHI 2012)
- **XState v5 Setup**: https://stately.ai/docs/setup
- **MediaPipe Gesture**: https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer

### Tavily-Grounded Sources (Target Adapters - HUNT PHASE)
| Exemplar | Stars | Key Insight | Input API |
|----------|-------|-------------|-----------|
| **daedalOS** | 12.2K | Full web OS, v86/js-dos/EmulatorJS built-in | Window manager handles routing |
| **v86** | - | x86 emulator in browser | `keyboard_send_scancodes()`, `bus.send('mouse-delta')` |
| **js-dos** | - | DOSBox WASM | `setMouseSensitivity(n)`, mouse follows cursor |
| **EmulatorJS** | - | RetroArch libretro frontend | `EJS_defaultControls` mapping |
| **Excalidraw** | 54.5K | Whiteboard, canvas renderer | `onPointerDown/Up/Update` callbacks |
| **tldraw** | 15.1K | Whiteboard, DOM renderer (easier dispatch!) | Native DOM events |
| **WinBox.js** | - | 4KB zero-dep window manager | Lightweight, wire up yourself |
| **Puter** | 38K | Cloud OS, AGPL-3.0 | Full desktop abstraction |

### User Vision (Captured 2025-12-29)
```
MediaPipe → Physics (1€) → FSM (XState) → W3C Pointer → TargetAdapter → ANY TARGET
                                                              ↓
                                         ┌────────────────────┴────────────────────┐
                                         │                                         │
                                    DOM/Canvas                              Emulators
                                    Excalidraw                              v86, js-dos
                                    tldraw                                  EmulatorJS
                                    Any element                             BoxedWine
```

**Total Tool Virtualization**: One gesture primitive → route to ANY target via adapter pattern

---

## 🏗️ HIVE Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| **H (Hunt)** | 🔄 ACTIVE | Finding exemplars, exploring options, NOT deciding |
| **I (Interlock)** | ⏳ PENDING | Create TargetAdapter contract, then per-target adapters |
| **V (Validate)** | ⏳ PENDING | TDD RED → GREEN |
| **E (Evolve)** | ⏳ PENDING | Refactor and prepare N+1 |

---

## 📋 Contracts to Implement (Phase I)

### 1. GestureFrame Contract
```typescript
// From Gen83 spec
type GestureLabel = 'Open_Palm' | 'Pointing_Up' | 'Victory' | 'Thumb_Up' | 'Thumb_Down' | 'None';

type GestureFrame = {
  ts: number;
  handId: 'left' | 'right';
  trackingOk: boolean;
  palmFacing: boolean;
  label: GestureLabel;
  conf: number;
  indexTip: { x: number; y: number };
};
```

### 2. PointerStream Contract
```typescript
type PointerEventOut =
  | { t: 'move'; pointerId: number; x: number; y: number; pointerType: 'mouse' | 'pen'; buttons: number }
  | { t: 'down'; pointerId: number; x: number; y: number; button: 0 | 1; buttons: number }
  | { t: 'up';   pointerId: number; x: number; y: number; button: 0 | 1; buttons: number }
  | { t: 'cancel'; pointerId: number };
```

---

## 🧪 TDD Sequence

1. **Write contract** (Zod schema)
2. **Write failing test** (RED)
3. **Implement to pass** (GREEN)
4. **Property tests with fast-check** (REFACTOR)

---

## Do NOT

- ❌ Write code outside sandbox/
- ❌ Skip TDD - always write tests first
- ❌ Invent new patterns - compose existing exemplars only
- ❌ Hallucinate APIs - verify with Tavily or Context7

## Do

- ✅ Search Memory Bank before implementing
- ✅ Cite all sources
- ✅ Use Zod for all contracts
- ✅ Follow Gen83 Gold Baton spec exactly
- ✅ Ground claims with Tavily searches

---

*The spider weaves the web that weaves the spider.*
*Gen87.X3 Sandbox | 2025-12-29*
