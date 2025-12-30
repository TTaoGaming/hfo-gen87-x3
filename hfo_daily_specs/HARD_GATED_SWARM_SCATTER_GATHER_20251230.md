# Hard-Gated Swarm Scatter-Gather Specification

> **Version**: 0.1.0  
> **Date**: 2025-12-30  
> **Generation**: 87.X3  
> **Status**: HUNT (H) - Iteration 0  
> **Author**: Spider Sovereign (Port 7)  
> **PDCA Cycle**: PLAN | **HIVE/8**: H (Hunt) | **TDD**: Research  
> **Objective**: Custom MCP servers for hard-gated HIVE/8 workflow enforcement

---

## 0. Executive Summary

### The Problem

VS Code agents are **prompts, not enforcers**. They can ignore all instructions. For HIVE/8 to work properly, we need:

1. **Hard gates** (G0-G11) that REJECT invalid signals
2. **Phase enforcement** (H→I→V→E sequence)
3. **Scatter-gather** orchestration for parallel agent work
4. **Stigmergy coordination** via validated blackboard

### The Solution

Build custom MCP servers that wrap the existing Gen85 enforcement infrastructure:
- `gate-validator.ts` → Signal validation
- `tdd-validator.ts` → Phase sequence enforcement
- `blackboard.ts` → Validated emission

---

## 1. HUNT Phase: Research Findings

### 1.1 Physics Tests Completed (2025-12-30)

| Test | Result | Implication |
|------|--------|-------------|
| Main agent file write | ✅ PASS | Agents CAN write to sandbox |
| Subagent file write | ✅ PASS | Delegated agents have full capability |
| MCP tool invocation | ✅ PASS | Tavily, Context7, etc. work |
| Handoff `send: true` | ⚠️ BUGGY | Exists but unreliable (Reddit reports) |
| `#runSubagent` custom agents | ✅ PASS | Use this for programmatic delegation |
| Hard gate enforcement | ❌ FAIL | Agents can emit any signal |
| Concurrent swarm | ❌ FAIL | Subagents run sequentially |

### 1.2 VS Code Agent Handoffs — Tavily Ground Truth (2025-12-30)

**Critical Discovery**: `send: true` EXISTS and SHOULD auto-submit handoffs.

