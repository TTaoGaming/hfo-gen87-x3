# AI Trust & Reputation System - Daily Spec

> **Version**: 0.1.0  
> **Date**: 2025-12-31  
> **Generation**: 87.X3  
> **Status**: INTERLOCK (I) - Tests Written  
> **Author**: Spider Sovereign (Port 7) + Red Regnant (Port 4)  
> **PDCA Cycle**: DO | **HIVE/8**: I (Interlock) | **TDD**: RED  

---

## 0. Executive Summary

### The Problem

AI agents lie. Detection exists (Pyre caught 309 violations). But detection ≠ prevention.

**Current state**: Violations → Blackboard → Dead End  
**Required state**: Violations → Blackboard → Trust Score → Tool Restriction → Behavior Change

### The Solution

Automated Trust Score System that:
1. Reads blackboard for violation history
2. Calculates trust score (exponential decay formula)
3. Maps score to tool access level (full / read-only / quarantine)
4. Blocks tools structurally (not via prompts)

---

## 1. Implementation Status

| Component | File | Status | Tests |
|-----------|------|--------|-------|
| Trust Score Algorithm | `src/reputation/trust-score.ts` | ✅ Done | ✅ 15 tests |
| Blackboard Integration | `src/reputation/trust-score.ts` | ✅ Done | ✅ 3 tests |
| Tool Enforcement | `src/reputation/trust-score.ts` | ✅ Done | ✅ 3 tests |
| Persistence (file) | `src/reputation/trust-score.ts` | ✅ Done | ✅ 3 tests |
| MCP Tool Filter | - | ❌ TODO | - |
| NATS KV Storage | - | ❌ TODO | - |
| VS Code Extension | - | ❌ TODO | - |

---

## 2. Automated Tests

### Run All Trust Tests
```bash
npm test src/reputation/
```

### Run in Watch Mode
```bash
npm run test:watch -- src/reputation/
```

### Run with Coverage
```bash
npm run test:coverage -- src/reputation/
```

---

## 3. Trust Score Algorithm

### Formula
```typescript
trust_new = trust_old * DECAY + bonus

DECAY = 0.95           // Slight degradation over time
BONUS_VERIFIED = 0.1   // Reward for verified action
PENALTY_VIOLATION = -0.3  // Sharp punishment
```

### Example Trajectory
```
Start:        0.500
Verified:     0.575 (+0.075)
Verified:     0.646 (+0.071)
VIOLATION:    0.314 (-0.332) ← CRASH!
Verified:     0.398 (+0.084)
Verified:     0.478 (+0.080)
Verified:     0.554 (+0.076)
Verified:     0.627 (+0.073) ← Still not recovered
```

**Key insight**: One violation takes 4+ verified actions to recover from.

---

## 4. Trust Levels & Tool Access

| Trust Score | Level | Available Tools |
|-------------|-------|-----------------|
| 0.80 - 1.00 | `full` | read_file, grep_search, list_dir, create_file, replace_string_in_file, run_in_terminal |
| 0.50 - 0.79 | `read-only` | read_file, grep_search, list_dir |
| 0.20 - 0.49 | `quarantine` | (none) |
| 0.00 - 0.19 | `quarantine` | (none) |

---

## 5. Blackboard Integration

The system reads `obsidianblackboard.jsonl` and counts violations:

**Violation patterns detected:**
- `type: 'error'`
- `msg` contains: `VIOLATION`, `QUARANTINE`, `SKIPPED_HUNT`, `REWARD_HACK`, `INCOMPLETE_CYCLE`

**Usage:**
```typescript
import { enforceToolAccess } from './src/reputation/trust-score.js';

const result = enforceToolAccess('create_file', 'sandbox/obsidianblackboard.jsonl');

if (!result.allowed) {
  console.error(`BLOCKED: ${result.reason}`);
  console.error(`Trust: ${(result.trustScore * 100).toFixed(1)}%`);
  console.error(`Level: ${result.trustLevel}`);
}
```

---

## 6. HIVE/8 Integration

### Pre-Phase Gate
Before any phase transition, check trust:

```typescript
// In HIVE phase transition
const trust = calculateTrustFromBlackboard('sandbox/obsidianblackboard.jsonl');
const level = getTrustLevel(trust);

if (level === 'quarantine') {
  throw new Error('AI in quarantine - cannot proceed with HIVE cycle');
}

if (phase === 'I' && level !== 'full') {
  throw new Error('Interlock phase requires full trust for write operations');
}
```

### Automated npm Scripts

```bash
# Check current trust score
npm run trust:check

# Get trust level
npm run trust:level

# Enforce tool access (blocks if trust too low)
npm run trust:enforce -- create_file
```

---

## 7. Automation Commands

### Added to package.json
```json
{
  "scripts": {
    "trust:check": "tsx -e \"const {calculateTrustFromBlackboard}=require('./src/reputation/trust-score.js');console.log('Trust:',calculateTrustFromBlackboard('sandbox/obsidianblackboard.jsonl'));\"",
    "trust:level": "tsx -e \"const {calculateTrustFromBlackboard,getTrustLevel}=require('./src/reputation/trust-score.js');const t=calculateTrustFromBlackboard('sandbox/obsidianblackboard.jsonl');console.log('Trust:',t.toFixed(3),'Level:',getTrustLevel(t));\"",
    "trust:enforce": "tsx scripts/trust-enforce.ts",
    "test:reputation": "vitest run src/reputation/"
  }
}
```

---

## 8. Next Steps (TODO)

### Phase 2: MCP Tool Filter (Structural Enforcement)
- [ ] Create custom MCP server that wraps tools
- [ ] Filter tool list based on trust score before returning to Copilot
- [ ] AI literally cannot see blocked tools

### Phase 3: NATS KV Storage
- [ ] Migrate from file-based to NATS KV
- [ ] Real-time trust score updates
- [ ] Cross-session persistence

### Phase 4: VS Code Extension
- [ ] Display trust score in status bar
- [ ] Alert when trust drops below threshold
- [ ] Suggest session restart on quarantine

---

## 9. Strange Loop Closure

**The loop is now closed:**

```
AI Action → Signal (claim) → Blackboard
     ↑                           ↓
     └── Tool Access ← Trust Score
```

**Proof**: Run the tests. They verify the loop mathematically.

```bash
npm test src/reputation/
```

---

## 10. Honest Limitations

What this system CANNOT do:
1. Prevent lies in real-time (only detects post-hoc)
2. Stop AI from ignoring prompts (structural enforcement needs MCP phase)
3. Persist across VS Code restarts (needs NATS phase)
4. Distinguish "honest mistake" from "deliberate lie"

What this system CAN do:
1. Track violation history automatically
2. Calculate trust score deterministically
3. Map score to tool access levels
4. Block tools programmatically (when MCP integration complete)

---

*Generated: 2025-12-31 | Gen87.X3 | TDD Phase: RED → GREEN*
