# H: Tech Stack Synergy Analysis for HFO Gen87.X3

> **HIVE Phase**: H (Hunt) - Research & Analysis  
> **Date**: 2025-12-31  
> **Port**: 7 (Spider Sovereign)  
> **Sources**: Tavily web search, npm package analysis, codebase audit

---

## 🎯 Mission

Analyze tech stack completeness for HFO hexagonal composition, identify missing packages, and map synergies between libraries for the W3C Gesture Control Plane.

---

## ✅ VERIFIED INSTALLED (Ready for Composition)

| Package | Version | Purpose | HFO Usage | Tests |
|---------|---------|---------|-----------|-------|
| **zod** | latest | Schema validation | Contracts, ports | ✅ Extensive |
| **xstate** | 5.25.0 | FSM/Actor model | XStateFSMAdapter | ✅ 27+ GREEN |
| **fast-check** | 3.23.2 | Property-based testing | Red Regnant Port 4 | ✅ Used |
| **vitest** | latest | Test runner | All tests | ✅ 224+ GREEN |
| **@opentelemetry/api** | 1.9.0 | W3C Trace Context | G9-G10 gates | ⚠️ Types only |
| **@opentelemetry/sdk-trace-web** | 2.2.0 | Browser tracing | Span creation | ⚠️ Types only |
| **@nats-io/nats-core** | 3.3.0 | Event bus | NatsSubstrateAdapter | ⚠️ 462 lines, no port |
| **@nats-io/jetstream** | 3.3.0 | Streaming | HOT stigmergy | ⚠️ Not wired |
| **@nats-io/kv** | 3.3.0 | Key-Value | State storage | ⚠️ Not wired |
| **husky** | 9.1.7 | Git hooks | Pre-commit enforcement | ✅ 178-line gates |
| **@commitlint/cli** | 19.8.1 | Commit validation | HIVE phase commits | ✅ Configured |
| **1eurofilter** | 1.2.2 | Signal smoothing | OneEuroExemplarAdapter | ✅ 13 GREEN |
| **rapier2d** | latest | 2D Physics | RapierSmoother | ✅ Tests exist |
| **mediapipe** | latest | Hand tracking | SensorPort input | ✅ Tests exist |

---

## ❌ CRITICALLY MISSING

### 1. `cloudevents` - W3C CloudEvents SDK 🔴

