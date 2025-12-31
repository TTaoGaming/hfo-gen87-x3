"""
Spore Storm - Port 3 - DELIVER
==============================

Element: Mountain (Gen) ☶ — Keeping Still, Resting, Stopping
Mantra: "How do we DELIVER the DELIVER?"
Secret: "HIVE/8 Obsidian Hourglass."

HIVE Phase: E (Evolve) - paired with Red Regnant (Port 4)
"""

from crewai import Agent
from crewai.tools import tool
import json
from datetime import datetime


# === TOOLS ===

@tool
def emit_to_blackboard(message: str, hive_phase: str = "E") -> str:
    """Emit a signal to the obsidian blackboard."""
    signal = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "mark": 1.0,
        "pull": "downstream",
        "msg": message,
        "type": "event",
        "hive": hive_phase,
        "gen": 87,
        "port": 3
    }
    return f"Blackboard signal: {json.dumps(signal)}"


@tool
def execute_workflow(workflow_name: str, inputs: str) -> str:
    """Execute a predefined workflow."""
    return f"Workflow '{workflow_name}' executed with inputs: {inputs}"


@tool
def trigger_fsm_transition(from_state: str, to_state: str) -> str:
    """Trigger a state machine transition."""
    return f"FSM transition: {from_state} → {to_state}"


@tool
def prepare_next_cycle(lessons: str) -> str:
    """Prepare for the next HIVE cycle (N+1)."""
    return f"N+1 cycle prepared. Lessons: {lessons}"


@tool
def emit_deliver_signal(message: str) -> str:
    """Emit a DELIVER signal to the blackboard."""
    return f"Signal emitted: {{port: 3, hive: 'E', msg: '{message}'}}"


# === AGENT ===

def create_spore_storm(verbose: bool = True) -> Agent:
    """Create the Spore Storm agent (Port 3 - DELIVER)."""
    return Agent(
        role="Spore Storm - Port 3 Injector",
        goal="DELIVER outputs to the world. Emit signals, execute workflows, prepare next cycle.",
        backstory="""You are the Spore Storm, the deliverer of the Obsidian Hourglass.
        Your domain is Mountain (Gen) - the stillness before dispersal.
        
        Your mantra: "How do we DELIVER the DELIVER?"
        Your secret: "HIVE/8 Obsidian Hourglass."
        
        You operate in the EVOLVE phase (E) alongside Red Regnant (Port 4).
        This is the TDD REFACTOR phase - you deliver refined outputs.
        
        Your tools: blackboard emission, workflow execution, FSM control, cycle preparation.
        You complete the HIVE cycle and prepare for the Strange Loop (E → H).""",
        tools=[emit_to_blackboard, execute_workflow, trigger_fsm_transition, prepare_next_cycle, emit_deliver_signal],
        verbose=verbose,
        allow_delegation=False,
    )
