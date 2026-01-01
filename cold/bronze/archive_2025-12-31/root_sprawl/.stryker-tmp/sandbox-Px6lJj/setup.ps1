# Gen87.X3 Setup Script
# Run this after cloning to set up the workspace
# Usage: .\setup.ps1

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  HFO Gen87.X3 - Portable IDE Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# 1. ENVIRONMENT FILE
# ═══════════════════════════════════════════════════════════════
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    } else {
        @"
# HFO Gen87.X3 Environment Variables
# Copy this to .env and fill in your values

# GitHub (for GitHub MCP server)
GITHUB_TOKEN=your_github_token_here

# Tavily (for web search grounding)
TAVILY_API_KEY=your_tavily_api_key_here
"@ | Out-File -FilePath ".env" -Encoding utf8
    }
    Write-Host "📝 Created .env - please edit and add your API keys" -ForegroundColor Yellow
    Write-Host ""
}

# ═══════════════════════════════════════════════════════════════
# 2. NPM DEPENDENCIES
# ═══════════════════════════════════════════════════════════════
Write-Host "📦 Installing npm dependencies..." -ForegroundColor Cyan
npm install

# ═══════════════════════════════════════════════════════════════
# 3. GIT HOOKS (Husky)
# ═══════════════════════════════════════════════════════════════
Write-Host "🪝 Setting up git hooks..." -ForegroundColor Cyan
npx husky

# ═══════════════════════════════════════════════════════════════
# 4. PLAYWRIGHT BROWSERS
# ═══════════════════════════════════════════════════════════════
Write-Host "🎭 Installing Playwright browsers..." -ForegroundColor Cyan
npx playwright install chromium

# ═══════════════════════════════════════════════════════════════
# 5. MCP SERVER DEPENDENCIES (pre-cache npx packages)
# ═══════════════════════════════════════════════════════════════
Write-Host "🔌 Pre-caching MCP server packages..." -ForegroundColor Cyan
$mcpPackages = @(
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-sequential-thinking",
    "@upstash/context7-mcp",
    "@playwright/mcp",
    "tavily-mcp"
)
foreach ($pkg in $mcpPackages) {
    Write-Host "  Caching $pkg..." -ForegroundColor Gray
    npx -y $pkg --help 2>$null | Out-Null
}

# ═══════════════════════════════════════════════════════════════
# 6. GIT INITIALIZATION (if needed)
# ═══════════════════════════════════════════════════════════════
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Initializing git repository..." -ForegroundColor Cyan
    git init
    git add .
    git commit -m "H: initial gen87.x3 setup with enforcement"
}

# Verify setup
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Edit .env with your API keys" -ForegroundColor Gray
Write-Host "  2. Run 'npm test' to verify tests work" -ForegroundColor Gray
Write-Host "  3. Try a commit to test hooks: git commit -m 'H: test commit'" -ForegroundColor Gray
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# 7. VS CODE EXTENSIONS
# ═══════════════════════════════════════════════════════════════
Write-Host "📦 Installing VS Code extensions..." -ForegroundColor Cyan
$extensions = @(
    "github.copilot",
    "github.copilot-chat",
    "biomejs.biome",
    "ms-playwright.playwright",
    "vitest.explorer",
    "eamodio.gitlens",
    "usernamehw.errorlens",
    "yoavbls.pretty-ts-errors",
    "stately.xstate-vscode",
    "ryanrosello-og.playwright-vscode-trace-viewer"
)

foreach ($ext in $extensions) {
    Write-Host "  Installing $ext..." -ForegroundColor Gray
    code --install-extension $ext --force 2>$null
}

# ═══════════════════════════════════════════════════════════════
# 8. VERIFY SETUP
# ═══════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "What was configured:" -ForegroundColor White
Write-Host "  ✓ npm dependencies installed" -ForegroundColor Green
Write-Host "  ✓ Git hooks (commitlint) enabled" -ForegroundColor Green
Write-Host "  ✓ Playwright browsers installed" -ForegroundColor Green
Write-Host "  ✓ MCP server packages cached" -ForegroundColor Green
Write-Host "  ✓ VS Code extensions installed" -ForegroundColor Green
Write-Host ""
Write-Host "MCP Performance Optimization:" -ForegroundColor Cyan
Write-Host "  virtualTools.threshold = 25 (lazy loads tools)" -ForegroundColor Gray
Write-Host "  Only top 25 relevant tools fully loaded per request" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Edit .env with your API keys (GITHUB_TOKEN, TAVILY_API_KEY)" -ForegroundColor Gray
Write-Host "  2. Open gen87_x3.code-workspace in VS Code" -ForegroundColor Gray
Write-Host "  3. Reload VS Code window (Ctrl+Shift+P > Reload Window)" -ForegroundColor Gray
Write-Host "  4. Run 'npm test' to verify setup" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Ready to go!" -ForegroundColor Green
