# HFO Gen87.X3 Context
> 2026-01-01T04:12:34.247Z | ~1327569 tokens

## HIVE: INTERLOCK (I)
[E:7] → [I:7] → [I:5]
> INTERLOCK AUDIT: 9 violations detected (3 CRITICAL...

## Tiers
- **Critical**: 2 files
- **Active**: 0 files  
- **Retrievable**: 373 files (RAG)
- **Archived**: 70 (Memory MCP)

## Memory MCP Entities
Query these for depth:
- TTao, TTao_Spider_Symbiosis - User context
- HFO_System, HIVE_Phase - Architecture
- Gen87_X3_Session_State - Current work

## Commands
```
npx tsx scripts/context-manager.ts generate  # Regenerate
Get-Content obsidianblackboard.jsonl | Select -Last 3
npm test
```

## ⚠️ Issues
- CRITICAL tier over budget (2211/1500). Summarize large files.
- Total tokens (1327569) exceeds budget (3000). Run compact.
---
*Minimal payload. Use Memory MCP for depth.*
