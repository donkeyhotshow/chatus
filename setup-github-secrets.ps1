# PowerShell скрипт для настройки GitHub секретов для деплоя
# Запустите этот скрипт для автоматической настройки секретов

Write-Host "🔐 Настройка GitHub секретов для Firebase и Vercel..." -ForegroundColor Green

# Проверяем наличие GH_TOKEN
if (-not $env:GH_TOKEN) {
    Write-Host "❌ Ошибка: GH_TOKEN не установлен!" -ForegroundColor Red
    Write-Host "Сначала выполните: `$env:GH_TOKEN = 'ваш_github_token'" -ForegroundColor Yellow
    exit 1
}

# Проверяем наличие gh CLI
try {
    gh --version | Out-Null
} catch {
    Write-Host "❌ GitHub CLI не установлен" -ForegroundColor Red
    exit 1
}

# Получаем название репозитория
$repo = gh repo list --json name --jq '.[0].name' 2>$null
if (-not $repo) {
    Write-Host "❌ Не найдено репозиториев. Сначала загрузите проект на GitHub." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Найден репозиторий: $repo" -ForegroundColor Cyan

# Настройка секретов
Write-Host "🔑 Настройка секретов..." -ForegroundColor Yellow

# Firebase секреты
Write-Host "Firebase Project ID (studio-5170287541-f2fb7): " -NoNewline
$firebaseProjectId = Read-Host
if ($firebaseProjectId) {
    gh secret set FIREBASE_PROJECT_ID -R "$repo" --body $firebaseProjectId
    Write-Host "✅ FIREBASE_PROJECT_ID установлен" -ForegroundColor Green
}

Write-Host "Firebase Token (получите в Firebase Console > Settings > Service accounts): " -NoNewline
$firebaseToken = Read-Host
if ($firebaseToken) {
    gh secret set FIREBASE_TOKEN -R "$repo" --body $firebaseToken
    Write-Host "✅ FIREBASE_TOKEN установлен" -ForegroundColor Green
}

# Vercel секреты
Write-Host "Vercel Token (получите в Vercel Dashboard > Account Settings > Tokens): " -NoNewline
$vercelToken = Read-Host
if ($vercelToken) {
    gh secret set VERCEL_TOKEN -R "$repo" --body $vercelToken
    Write-Host "✅ VERCEL_TOKEN установлен" -ForegroundColor Green
}

Write-Host "Vercel Org ID (asdas' projects): " -NoNewline
$vercelOrgId = Read-Host
if ($vercelOrgId) {
    gh secret set VERCEL_ORG_ID -R "$repo" --body $vercelOrgId
    Write-Host "✅ VERCEL_ORG_ID установлен" -ForegroundColor Green
}

Write-Host "Vercel Project ID (prj_jMEdSQ7nEXvMDow8wTUN405EvRxA): " -NoNewline
$vercelProjectId = Read-Host
if ($vercelProjectId) {
    gh secret set VERCEL_PROJECT_ID -R "$repo" --body $vercelProjectId
    Write-Host "✅ VERCEL_PROJECT_ID установлен" -ForegroundColor Green
}

Write-Host "`n🎉 Все секреты настроены!" -ForegroundColor Green
Write-Host "🚀 Следующий push в main ветку запустит автоматический деплой" -ForegroundColor Blue
