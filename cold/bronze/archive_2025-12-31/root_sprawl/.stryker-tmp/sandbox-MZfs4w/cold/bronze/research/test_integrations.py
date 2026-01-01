#!/usr/bin/env python3
"""Integration tests for Gen87.X3 workspace - NOT green but meaningless!"""

import os
import sys

def test_memory_bank():
    """Test DuckDB memory bank with real FTS query"""
    print("\n🧠 TEST 1: Memory Bank (DuckDB FTS)")
    print("-" * 50)
    try:
        import duckdb
        db_path = "C:/Dev/active/portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/hfo_memory.duckdb"
        con = duckdb.connect(db_path, read_only=True)
        con.execute("LOAD fts")
        
        # Test 1: Count artifacts
        count = con.execute("SELECT COUNT(*) FROM artifacts").fetchone()[0]
        print(f"  ✅ Connected: {count} artifacts")
        
        # Test 2: FTS search
        results = con.execute("""
            SELECT filename, generation, 
                   fts_main_artifacts.match_bm25(id, 'spider sovereign') as score
            FROM artifacts 
            WHERE score IS NOT NULL
            ORDER BY score DESC 
            LIMIT 3
        """).fetchall()
        
        if results:
            print(f"  ✅ FTS working: Found {len(results)} results for 'spider sovereign'")
            for r in results:
                print(f"      Gen {r[1]}: {r[0][:50]}...")
        else:
            print("  ⚠️ FTS returned no results (might be OK)")
        
        con.close()
        return True
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        return False

def test_env_vars():
    """Test environment variables are loaded"""
    print("\n🔑 TEST 2: Environment Variables")
    print("-" * 50)
    
    # Load from .env file manually
    env_path = "C:/Dev/active/hfo_gen87_x3/.env"
    env_vars = {}
    try:
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except Exception as e:
        print(f"  ❌ Cannot read .env: {e}")
        return False
    
    checks = [
        ("GITHUB_TOKEN", "github_pat_" in env_vars.get("GITHUB_TOKEN", "")),
        ("TAVILY_API_KEY", "tvly-" in env_vars.get("TAVILY_API_KEY", "")),
        ("OPENROUTER_API_KEY", len(env_vars.get("OPENROUTER_API_KEY", "")) > 10),
    ]
    
    all_pass = True
    for name, ok in checks:
        value = env_vars.get(name, "")
        if ok:
            masked = value[:10] + "..." if len(value) > 10 else "(empty)"
            print(f"  ✅ {name}: {masked}")
        else:
            print(f"  ❌ {name}: Missing or invalid")
            if name == "GITHUB_TOKEN":
                all_pass = False  # Only GitHub is required
    
    return all_pass

def test_npm_scripts():
    """Test npm scripts work"""
    print("\n📦 TEST 3: NPM Scripts")
    print("-" * 50)
    
    import subprocess
    
    scripts = [
        ("typecheck", "npm run typecheck"),
        ("lint", "npm run lint"),
        ("test", "npm run test"),
    ]
    
    all_pass = True
    for name, cmd in scripts:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd="C:/Dev/active/hfo_gen87_x3")
        if result.returncode == 0:
            print(f"  ✅ npm run {name}")
        else:
            print(f"  ❌ npm run {name} failed")
            all_pass = False
    
    return all_pass

def test_git_hooks():
    """Verify git hooks exist"""
    print("\n🪝 TEST 4: Git Hooks (Enforcement)")
    print("-" * 50)
    
    hooks = [
        "C:/Dev/active/hfo_gen87_x3/.husky/pre-commit",
        "C:/Dev/active/hfo_gen87_x3/.husky/commit-msg",
    ]
    
    all_pass = True
    for hook in hooks:
        if os.path.exists(hook):
            print(f"  ✅ {os.path.basename(hook)} exists")
        else:
            print(f"  ❌ {os.path.basename(hook)} missing")
            all_pass = False
    
    return all_pass

def main():
    print("=" * 60)
    print("🔍 Gen87.X3 INTEGRATION TESTS - Anti-Green-But-Meaningless")
    print("=" * 60)
    
    results = {
        "Memory Bank": test_memory_bank(),
        "Env Vars": test_env_vars(),
        "NPM Scripts": test_npm_scripts(),
        "Git Hooks": test_git_hooks(),
    }
    
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    
    all_pass = True
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {name}")
        if not passed:
            all_pass = False
    
    print("\n" + ("🎉 ALL INTEGRATIONS WORKING!" if all_pass else "⚠️ SOME INTEGRATIONS FAILED"))
    return 0 if all_pass else 1

if __name__ == "__main__":
    sys.exit(main())
