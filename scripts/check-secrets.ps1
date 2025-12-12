<#
  Simple PowerShell secret scan (grep-like) for Windows.
  Usage: .\scripts\check-secrets.ps1
#>
Set-StrictMode -Version Latest
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $ProjectRoot

Write-Host "Running quick repository secret scan..."
$patterns = @(
  "GH_TOKEN",
  "FIREBASE_API_KEY",
  "FIREBASE_",
  "PRIVATE_KEY",
  "BEGIN PRIVATE KEY",
  "SECRET_KEY",
  "API_KEY",
  "aws_secret_access_key",
  "AKIA[0-9A-Z]{16}"
)

foreach ($p in $patterns) {
  Write-Host "Searching for: $p"
  try {
    git grep -n -I -E $p -- 2>$null
  } catch {
    # fallback to Select-String across files
    Get-ChildItem -Recurse -File -Exclude .git | Select-String -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue
  }
}

Write-Host "Checking for env files committed to repo..."
try {
  git ls-files | Select-String -Pattern '\.env($|\.|$)' -AllMatches
} catch {
  Get-ChildItem -Path . -Include ".env*" -File -Recurse -ErrorAction SilentlyContinue | Select-Object FullName
}

Write-Host "Scan complete. This is a quick check — use git-secrets/truffleHog for deeper scanning."
Pop-Location


