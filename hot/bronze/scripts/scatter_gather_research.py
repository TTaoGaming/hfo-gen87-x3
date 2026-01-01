#!/usr/bin/env python3
"""
8-Model BFT Scatter-Gather Research System
==========================================

Scatter: Query 8 model families in parallel (8^1)
Gather: Merge responses into consensus (8^0)
Observe: CloudEvents + OTel → JSONL

Gen87.X3.1 | Spider Sovereign | Port 7

Usage:
    python scatter_gather_research.py "Your research query"
    python scatter_gather_research.py --file input.md --query "Summarize key concepts"
"""

import asyncio
import aiohttp
import json
import os
import sys
import argparse
from datetime import datetime, timezone
from uuid import uuid4
from pathlib import Path
from collections import Counter
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any

# Load environment
from dotenv import load_dotenv
load_dotenv()

# CloudEvents
try:
    from cloudevents.http import CloudEvent
    from cloudevents.conversion import to_json as ce_to_json
    HAS_CLOUDEVENTS = True
except ImportError:
    HAS_CLOUDEVENTS = False
    print("⚠️  cloudevents not installed, using plain JSON")

# OpenTelemetry (optional - graceful fallback)
try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter
    from opentelemetry.sdk.resources import Resource
    HAS_OTEL = True
except ImportError:
    HAS_OTEL = False
    print("⚠️  opentelemetry-sdk not installed, tracing disabled")


# ============================================================================
# CONFIGURATION
# ============================================================================

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

# 8 Model Families (Free Tier - VERIFIED Dec 31, 2025 via OpenRouter API)
# Run: python hot/bronze/scripts/check_free_models.py to refresh
MODELS_8 = [
    {"port": 0, "model": "meta-llama/llama-3.3-70b-instruct:free", "name": "Llama-70B", "commander": "Lidless Legion"},
    {"port": 1, "model": "deepseek/deepseek-r1-0528:free", "name": "DeepSeek-R1", "commander": "Web Weaver"},
    {"port": 2, "model": "google/gemini-2.0-flash-exp:free", "name": "Gemini-Flash", "commander": "Mirror Magus"},
    {"port": 3, "model": "nousresearch/hermes-3-llama-3.1-405b:free", "name": "Hermes-405B", "commander": "Spore Storm"},
    {"port": 4, "model": "mistralai/mistral-small-3.1-24b-instruct:free", "name": "Mistral-24B", "commander": "Red Regnant"},
    {"port": 5, "model": "qwen/qwen3-coder:free", "name": "Qwen3-Coder", "commander": "Pyre Praetorian"},
    {"port": 6, "model": "nvidia/nemotron-3-nano-30b-a3b:free", "name": "Nemotron-30B", "commander": "Kraken Keeper"},
    {"port": 7, "model": "google/gemma-3-27b-it:free", "name": "Gemma-27B", "commander": "Spider Sovereign"},
]

# BFT Quorum: 3f+1 where f=2, quorum = 2f+1 = 5 (we use 6 for safety margin)
BFT_QUORUM = 6

# Paths
ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
CLOUDEVENTS_LOG = ARTIFACTS_DIR / "cloudevents.jsonl"
TRACES_LOG = ARTIFACTS_DIR / "traces.jsonl"
BLACKBOARD = Path(__file__).parent.parent.parent.parent / "obsidianblackboard.jsonl"


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class ModelResponse:
    port: int
    model: str
    name: str
    commander: str
    content: str
    latency_ms: float
    success: bool
    error: Optional[str] = None


@dataclass 
class ConsensusResult:
    query: str
    timestamp: str
    responses: List[Dict]
    consensus_claims: List[str]
    agreement_scores: Dict[str, int]
    total_models: int
    successful_models: int
    quorum_threshold: int


# ============================================================================
# OBSERVABILITY SETUP
# ============================================================================

