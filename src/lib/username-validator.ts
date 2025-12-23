/**
 * UsernameValidator - Validates username length and provides character counter
 *
 * **Feature: chatus-bug-fixes, Property 5: Username Length Validation**
 * **Feature: chatus-bug-fixes, Property 6: Character Counter Accuracy**
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */

export interface UsernameValidationResult {
  isValid: boolean;
  message?: string;
  remainingChars: number;
  showWarning: boolean;
}

export const MAX_USERNAME_LENGTH = 20;

/**
 * Validates username and returns detailed validation result with warning
 *
 * Requirements:
 * - 6.1: WHEN a user enters a username longer than 20 characters THEN display a warning message
 * - 6.2: WHEN the username exceeds the limit THEN prevent form submission until corrected
 * - 6.3: WHEN displaying the character limit THEN show a real-time counter of remaining characters
 *
 * @param username - The username to validate
 * @returns UsernameValidationResult with validation status, warning message, and remaining chars
 */
export function validateUsername(username: string): UsernameValidationResult {
  const length = username.length;
  const remainingChars = MAX_USERNAME_LENGTH - length;

  // Username exceeds limit - show warning and prevent submission
  if (length > MAX_USERNAME_LENGTH) {
    return {
      isValid: false,
      message: `Имя слишком длинное. Максимум ${MAX_USERNAME_LENGTH} символов`,
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
 * Returns the number of remaining characters for the username
 *
 * @param username - The current username input
 * @returns number - remaining characters (can be negative if over limit)
 */
export function getRemainingChars(username: string): number {
  return MAX_USERNAME_LENGTH - username.length;
}
