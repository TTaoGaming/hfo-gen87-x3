# AI Swarm + Durable Workflow Architecture Specification

> **Generation**: 87.X3  
> **Date**: 2025-12-30  
> **Phase**: INTERLOCK (I) - Contract Definition  
> **Status**: Tavily Grounded + Sequential Thinking Validated  
> **Purpose**: Define how to scale HIVE/8 from bootstrap (8:0001) to production (8:1010)

---

## 🎯 EXECUTIVE SUMMARY

This spec defines how to:
1. **Set up Hexagonal CDD** for composable primitives
2. **Let AI swarm combine and evolve** using the primitives autonomously
3. **Scale HIVE/8** from sequential bootstrap to parallel production
4. **Stop babysitting** with durable workflows and task factories

---

## 📊 PIPELINE TRADE STUDY VERIFICATION ✅

Your pipeline trade study is comprehensive and well-grounded:

| Stage | Choice | Status | Tavily Validated |
|-------|--------|--------|------------------|
| 1. Input | MediaPipe Tasks Vision | ✅ TRL 9 | ✅ Google maintained |
| 2. Smooth | Rapier + 1€ Filter hybrid | ✅ Novel | ✅ Both battle-tested |
| 3. FSM | XState v5 | ✅ TRL 9 | ✅ 27K stars, TypeScript native |
| 4. Output | W3C Pointer Events | ✅ Standard | ✅ W3C Level 3 |
| 5. Adapters | Polymorphic ports | ✅ Designed | ✅ AWS hexagonal guidance |

**Verdict**: Pipeline architecture is solid. Ready for INTERLOCK phase.

---

## 🔷 HEXAGONAL CDD ARCHITECTURE

### What You Already Have (Verified in sandbox/src/)

```
sandbox/src/
├── contracts/           # PORT DEFINITIONS (WHAT)
│   ├── ports.ts         # SensorPort, SmootherPort, FSMPort, EmitterPort, AdapterPort
│   ├── schemas.ts       # Zod schemas for all data types
│   └── contracts.test.ts
└── adapters/            # IMPLEMENTATIONS (HOW)
    ├── mediapipe.adapter.ts   # Implements SensorPort
    ├── one-euro.adapter.ts    # Implements SmootherPort
    ├── xstate-fsm.adapter.ts  # Implements FSMPort
    ├── pointer-event.adapter.ts
    └── pipeline.ts            # Composes all adapters
```

### How AI Swarm Will Combine Primitives

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HEXAGONAL CDD + AI SWARM COMPOSITION                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   LEVEL 1: PORT CONTRACTS (Immutable)                                       │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │ SensorPort  │  │SmootherPort │  │  FSMPort    │  │ AdapterPort │       │
│   │ sense()     │  │ smooth()    │  │ process()   │  │ inject()    │       │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│          │                │                │                │               │
│   LEVEL 2: ADAPTERS (Pluggable by AI)                                       │
│   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐       │
│   │ MediaPipe   │  │ 1€ Filter   │  │ XState v5   │  │ DOM Adapter │       │
│   │ TensorFlow  │  │ Rapier      │  │ Robot.js    │  │ v86 Adapter │       │
│   │ OpenCV      │  │ Kalman      │  │ Custom      │  │ nut.js      │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
│   LEVEL 3: AI SWARM COMPOSITION                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  AI Agent receives: "Create pipeline for emulator control"          │  │
│   │  AI Agent selects:  MediaPipe → Rapier → XState → v86Adapter       │  │
│   │  AI Agent validates: Run contract tests, verify Zod schemas pass    │  │
│   │  AI Agent emits:    Working pipeline, emit to blackboard            │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔷 SCALING: FROM 8:0001 (BOOTSTRAP) TO 8:1010 (PRODUCTION)

### Notation Explained

