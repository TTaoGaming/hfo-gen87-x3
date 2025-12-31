# HFO Infrastructure Specification
**SSOT**: Single Source of Truth for HFO Gen87.X3 Infrastructure  
**Date**: 2025-12-31T19:31:23Z  
**Generation**: 87.X3  
**Status**: ACTIVE - This document defines the infrastructure requirements

---

## Purpose

This specification defines the **infrastructure and enforcement architecture** for HFO Gen87.X3, ensuring code quality, preventing reward hacking, and maintaining architectural integrity.

Based on: [LIDLESS LEGION Audit](../sandbox/audits/LIDLESS_LEGION_STATUS_REPORT.md)

---

## 1. Enforcement Gates (CRITICAL)

### 1.1 G-ARCH: Architecture Compliance Gate
**Priority**: CRITICAL  
**Status**: MUST IMPLEMENT FIRST

**Purpose**: Prevent demos from bypassing tested architecture

**Rules**:
1. ❌ BLOCK: Inline adapter classes in HTML/JSX files
2. ❌ BLOCK: Hand-rolled FSM (if/else state transitions)
3. ❌ BLOCK: Inline filter implementations (e.g., 1€ filter functions)
4. ✅ REQUIRE: Import from `sandbox/src/adapters/`
5. ✅ REQUIRE: Use XState machine for FSM
6. ✅ REQUIRE: Use adapter pattern for all core components

**Implementation**:
```typescript
// scripts/gate-architecture.ts
export interface ArchGateRule {
  name: string;
  pattern: RegExp;
  antiPattern?: RegExp; // If present, violation is ignored
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
  appliesTo: string[]; // File extensions
}

const ARCH_RULES: ArchGateRule[] = [
  {
    name: 'NO_INLINE_ADAPTER_CLASSES',
    pattern: /class\s+(\w*Adapter|\w*Smoother|\w*Factory)\s*\{/g,
    severity: 'CRITICAL',
    message: 'Inline adapter class detected. Import from sandbox/src/adapters/',
    appliesTo: ['.html', '.jsx', '.tsx']
  },
  {
    name: 'NO_INLINE_FSM',
    pattern: /if\s*\(\s*(?:state|gesture)\s*===?\s*['"](?:DISARMED|ARMING|ARMED|ACTIVE)['"]/gi,
    antiPattern: /import.*xstate/i,
    severity: 'CRITICAL',
    message: 'Hand-rolled FSM detected. Use XState adapter.',
    appliesTo: ['.html', '.jsx', '.tsx', '.js', '.ts']
  },
  {
    name: 'NO_INLINE_FILTERS',
    pattern: /function\s+oneEuro|const\s+oneEuro\s*=/gi,
    antiPattern: /class\s+OneEuroAdapter/i,
    severity: 'CRITICAL',
    message: 'Inline filter detected. Use OneEuroAdapter.',
    appliesTo: ['.html', '.jsx', '.tsx']
  }
];
```

**Exit Code**: `1` (blocks commit) if violations found

---

### 1.2 G-NATS: Event Bus Compliance Gate
**Priority**: HIGH  
**Status**: MUST IMPLEMENT

**Purpose**: Ensure production code uses NATS, not direct DOM events

**Rules**:
1. ❌ BLOCK: `dispatchEvent()` in production demos
2. ❌ BLOCK: `addEventListener()` without NATS routing
3. ✅ REQUIRE: NATS connection established
4. ✅ REQUIRE: Event routing through JetStream

**Exceptions**:
- Test files (*.test.ts, *.spec.ts)
- Development/prototype demos in `sandbox/demos/_legacy/`

---

### 1.3 G-TODO: Production Code Quality Gate
**Priority**: CRITICAL  
**Status**: MUST IMPLEMENT

**Purpose**: Block TODO stubs in production code (reward hacking prevention)

**Rules**:
1. ❌ BLOCK: `// TODO: Wire` in non-test files
2. ❌ BLOCK: `// For now, pass through`
3. ❌ BLOCK: `throw new Error('Not implemented')` outside tests
4. ✅ ALLOW: TODO in test files (TDD RED phase)
5. ✅ ALLOW: TODO with GitHub issue reference

**Pattern**:
```typescript
const TODO_PATTERNS = [
  /\/\/\s*TODO:?\s*(?:Wire|Implement|For now)/gi,
  /\/\/\s*For now[,:]?\s*/gi,
  /throw\s+new\s+Error\s*\(\s*['"]Not implemented['"]\s*\)/gi
];

const ALLOWED_IN = ['.test.ts', '.test.tsx', '.spec.ts'];
```

---

### 1.4 G-XSTATE: FSM Compliance Gate
**Priority**: HIGH  
**Status**: MUST IMPLEMENT

**Purpose**: Enforce XState v5 usage for all state machines

**Rules**:
1. ❌ BLOCK: Manual state variables in demos (e.g., `let state = 'DISARMED'`)
2. ❌ BLOCK: Switch/case state transitions
3. ✅ REQUIRE: XState `createActor` or `createMachine`
4. ✅ REQUIRE: Import from `xstate-fsm.adapter.ts`

