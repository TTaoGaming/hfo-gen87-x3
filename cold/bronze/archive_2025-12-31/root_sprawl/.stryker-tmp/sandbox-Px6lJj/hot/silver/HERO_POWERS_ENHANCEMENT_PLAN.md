# 🦸 Hero Powers Enhancement Plan - Gen87.X3

> Generated: 2025-12-31
> Updated: 2025-12-31 (Stack-Specific Research)
> Based on: Sequential thinking + Tavily research on Claude Skills, MCP servers, VS Code agents

## 📊 Your Tech Stack Analysis

| Tech | Status | MCP/Enhancement Available |
|------|--------|---------------------------|
| **Temporal** | ✅ Running | ⭐ EXCELLENT - Temporal MCP is the #1 recommended pattern! |
| **TypeScript** | ✅ Primary | ESLint MCP, Biome (25x faster than ESLint) |
| **LangGraph** | ✅ Working | Native MCP integration, LangSmith debugging |
| **NATS** | 🔜 Planned? | mcp-nats server available! |
| **DuckDB** | ✅ Memory Bank | DuckDB MCP for direct queries |
| **Vitest** | ✅ Testing | No MCP needed (terminal works) |
| **Playwright** | ✅ E2E | Already have MCP! |

---

## 🏆 #1 PRIORITY: Temporal + MCP Integration

**This is THE killer pattern for your stack!** Research shows:

> "Every `@mcp.tool()` in the system is backed by a deterministic Temporal Workflow, which gives us automatic retries and full replay for audit/compliance out of the box. The AI agents' tools became durable operations." - Temporal Blog

### How It Works:
```
MCP Tool Call → Temporal StartWorkflow → Durable Execution → Result
```

### What You Get:
- **Durability**: Tools survive crashes, pick up where they left off
- **Retry Logic**: Activities auto-retry on failure
- **Audit Trail**: Full workflow history for debugging
- **Long-Running Tools**: MCP tools that run for hours/days

### Implementation Pattern:
```typescript
// Each MCP tool is a Temporal Workflow!
@mcp.tool()
async function hivePhaseTransition(phase: HivePhase): Promise<HiveResult> {
  // This is actually calling a Temporal Workflow
  return await temporalClient.execute(HiveWorkflow, {
    taskQueue: 'hive-tasks',
    args: [phase],
    workflowId: `hive-${Date.now()}`
  });
}
```

---

## 🔧 Stack-Specific MCP Servers

### 1. TEMPORAL MCP (Your Stack - TOP PRIORITY!)

Already have Temporal running! Add MCP layer:

```typescript
// src/mcp/temporal-mcp-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Client } from "@temporalio/client";

const server = new Server({ name: "temporal-hive", version: "1.0.0" });

server.tool("start_hive_workflow", async ({ phase, input }) => {
  const handle = await temporal.workflow.start(HiveWorkflow, {
    taskQueue: "hive-queue",
    workflowId: `hive-${phase}-${Date.now()}`,
    args: [input]
  });
  return { workflowId: handle.workflowId, runId: handle.firstExecutionRunId };
});

server.tool("query_workflow_status", async ({ workflowId }) => {
  const handle = temporal.workflow.getHandle(workflowId);
  return await handle.query("status");
});
```

### 2. NATS MCP (If using NATS messaging)
```json
"nats": {
  "command": "npx",
  "args": ["-y", "mcp-nats"],
  "env": {
    "NATS_URL": "nats://localhost:4222"
  }
}
```
**Tools**: publish, subscribe, request-reply, JetStream, Key-Value stores

### 3. ESLint MCP (Official - TypeScript linting)
```json
"eslint": {
  "command": "npx",
  "args": ["@eslint/mcp@latest"]
}
```
**Use for**: AI-aware linting, auto-fix suggestions

### 4. Docker MCP (Temporal workers, containers)
```json
"docker": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-docker"]
}
```
**Use for**: Managing Temporal workers, start/stop containers

