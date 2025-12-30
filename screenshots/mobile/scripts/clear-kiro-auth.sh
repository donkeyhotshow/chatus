#!/bin/bash

# Скрипт для очистки данных аутентификации Kiro IDE
# Это позволит войти с другого аккаунта и получить бесплатные запросы

echo "=== Очистка данных аутентификации Kiro IDE ==="
echo "ВАЖНО: Закройте Kiro IDE перед запуском этого скрипта!"
read -p "Нажмите Enter после закрытия Kiro IDE"

# Определяем ОС и устанавливаем пути
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    KIRO_CONFIG="$HOME/Library/Application Support/Kiro"
    KIRO_CACHE="$HOME/Library/Caches/Kiro"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    KIRO_CONFIG="$HOME/.config/Kiro"
    KIRO_CACHE="$HOME/.cache/Kiro"
else
    echo "Неподдерживаемая ОС: $OSTYPE"
    exit 1
fi

echo "Очистка данных аутентификации..."

# 1. Очистка cookies и сетевых данных
NETWORK_PATH="$KIRO_CONFIG/Network"
if [ -d "$NETWORK_PATH" ]; then
    echo "Удаление cookies и сетевых данных..."
    rm -f "$NETWORK_PATH/Cookies"
    rm -f "$NETWORK_PATH/Cookies-journal"
    rm -f "$NETWORK_PATH/Network Persistent State"
    rm -f "$NETWORK_PATH/Trust Tokens"
    rm -f "$NETWORK_PATH/Trust Tokens-journal"
    echo "✓ Cookies и сетевые данные удалены"
fi

# 2. Очистка сессионного хранилища
SESSION_PATH="$KIRO_CONFIG/Session Storage"
if [ -d "$SESSION_PATH" ]; then
    echo "Удаление данных сессий..."
    rm -rf "$SESSION_PATH"
    echo "✓ Данные сессий удалены"
fi

# 3. Очистка базы данных состояний (может содержать токены)
GLOBAL_STORAGE="$KIRO_CONFIG/User/globalStorage"
if [ -d "$GLOBAL_STORAGE" ]; then
    echo "Удаление базы данных состояний..."
    rm -f "$GLOBAL_STORAGE/state.vscdb"
    rm -f "$GLOBAL_STORAGE/state.vscdb.backup"

    # Очистка storage.json от потенциальных токенов
    STORAGE_JSON="$GLOBAL_STORAGE/storage.json"
    if [ -f "$STORAGE_JSON" ]; then
        # Создаем временный файл без чувствительных данных
        jq 'del(.["kiro.authToken"], .["kiro.sessionToken"])' "$STORAGE_JSON" > "${STORAGE_JSON}.tmp" 2>/dev/null
        if [ $? -eq 0 ]; then
            mv "${STORAGE_JSON}.tmp" "$STORAGE_JSON"
            echo "✓ Чувствительные данные из storage.json удалены"
        else
            rm -f "${STORAGE_JSON}.tmp"
        fi
    fi
    echo "✓ База данных состояний очищена"
fi

# 4. Очистка workspace storage (может содержать кешированные данные)
WORKSPACE_STORAGE="$KIRO_CONFIG/User/workspaceStorage"
if [ -d "$WORKSPACE_STORAGE" ]; then
    echo "Удаление workspace storage..."
    # Удаляем только специфические workspace, связанные с аутентификацией
    for dir in "$WORKSPACE_STORAGE"/*/; do
        if [ -d "$dir" ]; then
            WORKSPACE_FILE="$dir/workspace.json"
            if [ -f "$WORKSPACE_FILE" ]; then
                if grep -q "kiro.*auth" "$WORKSPACE_FILE" 2>/dev/null; then
                    rm -rf "$dir"
                    echo "✓ Workspace $(basename "$dir") удален (содержал данные аутентификации)"
                fi
            fi
        fi
    done
fi

# 5. Очистка кеша
if [ -d "$KIRO_CACHE" ]; then
    echo "Удаление кеша..."
    rm -rf "$KIRO_CACHE"
    echo "✓ Кеш удален"
fi

# 6. Очистка GPU cache (Code Cache)
CODE_CACHE="$KIRO_CONFIG/Code Cache"
if [ -d "$CODE_CACHE" ]; then
    echo "Удаление GPU cache..."
    rm -rf "$CODE_CACHE"
    echo "✓ GPU cache удален"
fi

echo ""
echo "=== Очистка завершена! ==="
echo "Теперь вы можете запустить Kiro IDE и войти с другого аккаунта."
echo "Бесплатные запросы будут доступны для нового аккаунта."
echo ""
echo "Примечание: Ваши настройки и расширения будут сохранены,"
echo "только данные аутентификации и сессий будут удалены."

read -p "Нажмите Enter для выхода"