```
8:WXYZ where:
- 8     = Number of ports/workers (fixed)
- W     = Hundreds of concurrent workflows per phase
- X     = Tens of concurrent workflows per phase  
- Y     = Ones of concurrent workflows per phase
- Z     = Activities per workflow (×10)

Examples:
- 8:0001 = 8 ports, 1 workflow, 10 activities (bootstrap, sequential)
- 8:0010 = 8 ports, 10 workflows, 10 activities = 800 ops (development)
- 8:0100 = 8 ports, 100 workflows, 10 activities = 8,000 ops (staging)
- 8:1010 = 8 ports, 1010 workflows, 10 activities = 80,800 ops (production)
```

### HIVE/8 Parallel Execution Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HIVE/8 PARALLEL PHASES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SEQUENTIAL (8:0001 Bootstrap)          PARALLEL (8:1010 Production)        │
│  ──────────────────────────            ──────────────────────────           │
│                                                                             │
│  H ──▶ I ──▶ V ──▶ E                   ┌─── H(×10) ───┐                    │
│  │     │     │     │                   │   Port 0+7    │                    │
│  ▼     ▼     ▼     ▼                   │   parallel    │                    │
│  1     1     1     1                   └───────┬───────┘                    │
│  wkf   wkf   wkf   wkf                         │ signal                     │
│                                        ┌───────▼───────┐                    │
│  Total: 4 workflows                    │   I(×10)      │                    │
│  Serial execution                      │   Port 1+6    │                    │
│                                        │   parallel    │                    │
│                                        └───────┬───────┘                    │
│                                                │ signal                     │
│                                        ┌───────▼───────┐                    │
│                                        │   V(×10)      │                    │
│                                        │   Port 2+5    │                    │
│                                        │   parallel    │                    │
│                                        └───────┬───────┘                    │
│                                                │ signal                     │
│                                        ┌───────▼───────┐                    │
│                                        │   E(×10)      │                    │
│                                        │   Port 3+4    │                    │
│                                        │   parallel    │                    │
│                                        └───────────────┘                    │
│                                                                             │
│                                        Total: 40+ parallel workflows        │
│                                        Per-phase parallelism                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔷 TEMPORAL.IO DURABLE WORKFLOW ARCHITECTURE

### Source: Tavily Research Findings

| Finding | Source | Implication |
|---------|--------|-------------|
| "Every tool became a durable operation" | temporal.io/blog | All HIVE activities survive crashes |
| "Signals and Queries became backbone" | temporal.io/blog | Agent communication without polling |
| "Actor model: agents always alive" | temporal.io/blog | No babysitting needed |
| "Parent can spawn 1000 children" | docs.temporal.io | Scale to 8:1000 easily |
| "Continue-as-New for unlimited" | community.temporal.io | Evolution never stops |

### Temporal Workflow Structure for HIVE/8

