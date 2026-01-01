import duckdb

con = duckdb.connect('c:/Dev/active/portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/hfo_memory.duckdb', read_only=True)
con.execute('LOAD fts')

print("="*80)
print("SEARCHING FOR FULL DOCUMENTS WITH HIVE/8 CONFIGURATION CODES...")
print("="*80)

# Find documents with HIVE/8:XXYY configuration codes
results = con.execute("""
    SELECT filename, generation, content
    FROM artifacts 
    WHERE content LIKE '%HIVE/8:1010%' 
       OR content LIKE '%HIVE/8:2121%'
       OR content LIKE '%HIVE/8:0000%'
       OR content LIKE '%HIVE/8:3232%'
       OR content LIKE '%concurrent agent%'
       OR content LIKE '%8^0%8^1%'
    ORDER BY generation DESC
    LIMIT 15
""").fetchall()

for r in results:
    print()
    print("#"*80)
    print(f"# FILE: {r[0]} (Gen {r[1]})")
    print("#"*80)
    content = r[2]
    # Print full content for docs with the key patterns
    if ':1010' in content or ':2121' in content or ':0000' in content or ':3232' in content:
        print(content)
    else:
        print(content[:4000])
    print()
    print("... [END OF DOCUMENT]")
