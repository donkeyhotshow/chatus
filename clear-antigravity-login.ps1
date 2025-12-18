<#
.SYNOPSIS
    Clears Antigravity login data and cache.
.DESCRIPTION
    This script removes authentication tokens, cache, and session data for the Antigravity application.
    It ensures the application is not running before proceeding.
#>

$ErrorActionPreference = "Continue"

$base = Join-Path $env:APPDATA "Antigravity"
$processName = "Antigravity"

# List of folders and files to clear for a fresh login
$targets = @(
    "auth-tokens",
    "Cache",
    "GPUCache",
    "Local Storage",
    "Session Storage",
    "Network",
    "IndexedDB",
    "blob_storage",
    "Cookies",
    "Cookies-journal"
)

function Write-Step {
    param([string]$Message)
    Write-Host "`n[STEP] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

Write-Host "==============================================" -ForegroundColor Magenta
Write-Host "   Antigravity Login Data Cleanup Tool" -ForegroundColor Magenta
Write-Host "==============================================" -ForegroundColor Magenta

# 1. Check if Antigravity is running
Write-Step "Checking for running Antigravity processes..."
$procs = Get-Process -Name $processName -ErrorAction SilentlyContinue
if ($procs) {
    Write-Warning-Custom "Antigravity is currently running. Closing processes..."
    try {
        $procs | Stop-Process -Force
        Start-Sleep -Seconds 2
        Write-Success "Processes terminated."
    }
    catch {
        Write-Host "[ERROR] Failed to stop Antigravity processes. Please close them manually." -ForegroundColor Red
    }
}
else {
    Write-Host "No running processes found."
}

# 2. Cleanup
Write-Step "Starting cleanup in $base"

$cleanedCount = 0
$skippedCount = 0
$errorCount = 0

foreach ($target in $targets) {
    $path = Join-Path $base $target
    if (Test-Path $path) {
        Write-Host "Removing: $target..." -NoNewline
        try {
            Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
            Write-Host " OK" -ForegroundColor Green
            $cleanedCount++
        }
        catch {
            Write-Host " FAILED" -ForegroundColor Red
            Write-Warning-Custom "  -> $($_.Exception.Message)"
            $errorCount++
        }
    }
    else {
        Write-Host "Skipping: $target (not found)" -ForegroundColor Gray
        $skippedCount++
    }
}

# 3. Summary
Write-Host "`n==============================================" -ForegroundColor Magenta
Write-Success "Cleanup process finished!"
Write-Host "Items cleaned: $cleanedCount"
Write-Host "Items skipped: $skippedCount"
if ($errorCount -gt 0) {
    Write-Host "Errors encountered: $errorCount" -ForegroundColor Red
}
Write-Host "==============================================" -ForegroundColor Magenta
Write-Host "Done. Please restart Antigravity and sign in again." -ForegroundColor White
