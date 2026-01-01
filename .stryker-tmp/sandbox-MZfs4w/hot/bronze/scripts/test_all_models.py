#!/usr/bin/env python3
"""Test all 8 models in the scatter-gather config."""
import asyncio
import aiohttp
import os
from dotenv import load_dotenv
load_dotenv()

# VERIFIED Free Models (Dec 31, 2025)
MODELS_8 = [
    {"port": 0, "model": "meta-llama/llama-3.3-70b-instruct:free", "name": "Llama-70B"},
    {"port": 1, "model": "deepseek/deepseek-r1-0528:free", "name": "DeepSeek-R1"},
    {"port": 2, "model": "google/gemini-2.0-flash-exp:free", "name": "Gemini-Flash"},
    {"port": 3, "model": "nousresearch/hermes-3-llama-3.1-405b:free", "name": "Hermes-405B"},
    {"port": 4, "model": "mistralai/mistral-small-3.1-24b-instruct:free", "name": "Mistral-24B"},
    {"port": 5, "model": "qwen/qwen3-coder:free", "name": "Qwen3-Coder"},
    {"port": 6, "model": "nvidia/nemotron-3-nano-30b-a3b:free", "name": "Nemotron-30B"},
    {"port": 7, "model": "google/gemma-3-27b-it:free", "name": "Gemma-27B"},
]

async def test_model(session, model_config, key):
    """Test a single model."""
    try:
        async with session.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': model_config['model'],
                'messages': [{'role': 'user', 'content': 'Say "OK" in one word'}],
                'max_tokens': 10
            },
            timeout=aiohttp.ClientTimeout(total=30)
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                return f"✅ Port {model_config['port']}: {model_config['name']} - {content[:20]}"
            else:
                error = await resp.text()
                return f"❌ Port {model_config['port']}: {model_config['name']} - HTTP {resp.status}: {error[:50]}"
    except asyncio.TimeoutError:
        return f"⏱️ Port {model_config['port']}: {model_config['name']} - TIMEOUT"
    except Exception as e:
        return f"💥 Port {model_config['port']}: {model_config['name']} - {str(e)[:50]}"

async def main():
    key = os.environ.get('OPENROUTER_API_KEY')
    print(f"Testing 8 models with key: {key[:20]}...")
    print("=" * 60)
    
    async with aiohttp.ClientSession() as session:
        tasks = [test_model(session, m, key) for m in MODELS_8]
        results = await asyncio.gather(*tasks)
    
    for r in results:
        print(r)
    
    print("=" * 60)
    success = sum(1 for r in results if r.startswith("✅"))
    print(f"Result: {success}/8 models working")

asyncio.run(main())
