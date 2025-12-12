# Автоматическая настройка секретов для ChatForUs
# Использует предустановленные значения

Write-Host "🔐 Автоматическая настройка секретов для ChatForUs" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

# Проверить GH_TOKEN
if (-not $env:GH_TOKEN) {
    Write-Host "❌ GH_TOKEN не установлен!" -ForegroundColor Red
    Write-Host "Установите: `$env:GH_TOKEN = 'ваш_github_token'" -ForegroundColor Yellow
    exit 1
}

# Проверить GitHub CLI
try {
    gh --version | Out-Null
    Write-Host "✅ GitHub CLI найден" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI не найден. Установите: https://cli.github.com/" -ForegroundColor Red
    exit 1
}

# Предустановленные значения
$firebaseProjectId = "studio-5170287541-f2fb7"
# For security, do NOT embed the service account JSON in this script.
# If you want to set the Firebase service account automatically, either:
#  - set the environment variable FIREBASE_SERVICE_ACCOUNT with the JSON string, or
#  - keep the service account JSON locally and provide its path when prompted below.
$firebaseToken = $null
Write-Host "Firebase service account JSON path (leave empty to skip setting FIREBASE_TOKEN): " -NoNewline
$saPath = Read-Host
if ($saPath -and (Test-Path $saPath)) {
    $firebaseToken = Get-Content -Raw -Encoding UTF8 $saPath
    Write-Host "✅ Service account JSON loaded from $saPath" -ForegroundColor Green
} elseif ($env:FIREBASE_SERVICE_ACCOUNT) {
    $firebaseToken = $env:FIREBASE_SERVICE_ACCOUNT
    Write-Host "✅ Service account JSON loaded from environment variable FIREBASE_SERVICE_ACCOUNT" -ForegroundColor Green
} else {
    Write-Host "⚠️ Service account JSON not provided; FIREBASE_TOKEN will not be set." -ForegroundColor Yellow
}
$vercelToken = "4vmsnnoefgzwhP9RcG3cyPuq"
$vercelOrgId = ""  # Пустой для personal account
$vercelProjectId = "prj_jMEdSQ7nEXvMDow8wTUN405EvRxA"

Write-Host ""
Write-Host "🔑 Установка секретов..." -ForegroundColor Cyan

# Функция для установки секрета
function Set-GitHubSecret {
    param($name, $value)
    try {
        $value | gh secret set $name --repo donkeyhotshow/ChatForUs
        Write-Host "✅ $name установлен" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка установки $name : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Установка секретов
Set-GitHubSecret "FIREBASE_PROJECT_ID" $firebaseProjectId
Set-GitHubSecret "FIREBASE_TOKEN" $firebaseToken
Set-GitHubSecret "VERCEL_TOKEN" $vercelToken

if ($vercelOrgId) {
    Set-GitHubSecret "VERCEL_ORG_ID" $vercelOrgId
}

Set-GitHubSecret "VERCEL_PROJECT_ID" $vercelProjectId

# Firebase переменные окружения
Write-Host ""
Write-Host "🔧 Установка переменных окружения..." -ForegroundColor Cyan

Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_API_KEY" "AIzaSyCLVWyPpa8idMJgN038vEPY8ADjARBs1j8"
Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "studio-5170287541-f2fb7.firebaseapp.com"
Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "studio-5170287541-f2fb7"
Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "studio-5170287541-f2fb7.firebasestorage.app"
Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "671791091944"
Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_APP_ID" "1:671791091944:web:9d7f3ec08cfe73c283f95d"

Write-Host ""
Write-Host "🎉 Настройка секретов завершена!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Перейдите в GitHub Actions: https://github.com/donkeyhotshow/ChatForUs/actions" -ForegroundColor White
Write-Host "2. Выберите workflow 'Deploy Firebase & Vercel'" -ForegroundColor White
Write-Host "3. Нажмите 'Run workflow'" -ForegroundColor White
Write-Host ""
Write-Host "🚀 После деплоя приложение будет доступно:" -ForegroundColor Green
Write-Host "https://chatforus.vercel.app" -ForegroundColor Cyan
