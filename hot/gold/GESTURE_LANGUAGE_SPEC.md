# Gesture Language Specification

> **Gen87.X3** | **Phase: HUNT→INTERLOCK** | **2026-01-01**  
> **SSOT for gesture recognition and anti-Midas touch implementation**

---

## 1. Executive Summary

This specification defines TTao's gesture language for the W3C Gesture Control Plane. The design is grounded in:

1. **Memory MCP**: FSM_Hysteresis_Architecture_20251231, FSM_Correct_Design_20251231
2. **Tavily Research**: MediaPipe tracking, Midas Touch UX problem, palm orientation
3. **TTao Insight**: MediaPipe's None gesture as transition predictor

---

## 2. Primary Gestures (PRIORITY)

| Gesture | W3C Event | Button | Usage |
|---------|-----------|--------|-------|
| **Open_Palm** | `pointermove` | n/a | ARMED state - cursor tracking enabled |
| **Pointing_Up** | `pointerdown` | 0 | ENGAGED state - primary button down, drag |

**Everything else is secondary:**
- Victory (button 1 = pan/scroll) - future
- Thumb_Up/Down (wheel zoom) - future
- Closed_Fist (alternative commit) - future

---

## 3. The None Transition Predictor (NOVEL)

### Key Insight
MediaPipe **always** emits `None` between gesture transitions:

```
Open_Palm → None → Pointing_Up → None → Open_Palm (cyclic)
```

This `None` is NOT an error—it's a ~50-100ms transition window where MediaPipe confidence drops below threshold during finger movement.

### Predictive Opportunity

```typescript
interface GestureTransitionPredictor {
  lastValidGesture: GestureLabel;
  noneEnteredAt: number | null;
  
  /**
   * When gesture = None and lastValid = Open_Palm
   * → Likely transitioning TO Pointing_Up (click start)
   *
   * When gesture = None and lastValid = Pointing_Up  
   * → Likely transitioning TO Open_Palm (click end)
   */
  predict(current: GestureLabel, ts: number): {
    likelyNext: GestureLabel;
    confidence: number;  // Higher as None duration approaches typical
    msInNone: number;
  }
}
```

### Timing Constants

| Constant | Value | Source |
|----------|-------|--------|
| `NONE_DEBOUNCE_MS` | 80 | Archived w3c-pointer-fsm.ts |
| `TYPICAL_NONE_DURATION_MS` | 50-100 | Empirical observation |
| `LONG_NONE_MS` | 200+ | Genuine disengagement, not transition |

---

## 4. Palm Cone Hysteresis (Anti-Midas Touch)

### The Problem
User's palm flickers at threshold angle → UI oscillates between armed/disarmed.

### The Solution: Schmitt Trigger

Two thresholds with a **hysteresis band** prevent oscillation:

```
Palm Angle (degrees from camera normal)

0° ────────────────────────── Palm facing camera directly
   
25° ──────── ARM_THRESHOLD ── Enter ARMED when BELOW this
      [HYSTERESIS BAND]       (10° prevents flicker)
35° ──────── DISARM_THRESHOLD Exit ARMED when ABOVE this

70° ──────── CANCEL_THRESHOLD Immediate pointercancel (intentional roll)

90° ────────────────────────── Palm perpendicular to camera

180° ───────────────────────── Palm facing away
```

### Implementation

```typescript
interface SchmittPalmGate {
  /** Enter threshold (stricter - < this to arm) */
  armThreshold: number;      // 25°
  
  /** Exit threshold (looser - > this to disarm) */
  disarmThreshold: number;   // 35°
  
  /** Immediate cancel (intentional roll away) */
  cancelThreshold: number;   // 70°
  
  /** Current hysteresis state */
  currentlyFacing: boolean;
}

function updatePalmGate(palmAngle: number, gate: SchmittPalmGate): boolean {
  if (gate.currentlyFacing) {
    // Currently armed - only disarm if angle exceeds disarmThreshold
    if (palmAngle > gate.disarmThreshold) {
      gate.currentlyFacing = false;
    }
  } else {
    // Currently disarmed - only arm if angle is below armThreshold
    if (palmAngle < gate.armThreshold) {
      gate.currentlyFacing = true;
    }
  }
  return gate.currentlyFacing;
}
```

### Palm Angle Calculation

From MediaPipe 21-landmark hand model:

```typescript
/**
 * Calculate palm normal from wrist and MCP joints
 * @param landmarks 21 MediaPipe landmarks
 * @returns Palm angle in degrees from camera Z-axis
 */
function calculatePalmAngle(landmarks: NormalizedLandmark[]): number {
  const wrist = landmarks[0];           // WRIST
  const indexMCP = landmarks[5];        // INDEX_FINGER_MCP
  const pinkyMCP = landmarks[17];       // PINKY_MCP
  
  // Create vectors from wrist to MCPs
  const v1 = { x: indexMCP.x - wrist.x, y: indexMCP.y - wrist.y, z: indexMCP.z - wrist.z };
  const v2 = { x: pinkyMCP.x - wrist.x, y: pinkyMCP.y - wrist.y, z: pinkyMCP.z - wrist.z };
  
  // Cross product = palm normal (pointing out of palm)
  const normal = {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };
  
  // Normalize
  const mag = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
  const unitNormal = { x: normal.x / mag, y: normal.y / mag, z: normal.z / mag };
  
  // Camera Z-axis (pointing into screen)
  const cameraAxis = { x: 0, y: 0, z: -1 };
  
  // Dot product = cosine of angle
  const dot = unitNormal.x * cameraAxis.x + unitNormal.y * cameraAxis.y + unitNormal.z * cameraAxis.z;
  
  // Convert to degrees
  const angleRadians = Math.acos(Math.max(-1, Math.min(1, dot)));
  return angleRadians * (180 / Math.PI);
}
```