---

## 2. Build & Bundle Infrastructure

### 2.1 TypeScript → Browser Pipeline
**Priority**: CRITICAL  
**Status**: REQUIRED FOR ARCH COMPLIANCE

**Problem**: Demos can't import TypeScript adapters directly

**Solution**: Add Vite bundler

**Configuration**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'sandbox/src/adapters/index.ts'),
      name: 'HFOAdapters',
      fileName: 'hfo-adapters',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['xstate', '@mediapipe/tasks-vision'],
      output: {
        globals: {
          xstate: 'XState',
          '@mediapipe/tasks-vision': 'MediaPipe'
        }
      }
    }
  }
});
```

**Output**: `sandbox/demos/dist/hfo-adapters.js`

**Usage in Demos**:
```html
<script type="module">
  import { 
    OneEuroSmoother, 
    XStateFSMAdapter,
    W3CPointerEventFactory 
  } from './dist/hfo-adapters.js';
</script>
```

---

### 2.2 Package Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "build:adapters": "vite build",
    "build:adapters:watch": "vite build --watch",
    "demo:serve": "vite preview --outDir sandbox/demos",
    
    "gate:arch": "tsx scripts/gate-architecture.ts",
    "gate:nats": "tsx scripts/gate-nats.ts",
    "gate:todo": "tsx scripts/gate-todo.ts",
    "gate:xstate": "tsx scripts/gate-xstate.ts",
    "gate:all": "npm run gate:arch && npm run gate:nats && npm run gate:todo && npm run gate:xstate",
    
    "precommit": "npm run gate:all"
  }
}
```

---

## 3. Pre-Commit Hooks (Husky)

### 3.1 Gate Order (Sequential)
```bash
# .husky/pre-commit
#!/bin/sh

echo "🛡️  Running HFO Enforcement Gates..."

# Gate 1: Architecture compliance (CRITICAL)
npm run gate:arch || exit 1

# Gate 2: TODO stubs (CRITICAL)
npm run gate:todo || exit 1

# Gate 3: XState FSM (HIGH)
npm run gate:xstate || exit 1

# Gate 4: NATS event bus (HIGH)
npm run gate:nats || exit 1

# Gate 5: HIVE/8 signal validation (existing)
npm run validate:hive || exit 1

echo "✅ All gates passed"
```

---

## 4. NATS Infrastructure

### 4.1 NATS Server Setup
**Priority**: HIGH  
**Status**: REQUIRED FOR PRODUCTION

**Local Development**:
```bash
# Install NATS server
curl -L https://github.com/nats-io/nats-server/releases/download/v2.10.7/nats-server-v2.10.7-linux-amd64.tar.gz -o nats.tar.gz
tar -xzf nats.tar.gz

# Run with WebSocket support
./nats-server --jetstream --websocket_port 4223
```

**Docker Compose**:
```yaml
# docker-compose.yml
services:
  nats:
    image: nats:2.10.7-alpine
    ports:
      - "4222:4222"  # Client connections
      - "4223:4223"  # WebSocket
      - "8222:8222"  # HTTP monitoring
    command: >
      --jetstream
      --websocket_port 4223
      --http_port 8222
    volumes:
      - ./nats-data:/data
```

**Usage**:
```bash
docker-compose up -d
npm run demo:serve
```

---

### 4.2 NATS Connection Config

**Environment Variables**:
```bash
# .env
NATS_URL=ws://localhost:4223
NATS_JETSTREAM_DOMAIN=hfo-gen87
NATS_STREAM_NAME=gesture-control
```

**Adapter Configuration**:
```typescript
// sandbox/src/adapters/nats-substrate.adapter.ts
export const NATS_CONFIG = {
  url: process.env.NATS_URL || 'ws://localhost:4223',
  stream: process.env.NATS_STREAM_NAME || 'gesture-control',
  subjects: {
    sensor: 'sensor.mediapipe',
    smooth: 'smooth.oneeuro',
    fsm: 'fsm.xstate',
    pointer: 'pointer.w3c',
    target: 'target.dom'
  }
};
```

---

## 5. Testing Infrastructure

### 5.1 E2E Test Harness
**Priority**: MEDIUM  
**Status**: FUTURE ENHANCEMENT

**Requirements**:
1. Playwright for browser automation
2. NATS mock server for integration tests
3. MediaPipe mock for gesture simulation

**Structure**:
```
e2e/
├── fixtures/
│   ├── gesture-sequences.json
│   ├── mediapipe-mock.ts
│   └── nats-mock.ts
├── tests/
│   ├── architecture-compliance.spec.ts
│   ├── gesture-pipeline.spec.ts
│   └── nats-routing.spec.ts
└── playwright.config.ts
```

---

### 5.2 Contract Testing
**Priority**: HIGH  
**Status**: EXPAND EXISTING

