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

- [x] 3. Исправить краш при кириллице в поиске (BUG-003)
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
    -rements: 1.1, 1.2, 1.3_

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
  - **Property2: Reaction OwnershipValidation**
    - **Validates: Requirements 3.1,3.2**
  - [x] 7.3 Обновить MessageReactions.tsx и MessageItem.tsx
    - Интегрировать ReactionValidator
    - Добавить проверку isOwn перед добавлением реакции по двойному клику
    - _Requirements: 3.1,3.2, 3.3_

- [x] 8. Сохранить стиль линии Canvas (BUG-004)
  - [x] 8.1 Создать CanvasStyleSerializer в src/lib/canvas-style.ts
    - Реализовать serializeStyle() для сохранения метаданных
    - Реализовать deserializeStyle() для восстановления стиля
    - Реализовать applyStyleToContext()
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 8.2 Написать property-based тест дляround-trip стиля
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
    -Добавить scrollInputIntoView() с учётом высоты клавиатуры
    - Добавить restoreViewport() для возврата к исходному состоянию
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 9.2 Написать property-based тест для viewport
    - **Property 4: Viewport Adjustment Round-Trip**
*Validates: Requirements 5.1, 5.2, 5.3**

- [x] 10. Добавить вертикальный скролл на мобильных (M-002)
  - [x] 10.1 Обновить стили для мобильного скролла
    - Добавить overflow-y: auto для контентных контейнеров
    - Добавить -webkit-overflow-scrolling: touchдля iOS
    - Убедиться что высота контейнеров ограничена
    - _Requirements: 17.1, 17.2, 17.3_

---

## Приоритет 2.1: P1 баги (ВАЖНЫЕ - сильный UX/Mobile удар)

- [x] 11. Исправить мобильный ввод на iOS (P1-MOBILE-001)





  - [x] 11.1 Создать iOSViewportManager в src/lib/ios-viewport-manager.ts


    -Реализовать setupVisualViewportListener() для отслеживания изменений viewport
    - Реализовать adjustLayoutForKeyboard() для корректировки layout при открытии клавиатуры
    - Реализовать ensureSendButtonVisible() длягарантии видимости кнопки отправки
    - Реализовать restoreLayoutOnKeyboardClose() для восстановления layout
    - _Requirements: 18.1, 18.2, 18.3_
  - [x] 11.2 Обновить ChatInput.tsx для iOS


    - Интегрировать iOSViewportManager
    - Добавить обработчики focus/blur для управления viewport
- Использовать Visual Viewport API вместо window.innerHeight
    - _Requirements: 18.1, 18.2, 18.3_

- [x] 12. Стабилизировать Canvas (P1-CANVAS-001)


















  - [x] 12.1 Создать CanvasStabilizer в src/lib/canvas-stabilizer.ts


    -Реализовать initCanvasStabilizer() для инициализации состояния
    - Реализовать processDrawEvent() с буферизацией точек
    - Реализовать flushPendingPoints() с использованием requestAnimationFrame
    - Реализовать captureCanvasImage() для надёжного захвата изображения
    - Реализовать cleanupCanvasResources() для очистки памяти
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

  - [x] 12.2 Обновить SharedCanvas.tsx

    - Интегрировать CanvasStabilizer
    - Заменить прямую отрисовку на rAF-based rendering
    - Добавить throttling для событий рисования
    -Исправить Send to Chatдля надёжной передачи изображения
    - Добавить cleanup при unmount компонента
    - _Requirements: 19.1, 19.2, 19.3, 19.4_



- [-] 13. Исправить навигацию назад (P1-NAV-001)


  - [x] 13.1 Создать NavigationStateManager в src/lib/navigation-state.ts

    - Реализовать pushNavigationState() для добавления состояния в history
    - Реализовать handlePopState() для обработки кнопки "Назад"
    - Реализовать restoreStateFromHistory() для восстановления состояния
    - Реализовать setupHistoryListener() для подписки на изменения
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [x] 13.2 Интегрировать NavigationStateManager в приложение

    - Обновить ChatRoom.tsx для работы с History API
    - Обновить переходы между комнатами, играми и canvas
    - Предотвратить полную перезагрузку страницы при навигации назад
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [x] 14. Исправить зависание при поиске (P1-SEARCH-001)






  - [x] 14.1 Создать SearchDebouncer в src/lib/search-debouncer.ts

    - Реализовать createSearchDebouncer() сdebounce 300ms
    - Реализовать cancelPendingSearch() для отмены предыдущих запросов
    - Реализовать isSearchStale() для проверки актуальности результатов
    - Использовать AbortController для отмены fetch запросов
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

  - [x] 14.2 Обновить ChatSearch.tsx

    - Интегрировать SearchDebouncer
    - Добавить отмену предыдущих запросов при новом вводе
    - Добавить async safety для предотвращения race conditions
    - Добавить graceful error recovery
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

