# Quarantine Zone

AI-generated output goes here FIRST.

Files only graduate to `exemplars/` after passing:
1. Machine validation (typecheck, lint, test)
2. Dependency-cruiser architectural check
3. Human structural review
4. Human functional verification

## Current Quarantine

| File | Created | Status | Blocker |
|------|---------|--------|---------|
| (empty) | - | - | - |

## Graduation Criteria

```bash
# All must pass
npm run typecheck
npm run lint  
npm test -- --grep "Architecture"
npx dependency-cruiser --config ../.constraint-rules.mjs .

# Then human review with CHECKLIST.md
```
