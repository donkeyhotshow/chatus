# Implementation Plan: ChatUs Bug Fixes

## Приоритет 1: Критические баги (блокируют использование)

- [x] 1. Исправить недоступную кнопку "Войти" (NEW BUG-001)





  - [x] 1.1 Создать LoginButtonValidator в src/lib/login-validator.ts


    - Реализовать validateLoginInput() с проверкой минимум 2 символов
    - Реализовать shouldEnableLoginButton() для немедленного обновления состояния
    - _Requirements: 14.1, 14.2_
  - [x] 1.2 Написать property-based тест для валидации кнопки входа


    - **Property 14: Login Button State Validation**
    - **Validates: Requirements 14.1, 14.2**
  - [x] 1.3 Обновить ProfileCreationDialog.tsx


    - Интегрировать LoginButtonValidator
    - Добавить onChange обработчик с немедленной валидацией
    - Добавить fallback валидацию при ошибках
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 2. Checkpoint - Убедиться что все тесты проходят





  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Исправить краш при кириллице в поиске (BUG-003)






  - [x] 3.1 Создать SafeStringUtils в src/lib/safe-string.ts

    - Реализовать sanitizeCyrillicInput() для безопасной обработки Unicode
    - Реализовать escapeRegexSafe() для экранирования спецсимволов
    - Реализовать normalizeUnicode() для нормализации строк
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.2 Написать property-based тест для кириллицы

    - **Property 1: Cyrillic Input Safety**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 3.3 Обновить ChatSearch.tsx

    - Интегрировать SafeStringUtils в поисковую логику
    - Добавить try-catch с user-friendly сообщениями об ошибках
    - _Requirements: 1.1, 1.2, 1.3_


- [x] 4. Исправить неактивную кнопку в Safari (BUG-009)





  - [x] 4.1 Добавить Safari-специфичные workarounds в ChatRoom.tsx

    - Определить isSafari() функцию
    - Добавить setTimeout workaround для Safari
    - Добавить fallback для недоступных API
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Checkpoint - Убедиться что критические баги исправлены





  - Ensure all tests pass, ask the user if questions arise.

---

## Приоритет 2: Серьёзные баги (Major)

- [x] 6. Увеличить touch-таргеты на мобильных (NEW BUG-002, M-001)












  - [x] 6.1 Создать TouchTargetEnhancer в src/lib/touch-targets.ts

    - Определить MIN_TOUCH_TARGET_SIZE = 44px
    - Реализовать calculateTouchPadding()
    - Реализовать isMobileViewport()
    - _Requirements: 15.1, 15.2, 15.3_


  - [x] 6.2 Написать property-based тест для touch-таргетов


    - **Property 15: Touch Target Minimum Size**
    - **Validates: Requirements 15.1, 15.2, 15.3**
  - [x] 6.3 Обновить globals.css с мобильными стилями




    - Добавить media query для viewport < 768px
    - Установить min-height: 44px для всех интерактивных элементов
    - Добавить класс .touch-target с правильными размерами
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 7. Исправить реакции на чужие сообщения (BUG-002)






  - [x] 7.1 Создать ReactionValidator в src/lib/reaction-validator.ts

    - Реализовать canAddReaction() с проверкой владельца
    - Реализовать validateDoubleClick()
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.2 Написать property-based тест для реакций

    - **Property 2: Reaction Ownership Validation**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 7.3 Обновить MessageReactions.tsx и MessageItem.tsx

    - Интегрировать ReactionValidator
    - Добавить проверку isOwn перед добавлением реакции по двойному клику
    - _Requirements: 3.1, 3.2, 3.3_


- [x] 8. Сохранить стиль линии Canvas (BUG-004)






  - [x] 8.1 Создать CanvasStyleSerializer в src/lib/canvas-style.ts

    - Реализовать serializeStyle() для сохранения метаданных
    - Реализовать deserializeStyle() для восстановления стиля
    - Реализовать applyStyleToContext()
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 8.2 Написать property-based тест для round-trip стиля

    - **Property 3: Canvas Style Round-Trip**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  - [x] 8.3 Обновить SharedCanvas.tsx


    - Добавить styleMetadata в CanvasPath
    - Сохранять стиль при отправке в чат
    - Восстанавливать стиль при рендеринге
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 9. Исправить перекрытие клавиатурой на Android (BUG-008)






  - [x] 9.1 Улучшить ViewportManager в KeyboardAwareInput.tsx

    - Улучшить calculateViewportAdjustment() для Android
    - Добавить scrollInputIntoView() с учётом высоты клавиатуры
    - Добавить restoreViewport() для возврата к исходному состоянию
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 9.2 Написать property-based тест для viewport

    - **Property 4: Viewport Adjustment Round-Trip**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 10. Добавить вертикальный скролл на мобильных (M-002)






  - [x] 10.1 Обновить стили для мобильного скролла

    - Добавить overflow-y: auto для контентных контейнеров
    - Добавить -webkit-overflow-scrolling: touch для iOS
    - Убедиться что высота контейнеров ограничена
    - _Requirements: 17.1, 17.2, 17.3_

- [ ] 11. Checkpoint - Убедиться что серьёзные баги исправлены
  - Ensure all tests pass, ask the user if questions arise.

---

## Приоритет 3: Умеренные баги (Minor)

