# Консолидация инструкций по деплою — ChatForUs

Этот файл объединяет ключевые инструкции из `DEPLOY_*` документов и служит единой точкой правды для деплоя.

Коротко:
- Подготовить `.env.local` (см. `FIREBASE_ENV_SETUP.md`) с реальными значениями Firebase.
- Удалить все секреты из репозитория; использовать GitHub Secrets и Vercel Secrets.
- CI: GitHub Actions → собирает, запускает тесты и деплоит на Vercel; Firebase rules разворачиваются через `firebase deploy`.

Этапы (рекомендуемый поток — Vercel + Firebase через GitHub Actions):
1. Подготовка репозитория
   - Удалить артефакты (`node_modules/`, `.next/`, `.vercel/`, `.firebase/`) из репо (см. `scripts/cleanup.*`).
   - Поместить скрипты в `scripts/` и документацию в `docs/`.
2. Создать ветку `chore/consolidate-and-audit` и добавить изменения (без удаления секретов из истории в этом PR).
3. Настроить Secrets в GitHub:
   - `VERCEL_TOKEN`, `FIREBASE_SERVICE_ACCOUNT` (в виде JSON), `FIREBASE_PROJECT_ID`, `GH_TOKEN` (если нужен автоматический upload).
4. Открыть PR, прогон CI, исправить тесты/типизацию.
5. После ревью и слияния — вручную запустить первый деплой (или CI сделает это автоматически).

Команды:
```bash
# Удаление артефактов локально (альтернативы в scripts/)
rm -rf node_modules .next .vercel .firebase

# Проверить устаревшие зависимости
npm outdated

# Обновить minor + patch (рекомендуется)
npx npm-check-updates -t minor
npm install

# Проверки
npm run typecheck
npm run test:unit
```

Риски:
- Авто-обновление major-зависимостей может привести к регрессиям. Выполняйте major-обновления в отдельном PR с полным тестовым прогоном.

Сохраните это как основу; более подробная информация в `docs/DEPENDENCY_UPDATE_PLAN.md` и `docs/SECRETS_HANDLING.md`.