def setup_tracing():
    """Setup OpenTelemetry with console export (no collector needed)."""
    if not HAS_OTEL:
        return None
    
    resource = Resource.create({"service.name": "scatter-gather-research"})
    provider = TracerProvider(resource=resource)
    
    # Console exporter - writes to stdout, we'll capture it
    processor = SimpleSpanProcessor(ConsoleSpanExporter())
    provider.add_span_processor(processor)
    
    trace.set_tracer_provider(provider)
    return trace.get_tracer(__name__)


def emit_cloudevent(event_type: str, source: str, data: Dict) -> Dict:
    """Emit a CloudEvent to JSONL log."""
    event_dict = {
        "specversion": "1.0",
        "type": f"hfo.research.{event_type}",
        "source": source,
        "id": str(uuid4()),
        "time": datetime.now(timezone.utc).isoformat(),
        "datacontenttype": "application/json",
        "data": data,
        # HFO extensions
        "hfogen": 87,
    }
    
    if "port" in data:
        event_dict["hfoport"] = data["port"]
    
    # Write to JSONL
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(CLOUDEVENTS_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(event_dict) + "\n")
    
    return event_dict


def emit_blackboard_signal(msg: str, port: int = 7, hive: str = "H", signal_type: str = "signal"):
    """Emit signal to obsidianblackboard.jsonl for stigmergy coordination."""
    signal = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "mark": 1.0,
        "pull": "downstream",
        "msg": msg,
        "type": signal_type,
        "hive": hive,
        "gen": 87,
        "port": port
    }
    
    with open(BLACKBOARD, "a", encoding="utf-8") as f:
        f.write(json.dumps(signal) + "\n")
    
    return signal


# ============================================================================
# SCATTER: Query 8 Models in Parallel
# ============================================================================

async def query_single_model(
    session: aiohttp.ClientSession,
    model_config: Dict,
    prompt: str,
    system_prompt: str = "You are a helpful research assistant. Provide clear, factual answers."
) -> ModelResponse:
    """Query a single model via OpenRouter API."""
    
    start_time = asyncio.get_event_loop().time()
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://github.com/TTaoGaming/hfo-gen87-x3",
        "X-Title": "HFO Gen87.X3 Research Swarm",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_config["model"],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2048
    }
    
    try:
        async with session.post(
            OPENROUTER_BASE_URL,
            headers=headers,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=60)
        ) as response:
            
            end_time = asyncio.get_event_loop().time()
            latency_ms = (end_time - start_time) * 1000
            
            if response.status == 200:
                data = await response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                result = ModelResponse(
                    port=model_config["port"],
                    model=model_config["model"],
                    name=model_config["name"],
                    commander=model_config["commander"],
                    content=content,
                    latency_ms=latency_ms,
                    success=True
                )
                
                # Emit CloudEvent for successful response
                emit_cloudevent(
                    event_type="response",
                    source=f"/hive/port/{model_config['port']}/{model_config['commander'].lower().replace(' ', '-')}",
                    data={
                        "port": model_config["port"],
                        "model": model_config["model"],
                        "name": model_config["name"],
                        "latency_ms": latency_ms,
                        "content_length": len(content),
                        "success": True
                    }
                )
                
                print(f"  ✅ Port {model_config['port']} ({model_config['name']}): {latency_ms:.0f}ms, {len(content)} chars")
                return result
                
            else:
                error_text = await response.text()
                
                result = ModelResponse(
                    port=model_config["port"],
                    model=model_config["model"],
                    name=model_config["name"],
                    commander=model_config["commander"],
                    content="",
                    latency_ms=latency_ms,
                    success=False,
                    error=f"HTTP {response.status}: {error_text[:200]}"
                )
                
                # Emit CloudEvent for error
                emit_cloudevent(
                    event_type="error",
                    source=f"/hive/port/{model_config['port']}/{model_config['commander'].lower().replace(' ', '-')}",
                    data={
                        "port": model_config["port"],
                        "model": model_config["model"],
                        "error": result.error,
                        "success": False
                    }
                )
                
                print(f"  ❌ Port {model_config['port']} ({model_config['name']}): {result.error}")
                return result
                
    except asyncio.TimeoutError:
        end_time = asyncio.get_event_loop().time()
        latency_ms = (end_time - start_time) * 1000
        
        result = ModelResponse(
            port=model_config["port"],
            model=model_config["model"],
            name=model_config["name"],
            commander=model_config["commander"],
            content="",
            latency_ms=latency_ms,
            success=False,
            error="Timeout after 60s"
        )
        
        emit_cloudevent(
            event_type="timeout",
            source=f"/hive/port/{model_config['port']}",
            data={"port": model_config["port"], "model": model_config["model"], "timeout_ms": 60000}
        )
        
        print(f"  ⏱️ Port {model_config['port']} ({model_config['name']}): TIMEOUT")
        return result
        
    except Exception as e:
        end_time = asyncio.get_event_loop().time()
        latency_ms = (end_time - start_time) * 1000
        
        result = ModelResponse(
            port=model_config["port"],
            model=model_config["model"],
            name=model_config["name"],
            commander=model_config["commander"],
            content="",
            latency_ms=latency_ms,
            success=False,
            error=str(e)
        )
        
        print(f"  💥 Port {model_config['port']} ({model_config['name']}): {str(e)[:50]}")
        return result


