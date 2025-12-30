#!/usr/bin/env bash
set -euo pipefail

echo "=== ChatUs: Локальная подготовка окружения (POSIX) ==="

echo ""
echo "1) Проверка окружения"

# Node.js
REQUIRED_NODE=20
NODE_VERSION=$(node -v 2>/dev/null || echo "0")
NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')

if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE" ]; then
  echo "⚠ Node.js версия $NODE_VERSION < $REQUIRED_NODE. Обновите Node.js!"
else
  echo "✅ Node.js версия $NODE_VERSION подходит"
fi

# npm
if ! command -v npm &> /dev/null; then
  echo "⚠ npm не найден"
else
  echo "✅ npm найден: $(npm -v)"
fi

# Python
REQUIRED_PYTHON=3.11
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' || echo "0")
PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || { [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 11 ]; }; then
  echo "⚠ Python версия $PYTHON_VERSION < $REQUIRED_PYTHON. Обновите Python!"
else
  echo "✅ Python версия $PYTHON_VERSION подходит"
fi

echo "=== Проверка завершена ==="

echo ""
echo "Проверка занятых портов (3000, 8000)"
if command -v lsof >/dev/null 2>&1; then
  lsof -i :3000 || echo "порт 3000 свободен (или lsof не показал процессов)"
  lsof -i :8000 || echo "порт 8000 свободен (или lsof не показал процессов)"
else
  echo "lsof не найден — проверьте порты вручную: e.g. 'ss -ltnp | grep :3000' или 'netstat -ano | findstr :3000' (Windows)"
fi
echo ""
echo "2) Очистка артефактов (если есть)"
rm -rf node_modules/ .next/ dist/ .venv/ || true
echo "Удалено: node_modules/ .next/ dist/ .venv/ (если существовали)"

echo ""
echo "3) Установка npm-зависимостей"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

if [ -d functions ]; then
  echo "Установка зависимостей в functions/"
  (cd functions && if [ -f package-lock.json ]; then npm ci; else npm install; fi)
fi

echo ""
echo "4) Настройка .env.local (создаёт .env.local только если файла нет)"
if [ ! -f .env.local ]; then
  echo ".env.local не найден. Хотите создать интерактивно? (Y/n)"
  read -r CREATE_ENV
  CREATE_ENV=${CREATE_ENV:-Y}
  if [[ "$CREATE_ENV" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    # helper to prompt with default
    prompt() {
      local name=$1; local def=$2; local hidden=${3:-false}
      if [ "$hidden" = "true" ]; then
        read -r -s -p "$name (ввод скрыт): " val; echo
      else
        read -r -p "$name [$def]: " val
      fi
      if [ -z "$val" ]; then
        echo "$def"
      else
        echo "$val"
      fi
    }

    # gather values
    WS_HOST=$(prompt "NEXT_PUBLIC_WS_HOST" "ws://localhost:3001")
    # simple validation for ws/http
    if ! echo "$WS_HOST" | grep -Eq '^ws://|^wss://'; then
      echo "Предупреждение: NEXT_PUBLIC_WS_HOST не выглядит как ws:// или wss://"
    fi

    API_URL=$(prompt "NEXT_PUBLIC_API_URL" "http://localhost:8000")
    if ! echo "$API_URL" | grep -Eq '^https?://'; then
      echo "Предупреждение: NEXT_PUBLIC_API_URL не выглядит как http:// или https://"
    fi

    FIREBASE_API_KEY=$(prompt "FIREBASE_API_KEY" "")
    FIREBASE_AUTH_DOMAIN=$(prompt "FIREBASE_AUTH_DOMAIN" "")
    FIREBASE_PROJECT_ID=$(prompt "FIREBASE_PROJECT_ID" "")
    FIREBASE_STORAGE_BUCKET=$(prompt "FIREBASE_STORAGE_BUCKET" "")
    FIREBASE_MESSAGING_SENDER_ID=$(prompt "FIREBASE_MESSAGING_SENDER_ID" "")
    FIREBASE_APP_ID=$(prompt "FIREBASE_APP_ID" "")

    # confirm
    echo "Будет создан .env.local со следующими значениями (секреты не отображаются полностью):"
    echo "NEXT_PUBLIC_WS_HOST=$WS_HOST"
    echo "NEXT_PUBLIC_API_URL=$API_URL"
    echo "FIREBASE_API_KEY=$( [ -n \"$FIREBASE_API_KEY\" ] && echo \"****(set)\" || echo \"(empty)\")"
    read -r -p "Подтвердить запись в .env.local? (Y/n) " CONFIRM
    CONFIRM=${CONFIRM:-Y}
    if [[ "$CONFIRM" =~ ^([yY][eE][sS]|[yY])$ ]]; then
      cat > .env.local <<EOL
NEXT_PUBLIC_WS_HOST=$WS_HOST
NEXT_PUBLIC_API_URL=$API_URL
FIREBASE_API_KEY=$FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID=$FIREBASE_APP_ID
EOL
      chmod 600 .env.local || true
      echo ".env.local создан. НЕ коммитьте этот файл в репозиторий."
    else
      echo "Отменено. .env.local не создан."
    fi
  else
    if [ -f .env.local.example ]; then
      cp .env.local.example .env.local
      echo ".env.local создан на основе .env.local.example — заполните реальные секреты."
    else
      cat > .env.local <<EOL
NEXT_PUBLIC_WS_HOST=ws://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:8000
FIREBASE_API_KEY=placeholder
FIREBASE_AUTH_DOMAIN=placeholder
FIREBASE_PROJECT_ID=placeholder
FIREBASE_STORAGE_BUCKET=placeholder
FIREBASE_MESSAGING_SENDER_ID=placeholder
FIREBASE_APP_ID=placeholder
EOL
      echo ".env.local создан с placeholder-значениями."
    fi
  fi
else
  echo ".env.local уже существует — пропуск."
fi

echo ""
echo "5) Запуск фронтенда (локально)"
echo "5) Сборка (опционально) и запуск фронтенда"
if [ -f package.json ] && grep -q \"build\" package.json 2>/dev/null; then
  echo "Сборка фронтенда: npm run build"
  npm run build || echo "Сборка завершилась с ошибкой — проверьте логи."
else
  echo "Скрипт build не найден в package.json — пропускаем сборку."
fi
echo "Запустите в отдельном терминале: npm run dev (порт по умолчанию: 3000)"

echo ""
echo "6) (Опционально) Запуск backend (FastAPI)"
if [ -f requirements.txt ]; then
  echo "Создаём venv .venv и устанавливаем зависимости (если требуется)"
  python -m venv .venv
  echo "Активируйте виртуальное окружение: source .venv/bin/activate"
  echo "Далее: pip install -r requirements.txt && uvicorn server_coop_puzzle:app --reload --port 8000"
else
  echo "requirements.txt не найден — пропускаем шаг backend."
fi

echo ""
echo "7) WebSocket & Coop-сценарии — ручная проверка"
echo "Откройте соответствующие HTML (public/coop/*.html) и проверьте WS в DevTools → Network → WS."

echo ""
echo "8) Тесты"
if grep -q \"test:unit\" package.json 2>/dev/null; then
  echo "Запуск unit-тестов: npm run test:unit"
else
  echo "Скрипт test:unit не найден в package.json — запустите тесты вручную."
fi

echo ""
echo "Скрипт завершён. Проверьте `README_SETUP.md` и `docs/ADR-setup.md` для деталей."


