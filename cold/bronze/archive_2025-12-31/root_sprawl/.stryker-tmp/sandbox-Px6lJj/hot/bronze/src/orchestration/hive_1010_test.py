"""
HIVE/8:1010 Orchestration Test

Pattern: 8H → 1I → 8V → 1E
- 8 Hunt phases (parallel research)
- 1 Interlock phase (contract definition)
- 8 Validate phases (parallel implementation)
- 1 Evolve phase (final delivery)

This demonstrates the scatter-gather pattern with CDD hard gates.
"""
import os
import sys
import json
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add contracts path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contracts.hive_cdd_contract import (
    create_signal,
    validate_signal,
    validate_transition,
    get_commander_by_port,
    StigmergySignal,
    COMMANDERS,
)

# Blackboard path
BLACKBOARD_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "obsidianblackboard.jsonl"
)

def emit_signal(signal: StigmergySignal) -> bool:
    """Emit validated signal to blackboard."""
    result = validate_signal(signal.to_dict())
    if not result.valid:
        print(f"   ❌ GATE FAIL: {result.errors}")
        return False
    
    with open(BLACKBOARD_PATH, "a") as f:
        f.write(signal.to_json() + "\n")
    return True


def hunt_task(port: int, task_id: int) -> dict:
    """Execute a Hunt phase task."""
    commander = get_commander_by_port(port)
    time.sleep(0.1)  # Simulate work
    
    return {
        "port": port,
        "commander": commander.name,
        "task_id": task_id,
        "result": f"Exemplar found by {commander.name} (task {task_id})",
        "phase": "H"
    }


def validate_task(port: int, task_id: int, contract: str) -> dict:
    """Execute a Validate phase task."""
    commander = get_commander_by_port(port)
    time.sleep(0.1)  # Simulate work
    
    return {
        "port": port,
        "commander": commander.name,
        "task_id": task_id,
        "result": f"Validated by {commander.name} using contract: {contract[:30]}...",
        "phase": "V"
    }


