// Дружелюбные сообщения вместо технических ошибок

export const FriendlyMessages = {
    // Сетевые ошибки
    networkError: [
        'Не ловит сеть 📡',
        'Интернет играет в прятки 🙈',
        'Связь потерялась 📶',
        'WiFi решил отдохнуть 😴',
    ],

    // Ошибки отправки сообщений
    messageFailed: [
        'Сообщение застряло в пути 📮',
        'Почтальон заблудился 📬',
        'Попробуем ещё раз? 🔄',
        'Что-то пошло не так 🤔',
    ],

    // Ошибки холста
    canvasError: [
        'Кисточка сломалась 🖌️',
        'Краски закончились 🎨',
        'Холст не отвечает 🖼️',
        'Художник устал 😅',
    ],

    // Переподключение
    reconnecting: [
        'Пытаемся переподключиться... 🔄',
        'Восстанавливаем связь... ⚡',
        'Чиним интернет... 🔧',
        'Возвращаемся в сеть... 🌐',
    ],

    // Успешные действия
    success: [
        'Готово! ✨',
        'Отлично! 🎉',
        'Успех! 🚀',
        'Круто получилось! 💫',
    ],

    // Сохранение
    saved: [
        'Сохранено! 💾',
        'Записали! ✍️',
        'В копилку! 🏦',
        'Зафиксировано! 📌',
    ],

    // Загрузка
    loading: [
        'Загружаем... ⏳',
        'Готовим магию... ✨',
        'Почти готово... 🎯',
        'Секундочку... ⏰',
    ],

    // Ошибки WebSocket
    websocketError: [
        'Потеряли связь с сервером 🔌',
        'Сервер задумался... 🤔',
        'Переподключаемся... 🔄',
        'Связь прервалась 📡',
    ],

    // Ошибки авторизации
    authError: [
        'Не удалось войти 🔐',
        'Попробуйте ещё раз 🔄',
        'Что-то с авторизацией 🤷',
        'Нужно перелогиниться 🚪',
    ],

    // Ошибки загрузки файлов
    uploadError: [
        'Файл не загрузился 📁',
        'Слишком большой файл 📦',
        'Попробуйте другой файл 🔄',
        'Загрузка не удалась 😕',
    ],

    // Ошибки игр
    gameError: [
        'Игра сломалась 🎮',
        'Что-то пошло не так в игре 🎲',
        'Попробуйте перезапустить 🔄',
        'Игровой сбой 🕹️',
    ],

    // Оффлайн режим
    offline: [
        'Вы оффлайн 📴',
        'Нет подключения к интернету 🌐',
        'Работаем без сети 📵',
        'Сообщения отправятся позже 📨',
    ],

    // Восстановление соединения
    connectionRestored: [
        'Связь восстановлена! 🎉',
        'Снова онлайн! 🌐',
        'Подключились! ✨',
        'Интернет вернулся! 📶',
    ],
} as const;

export function getRandomMessage(category: keyof typeof FriendlyMessages): string {
    const messages = FriendlyMessages[category];
    return messages[Math.floor(Math.random() * messages.length)];
}

// Маппинг технических ошибок на категории
const errorPatterns: Array<{ pattern: RegExp; category: keyof typeof FriendlyMessages }> = [
    { pattern: /network|fetch|net::err|failed to fetch/i, category: 'networkError' },
    { pattern: /websocket|socket|disconnect|ws:/i, category: 'websocketError' },
    { pattern: /failed to send|message.*fail|send.*error/i, category: 'messageFailed' },
    { pattern: /canvas|draw|paint|render/i, category: 'canvasError' },
    { pattern: /connect|timeout|timed out|ETIMEDOUT/i, category: 'reconnecting' },
    { pattern: /auth|login|permission|denied|unauthorized|401|403/i, category: 'authError' },
    { pattern: /upload|file.*size|too large|payload/i, category: 'uploadError' },
    { pattern: /game|play|score|match/i, category: 'gameError' },
    { pattern: /offline|no.*connection|navigator\.online/i, category: 'offline' },
];

// Преобразование технических ошибок в дружелюбные
export function humanizeError(error: string | Error): string {
    const errorString = typeof error === 'string' ? error : error.message;
    const lowerError = errorString.toLowerCase();

    // Ищем подходящий паттерн
    for (const { pattern, category } of errorPatterns) {
        if (pattern.test(lowerError)) {
            return getRandomMessage(category);
        }
    }

    // Если не удалось категоризировать, возвращаем общее дружелюбное сообщение
    return 'Что-то пошло не так, но мы это исправим! 🛠️';
}

// Получить детальное сообщение для разработчиков (для логов)
export function getDetailedError(error: string | Error): string {
    if (typeof error === 'string') return error;
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
}

// Эмодзи для разных типов уведомлений
export const NotificationEmojis = {
    success: ['✨', '🎉', '🚀', '💫', '⭐'],
    error: ['😅', '🤔', '😊', '🙈', '🔧'],
    warning: ['⚠️', '📡', '🔄', '⏰', '🌐'],
    info: ['💡', '📢', '🔔', '📌', '💬'],
} as const;

export function getRandomEmoji(type: keyof typeof NotificationEmojis): string {
    const emojis = NotificationEmojis[type];
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// Форматирование ошибки для отображения пользователю
export interface FormattedError {
    title: string;
    description: string;
    emoji: string;
    canRetry: boolean;
    retryLabel?: string;
}

export function formatErrorForUser(error: string | Error): FormattedError {
    const errorString = typeof error === 'string' ? error : error.message;
    const lowerError = errorString.toLowerCase();

    // Определяем тип ошибки и формируем ответ
    if (/network|fetch|offline/i.test(lowerError)) {
        return {
            title: 'Проблемы с сетью',
            description: getRandomMessage('networkError'),
            emoji: '📡',
            canRetry: true,
            retryLabel: 'Попробовать снова',
        };
    }

    if (/websocket|disconnect/i.test(lowerError)) {
        return {
            title: 'Потеряно соединение',
            description: getRandomMessage('websocketError'),
            emoji: '🔌',
            canRetry: true,
            retryLabel: 'Переподключиться',
        };
    }

    if (/auth|permission|denied/i.test(lowerError)) {
        return {
            title: 'Ошибка доступа',
            description: getRandomMessage('authError'),
            emoji: '🔐',
            canRetry: false,
        };
    }

    if (/upload|file/i.test(lowerError)) {
        return {
            title: 'Ошибка загрузки',
            description: getRandomMessage('uploadError'),
            emoji: '📁',
            canRetry: true,
            retryLabel: 'Загрузить снова',
        };
    }

    // Общая ошибка
    return {
        title: 'Что-то пошло не так',
        description: humanizeError(error),
        emoji: '🤔',
        canRetry: true,
        retryLabel: 'Попробовать снова',
    };
}
