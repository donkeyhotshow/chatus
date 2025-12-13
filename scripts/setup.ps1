<#
.SYNOPSIS
  PowerShell скрипт для локальной подготовки окружения (Windows)
>
Write-Host "=== ChatUs: Локальная подготовка окружения (PowerShell) ==="

Write-Host ""
Write-Host "1) Проверка окружения"

# Node.js
$RequiredNode = 20
try {
    $NodeVersion = node -v
    $NodeMajor = [int]($NodeVersion.TrimStart("v").Split(".")[0])
    if ($NodeMajor -lt $RequiredNode) {
        Write-Warning "Node.js версия $NodeVersion < $RequiredNode. Обновите Node.js!"
    } else {
        Write-Host "✅ Node.js версия $NodeVersion подходит"
    }
} catch {
    Write-Warning "Node.js не найден"
}

# npm
try {
    $NpmVersion = npm -v
    Write-Host "✅ npm найден: $NpmVersion"
} catch {
    Write-Warning "npm не найден"
}

# Python
$RequiredPython = 3.11
try {
    $PythonVersionFull = (python --version 2>&1)
    $PythonParts = $PythonVersionFull.Split(" ")[1].Split(".")
    $PythonMajor = [int]$PythonParts[0]
    $PythonMinor = [int]$PythonParts[1]
    if ($PythonMajor -lt 3 -or ($PythonMajor -eq 3 -and $PythonMinor -lt 11)) {
        Write-Warning "Python версия $($PythonParts[0]).$($PythonParts[1]) < $RequiredPython. Обновите Python!"
    } else {
        Write-Host "✅ Python версия $($PythonParts[0]).$($PythonParts[1]) подходит"
    }
} catch {
    Write-Warning "Python не найден"
}

Write-Host "=== Проверка завершена ==="

Write-Host ""
Write-Host "Проверка занятых портов (3000, 8000)"
try {
  netstat -ano | Select-String ":3000" -Quiet | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "Проверьте процессы, использующие порт 3000 (netstat output above)." }
  netstat -ano | Select-String ":8000" -Quiet | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "Проверьте процессы, использующие порт 8000 (netstat output above)." }
} catch {
  Write-Host "Не удалось выполнить netstat — проверьте порты вручную."
}
Write-Host ""
Write-Host "2) Очистка артефактов (если есть)"
$paths = @("node_modules", ".next", "dist", ".venv")
foreach ($p in $paths) {
  if (Test-Path $p) {
    Remove-Item -Recurse -Force $p
    Write-Host "Removed $p"
  }
}

Write-Host ""
Write-Host "3) Установка npm-зависимостей"
if (Test-Path "package-lock.json") {
  npm ci
} else {
  npm install
}

if (Test-Path "functions") {
  Write-Host "Установка зависимостей в functions/"
  Push-Location functions
  if (Test-Path "package-lock.json") { npm ci } else { npm install }
  Pop-Location
}