```typescript
// HIVEOrchestrator - Parent Workflow
import { defineWorkflow, defineSignal, defineQuery, proxyActivities } from '@temporalio/workflow';

// Define signals for phase completion
const hCompleteSignal = defineSignal<{ results: HuntResult[] }>('H_COMPLETE');
const iCompleteSignal = defineSignal<{ results: InterlockResult[] }>('I_COMPLETE');
const vCompleteSignal = defineSignal<{ results: ValidateResult[] }>('V_COMPLETE');
const eCompleteSignal = defineSignal<{ results: EvolveResult[] }>('E_COMPLETE');

// Define queries for state inspection (NO HUMAN NEEDED)
const getHIVEStateQuery = defineQuery<HIVEState>('getHIVEState');
const getActivePhaseQuery = defineQuery<'H' | 'I' | 'V' | 'E'>('getActivePhase');

interface HIVEConfig {
  scaling: '8:0001' | '8:0010' | '8:0100' | '8:1010';
  parallelism: number; // workflows per phase
  activitiesPerWorkflow: number;
  autoRetry: boolean; // true = no babysitting
}

export const HIVEOrchestrator = defineWorkflow({
  async run(config: HIVEConfig): Promise<HIVEResult> {
    const state: HIVEState = { phase: 'H', cycle: 0, results: [] };
    
    // Set up query handlers (for monitoring WITHOUT human intervention)
    setHandler(getHIVEStateQuery, () => state);
    setHandler(getActivePhaseQuery, () => state.phase);
    
    // Parse scaling config
    const { parallelism } = parseScaling(config.scaling);
    
    while (true) { // Strange Loop - Evolution never stops
      // HUNT PHASE (H) - Ports 0+7
      state.phase = 'H';
      const huntResults = await spawnPhaseWorkflows('H', parallelism, [0, 7]);
      
      // Wait for all Hunt workflows to complete via signal
      await condition(() => huntResults.every(r => r.complete));
      
      // INTERLOCK PHASE (I) - Ports 1+6
      state.phase = 'I';
      const interlockResults = await spawnPhaseWorkflows('I', parallelism, [1, 6]);
      await condition(() => interlockResults.every(r => r.complete));
      
      // VALIDATE PHASE (V) - Ports 2+5
      state.phase = 'V';
      const validateResults = await spawnPhaseWorkflows('V', parallelism, [2, 5]);
      await condition(() => validateResults.every(r => r.complete));
      
      // EVOLVE PHASE (E) - Ports 3+4
      state.phase = 'E';
      const evolveResults = await spawnPhaseWorkflows('E', parallelism, [3, 4]);
      await condition(() => evolveResults.every(r => r.complete));
      
      // FLIP - Check if we should continue to N+1
      state.cycle++;
      state.results.push({ cycle: state.cycle, huntResults, interlockResults, validateResults, evolveResults });
      
      // Continue-as-New to avoid event history limits
      if (state.cycle % 100 === 0) {
        return continueAsNew<typeof HIVEOrchestrator>(config);
      }
    }
  }
});

// Child workflow spawner - enables 8:1010 scaling
async function spawnPhaseWorkflows(
  phase: 'H' | 'I' | 'V' | 'E',
  parallelism: number,
  ports: number[]
): Promise<PhaseResult[]> {
  const futures = [];
  
  for (let i = 0; i < parallelism; i++) {
    for (const port of ports) {
      const future = startChildWorkflow(
        `${phase}PhaseWorker`,
        { phase, port, workflowIndex: i },
        {
          workflowId: `${phase}-${port}-${i}-${Date.now()}`,
          taskQueue: `port-${port}-queue`, // Each port has dedicated worker
          retryPolicy: { maximumAttempts: 3 }, // Auto-retry, no babysitting
        }
      );
      futures.push(future);
    }
  }
  
  // Parallel execution - all workflows run simultaneously
  return Promise.all(futures);
}
```

---

## 🔷 CREWAI AGENT ARCHITECTURE (8 COMMANDERS)

### Source: Tavily Research

| Finding | Source | Implication |
|---------|--------|-------------|
| "72% of enterprise AI projects now involve multi-agent" | digitalapplied.com | Industry standard |
| "human_input flag for human-in-the-loop" | crewai docs | Set to False for no babysitting |
| "Process.hierarchical for manager delegation" | crewai docs | Spider Sovereign as manager |
| "Process.parallel for concurrent execution" | crewai docs | HIVE phases can run parallel |

### CrewAI Commander Definitions

