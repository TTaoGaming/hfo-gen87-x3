"""
HIVE/8 Crew Orchestration
=========================

The Obsidian Hourglass workflow implemented as a CrewAI Crew.

Phases:
- H (Hunt): Research, explore, find exemplars (Ports 0+7)
- I (Interlock): Connect pieces, define contracts (Ports 1+6)
- V (Validate): Verify correctness, enforce gates (Ports 2+5)
- E (Evolve): Refactor, deliver, prepare next cycle (Ports 3+4)

Strange Loop: E → H(N+1)
"""

from enum import Enum
from typing import Optional, Dict, Any, List
from crewai import Agent, Task, Crew, Process
from crewai.tools import tool

# Import all commanders
from .commanders import (
    create_lidless_legion,
    create_web_weaver,
    create_mirror_magus,
    create_spore_storm,
    create_red_regnant,
    create_pyre_praetorian,
    create_kraken_keeper,
    create_spider_sovereign,
)


class HivePhase(Enum):
    """HIVE/8 workflow phases."""
    HUNT = "H"       # Research, explore (Ports 0+7)
    INTERLOCK = "I"  # Connect, validate schemas (Ports 1+6)
    VALIDATE = "V"   # Verify, enforce gates (Ports 2+5)
    EVOLVE = "E"     # Refactor, deliver (Ports 3+4)


def create_hive_crew(
    verbose: bool = True,
    memory: bool = True,
    generation: int = 87
) -> Crew:
    """
    Create the HIVE/8 Commander Crew.
    
    Returns a Crew with all 8 Commanders configured for the Obsidian Hourglass workflow.
    """
    # Create all 8 commanders
    lidless = create_lidless_legion(verbose=verbose)      # Port 0
    weaver = create_web_weaver(verbose=verbose)           # Port 1
    magus = create_mirror_magus(verbose=verbose)          # Port 2
    storm = create_spore_storm(verbose=verbose)           # Port 3
    regnant = create_red_regnant(verbose=verbose)         # Port 4
    pyre = create_pyre_praetorian(verbose=verbose)        # Port 5
    kraken = create_kraken_keeper(verbose=verbose)        # Port 6
    spider = create_spider_sovereign(verbose=verbose)     # Port 7
    
    # Define HIVE/8 tasks
    hunt_task = Task(
        description="""
        HUNT Phase (H) - Research and Exploration
        
        Ports 0+7: Lidless Legion (SENSE) + Spider Sovereign (DECIDE)
        
        1. Search memory bank for relevant exemplars
        2. Use web search (Tavily) to ground findings
        3. Analyze codebase for existing patterns
        4. Plan approach based on findings
        
        Input: {task}
        Output: Exemplars found, approach planned, ready for Interlock phase.
        """,
        expected_output="Research summary with exemplars, sources cited, and recommended approach",
        agent=lidless,  # Primary: Lidless Legion (SENSE)
    )
    
    interlock_task = Task(
        description="""
        INTERLOCK Phase (I) - Connection and Contract Definition
        
        Ports 1+6: Web Weaver (FUSE) + Kraken Keeper (STORE)
        
        1. Define Zod/Pydantic schemas for contracts
        2. Write failing tests (TDD RED phase)
        3. Connect adapters via hexagonal architecture
        4. Persist contracts to memory
        
        Input: Results from HUNT phase
        Output: Contracts defined, tests written (failing), ready for Validate phase.
        """,
        expected_output="Contract definitions, failing test specifications, adapter interfaces",
        agent=weaver,  # Primary: Web Weaver (FUSE)
        context=[hunt_task],
    )
    
    validate_task = Task(
        description="""
        VALIDATE Phase (V) - Verification and Gate Enforcement
        
        Ports 2+5: Mirror Magus (SHAPE) + Pyre Praetorian (DEFEND)
        
        1. Implement code to make tests pass (TDD GREEN)
        2. Run property-based tests (100+ iterations)
        3. Validate all signals through G0-G11 gates
        4. Enforce HIVE sequence rules
        
        Input: Contracts from INTERLOCK phase
        Output: Tests passing, properties validated, gates enforced.
        """,
        expected_output="Implementation code, test results (all GREEN), gate validation report",
        agent=magus,  # Primary: Mirror Magus (SHAPE)
        context=[interlock_task],
    )
    
    evolve_task = Task(
        description="""
        EVOLVE Phase (E) - Refactoring and Delivery
        
        Ports 3+4: Spore Storm (DELIVER) + Red Regnant (TEST)
        
        1. Refactor code for clarity and patterns
        2. Run evolution/mutation testing
        3. Emit completion signals to blackboard
        4. Prepare for next HIVE cycle (N+1)
        
        Input: Validated implementation from VALIDATE phase
        Output: Refactored code, signals emitted, ready for next HUNT.
        """,
        expected_output="Refactored code summary, stigmergy signals emitted, N+1 recommendations",
        agent=storm,  # Primary: Spore Storm (DELIVER)
        context=[validate_task],
    )
    
    # Create the crew with hierarchical process (Spider Sovereign manages)
    crew = Crew(
        agents=[lidless, weaver, magus, storm, regnant, pyre, kraken, spider],
        tasks=[hunt_task, interlock_task, validate_task, evolve_task],
        process=Process.sequential,  # H → I → V → E
        verbose=verbose,
        memory=memory,
        manager_agent=spider,  # Spider Sovereign orchestrates
    )
    
    return crew


