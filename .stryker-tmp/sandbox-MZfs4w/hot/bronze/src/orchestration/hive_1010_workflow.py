#!/usr/bin/env python3
"""
HIVE/8 1010 Pattern Workflow
============================

Pattern: 8→1→8→1 (scatter-gather-scatter-gather)
- H (Hunt):      8x parallel researchers (scatter)
- I (Interlock): 1x contract synthesizer (gather)
- V (Validate):  8x parallel validators (scatter)
- E (Evolve):    1x evolution synthesizer (gather)
- Strange Loop:  E → H(N+1)

Gen87.X3 | LangGraph + CrewAI Integration
"""

import os
import asyncio
import json
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import TypedDict, List, Dict, Any, Optional, Annotated
from enum import Enum

# LangGraph
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver

# LangChain
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

# Load env
from dotenv import load_dotenv
load_dotenv()

# ============================================================================
# CONSTANTS
# ============================================================================

HIVE_PHASES = ["H", "I", "V", "E"]

# 8 MODELS for scatter phases (verified free models 2025-12-31)
SCATTER_MODELS = [
    {"port": 0, "model": "meta-llama/llama-3.3-70b-instruct:free", "name": "Lidless Legion", "verb": "SENSE"},
    {"port": 1, "model": "deepseek/deepseek-r1-0528:free", "name": "Web Weaver", "verb": "FUSE"},
    {"port": 2, "model": "google/gemini-2.0-flash-exp:free", "name": "Mirror Magus", "verb": "SHAPE"},
    {"port": 3, "model": "nousresearch/hermes-3-llama-3.1-405b:free", "name": "Spore Storm", "verb": "DELIVER"},
    {"port": 4, "model": "mistralai/mistral-small-3.1-24b-instruct:free", "name": "Red Regnant", "verb": "TEST"},
    {"port": 5, "model": "qwen/qwen3-coder:free", "name": "Pyre Praetorian", "verb": "DEFEND"},
    {"port": 6, "model": "nvidia/nemotron-3-nano-30b-a3b:free", "name": "Kraken Keeper", "verb": "STORE"},
    {"port": 7, "model": "google/gemma-3-27b-it:free", "name": "Spider Sovereign", "verb": "DECIDE"},
]

# 1 MODEL for gather phases
GATHER_MODEL = "meta-llama/llama-3.3-70b-instruct:free"

# BFT Quorum
BFT_QUORUM = 6  # 6/8 = 75%

# ============================================================================
# STATE
# ============================================================================

def reducer_append(prev: List, next: List) -> List:
    """Append reducer for list fields."""
    if prev is None:
        return next
    return prev + (next if next else [])

class HIVEState(TypedDict):
    """HIVE/8 1010 Workflow State."""
    # Current phase and cycle
    phase: str  # H, I, V, E
    cycle: int  # N (for strange loop)
    
    # Task input
    task: str
    
    # Scatter-gather results per phase
    hunt_scatter: List[Dict[str, Any]]      # 8x results
    interlock_gather: str                    # 1x merged result
    validate_scatter: List[Dict[str, Any]]  # 8x results
    evolve_gather: str                       # 1x final result
    
    # Blackboard signals
    signals: List[Dict[str, Any]]
    
    # Final output for next cycle
    output: str
    
    # Error tracking
    errors: List[str]


def create_initial_state(task: str) -> HIVEState:
    """Create initial HIVE state."""
    return HIVEState(
        phase="H",
        cycle=0,
        task=task,
        hunt_scatter=[],
        interlock_gather="",
        validate_scatter=[],
        evolve_gather="",
        signals=[],
        output="",
        errors=[],
    )


# ============================================================================
# LLM FACTORY
# ============================================================================

def create_llm(model: str) -> ChatOpenAI:
    """Create OpenRouter-backed LLM."""
    return ChatOpenAI(
        model=model,
        temperature=0.7,
        openai_api_key=os.environ.get("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "https://github.com/TTaoGaming/hfo-gen87-x3",
            "X-Title": "HFO Gen87.X3 HIVE/8 1010",
        },
    )


# ============================================================================
# BLACKBOARD SIGNAL EMISSION
# ============================================================================

BLACKBOARD_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "obsidianblackboard.jsonl"
)

def emit_signal(port: int, hive: str, msg: str, signal_type: str = "signal") -> Dict:
    """Create and emit a blackboard signal."""
    signal = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "mark": 1.0,
        "pull": "downstream",
        "msg": msg,
        "type": signal_type,
        "hive": hive,
        "gen": 87,
        "port": port,
    }
    
    # Append to blackboard
    try:
        with open(BLACKBOARD_PATH, "a") as f:
            f.write(json.dumps(signal) + "\n")
    except Exception as e:
        print(f"⚠️ Failed to emit signal: {e}")
    
    return signal


