#Requires -Version 5.1

Write-Host "🔧 Настройка Firebase переменных в Vercel" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Переменные окружения
$envVars = @{
    "NEXT_PUBLIC_FIREBASE_API_KEY" = "AIzaSyCLVWyPpa8idMJgN038vEPY8ADjARBs1j8"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = "studio-5170287541-f2fb7.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = "studio-5170287541-f2fb7"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = "studio-5170287541-f2fb7.firebasestorage.app"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "671791091944"
    "NEXT_PUBLIC_FIREBASE_APP_ID" = "1:671791091944:web:9d7f3ec08cfe73c283f95d"
}

Write-Host "📋 Будут добавлены переменные:" -ForegroundColor Yellow
foreach ($key in $envVars.Keys) {
    Write-Host "  - $key" -ForegroundColor White
}
Write-Host ""

$confirm = Read-Host "Продолжить? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Отменено пользователем" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚙️ Добавление переменных..." -ForegroundColor Cyan

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Добавление $key..." -ForegroundColor Blue

    try {
        # Используем echo для передачи значения в vercel env add
        echo $value | vercel env add $key --yes
        Write-Host "✅ $key добавлен" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка добавления $key : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🚀 Переразвертывание приложения..." -ForegroundColor Cyan

try {
    vercel --prod --yes
    Write-Host "✅ Приложение переразвернуто!" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка переразвертывания: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Настройка завершена!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Проверьте приложение:" -ForegroundColor Cyan
Write-Host "https://chatus-app.vercel.app" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Проверьте в браузере (F12 → Console):" -ForegroundColor Yellow
Write-Host 'console.log(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)' -ForegroundColor White