async def scatter(prompt: str, system_prompt: str = None) -> List[ModelResponse]:
    """Scatter query to 8 models in parallel (8^1)."""
    
    print(f"\n🔀 SCATTER: Querying 8 models in parallel...")
    emit_blackboard_signal(f"SCATTER START: {prompt[:50]}...", port=7, hive="H")
    
    start_time = asyncio.get_event_loop().time()
    
    async with aiohttp.ClientSession() as session:
        tasks = [
            query_single_model(session, model, prompt, system_prompt or "You are a helpful research assistant.")
            for model in MODELS_8
        ]
        responses = await asyncio.gather(*tasks)
    
    end_time = asyncio.get_event_loop().time()
    total_time = (end_time - start_time) * 1000
    
    successful = sum(1 for r in responses if r.success)
    print(f"\n📊 Scatter complete: {successful}/8 successful in {total_time:.0f}ms total")
    
    emit_blackboard_signal(
        f"SCATTER COMPLETE: {successful}/8 models responded in {total_time:.0f}ms",
        port=7, hive="H", signal_type="event"
    )
    
    return responses


# ============================================================================
# GATHER: Merge Responses into Consensus (8^0)
# ============================================================================

def extract_key_points(content: str) -> List[str]:
    """Extract key points/claims from a response."""
    # Simple extraction: Split by sentences, filter short ones
    import re
    
    # Split into sentences
    sentences = re.split(r'[.!?]\s+', content)
    
    # Filter: Keep sentences that are substantial (>30 chars, <500 chars)
    key_points = []
    for s in sentences:
        s = s.strip()
        if 30 < len(s) < 500:
            # Normalize: lowercase, remove extra whitespace
            normalized = ' '.join(s.lower().split())
            key_points.append(normalized)
    
    return key_points


def find_similar_claims(claim: str, all_claims: List[str], threshold: float = 0.5) -> List[str]:
    """Find claims similar to the given claim (simple word overlap)."""
    claim_words = set(claim.lower().split())
    similar = []
    
    for other in all_claims:
        if other == claim:
            continue
        other_words = set(other.lower().split())
        
        # Jaccard similarity
        intersection = len(claim_words & other_words)
        union = len(claim_words | other_words)
        
        if union > 0 and intersection / union >= threshold:
            similar.append(other)
    
    return similar


