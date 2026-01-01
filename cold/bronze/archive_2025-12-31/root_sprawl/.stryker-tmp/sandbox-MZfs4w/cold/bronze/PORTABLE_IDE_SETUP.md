# Portable IDE Setup Guide

> **Purpose**: This workspace is designed to be portable across machines and generations.
> Clone it, run setup.ps1, and you're ready to go.

## Quick Start

```powershell
# 1. Clone the repo
git clone https://github.com/TTaoGaming/hfo-gen87-x3.git
cd hfo-gen87-x3

# 2. Run setup (installs everything)
.\setup.ps1

# 3. Open the workspace
code gen87_x3.code-workspace
```

## What's Included

### Files (Committed to Repo)
| File | Purpose |
|------|---------|
| `.vscode/settings.json` | VS Code settings + virtual tools optimization |
| `.vscode/mcp.json` | Workspace-specific MCP servers |
| `.vscode/extensions.json` | Recommended extensions |
| `.vscode/tasks.json` | Build/run tasks |
| `setup.ps1` | One-click setup script |
| `.env.example` | Template for secrets |

### MCP Server Architecture

```
USER-LEVEL (synced across workspaces)
├── github         → Repository management
├── playwright     → Browser automation
├── context7       → Library documentation
├── sequentialthinking → Chain-of-thought reasoning
├── memory         → Knowledge graph
└── tavily         → Web search

WORKSPACE-LEVEL (.vscode/mcp.json)
└── filesystem     → Local file access
```

## Performance Optimization

### The "160+ Tools" Problem

When you have many MCP servers, VS Code loads ALL their tools into the AI context. This causes:
- "May be degraded" warnings
- Slower responses
- Potential context truncation

### Solution: Virtual Tools

We enable `virtualTools.threshold` in settings:

```json
{
  "github.copilot.chat.virtualTools.threshold": 25
}
```

This means:
- Only top 25 most relevant tools are fully loaded per request
- Other tools are "virtualized" - AI sees descriptions but loads on-demand
- Massive reduction in context overhead

## Secrets Management

### Required API Keys

| Key | Where to Get | Purpose |
|-----|--------------|---------|
| `GITHUB_TOKEN` | github.com/settings/tokens | GitHub MCP server |
| `TAVILY_API_KEY` | app.tavily.com | Web search grounding |

### Setup

1. Copy `.env.example` to `.env`
2. Add your keys to `.env`
3. `.env` is gitignored (never committed)

```bash
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
TAVILY_API_KEY=tvly-xxxxxxxxxxxx
```

## Copying to New Generation

When starting Gen88, Gen89, etc:

```powershell
# 1. Copy the template
cp -r hfo_gen87_x3 hfo_gen88_x1

# 2. Update package.json version
# Change "version": "87.3.0" to "88.1.0"

# 3. Run setup
cd hfo_gen88_x1
.\setup.ps1

# 4. Copy your .env (not committed)
cp ../hfo_gen87_x3/.env .env
```

## MCP Server Reference

### Adding a Workspace-Specific Server

Edit `.vscode/mcp.json`:

```json
{
  "servers": {
    "myserver": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "my-mcp-server@latest"]
    }
  }
}
```

### Adding a User-Level Server

Edit `%APPDATA%\Code\User\mcp.json` (Windows) or `~/.config/Code/User/mcp.json` (Linux):

```json
{
  "servers": {
    "myserver": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "my-mcp-server@latest"]
    }
  }
}
```

## Troubleshooting

### "Cannot have more than 128 tools per request"
- Enable virtual tools (already configured in this workspace)
- Disable unused MCP servers in the Tools picker

### MCP Server Not Starting
```powershell
# Check MCP logs
# In VS Code: Ctrl+Shift+P > MCP: List Servers > Show Output
```

### Tools Not Appearing
```powershell
# Clear cached tools
# In VS Code: Ctrl+Shift+P > MCP: Reset Cached Tools
# Then: Ctrl+Shift+P > Developer: Reload Window
```

## VS Code Extensions

Automatically installed by `setup.ps1`:

| Extension | Purpose |
|-----------|---------|
| `github.copilot` | AI coding assistant |
| `github.copilot-chat` | AI chat interface |
| `biomejs.biome` | Fast linter/formatter |
| `ms-playwright.playwright` | E2E test runner |
| `vitest.explorer` | Unit test runner |
| `stately.xstate-vscode` | State machine visualization |
| `eamodio.gitlens` | Git blame/history |
| `usernamehw.errorlens` | Inline error display |

---

*This setup is designed to minimize friction when starting new HFO generations.*
