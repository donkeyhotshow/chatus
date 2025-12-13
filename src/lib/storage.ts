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

/**
 * Safely get and validate user profile from localStorage
 */
export function getUserFromStorage(): UserProfile | null {
  try {
    const storedUserStr = localStorage.getItem('chat-user');
    if (!storedUserStr) {
      return null;
    }

    const parsed = JSON.parse(storedUserStr);
    const validated = UserProfileSchema.parse(parsed);
    
    return validated;
  } catch (error) {
    logger.warn('Failed to parse or validate stored user', { error });
    localStorage.removeItem('chat-user');
    return null;
  }
}

/**
 * Safely save user profile to localStorage
 */
export function saveUserToStorage(user: UserProfile): void {
  try {
    const validated = UserProfileSchema.parse(user);
    localStorage.setItem('chat-user', JSON.stringify(validated));
  } catch (error) {
    logger.error('Failed to save user to storage', error as Error, { user });
    throw new Error('Invalid user data');
  }
}

/**
 * Remove user from localStorage
 */
export function removeUserFromStorage(): void {
  localStorage.removeItem('chat-user');
}

