# Lidless Legion MCP Server

> **Port 0** | **SENSE verb** | **HIVE/8 Phase: H (Hunt)**
>
> *"Given One Swarm to Rule the Eight..."*

## Overview

Lidless Legion is a unified sensor mesh MCP server that aggregates multiple search sources into a single tool. It's part of the HFO 8-port OBSIDIAN architecture.

## Features

- **Web Sensor**: Tavily API integration for web search
- **Memory Sensor**: DuckDB FTS on 6,423 HFO artifacts
- **Code Sensor**: Workspace file search with relevance scoring
- **Graph Sensor**: MCP Memory knowledge graph (placeholder)

## Installation

```bash
cd sandbox/src/mcp/lidless-legion
npm install
npm run build
```

## Usage

### As MCP Server

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "lidless-legion": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/sandbox/src/mcp/lidless-legion/dist/index.js"],
      "env": {
        "TAVILY_API_KEY": "${env:TAVILY_API_KEY}",
        "BLACKBOARD_PATH": "${workspaceFolder}/sandbox/obsidianblackboard.jsonl",
        "MEMORY_DB_PATH": "${workspaceFolder}/../portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/hfo_memory.duckdb",
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "CURRENT_GEN": "87"
      }
    }
  }
}
```

### Development Mode

```bash
npm run dev
```

## Tool: `lidless_sense`

### Input

```typescript
{
  query: string;                    // Search query (required)
  sources?: string[];               // ['web', 'memory', 'code', 'graph', 'all']
  limit?: number;                   // Results per source (1-50, default: 5)
  options?: {
    webDepth?: 'basic' | 'advanced';  // Tavily search depth
    memoryGen?: number;               // Filter by generation
    codePattern?: string;             // Glob pattern
  }
}
```

### Output

```typescript
{
  query: string;
  timestamp: string;
  sources_queried: string[];
  results: SenseResult[];
  exemplars: SenseResult[];         // Top deduplicated results
  total_results: number;
  signal: {
    port: 0;
    hive: 'H';
    msg: string;
  }
}
```

## Stigmergy Integration

Every `lidless_sense` call automatically emits a signal to the blackboard:

```json
{
  "ts": "2025-12-30T12:00:00Z",
  "mark": 0.8,
  "pull": "downstream",
  "msg": "SENSE: \"gesture recognition\" → 15 results from [web, memory]",
  "type": "signal",
  "hive": "H",
  "gen": 87,
  "port": 0
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LIDLESS LEGION                        │
│                    Port 0: SENSE                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │   Web   │  │ Memory  │  │  Code   │  │  Graph  │    │
│  │ Sensor  │  │ Sensor  │  │ Sensor  │  │ Sensor  │    │
│  │ (Tavily)│  │(DuckDB) │  │ (Files) │  │  (MCP)  │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       │            │            │            │          │
│       └────────────┼────────────┼────────────┘          │
│                    │                                     │
│              lidless_sense()                             │
│                    │                                     │
│                    ▼                                     │
│           ┌───────────────┐                             │
│           │  Blackboard   │  (auto stigmergy)           │
│           └───────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

## Extensibility

To add a new sensor:

1. Create `sensors/my-sensor.ts` implementing `SensorAdapter`
2. Register in `index.ts`: `registerSensor(new MySensor())`
3. Add to `SensorSourceSchema` in `contracts.ts`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TAVILY_API_KEY` | Tavily API key for web search | (required for web) |
| `MEMORY_DB_PATH` | Path to DuckDB memory bank | `../../../portable_hfo_memory.../hfo_memory.duckdb` |
| `BLACKBOARD_PATH` | Path to stigmergy blackboard | `./obsidianblackboard.jsonl` |
| `WORKSPACE_ROOT` | Root directory for code search | `.` |
| `CURRENT_GEN` | Current generation number | `87` |

---

*Part of HFO Gen87.X3 | The spider weaves the web that weaves the spider.*
