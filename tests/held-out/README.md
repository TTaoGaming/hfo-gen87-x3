# Held-Out Tests - DO NOT COMMIT TO GIT

This directory contains **secret validation tests** that AI agents should never see during development.

## Purpose

Held-out tests prevent AI from gaming metrics by testing edge cases and properties that the AI doesn't know about.

## Rules

1. **NEVER commit these files to git** - they're in .gitignore
2. **Only run in CI** - via GitHub Actions secret step
3. **Human-maintained only** - TTao writes these tests
4. **Cover edge cases** - things AI might skip or miss

## Usage

```bash
# Run held-out tests locally (for TTao only)
npx vitest run tests/held-out/

# CI runs these automatically after main tests pass
```

## Files

- `one-euro.held-out.test.ts` - 1€ filter edge cases
- `double-exponential.held-out.test.ts` - DESP predictor edge cases
- `gesture-fsm.held-out.test.ts` - FSM state machine edge cases
- `pointer-event-generator.held-out.test.ts` - W3C pointer edge cases
- `integration.held-out.test.ts` - Pipeline integration tests

---

*Gen87.X3 | Held-Out Defense Protocol | 2026-01-02*
