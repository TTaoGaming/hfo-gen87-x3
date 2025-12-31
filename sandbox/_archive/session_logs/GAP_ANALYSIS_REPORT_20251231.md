# Gap Analysis Report — W3C Gesture Control Plane
> **Generated**: 2025-12-31 | **Phase**: HUNT Complete → INTERLOCK Ready | **Port 7 Spider Sovereign**

---

## Executive Summary

| Area | Current State | Target State | Gap Severity |
|------|---------------|--------------|--------------|
| **Demo Organization** | 5 competing folders | 1 MASTER + archived legacy | 🔴 HIGH |
| **FSM Quality** | Wrong gesture mappings, no guards | Correct mappings + discriminatedUnion | 🔴 HIGH |
| **MediaPipe Visualization** | No landmark overlay | Full 21-point skeleton | 🟡 MEDIUM |
| **Settings Panel** | Hardcoded 1€ params | Interactive Golden Layout tab | 🟡 MEDIUM |
| **MCP Servers** | 3 servers (reasonable) | 3 servers ✅ | 🟢 OK |

---

## 1. Demo Folder Chaos

### Current Structure (MESSY)
```
sandbox/
├── demo/           # Basic incomplete demo (3 files)
├── demo-real/      # Architecture demo - USER TESTED THIS ONE ✅
├── demo-golden/    # Multiple timestamped versions + _archived/
├── demo-daedalos/  # Target adapter exploration (incomplete)
└── demo-puter/     # Target adapter exploration (incomplete)
```

### Problems
1. **No single source of truth** - which demo is "the" demo?
2. **Version sprawl** in demo-golden (4 index files with timestamps)
3. **Abandoned experiments** (daedalos, puter) cluttering workspace
4. **User confusion** - "not sure which one is the correct one"

### Recommended Structure
```
sandbox/
├── demos/
│   ├── main/                    # THE working demo (from demo-real)
│   │   ├── index.html
│   │   └── README.md
│   └── _legacy/                 # Archived attempts
│       ├── v1-basic/            # was demo/
│       ├── v2-golden-variants/  # was demo-golden/
│       ├── v3-target-daedalos/  # was demo-daedalos/
│       └── v3-target-puter/     # was demo-puter/
```

---

## 2. FSM Quality Issues

### Current State (demo-real lines 391-436)

```javascript
// WRONG MAPPINGS
if (gesture === 'Victory' || gesture === 'Thumb_Up') 
  this.actor.send({ type: 'PINCH' });  // ❌ Victory is ✌️ NOT pinch!

if (gesture === 'Open_Palm' || gesture === 'Pointing_Up') 
  this.actor.send({ type: 'OPEN' });   // ⚠️ Pointing_Up should be hover
```

### Problems Identified
| Issue | Current | Should Be |
|-------|---------|-----------|
| Victory gesture | Maps to PINCH | Should be ignored or scroll |
| Thumb_Up gesture | Maps to PINCH | Should be confirmation/special |
| Pointing_Up gesture | Maps to OPEN/release | Should be hover/tracking |
| Output schema | Flat object | discriminatedUnion per spec |
| Confidence check | None | Require gesture.score > 0.7 |
| Hysteresis | None | 3-5 frame persistence |
| Palm orientation | Unused | arming-gate.ts EXISTS but not used |

### Target FSMAction Schema (from spec)
```typescript
const FSMActionSchema = z.discriminatedUnion('action', [
  { action: 'move', x, y, state },
  { action: 'down', x, y, button, state },
  { action: 'up', x, y, button, state },
  { action: 'cancel', state },
  { action: 'wheel', deltaX, deltaY, state },
  { action: 'none', state },
]);
```

---

## 3. MediaPipe Visualization Gap

### Current State
- `demo-real`: Video shows camera BUT no landmark overlay
- `demo-golden`: HAS landmarks-canvas infrastructure but separate demo

### What's Missing
- 21-point hand skeleton overlay on video
- Connection lines (MediaPipe hand connections)
- Gesture label text overlay
- Confidence meter visualization
- Smoothed vs raw landmark comparison view

### Fix Strategy
Port the landmark rendering from demo-golden into demo-real/main:
```html
<video id="video">
<canvas id="landmarks-canvas" style="position:absolute; pointer-events:none;">
```

---

## 4. Settings Panel Gap

### Current State
All parameters hardcoded in constructors:
```javascript
// OneEuroAdapter
this.minCutoff = config.minCutoff ?? 1.0;   // No UI
this.beta = config.beta ?? 0.007;           // No UI
this.dCutoff = config.dCutoff ?? 1.0;       // No UI
```

### Target State
4th Golden Layout panel with:
- **1€ Filter Tuning**: minCutoff slider (0.1-10), beta slider (0-0.1), dCutoff slider (0.1-5)
- **Gesture Recognition**: confidence threshold (0.5-1.0), debounce frames (1-10)
- **Palm Orientation**: facing requirement toggle, angle threshold
- **Debug Toggles**: show raw landmarks, show predicted, log verbosity

---

## 5. MCP Server Status

### Current (.vscode/mcp.json)
| Server | Purpose | Status |
|--------|---------|--------|
| `filesystem` | File access | ✅ Used |
| `tavily` | Web search grounding | ✅ Used |
| `rag-memory-mcp` | Document RAG | ✅ Used |

**Verdict**: 3 servers is fine. User's "too many MCP" concern is likely about:
- Multiple AGENTS.md files (4 total)
- Multiple spec folders creating confusion
- NOT actual MCP server proliferation

---

## 6. Existing Code Assets (Unused)

### In sandbox/src/gesture/ (NOT used by demo-real!)
| File | Purpose | Integration Status |
|------|---------|-------------------|
| `arming-gate.ts` | Palm-facing requirement | ❌ Not used |
| `palm-orientation-detector.ts` | Calculate palm normal | ❌ Not used |
| `palm-normal-calculator.ts` | Vector math for palm | ❌ Not used |
| `commit-gesture.test.ts` | Tests exist! | ❌ Tests but no integration |

### In sandbox/src/smoothers/
Likely has more sophisticated smoothing options not used by demo.

---

## 7. Action Plan

### Phase 1: Cleanup (15 min) — NON-DESTRUCTIVE
1. Create `sandbox/demos/_legacy/`
2. Move demos with version prefixes
3. Rename demo-real → demos/main/
4. Create MANIFEST.md

### Phase 2: Fix FSM (1-2 hours) — INTERLOCK
1. Correct gesture→event mappings
2. Add confidence thresholds
3. Implement discriminatedUnion output
4. Integrate arming gate

### Phase 3: Add Visualization (1 hour) — VALIDATE
1. Port landmarks-canvas from demo-golden
2. Add MediaPipe drawing utilities
3. Add gesture label overlay

### Phase 4: Settings Panel (1-2 hours) — VALIDATE
1. Add 4th Golden Layout component
2. Wire up 1€ filter param controls
3. Wire up gesture threshold controls
4. Add palm orientation toggle

---

## 8. Success Criteria

| Metric | Before | After |
|--------|--------|-------|
| Demo folders | 5 competing | 1 MASTER |
| FSM gesture accuracy | ~60% (wrong mappings) | 95%+ |
| Landmark visualization | None | Full skeleton |
| User configurability | 0 params | 6+ params |
| Confidence gating | None | 0.7 threshold |

---

*Gap analysis complete. Ready for INTERLOCK phase.*
