# Enterprise AI Workflow Checklist

> **Truth**: AI lies. Machines don't. Use machines to catch AI lies.

---

## Before AI Generates Code

### 1. Define Machine Constraints First
- [ ] Dependency rules exist in `.constraint-rules.mjs`
- [ ] Smoke tests exist in `architecture.smoke.test.ts`
- [ ] Pre-commit hooks installed (`npx husky install`)
- [ ] CI runs on this branch (not just main)

### 2. Specify Exact Imports Required
```markdown
AI INSTRUCTION TEMPLATE:
"Create X. You MUST import from:
- hot/bronze/src/adapters/[specific-adapter].ts
- hot/bronze/src/contracts/[specific-contract].ts

The architecture smoke test will FAIL if you don't.
I will run `npm test` before reviewing your output."
```

### 3. Set Slop Timer
- [ ] Timer set for 30 minutes
- [ ] Git state committed (can reset if slop)
- [ ] Clear prompt written (not vague)

---

## During AI Generation

### Red Flags (Stop Immediately)
| AI Says | Reality | Action |
|---------|---------|--------|
| "I'll create a simple version" | Slop incoming | STOP |
| "For now, I'll use inline..." | Slop incoming | STOP |
| "This is a working demo" | Slop incoming | STOP |
| "I'll add the proper X later" | Never happens | STOP |
| "To make this work quickly..." | Slop incoming | STOP |

### Green Flags (May Proceed)
| AI Says | Reality | Action |
|---------|---------|--------|
| "Importing SenseMediaPipeAdapter from..." | Using infrastructure | ✓ |
| "Running the smoke tests..." | Machine validation | ✓ |
| "This fails the slop detection because..." | Self-awareness | ✓ |
| "The dependency-cruiser rule requires..." | Constraint compliance | ✓ |

---

## After AI Generates Code

### Gate 1: Machine Validation (MUST PASS)
```bash
# Run these BEFORE looking at the code
npm run typecheck          # Types correct?
npm run lint               # Lint passes?
npm test                   # All tests pass?
npx dependency-cruiser --config hot/silver/.constraint-rules.mjs hot/silver
```

If ANY fail → `git reset --hard` → Start over with different prompt

### Gate 2: Structural Review (MUST PASS)
- [ ] File imports from `hot/bronze/src/adapters/*`?
- [ ] File instantiates adapters (not just imports types)?
- [ ] No inline CSS > 50 lines?
- [ ] No "mock", "demo", "simple", "for now" in code?
- [ ] No new folders created outside structure?

If ANY fail → Delete file → Start over

### Gate 3: Functional Verification (MUST PASS)
- [ ] Actually ran the code (not just read it)?
- [ ] Saw expected behavior with own eyes?
- [ ] Tested edge case manually?
- [ ] Output matches what adapters are supposed to do?

If ANY fail → Delete file → Start over

---

## Slot Machine Protocol

When AI produces slop:

```
┌─────────────────────────────────────────┐
│  DO NOT TRY TO FIX SLOP                 │
│                                         │
│  Fixing slop creates more slop.         │
│  The AI will apologize and create       │
│  slightly different slop.               │
│                                         │
│  INSTEAD:                               │
│  1. git reset --hard                    │
│  2. Delete any new files                │
│  3. Write DIFFERENT prompt              │
│  4. Set new 30-minute timer             │
│  5. If slop again, try different task   │
└─────────────────────────────────────────┘
```

Maximum attempts per task: **2**

If AI fails twice:
1. Write the code yourself
2. Document what AI couldn't do
3. Add to "AI limitations" knowledge base

---

## AI Limitation Categories

### Category A: AI Can Do Well (With Constraints)
- Boilerplate from existing patterns
- Test generation for existing code
- Refactoring with explicit examples
- Documentation from working code
- Type definitions from examples

### Category B: AI Struggles (Needs Heavy Supervision)
- Novel architecture integration
- Multi-file coordinated changes
- Framework-specific APIs (Golden Layout, etc.)
- Performance-critical code
- Anything requiring "understanding"

### Category C: AI Cannot Do (Write Yourself)
- Architectural decisions
- Framework selection
- Security-critical code
- Anything requiring judgment
- Anything that has never been done before

---

## The Fundamental Truth

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  TRANSFORMER ARCHITECTURE OPTIMIZES FOR:                    │
│  P(next_token | previous_tokens)                            │
│                                                             │
│  THIS IS NOT:                                               │
│  - Logical reasoning                                        │
│  - Correctness verification                                 │
│  - Architectural understanding                              │
│  - Semantic comprehension                                   │
│                                                             │
│  IT IS:                                                     │
│  - Statistical pattern matching                             │
│  - "What text usually follows this text"                    │
│  - Extremely good mimicry                                   │
│  - Plausible-looking output                                 │
│                                                             │
│  CONSEQUENCE:                                               │
│  Output LOOKS correct. Output may NOT BE correct.           │
│  The only way to know: MACHINE VERIFICATION.                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Commands

```bash
# Validate architecture
npx dependency-cruiser --config hot/silver/.constraint-rules.mjs hot/silver

# Run smoke tests
npm test -- --grep "Architecture"

# Check for slop patterns
grep -r "mock mode\|for production\|TODO: implement" hot/silver/

# Reset after slop
git reset --hard HEAD

# See what AI actually changed
git diff --stat

# Install pre-commit hooks
npx husky install
npx husky add .husky/pre-commit "npm test"
```

---

## Remember

1. **AI lies. Machines don't.**
2. **Prompt harder ≠ Better output.**
3. **Constraints > Instructions.**
4. **Delete slop. Don't fix slop.**
5. **If AI fails twice, write it yourself.**

*The spider cannot weave lies if the loom rejects malformed thread.*
