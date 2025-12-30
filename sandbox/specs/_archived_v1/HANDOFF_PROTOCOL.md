---
hfo:
  gen: 87
  port: 7
  role: DECIDE
  medallion: gold
  desc: "Formal Handoff Protocol for Obsidian Blackboard Stigmergy"
---

# 🔄 Handoff Protocol

> **Gen87.X3** | Formal Agent Handoff via Obsidian Blackboard
>
> **Purpose**: Enable seamless context transfer between AI agents through structured signals

---

## 1. Handoff Signal Schema

### 1.1 Standard Signal (8 fields, G0-G7 validated)

```typescript
interface Signal {
  ts: string;      // G0: ISO8601 timestamp
  mark: number;    // G1: 0.0-1.0 confidence
  pull: string;    // G2: upstream|downstream|lateral
  msg: string;     // G3: Signal message
  type: string;    // G4: signal|event|error|metric|handoff
  hive: string;    // G5: H|I|V|E|X
  gen: number;     // G6: Generation (87+)
  port: number;    // G7: Port 0-7
}
```

### 1.2 Handoff Signal (Extended)

```typescript
interface HandoffSignal extends Signal {
  type: 'handoff';          // Always 'handoff'
  hive: 'X';                // X = transition/handoff
  handoff: {
    sessionId: string;      // Unique session identifier
    phase: 'H' | 'I' | 'V' | 'E';  // Current HIVE phase
    nextPhase: 'H' | 'I' | 'V' | 'E';  // Recommended next phase
    completedTasks: string[];   // What was done
    pendingTasks: string[];     // What's left to do
    blockers: string[];         // Any issues
    artifacts: string[];        // Files created/modified
    context: {
      mission: string;          // Current mission
      keyDocs: string[];        // Important documents to read
      testStatus: string;       // Test results summary
    };
  };
}
```

---

## 2. Handoff Types

### 2.1 Phase Handoff (HIVE Transition)

Emit when transitioning between HIVE phases:

```json
{
  "type": "handoff",
  "hive": "X",
  "msg": "HANDOFF: H→I transition - Hunt complete, ready for Interlock",
  "handoff": {
    "phase": "H",
    "nextPhase": "I",
    "completedTasks": ["Memory Bank search", "Tavily grounding"],
    "pendingTasks": ["Define Zod contracts", "Write failing tests"]
  }
}
```

### 2.2 Session Handoff (Agent Transition)

Emit when ending a session for another agent to continue:

```json
{
  "type": "handoff",
  "hive": "X",
  "msg": "HANDOFF: Session complete - Full context for next agent",
  "handoff": {
    "sessionId": "gen87-x3-2025-12-30-session-1",
    "completedTasks": [...],
    "artifacts": ["sandbox/specs/SWARM_ORCHESTRATION_GUIDE.md", ...],
    "context": {
      "mission": "W3C Gesture Control Plane",
      "keyDocs": ["sandbox/llms.txt", "AGENTS.md"],
      "testStatus": "OpenRouter ✅, LangGraph ✅, CrewAI ✅"
    }
  }
}
```

### 2.3 Emergency Handoff (Blocker)

Emit when encountering a blocker:

```json
{
  "type": "handoff",
  "hive": "X",
  "mark": 0.5,
  "msg": "HANDOFF: BLOCKED - Rate limit on OpenRouter, need different model",
  "handoff": {
    "blockers": ["OpenRouter 429 rate limit on Gemini free tier"],
    "pendingTasks": ["Switch to Llama 3.3 70B free", "Retry test suite"]
  }
}
```

---

## 3. Reading Handoffs

### 3.1 Query Last Handoff

```bash
# PowerShell - Get last handoff signal
Get-Content sandbox/obsidianblackboard.jsonl | Where-Object { $_ -match '"type":"handoff"' } | Select-Object -Last 1 | ConvertFrom-Json
```

```typescript
// TypeScript - Parse handoffs
import { readFileSync } from 'fs';

function getLastHandoff(blackboardPath = 'sandbox/obsidianblackboard.jsonl') {
  const lines = readFileSync(blackboardPath, 'utf-8').split('\n').filter(Boolean);
  const handoffs = lines
    .map(line => JSON.parse(line))
    .filter(signal => signal.type === 'handoff');
  return handoffs[handoffs.length - 1];
}
```

### 3.2 Agent Startup Protocol

1. Read `sandbox/llms.txt` for quick context
2. Query last handoff from blackboard
3. Read recommended `keyDocs`
4. Continue from `nextPhase` with `pendingTasks`

---

## 4. Emitting Handoffs

### 4.1 TypeScript Helper

