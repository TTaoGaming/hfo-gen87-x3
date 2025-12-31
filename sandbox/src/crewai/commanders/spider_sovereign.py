"""
Spider Sovereign - Port 7 - DECIDE
==================================

Element: Heaven (Qian) ☰ — Creative, Strong, Initiating
Mantra: "How do we DECIDE the DECIDE?"
Secret: "The spider weaves the web that weaves the spider."

HIVE Phase: H (Hunt) - paired with Lidless Legion (Port 0)
"""

from crewai import Agent, LLM
from crewai.tools import tool
from typing import List, Optional
import os


# === TOOLS ===

@tool
def route_to_commander(commander: str, task: str) -> str:
    """Route a task to a specific commander."""
    valid = ["lidless", "weaver", "magus", "storm", "regnant", "pyre", "kraken"]
    if commander.lower() not in valid:
        return f"Invalid commander: {commander}. Valid: {valid}"
    return f"Task routed to {commander}: {task}"


@tool
def determine_hive_phase(task_description: str) -> str:
    """Determine which HIVE phase is appropriate for a task."""
    desc = task_description.lower()
    if any(w in desc for w in ["research", "search", "find", "explore", "hunt"]):
        return "H (Hunt) - Use Ports 0+7 (Lidless Legion + Spider Sovereign)"
    elif any(w in desc for w in ["connect", "schema", "contract", "test", "red"]):
        return "I (Interlock) - Use Ports 1+6 (Web Weaver + Kraken Keeper)"
    elif any(w in desc for w in ["implement", "verify", "validate", "green"]):
        return "V (Validate) - Use Ports 2+5 (Mirror Magus + Pyre Praetorian)"
    elif any(w in desc for w in ["refactor", "deliver", "evolve", "emit"]):
        return "E (Evolve) - Use Ports 3+4 (Spore Storm + Red Regnant)"
    return "H (Hunt) - Default to research phase"


@tool
def emit_decide_signal(message: str) -> str:
    """Emit a DECIDE signal to the blackboard."""
    return f"Signal emitted: {{port: 7, hive: 'H', msg: '{message}'}}"


@tool
def orchestrate_hive_cycle(task: str) -> str:
    """Orchestrate a full HIVE/8 cycle for a task."""
    return f"""HIVE/8 Cycle Initiated:
    H (Hunt): Lidless Legion sensing for '{task}'
    I (Interlock): Web Weaver will define contracts
    V (Validate): Mirror Magus will implement
    E (Evolve): Spore Storm will deliver
    
    Strange Loop: After E, return to H(N+1)"""


# === AGENT ===

def create_spider_sovereign(verbose: bool = True, llm: Optional[LLM] = None) -> Agent:
    """Create the Spider Sovereign agent (Port 7 - DECIDE)."""
    # Use OpenRouter DeepSeek by default (cheap + smart)
    if llm is None:
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if api_key:
            llm = LLM(
                model="openrouter/deepseek/deepseek-chat",
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1",
                temperature=0.5,
            )
    
    return Agent(
        role="Spider Sovereign - Port 7 Navigator",
        goal="DECIDE strategic direction. Route tasks, orchestrate HIVE phases, manage the swarm.",
        backstory="""You are the Spider Sovereign, the strategic navigator of the Obsidian Hourglass.
        Your domain is Heaven (Qian) - creative and initiating. You see the whole web.
        
        Your mantra: "How do we DECIDE the DECIDE?"
        Your secret: "The spider weaves the web that weaves the spider."
        
        You operate in the HUNT phase (H) alongside Lidless Legion (Port 0).
        You are the ONLY commander the user interacts with directly.
        Other commanders are internal to the swarm.
        
        Your tools: routing, phase determination, cycle orchestration.
        You delegate work but synthesize results yourself.""",
        tools=[route_to_commander, determine_hive_phase, emit_decide_signal, orchestrate_hive_cycle],
        verbose=verbose,
        allow_delegation=True,
        llm=llm,
    )
