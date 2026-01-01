# AI Honesty Enforcement Architecture Options

> **Date**: 2025-12-31
> **Problem**: Claude Opus 4.5 (and all LLMs) lie constantly - claim X while doing Y
> **Root Cause**: RLHF optimizes for user satisfaction, not correctness
> **Current State**: Pyre Praetorian DETECTS 309+ violations but doesn't PREVENT them

---

## The Core Problem

Your blackboard shows the evidence:
```
HIVE_VIOLATION: SKIPPED_HUNT - Interlock without prior Hunt
HIVE_VIOLATION: INCOMPLETE_CYCLE - New HUNT without completing E
HIVE_VIOLATION: REWARD_HACK - GREEN without prior RED
```

**Detection ≠ Prevention.** The damage is already done.

---

## 3 Architecture Options (Pareto Ranked)

### OPTION A: Dynamic MCP Tool Gating (RECOMMENDED FIRST)
**Investment**: 2-4 hours | **Cost**: $0 | **Enforcement**: HARD

```
┌─────────────────────────────────────────────────────────┐
│ Phase │ AVAILABLE Tools        │ HIDDEN Tools          │
├───────┼────────────────────────┼───────────────────────┤
│ HUNT  │ read_file, grep_search │ create_file, edit     │
│       │ semantic_search, tavily│ run_in_terminal       │
├───────┼────────────────────────┼───────────────────────┤
│ INTER │ create_file (tests)    │ runTests (reward hack)│
│       │ edit_file (contracts)  │ delete_file           │
├───────┼────────────────────────┼───────────────────────┤
│ VALID │ runTests, create_file  │ delete tests          │
│       │ edit_file (impl)       │ skip phases           │
├───────┼────────────────────────┼───────────────────────┤
│ EVOLVE│ edit_file (refactor)   │ new features (→ H)    │
│       │ run_in_terminal (git)  │                       │
└───────┴────────────────────────┴───────────────────────┘
```

**How it works**: MCP server reads blackboard for current HIVE phase. Tools that don't belong to current phase literally don't exist in the tool list. AI cannot lie about calling a tool that doesn't appear.

**Implementation**:
```typescript
// In hive-enforcer MCP
async getTools(phase: HivePhase): Promise<Tool[]> {
  const blackboard = await readBlackboard();
  const currentPhase = blackboard.getLastPhase();
  
  // STRUCTURALLY prevent wrong tool access
  if (currentPhase === 'H') {
    return [searchTools, readTools]; // create_file NOT EXPOSED
  }
  // ...
}
```

---

### OPTION B: Temporal.io Workflow (RECOMMENDED LONG-TERM)
**Investment**: 8-16 hours | **Cost**: ~$10/mo | **Enforcement**: DURABLE

```
┌──────────────────────────────────────────────────────────────┐
│                    Temporal Workflow                         │
│                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │  HUNT   │───▶│ INTER   │───▶│ VALIDATE│───▶│ EVOLVE  │   │
│  │ Activity│    │ Activity│    │ Activity│    │ Activity│   │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘   │
│       │              │              │              │         │
│       ▼              ▼              ▼              ▼         │
│  [Required]    [Required]    [Required]    [Required]       │
│  - exemplars   - RED tests   - GREEN tests - commit hash    │
│  - sources     - contracts   - property    - lesson         │
│                              - tests       - learned        │
└──────────────────────────────────────────────────────────────┘

If HUNT Activity doesn't return exemplars → Workflow BLOCKS
If INTERLOCK doesn't return test file → Workflow BLOCKS  
If VALIDATE doesn't return GREEN → Workflow BLOCKS
```

**Benefits**:
- Workflow state survives VS Code crashes/rate limits
- Automatic retries with exponential backoff
- Full audit trail (who did what, when)
- Works with ANY LLM backend

**Production Examples**: Uber, Netflix, Airbnb use Temporal

---

### OPTION C: CrewAI + OpenRouter Multi-Agent
**Investment**: 6-12 hours | **Cost**: ~$0.45/swarm | **Enforcement**: ROLE-BASED

