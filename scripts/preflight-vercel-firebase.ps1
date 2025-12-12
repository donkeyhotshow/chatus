Write-Host "=== preflight-vercel-firebase.ps1 — quick checks for Vercel & Firebase ==="

$report = "preflight-vercel-firebase.json"
$statusOk = $true

Write-Host "- Check vercel.json"
if (Test-Path "vercel.json") {
  Write-Host "  vercel.json found"
  $content = Get-Content vercel.json -Raw
  if ($content -match '"build"' -or $content -match '"outputDirectory"') {
    Write-Host "  build/outputDirectory keys present (basic check)"
  } else {
    Write-Warning "vercel.json may not specify build/outputDirectory"
    $statusOk = $false
  }
} else {
  Write-Warning "vercel.json not found"
  $statusOk = $false
}

Write-Host "- Check Vercel CLI"
try {
  $ver = (Get-Command vercel -ErrorAction Stop) ; $whoami = vercel whoami 2>$null
  if ($whoami) { Write-Host \"  vercel CLI logged in as: $whoami\" } else { Write-Warning \"  vercel CLI present but not logged in\" ; $statusOk = $false }
} catch { Write-Warning \"  vercel CLI not installed\" ; $statusOk = $false }

Write-Host "- Check firebase.json"
if (Test-Path "firebase.json") { Write-Host "  firebase.json found" } else { Write-Warning "  firebase.json not found"; $statusOk = $false }

Write-Host "- Check Firebase CLI"
try { $fv = (Get-Command firebase -ErrorAction Stop); Write-Host \"  firebase CLI version: $(firebase --version 2>$null)\" } catch { Write-Warning \"  firebase CLI not installed\"; $statusOk = $false }

Write-Host "- Check .env.local for essential vars"
$missing = @()
foreach ($v in @('FIREBASE_PROJECT_ID','FIREBASE_API_KEY','NEXT_PUBLIC_API_URL')) {
  if (Test-Path ".env.local") {
    $s = Select-String -Path .env.local -Pattern \"^$v=\" -SimpleMatch -Quiet
    if (-not $s) { $missing += $v }
  } else {
    $missing += $v
  }
}
if ($missing.Count -gt 0) { Write-Warning \"  missing env vars in .env.local: $($missing -join ', ')\"; $statusOk = $false } else { Write-Host \"  essential env vars present in .env.local\" }

$overall = 'PASS'
if (-not $statusOk) { $overall = 'FAIL' }

$reportObj = [PSCustomObject]@{
  vercel_json = (Test-Path vercel.json)
  vercel_cli_logged_in = ($whoami -ne $null)
  firebase_json = (Test-Path firebase.json)
  firebase_cli = (Get-Command firebase -ErrorAction SilentlyContinue) -ne $null
  missing_env_vars = $missing
  overall_status = $overall
}
$reportObj | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 $report

Write-Host \"Preflight finished — report: $report\"
if ($overall -eq 'FAIL') { exit 2 } else { exit 0 }


