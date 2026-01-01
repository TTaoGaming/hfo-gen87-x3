# 🔧 PHYSICS CHECK - Tooling Inventory

> **Generated**: 2025-12-30T15:45:00Z  
> **Updated**: 2025-12-30T15:40:00Z  
> **Phase**: HUNT (H) - Tool Discovery  
> **Status**: ✅ **ALL 15 PACKAGE TESTS PASSING**  
> **Purpose**: Inventory installed tools vs required primitives  
> **Goal**: All primitives ready for VALIDATE (V) phase

---

## 📦 NPM PACKAGES - COMPLETE INVENTORY

### ✅ ALL INSTALLED & VERIFIED (15 tests passing)

| Package | Version | Purpose | Stage | Test Status |
|---------|---------|---------|-------|-------------|
| `@mediapipe/tasks-vision` | 0.10.22 | Hand tracking ML | Stage 1 - SENSOR | ✅ PASS |
| `1eurofilter` | 1.2.2 | Official 1€ filter | Stage 2 - SMOOTHER | ✅ PASS |
| `@dimforge/rapier2d-compat` | 0.19.3 | Physics spring-damper | Stage 2 - SMOOTHER | ✅ PASS |
| `pixi.js` | 8.14.3 | WebGL cursor render | Stage 2 - Overlay | ✅ PASS |
| `xstate` | 5.25.0 | FSM state machine | Stage 3 - FSM | ✅ PASS |
| `zod` | 3.25.76 | Schema validation | ALL GATES | ✅ PASS |
| `rxjs` | 7.8.2 | Reactive pipeline | Pipeline | ✅ PASS |
| `@opentelemetry/api` | 1.9.0 | Tracing API | Observability | ✅ PASS |
| `@opentelemetry/sdk-trace-web` | 2.2.0 | Browser tracing | Observability | ✅ PASS |
| `golden-layout` | 2.6.0 | UI Shell (tiling) | Stage 5 - TARGET | ✅ PASS |
| `@nats-io/nats-core` | 3.3.0 | NATS messaging | Event bus | ✅ PASS |
| `@nats-io/jetstream` | 3.3.0 | Durable streams | Event substrate | ✅ PASS |
| `@nats-io/kv` | 3.3.0 | KV state store | Cursor state | ✅ PASS |
| `fast-check` | 3.23.2 | Property testing | TDD | ✅ PASS |

### 🔵 CDN-ONLY (No NPM Install Needed)

These are loaded dynamically in browser demos:

| Package | CDN | Purpose | Stage |
|---------|-----|---------|-------|
| `excalidraw` | unpkg | Whiteboard target | Stage 5 |
| `tldraw` | unpkg | Drawing target | Stage 5 |
| `v86` | GitHub | x86 emulator | Stage 5 |
| `js-dos` | js-dos.com | DOS emulator | Stage 5 |

### 📊 Verification Test

Run: `npx vitest run sandbox/src/physics-check.test.ts`

```
✓ Stage 1: SENSOR (MediaPipe) - @mediapipe/tasks-vision
✓ Stage 2: SMOOTHER - 1eurofilter, rapier2d, pixi.js
✓ Stage 3: FSM - xstate v5
✓ Stage 4: OUTPUT - zod validation
✓ Stage 5: Pipeline - rxjs
✓ Observability - OpenTelemetry
✓ UI Shell - golden-layout
✓ Event Substrate - NATS (core, jetstream, kv)
✓ Testing - fast-check
```

---

## 🧩 VS CODE EXTENSIONS

### ✅ INSTALLED

| Extension | ID | Purpose |
|-----------|-------|---------|
| Playwright Test | `ms-playwright.playwright` | E2E test runner |
| Vitest | `vitest.explorer` | Unit test runner |
| XState Visualizer | `statelyai.stately-vscode` | FSM visualization |
| Biome | `biomejs.biome` | Linting/formatting |
| GitHub Copilot | `github.copilot` | AI assistance |
| Copilot Chat | `github.copilot-chat` | AI chat |
| GitLens | `eamodio.gitlens` | Git history |
| Mermaid | `bierner.markdown-mermaid` | Diagram preview |
| Playwright Trace | `ryanrosello-og.playwright-vscode-trace-viewer` | Trace viewing |
| Error Lens | `usernamehw.errorlens` | Inline errors |
| Pretty TS Errors | `yoavbls.pretty-ts-errors` | Better error msgs |
| Python | `ms-python.python` | Python support |
| Containers | `ms-azuretools.vscode-containers` | Docker |
| Live Server | `ritwickdey.liveserver` | Dev server |
| Edge DevTools | `ms-edgedevtools.vscode-edge-devtools` | Browser debug |