- [x] 12. Добавить валидацию длины имени (BUG-001)








  - [x] 12.1 Создать UsernameValidator в src/lib/username-validator.ts

    - Определить MAX_USERNAME_LENGTH = 20
    - Реализовать validateUsername() с предупреждением
    - Реализовать getRemainingChars() для счётчика
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 12.2 Написать property-based тесты для валидации имени


    - **Property 5: Username Length Validation**
    - **Property 6: Character Counter Accuracy**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  - [x] 12.3 Обновить ProfileCreationDialog.tsx


    - Добавить счётчик оставшихся символов
    - Показывать предупреждение при превышении лимита
    - Блокировать отправку при невалидном имени
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 13. Исправить анимацию игры "Кости" (BUG-005)





  - [x] 13.1 Создать AnimationQueue в src/lib/animation-queue.ts


    - Реализовать enqueue() с таймаутом 2000ms
    - Реализовать cancel() и clear()
    - Добавить onError callback для graceful degradation
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 13.2 Написать property-based тест для анимации


    - **Property 7: Animation Timing Guarantee**
    - **Validates: Requirements 7.1**
  - [x] 13.3 Обновить DiceRoll.tsx


    - Интегрировать AnimationQueue
    - Добавить обработку ошибок анимации
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 14. Исправить WebSocket для приглашений (BUG-007)






  - [x] 14.1 Создать WebSocketRetryController в src/lib/websocket-retry.ts

    - Реализовать connect() с retry логикой
    - Добавить exponential backoff (baseDelay * 2^attempt)
    - Ограничить maxRetries = 3
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 14.2 Написать property-based тест для retry

    - **Property 8: WebSocket Retry Exponential Backoff**
    - **Validates: Requirements 8.2**

---

## Приоритет 4: Косметические и системные баги

- [x] 15. Синхронизировать переключатель темы (BUG-006)





  - [x] 15.1 Создать ThemeSyncManager в src/lib/theme-sync.ts


    - Реализовать syncThemeState() для синхронизации toggle и темы
    - Реализовать loadThemeFromStorage() и saveThemeToStorage()
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 15.2 Написать property-based тест для синхронизации темы


    - **Property 9: Theme State Synchronization**
    - **Validates: Requirements 9.1, 9.2, 9.3**
  - [x] 15.3 Обновить ThemeToggle.tsx


    - Интегрировать ThemeSyncManager
    - Синхронизировать состояние при загрузке и изменении
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 16. Исправить ошибку undefined в чате (Console Error)






  - [x] 16.1 Добавить null-safety в MessageList.tsx

    - Инициализировать messages как пустой массив по умолчанию
    - Добавить проверку перед вызовом .map()
    - Использовать optional chaining
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 16.2 Написать property-based тест для null-safety

    - **Property 10: Null-Safe Message Handling**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 17. Добавить уникальные ключи в списке сообщений (Console Warning)

  - [x] 17.1 Обновить MessageList.tsx с уникальными ключами
    - Использовать message.id как ключ если доступен
    - Генерировать стабильный уникальный ID если id отсутствует
    - _Requirements: 11.1, 11.2, 11.3_
  - [x] 17.2 Написать property-based тест для уникальности ключей

    - **Property 11: Unique Key Generation**
    - **Validates: Requirements 11.1, 11.2, 11.3**

- [ ] 18. Checkpoint - Убедиться что все баги исправлены
  - Ensure all tests pass, ask the user if questions arise.

---

## Приоритет 5: Доступность и SEO

- [ ] 19. Улучшить доступность (Accessibility)
  - [ ] 19.1 Добавить ARIA-метки к интерактивным элементам
    - Добавить aria-label к кнопкам без текста
    - Добавить aria-describedby для форм
    - _Requirements: 12.1_
  - [ ] 19.2 Написать property-based тест для ARIA
    - **Property 12: ARIA Label Completeness**
    - **Validates: Requirements 12.1**
  - [ ] 19.3 Улучшить контрастность текста
    - Проверить и исправить цвета с низкой контрастностью
    - Обеспечить минимум 4.5:1 для обычного текста
    - _Requirements: 12.2_
  - [ ] 19.4 Добавить видимые индикаторы фокуса
    - Добавить :focus-visible стили
    - _Requirements: 12.3_

- [ ] 20. Улучшить SEO
  - [ ] 20.1 Добавить мета-теги в layout.tsx
    - Добавить description и keywords
    - _Requirements: 13.1_
  - [ ] 20.2 Проверить семантику заголовков
    - Убедиться в правильной иерархии h1-h6
    - _Requirements: 13.2_
  - [ ] 20.3 Добавить alt атрибуты к изображениям
    - Проверить все img теги
    - _Requirements: 13.3_
  - [ ] 20.4 Написать property-based тест для alt атрибутов
    - **Property 13: Image Alt Attribute Presence**
    - **Validates: Requirements 13.3**

---

## Приоритет 6: Производительность

- [x] 21. Оптимизировать время загрузки (NEW BUG-003)






  - [x] 21.1 Настроить code splitting в next.config.js

    - Добавить splitChunks конфигурацию
    - Ограничить maxSize бандлов
    - _Requirements: 16.2_

  - [x] 21.2 Добавить lazy loading для тяжёлых компонентов

    - Использовать dynamic() для CollaborationSpace
    - Использовать dynamic() для игровых компонентов
    - _Requirements: 16.3_

  - [x] 21.3 Оптимизировать изображения

    - Настроить форматы AVIF/WebP в next.config.js
    - Добавить lazy loading для изображений
    - _Requirements: 16.4_

  - [x] 21.4 Написать тест для времени загрузки

    - **Property 16: Page Load Time**
    - **Validates: Requirements 16.1**

- [ ] 22. Final Checkpoint - Убедиться что все тесты проходят
  - Ensure all tests pass, ask the user if questions arise.
