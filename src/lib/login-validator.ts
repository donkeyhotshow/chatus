/**
 * LoginButtonValidator - Validates login input and controls button state
 *
 * **Feature: chatus-bug-fixes, Property 14: Login Button State Validation**
 * **Validates: Requirements 14.1, 14.2**
 * **BUG-022, BUG-023 FIX: Support Unicode and Emoji in usernames**
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
 * BUG-022, BUG-023 FIX: Count actual characters including Unicode/Emoji
 * Uses spread operator to properly count Unicode code points
 */
function getCharacterCount(str: string): number {
  return [...str].length;
}

/**
 * BUG-022, BUG-023 FIX: Check if string contains valid characters
 * Supports Latin, Cyrillic, numbers, spaces, and emoji
 */
function hasValidCharacters(str: string): boolean {
  // Check for at least one letter (any script), number, or emoji
  // Using Unicode property escapes for broad support
  const hasLetterOrNumber = /[\p{L}\p{N}]/u.test(str);
  const hasEmoji = /\p{Emoji}/u.test(str);
  return hasLetterOrNumber || hasEmoji;
}

/**
 * Validates login input and returns detailed validation result
 *
 * @param username - The username to validate
 * @returns LoginValidationResult with validation status and error message
 */
export function validateLoginInput(username: string): LoginValidationResult {
  const trimmed = username.trim();
  // BUG-022 FIX: Use proper Unicode character count
  const charCount = getCharacterCount(trimmed);
  const remainingChars = MAX_USERNAME_LENGTH - charCount;

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
  if (charCount < MIN_USERNAME_LENGTH) {
    return {
      isValid: false,
      canSubmit: false,
      errorMessage: `Минимум ${MIN_USERNAME_LENGTH} символа`,
      remainingChars,
    };
  }

  // Too long
  if (charCount > MAX_USERNAME_LENGTH) {
    return {
      isValid: false,
      canSubmit: false,
      errorMessage: `Максимум ${MAX_USERNAME_LENGTH} символов`,
      remainingChars,
    };
  }

  // Invalid characters (only block dangerous HTML/script chars)
  const invalidChars = /[<>{}[\]\\\/]/;
  if (invalidChars.test(trimmed)) {
    return {
      isValid: false,
      canSubmit: false,
      errorMessage: 'Недопустимые символы в имени',
      remainingChars,
    };
  }

  // BUG-022, BUG-023 FIX: Must contain valid characters (letters, numbers, or emoji)
  if (!hasValidCharacters(trimmed)) {
    return {
      isValid: false,
      canSubmit: false,
      errorMessage: 'Имя должно содержать буквы, цифры или эмодзи',
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
  // BUG-022 FIX: Use proper Unicode character count
  const charCount = getCharacterCount(trimmed);

  // Quick length check first (most common case)
  if (charCount < MIN_USERNAME_LENGTH) {
    return false;
  }

  if (charCount > MAX_USERNAME_LENGTH) {
    return false;
  }

  // Check for invalid characters
  const invalidChars = /[<>{}[\]\\\/]/;
  if (invalidChars.test(trimmed)) {
    return false;
  }

  // BUG-022, BUG-023 FIX: Must contain valid characters
  if (!hasValidCharacters(trimmed)) {
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
