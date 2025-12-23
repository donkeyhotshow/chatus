# Requirements Document

## Introduction

Данный документ описывает требования к исправлению багов, выявленных в ходе тестирования приложения ChatUs. Баги классифицированы по критичности и компонентам системы. Цель — устранить все критические и серьёзные проблемы, улучшить стабильность и пользовательский опыт.

## Glossary

- **ChatUs**: Веб-приложение для группового чата с поддержкой рисования, игр и реакций
- **Canvas**: Компонент для совместного рисования
- **WebSocket**: Протокол для двусторонней связи в реальном времени
- **ARIA**: Accessible Rich Internet Applications — стандарт доступности
- **Lighthouse**: Инструмент аудита производительности и качества веб-страниц

---

## Requirements

### Requirement 1: Исправление краша при вводе кириллицы (BUG-003) — CRITICAL

**User Story:** Как пользователь, я хочу использовать поиск с кириллическими символами, чтобы находить сообщения на русском языке без сбоев приложения.

#### Acceptance Criteria

1. WHEN a user enters Cyrillic characters in the search field THEN the ChatUs system SHALL process the input without crashing
2. WHEN the search query contains mixed Latin and Cyrillic characters THEN the ChatUs system SHALL return matching results
3. IF the search input causes an encoding error THEN the ChatUs system SHALL display a user-friendly error message and maintain application stability

---

### Requirement 2: Исправление неактивной кнопки создания комнаты в Safari (BUG-009) — CRITICAL
tory:** Как пользователь Safari, я хочу
здавать новые комнаты, чтобы общаться с друзьями без ограничений браузера.

#### Acceptance Criteria

1. WHEN a user clicks the "Create new room" button in Safari THEN the ChatUs system SHALL enable the button and initiate room creation
2. WHEN the room creation form is displayed THEN the ChatUs system SHALL validate all required fields before enabling submission
3. IF Safari-specific JavaScript APIs are unavailable THEN the ChatUs system SHALL use fallback implementations

---

### Requirement 3: Исправление реакций на чужие сообщения (BUG-002) — MAJOR

**User Story:** Как пользователь, я хочу добавлять реакции только к своим сообщениям по двойному клику, чтобы случайно не реагировать на чужие сообщения.

#### Acceptance Criteria

1. WHEN a user double-clicks on their own message THEN the ChatUs system SHALL add a heart reaction to that message
2. WHEN a user double-clicks on another user's message THEN the ChatUs system SHALL ignore the double-click action
3. WHEN a reaction is added THEN the ChatUs system SHALL persist the reaction to the database immediately

---

### Requirement 4: Сохранение стиля линии Canvas (BUG-004) — MAJOR

**User Story:** Как пользователь, я хочу сохранять выбранный стиль линии (Calligraphy) при отправке рисунка, чтобы мои художественные работы отображались корректно.

#### Acceptance Criteria

1. WHEN a user selects the "Calligraphy" line style THEN the ChatUs system SHALL preserve this style throughout the drawing session
2. WHEN a drawing is sent to chat THEN the ChatUs system SHALL include the line style metadata in the drawing data
3. WHEN a drawing is rendered in chat THEN the ChatUs system SHALL apply the original line style from metadata

---

### Requirement 5: Исправление перекрытия клавиатурой на Android (BUG-008) — MAJOR

**User Story:** Как мобильный пользователь Android, я хочу видеть поле ввода и кнопку отправки при открытой клавиатуре, чтобы комфортно писать сообщения.

#### Acceptance Criteria

1. WHEN the virtual keyboard opens on Android THEN the ChatUs system SHALL adjust the viewport to keep the input field visible
2. WHEN the user focuses on the input field THEN the ChatUs system SHALL scroll the input into view above the keyboard
3. WHEN the keyboard closes THEN the ChatUs system SHALL restore the original viewport layout

---

### Requirement 6: Валидация длины имени пользователя (BUG-001) — MINOR

**User Story:** Как пользователь, я хочу получать предупреждение при вводе слишком длинного имени, чтобы понимать ограничения системы.

#### Acceptance Criteria

1. WHEN a user enters a username longer than 20 characters THEN the ChatUs system SHALL display a warning message
2. WHEN the username exceeds the limit THEN the ChatUs system SHALL prevent form submission until corrected
3. WHEN displaying the character limit THEN the ChatUs system SHALL show a real-time counter of remaining characters

---

### Requirement 7: Исправление анимации игры "Кости" (BUG-005) — MINOR

**User Story:** Как игрок, я хочу видеть плавную анимацию броска костей без зависаний, чтобы наслаждаться игровым процессом.

#### Acceptance Criteria

1. WHEN a user rolls the dice THEN the ChatUs system SHALL complete the animation within 2 seconds
2. WHEN multiple consecutive rolls occur THEN the ChatUs system SHALL queue animations without freezing
3. IF an animation error occurs THEN the ChatUs system SHALL skip to the final result and log the error

---

### Requirement 8: Исправление WebSocket для приглашений (BUG-007) — MINOR

**User Story:** Как пользователь, я хочу отправлять приглашения другим участникам, чтобы они получали уведомления о новых комнатах.

#### Acceptance Criteria

1. WHEN a user clicks the "Invite" button THEN the ChatUs system SHALL establish a WebSocket connection for notifications
2. WHEN the WebSocket connection fails THEN the ChatUs system SHALL retry connection up to 3 times with exponential backoff
3. IF all retry attempts fail THEN the ChatUs system SHALL display an error message and offer alternative invite methods

