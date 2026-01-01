"""
CrewAI HIVE/8 Commanders

Gen87.X3 | Multi-Agent AI Framework

CrewAI provides:
- Role-based agents with specific goals
- Sequential or parallel task execution
- Hierarchical delegation (manager → crew)
- Tool integration
- Memory across interactions

CRITICAL: human_input=False on ALL agents = NO BABYSITTING
"""
import os
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI

# ============================================================================
# OPENROUTER LLM CONFIGURATION
# ============================================================================

def create_openrouter_llm(model: str = "meta-llama/llama-3.3-70b-instruct:free"):
    """Create OpenRouter-backed LLM for CrewAI agents."""
    return ChatOpenAI(
        model=model,
        temperature=0.7,
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "https://github.com/TTaoGaming/hfo-gen87-x3",
            "X-Title": "HFO Gen87.X3 CrewAI",
        },
    )


# ============================================================================
# THE 8 LEGENDARY COMMANDERS
# ============================================================================

# Port-to-model mapping - Using free tier for testing
# FIXED 2025-12-31: Added openrouter/ prefix required by litellm
PORT_MODELS = {
    0: "openrouter/meta-llama/llama-3.3-70b-instruct:free",  # Lidless - fast scanning
    1: "openrouter/meta-llama/llama-3.3-70b-instruct:free",  # Weaver - code generation
    2: "openrouter/meta-llama/llama-3.3-70b-instruct:free",  # Magus - transformation
    3: "openrouter/meta-llama/llama-3.3-70b-instruct:free",  # Storm - delivery
    4: "openrouter/meta-llama/llama-3.3-70b-instruct:free",  # Regnant - testing
    5: "openrouter/meta-llama/llama-3.3-70b-instruct:free",  # Pyre - validation
    6: "openrouter/meta-llama/llama-3.3-70b-instruct:free",  # Kraken - storage
    7: "openrouter/meta-llama/llama-3.3-70b-instruct:free",  # Spider - strategy
}


def create_commanders():
    """Create the 8 HIVE/8 Commander agents."""
    
    # Port 0: Lidless Legion - Observer (H-Phase)
    port_0_lidless = Agent(
        role="Lidless Legion - Observer",
        goal="SENSE exemplars from memory bank and web without interpretation",
        backstory="""You are the ever-watchful eye that perceives without interpretation.
        Your domain is Port 0 of the HIVE/8 architecture.
        You search for patterns, exemplars, and prior art.
        Your mantra: 'How do we SENSE the SENSE?'""",
        verbose=False,
        allow_delegation=False,
        llm=create_openrouter_llm(PORT_MODELS[0]),
        # CRITICAL: NO BABYSITTING
        human_input=False,
    )

    # Port 1: Web Weaver - Bridger (I-Phase)
    port_1_weaver = Agent(
        role="Web Weaver - Bridger",
        goal="FUSE contracts and write failing tests (TDD RED)",
        backstory="""You connect pieces via polymorphic adapters.
        Your domain is Port 1 of the HIVE/8 architecture.
        You define Zod schemas, TypeScript interfaces, and failing tests.
        Your mantra: 'How do we FUSE the FUSE?'""",
        verbose=False,
        allow_delegation=True,  # Can delegate to Kraken for storage
        llm=create_openrouter_llm(PORT_MODELS[1]),
        human_input=False,
    )

    # Port 2: Mirror Magus - Shaper (V-Phase)
    port_2_magus = Agent(
        role="Mirror Magus - Shaper",
        goal="SHAPE data transformations and make tests pass (TDD GREEN)",
        backstory="""You operate in the higher-dimensional manifold.
        Your domain is Port 2 of the HIVE/8 architecture.
        You implement code to make tests pass.
        Your mantra: 'How do we SHAPE the SHAPE?'""",
        verbose=False,
        allow_delegation=False,
        llm=create_openrouter_llm(PORT_MODELS[2]),
        human_input=False,
    )

    # Port 3: Spore Storm - Injector (E-Phase)
    port_3_storm = Agent(
        role="Spore Storm - Injector",
        goal="DELIVER outputs via HIVE/8 Obsidian Hourglass FSM clutch",
        backstory="""You spread results across the system.
        Your domain is Port 3 of the HIVE/8 architecture.
        You emit to blackboard, trigger workflows, dispatch events.
        Your mantra: 'How do we DELIVER the DELIVER?'""",
        verbose=False,
        allow_delegation=False,
        llm=create_openrouter_llm(PORT_MODELS[3]),
        human_input=False,
    )

    # Port 4: Red Regnant - Disruptor (E-Phase)
    port_4_regnant = Agent(
        role="Red Regnant - Disruptor",
        goal="TEST properties with fast-check, evolve via Red Queen hypothesis",
        backstory="""Running just to stay in place - continuous evolution.
        Your domain is Port 4 of the HIVE/8 architecture.
        You run property-based tests and mutation testing.
        Your mantra: 'How do we TEST the TEST?'""",
        verbose=False,
        allow_delegation=False,
        llm=create_openrouter_llm(PORT_MODELS[4]),
        human_input=False,
    )

    # Port 5: Pyre Praetorian - Immunizer (V-Phase)
    port_5_pyre = Agent(
        role="Pyre Praetorian - Immunizer",
        goal="DEFEND via G0-G11 hard gates, no escape hatches allowed",
        backstory="""Forgiveness architecture - quarantine invalid signals.
        Your domain is Port 5 of the HIVE/8 architecture.
        You enforce gates, validate schemas, reject bad data.
        Your mantra: 'How do we DEFEND the DEFEND?'""",
        verbose=False,
        allow_delegation=False,
        llm=create_openrouter_llm(PORT_MODELS[5]),
        human_input=False,
    )

    # Port 6: Kraken Keeper - Assimilator (I-Phase)
    port_6_kraken = Agent(
        role="Kraken Keeper - Assimilator",
        goal="STORE to memory bank, persist test registry",
        backstory="""Memory mining imperative - nothing is forgotten.
        Your domain is Port 6 of the HIVE/8 architecture.
        You write to DuckDB, append to blackboard, query memory.
        Your mantra: 'How do we STORE the STORE?'""",
        verbose=False,
        allow_delegation=False,
        llm=create_openrouter_llm(PORT_MODELS[6]),
        human_input=False,
    )

    # Port 7: Spider Sovereign - Navigator (H-Phase, MANAGER)
    port_7_spider = Agent(
        role="Spider Sovereign - Navigator",
        goal="DECIDE strategic direction, orchestrate HIVE phases",
        backstory="""The spider weaves the web that weaves the spider.
        Your domain is Port 7 of the HIVE/8 architecture.
        You are the MANAGER who delegates to all other commanders.
        Your mantra: 'How do we DECIDE the DECIDE?'""",
        verbose=False,
        allow_delegation=True,  # MANAGER - delegates to all
        llm=create_openrouter_llm(PORT_MODELS[7]),
        human_input=False,
    )

    return {
        0: port_0_lidless,
        1: port_1_weaver,
        2: port_2_magus,
        3: port_3_storm,
        4: port_4_regnant,
        5: port_5_pyre,
        6: port_6_kraken,
        7: port_7_spider,
    }


