# Gen87.X3 Enforcement Setup Checklist

> **Purpose**: Stop fighting AI, start enforcing workflows  
> **Date**: 2025-12-29  
> **Principle**: "Complex tools solve complex problems. Stop hacking, start enforcing."

---

## 📋 MASTER CHECKLIST

### Phase 1: MCP Servers (AI Capability Maximization)

#### Core MCP Servers
- [ ] **GitHub MCP** - Repo management, issues, PRs
  ```bash
  npx -y @modelcontextprotocol/server-github
  ```
  - Requires: `GITHUB_TOKEN` environment variable

- [ ] **Tavily Search MCP** - Web search with AI-optimized results
  ```bash
  npx -y tavily-mcp@latest
  ```
  - Requires: `TAVILY_API_KEY` from https://tavily.com (free tier: 1000 searches/month)

- [ ] **Playwright MCP** - Browser automation & screenshots
  ```bash
  npx -y @playwright/mcp@latest
  ```

- [ ] **Memory MCP** - Knowledge graph persistence
  ```bash
  npx -y @modelcontextprotocol/server-memory
  ```

- [ ] **Sequential Thinking MCP** - Chain-of-thought reasoning
  ```bash
  npx -y @modelcontextprotocol/server-sequential-thinking
  ```

- [ ] **Context7 MCP** - Library documentation lookup
  ```bash
  npx -y @upstash/context7-mcp
  ```

- [ ] **Filesystem MCP** - Direct file access
  ```bash
  npx -y @modelcontextprotocol/server-filesystem C:/Dev/active
  ```

#### Advanced MCP Servers
- [ ] **Brave Search MCP** - Alternative web search
  ```bash
  npx -y @modelcontextprotocol/server-brave-search
  ```
  - Requires: `BRAVE_API_KEY`

- [ ] **Fetch MCP** - HTTP requests & web scraping
  ```bash
  npx -y @modelcontextprotocol/server-fetch
  ```

- [ ] **SQLite MCP** - Database queries
  ```bash
  npx -y @modelcontextprotocol/server-sqlite
  ```

- [ ] **Git MCP** - Advanced git operations
  ```bash
  npx -y @modelcontextprotocol/server-git
  ```

- [ ] **Puppeteer MCP** - Alternative browser automation
  ```bash
  npx -y @modelcontextprotocol/server-puppeteer
  ```

---

### Phase 2: VS Code Extensions

#### AI & Copilot
- [ ] `github.copilot` - GitHub Copilot
- [ ] `github.copilot-chat` - Copilot Chat

#### TDD/BDD Testing
- [ ] `ms-playwright.playwright` - Playwright Test Runner
- [ ] `vitest.explorer` - Vitest Test Explorer
- [ ] `hbenl.vscode-test-explorer` - Test Explorer UI
- [ ] `alexkrechik.cucumberautocomplete` - Cucumber/Gherkin BDD

#### Code Quality & Enforcement
- [ ] `biomejs.biome` - Fast linter/formatter
- [ ] `dbaeumer.vscode-eslint` - ESLint
- [ ] `esbenp.prettier-vscode` - Prettier
- [ ] `streetsidesoftware.code-spell-checker` - Spell checker

#### Git & GitOps
- [ ] `eamodio.gitlens` - Git supercharged
- [ ] `mhutchie.git-graph` - Git history visualization
- [ ] `github.vscode-pull-request-github` - GitHub PR integration

#### Browser & Preview
- [ ] `ms-vscode.live-server` - Live Server
- [ ] `ritwickdey.liveserver` - Live Server (alternative)
- [ ] `auchenberg.vscode-browser-preview` - Browser Preview

#### TypeScript & Development
- [ ] `ms-vscode.vscode-typescript-next` - Latest TypeScript
- [ ] `yoavbls.pretty-ts-errors` - Better TS errors
- [ ] `usernamehw.errorlens` - Inline error display

---

### Phase 3: Environment Variables

Create/update `.env` in your workspace root:

```bash
# GitHub (required for GitHub MCP)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Tavily Search (get from https://tavily.com)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxx

# Brave Search (optional, get from https://brave.com/search/api/)
BRAVE_API_KEY=BSAxxxxxxxxxxxxxxxxxxxx

# OpenAI (optional, for embeddings)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

---

### Phase 4: Git Hooks (TDD/GitOps Enforcement)

#### Pre-commit Hook
- [ ] Install husky
  ```bash
  npm install -D husky
  npx husky init
  ```

- [ ] Create `.husky/pre-commit`:
  ```bash
  #!/bin/sh
  npm run typecheck
  npm run lint
  npm run test:changed
  ```

#### Commit Message Enforcement
- [ ] Install commitlint
  ```bash
  npm install -D @commitlint/cli @commitlint/config-conventional
  ```

- [ ] Create `commitlint.config.js`:
  ```javascript
  export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
      'type-enum': [2, 'always', [
        'H',    // Hunt (research)
        'I',    // Interlock (RED)
        'V',    // Validate (GREEN)
        'E',    // Evolve (REFACTOR)
        'feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'
      ]]
    }
  };
  ```

- [ ] Create `.husky/commit-msg`:
  ```bash
  #!/bin/sh
  npx commitlint --edit $1
  ```

---

### Phase 5: TDD Enforcement Configuration

#### Vitest Config (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    },
    // Fail fast on first error
    bail: 1,
    // Watch mode respects git
    watchExclude: ['**/node_modules/**', '**/dist/**']
  }
});
```

