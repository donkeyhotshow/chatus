/**
 * ThemeSyncManager - Синхронизация состояния переключателя темы
 *
 * Решает BUG-006: переключатель темы неинхронизирован с фактической темой
 *
 * **Feature: chatus-bug-fixes, Property 9: Theme State Synchronization**
 * **Validates: Requirements 9.1, 9.2, 9.3**
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  isDark: boolean;
  togglePosition: ThemeMode;
  source: 'storage' | 'user' | 'system';
}

const THEME_STORAGE_KEY = 'chatus-theme-state';

/**
 * Загружает состояние темы из localStorage
 * Requirements: 9.3 - восстановление состояния при перезагрузке
 */
export function loadThemeFromStorage(): ThemeState {
  if (typeof window === 'undefined') {
    return getDefaultThemeState();
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ThemeState>;

      // Валидация загруженных данных
      if (isValidThemeState(parsed)) {
        return {
          isDark: parsed.isDark ?? true,
          togglePosition: parsed.togglePosition ?? 'dark',
          source: 'storage'
        };
      }
    }
  } catch (error) {
    console.warn('[ThemeSyncManager] Failed to load theme from storage:', error);
  }

  return getDefaultThemeState();
}

/**
 * Сохраняет состояние темы в localStorage
 * Requirements: 9.3 - сохранение состояния для восстановления
 */
export function saveThemeToStorage(state: ThemeState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const toStore: ThemeState = {
      isDark: state.isDark,
      togglePosition: state.togglePosition,
      source: state.source
    };
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.warn('[ThemeSyncManager] Failed to save theme to storage:', error);
  }
}

/**
 * Синхронизирует состояние toggle с фактической темой
 * Requirements: 9.1, 9.2 - синхронизация визуального состояния с темой
 *
 * @param state - текущее состояние темы
 * @returns синхронизированное состояние
 */
export function syncThemeState(state: ThemeState): ThemeState {
  // Определяем isDark на основе togglePosition
  let isDark: boolean;

  if (state.togglePosition === 'system') {
    // Для системной темы проверяем prefers-color-scheme
    isDark = getSystemPrefersDark();
  } else {
    isDark = state.togglePosition === 'dark';
  }

  const syncedState: ThemeState = {
    isDark,
    togglePosition: state.togglePosition,
    source: state.source
  };

  // Применяем тему к DOM
  applyThemeToDOM(syncedState);

  // Сохраняем синхронизированное состояние
  saveThemeToStorage(syncedState);

  return syncedState;
}

/**
 * Создаёт новое состояние темы при переключении пользователем
 * Requirements: 9.2 - синхронизация при изменении
 */
export function createThemeStateFromToggle(togglePosition: ThemeMode): ThemeState {
  let isDark: boolean;

  if (togglePosition === 'system') {
    isDark = getSystemPrefersDark();
  } else {
    isDark = togglePosition === 'dark';
  }

  return {
    isDark,
    togglePosition,
    source: 'user'
  };
}

/**
 * Проверяет, синхронизировано ли состояние toggle с темой
 */
export function isThemeStateSynced(state: ThemeState): boolean {
  if (state.togglePosition === 'system') {
    return state.isDark === getSystemPrefersDark();
  }

  const expectedDark = state.togglePosition === 'dark';
  return state.isDark === expectedDark;
}

/**
 * Получает системные предпочтения темы
 */
export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') {
    return true; // По умолчанию тёмная тема
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Применяет тему к DOM
 */
function applyThemeToDOM(state: ThemeState): void {
  if (typeof document === 'undefined') {
    return;
  }

  const effectiveTheme = state.isDark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', effectiveTheme);

  // Также обновляем класс для совместимости с Tailwind
  if (state.isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Возвращает состояние темы по умолчанию
 */
function getDefaultThemeState(): ThemeState {
  return {
    isDark: true,
    togglePosition: 'dark',
    source: 'system'
  };
}

/**
 * Валидирует структуру ThemeState
 */
function isValidThemeState(obj: unknown): obj is Partial<ThemeState> {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const state = obj as Record<string, unknown>;

  // Проверяем togglePosition если есть
  if (state.togglePosition !== undefined) {
    if (!['light', 'dark', 'system'].includes(state.togglePosition as string)) {
      return false;
    }
  }

  // Проверяем isDark если есть
  if (state.isDark !== undefined && typeof state.isDark !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Подписка на изменения системной темы
 */
export function subscribeToSystemThemeChanges(
  callback: (isDark: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  mediaQuery.addEventListener('change', handler);

  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}
