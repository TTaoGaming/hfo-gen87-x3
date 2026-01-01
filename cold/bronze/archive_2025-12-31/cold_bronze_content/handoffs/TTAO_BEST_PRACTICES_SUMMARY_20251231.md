# 📋 TTao Best Practices — One Page Summary

> **Date**: December 31, 2025 | **Gen**: 87.X3 | **Phase**: HUNT
> **Your Problem**: Too many floating pieces, losing track of state

---

## 🎯 CURRENT STATE (What You Actually Have)

| Asset | Status | Where |
|-------|--------|-------|
| **MANIFEST.json** | ✅ SSOT | Root — lists ALL authoritative files |
| **Daily Specs** | ✅ Active | `hfo_daily_specs/` (3 files) |
| **Working Specs** | ✅ Cleaned | `sandbox/specs/` (7 files) |
| **Dashboard** | ✅ Useful | `HFO_DEV_DASHBOARD.html` |
| **Blackboard** | ✅ Active | `sandbox/obsidianblackboard.jsonl` (216 signals) |
| **Working Demo** | ⚠️ Prototype | `sandbox/demos/main/` |
| **Tests** | ⚠️ 270/506 GREEN | 461 stubs masking real gaps |

---

## 🚨 THE GAP (Your Real Problem)

```
DESIGN Score:      8.75/10 ✅ Architecture is solid
ENFORCEMENT Score: 3.5/10  ❌ Rules aren't enforced
───────────────────────────
DELTA:            -5.25    ← This is the problem
```

**Translation**: You have beautiful designs but weak enforcement. AI creates theater code because nothing stops it.

---

## 🏗️ YOUR 3 PILLARS (What Works)

### 1. MANIFEST.json — Single Source of Truth
```
Check MANIFEST.json → "authoritative" section → those files are real
Everything else is reference/archive
```

### 2. HIVE/8 Workflow — Phase Discipline
```
H (Hunt)     → Research first, NO code
I (Interlock)→ Write FAILING tests first
V (Validate) → Make tests GREEN
E (Evolve)   → Refactor, commit, persist lessons
```

### 3. Stigmergy — Blackboard Coordination
```
All state in obsidianblackboard.jsonl
Agents don't talk to each other — they read/write signals
Last 10 signals = current context
```

---

## 📁 WHERE TO FIND THINGS

| Need | Location | Rule |
|------|----------|------|
| What's authoritative? | `MANIFEST.json` | Check here FIRST |
| Today's mission? | `hfo_daily_specs/*.md` | Date-stamped |
| Finalized specs? | `sandbox/specs/` | Gold tier |
| Session continuity? | `sandbox/handoffs/` | Silver tier |
| Exploration notes? | `sandbox/research/` | Bronze tier |
| Current state? | `sandbox/obsidianblackboard.jsonl` | Signals |
| Live metrics? | `HFO_DEV_DASHBOARD.html` | Visual |

---

## ⚡ WHAT TO DO NEXT (Priority Order)

1. **Use the Dashboard** — You said it's useful, keep it open
2. **Stub Audit** — 461 stubs = fake green tests. Run `npm run detect-stubs`
3. **Demo Cleanup** — Verify `sandbox/demos/main/` works, delete `_staging_for_removal/`
4. **Pick ONE vertical** — Camera→MediaPipe→1€→XState→W3C→DOM with zero stubs

---

## 🔑 YOUR PERSONAL RULES (From Memory Bank)

| Rule | Why |
|------|-----|
| Max 3 items per response | Cognitive load |
| No fluff, actionable only | INTJ preference |
| Gaming metaphors work | Build orders = TDD phases |
| Infrastructure > Willpower | Your 45-point discipline gap |
| Prove, don't assume | Zero trust AI |

---

## 🎮 THE MANTRA (Quick Reset)

```
When lost:
1. Open MANIFEST.json
2. Check blackboard for last signal
3. Ask: "Am I in H, I, V, or E phase?"
4. Do ONLY that phase's work
```

---

*"The spider weaves the web that weaves the spider."*
