# H: SOTA Daily Driver Air Mouse Architecture

> **HUNT Phase Document** | Gen87.X3 | 2025-12-31
> **Status**: COMPLETE - Tavily-Grounded Research
> **Mission**: Define world-class gesture-to-pointer virtualization architecture

---

## 🎯 Core Question Answered

**What makes a DAILY DRIVER air mouse SOTA (State of the Art)?**

A "daily driver" means:
1. ✅ MUST be usable 8+ hours without fatigue (ergonomics)
2. ✅ MUST achieve comparable throughput to physical mouse (4.0-4.9 bps per ISO 9241-9)
3. ✅ MUST have predictable, consistent behavior
4. ✅ MUST work across ALL applications (universal via W3C Pointer Events)

---

## 📊 ISO 9241 Standards (Tavily-Verified)

| Standard | Scope | Key Finding |
|----------|-------|-------------|
| **ISO 9241-9:2000** | Requirements for non-keyboard input devices | Compliance via Fitts' Law throughput testing |
| **ISO 9241-410:2008** | Design criteria for physical input devices | **EXPLICITLY includes gesture-controlled devices** |
| **ISO 9241-210:2019** | Human-centred design | Iterative usability testing requirements |

> **Source**: iso.org/obp, w3.org, sciencedirect.com/science/article/abs/pii/S1071581904001016

### ISO 9241-410 Quote (Critical):
> "This part of ISO 9241 specifies criteria based on ergonomics factors for the design of physical input devices for interactive systems including keyboards, mice, pucks, joysticks, trackballs, trackpads, tablets and overlays, touch-sensitive screens, styli and light pens, and **voice- and gesture-controlled devices**."

**YOU ARE ON THE STANDARDS TRACK!**

---

## 📈 Fitts' Law Throughput Benchmarks

| Device | Throughput (bps) | Source |
|--------|-----------------|--------|
| **Adult mouse (ISO standard)** | 3.7-4.9 | ISO 9241-9, yorku.ca/mack |
| **Touch direct input** | 6.95 | yorku.ca/mack - 42-88% BETTER than mouse |
| **Kinect 2D pointing** | ~2.9 | 39% lower than mouse |
| **Kinect 3D pointing** | ~4.8 | 9% BETTER than mouse (!) |
| Head mouse | 0.89-1.08 | Accessibility use case |
| Single-switch scanning | 0.35 | Accessibility baseline |
| Children (5-6 years) | 3.84 | pmc.ncbi.nlm.nih.gov |
| Adults (21-24 years) | 6.46 | pmc.ncbi.nlm.nih.gov |

### 🔑 KEY INSIGHT:
The gap between **Kinect 2D (bad)** and **Kinect 3D (good)** tells us:
- Air mouse CAN achieve parity with physical mouse
- The problem is the **interaction model**, not the technology
- 3D spatial pointing works BETTER than 2D screen mapping

> **Target**: ≥4.0 bps throughput for "daily driver" quality

---

## 🔧 Hardware Virtualization: The 5-Stage Pipeline

### Physical Mouse Components → Gesture Equivalents

| Mouse Component | Function | Gesture Equivalent | Implementation |
|-----------------|----------|-------------------|----------------|
| Optical sensor | Captures surface movement @ 1000Hz+ | MediaPipe Hand Tracking | ~30fps webcam |
| Movement delta | Integrates to position | **Palm centroid delta** | NOT fingertip (research confirms palm is better) |
| Noise filtering | Hardware-level rejection | **1€ Filter** | Adaptive cutoff based on velocity |
| Button state | Discrete click events | **FSM** | XState gesture state machine |
| OS driver | CD gain, acceleration | **W3C Pointer Events** | dispatchEvent with predictedEvents |

### Critical Gap: Frame Rate Mismatch
```
Physical mouse: 1000Hz sampling
Webcam:         30Hz (33x SLOWER!)
                ↓
        ~33ms latency floor BEFORE any processing
```

### Solution: Physics-Based Prediction (Rapier)
Your intuition is **CORRECT**. Rapier physics simulation provides:

1. **Predict position** between MediaPipe frames using velocity/acceleration
2. **Interpolate** smooth cursor movement at 60Hz+ from 30Hz input
3. **Spring-damper behavior** for configurable "weightiness" feel
4. **Momentum/inertia** for fling gestures

> **Source**: dimforge.com (Rapier), rapier.rs/docs

---

## 🎛️ 1€ Filter: The Standard for Jitter Reduction