def gather(responses: List[ModelResponse], query: str) -> ConsensusResult:
    """Gather responses into consensus (8^0)."""
    
    print(f"\n🔄 GATHER: Merging {len(responses)} responses into consensus...")
    emit_blackboard_signal("GATHER START: Extracting claims and voting", port=7, hive="V")
    
    # Extract claims from each response
    all_claims_by_port = {}
    for resp in responses:
        if resp.success and resp.content:
            claims = extract_key_points(resp.content)
            all_claims_by_port[resp.port] = claims
    
    # Count claim occurrences (approximate: group similar claims)
    claim_votes = Counter()
    claim_sources = {}  # claim -> list of ports that support it
    
    all_claims = [c for claims in all_claims_by_port.values() for c in claims]
    
    # Simple voting: count how many ports have similar claims
    seen_claims = set()
    for port, claims in all_claims_by_port.items():
        for claim in claims:
            if claim in seen_claims:
                continue
            
            # Find similar claims across all ports
            supporting_ports = [port]
            for other_port, other_claims in all_claims_by_port.items():
                if other_port == port:
                    continue
                for other_claim in other_claims:
                    if claim == other_claim or len(find_similar_claims(claim, [other_claim])) > 0:
                        supporting_ports.append(other_port)
                        break
            
            claim_votes[claim] = len(set(supporting_ports))
            claim_sources[claim] = list(set(supporting_ports))
            seen_claims.add(claim)
    
    # Filter by BFT quorum
    consensus_claims = [
        claim for claim, votes in claim_votes.most_common()
        if votes >= BFT_QUORUM
    ]
    
    # Also include high-voted claims below quorum for transparency
    agreement_scores = {claim: votes for claim, votes in claim_votes.most_common(20)}
    
    successful_count = sum(1 for r in responses if r.success)
    
    result = ConsensusResult(
        query=query,
        timestamp=datetime.now(timezone.utc).isoformat(),
        responses=[asdict(r) for r in responses],
        consensus_claims=consensus_claims[:10],  # Top 10 consensus claims
        agreement_scores=agreement_scores,
        total_models=len(responses),
        successful_models=successful_count,
        quorum_threshold=BFT_QUORUM
    )
    
    print(f"📋 Consensus: {len(consensus_claims)} claims reached quorum ({BFT_QUORUM}/8)")
    
    emit_blackboard_signal(
        f"GATHER COMPLETE: {len(consensus_claims)} claims reached BFT quorum",
        port=7, hive="V", signal_type="event"
    )
    
    return result


# ============================================================================
# OUTPUT: Generate Artifacts
# ============================================================================

def save_artifacts(result: ConsensusResult):
    """Save all artifacts to hot/bronze/artifacts/."""
    
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Save raw responses
    responses_dir = ARTIFACTS_DIR / "responses"
    responses_dir.mkdir(exist_ok=True)
    
    for resp in result.responses:
        resp_file = responses_dir / f"port_{resp['port']}.json"
        with open(resp_file, "w", encoding="utf-8") as f:
            json.dump(resp, f, indent=2)
    
    # Save consensus result
    consensus_file = ARTIFACTS_DIR / "consensus.json"
    with open(consensus_file, "w", encoding="utf-8") as f:
        json.dump(asdict(result) if hasattr(result, '__dataclass_fields__') else result.__dict__, f, indent=2)
    
    # Generate markdown summary
    md_content = generate_markdown_report(result)
    md_file = ARTIFACTS_DIR / "consensus.md"
    with open(md_file, "w", encoding="utf-8") as f:
        f.write(md_content)
    
    print(f"\n💾 Artifacts saved to {ARTIFACTS_DIR}/")
    print(f"   - responses/port_*.json (8 files)")
    print(f"   - consensus.json")
    print(f"   - consensus.md")
    print(f"   - cloudevents.jsonl")