**Source**: [VS Code Custom Agents Docs](https://code.visualstudio.com/docs/copilot/customization/custom-agents)

> "When users see the handoff button and select it, they switch to the target agent with the prompt pre-filled. **If `send: true`, the prompt automatically submits to start the next workflow step.**"

| Handoff Property | Purpose | Default |
|------------------|---------|---------|
| `label` | Button text shown after response | Required |
| `agent` | Target agent identifier | Required |
| `prompt` | Pre-filled prompt text | Optional |
| **`send`** | **Auto-submit on handoff** | `false` |

**Known Bug**: Reddit users report `send: true` doesn't work reliably ([r/GithubCopilot](https://www.reddit.com/r/GithubCopilot/comments/1pcpab8/custom_agent_chaining_frontmatter_handoffsend/)). The button still appears and requires click.

**Workaround**: Use `#runSubagent` with custom agents instead of handoffs for programmatic delegation.

**Source**: [VS Code Chat Sessions Docs](https://code.visualstudio.com/docs/copilot/chat/chat-sessions)

> "Enable the `runSubagent` tool in the tool picker. If you use a custom prompt file or custom agent, ensure you specify `runSubagent` in the `tools` frontmatter property."

**Key Setting**: `chat.customAgentInSubagent.enabled` must be `true` (we have this).

### 1.3 Existing Infrastructure (Gen85)

**Source**: `hfo_kiro_gen85/src/shared/`

| File | Purpose | Reusable? |
|------|---------|-----------|
| `gate-validator.ts` | G0-G11 hard gate validation | ✅ Yes |
| `tdd-validator.ts` | HUNT→RED→GREEN→REFACTOR enforcement | ✅ Yes |
| `blackboard.ts` | Signal emission with validation | ✅ Yes |
| `trace-context.ts` | W3C traceparent handling | ✅ Yes |
| `contracts/signal.contract.ts` | Zod schema for signals | ✅ Yes |

### 1.4 Swarm MCP Servers Found (Tavily Research)

| Server | Features | Status |
|--------|----------|--------|
| [claude-flow](https://github.com/ruvnet/claude-flow) | 100 tools, swarm_init, agent_spawn, task_orchestrate | Production |
| [mcp-agent](https://github.com/lastmile-ai/mcp-agent) | Orchestrator-workers, router, evaluator-optimizer | Production |
| [agent-swarm](https://github.com/desplega-ai/agent-swarm) | Lead/worker, MCP HTTP server | Beta |
| [ruv-swarm-mcp](https://lib.rs/crates/ruv-swarm-mcp) | Rust, hierarchical topology | Alpha |

### 1.4 Gap Analysis

| HIVE/8 Need | VS Code Agent Reality | Gap |
|-------------|----------------------|-----|
| G0-G11 validation | No validation | 🔴 Critical |
| Phase sequence H→I→V→E | No enforcement | 🔴 Critical |
| Anti-reward-hacking | Honor system | 🔴 Critical |
| Scatter-gather parallel | Sequential only | 🟡 High |
| Trace continuity | Manual only | 🟡 High |
| Powers of 8 scaling | Single agent | 🟢 Future |

---

## 2. Proposed Architecture

### 2.1 MCP Server: `hive-enforcer`

A custom MCP server that wraps Gen85 infrastructure:

```
┌─────────────────────────────────────────────────────────────────┐
│                     hive-enforcer MCP Server                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TOOLS:                                                          │
│  ├── hive_validateSignal(signal) → ValidationResult              │
│  ├── hive_emitSignal(signal) → { success, error? }               │
│  ├── hive_checkPhase(current, requested) → boolean               │
│  ├── hive_getState() → { phase, port, traceId, gen }             │
│  ├── hive_quarantine(signal, reason) → void                      │
│  ├── hive_scatter(tasks[]) → taskIds[]                           │
│  ├── hive_gather(taskIds[]) → results[]                          │
│  └── hive_flip() → void (E → H transition)                       │
│                                                                  │
│  WRAPS:                                                          │
│  ├── gate-validator.ts (G0-G11)                                  │
│  ├── tdd-validator.ts (phase sequence)                           │
│  ├── blackboard.ts (stigmergy)                                   │
│  └── trace-context.ts (W3C traces)                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Tool Specifications

#### `hive_validateSignal`

Validates a signal against G0-G11 gates WITHOUT emitting.

```typescript
interface ValidateSignalInput {
  signal: {
    ts: string;       // G0: ISO8601
    mark: number;     // G1: 0.0-1.0
    pull: string;     // G2: upstream|downstream|lateral
    msg: string;      // G3: non-empty
    type: string;     // G4: signal|event|error|metric
    hive: string;     // G5: H|I|V|E|X
    gen: number;      // G6: >= 87
    port: number;     // G7: 0-7
  };
}

interface ValidateSignalOutput {
  valid: boolean;
  gates: {
    gate: string;     // G0, G1, etc.
    passed: boolean;
    error?: string;
  }[];
  quarantined: boolean;
}
```

#### `hive_emitSignal`

Validates THEN emits to blackboard. Rejects invalid signals.

```typescript
interface EmitSignalInput {
  signal: StigmergySignal;
  traceparent?: string;  // W3C trace context
}

interface EmitSignalOutput {
  success: boolean;
  signalId?: string;     // UUID if emitted
  error?: string;        // Rejection reason
  quarantined?: boolean; // If sent to quarantine
}
```

#### `hive_checkPhase`

Enforces HIVE/8 phase sequence (anti-reward-hacking).

```typescript
interface CheckPhaseInput {
  currentPhase: "H" | "I" | "V" | "E";
  requestedPhase: "H" | "I" | "V" | "E";
  traceId: string;
}

interface CheckPhaseOutput {
  allowed: boolean;
  violation?: "SKIPPED_HUNT" | "REWARD_HACK" | "SKIPPED_VALIDATE" | "LAZY_AI";
  correctSequence: string;  // "H → I → V → E → H(N+1)"
}
```

#### `hive_scatter`

Distribute tasks to subagents (parallel intent, sequential execution).

```typescript
interface ScatterInput {
  tasks: {
    id: string;
    agent: string;      // lidless-legion, web-weaver, etc.
    prompt: string;
    tools?: string[];   // Restrict available tools
  }[];
}

interface ScatterOutput {
  taskIds: string[];
  dispatched: number;
  errors?: string[];
}
```

#### `hive_gather`

Collect results from scattered tasks.

```typescript
interface GatherInput {
  taskIds: string[];
  timeout?: number;  // ms
}

interface GatherOutput {
  results: {
    taskId: string;
    status: "completed" | "pending" | "failed";
    output?: string;
    error?: string;
  }[];
  allComplete: boolean;
}
```

#### `hive_flip`

Transition from E phase to H(N+1) - the strange loop.

```typescript
interface FlipInput {
  currentGen: number;
  summary: string;
}

interface FlipOutput {
  newGen: number;          // currentGen + 1
  newPhase: "H";
  newTraceId: string;      // Fresh trace context
  blackboardArchived: boolean;
}
```

---

## 3. Implementation Plan

### 3.1 HIVE/8 Iteration Map

| Iteration | Phase | Work | Output |
|-----------|-------|------|--------|
| **0** | **H (HUNT)** | Research, exemplars, this spec | Spec complete |
| 1 | I (INTERLOCK) | Zod contracts, failing tests | Contracts + RED tests |
| 2 | V (VALIDATE) | Implement MCP server | GREEN tests |
| 3 | E (EVOLVE) | Refactor, document, integrate | Production MCP |

### 3.2 Iteration 0 (HUNT) - Current

**Status**: IN PROGRESS

**Tasks**:
- [x] Physics tests (file write, subagent, MCP tools)
- [x] Memory bank search (HIVE/8 vision)
- [x] Tavily research (swarm MCP servers)
- [x] Gap analysis (VS Code agents vs HIVE/8)
- [x] This specification document
- [ ] Review existing Gen85 code for reuse
- [ ] Determine MCP SDK (TypeScript vs Python)

### 3.3 Dependencies

| Dependency | Source | Status |
|------------|--------|--------|
| Zod | npm | ✅ Installed |
| @modelcontextprotocol/sdk | npm | ❌ Need to install |
| gate-validator.ts | Gen85 | ✅ Available |
| tdd-validator.ts | Gen85 | ✅ Available |
| blackboard.ts | Gen85 | ✅ Available |

---

## 4. MCP Server Configuration

### 4.1 `.vscode/mcp.json` Addition

```jsonc
{
  "servers": {
    "hive-enforcer": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/src/mcp/hive-enforcer/index.js"],
      "env": {
        "BLACKBOARD_PATH": "${workspaceFolder}/sandbox/obsidianblackboard.jsonl",
        "QUARANTINE_PATH": "${workspaceFolder}/sandbox/quarantine.jsonl",
        "CURRENT_GEN": "87"
      }
    }
  }
}
```

### 4.2 Agent Integration

Update agent files to use hive-enforcer tools:

```yaml
# spider-sovereign.agent.md
tools:
  - hive-enforcer/hive_validateSignal
  - hive-enforcer/hive_emitSignal
  - hive-enforcer/hive_checkPhase
  - hive-enforcer/hive_scatter
  - hive-enforcer/hive_gather
  - hive-enforcer/hive_flip
```

---

## 5. Anti-Reward-Hacking Enforcement

### 5.1 Phase Transition Rules

```
ALLOWED:
  H → I (Hunt complete, ready to Interlock)
  I → V (Contracts defined, ready to Validate)
  V → E (Tests passing, ready to Evolve)
  E → H (FLIP to next iteration)

BLOCKED (Violations):
  H → V (SKIPPED_INTERLOCK - skipped contracts/tests)
  H → E (SKIPPED_INTERLOCK + SKIPPED_VALIDATE)
  I → E (REWARD_HACK - skipped validation)
  V → H (PREMATURE_FLIP - didn't complete evolution)
  Any → X (EMERGENCY - only human override)
```

### 5.2 Violation Handling

```typescript
// When violation detected:
1. REJECT the signal
2. Emit to quarantine.jsonl with reason
3. Return error to agent
4. Log to Pyre Praetorian audit

// Example quarantine entry:
{
  "ts": "2025-12-30T12:00:00Z",
  "violation": "REWARD_HACK",
  "attemptedPhase": "V",
  "currentPhase": "H",
  "agent": "mirror-magus",
  "signal": { ... },
  "traceId": "abc123"
}
```

---

## 5.3 CRITICAL: Brittleness vs Flexibility — Lessons Learned (2025-12-30)

> **Added by**: Spider Sovereign after user feedback  
> **Key Insight**: Sequential HIVE/8 is bootstrap, NOT production. Production is parallel.

### The Problem: Too Sequential, Too Brittle

The current H→I→V→E sequence is:
1. **Sequential** — One phase at a time, no parallelism
2. **Brittle** — Any skip = violation = quarantine
3. **Human-dependent** — Handoffs require clicks (even with `send: true` buggy)
4. **Not Powers of 8** — Single agent, not swarm

### User's Original Vision (from AGENTS.md)

> *"The HIVE/8 workflow was never designed to be sequential, that's only bootstrap. It should be powers of 8: 1010 at minimum"*

**Interpretation**: 
- Bootstrap = 1 agent, sequential (H→I→V→E)
- Production = 8^n agents, parallel (anti-diagonal pairs)

### Phase Pairing for Parallel Work

HIVE/8 uses **anti-diagonal pairs** (port X + port 7-X = 7):

| Phase | Ports | Agents | Work in Parallel |
|-------|-------|--------|------------------|
| H (Hunt) | 0+7 | Lidless + Spider | Research + Strategy |
| I (Interlock) | 1+6 | Weaver + Kraken | Contracts + Memory |
| V (Validate) | 2+5 | Magus + Pyre | Implement + Enforce |
| E (Evolve) | 3+4 | Storm + Regnant | Deliver + Test |

**EACH PHASE has 2 agents** that CAN work simultaneously!

### Flexible Enforcement Rules

Replace hard sequential gates with **phase-pair gates**:

```typescript
// OLD (brittle): Strict sequence
ALLOWED: H → I → V → E → H(N+1)
BLOCKED: Any skip

// NEW (flexible): Phase-pair parallelism
ALLOWED:
  - Ports 0+7 active during H phase
  - Ports 1+6 active during I phase  
  - Ports 2+5 active during V phase
  - Ports 3+4 active during E phase
  - Cross-phase work within same HIVE cycle

BLOCKED:
  - GREEN without RED (reward hack)
  - REFACTOR without GREEN (incomplete)
  - Implementation by non-V-phase ports
  - Memory writes by non-I-phase ports
```

### Tool-Based Enforcement (More Practical)

Instead of phase gates, enforce by **which tools are available**:

| Phase | Allowed Tools | Blocked Tools |
|-------|---------------|---------------|
| H (Hunt) | search, read, tavily, memory query | edit, create_file, run_terminal |
| I (Interlock) | edit tests, create schemas | run tests (would pass with no impl) |
| V (Validate) | edit impl, run tests | delete tests, skip tests |
| E (Evolve) | refactor, git commit | new features (that's next H) |

**This is ENFORCEABLE** via MCP tool filtering!

### Implementation Strategy

```typescript
// In hive-enforcer MCP server:
function filterToolsForPhase(phase: string, requestedTools: string[]): string[] {
  const allowed = PHASE_TOOLS[phase];
  return requestedTools.filter(t => allowed.includes(t));
}

// Or REJECT the call entirely:
function validateToolForPhase(phase: string, tool: string): boolean {
  if (!PHASE_TOOLS[phase].includes(tool)) {
    throw new Error(`Tool ${tool} blocked in ${phase} phase`);
  }
  return true;
}
```

---

## 6. Scatter-Gather Pattern

### 6.1 Sequential Scatter (Current VS Code Limitation)

Since VS Code subagents run sequentially, scatter is "intent-parallel":

```
Spider Sovereign
    │
    ├── scatter([task1, task2, task3])
    │         ↓
    │   [task1 → result1]  (sequential)
    │   [task2 → result2]  (sequential)
    │   [task3 → result3]  (sequential)
    │         ↓
    └── gather([id1, id2, id3]) → combined results
```

### 6.2 Future True Parallel (When VS Code Supports)

```
Spider Sovereign
    │
    ├── scatter([task1, task2, task3])
    │         ↓
    │   ┌─────┼─────┐
    │   ↓     ↓     ↓
    │ task1 task2 task3  (parallel)
    │   ↓     ↓     ↓
    │   └─────┼─────┘
    │         ↓
    └── gather() → combined results
```

---

## 7. Success Criteria

### 7.1 Iteration 0 (HUNT) Complete When:

- [x] Physics tests documented
- [x] Gap analysis complete
- [x] This spec created
- [ ] MCP SDK selected
- [ ] Gen85 code reviewed for reuse

### 7.2 Full Feature Complete When:

| Criterion | Measure |
|-----------|---------|
| Hard gates work | Invalid signal returns error, not emitted |
| Phase enforcement | Skipping phases returns VIOLATION |
| Scatter-gather | Can dispatch to 3+ agents and collect results |
| Trace continuity | traceId preserved across H→I→V→E |
| Quarantine works | Violations logged to quarantine.jsonl |

---

## 8. Open Questions

1. **MCP SDK Choice**: TypeScript (@modelcontextprotocol/sdk) or Python?
   - Recommendation: TypeScript (matches Gen85 codebase)

2. **State Persistence**: Where to store current HIVE state?
   - Option A: In blackboard as special "state" signal
   - Option B: Separate state.json file
   - Option C: In-memory (lost on restart)

3. **Subagent Identity**: How do we know which agent emitted a signal?
   - Option A: Require agent field in signal
   - Option B: Infer from port number
   - Option C: Pass agent context in MCP call

4. **External Daemon**: Should hive-enforcer also run Pyre daemon?
   - Option A: Yes, integrated watching
   - Option B: No, separate process
   - Recommendation: Start integrated, extract later

---

## 9. References

### Memory Bank Sources
- Gen84: `GEN84.2_ENRICHED_GOLD_BATON_QUINE.md` (HIVE/8 architecture)
- Gen83: `gen83_ttao_notes_2025_12_24.md` (powers of 8 vision)
- Gen85: `src/shared/gate-validator.ts` (enforcement code)

### External Sources (Tavily)
- [claude-flow](https://github.com/ruvnet/claude-flow) - 100-tool swarm MCP
- [mcp-agent](https://github.com/lastmile-ai/mcp-agent) - Orchestration patterns
- [VS Code MCP Docs](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

## 10. Signals Emitted

```json
{"ts":"2025-12-30T...","mark":1.0,"pull":"downstream","msg":"HUNT: Hard-gated swarm scatter-gather spec created. Iteration 0 in progress.","type":"signal","hive":"H","gen":87,"port":7}
```

---

*"The spider weaves the web that weaves the spider."*  
*Gen87.X3 | HUNT Phase | Iteration 0 | 2025-12-30*

---

## 11. HUNT Phase Addendum: Infrastructure Research (2025-12-30 Session 2)

> **Added by**: Claude Opus 4.5 (Spider Sovereign)  
> **Session**: Powers of 8 architecture feasibility analysis  
> **Key Finding**: VS Code agents CANNOT support 512-click swarms. MCP server with external API required.

### 11.1 Critical Architecture Gap Identified

**User Vision**: Powers of 8 (8^1=8, 8^2=64, 8^3=512 concurrent agents)  
**VS Code Reality**: Handoffs require manual clicks, #runSubagent uses parent model

| Scale | Manual Clicks Required | Verdict |
|-------|----------------------|---------|
| 8^1 = 8 | 8 clicks | Painful |
| 8^2 = 64 | 64 clicks | Impossible |
| 8^3 = 512 | 512 clicks | REJECTED |

**Conclusion**: VS Code agents are human-in-the-loop, NOT autonomous swarm infrastructure.

### 11.2 Correct Model Names — Tavily Ground Truth (2025-12-30)

**Source**: [GitHub Copilot Supported Models](https://docs.github.com/copilot/reference/ai-models/supported-models)

| Model Name in VS Code | Status | Cost Multiplier | Use For |
|----------------------|--------|-----------------|---------|
| `claude-opus-4.5` | ✅ Current | 3x | Deep reasoning, orchestration |
| `claude-opus-4.1` | ✅ Current | 10x | Most powerful (expensive!) |
| `claude-sonnet-4.5` | ✅ Current | 1x | Balance of cost/quality |
| `claude-sonnet-4` | ✅ Current | 1x | General coding |
| `gpt-5` | ✅ Current | 1x | General reasoning |
| `gpt-5-mini` | ✅ Current | 0x (Free!) | **CHEAP workers** |
| `gpt-4.1` | ✅ Current | 0x (Free!) | Legacy, still good |
| `gemini-3-flash` | ✅ Current | 0.33x | Fast, cheap |

**CRITICAL**: `gpt-5-mini` EXISTS and is FREE (0x multiplier). Perfect for swarm workers!

**Retired Models** (don't use):
- `claude-opus-4` → use `claude-opus-4.1`
- `claude-sonnet-3.5/3.7` → use `claude-sonnet-4`
- `o1-mini`, `o3-mini`, `o4-mini` → use `gpt-5-mini`

### 11.3 MCP Server Backend Options

The `hive_scatter` tool needs a **backend** to actually spawn workers. Options:

| Backend | Cost | Reliability | Model Mixing | Setup |
|---------|------|-------------|--------------|-------|
| **OpenRouter** | ~$0.45/512 swarm | ⭐⭐⭐⭐⭐ | ✅ 100+ models | API key |
| **copilot-api** | $0 (uses subscription) | ⭐⭐⭐ (may break) | ⚠️ Limited | Local server |
| **Direct APIs** | Varies | ⭐⭐⭐⭐⭐ | ✅ Full control | Multiple keys |
| **Ollama** | $0 (local) | ⭐⭐⭐⭐ | ⚠️ Local only | 16GB+ RAM |

### 11.3 Recommended Architecture: HYBRID

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  YOU in VS Code                                                             │
│  @spider-sovereign (Claude Opus 4.5 via Copilot - EXPENSIVE, paid by sub)   │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ ONE tool call: hive_scatter(512 tasks)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  hive-enforcer MCP Server (local)                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  G0-G11 Gate Validator                                              │    │
│  │  HIVE Phase State Machine                                           │    │
│  │  Blackboard Writer                                                  │    │
│  │  OpenRouter Client (for workers)                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Promise.all([ worker1(), worker2(), ... worker512() ])                     │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ 512 parallel HTTP calls
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  OpenRouter API (https://openrouter.ai/api/v1/chat/completions)             │
│  Model: gpt-4o-mini / gpt-5-nano / gemini-flash (CHEAP)                     │
│  Cost: ~$0.45 per 512-worker swarm                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Insight**: ONE MCP tool call from Spider Sovereign → 512 parallel cheap workers internally.

### 11.4 Cost Analysis

| Component | Model | Cost per 512-swarm |
|-----------|-------|-------------------|
| Orchestrator | Claude Opus 4.5 | $0 (via Copilot subscription) |
| Workers (512) | GPT-4o-mini | ~$0.45 |
| Workers (512) | GPT-5-nano | ~$0.25 |
| Workers (512) | Gemini Flash-Lite | ~$0.30 |
| **TOTAL** | | **$0.25 - $0.45 per swarm** |

### 11.5 Updated Tool Spec: `hive_scatter` with Backend

```typescript
interface ScatterInput {
  tasks: TaskSpec[];
  backend: "openrouter" | "copilot-api" | "ollama" | "direct";
  model: string;           // "gpt-4o-mini", "gpt-5-nano", etc.
  concurrency: number;     // Max parallel requests (default: 50)
  timeout: number;         // Per-task timeout in ms
}

interface TaskSpec {
  id: string;
  prompt: string;
  systemPrompt?: string;   // Agent persona
  port: number;            // HIVE/8 port assignment
  phase: "H" | "I" | "V" | "E";
}

interface ScatterOutput {
  scatterId: string;
  dispatched: number;
  results: TaskResult[];   // Gathered inline (no separate gather call)
  cost: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
  timing: {
    startMs: number;
    endMs: number;
    avgLatencyMs: number;
  };
}
```

### 11.6 Environment Configuration

```env
# .env for hive-enforcer MCP server

# Backend selection
HIVE_BACKEND=openrouter  # openrouter | copilot-api | ollama | direct

# OpenRouter (recommended)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
DEFAULT_WORKER_MODEL=openai/gpt-4o-mini

# Ollama (free local alternative)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest

# copilot-api (uses existing subscription)
COPILOT_API_PORT=4141

# Rate limiting
MAX_CONCURRENT_WORKERS=50
REQUEST_TIMEOUT_MS=30000
```

### 11.7 Updated Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.23.0",
    "openai": "^4.0.0"  // OpenRouter uses OpenAI-compatible API
  }
}
```

### 11.8 Incidents Logged to Blackboard

```json
{"ts":"2025-12-30T...","mark":0.0,"pull":"upstream","msg":"INCIDENT: ARCHITECTURAL_MISMATCH. VS Code agents cannot support 512-agent swarms. Requires external MCP server with direct API calls.","type":"error","hive":"H","gen":87,"port":7}

{"ts":"2025-12-30T...","mark":1.0,"pull":"downstream","msg":"HUNT: MCP Swarm Server architecture defined. SOLUTION: VS Code Copilot (Opus orchestrator) + OpenRouter API (GPT-4o-mini workers). Cost: ~$0.45 per 512-agent swarm.","type":"signal","hive":"H","gen":87,"port":7}
```

### 11.9 Handoff Checklist (HUNT → INTERLOCK)

**Ready for I phase when:**

- [x] Gap analysis complete (VS Code ≠ swarm infra)
- [x] Backend options researched and costed
- [x] Architecture diagram created
- [x] Tool spec updated with backend param
- [x] Environment config defined
- [ ] OpenRouter account created (USER ACTION)
- [ ] MCP SDK installed
- [ ] Gen85 code imported

**Handoff to Web Weaver (Port 1):**
1. Create Zod contracts for all tool inputs/outputs
2. Write failing tests for hive_scatter with OpenRouter backend
3. Define error handling for rate limits, timeouts, validation failures

---

## 12. Related Specs

| Spec | Location | Relationship |
|------|----------|--------------|
| HIVE Swarm MCP Server Architecture | `sandbox/specs/HIVE_SWARM_MCP_SERVER_ARCHITECTURE.md` | Detailed backend comparison |
| VS Code Agent Physics Test | `sandbox/specs/VSCODE_AGENT_PHYSICS_TEST.md` | Limitations analysis |
| Obsidian Legendary Commanders | `sandbox/specs/OBSIDIAN_LEGENDARY_COMMANDERS_VSCODE_AGENTS.md` | Agent personas |

---

*Updated: 2025-12-30 | Session 2 | Powers of 8 Analysis Complete*
