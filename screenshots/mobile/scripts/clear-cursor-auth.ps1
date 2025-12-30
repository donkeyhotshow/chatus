# Скрипт для очистки данных аутентификации Kiro IDE
# Это позволит войти с другого аккаунта и получить бесплатные запросы

Write-Host "=== Очистка данных аутентификации Kiro IDE ===" -ForegroundColor Yellow
Write-Host "ВАЖНО: Закройте Kiro IDE перед запуском этого скрипта!" -ForegroundColor Red
$confirmation = Read-Host "Вы уверены что хотите очистить данные аутентификации? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Операция отменена." -ForegroundColor Yellow
    exit
}

# Пути к папкам Kiro
$kiroRoaming = "$env:APPDATA\Kiro"
$kiroLocal = "$env:LOCALAPPDATA\Kiro"

Write-Host "Очистка данных аутентификации..." -ForegroundColor Green

# 1. Очистка cookies и сетевых данных
$networkPath = "$kiroRoaming\Network"
if (Test-Path $networkPath) {
    Write-Host "Удаление cookies и сетевых данных..." -ForegroundColor Cyan
    Remove-Item "$networkPath\Cookies" -ErrorAction SilentlyContinue
    Remove-Item "$networkPath\Cookies-journal" -ErrorAction SilentlyContinue
    Remove-Item "$networkPath\Network Persistent State" -ErrorAction SilentlyContinue
    Remove-Item "$networkPath\Trust Tokens" -ErrorAction SilentlyContinue
    Remove-Item "$networkPath\Trust Tokens-journal" -ErrorAction SilentlyContinue
    Write-Host "Cookies и сетевые данные удалены" -ForegroundColor Green
}

# 2. Очистка сессионного хранилища
$sessionPath = "$kiroRoaming\Session Storage"
if (Test-Path $sessionPath) {
    Write-Host "Удаление данных сессий..." -ForegroundColor Cyan
    Remove-Item $sessionPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Данные сессий удалены" -ForegroundColor Green
}

# 3. Очистка базы данных состояний (может содержать токены)
$globalStoragePath = "$kiroRoaming\User\globalStorage"
if (Test-Path $globalStoragePath) {
    Write-Host "Удаление базы данных состояний..." -ForegroundColor Cyan
    Remove-Item "$globalStoragePath\state.vscdb" -ErrorAction SilentlyContinue
    Remove-Item "$globalStoragePath\state.vscdb.backup" -ErrorAction SilentlyContinue
    # Очистка storage.json от потенциальных токенов
    $storageJson = "$globalStoragePath\storage.json"
    if (Test-Path $storageJson) {
        try {
            $content = Get-Content $storageJson -Raw | ConvertFrom-Json
            # Удаляем потенциально чувствительные данные
            if ($content.PSObject.Properties.Name -contains 'kiro.authToken') {
                $content.PSObject.Properties.Remove('kiro.authToken')
            }
            if ($content.PSObject.Properties.Name -contains 'kiro.sessionToken') {
                $content.PSObject.Properties.Remove('kiro.sessionToken')
            }
            $content | ConvertTo-Json -Depth 10 | Set-Content $storageJson
            Write-Host "Чувствительные данные из storage.json удалены" -ForegroundColor Green
        } catch {
            Write-Host "Не удалось обработать storage.json" -ForegroundColor Yellow
        }
    }
    Write-Host "База данных состояний очищена" -ForegroundColor Green
}

# 4. Очистка workspace storage (может содержать кешированные данные)
$workspaceStoragePath = "$kiroRoaming\User\workspaceStorage"
if (Test-Path $workspaceStoragePath) {
    Write-Host "Удаление workspace storage..." -ForegroundColor Cyan
    # Удаляем только специфические workspace, связанные с аутентификацией
    Get-ChildItem $workspaceStoragePath -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $workspaceFile = "$($_.FullName)\workspace.json"
        if (Test-Path $workspaceFile) {
            try {
                $workspaceData = Get-Content $workspaceFile -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($workspaceData -and $workspaceData.PSObject.Properties.Name -contains 'configuration' -and
                    $workspaceData.configuration -like "*kiro*auth*") {
                    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
                    Write-Host "Workspace $($_.Name) удален (содержал данные аутентификации)" -ForegroundColor Green
                }
            } catch {
                # Игнорируем ошибки парсинга
            }
        }
    }
}

# 5. Очистка локальных данных (если существуют)
if (Test-Path $kiroLocal) {
    Write-Host "Удаление локальных данных..." -ForegroundColor Cyan
    Remove-Item $kiroLocal -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Локальные данные удалены" -ForegroundColor Green
}

# 6. Очистка кеша и временных файлов
$cachePath = "$kiroRoaming\Cache"
if (Test-Path $cachePath) {
    Write-Host "Удаление кеша..." -ForegroundColor Cyan
    Remove-Item $cachePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Кеш удален" -ForegroundColor Green
}

# 7. Очистка Code Cache (GPU cache)
$codeCachePath = "$kiroRoaming\Code Cache"
if (Test-Path $codeCachePath) {
    Write-Host "Удаление GPU cache..." -ForegroundColor Cyan
    Remove-Item $codeCachePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "GPU cache удален" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Очистка завершена! ===" -ForegroundColor Green
Write-Host "Теперь вы можете запустить Kiro IDE и войти с другого аккаунта." -ForegroundColor White
Write-Host "Бесплатные запросы будут доступны для нового аккаунта." -ForegroundColor White
Write-Host ""
Write-Host "Примечание: Ваши настройки и расширения будут сохранены," -ForegroundColor Yellow
Write-Host "только данные аутентификации и сессий будут удалены." -ForegroundColor Yellow

Read-Host "Нажмите Enter для выхода"