def generate_markdown_report(result: ConsensusResult) -> str:
    """Generate a markdown report of the consensus."""
    
    lines = [
        "# 8-Model BFT Consensus Report",
        "",
        f"> **Generated**: {result.timestamp}",
        f"> **Models**: {result.successful_models}/{result.total_models} successful",
        f"> **Quorum**: {result.quorum_threshold}/8 required for consensus",
        "",
        "---",
        "",
        "## Query",
        "",
        f"```",
        result.query[:500] + ("..." if len(result.query) > 500 else ""),
        "```",
        "",
        "---",
        "",
        "## Consensus Claims (≥6/8 Agreement)",
        "",
    ]
    
    if result.consensus_claims:
        for i, claim in enumerate(result.consensus_claims, 1):
            score = result.agreement_scores.get(claim, "?")
            lines.append(f"{i}. **[{score}/8]** {claim}")
    else:
        lines.append("*No claims reached BFT quorum. See all claims below.*")
    
    lines.extend([
        "",
        "---",
        "",
        "## All Claims by Agreement Score",
        "",
        "| Score | Claim |",
        "|-------|-------|",
    ])
    
    for claim, score in sorted(result.agreement_scores.items(), key=lambda x: -x[1])[:20]:
        # Truncate long claims
        display_claim = claim[:100] + ("..." if len(claim) > 100 else "")
        quorum_marker = "✅" if score >= result.quorum_threshold else ""
        lines.append(f"| {score}/8 {quorum_marker} | {display_claim} |")
    
    lines.extend([
        "",
        "---",
        "",
        "## Model Response Summary",
        "",
        "| Port | Model | Commander | Latency | Status |",
        "|------|-------|-----------|---------|--------|",
    ])
    
    for resp in result.responses:
        status = "✅" if resp["success"] else f"❌ {resp.get('error', 'Unknown')[:30]}"
        latency = f"{resp['latency_ms']:.0f}ms" if resp["latency_ms"] else "N/A"
        lines.append(f"| {resp['port']} | {resp['name']} | {resp['commander']} | {latency} | {status} |")
    
    lines.extend([
        "",
        "---",
        "",
        "*Generated by HFO Gen87.X3 Scatter-Gather Research System*"
    ])
    
    return "\n".join(lines)


# ============================================================================
# MAIN
# ============================================================================

async def main():
    parser = argparse.ArgumentParser(description="8-Model BFT Scatter-Gather Research")
    parser.add_argument("query", nargs="?", help="Research query")
    parser.add_argument("--file", "-f", help="Input file to include as context")
    parser.add_argument("--system", "-s", help="Custom system prompt")
    
    args = parser.parse_args()
    
    # Check API key
    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY not found in environment")
        print("   Set it in .env file or export it")
        sys.exit(1)
    
    print("=" * 60)
    print("🕸️  8-MODEL BFT SCATTER-GATHER RESEARCH")
    print("=" * 60)
    print(f"API Key: {OPENROUTER_API_KEY[:20]}...")
    print(f"Models: {len(MODELS_8)} families")
    print(f"Quorum: {BFT_QUORUM}/8 for consensus")
    
    # Build query
    query = args.query or "What are the key concepts and themes?"
    
    if args.file:
        file_path = Path(args.file)
        if file_path.exists():
            content = file_path.read_text(encoding="utf-8")
            # Truncate if too long
            if len(content) > 10000:
                content = content[:10000] + "\n\n[...truncated...]"
            query = f"Based on the following content:\n\n{content}\n\n{query}"
            print(f"📄 Loaded context from: {file_path.name} ({len(content)} chars)")
    
    print(f"📝 Query: {query[:100]}...")
    
    # Setup tracing
    tracer = setup_tracing()
    
    # Emit start signal
    emit_blackboard_signal(
        f"RESEARCH START: 8-model scatter-gather initiated",
        port=7, hive="H"
    )
    
    # SCATTER
    responses = await scatter(query, args.system)
    
    # GATHER
    result = gather(responses, query)
    
    # SAVE ARTIFACTS
    save_artifacts(result)
    
    # Emit completion signal
    emit_blackboard_signal(
        f"RESEARCH COMPLETE: {len(result.consensus_claims)} claims reached consensus",
        port=7, hive="E", signal_type="event"
    )
    
    print("\n" + "=" * 60)
    print("✅ RESEARCH COMPLETE")
    print("=" * 60)
    print(f"Consensus claims: {len(result.consensus_claims)}")
    print(f"Artifacts: {ARTIFACTS_DIR}/")
    
    return result


if __name__ == "__main__":
    asyncio.run(main())
