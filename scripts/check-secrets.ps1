Write-Host "=== scripts/check-secrets.ps1 — проверка .env и возможных секретов в репо ==="

$repoRoot = Get-Location

# 1) Проверка наличия .env.local
if (Test-Path ".env.local") {
  Write-Host "Найден .env.local (локальные секреты). Убедитесь, что он в .gitignore."
  try {
    git rev-parse --is-inside-work-tree > $null 2>&1
    $isGit = $true
  } catch {
    $isGit = $false
  }
  if ($isGit) {
    try {
      git ls-files --error-unmatch .env.local > $null 2>&1
      Write-Error ".env.local закоммичен в репозиторий! Уберите его и выполните: git rm --cached .env.local"
      $foundTrackedEnv = $true
    } catch {
      $foundTrackedEnv = $false
    }
  } else {
    Write-Host "Не git-репозиторий — пропускаем проверку трекинга .env.local."
    $foundTrackedEnv = $false
  }
} else {
  Write-Host ".env.local не найден."
  $foundTrackedEnv = $false
}

Write-Host ""
Write-Host "Поиск потенциальных секретов в файловом дереве (исключая .git и node_modules)"

$patterns = @(
  "FIREBASE_API_KEY",
  "API_KEY",
  "SECRET",
  "PRIVATE_KEY",
  "AWS_SECRET_ACCESS_KEY",
  "GITHUB_TOKEN",
  "TOKEN="
)

$foundAny = $false
foreach ($p in $patterns) {
  $matches = Get-ChildItem -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\.git' -and $_.FullName -notmatch 'node_modules' } | Select-String -Pattern $p -SimpleMatch -CaseSensitive:$false
  if ($matches) {
    Write-Host "Matches for pattern '$p':"
    $matches | ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }
    $foundAny = $true
  }
}

Write-Host ""
if ($foundAny) {
  Write-Warning "Найдены потенциальные секреты/ключи. Проверьте вывод выше и удалите/переместите в безопасное хранилище."
} else {
  Write-Host "Не найдено очевидных секретов по базовым паттернам."
}

if ($foundTrackedEnv -or $foundAny) {
  Write-Error "Результат: FAIL (найдены потенциальные секреты или .env.local закоммичен)"
  exit 2
} else {
  Write-Host "Результат: OK"
  exit 0
}

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


