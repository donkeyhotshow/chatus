Write-Host "=== scripts/prepr-checks.ps1 — pre-PR checks (1–4) ==="

$doFix = $false
param(
  [switch]$fix
)
if ($fix) { $doFix = $true }

 $reportJson = "prepr-report.json"
 $node_ok = $false
 $node_version = ""
 $npm_ok = $false
 $python_ok = $false
 $ports_busy = @()
 $checkSecretsStatus = 0
 $buildStatus = 0

Write-Host "-- 1) Environment checks"
$requiredNode = 20
try {
  $nodeV = node -v
  $nodeMajor = [int]($nodeV.TrimStart("v").Split(".")[0])
  Write-Host "Node: $nodeV"
  if ($nodeMajor -lt $requiredNode) { Write-Warning "Node < $requiredNode" }
  else { $node_ok = $true; $node_version = $nodeV }
} catch {
  Write-Warning "Node not found"
}

try { Write-Host "npm: $(npm -v)" } catch { Write-Warning "npm not found" }
if ( (Get-Command npm -ErrorAction SilentlyContinue) ) { $npm_ok = $true }

if (Test-Path "requirements.txt") {
  try { Write-Host "Python: $(python --version 2>&1)" } catch { Write-Warning "Python not found" }
  try { $pv = (python --version 2>&1); $python_ok = $true } catch {}
}

Write-Host ""
Write-Host "-- Port checks (3000,8000)"
try {
  $n3000 = netstat -ano | Select-String ":3000" -ErrorAction SilentlyContinue
  if ($n3000) { $ports_busy += 3000; Write-Host "Port 3000 busy"; $n3000 }
  else { Write-Host "Port 3000 free" }
  $n8000 = netstat -ano | Select-String ":8000" -ErrorAction SilentlyContinue
  if ($n8000) { $ports_busy += 8000; Write-Host "Port 8000 busy"; $n8000 }
  else { Write-Host "Port 8000 free" }
} catch {
  Write-Host "Port check failed — netstat not available"
}

Write-Host ""
Write-Host "-- 2) Clean + install (optional; pass -fix)"
if ($doFix) {
  Write-Host "Cleaning node_modules/.next/dist/.venv..."
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules, .next, dist, .venv
  if (Test-Path "package-lock.json") { npm ci } else { npm install }
  if (Test-Path "functions") { Push-Location functions; if (Test-Path "package-lock.json") { npm ci } else { npm install }; Pop-Location }
} else {
  Write-Host "Not running clean/install (pass -fix to enable)"
}

Write-Host ""
Write-Host "-- 3) .env and secrets check"
if (Test-Path "scripts/check-secrets.ps1") {
  try {
    & .\scripts\check-secrets.ps1
    $checkSecretsStatus = $LASTEXITCODE
  } catch {
    Write-Warning "check-secrets detected issues"
    $checkSecretsStatus = $LASTEXITCODE
  }
} else {
  Write-Host "scripts/check-secrets.ps1 not found — skip"
}

Write-Host ""
Write-Host "-- 4) Build (optional; pass -fix to run build)"
if ($doFix) {
  $pkg = Get-Content package.json -Raw -ErrorAction SilentlyContinue
  if ($pkg -and $pkg -match '"build"') {
    Write-Host "Building frontend..."
    try { npm run build } catch { Write-Warning "build failed" }
  } else {
    Write-Host "No build script found — skip"
  }
  if (Test-Path "functions") {
    Push-Location functions
    $pkgf = Get-Content package.json -Raw -ErrorAction SilentlyContinue
    if ($pkgf -and $pkgf -match '"build"') { try { npm run build } catch { } }
    Pop-Location
  }
} else {
  Write-Host "Not running build (pass -fix to enable)"
}

Write-Host ""
Write-Host "=== prepr-checks.ps1 finished ==="

# Build report
$overall = "PASS"
if (-not $node_ok -or -not $npm_ok -or $checkSecretsStatus -ne 0) { $overall = "FAIL" }

$report = @{
  node_ok = $node_ok
  node_version = $node_version
  npm_ok = $npm_ok
  python_ok = $python_ok
  ports_busy = $ports_busy
  check_secrets_status = $checkSecretsStatus
  build_status = $buildStatus
  overall_status = $overall
}
$report | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 $reportJson
Write-Host "JSON report written to $reportJson"


