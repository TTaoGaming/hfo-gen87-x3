"""
HFO Gen87.X3 - 8 Legendary Commanders
=====================================

Port | Commander        | Verb    | Element    | HIVE Phase
-----|------------------|---------|------------|------------
0    | Lidless Legion   | SENSE   | Earth (Kun)| H (Hunt)
1    | Web Weaver       | FUSE    | Thunder    | I (Interlock)
2    | Mirror Magus     | SHAPE   | Water      | V (Validate)
3    | Spore Storm      | DELIVER | Mountain   | E (Evolve)
4    | Red Regnant      | TEST    | Wind       | E (Evolve)
5    | Pyre Praetorian  | DEFEND  | Fire       | V (Validate)
6    | Kraken Keeper    | STORE   | Lake       | I (Interlock)
7    | Spider Sovereign | DECIDE  | Heaven     | H (Hunt)
"""

from .lidless_legion import create_lidless_legion
from .web_weaver import create_web_weaver
from .mirror_magus import create_mirror_magus
from .spore_storm import create_spore_storm
from .red_regnant import create_red_regnant
from .pyre_praetorian import create_pyre_praetorian
from .kraken_keeper import create_kraken_keeper
from .spider_sovereign import create_spider_sovereign

__all__ = [
    "create_lidless_legion",
    "create_web_weaver",
    "create_mirror_magus",
    "create_spore_storm",
    "create_red_regnant",
    "create_pyre_praetorian",
    "create_kraken_keeper",
    "create_spider_sovereign",
]
