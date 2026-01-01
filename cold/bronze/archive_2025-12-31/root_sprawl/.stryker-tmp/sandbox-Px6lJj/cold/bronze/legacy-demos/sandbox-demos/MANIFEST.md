# Demo Structure Manifest
> **Last Updated**: 2025-12-31 | **Gen87.X3**

## Active Demo
| Location | Purpose | Status |
|----------|---------|--------|
| `demos/main/` | **THE** working gesture control demo | ✅ ACTIVE |

## Archived Demos (Non-Destructive)
| Archive Location | Original Folder | Notes |
|-----------------|-----------------|-------|
| `_legacy/v1-basic/` | `demo/` | Basic cursor demo, incomplete |
| `_legacy/v2-golden-variants/` | `demo-golden/` | Multiple timestamped versions |
| `_legacy/v3-target-daedalos/` | `demo-daedalos/` | daedalOS target adapter exploration |
| `_legacy/v3-target-puter/` | `demo-puter/` | Puter cloud OS exploration |

## How to Run
```bash
cd sandbox/demos/main
npx http-server -p 9093 -c-1
# Open http://localhost:9093
```

## Original Folders (Still Present)
The original demo folders remain in sandbox/ for reference:
- `sandbox/demo/`
- `sandbox/demo-real/`
- `sandbox/demo-golden/`
- `sandbox/demo-daedalos/`
- `sandbox/demo-puter/`

Once confident the new structure is correct, these can be removed in a future cleanup.

---
*Archive created during Gap Analysis cleanup phase.*
