"""
HIVE/8 CDD (Contract-Driven Development) Master Contract - Python Port

This file mirrors the TypeScript contracts for CrewAI/Python interoperability.
ALL Python agents MUST validate signals through these contracts.

╔════════════════════════════════════════════════════════════════════════════╗
║  HARD GATES G0-G7 (Signal Validation)                                      ║
╠════╦══════════════════════════════════════════════════════════════════════╣
║ G0 ║ ts    - Valid ISO8601 UTC timestamp                                  ║
║ G1 ║ mark  - Confidence 0.0 to 1.0                                        ║
║ G2 ║ pull  - Direction: upstream | downstream | lateral                   ║
║ G3 ║ msg   - Non-empty human-readable message                             ║
║ G4 ║ type  - Category: signal | event | error | metric                    ║
║ G5 ║ hive  - Phase: H | I | V | E | X                                     ║
║ G6 ║ gen   - Generation >= 87                                             ║
║ G7 ║ port  - Port number 0-7                                              ║
╚════╩══════════════════════════════════════════════════════════════════════╝

@module contracts/hive_cdd_contract
@hive I (Interlock) - Contract definition phase
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Literal, Dict, Any
import re
import json

# =============================================================================
# CONSTANTS
# =============================================================================

CURRENT_GEN = 87
MIN_GEN = 87
MAX_PORT = 7

# =============================================================================
# ENUMS
# =============================================================================

class PullDirection(str, Enum):
    UPSTREAM = "upstream"
    DOWNSTREAM = "downstream"
    LATERAL = "lateral"


class SignalType(str, Enum):
    SIGNAL = "signal"
    EVENT = "event"
    ERROR = "error"
    METRIC = "metric"


class HivePhase(str, Enum):
    H = "H"  # Hunt
    I = "I"  # Interlock
    V = "V"  # Validate
    E = "E"  # Evolve
    X = "X"  # Handoff


class CommanderVerb(str, Enum):
    SENSE = "SENSE"
    FUSE = "FUSE"
    SHAPE = "SHAPE"
    DELIVER = "DELIVER"
    TEST = "TEST"
    DEFEND = "DEFEND"
    STORE = "STORE"
    DECIDE = "DECIDE"


class Violation(str, Enum):
    SKIPPED_HUNT = "SKIPPED_HUNT"
    SKIPPED_INTERLOCK = "SKIPPED_INTERLOCK"
    SKIPPED_VALIDATE = "SKIPPED_VALIDATE"
    REWARD_HACK = "REWARD_HACK"
    INVALID_HANDOFF = "INVALID_HANDOFF"


# =============================================================================
# DATACLASSES (Contracts)
# =============================================================================

@dataclass
class StigmergySignal:
    """8-field stigmergy signal - G0-G7 hard gate validated"""
    ts: str         # G0: ISO8601 timestamp
    mark: float     # G1: Confidence 0-1
    pull: str       # G2: upstream | downstream | lateral
    msg: str        # G3: Non-empty message
    type: str       # G4: signal | event | error | metric
    hive: str       # G5: H | I | V | E | X
    gen: int        # G6: Generation >= 87
    port: int       # G7: Port 0-7
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "ts": self.ts,
            "mark": self.mark,
            "pull": self.pull,
            "msg": self.msg,
            "type": self.type,
            "hive": self.hive,
            "gen": self.gen,
            "port": self.port,
        }
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict())
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "StigmergySignal":
        return StigmergySignal(
            ts=data["ts"],
            mark=data["mark"],
            pull=data["pull"],
            msg=data["msg"],
            type=data["type"],
            hive=data["hive"],
            gen=data["gen"],
            port=data["port"],
        )


@dataclass
class PhaseTransition:
    """Phase transition validation result"""
    from_phase: Optional[str]
    to_phase: str
    valid: bool
    violation: Optional[str] = None
    reason: Optional[str] = None


@dataclass
class Commander:
    """HIVE Commander definition"""
    port: int
    name: str
    role: str
    verb: str
    hive_phase: List[str]
    mantra: str


@dataclass
class PhaseResult:
    """Result from executing a HIVE phase"""
    phase: str
    output: str
    timestamp: str
    port: int
    success: bool
    error: Optional[str] = None


@dataclass
class HiveCycleResult:
    """Complete HIVE cycle result"""
    task: str
    cycle: int
    phases: List[PhaseResult]
    final_phase: str
    success: bool
    duration_ms: Optional[float] = None


@dataclass
class ValidationResult:
    """Signal validation result"""
    valid: bool
    errors: List[str]
    signal: Optional[StigmergySignal] = None


# =============================================================================
# ALLOWED TRANSITIONS
# =============================================================================

ALLOWED_TRANSITIONS: Dict[str, List[str]] = {
    "H": ["H", "I", "X"],  # Hunt → Hunt, Interlock, or Handoff
    "I": ["I", "V", "X"],  # Interlock → Interlock, Validate, or Handoff
    "V": ["V", "E", "X"],  # Validate → Validate, Evolve, or Handoff
    "E": ["E", "H", "X"],  # Evolve → Evolve, Hunt (N+1), or Handoff
    "X": ["H", "I", "V", "E"],  # Handoff → any phase
}


# =============================================================================
# COMMANDERS
# =============================================================================

COMMANDERS: List[Commander] = [
    Commander(0, "Lidless Legion", "Observer", "SENSE", ["H"], "How do we SENSE the SENSE?"),
    Commander(1, "Web Weaver", "Bridger", "FUSE", ["I"], "How do we FUSE the FUSE?"),
    Commander(2, "Mirror Magus", "Shaper", "SHAPE", ["V"], "How do we SHAPE the SHAPE?"),
    Commander(3, "Spore Storm", "Injector", "DELIVER", ["E"], "How do we DELIVER the DELIVER?"),
    Commander(4, "Red Regnant", "Disruptor", "TEST", ["E"], "How do we TEST the TEST?"),
    Commander(5, "Pyre Praetorian", "Immunizer", "DEFEND", ["V"], "How do we DEFEND the DEFEND?"),
    Commander(6, "Kraken Keeper", "Assimilator", "STORE", ["I"], "How do we STORE the STORE?"),
    Commander(7, "Spider Sovereign", "Navigator", "DECIDE", ["H"], "How do we DECIDE the DECIDE?"),
]


# =============================================================================
# VALIDATORS
# =============================================================================

ISO8601_REGEX = re.compile(r"^[+-]?\d{4,6}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$")


def validate_g0_timestamp(ts: Any) -> Optional[str]:
    """G0: Validate ISO8601 timestamp"""
    if not isinstance(ts, str):
        return "G0 FAIL: ts must be string"
    if not ISO8601_REGEX.match(ts):
        return "G0 FAIL: ts must be valid ISO8601 UTC (YYYY-MM-DDTHH:mm:ssZ)"
    try:
        datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except ValueError:
        return "G0 FAIL: ts is not a valid datetime"
    return None


def validate_g1_mark(mark: Any) -> Optional[str]:
    """G1: Validate mark (confidence 0-1)"""
    if not isinstance(mark, (int, float)):
        return "G1 FAIL: mark must be number"
    if mark < 0 or mark > 1:
        return "G1 FAIL: mark must be between 0.0 and 1.0"
    return None


def validate_g2_pull(pull: Any) -> Optional[str]:
    """G2: Validate pull direction"""
    if not isinstance(pull, str):
        return "G2 FAIL: pull must be string"
    if pull not in ["upstream", "downstream", "lateral"]:
        return "G2 FAIL: pull must be one of: upstream, downstream, lateral"
    return None


def validate_g3_message(msg: Any) -> Optional[str]:
    """G3: Validate message"""
    if not isinstance(msg, str):
        return "G3 FAIL: msg must be string"
    if len(msg) == 0:
        return "G3 FAIL: msg must be non-empty string"
    return None


def validate_g4_type(signal_type: Any) -> Optional[str]:
    """G4: Validate signal type"""
    if not isinstance(signal_type, str):
        return "G4 FAIL: type must be string"
    if signal_type not in ["signal", "event", "error", "metric"]:
        return "G4 FAIL: type must be one of: signal, event, error, metric"
    return None


def validate_g5_hive(hive: Any) -> Optional[str]:
    """G5: Validate HIVE phase"""
    if not isinstance(hive, str):
        return "G5 FAIL: hive must be string"
    if hive not in ["H", "I", "V", "E", "X"]:
        return "G5 FAIL: hive must be one of: H, I, V, E, X"
    return None


def validate_g6_generation(gen: Any) -> Optional[str]:
    """G6: Validate generation"""
    if not isinstance(gen, int):
        return "G6 FAIL: gen must be integer"
    if gen < MIN_GEN:
        return f"G6 FAIL: gen must be >= {MIN_GEN}"
    return None


def validate_g7_port(port: Any) -> Optional[str]:
    """G7: Validate port"""
    if not isinstance(port, int):
        return "G7 FAIL: port must be integer"
    if port < 0 or port > MAX_PORT:
        return f"G7 FAIL: port must be between 0 and {MAX_PORT}"
    return None


def validate_signal(data: Dict[str, Any]) -> ValidationResult:
    """
    Validate a signal through ALL G0-G7 gates
    
    Args:
        data: Dictionary with signal fields
        
    Returns:
        ValidationResult with valid flag, errors list, and parsed signal if valid
    """
    errors: List[str] = []
    
    # Check required fields exist
    required = ["ts", "mark", "pull", "msg", "type", "hive", "gen", "port"]
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: {field}")
    
    if errors:
        return ValidationResult(valid=False, errors=errors)
    
    # Validate each gate
    validators = [
        ("ts", validate_g0_timestamp),
        ("mark", validate_g1_mark),
        ("pull", validate_g2_pull),
        ("msg", validate_g3_message),
        ("type", validate_g4_type),
        ("hive", validate_g5_hive),
        ("gen", validate_g6_generation),
        ("port", validate_g7_port),
    ]
    
    for field, validator in validators:
        error = validator(data[field])
        if error:
            errors.append(error)
    
    if errors:
        return ValidationResult(valid=False, errors=errors)
    
    # Create validated signal
    signal = StigmergySignal.from_dict(data)
    return ValidationResult(valid=True, errors=[], signal=signal)


def validate_transition(from_phase: Optional[str], to_phase: str) -> PhaseTransition:
    """
    Validate a phase transition
    
    Args:
        from_phase: Current phase (None if starting)
        to_phase: Target phase
        
    Returns:
        PhaseTransition with validation result
    """
    # Validate to_phase
    if to_phase not in ["H", "I", "V", "E", "X"]:
        return PhaseTransition(
            from_phase=from_phase,
            to_phase=to_phase,
            valid=False,
            violation="INVALID_HANDOFF",
            reason=f"Invalid target phase: {to_phase}"
        )
    
    # First signal must be H (Hunt)
    if from_phase is None:
        if to_phase == "H":
            return PhaseTransition(
                from_phase=None,
                to_phase=to_phase,
                valid=True,
                reason="Starting HIVE cycle with Hunt"
            )
        return PhaseTransition(
            from_phase=None,
            to_phase=to_phase,
            valid=False,
            violation="SKIPPED_HUNT",
            reason="Must start with Hunt phase"
        )
    
    # Check allowed transitions
    if to_phase in ALLOWED_TRANSITIONS.get(from_phase, []):
        return PhaseTransition(
            from_phase=from_phase,
            to_phase=to_phase,
            valid=True,
            reason=f"Valid: {from_phase} → {to_phase}"
        )
    
    # Determine violation type
    violation = "SKIPPED_HUNT"
    if from_phase == "H" and to_phase in ["V", "E"]:
        violation = "SKIPPED_INTERLOCK"
    elif from_phase == "I" and to_phase == "E":
        violation = "SKIPPED_VALIDATE"
    elif from_phase == "H" and to_phase == "V":
        violation = "REWARD_HACK"  # Skipping RED (tests) to go GREEN
    
    return PhaseTransition(
        from_phase=from_phase,
        to_phase=to_phase,
        valid=False,
        violation=violation,
        reason=f"Invalid transition: {from_phase} → {to_phase}"
    )


def create_signal(
    msg: str,
    port: int,
    hive: str,
    signal_type: str = "signal",
    mark: float = 1.0
) -> StigmergySignal:
    """
    Create a valid signal with current timestamp
    
    Args:
        msg: Human-readable message
        port: Port number 0-7
        hive: HIVE phase (H, I, V, E, X)
        signal_type: Signal type (signal, event, error, metric)
        mark: Confidence 0-1
        
    Returns:
        Validated StigmergySignal
    """
    return StigmergySignal(
        ts=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        mark=mark,
        pull="downstream",
        msg=msg,
        type=signal_type,
        hive=hive,
        gen=CURRENT_GEN,
        port=port,
    )


def get_commander_by_port(port: int) -> Optional[Commander]:
    """Get commander by port number"""
    if 0 <= port <= MAX_PORT:
        return COMMANDERS[port]
    return None


def get_commanders_by_phase(phase: str) -> List[Commander]:
    """Get all commanders associated with a HIVE phase"""
    return [c for c in COMMANDERS if phase in c.hive_phase]


# =============================================================================
# JSON SCHEMA EXPORT (for interop)
# =============================================================================

def get_json_schema() -> Dict[str, Any]:
    """Export schemas as JSON Schema for TypeScript validation"""
    return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "HIVE/8 CDD Contract",
        "definitions": {
            "StigmergySignal": {
                "type": "object",
                "required": ["ts", "mark", "pull", "msg", "type", "hive", "gen", "port"],
                "properties": {
                    "ts": {"type": "string", "format": "date-time", "description": "G0: ISO8601 timestamp"},
                    "mark": {"type": "number", "minimum": 0, "maximum": 1, "description": "G1: Confidence 0-1"},
                    "pull": {"type": "string", "enum": ["upstream", "downstream", "lateral"], "description": "G2: Direction"},
                    "msg": {"type": "string", "minLength": 1, "description": "G3: Message"},
                    "type": {"type": "string", "enum": ["signal", "event", "error", "metric"], "description": "G4: Type"},
                    "hive": {"type": "string", "enum": ["H", "I", "V", "E", "X"], "description": "G5: Phase"},
                    "gen": {"type": "integer", "minimum": MIN_GEN, "description": "G6: Generation"},
                    "port": {"type": "integer", "minimum": 0, "maximum": MAX_PORT, "description": "G7: Port"},
                },
            },
            "PhaseTransition": {
                "type": "object",
                "required": ["from_phase", "to_phase", "valid"],
                "properties": {
                    "from_phase": {"type": ["string", "null"], "enum": ["H", "I", "V", "E", "X", None]},
                    "to_phase": {"type": "string", "enum": ["H", "I", "V", "E", "X"]},
                    "valid": {"type": "boolean"},
                    "violation": {"type": "string"},
                    "reason": {"type": "string"},
                },
            },
        },
    }


# =============================================================================
# CLI ENTRY POINT (for testing)
# =============================================================================

if __name__ == "__main__":
    import sys
    
    print("🔒 HIVE/8 CDD Contract (Python)")
    print("=" * 60)
    
    # Test valid signal
    valid_signal = create_signal("Test signal", 7, "H")
    print(f"\n✅ Created signal: {valid_signal.to_json()}")
    
    # Validate it
    result = validate_signal(valid_signal.to_dict())
    print(f"   Validation: valid={result.valid}, errors={result.errors}")
    
    # Test invalid signal
    invalid_data = {"ts": "invalid", "mark": 2.0, "pull": "wrong", "msg": "", "type": "bad", "hive": "Z", "gen": 50, "port": 10}
    result = validate_signal(invalid_data)
    print(f"\n❌ Invalid signal test:")
    for error in result.errors:
        print(f"   - {error}")
    
    # Test transitions
    print("\n📊 Transition Tests:")
    transitions = [
        (None, "H", True),   # Start with Hunt
        (None, "I", False),  # Skip Hunt
        ("H", "I", True),    # Hunt → Interlock
        ("H", "V", False),   # Reward hack
        ("I", "V", True),    # Interlock → Validate
        ("V", "E", True),    # Validate → Evolve
        ("E", "H", True),    # Evolve → Hunt (N+1)
    ]
    
    for from_p, to_p, expected in transitions:
        result = validate_transition(from_p, to_p)
        status = "✅" if result.valid == expected else "❌"
        print(f"   {status} {from_p or 'START'} → {to_p}: valid={result.valid}, {result.reason}")
    
    print("\n🎯 All G0-G7 gates operational!")
