#!/usr/bin/env python3
"""
Gen87.X3 Progress Dashboard Generator

Generates VERIFIABLE progress metrics by reading actual files, git history, and test results.
AI agents should run this to get ground-truth status, not rely on claims.

Usage:
    python dashboard/generate_dashboard.py
    python dashboard/generate_dashboard.py --json  # Machine-readable output
"""

import subprocess
import json
import os
from datetime import datetime
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).parent.parent.parent  # hfo_gen87_x3
SANDBOX_ROOT = Path(__file__).parent.parent  # sandbox

def run_cmd(cmd: str, cwd: Path = WORKSPACE_ROOT) -> str:
    """Run a shell command and return output."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, cwd=cwd
        )
        return result.stdout.strip()
    except Exception as e:
        return f"ERROR: {e}"

def get_git_metrics() -> dict:
    """Get verifiable git metrics."""
    return {
        "total_commits": run_cmd("git rev-list --count HEAD"),
        "commits_since_main": run_cmd("git rev-list --count main..HEAD"),
        "latest_commit_hash": run_cmd("git rev-parse --short HEAD"),
        "latest_commit_message": run_cmd("git log -1 --format=%s"),
        "branch": run_cmd("git branch --show-current"),
        "uncommitted_changes": len(run_cmd("git status --porcelain").split('\n')) if run_cmd("git status --porcelain") else 0,
    }

def get_test_metrics() -> dict:
    """Get verifiable test metrics by actually running tests."""
    output = run_cmd("npm test 2>&1")
    
    # Parse vitest output
    passed = 0
    failed = 0
    total = 0
    
    for line in output.split('\n'):
        if 'Tests' in line and 'passed' in line:
            parts = line.strip().split()
            for i, part in enumerate(parts):
                if part == 'passed':
                    passed = int(parts[i-1])
                elif part == 'failed':
                    failed = int(parts[i-1])
    
    total = passed + failed
    
    return {
        "tests_passed": passed,
        "tests_failed": failed,
        "tests_total": total,
        "test_success_rate": f"{(passed/total*100):.1f}%" if total > 0 else "N/A",
        "raw_output_lines": len(output.split('\n')),
    }

def get_spec_files() -> dict:
    """Get list of specification documents with line counts."""
    specs_dir = SANDBOX_ROOT / "specs"
    specs = {}
    
    if specs_dir.exists():
        for f in specs_dir.glob("*.md"):
            with open(f, 'r', encoding='utf-8') as file:
                lines = len(file.readlines())
            specs[f.name] = {
                "exists": True,
                "lines": lines,
                "path": str(f.relative_to(WORKSPACE_ROOT)),
            }
    
    return specs

def get_blackboard_metrics() -> dict:
    """Get metrics from the blackboard JSONL file."""
    bb_path = SANDBOX_ROOT / "obsidianblackboard.jsonl"
    
    if not bb_path.exists():
        return {"exists": False, "total_signals": 0}
    
    signals_by_phase = {"H": 0, "I": 0, "V": 0, "E": 0, "X": 0}
    total = 0
    latest_ts = None
    
    with open(bb_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                signal = json.loads(line)
                total += 1
                phase = signal.get("hive", "X")
                signals_by_phase[phase] = signals_by_phase.get(phase, 0) + 1
                latest_ts = signal.get("ts", latest_ts)
            except json.JSONDecodeError:
                pass
    
    return {
        "exists": True,
        "total_signals": total,
        "by_phase": signals_by_phase,
        "latest_timestamp": latest_ts,
    }

def get_implementation_status() -> dict:
    """Check what implementation files actually exist."""
    src_dir = SANDBOX_ROOT / "src"
    
    expected_files = {
        "contracts/gesture-frame.ts": "GestureFrame Zod contract",
        "contracts/pointer-event.ts": "PointerEvent output contract",
        "smoothing/one-euro.ts": "1€ Filter implementation",
        "fsm/gesture-machine.ts": "XState FSM definition",
        "adapters/dom-adapter.ts": "DOM injection adapter",
        "adapters/v86-adapter.ts": "v86 emulator adapter",
        "adapters/excalidraw-adapter.ts": "Excalidraw adapter",
    }
    
    status = {}
    for path, description in expected_files.items():
        full_path = src_dir / path
        status[path] = {
            "description": description,
            "exists": full_path.exists(),
            "lines": 0,
        }
        if full_path.exists():
            with open(full_path, 'r', encoding='utf-8') as f:
                status[path]["lines"] = len(f.readlines())
    
    return status

def calculate_real_progress() -> dict:
    """Calculate actual progress percentage based on verifiable evidence."""
    
    # Define what constitutes 100% completion
    milestones = {
        "workspace_setup": True,  # We're running, so it exists
        "hunt_specs": len(list((SANDBOX_ROOT / "specs").glob("*.md"))) >= 3 if (SANDBOX_ROOT / "specs").exists() else False,
        "blackboard_active": (SANDBOX_ROOT / "obsidianblackboard.jsonl").exists(),
        "contracts_defined": (SANDBOX_ROOT / "src" / "contracts").exists() and len(list((SANDBOX_ROOT / "src" / "contracts").glob("*.ts"))) > 0 if (SANDBOX_ROOT / "src" / "contracts").exists() else False,
        "fsm_implemented": (SANDBOX_ROOT / "src" / "fsm" / "gesture-machine.ts").exists(),
        "filter_implemented": (SANDBOX_ROOT / "src" / "smoothing" / "one-euro.ts").exists(),
        "adapters_exist": (SANDBOX_ROOT / "src" / "adapters").exists() and len(list((SANDBOX_ROOT / "src" / "adapters").glob("*.ts"))) > 0 if (SANDBOX_ROOT / "src" / "adapters").exists() else False,
        "tests_for_gesture": False,  # Would need to check test files
    }
    
    completed = sum(1 for v in milestones.values() if v)
    total = len(milestones)
    
    return {
        "milestones": milestones,
        "completed": completed,
        "total": total,
        "percentage": f"{(completed/total*100):.0f}%",
    }

def generate_dashboard(as_json: bool = False) -> str:
    """Generate the complete dashboard."""
    
    dashboard = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "workspace": str(WORKSPACE_ROOT),
        "git": get_git_metrics(),
        "tests": get_test_metrics(),
        "specs": get_spec_files(),
        "blackboard": get_blackboard_metrics(),
        "implementation": get_implementation_status(),
        "progress": calculate_real_progress(),
    }
    
    if as_json:
        return json.dumps(dashboard, indent=2)
    
    # Generate markdown report
    md = []
    md.append("# 📊 Gen87.X3 REAL PROGRESS DASHBOARD")
    md.append(f"\n> Generated: {dashboard['generated_at']}")
    md.append("> Source: Machine-verified metrics (no hallucinations)")
    md.append("")
    
    # Progress summary
    progress = dashboard['progress']
    md.append("## 🎯 OVERALL PROGRESS")
    md.append(f"\n**{progress['percentage']}** complete ({progress['completed']}/{progress['total']} milestones)")
    md.append("")
    md.append("| Milestone | Status |")
    md.append("|-----------|--------|")
    for name, done in progress['milestones'].items():
        status = "✅" if done else "❌"
        md.append(f"| {name.replace('_', ' ').title()} | {status} |")
    
    # Git metrics
    git = dashboard['git']
    md.append("\n## 📝 Git Metrics (VERIFIABLE)")
    md.append(f"\n- **Branch**: `{git['branch']}`")
    md.append(f"- **Commits**: {git['total_commits']} total, {git['commits_since_main']} since main")
    md.append(f"- **Latest**: `{git['latest_commit_hash']}` - {git['latest_commit_message']}")
    md.append(f"- **Uncommitted changes**: {git['uncommitted_changes']}")
    
    # Test metrics
    tests = dashboard['tests']
    md.append("\n## 🧪 Test Metrics (VERIFIABLE)")
    md.append(f"\n- **Passed**: {tests['tests_passed']}/{tests['tests_total']}")
    md.append(f"- **Success rate**: {tests['test_success_rate']}")
    
    # Spec files
    md.append("\n## 📋 Spec Documents (VERIFIABLE)")
    md.append("\n| File | Lines | Status |")
    md.append("|------|-------|--------|")
    for name, info in dashboard['specs'].items():
        md.append(f"| {name} | {info['lines']} | ✅ Exists |")
    
    # Blackboard
    bb = dashboard['blackboard']
    if bb['exists']:
        md.append("\n## 📡 Blackboard Signals (VERIFIABLE)")
        md.append(f"\n- **Total signals**: {bb['total_signals']}")
        md.append("- **By HIVE phase**:")
        for phase, count in bb['by_phase'].items():
            if count > 0:
                md.append(f"  - {phase}: {count}")
        md.append(f"- **Latest**: {bb['latest_timestamp']}")
    
    # Implementation status
    md.append("\n## 🔧 Implementation Status (VERIFIABLE)")
    md.append("\n| Component | Status | Lines |")
    md.append("|-----------|--------|-------|")
    for path, info in dashboard['implementation'].items():
        status = "✅" if info['exists'] else "❌ NOT CREATED"
        lines = info['lines'] if info['exists'] else "-"
        md.append(f"| {info['description']} | {status} | {lines} |")
    
    md.append("\n---")
    md.append("\n*Run `python dashboard/generate_dashboard.py --json` for machine-readable output*")
    
    return "\n".join(md)

if __name__ == "__main__":
    import sys
    
    as_json = "--json" in sys.argv
    print(generate_dashboard(as_json))