```python
from crewai import Agent, Task, Crew, Process

# THE 8 LEGENDARY COMMANDERS AS CREWAI AGENTS
# Note: human_input=False on ALL agents = no babysitting

port_0_lidless = Agent(
    role="Lidless Legion - Observer",
    goal="SENSE exemplars from memory bank and web",
    backstory="The ever-watchful eye that perceives without interpretation",
    verbose=False,  # Reduce noise
    allow_delegation=False,  # Focused on sensing
    human_input=False,  # NO BABYSITTING
    tools=[tavily_search, memory_bank_search, file_read]
)

port_1_weaver = Agent(
    role="Web Weaver - Bridger", 
    goal="FUSE contracts and write failing tests (TDD RED)",
    backstory="Connects pieces via polymorphic adapters",
    verbose=False,
    allow_delegation=True,  # Can delegate to Kraken for storage
    human_input=False,
    tools=[zod_schema_generator, test_writer, contract_validator]
)

port_2_magus = Agent(
    role="Mirror Magus - Shaper",
    goal="SHAPE data transformations and make tests pass (TDD GREEN)",
    backstory="Operates in higher-dimensional manifold",
    verbose=False,
    allow_delegation=False,
    human_input=False,
    tools=[code_generator, test_runner, transform_validator]
)

port_3_storm = Agent(
    role="Spore Storm - Injector",
    goal="DELIVER outputs via HIVE/8 Obsidian Hourglass FSM clutch",
    backstory="Spreads results across the system",
    verbose=False,
    allow_delegation=False,
    human_input=False,
    tools=[blackboard_emitter, event_dispatcher, workflow_trigger]
)

port_4_regnant = Agent(
    role="Red Regnant - Disruptor",
    goal="TEST properties with fast-check, evolve via Red Queen",
    backstory="Running just to stay in place - continuous evolution",
    verbose=False,
    allow_delegation=False,
    human_input=False,
    tools=[property_tester, mutation_tester, evolution_suggester]
)

port_5_pyre = Agent(
    role="Pyre Praetorian - Immunizer",
    goal="DEFEND via G0-G11 hard gates, no escape hatches",
    backstory="Forgiveness architecture - quarantine invalid signals",
    verbose=False,
    allow_delegation=False,
    human_input=False,
    tools=[gate_validator, quarantine_manager, violation_detector]
)

port_6_kraken = Agent(
    role="Kraken Keeper - Assimilator",
    goal="STORE to memory bank, test registry persistence",
    backstory="Memory mining imperative - nothing is forgotten",
    verbose=False,
    allow_delegation=False,
    human_input=False,
    tools=[duckdb_writer, blackboard_appender, memory_query]
)

port_7_spider = Agent(
    role="Spider Sovereign - Navigator",
    goal="DECIDE strategic direction, orchestrate HIVE phases",
    backstory="The spider weaves the web that weaves the spider",
    verbose=False,
    allow_delegation=True,  # MANAGER - delegates to all
    human_input=False,
    tools=[strategy_planner, phase_orchestrator, priority_ranker]
)

# HIVE/8 CREW - Hierarchical Process with Spider as Manager
hive_crew = Crew(
    agents=[
        port_7_spider,   # Manager (delegator)
        port_0_lidless,  # H-phase
        port_1_weaver,   # I-phase
        port_6_kraken,   # I-phase
        port_2_magus,    # V-phase
        port_5_pyre,     # V-phase
        port_3_storm,    # E-phase
        port_4_regnant,  # E-phase
    ],
    tasks=[hunt_task, interlock_task, validate_task, evolve_task],
    process=Process.hierarchical,  # Spider Sovereign manages
    manager_agent=port_7_spider,
    verbose=False,  # No noise
    # CRITICAL: No human input anywhere
)

# Run without babysitting
result = hive_crew.kickoff(inputs={"cycle": 1, "target": "gesture-pipeline"})
```

---

## 🔷 NO-BABYSITTING CHECKLIST

| Component | Setting | Why |
|-----------|---------|-----|
| **Temporal Workflows** | `retryPolicy.maximumAttempts = 3` | Auto-retry on failure |
| **Temporal Activities** | `startToCloseTimeout = '5m'` | Timeout, don't hang |
| **Temporal Signals** | Use signals for coordination | No polling humans |
| **Temporal Queries** | Use queries for state | Inspect without interrupting |
| **CrewAI Agents** | `human_input=False` | No asking for clarification |
| **CrewAI Process** | `Process.hierarchical` | Manager delegates, no human |
| **Pyre Praetorian** | Auto-quarantine violations | No human review needed |
| **Blackboard** | Append-only stigmergy | Async coordination |
| **Continue-as-New** | Every 100 cycles | Unlimited evolution |

