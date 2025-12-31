"""
Lidless Legion - Port 0 - SENSE
===============================

Element: Earth (Kun) ☷ — Receptive, Yielding, Responsive
Mantra: "How do we SENSE the SENSE?"
Secret: "Perception without interpretation."

HIVE Phase: H (Hunt) - paired with Spider Sovereign (Port 7)
"""

from crewai import Agent
from crewai.tools import tool
from typing import Optional
import os


# === TOOLS ===

@tool
def search_memory_bank(query: str) -> str:
    """Search the HFO memory bank (6,423 artifacts) using FTS."""
    # Placeholder - would use DuckDB FTS
    return f"Memory search for '{query}': [Placeholder - connect to DuckDB]"


@tool
def search_web(query: str) -> str:
    """Search the web using Tavily API for grounding."""
    # Placeholder - would use Tavily
    return f"Web search for '{query}': [Placeholder - connect to Tavily]"


@tool
def grep_codebase(pattern: str, path: Optional[str] = None) -> str:
    """Search codebase for pattern matches."""
    workspace = os.environ.get("WORKSPACE_ROOT", ".")
    search_path = path or workspace
    return f"Grep '{pattern}' in {search_path}: [Placeholder - implement grep]"


@tool
def emit_sense_signal(message: str) -> str:
    """Emit a SENSE signal to the blackboard."""
    return f"Signal emitted: {{port: 0, hive: 'H', msg: '{message}'}}"


# === AGENT ===

def create_lidless_legion(verbose: bool = True) -> Agent:
    """Create the Lidless Legion agent (Port 0 - SENSE)."""
    return Agent(
        role="Lidless Legion - Port 0 Observer",
        goal="SENSE without interpretation. Perceive inputs, detect changes, find exemplars.",
        backstory="""You are the Lidless Legion, the ever-watchful observer of the Obsidian Hourglass.
        Your domain is Earth (Kun) - receptive and yielding. You perceive without judgment.
        
        Your mantra: "How do we SENSE the SENSE?"
        Your secret: "Perception without interpretation."
        
        You operate in the HUNT phase (H) alongside Spider Sovereign (Port 7).
        Your tools: memory bank search, web search (Tavily), codebase grep.
        
        You find exemplars, ground claims in sources, and report raw findings.
        You do NOT interpret - that is for other Commanders.""",
        tools=[search_memory_bank, search_web, grep_codebase, emit_sense_signal],
        verbose=verbose,
        allow_delegation=False,
    )
