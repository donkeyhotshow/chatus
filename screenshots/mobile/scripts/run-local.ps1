<#
.SYNOPSIS
  PowerShell helper to run local checks and start dev servers on Windows.
  Usage:
    .\scripts\run-local.ps1 -CheckEnv -Install -StartFront -RunTests
#>
param(
  [switch]$Clean,
  [switch]$Install,
  [switch]$CheckEnv,
  [switch]$StartFront,
  [switch]$StartBack,
  [switch]$RunTests,
  [switch]$All
)

Set-StrictMode -Version Latest
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $ProjectRoot
if ($All) { $Clean=$true; $Install=$true; $CheckEnv=$true }

function Log([string]$m) { Write-Host $m }
function Err([string]$m) { Write-Error $m }

function Check-Node {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Err "Node.js not found in PATH"
    return 2
  }
  $v = node -v
  Log "Node: $v"
  return 0
}

function Check-Python {
  if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Log "Python not found, skipping python checks"
    return 0
  }
  $v = python --version 2>&1
  Log "Python: $v"
  return 0
}

function Do-Clean {
  $paths = @("node_modules"," .next","dist",".venv")
  Write-Host "This will remove: $($paths -join ', ')"
  $confirm = Read-Host "Proceed? (y/N)"
  if ($confirm -match '^[Yy]') {
    foreach ($p in $paths) {
      if (Test-Path $p) { Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue }
    }
    Log "Cleaned."
  } else {
    Log "Skipped clean."
  }
}

function Do-Install {
  if (Get-Command npm -ErrorAction SilentlyContinue) {
    Log "Running npm install..."
    npm install
  } else {
    Err "npm not available"
  }
}

function Check-EnvKeys {
  $keys = @("NEXT_PUBLIC_WS_HOST","NEXT_PUBLIC_API_URL","GH_TOKEN","FIREBASE_API_KEY","FIREBASE_PROJECT_ID")
  $envfile = if (Test-Path ".env.local") { ".env.local" } elseif (Test-Path ".env") { ".env" } else { "" }
  if (-not $envfile) { Err "No .env.local or .env found"; return 2 }
  Log "Checking $envfile ..."
  $content = Get-Content $envfile -ErrorAction SilentlyContinue
  $missing = 0
  foreach ($k in $keys) {
    if ($content -notmatch "^$k=") { Write-Host "MISSING: $k"; $missing++ } else { Write-Host "OK: $k" }
  }
  if ($missing -gt 0) { Err "Missing $missing keys"; return 3 }
  Log "Env OK"
  return 0
}

function Start-Front {
  New-Item -ItemType Directory -Force -Path .logs | Out-Null
  Log "Starting frontend: npm run dev (logs -> .logs\frontend.log)"
  Start-Process -NoNewWindow -FilePath npm -ArgumentList "run","dev" -RedirectStandardOutput ".logs\frontend.log" -RedirectStandardError ".logs\frontend.log"
}

function Start-Back {
  if (-not (Get-Command uvicorn -ErrorAction SilentlyContinue)) {
    Log "uvicorn not found; install python deps or run backend manually"
    return 2
  }
  New-Item -ItemType Directory -Force -Path .logs | Out-Null
  Log "Starting backend uvicorn server_coop_puzzle:app --reload --port 8000 (logs -> .logs\backend.log)"
  Start-Process -NoNewWindow -FilePath uvicorn -ArgumentList "server_coop_puzzle:app","--reload","--port","8000" -RedirectStandardOutput ".logs\backend.log" -RedirectStandardError ".logs\backend.log"
}

function Run-Tests {
  if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm run test
  } elseif (Get-Command npx -ErrorAction SilentlyContinue) {
    npx vitest run
  } else {
    Err "No test runner found"
  }
}

# Main
Check-Node
Check-Python
if ($Clean) { Do-Clean }
if ($Install) { Do-Install }
if ($CheckEnv) { Check-EnvKeys }
if ($RunTests) { Run-Tests }
if ($StartFront) { Start-Front }
if ($StartBack) { Start-Back }

Pop-Location