---

## 🔷 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Current - I-Phase)
- [x] Pipeline trade study complete
- [x] Hexagonal CDD spec (25 EARS requirements)
- [x] Port contracts defined (ports.ts)
- [x] Initial adapters implemented
- [ ] **NEW**: Add Temporal port contract
- [ ] **NEW**: Add CrewAI commander interfaces

### Phase 2: Task Factory (V-Phase)
- [ ] Implement HIVEOrchestrator workflow
- [ ] Implement 8 worker configurations
- [ ] Implement child workflow spawner
- [ ] Test 8:0010 scaling (800 ops)

### Phase 3: AI Swarm (E-Phase)
- [ ] Integrate CrewAI with Temporal
- [ ] Define 8 commander tools
- [ ] Implement auto-composition logic
- [ ] Test 8:1010 scaling (80,800 ops)

### Phase 4: Production (N+1 Hunt)
- [ ] Deploy Temporal server
- [ ] Configure 8 worker queues
- [ ] Monitor via Temporal UI
- [ ] Achieve 24/7 autonomous operation

---

## 📋 NEW PORT CONTRACTS NEEDED

### TemporalOrchestratorPort

```typescript
export interface TemporalOrchestratorPort {
  /**
   * Start a HIVE cycle with given scaling
   */
  startCycle(config: HIVEConfig): Promise<string>; // Returns workflow ID
  
  /**
   * Query current state (no human needed)
   */
  getState(workflowId: string): Promise<HIVEState>;
  
  /**
   * Signal phase completion
   */
  signalPhaseComplete(workflowId: string, phase: 'H' | 'I' | 'V' | 'E', results: unknown): Promise<void>;
  
  /**
   * Spawn child workflows for a phase
   */
  spawnPhaseWorkflows(phase: 'H' | 'I' | 'V' | 'E', parallelism: number): Promise<string[]>;
}
```

### CrewCommanderPort

```typescript
export interface CrewCommanderPort {
  /**
   * Port number (0-7)
   */
  readonly port: number;
  
  /**
   * HIVE phase this commander operates in
   */
  readonly hivePhase: 'H' | 'I' | 'V' | 'E';
  
  /**
   * Execute commander's primary verb
   */
  execute(input: unknown): Promise<unknown>;
  
  /**
   * Get commander status (for monitoring)
   */
  getStatus(): CommanderStatus;
  
  /**
   * NO HUMAN INPUT - commander decides autonomously
   */
  readonly humanInput: false;
}
```

---

## 📝 Blackboard Signal

```json
{"ts":"2025-12-30T00:00:00Z","mark":1.0,"pull":"downstream","msg":"INTERLOCK: AI_SWARM_DURABLE_WORKFLOW_SPEC.md created - Temporal + CrewAI architecture, 8:1010 scaling, no-babysitting checklist","type":"event","hive":"I","gen":87,"port":1}
```

---

## 🔗 TAVILY SOURCES

1. **Temporal.io**: https://temporal.io/blog/orchestrating-ambient-agents-with-temporal
2. **Temporal Parallel**: https://www.danielcorin.com/til/temporal/parallel-child-workflows/
3. **CrewAI vs AutoGen**: https://medium.com/@kanerika/crewai-vs-autogen
4. **Multi-Agent 2025**: https://www.digitalapplied.com/blog/ai-agent-orchestration-workflows-guide
5. **Hexagonal AI**: https://medium.com/@martia_es/applying-hexagonal-architecture-in-ai-agent-development
6. **AWS Hexagonal**: https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/

---

*The spider weaves the web that weaves the spider.*  
*Gen87.X3 INTERLOCK Phase | 2025-12-30*