### What It Is (Tavily-Grounded)

> "The 1€ filter ("one Euro filter") is a simple algorithm to filter noisy signals for high precision and responsiveness. It uses a first order low-pass filter with an adaptive cutoff frequency: at low speeds, a low cutoff stabilizes the signal by reducing jitter, but as speed increases, the cutoff is increased to reduce lag."

> **Source**: gery.casiez.net/1euro, CHI 2012, github.com/casiez/OneEuroFilter

### Key Properties:
- **Two parameters**: `fcmin` (minimum cutoff) and `beta` (speed coefficient)
- **Adaptive**: Low speed = low cutoff (less jitter), High speed = high cutoff (less lag)
- **Used by MediaPipe** itself for smoothing
- **Research validated**: Smallest SEM of 0.004mm vs 0.015mm for Kalman

### Tuning Procedure:
1. Set `beta=0`, `fcmin=1.0Hz`
2. Hold hand steady, reduce `fcmin` until jitter acceptable
3. Move hand quickly, increase `beta` until lag acceptable

### TypeScript Implementation Available:
> **Source**: github.com/casiez/OneEuroFilter (BSD License)

---

## 🎮 World-Class FSM for Pointing Devices

### Research Basis (Davis & Shah Gesture Model)

4 qualitatively distinct phases:
1. **Static start position** (≥3 frames)
2. **Smooth motion**
3. **Gesture execution**
4. **Return to rest**

> **Source**: cs.brandeis.edu/~hong/Research/e_paper/FG2000/FG2000_gesture.pdf

### SOTA Air Mouse FSM States (XState v5)

```
┌──────────────┐
│    IDLE      │ ← Hand not detected or palm closed
└──────┬───────┘
       │ hand_detected && palm_open
       ▼
┌──────────────┐
│   HOVER      │ ← Cursor tracking, no clicks
└──────┬───────┘
       │ pinch_start (thumb+index)
       ▼
┌──────────────┐
│   CLICK      │ ← Button down state
└──────┬───────┘
       │ pinch_release
       ▼
┌──────────────┐
│   RELEASED   │ ← Button up, debounce window
└──────┬───────┘
       │ timeout(50ms)
       ▼
       (back to HOVER)
```

### Additional States:
- **DRAG**: `pinch_hold > 200ms` while moving
- **SCROLL**: Two-finger gesture detected
- **RIGHT_CLICK**: Middle finger pinch
- **CALIBRATING**: Adjusting gain/offset

### FSM Requirements:
| Requirement | Purpose |
|-------------|---------|
| **Hysteresis** | Different thresholds for enter/exit to prevent flickering |
| **Debounce** | Minimum dwell time before transition |
| **Guard conditions** | Confidence thresholds from MediaPipe |
| **Actions** | W3C Pointer Event emissions on transitions |

---

## 📐 CD Gain / Control-Display Ratio

### Research Findings (Casiez et al.)

**CD Gain Definition:**
```
CD_gain = pointer_velocity / device_velocity

CD gain > 1: Pointer moves FASTER (amplification)
CD gain < 1: Pointer moves SLOWER (precision)
CD gain = 1: 1:1 mapping
```

> **Source**: dgp.toronto.edu/~ravin/papers/hci2008_cdgain.pdf

### Key Finding: Pointer Acceleration IS GOOD
Despite gamer myths, research shows:
- macOS acceleration curve **significantly outperforms** constant CD gain
- Windows "Enhance Pointer Precision" uses velocity-based curve
- Fast movement → high CD gain (traverse quickly)
- Slow movement → low CD gain (precision targeting)

### Recommended Acceleration Curve:

```
CD_gain
   │
2.0├         ╭────────────── plateau at high velocity
   │       ╱
1.5├     ╱
   │   ╱
1.0├─╱─────────────────────── baseline
   │╱
0.5├
   │
0.0└────────────────────────────────
   0    slow   medium   fast   velocity
```

### Air Mouse Specific Considerations:

1. **Larger Input Space**: Hand moves in 3D (larger than mouse pad)
   - Need LOWER base CD gain than physical mouse
   - Typical: 0.5-0.8 at rest, scaling to 1.5-2.0 at speed

2. **Jitter Amplification**: CD gain amplifies noise!
   - High CD gain + hand tremor = unusable jitter
   - Solution: **1€ filter BEFORE CD gain application**

3. **Fatigue Compensation**: 
   - As user tires, movement becomes shakier
   - Could implement adaptive CD gain reduction based on jitter detection