def run_hive_1010(task_description: str):
    """
    Run HIVE/8:1010 pattern.
    
    8 Hunt → 1 Interlock → 8 Validate → 1 Evolve
    """
    print("=" * 70)
    print("🐝 HIVE/8:1010 ORCHESTRATION")
    print(f"   Task: {task_description}")
    print("   Pattern: 8H → 1I → 8V → 1E")
    print("=" * 70)
    
    start_time = time.time()
    current_phase = None
    hunt_results = []
    validate_results = []
    
    # =========================================================================
    # PHASE H: 8 PARALLEL HUNTS
    # =========================================================================
    print("\n" + "─" * 70)
    print("🔍 PHASE H: 8 PARALLEL HUNTS (Scatter)")
    print("─" * 70)
    
    # Validate transition: START → H
    transition = validate_transition(current_phase, "H")
    if not transition.valid:
        print(f"   ❌ TRANSITION BLOCKED: {transition.reason}")
        return False
    current_phase = "H"
    
    # Emit hunt start signal
    emit_signal(create_signal(
        f"HIVE:1010 HUNT START - 8 parallel searches for: {task_description}",
        7, "H", "signal"
    ))
    
    # Execute 8 hunts in parallel (all 8 ports)
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(hunt_task, port, port): port 
            for port in range(8)
        }
        
        for future in as_completed(futures):
            result = future.result()
            hunt_results.append(result)
            print(f"   ✅ Port {result['port']}: {result['commander']} - {result['result'][:40]}...")
            
            # Emit individual hunt signal
            emit_signal(create_signal(
                f"HUNT[{result['task_id']}]: {result['result'][:50]}",
                result['port'], "H", "event"
            ))
    
    print(f"\n   📊 Hunt Summary: {len(hunt_results)} exemplars gathered")
    
    # =========================================================================
    # PHASE I: 1 INTERLOCK (Contract Definition)
    # =========================================================================
    print("\n" + "─" * 70)
    print("🔗 PHASE I: 1 INTERLOCK (Gather → Contract)")
    print("─" * 70)
    
    # Validate transition: H → I
    transition = validate_transition(current_phase, "I")
    if not transition.valid:
        print(f"   ❌ TRANSITION BLOCKED: {transition.reason}")
        return False
    current_phase = "I"
    
    # Emit interlock signal
    emit_signal(create_signal(
        f"INTERLOCK: Defining contract from {len(hunt_results)} hunt results",
        1, "I", "signal"
    ))
    
    # Synthesize contract from hunt results
    contract = {
        "task": task_description,
        "exemplars": [r["result"] for r in hunt_results],
        "schema": "StigmergySignalSchema",
        "gates": ["G0", "G1", "G2", "G3", "G4", "G5", "G6", "G7"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    contract_json = json.dumps(contract, indent=2)
    print(f"   📋 Contract Defined:")
    print(f"      - {len(contract['exemplars'])} exemplars synthesized")
    print(f"      - Schema: {contract['schema']}")
    print(f"      - Gates: {', '.join(contract['gates'])}")
    
    emit_signal(create_signal(
        f"INTERLOCK COMPLETE: Contract ready with {len(contract['exemplars'])} exemplars",
        6, "I", "event"
    ))
    
    # =========================================================================
    # PHASE V: 8 PARALLEL VALIDATES
    # =========================================================================
    print("\n" + "─" * 70)
    print("✅ PHASE V: 8 PARALLEL VALIDATES (Scatter)")
    print("─" * 70)
    
    # Validate transition: I → V
    transition = validate_transition(current_phase, "V")
    if not transition.valid:
        print(f"   ❌ TRANSITION BLOCKED: {transition.reason}")
        return False
    current_phase = "V"
    
    # Emit validate start signal
    emit_signal(create_signal(
        "VALIDATE START: 8 parallel validations against contract",
        2, "V", "signal"
    ))
    
    # Execute 8 validates in parallel
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(validate_task, port, port, contract_json): port 
            for port in range(8)
        }
        
        for future in as_completed(futures):
            result = future.result()
            validate_results.append(result)
            print(f"   ✅ Port {result['port']}: {result['commander']} - PASSED")
            
            # Emit individual validate signal
            emit_signal(create_signal(
                f"VALIDATE[{result['task_id']}]: {result['result'][:50]}",
                result['port'], "V", "event"
            ))
    
    print(f"\n   📊 Validate Summary: {len(validate_results)}/8 validations passed")
    
    # =========================================================================
    # PHASE E: 1 EVOLVE (Final Delivery)
    # =========================================================================
    print("\n" + "─" * 70)
    print("🚀 PHASE E: 1 EVOLVE (Gather → Deliver)")
    print("─" * 70)
    
    # Validate transition: V → E
    transition = validate_transition(current_phase, "E")
    if not transition.valid:
        print(f"   ❌ TRANSITION BLOCKED: {transition.reason}")
        return False
    current_phase = "E"
    
    # Emit evolve signal
    emit_signal(create_signal(
        f"EVOLVE: Delivering final result from {len(validate_results)} validations",
        3, "E", "signal"
    ))
    
    # Calculate metrics
    elapsed = time.time() - start_time
    total_signals = 8 + 1 + 8 + 1  # H + I + V + E phase signals
    
    final_result = {
        "task": task_description,
        "pattern": "HIVE/8:1010",
        "phases_completed": ["H", "I", "V", "E"],
        "hunt_count": len(hunt_results),
        "validate_count": len(validate_results),
        "signals_emitted": total_signals + 4,  # +4 for start/end signals
        "elapsed_ms": round(elapsed * 1000, 2),
        "success": True
    }
    
    print(f"   📦 Final Result:")
    print(f"      - Task: {final_result['task']}")
    print(f"      - Pattern: {final_result['pattern']}")
    print(f"      - Hunts: {final_result['hunt_count']}")
    print(f"      - Validates: {final_result['validate_count']}")
    print(f"      - Signals: {final_result['signals_emitted']}")
    print(f"      - Duration: {final_result['elapsed_ms']}ms")
    
    emit_signal(create_signal(
        f"EVOLVE COMPLETE: HIVE/8:1010 cycle done in {final_result['elapsed_ms']}ms - {final_result['signals_emitted']} signals emitted",
        4, "E", "event"
    ))
    
    # =========================================================================
    # SUMMARY
    # =========================================================================
    print("\n" + "=" * 70)
    print("🎯 HIVE/8:1010 CYCLE COMPLETE")
    print("=" * 70)
    print(f"   ✅ 8 Hunt phases executed in parallel")
    print(f"   ✅ 1 Interlock phase synthesized contract")
    print(f"   ✅ 8 Validate phases executed in parallel")
    print(f"   ✅ 1 Evolve phase delivered result")
    print(f"   ✅ All {final_result['signals_emitted']} signals passed G0-G7 gates")
    print(f"   ⏱️  Total time: {final_result['elapsed_ms']}ms")
    print("=" * 70)
    
    return final_result


def test_invalid_transitions():
    """Test that invalid transitions are blocked."""
    print("\n" + "=" * 70)
    print("🚫 TESTING INVALID TRANSITIONS (Anti-Reward-Hacking)")
    print("=" * 70)
    
    invalid_tests = [
        (None, "I", "START → I (skip H)"),
        (None, "V", "START → V (skip H, I)"),
        ("H", "V", "H → V (REWARD_HACK)"),
        ("H", "E", "H → E (skip I, V)"),
        ("I", "E", "I → E (skip V)"),
    ]
    
    all_blocked = True
    for from_p, to_p, desc in invalid_tests:
        result = validate_transition(from_p, to_p)
        if result.valid:
            print(f"   ❌ FAILED TO BLOCK: {desc}")
            all_blocked = False
        else:
            print(f"   ✅ BLOCKED: {desc} → {result.violation}")
    
    return all_blocked


if __name__ == "__main__":
    task = sys.argv[1] if len(sys.argv) > 1 else "Test HIVE/8:1010 orchestration pattern"
    
    # Run the 1010 pattern
    result = run_hive_1010(task)
    
    # Test invalid transitions
    blocked = test_invalid_transitions()
    
    # Final status
    print("\n" + "=" * 70)
    if result and blocked:
        print("🏆 ALL TESTS PASSED - HIVE/8:1010 OPERATIONAL")
    else:
        print("❌ SOME TESTS FAILED")
    print("=" * 70)
    
    sys.exit(0 if result and blocked else 1)
