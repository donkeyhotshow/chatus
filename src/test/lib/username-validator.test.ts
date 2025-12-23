/**
-Based Tests for UsernameValidator
 *
 * **Feature: chatus-bug-fixes, Property 5: Username Length Validation**
 * **Feature: chatus-bug-fixes, Property 6: Character Counter Accuracy**
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateUsername,
  getRemainingChars,
  MAX_USERNAME_LENGTH,
} from '@/lib/username-validator';

describe('UsernameValidator', () => {
  describe('Property 5: Username Length Validation', () => {
    /**
     * Property: For any string longer than 20 characters, the validation function
     * SHALL return isValid=false and display a warning.
     *
     * **Feature: chatus-bug-fixes, Property 5: Username Length Validation**
     * **Validates: Requirements 6.1, 6.2**
     */
    it('should return isValid=false and showWarning=true for usernames longer than 20 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 21, maxLength: 100 }),
          (longUsername) => {
            const result = validateUsername(longUsername);

            expect(result.isValid).toBe(false);
            expect(result.showWarning).toBe(true);
            expect(result.message).toBeDefined();
            expect(result.message).toContain('20');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any string of 20 characters or less, the validation function
     * SHALL return isValid=true and showWarning=false.
     *
     * **Feature: chatus-bug-fixes, Property 5: Username Length Validation**
     * **Validates: Requirements 6.1, 6.2**
     */
    it('should return isValid=true and showWarning=false for usernames of 20 characters or less', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 20 }),
          (validUsername) => {
            const result = validateUsername(validUsername);

            expect(result.isValid).toBe(true);
            expect(result.showWarning).toBe(false);
            expect(result.message).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Boundary test - exactly 20 characters should be valid,
     * exactly 21 characters should be invalid.
     *
     * **Feature: chatus-bug-fixes, Property 5: Username Length Validation**
     * **Validates: Requirements 6.1, 6.2**
     */
    it('should correctly handle boundary cases (20 vs 21 characters)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1 }),
          (char) => {
            const exactly20 = char.repeat(20);
            const exactly21 = char.repeat(21);

            const result20 = validateUsername(exactly20);
            const result21 = validateUsername(exactly21);

            expect(result20.isValid).toBe(true);
            expect(result20.showWarning).toBe(false);

            expect(result21.isValid).toBe(false);
            expect(result21.showWarning).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Character Counter Accuracy', () => {
    /**
     * Property: For any username input of length N, the remaining character counter
     * SHALL display exactly (20 - N).
     *
     * **Feature: chatus-bug-fixes, Property 6: Character Counter Accuracy**
     * **Validates: Requirements 6.3**
     */
    it('should calculate remaining characters as exactly (20 - N) for any input length N', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          (username) => {
            const remaining = getRemainingChars(username);
            const expectedRemaining = MAX_USERNAME_LENGTH - username.length;

            expect(remaining).toBe(expectedRemaining);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: validateUsername and getRemainingChars should return consistent
     * remaining character counts.
     *
     * **Feature: chatus-bug-fixes, Property 6: Character Counter Accuracy**
     * **Validates: Requirements 6.3**
     */
    it('should have consistent remaining chars between validateUsername and getRemainingChars', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          (username) => {
            const validationResult = validateUsername(username);
            const directRemaining = getRemainingChars(username);

            expect(validationResult.remainingChars).toBe(directRemaining);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Remaining chars should be negative when username exceeds limit.
     *
     * **Feature: chatus-bug-fixes, Property 6: Character Counter Accuracy**
     * **Validates: Requirements 6.3**
     */
    it('should return negative remaining chars when username exceeds 20 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 21, maxLength: 100 }),
          (longUsername) => {
            const remaining = getRemainingChars(longUsername);

            expect(remaining).toBeLessThan(0);
            expect(remaining).toBe(MAX_USERNAME_LENGTH - longUsername.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Remaining chars should be non-negative when username is within limit.
     *
     * **Feature: chatus-bug-fixes, Property 6: Character Counter Accuracy**
     * **Validates: Requirements 6.3**
     */
    it('should return non-negative remaining chars when username is 20 characters or less', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 20 }),
          (validUsername) => {
            const remaining = getRemainingChars(validUsername);

            expect(remaining).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
