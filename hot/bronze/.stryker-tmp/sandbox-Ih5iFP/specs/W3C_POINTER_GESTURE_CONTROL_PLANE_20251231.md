# W3C Gesture Control Plane — Daily Spec 2025-12-31

> **Version**: 1.8.0  
> **Date**: 2025-12-31  
> **Generation**: 87.X3 → 88  
> **Phase**: HUNT (H) — Clean Surface Iteration  
> **Author**: Spider Sovereign (Port 7)  
> **Previous**: `W3C_POINTER_GESTURE_CONTROL_PLANE_20251230.md`

---

## 0. Today's Status

### ✅ CLEANED (Just Completed)

| Action | Before | After |
|--------|--------|-------|
| Specs | 17 files scattered | 7 active in `specs/` |
| Archives | Mixed locations | `_archived_v1/`, `_archived_v2/` |
| Session logs | Root clutter | `_archive/session_logs/` |
| Demos | 5 duplicate folders | 1 `demos/main/`, legacy in `demos/_legacy/` |
| Staging | - | `_staging_for_removal/` (5 folders, verify before delete) |

### 📁 Clean Working Surface

```
sandbox/
├── WORKING_SURFACE.md       ← Navigation guide (NEW)
├── obsidianblackboard.jsonl ← Active stigmergy
├── specs/                   ← 7 active specs
├── src/                     ← All source code
├── demos/main/              ← Working demo (886 lines)
├── _archive/                ← Historical (non-destructive)
└── _staging_for_removal/    ← Pending deletion (verify first)
```

---

## 1. Mission: Total Tool Virtualization

```
MediaPipe → Physics (Rapier/1€) → FSM (XState) → W3C Pointer → TargetAdapter → ANY TARGET
```

### Pipeline Stages

| Stage | Component | Status |
|-------|-----------|--------|
| 1. Input | MediaPipe Tasks Vision | ✅ Working |
| 2. Smoothing | 1€ Filter + Rapier | ⚠️ 1€ working, Rapier stub |
| 3. FSM | XState v5 | ✅ Working |
| 4. Output | W3C PointerEvents | ✅ Working |
| 5. Adapters | DOM dispatch | ✅ Working |
| 5. Adapters | Emulator routing | ❌ Stubs (461 patterns) |

---

## 2. Test Status (From MANIFEST.json)

| Metric | Value |
|--------|-------|
| Total tests | 506 |
| GREEN | 270 (53%) |
| RED | 229 (45%) |
| SKIP | 7 (1%) |
| **Stub patterns** | **461** |

### Stub Top Offenders

| File | Count |
|------|-------|
| emulator-adapters.test.ts | 93 |
| ui-shell-port.test.ts | 86 |
| observability-standards.test.ts | 68 |
| golden-master.test.ts | 54 |
| overlay-port.test.ts | 38 |

**Issue**: Stubs masquerade as GREEN via `expect().toThrow('Not implemented')`.  
**Fix**: Convert to `.todo()` for honest RED status.

---

## 3. Authoritative Sources (SSOT)

From `MANIFEST.json`:

| Source | Path |
|--------|------|
| Agent Instructions | `AGENTS.md` |
| Daily Spec | `hfo_daily_specs/W3C_POINTER_GESTURE_CONTROL_PLANE_20251231.md` (this file) |
| Swarm Spec | `hfo_daily_specs/HARD_GATED_SWARM_SCATTER_GATHER_20251230.md` |
| Contracts | `sandbox/src/contracts/` |
| Adapters | `sandbox/src/adapters/` |
| Blackboard | `sandbox/obsidianblackboard.jsonl` |
| Memory Bank | `../portable_hfo_memory_pre_hfo_to_gen84_*/hfo_memory.duckdb` |
| Reference Impl | `../hfo_kiro_gen85/` (687 tests) |

---

## 4. HIVE/8 Phase Status

| Phase | Ports | Status | What's Done |
|-------|-------|--------|-------------|
| **H (Hunt)** | 0+7 | ✅ ACTIVE | Cleanup complete, specs updated |
| I (Interlock) | 1+6 | ⏳ Next | Define contracts for stubs |
| V (Validate) | 2+5 | ⏳ | Make stub tests pass |
| E (Evolve) | 3+4 | ⏳ | Refactor, iterate to Gen88 |

---

## 5. Today's Priorities

### P0: Verify Demo Works
- [ ] Open `sandbox/demos/main/index.html`
- [ ] Camera → Palm recognition → FSM state changes
- [ ] W3C events dispatching

### P1: Clean Staging Folder
- [ ] Verify `demos/main/` and `demos/_legacy/` have all content
- [ ] Delete `_staging_for_removal/` (duplicates)

### P2: Convert Stubs to .todo()
- [ ] Run `npm run detect:stubs`
- [ ] Start with `emulator-adapters.test.ts` (93 stubs)
- [ ] Convert to `it.todo('...')` for honest RED

### P3: MCP Server Implementation
- [ ] Lidless Legion server started (208 deps installed)
- [ ] Test MCP connection
- [ ] Wire up Tavily + Memory + Code search

---

## 6. Demo Architecture

**Working Demo**: `sandbox/demos/main/index.html` (886 lines)

| Panel | Purpose |
|-------|---------|
| Camera Feed | MediaPipe hand tracking |
| Pipeline State | 5-stage pipeline visualization |
| FSM State | XState state machine view |
| Event Log | W3C pointer events |
| Click Targets | Test targets for gesture input |

**Tech Stack**:
- Golden Layout v2.6.0 (ES modules, no jQuery)
- MediaPipe Tasks Vision
- XState v5
- 1€ Filter
- W3C Pointer Events

---

## 7. Next Daily Spec

When transitioning to Gen88:
1. Update version to `88.X0`
2. Archive this spec to `_archived_v3/`
3. Create `W3C_POINTER_GESTURE_CONTROL_PLANE_20260101.md`
4. Emit `E → H(N+1)` signal to blackboard

---

*Spider Sovereign | Port 7 | DECIDE | 2025-12-31T08:00Z*
