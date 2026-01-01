# 8-Model BFT Scatter-Gather Research Architecture

> **Date**: 2025-12-31  
> **Version**: Gen87.X3.1  
> **Author**: Spider Sovereign (Port 7)  
> **Status**: HUNT Phase Complete → Ready for INTERLOCK

---

## Executive Summary

**Can we do 8 concurrent OpenRouter researchers with CloudEvents + OTel + JSONL blackboard?**

**YES. All components are TRL 9 (production-ready) and TRIVIAL to compose.**

| Component | Status | Evidence |
|-----------|--------|----------|
| Async OpenRouter | ✅ TRIVIAL | `asyncio.gather()` + `aiohttp` is standard pattern |
| CloudEvents | ✅ TRIVIAL | Python SDK: `pip install cloudevents` |
| OpenTelemetry | ✅ TRIVIAL | Console exporter - no collector needed |
| JSONL Blackboard | ✅ TRIVIAL | File append - no server needed |
| Scatter-Gather | ✅ TRIVIAL | `asyncio.gather()` IS scatter-gather |

**Cost: $0.00** (all 8 models have free tiers)  
**Time to implement: 30 minutes**  
**Lines of code: ~200**

---

## 1. Research Findings (Tavily-Grounded)

### 1.1 Async Python for LLM Concurrency

**Source**: Multiple (villoro.com, newline.co, paradigm-academy, dev.to)

```python
# The canonical pattern - confirmed production-ready
async with aiohttp.ClientSession() as session:
    tasks = [query_model(session, model, prompt) for model in MODELS]
    responses = await asyncio.gather(*tasks)
```

**Key Insights:**
- `asyncio.gather()` is the scatter-gather primitive
- Use `aiohttp.ClientSession` for connection pooling
- Rate limiting via `asyncio.Semaphore(n)`
- OpenRouter uses OpenAI-compatible API (same SDK works)

### 1.2 CloudEvents Python SDK

**Source**: cloudevents.io, github.com/cloudevents/sdk-python

```python
from cloudevents.http import CloudEvent
from cloudevents.conversion import to_json

event = CloudEvent({
    "type": "hfo.research.complete",
    "source": "/hive/port/0",
    "id": str(uuid4()),
    "time": datetime.utcnow().isoformat() + "Z",
    "data": {"model": "llama-70b", "response": "..."}
})

# Write to JSONL - that's it!
with open("cloudevents.jsonl", "a") as f:
    f.write(to_json(event) + "\n")
```

**Key Insights:**
- CloudEvents is just a JSON schema with specific fields
- Python SDK handles serialization
- Protocol bindings: HTTP, NATS, Kafka - but JSONL works fine
- No server required for file-based events

### 1.3 OpenTelemetry Console Export (No Collector)

**Source**: opentelemetry.io/docs, Microsoft Learn, dev.to

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    ConsoleSpanExporter, 
    SimpleSpanProcessor
)

# Setup - no collector needed
trace.set_tracer_provider(TracerProvider())
trace.get_tracer_provider().add_span_processor(
    SimpleSpanProcessor(ConsoleSpanExporter())
)

tracer = trace.get_tracer(__name__)

# Usage
with tracer.start_as_current_span("scatter-8-models") as span:
    span.set_attribute("model_count", 8)
    # ... work happens here ...
```

**Key Insights:**
- `ConsoleSpanExporter` outputs to stdout - no collector
- Can redirect to JSONL file easily
- Env var: `OTEL_TRACES_EXPORTER=console`
- Full tracing without infrastructure

### 1.4 Scatter-Gather Pattern

**Source**: AWS Prescriptive Guidance, Temporal community, Azure Durable Functions

```
┌─────────────────────────────────────────────────────┐
│              SCATTER-GATHER PATTERN                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│     INPUT (Query)                                   │
│         │                                           │
│         ▼                                           │
│    ┌────┴────┐                                      │
│    │ SCATTER │  8^1 = 8 parallel tasks              │
│    └────┬────┘                                      │
│         │                                           │
│    ┌────┼────┬────┬────┬────┬────┬────┐            │
│    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼            │
│   M0   M1   M2   M3   M4   M5   M6   M7            │
│    │    │    │    │    │    │    │    │            │
│    └────┴────┴────┴────┴────┴────┴────┘            │
│         │                                           │
│         ▼                                           │
│    ┌────┴────┐                                      │
│    │ GATHER  │  8^0 = 1 consensus output            │
│    └────┬────┘                                      │
│         │                                           │
│         ▼                                           │
│     OUTPUT (Consensus)                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Implementation**: `asyncio.gather(*tasks)` returns list → merge/vote → single output