def create_hunt_crew(verbose: bool = True) -> Crew:
    """Create a crew for HUNT phase only (Ports 0+7)."""
    lidless = create_lidless_legion(verbose=verbose)
    spider = create_spider_sovereign(verbose=verbose)
    
    hunt_task = Task(
        description="""
        HUNT Phase - Search for exemplars and research.
        
        1. Query memory bank with FTS
        2. Search web via Tavily
        3. Grep codebase for patterns
        4. Synthesize findings
        
        Task: {task}
        """,
        expected_output="Research findings with cited sources",
        agent=lidless,
    )
    
    return Crew(
        agents=[lidless, spider],
        tasks=[hunt_task],
        process=Process.sequential,
        verbose=verbose,
        manager_agent=spider,
    )


def create_interlock_crew(verbose: bool = True) -> Crew:
    """Create a crew for INTERLOCK phase only (Ports 1+6)."""
    weaver = create_web_weaver(verbose=verbose)
    kraken = create_kraken_keeper(verbose=verbose)
    
    interlock_task = Task(
        description="""
        INTERLOCK Phase - Define contracts and write tests.
        
        1. Create Zod/Pydantic schemas
        2. Write failing tests (TDD RED)
        3. Define adapter interfaces
        4. Store contracts in memory
        
        Task: {task}
        """,
        expected_output="Contract schemas and failing test definitions",
        agent=weaver,
    )
    
    return Crew(
        agents=[weaver, kraken],
        tasks=[interlock_task],
        process=Process.sequential,
        verbose=verbose,
    )


def create_validate_crew(verbose: bool = True) -> Crew:
    """Create a crew for VALIDATE phase only (Ports 2+5)."""
    magus = create_mirror_magus(verbose=verbose)
    pyre = create_pyre_praetorian(verbose=verbose)
    
    validate_task = Task(
        description="""
        VALIDATE Phase - Implement and verify.
        
        1. Write implementation code
        2. Make tests GREEN
        3. Run property tests
        4. Enforce gate validation
        
        Task: {task}
        """,
        expected_output="Implementation code with all tests passing",
        agent=magus,
    )
    
    return Crew(
        agents=[magus, pyre],
        tasks=[validate_task],
        process=Process.sequential,
        verbose=verbose,
    )


def create_evolve_crew(verbose: bool = True) -> Crew:
    """Create a crew for EVOLVE phase only (Ports 3+4)."""
    storm = create_spore_storm(verbose=verbose)
    regnant = create_red_regnant(verbose=verbose)
    
    evolve_task = Task(
        description="""
        EVOLVE Phase - Refactor and deliver.
        
        1. Refactor code
        2. Run mutation tests
        3. Emit signals
        4. Prepare N+1 cycle
        
        Task: {task}
        """,
        expected_output="Refactored code and evolution signals",
        agent=storm,
    )
    
    return Crew(
        agents=[storm, regnant],
        tasks=[evolve_task],
        process=Process.sequential,
        verbose=verbose,
    )
