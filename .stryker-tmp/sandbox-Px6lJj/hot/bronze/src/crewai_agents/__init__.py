"""
HFO Gen87.X3 - HIVE/8 Commander Swarm
=====================================

8 Legendary Commanders implementing the Obsidian Hourglass workflow.

HIVE/8 Anti-Diagonal Pairing (sum=7):
- H (Hunt):     Ports 0+7 (Lidless Legion + Spider Sovereign)
- I (Interlock): Ports 1+6 (Web Weaver + Kraken Keeper)
- V (Validate):  Ports 2+5 (Mirror Magus + Pyre Praetorian)
- E (Evolve):    Ports 3+4 (Spore Storm + Red Regnant)

Usage:
    from crewai_hive import create_hive_crew
    crew = create_hive_crew()
    result = crew.kickoff(inputs={"task": "Research gesture control patterns"})
"""

from .crew import create_hive_crew, HivePhase

__all__ = ["create_hive_crew", "HivePhase"]
__version__ = "87.3.0"