### 5. DuckDB MCP (Direct Memory Bank Access!)
```json
"duckdb": {
  "command": "npx",
  "args": ["-y", "duckdb-mcp"],
  "env": {
    "DUCKDB_PATH": "${workspaceFolder}/../portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/hfo_memory.duckdb"
  }
}
```
**Use for**: Direct FTS queries on Memory Bank without Python

### Priority 4: Puppeteer MCP (Lighter than Playwright)
```json
"puppeteer": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
}
```

---

## 2. ENHANCE CUSTOM AGENTS (Your Commanders)

Your `.github/agents/` files are good, but could be enhanced:

### Add MCP Server References
Each agent can have specific MCP servers:

```yaml
---
description: "🐙 Port 6 — Memory persistence"
mcp-servers:
  duckdb:
    command: "npx"
    args: ["-y", "duckdb-mcp"]
tools: ['memory/*', 'duckdb/*']
---
```

### Add Phase-Specific Tools
- `lidless-legion.agent.md` → `tools: ['tavily/*', 'context7/*', 'web']` (HUNT)
- `web-weaver.agent.md` → `tools: ['vscode', 'execute']` (INTERLOCK/tests)
- `mirror-magus.agent.md` → `tools: ['edit', 'vscode']` (VALIDATE/impl)
- `kraken-keeper.agent.md` → `tools: ['memory/*', 'duckdb/*']` (STORE)

---

## 3. BUILD CUSTOM MCP SERVERS (Medium Effort)

You already have `lidless-legion` MCP! Extend the pattern:

### HIVE/8 MCP Server
Exposes tools:
- `hive.getCurrentPhase()` - Read last blackboard signal
- `hive.emitSignal(phase, msg)` - Validated signal emission
- `hive.validateTransition(from, to)` - Check H→I→V→E sequence

### Memory Bank MCP Server
Exposes tools:
- `memory.ftsSearch(query)` - BM25 search
- `memory.getArtifact(filename)` - Get specific file
- `memory.listGeneration(gen)` - Browse by generation

### Blackboard MCP Server
Exposes tools:
- `blackboard.tail(n)` - Last N signals
- `blackboard.emit(signal)` - With G0-G11 validation
- `blackboard.getPhaseHistory()` - HIVE sequence

---

## 🆕 KIRO (Amazon's Agentic IDE) - Competition Analysis

**Kiro** is Amazon's new spec-driven AI IDE (July 2025). Key features:

| Feature | Kiro | Your Setup |
|---------|------|------------|
| Spec-driven dev | ✅ Built-in | ✅ You have `.kiro/specs/` |
| MCP support | ✅ Native | ✅ Native |
| Agent hooks | ✅ Native | 🔧 Could add |
| Steering rules | ✅ Native | ✅ AGENTS.md, modes |
| Multi-agent | ✅ Native | ✅ 8 Commanders |

**Verdict**: You already have Kiro-like capabilities via VS Code + MCP + Commander agents!

**What Kiro adds you could adopt**:
1. **Agent Hooks** - Triggers that fire on events (file save, test fail)
2. **Spec → Code tracing** - Link specs to implementations
3. **AWS CDK integration** - If using AWS

---

## 🧠 LangGraph + MCP Pattern (Your Stack!)

You already have LangGraph working. Enhance with MCP:

```typescript
// Each LangGraph node can use MCP tools
import { MCPClient } from "@modelcontextprotocol/sdk/client";

const memoryMCP = new MCPClient("mcp://memory-bank");
const temporalMCP = new MCPClient("mcp://temporal-hive");

// Node that uses MCP
async function huntNode(state: HiveState) {
  const results = await memoryMCP.call("fts_search", { query: state.query });
  return { ...state, exemplars: results };
}

// Node that starts durable workflow
async function validateNode(state: HiveState) {
  const workflow = await temporalMCP.call("start_workflow", {
    type: "ValidatePhase",
    input: state.implementation
  });
  return { ...state, workflowId: workflow.id };
}
```

---

## 4. CLAUDE SKILLS (If Using Claude.ai/Claude Code)

Create `~/.config/claude-code/skills/hfo-hive/`:

```
hfo-hive/
├── SKILL.md
├── scripts/
│   └── validate-hive.js
└── resources/
    └── phase-diagram.md
```

