#!/bin/bash

# Bash скрипт для настройки GitHub секретов
# Дайте права на выполнение: chmod +x setup-github-secrets.sh

echo "🔐 Настройка GitHub секретов для Firebase и Vercel..."

# Проверяем GH_TOKEN
if [ -z "$GH_TOKEN" ]; then
    echo "❌ Ошибка: GH_TOKEN не установлен!"
    echo "Выполните: export GH_TOKEN=ваш_github_token"
    exit 1
fi

# Проверяем gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI не установлен"
    exit 1
fi

# Получаем репозиторий
REPO=$(gh repo list --json name --jq '.[0].name' 2>/dev/null)
if [ -z "$REPO" ]; then
    echo "❌ Репозиторий не найден. Сначала загрузите проект на GitHub."
    exit 1
fi

echo "📦 Найден репозиторий: $REPO"

echo "🔑 Настройка секретов..."
echo ""

# Firebase секреты
read -p "Firebase Project ID (studio-5170287541-f2fb7): " firebase_project_id
if [ -n "$firebase_project_id" ]; then
    echo "$firebase_project_id" | gh secret set FIREBASE_PROJECT_ID -R "$REPO"
    echo "✅ FIREBASE_PROJECT_ID установлен"
fi

read -p "Firebase Token (получите в Firebase Console > Settings > Service accounts): " firebase_token
if [ -n "$firebase_token" ]; then
    echo "$firebase_token" | gh secret set FIREBASE_TOKEN -R "$REPO"
    echo "✅ FIREBASE_TOKEN установлен"
fi

# Vercel секреты
read -p "Vercel Token (получите в Vercel Dashboard > Account Settings > Tokens): " vercel_token
if [ -n "$vercel_token" ]; then
    echo "$vercel_token" | gh secret set VERCEL_TOKEN -R "$REPO"
    echo "✅ VERCEL_TOKEN установлен"
fi

read -p "Vercel Org ID (asdas' projects): " vercel_org_id
if [ -n "$vercel_org_id" ]; then
    echo "$vercel_org_id" | gh secret set VERCEL_ORG_ID -R "$REPO"
    echo "✅ VERCEL_ORG_ID установлен"
fi

read -p "Vercel Project ID (prj_jMEdSQ7nEXvMDow8wTUN405EvRxA): " vercel_project_id
if [ -n "$vercel_project_id" ]; then
    echo "$vercel_project_id" | gh secret set VERCEL_PROJECT_ID -R "$REPO"
    echo "✅ VERCEL_PROJECT_ID установлен"
fi

echo ""
echo "🎉 Все секреты настроены!"
echo "🚀 Следующий push в main ветку запустит автоматический деплой"