**Additions**:
```typescript
// sandbox/src/contracts/demo-compliance.test.ts
describe('Demo Architecture Compliance', () => {
  it('should import adapters from sandbox/src/adapters/', () => {
    const demoHTML = fs.readFileSync('sandbox/demos/main/index.html', 'utf-8');
    expect(demoHTML).toMatch(/import.*from.*adapters/);
    expect(demoHTML).not.toMatch(/class\s+\w*Adapter\s*\{/);
  });
  
  it('should use XState machine, not inline FSM', () => {
    const demoHTML = fs.readFileSync('sandbox/demos/main/index.html', 'utf-8');
    expect(demoHTML).toMatch(/import.*xstate/);
    expect(demoHTML).not.toMatch(/if\s*\(\s*state\s*===\s*['"]DISARMED['"]/);
  });
  
  it('should route events through NATS', () => {
    const demoHTML = fs.readFileSync('sandbox/demos/main/index.html', 'utf-8');
    expect(demoHTML).toMatch(/NatsSubstrateAdapter/);
    expect(demoHTML).toMatch(/connect\(/);
  });
});
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow
```yaml
# .github/workflows/enforce.yml
name: HFO Enforcement Gates

on: [push, pull_request]

jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Architecture Gate
        run: npm run gate:arch
      
      - name: Run TODO Gate
        run: npm run gate:todo
      
      - name: Run XState Gate
        run: npm run gate:xstate
      
      - name: Run NATS Gate
        run: npm run gate:nats
      
      - name: Run Tests
        run: npm test
      
      - name: Build Adapters
        run: npm run build:adapters
```

---

## 7. Documentation Infrastructure

### 7.1 Auto-Generated Docs
**Priority**: MEDIUM  
**Status**: FUTURE ENHANCEMENT

**Tools**:
- TypeDoc for adapter API docs
- Storybook for component demos
- Docusaurus for user guide

---

## 8. Observability Infrastructure

### 8.1 OpenTelemetry Integration
**Priority**: MEDIUM  
**Status**: PARTIAL (package installed)

**Traces**:
- Gesture recognition latency
- Smoother pipeline timing
- FSM transition tracking
- Pointer event dispatch timing

**Metrics**:
- FPS (frames per second)
- Gesture detection confidence
- Event queue depth
- NATS message throughput

---

## 9. Development Environment

### 9.1 Required Extensions
- Biome (linting/formatting)
- TypeScript + ESLint
- Playwright Test Runner
- REST Client (for NATS monitoring)

### 9.2 VS Code Settings
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 10. Migration Path

### Phase 1: Enforcement (IMMEDIATE)
- [x] Lidless Legion audit complete
- [ ] Create G-ARCH gate script
- [ ] Create G-TODO gate script
- [ ] Create G-XSTATE gate script
- [ ] Create G-NATS gate script
- [ ] Add gates to pre-commit hook
- [ ] Update CI/CD workflow

### Phase 2: Bundler (SHORT-TERM)
- [ ] Add Vite configuration
- [ ] Create adapter bundle entry point
- [ ] Build and test bundle
- [ ] Update demo imports

### Phase 3: Remediation (SHORT-TERM)
- [ ] Rewrite `demos/main/index.html` to use imports
- [ ] Remove inline adapter classes
- [ ] Replace hand-rolled FSM with XState
- [ ] Wire NATS substrate

### Phase 4: Infrastructure (MEDIUM-TERM)
- [ ] Set up NATS server (Docker Compose)
- [ ] Add E2E test harness
- [ ] Implement observability
- [ ] Generate documentation

---

## 11. Success Criteria

**Definition of Done**:
1. ✅ All 4 enforcement gates passing
2. ✅ Demos import from compiled adapter bundle
3. ✅ No inline adapter classes in HTML
4. ✅ XState FSM in use (no hand-rolled if/else)
5. ✅ NATS connected and routing events
6. ✅ Pipeline TODO stubs removed
7. ✅ 0 architectural violations
8. ✅ Tests still passing (142/143 minimum)

**Metrics**:
- Wiring Rate: 11% → 100%
- Theater Violations: 13 → 0
- Architecture Compliance: FAIL → PASS
- Test Coverage: 99.3% → 99.3%+ (maintain)

---

## 12. Rollback Plan

If enforcement gates cause issues:
1. Disable specific gate with `--no-verify` flag
2. Document reason in commit message
3. Create GitHub issue for investigation
4. Re-enable gate after fix

**Emergency Bypass**:
```bash
git commit --no-verify -m "fix: critical hotfix (gate bypass approved)"
```

---

## Appendix: References

- [LIDLESS LEGION Audit](../sandbox/audits/LIDLESS_LEGION_STATUS_REPORT.md)
- [Architecture Audit Report](../ARCHITECTURE_AUDIT_REPORT.md)
- [Theater Detection Results](../sandbox/audits/THEATER_VS_REALITY.md)
- [Adapter Inventory](../sandbox/audits/ADAPTER_INVENTORY.md)

---

**Status**: ACTIVE SSOT  
**Next Update**: After Phase 1 implementation complete  
**Owner**: HFO Gen87.X3 Team

---

*"Better to be Silent than to Lie. Better to Fail than to Fake."*  
*Spider Sovereign (Port 7) | Lidless Legion*
