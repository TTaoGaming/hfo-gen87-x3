"""
CrewAI HIVE/8 CDD Test Suite

Tests that CrewAI Commanders properly validate signals through G0-G7 gates.
"""
import os
import sys
import json

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contracts.hive_cdd_contract import (
    create_signal,
    validate_signal,
    validate_transition,
    get_commander_by_port,
    get_commanders_by_phase,
    COMMANDERS,
    StigmergySignal,
)


def test_commander_creation():
    """Test that all 8 commanders can be created via CrewAI."""
    try:
        # Import from the orchestration folder directly to avoid shadowing
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "crewai_hive", 
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "crewai_hive.py")
        )
        crewai_hive = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(crewai_hive)
        
        create_commanders = crewai_hive.create_commanders
        commanders = create_commanders()
        
        # CORRECT way to iterate - use .values()
        print("🔄 Testing commander creation...")
        for port, agent in commanders.items():
            print(f"   ✅ Port {port}: {agent.role}")
        
        # Also test list iteration
        agent_list = list(commanders.values())
        assert len(agent_list) == 8, f"Expected 8 commanders, got {len(agent_list)}"
        
        # Verify roles
        roles = [a.role for a in commanders.values()]
        assert "Lidless Legion - Observer" in roles
        assert "Spider Sovereign - Navigator" in roles
        
        print(f"✅ All 8 commanders created successfully!")
        return True
        
    except ImportError as e:
        print(f"⚠️ CrewAI dependency not installed: {e}")
        print("   Run: pip install crewai langchain-openai")
        return False
    except Exception as e:
        print(f"⚠️ CrewAI test skipped: {e}")
        return False


def test_cdd_signal_validation():
    """Test that signals pass G0-G7 gates."""
    print("\n🔒 Testing G0-G7 Gate Validation...")
    
    # Valid signal
    signal = create_signal("HUNT: Scanning memory bank", 0, "H")
    result = validate_signal(signal.to_dict())
    assert result.valid, f"Valid signal failed: {result.errors}"
    print(f"   ✅ G0-G7 passed for valid signal")
    
    # Test each gate failure
    gate_failures = [
        ("G0", {"ts": "invalid-timestamp", "mark": 1.0, "pull": "downstream", "msg": "test", "type": "signal", "hive": "H", "gen": 87, "port": 0}),
        ("G1", {"ts": "2025-01-01T00:00:00Z", "mark": 2.5, "pull": "downstream", "msg": "test", "type": "signal", "hive": "H", "gen": 87, "port": 0}),
        ("G2", {"ts": "2025-01-01T00:00:00Z", "mark": 1.0, "pull": "invalid", "msg": "test", "type": "signal", "hive": "H", "gen": 87, "port": 0}),
        ("G3", {"ts": "2025-01-01T00:00:00Z", "mark": 1.0, "pull": "downstream", "msg": "", "type": "signal", "hive": "H", "gen": 87, "port": 0}),
        ("G4", {"ts": "2025-01-01T00:00:00Z", "mark": 1.0, "pull": "downstream", "msg": "test", "type": "invalid", "hive": "H", "gen": 87, "port": 0}),
        ("G5", {"ts": "2025-01-01T00:00:00Z", "mark": 1.0, "pull": "downstream", "msg": "test", "type": "signal", "hive": "Z", "gen": 87, "port": 0}),
        ("G6", {"ts": "2025-01-01T00:00:00Z", "mark": 1.0, "pull": "downstream", "msg": "test", "type": "signal", "hive": "H", "gen": 50, "port": 0}),
        ("G7", {"ts": "2025-01-01T00:00:00Z", "mark": 1.0, "pull": "downstream", "msg": "test", "type": "signal", "hive": "H", "gen": 87, "port": 10}),
    ]
    
    for gate, invalid_data in gate_failures:
        result = validate_signal(invalid_data)
        assert not result.valid, f"{gate} should have failed"
        assert any(gate in err for err in result.errors), f"{gate} error not found in {result.errors}"
        print(f"   ✅ {gate} correctly rejected invalid signal")
    
    print("✅ All G0-G7 gates working!")
    return True


