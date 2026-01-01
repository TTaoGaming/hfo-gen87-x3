# Tooling Recommendations for W3C Gesture Control Plane

> **Generation**: 87.X3  
> **Phase**: HUNT (Final - Tooling)  
> **Date**: 2025-12-29  
> **Grounding**: Tavily + VS Code Marketplace + Sequential Thinking

---

## 🎯 Summary

This document captures tooling recommendations for the W3C Gesture Control Plane development workflow. All recommendations are grounded via Tavily search and VS Code Marketplace queries.

---

## ✅ VS Code Extensions - Already Installed

| Extension ID | Name | Purpose | Status |
|--------------|------|---------|--------|
| `vitest.explorer` | Vitest | Test runner with UI mode | ✅ Installed |
| `ms-playwright.playwright` | Playwright Test | E2E browser testing | ✅ Installed |
| `biomejs.biome` | Biome | Fast linter/formatter (Rust-based) | ✅ Installed |
| `dbaeumer.vscode-eslint` | ESLint | JavaScript linting | ✅ Installed |

---

## 🆕 VS Code Extensions - Recommended to Install

### 1. XState Visual Editor
```vscode-extensions
stately.xstate-vscode
```

**Why**: Visual state machine editing, "Open Visual Editor" command, `xsm` snippet for quick machine creation, TypeScript typegen integration.

**Caveat**: Does not fully support XState v5 yet - use Stately.ai online visualizer for complex machines.

### 2. Playwright Trace Viewer
```vscode-extensions
ryanrosello-og.playwright-vscode-trace-viewer
```

**Why**: View Playwright trace files directly in VS Code without launching external browser.

---

## 🔌 MCP Servers - Currently Configured

The workspace already has these MCP servers configured in `.vscode/settings.json`:

| Server | Purpose | Status |
|--------|---------|--------|
| GitHub MCP | Repository management, PRs, issues | ✅ Active |
| Memory MCP | Knowledge graph persistence | ✅ Active |
| Playwright MCP | Browser automation for AI | ✅ Active |
| Context7 MCP | Library documentation lookup | ✅ Active |
| Sequential Thinking | Chain-of-thought reasoning | ✅ Active |
| Filesystem MCP | Direct file access | ✅ Active |

### Recommended Upgrade

Consider upgrading to **@executeautomation/playwright-mcp-server** for enhanced capabilities:
- 143 real device presets (iPhone, iPad, Pixel, Galaxy, Desktop)
- Device emulation (viewport, user-agent, touch events, DPR)
- Test code generation

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

---

## 🔧 Library-Specific Debugging Methods

No dedicated MCP servers or VS Code extensions exist for these libraries. Use built-in methods:

### MediaPipe
| Method | Description |
|--------|-------------|
| Canvas Overlay | Draw landmarks on canvas with `draw_landmarks_on_image()` |
| Console Logging | Log `hand_landmarks_list` array for raw data |
| Colab Notebooks | Google provides Jupyter notebooks for prototyping |
| Rerun SDK | Python-based visualization (if using Python backend) |

```typescript
// Debug overlay pattern
const debugCanvas = document.createElement('canvas');
handLandmarks.forEach((landmark, i) => {
  ctx.fillText(`${i}`, landmark.x * width, landmark.y * height);
});
```

### Rapier Physics
| Method | Description |
|--------|-------------|
| `world.debugRender()` | Built-in collider visualization |
| Canvas/WebGL | Render physics bodies to canvas |
| Performance.now() | Timestamp logging for frame timing |

```typescript
// Debug render pattern
const buffers = world.debugRender();
// buffers.vertices: Float32Array
// buffers.colors: Float32Array
```

### Zod
| Method | Description |
|--------|-------------|
| Native IntelliSense | TypeScript provides full autocomplete via `z.infer` |
| `.safeParse()` vs `.parse()` | Use parse() for hard failures, safeParse() for logging |
| Console Logging | Log validation errors with error.format() |

```typescript
// Debug pattern
const result = schema.safeParse(data);
if (!result.success) {
  console.error(result.error.format());
}
```

### 1€ Filter
| Method | Description |
|--------|-------------|
| Console Logging | Log raw vs filtered values |
| Performance.now() | Track timestamp deltas for dt calculation |
| Graph Visualization | Plot raw/filtered timeseries in browser devtools |

---

## 🖥️ Dev Process Commands

### Vitest UI Mode
```bash
npx vitest --ui
```
Opens interactive browser UI for test exploration and debugging.

### Playwright Trace
```bash
npx playwright test --trace on
```
Generates trace files viewable in VS Code with the trace viewer extension.

### XState Visualizer
- In-editor: Run "XState: Open Visual Editor" command (Ctrl+Shift+P)
- Online: https://stately.ai/viz (paste machine definition)

### Biome Check
```bash
npx biome check . --write
```
Auto-fixes lint/format issues across entire codebase.

---

## 📦 npm Dependencies Summary

### Core Pipeline
```json
{
  "@mediapipe/tasks-vision": "^0.10.x",
  "@dimforge/rapier2d": "^0.14.x",
  "xstate": "^5.x",
  "zod": "^3.25.x"
}
```

### Dev Tools
```json
{
  "vitest": "^2.x",
  "@playwright/test": "^1.49.x",
  "@biomejs/biome": "^1.9.x",
  "typescript": "^5.9.x"
}
```

---

## 🚫 Not Recommended / Not Found

| Tool | Reason |
|------|--------|
| XState MCP | Does not exist in ecosystem |
| MediaPipe MCP | Does not exist |
| Rapier MCP | Does not exist |
| Zod VS Code Extension | Not needed (native TS IntelliSense sufficient) |
| Puppeteer MCP | Archived - use Playwright instead |

---

## 📋 Quick Setup Checklist

```bash
# Install recommended VS Code extensions
code --install-extension stately.xstate-vscode
code --install-extension ryanrosello-og.playwright-vscode-trace-viewer

# Verify existing extensions
code --list-extensions | grep -E "vitest|playwright|biome|eslint"
```

---

## Sources

1. **Tavily Search**: "XState MCP server model context protocol Stately.ai VS Code extension" (2025-12-29)
2. **Tavily Search**: "MCP server list npm packages 2024 2025 model context protocol tools" (2025-12-29)
3. **Tavily Search**: "MediaPipe devtools debugger visualization" (2025-12-29)
4. **Tavily Search**: "Rapier physics engine debugging visualization" (2025-12-29)
5. **VS Code Marketplace**: Testing category search (vitest, playwright, biome, zod)
6. **VS Code Marketplace**: Linters category search (biome, oxlint, eslint)
7. **GitHub**: microsoft/playwright-mcp, executeautomation/mcp-playwright

---

*Hunt Phase Complete - Ready for INTERLOCK (TDD RED)*