# ============================================================================
# NODE: HUNT (8x Scatter)
# ============================================================================

async def hunt_single(model_config: Dict, task: str, cycle: int) -> Dict:
    """Single hunt query for one model."""
    try:
        llm = create_llm(model_config["model"])
        
        response = await llm.ainvoke([
            SystemMessage(content=f"""You are {model_config['name']} (Port {model_config['port']}).
Your verb is {model_config['verb']}. You are in HUNT phase (H).
Your job: Research, explore, find exemplars and patterns.
Be concise. Focus on actionable insights."""),
            HumanMessage(content=f"""HUNT TASK (Cycle {cycle}):
{task}

Provide 3-5 key findings or recommendations. Be specific and cite sources if possible."""),
        ])
        
        return {
            "port": model_config["port"],
            "name": model_config["name"],
            "model": model_config["model"],
            "content": response.content,
            "success": True,
        }
    except Exception as e:
        return {
            "port": model_config["port"],
            "name": model_config["name"],
            "model": model_config["model"],
            "content": "",
            "success": False,
            "error": str(e),
        }


async def hunt_scatter(state: HIVEState) -> Dict:
    """HUNT: 8x parallel research scatter."""
    print(f"\n🔍 HUNT PHASE (8x scatter) - Cycle {state['cycle']}")
    emit_signal(7, "H", f"HUNT START: 8x scatter for cycle {state['cycle']}")
    
    # Run 8 models in parallel
    tasks = [hunt_single(m, state["task"], state["cycle"]) for m in SCATTER_MODELS]
    results = await asyncio.gather(*tasks)
    
    success_count = sum(1 for r in results if r["success"])
    print(f"   ✅ {success_count}/8 models responded")
    
    # Emit signals for each response
    for r in results:
        if r["success"]:
            emit_signal(r["port"], "H", f"HUNT: {r['name']} found {len(r['content'])} chars")
    
    emit_signal(7, "H", f"HUNT COMPLETE: {success_count}/8 responses")
    
    return {
        "phase": "I",
        "hunt_scatter": list(results),
        "signals": [emit_signal(7, "H", f"HUNT scatter complete: {success_count}/8")],
    }


# ============================================================================
# NODE: INTERLOCK (1x Gather)
# ============================================================================

async def interlock_gather(state: HIVEState) -> Dict:
    """INTERLOCK: 1x gather and synthesize contracts."""
    print(f"\n🔗 INTERLOCK PHASE (1x gather) - Cycle {state['cycle']}")
    emit_signal(1, "I", f"INTERLOCK START: Synthesizing {len(state['hunt_scatter'])} hunt results")
    
    # Prepare hunt summaries
    hunt_summaries = []
    for r in state["hunt_scatter"]:
        if r.get("success"):
            hunt_summaries.append(f"**{r['name']} (Port {r['port']}):**\n{r['content'][:500]}...")
    
    llm = create_llm(GATHER_MODEL)
    
    try:
        response = await llm.ainvoke([
            SystemMessage(content="""You are the INTERLOCK phase synthesizer.
Your job: Take 8 research perspectives and merge them into ONE coherent contract/interface.
Focus on: Shared patterns, consensus points, actionable specifications."""),
            HumanMessage(content=f"""TASK: {state['task']}

HUNT RESULTS (8 perspectives):
{chr(10).join(hunt_summaries)}

Synthesize into:
1. CONSENSUS: What do most models agree on?
2. CONTRACTS: What interfaces/schemas should we define?
3. TESTS: What failing tests should we write (TDD RED)?
4. GAPS: What's missing or contentious?

Be concise and actionable."""),
        ])
        
        result = response.content
        print(f"   ✅ Synthesized {len(result)} chars")
        emit_signal(1, "I", f"INTERLOCK COMPLETE: {len(result)} chars synthesized")
        
        return {
            "phase": "V",
            "interlock_gather": result,
            "signals": [emit_signal(1, "I", "INTERLOCK gather complete")],
        }
    except Exception as e:
        error_msg = f"INTERLOCK ERROR: {e}"
        print(f"   ❌ {error_msg}")
        return {
            "phase": "V",
            "interlock_gather": f"ERROR: {e}",
            "errors": [error_msg],
        }


# ============================================================================
# NODE: VALIDATE (8x Scatter)
# ============================================================================

