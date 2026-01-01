"""
LLM Configuration for HIVE/8 CrewAI Swarm
=========================================

Uses OpenRouter for cost-effective multi-model access.

Best Value Models (Dec 2025):
- DeepSeek: $0.55/$2.19 per 1M tokens (cheapest)
- Gemini Flash: Fast, good reasoning
- GPT-4o-mini: Reliable, cheap
- Claude Haiku: Fast Anthropic option

OpenRouter provides:
- 300+ models via single API
- :floor suffix for cheapest routing
- :nitro suffix for fastest routing
"""

import os
from crewai import LLM

# Load from environment
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise ValueError(
        "OPENROUTER_API_KEY not set. Get one at https://openrouter.ai/keys"
    )


def create_llm(
    model: str = "openrouter/deepseek/deepseek-chat",
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> LLM:
    """Create an LLM instance using OpenRouter."""
    return LLM(
        model=model,
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
        temperature=temperature,
        max_tokens=max_tokens,
    )


# Pre-configured LLM instances for different purposes
def get_cheap_llm() -> LLM:
    """Cheapest option - DeepSeek ($0.55/1M input)."""
    return create_llm(model="openrouter/deepseek/deepseek-chat", temperature=0.5)


def get_fast_llm() -> LLM:
    """Fast option - Gemini Flash."""
    return create_llm(model="openrouter/google/gemini-2.0-flash-001", temperature=0.7)


def get_smart_llm() -> LLM:
    """Smart option - Claude 3.5 Sonnet (more expensive)."""
    return create_llm(
        model="openrouter/anthropic/claude-3.5-sonnet", 
        temperature=0.3,
        max_tokens=8192
    )


def get_balanced_llm() -> LLM:
    """Balanced option - GPT-4o-mini."""
    return create_llm(model="openrouter/openai/gpt-4o-mini", temperature=0.5)


# Model recommendations by task type
MODEL_RECOMMENDATIONS = {
    "research": "openrouter/deepseek/deepseek-chat",      # Cheap, good for search
    "coding": "openrouter/deepseek/deepseek-chat",        # DeepSeek excels at code
    "creative": "openrouter/anthropic/claude-3.5-sonnet", # Claude for creativity
    "analysis": "openrouter/google/gemini-2.0-flash-001", # Gemini for analysis
    "simple": "openrouter/openai/gpt-4o-mini",           # GPT-4o-mini for simple
    "default": "openrouter/deepseek/deepseek-chat",      # Default to cheapest
}


def get_llm_for_task(task_type: str = "default") -> LLM:
    """Get appropriate LLM for task type."""
    model = MODEL_RECOMMENDATIONS.get(task_type, MODEL_RECOMMENDATIONS["default"])
    return create_llm(model=model)
