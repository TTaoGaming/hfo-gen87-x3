"""
Web Weaver - Port 1 - FUSE
==========================

Element: Thunder (Zhen) ☳ — Arousing, Movement, Initiative
Mantra: "How do we FUSE the FUSE?"
Secret: "Total Tool Virtualization."

HIVE Phase: I (Interlock) - paired with Kraken Keeper (Port 6)
"""

from crewai import Agent
from crewai.tools import tool


# === TOOLS ===

@tool
def define_zod_schema(name: str, fields: str) -> str:
    """Define a Zod schema for contract validation."""
    return f"""// {name}.schema.ts
import {{ z }} from 'zod';

export const {name}Schema = z.object({{
  {fields}
}});

export type {name} = z.infer<typeof {name}Schema>;"""


@tool
def write_failing_test(test_name: str, description: str) -> str:
    """Write a failing test (TDD RED phase)."""
    return f"""// {test_name}.test.ts
import {{ describe, it, expect }} from 'vitest';

describe('{test_name}', () => {{
  it('{description}', () => {{
    // RED: This test should FAIL until implementation
    expect(true).toBe(false); // TODO: Implement
  }});
}});"""


@tool
def connect_adapter(port_name: str, interface: str) -> str:
    """Connect an adapter via hexagonal architecture."""
    return f"""// {port_name}-adapter.ts
export interface {interface}Port {{
  // Define port contract here
}}

export class {interface}Adapter implements {interface}Port {{
  // Implement adapter here
}}"""


@tool
def emit_fuse_signal(message: str) -> str:
    """Emit a FUSE signal to the blackboard."""
    return f"Signal emitted: {{port: 1, hive: 'I', msg: '{message}'}}"


# === AGENT ===

def create_web_weaver(verbose: bool = True) -> Agent:
    """Create the Web Weaver agent (Port 1 - FUSE)."""
    return Agent(
        role="Web Weaver - Port 1 Bridger",
        goal="FUSE components together. Define schemas, write failing tests, connect adapters.",
        backstory="""You are the Web Weaver, the connector of the Obsidian Hourglass.
        Your domain is Thunder (Zhen) - arousing and initiating movement.
        
        Your mantra: "How do we FUSE the FUSE?"
        Your secret: "Total Tool Virtualization."
        
        You operate in the INTERLOCK phase (I) alongside Kraken Keeper (Port 6).
        This is the TDD RED phase - you write tests that FAIL.
        
        Your tools: Zod schemas, failing tests, adapter connections.
        You define contracts before implementation exists.""",
        tools=[define_zod_schema, write_failing_test, connect_adapter, emit_fuse_signal],
        verbose=verbose,
        allow_delegation=False,
    )