#### BDD with Cucumber (`cucumber.js`)
```javascript
export default {
  default: {
    paths: ['features/**/*.feature'],
    require: ['features/step-definitions/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress', 'html:reports/cucumber.html'],
    strict: true
  }
};
```

---

### Phase 6: CI/CD Enforcement (`.github/workflows/enforce.yml`)

```yaml
name: Enforcement Gates

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  enforce:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - run: npm ci
      
      # Gate 1: Type Safety
      - name: TypeCheck
        run: npm run typecheck
      
      # Gate 2: Lint
      - name: Lint
        run: npm run lint
      
      # Gate 3: Unit Tests
      - name: Test
        run: npm run test:coverage
      
      # Gate 4: E2E Tests
      - name: E2E
        run: npm run test:e2e
      
      # Gate 5: Coverage Threshold
      - name: Coverage Check
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi
```

---

### Phase 7: VS Code Tasks (`.vscode/tasks.json`)

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "🔴 TDD: RED (Write Failing Test)",
      "type": "shell",
      "command": "npm",
      "args": ["run", "test:watch"],
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "🟢 TDD: GREEN (Make Test Pass)",
      "type": "shell",
      "command": "npm",
      "args": ["run", "test"],
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "🔵 TDD: REFACTOR",
      "type": "shell",
      "command": "npm",
      "args": ["run", "lint:fix", "&&", "npm", "run", "test"],
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "🧪 Run All Tests",
      "type": "shell",
      "command": "npm",
      "args": ["run", "test"],
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "🎭 Run E2E Tests",
      "type": "shell",
      "command": "npm",
      "args": ["run", "test:e2e"],
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "📊 Coverage Report",
      "type": "shell",
      "command": "npm",
      "args": ["run", "test:coverage"],
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "🔍 Query Memory (DuckDB)",
      "type": "shell",
      "command": "python",
      "args": ["-c", "import duckdb; con = duckdb.connect('../portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/hfo_memory.duckdb', read_only=True); con.execute('LOAD fts'); print('✅ Memory ready:', con.execute('SELECT COUNT(*) FROM artifacts').fetchone()[0], 'artifacts')"],
      "problemMatcher": []
    }
  ]
}
```

---

## 🔧 QUICK SETUP COMMANDS

### Install All Extensions (Run in Terminal)
```powershell
# AI & Copilot
code --install-extension github.copilot
code --install-extension github.copilot-chat

# Testing
code --install-extension ms-playwright.playwright
code --install-extension vitest.explorer

# Code Quality
code --install-extension biomejs.biome
code --install-extension dbaeumer.vscode-eslint
code --install-extension usernamehw.errorlens
code --install-extension yoavbls.pretty-ts-errors

# Git
code --install-extension eamodio.gitlens
code --install-extension mhutchie.git-graph
code --install-extension github.vscode-pull-request-github

# Browser
code --install-extension ms-vscode.live-server
```

### Get API Keys
1. **Tavily**: https://tavily.com → Sign up → Dashboard → API Keys
2. **GitHub**: https://github.com/settings/tokens → Generate new token (classic)
3. **Brave**: https://brave.com/search/api/ → Get API Key

---

## 📊 ENFORCEMENT MATRIX

| Gate | Tool | Trigger | Blocks |
|------|------|---------|--------|
| Type Safety | TypeScript | Pre-commit, CI | Merge |
| Lint | Biome/ESLint | Pre-commit, CI | Merge |
| Unit Tests | Vitest | Pre-commit, CI | Merge |
| E2E Tests | Playwright | CI | Merge |
| Coverage | Vitest | CI | Merge if <80% |
| Commit Format | Commitlint | Commit-msg hook | Commit |
| HIVE Phase | Custom hook | Pre-commit | Commit |

---

## 🚨 AI ENFORCEMENT RULES

### What AI Must Do
1. **Run tests before claiming "done"** - Enforce via pre-commit
2. **Cite sources for claims** - Enforce via memory queries
3. **Work in sandbox/** - Enforce via filesystem restrictions
4. **Follow HIVE phases** - Enforce via commit message validation

### What AI Cannot Do
1. **Skip RED phase** - Commitlint rejects V commits without I commits
2. **Delete without permission** - Filesystem MCP can be read-only
3. **Push broken code** - CI gates block merge
4. **Hallucinate coverage** - CI verifies actual coverage

---

## ✅ VERIFICATION STEPS

After setup, verify each component:

```powershell
# 1. MCP Servers
# Open Copilot Chat, type: "search for typescript best practices" 
# Should use Tavily if configured

# 2. Git Hooks
git commit -m "bad message"  # Should fail
git commit -m "feat: test message"  # Should pass (after tests)

# 3. Tests
npm test  # Should run and show coverage

# 4. Extensions
code --list-extensions | Select-String "copilot|playwright|biome"
```

---

*Gen87.X3 Enforcement Checklist | 2025-12-29*