def test_phase_transitions():
    """Test HIVE phase transition validation."""
    print("\n📊 Testing HIVE Phase Transitions...")
    
    valid_transitions = [
        (None, "H", "Start with Hunt"),
        ("H", "I", "Hunt → Interlock"),
        ("I", "V", "Interlock → Validate"),
        ("V", "E", "Validate → Evolve"),
        ("E", "H", "Evolve → Hunt (N+1)"),
        ("H", "H", "Hunt → Hunt (continue)"),
    ]
    
    for from_p, to_p, desc in valid_transitions:
        result = validate_transition(from_p, to_p)
        assert result.valid, f"{desc} should be valid, got: {result.reason}"
        print(f"   ✅ {desc}: valid")
    
    invalid_transitions = [
        (None, "I", "Skip Hunt"),
        ("H", "V", "Skip Interlock (REWARD_HACK)"),
        ("H", "E", "Skip Interlock+Validate"),
        ("I", "E", "Skip Validate"),
    ]
    
    for from_p, to_p, desc in invalid_transitions:
        result = validate_transition(from_p, to_p)
        assert not result.valid, f"{desc} should be invalid"
        print(f"   ✅ {desc}: correctly rejected ({result.violation})")
    
    print("✅ Phase transition validation working!")
    return True


def test_commander_contract_alignment():
    """Test that commanders align with contract definitions."""
    print("\n🎯 Testing Commander Contract Alignment...")
    
    # Verify all ports have commanders
    for port in range(8):
        commander = get_commander_by_port(port)
        assert commander is not None, f"No commander for port {port}"
        print(f"   ✅ Port {port}: {commander.name}")
    
    # Verify phase mappings
    phase_commanders = {
        "H": ["Lidless Legion", "Spider Sovereign"],
        "I": ["Web Weaver", "Kraken Keeper"],
        "V": ["Mirror Magus", "Pyre Praetorian"],
        "E": ["Spore Storm", "Red Regnant"],
    }
    
    for phase, expected_names in phase_commanders.items():
        commanders = get_commanders_by_phase(phase)
        names = [c.name for c in commanders]
        for expected in expected_names:
            assert expected in names, f"{expected} not found in {phase} commanders"
        print(f"   ✅ {phase} phase: {', '.join(names)}")
    
    print("✅ Commander contract alignment verified!")
    return True


def test_emit_to_blackboard():
    """Test emitting signals to blackboard file."""
    print("\n📡 Testing Blackboard Emission...")
    
    blackboard_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
        "obsidianblackboard.jsonl"
    )
    
    # Create test signal
    signal = create_signal(
        "CDD TEST: Verifying blackboard emission",
        7,  # Spider Sovereign
        "I",  # Interlock phase (testing contracts)
        "signal"
    )
    
    # Validate before emit
    result = validate_signal(signal.to_dict())
    assert result.valid, f"Signal failed validation: {result.errors}"
    
    # Append to blackboard
    with open(blackboard_path, "a") as f:
        f.write(signal.to_json() + "\n")
    
    print(f"   ✅ Emitted signal to blackboard: {signal.msg[:50]}...")
    print("✅ Blackboard emission working!")
    return True


def main():
    """Run all CDD tests."""
    print("=" * 60)
    print("🔒 HIVE/8 CDD (Contract-Driven Development) Test Suite")
    print("=" * 60)
    
    tests = [
        ("CDD Signal Validation", test_cdd_signal_validation),
        ("Phase Transitions", test_phase_transitions),
        ("Commander Contract Alignment", test_commander_contract_alignment),
        ("Blackboard Emission", test_emit_to_blackboard),
        ("Commander Creation", test_commander_creation),
    ]
    
    results = []
    for name, test_fn in tests:
        try:
            passed = test_fn()
            results.append((name, passed))
        except Exception as e:
            print(f"❌ {name} failed with exception: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 60)
    print("📊 Test Results:")
    for name, passed in results:
        status = "✅" if passed else "❌"
        print(f"   {status} {name}")
    
    passed_count = sum(1 for _, p in results if p)
    total = len(results)
    print(f"\n   {passed_count}/{total} tests passed")
    print("=" * 60)
    
    return all(p for _, p in results)


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
