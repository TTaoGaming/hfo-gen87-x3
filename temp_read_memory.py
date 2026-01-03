import duckdb
import os

db_path = r'c:\Dev\active\portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52\hfo_memory.duckdb'
con = duckdb.connect(db_path, read_only=True)
res = con.execute("SELECT content FROM artifacts WHERE filename = 'design.md' AND generation = 79").fetchone()
if res:
    print(res[0])
else:
    print('Not found')
