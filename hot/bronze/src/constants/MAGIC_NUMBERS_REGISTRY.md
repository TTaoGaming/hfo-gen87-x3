# Magic Numbers Registry

> **Rule**: NO magic numbers without provenance. Every numeric constant needs a source.

## Quick Reference

| Constant | Default | Range | Source |
|----------|---------|-------|--------|
| **1€ Filter** ||||
| mincutoff | 1.0 Hz | [0.1, 10] | Casiez CHI 2012 |
| beta | 0.0 | [0.0, 1.0] | Casiez CHI 2012 |
| dcutoff | 1.0 Hz | [0.1, 10] | Casiez CHI 2012 |
| **Dead Zone** ||||
| deadZone | 0.10 (10%) | [0.05, 0.25] | XInput Standard |
| **Rapier Physics** ||||
| damping | 1.2 | [0.5, 2.0] | Critical damping theory |
| stiffness | 200 | [100, 500] | Custom tuned |
| substeps | 4 | [1, 8] | Gaffer On Games |

---

## 1€ Filter (Casiez et al. CHI 2012)

### Source
- **Paper**: "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems"
- **Authors**: Géry Casiez, Nicolas Roussel, Daniel Vogel
- **URL**: https://gery.casiez.net/1euro/
- **PDF**: https://inria.hal.science/hal-00670496v1/document

### Parameters

#### `mincutoff` (fcmin)
- **Default**: 1.0 Hz
- **Range**: [0.1, 10.0] Hz
- **Effect**: Lower = more smoothing (less jitter), higher = more responsive (more jitter)
- **Tuning**: "First set BETA to 0 and MINCUTOFF to a reasonable middle-ground value such as 1 Hz"

#### `beta` (β)
- **Default**: 0.0
- **Range**: [0.0, 1.0]
- **Effect**: Controls speed-based cutoff adaptation. 0 = no adaptation, higher = more lag reduction at high speed
- **Tuning**: "Increase β gradually to reduce lag at high speed while maintaining low jitter at low speed"

#### `dcutoff` (fcd)
- **Default**: 1.0 Hz
- **Range**: [0.1, 10.0] Hz
- **Effect**: Filters the derivative estimate. Lower = smoother derivative
- **Note**: Usually left at 1.0 Hz

---

## Dead Zone (XInput / Industry Standard)

### Sources
- **XInput**: https://docs.microsoft.com/en-us/windows/win32/xinput/getting-started-with-xinput
- **Unity**: https://docs.unity3d.com/Packages/com.unity.inputsystem@1.0/manual/Controls.html#deadzones
- **Industry Research**: Unity forums, Steam controller config

### Parameters

#### `deadZone`
- **Default**: 0.10 (10%)
- **Range**: [0.05, 0.25]
- **Industry Values**:
  - Xbox controllers: 0.20-0.25 (XINPUT_GAMEPAD_LEFT_THUMB_DEADZONE = 7849/32767 ≈ 0.24)
  - Steam minimum: 0.05
  - Hardware noise floor: ~0.10
- **Our Choice**: 0.10 - Matches hardware noise floor, tighter than Xbox default

### Why NOT 0.002?
The previous value (0.002 = 0.2%) was **below hardware noise**. This means:
1. Would never trigger (noise > 0.2%)
2. No grounding in any standard
3. Effectively useless

---

## Rapier Physics (Custom Tuned)

### Sources
- **Critical Damping**: Classical mechanics, ζ = c / (2√(km)) = 1.0
- **Timestep**: https://gafferongames.com/post/fix_your_timestep/ (Gaffer On Games)
- **Tuning**: Internal HFO testing with MediaPipe hand tracking

### Parameters

#### `damping`
- **Default**: 1.2
- **Range**: [0.5, 2.0]
- **Categories**:
  - 0.5-0.9: Underdamped (oscillates)
  - 1.0: Critically damped (fastest without overshoot)
  - 1.1-2.0: Overdamped (slow but stable)
- **Our Choice**: 1.2 - Slightly overdamped to prevent ANY oscillation in cursor

#### `stiffness`
- **Default**: 200
- **Range**: [100, 500]
- **Derivation**: k = (2π * fn)² * m where fn ≈ 3Hz for ~50ms settling
- **Our Choice**: 200 - Tuned for responsive feel without overshoot

#### `substeps`
- **Default**: 4
- **Range**: [1, 8]
- **Trade-off**: More = accurate, fewer = faster
- **Our Choice**: 4 - Balance for 60Hz input

---

## Usage

### Import Constants
```typescript
import {
  ONE_EURO_BETA_DEFAULT,
  DEAD_ZONE_DEFAULT,
  RAPIER_DAMPING_DEFAULT,
  AllTunablesSchema,
} from './magic-numbers';
```

### Apply User Tunables
```typescript
import { AllTunablesSchema } from './magic-numbers';

const userConfig = AllTunablesSchema.parse({
  oneEuro: { beta: 0.1 },  // User wants more speed response
  deadZone: { deadZone: 0.15 },  // User wants larger dead zone
});
```

### Validate Bounds
```typescript
import { clampToRange, DEAD_ZONE_MIN, DEAD_ZONE_MAX } from './magic-numbers';

// User-provided value is clamped to valid range
const safeDeadZone = clampToRange(userInput, DEAD_ZONE_MIN, DEAD_ZONE_MAX);
```

---

## Pre-Commit Enforcement

The `.husky/pre-commit` hook runs:
1. ESLint check for numeric literals without provenance
2. Biome lint
3. TypeScript type check

### Allowed Patterns
- Import from `magic-numbers.ts`
- Test files (`.test.ts`, `.spec.ts`) - test data is exempt
- JSDoc with `@source` tag

### Disallowed Patterns
```typescript
// ❌ BAD: Magic number without provenance
const threshold = 0.07;

// ✅ GOOD: Import from registry
import { ONE_EURO_BETA_DEFAULT } from './constants/magic-numbers';
const threshold = ONE_EURO_BETA_DEFAULT;

// ✅ GOOD: JSDoc with source
/**
 * @source https://example.com/paper
 */
const CUSTOM_THRESHOLD = 0.07;
```

---

## Adding New Constants

1. **Find authoritative source** (paper, spec, docs)
2. **Add to `magic-numbers.ts`** with JSDoc:
   - `@source` - URL
   - `@citation` - Paper/spec reference
   - `@range` - Valid bounds
   - `@default` - Our chosen value with rationale
3. **Add to this registry** with explanation
4. **Create Zod schema** if user-tunable
5. **Update pre-commit** if new pattern needed

---

*Last updated: 2026-01-01*
*Gen87.X3 Spider Sovereign*