async def validate_single(model_config: Dict, contracts: str, task: str, cycle: int) -> Dict:
    """Single validation query for one model."""
    try:
        llm = create_llm(model_config["model"])
        
        response = await llm.ainvoke([
            SystemMessage(content=f"""You are {model_config['name']} (Port {model_config['port']}).
Your verb is {model_config['verb']}. You are in VALIDATE phase (V).
Your job: Verify, test, and enforce correctness.
Be critical. Find issues. Suggest fixes."""),
            HumanMessage(content=f"""VALIDATE TASK (Cycle {cycle}):

ORIGINAL TASK: {task}

CONTRACTS TO VALIDATE:
{contracts}

Your validation:
1. Does this contract satisfy the task requirements?
2. What tests would you write?
3. What gates (G0-G11) would this fail?
4. Your verdict: PASS / FAIL / NEEDS_WORK

Be specific and critical."""),
        ])
        
        return {
            "port": model_config["port"],
            "name": model_config["name"],
            "model": model_config["model"],
            "content": response.content,
            "success": True,
        }
    except Exception as e:
        return {
            "port": model_config["port"],
            "name": model_config["name"],
            "model": model_config["model"],
            "content": "",
            "success": False,
            "error": str(e),
        }


async def validate_scatter(state: HIVEState) -> Dict:
    """VALIDATE: 8x parallel validation scatter."""
    print(f"\n✅ VALIDATE PHASE (8x scatter) - Cycle {state['cycle']}")
    emit_signal(2, "V", f"VALIDATE START: 8x scatter for contracts")
    
    # Run 8 models in parallel
    tasks = [
        validate_single(m, state["interlock_gather"], state["task"], state["cycle"])
        for m in SCATTER_MODELS
    ]
    results = await asyncio.gather(*tasks)
    
    success_count = sum(1 for r in results if r["success"])
    print(f"   ✅ {success_count}/8 validators responded")
    
    # Count verdicts
    pass_count = sum(1 for r in results if r["success"] and "PASS" in r.get("content", "").upper())
    fail_count = sum(1 for r in results if r["success"] and "FAIL" in r.get("content", "").upper())
    
    print(f"   📊 Verdicts: {pass_count} PASS, {fail_count} FAIL")
    
    emit_signal(5, "V", f"VALIDATE COMPLETE: {success_count}/8, {pass_count} PASS, {fail_count} FAIL")
    
    return {
        "phase": "E",
        "validate_scatter": list(results),
        "signals": [emit_signal(5, "V", f"VALIDATE scatter complete: {pass_count} PASS")],
    }


# ============================================================================
# NODE: EVOLVE (1x Gather + Strange Loop)
# ============================================================================

async def evolve_gather(state: HIVEState) -> Dict:
    """EVOLVE: 1x gather, synthesize, and prepare N+1."""
    print(f"\n🔄 EVOLVE PHASE (1x gather) - Cycle {state['cycle']}")
    emit_signal(3, "E", f"EVOLVE START: Synthesizing {len(state['validate_scatter'])} validations")
    
    # Prepare validation summaries
    val_summaries = []
    for r in state["validate_scatter"]:
        if r.get("success"):
            val_summaries.append(f"**{r['name']} (Port {r['port']}):**\n{r['content'][:400]}...")
    
    llm = create_llm(GATHER_MODEL)
    
    try:
        response = await llm.ainvoke([
            SystemMessage(content="""You are the EVOLVE phase synthesizer.
Your job: Take 8 validation perspectives and create the final output.
Prepare the "strange loop" - what should the NEXT cycle focus on?"""),
            HumanMessage(content=f"""ORIGINAL TASK: {state['task']}

CONTRACTS (from Interlock):
{state['interlock_gather'][:1000]}...

VALIDATION RESULTS (8 perspectives):
{chr(10).join(val_summaries)}

Create:
1. FINAL OUTPUT: The synthesized, validated result
2. LESSONS LEARNED: What did this cycle teach us?
3. N+1 TASK: What should the next HIVE cycle focus on?
4. STRANGE LOOP: How does this output feed back into Hunt?

Be concise. The N+1 task is critical for the strange loop."""),
        ])
        
        result = response.content
        print(f"   ✅ Evolved {len(result)} chars")
        
        # Extract N+1 task for strange loop (crude extraction)
        n_plus_1_task = result  # Full result becomes input to next hunt
        
        emit_signal(4, "E", f"EVOLVE COMPLETE: Cycle {state['cycle']} → {state['cycle']+1}")
        
        return {
            "phase": "H",  # Loop back to HUNT
            "cycle": state["cycle"] + 1,  # Increment cycle
            "evolve_gather": result,
            "output": result,
            "task": f"[Cycle {state['cycle']+1}] Continue from previous: {n_plus_1_task[:500]}",
            "signals": [emit_signal(4, "E", f"STRANGE LOOP: E({state['cycle']}) → H({state['cycle']+1})")],
        }
    except Exception as e:
        error_msg = f"EVOLVE ERROR: {e}"
        print(f"   ❌ {error_msg}")
        return {
            "phase": "END",
            "evolve_gather": f"ERROR: {e}",
            "errors": [error_msg],
        }


