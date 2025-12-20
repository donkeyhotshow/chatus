'use client';

import { z } from 'zod';
import { logger } from './logger';
import type { UserProfile } from './types';

// Schema for UserProfile validation
const UserProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  avatar: z.string(),
});

const USER_STORAGE_KEY = 'chat-user';
const USER_BACKUP_KEY = 'chat-user-backup';
const USERNAME_KEY = 'chatUsername';
const AVATAR_KEY = 'chatAvatar';

/**
 * Safely get and validate user profile from localStorage
 * Tries multiple storage keys for backwards compatibility
 */
export function getUserFromStorage(): UserProfile | null {
  try {
    // Сначала пробуем основной ключ
    let storedUserStr = localStorage.getItem(USER_STORAGE_KEY);

    // Если нет, пробуем backup
    if (!storedUserStr) {
      storedUserStr = localStorage.getItem(USER_BACKUP_KEY);
    }

    if (storedUserStr) {
      const parsed = JSON.parse(storedUserStr);
      const validated = UserProfileSchema.parse(parsed);

      // Сохраняем в оба ключа для надёжности
      saveUserToStorage(validated);

      return validated;
    }

    // Fallback: пробуем восстановить из отдельных ключей (старый формат)
    const username = localStorage.getItem(USERNAME_KEY);
    const avatar = localStorage.getItem(AVATAR_KEY);

    if (username) {
      // Пытаемся найти ID из sessionStorage или генерируем временный
      const sessionId = sessionStorage.getItem('temp-user-id');

      if (sessionId) {
        const reconstructedUser: UserProfile = {
          id: sessionId,
          name: username,
          avatar: avatar || '',
        };

        // Валидируем и сохраняем
        const validated = UserProfileSchema.parse(reconstructedUser);
        saveUserToStorage(validated);

        logger.info('Reconstructed user from legacy storage', { username });
        return validated;
      }
    }

    return null;
  } catch (error) {
    logger.warn('Failed to parse or validate stored user', { error });
    // Не удаляем данные сразу - пробуем backup
    try {
      const backupStr = localStorage.getItem(USER_BACKUP_KEY);
      if (backupStr) {
        const parsed = JSON.parse(backupStr);
        const validated = UserProfileSchema.parse(parsed);
        // Восстанавливаем основной ключ
        localStorage.setItem(USER_STORAGE_KEY, backupStr);
        return validated;
      }
    } catch {
      // Backup тоже не работает
    }

    // Очищаем только если оба ключа повреждены
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(USER_BACKUP_KEY);
    return null;
  }
}

/**
 * Safely save user profile to localStorage with backup
 */
export function saveUserToStorage(user: UserProfile): void {
  try {
    const validated = UserProfileSchema.parse(user);
    const userStr = JSON.stringify(validated);

    // Сохраняем в основной ключ
    localStorage.setItem(USER_STORAGE_KEY, userStr);

    // Сохраняем backup
    localStorage.setItem(USER_BACKUP_KEY, userStr);

    // Также сохраняем в отдельные ключи для совместимости
    localStorage.setItem(USERNAME_KEY, validated.name);
    localStorage.setItem(AVATAR_KEY, validated.avatar);

    // Сохраняем ID в sessionStorage для восстановления
    sessionStorage.setItem('temp-user-id', validated.id);

    logger.debug('User saved to storage', { userId: validated.id, name: validated.name });
  } catch (error) {
    logger.error('Failed to save user to storage', error as Error, { user });
    throw new Error('Invalid user data');
  }
}

/**
 * Remove user from localStorage
 */
export function removeUserFromStorage(): void {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(USER_BACKUP_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(AVATAR_KEY);
  sessionStorage.removeItem('temp-user-id');
}

/**
 * Check if user data exists in storage
 */
export function hasUserInStorage(): boolean {
  return !!(
    localStorage.getItem(USER_STORAGE_KEY) ||
    localStorage.getItem(USER_BACKUP_KEY) ||
    localStorage.getItem(USERNAME_KEY)
  );
}

/**
 * Get just the username from storage (for quick checks)
 */
export function getUsernameFromStorage(): string | null {
  try {
    const user = getUserFromStorage();
    if (user) return user.name;

    // Fallback to legacy key
    return localStorage.getItem(USERNAME_KEY);
  } catch {
    return null;
  }
}
