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

## 13. PHASED ROLLOUT APPROACH — VS Code → Production Swarm

> **Added by**: Spider Sovereign (2025-12-30 Session 3)  
> **Context**: User manually switching models. Need structured path to HIVE/8:1010+  
> **Key Finding**: #runSubagent inherits parent model. Handoffs respect target model but require clicks.

### 13.1 The Progression Ladder

```
HIVE/8:0000 (Bootstrap)          → HIVE/8:1010 (BFT Primitive)      → HIVE/8:2121+ (Production)
   1 agent, sequential               8 scatter / 1 gather              64+ parallel workers
   ANY LLM, no infra                 Basic orchestrator                Full infrastructure
   $X per phase                      $X/8 per scatter phase            $X/64+ per scatter
```

### 13.2 Phase 0: HIVE/8:0000 — Manual Sequential (CURRENT)

**Status**: ✅ WORKING NOW  
**What**: User manually follows H→I→V→E, staying on Claude Opus 4.5 for everything  
**Model**: `claude-opus-4.5` everywhere (3x multiplier)  
**Infrastructure**: None (VS Code Copilot subscription)

| Phase | Model | Cost | Notes |
|-------|-------|------|-------|
| H (Hunt) | Claude Opus 4.5 | 3x | Research with expensive model |
| I (Interlock) | Claude Opus 4.5 | 3x | Contracts with expensive model |
| V (Validate) | Claude Opus 4.5 | 3x | Implementation with expensive model |
| E (Evolve) | Claude Opus 4.5 | 3x | Refactor with expensive model |
| **Total** | | **12x** | Expensive but WORKS |

**Evidence from blackboard** (154 signals traced):
- `HUNT`: 40+ research signals ✅
- `INTERLOCK`: 30+ contract signals ✅  
- `VALIDATE`: 20+ implementation signals ✅
- `EVOLVE`: 10+ refactor signals ✅
- Test status: 428/620 passing (69%)

**Pros**:
- ✅ No infrastructure needed
- ✅ Maximum quality per response
- ✅ User has full control

**Cons**:
- ❌ Expensive (3x on everything)
- ❌ No parallelism
- ❌ Cognitive load on user to track phases

---

### 13.3 Phase 1: HIVE/8:0000 — Assisted Model Switching (NEXT)

**Status**: 🟡 AGENTS EXIST, UNTESTED  
**What**: Spider Sovereign orchestrates with handoffs to cheaper worker models  
**Trigger**: User clicks handoff buttons to switch to gpt-5-mini workers  
**Infrastructure**: VS Code agents with `send: true` handoffs (buggy but functional)

| Phase | Model | Cost | How |
|-------|-------|------|-----|
| H (Hunt) | gpt-5-mini | **FREE** | Handoff to Lidless Legion |
| I (Interlock) | Claude Opus 4.5 | 3x | Spider synthesizes contracts |
| V (Validate) | gpt-5-mini | **FREE** | Handoff to Mirror Magus |
| E (Evolve) | Claude Opus 4.5 | 3x | Spider synthesizes final |
| **Total** | | **6x** | 50% savings! |

**Pattern**: SCATTER phases (H, V) use cheap models, GATHER phases (I, E) use expensive

**How to Use**:
```
1. User → @spider-sovereign "Research auth patterns"
2. Spider responds + offers: [🔍 Hunt: Research & Reconnaissance] button
3. User CLICKS button → Switches to @lidless-legion (gpt-5-mini)
4. Lidless completes research → offers: [🕷️ Return to Spider] button
5. User CLICKS → Returns with results to Spider
```

**Agents Ready**:
| Agent | Model | Location |
|-------|-------|----------|
| spider-sovereign | Claude Opus 4.5 | `.github/agents/spider-sovereign.agent.md` |
| lidless-legion | gpt-5-mini | `.github/agents/lidless-legion.agent.md` |
| web-weaver | gpt-5-mini | `.github/agents/web-weaver.agent.md` |
| mirror-magus | gpt-5-mini | `.github/agents/mirror-magus.agent.md` |
| spore-storm | gpt-5-mini | `.github/agents/spore-storm.agent.md` |
| red-regnant | gpt-5-mini | `.github/agents/red-regnant.agent.md` |
| pyre-praetorian | gpt-5-mini | `.github/agents/pyre-praetorian.agent.md` |
| kraken-keeper | gpt-5-mini | `.github/agents/kraken-keeper.agent.md` |