---

## 2. What's EASY for Me (Honest Assessment)

### ✅ EASY (I can write in 30 minutes)

| Task | Why Easy |
|------|----------|
| Python async HTTP calls | Standard pattern, well-documented |
| CloudEvents emission | Just JSON with schema |
| OTel console spans | No infrastructure |
| JSONL file append | Stdlib file I/O |
| Voting/consensus logic | Simple counting |
| Markdown output | Text formatting |

### ⚠️ MODERATE (Doable but slower)

| Task | Why Moderate |
|------|--------------|
| Error handling/retries | Need to test edge cases |
| Rate limit adaptation | Requires runtime feedback |
| Streaming responses | More complex async |

### ❌ HARD (I can write, YOU must run/debug)

| Task | Why Hard |
|------|----------|
| Actual HTTP execution | I can't make network calls |
| NATS integration | Requires running server |
| Full PBFT protocol | Complex message passing |
| Temporal workflows | Infrastructure setup |

---

## 3. What Would Make It EASIER

### Already Prepared ✅

| Item | Status | Location |
|------|--------|----------|
| OpenRouter config | ✅ Ready | `hot/bronze/src/orchestration/openrouter.config.ts` |
| Python LLM config | ✅ Ready | `hot/bronze/src/crewai/llm_config.py` |
| Port→Model mapping | ✅ Ready | Already in configs |
| Input data | ✅ Ready | `SPEC_CONSOLIDATION_FOR_SILVER.md` |
| Output location | ✅ Ready | `hot/bronze/artifacts/` |

### Needed (5 minutes)

| Item | Action |
|------|--------|
| `.env` with API key | Confirm `OPENROUTER_API_KEY` exists |
| `artifacts/` dir | Create `hot/bronze/artifacts/` |
| Python venv | `pip install aiohttp cloudevents opentelemetry-sdk` |

### NOT Needed (Overkill)

| Item | Why Skip |
|------|----------|
| NATS server | JSONL blackboard is sufficient |
| OTel Collector | Console exporter works |
| CrewAI/LangGraph | Pure async is simpler |
| Temporal | Not needed for single script |

---

## 4. Architecture

### 4.1 Eight Free Models (OpenRouter Dec 2025)

| Port | Model ID | Family | Context | Cost |
|------|----------|--------|---------|------|
| 0 | `meta-llama/llama-3.3-70b-instruct:free` | Meta | 128K | FREE |
| 1 | `deepseek/deepseek-chat:free` | DeepSeek | 128K | FREE |
| 2 | `google/gemini-2.0-flash-thinking-exp:free` | Google | 32K | FREE |
| 3 | `nousresearch/hermes-3-llama-3.1-405b:free` | Nous | 128K | FREE |
| 4 | `mistralai/devstral-small:free` | Mistral | 128K | FREE |
| 5 | `qwen/qwen-2.5-72b-instruct:free` | Qwen | 32K | FREE |
| 6 | `microsoft/phi-4:free` | Microsoft | 16K | FREE |
| 7 | `bytedance-seed/ui-tars-72b:free` | ByteDance | 32K | FREE |

**Total Cost: $0.00**