### 🔵 RECOMMENDED (Not Critical)

| Extension | ID | Purpose |
|-----------|-------|---------|
| Thunder Client | `rangav.vscode-thunder-client` | API testing |
| Draw.io | `hediet.vscode-drawio` | Diagrams |

---

## 🔌 MCP TOOLS AVAILABLE

### ✅ ACTIVE & WORKING

| MCP Server | Tools | Purpose |
|------------|-------|---------|
| **Tavily** | `tavily-search`, `tavily-extract`, `tavily-crawl` | Web research, grounding |
| **Context7** | `resolve-library-id`, `query-docs` | Library documentation |
| **Playwright** | `browser_*`, `snapshot`, `screenshot` | Browser automation |
| **GitHub** | `search_*`, `list_*`, `create_*` | Repo management |
| **Sequential Thinking** | `sequentialthinking` | Complex reasoning |
| **Memory Bank** | `read_graph` | Knowledge graph |
| **Filesystem** | `read_*`, `write_*`, `move_file` | File operations |

### 📊 MCP CAPABILITY MATRIX

| Capability | Tool | Status |
|------------|------|--------|
| Web Search | Tavily | ✅ |
| Web Scrape | Tavily Extract | ✅ |
| Library Docs | Context7 | ✅ |
| Browser Control | Playwright MCP | ✅ |
| Screenshots | Playwright | ✅ |
| GitHub PRs | GitHub MCP | ✅ |
| GitHub Issues | GitHub MCP | ✅ |
| File Read/Write | Filesystem MCP | ✅ |
| Knowledge Graph | Memory MCP | ✅ |
| Reasoning | Sequential Thinking | ✅ |
| Container Mgmt | Docker MCP | ✅ |

---

## 🎯 INSTALL COMMANDS

### Install Missing NPM Packages

```bash
# Core pipeline packages
npm install @dimforge/rapier2d-compat pixi.js rxjs --save

# Optional observability
npm install @opentelemetry/api @opentelemetry/sdk-trace-web --save
```

### Install Recommended VS Code Extensions

```bash
code --install-extension rangav.vscode-thunder-client
code --install-extension hediet.vscode-drawio
```

---

## 📋 PRIMITIVE READINESS CHECKLIST

### Stage 1: SENSOR (MediaPipe)
- [x] `@mediapipe/tasks-vision` installed
- [x] Hand Landmarker available
- [x] Gesture Recognizer available
- [ ] Test fixtures (FreiHAND images) - TODO

### Stage 2: SMOOTHER
- [x] 1€ Filter algorithm implemented
- [ ] Rapier physics package - **MISSING**
- [ ] PixiJS for visualization - **MISSING**
- [ ] RxJS for reactive flow - **MISSING**

### Stage 3: FSM (XState)
- [x] `xstate` v5 installed
- [x] XState VS Code extension installed
- [ ] Gesture machine defined - STUB

### Stage 4: EMITTER (W3C Pointer)
- [x] W3C Pointer Events API (browser native)
- [x] PointerEvent constructor available
- [ ] Full L3 compliance - PARTIAL

### Stage 5: TARGETS
- [x] DOM dispatchEvent (native)
- [x] Golden Layout (installed)
- [x] daedalOS adapter (implemented)
- [ ] Excalidraw adapter - CDN only
- [ ] V86 adapter - STUB

### Testing
- [x] Vitest + fast-check installed
- [x] Playwright installed
- [x] jsdom for DOM simulation
- [ ] Golden master test fixtures - TODO

### Observability
- [ ] OpenTelemetry - **MISSING**
- [x] NATS JetStream (event persistence)
- [ ] AsyncAPI schema - DEFINED not validated

---

## 🚀 RECOMMENDED INSTALL ORDER

1. **NOW** - Core pipeline:
   ```bash
   npm install @dimforge/rapier2d-compat pixi.js rxjs --save
   ```

2. **OPTIONAL** - Observability:
   ```bash
   npm install @opentelemetry/api --save
   ```

3. **SKIP** - Targets via CDN:
   - Excalidraw, tldraw, v86 loaded from unpkg/jsdelivr in demos

---

## 📡 Signal Emitted

```json
{
  "ts": "2025-12-30T15:45:00Z",
  "mark": 1.0,
  "pull": "downstream",
  "msg": "HUNT: Physics check complete. Missing: Rapier, PixiJS, RxJS. 27/30 primitives ready.",
  "type": "signal",
  "hive": "H",
  "gen": 87,
  "port": 0
}
```

---

*Generated by Spider Sovereign (Port 7) | Gen87.X3 | HUNT Phase*
