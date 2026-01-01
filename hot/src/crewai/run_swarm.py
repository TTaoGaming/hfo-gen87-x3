"""
HIVE/8 Swarm Orchestrator
=========================

Run a full HIVE/8 cycle with all 8 Commanders via OpenRouter.

Usage:
    python -m sandbox.src.crewai.run_swarm "Your task here"
"""

import os
import sys
from dotenv import load_dotenv

# Load environment
load_dotenv()

from crewai import Crew, Task, Process, LLM

# Import all commanders
from sandbox.src.crewai.commanders import (
    create_lidless_legion,
    create_web_weaver,
    create_mirror_magus,
    create_spore_storm,
    create_red_regnant,
    create_pyre_praetorian,
    create_kraken_keeper,
    create_spider_sovereign,
)


def create_hive_swarm(task_description: str, verbose: bool = True):
    """Create and run a HIVE/8 swarm for a task."""
    
    print("🕸️ Creating HIVE/8 Commander Swarm...")
    print("=" * 60)
    
    # Create all 8 commanders
    commanders = {
        0: create_lidless_legion(verbose=verbose),
        1: create_web_weaver(verbose=verbose),
        2: create_mirror_magus(verbose=verbose),
        3: create_spore_storm(verbose=verbose),
        4: create_red_regnant(verbose=verbose),
        5: create_pyre_praetorian(verbose=verbose),
        6: create_kraken_keeper(verbose=verbose),
        7: create_spider_sovereign(verbose=verbose),
    }
    
    print("\n📊 Commander Roster:")
    for port, agent in commanders.items():
        print(f"  Port {port}: {agent.role.split(' - ')[0]}")
    
    # Create HIVE/8 tasks (H → I → V → E)
    hunt_task = Task(
        description=f"""
        HUNT Phase (H) - Research and explore for: {task_description}
        
        1. Search for relevant patterns and exemplars
        2. Identify key concepts and requirements
        3. Document findings with sources
        
        Output a research summary.
        """,
        expected_output="Research findings with key concepts identified",
        agent=commanders[0],  # Lidless Legion
    )
    
    interlock_task = Task(
        description="""
        INTERLOCK Phase (I) - Based on the HUNT findings, define the contracts and interfaces.
        
        1. Define data structures needed
        2. Outline the interfaces/APIs
        3. Identify integration points
        
        Output contract specifications.
        """,
        expected_output="Contract and interface definitions",
        agent=commanders[1],  # Web Weaver
        context=[hunt_task],
    )
    
    validate_task = Task(
        description="""
        VALIDATE Phase (V) - Based on the contracts, describe the implementation approach.
        
        1. How would you implement these contracts?
        2. What validation steps are needed?
        3. What could go wrong?
        
        Output implementation plan with validation steps.
        """,
        expected_output="Implementation plan with validation approach",
        agent=commanders[2],  # Mirror Magus
        context=[interlock_task],
    )
    
    evolve_task = Task(
        description="""
        EVOLVE Phase (E) - Synthesize everything into final deliverable.
        
        1. Summarize the full HIVE cycle
        2. List key decisions made
        3. Recommend next steps for N+1 cycle
        
        Output final summary and recommendations.
        """,
        expected_output="Final synthesis with next steps",
        agent=commanders[3],  # Spore Storm
        context=[validate_task],
    )
    
    # Create crew with Spider Sovereign as manager
    print("\n🚀 Running HIVE/8 Cycle: H → I → V → E")
    print("=" * 60)
    
    crew = Crew(
        agents=list(commanders.values()),
        tasks=[hunt_task, interlock_task, validate_task, evolve_task],
        process=Process.sequential,
        verbose=verbose,
        manager_agent=commanders[7],  # Spider Sovereign
    )
    
    result = crew.kickoff()
    
    print("\n" + "=" * 60)
    print("🎯 HIVE/8 CYCLE COMPLETE")
    print("=" * 60)
    print(result)
    
    return result


if __name__ == "__main__":
    if len(sys.argv) > 1:
        task = " ".join(sys.argv[1:])
    else:
        task = "Research the HIVE/8 workflow phases and their anti-diagonal port pairings"
    
    create_hive_swarm(task)
