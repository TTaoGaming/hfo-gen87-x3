import duckdb
import sys

DB_PATH = 'c:/Dev/active/portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/hfo_memory.duckdb'

con = duckdb.connect(DB_PATH, read_only=True)
con.execute('LOAD fts')

print("="*100)
print("SEARCHING FOR HIVE/8 CONFIGURATION CODES (1010, 2121, 0000, 3232)")
print("="*100)

# Search for HIVE configurations
results = con.execute("""
    SELECT filename, generation, content
    FROM artifacts 
    WHERE content LIKE '%HIVE/8:1010%' 
       OR content LIKE '%HIVE/8:2121%'
       OR content LIKE '%HIVE/8:0000%'
       OR content LIKE '%8^0, 8^0%'
       OR content LIKE '%8^1, 8^0%'
    ORDER BY generation DESC
    LIMIT 20
""").fetchall()

print(f"\nFound {len(results)} documents with HIVE/8 configuration codes\n")

for i, (filename, gen, content) in enumerate(results):
    print()
    print("="*100)
    print(f"DOCUMENT {i+1}: {filename} (Gen {gen})")
    print("="*100)
    
    # Extract HIVE/8 relevant sections
    lines = content.split('\n')
    in_relevant = False
    relevant_lines = []
    
    for line in lines:
        # Check for HIVE config patterns
        if any(p in line for p in [':0000', ':1010', ':2121', ':3232', 'HIVE/8', '8^0', '8^1', 'concurrent', 'agent']):
            in_relevant = True
            relevant_lines.append(line)
        elif in_relevant and line.strip() == '':
            relevant_lines.append(line)
            if len(relevant_lines) > 3 and relevant_lines[-3].strip() == '':
                in_relevant = False
        elif in_relevant:
            relevant_lines.append(line)
            if len(relevant_lines) > 50:  # Limit per section
                relevant_lines.append("... [continues]")
                break
    
    if relevant_lines:
        print('\n'.join(relevant_lines[:100]))
    else:
        # Show first 2000 chars if no specific matches
        print(content[:2000])
    
    print("\n--- END DOCUMENT ---\n")

con.close()
print("\n\nSEARCH COMPLETE")
