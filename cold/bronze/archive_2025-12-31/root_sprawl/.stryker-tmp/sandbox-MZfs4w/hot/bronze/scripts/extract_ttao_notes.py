#!/usr/bin/env python3
"""
Extract all ttao/tommy notes from Memory Bank and compile into single file.
HUNT phase task - gathering exemplars from past generations.
"""

import duckdb
import json
from datetime import datetime
from pathlib import Path

MEMORY_DB = Path("c:/Dev/active/portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/hfo_memory.duckdb")
OUTPUT_MD = Path("c:/Dev/active/hfo_gen87_x3/sandbox/TTAO_NOTES_COMPILATION.md")
OUTPUT_JSON = Path("c:/Dev/active/hfo_gen87_x3/sandbox/ttao_notes_compilation.json")

def main():
    con = duckdb.connect(str(MEMORY_DB), read_only=True)
    
    # Find all ttao/tommy related files
    query = """
        SELECT filename, generation, era, content, length(content) as size
        FROM artifacts 
        WHERE lower(filename) LIKE '%ttao%' 
           OR lower(filename) LIKE '%tommy%'
        ORDER BY generation DESC, filename
    """
    
    results = con.execute(query).fetchall()
    
    print(f"Found {len(results)} ttao/tommy files in Memory Bank")
    print("=" * 60)
    
    # Collect all notes
    notes_data = []
    
    for filename, gen, era, content, size in results:
        print(f"Gen {gen} ({era}): {filename} [{size} chars]")
        notes_data.append({
            "filename": filename,
            "generation": gen,
            "era": era,
            "size": size,
            "content": content
        })
    
    # Also get current workspace files
    current_files = [
        Path("c:/Dev/active/hfo_gen87_x3/ttao-notes-2025-12-29.md"),
        Path("c:/Dev/active/hfo_kiro_gen85/_archived_gen85_docs/ttao-notes-2025-12-27-1106pm.md")
    ]
    
    for f in current_files:
        if f.exists():
            content = f.read_text(encoding='utf-8')
            print(f"Current: {f.name} [{len(content)} chars]")
            notes_data.append({
                "filename": f.name,
                "generation": 87 if "87" in str(f) else 85,
                "era": "hfo",
                "size": len(content),
                "content": content
            })
    
    # Write JSON output
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump({
            "extracted_at": datetime.utcnow().isoformat() + "Z",
            "total_files": len(notes_data),
            "notes": notes_data
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\nJSON saved to: {OUTPUT_JSON}")
    
    # Write Markdown compilation
    with open(OUTPUT_MD, 'w', encoding='utf-8') as f:
        f.write(f"# TTao Notes Compilation\n\n")
        f.write(f"> **Extracted**: {datetime.utcnow().isoformat()}Z\n")
        f.write(f"> **Total Files**: {len(notes_data)}\n")
        f.write(f"> **Source**: HFO Memory Bank (Pre-HFO to Gen84) + Current Workspace\n\n")
        f.write("---\n\n")
        f.write("## Table of Contents\n\n")
        
        for i, note in enumerate(notes_data):
            f.write(f"{i+1}. Gen {note['generation']} ({note['era']}): {note['filename']}\n")
        
        f.write("\n---\n\n")
        
        for i, note in enumerate(notes_data):
            f.write(f"## {i+1}. {note['filename']}\n\n")
            f.write(f"**Generation**: {note['generation']} | **Era**: {note['era']} | **Size**: {note['size']} chars\n\n")
            # Full content without truncation
            content = note['content']
            f.write(content)
            f.write("\n\n---\n\n")
    
    print(f"Markdown saved to: {OUTPUT_MD}")
    print(f"\nDone! {len(notes_data)} notes compiled.")

if __name__ == "__main__":
    main()