```typescript
import { appendFileSync } from 'fs';

interface HandoffContext {
  sessionId?: string;
  phase: 'H' | 'I' | 'V' | 'E';
  nextPhase: 'H' | 'I' | 'V' | 'E';
  completedTasks: string[];
  pendingTasks: string[];
  blockers?: string[];
  artifacts?: string[];
  mission?: string;
  keyDocs?: string[];
  testStatus?: string;
}

export function emitHandoff(context: HandoffContext, blackboardPath = 'sandbox/obsidianblackboard.jsonl') {
  const signal = {
    ts: new Date().toISOString(),
    mark: context.blockers?.length ? 0.5 : 1.0,
    pull: 'downstream',
    msg: `HANDOFF: ${context.phase}→${context.nextPhase} - ${context.completedTasks.length} tasks done, ${context.pendingTasks.length} pending`,
    type: 'handoff',
    hive: 'X',
    gen: 87,
    port: 7,
    handoff: {
      sessionId: context.sessionId ?? `gen87-x3-${new Date().toISOString().split('T')[0]}`,
      phase: context.phase,
      nextPhase: context.nextPhase,
      completedTasks: context.completedTasks,
      pendingTasks: context.pendingTasks,
      blockers: context.blockers ?? [],
      artifacts: context.artifacts ?? [],
      context: {
        mission: context.mission ?? 'W3C Gesture Control Plane',
        keyDocs: context.keyDocs ?? ['sandbox/llms.txt', 'AGENTS.md'],
        testStatus: context.testStatus ?? 'Unknown',
      },
    },
  };
  
  appendFileSync(blackboardPath, JSON.stringify(signal) + '\n');
  return signal;
}
```

### 4.2 PowerShell Helper

```powershell
function Emit-Handoff {
    param(
        [string]$Phase,
        [string]$NextPhase,
        [string[]]$CompletedTasks,
        [string[]]$PendingTasks,
        [string[]]$Artifacts = @(),
        [string]$TestStatus = "Unknown"
    )
    
    $handoff = @{
        ts = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        mark = 1.0
        pull = "downstream"
        msg = "HANDOFF: $Phase→$NextPhase - $($CompletedTasks.Count) tasks done, $($PendingTasks.Count) pending"
        type = "handoff"
        hive = "X"
        gen = 87
        port = 7
        handoff = @{
            sessionId = "gen87-x3-$(Get-Date -Format 'yyyy-MM-dd')"
            phase = $Phase
            nextPhase = $NextPhase
            completedTasks = $CompletedTasks
            pendingTasks = $PendingTasks
            blockers = @()
            artifacts = $Artifacts
            context = @{
                mission = "W3C Gesture Control Plane"
                keyDocs = @("sandbox/llms.txt", "AGENTS.md")
                testStatus = $TestStatus
            }
        }
    }
    
    $json = $handoff | ConvertTo-Json -Depth 10 -Compress
    Add-Content -Path "sandbox/obsidianblackboard.jsonl" -Value $json
    Write-Host "✅ Handoff emitted: $Phase → $NextPhase"
}
```

---

## 5. Handoff Checklist

### Before Handoff

- [ ] All work committed to files (not just in chat)
- [ ] Tests passing (or blockers documented)
- [ ] Artifacts list complete
- [ ] Pending tasks clearly defined
- [ ] Key docs updated (llms.txt, relevant specs)

### Handoff Signal Contents

- [ ] Current phase accurate
- [ ] Next phase recommendation
- [ ] Completed tasks summary
- [ ] Pending tasks with enough detail to continue
- [ ] Blockers if any
- [ ] Artifacts list (files created/modified)
- [ ] Test status

### After Handoff

- [ ] Signal emitted to blackboard
- [ ] llms.txt updated with current status
- [ ] Ready for next agent to `read → continue`

---

## 6. Example Full Handoff

```json
{
  "ts": "2025-12-30T10:00:00Z",
  "mark": 1.0,
  "pull": "downstream",
  "msg": "HANDOFF: H→I - Hunt phase complete, ready for Interlock with contracts",
  "type": "handoff",
  "hive": "X",
  "gen": 87,
  "port": 7,
  "handoff": {
    "sessionId": "gen87-x3-2025-12-30-session-1",
    "phase": "H",
    "nextPhase": "I",
    "completedTasks": [
      "Memory Bank search - Found Gold Baton Quine, W3C Gesture Gold Baton",
      "Tavily grounding - LangGraph patterns, MediaPipe docs",
      "Orchestration setup - OpenRouter, LangGraph, CrewAI",
      "Smoke tests - All passing",
      "Documentation - SWARM_ORCHESTRATION_GUIDE.md"
    ],
    "pendingTasks": [
      "Define GestureFrame Zod contract",
      "Define PointerStream Zod contract",
      "Write failing tests for FSM",
      "Implement XState machine skeleton"
    ],
    "blockers": [],
    "artifacts": [
      "sandbox/specs/SWARM_ORCHESTRATION_GUIDE.md",
      "sandbox/specs/PIPELINE_TRADE_STUDY.md",
      "sandbox/specs/PIPELINE_TRADE_STUDY_V2.md",
      "sandbox/src/swarm/index.ts",
      "sandbox/src/contracts/ports.ts",
      "sandbox/src/adapters/*.ts",
      "src/orchestration/openrouter.config.ts",
      "src/orchestration/langgraph.hive.ts",
      "src/orchestration/crewai_hive.py"
    ],
    "context": {
      "mission": "W3C Gesture Control Plane - MediaPipe → Physics → FSM → W3C Pointer → Target Adapters",
      "keyDocs": [
        "sandbox/llms.txt",
        "AGENTS.md",
        "sandbox/specs/SWARM_ORCHESTRATION_GUIDE.md",
        "sandbox/specs/PIPELINE_TRADE_STUDY_V2.md"
      ],
      "testStatus": "OpenRouter ✅ | LangGraph HIVE/8 ✅ | CrewAI 8 commanders ✅ | Memory Bank ✅"
    }
  }
}
```

---

## The Mantra

> **"The spider weaves the web that weaves the spider."**

*Gen87.X3 | Handoff Protocol | 2025-12-30*
