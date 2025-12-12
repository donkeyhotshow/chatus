# План обновления зависимостей

Цель: аккуратно обновить зависимости проекта, минимизируя регрессии.

Подход (рекомендация): обновлять сначала только patch/minor версии; major — отдельно.

Шаги:
1. Создать ветку:
```bash
git checkout -b chore/deps-minor-patch
```
2. Просмотреть устаревшие пакеты:
```bash
npm outdated
```
3. Обновить только minor + patch (сохранить фиксированные версии в package.json):
```bash
npx npm-check-updates -t minor
npm install
```
4. Запустить проверки:
```bash
npm run typecheck
npm run test:unit
npm run build
```
5. Исправления:
- Исправлять только тривиальные ошибки (типизация/импорты). Для больших исправлений создайте отдельные PR.

Major-обновления:
- Выполнять в отдельной ветке `chore/deps-major`, предварительно прочитав changelogs для `next`, `react`, `typescript`, `tailwindcss`.
- План тестирования для major-PR: full unit + e2e/CI прогон, ручная smoke-проверка.

Автоматизация:
- Можно использовать `dependabot` для pull request-ов по безопасности и патчам.


