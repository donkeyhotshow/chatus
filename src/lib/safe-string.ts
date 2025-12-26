import DOMPurify from 'dompurify';
/**
 * SafeStringUtils - Безопасная обработка Unicode строк для поиска
 *
т проблему BUG-003: краш при вводе кириллицы в поиске
 *
 * @module safe-string
 */

/**
 * Результат санитизации строки
 */
export interface SafeStringResult {
  /** Является ли строка валидной для поиска */
  isValid: boolean;
  /** Санитизированная строка */
  sanitized: string;
  /** Сообщение об ошибке (если есть) */
  error?: string;
}

/**
 * Санитизирует входную строку с кириллицей для безопасного использования в поиске.
 * Обрабатывает Unicode символы, удаляет потенциально опасные символы.
 *
 * @param input - Входная строка для санитизации
 * @returns Результат санитизации с флагом валидности
 *
 * **Validates: Requirements 1.1, 1.2**
 */
export function sanitizeCyrillicInput(input: string): SafeStringResult {
  try {
    // Проверка на null/undefined
    if (input == null) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Пустой ввод',
      };
    }

    // Нормализуем Unicode для консистентной обработки
    const normalized = normalizeUnicode(String(input));

    // Удаляем управляющие символы (кроме пробелов и переносов)
    const cleaned = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Проверяем на пустую строку после очистки
    if (cleaned.trim().length === 0) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Строка пуста после очистки',
      };
    }

    return {
      isValid: true,
      sanitized: cleaned,
    };
  } catch (error) {
    // Graceful degradation при любых ошибках
    return {
      isValid: false,
      sanitized: '',
      error: error instanceof Error ? error.message : 'Ошибка обработки строки',
    };
  }
}

/**
 * Экранирует специальные символы регулярных выражений для безопасного использования в RegExp.
 * Поддерживает Unicode символы включая кириллицу.
 *
 * @param str - Строка для экранирования
 * @returns Экранированная строка, безопасная для использования в RegExp
 *
 * **Validates: Requirements 1.1, 1.2**
 */
export function escapeRegexSafe(str: string): string {
  try {
    if (str == null) {
      return '';
    }

    // Экранируем все специальные символы regex
    // Включает: . * + ? ^ $ { } ( ) | [ ] \ /
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  } catch {
    // При любой ошибке возвращаем пустую строку
    return '';
  }
}

/**
 * Нормализует Unicode строку для консистентной обработки.
 * Использует NFC нормализацию для объединения комбинированных символов.
 *
 * @param str - Строка для нормализации
 * @returns Нормализованная строка
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */
export function normalizeUnicode(str: string): string {
  try {
    if (str == null) {
      return '';
    }

    // NFC - Canonical Decomposition, followed by Canonical Composition
    // Это стандартная форма для текста, объединяет комбинированные символы
    return String(str).normalize('NFC');
  } catch {
    // Если нормализация не поддерживается, возвращаем исходную строку
    return String(str);
  }
}

/**
 * Создаёт безопасный RegExp для поиска с поддержкой Unicode.
 * Обрабатывает кириллицу и другие Unicode символы.
 *
 * @param pattern - Паттерн для поиска
 * @param flags - Флаги RegExp (по умолчанию 'gi' для case-insensitive глобального поиска)
 * @returns RegExp объект или null при ошибке
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */
export function createSafeRegex(pattern: string, flags: string = 'gi'): RegExp | null {
  try {
    const sanitized = sanitizeCyrillicInput(pattern);
    if (!sanitized.isValid) {
      return null;
    }

    const escaped = escapeRegexSafe(sanitized.sanitized);
    if (!escaped) {
      return null;
    }

    return new RegExp(escaped, flags);
  } catch {
    return null;
  }
}

/**
 * Выполняет безопасный поиск в тексте с поддержкой кириллицы.
 *
 * @param text - Текст для поиска
 * @param query - Поисковый запрос
 * @returns true если найдено совпадение, false в противном случае
 *
 * **Validates: Requirements 1.1, 1.2**
 */
export function safeSearch(text: string, query: string): boolean {
  try {
    if (!text || !query) {
      return false;
    }

    const normalizedText = normalizeUnicode(text).toLowerCase();
    const normalizedQuery = normalizeUnicode(query).toLowerCase().trim();

    if (!normalizedQuery) {
      return false;
    }

    return normalizedText.includes(normalizedQuery);
  } catch {
    return false;
  }
}

/**
 * Подсвечивает найденный текст с поддержкой кириллицы.
 * Возвращает HTML с тегами <mark> вокруг совпадений.
 *
 * @param text - Исходный текст
 * @param query - Поисковый запрос для подсветки
 * @returns HTML строка с подсвеченными совпадениями
 *
 * **Validates: Requirements 1.1, 1.2**
 */
export function highlightMatches(text: string, query: string): string {
  try {
    if (!text || !query) {
      return sanitizeHtml(text || '');
    }

    const sanitizedQuery = sanitizeCyrillicInput(query);
    if (!sanitizedQuery.isValid || !sanitizedQuery.sanitized.trim()) {
      return sanitizeHtml(text);
    }

    const escapedQuery = escapeRegexSafe(sanitizedQuery.sanitized.trim());
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    // Сначала санитизируем HTML, потом добавляем mark теги
    const sanitizedText = sanitizeHtml(text);
    return sanitizedText.replace(regex, '<mark>$1</mark>');
  } catch {
    // При ошибке возвращаем санитизированный текст без подсветки
    return sanitizeHtml(text || '');
  }
}


/**
 * Санитизирует HTML для предотвращения XSS атак.
 * 
 * @param str - Строка для санитизации
 * @returns Безопасная HTML строка
 */
function sanitizeHtml(str: string): string {
  if (!str) return '';
  
  // Use DOMPurify if window is available (client-side)
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(str, {
      ALLOWED_TAGS: ['mark', 'b', 'i', 'em', 'strong', 'span'],
      ALLOWED_ATTR: ['class']
    });
  }
  
  // Fallback for server-side or if DOMPurify is not available
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