---

## 🚀 The Pareto Frontier (Your Rapier Intuition)

Rapier physics + 1€ filter gives you **TWO independent controls**:

1. **1€ filter**: Controls jitter/lag tradeoff
2. **Rapier spring-damper**: Controls responsiveness/smoothness tradeoff

Together they form a **2D parameter space** where you can tune to the Pareto frontier of:
- Minimum perceivable jitter
- Minimum perceivable latency  
- Maximum throughput (Fitts' bps)

```
Jitter (low is good)
    │
    │  ╲  Pareto Frontier
    │   ╲
    │    ╲●  (1€ fcmin=0.5, Rapier stiffness=high)
    │     ╲
    │      ●  (1€ fcmin=1.0, Rapier stiffness=medium)
    │       ╲
    │        ●  (1€ fcmin=2.0, Rapier stiffness=low)
    │         ╲
    └──────────────────────── Latency (low is good)
```

**Each point on the frontier is optimal** - you can't reduce jitter without increasing latency or vice versa. The user chooses their preferred tradeoff via gain settings.

---

## 📡 W3C Pointer Events Level 3 (Output Standard)

### Critical Features for Air Mouse

| Feature | Purpose | How You Use It |
|---------|---------|----------------|
| `getCoalescedEvents()` | Access all un-coalesced positions | Provide 30Hz raw data for drawing apps |
| `getPredictedEvents()` | Speculative future positions | **Feed Rapier physics predictions!** |
| `pointerrawupdate` | High-frequency event stream | Sub-pixel accuracy tracking |
| `altitudeAngle` | Angle from screen surface | Map from hand tilt |
| `azimuthAngle` | Rotation around perpendicular | Map from wrist rotation |
| `pressure` | 0.0-1.0 float | **Map from thumb-index pinch distance!** |

> **Source**: w3.org/TR/pointerevents, w3c.github.io/pointerevents

### Pointer Event Properties to Emit:

```typescript
interface AirMousePointerEvent {
  // Identity
  pointerId: number;        // Unique ID for this hand
  pointerType: 'touch';     // Standard type
  isPrimary: boolean;       // Is this the primary hand?
  
  // Position (CRITICAL)
  clientX: number;          // Screen X
  clientY: number;          // Screen Y
  
  // Pressure (MAP FROM PINCH DISTANCE)
  pressure: number;         // 0.0-1.0
  
  // Extended data
  tiltX: number;            // From hand rotation X
  tiltY: number;            // From hand rotation Y
  twist: number;            // Wrist rotation
  
  // Level 3 features
  altitudeAngle: number;    // Angle from screen surface
  azimuthAngle: number;     // Rotation around perpendicular
  
  // PREDICTION (Your Rapier output!)
  predictedEvents: PointerEvent[];  // Physics-predicted future positions
}
```

### Key Implementation Pattern:

```typescript
// Generate predicted events from Rapier simulation
function generatePredictedEvents(
  currentPos: Vec2, 
  velocity: Vec2, 
  count: number = 3
): PointerEvent[] {
  const predictions: PointerEvent[] = [];
  const dt = 1/60; // 16.67ms prediction intervals
  
  for (let i = 1; i <= count; i++) {
    // Rapier physics prediction!
    const predictedPos = physics.predictPosition(currentPos, velocity, dt * i);
    predictions.push(createPointerEvent(predictedPos));
  }
  return predictions;
}
```

---

## 🏗️ Complete SOTA Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SOTA AIR MOUSE PIPELINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STAGE 1: SENSING (Port 0 - SensorPort)                                     │
│  ┌─────────────┐                                                            │
│  │ MediaPipe   │ 30fps, 21 landmarks                                        │
│  │ Hands       │ Palm centroid (NOT fingertip - research validated)         │
│  │             │ min_tracking_confidence: 0.6-0.7                           │
│  └──────┬──────┘                                                            │
│         │ raw landmarks @ 33ms                                              │
│         ▼                                                                   │
│  STAGE 2: SMOOTHING (Port 1 - SmootherPort)                                 │
│  ┌─────────────┐                                                            │
│  │ 1€ Filter   │ fcmin=1.0Hz, beta tuned per user                           │
│  │             │ Adaptive: low speed=stable, high speed=responsive          │
│  └──────┬──────┘                                                            │
│         │ filtered position                                                 │
│         ▼                                                                   │
│  STAGE 3: PHYSICS (Port 2 - SmootherPort extended)                          │
│  ┌─────────────┐                                                            │
│  │ Rapier      │ Spring-damper system:                                      │
│  │ Physics     │ • Interpolate 30Hz → 60Hz                                  │
│  │ (WASM)      │ • Predict 3 frames ahead for predictedEvents               │
│  │             │ • Momentum for fling gestures                              │
│  │             │ • Configurable "weight" feel                               │
│  └──────┬──────┘                                                            │
│         │ predicted trajectory                                              │
│         ▼                                                                   │
│  STAGE 4: CD GAIN (Part of Stage 3)                                         │
│  ┌─────────────┐                                                            │
│  │ Gain Func   │ velocity → CD gain mapping                                 │
│  │             │ Base: 0.5-0.8 | Peak: 1.5-2.0                              │
│  │             │ macOS-style curve (research-validated)                     │
│  └──────┬──────┘                                                            │
│         │ screen coordinates                                                │
│         ▼                                                                   │
│  STAGE 5: FSM (Port 3 - FSMPort)                                            │
│  ┌─────────────┐                                                            │
│  │ XState v5   │ States: IDLE → HOVER → CLICK → DRAG → SCROLL               │
│  │             │ Guards: confidence thresholds, hysteresis                  │
│  │             │ Actions: emit W3C Pointer Events                           │
│  └──────┬──────┘                                                            │
│         │ typed PointerEvent                                                │
│         ▼                                                                   │
│  STAGE 6: OUTPUT (Port 4 - EmitterPort)                                     │
│  ┌─────────────┐                                                            │
│  │ W3C Pointer │ pointerdown/move/up/cancel                                 │
│  │ Events L3   │ getCoalescedEvents() for drawing apps                      │
│  │             │ getPredictedEvents() FROM RAPIER                           │
│  └─────────────┘                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Priorities

| Priority | Component | Purpose | Status | Source |
|----------|-----------|---------|--------|--------|
| **P0** | 1€ Filter TypeScript | Jitter/lag balance | 🔴 Need impl | github.com/casiez/OneEuroFilter |
| **P0** | Rapier.js integration | Physics prediction | 🟡 Rapier exists | rapier.rs, dimforge.com |
| **P0** | XState v5 FSM | Gesture state machine | 🟡 XState exists | stately.ai/docs |
| **P1** | CD Gain curve | Acceleration function | 🔴 Custom needed | Casiez 2008 paper |
| **P1** | W3C Pointer emit | Standard output | 🟢 Browser API | w3.org/TR/pointerevents |
| **P2** | Fitts test suite | ISO compliance | 🔴 Custom needed | ISO 9241-9 |

---

## 🎯 Success Criteria (ISO-Aligned)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Throughput** | ≥4.0 bps | Fitts' Law test (ISO 9241-9 methodology) |
| **Jitter** | <2px at rest | 1€ filter tuned, hand stationary test |
| **Latency** | <100ms perceived | Rapier prediction + user testing |
| **Fatigue** | 8-hour usability | Ergonomic validation study |
| **Universality** | Works everywhere | Test with Excalidraw, tldraw, DOM |

---

## 📚 Tavily-Grounded Sources

| Topic | Source URL | Key Finding |
|-------|------------|-------------|
| ISO 9241-410 | iso.org/obp | Explicitly includes gesture-controlled devices |
| Fitts' Law benchmarks | yorku.ca/mack/hcii2015a.html | Touch=6.95bps, Mouse=4.5bps |
| 1€ Filter | gery.casiez.net/1euro | CHI 2012, TypeScript impl available |
| CD Gain research | dgp.toronto.edu/~ravin | macOS curve outperforms constant gain |
| MediaPipe latency | ai.google.dev/edge/mediapipe | 16-20ms GPU, use palm centroid |
| W3C Pointer Events L3 | w3.org/TR/pointerevents | getPredictedEvents() for physics output |
| Rapier physics | rapier.rs, dimforge.com | WASM, deterministic, spring-damper |

---

## 🔮 Next Steps (I Phase)

1. **Define Zod contracts** for all ports (SensorPort, SmootherPort, FSMPort, EmitterPort)
2. **Write failing tests** for 1€ filter TypeScript implementation
3. **Write failing tests** for Rapier physics integration
4. **Write failing tests** for XState FSM with gesture states
5. **Define CD gain acceleration curve function**

---

*Generated: 2025-12-31 | HUNT Phase Complete | Ready for INTERLOCK*
*"The spider weaves the web that weaves the spider."*