---

## 5. State Machine (Simplified)

```
                    ┌──────────────────────────────┐
                    │                              │
                    ▼                              │
┌──────┐   palm cone OK   ┌─────────┐   Open_Palm   │
│ IDLE │ ───────────────► │ TRACKING │ ──────────────┤
└──────┘                  └─────────┘              │
    ▲                         │                    │
    │                    Open_Palm                 │
    │                    + dwell 150ms             │
    │                         │                    │
    │                         ▼                    │
    │                    ┌─────────┐               │
    │                    │  ARMED  │ ◄─────────────┘
    │                    └─────────┘   (Open_Palm returns)
    │                         │
    │                    Pointing_Up
    │                         │
    │                         ▼
    │                    ┌─────────┐
    │                    │ ENGAGED │ ─── pointermove (dragging)
    │                    └─────────┘
    │                         │
    │                    Open_Palm (release)
    │                         │
    │                         ▼
    │                    pointerup (button=0)
    │                         │
    └─────────────────────────┘

EXITS:
- Palm cone > 70° → pointercancel (intentional disengage)
- Tracking loss → COAST (physics momentum) → timeout → pointercancel
```

### W3C Event Mapping

| State | Enter Action | During | Exit Action |
|-------|--------------|--------|-------------|
| IDLE | pointerleave | none | - |
| TRACKING | pointerenter | pointermove | - |
| ARMED | - | pointermove | - |
| ENGAGED | pointerdown(button=0) | pointermove | pointerup(button=0) |
| COAST | - | pointermove (predicted) | pointercancel |

---

## 6. Configuration Schema

```typescript
export interface GestureLanguageConfig {
  // Gesture recognition
  gestures: {
    /** Primary gestures (Open_Palm, Pointing_Up) */
    primary: ['Open_Palm', 'Pointing_Up'];
    /** Secondary gestures (future) */
    secondary: ['Victory', 'Thumb_Up', 'Thumb_Down'];
    /** Minimum confidence for recognition */
    confidenceThreshold: number;  // 0.7
  };
  
  // Palm cone hysteresis
  palmCone: {
    armThreshold: number;      // 25° - enter ARMED below this
    disarmThreshold: number;   // 35° - exit ARMED above this
    cancelThreshold: number;   // 70° - immediate cancel
  };
  
  // Timing
  timing: {
    armStableMs: number;       // 150 - dwell time to arm
    noneDebounceMs: number;    // 80 - ignore None below this
    longNoneMs: number;        // 200 - genuine disengagement
    coastingMaxMs: number;     // 2000 - max coast before cancel
  };
  
  // Coasting physics
  coasting: {
    damping: number;           // 0.92 - velocity decay per frame
    minVelocity: number;       // 0.0005 - stop coast threshold
  };
}

export const DEFAULT_GESTURE_CONFIG: GestureLanguageConfig = {
  gestures: {
    primary: ['Open_Palm', 'Pointing_Up'],
    secondary: ['Victory', 'Thumb_Up', 'Thumb_Down'],
    confidenceThreshold: 0.7,
  },
  palmCone: {
    armThreshold: 25,
    disarmThreshold: 35,
    cancelThreshold: 70,
  },
  timing: {
    armStableMs: 150,
    noneDebounceMs: 80,
    longNoneMs: 200,
    coastingMaxMs: 2000,
  },
  coasting: {
    damping: 0.92,
    minVelocity: 0.0005,
  },
};
```

---

## 7. Implementation Checklist

### Phase 1: Palm Cone Gate (Anti-Midas)
- [ ] Create `hot/bronze/src/gates/palm-cone-gate.ts`
- [ ] Implement `calculatePalmAngle()` from landmarks
- [ ] Implement Schmitt trigger with configurable thresholds
- [ ] Add tests for hysteresis behavior

### Phase 2: Gesture Transition Predictor
- [ ] Create `hot/bronze/src/gates/gesture-transition-predictor.ts`
- [ ] Track `lastValidGesture` and `noneEnteredAt`
- [ ] Implement prediction based on cyclic pattern
- [ ] Add tests for None debouncing

### Phase 3: FSM Integration
- [ ] Update `xstate-fsm.adapter.ts` to accept `palmAngle` (continuous)
- [ ] Wire palm cone gate as guard
- [ ] Wire gesture predictor for smoother transitions
- [ ] Add COAST state with physics momentum

### Phase 4: Visual Demo
- [ ] Update `08-w3c-pointer-fsm.html` with palm angle gauge
- [ ] Show hysteresis band visually
- [ ] Display None transition predictions
- [ ] Real-time state machine visualization

---

## 8. Sources

| Claim | Source |
|-------|--------|
| Palm hysteresis 25°/35° | Memory: FSM_Hysteresis_Architecture_20251231 |
| None debounce 80ms | Archived: w3c-pointer-fsm.ts line 54 |
| Midas Touch UX problem | Tavily: uxdesign.cc article |
| MediaPipe tracking confidence | Tavily: Google AI Edge docs |
| min_tracking_confidence default | Tavily: 0.5 (tunable) |
| Gesture transitions through None | TTao observation (empirical) |

---

*"The spider weaves the web that weaves the spider."*  
*Gen87.X3 | 2026-01-01*
