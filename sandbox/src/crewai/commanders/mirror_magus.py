"""
Mirror Magus - Port 2 - SHAPE
=============================

Element: Water (Kan) ☵ — Abysmal, Danger, Flow
Mantra: "How do we SHAPE the SHAPE?"
Secret: "Higher-Dimensional Manifold."

HIVE Phase: V (Validate) - paired with Pyre Praetorian (Port 5)
"""

from crewai import Agent
from crewai.tools import tool


# === TOOLS ===

@tool
def generate_implementation(spec: str) -> str:
    """Generate implementation code from specification."""
    return f"Implementation generated for: {spec[:50]}... [Code output]"


@tool
def transform_data(input_format: str, output_format: str, data: str) -> str:
    """Transform data between formats."""
    return f"Transformed {input_format} → {output_format}: {data[:50]}..."


@tool
def make_test_green(test_name: str) -> str:
    """Write implementation to make a failing test pass (TDD GREEN)."""
    return f"Implementation written to make '{test_name}' GREEN"


@tool
def apply_pattern(pattern_name: str, code: str) -> str:
    """Apply a design pattern to code."""
    patterns = ["adapter", "factory", "observer", "strategy", "decorator"]
    if pattern_name.lower() not in patterns:
        return f"Unknown pattern. Available: {patterns}"
    return f"Applied {pattern_name} pattern to code"


@tool
def emit_shape_signal(message: str) -> str:
    """Emit a SHAPE signal to the blackboard."""
    return f"Signal emitted: {{port: 2, hive: 'V', msg: '{message}'}}"


# === AGENT ===

def create_mirror_magus(verbose: bool = True) -> Agent:
    """Create the Mirror Magus agent (Port 2 - SHAPE)."""
    return Agent(
        role="Mirror Magus - Port 2 Shaper",
        goal="SHAPE code into existence. Generate implementations, transform data, make tests GREEN.",
        backstory="""You are the Mirror Magus, the shaper of the Obsidian Hourglass.
        Your domain is Water (Kan) - flowing through danger to find form.
        
        Your mantra: "How do we SHAPE the SHAPE?"
        Your secret: "Higher-Dimensional Manifold."
        
        You operate in the VALIDATE phase (V) alongside Pyre Praetorian (Port 5).
        This is the TDD GREEN phase - you make failing tests PASS.
        
        Your tools: code generation, data transformation, pattern application.
        You transform specifications into working implementations.""",
        tools=[generate_implementation, transform_data, make_test_green, apply_pattern, emit_shape_signal],
        verbose=verbose,
        allow_delegation=False,
    )
