#!/usr/bin/env python3
"""HUNT Phase: Query memory bank for TTV and HFO concepts"""
import duckdb
import sys

DB_PATH = r"c:\Dev\active\portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52\hfo_memory.duckdb"

def search(query: str, limit: int = 10):
    """BM25 FTS search on memory bank"""
    con = duckdb.connect(DB_PATH, read_only=True)
    con.execute('LOAD fts')
    
    results = con.execute(f"""
        SELECT filename, generation, era, content,
               fts_main_artifacts.match_bm25(id, ?) as score
        FROM artifacts 
        WHERE score IS NOT NULL
        ORDER BY score DESC
        LIMIT ?
    """, [query, limit]).fetchall()
    
    print(f"\n{'='*80}")
    print(f"HUNT QUERY: '{query}' ({len(results)} results)")
    print(f"{'='*80}\n")
    
    for filename, gen, era, content, score in results:
        print(f"Gen {gen} ({era}): {filename} [score: {score:.2f}]")
        print(f"  Preview: {content[:200].replace(chr(10), ' ')}...")
        print()
    
    return results

if __name__ == "__main__":
    queries = [
        "total tool virtualization",
        "hive fleet obsidian",
        "fractal obsidian grimoire",
        "gallois lattice",
        "swarm orchestration base 8",
        "HIVE/8 hourglass",
        "web weaver port 1",
        "obsidian spider",
    ]
    
    all_results = {}
    for q in queries:
        results = search(q, limit=5)
        all_results[q] = results
    
    # Summary
    print("\n" + "="*80)
    print("HUNT SUMMARY - Key Files Found")
    print("="*80)
    seen = set()
    for q, results in all_results.items():
        for filename, gen, era, content, score in results:
            if filename not in seen and score > 1.0:
                seen.add(filename)
                print(f"  Gen {gen}: {filename}")