**SKILL.md:**
```yaml
---
name: hfo-hive
description: "Enforces HIVE/8 workflow phases (H→I→V→E)"
license: MIT
---

# HIVE/8 Workflow Skill

This skill enforces the Obsidian Hourglass workflow...
```

---

## 5. PROMPT FILES & INSTRUCTIONS

### Global Instructions
`.github/copilot-instructions.md` - Already exists? If not, create:
```markdown
# HFO Gen87 Copilot Instructions

## ALWAYS
- Check HIVE phase before starting work
- Emit signals to blackboard
- Use sequential thinking for complex decisions

## NEVER  
- Skip H phase (always research first)
- Write code without failing tests first
- Claim things work without terminal proof
```

---

## 6. DOCKER MCP TOOLKIT (One-Click Installs!)

Docker Desktop now has MCP Catalog:
1. Open Docker Desktop → Settings → Beta features
2. Enable "Docker MCP Toolkit"
3. Browse catalog for servers
4. One-click install!

Available servers:
- GitHub, Slack, Notion
- Postgres, Redis
- Puppeteer, Playwright
- And many more...

---

## 🎯 Recommended Action Plan (Prioritized for YOUR Stack)

### Immediate (5 min) - HIGH IMPACT
1. **Add ESLint MCP** - TypeScript-aware linting in AI
2. **Add Docker MCP** - Manage Temporal workers

### Short-term (1 hour) - GAME CHANGER
1. **Build Temporal MCP Server** - Make ALL tools durable!
   - Each tool becomes a Temporal Workflow
   - Automatic retry, audit, long-running support
2. **Add NATS MCP** - If using NATS messaging

### Medium-term (1 day) - FULL POWER
1. **Add DuckDB MCP** - Direct Memory Bank queries
2. **Build Blackboard MCP** - Signal emit/read with validation
3. **Integrate LangGraph + MCP** - Multi-agent coordination

---

## 🔥 Quick Wins for Your Stack

### Add ESLint MCP (TypeScript awareness)
```json
"eslint": {
  "command": "npx",
  "args": ["@eslint/mcp@latest"]
}
```
Then ask: "Check this file for linting issues"

### Add Docker MCP (Temporal worker management)
```json
"docker": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-docker"]
}
```
Then ask: "List running Docker containers" or "Start the Temporal worker"

### Add NATS MCP (If using NATS)
```json
"nats": {
  "command": "npx", 
  "args": ["-y", "mcp-nats"],
  "env": {
    "NATS_URL": "nats://localhost:4222"
  }
}
```
Then ask: "Publish a HIVE signal to the queue"

---

## 🏗️ The Ultimate Pattern: Temporal + MCP + LangGraph

This is the architecture research recommends for production AI agents:

```
┌─────────────────────────────────────────────────────────────────┐
│                        LangGraph                                 │
│  ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐                       │
│  │ H   │───▶│ I   │───▶│ V   │───▶│ E   │ (HIVE nodes)          │
│  └──┬──┘    └──┬──┘    └──┬──┘    └──┬──┘                       │
│     │          │          │          │                           │
│     ▼          ▼          ▼          ▼                           │
│  ┌─────────────────────────────────────┐                         │
│  │           MCP Layer                  │                         │
│  │  memory | blackboard | temporal      │                         │
│  └─────────────────────────────────────┘                         │
│                    │                                              │
│                    ▼                                              │
│  ┌─────────────────────────────────────┐                         │
│  │       Temporal Workflows             │ (Durable Execution)     │
│  │  ┌─────┐  ┌─────┐  ┌─────┐          │                         │
│  │  │WF1  │  │WF2  │  │WF3  │          │                         │
│  │  └─────┘  └─────┘  └─────┘          │                         │
│  └─────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits**:
- LangGraph handles reasoning and orchestration
- MCP provides standardized tool access
- Temporal makes everything durable and retriable
- Your HIVE/8 phases map perfectly to LangGraph nodes!

---

*The spider weaves the web that weaves the spider.*
*Each MCP server = a new strand in the web.*
*Temporal = the loom that makes the web durable.*
