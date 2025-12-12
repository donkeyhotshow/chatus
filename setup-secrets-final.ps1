#Requires -Version 5.1

Write-Host "🔐 Настройка секретов для ChatForUs" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check GH_TOKEN
if (-not $env:GH_TOKEN) {
    Write-Host "❌ GH_TOKEN не установлен!" -ForegroundColor Red
    Write-Host "Установите: `$env:GH_TOKEN = 'ваш_github_token'" -ForegroundColor Yellow
    exit 1
}

# Check GitHub CLI
try {
    gh --version | Out-Null
    Write-Host "✅ GitHub CLI найден" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI не найден. Установите: https://cli.github.com/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔑 Настройка секретов для деплоя..." -ForegroundColor Cyan

# Firebase Project ID
$firebaseProjectId = "studio-5170287541-f2fb7"
Write-Host "📍 Firebase Project ID: $firebaseProjectId" -ForegroundColor Blue

# Firebase Token
Write-Host ""
Write-Host "🔥 Firebase Token:" -ForegroundColor Yellow
Write-Host "1. Перейдите: https://console.firebase.google.com/project/$firebaseProjectId/settings/serviceaccounts/adminsdk" -ForegroundColor White
Write-Host "2. Нажмите 'Generate new private key'" -ForegroundColor White
Write-Host "3. Скачайте JSON файл" -ForegroundColor White
Write-Host "4. Откройте JSON и скопируйте содержимое" -ForegroundColor White
$firebaseToken = Read-Host "Вставьте Firebase service account JSON"

# Vercel Token
Write-Host ""
Write-Host "⚡ Vercel Token:" -ForegroundColor Yellow
Write-Host "1. Перейдите: https://vercel.com/account/tokens" -ForegroundColor White
Write-Host "2. Создайте новый токен с именем 'ChatForUs'" -ForegroundColor White
$vercelToken = Read-Host "Введите Vercel Token"

# Vercel Org ID
Write-Host ""
Write-Host "🏢 Vercel Org ID:" -ForegroundColor Yellow
Write-Host "1. Перейдите: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Скопируйте Team ID из URL или настроек" -ForegroundColor White
$vercelOrgId = Read-Host "Введите Vercel Org ID (оставьте пустым для personal account)"

# Vercel Project ID
$vercelProjectId = "prj_jMEdSQ7nEXvMDow8wTUN405EvRxA"
Write-Host "📍 Vercel Project ID: $vercelProjectId" -ForegroundColor Blue

Write-Host ""
Write-Host "⚙️ Установка секретов..." -ForegroundColor Cyan

# Function to set secret
function Set-GitHubSecret {
    param($name, $value)
    try {
        $value | gh secret set $name --repo donkeyhotshow/ChatForUs
        Write-Host "✅ $name установлен" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка установки $name : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Set all secrets
Set-GitHubSecret "FIREBASE_PROJECT_ID" $firebaseProjectId
Set-GitHubSecret "FIREBASE_TOKEN" $firebaseToken
Set-GitHubSecret "VERCEL_TOKEN" $vercelToken

if ($vercelOrgId) {
    Set-GitHubSecret "VERCEL_ORG_ID" $vercelOrgId
}

Set-GitHubSecret "VERCEL_PROJECT_ID" $vercelProjectId

# Firebase Environment Variables
Write-Host ""
Write-Host "🔧 Установка переменных окружения..." -ForegroundColor Cyan

Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_API_KEY" "AIzaSyCLVWyPpa8idMJgN038vEPY8ADjARBs1j8"
Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "studio-5170287541-f2fb7.firebaseapp.com"
Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "studio-5170287541-f2fb7"
Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "studio-5170287541-f2fb7.firebasestorage.app"
Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "671791091944"
Set-GitHubSecret "NEXT_PUBLIC_FIREBASE_APP_ID" "1:671791091944:web:9d7f3ec08cfe73c283f95d"

Write-Host ""
Write-Host "🎉 Настройка завершена!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Перейдите в GitHub Actions: https://github.com/donkeyhotshow/ChatForUs/actions" -ForegroundColor White
Write-Host "2. Выберите workflow 'Deploy Firebase & Vercel'" -ForegroundColor White
Write-Host "3. Нажмите 'Run workflow'" -ForegroundColor White
Write-Host ""
Write-Host "🚀 После деплоя приложение будет доступно:" -ForegroundColor Green
Write-Host "https://chatforus.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Важно: Убедитесь, что код загружен в репозиторий!" -ForegroundColor Yellow