/**
 * Property-Based Tests for Messag null-safety
 *
 * **Feature: chatus-bug-fixes, Property 10: Null-Safe Message Handling**
 * **Validates: Requirements 10.1, 10.2, 10.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ensureSafeMessages, getMessageKey } from '@/components/chat/MessageList';
import type { Message } from '@/lib/types';

// Arbitrary for generating valid Message objects
const messageArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  text: fc.string({ minLength: 0, maxLength: 200 }),
  imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
  createdAt: fc.record({
    seconds: fc.integer({ min: 0, max: 2000000000 }),
    nanoseconds: fc.integer({ min: 0, max: 999999999 }),
    toMillis: fc.constant(() => Date.now()),
    toDate: fc.constant(() => new Date()),
  }),
  user: fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    avatar: fc.string({ minLength: 0, maxLength: 100 }),
  }),
  senderId: fc.string({ minLength: 1, maxLength: 20 }),
  reactions: fc.array(
    fc.record({
      emoji: fc.constantFrom('❤️', '👍', '😂', '😮', '😢', '😡'),
      userId: fc.string({ minLength: 1, maxLength: 20 }),
      username: fc.string({ minLength: 1, maxLength: 50 }),
    }),
    { minLength: 0, maxLength: 5 }
  ),
  delivered: fc.boolean(),
  seen: fc.boolean(),
  type: fc.constantFrom('text', 'sticker', 'image', 'doodle', 'system'),
  replyTo: fc.option(
    fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      text: fc.string({ minLength: 0, maxLength: 100 }),
      senderName: fc.string({ minLength: 1, maxLength: 50 }),
    }),
    { nil: null }
  ),
}) as fc.Arbitrary<Message>;

// Arbitrary for generating message arrays with possible null/undefined items
const messagesArrayArb = fc.array(messageArb, { minLength: 0, maxLength: 20 });

// Arbitrary for generating message arrays with some null/undefined items
const messagesWithNullsArb = fc.array(
  fc.oneof(
    messageArb,
    fc.constant(null as unknown as Message),
    fc.constant(undefined as unknown as Message)
  ),
  { minLength: 0, maxLength: 20 }
);

describe('MessageList Null-Safety', () => {
  describe('Property 10: Null-Safe Message Handling', () => {
    /**
     * Property: For any message array (including undefined or null), the rendering
     * function SHALL not throw and SHALL produce valid output.
     *
     * **Feature: chatus-bug-fixes, Property 10: Null-Safe Message Handling**
     * **Validates: Requirements 10.1, 10.2, 10.3**
     */
    it('should return empty array for null input', () => {
      const result = ensureSafeMessages(null);
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for undefined input', () => {
      const result = ensureSafeMessages(undefined);
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    /**
     * Property: For any valid message array, ensureSafeMessages should return
     * the same messages (identity for valid input).
     *
     * **Feature: chatus-bug-fixes, Property 10: Null-Safe Message Handling**
     * **Validates: Requirements 10.1, 10.2, 10.3**
     */
    it('should preserve valid message arrays unchanged', () => {
      fc.assert(
        fc.property(messagesArrayArb, (messages) => {
          const result = ensureSafeMessages(messages);

          // Result should be an array
          expect(Array.isArray(result)).toBe(true);

          // Result should have same length as input
          expect(result.length).toBe(messages.length);

          // All messages should be preserved
          for (let i = 0; i < messages.length; i++) {
            expect(result[i]).toBe(messages[i]);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any array with null/undefined items, ensureSafeMessages
     * should filter them out and return only valid messages.
     *
     * **Feature: chatus-bug-fixes, Property 10: Null-Safe Message Handling**
     * **Validates: Requirements 10.1, 10.2, 10.3**
     */
    it('should filter out null and undefined items from arrays', () => {
      fc.assert(
        fc.property(messagesWithNullsArb, (messagesWithNulls) => {
          const result = ensureSafeMessages(messagesWithNulls);

          // Result should be an array
          expect(Array.isArray(result)).toBe(true);

          // Result should not contain null or undefined
          for (const msg of result) {
            expect(msg).not.toBeNull();
            expect(msg).not.toBeUndefined();
          }

          // Result length should be <= input length
          expect(result.length).toBeLessThanOrEqual(messagesWithNulls.length);

          // Count valid messages in input
          const validCount = messagesWithNulls.filter(m => m != null).length;
          expect(result.length).toBe(validCount);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: ensureSafeMessages should never throw for any input type.
     *
     * **Feature: chatus-bug-fixes, Property 10: Null-Safe Message Handling**
     * **Validates: Requirements 10.1, 10.2, 10.3**
     */
    it('should never throw for any input', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            messagesArrayArb,
            fc.constant(null),
            fc.constant(undefined),
            fc.constant('not an array' as unknown as Message[]),
            fc.constant(123 as unknown as Message[]),
            fc.constant({} as unknown as Message[])
          ),
          (input) => {
            // Should not throw
            expect(() => ensureSafeMessages(input as Message[] | null | undefined)).not.toThrow();

            // Result should always be an array
            const result = ensureSafeMessages(input as Message[] | null | undefined);
            expect(Array.isArray(result)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: The result of ensureSafeMessages should always be iterable with .map()
     *
     * **Feature: chatus-bug-fixes, Property 10: Null-Safe Message Handling**
     * **Validates: Requirements 10.1, 10.2, 10.3**
     */
    it('should always return an array that can be mapped', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            messagesArrayArb,
            fc.constant(null),
            fc.constant(undefined)
          ),
          (input) => {
            const result = ensureSafeMessages(input as Message[] | null | undefined);

            // Should be able to call .map() without throwing
            expect(() => result.map(m => m)).not.toThrow();

            // Map should return an array
            const mapped = result.map(m => m);
            expect(Array.isArray(mapped)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Unique Key Generation', () => {
    /**
     * Property: For any list of messages, all generated React keys SHALL be unique.
     *
     * **Feature: chatus-bug-fixes, Property 11: Unique Key Generation**
     * **Validates: Requirements 11.1, 11.2, 11.3**
     */
    it('should generate unique keys for all messages in a list', () => {
      fc.assert(
        fc.property(messagesArrayArb, (messages) => {
          const keys = messages.map((msg, index) => getMessageKey(msg, index));

          // All keys should be unique
          const uniqueKeys = new Set(keys);
          expect(uniqueKeys.size).toBe(keys.length);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: getMessageKey should prefer message.id when available.
     *
     * **Feature: chatus-bug-fixes, Property 11: Unique Key Generation**
     * **Validates: Requirements 11.1, 11.2, 11.3**
     */
    it('should use message.id as key when available', () => {
      fc.assert(
        fc.property(messageArb, (message) => {
          const key = getMessageKey(message, 0);

          // If message has an id, the key should be that id
          if (message.id) {
            expect(key).toBe(message.id);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: getMessageKey should generate stable keys for messages without IDs.
     *
     * **Feature: chatus-bug-fixes, Property 11: Unique Key Generation**
     * **Validates: Requirements 11.1, 11.2, 11.3**
     */
    it('should generate stable keys for messages without IDs', () => {
      // Create a message without an ID
      const messageWithoutId = {
        id: '',
        text: 'Test message',
        createdAt: { seconds: 1234567890, nanoseconds: 0, toMillis: () => Date.now(), toDate: () => new Date() },
        user: { id: 'user1', name: 'Test User', avatar: '' },
        senderId: 'user1',
        reactions: [],
        delivered: true,
        seen: false,
        type: 'text' as const,
        replyTo: null,
      } as Message;

      const key1 = getMessageKey(messageWithoutId, 5);
      const key2 = getMessageKey(messageWithoutId, 5);

      // Same message at same index should produce same key
      expect(key1).toBe(key2);

      // Key should be a non-empty string
      expect(typeof key1).toBe('string');
      expect(key1.length).toBeGreaterThan(0);
    });

    /**
     * Property: getMessageKey should never throw for any message input.
     *
     * **Feature: chatus-bug-fixes, Property 11: Unique Key Generation**
     * **Validates: Requirements 11.1, 11.2, 11.3**
     */
    it('should never throw for any message input', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            messageArb,
            fc.constant({} as Message),
            fc.constant({ id: null } as unknown as Message)
          ),
          fc.integer({ min: 0, max: 1000 }),
          (message, index) => {
            // Should not throw
            expect(() => getMessageKey(message, index)).not.toThrow();

            // Result should be a non-empty string
            const key = getMessageKey(message, index);
            expect(typeof key).toBe('string');
            expect(key.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      const result = ensureSafeMessages([]);
      expect(result).toEqual([]);
    });

    it('should handle array with only null values', () => {
      const result = ensureSafeMessages([null, null, null] as unknown as Message[]);
      expect(result).toEqual([]);
    });

    it('should handle non-array inputs gracefully', () => {
      // @ts-expect-error Testing invalid input
      expect(ensureSafeMessages('string')).toEqual([]);
      // @ts-expect-error Testing invalid input
      expect(ensureSafeMessages(123)).toEqual([]);
      // @ts-expect-error Testing invalid input
      expect(ensureSafeMessages({})).toEqual([]);
    });

    it('should generate different keys for different indices', () => {
      const message = {
        id: '',
        text: 'Test',
        createdAt: { seconds: 1234567890, nanoseconds: 0, toMillis: () => Date.now(), toDate: () => new Date() },
        user: { id: 'user1', name: 'Test', avatar: '' },
        senderId: 'user1',
        reactions: [],
        delivered: true,
        seen: false,
      } as Message;

      const key1 = getMessageKey(message, 0);
      const key2 = getMessageKey(message, 1);

      // Different indices should produce different keys
      expect(key1).not.toBe(key2);
    });
  });
});
