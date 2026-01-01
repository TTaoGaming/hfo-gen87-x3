"""
Quick test of CrewAI with OpenRouter.
"""
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from dotenv import load_dotenv
load_dotenv()

from crewai import Agent, Task, Crew, LLM

# Check for API key
api_key = os.environ.get("OPENROUTER_API_KEY")
if not api_key:
    print("❌ OPENROUTER_API_KEY not found in environment")
    print("   Set it in .env file or export it")
    sys.exit(1)

print(f"✅ OpenRouter API key found: {api_key[:20]}...")

# Create LLM with OpenRouter
print("\n🔧 Creating LLM with DeepSeek via OpenRouter...")
llm = LLM(
    model="openrouter/deepseek/deepseek-chat",
    api_key=api_key,
    base_url="https://openrouter.ai/api/v1",
    temperature=0.5,
)

# Create a simple test agent
print("🕷️ Creating Spider Sovereign agent...")
spider = Agent(
    role="Spider Sovereign - Port 7",
    goal="Decide the best course of action",
    backstory="You are the strategic navigator of the HIVE/8 swarm.",
    verbose=True,
    llm=llm,
)

# Create a simple task
print("📋 Creating test task...")
task = Task(
    description="What are the 4 phases of HIVE/8? Answer briefly in 2-3 sentences.",
    expected_output="A brief description of H, I, V, E phases",
    agent=spider,
)

# Create and run crew
print("🚀 Running crew...")
crew = Crew(
    agents=[spider],
    tasks=[task],
    verbose=True,
)

result = crew.kickoff()
print("\n" + "="*50)
print("RESULT:")
print("="*50)
print(result)