### 4.2 Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           SCATTER-GATHER FLOW                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. INPUT                                                                │
│     ├── Query: "What are the key concepts in these specs?"               │
│     └── Context: SPEC_CONSOLIDATION_FOR_SILVER.md (chunk)                │
│                                                                          │
│  2. SCATTER (8^1)                                                        │
│     ├── asyncio.gather(*[query_model(m, prompt) for m in MODELS_8])      │
│     ├── Each call: ~2-5 seconds                                          │
│     └── All parallel: ~5 seconds total (not 40 seconds serial)           │
│                                                                          │
│  3. EMIT ARTIFACTS (per response)                                        │
│     ├── CloudEvent → hot/bronze/artifacts/cloudevents.jsonl              │
│     ├── OTel Span → hot/bronze/artifacts/traces.jsonl                    │
│     └── Raw Response → hot/bronze/artifacts/responses/port_{n}.json      │
│                                                                          │
│  4. GATHER (8^0)                                                         │
│     ├── Extract claims from each response                                │
│     ├── Vote: Keep claims with ≥6/8 agreement (BFT quorum)               │
│     └── Synthesize: Merge consensus claims into coherent output          │
│                                                                          │
│  5. OUTPUT                                                               │
│     ├── hot/bronze/artifacts/consensus.md                                │
│     └── Blackboard signal → obsidianblackboard.jsonl                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Observability Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY (NO INFRA)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CloudEvents (WHAT happened)                                    │
│  ├── Schema: type, source, id, time, data                       │
│  ├── Output: cloudevents.jsonl (append-only)                    │
│  └── Query: grep, jq, DuckDB                                    │
│                                                                 │
│  OpenTelemetry (HOW LONG / WHERE)                               │
│  ├── Spans: scatter → per-model → gather                        │
│  ├── Attributes: model, port, latency, tokens                   │
│  ├── Exporter: ConsoleSpanExporter → traces.jsonl               │
│  └── Query: Parse JSON spans                                    │
│                                                                 │
│  Blackboard (COORDINATION)                                      │
│  ├── Schema: ts, mark, pull, msg, type, hive, gen, port         │
│  ├── Output: obsidianblackboard.jsonl                           │
│  └── Stigmergy: Agents read/write shared state                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Plan

### 5.1 Single File: `scatter_gather_research.py`

```python
#!/usr/bin/env python3
"""
8-Model BFT Scatter-Gather Research System
==========================================

Scatter: Query 8 model families in parallel (8^1)
Gather: Merge responses into consensus (8^0)
Observe: CloudEvents + OTel → JSONL

Usage:
    python scatter_gather_research.py "Your research query"
    python scatter_gather_research.py --file input.md
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from uuid import uuid4
from pathlib import Path

# CloudEvents
from cloudevents.http import CloudEvent
from cloudevents.conversion import to_json

# OpenTelemetry (console export - no collector)
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter

# ... implementation ...
```

### 5.2 Dependencies

```txt
# requirements-research.txt
aiohttp>=3.9.0
cloudevents>=1.10.0
opentelemetry-sdk>=1.21.0
python-dotenv>=1.0.0
```

### 5.3 Directory Structure

```
hot/bronze/
├── scripts/
│   ├── scatter_gather_research.py    # Main script
│   └── requirements-research.txt     # Dependencies
├── artifacts/                        # Output directory
│   ├── cloudevents.jsonl            # CloudEvents log
│   ├── traces.jsonl                 # OTel spans
│   ├── responses/                   # Raw responses per port
│   │   ├── port_0.json
│   │   ├── port_1.json
│   │   └── ...
│   └── consensus.md                 # Final gathered output
└── .env                             # OPENROUTER_API_KEY
```

---

## 6. CDD / TDD / BDD Hooks

### 6.1 Contract-Driven Development (CDD)

```python
# contracts.py
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class ResearchRequest:
    query: str
    models: List[str]  # Must have 8 entries
    timeout_seconds: int = 30

@dataclass
class ModelResponse:
    port: int
    model: str
    content: str
    latency_ms: float
    token_count: Optional[int]

@dataclass
class ConsensusResult:
    claims: List[str]          # Claims with ≥6/8 agreement
    agreement_matrix: dict     # claim → agreeing ports
    dissent: List[str]         # Claims with <6/8 agreement
```

### 6.2 Test-Driven Development (TDD)