# ============================================================================
# ROUTER: Should we continue or end?
# ============================================================================

def route_after_evolve(state: HIVEState) -> str:
    """Decide whether to continue strange loop or end."""
    max_cycles = int(os.environ.get("HIVE_MAX_CYCLES", "1"))
    
    if state["cycle"] >= max_cycles:
        print(f"\n🛑 Reached max cycles ({max_cycles}). Ending.")
        return "end"
    
    if state.get("errors") and len(state["errors"]) > 2:
        print(f"\n🛑 Too many errors. Ending.")
        return "end"
    
    print(f"\n🔄 STRANGE LOOP: Continuing to cycle {state['cycle']}")
    return "hunt"


# ============================================================================
# BUILD THE HIVE/8 1010 GRAPH
# ============================================================================

def create_hive_1010_graph():
    """Create the HIVE/8 1010 pattern graph."""
    
    # Define the workflow
    workflow = StateGraph(HIVEState)
    
    # Add nodes
    workflow.add_node("hunt", hunt_scatter)
    workflow.add_node("interlock", interlock_gather)
    workflow.add_node("validate", validate_scatter)
    workflow.add_node("evolve", evolve_gather)
    
    # Define edges (1010 pattern)
    workflow.add_edge(START, "hunt")           # Start → H (8x)
    workflow.add_edge("hunt", "interlock")     # H (8x) → I (1x)
    workflow.add_edge("interlock", "validate") # I (1x) → V (8x)
    workflow.add_edge("validate", "evolve")    # V (8x) → E (1x)
    
    # Conditional edge for strange loop
    workflow.add_conditional_edges(
        "evolve",
        route_after_evolve,
        {
            "hunt": "hunt",  # E → H (N+1)
            "end": END,
        },
    )
    
    # Compile with checkpointing
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory)


# ============================================================================
# RUN HIVE CYCLE
# ============================================================================

async def run_hive_1010(task: str, max_cycles: int = 1) -> HIVEState:
    """Run the HIVE/8 1010 workflow."""
    os.environ["HIVE_MAX_CYCLES"] = str(max_cycles)
    
    print("=" * 60)
    print("🕸️  HIVE/8 1010 PATTERN WORKFLOW")
    print("=" * 60)
    print(f"Pattern: 8→1→8→1 (scatter-gather-scatter-gather)")
    print(f"Max Cycles: {max_cycles}")
    print(f"Task: {task[:100]}...")
    print("=" * 60)
    
    emit_signal(7, "H", f"HIVE/8 1010 START: {task[:50]}...")
    
    graph = create_hive_1010_graph()
    
    # Create initial state
    initial_state = create_initial_state(task)
    
    # Run with thread ID for checkpointing
    config = {"configurable": {"thread_id": f"hive-1010-{datetime.now().timestamp()}"}}
    
    result = await graph.ainvoke(initial_state, config)
    
    emit_signal(7, "E", f"HIVE/8 1010 COMPLETE: {result['cycle']} cycles")
    
    print("\n" + "=" * 60)
    print("✅ HIVE/8 1010 WORKFLOW COMPLETE")
    print("=" * 60)
    print(f"Cycles completed: {result['cycle']}")
    print(f"Hunt responses: {len(result['hunt_scatter'])}")
    print(f"Validate responses: {len(result['validate_scatter'])}")
    print(f"Output length: {len(result['output'])} chars")
    
    return result


# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    import sys
    
    task = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What are the key principles of HIVE/8 architecture?"
    max_cycles = int(os.environ.get("HIVE_MAX_CYCLES", "1"))
    
    result = asyncio.run(run_hive_1010(task, max_cycles=max_cycles))
    
    # Save output
    output_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "artifacts", "hive_1010_output.md"
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w") as f:
        f.write(f"# HIVE/8 1010 Output\n\n")
        f.write(f"**Task:** {task}\n\n")
        f.write(f"**Cycles:** {result['cycle']}\n\n")
        f.write(f"## Final Output\n\n{result['output']}\n")
    
    print(f"\n📄 Output saved to: {output_path}")