Write-Host ""
Write-Host "4) Настройка .env.local (создаёт .env.local только если файла нет)"
if (-not (Test-Path ".env.local")) {
  Write-Host ".env.local не найден. Создать интерактивно? (Y/n)"
  $create = Read-Host
  if ([string]::IsNullOrWhiteSpace($create)) { $create = "Y" }
  if ($create -match "^[Yy]") {
    function PromptValue($name, $default) {
      $val = Read-Host "$name [$default]"
      if ([string]::IsNullOrWhiteSpace($val)) { return $default } else { return $val }
    }

    $WS_HOST = PromptValue "NEXT_PUBLIC_WS_HOST" "ws://localhost:3001"
    if ($WS_HOST -notmatch '^(ws:\/\/|wss:\/\/)') { Write-Host "Предупреждение: NEXT_PUBLIC_WS_HOST не похоже на ws:// или wss://"}
    $API_URL = PromptValue "NEXT_PUBLIC_API_URL" "http://localhost:8000"
    if ($API_URL -notmatch '^(http:\/\/|https:\/\/)') { Write-Host "Предупреждение: NEXT_PUBLIC_API_URL не похоже на http:// или https://"}
    $FIREBASE_API_KEY = Read-Host "FIREBASE_API_KEY (ввод виден)"
    $FIREBASE_AUTH_DOMAIN = PromptValue "FIREBASE_AUTH_DOMAIN" ""
    $FIREBASE_PROJECT_ID = PromptValue "FIREBASE_PROJECT_ID" ""
    $FIREBASE_STORAGE_BUCKET = PromptValue "FIREBASE_STORAGE_BUCKET" ""
    $FIREBASE_MESSAGING_SENDER_ID = PromptValue "FIREBASE_MESSAGING_SENDER_ID" ""
    $FIREBASE_APP_ID = PromptValue "FIREBASE_APP_ID" ""

    Write-Host "Будет создан .env.local. Секреты отображены частично:"
    Write-Host "NEXT_PUBLIC_WS_HOST=$WS_HOST"
    Write-Host "NEXT_PUBLIC_API_URL=$API_URL"
    if (-not [string]::IsNullOrWhiteSpace($FIREBASE_API_KEY)) { Write-Host "FIREBASE_API_KEY=****(set)" } else { Write-Host "FIREBASE_API_KEY=(empty)" }
    $confirm = Read-Host "Подтвердить запись в .env.local? (Y/n)"
    if ([string]::IsNullOrWhiteSpace($confirm)) { $confirm = "Y" }
    if ($confirm -match "^[Yy]") {
      $content = @(
        "NEXT_PUBLIC_WS_HOST=$WS_HOST"
        "NEXT_PUBLIC_API_URL=$API_URL"
        "FIREBASE_API_KEY=$FIREBASE_API_KEY"
        "FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN"
        "FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"
        "FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET"
        "FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID"
        "FIREBASE_APP_ID=$FIREBASE_APP_ID"
      )
      $content | Out-File -Encoding utf8 -FilePath .env.local
      Write-Host ".env.local создан. НЕ добавляйте в репозиторий."
    } else {
      Write-Host "Отменено. .env.local не создан."
    }
  } elseif (Test-Path ".env.local.example") {
    Copy-Item .env.local.example .env.local
    Write-Host ".env.local создан на основе .env.local.example — заполните реальные секреты."
  } else {
    $template = @(
      "NEXT_PUBLIC_WS_HOST=ws://localhost:3001"
      "NEXT_PUBLIC_API_URL=http://localhost:8000"
      "FIREBASE_API_KEY=placeholder"
      "FIREBASE_AUTH_DOMAIN=placeholder"
      "FIREBASE_PROJECT_ID=placeholder"
      "FIREBASE_STORAGE_BUCKET=placeholder"
      "FIREBASE_MESSAGING_SENDER_ID=placeholder"
      "FIREBASE_APP_ID=placeholder"
    )
    $template | Out-File -Encoding utf8 -FilePath .env.local
    Write-Host ".env.local создан с placeholder-значениями."
  }
} else {
  Write-Host ".env.local уже существует — пропуск."
}

Write-Host ""
Write-Host "5) Сборка (опционально) и запуск фронтенда"
$packageJson = Get-Content package.json -Raw -ErrorAction SilentlyContinue
if ($packageJson -and $packageJson -match '"build"') {
  Write-Host "Сборка фронтенда: npm run build"
  try { npm run build } catch { Write-Host "Сборка завершилась с ошибкой — проверьте логи." }
} else {
  Write-Host "Скрипт build не найден в package.json — пропускаем сборку."
}
Write-Host "Запустите в отдельном окне PowerShell: npm run dev"

Write-Host ""
Write-Host "6) (Опционально) Запуск backend (FastAPI)"
if (Test-Path "requirements.txt") {
  Write-Host "Создайте виртуальное окружение: python -m venv .venv"
  Write-Host "Активируйте: .\\.venv\\Scripts\\Activate.ps1"
  Write-Host "Далее: pip install -r requirements.txt ; uvicorn server_coop_puzzle:app --reload --port 8000"
} else {
  Write-Host "requirements.txt не найден — пропускаем шаг backend."
}

Write-Host ""
Write-Host "7) WebSocket & Coop-сценарии — ручная проверка"
Write-Host "Откройте public/coop/*.html и проверьте WS в DevTools → Network → WS."

Write-Host ""
Write-Host "8) Тесты"
$pkg = Get-Content package.json -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
if ($pkg -and $pkg.scripts -and $pkg.scripts.'test:unit') {
  Write-Host "Запуск unit-тестов: npm run test:unit"
} else {
  Write-Host "Скрипт test:unit не найден в package.json — запустите тесты вручную."
}

Write-Host ""
Write-Host "Готово. Проверьте `README_SETUP.md` и `docs/ADR-setup.md`."


