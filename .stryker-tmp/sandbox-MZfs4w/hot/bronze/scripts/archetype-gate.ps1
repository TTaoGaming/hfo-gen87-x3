#!/usr/bin/env pwsh
# DEFENSE IN DEPTH LAYER 3: Pre-commit archetype gate validation
# Gen87.X3 | 2025-12-31 | Port 5 (Pyre Praetorian) DEFEND gate

param(
    [string]$BlackboardPath = "sandbox/obsidianblackboard.jsonl",
    [switch]$Strict,
    [switch]$Verbose
)

$VALID_PULLS = @("upstream", "downstream", "lateral")
$VALID_TYPES = @("signal", "event", "error", "metric", "handoff", "schema")
$VALID_HIVES = @("H", "I", "V", "E", "X")

function Test-ISO8601 {
    param([string]$Timestamp)
    try {
        $null = [DateTime]::Parse($Timestamp)
        return $true
    } catch {
        return $false
    }
}

function Test-ArchetypeAlignment {
    param([PSObject]$Signal, [int]$LineNumber)
    
    $violations = @()
    
    if (-not $Signal.ts) {
        $violations += "G-A0 WHEN: Missing ts field"
    } elseif (-not (Test-ISO8601 $Signal.ts)) {
        $violations += "G-A0 WHEN: Invalid timestamp"
    }
    
    if ($null -eq $Signal.mark) {
        $violations += "G-A1 LINK: Missing mark field"
    } elseif ($Signal.mark -lt 0 -or $Signal.mark -gt 1) {
        $violations += "G-A1 LINK: mark must be 0-1"
    }
    
    if (-not $Signal.pull) {
        $violations += "G-A2 FLOW: Missing pull field"
    } elseif ($Signal.pull -notin $VALID_PULLS) {
        $violations += "G-A2 FLOW: Invalid pull value"
    }
    
    if (-not $Signal.msg) {
        $violations += "G-A3 PAYLOAD: Missing msg field"
    }
    
    if (-not $Signal.type) {
        $violations += "G-A4 CLASS: Missing type field"
    } elseif ($Signal.type -notin $VALID_TYPES) {
        $violations += "G-A4 CLASS: Invalid type value"
    }
    
    if (-not $Signal.hive) {
        $violations += "G-A5 PHASE: Missing hive field"
    } elseif ($Signal.hive -notin $VALID_HIVES) {
        $violations += "G-A5 PHASE: Invalid hive value"
    }
    
    if ($null -eq $Signal.gen) {
        $violations += "G-A6 VERSION: Missing gen field"
    } elseif ($Signal.gen -lt 1) {
        $violations += "G-A6 VERSION: gen must be >= 1"
    }
    
    if ($null -eq $Signal.port) {
        $violations += "G-A7 SOURCE: Missing port field"
    } elseif ($Signal.port -lt 0 -or $Signal.port -gt 7) {
        $violations += "G-A7 SOURCE: port must be 0-7"
    }
    
    return @{
        Line = $LineNumber
        Valid = ($violations.Count -eq 0)
        Violations = $violations
    }
}

Write-Host "ARCHETYPE GATE - Pre-Commit Validation"
Write-Host "Layer 3 Defense in Depth - Pyre Praetorian Port 5"
Write-Host "================================================="

if (-not (Test-Path $BlackboardPath)) {
    Write-Host "WARN: Blackboard not found at $BlackboardPath"
    exit 0
}

$lines = Get-Content $BlackboardPath -ErrorAction SilentlyContinue
$totalSignals = 0
$validSignals = 0
$allViolations = @()

foreach ($i in 0..($lines.Count - 1)) {
    $line = $lines[$i]
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $lineNum = $i + 1
    $totalSignals++
    
    try {
        $signal = $line | ConvertFrom-Json
        $result = Test-ArchetypeAlignment -Signal $signal -LineNumber $lineNum
        
        if ($result.Valid) {
            $validSignals++
            if ($Verbose) {
                Write-Host "OK Line $lineNum"
            }
        } else {
            $allViolations += $result
            if ($Verbose) {
                Write-Host "FAIL Line $lineNum"
                foreach ($v in $result.Violations) {
                    Write-Host "  - $v"
                }
            }
        }
    } catch {
        $allViolations += @{
            Line = $lineNum
            Valid = $false
            Violations = @("PARSE ERROR: Invalid JSON")
        }
    }
}

Write-Host ""
Write-Host "VALIDATION SUMMARY"
Write-Host "  Total Signals: $totalSignals"
Write-Host "  Valid: $validSignals"
Write-Host "  Invalid: $($allViolations.Count)"

if ($allViolations.Count -gt 0) {
    Write-Host ""
    Write-Host "ARCHETYPE VIOLATIONS DETECTED"
    Write-Host "============================="
    
    foreach ($v in $allViolations) {
        Write-Host ""
        Write-Host "Line $($v.Line):"
        foreach ($violation in $v.Violations) {
            Write-Host "  - $violation"
        }
    }
    
    if ($Strict) {
        Write-Host ""
        Write-Host "BLOCKED: Fix violations before committing"
        exit 1
    } else {
        Write-Host ""
        Write-Host "WARNINGS: $($allViolations.Count) violations (use -Strict to block)"
        exit 0
    }
} else {
    Write-Host ""
    Write-Host "ALL SIGNALS CONFORM TO 8-PART ARCHETYPE SCHEMA"
    exit 0
}
