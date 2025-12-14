# Realtime Chat Revision — Summary

Краткое резюме внесённых изменений для восстановления и улучшения работы реалтайм-чата:

- Presence: перешли на per-connection модель, добавлен `connId`, хранение `connections/{userId}/{connId}` и агрегированный `status/{userId}`. `onDisconnect` используется для корректного удаления соединений.
- Provider: `FirebaseProvider` инициализирует PresenceManager и FCMManager после успешного логина; менеджеры доступны через контекст.
- Messaging: сообщения хранятся в `rooms/{roomId}/messages/{messageId}`; добавлены проверки структуры сообщений, ограничение длины текста, дедупликация и защита `createdAt == request.time` в правилах.
- Firestore rules: добавлены валидация ключей, ограничение размеров, rate-limiting через `rateLimits/{userId}` и правила для presence (`status`/`connections`).
- FCM: клиентская инициализация, сохранение токенов в `users/{userId}.fcmTokens`, background SW и Cloud Function для multicast-пушей.
- Tests: добавлены unit-тесты для presence и FCM; интеграционные тесты добавлены как заглушки, зависящие от конфигурации эмуляторов.
- Reliability: добавлены защиты от race conditions в `ChatService`, улучшенные отписки и безопасные обновления состояния.

Документы и тесты находятся в `docs/` и `tests/`. Для запуска интеграционных тестов убедитесь, что переменные эмулятора настроены в окружении или в `.env.local`.