---

### Requirement 9: Синхронизация переключателя темы (BUG-006) — COSMETIC

**User Story:** Как пользователь, я хочу видеть корректное состояние переключателя темы, чтобы понимать текущие настройки интерфейса.

#### Acceptance Criteria

1. WHEN the dark theme is active THEN the ChatUs system SHALL display the toggle switch in the "on" position
2. WHEN the user toggles the theme THEN the ChatUs system SHALL synchronize the visual state with the actual theme
3. WHEN the page reloads THEN the ChatUs system SHALL restore both the theme and toggle state from storage

---

### Requirement 10: Исправление ошибки undefined в чате (Console Error)

**User Story:** Как разработчик, я хочу устранить ошибку `Cannot read property 'map' of undefined`, чтобы чат работал стабильно при загрузке пустых комнат.

#### Acceptance Criteria

1. WHEN a chat room loads with no messages THEN the ChatUs system SHALL initialize an empty array for messages
2. WHEN the messages array is undefined THEN the ChatUs system SHALL handle the null case gracefully
3. WHEN rendering the message list THEN the ChatUs system SHALL validate data before calling array methods

---

### Requirement 11: Добавление уникальных ключей в списке сообщений (Console Warning)

**User Story:** Как разработчик, я хочу устранить предупреждения React о ключах, чтобы улучшить производительность рендеринга.

#### Acceptance Criteria

1. WHEN rendering the message list THEN the ChatUs system SHALL assign a unique key to each message element
2. WHEN a message has an ID THEN the ChatUs system SHALL use the message ID as the React key
3. WHEN a message lacks an ID THEN the ChatUs system SHALL generate a stable unique identifier

---

### Requirement 12: Улучшение доступности (Accessibility)

**User Story:** Как пользователь с ограниченными возможностями, я хочу использовать ChatUs с помощью скринридера, чтобы полноценно участвовать в общении.

#### Acceptance Criteria

1. WHEN interactive elements are rendered THEN the ChatUs system SHALL include appropriate ARIA labels
2. WHEN text is displayed THEN the ChatUs system SHALL maintain a minimum contrast ratio of 4.5:1
3. WHEN focus moves between elements THEN the ChatUs system SHALL provide visible focus indicators

---

### Requirement 13: Улучшение SEO

**User Story:** Как владелец продукта, я хочу улучшить SEO-показатели, чтобы приложение лучше индексировалось поисковыми системами.

#### Acceptance Criteria

1. WHEN the page loads THEN the ChatUs system SHALL include meta description and keywords tags
2. WHEN rendering headings THEN the ChatUs system SHALL use semantic HTML heading hierarchy
3. WHEN images are displayed THEN the ChatUs system SHALL include descriptive alt attributes

---

### Requirement 14: Исправление недоступной кнопки "Войти" (NEW BUG-001) — CRITICAL

**User Story:** Как пользователь, я хочу войти в приложение после ввода валидного имени, чтобы получить доступ ко всем функциям чата.

#### Acceptance Criteria

1. WHEN a user enters a valid username (minimum 2 characters) THEN the ChatUs system SHALL enable the "Войти" button
2. WHEN the username input changes THEN the ChatUs system SHALL re-validate and update button state immediately
3. WHEN the "Войти" button is clicked with valid input THEN the ChatUs system SHALL initiate the login process
4. IF JavaScript validation fails THEN the ChatUs system SHALL log the error and provide fallback validation

---

### Requirement 15: Увеличение touch-таргетов на мобильных устройствах (NEW BUG-002) — MAJOR

**User Story:** Как мобильный пользователь, я хочу легко нажимать на кнопки и элементы управления, чтобы комфортно использовать приложение на телефоне.

#### Acceptance Criteria

1. WHEN rendering interactive elements on mobile devices THEN the ChatUs system SHALL ensure minimum touch target size of 44x44 pixels
2. WHEN the viewport width is less than 768px THEN the ChatUs system SHALL apply mobile-optimized styles to buttons and links
3. WHEN touch targets are smaller than 44x44px THEN the ChatUs system SHALL add padding or increase element size

---

### Requirement 16: Оптимизация времени загрузки страницы (NEW BUG-003) — MAJOR

**User Story:** Как пользователь, я хочу быстро загружать приложение, чтобы не ждать более 5 секунд до начала использования.

#### Acceptance Criteria

1. WHEN the page loads THEN the ChatUs system SHALL complete initial render within 5000ms
2. WHEN loading JavaScript bundles THEN the ChatUs system SHALL use code splitting to reduce initial bundle size
3. WHEN rendering heavy components THEN the ChatUs system SHALL use lazy loading to defer non-critical content
4. WHEN loading images THEN the ChatUs system SHALL use optimized formats and lazy loading

---

### Requirement 17: Добавление вертикального скролла (M-002) — MAJOR

**User Story:** Как мобильный пользователь, я хочу прокручивать контент свайпом вверх/вниз, чтобы видеть все сообщения и элементы интерфейса.

#### Acceptance Criteria

1. WHEN content exceeds viewport height THEN the ChatUs system SHALL enable vertical scrolling
2. WHEN a user swipes vertically on iOS THEN the ChatUs system SHALL provide smooth momentum scrolling
3. WHEN scrolling on mobile THEN the ChatUs system SHALL use -webkit-overflow-scrolling: touch for native feel
