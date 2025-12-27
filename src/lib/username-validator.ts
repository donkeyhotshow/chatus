/**
 * UsernameValidator - Validates username length, characters and provides character counter
 *
 * **Feature: chatus-bug-fixes, Property 5: Username Length Validation**
 * **Feature: chatus-bug-fixes, Property 6: Character Counter Accuracy**
 * **Validates: Requirements 6.1, 6.2, 6.3, 23.1, 23.2, 23.3, 23.4**
 */

export interface UsernameValidationResult {
  isValid: boolean;
  message?: string;
  remainingChars: number;
  showWarning: boolean;
}

export const MAX_USERNAME_LENGTH = 20;
export const MIN_USERNAME_LENGTH = 2;

/**
 * Regex pattern for valid username characters:
 * - Latin letters (a-z, A-Z)
 * - Cyrillic letters (а-я, А-Я, ё, Ё)
 * - Numbers (0-9)
 * - Spaces, underscores, hyphens
 */
const VALID_USERNAME_PATTERN = /^[a-zA-Zа-яА-ЯёЁ0-9\s_-]+$/;

/**
 * Validation rules displayed to user
 */
export const VALIDATION_RULES = '2-20 символов, латиница или кириллица';

/**
 * Validates username and returns detailed validation result with warning
 *
 * Requirements:
 * - 6.1: WHEN a user enters a username longer than 20 characters THEN display a warning message
 * - 6.2: WHEN the username exceeds the limit THEN prevent form submission until corrected
 * - 6.3: WHEN displaying the character limit THEN show a real-time counter of remaining characters
 * - 23.1: WHEN a user enters a Cyrillic username THEN accept the input as valid
 * - 23.2: WHEN displaying validation rules THEN show explicit requirements
 * - 23.3: WHEN the username is invalid THEN display a specific error message
 * - 23.4: WHEN the username contains mixed scripts THEN accept the input as valid
 *
 * @param username - The username to validate
 * @returns UsernameValidationResult with validation status, warning message, and remaining chars
 */
export function validateUsername(username: string): UsernameValidationResult {
  const trimmed = username.trim();
  const length = trimmed.length;
  const remainingChars = MAX_USERNAME_LENGTH - username.length;

  // Empty username
  if (length === 0) {
    return {
      isValid: false,
      message: 'Введите имя пользователя',
      remainingChars,
      showWarning: false,
    };
  }

  // Username too short
  if (length < MIN_USERNAME_LENGTH) {
    return {
      isValid: false,
      message: `Минимум ${MIN_USERNAME_LENGTH} символа`,
      remainingChars,
      showWarning: true,
    };
  }

  // Username exceeds limit - show warning and prevent submission
  if (length > MAX_USERNAME_LENGTH) {
    return {
      isValid: false,
      message: `Имя слишком длинное. Максимум ${MAX_USERNAME_LENGTH} символов`,
      remainingChars,
      showWarning: true,
    };
  }

  // Check for valid characters (Latin, Cyrillic, numbers, spaces, underscores, hyphens)
  if (!VALID_USERNAME_PATTERN.test(trimmed)) {
    return {
      isValid: false,
      message: 'Допустимы только буквы (латиница/кириллица), цифры, пробелы, _ и -',
      remainingChars,
      showWarning: true,
    };
  }

  // Valid username
  return {
    isValid: true,
    remainingChars,
    showWarning: false,
  };
}

/**
 * Check if username contains Cyrillic characters
 */
export function containsCyrillic(str: string): boolean {
  return /[а-яА-ЯёЁ]/.test(str);
}

/**
 * Check if username contains Latin characters
 */
export function containsLatin(str: string): boolean {
  return /[a-zA-Z]/.test(str);
}

/**
 * Returns the number of remaining characters for the username
 *
 * @param username - The current username input
 * @returns number - remaining characters (can be negative if over limit)
 */
export function getRemainingChars(username: string): number {
  return MAX_USERNAME_LENGTH - username.length;
}

/**
 * Quick validation check for enabling/disabling submit button
 */
export function isValidUsernameLength(username: string): boolean {
  const trimmed = username.trim();
  return trimmed.length >= MIN_USERNAME_LENGTH && trimmed.length <= MAX_USERNAME_LENGTH;
}