- [ ] 15. Checkpoint - Убедиться что P1 баги исправлены
  - Ensure all tests pass, ask the user if questions arise.

---

## Приоритет 2.2: P2 UX улучшения


- [x] 16. Переименовать кнопку "Войти" (P2-UX-001)

  - [x] 16.1 Обновить ProfileCreationDialog.tsx

    - Заменить текст кнопки "Войти" на "Присоединиться"
    - Добавить tooltip с пояснением действия
    - _Requirements: 22.1, 22.2_

- [ ] 17. Добавить валидацию имени с кириллицей (P2-VALIDATION-001)
  - [ ] 17.1 Обновить UsernameValidator в src/lib/username-validator.ts
    - Добавить поддержку кириллических символов в regex
    - Добавить явные правила валидации (2-20 символов, латиница или кириллица)
    - Добавить специфичные сообщения об ошибках
    - _Requirements: 23.1, 23.2, 23.3, 23.4_
  - [ ] 17.2 Обновить ProfileCreationDialog.tsx
    - Показывать явные правила валидации под полем ввода
    - Показывать специфичные ошибки при невалидном вводе
    - _Requirements: 23.2, 23.3_

- [-] 18. Добавить индикацию контекста (P2-CONTEXT-001)


  - [x] 18.1 Создать ContextIndicator в src/lib/context-indicator.ts










    - Реализовать buildBreadcrumb() для построения навигационной цепочки
    - Реализовать getContextTitle() для получения заголовка
    - Реализовать getContextIcon() для иконки контекста
    - _Requirements: 24.1, 24.2, 24.3, 24.4_
  - [x] 18.2 Создать компонент Breadcrumb








    - Создать src/components/ui/Breadcrumb.tsx
    - Отображать текущий путь: Комната > Игра / Canvas
    - Обновлять при изменении контекста
    - _Requirements: 24.1, 24.2, 24.3, 24.4_
  - [x] 18.3 Интегрировать Breadcrumb в header

    - Добавить Breadcrumb в ChatRoom.tsx
    - Добавить Breadcrumb в игровые компоненты
    - Добавить Breadcrumb в SharedCanvas.tsx
    - _Requirements: 24.1, 24.2, 24.3, 24.4_

- [x] 19. Добавить явный выход из состояний (P2-EXIT-001)
  - [x] 19.1 Создать ExitConfirmationManager в src/lib/exit-confirmation.ts
    - Реализовать shouldShowExitConfirmation() для проверки несохранённых изменений
    - Реализовать getExitConfirmationMessage() для текста подтверждения
    - Реализовать handleExitRequest() для обработки выхода
    - _Requirements: 25.1, 25.2, 25.3, 25.4_
  - [x] 19.2 Создать компонент ExitButton
    - Создать src/components/ui/ExitButton.tsx
    - Добавить видимую кнопку "Выход" с иконкой
    - Добавить диалог подтверждения при несохранённых изменениях
    - _Requirements: 25.1, 25.2, 25.3, 25.4_
  - [ ] 19.3 Интегрировать ExitButton
    - Добавить ExitButton в игровые компоненты
    - Добавить ExitButton в SharedCanvas.tsx
    - Добавить ExitButton в ChatRoom.tsx для выхода из комнаты
    - _Requirements: 25.1, 25.2, 25.3, 25.4_

- [ ] 20. Checkpoint - Убедиться что P2 баги исправлены
  - Ensure all tests pass, ask the user if questions arise.

---

## Приоритет 3: Умеренные баги (Minor)

- [x] 21. Добавить валидацию длины имени (BUG-001)
  - [x] 21.1 Создать UsernameValidator в src/lib/username-validator.ts
    - Определить MAX_USERNAME_LENGTH = 20
    - Реализовать validateUsername() с предупреждением
    - Реализовать getRemainingChars() для счётчика
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 21.2 Написать property-based тесты для валидации имени
    - **Property 5: Username Length Validation**
    - **Property 6: Character Counter Accuracy**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  - [x] 21.3 Обновить ProfileCreationDialog.tsx
    - Добавить счётчик оставшихся символов
    - Показывать предупреждение при превышении лимита
    - Блокировать отправку при невалидном имени
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 22. Исправить анимацию игры "Кости" (BUG-005)
  - [x] 22.1 Создать AnimationQueue в src/lib/animation-queue.ts
    - Реализовать enqueue() с таймаутом 2000ms
    - Реализовать cancel() и clear()
    - Добавить onError callback для graceful degradation
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 22.2 Написать property-based тест для анимации
    - **Property 7: Animation Timing Guarantee**
    - **Validates: Requirements 7.1**
  - [x] 22.3 Обновить DiceRoll.tsx
    - Интегрировать AnimationQueue
    - Добавить обработку ошибок анимации
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 23. Исправить WebSocket для приглашений (BUG-007)
  - [x] 23.1 Создать WebSocketRetryController в src/lib/websocket-retry.ts
    - Реализовать connect() с retry логикой
    - Добавить exponential backoff (baseDelay * 2^attempt)
    - Ограничить maxRetries = 3
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 23.2 Написать property-based тест для retry
    - **Property 8: WebSocket Retry Exponential Backoff**






    - **Validates: Requirements 8.2**