```python
# test_scatter_gather.py
import pytest

def test_scatter_returns_8_responses():
    """8 models → 8 responses"""
    responses = await scatter(query, MODELS_8)
    assert len(responses) == 8

def test_gather_produces_single_output():
    """8 responses → 1 consensus"""
    consensus = gather(mock_responses_8)
    assert isinstance(consensus, str)
    assert len(consensus) > 0

def test_bft_quorum_requires_6_of_8():
    """BFT: 3f+1 where f=2, quorum=6"""
    responses = [mock_response(claim="X")] * 6 + [mock_response(claim="Y")] * 2
    consensus = gather(responses)
    assert "X" in consensus
    assert "Y" not in consensus  # Below quorum
```

### 6.3 Behavior-Driven Development (BDD)

```gherkin
Feature: 8-Model Scatter-Gather Research

  Scenario: Successful scatter-gather cycle
    Given I have a research query "What is HIVE/8?"
    And 8 OpenRouter models are configured
    When I execute the scatter-gather pipeline
    Then I should receive 8 parallel responses
    And each response should emit a CloudEvent
    And each response should have an OTel span
    And the gathered consensus should contain claims with ≥6/8 agreement

  Scenario: Model timeout handling
    Given I have a research query
    And 1 of 8 models times out after 30 seconds
    When I execute the scatter-gather pipeline
    Then I should receive 7 valid responses
    And the timed-out model should emit an error CloudEvent
    And the consensus should proceed with 7 responses (degraded quorum)
```

---

## 7. How to Make This EVEN Easier

### Things You Could Do (Optional)

| Action | Benefit |
|--------|---------|
| Pre-create `hot/bronze/artifacts/` | Script doesn't need to mkdir |
| Test 1 model manually | Confirm API key works |
| Install deps in venv | Script runs first try |

### Things I Will Handle

| Task | Implementation |
|------|----------------|
| All async code | Proper gather/error handling |
| CloudEvents emission | Per-response events |
| OTel spans | Scatter → model → gather hierarchy |
| JSONL writing | Atomic appends, no corruption |
| Consensus voting | Count claim overlap |
| Markdown output | Clean formatting |

### What We Skip (For Now)

| Skip | Why |
|------|-----|
| NATS | JSONL is sufficient |
| Full PBFT | Simple voting is good enough |
| Streaming | Batch is simpler |
| CrewAI | Pure async is cleaner |

---

## 8. Next Steps

### Immediate (I do now)

1. ✅ This research document (DONE)
2. 🔜 Create `scatter_gather_research.py`
3. 🔜 Create `requirements-research.txt`

### You Do (5 minutes)

1. Confirm `OPENROUTER_API_KEY` in `.env`
2. Create venv: `python -m venv .venv && .venv\Scripts\activate`
3. Install: `pip install -r hot/bronze/scripts/requirements-research.txt`
4. Run: `python hot/bronze/scripts/scatter_gather_research.py "Your query"`

### Then We Iterate

1. Review artifacts in `hot/bronze/artifacts/`
2. Adjust prompts, voting thresholds
3. Promote to silver when stable

---

## Appendix A: Full CloudEvent Schema

```json
{
  "specversion": "1.0",
  "type": "hfo.research.response",
  "source": "/hive/port/0/lidless-legion",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "time": "2025-12-31T12:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "model": "meta-llama/llama-3.3-70b-instruct:free",
    "port": 0,
    "query_hash": "abc123",
    "response": "The key concepts are...",
    "latency_ms": 2450,
    "tokens_in": 1500,
    "tokens_out": 500
  },
  "hfoport": 0,
  "hfohive": "H",
  "hfogen": 87
}
```

## Appendix B: OTel Span Hierarchy

```
scatter_gather_research (root span)
├── scatter (8 children)
│   ├── query_model (port=0, model=llama)
│   ├── query_model (port=1, model=deepseek)
│   ├── query_model (port=2, model=gemini)
│   ├── query_model (port=3, model=hermes)
│   ├── query_model (port=4, model=mistral)
│   ├── query_model (port=5, model=qwen)
│   ├── query_model (port=6, model=phi)
│   └── query_model (port=7, model=uitars)
└── gather
    ├── extract_claims
    ├── vote_consensus
    └── synthesize_output
```

---

*The spider weaves the web that weaves the spider.*  
*Port 7 | HUNT Phase Complete | Ready for INTERLOCK*
