# HIVE Swarm MCP Server — Architecture Spec

> **Date**: 2025-12-30  
> **Phase**: HUNT (Research Complete)  
> **Problem**: VS Code agents require manual clicks for handoffs (512 clicks = impossible)  
> **Solution**: Custom MCP server that handles scatter-gather internally

---

## 🎯 The Core Insight

**ONE MCP tool call** from Spider Sovereign → **512 parallel cheap workers** internally.

You click ONCE. The MCP server does the rest.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  YOU in VS Code                                                             │
│  @spider-sovereign (Claude Opus 4.5 via Copilot subscription - EXPENSIVE)   │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ ONE tool call: hive_scatter(tasks[512])
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  hive-swarm-mcp-server (runs locally)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  G0-G11 Gate Validator                                              │    │
│  │  HIVE Phase State Machine                                           │    │
│  │  Blackboard Writer                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Promise.all([                                                              │
│    worker1(), worker2(), worker3(), ... worker512()                         │
│  ])                                                                         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ 512 parallel HTTP calls
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  OpenRouter API (or alternative backend)                                    │
│  Model: gpt-4o-mini / gpt-5-nano / gemini-flash (CHEAP)                     │
│  Cost: ~$0.45 per 512-worker swarm                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💰 Cost Analysis

### Per-Swarm Cost (512 agents)

| Component | Model | Input | Output | Cost |
|-----------|-------|-------|--------|------|
| Orchestrator | Claude Opus 4.5 | 5K tokens | 2K tokens | ~$0.23 (via Copilot = $0) |
| 512 Workers | GPT-4o-mini | 1M tokens | 0.5M tokens | ~$0.45 |
| **TOTAL** | | | | **~$0.45-0.68** |

### Cost Comparison by Worker Model

| Model | Cost per 512-swarm | Quality |
|-------|-------------------|---------|
| GPT-5-nano | ~$0.25 | Good |
| GPT-4o-mini | ~$0.45 | Better |
| Gemini Flash-Lite | ~$0.30 | Good |
| Claude Haiku 3.5 | ~$2.40 | Best |
| Ollama (local) | $0.00 | Varies |

---

## 🔧 MCP Tools

### Core Tools

```typescript
// Scatter tasks to N workers with specified model
hive_scatter({
  tasks: TaskSpec[],      // Array of 8/64/512 task descriptions
  model: string,          // "gpt-4o-mini", "gpt-5-nano", etc.
  concurrency: number,    // Max parallel requests (default: 50)
  phase: "H" | "I" | "V" | "E",  // Current HIVE phase
  timeout: number         // Per-task timeout in ms
}): Promise<ScatterResult>

// Gather results from a scatter operation
hive_gather({
  scatterId: string,      // ID returned by hive_scatter
  aggregation: "concat" | "vote" | "best" | "custom"
}): Promise<GatherResult>

// Validate a signal against G0-G11 gates
hive_validateSignal({
  signal: Signal          // The 8-field stigmergy signal
}): ValidationResult

// Check/set current HIVE phase
hive_checkPhase(): PhaseState
hive_setPhase(phase: "H" | "I" | "V" | "E"): void

// Flip to next phase (E → H for new cycle)
hive_flip(): PhaseState
```

### Signal Schema (enforced by MCP server)

```typescript
interface Signal {
  ts: string;      // G0: ISO8601 timestamp
  mark: number;    // G1: 0.0-1.0 confidence
  pull: string;    // G2: upstream|downstream|lateral
  msg: string;     // G3: non-empty message
  type: string;    // G4: signal|event|error|metric
  hive: string;    // G5: H|I|V|E|X
  gen: number;     // G6: generation >= 87
  port: number;    // G7: 0-7
}
```

---

## 🔌 Backend Options

