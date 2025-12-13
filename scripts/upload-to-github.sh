#!/bin/bash

# Bash скрипт для автоматической загрузки ChatForUs на GitHub
# Дайте права на выполнение: chmod +x upload-to-github.sh

echo "🚀 Начинаем загрузку ChatForUs на GitHub..."

# Проверяем наличие GH_TOKEN
if [ -z "$GH_TOKEN" ]; then
    echo "❌ Ошибка: Переменная окружения GH_TOKEN не установлена!"
    echo "Создайте Personal Access Token на https://github.com/settings/tokens"
    echo "Затем выполните: export GH_TOKEN=ваш_токен"
    exit 1
fi

# Проверяем наличие GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI не установлен. Установите с https://cli.github.com/"
    exit 1
fi

# Создаем репозиторий
echo "📦 Создаем репозиторий ChatForUs..."
if gh repo create ChatForUs \
    --public \
    --description "A real-time chat application with collaborative features - Next.js, Firebase, multiplayer games" \
    --source . \
    --remote origin \
    --push; then

    echo "✅ Репозиторий создан и код загружен!"
    echo "🔗 Проверьте: https://github.com/$(gh auth status | grep "Logged in to github.com as" | cut -d' ' -f6)/ChatForUs"

    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Перейдите в Settings > Secrets and variables > Actions"
    echo "2. Добавьте секреты: FIREBASE_TOKEN, FIREBASE_PROJECT_ID, VERCEL_TOKEN и др."
    echo "3. Первый push запустит CI/CD pipeline"
else
    echo "❌ Ошибка создания репозитория"
    exit 1
fi


