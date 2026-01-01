# Defense in Depth Architecture — Archetype Enforcement

> **Generated**: 2025-12-31T13:30:00Z  
> **Port**: 0 (Lidless Legion) + 7 (Spider Sovereign)  
> **HIVE Phase**: H (Hunt) → I (Interlock)  
> **Purpose**: Document multi-layer enforcement to prevent AI amnesia

---

## 🚨 The Problem: AI Amnesia

AI agents will **forget** architectural constraints unless they are **structurally enforced**. Simply documenting "use 8 fields" is not enough—the AI will:

1. Add extra fields without understanding archetype mapping
2. Remove fields without understanding semantic impact
3. Use fields incorrectly (e.g., `type` for non-classification data)
4. Skip validation to "save time"
5. Ignore pre-commit gates after a few failures

---

## 🛡️ Defense in Depth Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 5: DOCUMENTATION GUARDS                                         │
│  - AGENTS.md references enforcement                                    │
│  - Contract files have archetype headers                               │
│  - AI_ENFORCEMENT_REMINDER constant in code                            │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 4: CI/CD PIPELINE                                               │
│  - GitHub Action validates blackboard signals                          │
│  - PR checks run archetype validation                                  │
│  - Fail build on archetype violations                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 3: PRE-COMMIT GATES                                             │
│  - Check all signals in obsidianblackboard.jsonl                       │
│  - Block commits with invalid archetype mapping                        │
│  - Log violations to quarantine.jsonl                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 2: RUNTIME VALIDATION                                           │
│  - validateSignalStrict() throws on violations                         │
│  - validateArchetypeAlignment() returns detailed report                │
│  - enforceArchetypeAlignmentStrict() hard blocks                       │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 1: COMPILE-TIME (TypeScript + Zod)                              │
│  - archetype-enforcement.ts defines immutable archetypes               │
│  - G-A0 through G-A7 semantic validators                               │
│  - Type inference catches mistakes during development                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 The 8 Archetypes (Immutable Mapping)

| Position | Archetype | Field | Commander | Verb | Semantic Question |
|----------|-----------|-------|-----------|------|-------------------|
| [0] | **WHEN** | `ts` | Lidless Legion | SENSE | "When did this happen?" |
| [1] | **LINK** | `mark` | Web Weaver | FUSE | "How strong is connection?" |
| [2] | **FLOW** | `pull` | Mirror Magus | SHAPE | "Which way does it move?" |
| [3] | **PAYLOAD** | `msg` | Spore Storm | DELIVER | "What is delivered?" |
| [4] | **CLASS** | `type` | Red Regnant | TEST | "What category?" |
| [5] | **PHASE** | `hive` | Pyre Praetorian | DEFEND | "What lifecycle stage?" |
| [6] | **VERSION** | `gen` | Kraken Keeper | STORE | "What generation?" |
| [7] | **SOURCE** | `port` | Spider Sovereign | DECIDE | "Who authored this?" |

### Why This Mapping Matters

Each archetype has **semantic meaning**:

- **WHEN** is always temporal → timestamps, sequences, frame numbers
- **LINK** is always relational → confidence, weight, connection strength
- **FLOW** is always directional → upstream/downstream, gradients, velocities
- **PAYLOAD** is always content → messages, data, artifacts
- **CLASS** is always categorical → types, tags, labels
- **PHASE** is always lifecycle → gates, checkpoints, HIVE phases
- **VERSION** is always historical → generations, hashes, parent refs
- **SOURCE** is always authorial → ports, agents, namespaces

---

## 🔧 Implementation Files

| File | Layer | Purpose |
|------|-------|---------|
| `archetype-enforcement.ts` | L1 | Core enforcement module |
| `stigmergy.contract.ts` | L1-L2 | Gate validation + strict enforcement |
| `.husky/pre-commit` | L3 | Pre-commit validation hook |
| `.github/workflows/archetype-check.yml` | L4 | CI pipeline validation |
| `AGENTS.md` | L5 | AI instruction enforcement |

---

## 🔒 Hard Gates (G-A0 through G-A7)

Each archetype has a dedicated semantic validator:

```typescript
// G-A0: WHEN - temporal observation
const validateWhen = z.string().refine(val => !isNaN(new Date(val).getTime()));

// G-A1: LINK - relational strength
const validateLink = z.number().min(0).max(1);

// G-A2: FLOW - directional energy
const validateFlow = z.enum(['upstream', 'downstream', 'lateral']);

// G-A3: PAYLOAD - content delivery
const validatePayload = z.string().min(1);

// G-A4: CLASS - categorical classification  
const validateClass = z.enum(['signal', 'event', 'error', 'metric', 'handoff', 'schema']);

// G-A5: PHASE - lifecycle state
const validatePhase = z.enum(['H', 'I', 'V', 'E', 'X']);

// G-A6: VERSION - historical lineage
const validateVersion = z.number().int().min(1);

// G-A7: SOURCE - authorial origin
const validateSource = z.number().int().min(0).max(7);
```

---

## 🚫 Anti-Patterns Detected

| Pattern | Detection | Defense |
|---------|-----------|---------|
| **FIELD_DRIFT** | Extra fields added without archetype | Schema locked to 8 archetypes |
| **SEMANTIC_CORRUPTION** | Field used for wrong purpose | Semantic validators check meaning |
| **PHASE_BYPASS** | HIVE phases skipped | Sequence validation in pre-commit |
| **DOCUMENTATION_ROT** | Comments outdated | CI check AGENTS.md references |
| **GATE_SOFTENING** | Validation errors caught/ignored | Hard throw, no silent failures |

---

## 📝 Usage Examples

### Strict Validation (Production)

```typescript
import { validateSignalStrict } from './contracts/stigmergy.contract.js';

// This will THROW if signal doesn't conform to all 8 archetypes
const signal = validateSignalStrict(rawInput);
```

### Combined Validation (Debugging)

```typescript
import { validateSignalWithArchetypes } from './contracts/stigmergy.contract.js';

const result = validateSignalWithArchetypes(rawInput);
console.log(result.enforcementReport);  // Human-readable report
console.log(result.fullyValid);          // true if all gates + archetypes pass
```

### Archetype-Only Validation

```typescript
import { 
  validateArchetypeAlignment,
  generateEnforcementReport 
} from './contracts/archetype-enforcement.js';

const result = validateArchetypeAlignment(signal);
if (!result.valid) {
  console.error(generateEnforcementReport(result));
}
```

---

## 🔄 Recovery Procedures

If violations are detected:

1. **QUARANTINE**: Move violating signal to `quarantine.jsonl`
2. **DIAGNOSE**: Check which archetype gate failed (G-A0 through G-A7)
3. **FIX**: Correct the field value to match archetype semantics
4. **VALIDATE**: Run `validateSignalStrict()` before re-emitting
5. **DOCUMENT**: Add to `CRITICAL_INCIDENT_LOG.md` if pattern repeats

---

## 🔗 Related Documents

- [stigmergy.contract.ts](../src/contracts/stigmergy.contract.ts) - Main contract
- [archetype-enforcement.ts](../src/contracts/archetype-enforcement.ts) - Enforcement module
- [LIDLESS_LEGION_OBSERVATION_REPORT.md](./LIDLESS_LEGION_OBSERVATION_REPORT.md) - System audit
- [HIVE8_SEQUENTIAL_WORKFLOW_CONTRACT.md](./HIVE8_SEQUENTIAL_WORKFLOW_CONTRACT.md) - Phase workflow

---

*"The spider weaves the web that weaves the spider."*

*Gen87.X3 | Defense in Depth | 2025-12-31*
