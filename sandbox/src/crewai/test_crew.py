"""
Test the HIVE/8 CrewAI setup.

Run: python -m sandbox.src.crewai.test_crew
"""

from crewai import Crew

# Test imports
print("Testing Commander imports...")
from sandbox.src.crewai.commanders import (
    create_lidless_legion,
    create_web_weaver,
    create_mirror_magus,
    create_spore_storm,
    create_red_regnant,
    create_pyre_praetorian,
    create_kraken_keeper,
    create_spider_sovereign,
)
print("✅ All 8 Commanders imported successfully!")

# Create all commanders
print("\nCreating Commanders...")
commanders = {
    0: create_lidless_legion(verbose=False),
    1: create_web_weaver(verbose=False),
    2: create_mirror_magus(verbose=False),
    3: create_spore_storm(verbose=False),
    4: create_red_regnant(verbose=False),
    5: create_pyre_praetorian(verbose=False),
    6: create_kraken_keeper(verbose=False),
    7: create_spider_sovereign(verbose=False),
}

print("\n=== HIVE/8 Commander Roster ===")
for port, agent in commanders.items():
    print(f"Port {port}: {agent.role}")

print("\n=== HIVE Phase Pairings ===")
print(f"H (Hunt):     Port 0 + Port 7 = {commanders[0].role.split(' - ')[0]} + {commanders[7].role.split(' - ')[0]}")
print(f"I (Interlock): Port 1 + Port 6 = {commanders[1].role.split(' - ')[0]} + {commanders[6].role.split(' - ')[0]}")
print(f"V (Validate):  Port 2 + Port 5 = {commanders[2].role.split(' - ')[0]} + {commanders[5].role.split(' - ')[0]}")
print(f"E (Evolve):    Port 3 + Port 4 = {commanders[3].role.split(' - ')[0]} + {commanders[4].role.split(' - ')[0]}")

print("\n✅ CrewAI HIVE/8 setup complete!")
print("To run a crew: from crewai_hive import create_hive_crew; crew = create_hive_crew(); crew.kickoff()")
