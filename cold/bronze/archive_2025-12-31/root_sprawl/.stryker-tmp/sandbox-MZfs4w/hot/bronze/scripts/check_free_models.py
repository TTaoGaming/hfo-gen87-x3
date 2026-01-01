#!/usr/bin/env python3
"""Quick script to fetch current free models from OpenRouter."""
import asyncio
import aiohttp
import os
from dotenv import load_dotenv
load_dotenv()

async def get_free_models():
    key = os.environ.get('OPENROUTER_API_KEY')
    async with aiohttp.ClientSession() as session:
        async with session.get(
            'https://openrouter.ai/api/v1/models',
            headers={'Authorization': f'Bearer {key}'}
        ) as resp:
            data = await resp.json()
            models = data.get('data', [])
            
            # Filter free models
            free_models = [m for m in models if m.get('pricing', {}).get('prompt') == '0']
            
            print(f'Total models: {len(models)}')
            print(f'Free models: {len(free_models)}')
            print()
            print('=== FREE MODELS ===')
            for m in sorted(free_models, key=lambda x: x['id']):
                ctx = m.get('context_length', 'N/A')
                print(f"  {m['id']} (ctx: {ctx})")

asyncio.run(get_free_models())