---

## Приоритет 4: Косметические и системные баги

- [x] 24. Синхронизировать переключатель темы (BUG-006)
  - [x] 24.1 Создать ThemeSyncManager в src/lib/theme-sync.ts
    - Реализовать syncThemeState() для синхронизации toggle и темы
    - Реализовать loadThemeFromStorage() и saveThemeToStorage()
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 24.2 Написать property-based тест для синхронизации темы
    - **Property 9: Theme State Synchronization**
    - **Validates: Requirements 9.1, 9.2, 9.3**
  - [x] 24.3 Обновить ThemeToggle.tsx
    - Интегрировать ThemeSyncManager
    - Синхронизировать состояние при загрузке и изменении
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 25. Исправить ошибку undefined в чате (Console Error)
  - [x] 25.1 Добавить null-safety в MessageList.tsx
    - Инициализировать messages как пустой массив по умолчанию
    - Добавить проверку перед вызовом .map()
    - Использовать optional chaining
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 25.2 Написать property-based тест для null-safety
    - **Property 10: Null-Safe Message Handling**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 26. Добавить уникальные ключи в списке сообщений (Console Warning)
  - [x] 26.1 Обновить MessageList.tsx с уникальными ключами
    - Использовать message.id как ключ если доступен
    - Генерировать стабильный уникальный ID если id отсутствует
    - _Requirements: 11.1, 11.2, 11.3_
  - [x] 26.2 Написать property-based тест для уникальности ключей
    - **Property 11: Unique Key Generation**
    - **Validates: Requirements 11.1, 11.2, 11.3**

- [ ] 27. Checkpoint - Убедиться что все баги исправлены
  - Ensure all tests pass, ask the user if questions arise.

---

## Приоритет 5: Доступность и SEO

- [x] 28. Улучшить доступность (Accessibility)
  - [x] 28.1 Добавить ARIA-метки к интерактивным элементам
    - Добавить aria-label к кнопкам без текста
    - Добавить aria-describedby для форм
    - _Requirements: 12.1_
  - [ ] 28.2 Написать property-based тест для ARIA
    - **Property 12: ARIA Label Completeness**
    - **Validates: Requirements 12.1**
  - [x] 28.3 Улучшить контрастность текста
    - Проверить и исправить цвета с низкой контрастностью
    - Обеспечить минимум 4.5:1 для обычного текста
    - _Requirements: 12.2_
  - [ ] 28.4 Добавить видимые индикаторы фокуса
    - Добавить :focus-visible стили
    - _Requirements: 12.3_

- [ ] 29. Улучшить SEO
  - [ ] 29.1 Добавить мета-теги в layout.tsx
    - Добавить description и keywords
    - _Requirements: 13.1_
  - [ ] 29.2 Проверить семантику заголовков
    - Убедиться в правильной иерархии h1-h6
    - _Requirements: 13.2_
  - [ ] 29.3 Добавить alt атрибуты к изображениям
    - Проверить все img теги
    - _Requirements: 13.3_
  - [ ] 29.4 Написать property-based тест для alt атрибутов
    - **Property 13: Image Alt Attribute Presence**
    - **Validates: Requirements 13.3**

---

## Приоритет 6: Производительность

- [x] 30. Оптимизировать время загрузки (NEW BUG-003)
  - [x] 30.1 Настроить code splitting в next.config.js
    - Добавить splitChunks конфигурацию
    - Ограничить maxSize бандлов
    - _Requirements: 16.2_
  - [x] 30.2 Добавить lazy loading для тяжёлых компонентов
    - Использовать dynamic() для CollaborationSpace
    - Использовать dynamic() для игровых компонентов
    - _Requirements: 16.3_
  - [x] 30.3 Оптимизировать изображения
    - Настроить форматы AVIF/WebP в next.config.js
    - Добавить lazy loading для изображений
    - _Requirements: 16.4_
  - [x] 30.4 Написать тест для времени загрузки
    - **Property 16: Page Load Time**
    - **Validates: Requirements 16.1**

- [ ] 31. Final Checkpoint - Убедиться что все тесты проходят
  - Ensure all tests pass, ask the user if questions arise.
