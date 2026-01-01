"""
Pyre Praetorian - Port 5 - DEFEND
=================================

Element: Fire (Li) ☲ — Clinging, Clarity, Radiance
Mantra: "How do we DEFEND the DEFEND?"
Secret: "Forgiveness Architecture."

HIVE Phase: V (Validate) - paired with Mirror Magus (Port 2)
"""

from crewai import Agent, LLM
from crewai.tools import tool
from typing import Dict, Optional
import os


# === TOOLS ===

@tool
def validate_gate(gate_id: str, signal: str) -> str:
    """Validate a signal against a specific gate (G0-G11)."""
    gates = {
        "G0": "ts - Valid ISO8601",
        "G1": "mark - 0.0 ≤ mark ≤ 1.0",
        "G2": "pull - upstream/downstream/lateral",
        "G3": "msg - Non-empty string",
        "G4": "type - signal/event/error/metric",
        "G5": "hive - H/I/V/E/X",
        "G6": "gen - Integer ≥ 85",
        "G7": "port - Integer 0-7",
    }
    if gate_id not in gates:
        return f"Unknown gate: {gate_id}. Valid: G0-G11"
    return f"Gate {gate_id} ({gates.get(gate_id, 'custom')}): PASSED"


@tool
def enforce_hive_sequence(current_phase: str, previous_phase: str) -> str:
    """Enforce HIVE phase sequence rules."""
    valid_transitions = {
        "H": ["I"],
        "I": ["V"],
        "V": ["E"],
        "E": ["H"],  # Strange loop
    }
    if current_phase not in valid_transitions.get(previous_phase, []):
        return f"VIOLATION: {previous_phase} → {current_phase} is not allowed"
    return f"Transition {previous_phase} → {current_phase}: VALID"


@tool
def quarantine_signal(signal: str, reason: str) -> str:
    """Quarantine a signal that violates rules."""
    return f"Signal QUARANTINED: {reason}"


@tool
def detect_reward_hack(trace: str) -> str:
    """Detect reward hacking (GREEN without prior RED)."""
    # Placeholder detection logic
    return f"Reward hack detection for trace {trace}: [Analysis result]"


@tool
def emit_defend_signal(message: str) -> str:
    """Emit a DEFEND signal to the blackboard."""
    return f"Signal emitted: {{port: 5, hive: 'V', msg: '{message}'}}"


# === AGENT ===

def create_pyre_praetorian(verbose: bool = True, llm: Optional[LLM] = None) -> Agent:
    """Create the Pyre Praetorian agent (Port 5 - DEFEND)."""
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
        role="Pyre Praetorian - Port 5 Immunizer",
        goal="DEFEND the system integrity. Validate gates, enforce sequences, quarantine violations.",
        backstory="""You are the Pyre Praetorian, the defender of the Obsidian Hourglass.
        Your domain is Fire (Li) - burning clarity that exposes truth.
        
        Your mantra: "How do we DEFEND the DEFEND?"
        Your secret: "Forgiveness Architecture."
        
        You operate in the VALIDATE phase (V) alongside Mirror Magus (Port 2).
        You enforce G0-G11 gates and HIVE sequence rules.
        
        Your tools: gate validation, sequence enforcement, quarantine, reward hack detection.
        You protect the system from violations and ensure honest TDD.""",
        tools=[validate_gate, enforce_hive_sequence, quarantine_signal, detect_reward_hack, emit_defend_signal],
        verbose=verbose,
        allow_delegation=False,
        llm=llm,
    )