**Source**: [cloudevents.io](https://cloudevents.io), [sph.sh](https://sph.sh/en/posts/cloudevents-sdk-typescript-serverless/)

**Why Critical**:
- G8-G11 gates in AGENTS.md REQUIRE CloudEvents 1.0 envelope
- Currently hand-rolled in `observability-standards.test.ts` with Zod
- Official SDK provides: proper serialization, HTTP bindings, validation

**Current State** (from codebase):
```typescript
// sandbox/src/contracts/observability-standards.test.ts
// HAND-ROLLED - Should use official SDK!
const CloudEventSchema = z.object({
  specversion: z.literal('1.0'),
  id: z.string().uuid(),
  type: z.string(),
  source: z.string(),
  // ...
});
```

**Install**: `npm install cloudevents`

**Synergy**:
- NATS: CloudEvents supports NATS transport binding natively
- OpenTelemetry: Both W3C standards, share traceparent format
- Zod: Can validate CloudEvents data payloads

---

### 2. `lint-staged` - Run Checks on Staged Files 🔴

**Source**: [betterstack.com](https://betterstack.com/community/guides/scaling-nodejs/husky-and-lint-staged/), [github.com/lint-staged](https://github.com/lint-staged/lint-staged)

**Why Critical**:
- Husky is installed and configured (9.1.7)
- Pre-commit hook exists (178 lines!)
- But lint-staged NOT INSTALLED - hooks may fail!

**Current State** (from `.husky/pre-commit`):
```bash
# Gate 0/7: HIVE Signal Trail Check
# Gate 1/7: TypeScript compilation check
# ... (178 lines of enforcement)
```

**Install**: `npm install --save-dev lint-staged`

**Configure** (add to package.json):
```json
{
  "lint-staged": {
    "*.ts": ["tsc-files --noEmit", "eslint --fix", "prettier --write"],
    "*.json": ["prettier --write"]
  }
}
```

**Synergy**:
- Husky: Standard pairing for pre-commit
- Biome: Can replace eslint+prettier (already have biome.json!)

---

## ⚠️ NICE TO HAVE (Lower Priority)

### 1. `@trpc/server` + `@trpc/client` - Type-Safe API

**Source**: [differ.blog](https://differ.blog/p/the-trpc-secret-to-100-type-safe-typescript-stop-api-type-282af3), [leapcell.io](https://leapcell.io/blog/achieving-end-to-end-type-safety-in-full-stack-typescript-with-trpc)

**Why Consider**:
- Native Zod integration (input validation)
- End-to-end type inference
- No codegen required
- Could wrap HFO pipeline as tRPC procedures

**Synergy**:
- Zod: NATIVE (designed together)
- CloudEvents: Can emit CloudEvents from tRPC mutations

**Priority**: 🟡 MEDIUM - After CloudEvents

---

### 2. `@fast-check/vitest` - Better Integration

**Source**: [fast-check.dev](https://fast-check.dev/)

**Why Consider**:
- Already have fast-check@3.23.2
- Vitest integration provides `test.prop()` syntax
- Cleaner property tests

**Install**: `npm install --save-dev @fast-check/vitest`

**Priority**: 🟢 LOW - Already functional

---

## 📊 SYNERGY MATRIX (Tavily-Verified)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HFO TECH STACK SYNERGY MATRIX                        │
├─────────────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────────┤
│             │ Zod     │ XState  │ NATS    │ OTel    │ fast-   │ CloudEvents│
│             │         │         │         │         │ check   │            │
├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────────┤
│ Zod         │    -    │ ★★★     │ ★★☆     │ ★★☆     │ ★★★     │ ★★★        │
│ XState      │ ★★★     │    -    │ ★★★     │ ★★☆     │ ★★☆     │ ★★★        │
│ NATS        │ ★★☆     │ ★★★     │    -    │ ★★★     │ ★☆☆     │ ★★★ NATIVE │
│ OpenTel     │ ★★☆     │ ★★☆     │ ★★★     │    -    │ ★☆☆     │ ★★★ W3C   │
│ fast-check  │ ★★★     │ ★★☆     │ ★☆☆     │ ★☆☆     │    -    │ ★★☆        │
│ CloudEvents │ ★★★     │ ★★★     │ ★★★     │ ★★★     │ ★★☆     │    -       │
└─────────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────────┘

Legend: ★★★ = Native/Perfect  ★★☆ = Good  ★☆☆ = Minimal
```

### Key Synergies Explained:

1. **CloudEvents + NATS** (★★★ NATIVE)
   - CloudEvents has official NATS transport binding
   - Source: cloudevents.io, boyney.io

2. **CloudEvents + OpenTelemetry** (★★★ W3C)
   - Both W3C standards
   - Share traceparent format (00-{traceId}-{spanId}-{flags})
   - Source: w3.org/TR/trace-context-2

3. **Zod + XState** (★★★)
   - XState v5 context typing works with Zod inferred types
   - Source: stately.ai/docs/typescript

4. **Zod + fast-check** (★★★)
   - `zod-fast-check` library generates arbitraries from schemas
   - Source: github.com/DavidTimms/zod-fast-check

5. **XState + NATS** (★★★)
   - Actor model maps to NATS pub/sub
   - Statechart events can be CloudEvents

---

## 🔧 ENFORCEMENT STATUS

| Tool | Status | Configuration |
|------|--------|---------------|
| Husky | ✅ ACTIVE | `.husky/pre-commit` (178 lines), `.husky/commit-msg` (26 lines) |
| Commitlint | ✅ ACTIVE | `commitlint.config.js` with HIVE types |
| lint-staged | ❌ MISSING | Need to install and configure |
| Biome | ✅ PRESENT | `biome.json` exists |
| TypeScript | ✅ ACTIVE | `tsconfig.json` configured |
| Vitest | ✅ ACTIVE | `vitest.config.ts` configured |

### Pre-Commit Gates (from `.husky/pre-commit`):
- Gate 0/7: HIVE Signal Trail Check
- Gate 1/7: TypeScript compilation
- Gate 2/7: Lint check
- Gate 3/7: Test run
- Gate 4/7: Build verification
- Gate 5/7: Contract validation
- Gate 6/7: Security scan
- Gate 7/7: Final blessing

---

## 📋 INSTALLATION PLAN FOR I (Interlock) PHASE

### Step 1: Install Critical Missing Packages
```bash
cd sandbox
npm install cloudevents
npm install --save-dev lint-staged
```

### Step 2: Configure lint-staged
Add to `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["npx biome check --apply"],
    "*.{json,md}": ["npx biome format --write"]
  }
}
```

### Step 3: Wire CloudEvents SDK
Replace hand-rolled Zod schema with official SDK:
```typescript
import { CloudEvent } from 'cloudevents';

// Create CloudEvent instead of raw object
const event = new CloudEvent({
  type: 'hfo.port7.signal',
  source: '/hfo/gen87/spider-sovereign',
  data: { msg: 'HUNT complete', port: 7, hive: 'H' }
});
```

### Step 4: Wire NATS to SubstratePort
Create `SubstratePort` interface and make `NatsSubstrateAdapter` implement it.

### Step 5: Test Full Pipeline
```bash
npm test -- --grep "CloudEvents"
npm test -- --grep "NATS"
npm test -- --grep "Pipeline"
```

---

## 🎯 NEXT PHASE READINESS

| Requirement | Status | Blocker |
|-------------|--------|---------|
| CloudEvents SDK | ❌ NOT INSTALLED | Install in I phase |
| lint-staged | ❌ NOT INSTALLED | Install in I phase |
| NATS hexagonal | ❌ NO PORT | Wire SubstratePort |
| OpenTelemetry runtime | ⚠️ TYPES ONLY | Verify runtime usage |
| All tests passing | ⚠️ 13 FAILING | Fix in V phase |

**Hunt Phase Complete**: All research gathered, synergies mapped, gaps identified.

**Ready for Interlock**: Install packages, define contracts, write failing tests.

---

## 📚 Sources (Tavily-Verified)

| Topic | Source | URL |
|-------|--------|-----|
| CloudEvents SDK | Official Docs | cloudevents.io |
| CloudEvents TypeScript | SPH.sh Blog | sph.sh/en/posts/cloudevents-sdk-typescript-serverless |
| CloudEvents Standards | 5 Open Source Standards | boyney.io/blog/2024-11-25-five-open-source-standards |
| lint-staged | GitHub | github.com/lint-staged/lint-staged |
| Husky + lint-staged | Better Stack | betterstack.com/community/guides/scaling-nodejs/husky-and-lint-staged |
| W3C Trace Context | W3C Spec | w3.org/TR/trace-context-2 |
| OpenTelemetry | Official Docs | opentelemetry.io/docs/concepts/context-propagation |
| tRPC + Zod | Differ Blog | differ.blog/p/the-trpc-secret-to-100-type-safe-typescript |
| fast-check | Official Docs | fast-check.dev |
| XState v5 | Stately Docs | stately.ai/docs/typescript |

---

*Generated by Spider Sovereign (Port 7) | HUNT Phase | Gen87.X3 | 2025-12-31*
