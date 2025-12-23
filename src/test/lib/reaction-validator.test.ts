/**
 * Property-Based Tests for ReactionValidator
 *
 * **Feature: chatus-bug-fixes, Property 2: Reaction Ownership Validation**
 * **Validates: Requirements 3.1, 3.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  canAddReaction,
  validateDoubleClick,
  isMessageOwner,
  ReactionContext,
} from '@/lib/reaction-validator';

// Arbitrary for generating valid user IDs (non-empty strings)
const userIdArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

// Arbitrary for generating valid message IDs
const messageIdArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

describe('ReactionValidator', () => {
  describe('Property 2: Reaction Ownership Validation', () => {
    /**
     * Property: For any message and user combination, a double-click reaction
     * SHALL be added if and only if the message belongs to the current user.
     *
     * **Feature: chatus-bug-fixes, Property 2: Reaction Ownership Validation**
     * **Validates: Requirements 3.1, 3.2**
     */
    it('should allow reaction only when user owns the message', () => {
      fc.assert(
        fc.property(
          messageIdArb,
          userIdArb,
          (messageId, userId) => {
            // When user owns the message (same ID for owner and current user)
            const ownMessageContext: ReactionContext = {
              messageId,
              messageOwnerId: userId,
              currentUserId: userId,
              action: 'add',
            };

            const canReactToOwn = canAddReaction(ownMessageContext);
            const validationOwn = validateDoubleClick(ownMessageContext);

            // Should be allowed
            expect(canReactToOwn).toBe(true);
            expect(validationOwn.isValid).toBe(true);
            expect(validationOwn.canProceed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Double-click on another user's message SHALL be ignored.
     *
     * **Feature: chatus-bug-fixes, Property 2: Reaction Ownership Validation**
     * **Validates: Requirements 3.1, 3.2**
     */
    it('should reject reaction when user does not own the message', () => {
      fc.assert(
        fc.property(
          messageIdArb,
          userIdArb,
          userIdArb.filter(id => id.length > 0),
          (messageId, ownerId, currentUserId) => {
            // Skip if IDs happen to be the same
            fc.pre(ownerId !== currentUserId);

            const otherMessageContext: ReactionContext = {
              messageId,
              messageOwnerId: ownerId,
              currentUserId: currentUserId,
              action: 'add',
            };

            const canReactToOther = canAddReaction(otherMessageContext);
            const validationOther = validateDoubleClick(otherMessageContext);

            // Should be rejected
            expect(canReactToOther).toBe(false);
            expect(validationOther.isValid).toBe(false);
            expect(validationOther.canProceed).toBe(false);
            expect(validationOther.reason).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: canAddReaction and validateDoubleClick should always agree
     * on whether a reaction is allowed.
     *
     * **Feature: chatus-bug-fixes, Property 2: Reaction Ownership Validation**
     * **Validates: Requirements 3.1, 3.2**
     */
    it('should have consistent validation between canAddReaction and validateDoubleClick', () => {
      fc.assert(
        fc.property(
          messageIdArb,
          userIdArb,
          userIdArb,
          (messageId, ownerId, currentUserId) => {
            const context: ReactionContext = {
              messageId,
              messageOwnerId: ownerId,
              currentUserId: currentUserId,
              action: 'add',
            };

            const canReact = canAddReaction(context);
            const validation = validateDoubleClick(context);

            // Both functions must agree
            expect(canReact).toBe(validation.canProceed);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: isMessageOwner should correctly identify ownership.
     *
     * **Feature: chatus-bug-fixes, Property 2: Reaction Ownership Validation**
     * **Validates: Requirements 3.1, 3.2**
     */
    it('should correctly identify message ownership', () => {
      fc.assert(
        fc.property(
          userIdArb,
          userIdArb,
          (ownerId, currentUserId) => {
            const isOwner = isMessageOwner(ownerId, currentUserId);

            // Should be true only when IDs match
            expect(isOwner).toBe(ownerId === currentUserId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    /**
     * Edge case: Empty or missing IDs should be rejected.
     */
    it('should reject reactions with missing message ID', () => {
      const context: ReactionContext = {
        messageId: '',
        messageOwnerId: 'user1',
        currentUserId: 'user1',
        action: 'add',
      };

      expect(canAddReaction(context)).toBe(false);
      expect(validateDoubleClick(context).isValid).toBe(false);
    });

    it('should reject reactions with missing owner ID', () => {
      const context: ReactionContext = {
        messageId: 'msg1',
        messageOwnerId: '',
        currentUserId: 'user1',
        action: 'add',
      };

      expect(canAddReaction(context)).toBe(false);
      expect(validateDoubleClick(context).isValid).toBe(false);
    });

    it('should reject reactions with missing current user ID', () => {
      const context: ReactionContext = {
        messageId: 'msg1',
        messageOwnerId: 'user1',
        currentUserId: '',
        action: 'add',
      };

      expect(canAddReaction(context)).toBe(false);
      expect(validateDoubleClick(context).isValid).toBe(false);
    });
  });
});
