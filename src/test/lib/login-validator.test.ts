/**
 * Property-Based Tests for LoginButtonValidator
 *
 * **Feature: chatus-bug-fixes, Property 14: Login Button State Validation**
 * **Validates: Requirements 14.1, 14.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateLoginInput,
  shouldEnableLoginButton,
  handleLoginValidationError,
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
} from '@/lib/login-validator';

// Valid characters for usernames (letters, numbers, Cyrillic)
const validCharsArray = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');

// Helper to create string arbitrary from character array
const validUsernameArb = (minLen: number, maxLen: number) =>
  fc.array(fc.constantFrom(...validCharsArray), { minLength: minLen, maxLength: maxLen })
    .map(chars => chars.join(''));

describe('LoginButtonValidator', () => {
  describe('Property 14: Login Button State Validation', () => {
    /**
     * Property: For any username input of length >= 2 characters (after trim),
     * the login button SHALL be enabled; for length < 2, it SHALL be disabled.
     *
     * **Feature: chatus-bug-fixes, Property 14: Login Button State Validation**
     * **Validates: Requirements 14.1, 14.2**
     */
    it('should enable button for valid usernames (>= 2 chars with letters/numbers)', () => {
      fc.assert(
        fc.property(validUsernameArb(2, 20), (validUsername) => {
          const result = validateLoginInput(validUsername);
          const buttonEnabled = shouldEnableLoginButton(validUsername);

          // Both functions should agree that this is valid
          expect(result.isValid).toBe(true);
          expect(result.canSubmit).toBe(true);
          expect(buttonEnabled).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any username with trimmed length < 2, button should be disabled
     *
     * **Feature: chatus-bug-fixes, Property 14: Login Button State Validation**
     * **Validates: Requirements 14.1, 14.2**
     */
    it('should disable button for usernames shorter than 2 characters', () => {
      // Generate short usernames (0 or 1 character after trim)
      const shortUsernameArb = fc.oneof(
        fc.constant(''),
        fc.constant(' '),
        fc.constant('  '),
        fc.constantFrom(...validCharsArray),
        fc.constantFrom(...validCharsArray).map(c => ` ${c} `)
      );

      fc.assert(
        fc.property(shortUsernameArb, (shortUsername) => {
          const result = validateLoginInput(shortUsername);
          const buttonEnabled = shouldEnableLoginButton(shortUsername);

          // Both functions should agree that this is invalid
          expect(result.isValid).toBe(false);
          expect(result.canSubmit).toBe(false);
          expect(buttonEnabled).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: validateLoginInput and shouldEnableLoginButton should always agree
     *
     * **Feature: chatus-bug-fixes, Property 14: Login Button State Validation**
     * **Validates: Requirements 14.1, 14.2**
     */
    it('should have consistent validation between validateLoginInput and shouldEnableLoginButton', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 30 }),
          (anyUsername) => {
            const result = validateLoginInput(anyUsername);
            const buttonEnabled = shouldEnableLoginButton(anyUsername);

            // Both functions must agree on validity
            expect(result.canSubmit).toBe(buttonEnabled);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Usernames with invalid characters should always be rejected
     *
     * **Feature: chatus-bug-fixes, Property 14: Login Button State Validation**
     * **Validates: Requirements 14.1, 14.2**
     */
    it('should reject usernames with invalid characters', () => {
      const invalidChars = ['<', '>', '{', '}', '[', ']', '\\', '/'];

      fc.assert(
        fc.property(
          fc.tuple(
            validUsernameArb(1, 10),
            fc.constantFrom(...invalidChars),
            validUsernameArb(1, 10)
          ),
          ([prefix, invalidChar, suffix]) => {
            const usernameWithInvalidChar = prefix + invalidChar + suffix;

            const result = validateLoginInput(usernameWithInvalidChar);
            const buttonEnabled = shouldEnableLoginButton(usernameWithInvalidChar);

            expect(result.isValid).toBe(false);
            expect(buttonEnabled).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Remaining chars calculation should be accurate
     *
     * **Feature: chatus-bug-fixes, Property 14: Login Button State Validation**
     * **Validates: Requirements 14.1, 14.2**
     */
    it('should calculate remaining characters correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 30 }),
          (username) => {
            const result = validateLoginInput(username);
            const trimmedLength = username.trim().length;
            const expectedRemaining = MAX_USERNAME_LENGTH - trimmedLength;

            expect(result.remainingChars).toBe(expectedRemaining);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('handleLoginValidationError', () => {
    it('should return fallback validation on error', () => {
      // Valid length should return true
      expect(handleLoginValidationError(new Error('test'), 'validname')).toBe(true);

      // Too short should return false
      expect(handleLoginValidationError(new Error('test'), 'a')).toBe(false);

      // Too long should return false
      expect(handleLoginValidationError(new Error('test'), 'a'.repeat(25))).toBe(false);
    });
  });
});