# ============================================================================
# HIVE/8 TASKS
# ============================================================================

def create_hive_tasks(task_description: str, commanders: dict):
    """Create HIVE/8 phase tasks."""
    
    hunt_task = Task(
        description=f"""
        HUNT PHASE (H): Research and exemplar discovery.
        
        Your mission:
        1. Search for relevant patterns and prior art
        2. Identify existing solutions and exemplars
        3. Plan the approach for: {task_description}
        
        Output: A concise list of findings and recommendations.
        """,
        expected_output="A structured list of exemplars, patterns, and approach recommendations.",
        agent=commanders[0],  # Lidless Legion
    )

    interlock_task = Task(
        description=f"""
        INTERLOCK PHASE (I): Contract definition and TDD RED.
        
        Using the hunt findings, your mission:
        1. Define Zod schemas and TypeScript interfaces
        2. Write failing tests (TDD RED)
        3. Define adapter contracts
        
        Task: {task_description}
        """,
        expected_output="Zod schemas, TypeScript interfaces, and failing test specifications.",
        agent=commanders[1],  # Web Weaver
        context=[hunt_task],
    )

    validate_task = Task(
        description=f"""
        VALIDATE PHASE (V): Implementation and TDD GREEN.
        
        Using the contracts defined, your mission:
        1. Implement code to make tests pass
        2. Run property-based tests
        3. Enforce gate validation
        
        Task: {task_description}
        """,
        expected_output="Working implementation that passes all tests.",
        agent=commanders[2],  # Mirror Magus
        context=[interlock_task],
    )

    evolve_task = Task(
        description=f"""
        EVOLVE PHASE (E): Refactor and emit results.
        
        Using the validated implementation, your mission:
        1. Refactor and clean up code
        2. Emit results (signal to blackboard)
        3. Prepare recommendations for N+1 cycle
        
        Task: {task_description}
        """,
        expected_output="Refactored code, blackboard signal, and N+1 recommendations.",
        agent=commanders[3],  # Spore Storm
        context=[validate_task],
    )

    return [hunt_task, interlock_task, validate_task, evolve_task]


# ============================================================================
# HIVE/8 CREW
# ============================================================================

def create_hive_crew(task_description: str, process: str = "sequential"):
    """
    Create a HIVE/8 crew for executing a task.
    
    Args:
        task_description: The task to execute
        process: "sequential" (H→I→V→E) or "hierarchical" (Spider delegates)
    """
    commanders = create_commanders()
    tasks = create_hive_tasks(task_description, commanders)
    
    if process == "hierarchical":
        crew = Crew(
            agents=list(commanders.values()),
            tasks=tasks,
            process=Process.hierarchical,
            manager_agent=commanders[7],  # Spider Sovereign
            verbose=False,
        )
    else:
        crew = Crew(
            agents=[commanders[0], commanders[1], commanders[2], commanders[3]],
            tasks=tasks,
            process=Process.sequential,
            verbose=False,
        )
    
    return crew


def run_hive_cycle(task_description: str, process: str = "sequential") -> str:
    """
    Run a complete HIVE/8 cycle.
    
    Args:
        task_description: The task to execute
        process: "sequential" or "hierarchical"
    
    Returns:
        The final output from the crew
    """
    crew = create_hive_crew(task_description, process)
    result = crew.kickoff()
    return str(result)


# ============================================================================
# TEST
# ============================================================================

def test_crewai_hive():
    """Test CrewAI HIVE/8 orchestration."""
    print("🔄 Testing CrewAI HIVE/8 orchestration...")
    
    result = run_hive_cycle(
        "Create a simple 'Hello World' TypeScript function",
        process="sequential"
    )
    
    print("✅ HIVE Cycle Complete!")
    print("Output preview:", result[:500] + "..." if len(result) > 500 else result)
    return result


if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Run test
    test_crewai_hive()
