/**
 * ReactionValidator - Validates reaction operations on messages
 *
 * This module ensures that reactions are only added to messages
 * according to the ownership rules defined in Requirements 3.1, 3.2, 3.3
 */

export interface ReactionContext {
  messageId: string;
  messageOwnerId: string;
  currentUserId: string;
  action: 'add' | 'remove';
}

export interface ReactionValidationResult {
  isValid: boolean;
  canProceed: boolean;
  reason?: string;
}

/**
 * Validates if a user can add a reaction to a message via double-click.
 * Double-click reactions are only allowed on the user's own messages.
 *
 * @param context - The reaction context containing message and user info
 * @returns true if the reaction can be added, false otherwise
 *
 * **Validates: Requirements 3.1, 3.2**
 */
export function canAddReaction(context: ReactionContext): boolean {
  // Validate required fields
  if (!context.messageId || !context.messageOwnerId || !context.currentUserId) {
    return false;
  }

  // For double-click reactions, only allow on own messages
  return context.messageOwnerId === context.currentUserId;
}

/**
 * Validates a double-click action on a message for adding a reaction.
 * Returns detailed validation result with reason.
 *
 * @param context - The reaction context
 * @returns ReactionValidationResult with validation details
 *
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */
export function validateDoubleClick(context: ReactionContext): ReactionValidationResult {
  // Check for missing required fields
  if (!context.messageId) {
    return {
      isValid: false,
      canProceed: false,
      reason: 'Message ID is required',
    };
  }

  if (!context.messageOwnerId) {
    return {
      isValid: false,
      canProceed: false,
      reason: 'Message owner ID is required',
    };
  }

  if (!context.currentUserId) {
    return {
      isValid: false,
      canProceed: false,
      reason: 'Current user ID is required',
    };
  }

  // Check ownership for double-click reactions
  const isOwner = context.messageOwnerId === context.currentUserId;

  if (!isOwner) {
    return {
      isValid: false,
      canProceed: false,
      reason: 'Double-click reactions are only allowed on your own messages',
    };
  }

  return {
    isValid: true,
    canProceed: true,
  };
}

/**
 * Checks if a message is owned by the current user.
 *
 * @param messageOwnerId - The ID of the message owner
 * @param currentUserId - The ID of the current user
 * @returns true if the message belongs to the current user
 */
export function isMessageOwner(messageOwnerId: string, currentUserId: string): boolean {
  if (!messageOwnerId || !currentUserId) {
    return false;
  }
  return messageOwnerId === currentUserId;
}
