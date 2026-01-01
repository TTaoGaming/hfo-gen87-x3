# Start Temporal Worker for HIVE/8
# Run in a separate terminal: .\start-worker.ps1

$env:OPENROUTER_API_KEY = "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"

Set-Location "c:\Dev\active\hfo_gen87_x3\hot\bronze\src\orchestration"

Write-Host "Starting Temporal Worker..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npx tsx temporal.worker.ts
