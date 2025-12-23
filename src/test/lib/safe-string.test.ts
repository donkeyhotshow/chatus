/**
 * Property-Based Tests for SafeStringUtils
 *
 * **Feature: chatus-bug-fixes, Property 1: Cyrillic Input Sa*
 * **Validates: Requirements 1.1, 1.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  sanitizeCyrillicInput,
  escapeRegexSafe,
  normalizeUnicode,
  createSafeRegex,
  safeSearch,
  highlightMatches,
} from '@/lib/safe-string';

// Cyrillic character ranges
const cyrillicLowercase = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
const cyrillicUppercase = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const latinChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const digits = '0123456789';
const commonPunctuation = '.,!?;:-_()[]{}@#$%^&*+=';

// Arbitraries for generating test data
const cyrillicCharArb = fc.constantFrom(...(cyrillicLowercase + cyrillicUppercase).split(''));
const latinCharArb = fc.constantFrom(...latinChars.split(''));
const digitArb = fc.constantFrom(...digits.split(''));
const mixedCharArb = fc.constantFrom(
  ...(cyrillicLowercase + cyrillicUppercase + latinChars + digits).split('')
);

// Generate pure Cyrillic strings
const cyrillicStringArb = (minLen: number, maxLen: number) =>
  fc.array(cyrillicCharArb, { minLength: minLen, maxLength: maxLen })
    .map(chars => chars.join(''));

// Generate mixed Latin + Cyrillic strings
const mixedStringArb = (minLen: number, maxLen: number) =>
  fc.array(mixedCharArb, { minLength: minLen, maxLength: maxLen })
    .map(chars => chars.join(''));

// Generate strings with regex special characters
const regexSpecialChars = '.*+?^${}()|[]\\'.split('');
const stringWithRegexCharsArb = fc.array(
  fc.oneof(
    mixedCharArb,
    fc.constantFrom(...regexSpecialChars)
  ),
  { minLength: 1, maxLength: 20 }
).map(chars => chars.join(''));

describe('SafeStringUtils', () => {
  describe('Property 1: Cyrillic Input Safety', () => {
    /**
     * Property: For any string containing Cyrillic characters, the search function
     * SHALL process the input without throwing exceptions and return a valid result.
     *
     * **Feature: chatus-bug-fixes, Property 1: Cyrillic Input Safety**
     * **Validates: Requirements 1.1, 1.2**
     */
    it('should process any Cyrillic string without throwing exceptions', () => {
      fc.assert(
        fc.property(cyrillicStringArb(1, 50), (cyrillicString) => {
          // Should not throw
          const result = sanitizeCyrillicInput(cyrillicString);

          // Result should always have defined properties
          expect(result).toHaveProperty('isValid');
          expect(result).toHaveProperty('sanitized');
          expect(typeof result.isValid).toBe('boolean');
          expect(typeof result.sanitized).toBe('string');

          // For non-empty Cyrillic strings, should be valid
          if (cyrillicString.trim().length > 0) {
            expect(result.isValid).toBe(true);
            expect(result.sanitized.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any mixed Latin and Cyrillic string, sanitization should succeed.
     *
     * **Feature: chatus-bug-fixes, Property 1: Cyrillic Input Safety**
     * **Validates: Requirements 1.1, 1.2**
     */
    it('should handle mixed Latin and Cyrillic characters', () => {
      fc.assert(
        fc.property(mixedStringArb(1, 50), (mixedString) => {
          const result = sanitizeCyrillicInput(mixedString);

          expect(result).toHaveProperty('isValid');
          expect(result).toHaveProperty('sanitized');

          // Non-empty mixed strings should be valid
          if (mixedString.trim().length > 0) {
            expect(result.isValid).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: escapeRegexSafe should never throw and should produce valid regex patterns.
     *
     * **Feature: chatus-bug-fixes, Property 1: Cyrillic Input Safety**
     * **Validates: Requirements 1.1, 1.2**
     */
    it('should escape regex special characters safely for any input', () => {
      fc.assert(
        fc.property(stringWithRegexCharsArb, (inputWithSpecialChars) => {
          // Should not throw
          const escaped = escapeRegexSafe(inputWithSpecialChars);

          expect(typeof escaped).toBe('string');

          // The escaped string should be usable in a RegExp without throwing
          expect(() => new RegExp(escaped)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: normalizeUnicode should never throw for any string input.
     *
     * **Feature: chatus-bug-fixes, Property 1: Cyrillic Input Safety**
     * **Validates: Requirements 1.1, 1.2**
     */
    it('should normalize any Unicode string without throwing', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 100 }), (anyString) => {
          // Should not throw
          const normalized = normalizeUnicode(anyString);

          expect(typeof normalized).toBe('string');
          // Normalized string should have same or fewer characters (combining chars merged)
          expect(normalized.length).toBeLessThanOrEqual(anyString.length + 10); // Allow some tolerance
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: createSafeRegex should return null or valid RegExp, never throw.
     *
     * **Feature: chatus-bug-fixes, Property 1: Cyrillic Input Safety**
     * **Validates: Requirements 1.1, 1.2**
     */
    it('should create safe regex or return null, never throw', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 50 }), (pattern) => {
          // Should not throw
          const regex = createSafeRegex(pattern);

          // Result should be null or a valid RegExp
          expect(regex === null || regex instanceof RegExp).toBe(true);

          // If we got a RegExp, it should be usable
          if (regex !== null) {
            expect(() => regex.test('test string')).not.toThrow();
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: safeSearch should never throw for any combination of text and query.
     *
     * **Feature: chatus-bug-fixes, Property 1: Cyrillic Input Safety**
     * **Validates: Requirements 1.1, 1.2**
     */
    it('should perform safe search without throwing for any input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          (text, query) => {
            // Should not throw
            const result = safeSearch(text, query);

            expect(typeof result).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: safeSearch should find Cyrillic substrings correctly.
     *
     * **Feature: chatus-bug-fixes, Property 1: Cyrillic Input Safety**
     * **Validates: Requirements 1.1, 1.2**
     */
    it('should find Cyrillic substrings in text', () => {
      fc.assert(
        fc.property(
          cyrillicStringArb(1, 20),
          cyrillicStringArb(1, 20),
          cyrillicStringArb(1, 20),
          (prefix, needle, suffix) => {
            const haystack = prefix + needle + suffix;

            // Should find the needle in the haystack
            const result = safeSearch(haystack, needle);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: highlightMatches should never throw and should return a string.
     *
     * **Feature: chatus-bug-fixes, Property 1: Cyrillic Input Safety**
     * **Validates: Requirements 1.1, 1.2**
     */
    it('should highlight matches without throwing for any input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          (text, query) => {
            // Should not throw
            const result = highlightMatches(text, query);

            expect(typeof result).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: highlightMatches should add <mark> tags around Cyrillic matches.
     *
     * **Feature: chatus-bug-fixes, Property 1: Cyrillic Input Safety**
     * **Validates: Requirements 1.1, 1.2**
     */
    it('should highlight Cyrillic matches with mark tags', () => {
      fc.assert(
        fc.property(
          cyrillicStringArb(1, 10),
          cyrillicStringArb(2, 10),
          cyrillicStringArb(1, 10),
          (prefix, needle, suffix) => {
            const text = prefix + needle + suffix;

            const result = highlightMatches(text, needle);

            // Should contain mark tags
            expect(result).toContain('<mark>');
            expect(result).toContain('</mark>');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // @ts-expect-error Testing null input
      expect(() => sanitizeCyrillicInput(null)).not.toThrow();
      // @ts-expect-error Testing undefined input
      expect(() => sanitizeCyrillicInput(undefined)).not.toThrow();
      // @ts-expect-error Testing null input
      expect(() => escapeRegexSafe(null)).not.toThrow();
      // @ts-expect-error Testing null input
      expect(() => normalizeUnicode(null)).not.toThrow();

      // @ts-expect-error Testing null input
      const nullResult = sanitizeCyrillicInput(null);
      expect(nullResult.isValid).toBe(false);
    });

    it('should handle empty strings', () => {
      const result = sanitizeCyrillicInput('');
      expect(result.isValid).toBe(false);

      const whitespaceResult = sanitizeCyrillicInput('   ');
      expect(whitespaceResult.isValid).toBe(false);
    });

    it('should handle strings with only control characters', () => {
      const result = sanitizeCyrillicInput('\x00\x01\x02');
      expect(result.isValid).toBe(false);
    });
  });
});
