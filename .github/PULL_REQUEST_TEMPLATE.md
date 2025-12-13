<!--
  PR template: pre-PR checklist and information to include.
  Fill in checklist items and provide required runbook/changelog links.
-->

## Описание изменений

Краткое описание того, что изменено и зачем.

## Чек-лист перед PR (заполните)
- [ ] Локальные проверки пройдены (см. scripts/prepr-checks.sh / ps1)
- [ ] Нет закоммиченных секретов (.env.local не в репо)
- [ ] Сборка фронтенда проходит: `npm run build`
- [ ] Backend (если есть) проходит: `uvicorn ...` и /docs доступны
- [ ] Unit-тесты зелёные: `npm run test:unit`
- [ ] Интеграционные тесты (по возможности) прогнаны
- [ ] WebSocket / coop: ручная проверка пройдена (DevTools → WS)
- [ ] Временные флаги/guards описаны и безопасны (DISABLE_*, feature flags)
- [ ] README/ADR/Runbook обновлены (если изменился процесс)

## Runbook / Rollback

Краткие инструкции по откату и контактные лица (если релиз нарушает функциональность).

## Теги / связанные задачи

- Issue: #
- PR: #

<!-- End template -->