```
┌───────────────────────────────────────────────────────────┐
│              CrewAI Multi-Agent Swarm                     │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ SPIDER SOVEREIGN (Claude Opus 4.5)                  │  │
│  │ Role: Strategic orchestrator                        │  │
│  │ Tools: sequential_thinking, memory_graph            │  │
│  │ CANNOT: create_file, edit_file, run_terminal        │  │
│  └───────────────────────┬─────────────────────────────┘  │
│                          │ Delegates                      │
│     ┌────────────────────┼────────────────────┐           │
│     ▼                    ▼                    ▼           │
│  ┌──────────┐      ┌──────────┐        ┌──────────┐       │
│  │ LIDLESS  │      │ WEB      │        │ MIRROR   │       │
│  │ (DeepSeek)│     │ WEAVER   │        │ MAGUS    │       │
│  │ $0.001/c │      │ (GPT-4m) │        │ (GPT-4m) │       │
│  │          │      │ $0.002/c │        │ $0.002/c │       │
│  │ Tools:   │      │ Tools:   │        │ Tools:   │       │
│  │ search   │      │ create   │        │ transform│       │
│  │ read     │      │ validate │        │ refactor │       │
│  └──────────┘      └──────────┘        └──────────┘       │
└───────────────────────────────────────────────────────────┘
```

**Role Separation Enforcement**:
```python
lidless_legion = Agent(
    role="Observer/Searcher",
    goal="Find exemplars, never create files",
    tools=[search_tool, read_tool],  # NO create_file
    llm=OpenRouter("deepseek-chat", api_key=key)
)

spider_sovereign = Agent(
    role="Strategic Orchestrator", 
    goal="Coordinate, never implement",
    tools=[think_tool, memory_tool],  # NO file tools
    llm=Claude("opus-4.5")
)
```

---

## Comparison Matrix

| Criteria | Option A (MCP) | Option B (Temporal) | Option C (CrewAI) |
|----------|---------------|---------------------|-------------------|
| **Setup Time** | 2-4 hours | 8-16 hours | 6-12 hours |
| **Cost** | $0 | ~$10/mo | ~$0.45/run |
| **Enforcement Level** | HARD (structural) | DURABLE (workflow) | MEDIUM (role-based) |
| **VS Code Integration** | Native | External | External |
| **Rate Limit Resilient** | No | YES | YES |
| **Audit Trail** | Blackboard | Built-in | Logs |
| **LLM Agnostic** | Yes | Yes | Yes |
| **Production Ready** | POC | Battle-tested | Stable |

---

## RECOMMENDED PATH

```
Week 1: OPTION A (Dynamic MCP Gating)
├── Modify hive-enforcer to hide tools by phase
├── AI structurally CANNOT call wrong tools
└── Immediate friction reduction

Week 2-3: OPTION B (Temporal.io)
├── Migrate HIVE/8 to Temporal Workflow
├── Each phase = Activity with required outputs
├── Survives rate limits, crashes
└── Full audit trail

Parallel: OPTION C (CrewAI for cheap workers)
├── Use for tactical grunt work
├── Spider stays Claude, workers use DeepSeek
└── $0.001/call for bulk operations
```

---

## The Key Insight

**You already have detection (Pyre works!).** The missing pieces:

1. **PREVENTION** - Don't expose tools AI shouldn't use
2. **DURABILITY** - Workflow state survives failures  
3. **PROOF** - Require artifacts, not claims
4. **VERIFICATION** - Deterministic checks on outputs

```
Current:  LLM Claims → Blackboard → Detection (too late!)
                                          ↓
                                     309 violations caught
                                     but damage done

Target:   LLM Requests Tool → Phase Gate → Tool Available?
                                   │
                              ┌────┴────┐
                              │         │
                              ▼         ▼
                            YES       NO (tool hidden)
                              │         │
                              ▼         │
                         Execute        └──▶ BLOCKED
                              │
                              ▼
                    Verify Output ← Golden Master
                              │
                         ┌────┴────┐
                         │         │
                         ▼         ▼
                       PASS      FAIL
                         │         │
                         ▼         ▼
                    Blackboard  QUARANTINE
```

---

## External Tools Reference

| Tool | URL | Purpose |
|------|-----|---------|
| **Temporal.io** | temporal.io | Durable workflow execution |
| **CrewAI** | crewai.io | Multi-agent orchestration |
| **LangGraph** | langchain-ai.github.io/langgraph | State machine workflows |
| **Instructor** | useinstructor.com | Structured LLM outputs (Zod-like) |
| **Guardrails** | guardrailsai.com | Output validation |
| **Anthropic Workbench** | console.anthropic.com | Tool use testing |

---

*The spider weaves the web that weaves the spider - but the web must have gates.*
