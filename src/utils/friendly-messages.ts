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
} as const;

export function getRandomMessage(category: keyof typeof FriendlyMessages): string {
    const messages = FriendlyMessages[category];
    return messages[Math.floor(Math.random() * messages.length)];
}

// Преобразование технических ошибок в дружелюбные
export function humanizeError(error: string): string {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('network') || lowerError.includes('fetch')) {
        return getRandomMessage('networkError');
    }

    if (lowerError.includes('failed to send') || lowerError.includes('message')) {
        return getRandomMessage('messageFailed');
    }

    if (lowerError.includes('canvas') || lowerError.includes('draw')) {
        return getRandomMessage('canvasError');
    }

    if (lowerError.includes('connect') || lowerError.includes('timeout')) {
        return getRandomMessage('reconnecting');
    }

    // Если не удалось категоризировать, возвращаем общее дружелюбное сообщение
    return 'Что-то пошло не так, но мы это исправим! 🛠️';
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
