12345# 🔬 Mutation Testing Guide

> **Purpose**: Prove tests catch real bugs, not just cosmetic compliance
> **Tool**: Stryker Mutator (https://stryker-mutator.io/)
> **Target**: ≥80% mutation score for silver promotion

---

## Why Mutation Testing?

### The Problem

```
TRADITIONAL TESTS                    MUTATION TESTS
─────────────────                    ──────────────
✅ Tests pass                        ✅ Tests pass
✅ 100% coverage                     ✅ 100% coverage
❓ Do tests catch bugs?              ✅ Tests kill 96% of mutants

Coverage ≠ Confidence                Mutation Score = Confidence
```

### How It Works

1. **Stryker mutates your code** (inserts bugs)
2. **Runs your tests** against each mutant
3. **If tests FAIL** → mutant killed ✅ (tests caught the bug)
4. **If tests PASS** → mutant survived ❌ (tests missed the bug)

---

## Quick Start

### Run Mutation Testing

```powershell
# Target a specific file
npx stryker run --mutate "hot/bronze/quarantine/one-euro-smoother.ts"

# View HTML report
Invoke-Item reports/mutation/html/index.html
```

### Configuration

```javascript
// stryker.config.mjs
export default {
  packageManager: "npm",
  testRunner: "vitest",
  checkers: ["typescript"],
  
  // What to mutate
  mutate: [
    "hot/bronze/quarantine/**/*.ts",
    "!**/*.test.ts",
    "!**/*.spec.ts",
  ],
  
  // Thresholds
  thresholds: {
    high: 80,    // ≥80% = GREEN
    low: 60,     // <60% = RED  
    break: 50,   // <50% = BUILD FAILS
  },
  
  // Performance
  concurrency: 4,
  disableBail: true,  // Run all mutants
};
```

---

## Mutation Operators

Stryker applies these mutations to your code:

| Category | Example | Mutation |
|----------|---------|----------|
| **Arithmetic** | `a + b` | `a - b` |
| **Comparison** | `a > b` | `a >= b`, `a < b` |
| **Logical** | `a && b` | `a \|\| b` |
| **Unary** | `!flag` | `flag` |
| **Block** | `{ code }` | `{}` (empty block) |
| **String** | `"hello"` | `""` |
| **Array** | `[1,2,3]` | `[]` |
| **Boolean** | `true` | `false` |

---

## Interpreting Results

### Mutation Score Formula

```
Score = (Killed + Timeout) / Total × 100%
```

### Result Types

| Status | Meaning | Action |
|--------|---------|--------|
| **Killed** | Test failed (caught the bug) | ✅ Good |
| **Survived** | Test passed (missed the bug) | ❌ Add test |
| **Timeout** | Infinite loop detected | ✅ Counts as killed |
| **No Coverage** | No test covers this code | ⚠️ Add coverage |
| **Runtime Error** | Mutant crashed | ⚠️ Check code |

### Score Thresholds

| Score | Rating | Promotion Eligible? |
|-------|--------|---------------------|
| ≥80% | 🟢 HIGH | ✅ Yes |
| 60-79% | 🟡 MEDIUM | ⚠️ Needs work |
| <60% | 🔴 LOW | ❌ No |

---

## Writing Mutation-Resistant Tests

### ❌ Bad: Cosmetic Tests

```typescript
test('smoother exists', () => {
  const s = new OneEuroSmoother();
  expect(s).toBeDefined();  // Mutation survives!
});

test('smooth returns something', () => {
  const s = new OneEuroSmoother();
  const r = s.smooth({ x: 0, y: 0, timestamp: 1 });
  expect(r).toBeTruthy();  // Mutation survives!
});
```

### ✅ Good: Behavioral Tests

```typescript
test('smoothing reduces jitter', () => {
  const s = new OneEuroSmoother({ beta: 0.5 });
  
  // Add noise
  const noisy = [
    { x: 0, y: 0, timestamp: 0.01 },
    { x: 0.1, y: 0.1, timestamp: 0.02 },  // jitter
    { x: 0.05, y: 0.05, timestamp: 0.03 },
  ];
  
  const results = noisy.map(p => s.smooth(p));
  
  // BEHAVIORAL assertion: smoothed values converge
  const lastSmoothed = results[results.length - 1];
  expect(Math.abs(lastSmoothed.smoothedX - 0.05)).toBeLessThan(0.1);
});

test('deterministic output for same input', () => {
  const s1 = new OneEuroSmoother();
  const s2 = new OneEuroSmoother();
  
  const input = { x: 0.5, y: 0.5, timestamp: 1 };
  
  // Same config + same input = same output
  expect(s1.smooth(input)).toEqual(s2.smooth(input));
});
```

### ✅ Property-Based Tests

```typescript
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

test.prop([
  fc.float({ min: -1000, max: 1000, noNaN: true }),
  fc.float({ min: -1000, max: 1000, noNaN: true }),
  fc.float({ min: 0.01, max: 1000, noNaN: true }),
])('smooth returns finite values', (x, y, ts) => {
  const s = new OneEuroSmoother();
  const r = s.smooth({ x, y, timestamp: ts });
  
  expect(Number.isFinite(r.smoothedX)).toBe(true);
  expect(Number.isFinite(r.smoothedY)).toBe(true);
  expect(r.jitter).toBeGreaterThanOrEqual(0);
});
```

---

## Surviving Mutant Analysis

When a mutant survives, ask:

1. **Is the mutated code reachable?**
   - If not, consider removing dead code

2. **Does the behavior actually change?**
   - Some mutations are semantically equivalent

3. **Should I add a test?**
   - If mutation changes behavior, add test

### Example: Analyzing a Survivor

```
Mutant #26 SURVIVED in one-euro-smoother.ts:47
Original: this.config = SmootherConfigSchema.parse(config);
Mutated:  this.config = SmootherConfigSchema.parse({});

Why survived? The mutation empties the config, but:
- Config has defaults (freq: 60, minCutoff: 1.0, etc.)
- parse({}) returns valid config with defaults
- This is INTENTIONAL behavior, not a bug
```

---

## CI Integration

### Pre-commit Hook

```bash
# In .husky/pre-commit
npx stryker run --mutate "hot/bronze/quarantine/**/*.ts" --concurrency 2
if [ $? -ne 0 ]; then
  echo "❌ Mutation score below threshold"
  exit 1
fi
```

### GitHub Actions

```yaml
- name: Mutation Testing
  run: npx stryker run
  env:
    STRYKER_DASHBOARD_API_KEY: ${{ secrets.STRYKER_KEY }}

- name: Upload Report
  uses: actions/upload-artifact@v3
  with:
    name: mutation-report
    path: reports/mutation/html/
```

---

## Adapter Scoreboard

| Adapter | File | Tests | Score | Last Run |
|---------|------|-------|-------|----------|
| OneEuroSmoother | `quarantine/one-euro-smoother.ts` | 12 | **96.15%** ✅ | 2026-01-01 |
| MediaPipeSense | `quarantine/sense-mediapipe.ts` | 0 | ⬜ TODO | - |
| FuseWrapper | `quarantine/fuse-wrapper.ts` | 0 | ⬜ TODO | - |
| DeliverGoldenLayout | `quarantine/deliver-goldenlayout.ts` | 0 | ⬜ TODO | - |

---

## Commands Reference

```powershell
# Run all mutation tests
npx stryker run

# Target specific file
npx stryker run --mutate "path/to/file.ts"

# Higher concurrency (faster)
npx stryker run --concurrency 8

# Generate HTML report only
npx stryker run --reporters html

# Dry run (list mutants without running)
npx stryker run --dryRunOnly
```

---

*Kill the mutants. Prove your tests work.*
*Gen87-X3.1 | Mutation Testing | 2026-01-01*
