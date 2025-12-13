# Настройка тестирования

## Установка зависимостей

Для запуска тестов необходимо установить дополнительные зависимости:

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @vitejs/plugin-react \
  jsdom
```

## Обновление package.json

После установки зависимости будут добавлены в `devDependencies`:

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitejs/plugin-react": "^4.2.0",
    "jsdom": "^23.0.0"
  }
}
```

## Проверка установки

После установки зависимостей проверьте, что тесты запускаются:

```bash
npm run test:unit
```

## Примечания

- Тесты для хуков (`useRoomManager.test.ts`) могут работать без дополнительных зависимостей, но для полной функциональности рекомендуется установить все зависимости
- Тесты для сервисов (`ChatService.*.test.ts`) работают с текущей конфигурацией
- Для тестирования React компонентов обязательно нужны `@testing-library/react` и `jsdom`