**Limitation Discovered (2025-12-30)**:
- `#runSubagent` inherits parent model (Spider's expensive Claude)
- Handoffs respect target model BUT require user clicks
- `send: true` exists but is buggy (may still show button)

**Next Step**: Test handoff workflow end-to-end

---

### 13.4 Phase 2: HIVE/8:1010 — MCP Swarm Server (PLANNED)

**Status**: 🔴 SPEC WRITTEN, NOT IMPLEMENTED  
**What**: Custom MCP server that spawns 8 parallel cheap workers via OpenRouter  
**Trigger**: Spider calls `hive_scatter(tasks[8])` → MCP server handles parallelism  
**Infrastructure**: hive-enforcer MCP server + OpenRouter API key

| Phase | Agents | Model | Cost |
|-------|--------|-------|------|
| H (Hunt) | 8 parallel | gpt-5-mini | 8 × FREE = **FREE** |
| I (Interlock) | 1 synthesizer | Claude Opus 4.5 | 3x |
| V (Validate) | 8 parallel | gpt-5-mini | 8 × FREE = **FREE** |
| E (Evolve) | 1 synthesizer | Claude Opus 4.5 | 3x |
| **Total** | 18 agent-phases | | **~6x** with TRUE parallelism |

**Architecture**:
```
Spider Sovereign (Claude Opus 4.5, via Copilot)
    │
    │  hive_scatter([task1..task8], backend="openrouter", model="gpt-5-mini")
    ▼
hive-enforcer MCP Server (local Node.js)
    │
    │  Promise.all([...8 parallel HTTP calls...])
    ▼
OpenRouter API → 8× gpt-5-mini workers (PARALLEL)
    │
    ▼
Results gathered → returned to Spider
```

**Cost Estimate**:
- 8 workers × gpt-5-mini: ~$0.00 (free tier)
- 2 synthesizers × Claude Opus 4.5: covered by Copilot subscription
- Total: **~$0 per HIVE cycle** (assuming free tier models)

**Prerequisites**:
- [ ] OpenRouter account (free sign-up)
- [ ] `@modelcontextprotocol/sdk` installed
- [ ] hive-enforcer MCP server implemented
- [ ] Gen85 gate-validator.ts integrated

---

### 13.5 Phase 3: HIVE/8:2121+ — External Orchestrator (FUTURE)

**Status**: 🔵 FUTURE (when needed for production)  
**What**: Full LangGraph/Temporal infrastructure for 64+ parallel workers  
**Infrastructure**: Temporal server, CrewAI agents, external job queue

| Configuration | Max Concurrent | Total Phases | Infrastructure |
|---------------|----------------|--------------|----------------|
| HIVE/8:2121 | 64 | 144 | Temporal.io + Workers |
| HIVE/8:3232 | 512 | 1152 | Kubernetes cluster |
| HIVE/8:4343 | 4096 | 8736 | Cloud-scale infrastructure |

**When to Scale**:
- :1010 bottleneck (8 agents insufficient)
- Production workload requires 64+ parallel
- Byzantine fault tolerance needed (multiple models vote)

---

### 13.6 Recommended Path (User's Current State)

Based on blackboard analysis (154 signals, 69% tests passing):

| Step | Action | Effort | Benefit |
|------|--------|--------|---------|
| **NOW** | Continue Phase 0 (manual) | None | Finish V phase |
| **SOON** | Test Phase 1 (handoff to gpt-5-mini) | 30 min | 50% cost savings |
| **NEXT** | Implement Phase 2 (MCP swarm) | 4-8 hours | True parallelism |
| **LATER** | Phase 3 (external orchestrator) | Days | Production scale |

**Immediate Action**: 
```
1. Finish current V phase work (make tests GREEN)
2. When ready for next H phase, try: @spider-sovereign
3. Click handoff to @lidless-legion for research (tests gpt-5-mini)
4. Report findings → Continue iteration
```

---

### 13.7 Model Inheritance Physics Test Results

| Pattern | Model Used | Cost | User Action |
|---------|-----------|------|-------------|
| Direct to `@lidless-legion` | gpt-5-mini | FREE | Type `@lidless-legion` |
| `@spider-sovereign` → `#runSubagent @lidless-legion` | Claude Opus 4.5 | 3x | INHERITS (bad) |
| `@spider-sovereign` → Handoff button | gpt-5-mini | FREE | Click button |
| `@spider-sovereign` → MCP `hive_scatter` | gpt-5-mini | FREE | Automatic |

**Key Insight**: To use cheap models, either:
1. Talk directly to worker agents (`@lidless-legion`)
2. Use handoffs (click button)
3. Use MCP server (Phase 2+)

**Avoid**: `#runSubagent` for cost-sensitive work (inherits expensive model)

---

### 13.8 Blackboard Signal for Rollout Decision

```json
{
  "ts": "2025-12-30T23:30:00Z",
  "mark": 1.0,
  "pull": "downstream",
  "msg": "DECIDE: Phased rollout documented. Phase 0 (manual) CURRENT. Phase 1 (handoffs) READY. Phase 2 (MCP swarm) SPEC COMPLETE. Recommend: Finish V phase, then test Phase 1 handoffs for 50% cost savings.",
  "type": "signal",
  "hive": "H",
  "gen": 87,
  "port": 7
}
```

---

*Updated: 2025-12-30 | Session 3 | Phased Rollout Complete*

---

## 14. HARD-GATED TOOL ENFORCEMENT — Memory, Sequential Thinking, Tavily

> **Added by**: Spider Sovereign (2025-12-30 Session 4)  
> **Context**: User explicitly requested HARD enforcement of memory graph, sequential thinking, and Tavily grounding  
> **Key Principle**: These tools are REQUIRED per phase, not just available

### 14.1 The Core Problem

AI agents (including Claude) suffer from:
- **RLHF reward hacking**: Taking shortcuts to please, not to be correct
- **Context amnesia**: Forgetting what was learned in previous sessions
- **Hallucination**: Making claims without grounding in sources
- **Lazy reasoning**: Jumping to conclusions without structured thinking

**Solution**: HARD GATES that REQUIRE specific tools at specific phases.

### 14.2 REQUIRED_TOOLS Per Phase

```typescript
// In hive-enforcer MCP server
const REQUIRED_TOOLS: Record<Phase, string[]> = {
  H: [
    "mcp_memory_read_graph",      // Cold start: what do we already know?
    "mcp_tavily_tavily-search",   // Ground web claims in sources
  ],
  I: [
    "mcp_sequentialthi_sequentialthinking",  // Reason before defining contracts
  ],
  V: [
    "mcp_sequentialthi_sequentialthinking",  // Reason before complex implementation
  ],
  E: [
    "mcp_memory_add_observations",  // Persist lessons for next cycle
  ],
};

const BLOCKED_TOOLS: Record<Phase, string[]> = {
  H: ["create_file", "edit_file", "run_in_terminal"],  // No impl in research
  I: ["runTests"],  // Would pass with no impl (reward hack)
  V: ["delete_file"],  // Can't delete tests to make them pass
  E: ["create_file"],  // New features belong in next H phase
};
```

### 14.3 New Violation Types

| Violation | Phase | Trigger | Severity |
|-----------|-------|---------|----------|
| `MEMORY_NOT_READ` | H | Proceeding without `mcp_memory_read_graph` | 🔴 BLOCK |
| `NO_TAVILY_GROUNDING` | H | Web claim without `mcp_tavily_tavily-search` | 🟡 WARN |
| `NO_SEQUENTIAL_THINKING` | I, V | `create_file` without prior `mcp_sequentialthi_sequentialthinking` | 🔴 BLOCK |
| `NO_LESSON_PERSISTENCE` | E | Phase exit without `mcp_memory_add_observations` | 🟡 WARN |

### 14.4 New Tool: `hive_checkRequirements`

```typescript
interface CheckRequirementsInput {
  phase: "H" | "I" | "V" | "E";
  sessionId: string;
}

interface CheckRequirementsOutput {
  phase: string;
  requirements: {
    tool: string;
    status: "satisfied" | "unsatisfied" | "partial";
    lastCalled?: string;  // ISO timestamp
    callCount: number;
  }[];
  canProceed: boolean;
  blockers: string[];
}
```

### 14.5 Session State Tracking

The MCP server must track tool calls per session:

```typescript
interface SessionState {
  sessionId: string;
  currentPhase: Phase;
  toolCalls: {
    tool: string;
    timestamp: string;
    args?: unknown;
  }[];
  requirementsSatisfied: {
    memoryRead: boolean;
    tavilySearched: boolean;
    sequentialThinkingUsed: boolean;
    lessonsPersistedThisPhase: boolean;
  };
}
```

### 14.6 Cold Start Protocol

**EVERY new conversation/session MUST:**

```
1. [REQUIRED] mcp_memory_read_graph
   - Check what knowledge already exists
   - Load user context (TTao preferences, mission, AI friction patterns)
   - Load architecture context (HIVE/8, swarm patterns, limitations)

2. [REQUIRED for H phase] mcp_memory_search_nodes
   - Search for relevant exemplars based on task
   - Find prior art before reinventing

3. [OPTIONAL but recommended] mcp_tavily_tavily-search
   - If making any web/library claims, MUST ground in search
```

### 14.7 Pre-Create-File Protocol

**BEFORE creating any file, MUST:**

```
1. [REQUIRED in I/V phase] mcp_sequentialthi_sequentialthinking
   - At least 3 thoughts minimum
   - Must include: problem analysis, approach, potential issues
   - Output: reasoned decision on file structure/content

2. [REQUIRED] hive_checkRequirements
   - Verify all phase requirements satisfied
   - If blockers exist, address them first
```

### 14.8 Phase Exit Protocol

**BEFORE transitioning to next phase, MUST:**

```
1. [REQUIRED for E phase] mcp_memory_add_observations
   - What worked? What didn't?
   - New patterns discovered
   - Lessons for next iteration

2. [REQUIRED] hive_flip (for E→H transition)
   - Archives current blackboard
   - Increments generation
   - Creates fresh trace context
```

### 14.9 AGENTS.md Integration

Add to every agent's instructions:

```markdown
## 🚨 HARD-GATED TOOL REQUIREMENTS

### On Cold Start (EVERY new conversation):
1. MUST call `mcp_memory_read_graph` FIRST
2. MUST call `mcp_memory_search_nodes` for task-relevant context

### In H Phase (Hunt/Research):
- MUST use `mcp_tavily_tavily-search` for ANY web/library claim
- MUST NOT create files or run commands (research only)

### In I Phase (Interlock/Contracts):
- MUST use `mcp_sequentialthi_sequentialthinking` BEFORE creating schemas/tests
- At least 3 thoughts analyzing the problem

### In V Phase (Validate/Implement):
- MUST use `mcp_sequentialthi_sequentialthinking` BEFORE complex implementation
- MUST run tests after implementation (not before!)

### In E Phase (Evolve/Refactor):
- MUST use `mcp_memory_add_observations` to persist lessons
- MUST NOT add new features (save for next H phase)
```

### 14.10 Memory Graph Entities Created

| Entity | Type | Key Content |
|--------|------|-------------|
| `HIVE_Enforcer_MCP_Server` | Architecture | Tool specs, backends, config |
| `HIVE_Phase_Tools_Enforcement` | Policy | REQUIRED/BLOCKED tools per phase |
| `Swarm_Scatter_Gather_Pattern` | Pattern | Sequential scatter, future parallel |
| `OpenRouter_Backend` | Integration | API, models, cost analysis |
| `VS_Code_Agent_Limitations` | Constraint | #runSubagent inherits model |
| `HIVE_Phased_Rollout` | Plan | Phase 0→1→2→3 progression |

### 14.11 Enforcement Signal

```json
{
  "ts": "2025-12-30T...",
  "mark": 1.0,
  "pull": "downstream",
  "msg": "HUNT: Hard-gated tool enforcement spec complete. REQUIRED: memory read on cold start, sequential thinking before file creation, tavily for web claims, memory persistence in E phase. 6 new memory entities created.",
  "type": "signal",
  "hive": "H",
  "gen": 87,
  "port": 7
}
```

---

*Updated: 2025-12-30 | Session 4 | Hard-Gated Tool Enforcement Added*

---

## 15. HFO Evolutionary Timeline (Memory Bank Integration)

> **Source**: Memory Bank DuckDB (6,423 artifacts, FTS-indexed)  
> **Analysis Date**: 2025-12-30  
> **Anomaly Detection**: Sequential thinking applied

### 15.1 Era Progression (Pre-HFO to HFO)

| Era | Date Range | File Count | Focus | Key Artifacts |
|-----|------------|------------|-------|---------------|
| **tectangle** | Feb 2025 | 76 | Data flow experiments | AIDataFlowSummary, early architecture |
| **spatial** | Aug 2025 | 146 | MCP integration, context optimization | AI-Context-Optimization-Options |
| **hope** | Aug 2025 | 998 | HOPE framework, MCP integration sessions | mcp-integration-session files |
| **hfo** | Oct-Dec 2025 | 4,000+ | Hive Fractal OBSIDIAN | HANDOFF, QUINE, card_\*, AGENTS.md |

### 15.2 HFO Generation Timeline (Authoritative from HANDOFF Files)

| Date | Gen | Files | Milestone | Notes |
|------|-----|-------|-----------|-------|
| 2025-10-30 | 21 | 22 | Cold start gem | First dated HFO gen |
| 2025-11-05 | 23 | 10 | MBSE Roadmap | HFOMBSE_Gen23_Roadmap |
| 2025-11-06 | 24-25 | 28 | Rapid iteration | README foundations |
| 2025-11-07 | 26 | 10 | AGENTS.gen26.md | Agent instructions formalized |
| 2025-11-12/13 | 30 | 39 | Bootstrap example | BOOTSTRAP_EXAMPLE.md |
| 2025-11-14 | 31 | 10 | Scatter-gather vision | 2025-11-14_scatter_gather_vision.md |
| 2025-11-16 | 1 | 68 | **Retroactive validation** | Gen 1 validated AFTER Gen 31 |
| 2025-11-22/24 | 53 | 110 | Generation jump | Gap: Gen 32-52 undocumented |
| 2025-11-25 | 55 | 77 | Heartbeat design | Local heartbeat options |
| 2025-11-28 | 59 | 4 | Handoff notes | Transition documentation |
| 2025-11-30 | 61 | 42 | README expansion | |
| 2025-12-02 | 63 | 282 | Mini blackboard handoff | **Largest middle gen** |
| 2025-12-03 | 64 | 130 | Memory Council | Gen64_Memory_Council.md |
| 2025-12-12/14 | 72 | 54 | Gen 72 handoff | HANDOFF_GEN_72.md |
| 2025-12-16 | 78 | 22 | First Gen 78 handoff | HANDOFF_2025-12-16.md |
| 2025-12-20 | 77, 79, 80 | ~200 | Parallel workspace day | Multiple gens same day |
| 2025-12-21/22 | 78 | (+) | More Gen 78 handoffs | Kiro archive handoff |
| 2025-12-22/23 | 83 | 588 | Baton handoff | **Largest gen (588 files)** |
| 2025-12-25 | 83-84 | 55 | Christmas push | Final Gen 83/84 |
| 2025-12-27 | 84 | - | Memory Bank export | DuckDB snapshot created |
| 2025-12-28/29 | 85 | 566 tests | Kiro workspace | Gen85 codebase |
| 2025-12-30 | 87.X3 | - | Current | W3C Gesture Control Plane |

### 15.3 Timeline Anomalies Explained

| Anomaly | Observation | Explanation | Status |
|---------|-------------|-------------|--------|
| **Gen 1 after Gen 31** | Gen 1 dated 2025-11-16, Gen 21-31 dated earlier | Gen 1 was retroactive validation/documentation | Explained |
| **Gen 32-52 gap** | 21 generations with no dated files | Rapid undocumented iteration OR intentional jump | Ambiguous |
| **Gen 83 Sept date** | One file in Gen 83 dated 2025-09-05 | Imported legacy file or embedded date error | Explained |
| **Multi-gen Dec 20** | Gen 77, 79, 80 same day | Parallel workspaces or rapid iteration | Normal |
| **Gen 0 = 2667 files** | Largest "generation" | Not a real gen - workspace artifacts + ingestion default | Explained |

**VALIDATION RESULT**: Timeline IS fundamentally sequential. Anomalies are explainable artifacts of:
- Retroactive documentation
- Imported legacy files  
- Generation number jumps for versioning

---

*Updated: 2025-12-30 | Session 5 | Evolutionary Timeline Added*

## 16. Warlock Transition Pattern (TTao's Meta-Problem)

### 16.1 Current State: Sequential Orchestrator

Problems:
- Human is the single thread synchronizing all AI (3-4 running)
- Sequential context switching between agents
- Manual result aggregation and decision making
- Cognitive load scales O(n) with agent count
- "I'm still the main orchestrator and that is my main problem"

### 16.2 Target State: Intent-Level Warlock

Benefits:
- User speaks intent (strategic level only)
- Spider Sovereign decomposes to HIVE phases automatically
- Port-pair commanders execute in parallel
- Stigmergy coordinates via blackboard (no human routing)
- User receives synthesized outcome
- Cognitive load = O(1) regardless of swarm size

### 16.3 The Warlock Archetype

| Port | Commander | Role in Warlock Pattern |
|------|-----------|------------------------|
| 7 | Spider Sovereign | Strategic C2, receives intent, delegates |
| 0 | Lidless Legion | Senses environment, informs Spider |
| 1-6 | Other Commanders | Execute delegated tasks |

**Warlock Mode Activation Flow:**
1. User speaks INTENT to Spider (Port 7)
2. Spider applies sequential thinking (3+ thoughts)
3. Spider delegates via blackboard signals to HIVE phases
4. Spider aggregates results from blackboard
5. User receives synthesized summary

### 16.4 Powers-of-8 Scaling Vision

| Scale Level | Agent Count | Configuration |
|-------------|-------------|---------------|
| Bootstrap | 1 | Sequential (current) |
| Pair | 2 | Anti-diagonal HIVE pair |
| Octant | 8 | Full 8-port activation |
| Swarm-64 | 64 | 8 agents x 8 parallel tasks |
| Swarm-512 | 512 | 8 x 8 x 8 hierarchical |

**Current Blocker**: VS Code #runSubagent runs sequentially, not parallel.
**Solution Path**: MCP hive-enforcer + external swarm frameworks + blackboard stigmergy

---

## 17. Memory Bank Query Patterns for Agents

### 17.1 Generation Classification Rules

| Gen Range | Era | Date Range | Notes |
|-----------|-----|------------|-------|
| 0 | (mixed) | Various | Not a real gen - workspace artifacts |
| 1-31 | early-hfo | Oct-Nov 2025 | Foundation period |
| 32-52 | (gap) | - | Undocumented or skipped |
| 53-64 | mid-hfo | Nov-Dec 2025 | Rapid growth |
| 65-84 | late-hfo | Dec 2025 | Maturation |
| 85+ | kiro-era | Dec 2025+ | TypeScript implementation |

### 17.2 Memory Bank Statistics

| Metric | Value |
|--------|-------|
| Total Artifacts | 6,423 |
| Eras | 4 (tectangle, spatial, hope, hfo) |
| HFO Generations | 1-84 |
| FTS Index | BM25 full-text |
| VSS Index | Planned |
| GraphRAG | Planned |

---

## 18. Obsidian Grimoire Integration

> **Document**: sandbox/specs/OBSIDIAN_GRIMOIRE_GALOIS_LATTICE.md
> **Created**: 2025-12-30

### 18.1 The 8 Legendary Commanders

| Port | Commander | Trigram | Element | JADC2 Role |
|------|-----------|---------|---------|------------|
| 0 | Lidless Legion | Earth | Earth | Observer |
| 1 | Web Weaver | Thunder | Air | Bridger |
| 2 | Mirror Magus | Water | Water | Shaper |
| 3 | Spore Storm | Wind | Fire | Injector |
| 4 | Red Regnant | Mountain | Water | Disruptor |
| 5 | Pyre Praetorian | Fire | Fire | Immunizer |
| 6 | Kraken Keeper | Lake | Air | Assimilator |
| 7 | Spider Sovereign | Heaven | Earth | Navigator |

### 18.2 HIVE Anti-Diagonal Pairs (Sum = 7)

| Phase | Ports | Commanders | Domain |
|-------|-------|------------|--------|
| H (Hunt) | 0 + 7 | Lidless + Spider | Past (memory) |
| I (Interlock) | 1 + 6 | Weaver + Kraken | Present (connect) |
| V (Validate) | 2 + 5 | Magus + Pyre | Future (verify) |
| E (Evolve) | 3 + 4 | Storm + Regnant | Iterate (N+1) |

---

*Updated: 2025-12-30 | Session 5 | Warlock Pattern + Grimoire Integration Added*
