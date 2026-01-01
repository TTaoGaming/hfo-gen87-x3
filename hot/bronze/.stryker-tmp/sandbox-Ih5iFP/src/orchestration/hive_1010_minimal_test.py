#!/usr/bin/env python3
"""
HIVE/8 1010 Pattern - MINIMAL TEST
==================================

Simplified version to validate LangGraph workflow before scaling to 8 models.
Uses 2 models, synchronous calls, explicit timeouts.
"""

import os
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Annotated
import operator

# LangGraph
from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages

# LangChain  
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

# Load env
from dotenv import load_dotenv
load_dotenv()

print("✅ All imports successful")

# ============================================================================
# STATE (Using Annotated pattern for LangGraph 1.0+)
# ============================================================================

class HIVEState(dict):
    """HIVE/8 State using dict for LangGraph compatibility."""
    pass

# ============================================================================
# LLM FACTORY WITH TIMEOUT
# ============================================================================

def create_llm(model: str = "meta-llama/llama-3.3-70b-instruct:free") -> ChatOpenAI:
    """Create OpenRouter-backed LLM with timeout."""
    api_key = os.environ.get("OPENROUTER_API_KEY")
    print(f"   Using API key: {api_key[:20] if api_key else 'MISSING'}...")
    
    return ChatOpenAI(
        model=model,
        temperature=0.7,
        openai_api_key=api_key,
        openai_api_base="https://openrouter.ai/api/v1",
        request_timeout=30,  # 30 second timeout
        max_retries=1,
        default_headers={
            "HTTP-Referer": "https://github.com/TTaoGaming/hfo-gen87-x3",
            "X-Title": "HFO Gen87.X3 HIVE/8",
        },
    )

# ============================================================================
# NODE FUNCTIONS (Synchronous)
# ============================================================================

def hunt_node(state: dict) -> dict:
    """HUNT: Research phase (simplified - 1 model)."""
    print("\n🔍 HUNT PHASE")
    print(f"   Task: {state.get('task', 'No task')[:50]}...")
    
    try:
        llm = create_llm()
        response = llm.invoke([
            SystemMessage(content="You are a researcher. Be concise."),
            HumanMessage(content=f"Research this in 3 bullet points: {state.get('task', '')}"),
        ])
        result = response.content
        print(f"   ✅ Got {len(result)} chars")
    except Exception as e:
        result = f"ERROR: {e}"
        print(f"   ❌ {e}")
    
    return {
        **state,
        "phase": "I",
        "hunt_result": result,
    }

def interlock_node(state: dict) -> dict:
    """INTERLOCK: Synthesize contracts (1 model)."""
    print("\n🔗 INTERLOCK PHASE")
    print(f"   Hunt result: {state.get('hunt_result', 'None')[:50]}...")
    
    try:
        llm = create_llm()
        response = llm.invoke([
            SystemMessage(content="You are a contract designer. Define interfaces."),
            HumanMessage(content=f"Based on this research, define 2 contracts:\n{state.get('hunt_result', '')}"),
        ])
        result = response.content
        print(f"   ✅ Got {len(result)} chars")
    except Exception as e:
        result = f"ERROR: {e}"
        print(f"   ❌ {e}")
    
    return {
        **state,
        "phase": "V",
        "interlock_result": result,
    }

def validate_node(state: dict) -> dict:
    """VALIDATE: Verify correctness (1 model)."""
    print("\n✅ VALIDATE PHASE")
    print(f"   Contracts: {state.get('interlock_result', 'None')[:50]}...")
    
    try:
        llm = create_llm()
        response = llm.invoke([
            SystemMessage(content="You are a validator. Be critical."),
            HumanMessage(content=f"Validate these contracts. Say PASS or FAIL with reason:\n{state.get('interlock_result', '')}"),
        ])
        result = response.content
        print(f"   ✅ Got {len(result)} chars")
    except Exception as e:
        result = f"ERROR: {e}"
        print(f"   ❌ {e}")
    
    return {
        **state,
        "phase": "E",
        "validate_result": result,
    }

def evolve_node(state: dict) -> dict:
    """EVOLVE: Synthesize and prepare N+1."""
    print("\n🔄 EVOLVE PHASE")
    print(f"   Validation: {state.get('validate_result', 'None')[:50]}...")
    
    try:
        llm = create_llm()
        response = llm.invoke([
            SystemMessage(content="You are an evolution synthesizer. Prepare next cycle."),
            HumanMessage(content=f"""Synthesize:
TASK: {state.get('task', '')}
RESEARCH: {state.get('hunt_result', '')[:500]}
CONTRACTS: {state.get('interlock_result', '')[:500]}
VALIDATION: {state.get('validate_result', '')[:500]}

Output:
1. FINAL ANSWER (2 sentences)
2. N+1 TASK for next cycle"""),
        ])
        result = response.content
        print(f"   ✅ Got {len(result)} chars")
    except Exception as e:
        result = f"ERROR: {e}"
        print(f"   ❌ {e}")
    
    new_cycle = state.get("cycle", 0) + 1
    return {
        **state,
        "phase": "DONE",
        "cycle": new_cycle,
        "evolve_result": result,
        "output": result,
    }

# ============================================================================
# ROUTER
# ============================================================================

def should_continue(state: dict) -> str:
    """Decide whether to loop or end."""
    max_cycles = int(os.environ.get("HIVE_MAX_CYCLES", "1"))
    current_cycle = state.get("cycle", 0)
    
    if current_cycle >= max_cycles:
        print(f"\n🛑 Max cycles ({max_cycles}) reached")
        return "end"
    
    print(f"\n🔄 STRANGE LOOP → Cycle {current_cycle + 1}")
    return "hunt"

# ============================================================================
# BUILD GRAPH
# ============================================================================

def create_hive_graph():
    """Create the HIVE/8 workflow graph."""
    workflow = StateGraph(dict)  # Using dict for simplicity
    
    # Add nodes
    workflow.add_node("hunt", hunt_node)
    workflow.add_node("interlock", interlock_node)
    workflow.add_node("validate", validate_node)
    workflow.add_node("evolve", evolve_node)
    
    # Add edges (H → I → V → E)
    workflow.add_edge(START, "hunt")
    workflow.add_edge("hunt", "interlock")
    workflow.add_edge("interlock", "validate")
    workflow.add_edge("validate", "evolve")
    
    # Conditional edge for strange loop
    workflow.add_conditional_edges(
        "evolve",
        should_continue,
        {
            "hunt": "hunt",
            "end": END,
        },
    )
    
    return workflow.compile()

# ============================================================================
# MAIN
# ============================================================================

def run_hive_1010(task: str) -> dict:
    """Run the HIVE/8 1010 workflow."""
    print("=" * 60)
    print("🕸️  HIVE/8 1010 MINIMAL TEST")
    print("=" * 60)
    print(f"Task: {task}")
    print("=" * 60)
    
    graph = create_hive_graph()
    
    initial_state = {
        "task": task,
        "phase": "H",
        "cycle": 0,
    }
    
    result = graph.invoke(initial_state)
    
    print("\n" + "=" * 60)
    print("✅ HIVE/8 COMPLETE")
    print("=" * 60)
    print(f"Cycles: {result.get('cycle', 0)}")
    print(f"Output: {result.get('output', 'None')[:200]}...")
    
    return result


if __name__ == "__main__":
    import sys
    
    task = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What is HIVE/8?"
    
    result = run_hive_1010(task)
    
    # Save output
    output_path = "hot/bronze/artifacts/hive_1010_test_output.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2, default=str)
    print(f"\n📄 Saved to: {output_path}")
