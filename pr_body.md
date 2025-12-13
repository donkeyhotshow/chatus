# Краткое описание

Добавлены скрипты pre-flight проверки и GitHub Actions workflow для автоматической проверки окружения, секретов и сборки перед мержем.



# Что сделано

- scripts/prepr-checks.sh / .ps1  проверка окружения, портов, .env.local, установка зависимостей, сборка; генерируется prepr-report.json.

- scripts/check-secrets.sh / .ps1  проверка на коммит секретов.

- .github/workflows/prepr-checks.yml  запускает prepr-checks на PR, завершает job с ошибкой, если overall_status !== PASS.

- README/ADR/ENV примеры обновлены с инструкциями по prepr-checks.



# Pre-flight чек-лист (для PR)

- [ ] Локально выполнено: bash scripts/prepr-checks.sh --fix

- [ ] Локально выполнено: bash scripts/prepr-checks.sh, prepr-report.json показывает "overall_status":"PASS"

- [ ] Локально проверено: npm run lint и npx tsc --noEmit  ошибок нет

- [ ] Скрипты .sh и .ps1 протестированы на Linux/Windows

- [ ] GitHub workflow запущен, артефакт prepr-report.json доступен

- [ ] Временные флаги/guards документированы

- [ ] README/ADR обновлены с инструкциями



# Runbook / Инструкции для мержера

- Workflow prepr-checks должен пройти на CI перед мержем.

- В случае падения job  проверить prepr-report.json, исправить ошибки локально и повторно запушить.

- В PR комментариях можно ссылаться на prepr-report артефакт.



# Ссылки / Артефакты

- prepr-report.json (CI job artifact)

- Скрипты: scripts/prepr-checks.*, scripts/check-secrets.*

- ADR: docs/ADR-setup.md

