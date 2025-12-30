# Gen87.X3 Setup Script
# Run this after opening the workspace to complete setup

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  HFO Gen87.X3 - Enforcement Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "📝 Please edit .env and add your API keys:" -ForegroundColor Yellow
    Write-Host "   - GITHUB_TOKEN (required)" -ForegroundColor Gray
    Write-Host "   - TAVILY_API_KEY (required for search)" -ForegroundColor Gray
    Write-Host ""
}

# Install npm dependencies
Write-Host "📦 Installing npm dependencies..." -ForegroundColor Cyan
npm install

# Initialize husky
Write-Host "🪝 Setting up git hooks..." -ForegroundColor Cyan
npx husky

# Install Playwright browsers
Write-Host "🎭 Installing Playwright browsers..." -ForegroundColor Cyan
npx playwright install chromium

# Initialize git if needed
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

# Install VS Code extensions
Write-Host "📦 Installing VS Code extensions..." -ForegroundColor Cyan
$extensions = @(
    "github.copilot",
    "github.copilot-chat",
    "biomejs.biome",
    "ms-playwright.playwright",
    "vitest.explorer",
    "eamodio.gitlens",
    "usernamehw.errorlens",
    "yoavbls.pretty-ts-errors"
)

foreach ($ext in $extensions) {
    Write-Host "  Installing $ext..." -ForegroundColor Gray
    code --install-extension $ext --force 2>$null
}

Write-Host ""
Write-Host "🚀 Ready to go! Open gen87_x3.code-workspace" -ForegroundColor Green
