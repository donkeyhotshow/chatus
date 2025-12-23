/**
 * LoginButtonValidator - Validates login input and controls button state
 *
 * **Feature: chatus-bug-fixes, Property 14: Login Button State Validation**
 * **Validates: Requirements 14.1, 14.2**
 */

export interface LoginValidationResult {
  isValid: boolean;
  canSubmit: boolean;
  errorMessage?: string;
  remainingChars: number;
}

export const MIN_USERNAME_LENGTH = 2;
export const MAX_USERNAME_LENGTH = 20;

/**
 * Validates login input and returns detailed validation result
 *
 * @param username - Thusername to validate
 * @returns LoginValidationResult with validation status and error message
 */
export function validateLoginInput(username: string): LoginValidationResult {
  const trimmed = username.trim();
  const remainingChars = MAX_USERNAME_LENGTH - trimmed.length;

  // Empty input
  if (!trimmed) {
    return {
      isValid: false,
      canSubmit: false,
      errorMessage: 'Введите имя',
      remainingChars: MAX_USERNAME_LENGTH,
    };
  }

  // Too short
  if (trimmed.length < MIN_USERNAME_LENGTH) {
    return {
      isValid: false,
      canSubmit: false,
      errorMessage: `Минимум ${MIN_USERNAME_LENGTH} символа`,
      remainingChars,
    };
  }

  // Too long
  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return {
      isValid: false,
      canSubmit: false,
      errorMessage: `Максимум ${MAX_USERNAME_LENGTH} символов`,
      remainingChars,
    };
  }

  // Invalid characters
  const invalidChars = /[<>{}[\]\\\/]/;
  if (invalidChars.test(trimmed)) {
    return {
      isValid: false,
      canSubmit: false,
      errorMessage: 'Недопустимые символы в имени',
      remainingChars,
    };
  }

  // Must contain letters or numbers
  const hasLettersOrNumbers = /[a-zA-Zа-яА-ЯёЁ0-9]/;
  if (!hasLettersOrNumbers.test(trimmed)) {
    return {
      isValid: false,
      canSubmit: false,
      errorMessage: 'Имя должно содержать буквы или цифры',
      remainingChars,
    };
  }

  // Valid
  return {
    isValid: true,
    canSubmit: true,
    remainingChars,
  };
}

/**
 * Quick check if login button should be enabled
 * Used for immediate state updates on input change
 *
 * @param username - The username to check
 * @returns boolean indicating if button should be enabled
 */
export function shouldEnableLoginButton(username: string): boolean {
  const trimmed = username.trim();

  // Quick length check first (most common case)
  if (trimmed.length < MIN_USERNAME_LENGTH) {
    return false;
  }

  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return false;
  }

  // Check for invalid characters
  const invalidChars = /[<>{}[\]\\\/]/;
  if (invalidChars.test(trimmed)) {
    return false;
  }

  // Must contain at least one letter or number
  const hasLettersOrNumbers = /[a-zA-Zа-яА-ЯёЁ0-9]/;
  if (!hasLettersOrNumbers.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Handles validation errors with logging and fallback
 *
 * @param error - The error that occurred
 * @param username - The username being validated (for fallback)
 * @returns boolean - fallback validation result
 */
export function handleLoginValidationError(error: unknown, username: string): boolean {
  // Log the error for debugging
  console.error('[LoginValidator] Validation error:', error);

  // Fallback: simple length check
  const trimmed = username.trim();
  return trimmed.length >= MIN_USERNAME_LENGTH && trimmed.length <= MAX_USERNAME_LENGTH;
}