### Option A: OpenRouter (RECOMMENDED)

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_WORKER_MODEL=openai/gpt-4o-mini
```

**Pros**: Single API for 100+ models, unified billing, easy model switching  
**Cons**: Pay-per-token (~$0.45/swarm)  
**Setup**: Create account at openrouter.ai, get API key

### Option B: copilot-api (FREE but risky)

```env
# Uses your existing Copilot subscription
COPILOT_API_PORT=4141
```

**Pros**: Uses existing Copilot Pro+ subscription ("free")  
**Cons**: Reverse-engineered, may break, ToS gray area  
**Setup**: Clone github.com/ericc-ch/copilot-api, run locally

### Option C: Direct APIs (RELIABLE)

```env
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**Pros**: First-party APIs, most stable  
**Cons**: Multiple keys, separate billing  
**Setup**: Get keys from each provider

### Option D: Ollama (FREE, LOCAL)

```env
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_WORKER_MODEL=llama3.2:latest
```

**Pros**: Completely free, private, works offline  
**Cons**: Needs beefy hardware (16-32GB RAM), lower quality  
**Setup**: Install Ollama, pull models

---

## 📁 MCP Server Structure

```
hive-swarm-mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # MCP server entry
│   ├── tools/
│   │   ├── scatter.ts        # hive_scatter implementation
│   │   ├── gather.ts         # hive_gather implementation
│   │   ├── validate.ts       # hive_validateSignal
│   │   └── phase.ts          # hive_checkPhase, hive_flip
│   ├── backends/
│   │   ├── openrouter.ts     # OpenRouter API client
│   │   ├── copilot-api.ts    # copilot-api client
│   │   ├── openai.ts         # Direct OpenAI client
│   │   └── ollama.ts         # Ollama client
│   ├── gates/
│   │   └── validator.ts      # G0-G11 gate enforcement
│   └── state/
│       ├── phase.ts          # HIVE phase state machine
│       └── blackboard.ts     # Signal persistence
├── .env                      # API keys
└── mcp.json                  # VS Code MCP config
```

---

## ⚙️ VS Code Integration

### .vscode/mcp.json

```json
{
  "servers": {
    "hive-swarm": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/hive-swarm-mcp-server/dist/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "${env:OPENROUTER_API_KEY}"
      }
    }
  }
}
```

### Spider Sovereign Usage

```markdown
@spider-sovereign

I need to search the codebase for all authentication patterns.
Use hive_scatter to dispatch 8 search tasks to cheap workers,
then hive_gather to synthesize the results.
```

Spider Sovereign calls:
```
#tool:hive_scatter tasks=[...8 search tasks...] model="gpt-4o-mini"
```

ONE click. 8 parallel searches. Results synthesized.

---

## 🔄 Powers of 8 Scaling

| Scale | Agents | Est. Cost | Latency |
|-------|--------|-----------|---------|
| 8^1 | 8 | ~$0.01 | ~2s |
| 8^2 | 64 | ~$0.06 | ~5s |
| 8^3 | 512 | ~$0.45 | ~15s |
| 8^4 | 4096 | ~$3.60 | ~60s |

Note: Concurrency limits vary by provider. OpenRouter allows ~50-100 parallel.
For 512+ workers, use batching with `concurrency` parameter.

---

## 🚀 Implementation Priority

1. **Phase 1**: Basic MCP server with OpenRouter backend
2. **Phase 2**: G0-G11 gate enforcement
3. **Phase 3**: HIVE phase state machine
4. **Phase 4**: Blackboard persistence
5. **Phase 5**: Alternative backends (Ollama, copilot-api)

---

## 📚 Sources

| Topic | Source |
|-------|--------|
| MCP Server SDK | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| OpenRouter API | [openrouter.ai/docs](https://openrouter.ai/docs) |
| copilot-api | [github.com/ericc-ch/copilot-api](https://github.com/ericc-ch/copilot-api) |
| Model Pricing | [helicone.ai/llm-cost](https://www.helicone.ai/llm-cost) |
| Ollama | [ollama.ai](https://ollama.ai) |

---

*HUNT Phase Complete | Ready for INTERLOCK (contracts + failing tests) | Gen87.X3*
